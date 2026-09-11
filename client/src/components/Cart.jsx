import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../services/firebase';
import {
    isNotificationSupported,
    getNotificationPermission,
    requestNotificationPermission,
    showPushNotification
} from '../services/notificationService';
import LocationPicker from './LocationPicker';
import AuthModal from './AuthModal';
import { useStaffMode } from '../contexts/StaffModeContext';
import '../styles/Cart.css';

// Parse price increments from variation strings, e.g. "Large 13 inch (+Rs. 450)"
export const getItemUnitPrice = (item) => {
    let basePrice = Number(item.basePrice !== undefined ? item.basePrice : item.price) || 0;
    if (item.selectedVariations && typeof item.selectedVariations === 'object') {
        Object.values(item.selectedVariations).forEach(val => {
            if (typeof val === 'string') {
                const match = val.match(/\(\s*\+\s*(?:Rs\.?|PKR)?\s*([0-9]+)\s*\)/i);
                if (match && match[1]) {
                    basePrice += Number(match[1]);
                }
            }
        });
        return basePrice;
    }
    return Number(item.price) || 0;
};

const Cart = ({
    isOpen,
    onClose,
    cartItems,
    items,
    onUpdateQuantity,
    onRemoveItem,
    user,
    onClearCart,
    storeSettings
}) => {
    const navigate = useNavigate();
    const { isStaffMode } = useStaffMode();
    const activeCartItems = cartItems || items || [];

    const [isCheckout, setIsCheckout] = useState(false);
    const [authChoice, setAuthChoice] = useState(false);
    const [customerDetails, setCustomerDetails] = useState({
        name: '',
        phone: '',
        address: '',
        location: null,
        tableNumber: ''
    });
    const [orderType, setOrderType] = useState('Delivery'); // 'Delivery', 'Takeaway', 'Dine-in'
    const [loading, setLoading] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [confirmedOrder, setConfirmedOrder] = useState(null);
    const [showMap, setShowMap] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission());

    // Auto-fill user details ONLY for personal customer orders (never in staff POS mode)
    useEffect(() => {
        if (user && isCheckout && !isStaffMode) {
            setCustomerDetails(prev => ({
                ...prev,
                name: user.displayName || prev.name || ''
            }));
        }
    }, [user, isCheckout, isStaffMode]);

    // Set default order type based on staff mode
    useEffect(() => {
        if (isStaffMode) {
            setOrderType('Dine-in');
        } else {
            setOrderType('Delivery');
        }
    }, [isStaffMode]);

    // Clean up incompatible fields when changing order type
    const handleOrderTypeChange = (type) => {
        setOrderType(type);
        setCustomerDetails(prev => {
            const next = { ...prev };
            if (type === 'Dine-in') {
                next.address = '';
                next.location = null;
                if (isStaffMode) {
                    next.name = '';
                    next.phone = '';
                }
            } else if (type === 'Takeaway') {
                next.tableNumber = '';
                next.address = '';
                next.location = null;
            } else if (type === 'Delivery') {
                next.tableNumber = '';
            }
            return next;
        });
    };

    const calculateSubtotal = () => {
        return activeCartItems.reduce((total, item) => total + (getItemUnitPrice(item) * item.quantity), 0);
    };

    const deliveryFee = orderType === 'Delivery' ? (Number(storeSettings?.deliveryFee) || 120) : 0;

    const calculateTotal = () => {
        return calculateSubtotal() + deliveryFee;
    };

    const handleInputChange = (e) => {
        setCustomerDetails({
            ...customerDetails,
            [e.target.name]: e.target.value
        });
    };

    const handleAddressSelect = (address, latlng) => {
        setCustomerDetails(prev => ({
            ...prev,
            address: address,
            location: { lat: latlng.lat, lng: latlng.lng }
        }));
    };

    const handleProceedToCheckout = () => {
        if (user || isStaffMode) {
            setIsCheckout(true);
            setAuthChoice(false);
        } else {
            setAuthChoice(true);
            setIsCheckout(false);
        }
    };

    const handleGuestCheckout = () => {
        setAuthChoice(false);
        setIsCheckout(true);
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        // Validation based on mode and order type
        if (isStaffMode) {
            if (orderType === 'Dine-in' && !customerDetails.tableNumber?.trim()) {
                alert('Please enter the Table Number for Dine-in.');
                return;
            }
            if (orderType === 'Takeaway' && !customerDetails.name?.trim()) {
                alert('Please enter the Customer Name for Takeaway.');
                return;
            }
        } else {
            // Customer full name validation (no whitespace bypass)
            if (!customerDetails.name?.trim()) {
                alert('Please enter your full name.');
                return;
            }

            // Online customer orders require valid phone number
            const cleanPhone = (customerDetails.phone || '').replace(/[\s\-()]/g, '');
            const pakistaniRegex = /^(\+92|92|0)?3[0-9]{9}$/;
            const generalRegex = /^\+?[0-9]{10,14}$/;
            if (!pakistaniRegex.test(cleanPhone) && !generalRegex.test(cleanPhone)) {
                alert('Please enter a valid Pakistani phone number (e.g. 0300 1234567 or +92 300 1234567)');
                return;
            }

            if (orderType === 'Dine-in' && !customerDetails.tableNumber?.trim()) {
                alert('Please enter your table number for Dine-in orders.');
                return;
            }

            if (orderType === 'Delivery' && !customerDetails.address?.trim()) {
                alert('Please enter your complete delivery address.');
                return;
            }
        }

        setLoading(true);

        const subtotal = calculateSubtotal();
        const finalTotal = calculateTotal();

        const orderItems = activeCartItems.map(item => ({
            ...item,
            unitPrice: getItemUnitPrice(item),
            itemTotal: getItemUnitPrice(item) * item.quantity
        }));

        // Clean customer details object according to fulfillment type
        const cleanCustomer = {
            name: customerDetails.name?.trim() || '',
            phone: customerDetails.phone?.trim() || '',
            address: orderType === 'Delivery' ? customerDetails.address?.trim() : '',
            location: orderType === 'Delivery' ? customerDetails.location : null,
            tableNumber: orderType === 'Dine-in' ? customerDetails.tableNumber?.trim() : ''
        };

        const orderData = {
            customer: cleanCustomer,
            items: orderItems,
            subtotal: subtotal,
            deliveryFee: deliveryFee,
            total: finalTotal,
            paymentMethod: 'COD',
            orderType: orderType,
            // In POS mode, do not bind the cashier's private userId to in-store customer orders
            userId: (!isStaffMode && user) ? user.uid : null,
            placedByStaff: isStaffMode
        };

        const result = await createOrder(orderData);

        if (result.success) {
            const ref = result.orderReference || `FB-${result.orderId.substring(0, 5).toUpperCase()}`;
            const confirmed = {
                orderId: result.orderId,
                orderReference: ref,
                subtotal: subtotal,
                deliveryFee: deliveryFee,
                total: finalTotal,
                items: [...orderItems],
                customer: { ...cleanCustomer },
                orderType: orderType
            };
            setConfirmedOrder(confirmed);
            setOrderSuccess(true);
            if (onClearCart) onClearCart();

            // Write to guest history only for online customers (not staff POS counter orders)
            if (!isStaffMode) {
                const orderRecord = {
                    orderId: result.orderId,
                    orderReference: ref,
                    total: finalTotal,
                    orderType: orderType,
                    itemCount: activeCartItems.reduce((s, i) => s + i.quantity, 0),
                    itemsSummary: activeCartItems.map(i => `${i.quantity}x ${i.name}`).join(', '),
                    items: [...orderItems],
                    customer: { ...cleanCustomer },
                    placedAt: Date.now()
                };

                try {
                    const existing = JSON.parse(localStorage.getItem('fb_recent_orders') || '[]');
                    const filtered = existing.filter(o => o.orderId !== result.orderId);
                    filtered.unshift(orderRecord);
                    const trimmed = filtered.slice(0, 10);
                    localStorage.setItem('fb_recent_orders', JSON.stringify(trimmed));
                    localStorage.setItem('fb_guest_orders', JSON.stringify(trimmed));
                } catch (_) {}
            }
        } else {
            alert('Failed to place order: ' + result.error);
        }
        setLoading(false);
    };

    const handleDismissSuccess = () => {
        setOrderSuccess(false);
        setConfirmedOrder(null);
        setIsCheckout(false);
        setAuthChoice(false);
        setCustomerDetails({ name: '', phone: '', address: '', location: null, tableNumber: '' });
        onClose();
    };

    const handleTrackOrder = () => {
        if (confirmedOrder?.orderId) {
            const id = confirmedOrder.orderId;
            handleDismissSuccess();
            navigate(`/track-order/${id}`);
        }
    };

    const handleEnableNotifications = async () => {
        const granted = await requestNotificationPermission();
        setNotificationPermission(granted ? 'granted' : 'denied');
        if (granted && confirmedOrder) {
            showPushNotification('🔔 Notifications Active!', {
                body: `We'll alert you when order #${confirmedOrder.orderReference} updates!`
            });
        }
    };

    const handleShareWhatsApp = () => {
        if (!confirmedOrder) return;

        const itemsList = confirmedOrder.items
            .map(i => {
                const itemTotal = `Rs. ${(i.unitPrice || i.price) * i.quantity}`;
                const nameStr = `${i.quantity}x ${i.name}`.slice(0, 22);
                return `• ${nameStr.padEnd(22, ' ')} ${itemTotal}`;
            })
            .join('\n');

        let destInfo = '';
        if (confirmedOrder.orderType === 'Delivery') {
            destInfo = `Address   : ${confirmedOrder.customer?.address || 'N/A'}`;
        } else if (confirmedOrder.orderType === 'Dine-in') {
            destInfo = `Table     : #${confirmedOrder.customer?.tableNumber || 'N/A'}`;
        }

        const trackUrl = `${window.location.origin}/track-order/${confirmedOrder.orderId}`;
        const storePhoneRaw = storeSettings?.storePhone || '0321 4854410';
        const cleanStoreDigits = storePhoneRaw.replace(/[^0-9]/g, '');
        const waRecipient = cleanStoreDigits.startsWith('0') ? '92' + cleanStoreDigits.slice(1) : (cleanStoreDigits.startsWith('92') ? cleanStoreDigits : '92' + cleanStoreDigits);

        const msg = encodeURIComponent(
`🍔 *FINE BURGER & FAST FOOD*
📍 _Main G.T. Road, Baghbanpura, Lahore_
📞 _+92 321 4854410_

\`\`\`
==============================
      ORDER RECEIPT
==============================
Order Ref : #${confirmedOrder.orderReference}
Order Type: ${confirmedOrder.orderType}
${destInfo ? `${destInfo}\n` : ''}------------------------------
ITEMS:
${itemsList}
------------------------------
Subtotal  : Rs. ${confirmedOrder.subtotal || confirmedOrder.total}
${confirmedOrder.deliveryFee ? `Delivery  : Rs. ${confirmedOrder.deliveryFee}\n` : ''}TOTAL     : Rs. ${confirmedOrder.total}
Payment   : Cash on Delivery
==============================
CUSTOMER:
Name  : ${confirmedOrder.customer?.name || (confirmedOrder.orderType === 'Dine-in' ? `Table #${confirmedOrder.customer?.tableNumber || ''}` : 'Guest')}
Phone : ${confirmedOrder.customer?.phone || 'N/A'}
==============================
\`\`\`

🔗 *Track Live Order Status:*
${trackUrl}`
        );

        window.open(`https://wa.me/${waRecipient}?text=${msg}`, '_blank');
    };

    if (!isOpen) return null;

    if (orderSuccess && confirmedOrder) {
        return (
            <>
                <div className="cart-backdrop" onClick={handleDismissSuccess}></div>
                <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
                    <div className="cart-header">
                        <h2 className="cart-title">Order Receipt</h2>
                        <button className="cart-close" onClick={handleDismissSuccess} aria-label="Close">
                            ✕
                        </button>
                    </div>
                    <div className="cart-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                        <div style={{ color: '#10B981', marginBottom: 'var(--spacing-md)' }}>
                            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <h2 style={{ color: 'var(--color-white)', fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-xs)' }}>
                            {isStaffMode
                                ? (confirmedOrder.orderType === 'Dine-in' ? 'Table Order Sent to Kitchen!' : 'Takeaway Order Sent to Kitchen!')
                                : 'Order Confirmed!'}
                        </h2>

                        <div style={{
                            margin: 'var(--spacing-md) 0',
                            padding: 'var(--spacing-md)',
                            backgroundColor: 'rgba(255, 180, 0, 0.1)',
                            border: '1px solid var(--color-accent)',
                            borderRadius: 'var(--radius-md)',
                            width: '100%'
                        }}>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Order Reference
                            </div>
                            <div style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-accent)', fontWeight: 'bold', marginTop: '4px' }}>
                                #{confirmedOrder.orderReference}
                            </div>
                        </div>

                        <div style={{ width: '100%', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', textAlign: 'left', border: '1px solid var(--color-light-gray)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                <span>Type:</span>
                                <strong style={{ color: 'var(--color-white)' }}>{confirmedOrder.orderType}</strong>
                            </div>

                            {/* Show customer name when provided */}
                            {confirmedOrder.customer?.name && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                    <span>Customer:</span>
                                    <strong style={{ color: 'var(--color-white)' }}>{confirmedOrder.customer.name}</strong>
                                </div>
                            )}

                            {/* Table Number for Dine-in */}
                            {confirmedOrder.orderType === 'Dine-in' && confirmedOrder.customer?.tableNumber && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                    <span>Table:</span>
                                    <strong style={{ color: 'var(--color-white)' }}>Table #{confirmedOrder.customer.tableNumber}</strong>
                                </div>
                            )}

                            {/* Delivery Address */}
                            {confirmedOrder.orderType === 'Delivery' && confirmedOrder.customer?.address && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                    <span>Address:</span>
                                    <strong style={{ color: 'var(--color-white)', maxWidth: '65%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {confirmedOrder.customer.address}
                                    </strong>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-white)', fontWeight: 600 }}>
                                <span>Total Amount:</span>
                                <span style={{ color: 'var(--color-accent)' }}>Rs. {confirmedOrder.total}</span>
                            </div>
                        </div>

                        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-lg)' }}>
                            {isStaffMode
                                ? 'Kitchen staff has been notified.'
                                : 'Save your reference number to track live status.'}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                            <button
                                className="btn btn-primary"
                                onClick={handleTrackOrder}
                                style={{ width: '100%', padding: '12px', fontSize: 'var(--font-size-base)', cursor: 'pointer' }}
                            >
                                Track Live Order ➔
                            </button>

                            {isNotificationSupported() && notificationPermission !== 'granted' && (
                                <button
                                    onClick={handleEnableNotifications}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        fontSize: 'var(--font-size-sm)',
                                        cursor: 'pointer',
                                        backgroundColor: 'rgba(255, 180, 0, 0.12)',
                                        border: '1px dashed var(--color-accent)',
                                        color: 'var(--color-accent)',
                                        borderRadius: 'var(--radius-md)',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <span>🔔</span> Alert Me on Order Progress
                                </button>
                            )}

                            <button
                                onClick={handleShareWhatsApp}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    fontSize: 'var(--font-size-sm)',
                                    cursor: 'pointer',
                                    backgroundColor: '#25D366',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                <span>📱</span> Send Receipt to Restaurant WhatsApp
                            </button>

                            <button
                                onClick={handleDismissSuccess}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    fontSize: 'var(--font-size-sm)',
                                    cursor: 'pointer',
                                    backgroundColor: 'transparent',
                                    color: 'var(--color-text-secondary)',
                                    border: 'none'
                                }}
                            >
                                Done (Dismiss)
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const handleClose = () => {
        if (isCheckout || authChoice) {
            setIsCheckout(false);
            setAuthChoice(false);
        } else {
            onClose();
        }
    };

    return (
        <>
            <div className="cart-backdrop" onClick={onClose}></div>
            <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="cart-header">
                    <button
                        className="cart-close"
                        onClick={handleClose}
                        style={{ marginRight: 'auto', marginLeft: 0 }}
                        aria-label="Back"
                    >
                        {(isCheckout || authChoice) ? '← Back' : ''}
                    </button>
                    <h2 className="cart-title">
                        {authChoice ? 'Sign In' : (isCheckout ? (isStaffMode ? '⚡ Quick POS Order' : 'Checkout') : 'Your Order')}
                    </h2>
                    {isStaffMode && isCheckout && (
                        <span style={{
                            fontSize: '11px',
                            color: '#10B981',
                            fontWeight: 'bold',
                            marginLeft: '8px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)'
                        }}>
                            STAFF POS
                        </span>
                    )}
                    {(!isCheckout && !authChoice) && (
                        <button className="cart-close" onClick={onClose} aria-label="Close cart">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                <div className="cart-body">
                    {authChoice ? (
                        <div className="auth-choice-container">
                            <div className="auth-benefits">
                                <h3>Order with Fine Burger</h3>
                                <ul>
                                    <li>Track live delivery in real time</li>
                                    <li>Save delivery addresses</li>
                                    <li>Quick 1-tap reordering</li>
                                </ul>
                            </div>

                            <button
                                className="auth-choice-btn primary"
                                onClick={() => setIsAuthModalOpen(true)}
                            >
                                Sign In / Register
                            </button>

                            <div className="auth-divider">
                                <span>OR</span>
                            </div>

                            <button
                                className="auth-choice-btn guest"
                                onClick={handleGuestCheckout}
                            >
                                Continue as Guest
                            </button>
                        </div>
                    ) : isCheckout ? (
                        <form onSubmit={handlePlaceOrder} className="checkout-form">
                            {/* Order Type Selector */}
                            <div className="form-group">
                                <label className="form-label" style={{ color: 'var(--color-text-secondary)' }}>Fulfillment Method</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {(isStaffMode ? ['Dine-in', 'Takeaway'] : ['Delivery', 'Takeaway', 'Dine-in']).map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => handleOrderTypeChange(type)}
                                            style={{
                                                flex: 1,
                                                padding: '10px 6px',
                                                borderRadius: '6px',
                                                border: orderType === type ? '1px solid var(--color-accent)' : '1px solid var(--color-medium-gray)',
                                                backgroundColor: orderType === type ? 'var(--color-accent)' : 'var(--color-surface)',
                                                color: orderType === type ? '#000' : 'var(--color-text-primary)',
                                                fontWeight: orderType === type ? 700 : 500,
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            {type === 'Delivery' ? '🛵 Delivery' : type === 'Takeaway' ? '🛍️ Takeaway' : '🍽️ Dine-in'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* POS Mode: Takeaway Fields */}
                            {isStaffMode && orderType === 'Takeaway' && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label" style={{ color: 'var(--color-text-secondary)' }}>Customer Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="form-input"
                                            placeholder="Customer name (e.g. Ali Ahmed)"
                                            value={customerDetails.name}
                                            onChange={handleInputChange}
                                            autoFocus
                                            required
                                            style={{ fontSize: '16px' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{ color: 'var(--color-text-secondary)' }}>Mobile Phone (Optional)</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className="form-input"
                                            placeholder="0300 1234567"
                                            value={customerDetails.phone}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Online Customer: Name & Phone */}
                            {!isStaffMode && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label" style={{ color: 'var(--color-text-secondary)' }}>Full Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="form-input"
                                            placeholder="Your full name"
                                            value={customerDetails.name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" style={{ color: 'var(--color-text-secondary)' }}>Mobile Phone *</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className="form-input"
                                            placeholder="0300 1234567"
                                            value={customerDetails.phone}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        <small style={{ color: 'var(--color-text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                                            {orderType === 'Delivery'
                                                ? 'For order status and delivery courier updates'
                                                : 'For order status and pickup updates'}
                                        </small>
                                    </div>
                                </>
                            )}

                            {/* Unified Table Number for Dine-in (both POS and Online customer) */}
                            {orderType === 'Dine-in' && (
                                <div className="form-group">
                                    <label className="form-label" style={{ color: 'var(--color-text-secondary)' }}>Table Number *</label>
                                    <input
                                        type="text"
                                        name="tableNumber"
                                        className="form-input"
                                        placeholder="e.g. Table 4"
                                        value={customerDetails.tableNumber}
                                        onChange={handleInputChange}
                                        autoFocus={isStaffMode}
                                        required
                                        style={{ fontSize: isStaffMode ? '18px' : 'inherit', fontWeight: isStaffMode ? 'bold' : 'normal' }}
                                    />
                                </div>
                            )}

                            {/* Online Customer: Delivery Address & Map */}
                            {!isStaffMode && orderType === 'Delivery' && (
                                <div className="form-group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <label className="form-label" style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Delivery Address *</label>
                                        <button
                                            type="button"
                                            onClick={() => setShowMap(!showMap)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--color-accent)',
                                                fontSize: '12px',
                                                cursor: 'pointer',
                                                textDecoration: 'underline'
                                            }}
                                        >
                                            {showMap ? 'Hide Map' : '📍 Pin on Map'}
                                        </button>
                                    </div>

                                    {showMap && (
                                        <div style={{ marginBottom: '10px' }}>
                                            <LocationPicker onAddressSelect={handleAddressSelect} />
                                        </div>
                                    )}

                                    <textarea
                                        name="address"
                                        className="form-textarea"
                                        placeholder="House #, Street #, Area, Landmark (e.g. Near Shalimar Gardens, Baghbanpura)"
                                        value={customerDetails.address}
                                        onChange={handleInputChange}
                                        required
                                        rows="3"
                                    ></textarea>
                                </div>
                            )}

                            {/* Price Summary */}
                            <div style={{ marginTop: 'var(--spacing-md)', borderTop: '1px solid var(--color-medium-gray)', paddingTop: 'var(--spacing-md)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                    <span>Subtotal:</span>
                                    <span style={{ color: 'var(--color-text-primary)' }}>Rs. {calculateSubtotal()}</span>
                                </div>
                                {orderType === 'Delivery' && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                        <span>Delivery Fee:</span>
                                        <span style={{ color: 'var(--color-text-primary)' }}>Rs. {deliveryFee}</span>
                                    </div>
                                )}
                                <div className="cart-total" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                                    <span className="cart-total-label">Grand Total:</span>
                                    <span className="cart-total-amount">Rs. {calculateTotal()}</span>
                                </div>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', textAlign: 'right', marginTop: '4px' }}>
                                    Payment: Cash on Delivery (COD)
                                </div>
                            </div>

                            <button type="submit" className="cart-checkout-btn" disabled={loading} style={{ marginTop: 'var(--spacing-lg)' }}>
                                {loading ? 'Placing Order...' : (isStaffMode ? 'Send to Kitchen' : 'Confirm Order')}
                            </button>
                        </form>
                    ) : (
                        activeCartItems.length === 0 ? (
                            <div className="cart-empty">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="9" cy="21" r="1" />
                                    <circle cx="20" cy="21" r="1" />
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                </svg>
                                <p>Your cart is empty</p>
                                <button
                                    className="btn btn-secondary"
                                    onClick={onClose}
                                    style={{ marginTop: '16px', fontSize: '13px' }}
                                >
                                    Browse Menu
                                </button>
                            </div>
                        ) : (
                            <div className="cart-items">
                                {activeCartItems.map((item, index) => {
                                    const unitPrice = getItemUnitPrice(item);
                                    const lineTotal = unitPrice * item.quantity;
                                    return (
                                        <div key={index} className="cart-item">
                                            <div
                                                className="cart-item-image"
                                                style={{ backgroundImage: `url(${item.imageUrl})` }}
                                            ></div>

                                            <div className="cart-item-details">
                                                <h3 className="cart-item-name">{item.name}</h3>

                                                {item.selectedVariations && Object.keys(item.selectedVariations).length > 0 && (
                                                    <div className="cart-item-variations">
                                                        {Object.entries(item.selectedVariations).map(([key, value]) => (
                                                            <span key={key} className="variation-tag">
                                                                {key}: {value}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="cart-item-footer">
                                                    <div className="cart-item-quantity">
                                                        <button
                                                            className="quantity-btn-small"
                                                            onClick={() => onUpdateQuantity(index, -1)}
                                                            aria-label="Decrease quantity"
                                                        >
                                                            −
                                                        </button>
                                                        <span>{item.quantity}</span>
                                                        <button
                                                            className="quantity-btn-small"
                                                            onClick={() => {
                                                                if (item.stockLevel !== undefined && item.quantity >= item.stockLevel) return;
                                                                onUpdateQuantity(index, 1);
                                                            }}
                                                            disabled={item.stockLevel !== undefined && item.quantity >= item.stockLevel}
                                                            aria-label="Increase quantity"
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    <span className="cart-item-price">Rs. {lineTotal}</span>
                                                </div>
                                            </div>

                                            <button
                                                className="cart-item-remove"
                                                onClick={() => onRemoveItem(index)}
                                                aria-label="Remove item"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    )}
                </div>

                {!isCheckout && !authChoice && activeCartItems.length > 0 && (
                    <div className="cart-footer">
                        <div className="cart-total">
                            <span className="cart-total-label">Subtotal:</span>
                            <span className="cart-total-amount">Rs. {calculateSubtotal()}</span>
                        </div>
                        <button className="cart-checkout-btn" onClick={handleProceedToCheckout}>
                            Proceed to Checkout ➔
                        </button>
                    </div>
                )}
            </div>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onLoginSuccess={() => {
                    setIsAuthModalOpen(false);
                    setAuthChoice(false);
                    setIsCheckout(true);
                }}
            />
        </>
    );
};

export default Cart;