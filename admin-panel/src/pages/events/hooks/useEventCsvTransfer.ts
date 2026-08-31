import { useCallback, useState } from 'react';
import {
  createEventForModeration,
  fetchActiveEvents,
  fetchDeletedEvents,
  fetchInactiveEvents,
  fetchParsedEvents,
  type EventQuery,
  updateEvent,
} from '../../../features/events/api';
import {
  buildEventsCsvFileName,
  parseEventsCsvImport,
  stringifyEventsCsv,
} from '../../../features/events/csv';
import { appendAuditRecord } from '../../../shared/lib/audit';
import {
  getEventSourceKey,
  isModerationChangeEvent,
  isModerationRequestEvent,
  normalizeErrorMessage,
} from '../../../shared/lib/utils';
import type { EventItem, EventsResponse } from '../../../shared/types';
import type { EventsFilterState } from '../model/eventFilters';

const EXPORT_PAGE_SIZE = 80;

type CsvFeedback = {
  tone: 'success' | 'warning' | 'danger';
  title: string;
  description: string;
};

type UseEventCsvTransferParams = {
  filters: EventsFilterState;
  userName?: string;
  onReload: () => Promise<void>;
  onAfterImport?: () => void;
};

type UseEventCsvTransferResult = {
  importing: boolean;
  exporting: boolean;
  feedback: CsvFeedback | null;
  clearFeedback: () => void;
  importFile: (file: File) => Promise<void>;
  exportCurrent: () => Promise<void>;
};

type EventFetcher = (query: EventQuery) => Promise<EventsResponse>;

const buildExportScope = (filters: EventsFilterState) => {
  if (filters.group === 'current') {
    return 'live';
  }

  if (filters.group === 'archive') {
    return 'archive';
  }

  return `moderation-${filters.moderationMode}`;
};

const buildQuery = (filters: EventsFilterState, searchText: string, page: number, size: number): EventQuery => ({
  page,
  size,
  category: filters.category || undefined,
  dateFrom: filters.dateFrom || undefined,
  dateTo: filters.dateTo || undefined,
  text: filters.group === 'current' ? searchText || undefined : undefined,
});

const fetchAllPages = async (fetcher: EventFetcher, query: EventQuery) => {
  const firstPage = await fetcher(query);
  const totalPages = Math.max(
    firstPage.totalPages ?? Math.ceil((firstPage.total || firstPage.events.length) / query.size),
    1,
  );

  if (totalPages <= 1) {
    return firstPage.events;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      fetcher({
        ...query,
        page: index + 2,
      }),
    ),
  );

  return [firstPage, ...remainingPages].flatMap((response) => response.events);
};

const applyClientSideFilters = (events: EventItem[], filters: EventsFilterState, searchText: string) => {
  let nextEvents = [...events];

  if (filters.group === 'moderation' && filters.moderationMode === 'changes') {
    nextEvents = nextEvents.filter((event) => isModerationChangeEvent(event));
  }

  if (filters.group === 'moderation' && filters.moderationMode === 'requests') {
    nextEvents = nextEvents.filter((event) => isModerationRequestEvent(event));
  }

  if (filters.sourceFilter !== 'all') {
    nextEvents = nextEvents.filter((event) => getEventSourceKey(event) === filters.sourceFilter);
  }

  if (filters.group !== 'current' && searchText) {
    const needle = searchText.toLowerCase();
    nextEvents = nextEvents.filter((event) =>
      [event.title, event.description, event.address, event.category]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle)),
    );
  }

  nextEvents.sort((left, right) => {
    if (filters.sortMode === 'title') {
      return left.title.localeCompare(right.title, 'ru');
    }

    const leftValue = left.event_date ?? '';
    const rightValue = right.event_date ?? '';
    return filters.sortMode === 'newest'
      ? rightValue.localeCompare(leftValue)
      : leftValue.localeCompare(rightValue);
  });

  return nextEvents;
};

const downloadCsv = (content: string, fileName: string) => {
  const blob = new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = window.document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.click();

  window.setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 0);
};

