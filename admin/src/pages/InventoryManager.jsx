import React, { useState, useEffect } from 'react';
import { getMenuItems, updateMenuItem, getInventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem } from '../services/firebase';

const InventoryManager = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [activeTab, setActiveTab] = useState('menu'); // 'menu' or 'inventory'
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItem, setNewItem] = useState({
        name: '',
        category: 'Condiments',
        stockLevel: 0,
        unit: 'pieces',
        lowStockThreshold: 10,
        purchasePrice: 0,
        supplier: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const menu = await getMenuItems();
        const inventory = await getInventoryItems();
        setMenuItems(menu);
        setInventoryItems(inventory);
    };

    const updateMenuStock = async (id, stockLevel, inStock) => {
        const result = await updateMenuItem(id, { stockLevel, inStock });
        if (result.success) {
            fetchData();
        }
    };

    const updateInventoryStock = async (id, stockLevel) => {
        const result = await updateInventoryItem(id, { stockLevel });
        if (result.success) {
            fetchData();
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        const result = await addInventoryItem(newItem);
        if (result.success) {
            setShowAddModal(false);
            setNewItem({
                name: '',
                category: 'Condiments',
                stockLevel: 0,
                unit: 'pieces',
                lowStockThreshold: 10,
                purchasePrice: 0,
                supplier: ''
            });
            fetchData();
        }
    };

    const handleDeleteItem = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            const result = await deleteInventoryItem(id);
            if (result.success) {
                fetchData();
            }
        }
    };

    const getStockColor = (stock, threshold) => {
        if (stock <= threshold) return '#ff6b6b'; // Red
        if (stock <= threshold * 2) return '#FFB400'; // Yellow
        return '#4ade80'; // Green
    };

    const getStockPercentage = (stock, threshold) => {
        const max = threshold * 3;
        return Math.min((stock / max) * 100, 100);
    };

    const getCategoryIcon = (category) => {
        const icons = {
            'Condiments': '🧴',
            'Ingredients': '🧀',
            'Supplies': '📦',
            'Beverages': '🥤',
            'Other': '📋'
        };
        return icons[category] || '📋';
    };

    const InventoryCard = ({ item, onUpdate, onDelete, isMenuItem = false }) => {
        const stockColor = getStockColor(item.stockLevel || 0, item.lowStockThreshold || 10);
        const stockPercentage = getStockPercentage(item.stockLevel || 0, item.lowStockThreshold || 10);

        return (
            <div className="card" style={{ padding: 'var(--spacing-lg)', position: 'relative' }}>
                {!isMenuItem && (
                    <button
                        onClick={() => onDelete(item.id)}
                        style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            background: 'transparent',
                            border: 'none',
                            color: '#ff6b6b',
                            cursor: 'pointer',
                            fontSize: '20px'
                        }}
                    >
                        ×
                    </button>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                    <span style={{ fontSize: '32px' }}>
                        {isMenuItem ? '🍔' : getCategoryIcon(item.category)}
                    </span>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ color: 'var(--color-white)', margin: 0, fontSize: 'var(--font-size-lg)' }}>
                            {item.name}
                        </h3>
                        {!isMenuItem && (
                            <span style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: 'var(--font-size-sm)',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: 'var(--color-text-secondary)',
                                marginTop: '4px'
                            }}>
                                {item.category}
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                            Stock Level
                        </span>
                        <span style={{ color: stockColor, fontWeight: 'bold', fontSize: 'var(--font-size-sm)' }}>
                            {item.stockLevel || 0} {item.unit || 'units'}
                        </span>
                    </div>
                    <div style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: 'var(--color-medium-gray)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${stockPercentage}%`,
                            height: '100%',
                            backgroundColor: stockColor,
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                            onClick={() => onUpdate(item.id, Math.max(0, (item.stockLevel || 0) - 1), item.inStock)}
                            className="btn btn-secondary"
                            style={{ padding: '8px 16px', fontSize: '18px' }}
                        >
                            −
                        </button>
                        <span style={{
                            color: 'var(--color-white)',
                            fontWeight: 'bold',
                            fontSize: 'var(--font-size-xl)',
                            minWidth: '40px',
                            textAlign: 'center'
                        }}>
                            {item.stockLevel || 0}
                        </span>
                        <button
                            onClick={() => onUpdate(item.id, (item.stockLevel || 0) + 1, item.inStock)}
                            className="btn btn-primary"
                            style={{ padding: '8px 16px', fontSize: '18px' }}
                        >
                            +
                        </button>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                            Low Alert: {item.lowStockThreshold || 10}
                        </div>
                        {(item.stockLevel || 0) <= (item.lowStockThreshold || 10) && (
                            <div style={{ color: '#ff6b6b', fontSize: 'var(--font-size-sm)', fontWeight: 'bold' }}>
                                ⚠️ Low Stock
                            </div>
                        )}
                    </div>
                </div>

                {isMenuItem && (
                    <div style={{ marginTop: 'var(--spacing-md)', paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--color-medium-gray)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={item.inStock}
                                onChange={(e) => onUpdate(item.id, item.stockLevel, e.target.checked)}
                                style={{ width: '18px', height: '18px' }}
                            />
                            <span style={{ color: item.inStock ? '#4ade80' : '#ff6b6b', fontWeight: 'bold' }}>
                                {item.inStock ? 'In Stock' : 'Out of Stock'}
                            </span>
                        </label>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div>
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Inventory Management</h1>
                    <p className="admin-subtitle">Track and manage all inventory items</p>
                </div>
                {activeTab === 'inventory' && (
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowAddModal(true)}
                    >
                        + New Inventory Item
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
                <button
                    className={`btn ${activeTab === 'menu' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('menu')}
                >
                    🍔 Menu Items ({menuItems.length})
                </button>
                <button
                    className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('inventory')}
                >
                    📦 General Inventory ({inventoryItems.length})
                </button>
            </div>

            {/* Inventory Grid */}
            <div className="responsive-grid">
                {activeTab === 'menu' ? (
                    menuItems.length > 0 ? (
                        menuItems.map(item => (
                            <InventoryCard
                                key={item.id}
                                item={item}
                                onUpdate={updateMenuStock}
                                isMenuItem={true}
                            />
                        ))
                    ) : (
                        <p style={{ color: 'var(--color-text-secondary)' }}>No menu items found.</p>
                    )
                ) : (
                    inventoryItems.length > 0 ? (
                        inventoryItems.map(item => (
                            <InventoryCard
                                key={item.id}
                                item={item}
                                onUpdate={(id, stock) => updateInventoryStock(id, stock)}
                                onDelete={handleDeleteItem}
                                isMenuItem={false}
                            />
                        ))
                    ) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                                No inventory items yet. Add your first item!
                            </p>
                            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                                + Add Inventory Item
                            </button>
                        </div>
                    )
                )}
            </div>

            {/* Add Item Modal */}
            {showAddModal && (
                <>
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            zIndex: 999
                        }}
                        onClick={() => setShowAddModal(false)}
                    />
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'var(--color-dark-gray)',
                        padding: 'var(--spacing-xl)',
                        borderRadius: 'var(--radius-lg)',
                        zIndex: 1000,
                        width: '90%',
                        maxWidth: '500px',
                        border: '1px solid var(--color-medium-gray)'
                    }}>
                        <h2 style={{ color: 'var(--color-white)', marginBottom: 'var(--spacing-lg)' }}>
                            Add Inventory Item
                        </h2>
                        <form onSubmit={handleAddItem}>
                            <div className="form-group">
                                <label className="form-label">Item Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                    required
                                    placeholder="e.g., Ketchup Bottles"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select
                                    className="form-input"
                                    value={newItem.category}
                                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                >
                                    <option value="Condiments">🧴 Condiments</option>
                                    <option value="Ingredients">🧀 Ingredients</option>
                                    <option value="Supplies">📦 Supplies</option>
                                    <option value="Beverages">🥤 Beverages</option>
                                    <option value="Other">📋 Other</option>
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div className="form-group">
                                    <label className="form-label">Initial Stock</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={newItem.stockLevel}
                                        onChange={(e) => setNewItem({ ...newItem, stockLevel: parseInt(e.target.value) || 0 })}
                                        min="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Unit</label>
                                    <select
                                        className="form-input"
                                        value={newItem.unit}
                                        onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                                    >
                                        <option value="pieces">Pieces</option>
                                        <option value="bottles">Bottles</option>
                                        <option value="kg">Kilograms</option>
                                        <option value="liters">Liters</option>
                                        <option value="packs">Packs</option>
                                        <option value="boxes">Boxes</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Purchase Price (PKR)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={newItem.purchasePrice}
                                    onChange={(e) => setNewItem({ ...newItem, purchasePrice: parseFloat(e.target.value) || 0 })}
                                    min="0"
                                    step="0.01"
                                    placeholder="Price per unit"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Supplier</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newItem.supplier}
                                    onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                                    placeholder="e.g., Metro Cash & Carry"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Low Stock Threshold</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={newItem.lowStockThreshold}
                                    onChange={(e) => setNewItem({ ...newItem, lowStockThreshold: parseInt(e.target.value) || 10 })}
                                    min="1"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    Add Item
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowAddModal(false)}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
};

export default InventoryManager;
