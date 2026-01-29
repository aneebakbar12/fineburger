import React, { createContext, useContext, useState, useEffect } from 'react';

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
    const [staffPin, setStaffPin] = useState('1234'); // Default PIN, can be changed from admin

    // Load staff mode state from localStorage on mount
    useEffect(() => {
        const savedStaffMode = localStorage.getItem('isStaffMode');
        if (savedStaffMode === 'true') {
            setIsStaffMode(true);
        }
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
        if (pin === staffPin) {
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
        staffPin
    };

    return (
        <StaffModeContext.Provider value={value}>
            {children}
        </StaffModeContext.Provider>
    );
};
