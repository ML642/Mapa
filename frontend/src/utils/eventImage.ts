import { buildApiAssetUrl } from '../config';
import { getCategoryLabel } from '../components/categoryTag';

const EVENT_COVERS: Record<string, string> = {
    concert: '/event-covers/concert.png',
    concerts: '/event-covers/concert.png',
    performance: '/event-covers/performance.png',
    performances: '/event-covers/performance.png',
    theater: '/event-covers/performance.png',
    exhibition: '/event-covers/exhibition.png',
    exhibitions: '/event-covers/exhibition.png',
    festival: '/event-covers/festival.png',
    festivals: '/event-covers/festival.png',
    sports: '/event-covers/sport.png',
};

export function getEventImageUrl(eventImage?: string | string[], category?: string): string {
    const uploadedImageUrl = buildApiAssetUrl(eventImage);
    if (uploadedImageUrl) return uploadedImageUrl;

    const categoryLabel = getCategoryLabel(category).toLowerCase();
    return EVENT_COVERS[categoryLabel] || '/event-covers/festival.png';
}
