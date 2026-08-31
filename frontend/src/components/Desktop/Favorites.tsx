import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getEventImageUrl } from '../../utils/eventImage';
import FavoritesEmptyIllustration from '../Icons/FavoritesEmptyIllustration';
import { eventsService, favoritesService, getSessionSnapshot, readSessionUserId, subscribeToSession, userService } from '../../services';
import Skeleton from '../Common/Skeleton';
import { formatEventDateLabel, formatEventTimeLabel } from '../../utils/eventDateDisplay';
import { formatEventPriceLabel } from '../../utils/price';
import { BookmarkFilledIcon } from '../Icons/CommonIcons';
import { EventCategoryIcon, EventPriceIcon, EventTimeIcon } from '../Icons/EventIcons';
import FriendAvatar from './friends/FriendAvatar';
import { useFriendsData } from './friends/useFriendsData';
import { getCategoryLabel } from '../categoryTag';
import type { FriendActivityAttendee } from '../../services';

interface EventType {
    _id: string;
    title: string;
    description: string;
    event_date: string;
    date_display?: string;
    address: string;
    category: string;
    event_image?: string | string[];
    is_premium: boolean;
    price?: string | number;
    price_description?: string;
    status?: string;
}

interface Props {
    onClick?: (id: string) => void;
}

function FavoritesEventCard({
    _id,
    category,
    title,
    date,
    location,
    time,
    price,
    event_image,
    attendees = [],
    attendanceStatus,
    onClick,
}: {
    _id: string;
    category?: string;
    title?: string;
    date: string;
    location: string;
    time: string;
    price: string;
    event_image?: string | string[];
    attendees?: FriendActivityAttendee[];
    attendanceStatus?: 'Going' | 'Interested';
    onClick?: (id: string) => void;
}) {
    const imageUrl = getEventImageUrl(event_image, category);
    const primaryFriend = attendees[0];
    const remainingFriends = Math.max(0, attendees.length - 1);

    return (
        <button type="button" className="flex w-full gap-[14px] border-b border-brand-soft px-[14px] py-[16px] text-left hover:bg-[var(--color-surface-hover)]" onClick={() => onClick?.(_id)}>
            <div className="h-[120px] w-[120px] shrink-0 overflow-hidden rounded-[6px] bg-[var(--color-surface-placeholder)]">
                <img
                    src={imageUrl || '/mapa.svg'}
                    alt={title}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                        event.currentTarget.onerror = null;
                            event.currentTarget.src = '/mapa.svg';
                        event.currentTarget.className = 'w-full h-full object-contain p-4 opacity-80';
                    }}
                />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-[10px]">
                    <span className="flex min-w-0 items-center gap-[4px] rounded-full bg-[var(--color-category-chip)] px-[8px] py-[5px] text-[14px] leading-none text-brand">
                        <EventCategoryIcon className="h-[16px] w-[16px] shrink-0" />
                        <span className="truncate">{getCategoryLabel(category) || 'Event'}</span>
                    </span>
                    <div className="flex shrink-0 items-center gap-[7px]">
                        {primaryFriend && (
                            <div className="flex items-center">
                                <FriendAvatar avatar={primaryFriend.avatar || primaryFriend.profilePicture} username={primaryFriend.username} className="h-[31px] w-[31px] border-2 border-white" textClassName="text-[11px]" />
                                {remainingFriends > 0 && <span className="-ml-[5px] rounded-full bg-white px-[5px] py-[3px] text-[14px] text-brand shadow-app-sm">+{remainingFriends}</span>}
                            </div>
                        )}
                        <span className="flex h-[31px] w-[31px] items-center justify-center rounded-full bg-white shadow-app-sm"><BookmarkFilledIcon className="h-[17px] w-[15px] text-accent" /></span>
                    </div>
                </div>
                <p className="mt-[8px] truncate text-[17px] font-[500] leading-[1.1] tracking-[-0.45px] text-brand">{title}</p>
                <p className="mt-[5px] text-[15px] leading-none tracking-[-0.32px] text-brand">{date}</p>
                <p className="mt-[5px] truncate text-[14px] leading-none text-brand-muted">{location}</p>
                <div className="mt-auto flex flex-nowrap gap-[5px] text-[15px] text-brand">
                    {attendanceStatus && <span className="shrink-0 whitespace-nowrap rounded-full bg-white px-[6px] py-[4px] text-accent shadow-app-sm">✓ {attendanceStatus}</span>}
                    {time ? <span className="flex shrink-0 items-center gap-[4px] whitespace-nowrap rounded-full bg-white px-[6px] py-[4px] shadow-app-sm"><EventTimeIcon className="h-[17px] w-[17px]" />{time}</span> : null}
                    <span className="flex min-w-0 items-center gap-[4px] rounded-full bg-white px-[6px] py-[4px] shadow-app-sm"><EventPriceIcon className="h-[17px] w-[17px] shrink-0" /><span className="truncate">{price}</span></span>
                </div>
            </div>
        </button>
    );
}

