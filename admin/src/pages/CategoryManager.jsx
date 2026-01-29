import React, { useState, useEffect } from 'react';
import { getCategories, addCategory, updateCategory, deleteCategory, updateCategoryOrders } from '../services/firebase';

const CategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', order: 1 });
    const [draggedCategory, setDraggedCategory] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        const data = await getCategories();
        setCategories(data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const categoryData = {
            name: formData.name,
            order: parseInt(formData.order)
        };

        let result;
        if (editingCategory) {
            result = await updateCategory(editingCategory.id, categoryData);
        } else {
            result = await addCategory(categoryData);
        }

        if (result.success) {
            alert(editingCategory ? 'Category updated!' : 'Category added!');
            resetForm();
            fetchCategories();
        } else {
            alert('Error: ' + result.error);
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({ name: category.name, order: category.order });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure? This will not delete items in this category.')) {
            const result = await deleteCategory(id);
            if (result.success) {
                alert('Category deleted!');
                fetchCategories();
            }
        }
    };

    const resetForm = () => {
        setFormData({ name: '', order: 1 });
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

        // Remove from old position
        const [removed] = reordered.splice(draggedIndex, 1);
        // Insert at new position
        reordered.splice(dropIndex, 0, removed);

        // Update local state immediately for instant feedback
        setCategories(reordered);
        setDraggedCategory(null);
        setDragOverIndex(null);

        // Batch update Firestore
        const result = await updateCategoryOrders(reordered);
        if (!result.success) {
            alert('Failed to update order: ' + result.error);
            // Revert on error
            fetchCategories();
        }
    };

    const handleDragEnd = () => {
        setDraggedCategory(null);
        setDragOverIndex(null);
    };


    return (
        <div>
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Categories</h1>
                    <p className="admin-subtitle">Manage menu categories</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ Add Category'}
                </button>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: 'var(--spacing-2xl)', padding: 'var(--spacing-xl)' }}>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Category Name</label>
                            <input
                                type="text"
                                className="form-input"
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
                        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                            <button type="submit" className="btn btn-primary">
                                {editingCategory ? 'Update' : 'Add'} Category
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{
                padding: '16px',
                backgroundColor: 'rgba(74, 222, 128, 0.1)',
                border: '1px solid rgba(74, 222, 128, 0.3)',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <span style={{ fontSize: '20px' }}>💡</span>
                <p style={{ margin: 0, fontSize: '14px', color: '#aaa' }}>
                    <strong style={{ color: '#4ade80' }}>Tip:</strong> Drag and drop categories using the <span style={{ fontSize: '16px' }}>⋮⋮</span> handle to reorder them. Changes will sync to the client app automatically.
                </p>
            </div>

            <div className="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Order</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((cat, index) => (
                            <tr
                                key={cat.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, cat)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, index)}
                                onDragEnd={handleDragEnd}
                                style={{
                                    opacity: draggedCategory?.id === cat.id ? 0.5 : 1,
                                    cursor: 'grab',
                                    backgroundColor: dragOverIndex === index ? 'rgba(74, 222, 128, 0.1)' : 'transparent',
                                    borderTop: dragOverIndex === index ? '2px solid #4ade80' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <td style={{ fontWeight: 600, color: 'var(--color-white)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{
                                            cursor: 'grab',
                                            fontSize: '18px',
                                            color: '#666',
                                            userSelect: 'none'
                                        }}>
                                            ⋮⋮
                                        </span>
                                        {cat.name}
                                    </div>
                                </td>
                                <td>{cat.order}</td>
                                <td>
                                    <div className="table-actions">
                                        <button className="btn-icon-small btn-edit" onClick={() => handleEdit(cat)}>✏️</button>
                                        <button className="btn-icon-small btn-delete" onClick={() => handleDelete(cat.id)}>🗑️</button>
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

export default CategoryManager;
