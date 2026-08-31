import apiClient, { unwrapResponseData } from './apiClient';
import type { Event } from './eventsService';

// Types
export interface FavoritesResponse {
  favorites: Event[];
}

export const extractFavorites = (payload: FavoritesResponse | Event[] | unknown): Event[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const data = payload as FavoritesResponse;
    if (Array.isArray(data.favorites)) {
      return data.favorites;
    }
  }

  return [];
};

// Favorites Service
export const favoritesService = {
  /**
   * Get user's favorite events
   */
  getFavorites: async (userId: string) => {
    return apiClient.get<FavoritesResponse>(`/user/favorites/${userId}`);
  },

  /**
   * Get favorite events normalized to array
   */
  getFavoritesList: async (userId: string) => {
    const payload = await unwrapResponseData(apiClient.get<FavoritesResponse>(`/user/favorites/${userId}`));
    return extractFavorites(payload);
  },

  /**
   * Get favorite event ids
   */
  getFavoriteIds: async (userId: string) => {
    const favorites = await favoritesService.getFavoritesList(userId);
    return favorites
      .map((event) => event._id)
      .filter((eventId): eventId is string => Boolean(eventId));
  },

  /**
   * Add event to favorites
   */
  addToFavorites: async (eventId: string) => {
    return apiClient.post(`/user/favorites/add/${eventId}`, {});
  },

  /**
   * Remove event from favorites
   */
  removeFromFavorites: async (eventId: string) => {
    return apiClient.delete(`/user/favorites/delete/${eventId}`);
  },
};

