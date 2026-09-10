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

// Helper for permanent human-readable order references
const getOrderRef = (order) => {
    if (!order) return 'FB-ORDER';
    return order.orderReference || (order.id ? `FB-${order.id.slice(0, 5).toUpperCase()}` : 'FB-ORDER');
};

// --- Countdown Timer Component ---
const CountdownTimer = ({ startTime, durationMinutes = 45 }) => {
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

const getStatusColor = (status) => {
    switch (status) {
        case 'pending': return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: '#f59e0b', label: 'Pending' };
        case 'preparing': return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: '#3b82f6', label: 'Cooking' };
        case 'ready': return { bg: 'rgba(139, 92, 246, 0.15)', text: '#8b5cf6', border: '#8b5cf6', label: 'Ready' };
        case 'out_for_delivery': return { bg: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4', border: '#06b6d4', label: 'In Transit' };
        case 'delivered': return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#10b981', label: 'Delivered' };
        case 'cancelled': return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: '#ef4444', label: 'Cancelled' };
        default: return { bg: 'rgba(255,255,255,0.08)', text: '#94a3b8', border: '#94a3b8', label: status || 'Unknown' };
    }
};

// --- Order Details Modal ---
const OrderDetailsModal = ({
    order,
    orderRef,
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
                backgroundColor: 'var(--surface-card, #14171f)', borderRadius: '14px', width: '95%', maxWidth: '780px',
                maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--surface-border, rgba(255,255,255,0.1))',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
            }}>
                <div style={{ padding: '28px' }}>
                    {/* Header */}
                    <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px', marginBottom: '20px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <h2 style={{ fontSize: '22px', color: 'var(--text-primary, #fff)', margin: 0, fontWeight: 800 }}>
                                    #{orderRef}
                                </h2>
                                <span className="badge" style={{
                                    backgroundColor: statusColors.bg,
                                    color: statusColors.text,
                                    border: `1px solid ${statusColors.border}`,
                                    padding: '3px 10px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase'
                                }}>
                                    {statusColors.label}
                                </span>
                                {order.orderType && (
                                    <span className="badge" style={{
                                        backgroundColor: 'var(--surface-elevated, #1d222d)',
                                        color: 'var(--text-secondary, #94a3b8)',
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: 600
                                    }}>
                                        {order.orderType === 'Delivery' ? '🛵 Delivery' : order.orderType === 'Dine-in' ? '🍽️ Dine-in' : '🛍️ Takeaway'}
                                    </span>
                                )}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
                                System ID: {order.id}
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
                    <div className="modal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                        {/* Customer Information */}
                        <div className="modal-section" style={{ backgroundColor: 'var(--surface-elevated, #1d222d)', padding: '16px', borderRadius: '8px' }}>
                            <h3 style={{ fontSize: '14px', color: 'var(--color-accent, #FFB400)', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Customer & Destination
                            </h3>
                            {order.orderType === 'Dine-in' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Service Type:</span>
                                        <strong style={{ color: 'var(--color-accent)' }}>Dine-In</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Table Number:</span>
                                        <strong style={{ color: '#fff', fontSize: '18px' }}>
                                            Table #{order.customer?.tableNumber || 'N/A'}
                                        </strong>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Customer Name:</span>
                                        <strong style={{ color: '#fff' }}>{order.customer?.name || 'Guest'}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Phone Number:</span>
                                        <a href={`tel:${order.customer?.phone}`} style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>
                                            {order.customer?.phone || 'N/A'}
                                        </a>
                                    </div>
                                    {order.orderType === 'Delivery' && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Address:</span>
                                            <strong style={{ maxWidth: '65%', textAlign: 'right', color: '#fff', wordBreak: 'break-word' }}>
                                                {order.customer?.address || 'N/A'}
                                            </strong>
                                        </div>
                                    )}
                                </div>
                            )}

                            {order.assignedRiderName && (
                                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Assigned Rider:</span>
                                    <span style={{ color: '#10b981', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <RidersIcon width={14} height={14} /> {order.assignedRiderName}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Order Items & Payment */}
                        <div className="modal-section" style={{ backgroundColor: 'var(--surface-elevated, #1d222d)', padding: '16px', borderRadius: '8px' }}>
                            <h3 style={{ fontSize: '14px', color: 'var(--color-accent, #FFB400)', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Items ({order.items?.length || 0})
                            </h3>
                            <div style={{ maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                                {order.items?.map((item, idx) => {
                                    const itemPrice = item.unitPrice || item.price;
                                    return (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                                            <div>
                                                <span style={{ color: 'var(--color-accent)', fontWeight: 700, marginRight: '6px' }}>
                                                    {item.quantity}x
                                                </span>
                                                <span style={{ color: '#fff', fontWeight: 500 }}>{item.name}</span>
                                                {item.selectedVariations && Object.values(item.selectedVariations).length > 0 && (
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                                                        {Object.values(item.selectedVariations).join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ color: '#fff', fontWeight: 600 }}>
                                                Rs. {itemPrice * item.quantity}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '12px', paddingTop: '8px' }}>
                                {order.deliveryFee ? (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                        <span>Delivery Fee</span>
                                        <span>Rs. {order.deliveryFee}</span>
                                    </div>
                                ) : null}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 800 }}>
                                    <span style={{ color: '#fff' }}>Total Amount</span>
                                    <span style={{ color: 'var(--color-accent)' }}>Rs. {order.total}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
                        <button
                            onClick={() => onPrint(order)}
                            className="btn btn-secondary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '13px' }}
                        >
                            <PrinterIcon width={16} height={16} />
                            <span>Print Thermal Ticket</span>
                        </button>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {order.status === 'pending' && (
                                <>
                                    <button
                                        className="btn-action confirm"
                                        onClick={() => onUpdateStatus(order.id, 'preparing')}
                                        style={{ backgroundColor: '#3b82f6', color: 'white', padding: '10px 18px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', border: 'none' }}
                                    >
                                        🍳 Confirm & Cook
                                    </button>
                                    <button
                                        className="btn-action cancel"
                                        onClick={() => onRequestCancel(order.id)}
                                        style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid #ef4444', padding: '10px 14px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        Cancel Order
                                    </button>
                                </>
                            )}

                            {order.status === 'preparing' && (
                                <button
                                    className="btn-action ready"
                                    onClick={() => onUpdateStatus(order.id, 'ready')}
                                    style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '10px 20px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', border: 'none' }}
                                >
                                    ✨ Mark Ready
                                </button>
                            )}

                            {order.status === 'ready' && (
                                <>
                                    {order.orderType === 'Delivery' ? (
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <select
                                                value={selectedRiderId}
                                                onChange={(e) => setSelectedRiderId(e.target.value)}
                                                style={{
                                                    padding: '9px 12px',
                                                    backgroundColor: 'var(--surface-elevated)',
                                                    border: '1px solid var(--surface-border)',
                                                    borderRadius: '6px',
                                                    color: 'white',
                                                    fontSize: '13px'
                                                }}
                                            >
                                                <option value="">Select Delivery Rider...</option>
                                                {riders.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name} {r.isOnline ? '🟢' : '⚪'}</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={handleAssignRider}
                                                disabled={!selectedRiderId}
                                                className="btn btn-secondary"
                                                style={{ padding: '9px 14px', fontSize: '13px' }}
                                            >
                                                🛵 Dispatch Rider
                                            </button>
                                        </div>
                                    ) : null}

                                    <button
                                        className="btn-action deliver"
                                        onClick={() => onUpdateStatus(order.id, 'delivered')}
                                        style={{ backgroundColor: '#10b981', color: 'black', padding: '10px 20px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', border: 'none' }}
                                    >
                                        {order.orderType === 'Dine-in' ? '✓ Paid & Done' : '✓ Mark Delivered'}
                                    </button>
                                </>
                            )}

                            {order.status === 'out_for_delivery' && (
                                <button
                                    className="btn-action deliver"
                                    onClick={() => onUpdateStatus(order.id, 'delivered')}
                                    style={{ backgroundColor: '#10b981', color: 'black', padding: '10px 20px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', border: 'none' }}
                                >
                                    ✓ Complete & Delivered
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const OrderManager = () => {
    const toast = useToast();
    const [orders, setOrders] = useState([]);
    const [riders, setRiders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [isKdsMode, setIsKdsMode] = useState(false);

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
    const selectedOrderRef = selectedOrder ? getOrderRef(selectedOrder) : null;

    // Real-time status counters
    const statusCounts = {
        all: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        ready: orders.filter(o => o.status === 'ready').length,
        out_for_delivery: orders.filter(o => o.status === 'out_for_delivery').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length
    };

    // Filtered list
    const filteredOrders = orders.filter((order) => {
        // Status filter
        if (statusFilter !== 'all' && order.status !== statusFilter) return false;

        // Type filter
        if (orderTypeFilter !== 'all' && order.orderType !== orderTypeFilter) return false;

        // Search query: check reference, customer, phone, table, id
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const ref = (order.orderReference || '').toLowerCase();
            const customerName = (order.customer?.name || '').toLowerCase();
            const customerPhone = (order.customer?.phone || '').toLowerCase();
            const tableNum = (order.customer?.tableNumber || '').toString().toLowerCase();
            const id = (order.id || '').toLowerCase();
            return ref.includes(q) || customerName.includes(q) || customerPhone.includes(q) || tableNum.includes(q) || id.includes(q);
        }

        return true;
    });

    const handleStatusUpdate = async (id, newStatus, additionalData = {}) => {
        try {
            if (newStatus === 'preparing') {
                additionalData.preparingStartedAt = getServerTimestamp();
            }

            await updateOrderStatus(id, newStatus, additionalData);

            if (newStatus === 'preparing') {
                toast.success('Order confirmed & cooking started!');
            } else if (newStatus === 'ready') {
                toast.success('Order marked ready for dispatch!');
            } else if (newStatus === 'out_for_delivery') {
                toast.success('Order dispatched with rider!');
            } else if (newStatus === 'delivered') {
                toast.success('Order completed successfully!');
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
            // Also transition to out_for_delivery so lifecycle progresses properly
            await handleStatusUpdate(orderId, 'out_for_delivery', { assignedRiderId: riderId, assignedRiderName: riderName });
            toast.success(`Dispatched order #${getOrderRef(orders.find(o => o.id === orderId))} to ${riderName}`);
        } else {
            toast.error('Failed to assign rider: ' + result.error);
        }
    };

    const handlePrintReceipt = (order) => {
        const orderRef = getOrderRef(order);
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to print receipts.');
            return;
        }

        const customerSection = order.orderType === 'Dine-in'
            ? `<div class="customer">
                <p style="font-size: 16px; font-weight: bold;">TABLE #${order.customer?.tableNumber || 'N/A'}</p>
                <p><strong>Service:</strong> Dine-in</p>
               </div>`
            : `<div class="customer">
                <p><strong>Customer:</strong> ${order.customer?.name || 'Guest'}</p>
                <p><strong>Phone:</strong> ${order.customer?.phone || 'N/A'}</p>
                ${order.orderType === 'Delivery' ? `<p><strong>Address:</strong> ${order.customer?.address || 'N/A'}</p>` : ''}
                <p><strong>Fulfillment:</strong> ${order.orderType || 'Standard'}</p>
                ${order.assignedRiderName ? `<p><strong>Rider:</strong> ${order.assignedRiderName}</p>` : ''}
               </div>`;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Ticket #${orderRef}</title>
                    <meta charset="utf-8" />
                    <style>
                        body { font-family: 'Courier New', monospace; padding: 10px; max-width: 280px; margin: 0 auto; color: #000; font-size: 13px; line-height: 1.3; }
                        .header { text-align: center; margin-bottom: 12px; border-bottom: 1px dashed #000; padding-bottom: 8px; }
                        .item { display: flex; justify-content: space-between; margin-bottom: 4px; }
                        .total { border-top: 1px dashed #000; margin-top: 8px; padding-top: 6px; font-weight: bold; display: flex; justify-content: space-between; font-size: 14px; }
                        .customer { margin-bottom: 12px; border-bottom: 1px dashed #000; padding-bottom: 8px; font-size: 12px; }
                        h2 { margin: 0 0 4px 0; font-size: 18px; }
                        p { margin: 2px 0; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>FINE BURGER</h2>
                        <p style="font-size: 11px;">Main G.T. Road, Baghbanpura, Lahore</p>
                        <p style="font-size: 15px; font-weight: bold; margin-top: 6px;">REF: #${orderRef}</p>
                        <p style="font-size: 11px; color: #444;">${new Date().toLocaleString()}</p>
                    </div>
                    ${customerSection}
                    <div class="items">
                        ${(order.items || []).map(item => `
                            <div style="margin-bottom: 6px;">
                                <div class="item">
                                    <span>${item.quantity}x ${item.name}</span>
                                    <span>Rs. ${(item.unitPrice || item.price) * item.quantity}</span>
                                </div>
                                ${item.selectedVariations ? `
                                    <div style="font-size: 11px; color: #444; padding-left: 8px;">
                                        ${Object.values(item.selectedVariations).join(', ')}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                    ${order.deliveryFee ? `
                        <div class="item" style="font-size: 12px; border-top: 1px dotted #ccc; padding-top: 4px;">
                            <span>Delivery Fee</span>
                            <span>Rs. ${order.deliveryFee}</span>
                        </div>
                    ` : ''}
                    <div class="total">
                        <span>TOTAL</span>
                        <span>Rs. ${order.total}</span>
                    </div>
                    <div style="text-align: center; margin-top: 16px; font-size: 11px;">
                        <p>*** Fresh Burgers. Hot Pizza. ***</p>
                        <p>Thank you for ordering!</p>
                    </div>
                    <div style="text-align: center; margin-top: 14px;" class="no-print">
                        <button onclick="window.print()" style="padding: 6px 14px; cursor: pointer;">Print Ticket</button>
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
        if (!timestamp) return 'Just now';
        const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={isKdsMode ? 'kds-fullscreen' : ''}>
            {/* Header */}
            <div className="admin-header" style={{ padding: '16px 24px', marginBottom: '16px' }}>
                <div>
                    <h1 className="admin-title" style={{ fontSize: '22px' }}>Live Order Management</h1>
                    <p className="admin-subtitle" style={{ fontSize: '13px', marginTop: '2px' }}>
                        Operational Kitchen Display & Delivery Console
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <button
                        type="button"
                        onClick={() => setIsKdsMode(!isKdsMode)}
                        style={{
                            backgroundColor: isKdsMode ? 'var(--color-accent, #FFB400)' : 'var(--surface-elevated, #1d222d)',
                            color: isKdsMode ? '#000' : 'var(--text-primary, #fff)',
                            border: '1px solid var(--surface-border)',
                            padding: '8px 14px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <span>📺</span> {isKdsMode ? 'Exit KDS View' : 'Kitchen KDS View'}
                    </button>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Pending Prep</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b' }}>
                            {statusCounts.pending} Orders
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="admin-filter-bar" style={{ marginBottom: '16px' }}>
                <div className="filter-tabs-wrapper" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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
                        <span>Cooking</span>
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
                        className={`filter-tab-pill ${statusFilter === 'out_for_delivery' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('out_for_delivery')}
                    >
                        <span>In Transit</span>
                        <span className="filter-tab-count">{statusCounts.out_for_delivery}</span>
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
                            padding: '8px 12px',
                            backgroundColor: 'var(--surface-elevated)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--surface-border)',
                            borderRadius: '6px',
                            fontSize: '13px'
                        }}
                    >
                        <option value="all">All Channels</option>
                        <option value="Delivery">🛵 Delivery</option>
                        <option value="Dine-in">🍽️ Dine-in</option>
                        <option value="Takeaway">🛍️ Takeaway</option>
                    </select>

                    <div className="filter-search-box">
                        <SearchIcon width={16} height={16} stroke="var(--text-muted)" />
                        <input
                            type="text"
                            className="filter-search-input"
                            placeholder="Search by FB-XXXX, customer, phone..."
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
                    <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>No Orders Match Your Filters</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {searchQuery || statusFilter !== 'all' || orderTypeFilter !== 'all'
                            ? 'Try clearing the search box or changing the status tab.'
                            : 'Orders will appear here automatically when placed.'}
                    </p>
                </div>
            ) : (
                <div className={`order-grid ${isKdsMode ? 'kds-grid' : ''}`} style={{
                    display: 'grid',
                    gridTemplateColumns: isKdsMode ? 'repeat(auto-fit, minmax(320px, 1fr))' : 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '16px'
                }}>
                    {filteredOrders.map((order) => {
                        const statusColors = getStatusColor(order.status);
                        const orderRef = getOrderRef(order);

                        return (
                            <div
                                key={order.id}
                                onClick={() => setSelectedOrderId(order.id)}
                                style={{
                                    backgroundColor: 'var(--surface-card)',
                                    borderRadius: '10px',
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
                                    {/* Card Top: Order Reference & Badges */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <h3 style={{ margin: 0, color: 'var(--color-accent, #FFB400)', fontSize: '16px', fontWeight: 800 }}>
                                                #{orderRef}
                                            </h3>
                                            <span style={{
                                                fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                                                padding: '2px 8px', borderRadius: '4px',
                                                backgroundColor: statusColors.bg, color: statusColors.text
                                            }}>
                                                {statusColors.label}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            {order.orderType && (
                                                <span style={{
                                                    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                                                    padding: '2px 6px', borderRadius: '4px',
                                                    backgroundColor: 'var(--surface-elevated)', color: 'var(--text-secondary)',
                                                    border: '1px solid var(--surface-border)'
                                                }}>
                                                    {order.orderType === 'Delivery' ? '🛵 Delivery' : order.orderType === 'Dine-in' ? '🍽️ Dine-in' : '🛍️ Takeaway'}
                                                </span>
                                            )}
                                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
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
                                        borderRadius: '6px',
                                        marginBottom: '10px'
                                    }}>
                                        {(order.items || []).slice(0, 3).map((item, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '3px' }}>
                                                <span style={{ color: 'var(--text-primary)' }}>
                                                    <strong style={{ color: 'var(--color-accent)', marginRight: '6px' }}>{item.quantity}x</strong>
                                                    {item.name}
                                                </span>
                                                <span style={{ color: 'var(--text-secondary)' }}>Rs. {(item.unitPrice || item.price) * item.quantity}</span>
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
                                    <div className="card-quick-actions" onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                        {order.status === 'pending' && (
                                            <>
                                                <button
                                                    className="btn-kds-mini confirm"
                                                    onClick={() => handleStatusUpdate(order.id, 'preparing')}
                                                    style={{ flex: 2, padding: '8px 12px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
                                                >
                                                    Accept & Cook
                                                </button>
                                                <button
                                                    className="btn-kds-mini cancel"
                                                    onClick={() => setCancellingOrderId(order.id)}
                                                    style={{ flex: 1, padding: '8px 10px', backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        )}

                                        {order.status === 'preparing' && (
                                            <button
                                                className="btn-kds-mini ready"
                                                onClick={() => handleStatusUpdate(order.id, 'ready')}
                                                style={{ width: '100%', padding: '8px 12px', backgroundColor: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
                                            >
                                                ✨ Mark Ready
                                            </button>
                                        )}

                                        {order.status === 'ready' && (
                                            <button
                                                className="btn-kds-mini deliver"
                                                onClick={() => handleStatusUpdate(order.id, 'delivered')}
                                                style={{ width: '100%', padding: '8px 12px', backgroundColor: '#10b981', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
                                            >
                                                {order.orderType === 'Dine-in' ? '✓ Paid & Done' : '✓ Mark Delivered'}
                                            </button>
                                        )}

                                        {order.status === 'out_for_delivery' && (
                                            <button
                                                className="btn-kds-mini deliver"
                                                onClick={() => handleStatusUpdate(order.id, 'delivered')}
                                                style={{ width: '100%', padding: '8px 12px', backgroundColor: '#10b981', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
                                            >
                                                ✓ Complete Order
                                            </button>
                                        )}

                                        {(order.status === 'delivered' || order.status === 'cancelled') && (
                                            <button
                                                className="btn-kds-mini"
                                                style={{ width: '100%', padding: '8px 12px', backgroundColor: 'var(--surface-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--surface-border)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                                onClick={() => handlePrintReceipt(order)}
                                            >
                                                <PrinterIcon width={14} height={14} />
                                                <span>Print Ticket</span>
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
                orderRef={selectedOrderRef}
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrderId(null)}
                onUpdateStatus={handleStatusUpdate}
                onPrint={(order) => handlePrintReceipt(order)}
                riders={riders}
                onAssignRider={handleAssignRider}
                onRequestCancel={(id) => setCancellingOrderId(id)}
            />

            {/* Accessible Confirmation Modal for Cancellation */}
            <ConfirmModal
                isOpen={!!cancellingOrderId}
                title="Cancel Order"
                message="Are you sure you want to cancel this order? This action will void the kitchen ticket and restore inventory."
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