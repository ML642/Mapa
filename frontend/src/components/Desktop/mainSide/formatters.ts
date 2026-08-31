import type { Event } from '../../../services';
import { formatEventDateLabel, formatEventTimeLabel } from '../../../utils/eventDateDisplay';
import { formatEventPreviewPriceLabel } from '../../../utils/price';

export const MAIN_SIDE_TABS = ['Today', 'Tomorrow', 'Weekend', 'This month'] as const;

export type MainSideTab = (typeof MAIN_SIDE_TABS)[number];

export const getDateRangeForTab = (tab: MainSideTab) => {
    const today = new Date();
    const start = new Date();
    const end = new Date();

    switch (tab) {
        case 'Today':
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'Tomorrow':
            start.setDate(today.getDate() + 1);
            start.setHours(0, 0, 0, 0);
            end.setDate(today.getDate() + 1);
            end.setHours(23, 59, 59, 999);
            break;
        case 'Weekend': {
            const day = today.getDay();
            const saturdayOffset = day === 0 ? -1 : (6 - day);
            const sundayOffset = saturdayOffset + 1;
            start.setDate(today.getDate() + saturdayOffset);
            start.setHours(0, 0, 0, 0);
            end.setDate(today.getDate() + sundayOffset);
            end.setHours(23, 59, 59, 999);
            break;
        }
        case 'This month':
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end.setMonth(today.getMonth() + 1);
            end.setDate(0);
            end.setHours(23, 59, 59, 999);
            break;
    }

    return {
        dateFrom: start.toISOString(),
        dateTo: end.toISOString(),
    };
};

export const formatPreviewDate = (event: Pick<Event, 'date_display' | 'event_date' | 'isPermanent'>) => {
    return formatEventDateLabel(event, {
        day: '2-digit',
        month: 'long',
    });
};

export const formatPreviewTime = (event: Pick<Event, 'date_display' | 'event_date' | 'isPermanent'>) =>
    formatEventTimeLabel(event);

export const getPreviewPriceLabel = (event: Pick<Event, 'price' | 'price_description' | 'is_premium'>) => {
    return formatEventPreviewPriceLabel({
        price: event.price,
        priceDescription: event.price_description,
        isPremium: event.is_premium,
    });
};
