import { db, auth } from '../firebase-config'; // Assuming auth is exported from config

import {
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc,
    query,
    orderBy,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    runTransaction,
    serverTimestamp
} from 'firebase/firestore';

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';

// --- Authentication ---

export const loginWithGoogle = async () => {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        return { success: true, user: result.user };
    } catch (error) {
        return { success: false, error: error.message, code: error.code };
    }
};

export const registerUser = async (email, password, name) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const logoutUser = async () => {
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

// --- Orders ---

// Helper to generate a human-readable order reference (e.g., FB-8429)
const generateOrderReference = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `FB-${code}`;
};

// Create a new order — writes the order document safely; Cloud Functions handle atomic stock deduction
export const createOrder = async (orderData) => {
    try {
        let initialStatus = 'pending';
        let additionalFields = {};

        if (orderData.placedByStaff && (orderData.orderType === 'Dine-in' || orderData.orderType === 'Takeaway')) {
            initialStatus = 'preparing'; // Auto-confirm staff in-store orders (Dine-in and Takeaway)
            additionalFields.preparingStartedAt = serverTimestamp();
        }

        const orderReference = orderData.orderReference || generateOrderReference();

        // Validate stock availability before creating order
        if (orderData.items && orderData.items.length > 0) {
            for (const item of orderData.items) {
                if (item.id) {
                    try {
                        const itemDoc = await getDoc(doc(db, 'items', item.id));
                        if (itemDoc.exists()) {
                            const data = itemDoc.data();
                            if (data.inStock === false) {
                                throw new Error(`"${item.name}" is currently out of stock.`);
                            }
                            if (data.stockLevel !== undefined && data.stockLevel !== null) {
                                if (data.stockLevel < item.quantity) {
                                    throw new Error(`"${item.name}" is currently sold out or exceeds available quantity. Please update your cart.`);
                                }
                            }
                        }
                    } catch (checkErr) {
                        // If network/permission issue, rethrow if out-of-stock message
                        if (checkErr.message.includes('stock')) {
                            throw checkErr;
                        }
                    }
                }
            }
        }

        const order = {
            ...orderData,
            ...additionalFields,
            orderReference,
            status: orderData.status || initialStatus,
            stockDeducted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const newOrderRef = await addDoc(collection(db, 'orders'), order);

        // Save lookup mapping for human-readable reference (e.g. FB-XXXX -> documentId)
        try {
            await setDoc(doc(db, 'orderLookup', orderReference), {
                orderId: newOrderRef.id,
                orderReference,
                createdAt: serverTimestamp()
            });
        } catch (lookupErr) {
            console.warn('Could not save orderLookup mapping:', lookupErr);
        }

        return {
            success: true,
            orderId: newOrderRef.id,
            orderReference
        };

    } catch (error) {
        console.error('Error creating order:', error);
        return { success: false, error: error.message };
    }
};

// Fetch user's orders
export const getUserOrders = async (userId) => {
    try {
        const q = query(
            collection(db, 'orders'),
            where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        const orders = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Sort in memory to avoid composite index requirement (userId + createdAt)
        return orders.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA; // Descending
        });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        return [];
    }
};

// Fetch single order by orderId
export const getOrder = async (orderId) => {
    try {
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        if (orderDoc.exists()) {
            return { id: orderDoc.id, ...orderDoc.data() };
        }
        return null;
    } catch (error) {
        console.error('Error fetching order:', error);
        return null;
    }
};

// Resolve a human-readable orderReference (e.g. FB-XXXX or XXXX) to the actual Firestore document ID
export const resolveOrderIdFromReference = async (refOrId) => {
    if (!refOrId) return null;
    const clean = refOrId.trim().toUpperCase().replace(/^#/, '');

    try {
        // 1. Direct lookup by reference (e.g. FB-XXXX)
        const lookupSnap = await getDoc(doc(db, 'orderLookup', clean));
        if (lookupSnap.exists()) {
            return lookupSnap.data().orderId;
        }

        // 2. Lookup with prefix if user typed just the 4-character suffix (e.g. XXXX -> FB-XXXX)
        if (!clean.startsWith('FB-')) {
            const prefixedSnap = await getDoc(doc(db, 'orderLookup', `FB-${clean}`));
            if (prefixedSnap.exists()) {
                return prefixedSnap.data().orderId;
            }
        }
    } catch (err) {
        console.warn('orderLookup check failed:', err);
    }

    // Default to the input itself (may already be the Firestore document ID)
    return refOrId.trim().replace(/^#/, '');
};

// Real-time listener for a single order (for live tracking)
// Supports both Firestore document ID and human-readable FB-XXXX reference
export const subscribeToOrder = (orderIdOrRef, callback) => {
    if (!orderIdOrRef) return () => {};
    let unsubActual = () => {};

    const cleanInput = orderIdOrRef.trim().replace(/^#/, '');

    // Try directly listening to doc(db, 'orders', cleanInput)
    unsubActual = onSnapshot(doc(db, 'orders', cleanInput), async (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() });
        } else {
            // Not found by direct docId — attempt resolving via orderLookup
            try {
                const resolvedId = await resolveOrderIdFromReference(cleanInput);
                if (resolvedId && resolvedId !== cleanInput) {
                    unsubActual();
                    unsubActual = onSnapshot(doc(db, 'orders', resolvedId), (resSnap) => {
                        if (resSnap.exists()) {
                            callback({ id: resSnap.id, ...resSnap.data() });
                        } else {
                            callback(null);
                        }
                    }, (err) => {
                        console.error('Error in resolved order subscription:', err);
                        callback(null);
                    });
                    return;
                }
            } catch (_) {}
            callback(null);
        }
    }, (error) => {
        console.error('Error in order subscription:', error);
    });

    return () => unsubActual();
};


