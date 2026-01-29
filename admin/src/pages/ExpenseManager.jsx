import React, { useState, useEffect } from 'react';
import { subscribeToExpenses, addExpense, updateExpense, deleteExpense } from '../services/firebase';
import { formatPKR } from '../utils/currency';
import '../styles/admin.css';

const ExpenseManager = () => {
    const [expenses, setExpenses] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [formData, setFormData] = useState({
        category: 'Inventory',
        itemName: '',
        quantity: 1,
        unitPrice: 0,
        supplier: '',
        date: new Date().toISOString().split('T')[0],
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
            date: new Date(formData.date)
        };

        let result;
        if (editingExpense) {
            result = await updateExpense(editingExpense.id, expenseData);
        } else {
            result = await addExpense(expenseData);
        }

        if (result.success) {
            alert(editingExpense ? 'Expense updated!' : 'Expense added!');
            resetForm();
        } else {
            alert('Error: ' + result.error);
        }
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setFormData({
            category: expense.category,
            itemName: expense.itemName,
            quantity: expense.quantity,
            unitPrice: expense.unitPrice,
            supplier: expense.supplier || '',
            date: expense.date?.toDate?.()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
            notes: expense.notes || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            const result = await deleteExpense(id);
            if (result.success) {
                alert('Expense deleted!');
            } else {
                alert('Error: ' + result.error);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            category: 'Inventory',
            itemName: '',
            quantity: 1,
            unitPrice: 0,
            supplier: '',
            date: new Date().toISOString().split('T')[0],
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
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">💸 Expense Management</h1>
                    <p className="admin-subtitle">Track all business expenses in PKR</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ Add Expense'}
                </button>
            </div>

            {/* Total Expenses Card */}
            <div style={{
                backgroundColor: '#1a1a1a',
                border: '2px solid #3b82f6',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px'
            }}>
                <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>
                    Total Expenses
                </div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#3b82f6' }}>
                    {formatPKR(totalExpenses)}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {expenses.length} expense{expenses.length !== 1 ? 's' : ''} recorded
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
                                    value={formatPKR(formData.quantity * formData.unitPrice)}
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
                                <label className="form-label">Date</label>
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
                            <th>Date</th>
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
                                <td>{formatPKR(expense.unitPrice)}</td>
                                <td style={{ fontWeight: 'bold', color: '#f59e0b' }}>{formatPKR(expense.totalCost)}</td>
                                <td>{expense.supplier || '-'}</td>
                                <td>{expense.date?.toDate?.()?.toLocaleDateString() || '-'}</td>
                                <td>
                                    <div className="table-actions">
                                        <button className="btn-icon-small btn-edit" onClick={() => handleEdit(expense)}>✏️</button>
                                        <button className="btn-icon-small btn-delete" onClick={() => handleDelete(expense.id)}>🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ExpenseManager;