export const useEventCsvTransfer = ({
  filters,
  userName,
  onReload,
  onAfterImport,
}: UseEventCsvTransferParams): UseEventCsvTransferResult => {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState<CsvFeedback | null>(null);

  const clearFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  const exportCurrent = useCallback(async () => {
    setExporting(true);
    setFeedback(null);

    try {
      const searchText = filters.searchInput.trim();
      const query = buildQuery(filters, searchText, 1, EXPORT_PAGE_SIZE);
      let events: EventItem[] = [];

      if (filters.group === 'current') {
        events = await fetchAllPages(fetchActiveEvents, query);
      } else if (filters.group === 'archive') {
        events = await fetchAllPages(fetchDeletedEvents, query);
      } else if (filters.moderationMode === 'parser') {
        events = await fetchAllPages(fetchParsedEvents, query);
      } else if (filters.moderationMode === 'all') {
        const [inactiveEvents, parsedEvents] = await Promise.all([
          fetchAllPages(fetchInactiveEvents, query),
          fetchAllPages(fetchParsedEvents, query),
        ]);

        events = [...inactiveEvents, ...parsedEvents];
      } else {
        events = await fetchAllPages(fetchInactiveEvents, query);
      }

      const prepared = applyClientSideFilters(events, filters, searchText);

      if (!prepared.length) {
        setFeedback({
          tone: 'warning',
          title: 'Export skipped',
          description: 'No events match the current section and filters.',
        });
        return;
      }

      const scope = buildExportScope(filters);
      downloadCsv(stringifyEventsCsv(prepared), buildEventsCsvFileName(scope));

      appendAuditRecord({
        actor: userName ?? 'admin',
        action: 'Events exported to CSV',
        target: scope,
        details: `${prepared.length} rows`,
        status: 'success',
      });

      setFeedback({
        tone: 'success',
        title: 'CSV exported',
        description: `${prepared.length} events were exported for the current section and filters.`,
      });
    } catch (error) {
      setFeedback({
        tone: 'danger',
        title: 'CSV export failed',
        description: normalizeErrorMessage(error, 'Failed to export events to CSV'),
      });
    } finally {
      setExporting(false);
    }
  }, [filters, userName]);

  const importFile = useCallback(async (file: File) => {
    setImporting(true);
    setFeedback(null);

    try {
      const rows = parseEventsCsvImport(await file.text());

      if (!rows.length) {
        throw new Error('CSV file does not contain any event rows');
      }

      let createdCount = 0;
      let updatedCount = 0;
      let partialCount = 0;
      const failures: string[] = [];

      for (const row of rows) {
        let createdEventId: string | null = null;

        try {
          if (row.eventId) {
            await updateEvent(row.eventId, row.payload);
            updatedCount += 1;
            continue;
          }

          const created = await createEventForModeration({
            title: row.payload.title,
            description: row.payload.description,
            address: row.payload.address,
            category: row.payload.category,
            coordinates: row.payload.coordinates,
            event_dates: row.payload.event_dates,
            is_premium: row.payload.is_premium,
            price: row.payload.price,
          });
          createdEventId = created._id;
          await updateEvent(created._id, row.payload);
          createdCount += 1;
        } catch (error) {
          if (createdEventId) {
            partialCount += 1;
            failures.push(
              `row ${row.rowNumber}: draft ${createdEventId} was created, but some fields failed to sync`,
            );
          } else {
            failures.push(`row ${row.rowNumber}: ${normalizeErrorMessage(error, 'Import failed')}`);
          }
        }
      }

      if (createdCount || partialCount) {
        onAfterImport?.();
      }

      if (createdCount || updatedCount || partialCount) {
        await onReload();
      }

      appendAuditRecord({
        actor: userName ?? 'admin',
        action: 'Events imported from CSV',
        target: file.name,
        details: `${createdCount} created, ${updatedCount} updated, ${partialCount} partial, ${failures.length - partialCount} failed`,
        status: failures.length ? 'info' : 'success',
      });

      if (failures.length) {
        setFeedback({
          tone: createdCount || updatedCount || partialCount ? 'warning' : 'danger',
          title: 'CSV imported with issues',
          description: `${createdCount} created, ${updatedCount} updated, ${partialCount} partial. ${failures.slice(0, 3).join('; ')}${failures.length > 3 ? '; …' : ''}`,
        });
        return;
      }

      setFeedback({
        tone: 'success',
        title: 'CSV imported',
        description: `${createdCount} events created and ${updatedCount} updated.`,
      });
    } catch (error) {
      setFeedback({
        tone: 'danger',
        title: 'CSV import failed',
        description: normalizeErrorMessage(error, 'Failed to import events from CSV'),
      });
    } finally {
      setImporting(false);
    }
  }, [onAfterImport, onReload, userName]);

  return {
    importing,
    exporting,
    feedback,
    clearFeedback,
    importFile,
    exportCurrent,
  };
};
