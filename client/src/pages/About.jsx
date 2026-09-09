import React from 'react';
import '../styles/About.css';

const About = () => {
    return (
        <div className="about-page">
            <div className="about-hero">
                <div className="container">
                    <h1 className="about-title">About Fine Burger</h1>
                    <p className="about-subtitle">Good Food, Great Times in Baghbanpura, Lahore</p>
                </div>
            </div>

            <div className="container">
                <section className="about-section">
                    <div className="about-content">
                        <h2 className="content-title">Our Story</h2>
                        <p className="content-text">
                            Welcome to <strong>Fine Burger &amp; Fast Food</strong>, your neighborhood destination for mouth-watering burgers, crispy chicken, and hot savory bites right in the heart of Baghbanpura, Lahore!
                        </p>
                        <p className="content-text">
                            Our journey began with a simple passion: serving freshly prepared, flavor-packed meals made with premium ingredients at prices everyone can enjoy. From our sizzling beef smash burgers and zinger fillets to our loaded fries and signature wraps, each recipe is perfected to deliver pure satisfaction in every single bite.
                        </p>
                    </div>

                    <div className="about-image">
                        <div className="image-placeholder" style={{ backgroundColor: 'rgba(255, 180, 0, 0.1)', border: '1px solid var(--color-accent)' }}>
                            <span style={{ fontSize: '72px' }}>🍔</span>
                        </div>
                    </div>
                </section>

                <section className="about-section reverse">
                    <div className="about-content">
                        <h2 className="content-title">Our Promise</h2>
                        <p className="content-text">
                            At Fine Burger, we believe that great food brings people together. That's why we're committed to:
                        </p>
                        <ul className="promise-list">
                            <li>Using only 100% fresh, halal meats and crisp garden vegetables</li>
                            <li>Maintaining strict hygiene, clean kitchens, and safe food handling</li>
                            <li>Crafting our signature sauces and fresh buns in-house daily</li>
                            <li>Fast kitchen preparation and prompt door-to-door delivery</li>
                            <li>Treating every customer like family with welcoming Pakistani hospitality</li>
                        </ul>
                    </div>

                    <div className="about-image">
                        <div className="image-placeholder" style={{ backgroundColor: 'rgba(255, 180, 0, 0.1)', border: '1px solid var(--color-accent)' }}>
                            <span style={{ fontSize: '72px' }}>✨</span>
                        </div>
                    </div>
                </section>

                <section className="values-section">
                    <h2 className="section-heading">Our Values</h2>
                    <div className="values-grid">
                        <div className="value-card">
                            <div className="value-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </div>
                            <h3 className="value-title">Quality First</h3>
                            <p className="value-description">We never compromise on the freshness of our meats, spices, and ingredients.</p>
                        </div>

                        <div className="value-card">
                            <div className="value-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <h3 className="value-title">Community Love</h3>
                            <p className="value-description">Proudly serving the Baghbanpura, Shalimar, and Greater Lahore community.</p>
                        </div>

                        <div className="value-card">
                            <div className="value-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                            <h3 className="value-title">Honest Taste</h3>
                            <p className="value-description">Authentic recipes, generous portions, and transparent pricing in every meal.</p>
                        </div>
                    </div>
                </section>

                {/* Visit Us / Contact Card */}
                <section style={{
                    marginTop: 'var(--spacing-3xl)',
                    padding: 'var(--spacing-2xl)',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-medium-gray)',
                    borderRadius: 'var(--radius-lg)',
                    textAlign: 'center'
                }}>
                    <h2 style={{ color: 'var(--color-white)', fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-sm)' }}>
                        Visit Fine Burger &amp; Fast Food
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-base)', maxWidth: '600px', margin: '0 auto var(--spacing-lg)' }}>
                        Come enjoy hot, freshly prepared meals at our restaurant or order for speedy home delivery across Baghbanpura &amp; Lahore.
                    </p>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 'var(--spacing-2xl)',
                        flexWrap: 'wrap',
                        marginBottom: 'var(--spacing-xl)',
                        color: 'var(--color-text-secondary)',
                        fontSize: 'var(--font-size-sm)'
                    }}>
                        <div>
                            <div style={{ color: 'var(--color-accent)', fontWeight: 700, marginBottom: '4px' }}>📍 LOCATION</div>
                            <div>Main G.T. Road, Baghbanpura</div>
                            <div>Lahore, Punjab 54890, Pakistan</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--color-accent)', fontWeight: 700, marginBottom: '4px' }}>📞 PHONE / WHATSAPP</div>
                            <div>+92 321 4854410</div>
                            <div>Order directly or chat on WhatsApp</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--color-accent)', fontWeight: 700, marginBottom: '4px' }}>🕒 OPENING HOURS</div>
                            <div>Mon – Sat: 12:00 PM – 1:00 AM</div>
                            <div>Sunday: 1:00 PM – 12:00 AM</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <a
                            href="https://maps.app.goo.gl/fzeTw4BjNQcova9q7"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        >
                            <span>🗺️</span> View on Google Maps
                        </a>
                        <a
                            href="https://wa.me/923214854410?text=Hi%20Fine%20Burger!%20I'd%20like%20to%20order."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-whatsapp"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
                        >
                            <span>📱</span> WhatsApp Order
                        </a>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default About;
