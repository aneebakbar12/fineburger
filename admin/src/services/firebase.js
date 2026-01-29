import { db, storage, auth, functions } from '../firebase-config';
import { httpsCallable } from 'firebase/functions';

import {
    collection,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    serverTimestamp,
    onSnapshot,
    writeBatch
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
    onAuthStateChanged,
    sendPasswordResetEmail
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

// Batch update category orders (for drag-and-drop reordering)
export const updateCategoryOrders = async (categories) => {
    try {
        const batch = writeBatch(db);
        categories.forEach((cat, index) => {
            const catRef = doc(db, 'categories', cat.id);
            batch.update(catRef, { order: index + 1 });
        });
        await batch.commit();
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

// General Inventory (non-menu items like ketchup, cheese, tissues)
export const getInventoryItems = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'inventory'));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching inventory items:', error);
        return [];
    }
};

export const addInventoryItem = async (itemData) => {
    try {
        const docRef = await addDoc(collection(db, 'inventory'), {
            ...itemData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const updateInventoryItem = async (id, itemData) => {
    try {
        await updateDoc(doc(db, 'inventory', id), {
            ...itemData,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const deleteInventoryItem = async (id) => {
    try {
        await deleteDoc(doc(db, 'inventory', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Riders
export const getRiders = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'riders'));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching riders:', error);
        return [];
    }
};

export const subscribeToRiders = (callback) => {
    const q = query(collection(db, 'riders'));
    return onSnapshot(q, (querySnapshot) => {
        const riders = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(riders);
    }, (error) => {
        console.error("Error subscribing to riders:", error);
    });
};

export const getRiderStats = async (riderId) => {
    try {
        const riderDoc = await getDoc(doc(db, 'riders', riderId));
        if (riderDoc.exists()) {
            return { success: true, stats: riderDoc.data().stats || { assignedOrders: 0, deliveredOrders: 0 } };
        }
        return { success: false, error: 'Rider not found' };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const assignOrderToRider = async (orderId, riderId, riderName) => {
    try {
        await updateDoc(doc(db, 'orders', orderId), {
            assignedRiderId: riderId,
            assignedRiderName: riderName,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const resetRiderPassword = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Direct password reset using Cloud Function (requires Firebase Blaze plan)
export const resetRiderPasswordDirect = async (riderId) => {
    try {
        const resetPassword = httpsCallable(functions, 'resetRiderPassword');
        const result = await resetPassword({ riderId });
        return {
            success: true,
            newPassword: result.data.newPassword,
            riderEmail: result.data.riderEmail,
            riderName: result.data.riderName
        };
    } catch (error) {
        console.error('Cloud Function error:', error);
        return { success: false, error: error.message };
    }
};

// Generate signup code for rider registration
export const generateRiderSignupCode = async () => {
    try {
        // Generate random 6-character code (uppercase letters and numbers)
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const codeDoc = await addDoc(collection(db, 'riderSignupCodes'), {
            code: code,
            createdAt: serverTimestamp(),
            createdBy: auth.currentUser.uid,
            used: false,
            usedAt: null,
            usedBy: null,
            expiresAt: null
        });

        return { success: true, code, codeId: codeDoc.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Get all unused signup codes
export const getUnusedSignupCodes = async () => {
    try {
        const q = query(
            collection(db, 'riderSignupCodes'),
            where('used', '==', false),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching unused codes:', error);
        return [];
    }
};

// Subscribe to unused signup codes (real-time)
export const subscribeToUnusedCodes = (callback) => {
    const q = query(
        collection(db, 'riderSignupCodes'),
        where('used', '==', false),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
        const codes = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(codes);
    });
};

// Delete an unused signup code
export const deleteSignupCode = async (codeId) => {
    try {
        await deleteDoc(doc(db, 'riderSignupCodes', codeId));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Delete a rider (Firestore only)
export const deleteRider = async (riderId) => {
    try {
        await deleteDoc(doc(db, 'riders', riderId));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ============================================
// EXPENSE MANAGEMENT
// ============================================

export const getExpenses = async (startDate = null, endDate = null) => {
    try {
        let q;
        if (startDate && endDate) {
            q = query(collection(db, 'expenses'), where('date', '>=', startDate), where('date', '<=', endDate), orderBy('date', 'desc'));
        } else {
            q = query(collection(db, 'expenses'), orderBy('date', 'desc'));
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return [];
    }
};

export const subscribeToExpenses = (callback) => {
    const q = query(collection(db, 'expenses'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
};

export const addExpense = async (expenseData) => {
    try {
        const totalCost = expenseData.quantity * expenseData.unitPrice;
        const docRef = await addDoc(collection(db, 'expenses'), {
            ...expenseData,
            totalCost,
            createdAt: serverTimestamp(),
            createdBy: auth.currentUser?.uid || 'unknown'
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const updateExpense = async (id, expenseData) => {
    try {
        const totalCost = expenseData.quantity * expenseData.unitPrice;
        await updateDoc(doc(db, 'expenses', id), {
            ...expenseData,
            totalCost,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const deleteExpense = async (id) => {
    try {
        await deleteDoc(doc(db, 'expenses', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getTotalExpenses = async (startDate, endDate) => {
    try {
        const expenses = await getExpenses(startDate, endDate);
        return expenses.reduce((total, expense) => total + (expense.totalCost || 0), 0);
    } catch (error) {
        return 0;
    }
};

export const getTotalRevenue = async (startDate, endDate) => {
    try {
        let q;
        if (startDate && endDate) {
            q = query(collection(db, 'orders'), where('createdAt', '>=', startDate), where('createdAt', '<=', endDate), where('status', '==', 'delivered'));
        } else {
            q = query(collection(db, 'orders'), where('status', '==', 'delivered'));
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.reduce((total, doc) => total + (doc.data().total || 0), 0);
    } catch (error) {
        return 0;
    }
};

export const getFinancialSummary = async (startDate, endDate) => {
    try {
        const [revenue, expenses] = await Promise.all([
            getTotalRevenue(startDate, endDate),
            getTotalExpenses(startDate, endDate)
        ]);
        const profit = revenue - expenses;
        const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : 0;
        return { revenue, expenses, profit, profitMargin };
    } catch (error) {
        return { revenue: 0, expenses: 0, profit: 0, profitMargin: 0 };
    }
};
