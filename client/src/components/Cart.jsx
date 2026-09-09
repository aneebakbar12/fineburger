import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../services/firebase';
import LocationPicker from './LocationPicker';
import AuthModal from './AuthModal'; // Import AuthModal
import { useStaffMode } from '../contexts/StaffModeContext';
import '../styles/Cart.css';

const Cart = ({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, user, onClearCart }) => {
    const navigate = useNavigate();
    const { isStaffMode } = useStaffMode();
    const [isCheckout, setIsCheckout] = useState(false);
    const [authChoice, setAuthChoice] = useState(false); // New state to show auth choice
    const [customerDetails, setCustomerDetails] = useState({
        name: '',
        phone: '',
        address: '',
        location: null, // { lat, lng }
        tableNumber: '' // For Dine-in
    });
    const [orderType, setOrderType] = useState('Delivery'); // 'Delivery', 'Takeaway', 'Dine-in'
    const [loading, setLoading] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [confirmedOrder, setConfirmedOrder] = useState(null);
    const [showMap, setShowMap] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // Auto-fill user details when user logs in
    useEffect(() => {
        if (user && isCheckout) {
            setCustomerDetails(prev => ({
                ...prev,
                name: user.displayName || prev.name || '',
                // phone: user.phoneNumber || prev.phone || '' // Firebase auth often doesn't have phone by default
            }));
        }
    }, [user, isCheckout]);

    // Set default order type based on staff mode
    useEffect(() => {
        if (isStaffMode) {
            setOrderType('Dine-in');
        } else {
            setOrderType('Delivery');
        }
    }, [isStaffMode]);

    const calculateTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
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
            address: address, // Auto-fill address
            location: { lat: latlng.lat, lng: latlng.lng } // Store as plain object
        }));
    };

    const handleProceedToCheckout = () => {
        if (user || isStaffMode) {
            // Skip auth for staff mode or logged-in users
            setIsCheckout(true);
            setAuthChoice(false);
        } else {
            // Show auth choice for regular users
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
        setLoading(true);

        const orderData = {
            customer: customerDetails,
            items: cartItems,
            total: calculateTotal(),
            paymentMethod: 'COD',
            orderType: orderType,
            userId: user ? user.uid : null,
            placedByStaff: isStaffMode
        };

        const result = await createOrder(orderData);

        if (result.success) {
            setConfirmedOrder({
                orderId: result.orderId,
                orderReference: result.orderReference || `FB-${result.orderId.substring(0, 5).toUpperCase()}`,
                total: calculateTotal(),
                items: [...cartItems],
                customer: { ...customerDetails },
                orderType: orderType
            });
            setOrderSuccess(true);
            if (onClearCart) onClearCart(); // Clear the cart state globally
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
            navigate(`/track/${id}`);
        }
    };

    const handleShareWhatsApp = () => {
        if (!confirmedOrder) return;
        const itemsList = confirmedOrder.items
            .map(i => `• ${i.quantity}x ${i.name} (Rs. ${i.price * i.quantity})`)
            .join('\n');
        const dest = confirmedOrder.orderType === 'Delivery'
            ? `📍 Address: ${confirmedOrder.customer?.address || 'N/A'}`
            : `🍽️ Table: #${confirmedOrder.customer?.tableNumber || 'N/A'}`;

        const msg = encodeURIComponent(
`🍔 *FINE BURGER ORDER* 🍔
*Order Ref:* #${confirmedOrder.orderReference}
*Type:* ${confirmedOrder.orderType}
${dest}

*Items:*
${itemsList}

*Total:* Rs. ${confirmedOrder.total}
*Customer:* ${confirmedOrder.customer?.name || 'Guest'} (${confirmedOrder.customer?.phone || 'N/A'})`
        );
        window.open(`https://wa.me/?text=${msg}`, '_blank');
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
                        <div style={{ color: '#4ade80', marginBottom: 'var(--spacing-md)' }}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <h2 style={{ color: 'var(--color-white)', fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-xs)' }}>
                            {isStaffMode && confirmedOrder.orderType === 'Dine-in' ? 'Order Sent to Kitchen!' : 'Order Confirmed!'}
                        </h2>

                        <div style={{
                            margin: 'var(--spacing-md) 0',
                            padding: 'var(--spacing-md)',
                            backgroundColor: 'rgba(255, 180, 0, 0.12)',
                            border: '1px solid #FFB400',
                            borderRadius: 'var(--radius-md)',
                            width: '100%'
                        }}>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Order Reference
                            </div>
                            <div style={{ fontSize: 'var(--font-size-2xl)', color: '#FFB400', fontWeight: 'bold', marginTop: '4px' }}>
                                #{confirmedOrder.orderReference}
                            </div>
                        </div>

                        <div style={{ width: '100%', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                <span>Type:</span>
                                <strong style={{ color: 'var(--color-white)' }}>{confirmedOrder.orderType}</strong>
                            </div>
                            {confirmedOrder.orderType === 'Dine-in' && confirmedOrder.customer.tableNumber && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                    <span>Table:</span>
                                    <strong style={{ color: 'var(--color-white)' }}>Table #{confirmedOrder.customer.tableNumber}</strong>
                                </div>
                            )}
                            {confirmedOrder.orderType === 'Delivery' && confirmedOrder.customer.address && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                    <span>Address:</span>
                                    <strong style={{ color: 'var(--color-white)', maxWidth: '65%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {confirmedOrder.customer.address}
                                    </strong>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-white)', fontWeight: 600 }}>
                                <span>Total Amount:</span>
                                <span style={{ color: '#FFB400' }}>Rs. {confirmedOrder.total}</span>
                            </div>
                        </div>

                        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-lg)' }}>
                            {isStaffMode && confirmedOrder.orderType === 'Dine-in'
                                ? 'Kitchen staff has been notified.'
                                : 'Please keep your reference number for order tracking.'}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                            <button
                                className="btn btn-primary"
                                onClick={handleTrackOrder}
                                style={{ width: '100%', padding: '12px', fontSize: 'var(--font-size-md)', cursor: 'pointer' }}
                            >
                                Track Live Order ➔
                            </button>

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
                                <span>📱</span> Share Order on WhatsApp
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

    // Helper to close specific views
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
                        {authChoice ? 'Sign In' : (isCheckout ? (isStaffMode ? '⚡ Quick Order' : 'Checkout') : 'Your Cart')}
                    </h2>
                    {isStaffMode && isCheckout && (
                        <span style={{
                            fontSize: '12px',
                            color: '#4ade80',
                            fontWeight: 'bold',
                            marginLeft: '8px'
                        }}>
                            STAFF
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
                                <h3>Create an account for:</h3>
                                <ul>
                                    <li>Order tracking & history</li>
                                    <li>Faster checkout next time</li>
                                    <li>Exclusive offers</li>
                                </ul>
                            </div>

                            <button
                                className="auth-choice-btn primary"
                                onClick={() => setIsAuthModalOpen(true)}
                            >
                                Sign In / Sign Up
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
                                <label className="form-label" style={{ color: 'var(--color-text-secondary)' }}>Order Type</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {(isStaffMode ? ['Dine-in'] : ['Takeaway', 'Delivery']).map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setOrderType(type)}
                                            style={{
                                                flex: 1,
                                                padding: '8px',
                                                borderRadius: '6px',
                                                border: orderType === type ? '1px solid var(--color-accent)' : '1px solid #333',
                                                backgroundColor: orderType === type ? 'var(--color-accent)' : '#222',
                                                color: orderType === type ? '#000' : '#ccc',
                                                fontWeight: orderType === type ? 'bold' : 'normal',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Checkout Form Content */}
                            {/* Name - Optional for staff dine-in */}
                            {!(isStaffMode && orderType === 'Dine-in') && (
                                <div className="form-group">
                                    <label className="form-label" style={{ color: 'var(--color-text-secondary)' }}>Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-input"
                                        placeholder="John Doe"
                                        value={customerDetails.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            )}
                            {/* Phone - Optional for staff dine-in */}
                            {!(isStaffMode && orderType === 'Dine-in') && (
                                <div className="form-group">
                                    <label className="form-label" style={{ color: 'var(--color-text-secondary)' }}>Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="form-input"
                                        placeholder="+92 300 1234567"
                                        value={customerDetails.phone}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            )}


                            {/* Address - Only for Delivery */}
                            {orderType === 'Delivery' && (
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-secondary)' }}>
                                        <span>Delivery Address</span>
                                        <button
                                            type="button"
                                            onClick={() => setShowMap(!showMap)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--color-accent)',
                                                cursor: 'pointer',
                                                fontSize: 'var(--font-size-xs)',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {showMap ? 'Hide Map' : '📍 Auto Detect / Pin on Map'}
                                        </button>
                                    </label>

                                    {showMap && (
                                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                            <LocationPicker onAddressSelect={handleAddressSelect} />
                                            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
                                                * Click map to manually set location. Address will auto-fill.
                                            </p>
                                        </div>
                                    )}

                                    <textarea
                                        name="address"
                                        className="form-textarea"
                                        placeholder="Full street address..."
                                        value={customerDetails.address}
                                        onChange={handleInputChange}
                                        required
                                        rows="3"
                                    ></textarea>
                                </div>
                            )}

                            {/* Table Number - Only for Dine-in */}
                            {orderType === 'Dine-in' && (
                                <div className="form-group">
                                    <label className="form-label" style={{ color: 'var(--color-text-secondary)' }}>Table Number</label>
                                    <input
                                        type="text"
                                        name="tableNumber"
                                        className="form-input"
                                        placeholder="Enter table number (e.g. 5)"
                                        value={customerDetails.tableNumber}
                                        onChange={handleInputChange}
                                        required
                                        style={{
                                            backgroundColor: '#222',
                                            color: '#fff',
                                            border: '1px solid #333',
                                            padding: '12px',
                                            borderRadius: '6px'
                                        }}
                                    />
                                </div>
                            )}

                            <div style={{ marginTop: 'var(--spacing-lg)', borderTop: '1px solid var(--color-medium-gray)', paddingTop: 'var(--spacing-md)' }}>
                                <div className="cart-total" style={{ marginBottom: 'var(--spacing-sm)' }}>
                                    <span className="cart-total-label">Subtotal:</span>
                                    <span className="cart-total-amount" style={{ fontSize: 'var(--font-size-lg)' }}>Rs. {calculateTotal()}</span>
                                </div>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', textAlign: 'right' }}>
                                    Payment Method: Cash on Delivery
                                </div>
                            </div>

                            <button type="submit" className="cart-checkout-btn" disabled={loading} style={{ marginTop: 'var(--spacing-lg)' }}>
                                {loading ? 'Placing Order...' : 'Confirm Order'}
                            </button>
                        </form>
                    ) : (
                        cartItems.length === 0 ? (
                            <div className="cart-empty">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="9" cy="21" r="1" />
                                    <circle cx="20" cy="21" r="1" />
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                </svg>
                                <p>Your cart is empty</p>
                            </div>
                        ) : (
                            <div className="cart-items">
                                {cartItems.map((item, index) => (
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
                                                        onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                                                    >
                                                        −
                                                    </button>
                                                    <span>{item.quantity}</span>
                                                    <button
                                                        className="quantity-btn-small"
                                                        onClick={() => {
                                                            if (item.stockLevel !== undefined && item.quantity >= item.stockLevel) return;
                                                            onUpdateQuantity(index, item.quantity + 1);
                                                        }}
                                                        disabled={item.stockLevel !== undefined && item.quantity >= item.stockLevel}
                                                        style={{ opacity: item.stockLevel !== undefined && item.quantity >= item.stockLevel ? 0.5 : 1 }}
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                <span className="cart-item-price">Rs. {item.price * item.quantity}</span>
                                            </div>
                                        </div>

                                        <button
                                            className="cart-item-remove"
                                            onClick={() => onRemoveItem(index)}
                                            aria-label="Remove item"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>

                {!isCheckout && !authChoice && cartItems.length > 0 && (
                    <div className="cart-footer">
                        <div className="cart-total">
                            <span className="cart-total-label">Total:</span>
                            <span className="cart-total-amount">Rs. {calculateTotal()}</span>
                        </div>
                        <button className="cart-checkout-btn" onClick={handleProceedToCheckout}>
                            Proceed to Checkout
                        </button>
                    </div>
                )}
            </div >

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onLoginSuccess={() => {
                    setIsAuthModalOpen(false);
                    setAuthChoice(false);
                    setIsCheckout(true); // Proceed to checkout after login
                }}
            />
        </>
    );
};

export default Cart;
