import { useEffect, useMemo, useRef, useState } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { InlineMessage } from '../../shared/ui';
import { MAPBOX_CONFIG } from '../../shared/config/env';

type EventCoordinates = [number, number];

type EventLocationPickerProps = {
  address: string;
  value: EventCoordinates | null;
  onChange: (value: EventCoordinates) => void;
};

type ViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
};

const DEFAULT_VIEW_STATE: ViewState = {
  longitude: MAPBOX_CONFIG.DEFAULT_CENTER.lng,
  latitude: MAPBOX_CONFIG.DEFAULT_CENTER.lat,
  zoom: MAPBOX_CONFIG.DEFAULT_ZOOM,
};

const areCoordinatesEqual = (left: EventCoordinates | null, right: EventCoordinates | null) =>
  Boolean(left && right && left[0] === right[0] && left[1] === right[1]);

const geocodeAddress = async (address: string, signal?: AbortSignal): Promise<EventCoordinates | null> => {
  if (!MAPBOX_CONFIG.ACCESS_TOKEN) {
    return null;
  }

  const query = new URLSearchParams({
    access_token: MAPBOX_CONFIG.ACCESS_TOKEN,
    autocomplete: 'false',
    country: MAPBOX_CONFIG.GEOCODING_COUNTRY,
    language: MAPBOX_CONFIG.GEOCODING_LANGUAGE,
    limit: '1',
  });

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?${query.toString()}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error('Mapbox geocoding request failed');
  }

  const payload = await response.json() as {
    features?: Array<{
      center?: [number, number];
    }>;
  };

  const center = payload.features?.[0]?.center;

  if (!Array.isArray(center) || center.length !== 2) {
    return null;
  }

  return [center[1], center[0]];
};

export const EventLocationPicker = ({
  address,
  value,
  onChange,
}: EventLocationPickerProps) => {
  const initialAddressRef = useRef<string | null>(null);
  const [viewState, setViewState] = useState<ViewState>(() => {
    if (!value) {
      return DEFAULT_VIEW_STATE;
    }

    return {
      longitude: value[1],
      latitude: value[0],
      zoom: Math.max(DEFAULT_VIEW_STATE.zoom, 14),
    };
  });
  const [geocodingStatus, setGeocodingStatus] = useState('');

  const markerPosition = useMemo(
    () => value
      ? { latitude: value[0], longitude: value[1] }
      : { latitude: DEFAULT_VIEW_STATE.latitude, longitude: DEFAULT_VIEW_STATE.longitude },
    [value],
  );

  useEffect(() => {
    if (!value) {
      return;
    }

    setViewState((current) => {
      const nextValue: EventCoordinates = [value[0], value[1]];
      const currentValue: EventCoordinates = [current.latitude, current.longitude];

      if (areCoordinatesEqual(currentValue, nextValue)) {
        return current;
      }

      return {
        ...current,
        latitude: value[0],
        longitude: value[1],
        zoom: Math.max(current.zoom, 14),
      };
    });
  }, [value]);

  useEffect(() => {
    const normalizedAddress = address.trim();

    if (initialAddressRef.current === null) {
      initialAddressRef.current = normalizedAddress;
      return;
    }

    if (!normalizedAddress || normalizedAddress === initialAddressRef.current) {
      return;
    }

    initialAddressRef.current = normalizedAddress;

    if (!MAPBOX_CONFIG.ACCESS_TOKEN) {
      setGeocodingStatus('Mapbox token is not configured, so automatic geocoding is unavailable.');
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setGeocodingStatus('Searching for the address on the map…');

      try {
        const coordinates = await geocodeAddress(normalizedAddress, controller.signal);

        if (!coordinates) {
          setGeocodingStatus('Address was not found. Move the marker manually if needed.');
          return;
        }

        onChange(coordinates);
        setGeocodingStatus('Coordinates updated from the address.');
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error(error);
        setGeocodingStatus('Failed to update coordinates from the address.');
      }
    }, 700);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [address, onChange]);

  if (!MAPBOX_CONFIG.ACCESS_TOKEN) {
    return (
      <InlineMessage title="Mapbox is not configured" tone="warning">
        Add `VITE_MAPBOX_ACCESS_TOKEN` to the admin environment to enable map-based coordinate editing.
      </InlineMessage>
    );
  }

  return (
    <div className="event-location-map">
      <div className="event-location-map__canvas">
        <Map
          {...viewState}
          dragRotate={false}
          mapStyle={MAPBOX_CONFIG.STYLE}
          mapboxAccessToken={MAPBOX_CONFIG.ACCESS_TOKEN}
          maxZoom={MAPBOX_CONFIG.MAX_ZOOM}
          minZoom={MAPBOX_CONFIG.MIN_ZOOM}
          onClick={(event) => onChange([event.lngLat.lat, event.lngLat.lng])}
          onMove={(event) =>
            setViewState({
              longitude: event.viewState.longitude,
              latitude: event.viewState.latitude,
              zoom: event.viewState.zoom,
            })
          }
          pitchWithRotate={false}
          reuseMaps
          style={{ width: '100%', height: '100%' }}
          touchZoomRotate={false}
        >
          <NavigationControl position="top-right" showCompass={false} />
          <Marker
            anchor="bottom"
            draggable
            latitude={markerPosition.latitude}
            longitude={markerPosition.longitude}
            onDragEnd={(event) => onChange([event.lngLat.lat, event.lngLat.lng])}
          >
            <div className="event-location-map__marker" />
          </Marker>
        </Map>
      </div>

      <div className="event-location-map__footer">
        <div>
          <strong>Coordinates</strong>
          <span>
            {markerPosition.latitude.toFixed(6)}, {markerPosition.longitude.toFixed(6)}
          </span>
        </div>
        <p>{geocodingStatus || 'Click on the map or drag the marker to adjust the point precisely.'}</p>
      </div>
    </div>
  );
};
