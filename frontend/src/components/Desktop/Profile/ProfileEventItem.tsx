import type { KeyboardEvent, MouseEvent } from "react";
import { buildApiAssetUrl } from "../../../config";
import { useFavorites } from "../contexts/FavoriteContext";
import {
    BookmarkFilledIcon,
    BookmarkOutlineIcon,
} from "../../Icons/CommonIcons";
import { EventDateIcon, EventTimeIcon } from "../../Icons/EventIcons";
import type { Event } from "../../../services";
import { formatEventDateLabel, formatEventTimeLabel } from "../../../utils/eventDateDisplay";
import { getCategoryLabel } from "../../../components/categoryTag";

export default function ProfileEventItem({
    activeTab,
    event,
    onOpen,
}: {
    activeTab: "will_attend" | "might_attend";
    event: Event;
    onOpen: (eventId: string) => void;
}) {
    const { isFavorite, loadingFavorites, toggleFavorite } = useFavorites();
    const imageUrl = buildApiAssetUrl(event.event_image);
    const loading = loadingFavorites.has(event._id);
    const statusLabel = activeTab === "will_attend" ? "Going" : "Interested";
    const eventTime = formatEventTimeLabel(event, "Godzina");

    const handleFavoriteClick = async (targetEvent: MouseEvent<HTMLButtonElement>) => {
        targetEvent.stopPropagation();
        await toggleFavorite(event._id);
    };

    const handleKeyDown = (targetEvent: KeyboardEvent<HTMLDivElement>) => {
        if (targetEvent.key !== "Enter" && targetEvent.key !== " ") return;

        targetEvent.preventDefault();
        onOpen(event._id);
    };

    return (
        <div
            onClick={() => onOpen(event._id)}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            className="flex w-full cursor-pointer items-start gap-[12px] border-b border-[rgba(107,40,94,0.16)] px-[12px] py-[14px] text-left last:border-b-0 hover:bg-[rgba(255,245,252,0.7)]"
        >
            <div className="h-[122px] w-[118px] shrink-0 overflow-hidden rounded-[12px] bg-[var(--color-brand-surface)]">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={event.title}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/mapa.svg';
                            e.currentTarget.className = 'h-full w-full object-contain p-3 opacity-80';
                        }}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[var(--color-brand-surface)]">
                        <img src="/mapa.svg" alt="Grafika wydarzenia" className="h-[44px] w-[44px] object-contain opacity-80" />
                    </div>
                )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
                <div className="flex items-start justify-between gap-[10px]">
                    <span className="inline-flex min-w-0 max-w-full items-center rounded-full bg-[linear-gradient(90deg,rgba(215,160,247,0.85)_0%,rgba(243,164,248,0.92)_100%)] px-[10px] py-[5px] text-[12px] leading-none tracking-[-0.24px] text-brand">
                        <span className="truncate">{getCategoryLabel(event.category || "Event")}</span>
                    </span>

                    <button
                        type="button"
                        onClick={(targetEvent) => void handleFavoriteClick(targetEvent)}
                        disabled={loading}
                        className="flex h-[24px] w-[24px] shrink-0 items-center justify-center text-brand disabled:opacity-60"
                        aria-label={isFavorite(event._id) ? "Remove from favorites" : "Add to favorites"}
                    >
                        {isFavorite(event._id) ? (
                            <BookmarkFilledIcon className="h-[14px] w-[12px] text-brand" />
                        ) : (
                            <BookmarkOutlineIcon className="h-[14px] w-[12px] text-brand" />
                        )}
                    </button>
                </div>

                <div className="flex flex-col gap-[4px]">
                    <p className="line-clamp-2 text-[16px] leading-[1.2] tracking-[-0.48px] text-brand">
                        {event.title}
                    </p>
                    <div className="flex items-center gap-[6px] text-[14px] leading-none tracking-[-0.28px] text-brand">
                        <EventDateIcon className="h-[14px] w-[14px] shrink-0 text-brand-muted" />
                        <span className="truncate">{formatEventDateLabel(event, undefined, "Data zostanie podana")}</span>
                    </div>
                    <p className="line-clamp-1 text-[14px] leading-none tracking-[-0.28px] text-brand-muted">
                        {event.address || "Adres zostanie podany"}
                    </p>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-[8px]">
                    <span className="inline-flex items-center gap-[4px] rounded-full bg-[rgba(255,126,85,0.12)] px-[8px] py-[4px] text-[13px] leading-none tracking-[-0.26px] text-[var(--color-accent)]">
                        <span>✓</span>
                        <span>{statusLabel}</span>
                    </span>
                    {eventTime ? (
                        <span className="inline-flex items-center gap-[4px] rounded-full bg-white px-[8px] py-[4px] text-[13px] leading-none tracking-[-0.26px] text-brand shadow-[inset_0_0_0_1px_rgba(107,40,94,0.12)]">
                            <EventTimeIcon className="h-[14px] w-[14px] shrink-0 text-brand" />
                            <span>{eventTime}</span>
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
