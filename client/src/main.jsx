import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
);

// Register Progressive Web App (PWA) Service Worker in production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('🍔 Fine Burger PWA ServiceWorker active:', registration.scope);
            })
            .catch((error) => {
                console.log('PWA ServiceWorker registration failed:', error);
            });
    });
}
