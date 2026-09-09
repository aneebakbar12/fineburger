import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { subscribeToOrder } from '../services/firebase';
import {
    isNotificationSupported,
    getNotificationPermission,
    requestNotificationPermission,
    notifyOrderStatusChange,
    showPushNotification
} from '../services/notificationService';
import '../styles/OrderTracking.css';

const STATUS_STEPS = [
    { key: 'pending', label: 'Order Received', icon: '📋' },
    { key: 'preparing', label: 'In Kitchen', icon: '🍳' },
    { key: 'ready_or_out', label: 'On The Way', icon: '🛵' },
    { key: 'delivered', label: 'Delivered', icon: '🍔' }
];

// Load guest orders saved in localStorage
const getGuestOrders = () => {
    try {
        const o1 = JSON.parse(localStorage.getItem('fb_recent_orders') || '[]');
        const o2 = JSON.parse(localStorage.getItem('fb_guest_orders') || '[]');
        const combined = [...o1, ...o2];
        // Deduplicate by orderId
        const seen = new Set();
        const unique = [];
        for (const item of combined) {
            if (item.orderId && !seen.has(item.orderId)) {
                seen.add(item.orderId);
                unique.push(item);
            }
        }
        return unique.sort((a, b) => (b.placedAt || 0) - (a.placedAt || 0));
    } catch {
        return [];
    }
};