const Favorites: React.FC<Props> = ({ onClick }) => {
    const [authenticated, setAuthenticated] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [favorites, setFavorites] = useState<EventType[]>([]);
    const [willAttendIds, setWillAttendIds] = useState<Set<string>>(new Set());
    const [mightAttendIds, setMightAttendIds] = useState<Set<string>>(new Set());
    const { authenticated: friendsAuthenticated, overview, loadOverview } = useFriendsData();

    useEffect(() => {
        if (friendsAuthenticated) {
            void loadOverview();
        }
    }, [friendsAuthenticated, loadOverview]);

    const getFavorites = useCallback(async () => {
        try {
            const { isAuthenticated } = getSessionSnapshot();
            const userId = readSessionUserId();

            if (!isAuthenticated || !userId) {
                setAuthenticated(false);
                setFavorites([]);
                setLoading(false);
                return;
            }

            setAuthenticated(true);
            const [favoritesList, willAttendEvents, mightAttendEvents] = await Promise.all([
                favoritesService.getFavoritesList(userId),
                userService.getAttendedEventsData('will_attend'),
                userService.getAttendedEventsData('might_attend'),
            ]);
            const enrichedFavorites = await Promise.all(
                favoritesList.map(async (favorite) => {
                    if (favorite.category) {
                        return favorite;
                    }

                    try {
                        return { ...favorite, ...(await eventsService.getEventDetails(favorite._id)) };
                    } catch {
                        return favorite;
                    }
                }),
            );

            setFavorites(enrichedFavorites);
            setWillAttendIds(new Set(willAttendEvents.map((event) => event._id)));
            setMightAttendIds(new Set(mightAttendEvents.map((event) => event._id)));
        } catch (error) {
            console.error('Error loading favorites:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void getFavorites();

        return subscribeToSession(() => {
            setLoading(true);
            void getFavorites();
        });
    }, [getFavorites]);

    return (
        <div
            className={`flex min-h-full w-full flex-col gap-[12px] md:h-full md:overflow-y-auto${
                loading || authenticated ? ' px-[16px] py-[24px]' : ''
            }`}
        >
            {loading ? (
                <div className="flex flex-col gap-3 px-[16px] py-[24px]">
                    <Skeleton width="100%" height="161px" borderRadius="12px" />
                    <Skeleton width="100%" height="161px" borderRadius="12px" />
                </div>
            ) : !authenticated ? (
                <div
                    className="flex min-h-full w-full flex-col px-[16px] py-[18px] md:h-full md:min-h-0"
                    style={{ minHeight: 'calc(100dvh - 5rem - env(safe-area-inset-bottom, 0px))' }}
                >
                    <h1 className="text-display text-[20px] text-brand">Favorites</h1>

                    <div className="flex min-h-0 flex-1 items-center justify-center">
                        <div className="flex w-full max-w-[360px] flex-col items-center rounded-[24px] px-[18px] py-[26px] text-center">
                            <img
                                src="/icons/group-136.svg"
                                alt=""
                                width={175}
                                height={191}
                                className="h-auto w-[min(175px,72vw)] shrink-0"
                            />
                            <p className="mt-[18px] text-[14px] leading-[1.35] tracking-[-0.28px] text-brand-muted">
                                Log in to save favorite events
                            </p>
                            <div className="mt-[12px] flex w-full justify-between">
                            <Link
                                to="/login"
                                className="flex h-[38px] w-[146px] items-center justify-center rounded-[12px] bg-accent-soft px-[20px] py-[12px] text-[14px] font-[400] tracking-[-0.28px] text-brand"
                            >
                                Log in
                            </Link>
                            <Link
                                to="/register"
                                className="flex h-[38px] w-[146px] items-center justify-center rounded-[12px] bg-brand px-[20px] py-[12px] text-[14px] font-[400] tracking-[-0.28px] text-surface-page"
                            >
                                Sign up
                            </Link>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <p className="text-display text-[24px] text-brand">
                        Favorites
                    </p>
                    {favorites.length === 0 ? (
                        <div className="flex w-full flex-1 flex-col items-center justify-center gap-[16px]">
                            <div className="flex w-full max-w-[390px] flex-col items-center gap-[8px] rounded-[12px] bg-accent-panel px-[36px] py-[20px]">
                                <FavoritesEmptyIllustration />

                                <div className="flex flex-col gap-[12px] w-full items-center">
                                    <span className="text-brand-muted text-[14px] font-[400] tracking-[-0.28px] text-center">
                                        You do not have any favorite events yet
                                    </span>

                                    <Link
                                        to="/"
                                        className="w-[152px] h-[38px] flex items-center justify-center rounded-[12px] bg-brand text-surface-base text-[14px] font-[400] tracking-[-0.28px]"
                                    >
                                        Go to search
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        favorites.map((event) => (
                            (() => {
                                const friendActivity = [...overview.willAttendEvents, ...overview.mightAttendEvents]
                                    .find((item) => item._id === event._id || item.id === event._id);

                                return (
                                    <FavoritesEventCard
                                        key={event._id}
                                        _id={event._id}
                                        category={event.category}
                                        title={event.title}
                                        date={formatEventDateLabel(event)}
                                        location={event.address}
                                        time={formatEventTimeLabel(event)}
                                        price={formatEventPriceLabel({
                                            price: event.price,
                                            priceDescription: event.price_description,
                                            isPremium: event.is_premium,
                                        })}
                                        event_image={event.event_image}
                                        attendees={friendActivity?.attendees}
                                        attendanceStatus={willAttendIds.has(event._id) ? 'Going' : mightAttendIds.has(event._id) ? 'Interested' : undefined}
                                        onClick={onClick}
                                    />
                                );
                            })()
                        ))
                    )}
                </>
            )}
        </div>
    );
};

export default Favorites;
