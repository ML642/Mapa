import { buildApiAssetUrl } from '../config';
import type { Event } from './eventsService';
import apiClient, { unwrapResponseData } from './apiClient';

export interface Friend {
  id?: string;
  _id?: string;
  username: string;
  avatar?: string;
  profilePicture?: string;
  friendsCount?: number;
}

export interface FriendsResponse {
  friends_count?: number;
  friends?: Friend[];
  data?: Friend[];
}

export interface FriendRequest {
  id?: string;
  _id?: string;
  username: string;
  avatar?: string;
  profilePicture?: string;
  createdAt?: string;
  mutualFriendsCount?: number;
}

export interface FriendRequestsResponse {
  friend_requests?: FriendRequest[];
  outgoing_requests?: FriendRequest[];
  data?: FriendRequest[];
}

export interface FriendActivityAttendee {
  id?: string;
  _id?: string;
  username: string;
  avatar?: string;
  profilePicture?: string;
}

export interface FriendActivityEvent extends Event {
  id?: string;
  attendees: FriendActivityAttendee[];
  attendeeCount: number;
}

export interface FriendsOverview {
  friendsCount: number;
  incomingRequestsCount: number;
  outgoingRequestsCount: number;
  previewFriends: Friend[];
  willAttendEvents: FriendActivityEvent[];
  mightAttendEvents: FriendActivityEvent[];
}

export interface UserProfile {
  id?: string;
  _id?: string;
  username: string;
  email?: string;
  avatar?: string;
  profilePicture?: string;
  bio?: string;
  isPublic?: boolean;
  friendCount?: number;
}

type FriendsOverviewPayload = Partial<FriendsOverview>;
type FriendActivityEventPayload = Partial<FriendActivityEvent> & { _id?: string };
type FriendPayload = Partial<Friend> & { _id?: string };
type FriendRequestPayload = Partial<FriendRequest> & { _id?: string };

const normalizeAvatar = (value?: string) => buildApiAssetUrl(value || '');

const normalizeFriend = (friend: FriendPayload): Friend => ({
  ...friend,
  id: friend.id || friend._id,
  avatar: normalizeAvatar(friend.avatar || friend.profilePicture),
  profilePicture: friend.profilePicture || friend.avatar || '',
  friendsCount: typeof friend.friendsCount === 'number' ? friend.friendsCount : Number(friend.friendsCount || 0),
  username: friend.username || '',
});

const normalizeFriendRequest = (request: FriendRequestPayload): FriendRequest => ({
  ...request,
  id: request.id || request._id,
  avatar: normalizeAvatar(request.avatar || request.profilePicture),
  profilePicture: request.profilePicture || request.avatar || '',
  mutualFriendsCount:
    typeof request.mutualFriendsCount === 'number'
      ? request.mutualFriendsCount
      : Number(request.mutualFriendsCount || 0),
  username: request.username || '',
});

const normalizeFriendActivityAttendee = (attendee: FriendPayload): FriendActivityAttendee => ({
  ...attendee,
  id: attendee.id || attendee._id,
  avatar: normalizeAvatar(attendee.avatar || attendee.profilePicture),
  profilePicture: attendee.profilePicture || attendee.avatar || '',
  username: attendee.username || '',
});

const normalizeFriendActivityEvent = (event: FriendActivityEventPayload): FriendActivityEvent => ({
  _id: event._id || event.id || '',
  id: event.id || event._id,
  title: event.title || '',
  description: event.description || '',
  event_date: event.event_date || '',
  date_display: event.date_display || '',
  address: event.address || '',
  category: event.category || 'Other',
  event_image: event.event_image || [],
  is_premium: Boolean(event.is_premium),
  coordinates: event.coordinates,
  price: event.price,
  price_description: event.price_description || '',
  attendees: Array.isArray(event.attendees) ? event.attendees.map(normalizeFriendActivityAttendee) : [],
  attendeeCount: typeof event.attendeeCount === 'number' ? event.attendeeCount : Number(event.attendeeCount || 0),
});

const normalizeUserProfile = (profile: UserProfile): UserProfile => ({
  ...profile,
  id: profile.id || profile._id,
  avatar: normalizeAvatar(profile.avatar || profile.profilePicture),
  profilePicture: profile.profilePicture || profile.avatar || '',
});

const normalizeFriendsOverview = (payload: FriendsOverviewPayload): FriendsOverview => ({
  friendsCount: Number(payload.friendsCount || 0),
  incomingRequestsCount: Number(payload.incomingRequestsCount || 0),
  outgoingRequestsCount: Number(payload.outgoingRequestsCount || 0),
  previewFriends: Array.isArray(payload.previewFriends) ? payload.previewFriends.map(normalizeFriend) : [],
  willAttendEvents: Array.isArray(payload.willAttendEvents)
    ? payload.willAttendEvents.map(normalizeFriendActivityEvent)
    : [],
  mightAttendEvents: Array.isArray(payload.mightAttendEvents)
    ? payload.mightAttendEvents.map(normalizeFriendActivityEvent)
    : [],
});

