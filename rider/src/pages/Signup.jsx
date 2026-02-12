import React, { useState } from 'react';
import { registerRider } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
    const [signupCode, setSignupCode] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await registerRider(email, password, name, signupCode);
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
                    type="text"
                    placeholder="Signup Code (Get from admin)"
                    value={signupCode}
                    onChange={(e) => setSignupCode(e.target.value.toUpperCase())}
                    required
                    maxLength="6"
                    style={{ textTransform: 'uppercase', letterSpacing: '2px' }}
                />
                <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength="6"
                />
                <button type="submit">Sign Up</button>
            </form>
            <p style={{ marginTop: '20px' }}>
                Already have an account? <Link to="/login" style={{ color: '#646cff' }}>Login</Link>
            </p>
        </div>
    );
};

export default Signup;
