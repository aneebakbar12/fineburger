const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// ============================================================
// TRIGGER: Deduct inventory when a new order is created
// Runs server-side with admin privileges — bypasses all rules
// ============================================================
exports.onOrderCreated = functions.firestore
    .document('orders/{orderId}')
    .onCreate(async (snap, context) => {
        const order = snap.data();

        if (!order.items || order.items.length === 0) return null;

        try {
            await db.runTransaction(async (transaction) => {
                // Read all item docs inside the transaction
                const itemRefs = order.items.map(item => db.collection('items').doc(item.id));
                const itemSnaps = await Promise.all(itemRefs.map(ref => transaction.get(ref)));

                for (let i = 0; i < order.items.length; i++) {
                    const ordered = order.items[i];
                    const snap = itemSnaps[i];

                    if (!snap.exists) {
                        console.warn(`Item ${ordered.id} not found — skipping stock deduction`);
                        continue;
                    }

                    const currentStock = snap.data().stockLevel;

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
            });

            console.log(`✅ Stock deducted for order ${context.params.orderId}`);
        } catch (err) {
            console.error(`❌ Stock deduction failed for order ${context.params.orderId}:`, err);
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

        // Only act on status changes TO 'cancelled'
        if (before.status === after.status || after.status !== 'cancelled') return null;
        if (!after.items || after.items.length === 0) return null;

        try {
            await db.runTransaction(async (transaction) => {
                const itemRefs = after.items.map(item => db.collection('items').doc(item.id));
                const itemSnaps = await Promise.all(itemRefs.map(ref => transaction.get(ref)));

                for (let i = 0; i < after.items.length; i++) {
                    const ordered = after.items[i];
                    const snap = itemSnaps[i];

                    if (!snap.exists) continue;

                    const currentStock = snap.data().stockLevel;
                    if (currentStock === undefined || currentStock === null) continue;

                    const restoredStock = currentStock + (ordered.quantity || 1);
                    const updates = { stockLevel: restoredStock };

                    // Re-enable item if it was auto-disabled when this order depleted it
                    if (snap.data().inStock === false) {
                        updates.inStock = true;
                    }

                    transaction.update(itemRefs[i], updates);
                }
            });

            console.log(`✅ Stock restored for cancelled order ${context.params.orderId}`);
        } catch (err) {
            console.error(`❌ Stock restore failed for order ${context.params.orderId}:`, err);
        }

        return null;
    });

/**
 * Cloud Function to reset a rider's password
 * Called from admin panel
 *
 * @param {Object} data - { riderId: string }
 * @param {Object} context - Firebase auth context
 * @returns {Object} { success: boolean, newPassword?: string, error?: string }
 */
exports.resetRiderPassword = functions.https.onCall(async (data, context) => {
    try {
        // Verify that the caller is authenticated
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'Must be authenticated to reset passwords'
            );
        }

        const { riderId } = data;

        if (!riderId) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'riderId is required'
            );
        }

        // Verify the rider exists
        const riderDoc = await admin.firestore()
            .collection('riders')
            .doc(riderId)
            .get();

        if (!riderDoc.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'Rider not found'
            );
        }

        const riderData = riderDoc.data();

        // Generate a new random password (8 characters: letters + numbers)
        const newPassword = generatePassword(8);

        // Update the password in Firebase Authentication
        await admin.auth().updateUser(riderId, {
            password: newPassword
        });

        // Update the tempPassword in Firestore for admin reference
        await admin.firestore()
            .collection('riders')
            .doc(riderId)
            .update({
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

/**
 * Generate a random password
 * @param {number} length - Length of password
 * @returns {string} Random password
 */
function generatePassword(length) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

/**
 * Cloud Function to completely delete a rider
 * Deletes both Firebase Authentication account AND Firestore document
 * Called from admin panel
 *
 * @param {Object} data - { riderId: string }
 * @param {Object} context - Firebase auth context
 * @returns {Object} { success: boolean, error?: string }
 */
exports.deleteRiderCompletely = functions.https.onCall(async (data, context) => {
    try {
        // Verify that the caller is authenticated (admin)
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'Must be authenticated to delete riders'
            );
        }

        const { riderId } = data;

        if (!riderId) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'riderId is required'
            );
        }

        // Get rider data before deletion (for logging)
        let riderEmail = 'unknown';
        let riderName = 'unknown';
        try {
            const riderDoc = await admin.firestore()
                .collection('riders')
                .doc(riderId)
                .get();

            if (riderDoc.exists) {
                const data = riderDoc.data();
                riderEmail = data.email || 'unknown';
                riderName = data.name || 'unknown';
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
            await admin.firestore()
                .collection('riders')
                .doc(riderId)
                .delete();
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


/**
 * Cloud Function to reset a rider's password
 * Called from admin panel
 * 
 * @param {Object} data - { riderId: string }
 * @param {Object} context - Firebase auth context
 * @returns {Object} { success: boolean, newPassword?: string, error?: string }
 */
exports.resetRiderPassword = functions.https.onCall(async (data, context) => {
    try {
        // Verify that the caller is authenticated
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'Must be authenticated to reset passwords'
            );
        }

        const { riderId } = data;

        if (!riderId) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'riderId is required'
            );
        }

        // Verify the rider exists
        const riderDoc = await admin.firestore()
            .collection('riders')
            .doc(riderId)
            .get();

        if (!riderDoc.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'Rider not found'
            );
        }

        const riderData = riderDoc.data();

        // Generate a new random password (8 characters: letters + numbers)
        const newPassword = generatePassword(8);

        // Update the password in Firebase Authentication
        await admin.auth().updateUser(riderId, {
            password: newPassword
        });

        // Update the tempPassword in Firestore for admin reference
        await admin.firestore()
            .collection('riders')
            .doc(riderId)
            .update({
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

        // If it's already a HttpsError, rethrow it
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }

        // Otherwise, wrap it in a HttpsError
        throw new functions.https.HttpsError(
            'internal',
            'Failed to reset password: ' + error.message
        );
    }
});

