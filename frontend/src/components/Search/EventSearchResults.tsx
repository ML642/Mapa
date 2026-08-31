import { isAxiosError } from 'axios';
import { motion, type Variants } from 'framer-motion';
import { startTransition, useEffect, useRef, useState, type ReactNode } from 'react';
import { eventsService, type Event, type EventsResponse } from '../../services';
import { useDebounce } from '../../utils/useDebounce';
import MainSideEventList from '../Desktop/mainSide/MainSideEventList';

interface EventSearchResultsProps {
    query: string;
    onClick?: (id: string) => void;
    title?: string;
    emptyPrompt?: string;
    emptyState?: ReactNode;
    className?: string;
    renderResults?: (props: {
        emptyText: string;
        events: Event[];
        loading: boolean;
        loadingText: string;
        onClick?: (id: string) => void;
    }) => ReactNode;
    showLoadMore?: boolean;
    showSummary?: boolean;
}

const SEARCH_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 500;
const MIN_QUERY_LENGTH = 2;

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 40, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 120,
            damping: 18,
            duration: 0.5,
        },
    },
    exit: { opacity: 0, y: 30, scale: 0.98, transition: { duration: 0.3, ease: 'easeInOut' } },
};

const emptyResults: EventsResponse = {
    events: [],
    total: 0,
    page: 1,
    totalPages: 0,
};

const normalizeSearchText = (value: string) => (
    value.toLocaleLowerCase('en-GB').replace(/\s+/g, ' ').trim()
);

const mergeEvents = (currentEvents: Event[], nextEvents: Event[]) => {
    const eventMap = new Map(currentEvents.map((event) => [event._id, event]));

    nextEvents.forEach((event) => {
        eventMap.set(event._id, event);
    });

    return Array.from(eventMap.values());
};

