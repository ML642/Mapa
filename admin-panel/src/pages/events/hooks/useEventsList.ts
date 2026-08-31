import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  approveEvent,
  deleteEvent,
  fetchActiveEvents,
  fetchDeletedEvents,
  fetchInactiveEvents,
  fetchParsedEvents,
  rejectParserReview,
  type EventQuery,
} from '../../../features/events/api';
import { fetchUserById } from '../../../features/users/api';
import { appendAuditRecord } from '../../../shared/lib/audit';
import {
  getEventSourceKey,
  isModerationChangeEvent,
  isModerationRequestEvent,
  normalizeErrorMessage,
  shortId,
} from '../../../shared/lib/utils';
import type { EventItem } from '../../../shared/types';
import {
  DEFAULT_EVENTS_FILTERS,
  getListSectionMeta,
  getSourceOptions,
  hasResettableEventFilters,
  INITIAL_EVENT_COUNTS,
  INITIAL_EVENT_LIST_STATE,
  resetEventFilters,
  type EventCountsState,
  type EventListState,
  type EventsFilterState,
} from '../model/eventFilters';
import { isParserReviewEvent } from '../model/eventForm';

type UseEventsListParams = {
  userName?: string;
};

type UseEventsListResult = {
  events: EventItem[];
  loading: boolean;
  refreshing: boolean;
  error: string;
  list: EventListState;
  counts: EventCountsState;
  filters: EventsFilterState;
  authorNames: Record<string, string>;
  rowBusyId: string | null;
  sourceOptions: string[];
  sectionTitle: string;
  sectionSubtitle: string;
  canResetFilters: boolean;
  setFilters: Dispatch<SetStateAction<EventsFilterState>>;
  resetFilters: () => void;
  reportError: (message: string) => void;
  reloadList: () => Promise<void>;
  refreshCounts: () => Promise<void>;
  reload: () => Promise<void>;
  approveListEvent: (event: EventItem) => Promise<void>;
  deleteListEvent: (event: EventItem) => Promise<void>;
};

