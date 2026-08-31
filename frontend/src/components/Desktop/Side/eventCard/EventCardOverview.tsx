import { useState } from 'react';
import { Globe2, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EventDateIcon, EventPhoneIcon, EventPriceIcon, EventTimeIcon } from '../../../Icons/EventIcons';
import { formatEventDateLabel, formatEventTimeLabel } from '../../../../utils/eventDateDisplay';
import EventCardComments from './EventCardComments';

interface EventCardOverviewProps {
    eventId: string;
    isAuthenticated: boolean;
    hasFriends: boolean;
    description?: string;
    eventDate?: string;
    dateDisplay?: string;
    isPermanent?: boolean;
    address?: string;
    isMobile?: boolean;
    priceLabel?: string | null;
    phone?: string;
    source?: string;
    routeMapImageUrl: string;
    onOpenYandex: () => void;
    onAddFriends: () => void;
    friendsTabActive?: boolean;
}

const DESCRIPTION_PREVIEW_LENGTH = 1000;
const FALLBACK_DESCRIPTION = 'No event description is available.';

const normalizePhoneItem = (value: string) => {
    let phone = value.trim();

    try {
        phone = decodeURIComponent(phone);
    } catch {
        phone = phone.replace(/%20/gi, ' ');
    }

    const compactPhone = phone
        .replace(/^tel:/i, '')
        .replace(/\u00a0/g, ' ')
        .trim()
        .replace(/^[^\d+]+/, '');
    const digits = compactPhone.replace(/\D/g, '');

    if (digits.length < 7) {
        return null;
    }

    return compactPhone.startsWith('+') ? `+${digits}` : digits;
};

const getPhoneItems = (phone?: string) =>
    Array.from(new Set(String(phone ?? '')
        .split(',')
        .map(normalizePhoneItem)
        .filter((item): item is string => Boolean(item))));

const getSourceUrl = (source?: string) => {
    try {
        const value = source?.trim() ?? '';
        const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
        return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
    } catch {
        return null;
    }
};

function EventCardFriendsSection({
    isAuthenticated,
    hasFriends,
    onAddFriends,
    friendsTabActive = false,
}: Pick<EventCardOverviewProps, 'isAuthenticated' | 'hasFriends' | 'onAddFriends' | 'friendsTabActive'>) {
    if (isAuthenticated && hasFriends) {
        return null;
    }

    const cardClassName = isAuthenticated ? 'w-full rounded-[8px] px-[16px]' : 'w-full rounded-[8px]';
    const contentClassName = isAuthenticated
        ? 'w-full items-start justify-center gap-[12px] px-[12px] py-[20px]'
        : 'w-full items-start justify-center gap-[12px] p-[20px]';

    return (
        <section id="event-card-friends-promo" className={friendsTabActive ? 'rounded-[12px] bg-[var(--color-brand-surface)] p-3' : ''}>
            <h3 className="mb-[12px] text-[20px] font-semibold text-brand" id="text-cool">
                Friends
            </h3>

            <div className={`promo-card ${cardClassName}`}>
                <div className={`flex flex-col ${contentClassName}`}>
                    <p
                        style={{ letterSpacing: '-0.48px' }}
                        className={`w-[92%] text-[12px] font-[400] ${
                            'text-brand tracking-[-0.48px]'
                        }`}
                    >
                        {isAuthenticated
                            ? 'Add friends to attend events together'
                            : 'Sign up to add friends and attend events together'}
                    </p>

                    {isAuthenticated ? (
                        <button
                            type="button"
                            onClick={onAddFriends}
                            className="btn-promo flex h-[39px] w-full items-center justify-center rounded-[12px] text-[12px] font-[400] tracking-[-0.48px]"
                        >
                            Add friends
                        </button>
                    ) : (
                        <Link
                            to="/register"
                            className="btn-promo flex h-[39px] w-full items-center justify-center rounded-[12px] text-[12px] font-[400] tracking-[-0.48px]"
                        >
                            Sign up
                        </Link>
                    )}
                </div>
            </div>
        </section>
    );
}

