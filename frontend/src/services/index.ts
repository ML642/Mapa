// Export all services from a single entry point
export { authService } from './authService';
export { eventsService } from './eventsService';
export { friendsService } from './friendsService';
export { favoritesService } from './favoritesService';
export { commentsService } from './commentsService';
export { recommendationService, PERSONALIZED_RECOMMENDATIONS_QUERY_KEY } from './recommendationService';
export { socialShareService } from './socialShareService';
export { userService } from './userService';
export { default as apiClient } from './apiClient';
export {
  AUTH_REQUIRED_NOTICE_MESSAGE,
  notifyAuthRequired,
  subscribeToAuthRequiredNotice,
} from './authRequiredNotice';
export {
  bootstrapSession,
  canRefreshSession,
  clearAuthenticatedSession,
  getSessionAccessToken,
  getSessionSnapshot,
  mergeSessionUser,
  readSessionUserId,
  refreshAccessToken,
  subscribeToSession,
  writeAuthenticatedSession,
} from './session';
export {
  clearStoredUser,
  mergeStoredUser,
  normalizeStoredUser,
  readStoredUser,
  subscribeToStoredUser,
  writeStoredUser,
} from './userSession';

// Export types
export type { LoginRequest, RegisterRequest, VerifyEmailRequest, GoogleAuthRequest, SetInterestsRequest, AuthResponse, AuthUser } from './authService';
export type { Event, EventFilters, EventSearchFilters, EventsPayload, EventsResponse } from './eventsService';
export type {
  Friend,
  FriendActivityAttendee,
  FriendActivityEvent,
  FriendRequest,
  FriendRequestsResponse,
  FriendsOverview,
  FriendsResponse,
  UserProfile,
} from './friendsService';
export type { FavoritesResponse } from './favoritesService';
export type { EventComment, EventCommentAuthor, EventCommentsResponse } from './commentsService';
export type { AttendState, AttendStateResponse, UpdateAttendStateRequest } from './recommendationService';
export type { ShareOptions } from './socialShareService';
export type { CurrentUserProfile, UpdateCurrentUserProfilePayload } from './userService';
export type { AuthRequiredNoticePayload } from './authRequiredNotice';
export type { SessionSnapshot } from './session';
export type { StoredUser } from './userSession';

