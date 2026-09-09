import React, { useState } from 'react';
import { registerRider } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
    const [signupCode, setSignupCode] = useState('');
    const [name, setName] = useState('');
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
        const result = await registerRider(email, password, name, signupCode);
        setLoading(false);
        if (result.success) {
            navigate('/');
        } else {
            setError('Signup failed: ' + result.error);
        }
    };

    return (
        <div className="login-container">
            <h1>Rider Signup</h1>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    className="input-large"
                    type="text"
                    placeholder="Signup Code (Get from admin)"
                    value={signupCode}
                    onChange={(e) => setSignupCode(e.target.value.toUpperCase())}
                    required
                    maxLength="6"
                    style={{ textTransform: 'uppercase', letterSpacing: '2px' }}
                />
                <input
                    className="input-large"
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <input
                    className="input-large"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    className="input-large"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength="6"
                />
                <button className="btn-primary" type="submit" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
            </form>
            <p style={{ marginTop: '20px' }}>
                Already have an account? <Link to="/login" style={{ color: 'var(--color-secondary, #FFB400)' }}>Login</Link>
            </p>
        </div>
    );
};

export default Signup;
