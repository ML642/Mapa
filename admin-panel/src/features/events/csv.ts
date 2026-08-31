import { parseCsvRecords, stringifyCsvRows } from '../../shared/lib/csv';
import type { EventItem } from '../../shared/types';

const EVENT_DATE_SEPARATOR = '|';

const EVENT_CSV_HEADERS = [
  '_id',
  'title',
  'description',
  'address',
  'category',
  'phone',
  'price',
  'price_description',
  'is_premium',
  'event_dates',
  'event_date',
  'coordinates_lat',
  'coordinates_lng',
  'source',
  'status',
  'images',
] as const;

type ImportedEventCsvPayload = {
  title: string;
  description: string;
  address: string;
  category: string;
  phone?: string;
  price: number | null;
  price_description?: string;
  is_premium: boolean;
  coordinates: [number, number];
  event_dates: string[];
};

export type ImportedEventCsvRow = {
  rowNumber: number;
  eventId?: string;
  payload: ImportedEventCsvPayload;
};

const normalizeHeader = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

const pickValue = (record: Record<string, string>, aliases: string[]) => {
  for (const alias of aliases) {
    const value = record[alias];

    if (value !== undefined) {
      return value.trim();
    }
  }

  return '';
};

const parseBooleanValue = (value: string) => {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return false;
  }

  if (['1', 'true', 'yes', 'y', 'да'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'n', 'нет'].includes(normalized)) {
    return false;
  }

  throw new Error(`Invalid boolean value "${value}"`);
};

const parseNumberValue = (value: string, fieldName: string) => {
  if (!value.trim()) {
    return null;
  }

  const normalized = value.replace(',', '.');
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ${fieldName}: "${value}"`);
  }

  return parsed;
};

const normalizeDateCandidate = (value: string) => {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T00:00`;
  }

  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed.replace(/\s+/, 'T');
  }

  return trimmed;
};

const parseEventDates = (record: Record<string, string>) => {
  const rawDates = pickValue(record, ['event_dates', 'dates']);
  const rawSingleDate = pickValue(record, ['event_date', 'date']);
  const candidates = rawDates
    ? rawDates.split(EVENT_DATE_SEPARATOR)
    : rawSingleDate
      ? [rawSingleDate]
      : [];

  const values = candidates
    .map((value) => normalizeDateCandidate(value))
    .filter(Boolean);

  if (!values.length) {
    throw new Error('At least one event date is required');
  }

  return values.map((value) => {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Invalid event date "${value}"`);
    }

    return parsed.toISOString();
  });
};

const parseCoordinates = (record: Record<string, string>) => {
  let latitude = pickValue(record, ['coordinates_lat', 'lat', 'latitude']);
  let longitude = pickValue(record, ['coordinates_lng', 'lng', 'longitude']);

  if (!latitude || !longitude) {
    const combined = pickValue(record, ['coordinates', 'coords', 'location']);

    if (combined) {
      const parts = combined
        .split(/[|;,]/)
        .map((value) => value.trim())
        .filter(Boolean);

      latitude = latitude || parts[0] || '';
      longitude = longitude || parts[1] || '';
    }
  }

  const parsedLatitude = latitude ? parseNumberValue(latitude, 'latitude') : null;
  const parsedLongitude = longitude ? parseNumberValue(longitude, 'longitude') : null;

  return [parsedLatitude ?? 0, parsedLongitude ?? 0] as [number, number];
};

const normalizeRecord = (record: Record<string, string>) =>
  Object.entries(record).reduce<Record<string, string>>((current, [key, value]) => {
    current[normalizeHeader(key)] = value;
    return current;
  }, {});

export const parseEventsCsvImport = (input: string) => {
  const { headers, records } = parseCsvRecords(input);

  if (!headers.length) {
    throw new Error('CSV file is empty');
  }

  const normalizedHeaders = headers.map(normalizeHeader);

  if (!normalizedHeaders.includes('title') || !normalizedHeaders.includes('address')) {
    throw new Error('CSV must include at least "title" and "address" columns');
  }

  if (!normalizedHeaders.includes('event_dates') && !normalizedHeaders.includes('event_date') && !normalizedHeaders.includes('date')) {
    throw new Error('CSV must include "event_dates" or "event_date" column');
  }

  return records.map((record, index) => {
    const normalized = normalizeRecord(record);
    const title = pickValue(normalized, ['title']);
    const address = pickValue(normalized, ['address']);

    if (!title) {
      throw new Error(`Row ${index + 2}: title is required`);
    }

    if (!address) {
      throw new Error(`Row ${index + 2}: address is required`);
    }

    try {
      return {
        rowNumber: index + 2,
        eventId: pickValue(normalized, ['_id', 'id']) || undefined,
        payload: {
          title,
          description: pickValue(normalized, ['description']),
          address,
          category: pickValue(normalized, ['category']) || 'Другое',
          phone: pickValue(normalized, ['phone']) || undefined,
          price: parseNumberValue(pickValue(normalized, ['price']), 'price'),
          price_description: pickValue(normalized, ['price_description']) || undefined,
          is_premium: parseBooleanValue(pickValue(normalized, ['is_premium', 'premium'])),
          coordinates: parseCoordinates(normalized),
          event_dates: parseEventDates(normalized),
        },
      } satisfies ImportedEventCsvRow;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid CSV row';
      throw new Error(`Row ${index + 2}: ${message}`);
    }
  });
};

const getEventDatesForExport = (event: EventItem) => {
  const values = event.event_dates?.length
    ? event.event_dates
    : event.event_date
      ? [event.event_date]
      : [];

  return values.filter(Boolean);
};

export const stringifyEventsCsv = (events: EventItem[]) => {
  const rows = [
    [...EVENT_CSV_HEADERS],
    ...events.map((event) => {
      const eventDates = getEventDatesForExport(event);
      const [latitude = '', longitude = ''] = Array.isArray(event.coordinates) ? event.coordinates : [];

      return [
        event._id,
        event.title,
        event.description ?? '',
        event.address,
        event.category ?? '',
        event.phone ?? '',
        event.price ?? '',
        event.price_description ?? '',
        event.is_premium ? 'true' : 'false',
        eventDates.join(EVENT_DATE_SEPARATOR),
        event.event_date ?? eventDates[0] ?? '',
        latitude,
        longitude,
        event.source ?? '',
        event.status ?? '',
        (event.event_image ?? []).join(EVENT_DATE_SEPARATOR),
      ];
    }),
  ];

  return stringifyCsvRows(rows);
};

export const buildEventsCsvFileName = (scope: string) =>
  `events-${scope}-${new Date().toISOString().slice(0, 10)}.csv`;
