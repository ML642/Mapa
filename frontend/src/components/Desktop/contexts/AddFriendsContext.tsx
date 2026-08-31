import React, { createContext, useContext, useState } from 'react';

interface AddFriendsContextType {
    showAddFriendsModal: boolean;
    openAddFriendsModal: () => void;
    closeAddFriendsModal: () => void;
}

const AddFriendsContext = createContext<AddFriendsContextType | undefined>(undefined);

export const AddFriendsModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [showAddFriendsModal, setShowAddFriendsModal] = useState(false);

    const openAddFriendsModal = () => setShowAddFriendsModal(true);
    const closeAddFriendsModal = () => setShowAddFriendsModal(false);

    return (
        <AddFriendsContext.Provider value={{ showAddFriendsModal, openAddFriendsModal, closeAddFriendsModal }}>
            {children}
        </AddFriendsContext.Provider>
    );
};

// eslint-disable-next-line 
export const useFriendModal = () => {
    const context = useContext(AddFriendsContext);
    if (!context) throw new Error('useAuthModal must be used within an AuthModalProvider');
    return context;
};
