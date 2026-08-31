import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  cancelParserRun,
  fetchParserRuns,
  runRelaxParser,
} from '../../../features/events/api';
import { AppApiError } from '../../../shared/api/http';
import { appendAuditRecord } from '../../../shared/lib/audit';
import {
  isParserRunActive,
  normalizeParserRun,
} from '../../../shared/lib/parserRuns';
import {
  formatDateTime,
  formatEventCategory,
  normalizeErrorMessage,
} from '../../../shared/lib/utils';
import type { ParserRunRecord } from '../../../shared/types';

type UseParserRunsParams = {
  userName?: string;
  onError: (message: string) => void;
  onRunStarted?: () => void | Promise<void>;
  onPollTick?: () => void | Promise<void>;
};

type UseParserRunsResult = {
  runs: ParserRunRecord[];
  activeRun: ParserRunRecord | null;
  displayRun: ParserRunRecord | null;
  busy: boolean;
  error: string;
  cancelBusy: boolean;
  cancelRequested: boolean;
  availableCategories: readonly string[];
  selectedCategories: string[];
  limitInput: string;
  limit: number;
  skipExisting: boolean;
  progressValue: number;
  runTiming: string;
  currentActivity: string;
  refresh: () => Promise<void>;
  toggleCategory: (value: string) => void;
  setLimitInput: (value: string) => void;
  setSkipExisting: (value: boolean) => void;
  start: () => Promise<void>;
  cancelActive: () => Promise<void>;
};

const PARSER_SOURCE_CATEGORIES = [
  'Выставка',
  'Кино',
  'Спектакль',
  'Концерт',
  'Новый год',
  'Вечеринка',
  'Экскурсия',
  'Бесплатные',
  'Стендап',
  'Мероприятие',
  'Образование',
  'Фестиваль',
  'Квизы',
  'Разное',
  'Спорт',
  'Для детей',
  'Квест',
] as const;

const getParserRunLabel = (run: ParserRunRecord) => {
  const categories = Array.isArray(run.categories) ? run.categories.filter(Boolean) : [];

  if (!categories.length && run.mode === 'full') {
    return 'All categories';
  }

  if (categories.length === 1) {
    return `Category: ${formatEventCategory(categories[0])}`;
  }

  if (categories.length > 1) {
    return `${categories.length} categories`;
  }

  return run.category ? `Category: ${formatEventCategory(run.category)}` : 'All categories';
};

export const formatParserPhase = (value?: string | null) => {
  switch (value) {
    case 'discovering':
      return 'Discovering source links';
    case 'filtering':
      return 'Filtering existing records';
    case 'parsing':
      return 'Parsing event pages';
    case 'completed':
      return 'Run completed';
    case 'cancelled':
      return 'Run cancelled';
    default:
      return 'Preparing parser run';
  }
};

export const getParserProgressValue = (run?: ParserRunRecord | null) => {
  if (!run) {
    return 0;
  }

  if (run.status === 'success') {
    return 100;
  }

  if (run.progress.total > 0) {
    const fallback = Math.round((run.progress.completed / run.progress.total) * 100);
    return Math.max(0, Math.min(100, run.progress.percentage || fallback));
  }

  if (run.status === 'running') {
    return 12;
  }

  return 0;
};

export const getParserDuplicatePolicyLabel = (skipExisting?: boolean) =>
  skipExisting === false ? 'Reparse existing links' : 'Skip existing links';

const runSafeCallback = async (callback?: () => void | Promise<void>) => {
  if (!callback) {
    return;
  }

  await callback();
};

const getCancelErrorMessage = (error: unknown) => {
  if (error instanceof AppApiError && (error.status === 404 || error.status === 405)) {
    return 'Cancel endpoint mismatch: expected POST /parser/runs/:runId/cancel on the backend.';
  }

  return normalizeErrorMessage(error, 'Failed to stop parser');
};

const mergeParserRun = (current: ParserRunRecord[], next: ParserRunRecord) => {
  const index = current.findIndex((run) => run._id === next._id);

  if (index === -1) {
    return [next, ...current];
  }

  const updated = [...current];
  updated[index] = next;
  return updated;
};