const OrderTracking = ({ storeSettings }) => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState('');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(Boolean(orderId));
    const [notFound, setNotFound] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission());
    const [guestOrders, setGuestOrders] = useState([]);
    const prevStatusRef = useRef(null);

    // Load guest orders from localStorage on mount
    useEffect(() => {
        setGuestOrders(getGuestOrders());
    }, []);

    useEffect(() => {
        if (!orderId) {
            setOrder(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setNotFound(false);

        const unsubscribe = subscribeToOrder(orderId, (orderData) => {
            setLoading(false);
            if (orderData) {
                if (prevStatusRef.current && prevStatusRef.current !== orderData.status) {
                    notifyOrderStatusChange(orderData, orderData.status);
                }
                prevStatusRef.current = orderData.status;
                setOrder(orderData);
                setNotFound(false);
            } else {
                setNotFound(true);
            }
        });

        return () => unsubscribe();
    }, [orderId]);

    const handleEnableNotifications = async () => {
        const granted = await requestNotificationPermission();
        setNotificationPermission(granted ? 'granted' : 'denied');
        if (granted && order) {
            showPushNotification('🔔 Notifications Enabled!', {
                body: `You'll be alerted whenever order #${order.orderReference || order.id.substring(0, 5).toUpperCase()} updates!`
            });
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const trimmed = searchInput.trim().replace(/^#/, '');
        if (trimmed) {
            navigate(`/track/${trimmed}`);
        }
    };

    const getActiveStep = () => {
        if (!order) return 0;
        const s = order.status;
        if (s === 'pending') return 0;
        if (s === 'preparing') return 1;
        if (s === 'ready' || s === 'out_for_delivery') return 2;
        if (s === 'delivered') return 3;
        return 0;
    };

    const activeStepIndex = getActiveStep();
    const progressPercent = (activeStepIndex / (STATUS_STEPS.length - 1)) * 100;

    const getWhatsAppUrl = () => {
        const phone = storeSettings?.storeInfo?.phone || '923214854410';
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const ref = order?.orderReference || orderId?.substring(0, 6).toUpperCase();
        const statusStr = order?.status ? ` [Status: ${order.status.toUpperCase()}]` : '';
        const text = encodeURIComponent(
`🍔 *FINE BURGER & FAST FOOD*
Order Status Inquiry

📋 Order Ref: *#${ref}*${statusStr}
👤 Customer : ${order?.customer?.name || 'Guest'}

Hi! I would like to check the latest update on my order. Thank you! 👋`
        );
        return `https://wa.me/${cleanPhone}?text=${text}`;
    };

    return (
        <div className="order-tracking-page">
            <div className="container">
                <div className="tracking-card">
                    <div className="tracking-header">
                        <h1 className="tracking-title">Live Order Tracking</h1>
                        <p className="tracking-subtitle">
                            Watch your delicious burger make its way from the grill to your hands
                        </p>
                    </div>

                    {/* Order ID Search Form */}
                    <form onSubmit={handleSearch} className="track-search-form">
                        <input
                            type="text"
                            className="track-search-input"
                            placeholder="Enter Order ID or Reference (e.g. FB-XXXX)..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary" style={{ padding: '0 24px' }}>
                            Track
                        </button>
                    </form>

                    {loading && (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-accent)' }}>
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
                            <p>Locating your order in the kitchen...</p>
                        </div>
                    )}

                    {notFound && (
                        <div style={{
                            textAlign: 'center',
                            padding: '30px',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: 'var(--radius-md)',
                            color: '#f87171'
                        }}>
                            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔍</div>
                            <h3>Order Not Found</h3>
                            <p style={{ marginTop: '6px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                                Please double check your Order ID or contact our team on WhatsApp for assistance.
                            </p>
                            <a
                                href={getWhatsAppUrl()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-whatsapp"
                                style={{ marginTop: '16px', display: 'inline-flex' }}
                            >
                                Chat with Restaurant on WhatsApp
                            </a>
                        </div>
                    )}

                    {/* Guest Recent Orders — shown when no orderId in URL */}
                    {!orderId && !loading && guestOrders.length > 0 && (
                        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                            <h3 style={{ color: 'var(--color-white)', fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>🕐</span> Your Recent Orders ({guestOrders.length})
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {guestOrders.map((go) => (
                                    <button
                                        key={go.orderId}
                                        onClick={() => navigate(`/track/${go.orderId}`)}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '16px 20px',
                                            backgroundColor: 'var(--color-surface)',
                                            border: '1px solid var(--color-medium-gray)',
                                            borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer',
                                            width: '100%',
                                            textAlign: 'left',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.borderColor = 'var(--color-accent)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.borderColor = 'var(--color-medium-gray)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ color: '#FFB400', fontWeight: 800, fontSize: '16px' }}>#{go.orderReference}</span>
                                                <span style={{
                                                    fontSize: '11px',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    backgroundColor: 'rgba(255, 180, 0, 0.15)',
                                                    color: 'var(--color-accent)',
                                                    fontWeight: 600
                                                }}>
                                                    {go.orderType}
                                                </span>
                                            </div>
                                            {go.itemsSummary && (
                                                <div style={{ color: 'var(--color-white)', fontSize: '13px', marginTop: '4px', opacity: 0.9 }}>
                                                    {go.itemsSummary}
                                                </div>
                                            )}
                                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginTop: '4px' }}>
                                                Total: <strong style={{ color: 'var(--color-white)' }}>Rs. {go.total}</strong>
                                                {go.placedAt && (
                                                    <span> • {new Date(go.placedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{
                                            color: 'var(--color-accent)',
                                            fontSize: '13px',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            backgroundColor: 'rgba(255, 180, 0, 0.1)',
                                            padding: '8px 14px',
                                            borderRadius: 'var(--radius-sm)'
                                        }}>
                                            <span>Track</span>
                                            <span>➔</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {!orderId && !loading && guestOrders.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary)' }}>
                            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🍔</div>
                            <p>Have an active order? Enter your Order ID above to see live updates.</p>
                            <Link to="/menu" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>
                                View Menu &amp; Order
                            </Link>
                        </div>
                    )}

                    {order && !loading && (
                        <>
                            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
                                <span className="tracking-ref-badge">
                                    #{order.orderReference || `FB-${order.id.substring(0, 5).toUpperCase()}`}
                                </span>
                                {isNotificationSupported() && notificationPermission !== 'granted' && (
                                    <div style={{ marginTop: '12px' }}>
                                        <button
                                            onClick={handleEnableNotifications}
                                            style={{
                                                background: 'rgba(255, 180, 0, 0.12)',
                                                border: '1px dashed var(--color-accent)',
                                                color: 'var(--color-accent)',
                                                padding: '8px 16px',
                                                borderRadius: 'var(--radius-md)',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <span>🔔</span> Turn on Push Notifications for Live Updates
                                        </button>
                                    </div>
                                )}
                                {notificationPermission === 'granted' && (
                                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                        <span>✓</span> Live push alerts enabled for this order
                                    </div>
                                )}
                            </div>

                            {/* Stepper */}
                            <div className="tracking-stepper">
                                <div
                                    className="tracking-stepper-progress"
                                    style={{ width: `calc(${progressPercent}% * 0.8)` }}
                                ></div>
                                {STATUS_STEPS.map((step, idx) => {
                                    const isCompleted = idx < activeStepIndex || order.status === 'delivered';
                                    const isActive = idx === activeStepIndex && order.status !== 'delivered';

                                    let stepLabel = step.label;
                                    if (step.key === 'ready_or_out') {
                                        stepLabel = order.orderType === 'Delivery' ? 'On The Way' : 'Ready For You';
                                    }

                                    return (
                                        <div
                                            key={step.key}
                                            className={`step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                                        >
                                            <div className="step-icon-wrap">
                                                {isCompleted ? '✓' : step.icon}
                                            </div>
                                            <span className="step-label">{stepLabel}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Status Callout Banner */}
                            <div className="status-callout">
                                <span className="status-callout-icon">
                                    {order.status === 'pending' && '🕒'}
                                    {order.status === 'preparing' && '🔥'}
                                    {order.status === 'out_for_delivery' && '🛵'}
                                    {order.status === 'ready' && '✨'}
                                    {order.status === 'delivered' && '🎉'}
                                    {order.status === 'cancelled' && '❌'}
                                </span>
                                <div className="status-callout-text">
                                    <h4>
                                        {order.status === 'pending' && 'Order Received & Awaiting Kitchen Confirmation'}
                                        {order.status === 'preparing' && 'Fresh on the Grill! Kitchen is Preparing'}
                                        {order.status === 'out_for_delivery' && 'Out for Delivery with Rider'}
                                        {order.status === 'ready' && 'Order is Ready for Pickup / Table!'}
                                        {order.status === 'delivered' && 'Delivered! Enjoy Your Fine Burger!'}
                                        {order.status === 'cancelled' && 'Order Cancelled'}
                                    </h4>
                                    <p>
                                        {order.status === 'pending' && 'We are assigning kitchen priority to your ticket.'}
                                        {order.status === 'preparing' && 'Our chefs are crafting your meal with fresh ingredients.'}
                                        {order.status === 'out_for_delivery' && 'Rider has picked up your food and is heading to your address.'}
                                        {order.status === 'ready' && 'Your food is packaged hot and fresh.'}
                                        {order.status === 'delivered' && 'Thank you for ordering with Fine Burger.'}
                                        {order.status === 'cancelled' && 'If this was a mistake, please reach out via WhatsApp below.'}
                                    </p>
                                </div>
                            </div>

                            {/* Order Details Grid */}
                            <div className="order-details-grid">
                                <div className="info-section">
                                    <h4>Order Information</h4>
                                    <div className="info-row">
                                        <span>Order Type:</span>
                                        <strong>{order.orderType}</strong>
                                    </div>
                                    <div className="info-row">
                                        <span>Payment:</span>
                                        <strong>{order.paymentMethod || 'Cash on Delivery'}</strong>
                                    </div>
                                    {order.customer?.name && (
                                        <div className="info-row">
                                            <span>Customer:</span>
                                            <strong>{order.customer.name}</strong>
                                        </div>
                                    )}
                                    {order.orderType === 'Dine-in' && order.customer?.tableNumber && (
                                        <div className="info-row">
                                            <span>Table:</span>
                                            <strong>Table #{order.customer.tableNumber}</strong>
                                        </div>
                                    )}
                                    {order.orderType === 'Delivery' && order.customer?.address && (
                                        <div className="info-row">
                                            <span>Address:</span>
                                            <strong style={{ maxWidth: '60%', textAlign: 'right' }}>
                                                {order.customer.address}
                                            </strong>
                                        </div>
                                    )}
                                </div>

                                <div className="info-section">
                                    <h4>Items ({order.items?.length || 0})</h4>
                                    <div className="items-list">
                                        {order.items?.map((item, idx) => (
                                            <div key={idx} className="item-row">
                                                <div>
                                                    <span style={{ fontWeight: 600, color: 'var(--color-white)' }}>
                                                        {item.quantity}x {item.name}
                                                    </span>
                                                    {item.selectedVariations && Object.keys(item.selectedVariations).length > 0 && (
                                                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                                            {Object.entries(item.selectedVariations).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                        </div>
                                                    )}
                                                </div>
                                                <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
                                                    Rs. {item.price * item.quantity}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginTop: '12px',
                                        paddingTop: '8px',
                                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                                        fontWeight: 700,
                                        fontSize: '15px'
                                    }}>
                                        <span>Total:</span>
                                        <span style={{ color: 'var(--color-accent)' }}>Rs. {order.total}</span>
                                    </div>
                                </div>
                            </div>

                            {/* WhatsApp & Support Buttons */}
                            <div className="tracking-actions">
                                <a
                                    href={getWhatsAppUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-whatsapp"
                                >
                                    <span>📱</span> WhatsApp Restaurant Support
                                </a>
                                <Link
                                    to="/menu"
                                    className="btn btn-secondary"
                                    style={{ textAlign: 'center', padding: '12px 20px' }}
                                >
                                    Browse Menu
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderTracking;
