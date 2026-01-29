const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

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
