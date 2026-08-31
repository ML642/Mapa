import {
  formatDateTimeInput,
  isModerationChangeEvent,
  isModerationRequestEvent,
  isParserDiffEvent,
  isParserReviewEvent,
} from '../../../shared/lib/utils';
import type { EventItem } from '../../../shared/types';

export type EventCoordinates = [number, number];

export type EventFormState = {
  title: string;
  description: string;
  address: string;
  category: string;
  phone: string;
  price: string;
  price_description: string;
  is_premium: boolean;
  coordinates: EventCoordinates | null;
  dates: string[];
};

export type EventSavePayload = {
  title: string;
  description: string;
  address: string;
  category: string;
  phone?: string;
  price: number | null;
  price_description?: string;
  is_premium: boolean;
  coordinates: EventCoordinates;
  event_dates: string[];
};

export const NEW_EVENT_ID = '__new_event__';

export const createEmptyEventFormState = (): EventFormState => ({
  title: '',
  description: '',
  address: '',
  category: 'Другое',
  phone: '',
  price: '',
  price_description: '',
  is_premium: false,
  coordinates: null,
  dates: [''],
});

export const normalizeCoordinates = (value?: number[] | null): EventCoordinates | null => {
  if (!Array.isArray(value) || value.length !== 2) {
    return null;
  }

  const latitude = Number(value[0]);
  const longitude = Number(value[1]);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  if (latitude === 0 && longitude === 0) {
    return null;
  }

  return [latitude, longitude];
};

export const toDateInputs = (event: EventItem) => {
  const values = (event.event_dates ?? (event.event_date ? [event.event_date] : []))
    .map((value) => formatDateTimeInput(value))
    .filter(Boolean);

  return values.length ? values : [''];
};

export const splitDateTimeInput = (value: string) => {
  if (!value) {
    return { date: '', time: '' };
  }

  const [date = '', time = ''] = value.split('T');

  return {
    date,
    time: time.slice(0, 5),
  };
};

export const buildDateTimeInput = (date: string, time: string) => {
  if (!date) {
    return '';
  }

  return `${date}T${time || '00:00'}`;
};

export const eventToFormState = (event: EventItem): EventFormState => ({
  title: event.title ?? '',
  description: event.description ?? '',
  address: event.address ?? '',
  category: event.category ?? 'Другое',
  phone: event.phone ?? '',
  price: event.price === null || event.price === undefined ? '' : String(event.price),
  price_description: event.price_description ?? '',
  is_premium: Boolean(event.is_premium),
  coordinates: normalizeCoordinates(event.coordinates),
  dates: toDateInputs(event),
});

export const updateEventDateTimePart = (
  dates: string[],
  index: number,
  part: 'date' | 'time',
  value: string,
) => {
  const nextDates = [...dates];
  const currentValue = splitDateTimeInput(nextDates[index] ?? '');
  const nextDate = part === 'date' ? value : currentValue.date;
  const nextTime = part === 'time' ? value : currentValue.time;

  nextDates[index] = buildDateTimeInput(nextDate, nextTime);

  return nextDates;
};

export const removeEventDateAt = (dates: string[], index: number) => {
  if (dates.length === 1) {
    return [''];
  }

  return dates.filter((_, currentIndex) => currentIndex !== index);
};

export const buildEventSavePayload = (
  formState: EventFormState,
  fallbackCoordinates?: number[] | null,
): EventSavePayload => {
  const title = formState.title.trim();
  const address = formState.address.trim();

  if (!title) {
    throw new Error('Title is required');
  }

  if (!address) {
    throw new Error('Address is required');
  }

  const rawDates = formState.dates
    .map((value) => value.trim())
    .filter(Boolean);

  if (!rawDates.length) {
    throw new Error('At least one event date is required');
  }

  const eventDates = rawDates.map((value) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${value}`);
    }

    return date.toISOString();
  });

  return {
    title,
    description: formState.description.trim(),
    address,
    category: formState.category,
    phone: formState.phone.trim() || undefined,
    price: formState.price.trim() ? Number(formState.price) : null,
    price_description: formState.price_description.trim() || undefined,
    is_premium: formState.is_premium,
    coordinates: formState.coordinates ?? normalizeCoordinates(fallbackCoordinates) ?? [0, 0],
    event_dates: eventDates,
  };
};

export const extractImageIndex = (path: string) => path.match(/image-(\d+)/)?.[1];

export {
  isModerationChangeEvent,
  isModerationRequestEvent,
  isParserDiffEvent,
  isParserReviewEvent,
};
