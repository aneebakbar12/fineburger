import React, { useState } from 'react';
import { registerRider } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';

const isValidPhoneNumber = (phone) => {
    if (!phone) return false;
    const cleaned = phone.replace(/[\s\-()]/g, '');
    // Pakistani numbers (03001234567 or +923001234567) or standard 10-14 digit phone numbers
    const pakistaniRegex = /^(\+92|92|0)?3[0-9]{9}$/;
    const generalRegex = /^\+?[0-9]{10,14}$/;
    return pakistaniRegex.test(cleaned) || generalRegex.test(cleaned);
};

const Signup = () => {
    const [signupCode, setSignupCode] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setError('');

        // --- Validation Checks ---
        if (!signupCode.trim() || signupCode.trim().length !== 6) {
            setError('Please enter a valid 6-character signup code');
            return;
        }

        if (!name.trim()) {
            setError('Please enter your full name');
            return;
        }

        // Phone number check (must be a valid phone number)
        if (!isValidPhoneNumber(phone)) {
            setError('Please enter a valid phone number (e.g. 0300 1234567 or +92 300 1234567)');
            return;
        }

        // Password check: only require 6 characters minimum (can be all numbers)
        if (!password || password.length < 6) {
            setError('Password must be at least 6 characters long (numbers only is fine)');
            return;
        }

        setLoading(true);
        const result = await registerRider(email.trim(), password, name.trim(), phone.trim(), signupCode.trim());
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
                    placeholder="Signup Code (e.g. HYCXKU)"
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
                    type="tel"
                    placeholder="Phone Number (e.g. 0300 1234567)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                    placeholder="Password (min 6 characters, numbers allowed)"
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
