import { db, auth, functions } from '../firebase-config';
import { httpsCallable } from 'firebase/functions';

import {
    collection,
    getDocs,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    serverTimestamp,
    onSnapshot,
    writeBatch,
    increment,
    sum,
    getAggregateFromServer
} from 'firebase/firestore';


import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from 'firebase/auth';

// ... (Rest of the file up to line 620)

// EXPENSE MANAGEMENT continuing...

export const getTotalExpenses = async (startDate, endDate) => {
    try {
        // Fallback to client-side calculation for reliability
        // This avoids potential issues with Firestore Aggregation queries permissions/indexes
        const expenses = await getExpenses(startDate, endDate);
        console.log(`Calculated Total Expenses from ${expenses.length} records`);
        return expenses.reduce((total, expense) => total + (expense.totalCost || 0), 0);
    } catch (error) {
        console.error('Error calculating total expenses:', error);
        return 0;
    }
};

export const getTotalRevenue = async (startDate, endDate) => {
    try {
        let q;
        if (startDate && endDate) {
            q = query(
                collection(db, 'orders'),
                where('status', '==', 'delivered'),
                where('createdAt', '>=', startDate),
                where('createdAt', '<=', endDate)
            );
        } else {
            q = query(
                collection(db, 'orders'),
                where('status', '==', 'delivered')
            );
        }

        try {
            const snapshot = await getAggregateFromServer(q, {
                totalRevenue: sum('total')
            });
            const total = snapshot.data().totalRevenue || 0;
            return total;
        } catch (aggError) {
            console.warn('Aggregation query fell back to in-memory filtering:', aggError.message);
            // Single-field query on status never requires a composite index
            const fallbackQ = query(collection(db, 'orders'), where('status', '==', 'delivered'));
            const snapshot = await getDocs(fallbackQ);
            return snapshot.docs
                .map(d => d.data())
                .filter(d => {
                    if (!startDate || !endDate) return true;
                    let orderDate;
                    if (d.createdAt?.toDate) {
                        orderDate = d.createdAt.toDate();
                    } else if (d.createdAt?.seconds) {
                        orderDate = new Date(d.createdAt.seconds * 1000);
                    } else if (d.createdAt) {
                        orderDate = new Date(d.createdAt);
                    }
                    if (!orderDate || isNaN(orderDate.getTime())) return false;
                    return orderDate >= startDate && orderDate <= endDate;
                })
                .reduce((acc, docData) => acc + (Number(docData.total) || 0), 0);
        }
    } catch (error) {
        console.error('Error calculating total revenue:', error);
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

// Authentication & Admin Privilege Verification
export const checkIsAdmin = async (user) => {
    if (!user) return false;
    const cleanEmail = (user.email || '').toLowerCase().trim();
    if (cleanEmail === 'aneeb458@gmail.com') return true;

    try {
        // 1. Direct document check by User UID (standard structure)
        const docSnap = await getDoc(doc(db, 'admins', user.uid));
        if (docSnap.exists()) {
            return true;
        }

        // 2. Fallback check by email (handles cases where doc ID might not match UID or email had whitespace)
        const adminsSnap = await getDocs(collection(db, 'admins'));
        const matched = adminsSnap.docs.find(d => {
            const emailInDoc = (d.data()?.email || '').toLowerCase().trim();
            return emailInDoc === cleanEmail;
        });

        if (matched) {
            // Auto-heal: ensure doc with user.uid exists so Firestore security rules match
            try {
                await setDoc(doc(db, 'admins', user.uid), {
                    email: cleanEmail,
                    role: matched.data()?.role || 'owner',
                    updatedAt: serverTimestamp()
                }, { merge: true });
            } catch (_) {}
            return true;
        }
    } catch (err) {
        console.error('Error verifying admin authorization:', err);
    }
    return false;
};

export const loginAdmin = async (email, password) => {
    try {
        const cleanEmail = (email || '').trim();
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const user = userCredential.user;

        // Verify that this user actually has admin rights
        const isAuthorized = await checkIsAdmin(user);
        if (!isAuthorized) {
            await signOut(auth);
            return {
                success: false,
                error: 'Access denied. This account does not have administrator privileges.',
                code: 'auth/unauthorized-admin'
            };
        }

        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.message, code: error.code };
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

// Image Upload — uses Cloudinary unsigned upload (no Firebase Storage / Blaze plan required)
const CLOUDINARY_CLOUD = 'diveaqbo';
const CLOUDINARY_PRESET = 'fineburger_uploads';

export const uploadImage = async (file, path = 'menu-images') => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_PRESET);
        formData.append('folder', `fineburger/${path}`);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
            { method: 'POST', body: formData }
        );

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'Upload failed');
        }

        const data = await response.json();
        return { success: true, url: data.secure_url };
    } catch (error) {
        console.error('Image upload failed:', error);
        return { success: false, error: error.message };
    }
};

