import React, { useState, useEffect } from 'react';
import { getMenuItems, getCategories, addMenuItem, updateMenuItem, deleteMenuItem, uploadImage } from '../services/firebase';

const MenuItemManager = () => {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        imageUrl: '',
        variations: [],
        available: true,
        inStock: true,
        stockLevel: 100,
        lowStockThreshold: 10
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const [itemsData, categoriesData] = await Promise.all([
            getMenuItems(),
            getCategories()
        ]);
        setItems(itemsData);
        setCategories(categoriesData);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = formData.imageUrl;

            // Upload image if new file selected
            if (imageFile) {
                const uploadResult = await uploadImage(imageFile);
                if (uploadResult.success) {
                    imageUrl = uploadResult.url;
                } else {
                    alert('Image upload failed: ' + uploadResult.error);
                    setLoading(false);
                    return;
                }
            }

            const itemData = {
                ...formData,
                price: parseFloat(formData.price),
                stockLevel: parseInt(formData.stockLevel),
                lowStockThreshold: parseInt(formData.lowStockThreshold),
                imageUrl
            };

            let result;
            if (editingItem) {
                result = await updateMenuItem(editingItem.id, itemData);
            } else {
                result = await addMenuItem(itemData);
            }

            if (result.success) {
                alert(editingItem ? 'Item updated successfully!' : 'Item added successfully!');
                resetForm();
                fetchData();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }

        setLoading(false);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData(item);
        setImagePreview(item.imageUrl);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            const result = await deleteMenuItem(id);
            if (result.success) {
                alert('Item deleted successfully!');
                fetchData();
            } else {
                alert('Error deleting item: ' + result.error);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            categoryId: '',
            imageUrl: '',
            variations: [],
            available: true,
            inStock: true,
            stockLevel: 100,
            lowStockThreshold: 10
        });
        setImageFile(null);
        setImagePreview('');
        setEditingItem(null);
        setShowForm(false);
    };

    const addVariation = () => {
        setFormData({
            ...formData,
            variations: [...formData.variations, { name: '', options: [''] }]
        });
    };

    const updateVariation = (index, field, value) => {
        const newVariations = [...formData.variations];
        newVariations[index][field] = value;
        setFormData({ ...formData, variations: newVariations });
    };

    const addVariationOption = (variationIndex) => {
        const newVariations = [...formData.variations];
        newVariations[variationIndex].options.push('');
        setFormData({ ...formData, variations: newVariations });
    };

    const updateVariationOption = (variationIndex, optionIndex, value) => {
        const newVariations = [...formData.variations];
        newVariations[variationIndex].options[optionIndex] = value;
        setFormData({ ...formData, variations: newVariations });
    };

    const removeVariation = (index) => {
        const newVariations = formData.variations.filter((_, i) => i !== index);
        setFormData({ ...formData, variations: newVariations });
    };

    return (
        <div>
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Menu Items</h1>
                    <p className="admin-subtitle">Manage your restaurant menu items</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ Add New Item'}
                </button>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: 'var(--spacing-2xl)', padding: 'var(--spacing-xl)' }}>
                    <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-lg)', color: 'var(--color-white)' }}>
                        {editingItem ? 'Edit Item' : 'Add New Item'}
                    </h2>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                            <div className="form-group">
                                <label className="form-label">Item Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Price (Rs.) *</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-textarea"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe your menu item..."
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                            <div className="form-group">
                                <label className="form-label">Category *</label>
                                <select
                                    className="form-select"
                                    value={formData.categoryId}
                                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Stock Level</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.stockLevel}
                                    onChange={(e) => setFormData({ ...formData, stockLevel: e.target.value })}
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Item Image</label>

                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter Image URL (or upload below)"
                                    value={formData.imageUrl}
                                    onChange={(e) => {
                                        setFormData({ ...formData, imageUrl: e.target.value });
                                        setImagePreview(e.target.value);
                                    }}
                                />
                            </div>

                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                                id="image-upload"
                            />
                            <label htmlFor="image-upload" className="image-upload-container" style={{
                                cursor: 'pointer',
                                border: '2px dashed var(--color-accent)',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--spacing-lg)',
                                textAlign: 'center',
                                transition: 'all 0.3s ease',
                                backgroundColor: 'rgba(255, 200, 87, 0.05)'
                            }}>
                                {imagePreview ? (
                                    <div className="image-preview" style={{
                                        maxWidth: '300px',
                                        margin: '0 auto',
                                        borderRadius: 'var(--radius-md)',
                                        overflow: 'hidden'
                                    }}>
                                        <img src={imagePreview} alt="Preview" style={{ width: '100%', height: 'auto', display: 'block' }} onError={(e) => e.target.src = 'https://via.placeholder.com/300?text=Invalid+Image+URL'} />
                                        <div style={{ marginTop: 'var(--spacing-sm)', color: 'var(--color-accent)', fontSize: 'var(--font-size-sm)' }}>
                                            Click to change image
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                        <p style={{ marginTop: 'var(--spacing-sm)', color: 'var(--color-accent)', fontWeight: 'bold', fontSize: 'var(--font-size-md)' }}>
                                            📁 Click to upload image from your computer
                                        </p>
                                        <p style={{ marginTop: 'var(--spacing-xs)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                            Supports: JPG, PNG, GIF (Max 5MB)
                                        </p>
                                    </div>
                                )}
                            </label>
                            {imageFile && <p style={{ marginTop: 'var(--spacing-xs)', color: '#4ade80', fontSize: 'var(--font-size-sm)', fontWeight: 'bold' }}>✅ Selected: {imageFile.name}</p>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Variations (Optional)</label>
                            {formData.variations.map((variation, vIndex) => (
                                <div key={vIndex} style={{
                                    backgroundColor: 'var(--color-medium-gray)',
                                    padding: 'var(--spacing-md)',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: 'var(--spacing-md)'
                                }}>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-sm)' }}>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Variation name (e.g., Size)"
                                            value={variation.name}
                                            onChange={(e) => updateVariation(vIndex, 'name', e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-delete"
                                            onClick={() => removeVariation(vIndex)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    {variation.options.map((option, oIndex) => (
                                        <input
                                            key={oIndex}
                                            type="text"
                                            className="form-input"
                                            placeholder={`Option ${oIndex + 1}`}
                                            value={option}
                                            onChange={(e) => updateVariationOption(vIndex, oIndex, e.target.value)}
                                            style={{ marginBottom: 'var(--spacing-xs)' }}
                                        />
                                    ))}
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => addVariationOption(vIndex)}
                                        style={{ marginTop: 'var(--spacing-xs)' }}
                                    >
                                        + Add Option
                                    </button>
                                </div>
                            ))}
                            <button type="button" className="btn btn-secondary" onClick={addVariation}>
                                + Add Variation
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', color: 'var(--color-white)' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.available}
                                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                                />
                                Available
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', color: 'var(--color-white)' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.inStock}
                                    onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                                />
                                In Stock
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Saving...' : (editingItem ? 'Update Item' : 'Add Item')}
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
                            <th>Image</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => {
                            const category = categories.find(c => c.id === item.categoryId);
                            return (
                                <tr key={item.id}>
                                    <td>
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            borderRadius: 'var(--radius-md)',
                                            backgroundImage: `url(${item.imageUrl})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        }} />
                                    </td>
                                    <td style={{ fontWeight: 600, color: 'var(--color-white)' }}>{item.name}</td>
                                    <td>{category?.name || 'N/A'}</td>
                                    <td style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Rs. {item.price}</td>
                                    <td>{item.stockLevel || 'N/A'}</td>
                                    <td>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: 'var(--font-size-xs)',
                                            fontWeight: 600,
                                            backgroundColor: item.available && item.inStock ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)',
                                            color: item.available && item.inStock ? '#4ade80' : '#ff6b6b'
                                        }}>
                                            {item.available && item.inStock ? 'Available' : 'Unavailable'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="btn-icon-small btn-edit" onClick={() => handleEdit(item)}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                            <button className="btn-icon-small btn-delete" onClick={() => handleDelete(item.id)}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MenuItemManager;
