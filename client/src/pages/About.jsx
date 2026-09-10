import React from 'react';
import '../styles/About.css';

const About = ({ storeSettings }) => {
    const storeInfo = storeSettings?.storeInfo || {};
    const storePhone = storeInfo.phone || storeSettings?.phone || '+92 321 4854410';
    const storeAddress = storeInfo.address || storeSettings?.address || 'Main G.T. Road, Baghbanpura, Lahore, Punjab, Pakistan';
    const cleanPhoneDigits = storePhone.replace(/[^0-9]/g, '');
    const waNumber = cleanPhoneDigits.startsWith('0') ? '92' + cleanPhoneDigits.slice(1) : (cleanPhoneDigits.startsWith('92') ? cleanPhoneDigits : '92' + cleanPhoneDigits);

    return (
        <div className="about-page">
            <div className="about-hero">
                <div className="container">
                    <h1 className="about-title">The Fine Burger Story</h1>
                    <p className="about-subtitle">Handcrafted Fast Food in Baghbanpura, Lahore</p>
                </div>
            </div>

            <div className="container">
                <section className="about-section">
                    <div className="about-content">
                        <h2 className="content-title">Our Culinary Heritage</h2>
                        <p className="content-text">
                            Welcome to <strong>Fine Burger &amp; Fast Food</strong>, your destination for mouth-watering burgers, crispy chicken, signature paratha rolls, and artisanal pizzas right on Main G.T. Road, Baghbanpura, Lahore.
                        </p>
                        <p className="content-text">
                            Our kitchen started with an uncompromising commitment: serving freshly cooked meals made from premium halal meats, house-blended spices, and secret sauces at fair local prices. From our signature double beef smash burgers to our crunchiest zinger fillets and loaded fries, every recipe is perfected for maximum flavor.
                        </p>
                    </div>

                    <div className="about-image">
                        <img
                            src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80"
                            alt="Fine Burger Signature Gourmet Burger"
                            className="about-photo"
                            loading="lazy"
                        />
                    </div>
                </section>

                <section className="about-section reverse">
                    <div className="about-content">
                        <h2 className="content-title">Our Quality Standards</h2>
                        <p className="content-text">
                            At Fine Burger, we believe quality food requires discipline, fresh ingredients, and genuine care for our neighborhood guests:
                        </p>
                        <ul className="promise-list">
                            <li>100% Halal meats sourced daily from trusted local suppliers</li>
                            <li>Freshly baked buns and handmade signature sauces prepared each morning</li>
                            <li>Strict hygiene protocols, temperature-controlled storage, and open-counter prep</li>
                            <li>Fast kitchen ticketing so meals arrive piping hot at your table or doorstep</li>
                            <li>Warm Pakistani hospitality honoring every diner who trusts our kitchen</li>
                        </ul>
                    </div>

                    <div className="about-image">
                        <img
                            src="https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80"
                            alt="Fresh burger preparation on the grill"
                            className="about-photo"
                            loading="lazy"
                        />
                    </div>
                </section>

                <section className="values-section">
                    <h2 className="section-heading">Core Values</h2>
                    <div className="values-grid">
                        <div className="value-card">
                            <div className="value-icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </div>
                            <h3 className="value-title">Fresh, Never Frozen</h3>
                            <p className="value-description">We prepare our patties and chicken fillets fresh every morning for the juiciest bite.</p>
                        </div>

                        <div className="value-card">
                            <div className="value-icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <h3 className="value-title">Community Rooted</h3>
                            <p className="value-description">Proudly feeding families and youth across Baghbanpura, Shalimar, and Greater Lahore.</p>
                        </div>

                        <div className="value-card">
                            <div className="value-icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                            <h3 className="value-title">Honest Value</h3>
                            <p className="value-description">Generous portions, gourmet presentation, and accessible pricing for everyone.</p>
                        </div>
                    </div>
                </section>

                {/* Visit Us Card */}
                <section className="about-visit-card">
                    <h2 className="visit-title">
                        Visit Our Restaurant
                    </h2>
                    <p className="visit-subtitle">
                        Enjoy hot, freshly prepared meals inside our dining hall or order for swift delivery across Lahore.
                    </p>

                    <div className="visit-details-grid">
                        <div className="visit-detail-col">
                            <div className="visit-detail-label">📍 LOCATION</div>
                            <div>{storeAddress}</div>
                        </div>
                        <div className="visit-detail-col">
                            <div className="visit-detail-label">📞 CONTACT</div>
                            <div>{storePhone}</div>
                            <div>Direct call or WhatsApp order</div>
                        </div>
                        <div className="visit-detail-col">
                            <div className="visit-detail-label">🕒 OPERATING HOURS</div>
                            <div>Mon – Thu: 12:00 PM – 12:00 AM</div>
                            <div>Fri – Sat: 12:00 PM – 1:00 AM</div>
                            <div>Sunday: 1:00 PM – 12:00 AM</div>
                        </div>
                    </div>

                    <div className="visit-actions">
                        <a
                            href="https://maps.app.goo.gl/fzeTw4BjNQcova9q7"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                        >
                            <span>🗺️</span> View on Google Maps
                        </a>
                        <a
                            href={`https://wa.me/${waNumber}?text=${encodeURIComponent("Hi Fine Burger! I'd like to place an order.")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-whatsapp"
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