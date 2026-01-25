import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import OrderManager from './pages/OrderManager';
import CategoryManager from './pages/CategoryManager';
import MenuItemManager from './pages/MenuItemManager';
import InventoryManager from './pages/InventoryManager';
import SliderManager from './pages/SliderManager';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import { onAuthChange } from './services/firebase';
import './styles/admin.css';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthChange((currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
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
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/categories" element={<CategoryManager />} />
                        <Route path="/menu-items" element={<MenuItemManager />} />
                        <Route path="/inventory" element={<InventoryManager />} />
                        <Route path="/sliders" element={<SliderManager />} />
                        <Route path="/settings" element={<Settings />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