export const useEventsList = ({ userName }: UseEventsListParams = {}): UseEventsListResult => {
  const [filters, setFilters] = useState<EventsFilterState>(DEFAULT_EVENTS_FILTERS);
  const [list, setList] = useState<EventListState>(INITIAL_EVENT_LIST_STATE);
  const [counts, setCounts] = useState<EventCountsState>(INITIAL_EVENT_COUNTS);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(filters.searchInput.trim());
  const authorNamesRef = useRef(authorNames);

  useEffect(() => {
    authorNamesRef.current = authorNames;
  }, [authorNames]);

  const reportError = useCallback((message: string) => {
    setList((current) => ({ ...current, error: message }));
  }, []);

  const refreshCounts = useCallback(async () => {
    try {
      const [active, inactive, parsed, deleted] = await Promise.all([
        fetchActiveEvents({ page: 1, size: 1 }),
        fetchInactiveEvents({ page: 1, size: 1 }),
        fetchParsedEvents({ page: 1, size: 1 }),
        fetchDeletedEvents({ page: 1, size: 1 }),
      ]);

      setCounts({
        active: active.total,
        inactive: inactive.total,
        parsed: parsed.total,
        deleted: deleted.total,
      });
    } catch {
      // Counts are secondary; page data still remains usable without them.
    }
  }, []);

  const loadAuthors = useCallback(async (events: EventItem[]) => {
    const knownAuthors = authorNamesRef.current;
    const ids = [...new Set(events.flatMap((event) => [event.createdBy, event.updatedBy]).filter(Boolean) as string[])]
      .filter((id) => !knownAuthors[id]);

    if (!ids.length) {
      return;
    }

    const resolved = await Promise.all(
      ids.map(async (id) => {
        try {
          const profile = await fetchUserById(id);
          return [id, profile.username] as const;
        } catch {
          return [id, shortId(id)] as const;
        }
      }),
    );

    setAuthorNames((current) => {
      const next = { ...current };

      resolved.forEach(([id, username]) => {
        next[id] = username;
      });

      authorNamesRef.current = next;
      return next;
    });
  }, []);

  const reloadList = useCallback(async () => {
    const query: EventQuery = {
      page: filters.page,
      size: filters.size,
      category: filters.category || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      text: filters.group === 'current' ? deferredSearch || undefined : undefined,
    };

    setList((current) => ({
      ...current,
      loading: current.events.length === 0,
      refreshing: current.events.length > 0,
      error: '',
    }));

    try {
      let response;

      if (filters.group === 'current') {
        response = await fetchActiveEvents(query);
      } else if (filters.group === 'archive') {
        response = await fetchDeletedEvents(query);
      } else if (filters.moderationMode === 'parser') {
        response = await fetchParsedEvents(query);
      } else if (filters.moderationMode === 'all') {
        const [inactive, parsed] = await Promise.all([
          fetchInactiveEvents({ ...query, page: 1, size: Math.max(filters.size, 40) }),
          fetchParsedEvents({ ...query, page: 1, size: Math.max(filters.size, 40) }),
        ]);

        response = {
          events: [...inactive.events, ...parsed.events],
          total: inactive.total + parsed.total,
          page: 1,
          totalPages: 1,
        };
      } else {
        response = await fetchInactiveEvents(query);
      }

      let events = response.events;

      if (filters.group === 'moderation' && filters.moderationMode === 'changes') {
        events = events.filter((event) => isModerationChangeEvent(event));
      }

      if (filters.group === 'moderation' && filters.moderationMode === 'requests') {
        events = events.filter((event) => isModerationRequestEvent(event));
      }

      if (filters.sourceFilter !== 'all') {
        events = events.filter((event) => getEventSourceKey(event) === filters.sourceFilter);
      }

      if (filters.group !== 'current' && deferredSearch) {
        const needle = deferredSearch.toLowerCase();
        events = events.filter((event) =>
          [event.title, event.description, event.address, event.category]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(needle)),
        );
      }

      events = [...events].sort((left, right) => {
        if (filters.sortMode === 'title') {
          return left.title.localeCompare(right.title, 'ru');
        }

        const leftValue = left.event_date ?? '';
        const rightValue = right.event_date ?? '';
        return filters.sortMode === 'newest'
          ? rightValue.localeCompare(leftValue)
          : leftValue.localeCompare(rightValue);
      });

      const totalPages = filters.group === 'moderation' && filters.moderationMode === 'all'
        ? 1
        : response.totalPages ?? 0;

      setList({
        loading: false,
        refreshing: false,
        error: '',
        events,
        total: filters.group === 'moderation' && filters.moderationMode === 'all' ? events.length : response.total,
        page: filters.group === 'moderation' && filters.moderationMode === 'all' ? 1 : response.page ?? filters.page,
        totalPages,
      });

      void loadAuthors(events);
    } catch (error) {
      setList((current) => ({
        ...current,
        loading: false,
        refreshing: false,
        error: normalizeErrorMessage(error, 'Failed to load events'),
        ...(current.events.length
          ? {}
          : {
            events: [],
            total: 0,
            page: 1,
            totalPages: 0,
          }),
      }));
    }
  }, [deferredSearch, filters, loadAuthors]);

  const reload = useCallback(async () => {
    await Promise.all([reloadList(), refreshCounts()]);
  }, [refreshCounts, reloadList]);

  useEffect(() => {
    void reloadList();
  }, [reloadList]);

  useEffect(() => {
    void refreshCounts();
  }, [refreshCounts]);

  const approveListEvent = useCallback(async (event: EventItem) => {
    setRowBusyId(event._id);
    setList((current) => ({ ...current, error: '' }));

    try {
      await approveEvent(event._id);
      const parserReview = isParserReviewEvent(event);

      appendAuditRecord({
        actor: userName ?? 'admin',
        action: parserReview ? 'Parser review approved' : 'Event published',
        target: event.title,
        details: event._id,
        status: 'success',
      });

      await reload();
    } catch (error) {
      reportError(normalizeErrorMessage(error, 'Failed to publish event'));
    } finally {
      setRowBusyId(null);
    }
  }, [reload, reportError, userName]);

  const deleteListEvent = useCallback(async (event: EventItem) => {
    const parserReview = isParserReviewEvent(event);

    setRowBusyId(event._id);
    setList((current) => ({ ...current, error: '' }));

    try {
      if (parserReview) {
        await rejectParserReview(event._id);
      } else {
        await deleteEvent(event._id);
      }

      appendAuditRecord({
        actor: userName ?? 'admin',
        action: parserReview ? 'Parser review rejected' : 'Event deleted',
        target: event.title,
        details: event._id,
        status: 'success',
      });

      await reload();
    } catch (error) {
      reportError(
        normalizeErrorMessage(
          error,
          parserReview ? 'Failed to reject parser review' : 'Failed to delete event',
        ),
      );
    } finally {
      setRowBusyId(null);
    }
  }, [reload, reportError, userName]);

  const sourceOptions = useMemo(() => getSourceOptions(list.events), [list.events]);
  const sectionMeta = useMemo(
    () => getListSectionMeta(filters.group, filters.moderationMode),
    [filters.group, filters.moderationMode],
  );
  const canResetFilters = useMemo(() => hasResettableEventFilters(filters), [filters]);

  const resetFiltersToDefault = useCallback(() => {
    setFilters((current) => resetEventFilters(current));
  }, []);

  return {
    events: list.events,
    loading: list.loading,
    refreshing: list.refreshing,
    error: list.error,
    list,
    counts,
    filters,
    authorNames,
    rowBusyId,
    sourceOptions,
    sectionTitle: sectionMeta.title,
    sectionSubtitle: sectionMeta.subtitle,
    canResetFilters,
    setFilters,
    resetFilters: resetFiltersToDefault,
    reportError,
    reloadList,
    refreshCounts,
    reload,
    approveListEvent,
    deleteListEvent,
  };
};
