import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = ({ storeSettings }) => {
    const storeInfo = storeSettings?.storeInfo || {};
    const storePhone = storeInfo.phone || storeSettings?.phone || '+92 321 4854410';
    const storeAddress = storeInfo.address || storeSettings?.address || 'Main G.T. Road, Baghbanpura, Lahore, Punjab, Pakistan';
    const storeEmail = storeInfo.email || storeSettings?.email || 'info@fineburger.com';

    const cleanPhoneDigits = storePhone.replace(/[^0-9]/g, '');
    const waNumber = cleanPhoneDigits.startsWith('0') ? '92' + cleanPhoneDigits.slice(1) : (cleanPhoneDigits.startsWith('92') ? cleanPhoneDigits : '92' + cleanPhoneDigits);

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    {/* Brand Section */}
                    <div className="footer-section">
                        <h3 className="footer-brand">
                            <span className="logo-text">FINE</span>
                            <span className="logo-accent">BURGER</span>
                        </h3>
                        <p className="footer-tagline">Fresh Burgers. Hot Pizza. Delivered Fast.</p>
                        <p className="footer-desc">
                            Serving Lahore's finest gourmet burgers, signature rolls, and artisanal fast food.
                            Handcrafted with premium ingredients and bold local flavors.
                        </p>

                        {/* Social Media */}
                        <div className="footer-social">
                            <a
                                href="https://www.facebook.com/fineburgerlahore"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="social-link"
                                aria-label="Facebook"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </a>
                            <a
                                href={`https://wa.me/${waNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="social-link social-whatsapp"
                                aria-label="WhatsApp"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-section">
                        <h4 className="footer-heading">Quick Links</h4>
                        <ul className="footer-links">
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/menu">Menu Catalog</Link></li>
                            <li><Link to="/track-order">Track Order</Link></li>
                            <li><Link to="/about">About Us</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="footer-section">
                        <h4 className="footer-heading">Contact Information</h4>
                        <ul className="footer-contact">
                            <li>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                                <span>{storeAddress}</span>
                            </li>
                            <li>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                                <a href={`tel:${storePhone}`}>{storePhone}</a>
                            </li>
                            <li>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                                <a href={`mailto:${storeEmail}`}>{storeEmail}</a>
                            </li>
                        </ul>
                    </div>

                    {/* Operating Hours */}
                    <div className="footer-section">
                        <h4 className="footer-heading">Operating Hours</h4>
                        <ul className="footer-hours">
                            <li>
                                <span>Mon – Thu:</span>
                                <span>12:00 PM – 12:00 AM</span>
                            </li>
                            <li>
                                <span>Fri – Sat:</span>
                                <span>12:00 PM – 1:00 AM</span>
                            </li>
                            <li>
                                <span>Sunday:</span>
                                <span>1:00 PM – 12:00 AM</span>
                            </li>
                        </ul>
                        <a
                            href={`https://wa.me/${waNumber}?text=${encodeURIComponent("Hi Fine Burger! I'd like to place an order.")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="footer-whatsapp-btn"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Order via WhatsApp
                        </a>
                    </div>
                </div>

                <div className="footer-bottom">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <p>
                            &copy; {new Date().getFullYear()} Fine Burger &amp; Fast Food, Lahore. Fresh food crafted daily.
                        </p>
                        <button
                            type="button"
                            onClick={() => window.dispatchEvent(new CustomEvent('openStaffPinModal'))}
                            className="footer-staff-btn"
                            style={{
                                background: 'none',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'rgba(255, 255, 255, 0.4)',
                                fontSize: '11px',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-accent)'; e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
                        >
                            🔒 Staff POS Login
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;