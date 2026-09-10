import React, { useState, useEffect } from 'react';
import { subscribeToOrders } from '../services/firebase';
import {
    getBestSellingItems,
    getRevenueByDay,
    getRevenueByMonth,
    getOrdersByDateRange,
    getDateRangePreset,
    getOrderStats
} from '../services/analytics';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Reports = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [dateFilter, setDateFilter] = useState('month');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [stats, setStats] = useState(null);
    const [bestSellers, setBestSellers] = useState([]);
    const [revenueByDay, setRevenueByDay] = useState([]);
    const [revenueByMonth, setRevenueByMonth] = useState([]);

    useEffect(() => {
        const unsubscribe = subscribeToOrders((newOrders) => {
            setOrders(newOrders);
            applyFilters(newOrders, dateFilter);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        applyFilters(orders, dateFilter);
    }, [dateFilter, customStartDate, customEndDate]);

    const applyFilters = (allOrders, filter) => {
        let filtered = allOrders;

        if (filter === 'custom' && customStartDate && customEndDate) {
            filtered = getOrdersByDateRange(allOrders, customStartDate, customEndDate);
        } else if (filter !== 'all') {
            const { startDate, endDate } = getDateRangePreset(filter);
            filtered = getOrdersByDateRange(allOrders, startDate, endDate);
        }

        setFilteredOrders(filtered);
        setStats(getOrderStats(filtered));
        setBestSellers(getBestSellingItems(filtered, 10));
        // Pass allOrders to time-series historical charts so trailing 7-day and 6-month trends remain intact
        setRevenueByDay(getRevenueByDay(allOrders, 7));
        setRevenueByMonth(getRevenueByMonth(allOrders, 6));
    };

    const formatCurrency = (amount) => `Rs. ${amount.toLocaleString()}`;

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div>
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Reports & Analytics</h1>
                    <p className="admin-subtitle">Comprehensive store performance insights</p>
                </div>
            </div>

            {/* Date Filters */}
            <div className="card" style={{ marginBottom: 'var(--spacing-xl)', padding: 'var(--spacing-lg)' }}>
                <h3 style={{ color: 'var(--color-white)', marginBottom: 'var(--spacing-md)' }}>Date Range</h3>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                        className={`btn ${dateFilter === 'today' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setDateFilter('today')}
                    >
                        Today
                    </button>
                    <button
                        className={`btn ${dateFilter === 'week' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setDateFilter('week')}
                    >
                        Last 7 Days
                    </button>
                    <button
                        className={`btn ${dateFilter === 'month' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setDateFilter('month')}
                    >
                        Last 30 Days
                    </button>
                    <button
                        className={`btn ${dateFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setDateFilter('all')}
                    >
                        All Time
                    </button>
                    <button
                        className={`btn ${dateFilter === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setDateFilter('custom')}
                    >
                        Custom Range
                    </button>

                    {dateFilter === 'custom' && (
                        <>
                            <input
                                type="date"
                                className="form-input"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                style={{ width: 'auto' }}
                            />
                            <span style={{ color: 'var(--color-white)' }}>to</span>
                            <input
                                type="date"
                                className="form-input"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                style={{ width: 'auto' }}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Revenue Summary Cards */}
            {stats && (
                <div className="dashboard-grid" style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <div className="dashboard-card">
                        <div className="dashboard-card-icon">💰</div>
                        <div className="dashboard-card-value">{formatCurrency(stats.totalRevenue)}</div>
                        <div className="dashboard-card-label">Total Revenue</div>
                    </div>
                    <div className="dashboard-card">
                        <div className="dashboard-card-icon">📦</div>
                        <div className="dashboard-card-value">{stats.totalOrders}</div>
                        <div className="dashboard-card-label">Total Orders</div>
                    </div>
                    <div className="dashboard-card">
                        <div className="dashboard-card-icon">📊</div>
                        <div className="dashboard-card-value">{formatCurrency(stats.averageOrderValue)}</div>
                        <div className="dashboard-card-label">Avg Order Value</div>
                    </div>
                    <div className="dashboard-card">
                        <div className="dashboard-card-icon">📈</div>
                        <div className="dashboard-card-value">{formatCurrency(stats.todayRevenue)}</div>
                        <div className="dashboard-card-label">Today's Revenue</div>
                    </div>
                </div>
            )}

            {/* Revenue Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xl)' }}>
                {/* Daily Revenue Chart */}
                <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                    <h3 style={{ color: 'var(--color-white)', marginBottom: 'var(--spacing-lg)' }}>Revenue by Day (Last 7 Days)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueByDay}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="dateLabel" stroke="#888" />
                            <YAxis stroke="#888" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '8px' }}
                                labelStyle={{ color: '#fff' }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#4ade80" strokeWidth={2} name="Revenue (Rs.)" />
                            <Line type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={2} name="Orders" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Monthly Revenue Chart */}
                <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                    <h3 style={{ color: 'var(--color-white)', marginBottom: 'var(--spacing-lg)' }}>Revenue by Month</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueByMonth}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="month" stroke="#888" />
                            <YAxis stroke="#888" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '8px' }}
                                labelStyle={{ color: '#fff' }}
                            />
                            <Legend />
                            <Bar dataKey="revenue" fill="#4ade80" name="Revenue (Rs.)" />
                            <Bar dataKey="orders" fill="#3B82F6" name="Orders" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Best Selling Items */}
            <div className="card" style={{ marginBottom: 'var(--spacing-xl)', padding: 'var(--spacing-lg)' }}>
                <h3 style={{ color: 'var(--color-white)', marginBottom: 'var(--spacing-lg)' }}>Best Selling Items</h3>
                {bestSellers.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--color-medium-gray)' }}>
                                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', color: 'var(--color-text-secondary)' }}>Rank</th>
                                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', color: 'var(--color-text-secondary)' }}>Item Name</th>
                                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'right', color: 'var(--color-text-secondary)' }}>Quantity Sold</th>
                                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'right', color: 'var(--color-text-secondary)' }}>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bestSellers.map((item, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid var(--color-medium-gray)' }}>
                                        <td style={{ padding: 'var(--spacing-md)', color: 'var(--color-white)' }}>#{index + 1}</td>
                                        <td style={{ padding: 'var(--spacing-md)', color: 'var(--color-white)', fontWeight: 'bold' }}>{item.name}</td>
                                        <td style={{ padding: 'var(--spacing-md)', textAlign: 'right', color: 'var(--color-accent)' }}>{item.quantity}</td>
                                        <td style={{ padding: 'var(--spacing-md)', textAlign: 'right', color: 'var(--color-accent)' }}>{formatCurrency(item.revenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ color: 'var(--color-text-secondary)' }}>No sales data available for the selected period.</p>
                )}
            </div>

            {/* Orders List */}
            <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                <h3 style={{ color: 'var(--color-white)', marginBottom: 'var(--spacing-lg)' }}>
                    Orders ({filteredOrders.length})
                </h3>
                {filteredOrders.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--color-medium-gray)' }}>
                                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', color: 'var(--color-text-secondary)' }}>Order ID</th>
                                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', color: 'var(--color-text-secondary)' }}>Date</th>
                                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', color: 'var(--color-text-secondary)' }}>Customer</th>
                                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Status</th>
                                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'right', color: 'var(--color-text-secondary)' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} style={{ borderBottom: '1px solid var(--color-medium-gray)' }}>
                                        <td style={{ padding: 'var(--spacing-md)', color: 'var(--color-white)', fontFamily: 'monospace' }}>
                                            #{order.id.slice(0, 8).toUpperCase()}
                                        </td>
                                        <td style={{ padding: 'var(--spacing-md)', color: 'var(--color-white)' }}>
                                            {formatDate(order.createdAt)}
                                        </td>
                                        <td style={{ padding: 'var(--spacing-md)', color: 'var(--color-white)' }}>
                                            {order.customer?.name || 'N/A'}
                                        </td>
                                        <td style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: 'var(--radius-sm)',
                                                fontSize: 'var(--font-size-sm)',
                                                textTransform: 'uppercase',
                                                fontWeight: 'bold',
                                                backgroundColor:
                                                    order.status === 'pending' ? 'rgba(255, 180, 0, 0.2)' :
                                                        order.status === 'preparing' ? 'rgba(59, 130, 246, 0.2)' :
                                                            order.status === 'delivered' ? 'rgba(74, 222, 128, 0.2)' :
                                                                'rgba(255, 107, 107, 0.2)',
                                                color:
                                                    order.status === 'pending' ? '#FFB400' :
                                                        order.status === 'preparing' ? '#3B82F6' :
                                                            order.status === 'delivered' ? '#4ade80' :
                                                                '#ff6b6b'
                                            }}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: 'var(--spacing-md)', textAlign: 'right', color: 'var(--color-accent)', fontWeight: 'bold' }}>
                                            {formatCurrency(order.total || 0)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                        No orders found for the selected period.
                    </p>
                )}
            </div>
        </div>
    );
};

export default Reports;
