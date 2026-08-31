import React, { createContext, useContext, useState } from 'react';

interface ShareEventContextType {
    showShareEventModal: boolean;
    openShareEventModal: () => void;
    closeShareEventModal: () => void;
}

const ShareEventContext = createContext<ShareEventContextType | undefined>(undefined);

export const ShareEventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [showShareEventModal, setShowShareEventModal] = useState(false);

    const openShareEventModal = () => setShowShareEventModal(true);
    const closeShareEventModal = () => setShowShareEventModal(false);

    return (
        <ShareEventContext.Provider value={{ showShareEventModal, openShareEventModal, closeShareEventModal }}>
            {children}
        </ShareEventContext.Provider>
    );
};

// eslint-disable-next-line 
export const useShareEventModal = () => {
    const context = useContext(ShareEventContext);
    if (!context) throw new Error('useShareEventModal must be used within a ShareEventProvider');
    return context;
};