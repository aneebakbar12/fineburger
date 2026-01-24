import React, { useRef } from 'react';
import '../styles/MenuCategories.css';

const MenuCategories = ({ categories, activeCategory, onCategoryClick }) => {
    const scrollContainerRef = useRef(null);

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
        }
    };

    if (!categories || categories.length === 0) {
        return null;
    }

    return (
        <div className="menu-categories-wrapper">
            <div className="container">
                <div className="menu-categories-container">
                    <button
                        className="category-scroll-btn category-scroll-left"
                        onClick={scrollLeft}
                        aria-label="Scroll left"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>

                    <div className="menu-categories" ref={scrollContainerRef}>
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                                onClick={() => onCategoryClick(category.id)}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>

                    <button
                        className="category-scroll-btn category-scroll-right"
                        onClick={scrollRight}
                        aria-label="Scroll right"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MenuCategories;
