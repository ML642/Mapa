import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { buildApiAssetUrl } from '../../config';
import type { Event } from '../../services';
import { EventCategoryIcon } from '../Icons/EventIcons';
import { formatPreviewDate } from '../Desktop/mainSide/formatters';
import { getCategoryLabel } from '../categoryTag';

type MobileSearchResultsListProps = {
    emptyText: string;
    events: Event[];
    loading: boolean;
    loadingText: string;
    onClick?: (id: string) => void;
    activeEventId?: string | null;
};

type EventGroup = {
    category: string;
    events: Event[];
};

const MAX_VISIBLE_EVENTS_PER_GROUP = 5;

const groupEventsByCategory = (events: Event[]) => {
    const groups: EventGroup[] = [];
    const groupByCategory = new Map<string, EventGroup>();

    events.forEach((event) => {
        const category = event.category || 'Events';
        const existingGroup = groupByCategory.get(category);

        if (existingGroup) {
            existingGroup.events.push(event);
            return;
        }

        const nextGroup = { category, events: [event] };
        groupByCategory.set(category, nextGroup);
        groups.push(nextGroup);
    });

    return groups;
};

const MobileSearchEventRow = ({
    event,
    onClick,
    isSelected = false,
}: {
    event: Event;
    onClick?: (id: string) => void;
    isSelected?: boolean;
}) => {
    const imageUrl = buildApiAssetUrl(event.event_image);

    return (
        <button
            type="button"
            onClick={() => onClick?.(event._id)}
            className={`flex w-full min-w-0 items-center gap-[8px] rounded-[8px] p-[4px] text-left ${isSelected ? 'bg-[#FBF7F9]' : ''}`}
        >
            <span className="flex h-[36px] w-[36px] shrink-0 overflow-hidden rounded-[4px] bg-[var(--color-surface-placeholder)]">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        draggable={false}
                    />
                ) : (
                    <span className="flex h-full w-full items-center justify-center bg-brand-surface">
                        <img src="/mapa.svg" alt="" className="h-[18px] w-[18px] object-contain opacity-70" draggable={false} />
                    </span>
                )}
            </span>

            <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="truncate text-[12px] font-[600] leading-[1.1] text-brand">
                    {event.title.length>30 ? `${event.title.slice(0,35)}...` : event.title}
                </span>
                <span className="truncate text-[10px] font-[400] leading-none text-brand">
                    {formatPreviewDate(event)}
                </span>
            </span>
        </button>
    );
};

export default function MobileSearchResultsList({
    emptyText,
    events,
    loading,
    loadingText,
    onClick,
    activeEventId,
}: MobileSearchResultsListProps) {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set());

    const toggleGroup = (category: string) => {
        setExpandedGroups((currentGroups) => {
            const nextGroups = new Set(currentGroups);

            if (nextGroups.has(category)) {
                nextGroups.delete(category);
            } else {
                nextGroups.add(category);
            }

            return nextGroups;
        });
    };

    if (loading) {
        return (
            <p className="text-[12px] text-brand-soft">
                {loadingText}
            </p>
        );
    }

    if (!events.length) {
        return (
            <p className="text-[12px] text-brand-soft">
                {emptyText}
            </p>
        );
    }

    return (
        <div className="flex w-full flex-col gap-[18px]">
            {groupEventsByCategory(events).map((group) => {
                const isExpanded = expandedGroups.has(group.category);
                const hasHiddenEvents = group.events.length > MAX_VISIBLE_EVENTS_PER_GROUP;
                const visibleEvents = isExpanded
                    ? group.events
                    : group.events.slice(0, MAX_VISIBLE_EVENTS_PER_GROUP);
                const categoryLabel = getCategoryLabel(group.category);

                return (
                    <section key={group.category} className="flex w-full flex-col gap-[10px]">
                        <div className="flex items-center gap-[4px] text-brand-border">
                            <EventCategoryIcon className="h-[14px] w-[14px]" />
                            <span className="text-[11px] font-[400] leading-none">
                                {categoryLabel}
                            </span>
                        </div>

                        <div className="flex flex-col gap-[10px]">
                            {visibleEvents.map((event) => (
                                <motion.div
                                    key={event._id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.22, ease: 'easeOut' }}
                                >
                                    <MobileSearchEventRow event={event} onClick={onClick} isSelected={event._id === activeEventId} />
                                </motion.div>
                            ))}

                            {hasHiddenEvents ? (
                                <button
                                    type="button"
                                    className="ml-[44px] flex h-[24px] w-[24px] items-center justify-center rounded-full text-brand-border transition active:scale-95"
                                    aria-label={isExpanded ? `Collapse ${categoryLabel}` : `Show all ${categoryLabel}`}
                                    onClick={() => toggleGroup(group.category)}
                                >
                                    <ChevronDown
                                        aria-hidden
                                        size={18}
                                        strokeWidth={2}
                                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                    />
                                </button>
                            ) : null}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}
