import React, { useState, useEffect } from 'react';
import { subscribeToExpenses, addExpense, updateExpense, deleteExpense } from '../services/firebase';
import { formatCurrency, formatPKT, getPKTDate } from '../utils/dateUtils';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import { PlusIcon, EditIcon, TrashIcon, CloseIcon } from '../components/Icons';
import '../styles/admin.css';

const ExpenseManager = () => {
    const toast = useToast();
    const [expenses, setExpenses] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [expenseToDelete, setExpenseToDelete] = useState(null);

    // Get current date in PKT for default form value (YYYY-MM-DD)
    const getTodayPKT = () => {
        const d = getPKTDate();
        // Manual formatting to ensure YYYY-MM-DD matches PKT
        // d is already shifted to match PKT components if we use getFullYear etc? 
        // No, getPKTDate returns a Date object where absolute time is correct? 
        // Wait, getPKTDate returned `new Date(toLocaleString...)` which creates a shifted Date object.
        // So `d.toISOString().split('T')[0]` will give the correct YYYY-MM-DD for PKT.
        // wait, `d` is constructed from "toLocaleString" string. 
        // The browser sees that string and creates a date.
        // If the string says "2/12/2026, 5:00:00 AM", `new Date()` makes it local time 5AM.
        // So yes, toISOString() on that shifted date gives correct YYYY-MM-DD.
        return d.toISOString().split('T')[0];
    };

    const [formData, setFormData] = useState({
        category: 'Inventory',
        itemName: '',
        quantity: 1,
        unitPrice: 0,
        supplier: '',
        date: getTodayPKT(),
        notes: ''
    });

    const categories = [
        { value: 'Inventory', icon: '📦', color: '#3b82f6' },
        { value: 'Rent', icon: '🏠', color: '#8b5cf6' },
        { value: 'Utilities', icon: '⚡', color: '#f59e0b' },
        { value: 'Salaries', icon: '💼', color: '#10b981' },
        { value: 'Marketing', icon: '📢', color: '#ec4899' },
        { value: 'Maintenance', icon: '🔧', color: '#6366f1' },
        { value: 'Delivery', icon: '🚗', color: '#14b8a6' },
        { value: 'Miscellaneous', icon: '📝', color: '#64748b' }
    ];

    useEffect(() => {
        const unsubscribe = subscribeToExpenses((expensesData) => {
            setExpenses(expensesData);
        });
        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const expenseData = {
            ...formData,
            quantity: parseFloat(formData.quantity),
            unitPrice: parseFloat(formData.unitPrice),
            // When saving, we want to treat the input date as the start of that day in PKT
            // Input: "2026-02-12" -> We want 2026-02-12 00:00:00 +05:00
            date: new Date(`${formData.date}T00:00:00+05:00`)
        };

        let result;
        if (editingExpense) {
            result = await updateExpense(editingExpense.id, expenseData);
        } else {
            result = await addExpense(expenseData);
        }

        if (result.success) {
            toast.success(editingExpense ? 'Expense updated!' : 'Expense added!');
            resetForm();
        } else {
            toast.error('Error: ' + result.error);
        }
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);

        // Recover YYYY-MM-DD from the saved timestamp (which is UTC)
        // We need to convert UTC timestamp -> PKT YYYY-MM-DD
        let dateStr = getTodayPKT();
        if (expense.date) {
            const d = expense.date.toDate ? expense.date.toDate() : new Date(expense.date);
            // Convert to PKT string
            const pktStr = d.toLocaleString("en-US", { timeZone: "Asia/Karachi" });
            // pktStr is "2/12/2026, 12:00:00 AM"
            const pktDate = new Date(pktStr);
            dateStr = pktDate.toISOString().split('T')[0];
        }

        setFormData({
            category: expense.category,
            itemName: expense.itemName,
            quantity: expense.quantity,
            unitPrice: expense.unitPrice,
            supplier: expense.supplier || '',
            date: dateStr,
            notes: expense.notes || ''
        });
        setShowForm(true);
    };

    const confirmDeleteExpense = async () => {
        if (!expenseToDelete) return;
        try {
            const result = await deleteExpense(expenseToDelete.id);
            if (result.success) {
                toast.success('Expense record deleted successfully.');
            } else {
                toast.error('Error: ' + result.error);
            }
        } catch (err) {
            toast.error('Failed to delete expense: ' + err.message);
        }
        setExpenseToDelete(null);
    };

    const resetForm = () => {
        setFormData({
            category: 'Inventory',
            itemName: '',
            quantity: 1,
            unitPrice: 0,
            supplier: '',
            date: getTodayPKT(),
            notes: ''
        });
        setEditingExpense(null);
        setShowForm(false);
    };

    const getCategoryIcon = (category) => {
        const cat = categories.find(c => c.value === category);
        return cat ? cat.icon : '📝';
    };

    const getCategoryColor = (category) => {
        const cat = categories.find(c => c.value === category);
        return cat ? cat.color : '#64748b';
    };

    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.totalCost || 0), 0);

    return (
        <div>
            <div className="admin-header" style={{ padding: '20px 24px', marginBottom: '24px' }}>
                <div>
                    <h1 className="admin-title" style={{ fontSize: '24px' }}>Expense Management</h1>
                    <p className="admin-subtitle" style={{ fontSize: '13px', marginTop: '4px' }}>
                        Track kitchen overhead, inventory purchases, and operational costs
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowForm(!showForm)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                    {showForm ? <CloseIcon width={18} height={18} /> : <PlusIcon width={18} height={18} />}
                    <span>{showForm ? 'Cancel' : 'Add Expense'}</span>
                </button>
            </div>

            {/* Total Expenses Card */}
            <div style={{
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--surface-border)',
                borderLeft: '4px solid #3b82f6',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
            }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Total Tracked Expenses
                </div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {formatCurrency(totalExpenses)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    {expenses.length} expense record{expenses.length !== 1 ? 's' : ''} logged
                </div>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: 'var(--spacing-2xl)', padding: 'var(--spacing-xl)' }}>
                    <h2 style={{ marginBottom: '20px', color: 'white' }}>
                        {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select
                                    className="form-input"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    required
                                >
                                    {categories.map(cat => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.icon} {cat.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Item Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.itemName}
                                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                                    placeholder="e.g., Tissue Boxes"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Quantity</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    min="0.01"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Unit Price (PKR)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.unitPrice}
                                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Total Cost (PKR)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formatCurrency(formData.quantity * formData.unitPrice)}
                                    readOnly
                                    style={{ backgroundColor: '#2a2a2a', color: '#4ade80' }}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Supplier</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.supplier}
                                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                    placeholder="e.g., Metro Cash & Carry"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Date (PKT)</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">Notes (Optional)</label>
                                <textarea
                                    className="form-input"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="3"
                                    placeholder="Additional notes..."
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: '20px' }}>
                            <button type="submit" className="btn btn-primary">
                                {editingExpense ? 'Update' : 'Add'} Expense
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total Cost</th>
                            <th>Supplier</th>
                            <th>Date (PKT)</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map(expense => (
                            <tr key={expense.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '20px' }}>{getCategoryIcon(expense.category)}</span>
                                        <span style={{ color: getCategoryColor(expense.category), fontWeight: '600' }}>
                                            {expense.category}
                                        </span>
                                    </div>
                                </td>
                                <td style={{ fontWeight: 600, color: 'var(--color-white)' }}>{expense.itemName}</td>
                                <td>{expense.quantity}</td>
                                <td>{formatCurrency(expense.unitPrice)}</td>
                                <td style={{ fontWeight: 'bold', color: '#f59e0b' }}>{formatCurrency(expense.totalCost)}</td>
                                <td>{expense.supplier || '-'}</td>
                                <td>{formatPKT(expense.date)}</td>
                                <td>
                                    <div className="table-actions">
                                        <button
                                            className="btn-icon-small btn-edit"
                                            onClick={() => handleEdit(expense)}
                                            title="Edit expense"
                                            aria-label="Edit expense"
                                        >
                                            <EditIcon width={16} height={16} />
                                        </button>
                                        <button
                                            className="btn-icon-small btn-delete"
                                            onClick={() => setExpenseToDelete(expense)}
                                            title="Delete expense"
                                            aria-label="Delete expense"
                                        >
                                            <TrashIcon width={16} height={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmModal
                isOpen={!!expenseToDelete}
                title="Delete Expense Record"
                message={`Are you sure you want to remove the expense for "${expenseToDelete?.itemName}" (${formatCurrency(expenseToDelete?.totalCost)})?`}
                confirmText="Yes, Delete Record"
                cancelText="Cancel"
                isDanger={true}
                onConfirm={confirmDeleteExpense}
                onCancel={() => setExpenseToDelete(null)}
            />
        </div>
    );
};

export default ExpenseManager;
