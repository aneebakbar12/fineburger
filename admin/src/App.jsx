import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import OrderManager from './pages/OrderManager';
import RiderManager from './pages/RiderManager';
import CategoryManager from './pages/CategoryManager';
import MenuItemManager from './pages/MenuItemManager';
import InventoryManager from './pages/InventoryManager';
import SliderManager from './pages/SliderManager';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import ExpenseManager from './pages/ExpenseManager';
import FinancialDashboard from './pages/FinancialDashboard';
import { onAuthChange, subscribeToOrders } from './services/firebase'; // Updated import
import './styles/admin.css';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const audioContextRef = React.useRef(null);
    const prevOrdersRef = React.useRef([]);

    // Unlock AudioContext on first user interaction (browsers block audio until then)
    useEffect(() => {
        const unlock = () => {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
        };
        window.addEventListener('click', unlock);
        window.addEventListener('keydown', unlock);
        return () => {
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
        };
    }, []);

    // Buzzer Logic
    const playBuzzer = async () => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            // Resume context if suspended (required by browser autoplay policy)
            if (ctx.state === 'suspended') await ctx.resume();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(440, ctx.currentTime);
            oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 3.0);
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 3.0);
        } catch (e) {
            console.error("Audio playback failed", e);
        }
    };

    useEffect(() => {
        let unsubscribeOrders;
        const unsubscribeAuth = onAuthChange((currentUser) => {
            setUser(currentUser);
            setLoading(false);

            // Subscribe to orders if user is logged in
            if (currentUser) {
                unsubscribeOrders = subscribeToOrders((newOrders) => {
                    // Check for new pending orders
                    if (prevOrdersRef.current.length > 0) {
                        const previousIds = new Set(prevOrdersRef.current.map(o => o.id));
                        const newPendingOrders = newOrders.filter(o => !previousIds.has(o.id) && o.status === 'pending');
                        if (newPendingOrders.length > 0) playBuzzer();
                    }
                    prevOrdersRef.current = newOrders;
                });
            } else {
                if (unsubscribeOrders) unsubscribeOrders();
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeOrders) unsubscribeOrders();
        };
    }, []);

    const handleLoginSuccess = (loggedInUser) => {
        setUser(loggedInUser);
    };

    const handleLogout = () => {
        setUser(null);
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: 'var(--color-black)',
                color: 'var(--color-white)'
            }}>
                Loading...
            </div>
        );
    }

    if (!user) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <Router>
            <div className="admin-layout">
                <Sidebar onLogout={handleLogout} />
                <main className="admin-main">
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/orders" element={<OrderManager />} />
                        <Route path="/riders" element={<RiderManager />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/categories" element={<CategoryManager />} />
                        <Route path="/menu-items" element={<MenuItemManager />} />
                        <Route path="/inventory" element={<InventoryManager />} />
                        <Route path="/expenses" element={<ExpenseManager />} />
                        <Route path="/financial-dashboard" element={<FinancialDashboard />} />
                        <Route path="/sliders" element={<SliderManager />} />
                        <Route path="/settings" element={<Settings />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
