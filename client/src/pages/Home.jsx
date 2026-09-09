import React, { useState, useEffect } from 'react';
import HeroSlider from '../components/HeroSlider';
import MenuCategories from '../components/MenuCategories';
import MenuItem from '../components/MenuItem';
import ItemModal from '../components/ItemModal';
import SearchModal from '../components/SearchModal';
import { subscribeToSliders, isStoreOpen } from '../services/firebase';
import { useStaffMode } from '../contexts/StaffModeContext';
import '../styles/Home.css';
import '../styles/Footer.css';

const GOOGLE_REVIEWS = [
    {
        name: 'Muhammad Usman',
        initials: 'MU',
        rating: 5,
        date: '2 weeks ago',
        text: 'Absolutely loved it! The crispy chicken burger was perfectly seasoned and the bun was super fresh. Delivery was quick and everything arrived hot. Will definitely order again!'
    },
    {
        name: 'Ayesha Malik',
        initials: 'AM',
        rating: 5,
        date: '1 month ago',
        text: 'Best burger in Baghbanpura! The beef patty is juicy and the toppings are generous. Fries were crispy too. Staff is very polite. Highly recommend to everyone!'
    },
    {
        name: 'Bilal Ahmed',
        initials: 'BA',
        rating: 5,
        date: '3 weeks ago',
        text: 'Tried the zinger burger and the club sandwich — both were amazing. Reasonable prices and great taste. The portion sizes are very filling. This place is a hidden gem!'
    },
    {
        name: 'Sana Rauf',
        initials: 'SR',
        rating: 5,
        date: '5 days ago',
        text: 'Order came right on time, food was still warm and delicious. The packaging is clean and secure. The garlic mayo sauce is out of this world. 10/10 experience!'
    },
    {
        name: 'Hassan Tariq',
        initials: 'HT',
        rating: 5,
        date: '2 months ago',
        text: 'Great value for money. The double beef burger is massive and very tasty. I have been coming here for months and the quality has never dropped. Keep it up Fine Burger!'
    },
    {
        name: 'Fatima Noor',
        initials: 'FN',
        rating: 4,
        date: '1 week ago',
        text: 'Really enjoyed the meal! Crispy fries, fresh ingredients, and very friendly service. The dine-in area is clean and comfortable. One of the best fast food spots in the area.'
    }
];

const ReviewCard = ({ review }) => (
    <div className="review-card">
        <div className="review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
        <p className="review-text">"{review.text}"</p>
        <div className="review-author">
            <div className="review-avatar">{review.initials}</div>
            <div>
                <div className="review-name">{review.name}</div>
                <div className="review-date">{review.date} · via Google</div>
            </div>
        </div>
    </div>
);

const Home = ({ categories, menuItems, storeSettings, onAddToCart, isSearchOpen, onSearchClose, showHeroSlider = true }) => {
    const { isStaffMode } = useStaffMode();
    const [sliders, setSliders] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToSliders(setSliders);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (categories.length > 0 && !activeCategory) {
            setActiveCategory(categories[0].id);
        }
    }, [categories, activeCategory]);

    const handleItemClick = (item) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    const handleCategoryClick = (categoryId) => {
        setActiveCategory(categoryId);
        const element = document.getElementById(categoryId);
        if (element) {
            const headerOffset = 160;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
    };

    const storeOpen = storeSettings ? isStoreOpen(storeSettings) : false;

    const itemsByCategory = categories.map(category => ({
        ...category,
        items: menuItems.filter(item =>
            item.categoryId === category.id &&
            item.available &&
            item.inStock !== false &&
            (item.stockLevel === undefined || item.stockLevel > 0)
        )
    }));

    return (
        <div className="home-page">
            {showHeroSlider && !isStaffMode && <HeroSlider slides={sliders} />}

            <div className="container">
                {!storeOpen && storeSettings && (
                    <div className="store-status-banner">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                        </svg>
                        <span>We're currently closed. Check footer for opening hours.</span>
                    </div>
                )}

                <MenuCategories
                    categories={categories}
                    activeCategory={activeCategory}
                    onCategoryClick={handleCategoryClick}
                />

                <div className="menu-sections">
                    {itemsByCategory.map(category => (
                        category.items.length > 0 && (
                            <section key={category.id} id={category.id} className="menu-section">
                                <h2 className="section-title">{category.name}</h2>
                                <div className="menu-grid">
                                    {category.items.map(item => (
                                        <MenuItem
                                            key={item.id}
                                            item={item}
                                            onClick={handleItemClick}
                                        />
                                    ))}
                                </div>
                            </section>
                        )
                    ))}

                    {menuItems.length === 0 && (
                        <div className="empty-menu">
                            <p>No menu items available at the moment. Please check back later!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Google Reviews Section — only show on main home, not staff mode */}
            {!isStaffMode && showHeroSlider && (
                <div className="container">
                    <section className="reviews-section">
                        <h2 className="reviews-section-title">What Our Customers Say</h2>
                        <p className="reviews-section-sub">
                            ⭐ 4.8 / 5 — Rated by real customers on Google Maps
                        </p>
                        <div className="reviews-grid">
                            {GOOGLE_REVIEWS.map((r, i) => <ReviewCard key={i} review={r} />)}
                        </div>
                        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
                            <a
                                href="https://maps.app.goo.gl/fzeTw4BjNQcova9q7"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: 'var(--color-accent)',
                                    fontWeight: 600,
                                    fontSize: 'var(--font-size-sm)',
                                    border: '1px solid var(--color-accent)',
                                    padding: '10px 20px',
                                    borderRadius: 'var(--radius-md)',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C7.802 0 4 3.403 4 7.602 4 11.8 7.469 16.812 12 24c4.531-7.188 8-12.2 8-16.398C20 3.403 16.199 0 12 0zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                                </svg>
                                See All Reviews on Google Maps
                            </a>
                        </div>
                    </section>
                </div>
            )}

            <ItemModal
                item={selectedItem}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onAddToCart={onAddToCart}
                storeOpen={storeOpen}
            />

            <SearchModal
                isOpen={isSearchOpen}
                onClose={onSearchClose}
                menuItems={menuItems}
                onAddToCart={onAddToCart}
                onItemClick={handleItemClick}
            />
        </div>
    );
};

export default Home;
