import React, { useState, useEffect } from 'react';
import {
    subscribeToRiders,
    subscribeToOrders,
    generateRiderSignupCode,
    deleteRider,
    subscribeToUnusedCodes,
    clearAllSignupCodes,
    setRiderPasswordDirect,
    settleRiderOrdersCash
} from '../services/firebase';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import { SearchIcon, RidersIcon, CheckIcon, CloseIcon } from '../components/Icons';
import '../styles/admin.css';

const RiderManager = () => {
    const toast = useToast();
    const [riders, setRiders] = useState([]);
    const [orders, setOrders] = useState([]);
    const [unusedCodes, setUnusedCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [codeModal, setCodeModal] = useState(null); // { show: bool, code: string }
    const [riderToDelete, setRiderToDelete] = useState(null);

    // Change Password Modal state
    const [passwordModal, setPasswordModal] = useState(null); // { show: bool, rider: object, newPassword: '', saving: bool }

    // Settle Cash Modal / State
    const [settlingRiderId, setSettlingRiderId] = useState(null);

    useEffect(() => {
        const unsubscribeRiders = subscribeToRiders((ridersData) => {
            setRiders(ridersData || []);
            setLoading(false);
        });

        const unsubscribeOrders = subscribeToOrders((ordersData) => {
            setOrders(ordersData || []);
        });

        const unsubscribeCodes = subscribeToUnusedCodes((codesData) => {
            setUnusedCodes(codesData || []);
        });

        return () => {
            unsubscribeRiders();
            unsubscribeOrders();
            unsubscribeCodes();
        };
    }, []);

    const handleOpenPasswordModal = (rider) => {
        setPasswordModal({
            show: true,
            rider: rider,
            newPassword: '',
            saving: false
        });
    };

    const handleSavePassword = async (e) => {
        e.preventDefault();
        if (!passwordModal?.rider?.id) return;
        const pwd = passwordModal.newPassword.trim();
        if (!pwd || pwd.length < 6) {
            toast.error('Password must be at least 6 characters long.');
            return;
        }

        setPasswordModal(prev => ({ ...prev, saving: true }));
        try {
            const result = await setRiderPasswordDirect(passwordModal.rider.id, pwd);
            if (result.success) {
                toast.success(`Password updated for ${passwordModal.rider.name}! New password: ${result.newPassword}`);
                setPasswordModal(null);
            } else {
                toast.error('Failed to change password: ' + result.error);
                setPasswordModal(prev => ({ ...prev, saving: false }));
            }
        } catch (err) {
            toast.error('Error: ' + err.message);
            setPasswordModal(prev => ({ ...prev, saving: false }));
        }
    };

    const handleGenerateRandomPassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';
        let generated = '';
        for (let i = 0; i < 8; i++) {
            generated += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setPasswordModal(prev => ({ ...prev, newPassword: generated }));
    };

    const handleCollectCash = async (rider, unsettledCash, unsettledOrderIds) => {
        if (unsettledCash <= 0) {
            toast.info(`No pending cash to collect from ${rider.name}.`);
            return;
        }

        const confirmed = window.confirm(
            `Confirm Cash Handover:\n\nReceived Rs. ${unsettledCash} from ${rider.name}?\n\nThis will clear the rider's "Cash to Handover" balance and record shift settlement.`
        );
        if (!confirmed) return;

        setSettlingRiderId(rider.id);
        try {
            const result = await settleRiderOrdersCash(rider.id, unsettledOrderIds);
            if (result.success) {
                toast.success(`✓ Collected Rs. ${unsettledCash} from ${rider.name}! Balance cleared.`);
            } else {
                toast.error('Failed to settle cash: ' + result.error);
            }
        } catch (err) {
            toast.error('Error settling cash: ' + err.message);
        } finally {
            setSettlingRiderId(null);
        }
    };

    const handleGenerateCode = async () => {
        try {
            const result = await generateRiderSignupCode();
            if (result.success) {
                setCodeModal({ show: true, code: result.code });
                toast.success(`Generated signup code: ${result.code}`);
            } else {
                toast.error('Failed to generate code: ' + result.error);
            }
        } catch (err) {
            toast.error('Error generating code: ' + err.message);
        }
    };

    const handleCopyCode = (code) => {
        if (code) {
            navigator.clipboard.writeText(code);
            toast.success(`Code ${code} copied to clipboard!`);
        }
    };

    const handleClearAllCodes = async () => {
        if (!window.confirm(`Are you sure you want to delete all ${unusedCodes.length} unused signup codes?`)) return;
        try {
            const result = await clearAllSignupCodes();
            if (result.success) {
                toast.success(`Cleared ${result.count} unused signup codes.`);
            } else {
                toast.error('Failed to clear codes: ' + result.error);
            }
        } catch (err) {
            toast.error('Error clearing codes: ' + err.message);
        }
    };

    const confirmDeleteRider = async () => {
        if (!riderToDelete) return;
        try {
            const result = await deleteRider(riderToDelete.id);
            if (result.success) {
                toast.success(`Rider "${riderToDelete.name}" was removed.`);
            } else {
                toast.error(`Failed to delete rider: ${result.error}`);
            }
        } catch (err) {
            toast.error('Error deleting rider: ' + err.message);
        }
        setRiderToDelete(null);
    };

    // Calculate live order counts and unsettled cash for each rider
    const getRiderStats = (rider) => {
        const riderOrders = orders.filter(o => o.assignedRiderId === rider.id);
        const activeOrders = riderOrders.filter(o => o.status === 'ready' || o.status === 'out_for_delivery').length;
        // Take the maximum of persistent stats and live orders matching this rider to ensure delivery count never gets stuck at 0
        const ordersDeliveredCount = riderOrders.filter(o => o.status === 'delivered').length;
        const deliveredOrders = Math.max(
            Number(rider.stats?.deliveredOrders) || 0,
            ordersDeliveredCount
        );

        // Unsettled Cash calculation: COD delivered orders not yet marked cashSettled
        const unsettledOrders = riderOrders.filter(o => {
            if (o.status !== 'delivered') return false;
            const isCOD = (o.paymentMethod || 'COD').toUpperCase() === 'COD';
            return isCOD && o.cashSettled !== true;
        });

        const unsettledCash = unsettledOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        const unsettledOrderIds = unsettledOrders.map(o => o.id);

        return { activeOrders, deliveredOrders, unsettledCash, unsettledOrderIds };
    };

    // Filter riders by search term
    const filteredRiders = riders.filter(rider =>
        rider.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rider.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rider.phone?.includes(searchTerm)
    );

    return (
        <div>
            {/* Header */}
            <div className="admin-header" style={{ padding: '20px 24px', marginBottom: '24px' }}>
                <div>
                    <h1 className="admin-title" style={{ fontSize: '24px' }}>Rider Fleet Management</h1>
                    <p className="admin-subtitle" style={{ fontSize: '13px', marginTop: '4px' }}>
                        Active delivery couriers, online status, and onboarding codes ({riders.length} registered)
                    </p>
                </div>
                <button
                    onClick={handleGenerateCode}
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                    <span>➕</span>
                    <span>Generate Signup Code</span>
                </button>
            </div>

            {/* Active / Unused Signup Codes Drawer */}
            {unusedCodes.length > 0 && (
                <div style={{
                    backgroundColor: 'var(--surface-card, #14171f)',
                    border: '1px solid var(--surface-border, rgba(255,255,255,0.1))',
                    borderRadius: 'var(--radius-lg, 12px)',
                    padding: '16px 20px',
                    marginBottom: '24px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '14px', color: 'var(--color-accent, #FFB400)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            🔑 Active Onboarding Codes ({unusedCodes.length})
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Share one with a new rider during registration</span>
                            <button
                                onClick={handleClearAllCodes}
                                style={{
                                    padding: '4px 10px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '4px',
                                    color: '#ef4444',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                🗑️ Clear All
                            </button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {unusedCodes.map(codeItem => (
                            <div
                                key={codeItem.id}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    backgroundColor: 'var(--surface-elevated, #1d222d)',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--surface-border)'
                                }}
                            >
                                <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>
                                    {codeItem.code}
                                </span>
                                <button
                                    onClick={() => handleCopyCode(codeItem.code)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--color-accent)',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        padding: '2px 4px'
                                    }}
                                    title="Copy code"
                                >
                                    Copy
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <div style={{ marginBottom: '24px' }}>
                <div className="filter-search-box" style={{ maxWidth: '400px' }}>
                    <SearchIcon width={16} height={16} stroke="var(--text-muted)" />
                    <input
                        type="text"
                        placeholder="Search riders by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="filter-search-input"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                        >
                            <CloseIcon width={14} height={14} />
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Loading courier profiles...
                </div>
            ) : filteredRiders.length === 0 ? (
                <div style={{
                    padding: '60px 20px',
                    textAlign: 'center',
                    backgroundColor: 'var(--surface-card)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--surface-border)',
                    margin: '20px 0'
                }}>
                    <RidersIcon width={40} height={40} stroke="var(--text-muted)" style={{ margin: '0 auto 16px auto', display: 'block' }} />
                    <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>No Delivery Riders Found</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {searchTerm ? 'No couriers match your search.' : 'Click "Generate Signup Code" to onboard your first courier.'}
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px'
                }}>
                    {filteredRiders.map(rider => {
                        const stats = getRiderStats(rider);
                        const isOnline = rider.isOnline === true;

                        return (
                            <div
                                key={rider.id}
                                style={{
                                    backgroundColor: 'var(--surface-card, #14171f)',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    border: '1px solid var(--surface-border)',
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
                                    {/* Top: Avatar, Name & Online Badge */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '44px',
                                                height: '44px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--color-accent, #FFB400)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '18px',
                                                fontWeight: 800,
                                                color: '#000',
                                                flexShrink: 0
                                            }}>
                                                {rider.name?.charAt(0).toUpperCase() || 'R'}
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px', fontWeight: 700 }}>
                                                    {rider.name || 'Courier'}
                                                </h3>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                                                    {rider.email}
                                                </div>
                                            </div>
                                        </div>

                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            padding: '3px 8px',
                                            borderRadius: '4px',
                                            backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                                            color: isOnline ? '#10b981' : 'var(--text-muted)',
                                            border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`
                                        }}>
                                            {isOnline ? '🟢 On Duty' : '⚪ Offline'}
                                        </span>
                                    </div>

                                    {rider.phone && (
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                            📞 <a href={`tel:${rider.phone}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>{rider.phone}</a>
                                        </div>
                                    )}

                                    {/* Stats Grid */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '10px',
                                        padding: '12px',
                                        backgroundColor: 'var(--surface-elevated, #1d222d)',
                                        borderRadius: '8px',
                                        marginBottom: '12px'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '20px', fontWeight: 800, color: '#3b82f6' }}>
                                                {stats.activeOrders}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                In Transit / Ready
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>
                                                {stats.deliveredOrders}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                Total Delivered
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cash to Handover Card & Collection Action */}
                                    <div style={{
                                        padding: '12px',
                                        borderRadius: '8px',
                                        backgroundColor: stats.unsettledCash > 0 ? 'rgba(255, 180, 0, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                                        border: `1px solid ${stats.unsettledCash > 0 ? 'rgba(255, 180, 0, 0.3)' : 'var(--surface-border)'}`,
                                        marginBottom: '16px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                Cash to Handover
                                            </div>
                                            <div style={{
                                                fontSize: '18px',
                                                fontWeight: 900,
                                                color: stats.unsettledCash > 0 ? 'var(--color-accent, #FFB400)' : 'var(--text-muted)',
                                                marginTop: '2px'
                                            }}>
                                                Rs. {stats.unsettledCash}
                                            </div>
                                        </div>

                                        {stats.unsettledCash > 0 && (
                                            <button
                                                onClick={() => handleCollectCash(rider, stats.unsettledCash, stats.unsettledOrderIds)}
                                                disabled={settlingRiderId === rider.id}
                                                style={{
                                                    padding: '8px 14px',
                                                    backgroundColor: 'var(--color-accent, #FFB400)',
                                                    color: '#000',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    fontWeight: 800,
                                                    fontSize: '12px',
                                                    cursor: settlingRiderId === rider.id ? 'not-allowed' : 'pointer',
                                                    boxShadow: '0 2px 8px rgba(255, 180, 0, 0.25)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                                title="Confirm receipt of cash from courier"
                                            >
                                                <span>✓</span>
                                                <span>{settlingRiderId === rider.id ? 'Collecting...' : 'Receive Cash'}</span>
                                            </button>
                                        )}
                                        {stats.unsettledCash === 0 && (
                                            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                                                ✓ Settled
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--surface-border)', paddingTop: '12px' }}>
                                    <button
                                        onClick={() => handleOpenPasswordModal(rider)}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            backgroundColor: 'var(--surface-elevated)',
                                            border: '1px solid var(--surface-border)',
                                            borderRadius: '6px',
                                            color: 'var(--text-primary)',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px'
                                        }}
                                        title="Change password directly"
                                    >
                                        <span>🔑</span>
                                        <span>Change Password</span>
                                    </button>
                                    <button
                                        onClick={() => setRiderToDelete(rider)}
                                        style={{
                                            padding: '8px 12px',
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            borderRadius: '6px',
                                            color: '#ef4444',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            fontWeight: 600
                                        }}
                                        title="Delete courier account"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Direct Password Change Modal */}
            {passwordModal?.show && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000
                }} onClick={() => setPasswordModal(null)}>
                    <div style={{
                        backgroundColor: 'var(--surface-card, #14171f)',
                        borderRadius: '12px',
                        padding: '28px',
                        maxWidth: '440px',
                        width: '90%',
                        border: '1px solid var(--color-accent, #FFB400)',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{ fontSize: '32px', marginBottom: '6px' }}>🔑</div>
                            <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '20px', fontWeight: 800 }}>
                                Set Courier Password
                            </h2>
                            <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                Change login password for <strong>{passwordModal.rider?.name}</strong> ({passwordModal.rider?.email})
                            </p>
                        </div>

                        <form onSubmit={handleSavePassword}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                                    Type New Password (min. 6 characters)
                                </label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="Enter password..."
                                        value={passwordModal.newPassword}
                                        onChange={(e) => setPasswordModal(prev => ({ ...prev, newPassword: e.target.value }))}
                                        required
                                        minLength={6}
                                        style={{
                                            flex: 1,
                                            padding: '12px 14px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--surface-border)',
                                            backgroundColor: 'var(--surface-elevated, #1d222d)',
                                            color: '#fff',
                                            fontSize: '15px',
                                            fontFamily: 'monospace',
                                            letterSpacing: '1px'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGenerateRandomPassword}
                                        style={{
                                            padding: '0 14px',
                                            backgroundColor: 'var(--surface-elevated)',
                                            border: '1px solid var(--surface-border)',
                                            color: 'var(--color-accent, #FFB400)',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap'
                                        }}
                                        title="Auto-generate an 8-character secure password"
                                    >
                                        🎲 Auto
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                                <button
                                    type="submit"
                                    disabled={passwordModal.saving || !passwordModal.newPassword}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        backgroundColor: 'var(--color-accent, #FFB400)',
                                        color: '#000',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontWeight: 800,
                                        fontSize: '14px',
                                        cursor: passwordModal.saving ? 'not-allowed' : 'pointer',
                                        opacity: passwordModal.saving ? 0.7 : 1
                                    }}
                                >
                                    {passwordModal.saving ? 'Saving...' : 'Save Password'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPasswordModal(null)}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        backgroundColor: 'var(--surface-elevated)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--surface-border)',
                                        borderRadius: '6px',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Generated Code Modal */}
            {codeModal?.show && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000
                }} onClick={() => setCodeModal(null)}>
                    <div style={{
                        backgroundColor: 'var(--surface-card, #14171f)',
                        borderRadius: '12px',
                        padding: '28px',
                        maxWidth: '420px',
                        width: '90%',
                        border: '1px solid var(--color-accent, #FFB400)',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{ fontSize: '32px', marginBottom: '6px' }}>🔑</div>
                            <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '20px', fontWeight: 800 }}>
                                Rider Signup Code
                            </h2>
                            <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                Share this single-use code with your new courier to register on the Rider App.
                            </p>
                        </div>

                        <div style={{
                            backgroundColor: 'var(--surface-elevated, #1d222d)',
                            padding: '16px',
                            borderRadius: '8px',
                            textAlign: 'center',
                            marginBottom: '20px',
                            border: '1px dashed var(--color-accent)'
                        }}>
                            <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '4px', color: 'var(--color-accent)', fontFamily: 'monospace' }}>
                                {codeModal.code}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => handleCopyCode(codeModal.code)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    backgroundColor: 'var(--color-accent, #FFB400)',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                Copy Code
                            </button>
                            <button
                                onClick={() => setCodeModal(null)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    backgroundColor: 'var(--surface-elevated)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--surface-border)',
                                    borderRadius: '6px',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal for Delete */}
            <ConfirmModal
                isOpen={!!riderToDelete}
                title="Remove Courier"
                message={`Are you sure you want to remove "${riderToDelete?.name}"? They will be logged out and cannot accept deliveries.`}
                confirmText="Yes, Remove"
                cancelText="Keep"
                isDanger={true}
                onConfirm={confirmDeleteRider}
                onCancel={() => setRiderToDelete(null)}
            />
        </div>
    );
};

export default RiderManager;