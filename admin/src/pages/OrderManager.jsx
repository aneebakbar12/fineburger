import React, { useState, useEffect, useRef } from 'react';
import { subscribeToOrders, updateOrderStatus, getServerTimestamp } from '../services/firebase';

const CountdownTimer = ({ startTime, durationMinutes = 60 }) => {
    const [timeLeft, setTimeLeft] = useState('00:00');
    const [isOverdue, setIsOverdue] = useState(false);

    useEffect(() => {
        if (!startTime) return;

        const interval = setInterval(() => {
            // Convert Firestore Timestamp to Date object
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
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: isOverdue ? '#ff6b6b' : '#4ade80',
            fontWeight: 'bold',
            fontSize: 'var(--font-size-lg)',
            backgroundColor: 'rgba(0,0,0,0.3)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)'
        }}>
            <span>⏱️ Preparing:</span>
            <span>{timeLeft}</span>
        </div>
    );
};

const OrderManager = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const prevOrdersRef = useRef([]);
    const audioContextRef = useRef(null);

    useEffect(() => {
        const unsubscribe = subscribeToOrders((newOrders) => {
            setOrders(newOrders);
            setLoading(false);

            // Check for new pending orders to play sound
            if (prevOrdersRef.current.length > 0) {
                const previousIds = new Set(prevOrdersRef.current.map(o => o.id));
                const newPendingOrders = newOrders.filter(o => !previousIds.has(o.id) && o.status === 'pending');

                if (newPendingOrders.length > 0) {
                    playBuzzer();
                }
            }

            prevOrdersRef.current = newOrders;
        });

        return () => unsubscribe();
    }, []);

    const playBuzzer = () => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }

            const ctx = audioContextRef.current;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4
            oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5

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

        if (newStatus === 'preparing') {
            additionalData = { preparingStartedAt: getServerTimestamp() };
        }

        if (window.confirm(`Change order status to ${newStatus}?`)) {
            await updateOrderStatus(id, newStatus, additionalData);
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
        return new Date(timestamp.seconds * 1000).toLocaleString();
    };

    return (
        <div>
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Order Management</h1>
                    <p className="admin-subtitle">View and manage incoming orders</p>
                </div>

            </div>

            {loading ? (
                <div style={{ color: 'var(--color-white)' }}>Loading orders...</div>
            ) : orders.length === 0 ? (
                <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    No orders found.
                </div>
            ) : (
                <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
                    {orders.map(order => (
                        <div key={order.id} className="card" style={{
                            borderLeft: `5px solid ${order.status === 'pending' ? '#FFB400' :
                                    order.status === 'preparing' ? '#3B82F6' :
                                        order.status === 'delivered' ? '#4ade80' :
                                            '#ff6b6b'
                                }`
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
                                <div>
                                    <h3 style={{ color: 'var(--color-white)', fontSize: 'var(--font-size-xl)' }}>
                                        Order #{order.id.slice(0, 6).toUpperCase()}
                                    </h3>
                                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                        {formatDate(order.createdAt)} • <span style={{ textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--color-white)' }}>{order.paymentMethod}</span>
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>

                                    <button
                                        className="btn"
                                        onClick={() => handlePrintReceipt(order)}
                                        style={{ backgroundColor: '#fff', color: '#000', padding: '6px 12px', fontSize: '12px' }}
                                    >
                                        🖨️ Print Receipt
                                    </button>

                                    {order.status === 'preparing' && order.preparingStartedAt && (
                                        <CountdownTimer startTime={order.preparingStartedAt} />
                                    )}
                                    <div style={{
                                        padding: '6px 12px',
                                        borderRadius: 'var(--radius-md)',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
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
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-lg)', borderTop: '1px solid var(--color-medium-gray)', borderBottom: '1px solid var(--color-medium-gray)', padding: 'var(--spacing-md) 0' }}>
                                <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>Customer Details</h4>
                                <p style={{ color: 'var(--color-white)' }}><strong>Name:</strong> {order.customer.name}</p>
                                <p style={{ color: 'var(--color-white)' }}><strong>Phone:</strong> {order.customer.phone}</p>
                                <p style={{ color: 'var(--color-white)' }}><strong>Address:</strong> {order.customer.address}</p>
                                {order.customer.location && (
                                    <p style={{ color: 'var(--color-accent)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${order.customer.location.lat},${order.customer.location.lng}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ color: 'inherit', textDecoration: 'underline' }}
                                        >
                                            View on Google Maps ↗
                                        </a>
                                    </p>
                                )}
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>Order Items</h4>
                                {order.items.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)', color: 'var(--color-white)' }}>
                                        <span>{item.quantity}x {item.name} {item.selectedVariations && Object.values(item.selectedVariations).length > 0 && `(${Object.values(item.selectedVariations).join(', ')})`}</span>
                                        <span>Rs. {item.price * item.quantity}</span>
                                    </div>
                                ))}
                                <div style={{ marginTop: 'var(--spacing-md)', paddingTop: 'var(--spacing-sm)', borderTop: '1px solid var(--color-medium-gray)', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 'var(--font-size-lg)', color: 'var(--color-accent)' }}>
                                    <span>Total</span>
                                    <span>Rs. {order.total}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                                {order.status === 'pending' && (
                                    <>
                                        <button
                                            className="btn"
                                            style={{ flex: 1, backgroundColor: '#3B82F6', color: '#fff' }}
                                            onClick={() => handleStatusUpdate(order.id, 'preparing')}
                                        >
                                            Confirm & Start Preparing
                                        </button>
                                        <button
                                            className="btn"
                                            style={{ flex: 1, backgroundColor: '#ff6b6b', color: '#fff' }}
                                            onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                                        >
                                            Cancel Order
                                        </button>
                                    </>
                                )}
                                {order.status === 'preparing' && (
                                    <button
                                        className="btn"
                                        style={{ flex: 1, backgroundColor: '#4ade80', color: '#000' }}
                                        onClick={() => handleStatusUpdate(order.id, 'delivered')}
                                    >
                                        Mark as Delivered
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrderManager;
