import React, { useState } from 'react';
import { loginRider } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await loginRider(email, password);
        if (result.success) {
            navigate('/');
        } else {
            setError('Login failed: ' + result.error);
        }
    };

    return (
        <div className="login-container">
            <div className="brand-section">
                <span className="brand-logo">🛵</span>
                <h1 className="brand-title">FINE BURGER</h1>
                <p className="brand-subtitle">Rider Partner App</p>
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
                <button type="submit" className="btn-primary">START SHIFT</button>
            </form>

            <p style={{ marginTop: '20px', color: '#666' }}>
                New Rider? <Link to="/signup" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Sign Up Here</Link>
            </p>
        </div>
    );
};

export default Login;
