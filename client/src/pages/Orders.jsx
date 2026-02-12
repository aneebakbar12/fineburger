import React, { useState, useEffect } from 'react';
import { getUserOrders } from '../services/firebase';
import '../styles/Orders.css';

const Orders = ({ user }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            if (user) {
                const userOrders = await getUserOrders(user.uid);
                setOrders(userOrders);
            }
            setLoading(false);
        };

        fetchOrders();
    }, [user]);

    if (!user) {
        return (
            <div className="orders-container">
                <div className="orders-empty">
                    <h2>Please log in to view your orders</h2>
                </div>
            </div>
        );
    }

    if (loading) {
        return <div className="orders-container">Loading your orders...</div>;
    }

    return (
        <div className="orders-container">
            <h1>My Order History</h1>

            {orders.length === 0 ? (
                <div className="orders-empty">
                    <p>You haven't placed any orders yet.</p>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map(order => (
                        <div key={order.id} className="order-card">
                            <div className="order-header">
                                <span className="order-id">Order #{order.id.slice(0, 8)}</span>
                                <span className={`order-status status-${order.status}`}>
                                    {order.status}
                                </span>
                            </div>
                            <div className="order-date">
                                {order.createdAt?.seconds
                                    ? new Date(order.createdAt.seconds * 1000).toLocaleDateString()
                                    : 'Date processing...'}
                            </div>
                            <div className="order-items">
                                {order.items.map((item, index) => (
                                    <div key={index} className="order-item-row">
                                        <span>{item.quantity}x {item.name}</span>
                                        <span>Rs. {item.price * item.quantity}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="order-total">
                                <span>Total</span>
                                <span>Rs. {order.total}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Orders;
