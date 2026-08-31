import type { Event } from '../services';
import type { MobileFilterDetails } from '../components/Mobile/mobileDateRange';
import { parseIsoDate } from '../components/Mobile/mobileDateRange';

export type MobileEventFilterContext = {
    categories: string[];
    details: MobileFilterDetails;
    friendsGoingEventIds?: Set<string>;
    friendsInterestedEventIds?: Set<string>;
};

const endOfDay = (date: Date) => {
    const value = new Date(date);
    value.setHours(23, 59, 59, 999);
    return value;
};

export const getMobileFilterDateRange = (details: MobileFilterDetails) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start: Date | null = null;
    let end: Date | null = null;

    if (details.dateFilter === 'today') {
        start = today;
        end = endOfDay(today);
    } else if (details.dateFilter === 'tomorrow') {
        start = new Date(today);
        start.setDate(start.getDate() + 1);
        end = endOfDay(start);
    } else if (details.dateFilter === 'weekend') {
        const day = today.getDay();
        const saturdayOffset = day === 0 ? 6 : 6 - day;
        start = new Date(today);
        start.setDate(start.getDate() + saturdayOffset);
        end = new Date(start);
        end.setDate(end.getDate() + 1);
        end = endOfDay(end);
    } else if (details.dateFilter === 'month') {
        start = today;
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (details.dateFilter === 'custom') {
        start = parseIsoDate(details.dateRange.start);
        const parsedEnd = parseIsoDate(details.dateRange.end);
        end = parsedEnd ? endOfDay(parsedEnd) : start ? endOfDay(start) : null;
    }

    return start && end ? { dateFrom: start.toISOString(), dateTo: end.toISOString() } : null;
};

const getEventPrice = (event: Event) => {
    const text = `${event.price ?? ''} ${event.price_description ?? ''}`.toLowerCase();
    if (!text.trim() || /бесплат|free/.test(text)) return 0;
    const match = text.replace(',', '.').match(/\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
};

const getMinutes = (value: string) => {
    const match = value.match(/(\d{1,2}):(\d{2})/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

export const filterEventsForMobile = (events: Event[], context: MobileEventFilterContext) => {
    const { categories, details, friendsGoingEventIds, friendsInterestedEventIds } = context;
    const dateRange = getMobileFilterDateRange(details);
    const startMinutes = getMinutes(details.timeStart);
    const endMinutes = getMinutes(details.timeEnd);
    const minPrice = details.priceMin ? Number(details.priceMin) : null;
    const maxPrice = details.priceMax ? Number(details.priceMax) : null;

    return events.filter((event) => {
        if (categories.length && !categories.includes(event.category)) return false;

        const eventDate = new Date(event.event_date);
        if (dateRange && (!Number.isFinite(eventDate.getTime()) || eventDate < new Date(dateRange.dateFrom) || eventDate > new Date(dateRange.dateTo))) return false;

        const eventMinutes = Number.isFinite(eventDate.getTime())
            ? eventDate.getHours() * 60 + eventDate.getMinutes()
            : getMinutes(event.date_display ?? '');
        if (startMinutes !== null && (eventMinutes === null || eventMinutes < startMinutes)) return false;
        if (endMinutes !== null && (eventMinutes === null || eventMinutes > endMinutes)) return false;

        const price = getEventPrice(event);
        if (minPrice !== null && (price === null || price < minPrice)) return false;
        if (maxPrice !== null && (price === null || price > maxPrice)) return false;

        if (details.friendsGoing && !friendsGoingEventIds?.has(event._id)) return false;
        if (details.friendsInterested && !friendsInterestedEventIds?.has(event._id)) return false;
        return true;
    });
};
