import React, { useState, useEffect, useRef } from 'react';
import {
    getMenuItems,
    updateMenuItem,
    getInventoryItems,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    recordWasteLog,
    subscribeToWasteLogs
} from '../services/firebase';
import { useToast } from '../context/ToastContext';

const InventoryManager = () => {
    const toast = useToast();
    const [menuItems, setMenuItems] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [wasteLogs, setWasteLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'inventory', or 'waste'
    const [showAddModal, setShowAddModal] = useState(false);
    const [showWasteModal, setShowWasteModal] = useState(false);

    const [newItem, setNewItem] = useState({
        name: '',
        category: 'Ingredients',
        stockLevel: 0,
        unit: 'pieces',
        lowStockThreshold: 10,
        purchasePrice: 0,
        supplier: ''
    });

    const [wasteForm, setWasteForm] = useState({
        inventoryItemId: '',
        quantity: 1,
        reason: 'Burnt / Overcooked',
        notes: ''
    });
    const [isSubmittingWaste, setIsSubmittingWaste] = useState(false);

    // Refs for debouncing updates
    const updateTimeouts = useRef({});

    useEffect(() => {
        fetchData();
        const unsubscribeWaste = subscribeToWasteLogs(setWasteLogs);

        return () => {
            Object.values(updateTimeouts.current).forEach(timeout => clearTimeout(timeout));
            unsubscribeWaste();
        };
    }, []);

    const fetchData = async () => {
        const [menu, inventory] = await Promise.all([
            getMenuItems(),
            getInventoryItems()
        ]);
        setMenuItems(menu || []);
        setInventoryItems(inventory || []);
        if (inventory && inventory.length > 0 && !wasteForm.inventoryItemId) {
            setWasteForm(prev => ({ ...prev, inventoryItemId: inventory[0].id }));
        }
    };

    const updateMenuStock = (id, stockLevel, inStock) => {
        setMenuItems(prevWrapper => prevWrapper.map(item =>
            item.id === id ? { ...item, stockLevel, inStock } : item
        ));

        if (updateTimeouts.current[id]) {
            clearTimeout(updateTimeouts.current[id]);
        }

        updateTimeouts.current[id] = setTimeout(async () => {
            await updateMenuItem(id, { stockLevel, inStock });
            delete updateTimeouts.current[id];
        }, 800);
    };

    const updateInventoryStock = (id, stockLevel) => {
        setInventoryItems(prevWrapper => prevWrapper.map(item =>
            item.id === id ? { ...item, stockLevel } : item
        ));

        if (updateTimeouts.current[`inv_${id}`]) {
            clearTimeout(updateTimeouts.current[`inv_${id}`]);
        }

        updateTimeouts.current[`inv_${id}`] = setTimeout(async () => {
            await updateInventoryItem(id, { stockLevel });
            delete updateTimeouts.current[`inv_${id}`];
        }, 800);
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        const result = await addInventoryItem(newItem);
        if (result.success) {
            setShowAddModal(false);
            setNewItem({
                name: '',
                category: 'Ingredients',
                stockLevel: 0,
                unit: 'pieces',
                lowStockThreshold: 10,
                purchasePrice: 0,
                supplier: ''
            });
            toast.success('Inventory item created successfully!');
            fetchData();
        } else {
            toast.error('Failed to add item: ' + result.error);
        }
    };

    const handleDeleteItem = async (id) => {
        if (window.confirm('Are you sure you want to delete this inventory item?')) {
            const result = await deleteInventoryItem(id);
            if (result.success) {
                toast.success('Item deleted.');
                fetchData();
            } else {
                toast.error('Failed to delete item: ' + result.error);
            }
        }
    };

    const handleRecordWaste = async (e) => {
        e.preventDefault();
        if (!wasteForm.inventoryItemId) {
            toast.error('Please select an inventory item');
            return;
        }

        const qty = parseFloat(wasteForm.quantity);
        if (isNaN(qty) || qty <= 0) {
            toast.error('Please enter a valid quantity greater than 0');
            return;
        }

        setIsSubmittingWaste(true);
        const res = await recordWasteLog({
            ...wasteForm,
            quantity: qty
        });
        setIsSubmittingWaste(false);

        if (res.success) {
            toast.success(`Waste logged: ${qty} units. Stock deducted & loss recorded: Rs. ${res.totalLoss}`);
            setShowWasteModal(false);
            setWasteForm({
                inventoryItemId: inventoryItems[0]?.id || '',
                quantity: 1,
                reason: 'Burnt / Overcooked',
                notes: ''
            });
            fetchData();
        } else {
            toast.error('Failed to record waste: ' + res.error);
        }
    };

    const getStockColor = (stock, threshold) => {
        if (stock <= threshold) return '#ff6b6b';
        if (stock <= threshold * 2) return '#FFB400';
        return '#4ade80';
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

    const selectedWasteInvItem = inventoryItems.find(i => i.id === wasteForm.inventoryItemId);
    const estimatedLoss = selectedWasteInvItem
        ? Math.round((Number(selectedWasteInvItem.purchasePrice) || 0) * (Number(wasteForm.quantity) || 0))
        : 0;

    const totalLossSum = wasteLogs.reduce((sum, w) => sum + (Number(w.totalLoss) || 0), 0);

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
                        title="Delete item"
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

                {/* Stock Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => {
                            const newStock = Math.max(0, (item.stockLevel || 0) - 1);
                            if (isMenuItem) {
                                onUpdate(item.id, newStock, newStock > 0 ? item.inStock : false);
                            } else {
                                onUpdate(item.id, newStock);
                            }
                        }}
                        style={{ padding: '4px 12px' }}
                    >
                        -
                    </button>
                    <input
                        type="number"
                        className="form-input"
                        value={item.stockLevel || 0}
                        onChange={(e) => {
                            const newStock = Math.max(0, parseInt(e.target.value) || 0);
                            if (isMenuItem) {
                                onUpdate(item.id, newStock, newStock > 0 ? item.inStock : false);
                            } else {
                                onUpdate(item.id, newStock);
                            }
                        }}
                        style={{ textAlign: 'center', width: '80px', padding: '6px' }}
                        min="0"
                    />
                    <button
                        className="btn btn-secondary"
                        onClick={() => {
                            const newStock = (item.stockLevel || 0) + 1;
                            if (isMenuItem) {
                                onUpdate(item.id, newStock, item.inStock);
                            } else {
                                onUpdate(item.id, newStock);
                            }
                        }}
                        style={{ padding: '4px 12px' }}
                    >
                        +
                    </button>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginLeft: 'auto' }}>
                        Min: {item.lowStockThreshold || 10}
                    </span>
                </div>

                {/* Menu Item Specific: In Stock Toggle */}
                {isMenuItem && (
                    <div style={{ borderTop: '1px solid var(--color-medium-gray)', paddingTop: 'var(--spacing-sm)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={item.inStock !== false}
                                onChange={(e) => onUpdate(item.id, item.stockLevel || 0, e.target.checked)}
                            />
                            <span style={{ color: item.inStock !== false ? '#4ade80' : '#ff6b6b', fontWeight: 'bold', fontSize: '13px' }}>
                                {item.inStock !== false ? 'In Stock' : 'Sold Out'}
                            </span>
                        </label>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div>
            <div className="admin-header" style={{ padding: '20px 24px', marginBottom: '20px' }}>
                <div>
                    <h1 className="admin-title" style={{ fontSize: '24px' }}>Inventory & Kitchen Spoilage</h1>
                    <p className="admin-subtitle" style={{ fontSize: '13px', marginTop: '4px' }}>
                        Track raw ingredients, menu item stock, packaging, and record kitchen wastage
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowWasteModal(true)}
                        style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            borderColor: '#ef4444',
                            color: '#ef4444',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <span>🗑️</span> Record Kitchen Waste
                    </button>
                    {activeTab === 'inventory' && (
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowAddModal(true)}
                        >
                            + New Inventory Item
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap' }}>
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
                    📦 Raw Ingredients & Supplies ({inventoryItems.length})
                </button>
                <button
                    className={`btn ${activeTab === 'waste' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('waste')}
                >
                    📋 Waste & Spoilage Log ({wasteLogs.length})
                </button>
            </div>

            {/* Tab Views */}
            {activeTab === 'waste' ? (
                <div>
                    {/* Waste KPIs */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '16px',
                        marginBottom: '24px'
                    }}>
                        <div className="card" style={{ padding: '16px 20px', backgroundColor: 'var(--surface-card)', border: '1px solid var(--surface-border)' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                                Total Waste Incidents
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                                {wasteLogs.length} Records
                            </div>
                        </div>

                        <div className="card" style={{ padding: '16px 20px', backgroundColor: 'var(--surface-card)', border: '1px solid var(--surface-border)' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                                Total Estimated Financial Loss
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
                                Rs. {totalLossSum.toLocaleString()}
                            </div>
                        </div>

                        <div className="card" style={{ padding: '16px 20px', backgroundColor: 'var(--surface-card)', border: '1px solid var(--surface-border)' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                                Quick Action
                            </div>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => setShowWasteModal(true)}
                                style={{ marginTop: '8px', width: '100%', fontSize: '13px' }}
                            >
                                + Record Spoilage Now
                            </button>
                        </div>
                    </div>

                    {/* Waste History Table */}
                    <div className="data-table" style={{ border: '1px solid var(--surface-border)' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Date / Time</th>
                                    <th>Item & Category</th>
                                    <th>Quantity Lost</th>
                                    <th>Reason</th>
                                    <th>Est. Loss (PKR)</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {wasteLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                            No kitchen waste recorded yet. Excellent job keeping waste to zero!
                                        </td>
                                    </tr>
                                ) : (
                                    wasteLogs.map((log) => {
                                        const dateStr = log.createdAt?.seconds
                                            ? new Date(log.createdAt.seconds * 1000).toLocaleString()
                                            : 'Just now';

                                        return (
                                            <tr key={log.id}>
                                                <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                                                    {dateStr}
                                                </td>
                                                <td>
                                                    <strong style={{ color: 'var(--text-primary)' }}>{log.itemName}</strong>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                        {log.category || 'Kitchen Ingredient'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: 700, color: '#ff6b6b' }}>
                                                        {log.quantity} {log.unit || 'units'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        padding: '3px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                                        color: '#ef4444'
                                                    }}>
                                                        {log.reason}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 800, color: '#ef4444' }}>
                                                    Rs. {log.totalLoss || 0}
                                                </td>
                                                <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                                    {log.notes || '—'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Inventory Grid */
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
            )}

            {/* Record Waste / Spoilage Modal */}
            {showWasteModal && (
                <>
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            zIndex: 999
                        }}
                        onClick={() => setShowWasteModal(false)}
                    />
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'var(--surface-card, #1a1e28)',
                        padding: '24px',
                        borderRadius: 'var(--radius-lg, 12px)',
                        zIndex: 1000,
                        width: '90%',
                        maxWidth: '480px',
                        border: '1px solid #ef4444',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                    }}>
                        <h2 style={{ color: '#ef4444', margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800 }}>
                            🗑️ Record Kitchen Spoilage / Wastage
                        </h2>
                        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            Deducts from inventory immediately and logs financial loss.
                        </p>

                        <form onSubmit={handleRecordWaste}>
                            <div className="form-group" style={{ marginBottom: '14px' }}>
                                <label className="form-label">Ingredient / Item *</label>
                                <select
                                    className="form-input"
                                    value={wasteForm.inventoryItemId}
                                    onChange={(e) => setWasteForm({ ...wasteForm, inventoryItemId: e.target.value })}
                                    required
                                >
                                    {inventoryItems.map(inv => (
                                        <option key={inv.id} value={inv.id}>
                                            {inv.name} ({inv.stockLevel} {inv.unit} in stock · Rs. {inv.purchasePrice || 0}/unit)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                                <div className="form-group">
                                    <label className="form-label">Quantity Wasted *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={wasteForm.quantity}
                                        onChange={(e) => setWasteForm({ ...wasteForm, quantity: e.target.value })}
                                        min="0.1"
                                        step="any"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Unit</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={selectedWasteInvItem?.unit || 'pieces'}
                                        disabled
                                        style={{ opacity: 0.7 }}
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '14px' }}>
                                <label className="form-label">Reason for Spoilage *</label>
                                <select
                                    className="form-input"
                                    value={wasteForm.reason}
                                    onChange={(e) => setWasteForm({ ...wasteForm, reason: e.target.value })}
                                    required
                                >
                                    <option value="Burnt / Overcooked">🍳 Burnt / Overcooked</option>
                                    <option value="Dropped / Spilled">💥 Dropped / Spilled</option>
                                    <option value="Expired / Stale">⏰ Expired / Stale</option>
                                    <option value="Preparation Mistake">⚠️ Preparation Mistake</option>
                                    <option value="Quality / Taste Rejection">👎 Quality / Taste Rejection</option>
                                    <option value="Other">📝 Other</option>
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label className="form-label">Staff / Kitchen Note (Optional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Griddle flareup, dropped by prep staff"
                                    value={wasteForm.notes}
                                    onChange={(e) => setWasteForm({ ...wasteForm, notes: e.target.value })}
                                />
                            </div>

                            {/* Cost Preview */}
                            <div style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                borderRadius: '8px',
                                padding: '10px 14px',
                                marginBottom: '16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Estimated Financial Loss:</span>
                                <span style={{ fontSize: '16px', fontWeight: 800, color: '#ef4444' }}>Rs. {estimatedLoss}</span>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 1, backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#fff' }}
                                    disabled={isSubmittingWaste}
                                >
                                    {isSubmittingWaste ? 'Deducting...' : 'Deduct & Record Waste'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowWasteModal(false)}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}

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
                                    placeholder="e.g., Ketchup Bottles, Burger Buns"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select
                                    className="form-input"
                                    value={newItem.category}
                                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                >
                                    <option value="Ingredients">🧀 Ingredients (Buns, Patties, Cheese)</option>
                                    <option value="Condiments">🧴 Condiments (Sauces, Dips)</option>
                                    <option value="Supplies">📦 Supplies (Boxes, Bags, Foil)</option>
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
