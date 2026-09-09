import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoreSettings } from '../services/firebase';

const StaffModeContext = createContext();

export const useStaffMode = () => {
    const context = useContext(StaffModeContext);
    if (!context) {
        throw new Error('useStaffMode must be used within StaffModeProvider');
    }
    return context;
};

export const StaffModeProvider = ({ children }) => {
    const [isStaffMode, setIsStaffMode] = useState(false);
    const [currentPin, setCurrentPin] = useState('1234');

    // Load staff mode state from localStorage and fetch PIN from store settings
    useEffect(() => {
        const savedStaffMode = localStorage.getItem('isStaffMode');
        if (savedStaffMode === 'true') {
            setIsStaffMode(true);
        }

        const fetchPin = async () => {
            try {
                const settings = await getStoreSettings();
                if (settings && settings.staffPin) {
                    setCurrentPin(String(settings.staffPin));
                }
            } catch (err) {
                console.warn('Could not fetch custom staff PIN, using fallback:', err);
            }
        };

        fetchPin();
    }, []);

    // Listen for exit staff mode event from header
    useEffect(() => {
        const handleExitStaffMode = () => {
            deactivateStaffMode();
        };
        window.addEventListener('exitStaffMode', handleExitStaffMode);
        return () => window.removeEventListener('exitStaffMode', handleExitStaffMode);
    }, []);

    const activateStaffMode = (pin) => {
        if (String(pin).trim() === String(currentPin).trim()) {
            setIsStaffMode(true);
            localStorage.setItem('isStaffMode', 'true');
            return true;
        }
        return false;
    };

    const deactivateStaffMode = () => {
        setIsStaffMode(false);
        localStorage.removeItem('isStaffMode');
    };

    const value = {
        isStaffMode,
        activateStaffMode,
        deactivateStaffMode,
        staffPin: currentPin
    };

    return (
        <StaffModeContext.Provider value={value}>
            {children}
        </StaffModeContext.Provider>
    );
};
