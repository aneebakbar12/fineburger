import React, { useState, useEffect } from 'react';
import {
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    updateCategoryOrders
} from '../services/firebase';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import { PlusIcon, EditIcon, TrashIcon, CloseIcon } from '../components/Icons';
import '../styles/admin.css';

const CategoryManager = () => {
    const toast = useToast();
    const [categories, setCategories] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', order: 1 });
    const [draggedCategory, setDraggedCategory] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data || []);
        } catch (err) {
            toast.error('Failed to load categories: ' + err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Category name is required');
            return;
        }

        const categoryData = {
            name: formData.name.trim(),
            order: parseInt(formData.order) || 1
        };

        try {
            let result;
            if (editingCategory) {
                result = await updateCategory(editingCategory.id, categoryData);
            } else {
                result = await addCategory(categoryData);
            }

            if (result.success) {
                toast.success(editingCategory ? 'Category updated successfully!' : 'Category added successfully!');
                resetForm();
                fetchCategories();
            } else {
                toast.error('Error: ' + result.error);
            }
        } catch (err) {
            toast.error('Error: ' + err.message);
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({ name: category.name, order: category.order });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const confirmDelete = async () => {
        if (!categoryToDelete) return;
        try {
            const result = await deleteCategory(categoryToDelete.id);
            if (result.success) {
                toast.success(`Category "${categoryToDelete.name}" deleted.`);
                fetchCategories();
            } else {
                toast.error('Error: ' + result.error);
            }
        } catch (err) {
            toast.error('Failed to delete category: ' + err.message);
        }
        setCategoryToDelete(null);
    };

    const resetForm = () => {
        setFormData({ name: '', order: (categories.length + 1) });
        setEditingCategory(null);
        setShowForm(false);
    };

    const handleDragStart = (e, category) => {
        setDraggedCategory(category);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = async (e, dropIndex) => {
        e.preventDefault();
        if (!draggedCategory) return;

        const reordered = [...categories];
        const draggedIndex = reordered.findIndex(c => c.id === draggedCategory.id);

        const [removed] = reordered.splice(draggedIndex, 1);
        reordered.splice(dropIndex, 0, removed);

        // Assign progressive order numbers
        const updatedWithOrders = reordered.map((item, idx) => ({
            ...item,
            order: idx + 1
        }));

        setCategories(updatedWithOrders);
        setDraggedCategory(null);
        setDragOverIndex(null);

        try {
            const result = await updateCategoryOrders(updatedWithOrders);
            if (result.success) {
                toast.success('Category display order updated!');
            } else {
                toast.error('Failed to update order: ' + result.error);
                fetchCategories();
            }
        } catch (err) {
            toast.error('Failed to sync category order: ' + err.message);
            fetchCategories();
        }
    };

    const handleDragEnd = () => {
        setDraggedCategory(null);
        setDragOverIndex(null);
    };

    return (
        <div>
            {/* Header */}
            <div className="admin-header" style={{ padding: '20px 24px', marginBottom: '24px' }}>
                <div>
                    <h1 className="admin-title" style={{ fontSize: '24px' }}>Menu Categories</h1>
                    <p className="admin-subtitle" style={{ fontSize: '13px', marginTop: '4px' }}>
                        Organize customer menu sections ({categories.length} categories)
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        if (showForm) {
                            resetForm();
                        } else {
                            setFormData({ name: '', order: categories.length + 1 });
                            setShowForm(true);
                        }
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                    {showForm ? <CloseIcon width={18} height={18} /> : <PlusIcon width={18} height={18} />}
                    <span>{showForm ? 'Cancel' : 'Add Category'}</span>
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="card" style={{
                    marginBottom: 'var(--spacing-2xl)',
                    padding: 'var(--spacing-xl)',
                    backgroundColor: 'var(--surface-card)',
                    border: '1px solid var(--surface-border)'
                }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-lg)', color: 'var(--text-primary)', fontWeight: 700 }}>
                        {editingCategory ? `Edit: ${editingCategory.name}` : 'Create New Category'}
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-lg)' }}>
                            <div className="form-group">
                                <label className="form-label">Category Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Gourmet Beef Burgers"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Display Order</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                                    min="1"
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                            <button type="submit" className="btn btn-primary">
                                {editingCategory ? 'Update Category' : 'Save Category'}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Reorder Tip */}
            <div style={{
                padding: '14px 18px',
                backgroundColor: 'rgba(255, 180, 0, 0.08)',
                border: '1px solid rgba(255, 180, 0, 0.25)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <span style={{ color: 'var(--color-accent)', fontWeight: 800, fontSize: '14px' }}>TIP:</span>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Drag and drop rows using the handles to rearrange categories. Changes will automatically update the storefront in real-time.
                </p>
            </div>

            {/* Data Table */}
            <div className="data-table" style={{ border: '1px solid var(--surface-border)' }}>
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '60%' }}>Category Name</th>
                            <th style={{ width: '20%' }}>Display Order</th>
                            <th style={{ width: '20%', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.length === 0 ? (
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                    No categories defined yet. Click "Add Category" to create your first.
                                </td>
                            </tr>
                        ) : (
                            categories.map((cat, index) => (
                                <tr
                                    key={cat.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, cat)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, index)}
                                    onDragEnd={handleDragEnd}
                                    style={{
                                        opacity: draggedCategory?.id === cat.id ? 0.4 : 1,
                                        cursor: 'grab',
                                        backgroundColor: dragOverIndex === index ? 'rgba(255, 180, 0, 0.1)' : 'transparent',
                                        borderTop: dragOverIndex === index ? '2px solid var(--color-accent)' : 'none',
                                        transition: 'background-color 0.15s ease'
                                    }}
                                >
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <span style={{
                                                cursor: 'grab',
                                                fontSize: '16px',
                                                color: 'var(--text-muted)',
                                                userSelect: 'none',
                                                letterSpacing: '2px'
                                            }}>
                                                ⋮⋮
                                            </span>
                                            <span style={{ fontSize: '14px' }}>{cat.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '4px',
                                            backgroundColor: 'var(--surface-elevated)',
                                            color: 'var(--text-secondary)',
                                            fontSize: '12px',
                                            fontWeight: 600
                                        }}>
                                            #{cat.order}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                                            <button
                                                className="btn-icon-small btn-edit"
                                                onClick={() => handleEdit(cat)}
                                                title="Edit category"
                                                aria-label={`Edit ${cat.name}`}
                                            >
                                                <EditIcon width={16} height={16} />
                                            </button>
                                            <button
                                                className="btn-icon-small btn-delete"
                                                onClick={() => setCategoryToDelete(cat)}
                                                title="Delete category"
                                                aria-label={`Delete ${cat.name}`}
                                            >
                                                <TrashIcon width={16} height={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={!!categoryToDelete}
                title="Delete Category"
                message={`Are you sure you want to delete "${categoryToDelete?.name}"? Items inside this category will become uncategorized.`}
                confirmText="Yes, Delete Category"
                cancelText="Cancel"
                isDanger={true}
                onConfirm={confirmDelete}
                onCancel={() => setCategoryToDelete(null)}
            />
        </div>
    );
};

export default CategoryManager;
