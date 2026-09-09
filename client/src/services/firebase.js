import { db, auth } from '../firebase-config'; // Assuming auth is exported from config

import {
    collection,
    getDocs,
    doc,
    getDoc,
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
    updateProfile
} from 'firebase/auth';

// --- Authentication ---

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

        if (orderData.placedByStaff && orderData.orderType === 'Dine-in') {
            initialStatus = 'preparing'; // Auto-confirm staff dine-in orders
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
                                    const available = data.stockLevel <= 0 ? 'out of stock' : `only ${data.stockLevel} remaining`;
                                    throw new Error(`"${item.name}" has ${available}. Please update your cart.`);
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
        callback([]);
    });
};

// Real-time listener for categories
export const subscribeToCategories = (callback) => {
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
    return onSnapshot(q, (querySnapshot) => {
        const categories = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(categories);
    }, (error) => {
        console.error("Error subscribing to categories:", error);
        callback([]);
    });
};

// Real-time listener for store settings
export const subscribeToStoreSettings = (callback) => {
    const q = query(collection(db, 'settings'));
    return onSnapshot(q, (querySnapshot) => {
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            callback({
                id: doc.id,
                ...doc.data()
            });
        }
    }, (error) => {
        console.error("Error subscribing to settings:", error);
        // Don't callback null here as it might break things if not handled
    });
};

// Check if store is currently open
// Check if store is currently open
export const isStoreOpen = (settings) => {
    if (!settings || !settings.storeOpen) return false;

    // Check manual override first - if enabled, store is always open
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
    const getPart = (type) => parts.find(p => p.type === type).value;

    const currentDay = getPart('weekday').toLowerCase();

    // Construct "HH:MM"
    let hour = getPart('hour');
    if (hour === '24') hour = '00';
    const currentTime = `${hour}:${getPart('minute')}`;

    console.log(`Checking Store Status (PKT): ${currentDay} ${currentTime}`);

    const todayHours = settings.operatingHours?.[currentDay];
    if (!todayHours) return false;

    const { open, close } = todayHours;

    // Special case: 24-hour operation (00:00 to 23:59)
    if (open === '00:00' && close === '23:59') {
        return true;
    }

    // Check if hours cross midnight (e.g., 22:00 to 02:00)
    if (close < open) {
        // Store is open if current time is after opening OR before closing
        return currentTime >= open || currentTime <= close;
    }

    // Normal case: opening and closing on the same day
    return currentTime >= open && currentTime <= close;
};
