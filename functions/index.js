const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

/**
 * Helper to verify caller is an authorized administrator
 */
async function verifyIsAdmin(context) {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Must be authenticated to perform this operation.'
        );
    }

    const callerUid = context.auth.uid;
    const callerEmail = context.auth.token.email;

    // Hardcoded primary admin fallback or check in admins collection
    if (callerEmail === 'aneeb458@gmail.com') {
        return true;
    }

    const adminDoc = await db.collection('admins').doc(callerUid).get();
    if (!adminDoc.exists) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Caller is not an authorized administrator.'
        );
    }

    return true;
}

/**
 * Generate a random alphanumeric password
 */
function generatePassword(length = 8) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// ============================================================
// TRIGGER: Deduct inventory when a new order is created
// Runs server-side with admin privileges — bypasses all rules
// ============================================================
exports.onOrderCreated = functions.firestore
    .document('orders/{orderId}')
    .onCreate(async (snap, context) => {
        const order = snap.data();
        const orderId = context.params.orderId;

        if (!order.items || order.items.length === 0) return null;

        // Guard: Prevent double deduction if already processed
        if (order.stockDeducted) {
            console.log(`ℹ️ Stock already deducted for order ${orderId}`);
            return null;
        }

        try {
            await db.runTransaction(async (transaction) => {
                // Read all item docs inside the transaction
                const itemRefs = order.items.map(item => db.collection('items').doc(item.id));
                const itemSnaps = await Promise.all(itemRefs.map(ref => transaction.get(ref)));

                for (let i = 0; i < order.items.length; i++) {
                    const ordered = order.items[i];
                    const itemSnap = itemSnaps[i];

                    if (!itemSnap.exists) {
                        console.warn(`Item ${ordered.id} not found — skipping stock deduction`);
                        continue;
                    }

                    const currentStock = itemSnap.data().stockLevel;

                    // Only deduct if stockLevel is being tracked
                    if (currentStock === undefined || currentStock === null) continue;

                    const newStock = Math.max(0, currentStock - (ordered.quantity || 1));
                    const updates = { stockLevel: newStock };

                    // Auto-mark out-of-stock when stock is fully depleted
                    if (newStock === 0) {
                        updates.inStock = false;
                    }

                    transaction.update(itemRefs[i], updates);
                }

                // Mark the order document as having stock deducted
                transaction.update(snap.ref, { stockDeducted: true });
            });

            console.log(`✅ Stock deducted for order ${orderId}`);
        } catch (err) {
            console.error(`❌ Stock deduction failed for order ${orderId}:`, err);
        }

        return null;
    });

// ============================================================
// TRIGGER: Restore inventory when an order is cancelled
// ============================================================
exports.onOrderCancelled = functions.firestore
    .document('orders/{orderId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        const orderId = context.params.orderId;

        // Only act on status changes TO 'cancelled'
        if (before.status === after.status || after.status !== 'cancelled') return null;
        if (!after.items || after.items.length === 0) return null;

        // Guard: Prevent duplicate stock restoration
        if (after.stockRestored) {
            console.log(`ℹ️ Stock already restored for cancelled order ${orderId}`);
            return null;
        }

        try {
            await db.runTransaction(async (transaction) => {
                const itemRefs = after.items.map(item => db.collection('items').doc(item.id));
                const itemSnaps = await Promise.all(itemRefs.map(ref => transaction.get(ref)));

                for (let i = 0; i < after.items.length; i++) {
                    const ordered = after.items[i];
                    const itemSnap = itemSnaps[i];

                    if (!itemSnap.exists) continue;

                    const currentStock = itemSnap.data().stockLevel;
                    if (currentStock === undefined || currentStock === null) continue;

                    const restoredStock = currentStock + (ordered.quantity || 1);
                    const updates = { stockLevel: restoredStock };

                    // Re-enable item if it was auto-disabled when stock was 0
                    if (itemSnap.data().inStock === false) {
                        updates.inStock = true;
                    }

                    transaction.update(itemRefs[i], updates);
                }

                // Mark order as stockRestored
                transaction.update(change.after.ref, { stockRestored: true });
            });

            console.log(`✅ Stock restored for cancelled order ${orderId}`);
        } catch (err) {
            console.error(`❌ Stock restore failed for order ${orderId}:`, err);
        }

        return null;
    });

