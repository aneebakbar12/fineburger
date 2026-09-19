import React, { useState } from 'react';
import { loginAdmin } from '../services/firebase';
import '../styles/admin.css';

const formatAdminLoginError = (code, rawMessage) => {
    switch (code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
            return 'Invalid email or password. Please check your admin credentials.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/too-many-requests':
            return 'Too many failed login attempts. Please wait a moment and try again.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your internet connection.';
        default:
            if (rawMessage) {
                return rawMessage.replace(/^Firebase:\s*Error\s*\([^)]+\):\s*/i, '').replace(/^Firebase:\s*/i, '');
            }
            return 'Login failed. Please check your credentials.';
    }
};

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await loginAdmin(email, password);

        if (result.success) {
            onLoginSuccess(result.user);
        } else {
            setError(formatAdminLoginError(result.code, result.error));
        }

        setLoading(false);
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-logo">
                    <h1 className="logo">
                        <span className="logo-text">FINE</span>
                        <span className="logo-accent">BURGER</span>
                    </h1>
                </div>

                <h2 className="login-title">Admin Panel</h2>

                {error && (
                    <div style={{
                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                        border: '2px solid rgba(255, 0, 0, 0.5)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--spacing-md)',
                        color: '#ff6b6b',
                        marginBottom: 'var(--spacing-lg)',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@fineburger.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div style={{
                    marginTop: 'var(--spacing-lg)',
                    padding: 'var(--spacing-md)',
                    backgroundColor: 'rgba(255, 180, 0, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                }}>
                    <strong>Note:</strong> You need to create an admin account in Firebase Authentication first.
                </div>
            </div>
        </div>
    );
};

export default Login;
