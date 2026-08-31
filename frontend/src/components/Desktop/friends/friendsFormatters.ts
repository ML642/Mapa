export const formatFriendCountLabel = (count: number) => {
    return `${count} ${count === 1 ? 'friend' : 'friends'}`;
};

export const formatMutualFriendsLabel = (count: number) => {
    if (count <= 0) {
        return 'No mutual friends';
    }

    return `${count} mutual ${count === 1 ? 'friend' : 'friends'}`;
};

export const formatFriendEventDate = (eventDate: string) =>
    new Date(eventDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
    });

export const formatFriendEventTime = (eventDate: string) =>
    new Date(eventDate).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
    });

import { formatEventPreviewPriceLabel } from '../../../utils/price';

export const formatFriendEventPrice = (price?: string | number, priceDescription?: string, isPremium?: boolean) => {
    return formatEventPreviewPriceLabel({
        price,
        priceDescription,
        isPremium,
    });
};
