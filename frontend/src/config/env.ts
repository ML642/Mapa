const requireEnvironmentValue = (value: string | undefined, name: string) => {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return normalizedValue;
};

const API_BASE_URL = requireEnvironmentValue(import.meta.env.VITE_API_URL, 'VITE_API_URL');
const GOOGLE_CLIENT_ID = requireEnvironmentValue(import.meta.env.VITE_GOOGLE_CLIENT_ID, 'VITE_GOOGLE_CLIENT_ID');

// API Configuration
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 30000,
} as const;

type MapBounds = {
  SOUTH_WEST: [number, number];
  NORTH_EAST: [number, number];
};

type MapBoundsSideExpansion = {
  west: number;
  east: number;
  south: number;
  north: number;
};

const NORMALIZED_API_BASE_URL = API_CONFIG.BASE_URL.replace(/\/+$/, '');

export const buildApiAssetUrl = (path?: string | string[] | null): string => {
  if (Array.isArray(path)) {
    const firstItem = path.find((item): item is string => typeof item === 'string' && item.trim().length > 0);
    if (firstItem) {
      return buildApiAssetUrl(firstItem);
    }
    return '';
  }

  if (typeof path !== 'string' || !path) {
    return '';
  }

  const normalizedPath = path.trim();

  if (!normalizedPath) {
    return '';
  }

  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath;
  }

  return `${NORMALIZED_API_BASE_URL}/${normalizedPath.replace(/^\/+/, '')}`;
};

// MapBox Configuration
const createExpandedBounds = (bounds: MapBounds, expansion: MapBoundsSideExpansion): MapBounds => {
  const [west, south] = bounds.SOUTH_WEST;
  const [east, north] = bounds.NORTH_EAST;
  const lngSpan = east - west;
  const latSpan = north - south;

  return {
    SOUTH_WEST: [west - lngSpan * expansion.west, south - latSpan * expansion.south],
    NORTH_EAST: [east + lngSpan * expansion.east, north + latSpan * expansion.north],
  };
};

const addBoundsExpansionBuffer = (
  expansion: MapBoundsSideExpansion,
  buffer: number,
): MapBoundsSideExpansion => ({
  west: expansion.west + buffer,
  east: expansion.east + buffer,
  south: expansion.south + buffer,
  north: expansion.north + buffer,
});

const BELARUS_BOUNDS: MapBounds = {
  SOUTH_WEST: [
    parseFloat(import.meta.env.VITE_MAPBOX_BOUNDS_WEST || '23.1783'),
    parseFloat(import.meta.env.VITE_MAPBOX_BOUNDS_SOUTH || '51.2620'),
  ],
  NORTH_EAST: [
    parseFloat(import.meta.env.VITE_MAPBOX_BOUNDS_EAST || '32.7768'),
    parseFloat(import.meta.env.VITE_MAPBOX_BOUNDS_NORTH || '56.1722'),
  ],
};

const MAP_BOUNDS_EXPANSION_RATIO = parseFloat(import.meta.env.VITE_MAPBOX_BOUNDS_EXPANSION_RATIO || '0.8');
const MAP_BOUNDS_ELASTIC_BUFFER_RATIO = parseFloat(import.meta.env.VITE_MAPBOX_BOUNDS_ELASTIC_BUFFER_RATIO || '0.18');
const MAP_BOUNDS_BASE_SIDE_EXPANSION = MAP_BOUNDS_EXPANSION_RATIO / 2;
const MAP_BOUNDS_ELASTIC_BUFFER_SIDE_EXPANSION = MAP_BOUNDS_ELASTIC_BUFFER_RATIO / 2;
const MAP_BOUNDS_SIDE_EXPANSION: MapBoundsSideExpansion = {
  west: parseFloat(import.meta.env.VITE_MAPBOX_BOUNDS_WEST_EXPANSION_RATIO || '1.2'),
  east: parseFloat(import.meta.env.VITE_MAPBOX_BOUNDS_EAST_EXPANSION_RATIO || `${MAP_BOUNDS_BASE_SIDE_EXPANSION}`),
  south: parseFloat(import.meta.env.VITE_MAPBOX_BOUNDS_SOUTH_EXPANSION_RATIO || `${MAP_BOUNDS_BASE_SIDE_EXPANSION}`),
  north: parseFloat(import.meta.env.VITE_MAPBOX_BOUNDS_NORTH_EXPANSION_RATIO || `${MAP_BOUNDS_BASE_SIDE_EXPANSION}`),
};

