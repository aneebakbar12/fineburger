import React from 'react';
import '../styles/About.css';

const About = () => {
    return (
        <div className="about-page">
            <div className="about-hero">
                <div className="container">
                    <h1 className="about-title">About Fine Burger</h1>
                    <p className="about-subtitle">Good Food, Great Times</p>
                </div>
            </div>

            <div className="container">
                <section className="about-section">
                    <div className="about-content">
                        <h2 className="content-title">Our Story</h2>
                        <p className="content-text">
                            Welcome to Fine Burger, where passion meets flavor! Since our inception, we've been dedicated to serving the finest burgers, pizzas, and quick bites that bring joy to every meal. Our journey began with a simple mission: to create food that not only satisfies hunger but creates memorable dining experiences.
                        </p>
                        <p className="content-text">
                            Every item on our menu is crafted with care, using only the freshest ingredients and time-tested recipes. From our signature burgers to our crispy fries, each dish tells a story of quality, taste, and dedication to culinary excellence.
                        </p>
                    </div>

                    <div className="about-image">
                        <div className="image-placeholder">
                            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
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
                            <li>Using only the freshest, highest-quality ingredients</li>
                            <li>Maintaining strict hygiene and food safety standards</li>
                            <li>Delivering exceptional taste in every bite</li>
                            <li>Providing friendly, efficient service</li>
                            <li>Creating a welcoming atmosphere for all our guests</li>
                        </ul>
                    </div>

                    <div className="about-image">
                        <div className="image-placeholder">
                            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
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
                            <h3 className="value-title">Quality</h3>
                            <p className="value-description">We never compromise on the quality of our ingredients or preparation.</p>
                        </div>

                        <div className="value-card">
                            <div className="value-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <h3 className="value-title">Community</h3>
                            <p className="value-description">We're proud to be part of the local community and serve our neighbors.</p>
                        </div>

                        <div className="value-card">
                            <div className="value-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                            <h3 className="value-title">Trust</h3>
                            <p className="value-description">Building lasting relationships through consistent excellence and integrity.</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default About;
