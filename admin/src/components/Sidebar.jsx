import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { logoutAdmin } from '../services/firebase';
import {
    DashboardIcon,
    OrdersIcon,
    RidersIcon,
    FinanceIcon,
    ExpensesIcon,
    ReportsIcon,
    CategoryIcon,
    MenuIcon,
    InventoryIcon,
    SlidersIcon,
    SettingsIcon,
    VolumeIcon,
    MuteIcon
} from './Icons';
import '../styles/Sidebar.css';

const Sidebar = ({ onLogout, pendingCount = 0, isAudioMuted = false, onToggleAudio }) => {
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
        { path: '/dashboard', Icon: DashboardIcon, label: 'Dashboard' },
        { path: '/orders', Icon: OrdersIcon, label: 'Orders', badge: pendingCount },
        { path: '/riders', Icon: RidersIcon, label: 'Riders' },
        { path: '/financial-dashboard', Icon: FinanceIcon, label: 'Financial' },
        { path: '/expenses', Icon: ExpensesIcon, label: 'Expenses' },
        { path: '/reports', Icon: ReportsIcon, label: 'Reports' },
        { path: '/categories', Icon: CategoryIcon, label: 'Categories' },
        { path: '/menu-items', Icon: MenuIcon, label: 'Menu Items' },
        { path: '/inventory', Icon: InventoryIcon, label: 'Inventory' },
        { path: '/sliders', Icon: SlidersIcon, label: 'Hero Sliders' },
        { path: '/settings', Icon: SettingsIcon, label: 'Settings' },
    ];

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                className="mobile-menu-button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle navigation menu"
            >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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
                    <p className="sidebar-subtitle">Management Console</p>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map(({ path, Icon, label, badge }) => (
                        <Link
                            key={path}
                            to={path}
                            className={`sidebar-link ${location.pathname === path ? 'active' : ''}`}
                            onClick={closeMobileMenu}
                        >
                            <span className="sidebar-icon">
                                <Icon width={20} height={20} stroke={location.pathname === path ? 'var(--color-accent)' : 'currentColor'} />
                            </span>
                            <span className="sidebar-label">{label}</span>
                            {badge > 0 && (
                                <span className="sidebar-badge" title={`${badge} pending orders`}>
                                    {badge}
                                </span>
                            )}
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    {onToggleAudio && (
                        <button
                            type="button"
                            className={`sidebar-audio-btn ${isAudioMuted ? 'muted' : ''}`}
                            onClick={onToggleAudio}
                            title={isAudioMuted ? 'Order chime is muted. Click to unmute.' : 'Order chime is active. Click to mute.'}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isAudioMuted ? <MuteIcon width={16} height={16} /> : <VolumeIcon width={16} height={16} />}
                                <span>{isAudioMuted ? 'Alerts Muted' : 'Sound Alerts'}</span>
                            </span>
                            <span className="audio-status-dot" />
                        </button>
                    )}

                    <button className="btn btn-secondary" onClick={handleLogout} style={{ width: '100%' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
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
