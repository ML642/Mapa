import { buildApiAssetUrl } from '../../../config';
import { Link, useLocation } from 'react-router-dom';
import type { FriendActivityEvent } from '../../../services';
import { BookmarkOutlineIcon } from '../../Icons/CommonIcons';
import { EventPriceIcon, EventTimeIcon } from '../../Icons/EventIcons';
import FriendAvatar from './FriendAvatar';
import {
    formatFriendEventPrice,
} from './friendsFormatters';
import { formatEventDateLabel, formatEventTimeLabel } from '../../../utils/eventDateDisplay';
import { getCategoryLabel } from '../../categoryTag';

interface FriendActivityCardProps {
    event: FriendActivityEvent;
}

export default function FriendActivityCard({ event }: FriendActivityCardProps) {
    const location = useLocation();
    const imageUrl = buildApiAssetUrl(event.event_image);
    const firstAttendee = event.attendees[0];
    const extraAttendeesCount = Math.max(0, event.attendeeCount - 1);
    const eventTime = formatEventTimeLabel(event);

    const eventSearchParams = new URLSearchParams(location.search);
    eventSearchParams.set('event', event._id);
    const eventLink = `/?${eventSearchParams.toString()}`;

    return (
        <Link
            to={eventLink}
            className="block rounded-[18px] bg-white/90 px-[16px] py-[14px] shadow-[0_10px_30px_rgba(107,40,94,0.08)] transition-shadow hover:shadow-[0_12px_32px_rgba(107,40,94,0.14)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label={`Open event: ${event.title}`}
        >
            <div className="flex gap-[12px]">
                <div className="h-[120px] w-[118px] shrink-0 overflow-hidden rounded-[12px] bg-[var(--color-brand-surface)]">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={event.title}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(180deg,rgba(245,224,247,0.9)_0%,rgba(255,255,255,0.9)_100%)] text-[28px] text-brand">
                            {event.title.trim().charAt(0).toUpperCase() || '?'}
                        </div>
                    )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-[8px]">
                        <span className="inline-flex max-w-[104px] items-center rounded-full bg-[linear-gradient(90deg,rgba(215,160,247,0.85)_0%,rgba(243,164,248,0.92)_100%)] px-[10px] py-[5px] text-[13px] leading-none tracking-[-0.26px] text-brand">
                            <span className="truncate">{getCategoryLabel(event.category)}</span>
                        </span>

                        <div className="flex items-center gap-[6px]">
                            {firstAttendee && (
                                <span className="inline-flex items-center gap-[6px] rounded-[12px] bg-white px-[6px] py-[4px] shadow-[0_4px_14px_rgba(107,40,94,0.12)]">
                                    <FriendAvatar
                                        avatar={firstAttendee.avatar}
                                        username={firstAttendee.username}
                                        className="h-[24px] w-[24px]"
                                        textClassName="text-[10px]"
                                    />
                                    {extraAttendeesCount > 0 && (
                                        <span className="text-[14px] leading-none tracking-[-0.28px] text-brand">
                                            +{extraAttendeesCount}
                                        </span>
                                    )}
                                </span>
                            )}

                            <span className="flex h-[24px] w-[24px] items-center justify-center rounded-full text-brand">
                                <BookmarkOutlineIcon className="h-[14px] w-[12px] text-brand" />
                            </span>
                        </div>
                    </div>

                    <p className="mt-[10px] overflow-hidden text-[16px] font-[500] leading-[1.2] tracking-[-0.48px] text-brand [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
                        {event.title}
                    </p>

                    <p className="mt-[8px] text-[15px] leading-none tracking-[-0.3px] text-brand">
                        {formatEventDateLabel(event, { day: 'numeric', month: 'long' })}
                    </p>

                    <p className="mt-[6px] text-[14px] leading-[1.2] tracking-[-0.28px] text-brand-muted">
                        {event.address}
                    </p>

                    <div className="mt-auto flex flex-wrap gap-[8px] pt-[12px]">
                        {eventTime ? (
                            <span className="inline-flex items-center gap-[6px] rounded-full bg-white px-[8px] py-[4px] text-[13px] leading-none tracking-[-0.26px] text-brand shadow-[inset_0_0_0_1px_rgba(107,40,94,0.12)]">
                                <EventTimeIcon className="h-[14px] w-[14px] text-brand" />
                                {eventTime}
                            </span>
                        ) : null}
                        <span className="inline-flex items-center gap-[6px] rounded-full bg-white px-[8px] py-[4px] text-[13px] leading-none tracking-[-0.26px] text-brand shadow-[inset_0_0_0_1px_rgba(107,40,94,0.12)]">
                            <EventPriceIcon className="h-[14px] w-[14px] text-brand" />
                            {formatFriendEventPrice(event.price, event.price_description, event.is_premium)}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
