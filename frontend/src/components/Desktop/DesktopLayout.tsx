import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { History, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Header from "./Header";
import {
    getSessionSnapshot,
    PERSONALIZED_RECOMMENDATIONS_QUERY_KEY,
    subscribeToSession,
    userService,
} from "../../services";

const RECENT_SEARCHES_STORAGE_KEY = "mapa-recent-searches";
const MAX_RECENT_SEARCHES = 5;

export type DesktopLayoutProps = {
    children: React.ReactNode;
    mainVisible: boolean;
    searchQuery: string;
    onSearchQueryChange: (value: string) => void;
};

export default function DesktopLayout({ children, mainVisible, searchQuery, onSearchQueryChange }: DesktopLayoutProps) {
    const queryClient = useQueryClient();
    const location = useLocation();
    const hasSearchQuery = Boolean(searchQuery.trim());
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [scrollThumb, setScrollThumb] = useState({ visible: false, height: 100, top: 0 });
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [searchDraft, setSearchDraft] = useState(searchQuery);
    const [isSearchSubmitted, setIsSearchSubmitted] = useState(Boolean(searchQuery.trim()));
    const [recentSearches, setRecentSearches] = useState<string[]>(() => {
        try {
            const storedSearches = JSON.parse(window.localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY) || "[]");
            return Array.isArray(storedSearches) ? storedSearches.filter((value): value is string => typeof value === "string") : [];
        } catch {
            return [];
        }
    });
    const hasSearchDraft = Boolean(searchDraft.trim());
    const showRecentSearches = location.pathname === '/' && isSearchFocused && !hasSearchDraft && recentSearches.length > 0;

    const submitSearch = () => {
        const nextQuery = searchDraft.trim();
        onSearchQueryChange(nextQuery);
        setIsSearchSubmitted(Boolean(nextQuery));
    };

    const clearSearch = () => {
        setSearchDraft('');
        setIsSearchSubmitted(false);
        onSearchQueryChange('');
    };

    useEffect(() => {
        setSearchDraft(searchQuery);
        setIsSearchSubmitted(Boolean(searchQuery.trim()));
    }, [searchQuery]);

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

    const removeRecentSearch = (query: string) => {
        setRecentSearches((currentSearches) => {
            const nextSearches = currentSearches.filter((item) => item !== query);
            window.localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(nextSearches));
            return nextSearches;
        });
    };

    useEffect(() => {
        const query = searchQuery.trim();
        if (query.length < 2) return;

        const timeoutId = window.setTimeout(() => {
            if (getSessionSnapshot().isAuthenticated) {
                void userService.addSearchHistoryItem(query)
                    .then(() => queryClient.invalidateQueries({ queryKey: PERSONALIZED_RECOMMENDATIONS_QUERY_KEY }))
                    .catch(() => undefined);
            }

            setRecentSearches((currentSearches) => {
                const nextSearches = [query, ...currentSearches.filter((item) => item.toLowerCase() !== query.toLowerCase())]
                    .slice(0, MAX_RECENT_SEARCHES);
                window.localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(nextSearches));
                if (getSessionSnapshot().isAuthenticated) {
                    void userService.addSearchHistoryItem(query).catch(() => undefined);
                }
                return nextSearches;
            });
        }, 700);

        return () => window.clearTimeout(timeoutId);
    }, [queryClient, searchQuery]);

    useEffect(() => {
        const scrollArea = scrollAreaRef.current;
        if (!scrollArea || location.pathname !== '/') return;

        const updateScrollThumb = () => {
            const { clientHeight, scrollHeight, scrollTop } = scrollArea;
            const overflow = scrollHeight - clientHeight;

            if (overflow <= 1) {
                setScrollThumb({ visible: false, height: 100, top: 0 });
                return;
            }

            const height = Math.max(12, (clientHeight / scrollHeight) * 100);
            const top = (scrollTop / overflow) * (100 - height);
            setScrollThumb({ visible: true, height, top });
        };

        const mutationObserver = new MutationObserver(updateScrollThumb);
        mutationObserver.observe(scrollArea, { childList: true, subtree: true });
        scrollArea.addEventListener('scroll', updateScrollThumb, { passive: true });
        window.addEventListener('resize', updateScrollThumb);
        window.requestAnimationFrame(updateScrollThumb);

        return () => {
            mutationObserver.disconnect();
            scrollArea.removeEventListener('scroll', updateScrollThumb);
            window.removeEventListener('resize', updateScrollThumb);
        };
    }, [location.pathname]);

    return (
        <div className="flex h-screen overflow-hidden pointer-events-none">
            <div className="pointer-events-auto flex h-full shrink-0">
                <Header />

                <motion.main
                    initial={{ x: 0 }}
                    animate={{ x: mainVisible ? 0 : -500 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="z-20 flex h-full min-h-0 w-[422px] shrink-0 flex-col items-center bg-surface-page shadow-app-sm"
                >
                    {location.pathname === "/" && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: location.pathname === "/" ? 1 : 0 }}
                            className="flex py-[24px] px-[16px] flex-col items-center gap-[10px]"
                        >
                            <div className={`flex h-[47.58px] w-[390px] items-center gap-[12px] rounded-[36px] border border-transparent p-[16px] shadow-app-sm transition duration-300 focus-within:border-[2px] focus-within:border-brand ${
                                hasSearchQuery ? 'border-[2px] border-brand' : ''
                            }`}>
                                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={submitSearch} className="shrink-0 text-brand" aria-label="Search">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                        <circle cx="6.8125" cy="6.73438" r="5" stroke="currentColor" strokeWidth="2" />
                                        <path d="M10.8125 10.6562L16.4694 16.3131" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </button>

                                <input
                                    type="search"
                                    placeholder="Search for an event"
                                    className="search-input w-full appearance-none border-0 outline-none text-brand"
                                    value={searchDraft}
                                    autoComplete="off"
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => {
                                        setIsSearchFocused(false);
                                        if (searchDraft.trim()) submitSearch();
                                    }}
                                    onChange={(event) => {
                                        setSearchDraft(event.target.value);
                                        setIsSearchSubmitted(false);
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') submitSearch();
                                    }}
                                />
                                {hasSearchQuery && isSearchSubmitted && (
                                    <button
                                        type="button"
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={clearSearch}
                                        className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-brand-border text-white transition-colors hover:bg-brand-muted"
                                        aria-label="Clear search"
                                    >
                                        <X className="h-[12px] w-[12px]" strokeWidth={2.5} aria-hidden="true" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}

                    <div className="relative min-h-0 w-full flex-1">
                        <div ref={scrollAreaRef} className="flex h-full min-h-0 w-full overflow-y-auto">
                            {showRecentSearches ? (
                                <section className="w-full px-[16px] pt-[8px]">
                                    <h2 className="mb-[16px] text-[16px] font-[600] text-brand">Recent searches</h2>
                                    <div className="flex flex-col">
                                        {recentSearches.map((recentSearch) => (
                                            <div key={recentSearch} className="flex h-[36px] items-center gap-[10px] border-b border-brand-tint">
                                                <button
                                                    type="button"
                                                    onMouseDown={(event) => event.preventDefault()}
                                                    onClick={() => {
                                                        setSearchDraft(recentSearch);
                                                        onSearchQueryChange(recentSearch);
                                                        setIsSearchSubmitted(true);
                                                        setIsSearchFocused(false);
                                                    }}
                                                    className="flex min-w-0 flex-1 items-center gap-[8px] text-left text-[12px] text-brand"
                                                >
                                                    <History className="h-[16px] w-[16px] shrink-0 text-brand-muted" aria-hidden="true" />
                                                    <span className="truncate">{recentSearch}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onMouseDown={(event) => event.preventDefault()}
                                                    onClick={() => removeRecentSearch(recentSearch)}
                                                    className="flex h-[20px] w-[20px] shrink-0 items-center justify-center text-brand-muted hover:text-brand"
                                                    aria-label={`Remove search: ${recentSearch}`}
                                                >
                                                    <X className="h-[14px] w-[14px]" strokeWidth={2} aria-hidden="true" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ) : children}
                        </div>

                        {location.pathname === '/' && scrollThumb.visible && (
                            <div className="pointer-events-none absolute bottom-[8px] right-[3px] top-[8px] z-30 w-[4px] rounded-full bg-brand-tint/40">
                                <span
                                    className="absolute left-0 w-full rounded-full bg-brand-muted"
                                    style={{ height: `${scrollThumb.height}%`, top: `${scrollThumb.top}%` }}
                                />
                            </div>
                        )}
                    </div>
                </motion.main>
            </div>
        </div>
    );
}
