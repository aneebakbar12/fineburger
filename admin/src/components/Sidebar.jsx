import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { logoutAdmin } from '../services/firebase';
import '../styles/Sidebar.css';

const Sidebar = ({ onLogout }) => {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logoutAdmin();
        onLogout();
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const menuItems = [
        { path: '/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/orders', icon: '🔔', label: 'Orders' },
        { path: '/reports', icon: '📈', label: 'Reports' },
        { path: '/categories', icon: '📁', label: 'Categories' },
        { path: '/menu-items', icon: '🍔', label: 'Menu Items' },
        { path: '/inventory', icon: '📦', label: 'Inventory' },
        { path: '/sliders', icon: '🖼️', label: 'Hero Sliders' },
        { path: '/settings', icon: '⚙️', label: 'Settings' },
    ];

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                className="mobile-menu-button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
            >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    {isMobileMenuOpen ? (
                        <path d="M18 6L6 18M6 6l12 12" />
                    ) : (
                        <>
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </>
                    )}
                </svg>
            </button>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div className="mobile-overlay" onClick={closeMobileMenu} />
            )}

            <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2 className="sidebar-logo">
                        <span className="logo-text">FINE</span>
                        <span className="logo-accent">BURGER</span>
                    </h2>
                    <p className="sidebar-subtitle">Admin Panel</p>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={closeMobileMenu}
                        >
                            <span className="sidebar-icon">{item.icon}</span>
                            <span className="sidebar-label">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="btn btn-secondary" onClick={handleLogout} style={{ width: '100%' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