// Settings (prioritize canonical store_config document)
export const getSettings = async () => {
    try {
        const storeConfigSnap = await getDoc(doc(db, 'settings', 'store_config'));
        if (storeConfigSnap.exists()) {
            return {
                id: storeConfigSnap.id,
                ...storeConfigSnap.data()
            };
        }

        const querySnapshot = await getDocs(collection(db, 'settings'));
        if (!querySnapshot.empty) {
            const targetDoc = querySnapshot.docs.find(d => d.id === 'store_config')
                || querySnapshot.docs.find(d => d.data()?.storeInfo?.name && d.id !== 'app')
                || querySnapshot.docs[0];
            return {
                id: targetDoc.id,
                ...targetDoc.data()
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

// ==========================================
// FINANCIAL ACCESS PASSWORD (FIRESTORE SYNC)
// ==========================================
const DEFAULT_FINANCIAL_PASSWORD = 'fineburger2024';

export const getFinancialPassword = async () => {
    try {
        const securitySnap = await getDoc(doc(db, 'settings', 'security'));
        if (securitySnap.exists() && securitySnap.data()?.financialPassword) {
            return securitySnap.data().financialPassword;
        }

        // Check fallback in store_config
        const configSnap = await getDoc(doc(db, 'settings', 'store_config'));
        if (configSnap.exists() && configSnap.data()?.financialPassword) {
            return configSnap.data().financialPassword;
        }

        return DEFAULT_FINANCIAL_PASSWORD;
    } catch (error) {
        console.error('Error reading financial password from Firestore:', error);
        return DEFAULT_FINANCIAL_PASSWORD;
    }
};

export const updateFinancialPassword = async (newPassword) => {
    try {
        if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
            return { success: false, error: 'Password must be at least 4 characters.' };
        }

        const cleanPw = newPassword.trim();

        // Save to settings/security
        await setDoc(doc(db, 'settings', 'security'), {
            financialPassword: cleanPw,
            updatedAt: serverTimestamp()
        }, { merge: true });

        // Keep in store_config as well for consistency
        try {
            await setDoc(doc(db, 'settings', 'store_config'), {
                financialPassword: cleanPw,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (_) {}

        return { success: true };
    } catch (error) {
        console.error('Error updating financial password in Firestore:', error);
        return { success: false, error: error.message };
    }
};

export const addSettings = async (settingsData) => {
    try {
        const docRef = await addDoc(collection(db, 'settings'), {
            ...settingsData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
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

        // Increment rider delivery stats when order is marked delivered
        if (status === 'delivered') {
            const orderSnap = await getDoc(doc(db, 'orders', id));
            if (orderSnap.exists()) {
                const oData = orderSnap.data();
                const riderId = oData.assignedRiderId;
                if (riderId) {
                    await updateDoc(doc(db, 'riders', riderId), {
                        'stats.deliveredOrders': increment(1),
                        'stats.lastDeliveredAt': serverTimestamp()
                    });
                }

                // If counter Dine-in or Takeaway cash order, credit active cashier shift drawer
                const targetShiftId = additionalData.shiftId || oData.shiftId;
                const isCounter = oData.orderType === 'Dine-in' || oData.orderType === 'Takeaway';
                const isCash = !oData.paymentMethod || oData.paymentMethod === 'Cash' || oData.paymentMethod === 'COD' || oData.paymentMethod === 'Cash on Delivery';
                if (targetShiftId && isCounter && isCash && !oData.shiftRecorded) {
                    try {
                        const shiftRef = doc(db, 'shifts', targetShiftId);
                        await updateDoc(shiftRef, {
                            counterCashSales: increment(Number(oData.total) || 0),
                            ordersCount: increment(1)
                        });
                        await updateDoc(doc(db, 'orders', id), {
                            shiftRecorded: true,
                            shiftId: targetShiftId
                        });
                    } catch (sErr) {
                        console.warn('Could not increment shift counter sales:', sErr);
                    }
                }
            }
        }

        // Deduct inventory ingredients when order enters cooking/preparing stage
        if (['preparing', 'ready', 'delivered'].includes(status)) {
            const orderSnap = await getDoc(doc(db, 'orders', id));
            if (orderSnap.exists()) {
                const orderData = orderSnap.data();
                if (!orderData.ingredientsDeducted && Array.isArray(orderData.items)) {
                    const deductions = {}; // inventoryItemId -> totalQtyToDeduct
                    for (const orderItem of orderData.items) {
                        const itemQty = Number(orderItem.quantity) || 1;
                        if (!orderItem.id) continue;
                        const menuItemRef = doc(db, 'items', orderItem.id);
                        const menuItemSnap = await getDoc(menuItemRef);
                        if (menuItemSnap.exists()) {
                            const menuItemData = menuItemSnap.data();
                            if (Array.isArray(menuItemData.ingredients)) {
                                for (const ing of menuItemData.ingredients) {
                                    if (ing.inventoryItemId && Number(ing.quantity) > 0) {
                                        const totalIngQty = (Number(ing.quantity) || 0) * itemQty;
                                        deductions[ing.inventoryItemId] = (deductions[ing.inventoryItemId] || 0) + totalIngQty;
                                    }
                                }
                            }
                        }
                    }

                    // Apply deductions to inventory collection
                    for (const [invId, qtyToDeduct] of Object.entries(deductions)) {
                        if (qtyToDeduct > 0) {
                            const invRef = doc(db, 'inventory', invId);
                            const invSnap = await getDoc(invRef);
                            if (invSnap.exists()) {
                                const currentStock = Number(invSnap.data().stockLevel) || 0;
                                const newStock = Math.max(0, currentStock - qtyToDeduct);
                                await updateDoc(invRef, {
                                    stockLevel: newStock,
                                    updatedAt: serverTimestamp()
                                });
                            }
                        }
                    }

                    // Record on order document so we know ingredients were deducted
                    await updateDoc(doc(db, 'orders', id), {
                        ingredientsDeducted: true,
                        deductedIngredients: deductions
                    });
                }
            }
        }

        // Restore inventory when an order is CANCELLED
        if (status === 'cancelled') {
            const orderSnap = await getDoc(doc(db, 'orders', id));
            if (orderSnap.exists()) {
                const orderData = orderSnap.data();

                // Restore menu items stock
                if (Array.isArray(orderData.items)) {
                    for (const item of orderData.items) {
                        if (!item.id) continue;
                        const menuItemRef = doc(db, 'items', item.id);
                        const menuItemSnap = await getDoc(menuItemRef);

                        if (menuItemSnap.exists()) {
                            const currentStock = menuItemSnap.data().stockLevel ?? 0;
                            const restored = currentStock + (item.quantity || 1);
                            await updateDoc(menuItemRef, {
                                stockLevel: restored,
                                // Re-enable the item if it was marked out-of-stock by this order
                                ...(menuItemSnap.data().inStock === false ? { inStock: true } : {})
                            });
                        }
                    }
                }

                // Restore deducted inventory ingredients
                if (orderData.ingredientsDeducted && orderData.deductedIngredients) {
                    for (const [invId, qtyToRestore] of Object.entries(orderData.deductedIngredients)) {
                        if (qtyToRestore > 0) {
                            const invRef = doc(db, 'inventory', invId);
                            const invSnap = await getDoc(invRef);
                            if (invSnap.exists()) {
                                const currentStock = Number(invSnap.data().stockLevel) || 0;
                                await updateDoc(invRef, {
                                    stockLevel: currentStock + qtyToRestore,
                                    updatedAt: serverTimestamp()
                                });
                            }
                        }
                    }
                    await updateDoc(doc(db, 'orders', id), {
                        ingredientsDeducted: false,
                        deductedIngredients: null
                    });
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

export const subscribeToInventory = (callback) => {
    const q = query(collection(db, 'inventory'));
    return onSnapshot(q, (querySnapshot) => {
        const items = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(items);
    }, (error) => {
        console.error('Error subscribing to inventory:', error);
    });
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

// ==========================================
// KITCHEN WASTE & SPOILAGE LOGS
// ==========================================
export const recordWasteLog = async (wasteData) => {
    try {
        const { itemType = 'inventory', inventoryItemId, menuItemId, quantity, reason, notes } = wasteData;
        const qtyNum = parseFloat(quantity) || 0;
        if (qtyNum <= 0) {
            return { success: false, error: 'Please enter a valid quantity greater than 0' };
        }

        if (itemType === 'menu') {
            if (!menuItemId) {
                return { success: false, error: 'Please select a menu item' };
            }

            const menuRef = doc(db, 'items', menuItemId);
            const menuSnap = await getDoc(menuRef);
            if (!menuSnap.exists()) {
                return { success: false, error: 'Menu item not found' };
            }

            const menuData = menuSnap.data();
            const unitCost = Number(menuData.costPrice || menuData.price) || 0;
            const totalLoss = Math.round(unitCost * qtyNum);

            // 1. Deduct menu item stock if tracked
            if (menuData.stockLevel !== undefined && menuData.stockLevel !== null) {
                const currentStock = Number(menuData.stockLevel) || 0;
                const newStock = Math.max(0, currentStock - qtyNum);
                await updateDoc(menuRef, {
                    stockLevel: newStock,
                    ...(newStock === 0 ? { inStock: false } : {}),
                    updatedAt: serverTimestamp()
                });
            }

            // 2. Deduct linked raw recipe ingredients from inventory if configured
            if (Array.isArray(menuData.ingredients) && menuData.ingredients.length > 0) {
                for (const ing of menuData.ingredients) {
                    if (!ing.inventoryItemId) continue;
                    const ingRef = doc(db, 'inventory', ing.inventoryItemId);
                    const ingSnap = await getDoc(ingRef);
                    if (ingSnap.exists()) {
                        const curInvStock = Number(ingSnap.data().stockLevel) || 0;
                        const deductQty = (Number(ing.quantity) || 1) * qtyNum;
                        await updateDoc(ingRef, {
                            stockLevel: Math.max(0, curInvStock - deductQty),
                            updatedAt: serverTimestamp()
                        });
                    }
                }
            }

            // 3. Write record into wasteLogs collection
            const logRef = await addDoc(collection(db, 'wasteLogs'), {
                itemType: 'menu',
                menuItemId,
                itemName: menuData.name || 'Prepared Food Item',
                category: menuData.category || 'Menu Food',
                unit: 'portions',
                quantity: qtyNum,
                unitCost,
                totalLoss,
                reason: reason || 'Burnt / Overcooked',
                notes: notes ? notes.trim() : '',
                createdAt: serverTimestamp()
            });

            return { success: true, id: logRef.id, totalLoss };
        }

        // Default: Raw Inventory Item
        if (!inventoryItemId) {
            return { success: false, error: 'Please select an inventory item' };
        }

        const invRef = doc(db, 'inventory', inventoryItemId);
        const invSnap = await getDoc(invRef);
        if (!invSnap.exists()) {
            return { success: false, error: 'Inventory item not found' };
        }

        const invData = invSnap.data();
        const currentStock = Number(invData.stockLevel) || 0;
        const unitCost = Number(invData.purchasePrice) || 0;
        const totalLoss = Math.round(unitCost * qtyNum);
        const newStock = Math.max(0, currentStock - qtyNum);

        // Deduct from inventory
        await updateDoc(invRef, {
            stockLevel: newStock,
            updatedAt: serverTimestamp()
        });

        // Write record into wasteLogs collection
        const logRef = await addDoc(collection(db, 'wasteLogs'), {
            itemType: 'inventory',
            inventoryItemId,
            itemName: invData.name || 'Raw Ingredient',
            category: invData.category || 'Ingredients',
            unit: invData.unit || 'pieces',
            quantity: qtyNum,
            unitCost,
            totalLoss,
            reason: reason || 'Spoilage',
            notes: notes ? notes.trim() : '',
            createdAt: serverTimestamp()
        });

        return { success: true, id: logRef.id, newStock, totalLoss };
    } catch (error) {
        console.error('Error recording waste log:', error);
        return { success: false, error: error.message };
    }
};

export const getWasteLogs = async (limitCount = 50) => {
    try {
        const q = query(collection(db, 'wasteLogs'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.slice(0, limitCount).map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching waste logs:', error);
        try {
            const fallbackSnapshot = await getDocs(collection(db, 'wasteLogs'));
            return fallbackSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (_) {
            return [];
        }
    }
};

export const subscribeToWasteLogs = (callback) => {
    const q = query(collection(db, 'wasteLogs'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(logs);
    }, (error) => {
        console.error('Error subscribing to waste logs, using fallback:', error);
        const fallbackQ = collection(db, 'wasteLogs');
        return onSnapshot(fallbackQ, (snapshot) => {
            const logs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(logs);
        });
    });
};

// ==========================================
// DISCOUNT MANAGEMENT
// ==========================================
export const getDiscounts = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'discounts'));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching discounts:', error);
        return [];
    }
};

export const subscribeToDiscounts = (callback) => {
    const q = query(collection(db, 'discounts'));
    return onSnapshot(q, (snapshot) => {
        const discounts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(discounts);
    }, (error) => {
        console.error('Error subscribing to discounts:', error);
    });
};

export const addDiscount = async (discountData) => {
    try {
        const docRef = await addDoc(collection(db, 'discounts'), {
            ...discountData,
            active: discountData.active !== undefined ? discountData.active : true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const updateDiscount = async (id, discountData) => {
    try {
        await updateDoc(doc(db, 'discounts', id), {
            ...discountData,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const deleteDiscount = async (id) => {
    try {
        await deleteDoc(doc(db, 'discounts', id));
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

// Direct password change/reset using Cloud Function (with Firestore update & reset email fallback)
export const setRiderPasswordDirect = async (riderId, customPassword = '', riderEmail = '') => {
    try {
        // 1. Update tempPassword in Firestore so it's recorded for admin reference
        if (riderId && customPassword) {
            await updateDoc(doc(db, 'riders', riderId), {
                tempPassword: customPassword,
                passwordResetAt: serverTimestamp()
            });
        }

        // 2. Attempt Cloud Function if Blaze plan is active
        try {
            const resetPassword = httpsCallable(functions, 'resetRiderPassword');
            const result = await resetPassword({ riderId, customPassword });
            if (result.data?.success) {
                return {
                    success: true,
                    newPassword: result.data.newPassword,
                    riderEmail: result.data.riderEmail || riderEmail,
                    riderName: result.data.riderName
                };
            }
        } catch (cfError) {
            console.warn('Cloud Function unavailable (requires Blaze plan). Sent password reset link instead:', cfError.message);
        }

        // 3. Fallback: Send official password reset email if email is available
        if (riderEmail) {
            await sendPasswordResetEmail(auth, riderEmail);
            return {
                success: true,
                newPassword: customPassword,
                fallbackEmailSent: true,
                riderEmail: riderEmail
            };
        }

        return {
            success: true,
            newPassword: customPassword
        };
    } catch (error) {
        console.error('Error changing rider password:', error);
        return { success: false, error: error.message };
    }
};

// Settle / collect cash from rider orders
export const settleRiderOrdersCash = async (riderId, orderIds = []) => {
    try {
        if (!riderId) return { success: false, error: 'Rider ID required' };

        let targetOrderIds = orderIds;

        // If orderIds not provided, find all unsettled delivered COD orders for this rider
        if (!targetOrderIds || targetOrderIds.length === 0) {
            const q = query(
                collection(db, 'orders'),
                where('assignedRiderId', '==', riderId),
                where('status', '==', 'delivered')
            );
            const snap = await getDocs(q);
            targetOrderIds = snap.docs
                .filter(d => {
                    const data = d.data();
                    const isCOD = (data.paymentMethod || 'COD').toUpperCase() === 'COD';
                    return isCOD && data.cashSettled !== true;
                })
                .map(d => d.id);
        }

        if (targetOrderIds.length === 0) {
            return { success: true, count: 0, message: 'No unsettled cash orders found.' };
        }

        const batchPromises = targetOrderIds.map(oId =>
            updateDoc(doc(db, 'orders', oId), {
                cashSettled: true,
                cashSettledAt: serverTimestamp(),
                cashSettledBy: auth.currentUser?.uid || 'admin'
            })
        );

        await Promise.all(batchPromises);
        return { success: true, count: targetOrderIds.length };
    } catch (error) {
        console.error('Error settling rider cash:', error);
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
            where('used', '==', false)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    } catch (error) {
        console.error('Error fetching unused codes:', error);
        return [];
    }
};

// Subscribe to unused signup codes (real-time)
export const subscribeToUnusedCodes = (callback) => {
    const q = query(
        collection(db, 'riderSignupCodes'),
        where('used', '==', false)
    );

    return onSnapshot(q, (querySnapshot) => {
        const codes = querySnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        callback(codes);
    }, (err) => {
        console.warn('Unused codes snapshot error:', err);
        callback([]);
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

// Delete all unused signup codes at once
export const clearAllSignupCodes = async () => {
    try {
        const q = query(
            collection(db, 'riderSignupCodes'),
            where('used', '==', false)
        );
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'riderSignupCodes', d.id)));
        await Promise.all(deletePromises);
        return { success: true, count: snapshot.docs.length };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Delete a rider completely (removes Firebase Auth user + Firestore profile via Cloud Function)
export const deleteRider = async (riderId) => {
    try {
        console.log('Deleting rider completely via Cloud Function:', riderId);

        if (!auth.currentUser) {
            throw new Error('Not authenticated. Please log in again.');
        }

        try {
            const deleteRiderCompletelyFn = httpsCallable(functions, 'deleteRiderCompletely');
            const result = await deleteRiderCompletelyFn({ riderId });
            console.log('✅ Rider completely deleted via Cloud Function:', result.data);
            return { success: true };
        } catch (fnError) {
            console.warn('Cloud Function deletion failed, falling back to Firestore delete:', fnError.message);
            await deleteDoc(doc(db, 'riders', riderId));
            return { success: true, warning: 'Deleted from database. Auth account may require manual removal.' };
        }
    } catch (error) {
        console.error('Error deleting rider:', error);
        return { success: false, error: error.message };
    }
};

// ==========================================
// CASHIER ACCOUNTS & MULTI-SHIFT MANAGEMENT
// ==========================================

// Get all registered cashiers
export const getCashiers = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'cashiers'));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } catch (error) {
        console.error('Error fetching cashiers:', error);
        return [];
    }
};

// Subscribe to cashiers in real time
export const subscribeToCashiers = (callback) => {
    const q = query(collection(db, 'cashiers'));
    return onSnapshot(q, (querySnapshot) => {
        const cashiers = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        callback(cashiers);
    }, (error) => {
        console.error("Error subscribing to cashiers:", error);
    });
};

// Create a new Cashier with 4-digit PIN
export const addCashier = async (cashierData) => {
    try {
        const cleanPin = String(cashierData.pin || '').trim();
        if (!cleanPin || cleanPin.length < 3) {
            return { success: false, error: 'PIN must be at least 3-4 digits long.' };
        }

        // Check for duplicate PINs among active cashiers
        const allCashiers = await getCashiers();
        const existingPin = allCashiers.find(c => String(c.pin).trim() === cleanPin && c.active !== false);
        if (existingPin) {
            return { success: false, error: `PIN is already assigned to "${existingPin.name}". Please choose a different PIN.` };
        }

        const docRef = await addDoc(collection(db, 'cashiers'), {
            name: (cashierData.name || '').trim(),
            pin: cleanPin,
            shiftTitle: (cashierData.shiftTitle || 'General Shift').trim(),
            phone: (cashierData.phone || '').trim(),
            active: cashierData.active !== false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error adding cashier:', error);
        return { success: false, error: error.message };
    }
};

// Update an existing Cashier
export const updateCashier = async (id, cashierData) => {
    try {
        if (cashierData.pin) {
            const cleanPin = String(cashierData.pin).trim();
            const allCashiers = await getCashiers();
            const existingPin = allCashiers.find(c => c.id !== id && String(c.pin).trim() === cleanPin && c.active !== false);
            if (existingPin) {
                return { success: false, error: `PIN is already in use by "${existingPin.name}".` };
            }
        }

        await updateDoc(doc(db, 'cashiers', id), {
            ...cashierData,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating cashier:', error);
        return { success: false, error: error.message };
    }
};

// Delete a Cashier
export const deleteCashier = async (id) => {
    try {
        await deleteDoc(doc(db, 'cashiers', id));
        return { success: true };
    } catch (error) {
        console.error('Error deleting cashier:', error);
        return { success: false, error: error.message };
    }
};

// Verify cashier by PIN and fetch their profile
export const verifyCashierByPin = async (pin) => {
    try {
        const cleanPin = String(pin || '').trim();
        if (!cleanPin) return { success: false, error: 'Please enter a PIN.' };

        const allCashiers = await getCashiers();
        const matched = allCashiers.find(c => String(c.pin).trim() === cleanPin && c.active !== false);

        if (!matched) {
            return { success: false, error: 'Incorrect PIN. No active cashier account found.' };
        }

        return { success: true, cashier: matched };
    } catch (error) {
        console.error('Error verifying cashier PIN:', error);
        return { success: false, error: error.message };
    }
};

// ==========================================
// SHIFT MANAGEMENT & DRAWER ACCOUNTING
// ==========================================

// Open a new shift for a cashier with starting float (peti)
export const openCashierShift = async ({ cashierId, cashierName, openingFloat = 0, notes = '' }) => {
    try {
        if (!cashierId) return { success: false, error: 'Cashier ID required' };

        // 1. Check if an open shift already exists for this cashier
        const q = query(
            collection(db, 'shifts'),
            where('cashierId', '==', cashierId),
            where('status', '==', 'open')
        );
        const existingSnap = await getDocs(q);
        if (!existingSnap.empty) {
            const existingShift = { id: existingSnap.docs[0].id, ...existingSnap.docs[0].data() };
            return { success: true, shift: existingShift, alreadyOpen: true };
        }

        const floatNum = Math.max(0, Number(openingFloat) || 0);

        // 2. Create the shift document
        const shiftDoc = await addDoc(collection(db, 'shifts'), {
            cashierId,
            cashierName,
            status: 'open',
            openedAt: serverTimestamp(),
            closedAt: null,
            settledAt: null,
            settledBy: null,
            openingFloat: floatNum,
            counterCashSales: 0,
            riderCashCollected: 0,
            ordersCount: 0,
            notes: (notes || '').trim()
        });

        const newShift = {
            id: shiftDoc.id,
            cashierId,
            cashierName,
            status: 'open',
            openingFloat: floatNum,
            counterCashSales: 0,
            riderCashCollected: 0,
            ordersCount: 0,
            notes: (notes || '').trim()
        };

        return { success: true, shift: newShift };
    } catch (error) {
        console.error('Error opening cashier shift:', error);
        return { success: false, error: error.message };
    }
};

// Get active open shift for a cashier
export const getActiveShiftForCashier = async (cashierId) => {
    try {
        if (!cashierId) return null;
        const q = query(
            collection(db, 'shifts'),
            where('cashierId', '==', cashierId),
            where('status', '==', 'open')
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
            return { id: snap.docs[0].id, ...snap.docs[0].data() };
        }
        return null;
    } catch (error) {
        console.error('Error fetching active shift:', error);
        return null;
    }
};

// Subscribe to active shift for a cashier
export const subscribeToActiveShift = (cashierId, callback) => {
    if (!cashierId) {
        callback(null);
        return () => {};
    }
    const q = query(
        collection(db, 'shifts'),
        where('cashierId', '==', cashierId),
        where('status', '==', 'open')
    );
    return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            callback({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        } else {
            callback(null);
        }
    }, (error) => {
        console.error("Error subscribing to active shift:", error);
        callback(null);
    });
};

// Subscribe to all shifts for manager views (sorted descending)
export const subscribeToAllShifts = (callback) => {
    const q = query(collection(db, 'shifts'), orderBy('openedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const shifts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(shifts);
    }, (error) => {
        console.warn("Falling back to client-side sort for shifts:", error.message);
        // Fallback without orderBy
        const fallbackQ = query(collection(db, 'shifts'));
        return onSnapshot(fallbackQ, (snapshot) => {
            const shifts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => (b.openedAt?.seconds || 0) - (a.openedAt?.seconds || 0));
            callback(shifts);
        });
    });
};

// Close an active shift (cashier handover summary prepared)
export const closeCashierShift = async (shiftId, { notes = '', actualCashCounted = null } = {}) => {
    try {
        if (!shiftId) return { success: false, error: 'Shift ID required' };

        const shiftRef = doc(db, 'shifts', shiftId);
        const snap = await getDoc(shiftRef);
        if (!snap.exists()) return { success: false, error: 'Shift not found' };

        const currentData = snap.data();
        const expectedCash = (Number(currentData.openingFloat) || 0) +
            (Number(currentData.counterCashSales) || 0) +
            (Number(currentData.riderCashCollected) || 0);

        const updatePayload = {
            status: 'closed',
            closedAt: serverTimestamp(),
            totalExpectedCash: expectedCash,
            ...(actualCashCounted !== null ? { actualCashCounted: Number(actualCashCounted) } : {}),
            ...(notes ? { closingNotes: notes.trim() } : {})
        };

        await updateDoc(shiftRef, updatePayload);
        return { success: true, expectedCash };
    } catch (error) {
        console.error('Error closing shift:', error);
        return { success: false, error: error.message };
    }
};

// Settle shift by Owner / Admin (clears drawer and marks permanently settled)
export const settleShiftByOwner = async (shiftId, { settledBy = 'Owner', notes = '' } = {}) => {
    try {
        if (!shiftId) return { success: false, error: 'Shift ID required' };

        const shiftRef = doc(db, 'shifts', shiftId);
        await updateDoc(shiftRef, {
            status: 'settled',
            settledAt: serverTimestamp(),
            settledBy: settledBy || auth.currentUser?.email || 'Owner',
            settlementNotes: (notes || '').trim()
        });

        return { success: true };
    } catch (error) {
        console.error('Error settling shift:', error);
        return { success: false, error: error.message };
    }
};

// ==========================================
// RIDER CASH DROPS (RIDER -> CASHIER DRAWER)
// ==========================================

// Record rider cash collection into active cashier drawer
export const recordRiderCashDrop = async ({
    shiftId,
    cashierId,
    cashierName,
    riderId,
    riderName,
    amount,
    orderIds = []
}) => {
    try {
        const dropAmount = Math.max(0, Number(amount) || 0);
        if (dropAmount <= 0) return { success: false, error: 'Invalid collection amount.' };
        if (!riderId) return { success: false, error: 'Rider ID required.' };

        // 1. Mark orders as cashSettled
        let settledIds = orderIds;
        if (!settledIds || settledIds.length === 0) {
            const q = query(
                collection(db, 'orders'),
                where('assignedRiderId', '==', riderId),
                where('status', '==', 'delivered')
            );
            const snap = await getDocs(q);
            settledIds = snap.docs
                .filter(d => {
                    const data = d.data();
                    const isCOD = (data.paymentMethod || 'COD').toUpperCase() === 'COD';
                    return isCOD && data.cashSettled !== true;
                })
                .map(d => d.id);
        }

        const updatePromises = settledIds.map(oId =>
            updateDoc(doc(db, 'orders', oId), {
                cashSettled: true,
                cashSettledAt: serverTimestamp(),
                cashSettledByCashierId: cashierId || null,
                cashSettledByCashierName: cashierName || 'Counter Cashier',
                shiftId: shiftId || null
            })
        );
        await Promise.all(updatePromises);

        // 2. Write an audit log to cashDrops collection
        const dropDoc = await addDoc(collection(db, 'cashDrops'), {
            shiftId: shiftId || null,
            cashierId: cashierId || null,
            cashierName: cashierName || 'Counter Cashier',
            riderId,
            riderName: riderName || 'Courier',
            amount: dropAmount,
            settledOrdersCount: settledIds.length,
            orderIds: settledIds,
            createdAt: serverTimestamp()
        });

        // 3. If there is an active shift, increment riderCashCollected in the cashier's drawer
        if (shiftId) {
            try {
                const shiftRef = doc(db, 'shifts', shiftId);
                await updateDoc(shiftRef, {
                    riderCashCollected: increment(dropAmount)
                });
            } catch (shiftErr) {
                console.warn('Could not increment shift cash:', shiftErr);
            }
        }

        return { success: true, dropId: dropDoc.id, settledOrdersCount: settledIds.length };
    } catch (error) {
        console.error('Error recording rider cash drop:', error);
        return { success: false, error: error.message };
    }
};

// Subscribe to cash drops
export const subscribeToCashDrops = (callback) => {
    const q = query(collection(db, 'cashDrops'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const drops = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(drops);
    }, (err) => {
        console.warn('Falling back for cashDrops snapshot:', err.message);
        const fallbackQ = query(collection(db, 'cashDrops'));
        return onSnapshot(fallbackQ, (snapshot) => {
            const drops = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            callback(drops);
        });
    });
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

// End of file