const LEGACY_MAPBOX_CONFIG = {
  ACCESS_TOKEN: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '',
  STYLE: import.meta.env.VITE_MAPBOX_STYLE || '',
  DEFAULT_CENTER: {
    lat: parseFloat(import.meta.env.VITE_MAPBOX_DEFAULT_CENTER_LAT || '53.9045'),
    lng: parseFloat(import.meta.env.VITE_MAPBOX_DEFAULT_CENTER_LNG || '27.5615'),
  },
  DEFAULT_ZOOM: parseInt(import.meta.env.VITE_MAPBOX_DEFAULT_ZOOM || '12', 10),
  MIN_ZOOM: parseFloat(import.meta.env.VITE_MAPBOX_MIN_ZOOM || '5.8'),
  MAX_ZOOM: parseFloat(import.meta.env.VITE_MAPBOX_MAX_ZOOM || '18'),
  BASE_BOUNDS: BELARUS_BOUNDS,
  SOFT_BOUNDS: createExpandedBounds(BELARUS_BOUNDS, MAP_BOUNDS_SIDE_EXPANSION),
  HARD_BOUNDS: createExpandedBounds(
    BELARUS_BOUNDS,
    addBoundsExpansionBuffer(MAP_BOUNDS_SIDE_EXPANSION, MAP_BOUNDS_ELASTIC_BUFFER_SIDE_EXPANSION),
  ),
} as const;

void LEGACY_MAPBOX_CONFIG;

export const MAPBOX_CONFIG = {
  ACCESS_TOKEN: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '',
  STYLE: import.meta.env.VITE_MAPBOX_STYLE || '',
  ...WARSAW_MAP_CONFIG,
} as const;

export const MAPS_CONFIG = {
  GOOGLE_EMBED_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY || '',
  YANDEX_API_KEY: import.meta.env.VITE_YANDEX_MAPS_API_KEY || '',
} as const;

// Google Configuration
export const GOOGLE_CONFIG = {
  CLIENT_ID: GOOGLE_CLIENT_ID,
} as const;

// Social Share URLs
export const SOCIAL_SHARE_CONFIG = {
  TELEGRAM: import.meta.env.VITE_TELEGRAM_SHARE_URL || 'https://t.me/share/url',
  WHATSAPP: import.meta.env.VITE_WHATSAPP_SHARE_URL || 'https://wa.me/',
  VK: import.meta.env.VITE_VK_SHARE_URL || 'https://vk.com/share.php',
  INSTAGRAM: import.meta.env.VITE_INSTAGRAM_URL || 'https://www.instagram.com/',
  VIBER: 'viber://forward',
} as const;

// Site Meta
export const SITE_META = {
  TITLE: import.meta.env.VITE_SITE_TITLE || 'Events in Warsaw | Mapa',
  DESCRIPTION: import.meta.env.VITE_SITE_DESCRIPTION || 'Discover the most interesting events and places in Warsaw on one map.',
  OG_TITLE: import.meta.env.VITE_OG_TITLE || 'Events in Warsaw | Mapa',
  OG_DESCRIPTION: import.meta.env.VITE_OG_DESCRIPTION || 'Discover the most interesting events and places in Warsaw on one map.',
  SITE_URL: import.meta.env.VITE_SITE_URL || 'https://my-mapa.by',
} as const;
import { WARSAW_MAP_CONFIG } from './locations/warsaw';
