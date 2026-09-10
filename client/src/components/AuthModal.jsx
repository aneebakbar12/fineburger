import React, { useState } from 'react';
import { loginUser, registerUser, loginWithGoogle } from '../services/firebase';
import '../styles/AuthModal.css';

const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Password check: only require 6 characters minimum (numbers only is fine)
        if (!password || password.length < 6) {
            setError('Password must be at least 6 characters long (numbers only is fine)');
            return;
        }

        setLoading(true);

        let result;
        if (isLogin) {
            result = await loginUser(email.trim(), password);
        } else {
            result = await registerUser(email.trim(), password, name.trim());
        }

        setLoading(false);

        if (result.success) {
            setEmail('');
            setPassword('');
            setName('');
            if (onLoginSuccess) onLoginSuccess(result.user);
            onClose();
        } else {
            setError(result.error);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setLoading(true);

        const result = await loginWithGoogle();
        setLoading(false);

        if (result.success) {
            if (onLoginSuccess) onLoginSuccess(result.user);
            onClose();
        } else {
            if (result.code === 'auth/operation-not-allowed') {
                setError('Google sign-in is not enabled in Firebase Console. Enable Google under Authentication > Sign-in method.');
            } else if (result.code === 'auth/popup-closed-by-user') {
                setError('Google sign-in popup was closed before completion.');
            } else {
                setError(result.error || 'Google sign-in failed. Please try again.');
            }
        }
    };

    return (
        <div className="auth-modal-overlay" onClick={onClose}>
            <div className="auth-modal" onClick={e => e.stopPropagation()}>
                <button className="auth-close" onClick={onClose}>&times;</button>

                <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p className="auth-subtitle">
                    {isLogin ? 'Sign in to continue ordering' : 'Sign up to track orders & faster checkout'}
                </p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="John Doe"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="•••••••• (min 6 characters)"
                            minLength="6"
                        />
                    </div>

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>OR</span>
                </div>

                <button
                    type="button"
                    className="btn-google-auth"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continue with Google</span>
                </button>

                <div className="auth-footer">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        className="auth-toggle-btn"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                    >
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
