import type { Event } from '../../services';
import { formatEventDateLabel, formatEventTimeLabel } from '../../utils/eventDateDisplay';

type MobileEventDateInput = Pick<Event, 'date_display' | 'event_date' | 'isPermanent'>;

export const formatMobileEventDateLabel = (
    event: MobileEventDateInput,
    options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long' },
    fallback = 'Date to be announced',
) => {
    return formatEventDateLabel(event, options, fallback);
};

export const formatMobileEventTimeLabel = (
    event: MobileEventDateInput,
    fallback = '',
) => {
    return formatEventTimeLabel(event, fallback);
};