export const extractFriends = (payload: FriendsResponse | Friend[] | unknown): Friend[] => {
  if (Array.isArray(payload)) {
    return payload.map(normalizeFriend);
  }

  if (payload && typeof payload === 'object') {
    const data = payload as FriendsResponse;
    if (Array.isArray(data.friends)) {
      return data.friends.map(normalizeFriend);
    }
    if (Array.isArray(data.data)) {
      return data.data.map(normalizeFriend);
    }
  }

  return [];
};

export const extractFriendRequests = (payload: FriendRequestsResponse | FriendRequest[] | unknown): FriendRequest[] => {
  if (Array.isArray(payload)) {
    return payload.map(normalizeFriendRequest);
  }

  if (payload && typeof payload === 'object') {
    const data = payload as FriendRequestsResponse;
    if (Array.isArray(data.friend_requests)) {
      return data.friend_requests.map(normalizeFriendRequest);
    }
    if (Array.isArray(data.outgoing_requests)) {
      return data.outgoing_requests.map(normalizeFriendRequest);
    }
    if (Array.isArray(data.data)) {
      return data.data.map(normalizeFriendRequest);
    }
  }

  return [];
};

export const friendsService = {
  getFriends: async (userId: string) => {
    return apiClient.get<FriendsResponse>(`/friends/${userId}`);
  },

  getFriendsList: async (userId: string) => {
    const payload = await unwrapResponseData(apiClient.get<FriendsResponse | Friend[]>(`/friends/${userId}`));
    return extractFriends(payload);
  },

  getFriendsOverview: async () => {
    return apiClient.get<FriendsOverviewPayload>('/friends/overview');
  },

  getFriendsOverviewData: async () => {
    const payload = await unwrapResponseData(apiClient.get<FriendsOverviewPayload>('/friends/overview'));
    return normalizeFriendsOverview(payload);
  },

  getFriendRequests: async () => {
    return apiClient.get<FriendRequestsResponse | FriendRequest[]>('/friends/requests');
  },

  getFriendRequestsList: async () => {
    const payload = await unwrapResponseData(
      apiClient.get<FriendRequestsResponse | FriendRequest[]>('/friends/requests'),
    );
    return extractFriendRequests(payload);
  },

  getOutgoingFriendRequests: async () => {
    return apiClient.get<FriendRequestsResponse | FriendRequest[]>('/friends/requests/outgoing');
  },

  getOutgoingFriendRequestsList: async () => {
    const payload = await unwrapResponseData(
      apiClient.get<FriendRequestsResponse | FriendRequest[]>('/friends/requests/outgoing'),
    );
    return extractFriendRequests(payload);
  },

  acceptFriendRequest: async (friendId: string) => {
    return apiClient.post(`/friends/requests/accept/${friendId}`);
  },

  acceptFriendRequestAction: async (friendId: string) => {
    return unwrapResponseData(apiClient.post(`/friends/requests/accept/${friendId}`));
  },

  rejectFriendRequest: async (friendId: string) => {
    return apiClient.post(`/friends/requests/reject/${friendId}`);
  },

  rejectFriendRequestAction: async (friendId: string) => {
    return unwrapResponseData(apiClient.post(`/friends/requests/reject/${friendId}`));
  },

  cancelFriendRequestAction: async (friendId: string) => {
    return unwrapResponseData(apiClient.post(`/friends/requests/cancel/${friendId}`));
  },

  removeFriendAction: async (friendId: string) => {
    return unwrapResponseData(apiClient.post(`/friends/remove/${friendId}`));
  },

  sendFriendRequest: async (userId: string) => {
    return apiClient.post(`/friends/requests/send/${userId}`);
  },

  sendFriendRequestAction: async (userId: string) => {
    return unwrapResponseData(apiClient.post(`/friends/requests/send/${userId}`));
  },

  isFriend: async (userId: string) => {
    return apiClient.get<{ isFriend: boolean | string }>(`/friends/isFriend/${userId}`);
  },

  getIsFriendStatus: async (userId: string) => {
    const payload = await unwrapResponseData(
      apiClient.get<{ isFriend: boolean | string }>(`/friends/isFriend/${userId}`),
    );
    return String(payload.isFriend);
  },

  getMutualFriendsCount: async (userId: string) => {
    return apiClient.get<{ count?: number; mutualFriendsCount?: number }>(`/friends/mutual/${userId}`);
  },

  getMutualFriendsTotal: async (userId: string) => {
    const payload = await unwrapResponseData(
      apiClient.get<{ count?: number; mutualFriendsCount?: number }>(`/friends/mutual/${userId}`),
    );

    return payload.count ?? payload.mutualFriendsCount ?? 0;
  },

  getUserProfile: async (userId: string) => {
    return apiClient.get<UserProfile>(`/user/${userId}`);
  },

  getUserProfileData: async (userId: string) => {
    const payload = await unwrapResponseData(apiClient.get<UserProfile>(`/user/${userId}`));
    return normalizeUserProfile(payload);
  },
};
