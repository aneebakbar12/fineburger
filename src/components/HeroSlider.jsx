import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import '../styles/HeroSlider.css';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, useGSAP);

const DEFAULT_SLIDES = [
    {
        id: 'default-1',
        title: 'Juicy, Sizzling & Unmatched Taste',
        subtitle: 'Crafted with 100% fresh gourmet beef & premium brioche buns',
        imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=1600&q=80',
        badge: '🔥 Gourmet Perfection'
    },
    {
        id: 'default-2',
        title: 'Crispy Golden Fried Chicken',
        subtitle: 'Marinated in secret herbs and deep-fried to crispy perfection',
        imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=1600&q=80',
        badge: '🍗 Signature Crunch'
    },
    {
        id: 'default-3',
        title: 'Cheesy Melt Indulgence',
        subtitle: 'Double cheese, caramelized onions & house special secret sauce',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1600&q=80',
        badge: '🧀 Loaded Flavor'
    }
];

// Sanitize slide data so broken or missing fields never produce a black screen
const sanitizeSlides = (rawSlides) => {
    if (!rawSlides || rawSlides.length === 0) return DEFAULT_SLIDES;

    return rawSlides.map((slide, index) => {
        const fallback = DEFAULT_SLIDES[index % DEFAULT_SLIDES.length];
        const isBrokenUrl = !slide.imageUrl ||
            typeof slide.imageUrl !== 'string' ||
            slide.imageUrl.includes('rancherscafe.com') ||
            slide.imageUrl.trim() === '';

        return {
            ...slide,
            id: slide.id || `slide-${index}`,
            title: (slide.title && slide.title.trim()) ? slide.title : fallback.title,
            subtitle: (slide.subtitle && slide.subtitle.trim()) ? slide.subtitle : fallback.subtitle,
            badge: (slide.badge && slide.badge.trim()) ? slide.badge : fallback.badge,
            imageUrl: isBrokenUrl ? fallback.imageUrl : slide.imageUrl
        };
    });
};

const HeroSlider = ({ slides }) => {
    const activeSlides = sanitizeSlides(slides);
    const [currentSlide, setCurrentSlide] = useState(0);

    const containerRef = useRef(null);
    const bgLayersRef = useRef([]);
    const contentRef = useRef(null);
    const badgeRef = useRef(null);
    const titleRef = useRef(null);
    const subtitleRef = useRef(null);
    const ctaPillsRef = useRef(null);
    const scrollCueRef = useRef(null);

    // Auto-advance slides every 6s
    useEffect(() => {
        if (activeSlides.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
        }, 6000);

        return () => clearInterval(timer);
    }, [activeSlides.length]);

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
    };

    const scrollToMenu = () => {
        const target = document.querySelector('.menu-categories-container') ||
                       document.querySelector('.menu-categories') ||
                       document.querySelector('.menu-sections');
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.scrollBy({ top: 500, behavior: 'smooth' });
        }
    };

    // GSAP Scroll-Triggered Parallax & Content Animations
    useGSAP(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            if (contentRef.current) contentRef.current.style.opacity = '1';
            return;
        }

        // Gentle entrance animation for the active slide text
        gsap.fromTo(titleRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
        );
        gsap.fromTo(subtitleRef.current,
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, duration: 0.6, delay: 0.1, ease: 'power2.out' }
        );

        // Continuous subtle pulsing for the scroll cue
        if (scrollCueRef.current) {
            gsap.to(scrollCueRef.current, {
                y: 6,
                repeat: -1,
                yoyo: true,
                duration: 1.2,
                ease: 'power1.inOut'
            });
        }

        // Background Parallax: Gently track down as user scrolls
        const activeBg = bgLayersRef.current[currentSlide];
        if (activeBg && containerRef.current) {
            gsap.to(activeBg, {
                yPercent: 20,
                scale: 1.08,
                ease: 'none',
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 0.6
                }
            });
        }

        // Content Fade: ONLY fade out when scrolling well past the top (25% down), never at 0px scroll
        if (contentRef.current && containerRef.current) {
            gsap.fromTo(contentRef.current,
                { opacity: 1, y: 0 },
                {
                    opacity: 0,
                    y: -40,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: '25% top',
                        end: 'bottom top',
                        scrub: 0.5
                    }
                }
            );
        }

    }, { scope: containerRef, dependencies: [currentSlide, activeSlides.length] });

    const currentSlideData = activeSlides[currentSlide] || activeSlides[0];

    return (
        <div className="hero-slider-container" ref={containerRef}>
            <div className="hero-slider">
                {/* Background Slides */}
                {activeSlides.map((slide, index) => (
                    <div
                        key={slide.id || index}
                        ref={(el) => (bgLayersRef.current[index] = el)}
                        className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                        style={{
                            backgroundImage: `url(${slide.imageUrl})`,
                        }}
                    />
                ))}

                {/* Ambient Dark Film Overlay */}
                <div className="hero-overlay" />

                {/* Foreground Hero Content */}
                <div className="hero-content" ref={contentRef}>
                    <div className="hero-badge-container">
                        <span className="hero-badge" ref={badgeRef}>
                            {currentSlideData.badge || '🔥 Lahore\'s Favorite'}
                        </span>
                    </div>

                    <h1 className="hero-title" ref={titleRef}>
                        {currentSlideData.title}
                    </h1>

                    <p className="hero-subtitle" ref={subtitleRef}>
                        {currentSlideData.subtitle}
                    </p>

                    {/* Quick Highlights / CTA Row */}
                    <div className="hero-pills" ref={ctaPillsRef}>
                        <button className="hero-cta-btn" onClick={scrollToMenu} type="button">
                            <span>Explore Menu</span>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                        <div className="hero-feature-pill">
                            <span className="pill-dot"></span>
                            <span>100% Fresh Gourmet Beef</span>
                        </div>
                        <div className="hero-feature-pill">
                            <span className="pill-dot green"></span>
                            <span>Fast Delivery in 30 Mins</span>
                        </div>
                    </div>
                </div>

                {/* Navigation Arrows */}
                {activeSlides.length > 1 && (
                    <>
                        <button
                            className="slider-arrow slider-arrow-left"
                            onClick={prevSlide}
                            aria-label="Previous Slide"
                            type="button"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </button>
                        <button
                            className="slider-arrow slider-arrow-right"
                            onClick={nextSlide}
                            aria-label="Next Slide"
                            type="button"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </button>
                    </>
                )}

                {/* Dots Indicator */}
                {activeSlides.length > 1 && (
                    <div className="slider-dots">
                        {activeSlides.map((_, index) => (
                            <button
                                key={index}
                                className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
                                onClick={() => goToSlide(index)}
                                aria-label={`Go to slide ${index + 1}`}
                                type="button"
                            />
                        ))}
                    </div>
                )}

                {/* Scroll Indicator Cue */}
                <div className="hero-scroll-cue" ref={scrollCueRef} onClick={scrollToMenu}>
                    <span className="scroll-cue-text">Scroll to explore</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default HeroSlider;
