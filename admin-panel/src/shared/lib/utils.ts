import { buildAssetUrl } from '../config/env';
import { EVENT_CATEGORY_LABELS } from '../constants';
import type { EventItem } from '../types';

export const cn = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(' ');

export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatDateInput = (value?: string | null) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
};

export const formatDateTimeInput = (value?: string | null) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (input: number) => String(input).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const formatMoney = (value?: number | null) => {
  if (value === null || value === undefined) {
    return 'Not set';
  }

  return new Intl.NumberFormat('en-GB', {
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatEventCategory = (value?: string | null) => {
  if (!value) {
    return EVENT_CATEGORY_LABELS.Другое;
  }

  return EVENT_CATEGORY_LABELS[value] ?? value;
};

export const formatEventStatus = (value?: string | null) => {
  switch (value) {
    case 'active':
      return 'Active';
    case 'inactive':
      return 'Pending';
    case 'parsed':
      return 'Parsed';
    case 'deleted':
      return 'Archived';
    case 'ignored':
      return 'Ignored';
    default:
      return value ?? 'Unknown';
  }
};

export const formatParserRunStatus = (value?: string | null) => {
  switch (value) {
    case 'queued':
      return 'Queued';
    case 'running':
      return 'Running';
    case 'success':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return value ?? 'Unknown';
  }
};

export const formatRole = (value?: string | null) => {
  if (!value) {
    return 'Not set';
  }

  return value.replace(/_/g, ' ');
};

export const formatSubscriptionType = (value?: string | null) => {
  if (!value) {
    return 'Default';
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
};

const tryParseUrl = (value?: string | null) => {
  if (!value) {
    return null;
  }

  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const formatSourceToken = (value: string) =>
  value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const isParserReviewEvent = (event?: EventItem | null) =>
  Boolean(event && (event.status === 'parsed' || event.moderation?.queue === 'parser'));

export const isParserDiffEvent = (event?: EventItem | null) =>
  Boolean(event && event.moderation?.queue === 'parser' && event.status !== 'parsed');

export const isModerationChangeEvent = (event?: EventItem | null) =>
  Boolean(
    event
    && (
      isParserDiffEvent(event)
      || (!isParserReviewEvent(event) && Boolean(event.updatedBy && event.updatedBy !== event.createdBy))
    ),
  );

export const isModerationRequestEvent = (event?: EventItem | null) =>
  Boolean(event && !isParserReviewEvent(event) && !isModerationChangeEvent(event));

export const getEventSourceKey = (event?: EventItem | null) => {
  const parserSource = event?.parserMeta?.source?.trim() || event?.moderation?.source?.trim();

  if (parserSource) {
    return parserSource.toLowerCase();
  }

  const rawSource = event?.source?.trim();

  if (!rawSource) {
    return 'manual';
  }

  const parsedUrl = tryParseUrl(rawSource);
  return parsedUrl?.hostname?.replace(/^www\./i, '').toLowerCase() || rawSource.toLowerCase();
};

export const formatSourceOptionLabel = (value?: string | null) => {
  if (!value || value === 'manual') {
    return 'Manual';
  }

  return value.includes('.') ? value : formatSourceToken(value);
};

export const formatEventSource = (event?: EventItem | null) =>
  formatSourceOptionLabel(getEventSourceKey(event));

export const shortId = (value?: string | null) => {
  if (!value) {
    return 'n/a';
  }

  if (value.length <= 10) {
    return value;
  }

  return `${value.slice(0, 5)}…${value.slice(-4)}`;
};

export const extractUserIdFromProfilePicture = (value?: string | null) => {
  if (!value) {
    return undefined;
  }

  const match = value.match(/uploads\/users\/([^/]+)\//i);
  return match?.[1];
};

export const resolveMutualFriendsCount = (value?: number | unknown[]) => {
  if (Array.isArray(value)) {
    return value.length;
  }

  return typeof value === 'number' ? value : 0;
};

export const getReviewBadge = (event: EventItem) => {
  if (isParserDiffEvent(event)) {
    return { label: 'Parser update', tone: 'success' as const };
  }

  if (isParserReviewEvent(event)) {
    return { label: 'Parser', tone: 'success' as const };
  }

  if (isModerationChangeEvent(event)) {
    return { label: 'Update', tone: 'accent' as const };
  }

  return { label: 'Request', tone: 'warning' as const };
};

export const getEventImage = (event: EventItem) => buildAssetUrl(event.event_image);

export const normalizeErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export const clampPage = (page: number, totalPages?: number) => {
  if (!totalPages || totalPages < 1) {
    return Math.max(1, page);
  }

  return Math.min(Math.max(1, page), totalPages);
};
