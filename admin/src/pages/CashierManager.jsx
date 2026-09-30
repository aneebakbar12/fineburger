import React, { useState, useEffect } from 'react';
import {
    subscribeToCashiers,
    addCashier,
    updateCashier,
    deleteCashier,
    subscribeToAllShifts,
    promptAndSettleShift
} from '../services/firebase';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import { EditIcon, TrashIcon } from '../components/Icons';
import '../styles/admin.css';

const CashierManager = () => {
    const toast = useToast();
    const [cashiers, setCashiers] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state for Add / Edit
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCashier, setEditingCashier] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        pin: '',
        shiftTitle: 'Day Shift (12:00 PM – 8:00 PM)',
        phone: '',
        active: true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete modal
    const [cashierToDelete, setCashierToDelete] = useState(null);

    // Visible PINs state
    const [visiblePins, setVisiblePins] = useState({});

    // Settle shift state
    const [settlingShiftId, setSettlingShiftId] = useState(null);

    useEffect(() => {
        const unsubscribeCashiers = subscribeToCashiers((data) => {
            setCashiers(data || []);
            setLoading(false);
        });

        const unsubscribeShifts = subscribeToAllShifts((data) => {
            setShifts(data || []);
        });

        return () => {
            unsubscribeCashiers();
            unsubscribeShifts();
        };
    }, []);

    const handleOpenAdd = () => {
        setEditingCashier(null);
        setFormData({
            name: '',
            pin: '',
            shiftTitle: 'Shift 1: Morning (12:00 PM – 8:00 PM)',
            phone: '',
            active: true
        });
        setModalOpen(true);
    };

    const handleOpenEdit = (cashier) => {
        setEditingCashier(cashier);
        setFormData({
            name: cashier.name || '',
            pin: cashier.pin || '',
            shiftTitle: cashier.shiftTitle || '',
            phone: cashier.phone || '',
            active: cashier.active !== false
        });
        setModalOpen(true);
    };

    const handleSaveCashier = async (e) => {
        e.preventDefault();
        const cleanName = formData.name.trim();
        const cleanPin = String(formData.pin).trim();

        if (!cleanName) {
            toast.error('Cashier name is required.');
            return;
        }
        if (!cleanPin || cleanPin.length < 3) {
            toast.error('PIN must be at least 3-4 digits.');
            return;
        }

        setIsSubmitting(true);
        if (editingCashier) {
            const res = await updateCashier(editingCashier.id, {
                ...formData,
                name: cleanName,
                pin: cleanPin
            });
            setIsSubmitting(false);
            if (res.success) {
                toast.success(`Updated cashier "${cleanName}"!`);
                setModalOpen(false);
            } else {
                toast.error(res.error);
            }
        } else {
            const res = await addCashier({
                ...formData,
                name: cleanName,
                pin: cleanPin
            });
            setIsSubmitting(false);
            if (res.success) {
                toast.success(`Cashier "${cleanName}" registered! PIN: ${cleanPin}`);
                setModalOpen(false);
            } else {
                toast.error(res.error);
            }
        }
    };

    const confirmDeleteCashier = async () => {
        if (!cashierToDelete) return;
        const res = await deleteCashier(cashierToDelete.id);
        if (res.success) {
            toast.success(`Cashier "${cashierToDelete.name}" removed.`);
        } else {
            toast.error(res.error);
        }
        setCashierToDelete(null);
    };

    const togglePinVisibility = (id) => {
        setVisiblePins(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleSettleShift = async (shift) => {
        setSettlingShiftId(shift.id);
        await promptAndSettleShift(shift, { settledBy: 'Owner / Admin', onToast: toast });
        setSettlingShiftId(null);
    };

    const filteredCashiers = cashiers.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.shiftTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone || '').includes(searchTerm)
    );

    return (
        <div>
            {/* Header */}
            <div className="admin-header" style={{ padding: '20px 24px', marginBottom: '24px' }}>
                <div>
                    <h1 className="admin-title" style={{ fontSize: '24px' }}>Cashier & Shift Operations</h1>
                    <p className="admin-subtitle" style={{ fontSize: '13px', marginTop: '4px' }}>
                        Manage 1st & 2nd shift cashiers, 4-digit PINs, opening float (peti), and drawer handovers ({cashiers.length} staff)
                    </p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
                >
                    <span>➕</span>
                    <span>Register New Cashier</span>
                </button>
            </div>

            {/* Quick Shift Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{
                    backgroundColor: 'var(--surface-card)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px'
                }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Active Shifts Right Now</div>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                        {shifts.filter(s => s.status === 'open').length} Active
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Operating counter drawers
                    </div>
                </div>

                <div style={{
                    backgroundColor: 'var(--surface-card)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px'
                }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Closed • Pending Owner Settlement</div>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-accent, #FFB400)', marginTop: '4px' }}>
                        {shifts.filter(s => s.status === 'closed').length} Shifts
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Awaiting cash handover collection
                    </div>
                </div>

                <div style={{
                    backgroundColor: 'var(--surface-card)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px'
                }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Float (Peti) in Circulation</div>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: '#3b82f6', marginTop: '4px' }}>
                        Rs. {shifts.filter(s => s.status === 'open').reduce((sum, s) => sum + (Number(s.openingFloat) || 0), 0)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Starting change provided to cashiers
                    </div>
                </div>
            </div>

            {/* Search Filter */}
            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Search cashiers by name, shift title, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        maxWidth: '420px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--surface-border)',
                        backgroundColor: 'var(--surface-card)',
                        color: '#fff',
                        fontSize: '13px'
                    }}
                />
            </div>

            {/* Cashiers List Grid */}
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 14px', color: 'var(--text-primary)' }}>
                Registered Cashier Staff
            </h2>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Loading cashier profiles...
                </div>
            ) : filteredCashiers.length === 0 ? (
                <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    backgroundColor: 'var(--surface-card)',
                    borderRadius: '12px',
                    border: '1px solid var(--surface-border)',
                    marginBottom: '32px'
                }}>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                        No cashiers configured. Click "Register New Cashier" to onboard your 1st and 2nd shift staff.
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '18px',
                    marginBottom: '36px'
                }}>
                    {filteredCashiers.map(cashier => {
                        const activeShift = shifts.find(s => s.cashierId === cashier.id && s.status === 'open');
                        const closedUnsettledShift = shifts.find(s => s.cashierId === cashier.id && s.status === 'closed');
                        const isPinVisible = visiblePins[cashier.id];

                        const liveDrawerCash = activeShift
                            ? (Number(activeShift.openingFloat) || 0) + (Number(activeShift.counterCashSales) || 0) + (Number(activeShift.riderCashCollected) || 0)
                            : 0;

                        return (
                            <div
                                key={cashier.id}
                                style={{
                                    backgroundColor: 'var(--surface-card)',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    border: `1px solid ${activeShift ? '#10b981' : 'var(--surface-border)'}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)'
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                                    {cashier.name}
                                                </h3>
                                                {cashier.active === false && (
                                                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                                                        Disabled
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--color-accent, #FFB400)', marginTop: '2px', fontWeight: 600 }}>
                                                {cashier.shiftTitle}
                                            </div>
                                            {cashier.phone && (
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                    📞 {cashier.phone}
                                                </div>
                                            )}
                                        </div>

                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            backgroundColor: activeShift ? 'rgba(16, 185, 129, 0.15)' : closedUnsettledShift ? 'rgba(255, 180, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                            color: activeShift ? '#10b981' : closedUnsettledShift ? 'var(--color-accent)' : 'var(--text-muted)',
                                            border: `1px solid ${activeShift ? 'rgba(16, 185, 129, 0.3)' : closedUnsettledShift ? 'rgba(255, 180, 0, 0.3)' : 'var(--surface-border)'}`
                                        }}>
                                            {activeShift ? '🟢 On Shift' : closedUnsettledShift ? '🟡 Shift Ended' : '⚪ Off Duty'}
                                        </span>
                                    </div>

                                    {/* PIN Display */}
                                    <div style={{
                                        backgroundColor: 'var(--surface-elevated)',
                                        borderRadius: '8px',
                                        padding: '10px 14px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '12px'
                                    }}>
                                        <div>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Login PIN</span>
                                            <span style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '2px', color: '#fff' }}>
                                                {isPinVisible ? cashier.pin : '••••'}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => togglePinVisibility(cashier.id)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--color-accent)',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {isPinVisible ? 'Hide' : 'Show'}
                                        </button>
                                    </div>

                                    {/* Active Shift Drawer Snapshot */}
                                    {activeShift && (
                                        <div style={{
                                            backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                            border: '1px solid rgba(16, 185, 129, 0.25)',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            marginBottom: '14px'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                <span>Peti (Float): Rs. {activeShift.openingFloat || 0}</span>
                                                <span>Sales: Rs. {activeShift.counterCashSales || 0}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                                                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>DRAWER BALANCE:</span>
                                                <span style={{ fontSize: '16px', fontWeight: 900, color: '#10b981' }}>Rs. {liveDrawerCash}</span>
                                            </div>
                                        </div>
                                    )}

                                    {closedUnsettledShift && (
                                        <div style={{
                                            backgroundColor: 'rgba(255, 180, 0, 0.08)',
                                            border: '1px solid rgba(255, 180, 0, 0.25)',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            marginBottom: '14px'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <span style={{ fontSize: '11px', color: 'var(--color-accent)', fontWeight: 700, display: 'block' }}>UNSETTLED CASH:</span>
                                                    <span style={{ fontSize: '16px', fontWeight: 900, color: 'var(--color-accent)' }}>
                                                        Rs. {(Number(closedUnsettledShift.openingFloat) || 0) + (Number(closedUnsettledShift.counterCashSales) || 0) + (Number(closedUnsettledShift.riderCashCollected) || 0)}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleSettleShift(closedUnsettledShift)}
                                                    disabled={settlingShiftId === closedUnsettledShift.id}
                                                    style={{
                                                        padding: '6px 12px',
                                                        backgroundColor: 'var(--color-accent)',
                                                        color: '#000',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontSize: '11px',
                                                        fontWeight: 800,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {settlingShiftId === closedUnsettledShift.id ? 'Settling...' : '✓ Settle Now'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--surface-border)', paddingTop: '14px' }}>
                                    <button
                                        onClick={() => handleOpenEdit(cashier)}
                                        className="btn btn-secondary"
                                        style={{ flex: 1, padding: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                    >
                                        <EditIcon width={14} height={14} />
                                        <span>Edit / PIN</span>
                                    </button>
                                    <button
                                        onClick={() => setCashierToDelete(cashier)}
                                        style={{
                                            padding: '8px 12px',
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.25)',
                                            color: '#ef4444',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            fontWeight: 600
                                        }}
                                        title="Delete Cashier"
                                    >
                                        <TrashIcon width={14} height={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Shift History Table */}
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 14px', color: 'var(--text-primary)' }}>
                Shift History & Drawer Settlement Logs
            </h2>

            <div style={{
                backgroundColor: 'var(--surface-card)',
                borderRadius: '12px',
                border: '1px solid var(--surface-border)',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)'
            }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--surface-border)', backgroundColor: 'var(--surface-elevated)' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px' }}>Cashier</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px' }}>Opened</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px' }}>Closed</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px' }}>Starting Float</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px' }}>Counter Sales</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px' }}>Rider Cash</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px' }}>Total Drawer</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px' }}>Status</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px' }}>Owner Settlement</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shifts.length === 0 ? (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                                        No shift history recorded yet. Shifts opened by cashiers will appear here.
                                    </td>
                                </tr>
                            ) : (
                                shifts.slice(0, 30).map(shift => {
                                    const total = (Number(shift.openingFloat) || 0) + (Number(shift.counterCashSales) || 0) + (Number(shift.riderCashCollected) || 0);
                                    const openedStr = shift.openedAt?.seconds
                                        ? new Date(shift.openedAt.seconds * 1000).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })
                                        : '—';
                                    const closedStr = shift.closedAt?.seconds
                                        ? new Date(shift.closedAt.seconds * 1000).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })
                                        : (shift.status === 'open' ? '🟢 Running' : '—');

                                    return (
                                        <tr key={shift.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                                            <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                {shift.cashierName}
                                            </td>
                                            <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                {openedStr}
                                            </td>
                                            <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                {closedStr}
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', color: '#3b82f6', fontWeight: 600 }}>
                                                Rs. {shift.openingFloat || 0}
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>
                                                +Rs. {shift.counterCashSales || 0}
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>
                                                +Rs. {shift.riderCashCollected || 0}
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-accent, #FFB400)', fontWeight: 800 }}>
                                                Rs. {total}
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                <span style={{
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    backgroundColor: shift.status === 'settled' ? 'rgba(16, 185, 129, 0.15)' : shift.status === 'closed' ? 'rgba(255, 180, 0, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                                    color: shift.status === 'settled' ? '#10b981' : shift.status === 'closed' ? 'var(--color-accent)' : '#3b82f6'
                                                }}>
                                                    {shift.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                {shift.status === 'closed' ? (
                                                    <button
                                                        onClick={() => handleSettleShift(shift)}
                                                        disabled={settlingShiftId === shift.id}
                                                        className="btn btn-primary"
                                                        style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 700 }}
                                                    >
                                                        {settlingShiftId === shift.id ? 'Settling...' : 'Settle Handover'}
                                                    </button>
                                                ) : shift.status === 'settled' ? (
                                                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                                                        ✓ Settled by {shift.settledBy || 'Owner'}
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                        Active in drawer
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add / Edit Cashier Modal */}
            {modalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    padding: '20px'
                }} onClick={() => setModalOpen(false)}>
                    <div style={{
                        backgroundColor: 'var(--surface-card, #14171f)',
                        borderRadius: '12px',
                        padding: '28px',
                        maxWidth: '440px',
                        width: '100%',
                        border: '1px solid var(--color-accent)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
                    }} onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {editingCashier ? 'Edit Cashier Account' : 'Register New Cashier'}
                        </h2>

                        <form onSubmit={handleSaveCashier}>
                            <div className="form-group" style={{ marginBottom: '14px' }}>
                                <label className="form-label">Full Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Muhammad Ali"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '14px' }}>
                                <label className="form-label">4-Digit Login PIN *</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength="6"
                                    className="form-input"
                                    placeholder="e.g. 1234"
                                    value={formData.pin}
                                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/[^0-9]/g, '') })}
                                    required
                                    style={{ letterSpacing: '4px', fontSize: '16px', fontWeight: 800 }}
                                />
                                <small style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                                    Cashier types this fast PIN on counter tablet to unlock their drawer.
                                </small>
                            </div>

                            <div className="form-group" style={{ marginBottom: '14px' }}>
                                <label className="form-label">Shift Title & Timing *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. 1st Shift (12:00 PM – 9:00 PM) or Night Shift (7:00 PM – 3:30 AM)"
                                    value={formData.shiftTitle}
                                    onChange={(e) => setFormData({ ...formData, shiftTitle: e.target.value })}
                                    required
                                />
                                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                                    {[
                                        '1st Shift (12 PM – 8 PM)',
                                        '2nd Shift (8 PM – 4 AM)',
                                        'Day Shift (11 AM – 7 PM)',
                                        'Night Shift (7 PM – 3 AM)',
                                        'Weekend Shift'
                                    ].map(preset => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, shiftTitle: preset })}
                                            style={{
                                                padding: '3px 8px',
                                                borderRadius: '4px',
                                                border: '1px solid var(--surface-border)',
                                                backgroundColor: formData.shiftTitle === preset ? 'var(--color-accent)' : 'var(--surface-elevated)',
                                                color: formData.shiftTitle === preset ? '#000' : 'var(--text-secondary)',
                                                fontSize: '10px',
                                                fontWeight: 600,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label className="form-label">Phone Number (Optional)</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    placeholder="e.g. 0300 1234567"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn btn-primary"
                                    style={{ flex: 1, padding: '12px', fontWeight: 800 }}
                                >
                                    {isSubmitting ? 'Saving...' : editingCashier ? 'Update Cashier' : 'Create Cashier'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="btn btn-secondary"
                                    style={{ flex: 1, padding: '12px' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={!!cashierToDelete}
                title="Remove Cashier"
                message={`Are you sure you want to remove cashier "${cashierToDelete?.name}"?`}
                confirmText="Yes, Delete"
                cancelText="Keep"
                isDanger={true}
                onConfirm={confirmDeleteCashier}
                onCancel={() => setCashierToDelete(null)}
            />
        </div>
    );
};

export default CashierManager;