// Fetch all categories
export const getCategories = async () => {
    try {
        const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
};

// Fetch all menu items
export const getMenuItems = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'items'));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching menu items:', error);
        return [];
    }
};

// Fetch items by category
export const getItemsByCategory = async (categoryId) => {
    try {
        const q = query(
            collection(db, 'items'),
            where('categoryId', '==', categoryId),
            where('available', '==', true)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching items by category:', error);
        return [];
    }
};

// Fetch store settings
export const getStoreSettings = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'settings'));
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data()
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching store settings:', error);
        return null;
    }
};

// Fetch hero sliders
// Fetch hero sliders
export const getSliders = async () => {
    try {
        // Query only by active status to avoid composite index requirement
        const q = query(
            collection(db, 'sliders'),
            where('active', '==', true)
        );
        const querySnapshot = await getDocs(q);
        const sliders = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // Sort in memory
        return sliders.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
        console.error('Error fetching sliders:', error);
        return [];
    }
};

// Real-time listener for hero sliders
export const subscribeToSliders = (callback) => {
    const q = query(collection(db, 'sliders'), where('active', '==', true));
    return onSnapshot(q, (querySnapshot) => {
        const sliders = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // Sort in memory
        const sortedSliders = sliders.sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(sortedSliders);
    }, (error) => {
        console.error("Error subscribing to sliders:", error);
        callback([]);
    });
};

// Real-time listener for menu items
export const subscribeToMenuItems = (callback) => {
    const q = query(collection(db, 'items'));
    return onSnapshot(q, (querySnapshot) => {
        const items = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(items);
    }, (error) => {
        console.error("Error subscribing to menu items:", error);
        // Do not call callback([]) on error — keep last known state
    });
};

// Real-time listener for categories — sorts in memory to avoid Firestore index requirement
export const subscribeToCategories = (callback) => {
    const q = query(collection(db, 'categories'));
    return onSnapshot(q, (querySnapshot) => {
        const categories = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // Sort in memory — same result without requiring a Firestore composite index
        const sorted = categories.sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(sorted);
    }, (error) => {
        console.error("Error subscribing to categories:", error);
        // Do not call callback([]) on error — keep last known state
    });
};

// Real-time listener for store settings
export const subscribeToStoreSettings = (callback) => {
    const q = query(collection(db, 'settings'));
    return onSnapshot(q, (querySnapshot) => {
        if (!querySnapshot.empty) {
            // Find store_config if it exists, otherwise fall back to first doc
            const targetDoc = querySnapshot.docs.find(d => d.id === 'store_config')
                || querySnapshot.docs.find(d => d.data()?.storeInfo?.name)
                || querySnapshot.docs[0];

            callback({
                id: targetDoc.id,
                ...targetDoc.data()
            });
        }
    }, (error) => {
        console.error("Error subscribing to settings:", error);
    });
};

// Check if store is currently open
export const isStoreOpen = (settings) => {
    if (!settings) return true;
    if (settings.storeOpen === false) return false;

    // Check manual override first - if forceOpen is true, store is always open 24/7
    if (settings.forceOpen === true) {
        return true;
    }

    const now = new Date();

    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Karachi',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const parts = formatter.formatToParts(now);
    const getPart = (type) => parts.find(p => p.type === type)?.value;

    const currentDay = (getPart('weekday') || '').toLowerCase().trim();

    // Construct "HH:MM"
    let hour = getPart('hour') || '00';
    if (hour === '24') hour = '00';
    const currentTime = `${hour}:${getPart('minute') || '00'}`;

    // Case-insensitive lookup for current weekday in operatingHours map
    const operatingHours = settings.operatingHours || {};
    const matchingKey = Object.keys(operatingHours).find(
        key => key.toLowerCase().trim() === currentDay
    );

    const todayHours = matchingKey ? operatingHours[matchingKey] : null;
    if (!todayHours) {
        // If no explicit hours configured for this day, default to open
        return true;
    }

    const { open, close } = todayHours;
    if (!open || !close) return true;

    // Special case: 24-hour operation (00:00 to 23:59 or equal)
    if ((open === '00:00' && close === '23:59') || open === close) {
        return true;
    }

    // Check if hours cross midnight (e.g., 17:00 to 03:00)
    if (close < open) {
        // Store is open if current time is after opening OR before closing next morning
        return currentTime >= open || currentTime <= close;
    }

    // Normal case: opening and closing on the same day (e.g., 10:00 to 22:00)
    return currentTime >= open && currentTime <= close;
};
