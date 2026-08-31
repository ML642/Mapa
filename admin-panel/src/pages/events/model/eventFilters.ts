import { getEventSourceKey } from '../../../shared/lib/utils';
import type { EventItem } from '../../../shared/types';

export type EventGroup = 'current' | 'moderation' | 'archive';
export type ModerationMode = 'all' | 'requests' | 'changes' | 'parser';
export type SortMode = 'newest' | 'oldest' | 'title';
export type WorkspaceView = 'events' | 'parser';

export type EventListState = {
  loading: boolean;
  refreshing: boolean;
  error: string;
  events: EventItem[];
  total: number;
  page: number;
  totalPages: number;
};

export type EventCountsState = {
  active: number;
  inactive: number;
  parsed: number;
  deleted: number;
};

export type EventsFilterState = {
  group: EventGroup;
  moderationMode: ModerationMode;
  page: number;
  size: number;
  category: string;
  dateFrom: string;
  dateTo: string;
  sourceFilter: string;
  sortMode: SortMode;
  searchInput: string;
};

export const INITIAL_EVENT_LIST_STATE: EventListState = {
  loading: true,
  refreshing: false,
  error: '',
  events: [],
  total: 0,
  page: 1,
  totalPages: 0,
};

export const INITIAL_EVENT_COUNTS: EventCountsState = {
  active: 0,
  inactive: 0,
  parsed: 0,
  deleted: 0,
};

export const DEFAULT_EVENTS_FILTERS: EventsFilterState = {
  group: 'current',
  moderationMode: 'all',
  page: 1,
  size: 20,
  category: '',
  dateFrom: '',
  dateTo: '',
  sourceFilter: 'all',
  sortMode: 'newest',
  searchInput: '',
};

export const getListSectionMeta = (
  group: EventGroup,
  moderationMode: ModerationMode,
): { title: string; subtitle: string } => {
  if (group === 'current') {
    return {
      title: 'Live events',
      subtitle: 'Published events currently visible on the site.',
    };
  }

  if (group === 'archive') {
    return {
      title: 'Archive',
      subtitle: 'Removed events kept for reference.',
    };
  }

  if (moderationMode === 'parser') {
    return {
      title: 'Parser queue',
      subtitle: 'Parser-created events and parser proposed updates waiting for review.',
    };
  }

  if (moderationMode === 'changes') {
    return {
      title: 'Moderation queue',
      subtitle: 'Existing events updated by users or parser review.',
    };
  }

  if (moderationMode === 'requests') {
    return {
      title: 'Moderation queue',
      subtitle: 'New submissions waiting for moderation.',
    };
  }

  return {
    title: 'Moderation queue',
    subtitle: 'All items currently waiting for moderation.',
  };
};

export const getSourceOptions = (events: EventItem[]) => {
  const values = new Set<string>();
  events.forEach((event) => values.add(getEventSourceKey(event)));
  return ['all', ...values];
};

export const hasResettableEventFilters = (filters: EventsFilterState) =>
  Boolean(
    filters.searchInput.trim()
    || filters.category
    || filters.dateFrom
    || filters.dateTo
    || filters.sourceFilter !== 'all'
    || filters.sortMode !== 'newest',
  );

export const resetEventFilters = (filters: EventsFilterState): EventsFilterState => ({
  ...filters,
  page: 1,
  category: '',
  dateFrom: '',
  dateTo: '',
  sourceFilter: 'all',
  sortMode: 'newest',
  searchInput: '',
});
