const normalizeApiUrlValue = (value?: string | null) => value?.trim()?.replace(/\/+$/, '') ?? '';

const buildApiUrlCandidates = () => {
  const explicitApiUrl = normalizeApiUrlValue(import.meta.env.VITE_API_URL);

  if (explicitApiUrl) {
    return [explicitApiUrl];
  }

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    const localOrigins = [
      `http://${hostname}:3442`,
      `http://${hostname}:4000`,
    ];

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return localOrigins;
    }

    return [origin, ...localOrigins];
  }

  return ['http://localhost:3442', 'http://localhost:4000'];
};

const apiUrlCandidates = [...new Set(buildApiUrlCandidates().filter(Boolean))];
let resolvedApiUrl = apiUrlCandidates[0] ?? 'http://localhost:3442';

export const normalizeApiUrl = (value?: string | null) => normalizeApiUrlValue(value);

export const getApiUrl = () => resolvedApiUrl;

export const setResolvedApiUrl = (value: string) => {
  const nextValue = normalizeApiUrlValue(value);

  if (nextValue) {
    resolvedApiUrl = nextValue;
  }

  return resolvedApiUrl;
};

export const ENV = {
  get apiUrl() {
    return getApiUrl();
  },
  apiUrlCandidates,
  hasExplicitApiUrl: Boolean(normalizeApiUrlValue(import.meta.env.VITE_API_URL)),
  appName: 'Mapa Admin',
} as const;

export const MAPBOX_CONFIG = {
  ACCESS_TOKEN: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '',
  STYLE: import.meta.env.VITE_MAPBOX_STYLE || 'mapbox://styles/mapbox/streets-v12',
  DEFAULT_CENTER: {
    lat: parseFloat(import.meta.env.VITE_MAPBOX_DEFAULT_CENTER_LAT || '53.9045'),
    lng: parseFloat(import.meta.env.VITE_MAPBOX_DEFAULT_CENTER_LNG || '27.5615'),
  },
  DEFAULT_ZOOM: parseFloat(import.meta.env.VITE_MAPBOX_DEFAULT_ZOOM || '12'),
  MIN_ZOOM: parseFloat(import.meta.env.VITE_MAPBOX_MIN_ZOOM || '4'),
  MAX_ZOOM: parseFloat(import.meta.env.VITE_MAPBOX_MAX_ZOOM || '18'),
  GEOCODING_COUNTRY: import.meta.env.VITE_MAPBOX_GEOCODING_COUNTRY || 'by',
  GEOCODING_LANGUAGE: import.meta.env.VITE_MAPBOX_GEOCODING_LANGUAGE || 'ru',
} as const;

export const buildAssetUrl = (value?: string | string[] | null): string => {
  if (Array.isArray(value)) {
    const first = value.find((entry) => typeof entry === 'string' && entry.trim().length > 0);
    return buildAssetUrl(first);
  }

  if (!value) {
    return '';
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${getApiUrl()}/${value.replace(/^\/+/, '')}`;
};
