import React, { useState, useEffect } from 'react';
import { getCategories, getMenuItems } from '../services/firebase';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalCategories: 0,
        totalItems: 0,
        availableItems: 0,
        lowStockItems: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            const categories = await getCategories();
            const items = await getMenuItems();

            const availableItems = items.filter(item => item.available && item.inStock).length;
            const lowStockItems = items.filter(item =>
                item.stockLevel && item.lowStockThreshold &&
                item.stockLevel <= item.lowStockThreshold
            ).length;

            setStats({
                totalCategories: categories.length,
                totalItems: items.length,
                availableItems,
                lowStockItems
            });
        };

        fetchStats();
    }, []);

    return (
        <div>
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Dashboard</h1>
                    <p className="admin-subtitle">Welcome to Fine Burger Admin Panel</p>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-card">
                    <div className="dashboard-card-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                    </div>
                    <div className="dashboard-card-value">{stats.totalCategories}</div>
                    <div className="dashboard-card-label">Total Categories</div>
                </div>

                <div className="dashboard-card">
                    <div className="dashboard-card-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 7h-9M14 17H5M17 17h3M9 7H4M9 12h11" />
                        </svg>
                    </div>
                    <div className="dashboard-card-value">{stats.totalItems}</div>
                    <div className="dashboard-card-label">Total Menu Items</div>
                </div>

                <div className="dashboard-card">
                    <div className="dashboard-card-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <div className="dashboard-card-value">{stats.availableItems}</div>
                    <div className="dashboard-card-label">Available Items</div>
                </div>

                <div className="dashboard-card">
                    <div className="dashboard-card-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <div className="dashboard-card-value">{stats.lowStockItems}</div>
                    <div className="dashboard-card-label">Low Stock Alerts</div>
                </div>
            </div>

            <div className="admin-header">
                <div>
                    <h2 className="admin-title" style={{ fontSize: 'var(--font-size-2xl)' }}>Quick Actions</h2>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
                <button className="btn btn-primary" onClick={() => window.location.href = '/menu-items'}>
                    Add New Menu Item
                </button>
                <button className="btn btn-secondary" onClick={() => window.location.href = '/categories'}>
                    Manage Categories
                </button>
                <button className="btn btn-secondary" onClick={() => window.location.href = '/inventory'}>
                    Update Inventory
                </button>
                <button className="btn btn-secondary" onClick={() => window.location.href = '/settings'}>
                    Store Settings
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
