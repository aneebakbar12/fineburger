import React, { useState, useEffect } from 'react';
import { getMenuItems, updateMenuItem } from '../services/firebase';

const InventoryManager = () => {
    const [items, setItems] = useState([]);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        const data = await getMenuItems();
        setItems(data);
    };

    const updateStock = async (id, stockLevel, inStock) => {
        const result = await updateMenuItem(id, { stockLevel, inStock });
        if (result.success) {
            fetchItems();
        }
    };

    return (
        <div>
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Inventory Management</h1>
                    <p className="admin-subtitle">Track and update stock levels</p>
                </div>
            </div>

            <div className="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Current Stock</th>
                            <th>Low Stock Alert</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id}>
                                <td style={{ fontWeight: 600, color: 'var(--color-white)' }}>{item.name}</td>
                                <td>
                                    <input
                                        type="number"
                                        value={item.stockLevel || 0}
                                        onChange={(e) => updateStock(item.id, parseInt(e.target.value), item.inStock)}
                                        style={{
                                            width: '80px',
                                            padding: '4px 8px',
                                            backgroundColor: 'var(--color-medium-gray)',
                                            color: 'var(--color-white)',
                                            border: '1px solid var(--color-light-gray)',
                                            borderRadius: 'var(--radius-sm)'
                                        }}
                                    />
                                </td>
                                <td>{item.lowStockThreshold || 10}</td>
                                <td>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="checkbox"
                                            checked={item.inStock}
                                            onChange={(e) => updateStock(item.id, item.stockLevel, e.target.checked)}
                                        />
                                        <span style={{ color: item.inStock ? '#4ade80' : '#ff6b6b' }}>
                                            {item.inStock ? 'In Stock' : 'Out of Stock'}
                                        </span>
                                    </label>
                                </td>
                                <td>
                                    {item.stockLevel <= item.lowStockThreshold && (
                                        <span style={{ color: '#ff6b6b', fontSize: 'var(--font-size-sm)' }}>⚠️ Low Stock</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InventoryManager;
