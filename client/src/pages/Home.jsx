import React, { useState, useEffect } from 'react';
import HeroSlider from '../components/HeroSlider';
import MenuCategories from '../components/MenuCategories';
import MenuItem from '../components/MenuItem';
import ItemModal from '../components/ItemModal';
import { getSliders, subscribeToSliders, isStoreOpen } from '../services/firebase';
import '../styles/Home.css';

const Home = ({ categories, menuItems, storeSettings, onAddToCart }) => {
    const [sliders, setSliders] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        // Subscribe to real-time slider updates
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
            // Offset for sticky header (Header + CategoryNav approx 160px)
            const headerOffset = 160;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    const storeOpen = storeSettings ? isStoreOpen(storeSettings) : false;

    // Group items by category
    const itemsByCategory = categories.map(category => ({
        ...category,
        items: menuItems.filter(item => item.categoryId === category.id && item.available)
    }));

    return (
        <div className="home-page">
            <HeroSlider slides={sliders} />

            <div className="container">
                {!storeOpen && storeSettings && (
                    <div className="store-status-banner">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                        </svg>
                        <span>We're currently closed. Operating hours: Check footer for details</span>
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

            <ItemModal
                item={selectedItem}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onAddToCart={onAddToCart}
                storeOpen={storeOpen}
            />
        </div>
    );
};

export default Home;
