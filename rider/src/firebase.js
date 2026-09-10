import { db, auth } from './firebase-config';
import {
    collection,
    query,
    orderBy,
    where,
    onSnapshot,
    doc,
    updateDoc,
    serverTimestamp,
    getDoc,
    getDocs,
    setDoc
} from 'firebase/firestore';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';

// Authentication
// Authentication
export const loginRider = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // Check if profile exists (in case it was deleted by admin)
        const profileCheck = await getRiderProfile(userCredential.user.uid);
        if (!profileCheck.success) {
            await signOut(auth);
            return { success: false, error: 'Account access revoked or profile not found.' };
        }

        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const registerRider = async (email, password, name, phone, signupCode) => {
    try {
        // If phone is omitted (e.g. legacy call), handle 4-arg signature
        let actualPhone = phone;
        let actualCode = signupCode;
        if (!signupCode && phone && phone.length <= 8 && !phone.startsWith('0') && !phone.startsWith('+')) {
            actualCode = phone;
            actualPhone = '';
        }

        // 1. Validate signup code first
        const codesQuery = query(
            collection(db, 'riderSignupCodes'),
            where('code', '==', actualCode.toUpperCase()),
            where('used', '==', false)
        );
        const codesSnapshot = await getDocs(codesQuery);

        if (codesSnapshot.empty) {
            return { success: false, error: 'Invalid or already used signup code' };
        }

        const codeDoc = codesSnapshot.docs[0];
        const codeId = codeDoc.id;

        // 2. Generate temporary password for admin reference
        const tempPassword = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Create Firebase Auth account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;

        // 4. Mark code as used
        await updateDoc(doc(db, 'riderSignupCodes', codeId), {
            used: true,
            usedAt: serverTimestamp(),
            usedBy: userId
        });

        // 5. Create rider profile in Firestore
        await setDoc(doc(db, 'riders', userId), {
            name: name,
            email: email,
            phone: actualPhone || '',
            userId: userId,
            signupCode: actualCode.toUpperCase(),
            tempPassword: tempPassword,
            createdAt: serverTimestamp(),
            stats: {
                assignedOrders: 0,
                deliveredOrders: 0
            }
        });

        return { success: true, user: userCredential.user, tempPassword };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const logoutRider = async () => {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const onAuthChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};

// Get rider profile
export const getRiderProfile = async (userId) => {
    try {
        const riderDoc = await getDoc(doc(db, 'riders', userId));
        if (riderDoc.exists()) {
            return { success: true, profile: { id: riderDoc.id, ...riderDoc.data() } };
        }
        return { success: false, error: 'Rider profile not found' };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Subscribe to rider profile (for real-time deletion check)
export const subscribeToRiderProfile = (userId, onProfileChange, onDeleted) => {
    return onSnapshot(doc(db, 'riders', userId), (docSnapshot) => {
        if (docSnapshot.exists()) {
            onProfileChange({ id: docSnapshot.id, ...docSnapshot.data() });
        } else {
            onDeleted();
        }
    }, (error) => {
        console.error("Error subscribing to profile:", error);
    });
};

// Orders - Filter by assigned rider
export const subscribeToOrders = (callback, riderId = null) => {
    let q;
    if (riderId) {
        // Filter orders assigned to this rider
        q = query(
            collection(db, 'orders'),
            where('assignedRiderId', '==', riderId),
            orderBy('createdAt', 'desc')
        );
    } else {
        // All orders (for backward compatibility)
        q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    }

    return onSnapshot(q, (querySnapshot) => {
        const orders = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(orders);
    }, (error) => {
        console.error("Error subscribing to orders:", error);
    });
};

// Subscribe to rider's assigned and past orders separately
export const subscribeToRiderOrders = (riderId, onAssignedOrders, onPastOrders) => {
    console.log('🔍 Subscribing to orders for rider:', riderId);

    // Query WITHOUT orderBy to avoid composite index requirement
    const q = query(
        collection(db, 'orders'),
        where('assignedRiderId', '==', riderId)
    );

    return onSnapshot(q, (querySnapshot) => {
        console.log('📦 Received orders snapshot, count:', querySnapshot.docs.length);

        const allOrders = querySnapshot.docs.map(doc => {
            const data = { id: doc.id, ...doc.data() };
            console.log('📋 Order:', doc.id, 'Status:', data.status, 'Type:', data.orderType);
            return data;
        });

        // Sort in memory by createdAt (descending)
        allOrders.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });

        // Split into assigned (active) and past (delivered)
        const assigned = allOrders.filter(o =>
            o.orderType === 'Delivery' &&
            (o.status === 'ready' || o.status === 'out_for_delivery')
        );
        const past = allOrders.filter(o => o.status === 'delivered');

        onAssignedOrders(assigned);
        onPastOrders(past);
    }, (error) => {
        console.error("❌ Error subscribing to rider orders:", error);
    });
};

export const updateOrderStatus = async (id, status, additionalData = {}) => {
    try {
        await updateDoc(doc(db, 'orders', id), {
            status,
            ...additionalData,
            updatedAt: serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};
