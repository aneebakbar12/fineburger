import React, { useState, useEffect } from 'react';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../services/firebase';

const CategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', order: 1 });

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
                        {categories.map(cat => (
                            <tr key={cat.id}>
                                <td style={{ fontWeight: 600, color: 'var(--color-white)' }}>{cat.name}</td>
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
