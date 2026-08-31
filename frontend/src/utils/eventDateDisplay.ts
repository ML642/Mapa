import type { Event } from '../services';

type EventDateInput = Pick<Event, 'date_display' | 'event_date' | 'isPermanent'>;

const isPermanentEvent = (event: EventDateInput) =>
    event.isPermanent === true ||
    event.date_display?.trim().toLocaleLowerCase('en-GB') === '\u043f\u043e\u0441\u0442\u043e\u044f\u043d\u043d\u043e\u0435';

export const formatEventDateLabel = (
    event: EventDateInput,
    options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long' },
    fallback = 'Date to be announced',
) => {
    if (isPermanentEvent(event)) {
        return 'Ongoing';
    }

    if (event.date_display) {
        return event.date_display;
    }

    if (!event.event_date) {
        return fallback;
    }

    const date = new Date(event.event_date);
    return Number.isNaN(date.getTime()) ? fallback : date.toLocaleDateString('en-GB', options);
};

export const formatEventTimeLabel = (
    event: EventDateInput,
    fallback = '',
) => {
    if (isPermanentEvent(event) || event.date_display) {
        return '';
    }

    if (!event.event_date) {
        return fallback;
    }

    const date = new Date(event.event_date);
    return Number.isNaN(date.getTime())
        ? fallback
        : date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};
