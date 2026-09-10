import React, { useEffect, useState, useRef } from 'react';
import {
    subscribeToRiderOrders,
    updateOrderStatus,
    updateRiderOnlineStatus,
    logoutRider,
    getRiderProfile
} from '../firebase';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase-config';

// Formats Pakistani phone numbers for wa.me protocol (e.g., 03001234567 -> 923001234567)
const formatPakistaniWhatsAppPhone = (phone) => {
    if (!phone) return '';
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.startsWith('0')) {
        return '92' + digits.slice(1);
    }
    if (digits.startsWith('92')) {
        return digits;
    }
    return '92' + digits;
};

const Dashboard = () => {
    const [assignedOrders, setAssignedOrders] = useState([]);
    const [pastOrders, setPastOrders] = useState([]);
    const [processingOrders, setProcessingOrders] = useState(new Set());
    const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' or 'past'
    const [riderProfile, setRiderProfile] = useState(null);
    const [isOnline, setIsOnline] = useState(true);
    const [isDaylightMode, setIsDaylightMode] = useState(() => {
        return localStorage.getItem('fb_rider_daylight') === 'true';
    });
    const navigate = useNavigate();

    const prevOrderCountRef = useRef(0);
    const audioContextRef = useRef(null);

    // Toggle outdoor daylight mode
    const toggleDaylightMode = () => {
        setIsDaylightMode(prev => {
            const next = !prev;
            localStorage.setItem('fb_rider_daylight', String(next));
            return next;
        });
    };

    // Synthesizer chime for new assignments
    const playNewOrderChime = () => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') ctx.resume();

            const now = ctx.currentTime;
            [660, 880, 1100].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.12);
                gain.gain.setValueAtTime(0.3, now + idx * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.12);
                osc.stop(now + idx * 0.12 + 0.2);
            });

            // Trigger device vibration on mobile if supported
            if (navigator.vibrate) {
                navigator.vibrate([250, 100, 250]);
            }
        } catch (e) {
            console.warn('Audio chime notice:', e);
        }
    };

    useEffect(() => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            navigate('/login');
            return;
        }

        // Fetch rider profile and initial presence
        getRiderProfile(currentUser.uid).then(result => {
            if (result.success && result.profile) {
                setRiderProfile(result.profile);
                if (result.profile.isOnline !== undefined) {
                    setIsOnline(result.profile.isOnline);
                }
            }
        });

        // Subscribe to rider's orders in real time
        const unsubscribe = subscribeToRiderOrders(
            currentUser.uid,
            (newAssigned) => {
                // Alert if new delivery was assigned
                if (newAssigned.length > prevOrderCountRef.current && prevOrderCountRef.current !== 0) {
                    playNewOrderChime();
                }
                prevOrderCountRef.current = newAssigned.length;
                setAssignedOrders(newAssigned);
            },
            setPastOrders
        );

        return () => unsubscribe();
    }, [navigate]);

    const handleToggleDuty = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const nextStatus = !isOnline;
        setIsOnline(nextStatus);
        await updateRiderOnlineStatus(currentUser.uid, nextStatus);
    };

    const handleLogout = async () => {
        const confirmed = window.confirm('End your delivery shift and log out?');
        if (!confirmed) return;

        const currentUser = auth.currentUser;
        if (currentUser) {
            await updateRiderOnlineStatus(currentUser.uid, false);
        }
        await logoutRider();
        navigate('/login');
    };

    // Progression handler for each delivery step
    const handleProgressOrder = async (orderId, targetStatus, promptMessage) => {
        if (processingOrders.has(orderId)) return;

        if (promptMessage) {
            const ok = window.confirm(promptMessage);
            if (!ok) return;
        }

        setProcessingOrders(prev => new Set(prev).add(orderId));

        const result = await updateOrderStatus(orderId, targetStatus);
        if (!result?.success) {
            alert('Failed to update delivery status: ' + (result?.error || 'Network error'));
            setProcessingOrders(prev => {
                const next = new Set(prev);
                next.delete(orderId);
                return next;
            });
        }
    };

    // Shift cash collected reconciliation
    const todayCashCollected = pastOrders
        .filter(o => {
            const isCOD = (o.paymentMethod || 'COD').toUpperCase() === 'COD';
            if (!isCOD) return false;
            if (!o.deliveredAt && !o.updatedAt) return true;
            const ts = o.deliveredAt?.seconds || o.updatedAt?.seconds || 0;
            const date = new Date(ts * 1000);
            return date.toDateString() === new Date().toDateString();
        })
        .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const orders = activeTab === 'assigned' ? assignedOrders : pastOrders;

    return (
        <div className={`rider-app ${isDaylightMode ? 'daylight-theme' : 'dark-theme'}`}>
            <div className="dashboard-container">
                {/* Header with Driver Profile & Shift Controls */}
                <header className="dashboard-header">
                    <div>
                        <div className="brand-badge">FINE BURGER RIDER</div>
                        <h2 className="header-title">
                            {riderProfile?.name || 'Courier'}
                        </h2>
                        <div className="header-sub">
                            <span>{riderProfile?.phone || riderProfile?.email || 'Courier Active'}</span>
                        </div>
                    </div>

                    <div className="header-actions">
                        <button
                            type="button"
                            onClick={toggleDaylightMode}
                            className="btn-theme-toggle"
                            title="Toggle Daylight High-Contrast Mode"
                            aria-label="Toggle Daylight Mode"
                        >
                            {isDaylightMode ? '🌙 Night' : '☀️ Sun'}
                        </button>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="btn-logout"
                        >
                            Exit
                        </button>
                    </div>
                </header>

                {/* Duty Status Bar & Shift Cash Reconciliation */}
                <div className="duty-panel">
                    <div className="duty-status-row">
                        <div className="duty-left">
                            <span className={`duty-indicator ${isOnline ? 'online' : 'offline'}`}></span>
                            <div>
                                <div className="duty-heading">{isOnline ? 'Online • Ready for Orders' : 'Offline • Shift Paused'}</div>
                                <div className="duty-caption">
                                    {isOnline ? 'Kitchen can assign active deliveries' : 'Turn on to receive orders'}
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleToggleDuty}
                            className={`duty-toggle-btn ${isOnline ? 'active' : ''}`}
                        >
                            {isOnline ? 'Go Offline' : 'Go Online'}
                        </button>
                    </div>

                    {/* Shift KPI Metrics */}
                    <div className="shift-metrics">
                        <div className="metric-box">
                            <div className="metric-label">Active Orders</div>
                            <div className="metric-value highlight">{assignedOrders.length}</div>
                        </div>
                        <div className="metric-box">
                            <div className="metric-label">Delivered Today</div>
                            <div className="metric-value">{pastOrders.length}</div>
                        </div>
                        <div className="metric-box">
                            <div className="metric-label">Cash to Handover</div>
                            <div className="metric-value cash">Rs. {todayCashCollected}</div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="rider-tabs">
                    <button
                        type="button"
                        onClick={() => setActiveTab('assigned')}
                        className={`rider-tab-btn ${activeTab === 'assigned' ? 'active' : ''}`}
                    >
                        Active Deliveries ({assignedOrders.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('past')}
                        className={`rider-tab-btn ${activeTab === 'past' ? 'active' : ''}`}
                    >
                        Completed Shift ({pastOrders.length})
                    </button>
                </div>

                {/* Orders List */}
                <div className="orders-list">
                    {orders.length === 0 ? (
                        <div className="no-orders-box">
                            <span className="no-orders-icon">🛵</span>
                            <h3>{activeTab === 'assigned' ? 'No Active Deliveries' : 'No Completed Orders Yet'}</h3>
                            <p>
                                {activeTab === 'assigned'
                                    ? 'Keep your duty status Online. Orders assigned by the restaurant kitchen will alert you immediately.'
                                    : 'Orders you successfully deliver will appear here with collected cash totals.'}
                            </p>
                        </div>
                    ) : (
                        orders.map(order => {
                            const isProcessing = processingOrders.has(order.id);
                            const orderRef = order.orderReference || (order.id ? `FB-${order.id.slice(0, 5).toUpperCase()}` : 'FB-ORDER');
                            const waPhone = formatPakistaniWhatsAppPhone(order.customer?.phone);
                            const waText = encodeURIComponent(`Hi ${order.customer?.name || ''}! This is your Fine Burger delivery courier with order #${orderRef}. I am on my way to your address!`);
                            const mapUrl = order.customer?.address
                                ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.customer.address)}`
                                : 'https://maps.google.com';

                            // Determine status badge
                            const statusLabel =
                                order.status === 'out_for_delivery' ? 'On The Way'
                                : order.status === 'ready' ? 'Ready at Kitchen'
                                : order.status === 'accepted' ? 'Accepted'
                                : order.status === 'picked_up' ? 'Picked Up'
                                : order.status === 'preparing' ? 'Cooking in Kitchen'
                                : 'Assigned';

                            return (
                                <div key={order.id} className={`rider-order-card status-${order.status}`}>
                                    {/* Card Header */}
                                    <div className="card-top-bar">
                                        <div>
                                            <span className="order-ticket-id">#{orderRef}</span>
                                            <span className={`status-pill ${order.status}`}>{statusLabel}</span>
                                        </div>
                                        <div className="cash-pill">
                                            <span>Collect:</span>
                                            <strong>Rs. {order.total}</strong>
                                        </div>
                                    </div>

                                    {/* Destination & Navigation */}
                                    <div className="destination-block">
                                        <div className="dest-icon">📍</div>
                                        <div className="dest-details">
                                            <span className="dest-label">DELIVERY DESTINATION</span>
                                            <div className="dest-address">{order.customer?.address || 'Pickup at Store'}</div>
                                            {order.customer?.address && (
                                                <a
                                                    href={mapUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="btn-map-nav"
                                                >
                                                    <span>🗺️ Open Turn-by-Turn Maps</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Customer Communication */}
                                    <div className="customer-contact-block">
                                        <div className="customer-meta">
                                            <span className="customer-name">{order.customer?.name || 'Customer'}</span>
                                            <span className="customer-phone">{order.customer?.phone || 'No phone'}</span>
                                        </div>

                                        <div className="contact-buttons-row">
                                            {order.customer?.phone && (
                                                <a
                                                    href={`tel:${order.customer.phone}`}
                                                    className="btn-contact call"
                                                >
                                                    <span>📞 Call</span>
                                                </a>
                                            )}
                                            {waPhone && (
                                                <a
                                                    href={`https://wa.me/${waPhone}?text=${waText}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="btn-contact whatsapp"
                                                >
                                                    <span>💬 WhatsApp</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Packaging / Items Verification */}
                                    {order.items && order.items.length > 0 && (
                                        <div className="rider-items-box">
                                            <div className="rider-items-header">
                                                <span>Bag Verification ({order.items.reduce((s, i) => s + (i.quantity || 1), 0)} items):</span>
                                            </div>
                                            <div className="rider-items-list">
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="rider-item-row">
                                                        <span>
                                                            <strong className="qty-tag">{item.quantity}x</strong> {item.name}
                                                        </span>
                                                        {item.selectedVariations && Object.keys(item.selectedVariations).length > 0 && (
                                                            <div className="rider-item-vars">
                                                                {Object.values(item.selectedVariations).join(', ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Next Step Action Button */}
                                    {activeTab === 'assigned' && (
                                        <div className="rider-actions-bar">
                                            {/* Step 1: Accept if just assigned */}
                                            {order.status === 'ready' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleProgressOrder(order.id, 'out_for_delivery')}
                                                    className="btn-lifecycle pickup"
                                                    disabled={isProcessing}
                                                >
                                                    <span>{isProcessing ? '⏳ Updating...' : '📦 Picked Up • Start Delivery'}</span>
                                                </button>
                                            )}

                                            {/* Step 2: In transit -> Deliver */}
                                            {order.status === 'out_for_delivery' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleProgressOrder(
                                                        order.id,
                                                        'delivered',
                                                        `Confirm: Have you collected Rs. ${order.total} and delivered order #${orderRef}?`
                                                    )}
                                                    className="btn-lifecycle delivered"
                                                    disabled={isProcessing}
                                                >
                                                    <span>{isProcessing ? '⏳ Updating...' : '✅ Mark Delivered & Cash Received'}</span>
                                                </button>
                                            )}

                                            {/* Fallback for preparing orders assigned early */}
                                            {order.status === 'preparing' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleProgressOrder(order.id, 'out_for_delivery')}
                                                    className="btn-lifecycle pickup"
                                                    disabled={isProcessing}
                                                >
                                                    <span>{isProcessing ? '⏳ Updating...' : '📦 Food Ready • Start Delivery'}</span>
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'past' && (
                                        <div className="delivered-badge-row">
                                            <span>✓ Successfully Delivered</span>
                                            <span>•</span>
                                            <span>Cash Collected: Rs. {order.total}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;