export default function EventSearchResults({
    query,
    onClick,
    title = 'Search results',
    emptyPrompt = 'Enter an event name, address, category, or description.',
    emptyState,
    className = '',
    renderResults,
    showLoadMore = true,
    showSummary = true,
}: EventSearchResultsProps) {
    const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS);
    const normalizedQuery = normalizeSearchText(debouncedQuery);
    const normalizedCurrentQuery = normalizeSearchText(query);
    const loadMoreControllerRef = useRef<AbortController | null>(null);

    const [results, setResults] = useState<EventsResponse>(emptyResults);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [completedSearchQuery, setCompletedSearchQuery] = useState('');

    useEffect(() => () => {
        loadMoreControllerRef.current?.abort();
    }, []);

    useEffect(() => {
        if (!normalizedQuery) {
            setResults(emptyResults);
            setLoading(false);
            setLoadingMore(false);
            setLoadError(false);
            setCompletedSearchQuery('');
            loadMoreControllerRef.current?.abort();
            loadMoreControllerRef.current = null;
            return;
        }

        if (normalizedQuery.length < MIN_QUERY_LENGTH) {
            setResults(emptyResults);
            setLoading(false);
            setLoadingMore(false);
            setLoadError(false);
            setCompletedSearchQuery('');
            loadMoreControllerRef.current?.abort();
            loadMoreControllerRef.current = null;
            return;
        }

        const controller = new AbortController();
        loadMoreControllerRef.current?.abort();
        loadMoreControllerRef.current = null;
        setLoadError(false);
        setCompletedSearchQuery('');
        setLoading(true);

        (async () => {
            try {
                const response = await eventsService.searchEvents(
                    {
                        text: debouncedQuery.trim(),
                        page: 1,
                        size: SEARCH_PAGE_SIZE,
                    },
                    { signal: controller.signal },
                );

                if (controller.signal.aborted) return;

                startTransition(() => {
                    setResults(response);
                    setCompletedSearchQuery(normalizedQuery);
                });
            } catch (error) {
                if (isAxiosError(error) && error.code === 'ERR_CANCELED') return;

                console.error('Error searching for events:', error);

                if (!controller.signal.aborted) {
                    startTransition(() => {
                        setResults(emptyResults);
                        setCompletedSearchQuery(normalizedQuery);
                    });
                    setLoadError(true);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            controller.abort();
        };
    }, [debouncedQuery, normalizedQuery]);

    const handleLoadMore = async () => {
        if (loading || loadingMore || results.page >= results.totalPages || normalizedQuery.length < MIN_QUERY_LENGTH) {
            return;
        }

        const controller = new AbortController();
        loadMoreControllerRef.current?.abort();
        loadMoreControllerRef.current = controller;

        try {
            setLoadingMore(true);
            setLoadError(false);

            const nextPage = results.page + 1;
            const response = await eventsService.searchEvents(
                {
                    text: debouncedQuery.trim(),
                    page: nextPage,
                    size: SEARCH_PAGE_SIZE,
                },
                { signal: controller.signal },
            );

            if (controller.signal.aborted) return;

            startTransition(() => {
                setResults((currentResults) => ({
                    ...response,
                    events: mergeEvents(currentResults.events, response.events),
                }));
            });
        } catch (error) {
            if (isAxiosError(error) && error.code === 'ERR_CANCELED') return;

            console.error('Error loading more search results:', error);

            if (!controller.signal.aborted) {
                setLoadError(true);
            }
        } finally {
            if (loadMoreControllerRef.current === controller) {
                loadMoreControllerRef.current = null;
            }

            if (!controller.signal.aborted) {
                setLoadingMore(false);
            }
        }
    };

    if (!normalizedQuery) {
        return (
            <div className="flex flex-col gap-2 pb-[16px]">
                <motion.p
                    className="text-display text-[20px] text-brand"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                    {title}
                </motion.p>
                <p className="text-sm text-brand-soft">{emptyPrompt}</p>
            </div>
        );
    }

    if (normalizedQuery.length < MIN_QUERY_LENGTH) {
        return (
            <div className="flex flex-col gap-2 pb-[16px]">
                <motion.p
                    className="text-display text-[20px] text-brand"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                    {title}
                </motion.p>
                <p className="text-sm text-brand-soft">Enter at least {MIN_QUERY_LENGTH} characters.</p>
            </div>
        );
    }

    const hasMore = results.page < results.totalPages;
    const visibleCountLabel = results.total > results.events.length
        ? `Found: ${results.total}; showing the first ${results.events.length}`
        : `Found: ${results.total}`;
    const showCustomEmptyState = Boolean(emptyState)
        && !loading
        && !loadError
        && normalizedCurrentQuery === normalizedQuery
        && completedSearchQuery === normalizedQuery
        && results.events.length === 0;

    if (showCustomEmptyState) {
        return (
            <div className={`flex min-h-full flex-col pb-[16px] ${className}`.trim()}>
                <motion.div
                    className="flex min-h-0 flex-1 items-center justify-center"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                    {emptyState}
                </motion.div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-3 pb-[16px] ${className}`.trim()}>
            <motion.p
                className="text-display text-[20px] text-brand"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
            >
                {title}
            </motion.p>

            {showSummary && !loading && !loadError && (
                <p className="text-[12px] font-[400] text-brand-soft">
                    {visibleCountLabel}
                </p>
            )}

            {loadError && !results.events.length ? (
                <p className="text-sm text-red-500">Search failed. Please try again.</p>
            ) : (
                <>
                    {renderResults ? (
                        renderResults({
                            events: results.events,
                            loading: loading && !results.events.length,
                            loadingText: 'Searching for events...',
                            emptyText: `No results for “${query.trim()}”`,
                            onClick,
                        })
                    ) : (
                        <MainSideEventList
                            events={results.events}
                            loading={loading && !results.events.length}
                            loadingText="Searching for events..."
                            emptyText={`No results for “${query.trim()}”`}
                            onClick={onClick}
                            cardVariants={cardVariants}
                        />
                    )}

                    {loadError && results.events.length > 0 && (
                        <p className="text-sm text-red-500">Some results could not be loaded.</p>
                    )}

                    {showLoadMore && hasMore && (
                        <button
                            type="button"
                            onClick={() => void handleLoadMore()}
                            disabled={loadingMore}
                            className="mt-1 rounded-full border border-[var(--color-surface-border-soft)] px-4 py-2 text-sm text-brand transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loadingMore ? 'Loading...' : 'Show more'}
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
