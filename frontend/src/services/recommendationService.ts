import apiClient, { unwrapResponseData } from './apiClient';
import type { Event } from './eventsService';

// Types
export type AttendState = 'will_attend' | 'will_not_attend' | 'might_attend';

export interface AttendStateResponse {
  state: AttendState;
}

export interface UpdateAttendStateRequest {
  state: AttendState;
}

export interface SearchHistoryRecommendation extends Event {
  searchHistoryScore: number;
  viewHistoryScore: number;
  interestsScore: number;
  attendanceScore: number;
  recommendationScore: number;
  matchedSearches: string[];
}

export interface SearchHistoryRecommendationsResponse {
  events: SearchHistoryRecommendation[];
  basedOn: string[];
  viewedEventIds: string[];
  interests: string[];
  attendedEventIds: string[];
}

export const PERSONALIZED_RECOMMENDATIONS_QUERY_KEY = ['recommendations', 'search-history'] as const;

// Recommendation Service
export const recommendationService = {
  getSearchHistoryRecommendations: async (size = 20) => {
    return unwrapResponseData(
      apiClient.get<SearchHistoryRecommendationsResponse>('/recommendation/search-history', { params: { size } }),
    );
  },

  /**
   * Get event attend state
   */
  getAttendState: async (eventId: string) => {
    return apiClient.get<AttendStateResponse>(`/recommendation/event/attend/state/${eventId}`);
  },

  /**
   * Get event attend state value
   */
  getAttendStateValue: async (eventId: string) => {
    const payload = await unwrapResponseData(
      apiClient.get<AttendStateResponse>(`/recommendation/event/attend/state/${eventId}`)
    );

    return payload.state;
  },

  /**
   * Update event attend state
   */
  updateAttendState: async (eventId: string, state: AttendState) => {
    return apiClient.post<AttendStateResponse>(
      `/recommendation/event/attend/${eventId}`,
      { state }
    );
  },

  /**
   * Update event attend state and return payload
   */
  updateAttendStateValue: async (eventId: string, state: AttendState) => {
    return unwrapResponseData(
      apiClient.post<AttendStateResponse>(
        `/recommendation/event/attend/${eventId}`,
        { state }
      )
    );
  },
};

