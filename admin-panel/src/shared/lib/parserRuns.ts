import type { ParserRunRecord, ParserStats } from '../types';

const PARSER_STAT_KEYS = [
  'created',
  'updated_review',
  'updated_auto',
  'unchanged',
  'ignored',
  'skipped_existing',
  'failed',
] as const;

export const createEmptyParserStats = (): ParserStats => ({
  created: 0,
  updated_review: 0,
  updated_auto: 0,
  unchanged: 0,
  ignored: 0,
  skipped_existing: 0,
  failed: 0,
});

export const normalizeParserStats = (value: unknown): ParserStats => {
  const fallback = createEmptyParserStats();

  if (!value || typeof value !== 'object') {
    return fallback;
  }

  const input = value as Partial<Record<(typeof PARSER_STAT_KEYS)[number], unknown>>;
  const next = createEmptyParserStats();

  PARSER_STAT_KEYS.forEach((key) => {
    const raw = input[key];
    next[key] = typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
  });

  return next;
};

export const normalizeParserRun = (value: ParserRunRecord): ParserRunRecord => ({
  ...value,
  cancelRequested: value.cancelRequested === true,
  categories: Array.isArray(value.categories) ? value.categories.filter(Boolean) : [],
  progress: {
    total: typeof value.progress?.total === 'number' ? value.progress.total : 0,
    completed: typeof value.progress?.completed === 'number' ? value.progress.completed : 0,
    current: value.progress?.current ?? '',
    currentCategory: value.progress?.currentCategory ?? '',
    percentage: typeof value.progress?.percentage === 'number' ? value.progress.percentage : 0,
    phase: typeof value.progress?.phase === 'string' ? value.progress.phase : '',
    discovered: typeof value.progress?.discovered === 'number' ? value.progress.discovered : 0,
    skippedExisting:
      typeof value.progress?.skippedExisting === 'number' ? value.progress.skippedExisting : 0,
  },
  stats: normalizeParserStats(value.stats),
  logs: Array.isArray(value.logs) ? value.logs : [],
  skipExisting: value.skipExisting !== false,
});

export const isParserRunActive = (run?: ParserRunRecord | null) =>
  Boolean(run && (run.status === 'queued' || run.status === 'running'));
