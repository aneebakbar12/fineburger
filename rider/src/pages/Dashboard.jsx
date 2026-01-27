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
                <h2>Active Deliveries</h2>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
            </header>

            <div className="orders-list">
                {orders.length === 0 ? (
                    <p>No active orders.</p>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className={`order-card status-${order.status}`}>
                            <div className="order-header">
                                <span className="order-id">#{order.id.slice(-6)}</span>
                                <span className="order-status">{order.status}</span>
                            </div>
                            <div className="order-details">
                                <p><strong>Customer:</strong> {order.customer?.name}</p>
                                <p><strong>Phone:</strong> {order.customer?.phone}</p>
                                <p><strong>Address:</strong> {order.customer?.address}</p>
                                <p><strong>Total:</strong> ${order.total?.toFixed(2)}</p>
                                <p><strong>Payment:</strong> {order.paymentMethod}</p>
                            </div>
                            <div className="order-actions">
                                <button
                                    onClick={() => handleMarkDelivered(order.id)}
                                    className="action-btn"
                                >
                                    Mark as Delivered
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
