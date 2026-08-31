import type { MouseEvent } from 'react';
import {
    BookmarkFilledIcon,
    BookmarkOutlineIcon,
    PremiumRingIcon,
    ShareArrowIcon,
} from '../../../Icons/CommonIcons';
import { EventCategoryIcon } from '../../../Icons/EventIcons';
import { X } from 'lucide-react';
import { getCategoryLabel } from '../../../categoryTag';

interface EventCardHeaderProps {
    title?: string;
    category?: string;
    isPremium?: boolean;
    isFavorite: boolean;
    isFavoriteDisabled: boolean;
    favoriteAnimation: string;
    onShare: () => void;
    onFavorite: (event: MouseEvent<HTMLButtonElement>) => void;
    onClose?: () => void;
    hideFavorite?: boolean;
}

export default function EventCardHeader({
    title,
    category,
    isPremium,
    isFavorite,
    isFavoriteDisabled,
    favoriteAnimation,
    onShare,
    onFavorite,
    onClose,
    hideFavorite = false,
}: EventCardHeaderProps) {
    return (
        <div className="flex items-start gap-2 px-[20px] pt-[24px]">
            <div className="min-w-0 flex-1">
                <h2 className="mb-[16px] w-auto break-words text-[20px] font-[400] leading-[1.12] text-brand min-[380px]:text-[24px]" id="text-cool">
                    {title || 'Event title'}
                </h2>

                <div className="flex gap-2">
                    <div className="flex items-center justify-center gap-[4px] rounded-[36px] bg-[var(--color-category-chip)] p-[4px]">
                        <EventCategoryIcon className="h-[16px] w-[16px] text-brand" />
                        <p className="text-[12px] font-[400] text-brand">{getCategoryLabel(category) || 'Category'}</p>
                    </div>

                    {isPremium && (
                        <div className="flex items-center justify-center gap-[4px] rounded-[36px] bg-[var(--color-premium-chip)] p-[4px]">
                            <PremiumRingIcon className="h-[17px] w-[16px] text-brand" />
                            <p className="text-[12px] font-[400] text-brand">Premium</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex shrink-0 gap-[6px] min-[380px]:gap-2">
                <button
                    type="button"
                    onClick={onShare}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-page shadow-app-sm min-[380px]:h-[36px] min-[380px]:w-[36px]"
                >
                    <ShareArrowIcon className="h-4 w-4 text-brand min-[380px]:h-[18px] min-[380px]:w-[18px]" />
                </button>

                {!hideFavorite ? (
                    <button
                        type="button"
                        onClick={onFavorite}
                        className={`flex h-8 w-8 items-center justify-center rounded-full bg-surface-page shadow-app-sm transition-all duration-300 hover:scale-110 min-[380px]:h-[36px] min-[380px]:w-[36px] ${
                            favoriteAnimation === 'heartBeat'
                                ? 'animate-pulse scale-125'
                                : favoriteAnimation === 'heartReverse'
                                    ? 'animate-pulse scale-125'
                                    : favoriteAnimation === 'shake'
                                        ? 'animate-shake'
                                        : ''
                        }`}
                        disabled={isFavoriteDisabled}
                    >
                        {isFavorite ? (
                            <BookmarkFilledIcon className="text-accent transition-all duration-300 transform" />
                        ) : (
                            <BookmarkOutlineIcon className="text-brand transition-all duration-300 transform" />
                        )}
                    </button>
                ) : null}
                {onClose ? (
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-page shadow-app-sm min-[380px]:h-[36px] min-[380px]:w-[36px]"
                        aria-label="Close event card"
                    >
                        <X className="h-4 w-4 text-brand min-[380px]:h-[18px] min-[380px]:w-[18px]" />
                    </button>
                ) : null}
            </div>
        </div>
    );
}