/**
 * Generate a random password
 * @param {number} length - Length of password
 * @returns {string} Random password
 */
function generatePassword(length) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

/**
 * Cloud Function to completely delete a rider
 * Deletes both Firebase Authentication account AND Firestore document
 * Called from admin panel
 * 
 * @param {Object} data - { riderId: string }
 * @param {Object} context - Firebase auth context
 * @returns {Object} { success: boolean, error?: string }
 */
exports.deleteRiderCompletely = functions.https.onCall(async (data, context) => {
    try {
        // Verify that the caller is authenticated (admin)
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'Must be authenticated to delete riders'
            );
        }

        const { riderId } = data;

        if (!riderId) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'riderId is required'
            );
        }

        // Get rider data before deletion (for logging)
        let riderEmail = 'unknown';
        let riderName = 'unknown';
        try {
            const riderDoc = await admin.firestore()
                .collection('riders')
                .doc(riderId)
                .get();

            if (riderDoc.exists) {
                const data = riderDoc.data();
                riderEmail = data.email || 'unknown';
                riderName = data.name || 'unknown';
            }
        } catch (err) {
            console.log('Could not fetch rider data:', err.message);
        }

        // Delete from Firebase Authentication
        try {
            await admin.auth().deleteUser(riderId);
            console.log(`✅ Deleted Auth account for ${riderEmail}`);
        } catch (authError) {
            // If user doesn't exist in Auth, log but continue
            if (authError.code === 'auth/user-not-found') {
                console.log(`⚠️ Auth account not found for ${riderId}, continuing...`);
            } else {
                throw authError;
            }
        }

        // Delete from Firestore
        try {
            await admin.firestore()
                .collection('riders')
                .doc(riderId)
                .delete();
            console.log(`✅ Deleted Firestore document for ${riderEmail}`);
        } catch (firestoreError) {
            console.error('Error deleting Firestore document:', firestoreError);
            // Continue even if Firestore delete fails (Auth is more important)
        }

        console.log(`🗑️ Completely deleted rider: ${riderName} (${riderEmail})`);

        return {
            success: true,
            deletedEmail: riderEmail,
            deletedName: riderName
        };

    } catch (error) {
        console.error('Error deleting rider:', error);

        // If it's already a HttpsError, rethrow it
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }

        // Otherwise, wrap it in a HttpsError
        throw new functions.https.HttpsError(
            'internal',
            'Failed to delete rider: ' + error.message
        );
    }
});