export const useParserRuns = ({
  userName,
  onError,
  onRunStarted,
  onPollTick,
}: UseParserRunsParams): UseParserRunsResult => {
  const [runs, setRuns] = useState<ParserRunRecord[]>([]);
  const [error, setError] = useState('');
  const [cancellingRunId, setCancellingRunId] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [limitInput, setLimitInput] = useState('100');
  const [skipExisting, setSkipExisting] = useState(true);

  const loadRuns = useCallback(async (silent: boolean = false) => {
    try {
      const response = await fetchParserRuns();
      setRuns(response.runs.map(normalizeParserRun));
    } catch (loadError) {
      if (!silent) {
        setError(normalizeErrorMessage(loadError, 'Failed to load parser runs'));
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadRuns(false);
  }, [loadRuns]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const latestRun = useMemo(() => runs[0] ?? null, [runs]);
  const activeRun = useMemo(
    () => runs.find((run) => isParserRunActive(run)) ?? null,
    [runs],
  );
  const busy = Boolean(activeRun);
  const cancelBusy = Boolean(activeRun?._id && cancellingRunId === activeRun._id);
  const cancelRequested = Boolean(
    activeRun?._id && activeRun.cancelRequested && isParserRunActive(activeRun),
  );
  const limit = useMemo(() => Math.max(1, Number(limitInput) || 100), [limitInput]);
  const displayRun = activeRun ?? latestRun;
  const progressValue = useMemo(() => getParserProgressValue(displayRun), [displayRun]);

  const runTiming = displayRun
    ? displayRun.status === 'running' && displayRun.startedAt
      ? `Started ${formatDateTime(displayRun.startedAt)}`
      : displayRun.finishedAt || displayRun.createdAt
        ? `Updated ${formatDateTime(displayRun.finishedAt ?? displayRun.createdAt)}`
        : 'Awaiting run metadata'
    : 'No parser activity yet.';

  const currentActivity = displayRun
    ? cancelRequested
      ? 'Stop requested. Waiting for the worker to finish the current step.'
      : [
          displayRun.progress.currentCategory
            ? formatEventCategory(displayRun.progress.currentCategory)
            : '',
          displayRun.progress.current ?? '',
        ]
          .filter(Boolean)
          .join(' · ') || (displayRun.status === 'queued' ? 'Waiting for worker start.' : 'Awaiting the next source response.')
    : 'Pick a scope, duplicate policy, and launch the next parser run from the parser workspace.';

  const toggleCategory = useCallback((value: string) => {
    setSelectedCategories((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }, []);

  useEffect(() => {
    if (!busy) {
      setCancellingRunId(null);
      return undefined;
    }

    const timer = window.setInterval(() => {
      void loadRuns(true);
      void runSafeCallback(onPollTick);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [busy, loadRuns, onPollTick]);

  const start = useCallback(async () => {
    const target = selectedCategories.length
      ? `relax/${selectedCategories.join(', ')}`
      : 'relax/all';
    const targetDetails = `${target} · ${getParserDuplicatePolicyLabel(skipExisting)}`;

    try {
      setError('');
      const response = await runRelaxParser({
        categories: selectedCategories,
        limit,
        skipExisting,
      });

      appendAuditRecord({
        actor: userName ?? 'admin',
        action: 'Parser started',
        target: targetDetails,
        details: response.run._id,
        status: 'success',
      });

      setLimitInput(String(limit));
      await refresh();
      await runSafeCallback(onRunStarted);
    } catch (startError) {
      const message = normalizeErrorMessage(startError, 'Failed to start parser');
      setError(message);

      appendAuditRecord({
        actor: userName ?? 'admin',
        action: 'Parser started',
        target: targetDetails,
        details: message,
        status: 'error',
      });

      onError(message);
    }
  }, [limit, onError, onRunStarted, refresh, selectedCategories, skipExisting, userName]);

  const cancelActive = useCallback(async () => {
    if (!activeRun?._id || cancelBusy || cancelRequested) {
      return;
    }

    try {
      setError('');
      setCancellingRunId(activeRun._id);
      const response = await cancelParserRun(activeRun._id);
      const nextRun = normalizeParserRun(response.run);

      setRuns((current) => mergeParserRun(current, nextRun));

      appendAuditRecord({
        actor: userName ?? 'admin',
        action: nextRun.status === 'cancelled' ? 'Parser stopped' : 'Parser stop requested',
        target: getParserRunLabel(activeRun),
        details: activeRun._id,
        status: 'success',
      });

      await runSafeCallback(onPollTick);
      await loadRuns(true);
    } catch (cancelError) {
      const message = getCancelErrorMessage(cancelError);
      setError(message);
      onError(message);
    } finally {
      setCancellingRunId(null);
    }
  }, [activeRun, cancelBusy, cancelRequested, loadRuns, onError, onPollTick, userName]);

  return {
    runs,
    activeRun,
    displayRun,
    busy,
    error,
    cancelBusy,
    cancelRequested,
    availableCategories: PARSER_SOURCE_CATEGORIES,
    selectedCategories,
    limitInput,
    limit,
    skipExisting,
    progressValue,
    runTiming,
    currentActivity,
    refresh,
    toggleCategory,
    setLimitInput,
    setSkipExisting,
    start,
    cancelActive,
  };
};
