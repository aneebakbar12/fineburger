import React, { useState, useEffect } from 'react';
import { useStaffMode } from '../contexts/StaffModeContext';

const StaffModeActivator = () => {
    const { isStaffMode, activateStaffMode, deactivateStaffMode } = useStaffMode();
    const [showPinInput, setShowPinInput] = useState(false);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const handleOpenEvent = () => {
            setShowPinInput(true);
            setPin('');
            setError('');
        };

        const handleKeyDown = (e) => {
            // Keyboard shortcut for staff terminals: Ctrl+Shift+S or Alt+S
            if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') || (e.altKey && e.key.toLowerCase() === 's')) {
                e.preventDefault();
                setShowPinInput(prev => !prev);
                setPin('');
                setError('');
            }
        };

        window.addEventListener('openStaffPinModal', handleOpenEvent);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('openStaffPinModal', handleOpenEvent);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const handlePinSubmit = (e) => {
        e.preventDefault();
        const success = activateStaffMode(pin);

        if (success) {
            setShowPinInput(false);
            setPin('');
            setError('');
        } else {
            setError('❌ Invalid Staff PIN');
            setPin('');
        }
    };

    if (!showPinInput) return null;

    return (
        <>
            {/* PIN Input Modal Backdrop */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(4px)',
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

            {/* PIN Dialog */}
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'var(--color-surface, #14171F)',
                padding: '32px',
                borderRadius: '12px',
                zIndex: 9999,
                width: '90%',
                maxWidth: '380px',
                border: '1px solid var(--color-border, rgba(255, 180, 0, 0.3))',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔐</div>
                    <h2 style={{
                        color: '#fff',
                        fontSize: '20px',
                        fontWeight: 700,
                        margin: 0
                    }}>
                        Waitstaff POS Mode
                    </h2>
                    <p style={{
                        color: 'var(--color-text-secondary, #94a3b8)',
                        fontSize: '13px',
                        marginTop: '6px'
                    }}>
                        Enter 4-digit PIN to unlock in-store ordering
                    </p>
                </div>

                <form onSubmit={handlePinSubmit}>
                    <input
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="••••"
                        maxLength="6"
                        autoFocus
                        style={{
                            width: '100%',
                            padding: '14px',
                            fontSize: '24px',
                            textAlign: 'center',
                            borderRadius: '8px',
                            border: error ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
                            backgroundColor: '#0c0e14',
                            color: 'var(--color-accent, #FFB400)',
                            marginBottom: '16px',
                            letterSpacing: '10px',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                    {error && (
                        <p style={{
                            color: '#ef4444',
                            textAlign: 'center',
                            marginBottom: '16px',
                            fontSize: '13px',
                            fontWeight: 500
                        }}>
                            {error}
                        </p>
                    )}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="button"
                            onClick={() => {
                                setShowPinInput(false);
                                setPin('');
                                setError('');
                            }}
                            style={{
                                flex: 1,
                                padding: '12px',
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                color: '#e2e8f0',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: '8px',
                                fontWeight: 600,
                                fontSize: '14px',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                flex: 1,
                                padding: '12px',
                                backgroundColor: 'var(--color-accent, #FFB400)',
                                color: '#000',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '14px',
                                cursor: 'pointer'
                            }}
                        >
                            Unlock POS
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default StaffModeActivator;
