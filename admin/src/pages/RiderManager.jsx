import React, { useState, useEffect } from 'react';
import { subscribeToRiders, subscribeToOrders, generateRiderSignupCode, subscribeToUnusedCodes, deleteSignupCode, deleteRider } from '../services/firebase';
import '../styles/admin.css';

const RiderManager = () => {
    const [riders, setRiders] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [signupCodes, setSignupCodes] = useState([]);
    const [codeModal, setCodeModal] = useState(null); // { show: bool, code: string }

    const handleResetPassword = async (rider) => {
        if (window.confirm(`Send password reset email to ${rider.email}?`)) {
            // Import sendPasswordResetEmail from firebase/auth
            const { sendPasswordResetEmail } = await import('firebase/auth');
            const { auth } = await import('../firebase-config');

            try {
                await sendPasswordResetEmail(auth, rider.email);
                alert(`Password reset email sent to ${rider.email}`);
            } catch (error) {
                alert('Failed to send reset email: ' + error.message);
            }
        }
    };

    const handleGenerateCode = async () => {
        const result = await generateRiderSignupCode();
        if (result.success) {
            setCodeModal({ show: true, code: result.code });
        } else {
            alert('Failed to generate code: ' + result.error);
        }
    };

    const handleCopyCode = () => {
        if (codeModal?.code) {
            navigator.clipboard.writeText(codeModal.code);
            alert('Code copied to clipboard!');
        }
    };

    const closeCodeModal = () => {
        setCodeModal(null);
    };

    const handleDeleteCode = async (codeId) => {
        if (window.confirm('Delete this signup code?')) {
            const result = await deleteSignupCode(codeId);
            if (!result.success) {
                alert('Failed to delete code: ' + result.error);
            }
        }
    };

    const handleDeleteRider = async (rider) => {
        if (window.confirm(`Delete rider ${rider.name}?\n\nThis will remove their profile from the system and they will be immediately logged out.`)) {
            console.log('Deleting rider:', rider.id, rider.name);
            const result = await deleteRider(rider.id);
            if (result.success) {
                alert(`Rider ${rider.name} deleted successfully`);
            } else {
                console.error('Delete failed:', result.error);
                alert(`Failed to delete rider: ${result.error}\n\nPlease check the browser console for more details.`);
            }
        }
    };

    useEffect(() => {
        const unsubscribeRiders = subscribeToRiders((ridersData) => {
            setRiders(ridersData);
            setLoading(false);
        });

        const unsubscribeOrders = subscribeToOrders((ordersData) => {
            setOrders(ordersData);
        });

        const unsubscribeCodes = subscribeToUnusedCodes((codesData) => {
            setSignupCodes(codesData);
        });

        return () => {
            unsubscribeRiders();
            unsubscribeOrders();
            unsubscribeCodes();
        };
    }, []);

    // Calculate stats for each rider
    const getRiderStats = (riderId) => {
        const riderOrders = orders.filter(o => o.assignedRiderId === riderId);
        const assignedOrders = riderOrders.filter(o => o.status === 'ready' || o.status === 'out_for_delivery').length;
        const deliveredOrders = riderOrders.filter(o => o.status === 'delivered').length;
        return { assignedOrders, deliveredOrders };
    };

    // Filter riders by search term
    const filteredRiders = riders.filter(rider =>
        rider.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rider.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Rider Management</h1>
                    <p className="admin-subtitle">Manage delivery riders and track performance</p>
                </div>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: '24px' }}>
                <input
                    type="text"
                    placeholder="Search riders by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        maxWidth: '400px',
                        padding: '12px 16px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '14px'
                    }}
                />
            </div>

            {/* Signup Codes Section */}
            <div style={{
                marginBottom: '32px',
                padding: '24px',
                backgroundColor: '#1a1a1a',
                borderRadius: '12px',
                border: '1px solid #333'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                        <h3 style={{ margin: 0, color: 'white', fontSize: '18px' }}>Signup Codes</h3>
                        <p style={{ margin: '4px 0 0 0', color: '#888', fontSize: '13px' }}>
                            Generate codes for new rider registrations
                        </p>
                    </div>
                    <button
                        onClick={handleGenerateCode}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#4ade80',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#000',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        ➕ Generate Code
                    </button>
                </div>

                {signupCodes.length === 0 ? (
                    <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>No unused codes. Generate one to allow new rider signups.</p>
                ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {signupCodes.map(codeData => (
                            <div key={codeData.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                backgroundColor: '#2a2a2a',
                                borderRadius: '6px',
                                border: '1px solid #444'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <code style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#1a1a1a',
                                        borderRadius: '4px',
                                        color: '#4ade80',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        letterSpacing: '2px'
                                    }}>
                                        {codeData.code}
                                    </code>
                                    <span style={{ color: '#666', fontSize: '13px' }}>
                                        Created {codeData.createdAt ? new Date(codeData.createdAt.seconds * 1000).toLocaleString() : 'recently'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDeleteCode(codeData.id)}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#e74c3c',
                                        border: 'none',
                                        borderRadius: '4px',
                                        color: 'white',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {loading ? (
                <div style={{ color: 'white' }}>Loading riders...</div>
            ) : filteredRiders.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                    {searchTerm ? 'No riders found matching your search.' : 'No riders registered yet.'}
                </div>
            ) : (
                <div className="responsive-grid">
                    {filteredRiders.map(rider => {
                        const stats = getRiderStats(rider.id);
                        return (
                            <div
                                key={rider.id}
                                style={{
                                    backgroundColor: '#1a1a1a',
                                    borderRadius: '12px',
                                    padding: '24px',
                                    border: '1px solid #333',
                                    transition: 'transform 0.2s, box-shadow 0.2s'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {/* Rider Info */}
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            backgroundColor: 'var(--color-accent)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '20px',
                                            fontWeight: 'bold',
                                            color: '#000'
                                        }}>
                                            {rider.name?.charAt(0).toUpperCase() || 'R'}
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, color: 'white', fontSize: '18px' }}>
                                                {rider.name || 'Unknown Rider'}
                                            </h3>
                                            <p style={{ margin: '4px 0 0 0', color: '#888', fontSize: '13px' }}>
                                                {rider.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '12px',
                                    paddingTop: '16px',
                                    borderTop: '1px solid #333'
                                }}>
                                    <div style={{
                                        backgroundColor: 'rgba(142, 68, 173, 0.1)',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(142, 68, 173, 0.3)'
                                    }}>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9b59b6' }}>
                                            {stats.assignedOrders}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                                            Active Orders
                                        </div>
                                    </div>
                                    <div style={{
                                        backgroundColor: 'rgba(74, 222, 128, 0.1)',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(74, 222, 128, 0.3)'
                                    }}>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4ade80' }}>
                                            {stats.deliveredOrders}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                                            Delivered
                                        </div>
                                    </div>
                                </div>

                                {/* Joined Date */}
                                {rider.createdAt && (
                                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #333' }}>
                                        <div style={{ fontSize: '12px', color: '#666' }}>
                                            Joined: {new Date(rider.createdAt.seconds * 1000).toLocaleDateString()}
                                        </div>
                                    </div>
                                )}

                                {/* Reset Password Button */}
                                <div style={{ marginTop: '16px' }}>
                                    <button
                                        onClick={() => handleResetPassword(rider)}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            backgroundColor: '#e74c3c',
                                            border: 'none',
                                            borderRadius: '6px',
                                            color: 'white',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s',
                                            marginBottom: '8px'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#c0392b'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = '#e74c3c'}
                                    >
                                        📧 Reset Password (Email)
                                    </button>
                                    <button
                                        onClick={() => handleDeleteRider(rider)}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            backgroundColor: '#95a5a6',
                                            border: 'none',
                                            borderRadius: '6px',
                                            color: 'white',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#7f8c8d'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = '#95a5a6'}
                                    >
                                        🗑️ Delete Rider
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Signup Code Modal */}
            {codeModal?.show && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }} onClick={closeCodeModal}>
                    <div style={{
                        backgroundColor: '#1a1a1a',
                        borderRadius: '12px',
                        padding: '32px',
                        maxWidth: '500px',
                        width: '90%',
                        border: '2px solid #4ade80'
                    }} onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ margin: '0 0 16px 0', color: '#4ade80', fontSize: '24px' }}>
                            ✅ Signup Code Generated
                        </h2>
                        <p style={{ margin: '0 0 24px 0', color: '#888', fontSize: '14px' }}>
                            Share this code with the rider to allow them to sign up.
                        </p>

                        <div style={{
                            backgroundColor: 'rgba(74, 222, 128, 0.1)',
                            border: '2px solid #4ade80',
                            borderRadius: '8px',
                            padding: '20px',
                            marginBottom: '24px'
                        }}>
                            <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                                Signup Code:
                            </div>
                            <code style={{
                                display: 'block',
                                padding: '16px',
                                backgroundColor: '#2a2a2a',
                                borderRadius: '6px',
                                color: '#4ade80',
                                fontSize: '32px',
                                fontWeight: 'bold',
                                letterSpacing: '6px',
                                textAlign: 'center',
                                marginBottom: '12px'
                            }}>
                                {codeModal.code}
                            </code>
                            <button
                                onClick={handleCopyCode}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: '#4ade80',
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: '#000',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                📋 Copy Code
                            </button>
                        </div>

                        <div style={{
                            padding: '16px',
                            backgroundColor: 'rgba(255, 193, 7, 0.1)',
                            border: '1px solid rgba(255, 193, 7, 0.3)',
                            borderRadius: '6px',
                            marginBottom: '20px'
                        }}>
                            <p style={{ margin: 0, fontSize: '13px', color: '#ffc107' }}>
                                ⚠️ <strong>Important:</strong> This code can only be used once. The rider must enter it during signup.
                            </p>
                        </div>

                        <button
                            onClick={closeCodeModal}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#444',
                                border: 'none',
                                borderRadius: '6px',
                                color: 'white',
                                fontSize: '14px',
                                cursor: 'pointer'
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RiderManager;
