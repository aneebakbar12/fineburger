import React, { useState, useEffect } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase-config';
import {
    subscribeToRiders,
    subscribeToOrders,
    generateRiderSignupCode,
    deleteRider,
    subscribeToUnusedCodes
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

    const handleResetPassword = async (rider) => {
        try {
            await sendPasswordResetEmail(auth, rider.email);
            toast.success(`Password reset link sent to ${rider.email}`);
        } catch (error) {
            toast.error('Failed to send reset email: ' + error.message);
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

    // Calculate live order counts for each rider
    const getRiderStats = (rider) => {
        const riderOrders = orders.filter(o => o.assignedRiderId === rider.id);
        const activeOrders = riderOrders.filter(o => o.status === 'ready' || o.status === 'out_for_delivery').length;
        // Prefer persistent stat if available, otherwise fall back to orders array count
        const deliveredOrders = rider.stats?.deliveredOrders !== undefined
            ? rider.stats.deliveredOrders
            : riderOrders.filter(o => o.status === 'delivered').length;

        return { activeOrders, deliveredOrders };
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
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Share one with a new rider during registration</span>
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
                                        marginBottom: '16px'
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
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--surface-border)', paddingTop: '12px' }}>
                                    <button
                                        onClick={() => handleResetPassword(rider)}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            backgroundColor: 'var(--surface-elevated)',
                                            border: '1px solid var(--surface-border)',
                                            borderRadius: '6px',
                                            color: 'var(--text-secondary)',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            fontWeight: 600
                                        }}
                                        title="Send password reset link"
                                    >
                                        📧 Reset Password
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