import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import '../styles/HeroSlider.css';

// Register plugins
gsap.registerPlugin(ScrollTrigger, useGSAP);

const DEFAULT_SLIDES = [
    {
        id: 'default-1',
        title: 'Juicy, Sizzling & Unmatched Taste',
        subtitle: 'Crafted with 100% fresh gourmet beef & premium brioche buns',
        imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=1600&q=80',
        badge: '🔥 Gourmet Perfection',
        highlight: '100% Pure Beef'
    },
    {
        id: 'default-2',
        title: 'Crispy Golden Fried Chicken',
        subtitle: 'Marinated in secret herbs and deep-fried to crispy perfection',
        imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=1600&q=80',
        badge: '🍗 Signature Crunch',
        highlight: 'Hot & Crispy'
    },
    {
        id: 'default-3',
        title: 'Cheesy Melt Indulgence',
        subtitle: 'Double cheese, caramelized onions & house special secret sauce',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1600&q=80',
        badge: '🧀 Loaded Flavor',
        highlight: 'Double Cheese'
    }
];

const HeroSlider = ({ slides }) => {
    const activeSlides = slides && slides.length > 0 ? slides : DEFAULT_SLIDES;
    const [currentSlide, setCurrentSlide] = useState(0);

    const containerRef = useRef(null);
    const bgLayersRef = useRef([]);
    const overlayRef = useRef(null);
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

    // Scroll down to menu
    const scrollToMenu = () => {
        const target = document.querySelector('.menu-categories-container') || document.querySelector('.menu-sections');
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
            // Respect accessibility by showing elements without heavy motion
            gsap.set([contentRef.current, badgeRef.current, titleRef.current, subtitleRef.current, ctaPillsRef.current], {
                opacity: 1,
                y: 0
            });
            return;
        }

        // 1. Initial entrance timeline on mount
        const introTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        introTl
            .fromTo(badgeRef.current,
                { opacity: 0, y: -20, scale: 0.9 },
                { opacity: 1, y: 0, scale: 1, duration: 0.6, delay: 0.1 }
            )
            .fromTo(titleRef.current,
                { opacity: 0, y: 35 },
                { opacity: 1, y: 0, duration: 0.75 },
                '-=0.35'
            )
            .fromTo(subtitleRef.current,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6 },
                '-=0.35'
            )
            .fromTo(ctaPillsRef.current?.children || [],
                { opacity: 0, y: 15, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.1 },
                '-=0.25'
            )
            .fromTo(scrollCueRef.current,
                { opacity: 0, y: -10 },
                { opacity: 0.8, y: 0, duration: 0.5 },
                '-=0.2'
            );

        // Subtle pulsing for scroll cue
        gsap.to(scrollCueRef.current, {
            y: 8,
            repeat: -1,
            yoyo: true,
            duration: 1.2,
            ease: 'power1.inOut'
        });

        // 2. Smooth Scroll-Triggered Scrub Animations
        // Parallax background image (scales subtly and tracks down at scrubbed rate)
        const activeBg = bgLayersRef.current[currentSlide];
        if (activeBg) {
            gsap.to(activeBg, {
                yPercent: 22,
                scale: 1.12,
                ease: 'none',
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 0.5
                }
            });
        }

        // Hero content differential parallax: drifts upward faster and fades out
        if (contentRef.current) {
            gsap.to(contentRef.current, {
                yPercent: -35,
                opacity: 0,
                ease: 'power1.in',
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 0.4
                }
            });
        }

        // Overlay darkens slightly to smoothly bridge the transition to dark menu background
        if (overlayRef.current) {
            gsap.to(overlayRef.current, {
                backgroundColor: 'rgba(0, 0, 0, 0.88)',
                ease: 'none',
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 0.5
                }
            });
        }

        // Floating feature pills drift slightly at different rates
        if (ctaPillsRef.current) {
            gsap.to(ctaPillsRef.current, {
                yPercent: -50,
                opacity: 0,
                ease: 'power1.in',
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top top',
                    end: '70% top',
                    scrub: 0.3
                }
            });
        }

    }, { scope: containerRef, dependencies: [currentSlide] });

    const currentSlideData = activeSlides[currentSlide] || activeSlides[0];

    return (
        <div className="hero-slider-container" ref={containerRef}>
            <div className="hero-slider">
                {activeSlides.map((slide, index) => (
                    <div
                        key={slide.id || index}
                        ref={(el) => (bgLayersRef.current[index] = el)}
                        className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                        style={{
                            backgroundImage: slide.imageUrl ? `url(${slide.imageUrl})` : undefined,
                            background: !slide.imageUrl ? 'linear-gradient(135deg, #FFB400 0%, #FF8C00 100%)' : undefined
                        }}
                    />
                ))}

                {/* Smooth Gradient Overlay */}
                <div className="hero-overlay" ref={overlayRef} />

                {/* Hero Foreground Content with GSAP references */}
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

                    {/* Quick Highlights / CTA row */}
                    <div className="hero-pills" ref={ctaPillsRef}>
                        <button className="hero-cta-btn" onClick={scrollToMenu}>
                            <span>View Menu</span>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                        <div className="hero-feature-pill">
                            <span className="pill-dot"></span>
                            <span>Fresh Daily Patties</span>
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
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </button>
                        <button
                            className="slider-arrow slider-arrow-right"
                            onClick={nextSlide}
                            aria-label="Next Slide"
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
