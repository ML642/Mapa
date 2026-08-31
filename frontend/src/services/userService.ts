import { buildApiAssetUrl } from '../config';
import apiClient, { unwrapResponseData } from './apiClient';
import { extractEvents, type Event, type EventsPayload } from './eventsService';

export interface CurrentUserProfile {
  id: string;
  username: string;
  email: string;
  bio: string;
  profilePicture?: string;
  avatar: string;
  isPublic: boolean;
  role?: string;
  isPayed?: boolean;
  type?: string;
  payedUntil?: string | null;
  friendCount: number;
  pendingFriendRequestsCount: number;
  favoritesCount: number;
  willAttendCount: number;
  mightAttendCount: number;
  interests: string[];
}

export interface UpdateCurrentUserProfilePayload {
  username: string;
  bio: string;
  isPublic: boolean;
}

export type SearchHistoryItem = {
  query: string;
  searchedAt: string;
};

export type ViewHistoryItem = {
  event: Event;
  viewedAt: string;
};

type CurrentUserProfilePayload = Partial<CurrentUserProfile> & {
  _id?: string;
  profilePicture?: string;
  avatar?: string;
  interests?: string[];
};

type AvatarUploadResponse = {
  profilePicture?: string;
  user?: CurrentUserProfilePayload | null;
};

const normalizeCurrentUserProfile = (payload: CurrentUserProfilePayload): CurrentUserProfile => {
  const profilePicture = payload.profilePicture || payload.avatar || '';

  return {
    id: payload.id || payload._id || '',
    username: payload.username || '',
    email: payload.email || '',
    bio: payload.bio || '',
    profilePicture,
    avatar: buildApiAssetUrl(profilePicture),
    isPublic: Boolean(payload.isPublic),
    role: payload.role,
    isPayed: payload.isPayed,
    type: payload.type,
    payedUntil: payload.payedUntil || null,
    friendCount: Number(payload.friendCount || 0),
    pendingFriendRequestsCount: Number(payload.pendingFriendRequestsCount || 0),
    favoritesCount: Number(payload.favoritesCount || 0),
    willAttendCount: Number(payload.willAttendCount || 0),
    mightAttendCount: Number(payload.mightAttendCount || 0),
    interests: Array.isArray(payload.interests) ? payload.interests : [],
  };
};

export const userService = {
  getCurrentUserProfileData: async () => {
    const payload = await unwrapResponseData(apiClient.get<CurrentUserProfilePayload>('/user/me'));
    return normalizeCurrentUserProfile(payload);
  },

  updateCurrentUserProfileData: async (data: UpdateCurrentUserProfilePayload) => {
    const payload = await unwrapResponseData(apiClient.patch<CurrentUserProfilePayload>('/user/me', data));
    return normalizeCurrentUserProfile(payload);
  },

  uploadAvatarData: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const payload = await unwrapResponseData(
      apiClient.post<AvatarUploadResponse>('/user/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
    );

    if (payload.user) {
      return normalizeCurrentUserProfile(payload.user);
    }

    return normalizeCurrentUserProfile({
      id: '',
      username: '',
      email: '',
      bio: '',
      profilePicture: payload.profilePicture || '',
      isPublic: false,
      friendCount: 0,
      pendingFriendRequestsCount: 0,
      favoritesCount: 0,
      willAttendCount: 0,
      mightAttendCount: 0,
      interests: [],
    });
  },

  setCurrentUserInterests: async (categories: string[]) => {
    return unwrapResponseData(apiClient.post('/recommendation/user/set/interests', { categories }));
  },

  getAttendedEventsData: async (state: 'will_attend' | 'might_attend') => {
    const payload = await unwrapResponseData(
      apiClient.get<EventsPayload>('/recommendation/event/attend', {
        params: { state },
      }),
    );

    return extractEvents(payload as EventsPayload | Event[]);
  },

  getSearchHistoryData: async () => {
    return unwrapResponseData(apiClient.get<{ searches: SearchHistoryItem[] }>('/user/history/searches'));
  },

  addSearchHistoryItem: async (query: string) => {
    return unwrapResponseData(apiClient.post<{ searches: SearchHistoryItem[] }>('/user/history/searches', { query }));
  },

  clearSearchHistory: async () => {
    await apiClient.delete('/user/history/searches');
  },

  getViewHistoryData: async () => {
    return unwrapResponseData(apiClient.get<{ views: ViewHistoryItem[] }>('/user/history/views'));
  },

  addViewHistoryItem: async (eventId: string) => {
    await apiClient.post(`/user/history/views/${eventId}`);
  },

  clearViewHistory: async () => {
    await apiClient.delete('/user/history/views');
  },
};

export type { CurrentUserProfilePayload };
