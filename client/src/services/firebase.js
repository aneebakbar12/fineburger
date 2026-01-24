import { db } from '../firebase-config';

import {
    collection,
    getDocs,
    query,
    orderBy,
    where,
    onSnapshot,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';

// Create a new order
export const createOrder = async (orderData) => {
    try {
        const docRef = await addDoc(collection(db, 'orders'), {
            ...orderData,
            status: 'pending',
            createdAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error creating order:", error);
        return { success: false, error: error.message };
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
export const isStoreOpen = (settings) => {
    if (!settings || !settings.storeOpen) return false;

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    const todayHours = settings.operatingHours?.[currentDay];
    if (!todayHours) return false;

    return currentTime >= todayHours.open && currentTime <= todayHours.close;
};
