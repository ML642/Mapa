import { useState } from 'react';
import type { FriendActivityEvent } from '../../../services';
import { buildApiAssetUrl } from '../../../config';
import { BookmarkFilledIcon, BookmarkOutlineIcon } from '../../Icons/CommonIcons';
import { EventCategoryIcon, EventPriceIcon, EventTimeIcon } from '../../Icons/EventIcons';
import FriendAvatar from '../friends/FriendAvatar';
import { useFavorites } from '../contexts/FavoriteContext';
import { formatPreviewDate, formatPreviewTime, getPreviewPriceLabel } from './formatters';
import { getCategoryLabel } from '../../categoryTag';

interface Props {
    events: FriendActivityEvent[];
    onClickEvent?: (id: string) => void;
}

function FriendsEventImage({ image, title }: { image?: string | string[]; title: string }) {
    const [imageFailed, setImageFailed] = useState(false);
    const imageUrl = buildApiAssetUrl(image);

    return (
        <div className="h-[120px] w-[187.7px] shrink-0 overflow-hidden rounded-[4px] bg-[var(--color-surface-placeholder)] max-md:w-[120px]">
            {imageUrl && !imageFailed ? (
                <img src={imageUrl} alt={title} className="h-full w-full rounded-[4px] object-cover" onError={() => setImageFailed(true)} />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-[var(--color-surface-placeholder)]">
                    <img src="/mapa.svg" alt="" className="h-[54px] w-[54px] object-contain opacity-80" />
                </div>
            )}
        </div>
    );
}

export default function MainSideFriendsEvents({ events, onClickEvent }: Props) {
    const [expanded, setExpanded] = useState(false);
    const { isFavorite, loadingFavorites, toggleFavorite } = useFavorites();
    const visibleEvents = events.slice(0, expanded ? 6 : 1);

    const handleFavoriteClick = async (event: React.MouseEvent<HTMLButtonElement>, eventId: string) => {
        event.stopPropagation();

        if (!loadingFavorites.has(eventId)) {
            await toggleFavorite(eventId);
        }
    };

    return (
        <section className="flex w-full flex-col">
            <p className="text-display mb-[12px] w-full text-[20px]">Where your friends are going</p>

            {visibleEvents.map((event) => {
                const attendees = event.attendees.slice(0, 1);
                const remaining = Math.max(0, event.attendeeCount - attendees.length);
                const time = formatPreviewTime(event);

                return (
                    <div
                        key={event._id}
                        onClick={() => onClickEvent?.(event._id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(keyEvent) => {
                            if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                                keyEvent.preventDefault();
                                onClickEvent?.(event._id);
                            }
                        }}
                        className="flex h-[161px] w-full gap-[12px] border-b border-brand-soft px-[12px] py-[20px] text-left hover:bg-brand/[0.03]"
                    >
                        <FriendsEventImage image={event.event_image} title={event.title} />

                        <div className="flex h-[120px] min-w-0 flex-1 flex-col justify-between">
                            <div className="flex items-start justify-between gap-[6px]">
                                <span className="flex min-w-0 items-center gap-[4px] rounded-full bg-[var(--color-category-chip)] px-[8px] py-[4px] text-[12px] text-brand">
                                    <EventCategoryIcon className="h-[15px] w-[17px] shrink-0" />
                                    <span className="truncate">{getCategoryLabel(event.category)}</span>
                                </span>
                                <div className="flex items-center">
                                    {attendees.map((friend, index) => (
                                        <FriendAvatar
                                            key={friend.id || friend._id || index}
                                            avatar={friend.avatar || friend.profilePicture}
                                            username={friend.username}
                                            className="-mr-[4px] h-[25px] w-[25px] border-2 border-white"
                                            textClassName="text-[10px]"
                                        />
                                    ))}
                                    {remaining > 0 && <span className="-ml-[4px] flex h-[25px] min-w-[25px] items-center justify-center rounded-full border-2 border-white bg-surface-base px-[4px] text-[12px] text-brand">+{remaining}</span>}
                                </div>
                                <button
                                    type="button"
                                    onClick={(clickEvent) => void handleFavoriteClick(clickEvent, event._id)}
                                    disabled={loadingFavorites.has(event._id)}
                                    aria-label={isFavorite(event._id) ? 'Remove from favorites' : 'Add to favorites'}
                                    className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-surface-page shadow-app-sm disabled:opacity-60"
                                >
                                    {isFavorite(event._id) ? (
                                        <BookmarkFilledIcon className="h-[16px] w-[14px] text-accent" />
                                    ) : (
                                        <BookmarkOutlineIcon className="h-[16px] w-[14px] text-brand" />
                                    )}
                                </button>
                            </div>

                            <p className="mt-[8px] overflow-hidden text-ellipsis whitespace-nowrap text-[16px] font-[500] leading-[1.15] tracking-[-0.5px] text-brand">{event.title}</p>
                            <p className="mt-[3px] text-[12px] leading-none text-brand">{formatPreviewDate(event)}</p>
                            <p className="mt-[4px] truncate text-[12px] leading-none text-brand-soft">{event.address}</p>

                            <div className="mt-auto flex gap-[4px] text-[12px] text-brand">
                                {time && <span className="flex items-center gap-[4px] rounded-full bg-surface-base px-[6px] py-[4px] shadow-app-sm"><EventTimeIcon className="h-[14px] w-[14px]" />{time}</span>}
                                <span className="flex min-w-0 items-center gap-[4px] rounded-full bg-surface-base px-[6px] py-[4px] shadow-app-sm"><EventPriceIcon className="h-[14px] w-[14px] shrink-0" /><span className="truncate">{getPreviewPriceLabel(event)}</span></span>
                            </div>
                        </div>
                    </div>
                );
            })}

            {events.length > 1 && (
                <button
                    type="button"
                    onClick={() => setExpanded((value) => !value)}
                    className="mx-auto mt-[14px] text-[14px] tracking-[-0.28px] text-brand underline underline-offset-[3px]"
                >
                    {expanded ? 'Show less' : 'Show more'}
                </button>
            )}
        </section>
    );
}
