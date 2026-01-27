import React, { useState, useEffect, useRef } from 'react';
import { subscribeToOrders, updateOrderStatus, getServerTimestamp } from '../services/firebase';
import '../styles/admin.css'; // Ensure we have base styles

// --- Components ---

const CountdownTimer = ({ startTime, durationMinutes = 60 }) => {
    const [timeLeft, setTimeLeft] = useState('00:00');
    const [isOverdue, setIsOverdue] = useState(false);

    useEffect(() => {
        if (!startTime) return;

        const interval = setInterval(() => {
            const start = startTime.seconds ? new Date(startTime.seconds * 1000) : new Date(startTime);
            const now = new Date();
            const elapsed = now - start;
            const remaining = (durationMinutes * 60 * 1000) - elapsed;

            if (remaining <= 0) {
                setTimeLeft('00:00');
                setIsOverdue(true);
            } else {
                const minutes = Math.floor(remaining / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);
                setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
                setIsOverdue(false);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime, durationMinutes]);

    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: isOverdue ? '#ff6b6b' : '#4ade80',
            fontWeight: 'bold',
            fontSize: '14px',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: '4px 8px',
            borderRadius: '4px'
        }}>
            <span>⏱️ {timeLeft}</span>
        </div>
    );
};

const OrderDetailsModal = ({ order, isOpen, onClose, onUpdateStatus, onPrint }) => {
    if (!isOpen || !order) return null;

    return (
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000,
            display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
        }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                backgroundColor: '#1a1a1a', borderRadius: '16px', width: '95%', maxWidth: '800px',
                maxHeight: '90vh', overflowY: 'auto', border: '1px solid #333',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ padding: '30px' }}>

                    {/* Header */}
                    <div className="modal-header">
                        <div className="modal-title-row">
                            <h2 style={{ fontSize: '28px', color: 'white', margin: 0 }}>
                                Order #{order.id.slice(0, 6).toUpperCase()}
                            </h2>
                            <div>
                                <span className="badge" style={{
                                    backgroundColor: getStatusColor(order.status).bg,
                                    color: getStatusColor(order.status).text
                                }}>
                                    {order.status}
                                </span>
                                {order.orderType && (
                                    <span className="badge" style={{ backgroundColor: '#444', color: '#fff' }}>
                                        {order.orderType}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button onClick={onClose} style={{
                            background: '#333', border: 'none', color: '#fff',
                            width: '36px', height: '36px', borderRadius: '50%',
                            fontSize: '20px', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center'
                        }}>×</button>
                    </div>

                    <div className="modal-grid">

                        {/* Left Column: Customer & Delivery */}
                        <div className="modal-section">
                            <h3 className="modal-section-title">Customer & Delivery</h3>

                            <div className="detail-row">
                                <span className="detail-label">Name</span>
                                <span className="detail-value">{order.customer.name}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Phone</span>
                                <span className="detail-value">
                                    <a href={`tel:${order.customer.phone}`} style={{ color: '#4ade80', textDecoration: 'none' }}>
                                        {order.customer.phone}
                                    </a>
                                </span>
                            </div>

                            {order.orderType === 'Dine-in' && order.customer.tableNumber && (
                                <div className="detail-row">
                                    <span className="detail-label">Table No.</span>
                                    <span className="detail-value" style={{ color: 'var(--color-accent)', fontSize: '18px' }}>
                                        #{order.customer.tableNumber}
                                    </span>
                                </div>
                            )}

                            {/* Address only for Delivery */}
                            {order.orderType === 'Delivery' && (
                                <>
                                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #333' }}>
                                        <span className="detail-label" style={{ display: 'block', marginBottom: '4px' }}>Address</span>
                                        <p style={{ color: 'white', lineHeight: '1.4', margin: 0 }}>{order.customer.address}</p>
                                    </div>

                                    {order.customer.location && (
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${order.customer.location.lat},${order.customer.location.lng}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="map-link"
                                        >
                                            📍 View on Google Maps
                                        </a>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Right Column: Items & Payment */}
                        <div className="modal-section">
                            <h3 className="modal-section-title">Order Summary</h3>

                            <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '4px', marginBottom: '16px' }}>
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="order-item-row">
                                        <div>
                                            <div style={{ color: 'white', fontSize: '15px' }}>
                                                <span className="item-qty">{item.quantity}x</span>
                                                {item.name}
                                            </div>
                                            {item.selectedVariations && Object.values(item.selectedVariations).length > 0 && (
                                                <div style={{ color: '#888', fontSize: '12px', marginTop: '2px', paddingLeft: '24px' }}>
                                                    {Object.values(item.selectedVariations).join(', ')}
                                                </div>
                                            )}
                                        </div>
                                        <div className="item-price">
                                            {item.price * item.quantity}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="summary-row" style={{ fontSize: '14px', color: '#ccc', fontWeight: 'normal' }}>
                                <span>Payment</span>
                                <span style={{ color: 'white', fontWeight: 'bold' }}>{order.paymentMethod}</span>
                            </div>
                            <div className="summary-row">
                                <span>Total</span>
                                <span>Rs. {order.total}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div style={{ display: 'flex', gap: '16px', marginTop: '30px' }}>
                        <button
                            onClick={() => onPrint(order)}
                            className="btn-action"
                            style={{ backgroundColor: '#333', color: 'white' }}
                        >
                            🖨️ Print
                        </button>

                        {/* Status Based Actions */}
                        {order.status === 'pending' && (
                            <>
                                <button className="btn-action confirm" onClick={() => onUpdateStatus(order.id, 'preparing')}>
                                    Confirm Order
                                </button>
                                <button className="btn-action cancel" onClick={() => onUpdateStatus(order.id, 'cancelled')}>
                                    Cancel
                                </button>
                            </>
                        )}

                        {order.status === 'preparing' && (
                            <button className="btn-action ready" onClick={() => onUpdateStatus(order.id, 'ready')} style={{ backgroundColor: '#8e44ad', color: 'white' }}>
                                ✅ Mark Ready
                            </button>
                        )}

                        {order.status === 'ready' && (
                            <button className="btn-action deliver" onClick={() => onUpdateStatus(order.id, 'delivered')}>
                                🚀 Mark Delivered
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>

    );
};


const getStatusColor = (status) => {
    switch (status) {
        case 'pending': return { bg: 'rgba(255, 180, 0, 0.2)', text: '#FFB400', border: '#FFB400' };
        case 'preparing': return { bg: 'rgba(59, 130, 246, 0.2)', text: '#3B82F6', border: '#3B82F6' };
        case 'ready': return { bg: 'rgba(142, 68, 173, 0.2)', text: '#9b59b6', border: '#9b59b6' };
        case 'delivered': return { bg: 'rgba(74, 222, 128, 0.2)', text: '#4ade80', border: '#4ade80' };
        case 'cancelled': return { bg: 'rgba(255, 107, 107, 0.2)', text: '#ff6b6b', border: '#ff6b6b' };
        default: return { bg: '#333', text: '#fff', border: '#666' };
    }
};

const OrderManager = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const prevOrdersRef = useRef([]);
    const audioContextRef = useRef(null);

    useEffect(() => {
        const unsubscribe = subscribeToOrders((newOrders) => {
            setOrders(newOrders);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []); // No dependencies, subscription runs once

    const selectedOrder = orders.find(o => o.id === selectedOrderId) || null;

    // (Buzzer logic removed - moved to Global App.js)

    const handleStatusUpdate = async (id, newStatus) => {
        let additionalData = {};
        if (newStatus === 'preparing') additionalData = { preparingStartedAt: getServerTimestamp() };

        // Skip confirm if using modal actions usually
        if (window.confirm(`Change order status to ${newStatus}?`)) {
            await updateOrderStatus(id, newStatus, additionalData);
            if (newStatus === 'cancelled' || newStatus === 'delivered') {
                setSelectedOrderId(null); // Close modal on completion
            }
        }
    };

    const handlePrintReceipt = (order) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Receipt #${order.id.slice(0, 6)}</title>
                    <style>
                        body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; color: #000; }
                        .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                        .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
                        .total { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; font-weight: bold; display: flex; justify-content: space-between; }
                        .customer { margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; font-size: 14px; }
                        h2 { margin: 0 0 5px 0; }
                        p { margin: 2px 0; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>FINE BURGER</h2>
                        <p>Order #${order.id.slice(0, 6).toUpperCase()}</p>
                        <p>${new Date().toLocaleString()}</p>
                    </div>
                    <div class="customer">
                        <p><strong>Customer:</strong> ${order.customer.name}</p>
                        <p><strong>Phone:</strong> ${order.customer.phone}</p>
                        <p><strong>Address:</strong> ${order.customer.address}</p>
                    </div>
                    <div class="items">
                        ${order.items.map(item => `
                            <div style="margin-bottom: 8px;">
                                <div class="item">
                                    <span>${item.quantity}x ${item.name}</span>
                                    <span>${item.price * item.quantity}</span>
                                </div>
                                ${item.selectedVariations ? `
                                    <div style="font-size: 12px; color: #444; padding-left: 10px;">
                                        ${Object.values(item.selectedVariations).length > 0 ? Object.values(item.selectedVariations).join(', ') : ''}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                    <div class="total">
                        <span>TOTAL</span>
                        <span>Rs. ${order.total}</span>
                    </div>
                    <div style="text-align: center; margin-top: 30px;">
                        <p>*** Thank You ***</p>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <button onclick="window.print()" style="padding: 10px 20px; cursor: pointer;" class="no-print">Print</button>
                    </div>
                    <style>
                        @media print {
                            .no-print { display: none; }
                        }
                    </style>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div>
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Order Management</h1>
                    <p className="admin-subtitle">Live Order Dashboard</p>
                </div>
            </div>

            {loading ? (
                <div style={{ color: 'white' }}>Loading...</div>
            ) : orders.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                    No orders found.
                </div>
            ) : (
                <div className="order-grid" style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px'
                }}>
                    {orders.map(order => {
                        const statusColors = getStatusColor(order.status);
                        return (
                            <div
                                key={order.id}
                                onClick={() => setSelectedOrderId(order.id)}
                                style={{
                                    backgroundColor: '#1a1a1a',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    border: '1px solid #333',
                                    borderTop: `4px solid ${statusColors.border}`,
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    minHeight: '180px'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <h3 style={{ margin: 0, color: 'white', fontSize: '18px' }}>#{order.id.slice(0, 4)}...</h3>
                                        <span style={{
                                            fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase',
                                            padding: '4px 8px', borderRadius: '4px',
                                            backgroundColor: statusColors.bg, color: statusColors.text
                                        }}>
                                            {order.status}
                                        </span>
                                    </div>
                                    {order.orderType && (
                                        <div style={{ marginBottom: '8px' }}>
                                            <span style={{
                                                fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase',
                                                padding: '2px 6px', borderRadius: '4px',
                                                backgroundColor: '#333', color: '#ccc', border: '1px solid #555'
                                            }}>
                                                {order.orderType}
                                            </span>
                                        </div>
                                    )}

                                    <div style={{ marginBottom: '16px' }}>
                                        <h4 style={{ margin: '0 0 4px 0', color: '#ccc', fontSize: '15px' }}>{order.customer.name}</h4>
                                        <p style={{ margin: '0 0 4px 0', color: '#888', fontSize: '12px' }}>{order.customer.phone}</p>
                                        <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '12px' }}>{formatDate(order.createdAt)}</p>

                                        <div style={{ fontSize: '13px', color: '#ddd' }}>
                                            {order.items.slice(0, 3).map((item, i) => (
                                                <div key={i} style={{ marginBottom: '2px' }}>
                                                    {item.quantity}x {item.name}
                                                </div>
                                            ))}
                                            {order.items.length > 3 && (
                                                <div style={{ color: '#888', fontStyle: 'italic' }}>+ {order.items.length - 3} more...</div>
                                            )}
                                        </div>
                                    </div>

                                    {order.status === 'preparing' && order.preparingStartedAt && (
                                        <div style={{ marginBottom: '12px' }}>
                                            <CountdownTimer startTime={order.preparingStartedAt} />
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #333', paddingTop: '12px' }}>
                                    <span style={{ color: '#888', fontSize: '13px' }}>Total</span>
                                    <span style={{ color: 'var(--color-accent)', fontWeight: 'bold', fontSize: '16px' }}>Rs. {order.total}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <OrderDetailsModal
                order={selectedOrder}
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrderId(null)}
                onUpdateStatus={handleStatusUpdate}
                onPrint={handlePrintReceipt}
            />
        </div>
    );
};

export default OrderManager;