export default function EventCardOverview({
    eventId,
    isAuthenticated,
    hasFriends,
    description,
    eventDate,
    dateDisplay,
    isPermanent,
    address,
    isMobile = false,
    priceLabel,
    phone,
    source,
    routeMapImageUrl,
    onOpenYandex,
    onAddFriends,
    friendsTabActive,
}: EventCardOverviewProps) {
    const phoneItems = getPhoneItems(phone);
    const sourceUrl = getSourceUrl(source);
    const descriptionText = description?.trim() || FALLBACK_DESCRIPTION;
    const isLongDescription = descriptionText.length > DESCRIPTION_PREVIEW_LENGTH;
    const [expandedDescription, setExpandedDescription] = useState<string | null>(null);
    const isDescriptionExpanded = expandedDescription === descriptionText;
    const dateLabel = formatEventDateLabel(
        { event_date: eventDate ?? '', date_display: dateDisplay, isPermanent },
        { day: 'numeric', month: 'long' },
        '',
    );
    const timeLabel = formatEventTimeLabel({
        event_date: eventDate ?? '',
        date_display: dateDisplay,
        isPermanent,
    });

    const displayedDescription = isLongDescription && !isDescriptionExpanded
        ? `${descriptionText.slice(0, DESCRIPTION_PREVIEW_LENGTH)}…`
        : descriptionText;

    return (
        <div>
            <EventCardFriendsSection
                isAuthenticated={isAuthenticated}
                hasFriends={hasFriends}
                onAddFriends={onAddFriends}
                friendsTabActive={friendsTabActive}
            />

            {/* Contacts and route stay in the overview until dedicated tabs are brought back. */}
            <p id="event-card-about" className="mb-[12px] mt-[24px] scroll-mt-[210px] text-[20px] font-[500] text-brand">
                About the event
            </p>

            {(dateLabel || timeLabel || address || priceLabel) && (
                <div className="flex flex-col gap-[12px]">
                    {dateLabel && (
                        <span className="flex items-center gap-[4px] text-[12px]">
                            <EventDateIcon className="h-[16px] w-[16px] text-brand" />
                            <span className="w-full">{dateLabel}</span>
                        </span>
                    )}

                    {timeLabel && (
                        <span className="flex items-center gap-[4px] text-[12px]">
                            <EventTimeIcon className="h-[16px] w-[16px] text-brand" />
                            <span className="w-full">{timeLabel}</span>
                        </span>
                    )}

                    {address && (
                        <span className="flex items-start gap-[4px] text-[12px]">
                            <MapPin className="mt-px h-[16px] w-[16px] shrink-0 text-brand" />
                            <span className="w-full">{address}</span>
                        </span>
                    )}

                    {priceLabel && (
                        <span className="flex items-center gap-[4px] text-[12px]">
                            <EventPriceIcon className="h-[16px] w-[16px] text-brand" />
                            <span className="w-full">{priceLabel}</span>
                        </span>
                    )}
                </div>
            )}

            <p className="mt-[12px] text-[13px] font-[400]">
                {displayedDescription}
            </p>

            {isLongDescription && (
                <button
                    type="button"
                    onClick={() => setExpandedDescription((expanded) =>
                        expanded === descriptionText ? null : descriptionText,
                    )}
                    className="mt-[12px] flex items-center gap-[4px] text-[12px] font-[400] text-brand"
                    aria-expanded={isDescriptionExpanded}
                >
                    <span>{isDescriptionExpanded ? 'Show less' : 'Show more'}</span>
                    <span aria-hidden="true">›</span>
                </button>
            )}

            <EventCardComments eventId={eventId} isAuthenticated={isAuthenticated} />

            <p id="event-card-contacts" className="mb-[12px] mt-[24px] scroll-mt-[210px] text-[20px] font-[500] text-brand">
                Contact
            </p>

            {sourceUrl && (
                <a
                    href={sourceUrl.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-[4px] text-[12px] text-inherit hover:text-brand hover:underline"
                >
                    <Globe2 className="h-[16px] w-[16px] shrink-0 text-brand" aria-hidden="true" />
                    <span>  {sourceUrl.hostname}</span>
                </a>
            )}

            {phoneItems.length > 0 ? (
                <div className="mt-[12px] flex flex-col gap-[8px] text-[12px]">
                    {phoneItems.map((phoneItem) => (
                        <a
                            key={phoneItem}
                            href={`tel:${phoneItem}`}
                            className="flex items-center gap-[4px] text-inherit hover:text-brand"
                        >
                            <EventPhoneIcon className="h-[16px] w-[16px] text-brand" />
                            <span>{phoneItem}</span>
                        </a>
                    ))}
                </div>
            ) : (
                <span className="mt-[12px] flex items-center gap-[4px] text-[12px] text-[var(--color-text-muted)]">
                    <EventPhoneIcon className="h-[16px] w-[16px] text-brand" />
                    <span>No contact information available</span>
                </span>
            )}

            <p className="mb-[12px] mt-[24px] text-[20px] font-[500] text-brand" id="text-cool">
                {isMobile ? 'Location' : 'Route'}
            </p>

            <div className="relative h-[220px] w-[100%] max-w-[420px] overflow-hidden rounded-xl bg-[var(--color-surface-placeholder)] shadow-lg">
                {routeMapImageUrl ? (
                    <img
                        src={routeMapImageUrl}
                        alt="Map showing the event location"
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                    />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-white/10" aria-hidden="true" />

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                    <div className="rounded-xl bg-white/90 px-5 py-4 shadow-app-sm backdrop-blur-sm">
                        <MapPin className="mx-auto h-7 w-7 text-brand" aria-hidden="true" />
                        <p className="mt-2 max-w-[280px] text-[13px] text-brand">
                            {address || 'Open the route in Google Maps'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onOpenYandex}
                        className="rounded-2xl bg-white px-6 py-2 text-[14px] font-medium text-brand shadow-app-sm transition hover:bg-surface-base"
                    >
                        Get directions
                    </button>
                </div>

            </div>
        </div>
    );
}
