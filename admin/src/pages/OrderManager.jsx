import React, { useState, useEffect } from 'react';
import {
    subscribeToOrders,
    updateOrderStatus,
    getServerTimestamp,
    getRiders,
    assignOrderToRider
} from '../services/firebase';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import {
    SearchIcon,
    FilterIcon,
    PrinterIcon,
    CheckIcon,
    ClockIcon,
    CloseIcon,
    RidersIcon
} from '../components/Icons';
import '../styles/admin.css';

// --- Countdown Timer Component ---
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
            color: isOverdue ? '#ef4444' : '#10b981',
            fontWeight: 700,
            fontSize: '12px',
            backgroundColor: 'rgba(0,0,0,0.4)',
            padding: '4px 8px',
            borderRadius: '4px',
            border: `1px solid ${isOverdue ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
        }}>
            <ClockIcon width={14} height={14} />
            <span>{isOverdue ? 'Overdue' : timeLeft}</span>
        </div>
    );
};

// --- Order Details Modal ---
const OrderDetailsModal = ({
    order,
    serialNumber,
    isOpen,
    onClose,
    onUpdateStatus,
    onPrint,
    riders,
    onAssignRider,
    onRequestCancel
}) => {
    const [selectedRiderId, setSelectedRiderId] = useState(order?.assignedRiderId || '');

    useEffect(() => {
        setSelectedRiderId(order?.assignedRiderId || '');
    }, [order]);

    if (!isOpen || !order) return null;

    const handleAssignRider = () => {
        if (selectedRiderId && onAssignRider) {
            const rider = riders.find(r => r.id === selectedRiderId);
            if (rider) {
                onAssignRider(order.id, selectedRiderId, rider.name);
            }
        }
    };

    const statusColors = getStatusColor(order.status);

    return (
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000,
            display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px',
            backdropFilter: 'blur(6px)'
        }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                backgroundColor: 'var(--surface-card)', borderRadius: '16px', width: '95%', maxWidth: '800px',
                maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--surface-border)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
            }}>
                <div style={{ padding: '30px' }}>
                    {/* Header */}
                    <div className="modal-header">
                        <div className="modal-title-row">
                            <h2 style={{ fontSize: '24px', color: 'var(--text-primary)', margin: 0 }}>
                                Order #{serialNumber || order.id.slice(0, 6).toUpperCase()}
                            </h2>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                                <span className="badge" style={{
                                    backgroundColor: statusColors.bg,
                                    color: statusColors.text,
                                    border: `1px solid ${statusColors.text}`
                                }}>
                                    {order.status}
                                </span>
                                {order.orderType && (
                                    <span className="badge" style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}>
                                        {order.orderType}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none', border: 'none', color: 'var(--text-secondary)',
                                cursor: 'pointer', padding: '6px', borderRadius: '50%'
                            }}
                            aria-label="Close dialog"
                        >
                            <CloseIcon width={22} height={22} />
                        </button>
                    </div>

                    {/* Modal Grid */}
                    <div className="modal-grid">
                        {/* Customer Information */}
                        <div className="modal-section">
                            <h3 className="modal-section-title">Customer Details</h3>
                            {order.orderType === 'Dine-in' ? (
                                <>
                                    <div className="detail-row">
                                        <span className="detail-label">Service:</span>
                                        <span className="detail-value" style={{ color: 'var(--color-accent)' }}>Dine-In</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Table:</span>
                                        <span className="detail-value" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                            Table #{order.customer?.tableNumber || 'N/A'}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="detail-row">
                                        <span className="detail-label">Name:</span>
                                        <span className="detail-value">{order.customer?.name || 'Guest'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Phone:</span>
                                        <span className="detail-value">{order.customer?.phone || 'N/A'}</span>
                                    </div>
                                    {order.orderType === 'Delivery' && (
                                        <div className="detail-row">
                                            <span className="detail-label">Address:</span>
                                            <span className="detail-value" style={{ maxWidth: '200px', textAlign: 'right' }}>
                                                {order.customer?.address || 'N/A'}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Order Items & Payment */}
                        <div className="modal-section">
                            <h3 className="modal-section-title">Items Ordered ({order.items?.length || 0})</h3>
                            <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '6px' }}>
                                {order.items?.map((item, idx) => (
                                    <div key={idx} className="order-item-row">
                                        <div>
                                            <span className="item-qty">{item.quantity}x</span>
                                            <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{item.name}</span>
                                            {item.selectedVariations && Object.values(item.selectedVariations).length > 0 && (
                                                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                                                    {Object.values(item.selectedVariations).join(', ')}
                                                </div>
                                            )}
                                        </div>
                                        <div className="item-price">
                                            Rs. {item.price * item.quantity}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="summary-row" style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '14px' }}>
                                <span>Payment Method</span>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{order.paymentMethod || 'Cash'}</span>
                            </div>
                            <div className="summary-row">
                                <span>Grand Total</span>
                                <span style={{ color: 'var(--color-accent)' }}>Rs. {order.total}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '24px', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                            onClick={() => onPrint(order)}
                            className="btn btn-secondary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
                        >
                            <PrinterIcon width={18} height={18} />
                            <span>Print Receipt</span>
                        </button>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            {order.status === 'pending' && (
                                <>
                                    <button
                                        className="btn-action confirm"
                                        onClick={() => onUpdateStatus(order.id, 'preparing')}
                                        style={{ padding: '10px 20px', borderRadius: '8px' }}
                                    >
                                        Confirm & Cook
                                    </button>
                                    <button
                                        className="btn-action cancel"
                                        onClick={() => onRequestCancel(order.id)}
                                        style={{ padding: '10px 16px', borderRadius: '8px' }}
                                    >
                                        Cancel
                                    </button>
                                </>
                            )}

                            {order.status === 'preparing' && (
                                <button
                                    className="btn-action ready"
                                    onClick={() => onUpdateStatus(order.id, 'ready')}
                                    style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '10px 20px', borderRadius: '8px' }}
                                >
                                    Mark Ready
                                </button>
                            )}

                            {order.status === 'ready' && (
                                <>
                                    {order.orderType === 'Delivery' && (
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <select
                                                value={selectedRiderId}
                                                onChange={(e) => setSelectedRiderId(e.target.value)}
                                                style={{
                                                    padding: '8px 12px',
                                                    backgroundColor: 'var(--surface-elevated)',
                                                    border: '1px solid var(--surface-border)',
                                                    borderRadius: '6px',
                                                    color: 'white',
                                                    fontSize: '13px'
                                                }}
                                            >
                                                <option value="">Select Rider...</option>
                                                {riders.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name}</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={handleAssignRider}
                                                disabled={!selectedRiderId || selectedRiderId === order.assignedRiderId}
                                                className="btn btn-secondary"
                                                style={{ padding: '8px 14px', fontSize: '13px' }}
                                            >
                                                Assign
                                            </button>
                                        </div>
                                    )}
                                    <button
                                        className="btn-action deliver"
                                        onClick={() => onUpdateStatus(order.id, 'delivered')}
                                        style={{ backgroundColor: '#10b981', color: 'black', padding: '10px 20px', borderRadius: '8px' }}
                                    >
                                        {order.orderType === 'Dine-in' ? 'Payment Received' : 'Mark Delivered'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const getStatusColor = (status) => {
    switch (status) {
        case 'pending': return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: '#f59e0b' };
        case 'preparing': return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: '#3b82f6' };
        case 'ready': return { bg: 'rgba(139, 92, 246, 0.15)', text: '#8b5cf6', border: '#8b5cf6' };
        case 'delivered': return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#10b981' };
        case 'cancelled': return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: '#ef4444' };
        default: return { bg: 'rgba(255,255,255,0.08)', text: '#94a3b8', border: '#94a3b8' };
    }
};

const OrderManager = () => {
    const toast = useToast();
    const [orders, setOrders] = useState([]);
    const [riders, setRiders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrderId, setSelectedOrderId] = useState(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [orderTypeFilter, setOrderTypeFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Cancel modal state
    const [cancellingOrderId, setCancellingOrderId] = useState(null);

    useEffect(() => {
        const unsubscribe = subscribeToOrders((newOrders) => {
            setOrders(newOrders);
            setLoading(false);
        });

        getRiders().then(ridersData => {
            setRiders(ridersData || []);
        });

        return () => unsubscribe();
    }, []);

    const selectedOrder = orders.find(o => o.id === selectedOrderId) || null;
    const selectedOrderSerial = selectedOrder ? orders.length - orders.findIndex(o => o.id === selectedOrderId) : null;

    // Real-time status counters
    const statusCounts = {
        all: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        ready: orders.filter(o => o.status === 'ready').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length
    };

    // Filtered list
    const filteredOrders = orders.filter((order) => {
        // Status filter
        if (statusFilter !== 'all' && order.status !== statusFilter) return false;

        // Type filter
        if (orderTypeFilter !== 'all' && order.orderType !== orderTypeFilter) return false;

        // Search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const customerName = (order.customer?.name || '').toLowerCase();
            const customerPhone = (order.customer?.phone || '').toLowerCase();
            const tableNum = (order.customer?.tableNumber || '').toString().toLowerCase();
            const id = (order.id || '').toLowerCase();
            return customerName.includes(q) || customerPhone.includes(q) || tableNum.includes(q) || id.includes(q);
        }

        return true;
    });

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            let additionalData = {};
            if (newStatus === 'preparing') additionalData = { preparingStartedAt: getServerTimestamp() };

            await updateOrderStatus(id, newStatus, additionalData);

            if (newStatus === 'preparing') {
                toast.success('Order confirmed & preparation started!');
            } else if (newStatus === 'ready') {
                toast.success('Order marked ready for dispatch!');
            } else if (newStatus === 'delivered') {
                toast.success('Order completed & marked delivered!');
                setSelectedOrderId(null);
            } else if (newStatus === 'cancelled') {
                toast.info('Order has been cancelled.');
                setSelectedOrderId(null);
            }
        } catch (err) {
            toast.error('Failed to update status: ' + err.message);
        }
    };

    const confirmCancelOrder = async () => {
        if (!cancellingOrderId) return;
        await handleStatusUpdate(cancellingOrderId, 'cancelled');
        setCancellingOrderId(null);
    };

    const handleAssignRider = async (orderId, riderId, riderName) => {
        const result = await assignOrderToRider(orderId, riderId, riderName);
        if (result.success) {
            toast.success(`Assigned order to ${riderName}`);
        } else {
            toast.error('Failed to assign rider: ' + result.error);
        }
    };

    const handlePrintReceipt = (order, serialNumber) => {
        const printWindow = window.open('', '_blank');
        const customerSection = order.orderType === 'Dine-in'
            ? `<div class="customer">
                <p style="font-size: 18px;"><strong>TABLE #${order.customer.tableNumber || 'N/A'}</strong></p>
                <p><strong>Type:</strong> Dine-in</p>
               </div>`
            : `<div class="customer">
                <p><strong>Customer:</strong> ${order.customer?.name || 'Guest'}</p>
                <p><strong>Phone:</strong> ${order.customer?.phone || 'N/A'}</p>
                ${order.orderType === 'Delivery' ? `<p><strong>Address:</strong> ${order.customer?.address || 'N/A'}</p>` : ''}
                <p><strong>Type:</strong> ${order.orderType || 'Standard'}</p>
               </div>`;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Receipt #${serialNumber}</title>
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
                        <p>Order #${serialNumber}</p>
                        <p style="font-size: 10px; color: #666;">ID: ${order.id.slice(0, 8)}</p>
                        <p>${new Date().toLocaleString()}</p>
                    </div>
                    ${customerSection}
                    <div class="items">
                        ${(order.items || []).map(item => `
                            <div style="margin-bottom: 8px;">
                                <div class="item">
                                    <span>${item.quantity}x ${item.name}</span>
                                    <span>Rs. ${item.price * item.quantity}</span>
                                </div>
                                ${item.selectedVariations ? `
                                    <div style="font-size: 12px; color: #444; padding-left: 10px;">
                                        ${Object.values(item.selectedVariations).join(', ')}
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
                        <p>*** Thank You for Ordering ***</p>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <button onclick="window.print()" style="padding: 10px 20px; cursor: pointer;" class="no-print">Print Receipt</button>
                    </div>
                    <style>
                        @media print { .no-print { display: none; } }
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
            {/* Header */}
            <div className="admin-header" style={{ padding: '20px 24px', marginBottom: '20px' }}>
                <div>
                    <h1 className="admin-title" style={{ fontSize: '24px' }}>Live Order Manager</h1>
                    <p className="admin-subtitle" style={{ fontSize: '13px', marginTop: '4px' }}>
                        Real-time Kitchen Display & Dispatch Console
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Active Pending</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b' }}>
                            {statusCounts.pending} Orders
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="admin-filter-bar">
                <div className="filter-tabs-wrapper">
                    <button
                        className={`filter-tab-pill ${statusFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('all')}
                    >
                        <span>All</span>
                        <span className="filter-tab-count">{statusCounts.all}</span>
                    </button>
                    <button
                        className={`filter-tab-pill ${statusFilter === 'pending' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('pending')}
                    >
                        <span>Pending</span>
                        <span className="filter-tab-count">{statusCounts.pending}</span>
                    </button>
                    <button
                        className={`filter-tab-pill ${statusFilter === 'preparing' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('preparing')}
                    >
                        <span>Preparing</span>
                        <span className="filter-tab-count">{statusCounts.preparing}</span>
                    </button>
                    <button
                        className={`filter-tab-pill ${statusFilter === 'ready' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('ready')}
                    >
                        <span>Ready</span>
                        <span className="filter-tab-count">{statusCounts.ready}</span>
                    </button>
                    <button
                        className={`filter-tab-pill ${statusFilter === 'delivered' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('delivered')}
                    >
                        <span>Delivered</span>
                        <span className="filter-tab-count">{statusCounts.delivered}</span>
                    </button>
                    <button
                        className={`filter-tab-pill ${statusFilter === 'cancelled' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('cancelled')}
                    >
                        <span>Cancelled</span>
                        <span className="filter-tab-count">{statusCounts.cancelled}</span>
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                        value={orderTypeFilter}
                        onChange={(e) => setOrderTypeFilter(e.target.value)}
                        style={{
                            padding: '8px 14px',
                            backgroundColor: 'var(--surface-elevated)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--surface-border)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.85rem'
                        }}
                    >
                        <option value="all">All Types</option>
                        <option value="Delivery">Delivery</option>
                        <option value="Dine-in">Dine-in</option>
                        <option value="Takeaway">Takeaway</option>
                    </select>

                    <div className="filter-search-box">
                        <SearchIcon width={16} height={16} stroke="var(--text-muted)" />
                        <input
                            type="text"
                            className="filter-search-input"
                            placeholder="Search by customer, phone, table..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                            >
                                <CloseIcon width={14} height={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Orders Grid */}
            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                        Loading Orders...
                    </div>
                    <p style={{ margin: 0 }}>Connecting to live database stream</p>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div style={{
                    padding: '60px 20px',
                    textAlign: 'center',
                    backgroundColor: 'var(--surface-card)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--surface-border)',
                    margin: '20px 0'
                }}>
                    <ClockIcon width={40} height={40} stroke="var(--text-muted)" style={{ margin: '0 auto 16px auto', display: 'block' }} />
                    <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>No Orders Found</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {searchQuery || statusFilter !== 'all' || orderTypeFilter !== 'all'
                            ? 'No orders match the selected filters. Try clearing your search.'
                            : 'Orders will appear here in real-time as customers place them.'}
                    </p>
                </div>
            ) : (
                <div className="order-grid">
                    {filteredOrders.map((order) => {
                        const statusColors = getStatusColor(order.status);
                        const serialNumber = orders.length - orders.findIndex(o => o.id === order.id);

                        return (
                            <div
                                key={order.id}
                                onClick={() => setSelectedOrderId(order.id)}
                                style={{
                                    backgroundColor: 'var(--surface-card)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '16px',
                                    border: '1px solid var(--surface-border)',
                                    borderLeft: `4px solid ${statusColors.border}`,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    transition: 'transform 0.15s ease, border-color 0.15s ease',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--surface-border)'}
                            >
                                <div>
                                    {/* Card Top: Order # & Badges */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px', fontWeight: 800 }}>
                                                #{serialNumber}
                                            </h3>
                                            <span style={{
                                                fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                                                padding: '2px 8px', borderRadius: '4px',
                                                backgroundColor: statusColors.bg, color: statusColors.text
                                            }}>
                                                {order.status}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            {order.orderType && (
                                                <span style={{
                                                    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                                                    padding: '2px 6px', borderRadius: '4px',
                                                    backgroundColor: 'var(--surface-elevated)', color: 'var(--text-secondary)',
                                                    border: '1px solid var(--surface-border)'
                                                }}>
                                                    {order.orderType}
                                                </span>
                                            )}
                                            <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
                                                {formatDate(order.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Customer / Service */}
                                    <div style={{ marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                            <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>
                                                {order.orderType === 'Dine-in'
                                                    ? `Table #${order.customer?.tableNumber || 'N/A'}`
                                                    : (order.customer?.name || 'Guest')}
                                            </h4>
                                            {order.customer?.phone && (
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                                                    {order.customer.phone}
                                                </span>
                                            )}
                                        </div>

                                        {order.assignedRiderName && (
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                margin: '4px 0 0 0', color: '#10b981', fontSize: '12px', fontWeight: 600
                                            }}>
                                                <RidersIcon width={14} height={14} />
                                                <span>Rider: {order.assignedRiderName}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Items List Preview */}
                                    <div style={{
                                        backgroundColor: 'var(--surface-elevated)',
                                        padding: '10px',
                                        borderRadius: 'var(--radius-sm)',
                                        marginBottom: '10px'
                                    }}>
                                        {(order.items || []).slice(0, 3).map((item, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '3px' }}>
                                                <span style={{ color: 'var(--text-primary)' }}>
                                                    <strong style={{ color: 'var(--color-accent)', marginRight: '6px' }}>{item.quantity}x</strong>
                                                    {item.name}
                                                </span>
                                                <span style={{ color: 'var(--text-secondary)' }}>Rs. {item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                        {(order.items?.length || 0) > 3 && (
                                            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>
                                                +{order.items.length - 3} more items...
                                            </div>
                                        )}
                                    </div>

                                    {order.status === 'preparing' && order.preparingStartedAt && (
                                        <div style={{ marginBottom: '10px' }}>
                                            <CountdownTimer startTime={order.preparingStartedAt} />
                                        </div>
                                    )}
                                </div>

                                {/* Bottom Info & 1-Click Quick Actions */}
                                <div>
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        paddingTop: '8px', borderTop: '1px solid var(--surface-border)'
                                    }}>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Total Amount</span>
                                        <span style={{ color: 'var(--color-accent)', fontWeight: 800, fontSize: '16px' }}>
                                            Rs. {order.total}
                                        </span>
                                    </div>

                                    {/* 1-Click Status Action Buttons */}
                                    <div className="card-quick-actions" onClick={e => e.stopPropagation()}>
                                        {order.status === 'pending' && (
                                            <>
                                                <button
                                                    className="btn-kds-mini confirm"
                                                    onClick={() => handleStatusUpdate(order.id, 'preparing')}
                                                >
                                                    <CheckIcon width={14} height={14} />
                                                    <span>Accept & Cook</span>
                                                </button>
                                                <button
                                                    className="btn-kds-mini cancel"
                                                    onClick={() => setCancellingOrderId(order.id)}
                                                >
                                                    <span>Cancel</span>
                                                </button>
                                            </>
                                        )}

                                        {order.status === 'preparing' && (
                                            <button
                                                className="btn-kds-mini ready"
                                                onClick={() => handleStatusUpdate(order.id, 'ready')}
                                            >
                                                <CheckIcon width={14} height={14} />
                                                <span>Mark Ready</span>
                                            </button>
                                        )}

                                        {order.status === 'ready' && (
                                            <button
                                                className="btn-kds-mini deliver"
                                                onClick={() => handleStatusUpdate(order.id, 'delivered')}
                                            >
                                                <CheckIcon width={14} height={14} />
                                                <span>{order.orderType === 'Dine-in' ? 'Payment Done' : 'Delivered'}</span>
                                            </button>
                                        )}

                                        {(order.status === 'delivered' || order.status === 'cancelled') && (
                                            <button
                                                className="btn-kds-mini"
                                                style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
                                                onClick={() => handlePrintReceipt(order, serialNumber)}
                                            >
                                                <PrinterIcon width={14} height={14} />
                                                <span>Receipt</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Order Details Modal */}
            <OrderDetailsModal
                order={selectedOrder}
                serialNumber={selectedOrderSerial}
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrderId(null)}
                onUpdateStatus={handleStatusUpdate}
                onPrint={(order) => handlePrintReceipt(order, selectedOrderSerial)}
                riders={riders}
                onAssignRider={handleAssignRider}
                onRequestCancel={(id) => setCancellingOrderId(id)}
            />

            {/* Accessible Confirmation Modal for Cancellation */}
            <ConfirmModal
                isOpen={!!cancellingOrderId}
                title="Cancel Order"
                message="Are you sure you want to cancel this order? This action will void the order in the kitchen system."
                confirmText="Yes, Cancel Order"
                cancelText="Keep Order"
                isDanger={true}
                onConfirm={confirmCancelOrder}
                onCancel={() => setCancellingOrderId(null)}
            />
        </div>
    );
};

export default OrderManager;
