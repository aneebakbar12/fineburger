import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserOrders } from '../services/firebase';
import '../styles/Orders.css';

const Orders = ({ user }) => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(!user);

    useEffect(() => {
        const fetchOrders = async () => {
            if (user) {
                setIsGuest(false);
                const userOrders = await getUserOrders(user.uid);
                setOrders(userOrders);
                setLoading(false);
            } else {
                setIsGuest(true);
                // Load guest orders from localStorage
                try {
                    const guestSaved = JSON.parse(localStorage.getItem('fb_recent_orders') || '[]');
                    setOrders(guestSaved);
                } catch (e) {
                    setOrders([]);
                }
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user]);

    if (loading) {
        return (
            <div className="orders-container">
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-accent)' }}>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏳</div>
                    <p>Loading your orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="orders-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
                <h1 style={{ margin: 0 }}>{isGuest ? 'Your Recent Orders' : 'My Order History'}</h1>
                <Link to="/track" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                    🔍 Track an Order
                </Link>
            </div>

            {isGuest && orders.length > 0 && (
                <div style={{
                    backgroundColor: 'rgba(255, 180, 0, 0.1)',
                    border: '1px solid rgba(255, 180, 0, 0.3)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                    fontSize: '13px',
                    color: 'var(--color-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span>💡</span>
                    <span>
                        Showing orders placed on this browser as a guest. Sign in to sync your order history permanently across all devices.
                    </span>
                </div>
            )}

            {orders.length === 0 ? (
                <div className="orders-empty">
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍔</div>
                    <h3 style={{ color: 'var(--color-white)', marginBottom: '8px' }}>No orders found</h3>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
                        {isGuest
                            ? "You haven't placed any orders on this device yet."
                            : "You haven't placed any orders with this account yet."}
                    </p>
                    <Link to="/menu" className="btn btn-primary" style={{ display: 'inline-block' }}>
                        Browse Menu &amp; Order Now
                    </Link>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map(order => {
                        const orderId = order.id || order.orderId;
                        const orderRef = order.orderReference || (orderId ? `FB-${orderId.substring(0, 5).toUpperCase()}` : 'FB-ORDER');
                        const orderDate = order.createdAt?.seconds
                            ? new Date(order.createdAt.seconds * 1000).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                            : order.placedAt
                                ? new Date(order.placedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                                : 'Recent Order';

                        return (
                            <div key={orderId || Math.random()} className="order-card">
                                <div className="order-header">
                                    <span className="order-id" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
                                        #{orderRef}
                                    </span>
                                    {order.status ? (
                                        <span className={`order-status status-${order.status}`}>
                                            {order.status.replace(/_/g, ' ')}
                                        </span>
                                    ) : (
                                        <span className="order-status status-pending">
                                            {order.orderType || 'Order Placed'}
                                        </span>
                                    )}
                                </div>

                                <div className="order-date">
                                    <span>📅 {orderDate}</span>
                                    {order.orderType && (
                                        <span style={{ marginLeft: '12px', color: 'var(--color-text-secondary)' }}>
                                            • {order.orderType}
                                        </span>
                                    )}
                                </div>

                                {order.items && order.items.length > 0 && (
                                    <div className="order-items">
                                        {order.items.map((item, index) => (
                                            <div key={index} className="order-item-row">
                                                <span>{item.quantity}x {item.name}</span>
                                                <span style={{ color: 'var(--color-accent)' }}>Rs. {item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {order.itemsSummary && (!order.items || order.items.length === 0) && (
                                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '12px' }}>
                                        {order.itemsSummary}
                                    </div>
                                )}

                                <div className="order-total" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Total: </span>
                                        <span style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: '18px' }}>Rs. {order.total}</span>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/track/${orderId}`)}
                                        className="btn btn-primary"
                                        style={{ padding: '8px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <span>📍</span> Track Live Status
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Orders;
