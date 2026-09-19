import React, { useState } from 'react';
import { loginRider } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';

const formatFriendlyRiderAuthError = (code, rawMessage) => {
    switch (code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
            return 'Incorrect email or password. Please check your credentials.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please wait a moment before trying again.';
        case 'auth/network-request-failed':
            return 'Network connection failed. Please check your internet connection.';
        default:
            if (rawMessage) {
                return rawMessage.replace(/^Firebase:\s*Error\s*\([^)]+\):\s*/i, '').replace(/^Firebase:\s*/i, '');
            }
            return 'Login failed. Please check your credentials.';
    }
};

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setError('');
        setLoading(true);

        const result = await loginRider(email.trim(), password);
        setLoading(false);

        if (result.success) {
            navigate('/');
        } else {
            setError(formatFriendlyRiderAuthError(result.code, result.error));
        }
    };

    return (
        <div className="login-container">
            <div className="brand-section">
                <span className="brand-logo">🛵</span>
                <h1 className="brand-title">FINE BURGER</h1>
                <p className="brand-subtitle">Rider Delivery App</p>
            </div>

            {error && <div className="error-msg">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
                <input
                    type="email"
                    className="input-large"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    className="input-large"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" className="btn-primary" disabled={loading} style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? 'STARTING SHIFT...' : 'START SHIFT'}
                </button>
            </form>

            <p style={{ marginTop: '20px', color: '#888' }}>
                New Rider? <Link to="/signup" style={{ color: 'var(--rider-gold, #FFB400)', fontWeight: 'bold' }}>Sign Up Here</Link>
            </p>
        </div>
    );
};

export default Login;
