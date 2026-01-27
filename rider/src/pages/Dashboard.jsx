import React, { useEffect, useState } from 'react';
import { subscribeToOrders, updateOrderStatus, logoutRider } from '../firebase';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [orders, setOrders] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = subscribeToOrders((allOrders) => {
            // Filter orders: Show only 'Delivery' orders that are 'ready' or 'out_for_delivery'
            const activeOrders = allOrders.filter(o =>
                o.orderType === 'Delivery' &&
                (o.status === 'ready' || o.status === 'out_for_delivery')
            );
            setOrders(activeOrders);
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await logoutRider();
        navigate('/login');
    };

    const handleMarkDelivered = async (orderId) => {
        if (window.confirm('Mark this order as Delivered?')) {
            await updateOrderStatus(orderId, 'delivered');
        }
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h2 className="header-title">Active Orders</h2>
                <button onClick={handleLogout} className="btn-logout">Logout</button>
            </header>

            <div className="orders-list">
                {orders.length === 0 ? (
                    <div className="no-orders">
                        <span className="no-orders-icon">📦</span>
                        <p>No deliveries assigned yet.</p>
                        <p style={{ fontSize: '14px', marginTop: '8px' }}>Active orders marked as "Ready" will appear here.</p>
                    </div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="order-card">
                            <div className="order-card-header">
                                <span className="order-id">#{order.id.slice(0, 5).toUpperCase()}</span>
                                <span className="order-badge">Ready for Pickup</span>
                            </div>

                            <div className="order-details">
                                <div className="info-row">
                                    <span className="info-icon">📍</span>
                                    <div className="info-content">
                                        <span className="info-label">DELIVER TO</span>
                                        <span className="info-text large">{order.customer?.address || "No Address Provided"}</span>
                                        <a
                                            href={`https://maps.google.com/?q=${order.customer?.address}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ display: 'inline-block', color: 'var(--color-secondary)', fontSize: '12px', marginTop: '4px', fontWeight: 'bold', textDecoration: 'none' }}
                                        >
                                            OPEN MAP ↗
                                        </a>
                                    </div>
                                </div>

                                <div className="info-row">
                                    <span className="info-icon">👤</span>
                                    <div className="info-content">
                                        <span className="info-label">CUSTOMER</span>
                                        <span className="info-text">{order.customer?.name}</span>
                                        <div style={{ marginTop: '4px' }}>
                                            <a href={`tel:${order.customer?.phone}`} style={{ color: '#fff', textDecoration: 'none', borderBottom: '1px dotted #666' }}>
                                                📞 {order.customer?.phone}
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div className="info-row">
                                    <span className="info-icon">💰</span>
                                    <div className="info-content">
                                        <span className="info-label">COLLECT CASH</span>
                                        <span className="info-text" style={{ color: 'var(--color-secondary)', fontSize: '20px' }}>
                                            Rs. {order.total}
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>({order.paymentMethod})</span>
                                    </div>
                                </div>
                            </div>

                            <div className="action-area">
                                <button
                                    onClick={() => handleMarkDelivered(order.id)}
                                    className="btn-deliver"
                                >
                                    <span>✅</span> MARK COMPLETED
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Dashboard;
