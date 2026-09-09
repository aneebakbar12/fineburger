import React from 'react';
import Home from './Home';

// Menu page displays the menu directly without the promotional hero slider
const Menu = (props) => {
    return <Home {...props} showHeroSlider={false} />;
};

export default Menu;
