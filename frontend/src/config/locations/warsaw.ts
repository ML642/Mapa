type MapBounds = {
  SOUTH_WEST: [number, number];
  NORTH_EAST: [number, number];
};

/**
 * Geographic defaults for the Warsaw edition of Mapa.
 * These are intentionally independent of legacy Belarus environment settings.
 */
export const WARSAW_MAP_CONFIG = {
  CITY: 'Warszawa',
  DEFAULT_CENTER: {
    lat: 52.2297,
    lng: 21.0122,
  },
  DEFAULT_ZOOM: 11.5,
  MIN_ZOOM: 10,
  MAX_ZOOM: 18,
  BASE_BOUNDS: {
    SOUTH_WEST: [20.8510, 52.0970],
    NORTH_EAST: [21.2720, 52.3670],
  } satisfies MapBounds,
  SOFT_BOUNDS: {
    SOUTH_WEST: [20.7900, 52.0500],
    NORTH_EAST: [21.3300, 52.4100],
  } satisfies MapBounds,
  HARD_BOUNDS: {
    SOUTH_WEST: [20.7200, 52.0000],
    NORTH_EAST: [21.4000, 52.4600],
  } satisfies MapBounds,
} as const;
