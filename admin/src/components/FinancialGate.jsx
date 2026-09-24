import React, { useState, useEffect } from 'react';

const DEFAULT_PASSWORD = 'fineburger2024';
const LS_KEY = 'fb_financial_password';
const SS_KEY = 'fb_financial_unlocked';

function getPassword() {
    return localStorage.getItem(LS_KEY) || DEFAULT_PASSWORD;
}

function FinancialGate({ children }) {
    const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SS_KEY) === 'true');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showChangeForm, setShowChangeForm] = useState(false);
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [changeError, setChangeError] = useState('');
    const [changeSuccess, setChangeSuccess] = useState('');

    const handleUnlock = (e) => {
        e.preventDefault();
        if (password === getPassword()) {
            sessionStorage.setItem(SS_KEY, 'true');
            setUnlocked(true);
            setError('');
        } else {
            setError('Incorrect password. Please try again.');
        }
    };

    const handleChangePassword = (e) => {
        e.preventDefault();
        setChangeError('');
        setChangeSuccess('');

        if (currentPw !== getPassword()) {
            setChangeError('Current password is incorrect.');
            return;
        }
        if (!newPw || newPw.length < 4) {
            setChangeError('New password must be at least 4 characters.');
            return;
        }
        if (newPw !== confirmPw) {
            setChangeError('New passwords do not match.');
            return;
        }

        localStorage.setItem(LS_KEY, newPw);
        setChangeSuccess('Password updated successfully.');
        setCurrentPw('');
        setNewPw('');
        setConfirmPw('');
        setTimeout(() => {
            setShowChangeForm(false);
            setChangeSuccess('');
        }, 1800);
    };

    if (unlocked) {
        return (
            <div>
                {children}
                {/* Change Password floating button */}
                <div style={styles.changeToggleWrap}>
                    {!showChangeForm && (
                        <button
                            onClick={() => { setShowChangeForm(true); setChangeError(''); setChangeSuccess(''); }}
                            style={styles.changeToggleBtn}
                        >
                            🔑 Change Password
                        </button>
                    )}
                    {showChangeForm && (
                        <div style={styles.changeCard}>
                            <div style={styles.changeTitle}>Change Financial Password</div>
                            <form onSubmit={handleChangePassword}>
                                <input
                                    type="password"
                                    placeholder="Current password"
                                    value={currentPw}
                                    onChange={(e) => setCurrentPw(e.target.value)}
                                    style={styles.input}
                                    autoComplete="current-password"
                                />
                                <input
                                    type="password"
                                    placeholder="New password"
                                    value={newPw}
                                    onChange={(e) => setNewPw(e.target.value)}
                                    style={styles.input}
                                    autoComplete="new-password"
                                />
                                <input
                                    type="password"
                                    placeholder="Confirm new password"
                                    value={confirmPw}
                                    onChange={(e) => setConfirmPw(e.target.value)}
                                    style={styles.input}
                                    autoComplete="new-password"
                                />
                                {changeError && <div style={styles.error}>{changeError}</div>}
                                {changeSuccess && <div style={styles.success}>{changeSuccess}</div>}
                                <div style={styles.changeBtnRow}>
                                    <button type="submit" style={styles.saveBtn}>Save</button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowChangeForm(false); setChangeError(''); setChangeSuccess(''); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }}
                                        style={styles.cancelBtn}
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
                    />
                    {error && <div style={styles.error}>{error}</div>}
                    <button type="submit" style={styles.unlockBtn}>Unlock</button>
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
        padding: '12px 14px',
        borderRadius: '10px',
        border: '1px solid var(--surface-border)',
        background: 'var(--surface-elevated)',
        color: 'var(--text-primary)',
        fontSize: '15px',
        outline: 'none',
        marginBottom: '12px',
        boxSizing: 'border-box',
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
        padding: '12px',
        borderRadius: '10px',
        border: 'none',
        background: '#FFB400',
        color: '#000',
        fontSize: '15px',
        fontWeight: 700,
        cursor: 'pointer',
        marginTop: '4px',
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
        padding: '8px 16px',
        borderRadius: '10px',
        fontSize: '13px',
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    },
    changeCard: {
        background: 'var(--surface-card)',
        border: '1px solid var(--surface-border)',
        borderRadius: '14px',
        padding: '24px 22px 20px',
        width: '300px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    },
    changeTitle: {
        color: 'var(--text-primary)',
        fontSize: '15px',
        fontWeight: 700,
        marginBottom: '16px',
    },
    changeBtnRow: {
        display: 'flex',
        gap: '10px',
        marginTop: '4px',
    },
    saveBtn: {
        flex: 1,
        padding: '10px',
        borderRadius: '8px',
        border: 'none',
        background: '#FFB400',
        color: '#000',
        fontSize: '14px',
        fontWeight: 700,
        cursor: 'pointer',
    },
    cancelBtn: {
        flex: 1,
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid var(--surface-border)',
        background: 'transparent',
        color: 'var(--text-secondary)',
        fontSize: '14px',
        cursor: 'pointer',
    },
};

export default FinancialGate;
