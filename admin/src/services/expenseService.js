// ============================================
// EXPENSE MANAGEMENT
// ============================================

// Get all expenses with optional date filtering
export const getExpenses = async (startDate = null, endDate = null) => {
    try {
        let q = collection(db, 'expenses');

        if (startDate && endDate) {
            q = query(
                collection(db, 'expenses'),
                where('date', '>=', startDate),
                where('date', '<=', endDate),
                orderBy('date', 'desc')
            );
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

// Subscribe to expenses in real-time
export const subscribeToExpenses = (callback, startDate = null, endDate = null) => {
    try {
        let q;

        if (startDate && endDate) {
            q = query(
                collection(db, 'expenses'),
                where('date', '>=', startDate),
                where('date', '<=', endDate),
                orderBy('date', 'desc')
            );
        } else {
            q = query(collection(db, 'expenses'), orderBy('date', 'desc'));
        }

        return onSnapshot(q, (snapshot) => {
            const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(expenses);
        });
    } catch (error) {
        console.error('Error subscribing to expenses:', error);
        return () => { };
    }
};

// Add new expense
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

// Update expense
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

// Delete expense
export const deleteExpense = async (id) => {
    try {
        await deleteDoc(doc(db, 'expenses', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Get total expenses for a date range
export const getTotalExpenses = async (startDate, endDate) => {
    try {
        const expenses = await getExpenses(startDate, endDate);
        return expenses.reduce((total, expense) => total + (expense.totalCost || 0), 0);
    } catch (error) {
        console.error('Error calculating total expenses:', error);
        return 0;
    }
};

// Get expense breakdown by category
export const getExpenseBreakdown = async (startDate, endDate) => {
    try {
        const expenses = await getExpenses(startDate, endDate);
        const breakdown = {};

        expenses.forEach(expense => {
            const category = expense.category || 'Uncategorized';
            if (!breakdown[category]) {
                breakdown[category] = 0;
            }
            breakdown[category] += expense.totalCost || 0;
        });

        return breakdown;
    } catch (error) {
        console.error('Error calculating expense breakdown:', error);
        return {};
    }
};

// ============================================
// EXPENSE CATEGORIES
// ============================================

export const getExpenseCategories = async () => {
    try {
        const q = query(collection(db, 'expenseCategories'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching expense categories:', error);
        return [];
    }
};

export const addExpenseCategory = async (categoryData) => {
    try {
        const docRef = await addDoc(collection(db, 'expenseCategories'), {
            ...categoryData,
            createdAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ============================================
// FINANCIAL ANALYTICS
// ============================================

// Get total revenue from orders
export const getTotalRevenue = async (startDate, endDate) => {
    try {
        let q;

        if (startDate && endDate) {
            q = query(
                collection(db, 'orders'),
                where('createdAt', '>=', startDate),
                where('createdAt', '<=', endDate),
                where('status', '==', 'delivered')
            );
        } else {
            q = query(
                collection(db, 'orders'),
                where('status', '==', 'delivered')
            );
        }

        const snapshot = await getDocs(q);
        const orders = snapshot.docs.map(doc => doc.data());

        return orders.reduce((total, order) => total + (order.total || 0), 0);
    } catch (error) {
        console.error('Error calculating total revenue:', error);
        return 0;
    }
};

// Calculate net profit
export const getNetProfit = async (startDate, endDate) => {
    try {
        const revenue = await getTotalRevenue(startDate, endDate);
        const expenses = await getTotalExpenses(startDate, endDate);
        return revenue - expenses;
    } catch (error) {
        console.error('Error calculating net profit:', error);
        return 0;
    }
};

// Get financial summary
export const getFinancialSummary = async (startDate, endDate) => {
    try {
        const [revenue, expenses, expenseBreakdown] = await Promise.all([
            getTotalRevenue(startDate, endDate),
            getTotalExpenses(startDate, endDate),
            getExpenseBreakdown(startDate, endDate)
        ]);

        const profit = revenue - expenses;
        const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : 0;

        return {
            revenue,
            expenses,
            profit,
            profitMargin,
            expenseBreakdown
        };
    } catch (error) {
        console.error('Error getting financial summary:', error);
        return {
            revenue: 0,
            expenses: 0,
            profit: 0,
            profitMargin: 0,
            expenseBreakdown: {}
        };
    }
};

