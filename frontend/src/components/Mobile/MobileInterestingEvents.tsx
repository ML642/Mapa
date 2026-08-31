import { useEffect, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import type { Event } from "../../services";
import { buildApiAssetUrl } from "../../config";
import { getCategoryLabel, getCategoryTagStyle } from "../categoryTag";
import { BookmarkFilledIcon, BookmarkOutlineIcon } from "../Icons/CommonIcons";
import { useFavorites } from "../Desktop/contexts/FavoriteContext";
import { formatEventDateLabel } from "../../utils/eventDateDisplay";
import { formatEventPreviewPriceLabel } from "../../utils/price";

type MobileInterestingEventsProps = {
    events: Event[];
    loading: boolean;
    onClick?: (id: string) => void;
    activeEventId?: string | null;
};

function MobileInterestingEventCard({
    event,
    onClick,
    active,
}: {
    event: Event;
    onClick?: (id: string) => void;
    active: boolean;
}) {
    const { isFavorite, toggleFavorite, loadingFavorites } = useFavorites();
    const [imageFailed, setImageFailed] = useState(false);
    const imageUrl = buildApiAssetUrl(event.event_image);
    const categoryTagStyle = getCategoryTagStyle(event.category);
    const dateLabel = formatEventDateLabel(event, { day: "numeric", month: "short" });
    const priceLabel = formatEventPreviewPriceLabel({
        price: event.price,
        priceDescription: event.price_description,
        isPremium: event.is_premium,
    });
    const favorite = isFavorite(event._id);
    const favoriteLoading = loadingFavorites.has(event._id);

    useEffect(() => {
        setImageFailed(false);
    }, [imageUrl]);

    const openEvent = () => onClick?.(event._id);

    const handleKeyDown = (eventKey: KeyboardEvent<HTMLDivElement>) => {
        if (eventKey.key !== "Enter" && eventKey.key !== " ") return;

        eventKey.preventDefault();
        openEvent();
    };

    const handleFavorite = (eventClick: MouseEvent<HTMLButtonElement>) => {
        eventClick.stopPropagation();
        void toggleFavorite(event._id);
    };

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={openEvent}
            onKeyDown={handleKeyDown}
            className={`relative h-[110px] w-[60vw] min-w-[192px] max-w-[228px] shrink-0 snap-start overflow-hidden rounded-[10px] bg-brand-surface outline-none transition-transform active:scale-[0.98] ${
                active ? "ring-2 ring-accent" : ""
            }`}
            aria-label={`Open event ${event.title}`}
        >
            {imageUrl && !imageFailed ? (
                <img
                    src={imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={() => setImageFailed(true)}
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-brand-tint">
                    <img src="/mapa.svg" alt="" className="h-[30px] w-[30px] opacity-70" draggable={false} />
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/5" aria-hidden />

            <div className="absolute left-[6px] right-[6px] top-[6px] flex min-w-0 items-start justify-between gap-[4px]">
                <div className="flex min-w-0 items-center gap-[4px]">
                    <span
                        className="flex h-[20px] min-w-0 items-center gap-[3px] rounded-full px-[6px] text-[9px] leading-none text-brand"
                        style={{ backgroundColor: categoryTagStyle.backgroundColor }}
                    >
                        {categoryTagStyle.icon ? <img src={categoryTagStyle.icon} alt="" className="h-[10px] w-[10px] shrink-0" /> : null}
                        <span className="truncate">{getCategoryLabel(event.category)}</span>
                    </span>
                    <span className="flex h-[20px] min-w-0 items-center rounded-full bg-white/90 px-[6px] text-[9px] leading-none text-brand">
                        <span className="truncate">{priceLabel}</span>
                    </span>
                </div>
                <button
                    type="button"
                    onClick={handleFavorite}
                    disabled={favoriteLoading}
                    className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-white/95 text-brand shadow-[0_1px_4px_rgba(87,34,75,0.16)] disabled:opacity-60"
                    aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
                >
                    {favorite ? <BookmarkFilledIcon className="text-accent" /> : <BookmarkOutlineIcon />}
                </button>
            </div>

            <div className="absolute inset-x-[7px] bottom-[7px] min-w-0 text-white">
                <p className="line-clamp-2 text-[11px] font-[500] leading-[13px]">{event.title}</p>
                <p className="mt-[3px] truncate text-[9px] leading-none text-white/85">{dateLabel}</p>
            </div>
        </div>
    );
}

export default function MobileInterestingEvents({
    events,
    loading,
    onClick,
    activeEventId,
}: MobileInterestingEventsProps) {
    return (
        <section className="w-full">
            <h2 className="text-display mb-[8px] w-full text-[20px] text-brand">Interesting events</h2>

            {loading ? (
                <div className="flex gap-[6px] overflow-hidden" aria-label="Loading interesting events">
                    {[0, 1].map((index) => <span key={index} className="h-[110px] w-[60vw] min-w-[192px] max-w-[228px] animate-pulse rounded-[10px] bg-brand-tint" />)}
                </div>
            ) : events.length > 0 ? (
                <div className="flex snap-x snap-mandatory gap-[6px] overflow-x-auto pb-[2px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {events.slice(0, 12).map((event) => (
                        <MobileInterestingEventCard
                            key={event._id}
                            event={event}
                            onClick={onClick}
                            active={event._id === activeEventId}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-[12px] text-brand-muted">There are no suggestions at the moment</p>
            )}
        </section>
    );
}
