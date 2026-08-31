import { apiClient, unwrapData } from '../../shared/api/http';
import type { EventItem, EventsResponse, ParserRunResponse } from '../../shared/types';

export type EventQuery = {
  page: number;
  size: number;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  text?: string;
};

type ParserRunOptions = {
  categories?: string[];
  limit?: number;
  skipExisting?: boolean;
};

type CreateEventPayload = {
  title: string;
  description?: string;
  event_dates: string[];
  address: string;
  coordinates: [number, number];
  category: string;
  is_premium: boolean;
  price?: number | null;
  files?: File[];
};

const createParams = (query: EventQuery) => {
  const params = new URLSearchParams();
  params.set('page', String(query.page));
  params.set('size', String(query.size));

  if (query.category) {
    params.set('category', query.category);
  }

  if (query.dateFrom) {
    params.set('dateFrom', query.dateFrom);
  }

  if (query.dateTo) {
    params.set('dateTo', query.dateTo);
  }

  if (query.text) {
    params.set('text', query.text);
  }

  return params;
};

const fetchList = async (path: string, query: EventQuery) => {
  try {
    return await unwrapData<EventsResponse>(apiClient.get(path, { params: createParams(query) }));
  } catch (error) {
    if (error instanceof Error && error.message.includes('No events found')) {
      return {
        events: [],
        total: 0,
        page: query.page,
        totalPages: 0,
      } satisfies EventsResponse;
    }
    throw error;
  }
};

export const fetchActiveEvents = (query: EventQuery) =>
  query.text
    ? fetchList('/events/search', query)
    : fetchList('/events', query);

export const fetchInactiveEvents = (query: EventQuery) => fetchList('/moderation/events', query);

export const fetchParsedEvents = (query: EventQuery) => fetchList('/moderation/events/parsed', query);

export const fetchDeletedEvents = (query: EventQuery) => fetchList('/moderation/events/deleted', query);

export const fetchEventById = (eventId: string) => unwrapData<EventItem>(apiClient.get(`/events/admin/${eventId}`));

export const createEventForModeration = async (payload: CreateEventPayload) => {
  const data = new FormData();
  data.append('title', payload.title);
  data.append('address', payload.address);
  data.append('category', payload.category);
  data.append('is_premium', String(payload.is_premium));

  if (payload.description) {
    data.append('description', payload.description);
  }

  payload.event_dates.forEach((value) => {
    data.append('event_dates', value);
  });

  payload.coordinates.forEach((value) => {
    data.append('coordinates', String(value));
  });

  if (payload.price !== null && payload.price !== undefined) {
    data.append('price', String(payload.price));
  }

  payload.files?.forEach((file) => {
    data.append('images', file);
  });

  return unwrapData<{ message: string; _id: string }>(
    apiClient.post('/moderation/events/upload/event', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  );
};

export const updateEvent = (eventId: string, payload: Partial<EventItem>) =>
  unwrapData<{ message: string }>(apiClient.put(`/events/update/${eventId}`, payload));

export const approveEvent = (eventId: string) =>
  unwrapData<{ message: string }>(apiClient.post(`/moderation/events/approve/${eventId}`));

export const deleteEvent = (eventId: string) =>
  unwrapData<{ message: string }>(apiClient.delete(`/events/delete/${eventId}`));

export const rejectParserReview = (eventId: string) =>
  unwrapData<{ message: string }>(apiClient.post(`/moderation/events/reject/${eventId}`));

export const uploadEventImages = async (eventId: string, files: File[]) => {
  const data = new FormData();
  files.forEach((file) => {
    data.append('images', file);
  });

  return unwrapData<{ message: string; event_image: string[] }>(
    apiClient.post(`/moderation/events/upload/images/${eventId}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  );
};

export const deleteEventImages = (eventId: string, imageIndexes: string[]) =>
  unwrapData<{ message: string }>(
    apiClient.delete(`/moderation/events/delete/images/${eventId}`, {
      data: { imageIndexes },
    }),
  );

export const runRelaxParser = (options: ParserRunOptions = {}) =>
  unwrapData<ParserRunResponse>(apiClient.post('/parser/runs', {
    source: 'relax',
    categories: options.categories ?? [],
    limit: options.limit,
    skipExisting: options.skipExisting ?? true,
  }));

export const fetchParserRuns = (limit: number = 12) =>
  unwrapData<{ runs: import('../../shared/types').ParserRunRecord[] }>(
    apiClient.get('/parser/runs', { params: { limit, source: 'relax' } }),
  );

export const fetchParserRunById = (runId: string) =>
  unwrapData<{ run: import('../../shared/types').ParserRunRecord }>(apiClient.get(`/parser/runs/${runId}`));

export const cancelParserRun = (runId: string) =>
  unwrapData<{ message: string; run: import('../../shared/types').ParserRunRecord }>(
    apiClient.post(`/parser/runs/${runId}/cancel`),
  );
