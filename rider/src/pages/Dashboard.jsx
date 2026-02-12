import React, { useEffect, useState } from 'react';
import { subscribeToRiderOrders, updateOrderStatus, logoutRider, getRiderProfile } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase-config';

const Dashboard = () => {
    const [assignedOrders, setAssignedOrders] = useState([]);
    const [pastOrders, setPastOrders] = useState([]);
    const [processingOrders, setProcessingOrders] = useState(new Set());
    const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' or 'past'
    const [riderProfile, setRiderProfile] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            navigate('/login');
            return;
        }

        // Fetch rider profile
        getRiderProfile(currentUser.uid).then(result => {
            if (result.success) {
                setRiderProfile(result.profile);
            }
        });

        // Subscribe to rider's orders
        const unsubscribe = subscribeToRiderOrders(
            currentUser.uid,
            setAssignedOrders,
            setPastOrders
        );

        return () => unsubscribe();
    }, [navigate]);

    const handleLogout = async () => {
        await logoutRider();
        navigate('/login');
    };

    const handleMarkDelivered = async (orderId) => {
        // Prevent multiple clicks
        if (processingOrders.has(orderId)) return;

        const confirmed = window.confirm('Mark this order as Delivered?');
        if (confirmed) {
            setProcessingOrders(prev => new Set(prev).add(orderId));
            await updateOrderStatus(orderId, 'delivered');
            // Order will be removed from assigned list by the real-time listener
        }
    };

    const orders = activeTab === 'assigned' ? assignedOrders : pastOrders;

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h2 className="header-title">Rider Dashboard</h2>
                    {riderProfile && (
                        <div style={{ fontSize: '14px', color: '#888', marginTop: '4px' }}>
                            <span style={{ color: '#fff', fontWeight: 'bold' }}>{riderProfile.name}</span>
                            <span style={{ margin: '0 8px' }}>•</span>
                            <span>{riderProfile.email}</span>
                        </div>
                    )}
                </div>
                <button onClick={handleLogout} className="btn-logout">Logout</button>
            </header>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '24px',
                borderBottom: '2px solid #333',
                paddingBottom: '0'
            }}>
                <button
                    onClick={() => setActiveTab('assigned')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'assigned' ? 'var(--color-secondary)' : '#888',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        padding: '12px 24px',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'assigned' ? '3px solid var(--color-secondary)' : '3px solid transparent',
                        marginBottom: '-2px',
                        transition: 'all 0.3s'
                    }}
                >
                    Assigned Orders ({assignedOrders.length})
                </button>
                <button
                    onClick={() => setActiveTab('past')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'past' ? 'var(--color-secondary)' : '#888',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        padding: '12px 24px',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'past' ? '3px solid var(--color-secondary)' : '3px solid transparent',
                        marginBottom: '-2px',
                        transition: 'all 0.3s'
                    }}
                >
                    Past Orders ({pastOrders.length})
                </button>
            </div>

            <div className="orders-list">
                {orders.length === 0 ? (
                    <div className="no-orders">
                        <span className="no-orders-icon">📦</span>
                        <p>{activeTab === 'assigned' ? 'No assigned orders yet.' : 'No past orders.'}</p>
                        <p style={{ fontSize: '14px', marginTop: '8px' }}>
                            {activeTab === 'assigned'
                                ? 'Orders assigned to you will appear here.'
                                : 'Your delivered orders will appear here.'}
                        </p>
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

                            {activeTab === 'assigned' && (
                                <div className="action-area">
                                    <button
                                        onClick={() => handleMarkDelivered(order.id)}
                                        className="btn-deliver"
                                        disabled={processingOrders.has(order.id)}
                                        style={{
                                            opacity: processingOrders.has(order.id) ? 0.6 : 1,
                                            cursor: processingOrders.has(order.id) ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        <span>{processingOrders.has(order.id) ? '⏳' : '✅'}</span>
                                        {processingOrders.has(order.id) ? 'PROCESSING...' : 'MARK COMPLETED'}
                                    </button>
                                </div>
                            )}
                            {activeTab === 'past' && (
                                <div style={{
                                    padding: '12px',
                                    textAlign: 'center',
                                    color: '#4ade80',
                                    fontWeight: 'bold',
                                    fontSize: '14px'
                                }}>
                                    ✅ DELIVERED
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Dashboard;