// ============================================================
// TRIGGER: Increment rider delivery stats when order delivered
// Runs server-side — riders cannot self-modify their own stats
// ============================================================
exports.onOrderDelivered = functions.firestore
    .document('orders/{orderId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();

        // Only act when status transitions TO 'delivered'
        if (before.status === after.status || after.status !== 'delivered') return null;

        const riderId = after.assignedRiderId;
        if (!riderId) return null;

        try {
            await db.collection('riders').doc(riderId).update({
                'stats.deliveredOrders': admin.firestore.FieldValue.increment(1),
                'stats.lastDeliveredAt': admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ Stats incremented for rider ${riderId} on order ${context.params.orderId}`);
        } catch (err) {
            console.error(`❌ Failed to update rider stats for ${riderId}:`, err);
        }

        return null;
    });

exports.resetRiderPassword = functions.https.onCall(async (data, context) => {
    try {
        await verifyIsAdmin(context);

        const { riderId } = data;
        if (!riderId) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'riderId is required.'
            );
        }

        // Verify the rider exists
        const riderDoc = await db.collection('riders').doc(riderId).get();
        if (!riderDoc.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'Rider not found in Firestore.'
            );
        }

        const riderData = riderDoc.data();
        const newPassword = generatePassword(8);

        // Update the password in Firebase Authentication
        await admin.auth().updateUser(riderId, {
            password: newPassword
        });

        // Update the tempPassword in Firestore for admin reference
        await db.collection('riders').doc(riderId).update({
            tempPassword: newPassword,
            passwordResetAt: admin.firestore.FieldValue.serverTimestamp(),
            passwordResetBy: context.auth.uid
        });

        console.log(`Password reset for rider ${riderId} (${riderData.email})`);

        return {
            success: true,
            newPassword: newPassword,
            riderEmail: riderData.email,
            riderName: riderData.name
        };

    } catch (error) {
        console.error('Error resetting password:', error);

        if (error instanceof functions.https.HttpsError) {
            throw error;
        }

        throw new functions.https.HttpsError(
            'internal',
            'Failed to reset password: ' + error.message
        );
    }
});

// ============================================================
// CALLABLE: Delete Rider Completely (Auth + Firestore, Admin Only)
// ============================================================
exports.deleteRiderCompletely = functions.https.onCall(async (data, context) => {
    try {
        await verifyIsAdmin(context);

        const { riderId } = data;
        if (!riderId) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'riderId is required.'
            );
        }

        // Get rider data before deletion (for logging)
        let riderEmail = 'unknown';
        let riderName = 'unknown';

        try {
            const riderDoc = await db.collection('riders').doc(riderId).get();
            if (riderDoc.exists) {
                const rData = riderDoc.data();
                riderEmail = rData.email || 'unknown';
                riderName = rData.name || 'unknown';
            }
        } catch (err) {
            console.log('Could not fetch rider data:', err.message);
        }

        // Delete from Firebase Authentication
        try {
            await admin.auth().deleteUser(riderId);
            console.log(`✅ Deleted Auth account for ${riderEmail}`);
        } catch (authError) {
            if (authError.code === 'auth/user-not-found') {
                console.log(`⚠️ Auth account not found for ${riderId}, continuing...`);
            } else {
                throw authError;
            }
        }

        // Delete from Firestore
        try {
            await db.collection('riders').doc(riderId).delete();
            console.log(`✅ Deleted Firestore document for ${riderEmail}`);
        } catch (firestoreError) {
            console.error('Error deleting Firestore document:', firestoreError);
        }

        console.log(`🗑️ Completely deleted rider: ${riderName} (${riderEmail})`);

        return {
            success: true,
            deletedEmail: riderEmail,
            deletedName: riderName
        };

    } catch (error) {
        console.error('Error deleting rider:', error);

        if (error instanceof functions.https.HttpsError) {
            throw error;
        }

        throw new functions.https.HttpsError(
            'internal',
            'Failed to delete rider: ' + error.message
        );
    }
});
