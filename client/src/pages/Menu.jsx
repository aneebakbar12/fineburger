import React from 'react';
import Home from './Home';

// Menu page is essentially the same as Home page for now
// You can customize it differently if needed
const Menu = (props) => {
    return <Home {...props} />;
};

export default Menu;
