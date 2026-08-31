import apiClient, { unwrapResponseData } from './apiClient';

export type EventCommentAuthor = {
  _id: string;
  username: string;
  profilePicture: string;
};

export type EventComment = {
  _id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: EventCommentAuthor | null;
};

export type EventCommentsResponse = {
  comments: EventComment[];
  total: number;
};

export const commentsService = {
  getEventComments: async (eventId: string) => {
    return unwrapResponseData(
      apiClient.get<EventCommentsResponse>(`/events/${eventId}/comments`),
    );
  },

  createEventComment: async (eventId: string, body: string) => {
    return unwrapResponseData(
      apiClient.post<{ comment: EventComment }>(`/events/${eventId}/comments`, { body }),
    );
  },

  deleteEventComment: async (eventId: string, commentId: string) => {
    await apiClient.delete(`/events/${eventId}/comments/${commentId}`);
  },
};
