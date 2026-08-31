// contexts/FavoriteContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthModal } from './AuthModalContext';
import {
    favoritesService,
    readSessionUserId,
    subscribeToSession,
} from '../../../services';
import type { Event } from '../../../services';

interface FavoriteContextType {
    favorites: Set<string>;
    toggleFavorite: (eventId: string) => Promise<void>;
    isFavorite: (eventId: string) => boolean;
    loadingFavorites: Set<string>;
}

const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined);

export const FavoriteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { openAuthModal } = useAuthModal();
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [loadingFavorites, setLoadingFavorites] = useState<Set<string>>(new Set());
    const [userId, setUserId] = useState<string | null>(() => readSessionUserId());

    useEffect(() => {
        let cancelled = false;

        const fetchFavorites = async () => {
            if (!userId) {
                setFavorites(new Set());
                return;
            }

            try {
                const favoriteList = await favoritesService.getFavoritesList(userId);
                if (cancelled) return;

                const favoriteIds = favoriteList
                    .map((event: Event) => event._id)
                    .filter((eventId): eventId is string => Boolean(eventId));
                setFavorites(new Set(favoriteIds));
            } catch (error) {
                if (!cancelled) console.error('Error loading favorites:', error);
            }
        };

        void fetchFavorites();

        return () => {
            cancelled = true;
        };
    }, [userId]);

    useEffect(() => {
        const syncSessionState = () => {
            setUserId(readSessionUserId());
        };

        syncSessionState();
        return subscribeToSession(() => syncSessionState());
    }, []);

    const isFavorite = (eventId: string): boolean => {
        const result = favorites.has(eventId);
        return result;
    };

    const addFavorite = async (eventId: string): Promise<boolean> => {
        if (!userId) {
            console.error('User ID was not found');
            openAuthModal();
            return false;
        }
        try {
            await favoritesService.addToFavorites(eventId);
            return true;
        } catch (error) {
            console.error('Error adding favorite:', error);
            return false;
        }
    };

    const removeFavorite = async (eventId: string): Promise<boolean> => {
        try {
            await favoritesService.removeFromFavorites(eventId);
            return true;
        } catch (error) {
            console.error('Error removing favorite:', error);
            return false;
        }
    };

    const toggleFavorite = async (eventId: string) => {
        if (loadingFavorites.has(eventId)) return;

        const currentlyFavorite = isFavorite(eventId);

        setLoadingFavorites(prev => new Set(prev).add(eventId));

        if (currentlyFavorite) {
            setFavorites(prev => {
                const newFavorites = new Set(prev);
                newFavorites.delete(eventId);
                return newFavorites;
            });
        } else {
            setFavorites(prev => new Set(prev).add(eventId));
        }

        try {
            let success: boolean;
            if (currentlyFavorite) {
                success = await removeFavorite(eventId);
            } else {
                success = await addFavorite(eventId);
            }

            if (!success) {
                if (currentlyFavorite) {
                    setFavorites(prev => new Set(prev).add(eventId));
                } else {
                    setFavorites(prev => {
                        const newFavorites = new Set(prev);
                        newFavorites.delete(eventId);
                        return newFavorites;
                    });
                }
            }
        } catch (error) {
            console.error('Error updating favorites:', error);
        } finally {
            setLoadingFavorites(prev => {
                const newLoading = new Set(prev);
                newLoading.delete(eventId);
                return newLoading;
            });
        }
    };

    return (
        <FavoriteContext.Provider value={{
            favorites,
            toggleFavorite,
            isFavorite,
            loadingFavorites
        }}>
            {children}
        </FavoriteContext.Provider>
    );
};

// eslint-disable-next-line 
export const useFavorites = () => {
    const context = useContext(FavoriteContext);
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoriteProvider');
    }
    return context;
};
