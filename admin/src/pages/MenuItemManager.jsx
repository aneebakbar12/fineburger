import React, { useState, useEffect } from 'react';
import {
    getMenuItems,
    getCategories,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    uploadImage
} from '../services/firebase';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import {
    SearchIcon,
    PlusIcon,
    EditIcon,
    TrashIcon,
    CloseIcon
} from '../components/Icons';

const MenuItemManager = () => {
    const toast = useToast();
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('all');

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
        try {
            const [itemsData, categoriesData] = await Promise.all([
                getMenuItems(),
                getCategories()
            ]);
            setItems(itemsData || []);
            setCategories(categoriesData || []);
        } catch (err) {
            toast.error('Failed to load menu data: ' + err.message);
        }
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
        if (!formData.name.trim()) {
            toast.error('Item name is required');
            return;
        }
        if (!formData.price || isNaN(formData.price)) {
            toast.error('Please enter a valid price');
            return;
        }

        setLoading(true);

        try {
            let imageUrl = formData.imageUrl;

            // Upload image if new file selected
            if (imageFile) {
                const uploadResult = await uploadImage(imageFile);
                if (uploadResult.success) {
                    imageUrl = uploadResult.url;
                } else {
                    toast.error('Image upload failed: ' + uploadResult.error);
                    setLoading(false);
                    return;
                }
            }

            const itemData = {
                ...formData,
                price: parseFloat(formData.price),
                stockLevel: parseInt(formData.stockLevel) || 0,
                lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
                imageUrl
            };

            let result;
            if (editingItem) {
                result = await updateMenuItem(editingItem.id, itemData);
            } else {
                result = await addMenuItem(itemData);
            }

            if (result.success) {
                toast.success(editingItem ? 'Item updated successfully!' : 'New item created successfully!');
                resetForm();
                fetchData();
            } else {
                toast.error('Error: ' + result.error);
            }
        } catch (error) {
            toast.error('Error: ' + error.message);
        }

        setLoading(false);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            ...item,
            stockLevel: item.stockLevel !== undefined ? item.stockLevel : 100,
            lowStockThreshold: item.lowStockThreshold !== undefined ? item.lowStockThreshold : 10
        });
        setImagePreview(item.imageUrl || '');
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            const result = await deleteMenuItem(itemToDelete.id);
            if (result.success) {
                toast.success(`"${itemToDelete.name}" was deleted successfully.`);
                fetchData();
            } else {
                toast.error('Error deleting item: ' + result.error);
            }
        } catch (err) {
            toast.error('Failed to delete item: ' + err.message);
        }
        setItemToDelete(null);
    };

    const handleToggleStock = async (item) => {
        const newStatus = item.inStock === false ? true : false;
        try {
            const result = await updateMenuItem(item.id, { inStock: newStatus });
            if (result.success) {
                toast.success(`"${item.name}" is now ${newStatus ? 'In Stock' : 'Sold Out'}`);
                fetchData();
            } else {
                toast.error('Failed to update stock: ' + result.error);
            }
        } catch (err) {
            toast.error('Error: ' + err.message);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            categoryId: categories[0]?.id || '',
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

    // Filtered Items
    const filteredItems = items.filter(item => {
        if (selectedCategoryId !== 'all' && item.categoryId !== selectedCategoryId) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return (item.name || '').toLowerCase().includes(q) ||
                   (item.description || '').toLowerCase().includes(q);
        }
        return true;
    });

    return (
        <div>
            {/* Header */}
            <div className="admin-header" style={{ padding: '20px 24px', marginBottom: '24px' }}>
                <div>
                    <h1 className="admin-title" style={{ fontSize: '24px' }}>Menu Management</h1>
                    <p className="admin-subtitle" style={{ fontSize: '13px', marginTop: '4px' }}>
                        Create, update, and manage your restaurant menu catalog ({items.length} items)
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        if (showForm) {
                            resetForm();
                        } else {
                            setShowForm(true);
                        }
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                    {showForm ? <CloseIcon width={18} height={18} /> : <PlusIcon width={18} height={18} />}
                    <span>{showForm ? 'Close Form' : 'Add New Item'}</span>
                </button>
            </div>

            {/* Form Section */}
            {showForm && (
                <div className="card" style={{
                    marginBottom: 'var(--spacing-2xl)',
                    padding: 'var(--spacing-xl)',
                    backgroundColor: 'var(--surface-card)',
                    border: '1px solid var(--surface-border)'
                }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-lg)', color: 'var(--text-primary)', fontWeight: 700 }}>
                        {editingItem ? `Edit: ${editingItem.name}` : 'Create New Menu Item'}
                    </h2>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-lg)' }}>
                            <div className="form-group">
                                <label className="form-label">Item Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Double Beef Smash Burger"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Category *</label>
                                <select
                                    className="form-select"
                                    value={formData.categoryId}
                                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Price (PKR) *</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="e.g. 750"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    min="0"
                                    step="1"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Stock Units</label>
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
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-textarea"
                                placeholder="Describe the ingredients, toppings, and taste profile..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                style={{ minHeight: '90px' }}
                            />
                        </div>

                        {/* Image Upload */}
                        <div className="form-group">
                            <label className="form-label">Item Image</label>
                            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Paste Image URL or upload below..."
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
                                display: 'block',
                                backgroundColor: 'rgba(255, 180, 0, 0.04)'
                            }}>
                                {imagePreview ? (
                                    <div className="image-preview" style={{ maxWidth: '240px', margin: '0 auto', borderRadius: '8px', overflow: 'hidden' }}>
                                        <img src={imagePreview} alt="Preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
                                        <div style={{ marginTop: '8px', color: 'var(--color-accent)', fontSize: '12px', fontWeight: 600 }}>
                                            Click to change image
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <p style={{ margin: '4px 0', color: 'var(--color-accent)', fontWeight: 700, fontSize: '14px' }}>
                                            Click to select photo from device
                                        </p>
                                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '12px' }}>
                                            Supports: JPG, PNG, WEBP (Max 5MB)
                                        </p>
                                    </div>
                                )}
                            </label>
                        </div>

                        {/* Variations */}
                        <div className="form-group">
                            <label className="form-label">Variations (Optional)</label>
                            {formData.variations.map((variation, vIndex) => (
                                <div key={vIndex} style={{
                                    backgroundColor: 'var(--surface-elevated)',
                                    padding: 'var(--spacing-md)',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: 'var(--spacing-md)'
                                }}>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-sm)' }}>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Variation name (e.g. Size, Patty Type)"
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
                                        style={{ marginTop: 'var(--spacing-xs)', fontSize: '12px' }}
                                    >
                                        + Add Option
                                    </button>
                                </div>
                            ))}
                            <button type="button" className="btn btn-secondary" onClick={addVariation} style={{ fontSize: '13px' }}>
                                + Add Variation
                            </button>
                        </div>

                        {/* Checkboxes */}
                        <div style={{ display: 'flex', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.available}
                                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                                />
                                Available on Menu
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', color: 'var(--text-primary)', cursor: 'pointer' }}>
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
                                {loading ? 'Saving Item...' : (editingItem ? 'Update Menu Item' : 'Add Menu Item')}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filter Toolbar */}
            <div className="admin-filter-bar">
                <div className="filter-tabs-wrapper">
                    <button
                        className={`filter-tab-pill ${selectedCategoryId === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedCategoryId('all')}
                    >
                        <span>All Items</span>
                        <span className="filter-tab-count">{items.length}</span>
                    </button>
                    {categories.map(c => {
                        const count = items.filter(i => i.categoryId === c.id).length;
                        return (
                            <button
                                key={c.id}
                                className={`filter-tab-pill ${selectedCategoryId === c.id ? 'active' : ''}`}
                                onClick={() => setSelectedCategoryId(c.id)}
                            >
                                <span>{c.name}</span>
                                <span className="filter-tab-count">{count}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="filter-search-box">
                    <SearchIcon width={16} height={16} stroke="var(--text-muted)" />
                    <input
                        type="text"
                        className="filter-search-input"
                        placeholder="Search menu items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                        >
                            <CloseIcon width={14} height={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Menu Items Table */}
            <div className="data-table" style={{ border: '1px solid var(--surface-border)' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                    No menu items found. {searchQuery && 'Try adjusting your search.'}
                                </td>
                            </tr>
                        ) : (
                            filteredItems.map(item => {
                                const category = categories.find(c => c.id === item.categoryId);
                                const isLowStock = item.stockLevel <= (item.lowStockThreshold || 10);
                                const isOutOfStock = !item.inStock || item.stockLevel === 0;

                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '8px',
                                                    backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : 'none',
                                                    backgroundColor: 'var(--surface-elevated)',
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    flexShrink: 0
                                                }} />
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                                                        {item.name}
                                                    </div>
                                                    {item.description && (
                                                        <div style={{ color: 'var(--text-muted)', fontSize: '12px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {item.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '4px',
                                                backgroundColor: 'var(--surface-elevated)',
                                                color: 'var(--text-secondary)',
                                                fontSize: '12px'
                                            }}>
                                                {category?.name || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
                                            Rs. {item.price}
                                        </td>
                                        <td>
                                            <span style={{
                                                fontWeight: 600,
                                                color: isOutOfStock ? '#ef4444' : (isLowStock ? '#f59e0b' : 'var(--text-primary)')
                                            }}>
                                                {item.stockLevel !== undefined ? item.stockLevel : 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleStock(item)}
                                                style={{
                                                    padding: '5px 12px',
                                                    borderRadius: '4px',
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    border: 'none',
                                                    backgroundColor: item.inStock !== false ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                    color: item.inStock !== false ? '#10b981' : '#ef4444',
                                                    transition: 'all 0.15s ease',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                                title="Click to toggle In Stock / Sold Out instantly"
                                            >
                                                <span>{item.inStock !== false ? '●' : '○'}</span>
                                                <span>{item.inStock !== false ? 'In Stock' : 'Sold Out'}</span>
                                            </button>
                                        </td>
                                        <td>
                                            <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                                                <button
                                                    className="btn-icon-small btn-edit"
                                                    onClick={() => handleEdit(item)}
                                                    title="Edit item"
                                                    aria-label={`Edit ${item.name}`}
                                                >
                                                    <EditIcon width={16} height={16} />
                                                </button>
                                                <button
                                                    className="btn-icon-small btn-delete"
                                                    onClick={() => setItemToDelete(item)}
                                                    title="Delete item"
                                                    aria-label={`Delete ${item.name}`}
                                                >
                                                    <TrashIcon width={16} height={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={!!itemToDelete}
                title="Delete Menu Item"
                message={`Are you sure you want to permanently remove "${itemToDelete?.name}" from your menu?`}
                confirmText="Yes, Delete Item"
                cancelText="Cancel"
                isDanger={true}
                onConfirm={confirmDelete}
                onCancel={() => setItemToDelete(null)}
            />
        </div>
    );
};

export default MenuItemManager;
