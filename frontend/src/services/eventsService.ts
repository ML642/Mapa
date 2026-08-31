import apiClient, { unwrapResponseData } from './apiClient';

// Types
export interface Event {
  _id: string;
  title: string;
  description: string;
  event_date: string;
  date_display?: string;
  address: string;
  category: string;
  event_image?: string | string[];
  is_premium: boolean;
  isPermanent?: boolean;
  coordinates?: [number, number];
  price?: string;
  price_description?: string;
  phone?: string;
  source?: string;
}

export interface EventFilters {
  startDate?: string;
  endDate?: string;
  dateFrom?: string;
  dateTo?: string;
  categories?: string[];
  limit?: number;
  size?: number;
  page?: number;
}

export interface EventSearchFilters {
  text: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
}

export interface EventsPayload {
  events?: Event[];
  data?: Event[];
}

export interface EventsResponse {
  events: Event[];
  total: number;
  page: number;
  totalPages: number;
}

const normalizeEventFilters = (filters?: EventFilters) => {
  if (!filters) return undefined;

  const { limit, size, ...rest } = filters;

  return {
    ...rest,
    ...(typeof size === 'number' ? { size } : typeof limit === 'number' ? { size: limit } : {}),
  };
};


export const extractEvents = (payload: Event[] | EventsPayload | unknown): Event[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const data = payload as EventsPayload;
    if (Array.isArray(data.events)) {
      return data.events;
    }

    if (Array.isArray(data.data)) {
      return data.data;
    }
  }

  return [];
};

// Events Service
export const eventsService = {
  /**
   * Get all events with optional filters
   */
  getEvents: async (filters?: EventFilters) => {
    return apiClient.get<Event[] | EventsPayload>('/events', { params: normalizeEventFilters(filters) });
  },

  /**
   * Get all events normalized to array
   */
  getEventsList: async (filters?: EventFilters) => {
    const payload = await unwrapResponseData(apiClient.get<Event[] | EventsPayload>('/events', { params: normalizeEventFilters(filters) }));
    return extractEvents(payload);
  },

  /**
   * Get interesting events
   */
  getInterestingEvents: async (limit: number = 10) => {
    return apiClient.get<Event[] | EventsPayload>('/events/interesting', { params: { size: limit } });
  },

  /**
   * Get interesting events normalized to array
   */
  getInterestingEventsList: async (limit: number = 10) => {
    const payload = await unwrapResponseData(apiClient.get<Event[] | EventsPayload>('/events/interesting', { params: { size: limit } }));
    return extractEvents(payload);
  },

  /**
   * Get event by ID
   */
  getEventById: async (id: string) => {
    return apiClient.get<Event>(`/events/${id}`);
  },

  /**
   * Get event details payload
   */
  getEventDetails: async (id: string) => {
    return unwrapResponseData(apiClient.get<Event>(`/events/${id}`));
  },

  /**
   * Get events for map markers
   */
  getMapEvents: async () => {
    return apiClient.get<Event[] | EventsPayload>('/events/map', { params: {size:100,}});
  },

  /**
   * Get all map events. The API caps each page at 100 markers, so load every
   * page instead of silently omitting recently added events.
   */
  getMapEventsList: async () => {
    const firstPage = await unwrapResponseData(
      apiClient.get<EventsResponse>('/events/map', { params: { page: 1, size: 100 } }),
    );
    const firstEvents = extractEvents(firstPage);
    const totalPages = Math.max(1, Number(firstPage?.totalPages) || 1);

    if (totalPages === 1) return firstEvents;

    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        unwrapResponseData(
          apiClient.get<EventsResponse>('/events/map', { params: { page: index + 2, size: 100 } }),
        ),
      ),
    );

    return [...firstEvents, ...remainingPages.flatMap(extractEvents)];
  },

  /**
   * Search events via backend ranking pipeline.
   */
  searchEvents: async (filters: EventSearchFilters, options?: { signal?: AbortSignal }) => {
    return unwrapResponseData(
      apiClient.get<EventsResponse>('/events/search', {
        params: filters,
        signal: options?.signal,
      }),
    );
  },
};
