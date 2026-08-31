import { AnimatePresence, motion, type Variants } from 'framer-motion';
import EventCardPreview from '../Side/Event';
import type { Event } from '../../../services';
import {
    formatPreviewDate,
    formatPreviewTime,
    getPreviewPriceLabel,
} from './formatters';

interface MainSideEventListProps {
    events: Event[];
    loading: boolean;
    loadingText: string;
    emptyText: string;
    onClick?: (id: string) => void;
    cardVariants: Variants;
    collapsedCount?: number;
    expandedCount?: number;
    expanded?: boolean;
    activeEventId?: string | null;
}

const MAX_DESKTOP_EVENT_CARDS = 10;

export default function MainSideEventList({
    events,
    loading,
    loadingText,
    emptyText,
    onClick,
    cardVariants,
    collapsedCount,
    expandedCount,
    expanded = true,
    activeEventId,
}: MainSideEventListProps) {
    const requestedEvents = collapsedCount
        ? events.slice(0, expanded ? expandedCount ?? events.length : collapsedCount)
        : events;
    const visibleEvents = requestedEvents.slice(0, MAX_DESKTOP_EVENT_CARDS);

    return (
        <AnimatePresence mode="wait">
            {loading ? (
                <motion.p
                    key="loading"
                    className="text-sm text-gray-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {loadingText}
                </motion.p>
            ) : (
                <motion.div
                    key="list"
                    className="flex flex-col gap-[0px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {visibleEvents.length > 0 ? (
                        visibleEvents.map((event) => (
                            <motion.div
                                key={event._id}
                                variants={cardVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                layout
                            >
                                {/* Keep event preview formatting in one place so both lists stay visually aligned. */}
                                <EventCardPreview
                                    id={event._id}
                                    category={event.category}
                                    title={event.title}
                                    date={formatPreviewDate(event)}
                                    location={event.address}
                                    time={formatPreviewTime(event)}
                                    price={getPreviewPriceLabel(event)}
                                    priceDescription={event.price_description}
                                    image={event.event_image}
                                    onClick={onClick}
                                    isSelected={event._id === activeEventId}
                                />
                            </motion.div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-400">{emptyText}</p>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
