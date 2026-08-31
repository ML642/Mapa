import { buildApiAssetUrl } from '../../../config';
import type { Event } from '../../../services';
import { BookmarkOutlineIcon } from '../../Icons/CommonIcons';
import { EventCategoryIcon, EventTimeIcon } from '../../Icons/EventIcons';
import { formatEventDateLabel, formatEventTimeLabel } from '../../../utils/eventDateDisplay';
import { getMobileCategoryLabel } from '../Filters/MobileFilterOptions';

export default function MobileProfileEventItem({
    activeTab,
    event,
    onOpen,
}: {
    activeTab: 'will_attend' | 'might_attend';
    event: Event;
    onOpen: (eventId: string) => void;
}) {
    const imageUrl = buildApiAssetUrl(event.event_image);
    const statusLabel = activeTab === 'will_attend' ? 'Going' : 'Want to go';
    const eventTime = formatEventTimeLabel(event);

    return (
        <button
            type="button"
            onClick={() => onOpen(event._id)}
            className="flex w-full items-start gap-[12px] border-b border-[rgba(107,40,94,0.16)] px-0 py-[14px] text-left last:border-b-0"
        >
            <div className="h-[120px] w-[119px] shrink-0 overflow-hidden rounded-[12px] bg-[var(--color-brand-surface)]">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={event.title}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(180deg,rgba(245,224,247,0.9)_0%,rgba(255,255,255,0.9)_100%)] text-[30px] text-brand">
                        {event.title.trim().charAt(0).toUpperCase() || '?'}
                    </div>
                )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
                <div className="flex items-start justify-between gap-[10px]">
                    <span className="inline-flex min-w-0 max-w-full items-center gap-[4px] rounded-full bg-[linear-gradient(90deg,rgba(215,160,247,0.85)_0%,rgba(243,164,248,0.92)_100%)] px-[10px] py-[5px] text-[12px] leading-none tracking-[-0.24px] text-brand">
                        <EventCategoryIcon className="h-[14px] w-[14px] shrink-0 text-brand" />
                        <span className="truncate">{getMobileCategoryLabel(event.category || 'Event')}</span>
                    </span>

                    <span className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full text-brand">
                        <BookmarkOutlineIcon className="h-[14px] w-[12px] text-brand" />
                    </span>
                </div>

                <div className="flex flex-col gap-[4px]">
                    <p className="overflow-hidden text-[16px] font-[500] leading-[1.2] tracking-[-0.48px] text-brand [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                        {event.title}
                    </p>
                    <p className="text-[15px] leading-none tracking-[-0.3px] text-brand">
                        {formatEventDateLabel(event, { day: 'numeric', month: 'long' })}
                    </p>
                    <p className="text-[14px] leading-[1.2] tracking-[-0.28px] text-brand-muted">
                        {event.address || 'Address will appear in the event details'}
                    </p>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-[8px]">
                    <span className="text-[14px] leading-none tracking-[-0.28px] text-[#FF7A59]">
                        ✓ {statusLabel}
                    </span>
                    {eventTime ? (
                        <span className="inline-flex items-center gap-[6px] rounded-full bg-white px-[8px] py-[4px] text-[13px] leading-none tracking-[-0.26px] text-brand shadow-[inset_0_0_0_1px_rgba(107,40,94,0.12)]">
                            <EventTimeIcon className="h-[14px] w-[14px] text-brand" />
                            {eventTime}
                        </span>
                    ) : null}
                </div>
            </div>
        </button>
    );
}
