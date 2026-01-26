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
            display: 'flex', justifyContent: 'center', alignItems: 'center', pading: '20px'
        }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                backgroundColor: '#1a1a1a', borderRadius: '12px', width: '90%', maxWidth: '600px',
                maxHeight: '90vh', overflowY: 'auto', border: '1px solid #333', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '24px', color: 'white', margin: 0 }}>Order #{order.id.slice(0, 6).toUpperCase()}</h2>
                        <span style={{
                            fontSize: '14px', color: '#ccc',
                            backgroundColor: getStatusColor(order.status).bg,
                            color: getStatusColor(order.status).text,
                            padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold',
                            marginTop: '8px', display: 'inline-block'
                        }}>
                            {order.status.toUpperCase()}
                        </span>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: '24px', cursor: 'pointer' }}>×</button>
                </div>

                <div style={{ padding: '24px' }}>
                    {/* Customer Info */}
                    <div style={{ marginBottom: '24px', backgroundColor: '#252525', padding: '16px', borderRadius: '8px' }}>
                        <h3 style={{ color: '#888', fontSize: '14px', textTransform: 'uppercase', marginBottom: '12px' }}>Customer Details</h3>
                        <p style={{ color: 'white', marginBottom: '4px' }}><strong>Name:</strong> {order.customer.name}</p>
                        <p style={{ color: 'white', marginBottom: '4px' }}><strong>Phone:</strong> <a href={`tel:${order.customer.phone}`} style={{ color: '#4ade80' }}>{order.customer.phone}</a></p>
                        <p style={{ color: 'white', marginBottom: '8px' }}><strong>Address:</strong> {order.customer.address}</p>
                        {order.customer.location && (
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${order.customer.location.lat},${order.customer.location.lng}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: 'var(--color-accent)', fontSize: '14px', textDecoration: 'underline' }}
                            >
                                📍 View Location on Maps
                            </a>
                        )}
                    </div>

                    {/* Order Items */}
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ color: '#888', fontSize: '14px', textTransform: 'uppercase', marginBottom: '12px' }}>Order Items</h3>
                        {order.items.map((item, idx) => (
                            <div key={idx} style={{
                                display: 'flex', justifyContent: 'space-between', marginBottom: '12px',
                                paddingBottom: '12px', borderBottom: '1px solid #333'
                            }}>
                                <div>
                                    <div style={{ color: 'white', fontSize: '16px' }}>{item.quantity}x {item.name}</div>
                                    {item.selectedVariations && Object.values(item.selectedVariations).length > 0 && (
                                        <div style={{ color: '#888', fontSize: '13px', marginTop: '2px' }}>
                                            {Object.values(item.selectedVariations).join(', ')}
                                        </div>
                                    )}
                                </div>
                                <div style={{ color: 'white', fontWeight: 'bold' }}>Rs. {item.price * item.quantity}</div>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                            <span style={{ color: '#888' }}>Payment Method: <strong style={{ color: 'white' }}>{order.paymentMethod}</strong></span>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-accent)' }}>
                                Total: Rs. {order.total}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => onPrint(order)}
                            style={{ flex: 1, padding: '12px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            🖨️ Print Receipt
                        </button>

                        {order.status === 'pending' && (
                            <>
                                <button className="btn-action confirm" onClick={() => onUpdateStatus(order.id, 'preparing')}>Confirm Order</button>
                                <button className="btn-action cancel" onClick={() => onUpdateStatus(order.id, 'cancelled')}>Cancel</button>
                            </>
                        )}
                        {order.status === 'preparing' && (
                            <button className="btn-action deliver" onClick={() => onUpdateStatus(order.id, 'delivered')}>Mark Delivered</button>
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

            // Check for new pending orders
            if (prevOrdersRef.current.length > 0) {
                const previousIds = new Set(prevOrdersRef.current.map(o => o.id));
                const newPendingOrders = newOrders.filter(o => !previousIds.has(o.id) && o.status === 'pending');
                if (newPendingOrders.length > 0) playBuzzer();
            }
            prevOrdersRef.current = newOrders;
        });
        return () => unsubscribe();
    }, []); // No dependencies, subscription runs once

    const selectedOrder = orders.find(o => o.id === selectedOrderId) || null;

    const playBuzzer = () => {
        try {
            if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = audioContextRef.current;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(440, ctx.currentTime);
            oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 3.0);
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 3.0);
        } catch (e) {
            console.error("Audio playback failed", e);
        }
    };

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
