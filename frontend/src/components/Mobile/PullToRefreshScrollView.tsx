import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type TouchEvent as ReactTouchEvent } from 'react';

const PULL_TRIGGER_PX = 78;
const PULL_MAX_PX = 118;
const PULL_RESTING_PX = 52;
const PULL_RESISTANCE = 0.58;

type RefreshState = 'idle' | 'armed' | 'refreshing';

type PullToRefreshScrollViewProps = {
    children: ReactNode;
    wrapperClassName?: string;
    scrollClassName?: string;
    scrollStyle?: CSSProperties;
    contentClassName?: string;
    onRefresh?: () => void | Promise<void>;
    pullTriggerPx?: number;
    allowInteractivePull?: boolean;
    onPullProgress?: (offset: number) => void;
    onPullComplete?: () => void;
    hidePullIndicator?: boolean;
    moveContentOnPull?: boolean;
};

const joinClasses = (...values: Array<string | null | undefined | false>) => values.filter(Boolean).join(' ');

const isEditableTarget = (target: EventTarget | null) =>
    target instanceof HTMLElement &&
    Boolean(target.closest('input, textarea, select, button, a, label, [contenteditable="true"], [role="button"]'));

const isVerticallyScrollable = (element: HTMLElement) => {
    const styles = window.getComputedStyle(element);
    const overflowY = styles.overflowY;
    return (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') && element.scrollHeight > element.clientHeight + 1;
};

const findActiveScrollRoot = (target: HTMLElement | null, boundary: HTMLElement) => {
    let node = target;

    while (node && node !== boundary) {
        if (isVerticallyScrollable(node)) {
            return node;
        }
        node = node.parentElement;
    }

    return boundary;
};

const getPullOffset = (distance: number) => Math.min(PULL_MAX_PX, distance * PULL_RESISTANCE);

export default function PullToRefreshScrollView({
    children,
    wrapperClassName,
    scrollClassName,
    scrollStyle,
    contentClassName,
    onRefresh,
    pullTriggerPx,
    allowInteractivePull = false,
    onPullProgress,
    onPullComplete,
    hidePullIndicator = false,
    moveContentOnPull = true,
}: PullToRefreshScrollViewProps) {
    const triggerPx = pullTriggerPx ?? PULL_TRIGGER_PX;
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const startYRef = useRef(0);
    const trackingRef = useRef(false);
    const pullingRef = useRef(false);
    const activeScrollRootRef = useRef<HTMLElement | null>(null);
    const refreshTimerRef = useRef<number | null>(null);
    const pullOffsetRef = useRef(0);
    const refreshStateRef = useRef<RefreshState>('idle');

    const [pullOffset, setPullOffset] = useState(0);
    const [refreshState, setRefreshState] = useState<RefreshState>('idle');
    const [isDragging, setIsDragging] = useState(false);

    const syncPullOffset = (value: number) => {
        pullOffsetRef.current = value;
        setPullOffset(value);
        onPullProgress?.(value);
    };

    const syncRefreshState = (value: RefreshState) => {
        refreshStateRef.current = value;
        setRefreshState(value);
    };

    const resetGesture = () => {
        trackingRef.current = false;
        pullingRef.current = false;
        activeScrollRootRef.current = null;
        setIsDragging(false);
    };

    const restoreIdleState = () => {
        resetGesture();
        syncPullOffset(0);
        syncRefreshState('idle');
    };

    const handleRefresh = async () => {
        try {
            if (onRefresh) {
                await onRefresh();
                restoreIdleState();
                return;
            }

            window.location.reload();
        } catch (error) {
            console.error('Failed to refresh the page:', error);
            restoreIdleState();
        }
    };

    const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
        if (
            refreshStateRef.current === 'refreshing' ||
            event.touches.length !== 1 ||
            (!allowInteractivePull && isEditableTarget(event.target))
        ) {
            return;
        }

        const scrollContainer = scrollRef.current;
        if (!scrollContainer) {
            return;
        }

        const activeScrollRoot = findActiveScrollRoot(event.target instanceof HTMLElement ? event.target : null, scrollContainer);
        if (activeScrollRoot.scrollTop > 0) {
            return;
        }

        startYRef.current = event.touches[0].clientY;
        trackingRef.current = true;
        pullingRef.current = false;
        activeScrollRootRef.current = activeScrollRoot;
    };

    const handleTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
        if (!trackingRef.current || refreshStateRef.current === 'refreshing' || event.touches.length !== 1) {
            return;
        }

        const activeScrollRoot = activeScrollRootRef.current;
        if (!activeScrollRoot) {
            return;
        }

        if (activeScrollRoot.scrollTop > 0) {
            restoreIdleState();
            return;
        }

        const deltaY = event.touches[0].clientY - startYRef.current;

        if (deltaY <= 0) {
            if (!pullingRef.current) {
                resetGesture();
            }
            return;
        }

        const nextPullOffset = getPullOffset(deltaY);
        pullingRef.current = true;
        setIsDragging(true);
        syncPullOffset(nextPullOffset);
        syncRefreshState(nextPullOffset >= triggerPx ? 'armed' : 'idle');

        if (event.cancelable) {
            event.preventDefault();
        }
    };

    const handleTouchEnd = () => {
        if (refreshStateRef.current === 'refreshing') {
            return;
        }

        if (!pullingRef.current) {
            resetGesture();
            return;
        }

        resetGesture();

        if (pullOffsetRef.current >= triggerPx) {
            if (onPullComplete) {
                onPullComplete();
                restoreIdleState();
                return;
            }

            syncRefreshState('refreshing');
            syncPullOffset(PULL_RESTING_PX);

            refreshTimerRef.current = window.setTimeout(() => {
                void handleRefresh();
            }, 120);

            return;
        }

        syncPullOffset(0);
        syncRefreshState('idle');
    };

    useEffect(() => {
        return () => {
            if (refreshTimerRef.current !== null) {
                window.clearTimeout(refreshTimerRef.current);
            }
        };
    }, []);

    const indicatorVisible = !hidePullIndicator && (pullOffset > 0 || refreshState === 'refreshing');
    const indicatorProgress = Math.min(pullOffset / triggerPx, 1);
    const indicatorLabel =
        refreshState === 'refreshing'
            ? 'Refreshing page'
            : pullOffset >= triggerPx
                ? 'Release to refresh'
                : 'Pull down to refresh';
    const iconStyle =
        refreshState === 'refreshing'
            ? { animation: 'mobile-pull-refresh-spin 0.85s linear infinite' }
            : {
                transform: `rotate(${indicatorProgress * 200}deg)`,
                transition: isDragging ? 'none' : 'transform 180ms ease',
            };
    const iconArcStyle =
        refreshState === 'refreshing'
            ? { strokeDasharray: '1 1', opacity: 1 }
            : {
                strokeDasharray: `${0.24 + indicatorProgress * 0.54} 1`,
                opacity: 0.58 + indicatorProgress * 0.42,
                transition: isDragging ? 'none' : 'stroke-dasharray 180ms ease, opacity 180ms ease',
            };
    const iconArrowHeadStyle =
        refreshState === 'refreshing'
            ? { opacity: 1 }
            : {
                opacity: 0.5 + indicatorProgress * 0.5,
                transition: isDragging ? 'none' : 'opacity 180ms ease',
            };

    return (
        <div className={joinClasses('relative overflow-hidden', wrapperClassName)}>
            <div
                className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-4 pt-2.5"
                aria-live="polite"
                style={{
                    opacity: indicatorVisible ? 1 : 0,
                    transform: `translateY(${Math.max(pullOffset * 0.34 - 12, 0)}px)`,
                    transition: isDragging ? 'none' : 'opacity 180ms ease, transform 180ms ease',
                }}
            >
                <div
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-surface-border-soft)] bg-[rgba(255,255,255,0.94)] text-[var(--color-accent)] shadow-[var(--shadow-app-xs)] backdrop-blur"
                    role="status"
                >
                    <span className="sr-only">{indicatorLabel}</span>
                    <span className="flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden
                            style={iconStyle}
                        >
                            <circle
                                cx="12"
                                cy="12"
                                r="8.25"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                opacity="0.14"
                            />
                            <path
                                d="M18.6 8.1A8.2 8.2 0 1 0 20.1 12"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                pathLength={1}
                                style={iconArcStyle}
                            />
                            <path
                                d="M16.9 4.7L19.65 7.15L16 8"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={iconArrowHeadStyle}
                            />
                        </svg>
                    </span>
                </div>
            </div>

            <div
                ref={scrollRef}
                className={joinClasses('h-full overflow-y-auto', scrollClassName)}
                style={scrollStyle}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
            >
                <div
                    className={contentClassName}
                    style={{
                        transform: `translateY(${moveContentOnPull ? pullOffset : 0}px)`,
                        transition: isDragging ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}
