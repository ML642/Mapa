import React, { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToAuthRequiredNotice } from '../../../services/authRequiredNotice';

interface AuthModalContextType {
    showAuthModal: boolean;
    openAuthModal: () => void;
    closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [showAuthModal, setShowAuthModal] = useState(false);

    const openAuthModal = () => setShowAuthModal(true);
    const closeAuthModal = () => setShowAuthModal(false);

    useEffect(() => subscribeToAuthRequiredNotice(() => setShowAuthModal(true)), []);

    return (
        <AuthModalContext.Provider value={{ showAuthModal, openAuthModal, closeAuthModal }}>
            {children}
        </AuthModalContext.Provider>
    );
};

// eslint-disable-next-line 
export const useAuthModal = () => {
    const context = useContext(AuthModalContext);
    if (!context) throw new Error('useAuthModal must be used within an AuthModalProvider');
    return context;
};
