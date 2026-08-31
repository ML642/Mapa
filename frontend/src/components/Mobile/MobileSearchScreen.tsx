import { useEffect, useRef, useState } from "react";
import { History, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import PullToRefreshScrollView from "./PullToRefreshScrollView";
import EventSearchResults from "../Search/EventSearchResults";
import MobileSearchNoResults from "./MobileSearchNoResults";
import MobileSearchResultsList from "./MobileSearchResultsList";
import {
    getSessionSnapshot,
    PERSONALIZED_RECOMMENDATIONS_QUERY_KEY,
    subscribeToSession,
    userService,
} from "../../services";

const navBottomOffset = "calc(5rem + env(safe-area-inset-bottom, 0px))";
const RECENT_SEARCHES_STORAGE_KEY = "mapa-recent-searches";
const MAX_RECENT_SEARCHES = 5;

export default function MobileSearchScreen({
    query,
    onQueryChange,
    onEventClick,
}: {
    query: string;
    onQueryChange: (value: string) => void;
    onEventClick: (id: string) => void;
}) {
    const queryClient = useQueryClient();
    const inputRef = useRef<HTMLInputElement>(null);
    const [recentSearches, setRecentSearches] = useState<string[]>(() => {
        try {
            const storedSearches = JSON.parse(window.localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY) || "[]");
            return Array.isArray(storedSearches)
                ? storedSearches.filter((value): value is string => typeof value === "string")
                : [];
        } catch {
            return [];
        }
    });
    const hasQuery = Boolean(query.trim());

    useEffect(() => {
        const id = window.requestAnimationFrame(() => inputRef.current?.focus());
        return () => window.cancelAnimationFrame(id);
    }, []);

    useEffect(() => {
        const loadAccountHistory = () => {
            if (!getSessionSnapshot().isAuthenticated) return;

            void userService.getSearchHistoryData()
                .then(({ searches }) => setRecentSearches(searches.map((item) => item.query)))
                .catch(() => undefined);
        };

        loadAccountHistory();
        return subscribeToSession(loadAccountHistory);
    }, []);

    useEffect(() => {
        const nextQuery = query.trim();
        if (nextQuery.length < 2) return;

        const timeoutId = window.setTimeout(() => {
            if (getSessionSnapshot().isAuthenticated) {
                void userService.addSearchHistoryItem(nextQuery)
                    .then(() => queryClient.invalidateQueries({ queryKey: PERSONALIZED_RECOMMENDATIONS_QUERY_KEY }))
                    .catch(() => undefined);
            }

            setRecentSearches((currentSearches) => {
                const nextSearches = [
                    nextQuery,
                    ...currentSearches.filter((item) => item.toLowerCase() !== nextQuery.toLowerCase()),
                ].slice(0, MAX_RECENT_SEARCHES);
                window.localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(nextSearches));
                return nextSearches;
            });
        }, 700);

        return () => window.clearTimeout(timeoutId);
    }, [query, queryClient]);

    const removeRecentSearch = (recentSearch: string) => {
        setRecentSearches((currentSearches) => {
            const nextSearches = currentSearches.filter((item) => item !== recentSearch);
            window.localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(nextSearches));
            return nextSearches;
        });
    };

    return (
        <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-white">
            <PullToRefreshScrollView
                wrapperClassName="min-h-0 flex-1"
                scrollClassName="h-full overscroll-y-contain [-webkit-overflow-scrolling:touch] touch-pan-y"
                scrollStyle={{ paddingBottom: navBottomOffset }}
                contentClassName="flex min-h-full flex-col"
            >
                <div
                    className="shrink-0 px-[clamp(14px,4vw,20px)]"
                    style={{ paddingTop: "max(14px, env(safe-area-inset-top, 0px))" }}
                >
                    <label className="sr-only" htmlFor="mobile-full-search-input">
                        Search events
                    </label>
                    <div
                        className="flex min-h-[48px] w-full items-center gap-3 rounded-full border border-[var(--color-surface-border-soft)] bg-surface-page px-[clamp(14px,4vw,18px)] shadow-[var(--shadow-app-xs)] transition-colors focus-within:border-brand"
                        style={{ paddingBlock: "clamp(10px, 2.5vw, 13px)" }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 33 33"
                            fill="none"
                            className="shrink-0 text-brand"
                            aria-hidden
                        >
                            <circle cx="12.5" cy="12.5" r="8" stroke="currentColor" strokeWidth="2" />
                            <path d="M18.5 18.5L28 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <input
                            id="mobile-full-search-input"
                            ref={inputRef}
                            type="search"
                            enterKeyHint="search"
                            value={query}
                            placeholder="Name, address, category"
                            autoComplete="off"
                            autoCorrect="off"
                            className="min-w-0 flex-1 bg-transparent text-[clamp(14px,3.8vw,16px)] text-brand caret-brand outline-none placeholder:text-brand-muted"
                            onChange={(event) => onQueryChange(event.target.value)}
                        />
                    </div>
                </div>
                <div className="flex min-h-0 flex-1 px-[clamp(14px,4vw,20px)] pt-4">
                    {hasQuery ? (
                        <EventSearchResults
                            query={query}
                            onClick={onEventClick}
                            className="min-h-full flex-1"
                            emptyState={<MobileSearchNoResults />}
                            renderResults={(props) => <MobileSearchResultsList {...props} />}
                            showLoadMore={false}
                            showSummary={false}
                        />
                    ) : recentSearches.length > 0 ? (
                        <section className="w-full">
                            <h2 className="mb-[16px] text-[16px] font-[600] text-brand">Recent searches</h2>
                            <div className="flex flex-col">
                                {recentSearches.map((recentSearch) => (
                                    <div key={recentSearch} className="flex h-[36px] items-center gap-[10px] border-b border-brand-tint">
                                        <button
                                            type="button"
                                            onClick={() => onQueryChange(recentSearch)}
                                            className="flex min-w-0 flex-1 items-center gap-[8px] text-left text-[12px] text-brand"
                                        >
                                            <History className="h-[16px] w-[16px] shrink-0 text-brand-muted" aria-hidden="true" />
                                            <span className="truncate">{recentSearch}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeRecentSearch(recentSearch)}
                                            className="flex h-[20px] w-[20px] shrink-0 items-center justify-center text-brand-muted"
                                            aria-label={`Remove search ${recentSearch}`}
                                        >
                                            <X className="h-[14px] w-[14px]" strokeWidth={2} aria-hidden="true" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : null}
                </div>
            </PullToRefreshScrollView>
        </div>
    );
}
