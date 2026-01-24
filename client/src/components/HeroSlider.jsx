import React, { useState, useEffect } from 'react';
import '../styles/HeroSlider.css';

const HeroSlider = ({ slides }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (!slides || slides.length === 0) return;

        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(timer);
    }, [slides]);

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    if (!slides || slides.length === 0) {
        return (
            <div className="hero-slider">
                <div className="hero-slide" style={{
                    background: 'linear-gradient(135deg, #FFB400 0%, #FF8C00 100%)'
                }}>
                    <div className="hero-content">
                        <h1 className="hero-title">Welcome to Fine Burger</h1>
                        <p className="hero-subtitle">Delicious food, delivered fresh</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="hero-slider">
            {slides.map((slide, index) => (
                <div
                    key={slide.id || index}
                    className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                    style={{ backgroundImage: `url(${slide.imageUrl})` }}
                >
                    <div className="hero-overlay"></div>
                    <div className="hero-content">
                        <h1 className="hero-title">{slide.title}</h1>
                        <p className="hero-subtitle">{slide.subtitle}</p>
                    </div>
                </div>
            ))}

            {/* Navigation Arrows */}
            <button className="slider-arrow slider-arrow-left" onClick={prevSlide}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                </svg>
            </button>
            <button className="slider-arrow slider-arrow-right" onClick={nextSlide}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                </svg>
            </button>

            {/* Dots Indicator */}
            <div className="slider-dots">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
                        onClick={() => goToSlide(index)}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroSlider;
