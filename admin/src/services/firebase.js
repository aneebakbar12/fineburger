import { db, storage, auth } from '../firebase-config';

import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp,
    onSnapshot
} from 'firebase/firestore';
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'firebase/storage';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';

// Authentication
export const loginAdmin = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const logoutAdmin = async () => {
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

// Categories
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

export const addCategory = async (categoryData) => {
    try {
        const docRef = await addDoc(collection(db, 'categories'), {
            ...categoryData,
            createdAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const updateCategory = async (id, categoryData) => {
    try {
        await updateDoc(doc(db, 'categories', id), {
            ...categoryData,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const deleteCategory = async (id) => {
    try {
        await deleteDoc(doc(db, 'categories', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Menu Items
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

export const addMenuItem = async (itemData) => {
    try {
        const docRef = await addDoc(collection(db, 'items'), {
            ...itemData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const updateMenuItem = async (id, itemData) => {
    try {
        await updateDoc(doc(db, 'items', id), {
            ...itemData,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const deleteMenuItem = async (id) => {
    try {
        await deleteDoc(doc(db, 'items', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Image Upload
// Image Upload
export const uploadImage = async (file, path = 'menu-images') => {
    try {
        console.log("Starting image upload...", file.name);
        const timestamp = Date.now();
        const filename = `${timestamp}_${file.name}`;
        const storageRef = ref(storage, `${path}/${filename}`);

        // Add metadata
        const metadata = {
            contentType: file.type,
        };

        console.log("Uploading bytes...");

        // Create a promise that rejects after 15 seconds
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Upload timed out. Check your internet connection or CORS settings.")), 15000);
        });

        // Race between upload and timeout
        await Promise.race([
            uploadBytes(storageRef, file, metadata),
            timeoutPromise
        ]);

        console.log("Upload complete, getting download URL...");
        const downloadURL = await getDownloadURL(storageRef);
        console.log("Download URL received:", downloadURL);

        return { success: true, url: downloadURL };
    } catch (error) {
        console.error("Image upload failed:", error);
        return { success: false, error: error.message };
    }
};

export const deleteImage = async (imageUrl) => {
    try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Settings
export const getSettings = async () => {
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
        console.error('Error fetching settings:', error);
        return null;
    }
};

export const updateSettings = async (id, settingsData) => {
    try {
        await updateDoc(doc(db, 'settings', id), {
            ...settingsData,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Sliders
export const getSliders = async () => {
    try {
        const q = query(collection(db, 'sliders'), orderBy('order', 'asc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching sliders:', error);
        return [];
    }
};

export const addSlider = async (sliderData) => {
    try {
        const docRef = await addDoc(collection(db, 'sliders'), {
            ...sliderData,
            createdAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const updateSlider = async (id, sliderData) => {
    try {
        await updateDoc(doc(db, 'sliders', id), sliderData);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const deleteSlider = async (id) => {
    try {
        await deleteDoc(doc(db, 'sliders', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Orders
export const subscribeToOrders = (callback) => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
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

export const getServerTimestamp = () => serverTimestamp();

// Helper to get item by ID
const getItem = async (id) => {
    const docSnap = await getDoc(doc(db, 'items', id));
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
};

export const updateOrderStatus = async (id, status, additionalData = {}) => {
    try {
        await updateDoc(doc(db, 'orders', id), {
            status,
            ...additionalData,
            updatedAt: serverTimestamp()
        });

        // Deduct inventory when order starts/is confirmed (status: preparing)
        if (status === 'preparing') {
            const orderSnap = await getDoc(doc(db, 'orders', id));
            if (orderSnap.exists()) {
                const orderData = orderSnap.data();

                // Deduct stock for each item
                for (const item of orderData.items) {
                    const menuItemRef = doc(db, 'items', item.id);
                    const menuItemSnap = await getDoc(menuItemRef);

                    if (menuItemSnap.exists()) {
                        const currentStock = menuItemSnap.data().stockLevel || 0;
                        // Determine deduction amount (assuming each item is 1 unit unless otherwise specified)
                        const deduction = item.quantity || 1;

                        await updateDoc(menuItemRef, {
                            stockLevel: Math.max(0, currentStock - deduction)
                        });
                    }
                }
            }
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};
