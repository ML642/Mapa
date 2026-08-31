import {
    useEffect,
    useRef,
    type ReactNode,
    type UIEvent,
} from 'react';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';

type ScrollSnapPagerPanel = {
    key: string;
    content: ReactNode;
    className?: string;
};

type ScrollSnapPagerProps = {
    activeIndex: number;
    ariaLabel?: string;
    className?: string;
    onActiveIndexChange: (index: number) => void;
    panels: ScrollSnapPagerPanel[];
    panelClassName?: string;
};

const clampIndex = (value: number, max: number) => Math.max(0, Math.min(value, max));

export default function ScrollSnapPager({
    activeIndex,
    ariaLabel,
    className = '',
    onActiveIndexChange,
    panels,
    panelClassName = '',
}: ScrollSnapPagerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollSyncTimeoutRef = useRef<number | null>(null);
    const wheelLockTimeoutRef = useRef<number | null>(null);
    const suppressScrollSyncRef = useRef(false);
    const { isDesktop } = useResponsiveLayout();

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return undefined;
        }

        const nextIndex = clampIndex(activeIndex, panels.length - 1);
        const targetLeft = container.clientWidth * nextIndex;

        if (Math.abs(container.scrollLeft - targetLeft) < 2) {
            return undefined;
        }

        suppressScrollSyncRef.current = true;
        container.scrollTo({
            left: targetLeft,
            behavior: 'smooth',
        });

        if (scrollSyncTimeoutRef.current !== null) {
            window.clearTimeout(scrollSyncTimeoutRef.current);
        }

        scrollSyncTimeoutRef.current = window.setTimeout(() => {
            suppressScrollSyncRef.current = false;
        }, 360);

        return () => {
            if (scrollSyncTimeoutRef.current !== null) {
                window.clearTimeout(scrollSyncTimeoutRef.current);
                scrollSyncTimeoutRef.current = null;
            }
        };
    }, [activeIndex, panels.length]);

    useEffect(() => {
        const handleResize = () => {
            const container = containerRef.current;
            if (!container) {
                return;
            }

            const nextIndex = clampIndex(activeIndex, panels.length - 1);
            container.scrollTo({
                left: container.clientWidth * nextIndex,
                behavior: 'auto',
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [activeIndex, panels.length]);

    useEffect(() => () => {
        if (scrollSyncTimeoutRef.current !== null) {
            window.clearTimeout(scrollSyncTimeoutRef.current);
        }

        if (wheelLockTimeoutRef.current !== null) {
            window.clearTimeout(wheelLockTimeoutRef.current);
        }
    }, []);

    const handleScroll = (event: UIEvent<HTMLDivElement>) => {
        if (suppressScrollSyncRef.current) {
            return;
        }

        const container = event.currentTarget;
        if (!container.clientWidth) {
            return;
        }

        const nextIndex = clampIndex(
            Math.round(container.scrollLeft / container.clientWidth),
            panels.length - 1,
        );

        if (nextIndex !== activeIndex) {
            onActiveIndexChange(nextIndex);
        }
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !isDesktop || panels.length < 2) {
            return;
        }

        const handleWheel = (event: WheelEvent) => {
            const dominantDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;

            if (Math.abs(dominantDelta) < 18) {
                return;
            }

            event.preventDefault();

            if (wheelLockTimeoutRef.current !== null) {
                return;
            }

            const direction = dominantDelta > 0 ? 1 : -1;
            const nextIndex = clampIndex(activeIndex + direction, panels.length - 1);

            if (nextIndex === activeIndex) {
                return;
            }

            onActiveIndexChange(nextIndex);

            wheelLockTimeoutRef.current = window.setTimeout(() => {
                wheelLockTimeoutRef.current = null;
            }, 360);
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [activeIndex, isDesktop, panels.length, onActiveIndexChange]);

    return (
        <div
            ref={containerRef}
            aria-label={ariaLabel}
            className={`flex min-w-0 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory no-scrollbar ${className}`.trim()}
            style={isDesktop ? undefined : { touchAction: 'pan-y pinch-zoom' }}
            onScroll={handleScroll}
        >
            {panels.map((panel) => (
                <section
                    key={panel.key}
                    className={`w-full shrink-0 snap-start ${panelClassName} ${panel.className ?? ''}`.trim()}
                >
                    {panel.content}
                </section>
            ))}
        </div>
    );
}
