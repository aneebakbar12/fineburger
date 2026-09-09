import React, { useState } from 'react';
import { useStaffMode } from '../contexts/StaffModeContext';

const StaffModeActivator = () => {
    const { isStaffMode, activateStaffMode, deactivateStaffMode } = useStaffMode();
    const [tapCount, setTapCount] = useState(0);
    const [showPinInput, setShowPinInput] = useState(false);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleLogoTap = () => {
        const newCount = tapCount + 1;
        setTapCount(newCount);

        if (newCount >= 5) {
            setShowPinInput(true);
            setTapCount(0);
        }

        // Reset tap count after 2 seconds
        setTimeout(() => {
            setTapCount(0);
        }, 2000);
    };

    const handlePinSubmit = (e) => {
        e.preventDefault();
        const success = activateStaffMode(pin);

        if (success) {
            setShowPinInput(false);
            setPin('');
            setError('');
            // alert replaced — using inline success message via error state momentarily
        } else {
            setError('❌ Invalid PIN');
            setPin('');
        }
    };

    const handleLogout = () => {
        if (window.confirm('Exit Staff Mode?')) {
            deactivateStaffMode();
        }
    };

    return (
        <>
            {/* Hidden trigger — pointer-events only on tap area, not behind logo link */}
            <div
                onClick={handleLogoTap}
                style={{
                    position: 'fixed',
                    top: '10px',
                    left: '20px',
                    width: '150px',
                    height: '50px',
                    cursor: 'pointer',
                    zIndex: 1029,
                }}
                title="Tap 5 times for staff mode"
            />

            {/* PIN Input Modal */}
            {showPinInput && (
                <>
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            zIndex: 9998,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onClick={() => {
                            setShowPinInput(false);
                            setPin('');
                            setError('');
                        }}
                    />
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: '#1a1a1a',
                        padding: '32px',
                        borderRadius: '16px',
                        zIndex: 9999,
                        width: '90%',
                        maxWidth: '400px',
                        border: '2px solid #4ade80',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
                    }}>
                        <h2 style={{
                            color: '#fff',
                            marginBottom: '16px',
                            textAlign: 'center',
                            fontSize: '24px'
                        }}>
                            🔒 Enter Staff PIN
                        </h2>
                        <form onSubmit={handlePinSubmit}>
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                placeholder="Enter 4-digit PIN"
                                maxLength="4"
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    fontSize: '24px',
                                    textAlign: 'center',
                                    borderRadius: '8px',
                                    border: error ? '2px solid #ef4444' : '2px solid #333',
                                    backgroundColor: '#2a2a2a',
                                    color: '#fff',
                                    marginBottom: '16px',
                                    letterSpacing: '8px'
                                }}
                            />
                            {error && (
                                <p style={{
                                    color: '#ef4444',
                                    textAlign: 'center',
                                    marginBottom: '16px',
                                    fontSize: '14px'
                                }}>
                                    {error}
                                </p>
                            )}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        backgroundColor: '#4ade80',
                                        color: '#000',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 'bold',
                                        fontSize: '16px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Activate
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPinInput(false);
                                        setPin('');
                                        setError('');
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        backgroundColor: '#333',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 'bold',
                                        fontSize: '16px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}
        </>
    );
};

export default StaffModeActivator;
