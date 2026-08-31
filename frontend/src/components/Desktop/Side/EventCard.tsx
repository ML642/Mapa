import { X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type MouseEvent, type TouchEvent as ReactTouchEvent } from "react";
import { motion, useDragControls } from "framer-motion";
import { useShareEventModal } from "../contexts/ShareEventContext";
import { getEventImageUrl } from "../../../utils/eventImage";
import { mapboxService } from "../../../services/mapboxService";
import { useFavorites } from "../contexts/FavoriteContext";
import { useFriendModal } from "../contexts/AddFriendsContext";
import EventCardAttendanceActions from "./eventCard/EventCardAttendanceActions";
import EventAttendanceModal from "./eventCard/EventAttendanceModal";
import EventCardHeader from "./eventCard/EventCardHeader";
import EventCardMedia from "./eventCard/EventCardMedia";
import EventCardOverview from "./eventCard/EventCardOverview";
import EventCardFriendsTab from './eventCard/EventCardFriendsTab';
import EventCardFriendsOverview from './eventCard/EventCardFriendsOverview';
import EventCardSkeleton from "./eventCard/EventCardSkeleton";
import { useEventCardData, type EventAttendancePlan } from "./eventCard/useEventCardData";
import { useEventCardFriends } from "./eventCard/useEventCardFriends";
import { formatEventPriceLabel } from '../../../utils/price';
import { useIsMobile } from "../../../hooks/useResponsiveLayout";
import { PERSONALIZED_RECOMMENDATIONS_QUERY_KEY, userService } from "../../../services";

export interface EventCardProps {
    onClose?: () => void;
    eventId?: string;
    desktopContainerClassName?: string;
}

const DEFAULT_DESKTOP_CONTAINER_CLASS_NAME =
    "absolute z-30 flex flex-col left-[528px] top-[80px] bottom-[12px] w-[393px] rounded-[20px] overflow-hidden shadow-lg";
const MOBILE_CARD_BOTTOM_PADDING = "max(24px, env(safe-area-inset-bottom, 0px))";
const MOBILE_CARD_PULL_CLOSE_PX = 92;
const MOBILE_CARD_PULL_MAX_PX = 180;

