import { MAPBOX_CONFIG, MAPS_CONFIG } from '../config';

export interface MapBoxMarker {
  id: string;
  coordinates: [number, number]; // [lng, lat]
  title: string;
  category: string;
  icon?: string;
}

/**
 * MapBox Service
 */
export const mapboxService = {
  /**
   */
  initialize: () => {
    if (!MAPBOX_CONFIG.ACCESS_TOKEN) {
      console.error('Mapbox access token is not configured.');
      throw new Error('VITE_MAPBOX_ACCESS_TOKEN is required in .env');
    }
    return true;
  },

  /**
   */
  getDefaultConfig: () => ({
    accessToken: MAPBOX_CONFIG.ACCESS_TOKEN,
    style: MAPBOX_CONFIG.STYLE || 'mapbox://styles/mapbox/streets-v12',
    center: [MAPBOX_CONFIG.DEFAULT_CENTER.lng, MAPBOX_CONFIG.DEFAULT_CENTER.lat] as [number, number],
    zoom: MAPBOX_CONFIG.DEFAULT_ZOOM,
  }),

  /**
   */
  getRouteUrl: (lat: number, lng: number, title: string) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(title)}&hl=en`;
  },

  getYandexMapUrl: (lat: number, lng: number, title: string) => {
    const searchParams = new URLSearchParams({
      pt: `${lng},${lat}`,
      z: '17',
      l: 'map',
      text: title,
    });

    if (MAPS_CONFIG.YANDEX_API_KEY) {
      searchParams.set('apikey', MAPS_CONFIG.YANDEX_API_KEY);
    }

    return `https://yandex.ru/maps/?${searchParams.toString()}`;
  },

  getGoogleEmbedUrl: (lat: number, lng: number) => {
    if (!MAPS_CONFIG.GOOGLE_EMBED_API_KEY) {
      return '';
    }

    const searchParams = new URLSearchParams({
      key: MAPS_CONFIG.GOOGLE_EMBED_API_KEY,
      q: `${lat},${lng}`,
    });

    return `https://www.google.com/maps/embed/v1/place?${searchParams.toString()}`;
  },

  getStaticMapImageUrl: (lat: number, lng: number) => {
    if (!MAPBOX_CONFIG.ACCESS_TOKEN) return '';

    const marker = `pin-s+66235c(${lng},${lat})`;
    const center = `${lng},${lat},14`;
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${marker}/${center}/600x400?access_token=${encodeURIComponent(MAPBOX_CONFIG.ACCESS_TOKEN)}&attribution=false&logo=false`;
  },

  /**
   */
  openRoute: (lat: number, lng: number, title: string) => {
    const url = mapboxService.getRouteUrl(lat, lng, title);
    window.open(url, '_blank');
  },
};

