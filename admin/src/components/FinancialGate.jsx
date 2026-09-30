import React, { useState, useEffect } from 'react';
import { getFinancialPassword, updateFinancialPassword } from '../services/firebase';

const DEFAULT_PASSWORD = 'fineburger2024';
const SS_KEY = 'fb_financial_unlocked';

function FinancialGate({ children }) {
    const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SS_KEY) === 'true');
    const [activePassword, setActivePassword] = useState(DEFAULT_PASSWORD);
    const [passwordLoading, setPasswordLoading] = useState(true);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showChangeForm, setShowChangeForm] = useState(false);
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [changeError, setChangeError] = useState('');
    const [changeSuccess, setChangeSuccess] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);

    // Fetch the canonical financial password from Firestore on mount
    useEffect(() => {
        let isMounted = true;
        const fetchPassword = async () => {
            try {
                const firestorePw = await getFinancialPassword();
                if (isMounted) {
                    setActivePassword(firestorePw || DEFAULT_PASSWORD);
                    setPasswordLoading(false);
                }
            } catch (err) {
                console.warn('Failed to load password from Firestore, using default:', err);
                if (isMounted) setPasswordLoading(false);
            }
        };
        fetchPassword();
        return () => { isMounted = false; };
    }, []);

    const handleUnlock = (e) => {
        e.preventDefault();
        const cleanInput = (password || '').trim();
        const expectedPw = (activePassword || DEFAULT_PASSWORD).trim();

        if (cleanInput === expectedPw) {
            sessionStorage.setItem(SS_KEY, 'true');
            setUnlocked(true);
            setError('');
        } else {
            setError('Incorrect password. Please try again.');
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setChangeError('');
        setChangeSuccess('');

        const cleanCurrent = (currentPw || '').trim();
        const expectedPw = (activePassword || DEFAULT_PASSWORD).trim();

        if (cleanCurrent !== expectedPw) {
            setChangeError('Current password is incorrect.');
            return;
        }
        if (!newPw || newPw.trim().length < 4) {
            setChangeError('New password must be at least 4 characters.');
            return;
        }
        if (newPw.trim() !== confirmPw.trim()) {
            setChangeError('New passwords do not match.');
            return;
        }

        setSavingPassword(true);
        const nextPassword = newPw.trim();
        const res = await updateFinancialPassword(nextPassword);
        setSavingPassword(false);

        if (res.success) {
            setActivePassword(nextPassword);
            setChangeSuccess('Password updated successfully across all devices!');
            setCurrentPw('');
            setNewPw('');
            setConfirmPw('');
            setTimeout(() => {
                setShowChangeForm(false);
                setChangeSuccess('');
            }, 1800);
        } else {
            setChangeError('Failed to update password in database: ' + (res.error || 'Network error'));
        }
    };

    const handleLock = () => {
        sessionStorage.removeItem(SS_KEY);
        setUnlocked(false);
        setPassword('');
        setError('');
        setShowChangeForm(false);
    };

    if (unlocked) {
        return (
            <div>
                {children}
                {/* Floating buttons: Lock and Change Password */}
                <div style={styles.changeToggleWrap}>
                    {!showChangeForm && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                                onClick={handleLock}
                                style={{
                                    ...styles.changeToggleBtn,
                                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                    borderColor: 'rgba(239, 68, 68, 0.4)',
                                    color: '#ef4444',
                                    fontWeight: 700
                                }}
                                title="Lock financial access"
                            >
                                🔒 Lock Financials
                            </button>
                            <button
                                onClick={() => { setShowChangeForm(true); setChangeError(''); setChangeSuccess(''); }}
                                style={styles.changeToggleBtn}
                            >
                                🔑 Change Password
                            </button>
                        </div>
                    )}
                    {showChangeForm && (
                        <div style={styles.changeCard}>
                            <div style={styles.changeTitle}>Change Financial Password (Cloud Synced)</div>
                            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                This updates the password for all devices and browsers in real time.
                            </p>
                            <form onSubmit={handleChangePassword}>
                                <input
                                    type="password"
                                    placeholder="Current password"
                                    value={currentPw}
                                    onChange={(e) => setCurrentPw(e.target.value)}
                                    style={styles.input}
                                    autoComplete="current-password"
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="New password (min 4 chars)"
                                    value={newPw}
                                    onChange={(e) => setNewPw(e.target.value)}
                                    style={styles.input}
                                    autoComplete="new-password"
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Confirm new password"
                                    value={confirmPw}
                                    onChange={(e) => setConfirmPw(e.target.value)}
                                    style={styles.input}
                                    autoComplete="new-password"
                                    required
                                />
                                {changeError && <div style={styles.error}>{changeError}</div>}
                                {changeSuccess && <div style={styles.success}>{changeSuccess}</div>}
                                <div style={styles.changeBtnRow}>
                                    <button type="submit" style={styles.saveBtn} disabled={savingPassword}>
                                        {savingPassword ? 'Updating...' : 'Save to Cloud'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowChangeForm(false); setChangeError(''); setChangeSuccess(''); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }}
                                        style={styles.cancelBtn}
                                        disabled={savingPassword}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div style={styles.overlay}>
            <div style={styles.card}>
                <div style={styles.lockIcon}>🔒</div>
                <h2 style={styles.title}>Financial Access</h2>
                <p style={styles.subtitle}>Enter the owner password to view financial data</p>
                <form onSubmit={handleUnlock}>
                    <input
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        style={styles.input}
                        autoFocus
                        autoComplete="current-password"
                        disabled={passwordLoading}
                    />
                    {error && <div style={styles.error}>{error}</div>}
                    <button type="submit" style={styles.unlockBtn} disabled={passwordLoading}>
                        {passwordLoading ? 'Checking...' : 'Unlock'}
                    </button>
                </form>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        padding: '24px',
    },
    card: {
        background: 'var(--surface-card)',
        border: '1px solid var(--surface-border)',
        borderRadius: '16px',
        padding: '40px 36px 36px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
    },
    lockIcon: {
        fontSize: '48px',
        marginBottom: '12px',
    },
    title: {
        color: 'var(--text-primary)',
        fontSize: '22px',
        fontWeight: 700,
        margin: '0 0 6px',
    },
    subtitle: {
        color: 'var(--text-secondary)',
        fontSize: '14px',
        margin: '0 0 24px',
        lineHeight: 1.4,
    },
    input: {
        width: '100%',
        minHeight: '48px',
        padding: '12px 14px',
        borderRadius: '10px',
        border: '1px solid var(--surface-border)',
        background: 'var(--surface-elevated)',
        color: 'var(--text-primary)',
        fontSize: '16px', // Prevents iOS Safari auto-zoom
        outline: 'none',
        marginBottom: '12px',
        boxSizing: 'border-box',
        touchAction: 'manipulation',
    },
    error: {
        color: '#ff4d4f',
        fontSize: '13px',
        marginBottom: '10px',
        textAlign: 'left',
    },
    success: {
        color: '#52c41a',
        fontSize: '13px',
        marginBottom: '10px',
        textAlign: 'left',
    },
    unlockBtn: {
        width: '100%',
        minHeight: '48px',
        padding: '12px',
        borderRadius: '10px',
        border: 'none',
        background: '#FFB400',
        color: '#000',
        fontSize: '16px',
        fontWeight: 700,
        cursor: 'pointer',
        marginTop: '4px',
        touchAction: 'manipulation',
    },
    changeToggleWrap: {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000,
    },
    changeToggleBtn: {
        background: 'var(--surface-card)',
        border: '1px solid var(--surface-border)',
        color: 'var(--text-secondary)',
        padding: '12px 18px',
        minHeight: '48px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        touchAction: 'manipulation',
        display: 'inline-flex',
        alignItems: 'center',
    },
    changeCard: {
        background: 'var(--surface-card)',
        border: '1px solid var(--surface-border)',
        borderRadius: '14px',
        padding: '24px 22px 20px',
        width: 'min(340px, 92vw)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    },
    changeTitle: {
        color: 'var(--text-primary)',
        fontSize: '15px',
        fontWeight: 700,
        marginBottom: '4px',
    },
    changeBtnRow: {
        display: 'flex',
        gap: '10px',
        marginTop: '4px',
    },
    saveBtn: {
        flex: 1,
        minHeight: '48px',
        padding: '12px',
        borderRadius: '8px',
        border: 'none',
        background: '#FFB400',
        color: '#000',
        fontSize: '14px',
        fontWeight: 700,
        cursor: 'pointer',
        touchAction: 'manipulation',
    },
    cancelBtn: {
        flex: 1,
        minHeight: '48px',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid var(--surface-border)',
        background: 'transparent',
        color: 'var(--text-secondary)',
        fontSize: '14px',
        cursor: 'pointer',
        touchAction: 'manipulation',
    },
};

export default FinancialGate;