const getPriceLabel = (price?: string | number | null, priceDescription?: string | null, isPremium?: boolean) => {
    return formatEventPriceLabel({
        price,
        priceDescription,
        isPremium,
    });
};
export default function EventCard({
    onClose,
    eventId,
    desktopContainerClassName = DEFAULT_DESKTOP_CONTAINER_CLASS_NAME,
}: EventCardProps) {
    const queryClient = useQueryClient();
    const isMobile = useIsMobile();
    const [favoriteAnimation, setFavoriteAnimation] = useState('');
    const [contentTab, setContentTab] = useState<'overview' | 'friends'>('overview');
    const [attendanceModal, setAttendanceModal] = useState<{
        attendance: EventAttendancePlan;
        isEditing: boolean;
    } | null>(null);
    const dragControls = useDragControls();

    const {
        eventData,
        loading,
        error,
        attendance,
        isAttendanceUpdating,
        saveAttendance,
        removeAttendance,
    } = useEventCardData(eventId);
    const { friends, friendsOverview, isAuthenticated } = useEventCardFriends();
    const { isFavorite, toggleFavorite, loadingFavorites } = useFavorites();
    const { openAddFriendsModal } = useFriendModal();
    const { openShareEventModal } = useShareEventModal();
    const cardScrollRef = useRef<HTMLDivElement | null>(null);
    const cardOuterRef = useRef<HTMLDivElement | null>(null);
	const cardPullStartYRef = useRef<number | null>(null);
	const cardPullClosingRef = useRef(false);
	const cardPullOffsetRef = useRef(0);
	const [cardPullOffset, setCardPullOffset] = useState(0);
    const [isCardPulling, setIsCardPulling] = useState(false);
    const [isHeaderPinned, setIsHeaderPinned] = useState(false);

    useEffect(() => {
        if (!eventId || !eventData || !isAuthenticated) return;

        void userService.addViewHistoryItem(eventId).catch(() => {
            // Viewing history must not prevent opening an event card.
        });
    }, [eventData, eventId, isAuthenticated]);

	const setCardPullDistance = (value: number) => {
		const nextValue = Math.min(MOBILE_CARD_PULL_MAX_PX, Math.max(0, value));
		cardPullOffsetRef.current = nextValue;
		setCardPullOffset(nextValue);
	};

	const handleMobileCardTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
		if (!isMobile || event.touches.length !== 1 || event.currentTarget.scrollTop > 0) return;
		cardPullStartYRef.current = event.touches[0].clientY;
		setIsCardPulling(true);
	};

	const handleMobileCardTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
		const startY = cardPullStartYRef.current;
		if (!isMobile || startY === null || cardPullClosingRef.current) return;
		if (event.currentTarget.scrollTop > 0) {
			cardPullStartYRef.current = null;
			return;
		}

		const pullDistance = event.touches[0].clientY - startY;
		if (pullDistance <= 0) return;

		if (event.cancelable) event.preventDefault();
		setCardPullDistance(pullDistance * 0.58);
	};

	const finishMobileCardPull = () => {
		cardPullStartYRef.current = null;
		setIsCardPulling(false);

		if (cardPullOffsetRef.current >= MOBILE_CARD_PULL_CLOSE_PX) {
			cardPullClosingRef.current = true;
			cardPullOffsetRef.current = window.innerHeight;
			setCardPullOffset(window.innerHeight);
			window.setTimeout(() => onClose?.(), 280);
			return;
		}

		setCardPullDistance(0);
	};

	const resetMobileCardPull = () => {
		cardPullStartYRef.current = null;
		setIsCardPulling(false);
		if (!cardPullClosingRef.current) setCardPullDistance(0);
	};

    const handleFavoriteClick = async (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        if (!eventId || loadingFavorites.has(eventId)) return;

        const newFavoriteState = !isFavorite(eventId);

        setFavoriteAnimation(newFavoriteState ? 'heartBeat' : 'heartReverse');
        setTimeout(() => setFavoriteAnimation(''), 600);

        try {
            await toggleFavorite(eventId);
        } catch (error) {
            console.error('Error updating favorites:', error);
            setFavoriteAnimation('shake');
            setTimeout(() => setFavoriteAnimation(''), 600);
        }
    };

    useEffect(() => {
        const outerEl = cardOuterRef.current;
        if (!outerEl) return;

        const handleWheel = (event: WheelEvent) => {
            const scrollElement = cardScrollRef.current;
            if (!scrollElement || event.deltaY === 0) return;

            const target = event.target instanceof HTMLElement ? event.target : null;
            if (target?.closest("iframe")) return;

            const maxScrollTop = scrollElement.scrollHeight - scrollElement.clientHeight;
            if (maxScrollTop <= 0) return;

            const nextScrollTop = Math.max(0, Math.min(scrollElement.scrollTop + event.deltaY, maxScrollTop));
            if (nextScrollTop === scrollElement.scrollTop) return;

            scrollElement.scrollTop = nextScrollTop;
            event.preventDefault();
        };

        outerEl.addEventListener('wheel', handleWheel, { passive: false });
        return () => outerEl.removeEventListener('wheel', handleWheel);
    }, []);

    const [lat, lon] = eventData?.coordinates ?? [52.2297, 21.0122];

    const handleOpenYandex = () => {
        const url = mapboxService.getRouteUrl(lat, lon, eventData?.title || "");
        window.open(url, "_blank");
    };

    const googleEmbedUrl = mapboxService.getGoogleEmbedUrl(lat, lon);
    const eventImageUrl = getEventImageUrl(eventData?.event_image, eventData?.category);
    const priceLabel = getPriceLabel(eventData?.price, eventData?.price_description, eventData?.is_premium);
    const isFavoriteDisabled = loading || !eventId || loadingFavorites.has(eventId);
    const eventFriendsWillAttend = friendsOverview?.willAttendEvents
        .find((event) => event._id === eventId || event.id === eventId)?.attendees ?? [];
    const eventFriendsMightAttend = friendsOverview?.mightAttendEvents
        .find((event) => event._id === eventId || event.id === eventId)?.attendees ?? [];

    useEffect(() => {
        setContentTab('overview');
        setAttendanceModal(null);
        setIsHeaderPinned(false);
    }, [eventId]);

    useEffect(() => {
        if (!eventId || !eventData || !isAuthenticated) return;

        void userService.addViewHistoryItem(eventId)
            .then(() => queryClient.invalidateQueries({ queryKey: PERSONALIZED_RECOMMENDATIONS_QUERY_KEY }))
            .catch(() => undefined);
    }, [eventData, eventId, isAuthenticated, queryClient]);

    const handleSelectAttendanceStatus = (state: 'will_attend' | 'might_attend') => {
        setAttendanceModal({
            attendance: { state, plannedDate: '', plannedTime: '' },
            isEditing: false,
        });
    };

    const handleEditAttendance = () => {
        setAttendanceModal({ attendance, isEditing: true });
    };

    const handleSaveAttendance = async (nextAttendance: EventAttendancePlan) => {
        await saveAttendance(nextAttendance);
        setAttendanceModal(null);
    };

    const handleDeleteAttendance = async () => {
        try {
            await removeAttendance();
        } catch (deleteError) {
            console.error('Failed to delete attendance:', deleteError);
        }
    };

    const scrollToOverviewSection = (sectionId: string) => {
        setContentTab('overview');
        window.requestAnimationFrame(() => {
            cardScrollRef.current?.querySelector<HTMLElement>(`#${sectionId}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    };

    const handleFriendsTabClick = () => {
        setContentTab('friends');
        if (!isAuthenticated) {
            window.requestAnimationFrame(() => {
                cardScrollRef.current?.querySelector<HTMLElement>('#event-card-friends-promo')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        }
    };
    
    if (!eventId) {
        return null;
    }

    // if (loading) {
    //     return (
    //         <div className={isMobile ? "fixed z-50 bg-white inset-0 w-full h-full" : desktopContainerClassName}>
    //             <EventCardSkeleton isMobile={isMobile} />
    //         </div>
    //     );
    // }

    if (error) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute z-30 flex flex-col left-[528px] bottom-[12px] w-[393px] h-[791px] rounded-[20px] overflow-hidden shadow-lg bg-white"
            >
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 shadow"
                    >
                        <X size={20} />
                    </button>
                )}
                <div className="flex items-center justify-center h-full">
                    <p className="text-red-500">{error}</p>
                </div>
            </motion.div>
        );
    }

    return (

        <motion.div
            ref={cardOuterRef}
            initial={isMobile ? { y: "100%" } : { opacity: 0, y: 40 }}
            animate={isMobile ? { y: 0, opacity: 1 } : { opacity: 1, y: 0 }}
            exit={isMobile ? { y: "100%" } : { opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            key={eventId}
            drag={isMobile ? "y" : false}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.4}
			style={isMobile ? {
				translate: `0 ${cardPullOffset}px`,
				transition: isCardPulling ? "none" : "translate 280ms cubic-bezier(0.22, 1, 0.36, 1)",
			} : undefined}
            onDragEnd={(_, info) => {
                if (isMobile && info.offset.y > 100) {
                    onClose?.();
                }
            }}
            className={`
            flex flex-col overflow-hidden
            ${isMobile
                    ? "fixed z-50 bg-white inset-0 w-full h-full rounded-none"
                    : desktopContainerClassName
                }
        `}
        >
           {loading ? (
                <EventCardSkeleton isMobile={isMobile} />
            ) : error ? (
                <div className="relative flex items-center justify-center h-full p-5">
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 shadow"
                        >
                            <X size={20} />
                        </button>
                    )}
                    <p className="text-red-500">{error}</p>
                </div>
            ) : (
                <>
                    {isMobile ? (
                        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center pt-[max(8px,env(safe-area-inset-top,0px))]">
                            <button
                                type="button"
                                className="pointer-events-auto flex h-10 w-24 items-start justify-center bg-transparent pt-1 touch-none outline-none"
                                aria-label="Pull down to close the event card"
                                onPointerDown={(event) => dragControls.start(event)}
                            >
                                <span className="pointer-events-none h-1 w-10 rounded-full bg-white/80 shadow-sm" />
                            </button>
                        </div>
                    ) : null}

                    <div
                        ref={cardScrollRef}
                        className="flex h-full flex-col overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]"
                        style={isMobile ? { paddingBottom: MOBILE_CARD_BOTTOM_PADDING, touchAction: "pan-y" } : undefined}
                        onScroll={(event) => {
                            if (!isMobile) setIsHeaderPinned(event.currentTarget.scrollTop >= 398);
                        }}
						onTouchStart={handleMobileCardTouchStart}
						onTouchMove={handleMobileCardTouchMove}
						onTouchEnd={finishMobileCardPull}
						onTouchCancel={resetMobileCardPull}
                    >
                        <EventCardMedia eventImageUrl={eventImageUrl} title={eventData?.title} onClose={onClose} />

                        <div className="relative -mt-[12px] flex flex-col rounded-t-[20px] bg-white">
                            <div className={`sticky top-0 z-20 rounded-t-[20px] bg-white ${isHeaderPinned ? 'shadow-md' : ''}`}>
                            <EventCardHeader
                                title={eventData?.title}
                                category={eventData?.category}
                                isPremium={eventData?.is_premium}
                                isFavorite={eventId ? isFavorite(eventId) : false}
                                isFavoriteDisabled={isFavoriteDisabled}
                                favoriteAnimation={favoriteAnimation}
                                onShare={openShareEventModal}
                                    onFavorite={handleFavoriteClick}
                                    onClose={!isMobile && isHeaderPinned ? onClose : undefined}
                                    hideFavorite={!isMobile && isHeaderPinned}
                                />

                            <EventCardAttendanceActions
                                isAuthenticated={isAuthenticated}
                                attendance={attendance}
                                isUpdating={isAttendanceUpdating}
                                onSelectStatus={handleSelectAttendanceStatus}
                                onEdit={handleEditAttendance}
                                onDelete={handleDeleteAttendance}
                            />

                            <nav className="mt-[18px] grid grid-cols-4 border-b border-brand-soft" aria-label="Event sections">
                                <button type="button" onClick={() => scrollToOverviewSection('event-card-about')} className={`border-b-2 px-1 pb-3 text-[11px] ${contentTab === 'overview' ? 'border-brand text-brand' : 'border-transparent text-brand/45'}`}>Overview</button>
                                <button type="button" onClick={handleFriendsTabClick} className={`border-b-2 px-1 pb-3 text-[11px] ${contentTab === 'friends' ? 'border-brand text-brand' : 'border-transparent text-brand/45'}`}>Friends</button>
                                <button type="button" onClick={() => scrollToOverviewSection('event-card-about')} className="border-b-2 border-transparent px-1 pb-3 text-[11px] text-brand/45">About</button>
                                <button type="button" onClick={() => scrollToOverviewSection('event-card-contacts')} className="border-b-2 border-transparent px-1 pb-3 text-[11px] text-brand/45">Contacts</button>
                            </nav>
                            </div>

                            {contentTab === 'friends' && isAuthenticated ? (
                                <EventCardFriendsTab willAttend={eventFriendsWillAttend} mightAttend={eventFriendsMightAttend} />
                            ) : (
                                <>
                                    {isAuthenticated && (
                                        <EventCardFriendsOverview
                                            willAttend={eventFriendsWillAttend}
                                            mightAttend={eventFriendsMightAttend}
                                            onOpenFriends={handleFriendsTabClick}
                                        />
                                    )}
                                    <div className="px-5 py-4">
                                        <EventCardOverview
                                            eventId={eventId}
                                            isAuthenticated={isAuthenticated}
                                            hasFriends={friends.length > 0}
                                            friendsTabActive={contentTab === 'friends'}
                                            description={eventData?.description}
                                            eventDate={eventData?.event_date}
                                            dateDisplay={eventData?.date_display}
                                            isPermanent={eventData?.isPermanent}
                                            address={eventData?.address}
                                            isMobile={isMobile}
                                            priceLabel={eventData?.event_date || eventData?.isPermanent ? priceLabel : null}
                                            phone={eventData?.phone}
                                            source={eventData?.source}
                                            googleEmbedUrl={googleEmbedUrl}
                                            onOpenYandex={handleOpenYandex}
                                            onAddFriends={openAddFriendsModal}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    {attendanceModal ? (
                        <EventAttendanceModal
                            open
                            initialAttendance={attendanceModal.attendance}
                            isEditing={attendanceModal.isEditing}
                            isSaving={isAttendanceUpdating}
                            onClose={() => setAttendanceModal(null)}
                            onSave={handleSaveAttendance}
                        />
                    ) : null}
                </>
            )}
        </motion.div>
    );
}

