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
            <h1>Rider Login</h1>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
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
                />
                <button type="submit">Login</button>
            </form>
            <p style={{ marginTop: '20px' }}>
                Don't have an account? <Link to="/signup" style={{ color: '#646cff' }}>Sign Up</Link>
            </p>
        </div>
    );
};

export default Login;
