import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { MapLayerMouseEvent } from 'mapbox-gl';
import Map, { Marker, type MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_CONFIG } from '../../config';
import { eventsService } from '../../services';
import type { Event } from '../../services';
import {
    CATEGORY_ICONS,
    buildMapRenderItems,
    getClusterZoomTarget,
    getCategoryLabel,
    type MapEventCluster,
} from './mapClusters';
import MapMarkerVisual from './MapMarkerVisual';
import type { MobileFilterDetails } from '../Mobile/mobileDateRange';
import { filterEventsForMobile } from '../../utils/mobileEventFilters';

export interface SharedMapBoxMapProps {
    onEventClick: (id: string) => void;
    selectedCategories: string[];
    activeEventId: string | null;
    mobileFilterDetails?: MobileFilterDetails;
    friendsGoingEventIds?: Set<string>;
    friendsInterestedEventIds?: Set<string>;
}

interface BaseMapBoxMapProps extends SharedMapBoxMapProps {
    mapStyle: CSSProperties;
    clusterFlyDuration: number;
    onMapBackgroundClick?: () => void;
}

export default function BaseMapBoxMap({
    onEventClick,
    selectedCategories,
    activeEventId,
    mapStyle,
    clusterFlyDuration,
    onMapBackgroundClick,
    mobileFilterDetails,
    friendsGoingEventIds,
    friendsInterestedEventIds,
}: BaseMapBoxMapProps) {
    const [events, setEvents] = useState<Event[]>([]);
    const mapRef = useRef<MapRef | null>(null);
    const getClampedCenter = useCallback((longitude: number, latitude: number) => {
        const [west, south] = MAPBOX_CONFIG.SOFT_BOUNDS.SOUTH_WEST;
        const [east, north] = MAPBOX_CONFIG.SOFT_BOUNDS.NORTH_EAST;

        return {
            longitude: Math.min(Math.max(longitude, west), east),
            latitude: Math.min(Math.max(latitude, south), north),
        };
    }, []);
    const [viewState, setViewState] = useState<{ longitude: number; latitude: number; zoom: number }>({
        longitude: MAPBOX_CONFIG.DEFAULT_CENTER.lng,
        latitude: MAPBOX_CONFIG.DEFAULT_CENTER.lat,
        zoom: MAPBOX_CONFIG.DEFAULT_ZOOM,
    });

    useEffect(() => {
        const loadEvents = async () => {
            try {
                const eventsList = await eventsService.getMapEventsList();
                setEvents(eventsList);
            } catch (error) {
                console.error('Error loading events:', error);
            }
        };

        loadEvents();
    }, []);

    const configureTouchGestures = useCallback(() => {
        const map = mapRef.current?.getMap();
        if (!map) {
            return;
        }

        map.touchZoomRotate.enable();
        map.touchZoomRotate.disableRotation();
    }, []);

    const addCookieSettingsToAttribution = useCallback(() => {
        const map = mapRef.current?.getMap();
        if (!map) return;

        const attribution = map.getContainer().querySelector('.mapboxgl-ctrl-attrib-inner');
        if (!attribution || attribution.querySelector('[data-cookie-settings-control]')) return;

        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'Cookie settings';
        button.dataset.cookieSettingsControl = 'true';
        button.setAttribute('aria-label', 'Open cookie settings');
        button.style.cssText = 'margin-right:2px;padding:0;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer;text-decoration:underline;text-underline-offset:2px;';
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            window.dispatchEvent(new Event('mapa:open-cookie-settings'));
        });
        attribution.prepend(button);
    }, []);

    const filteredEvents = useMemo(() => {
        if (mobileFilterDetails) {
            return filterEventsForMobile(events, {
                categories: selectedCategories,
                details: mobileFilterDetails,
                friendsGoingEventIds,
                friendsInterestedEventIds,
            });
        }
        if (selectedCategories.length === 0) {
            return events;
        }

        return events.filter((event) => selectedCategories.includes(event.category));
    }, [events, friendsGoingEventIds, friendsInterestedEventIds, mobileFilterDetails, selectedCategories]);

    const mapItems = useMemo(
        () => buildMapRenderItems(filteredEvents, viewState.zoom, activeEventId),
        [activeEventId, filteredEvents, viewState.zoom]
    );

    const handleMarkerClick = useCallback(
        (event: Event) => {
            onEventClick(event._id);
        },
        [onEventClick]
    );

    const handleClusterClick = useCallback(
        (cluster: MapEventCluster) => {
            const targetZoom = getClusterZoomTarget(viewState.zoom, cluster.count);

            if (mapRef.current) {
                mapRef.current.flyTo({
                    center: [cluster.longitude, cluster.latitude],
                    zoom: targetZoom,
                    duration: clusterFlyDuration,
                    essential: true,
                });
                return;
            }

            setViewState((current) => ({
                longitude: cluster.longitude,
                latitude: cluster.latitude,
                zoom: getClusterZoomTarget(current.zoom, cluster.count),
            }));
        },
        [clusterFlyDuration, viewState.zoom]
    );

    const handleMapClick = useCallback(
        (event: MapLayerMouseEvent) => {
            if (!onMapBackgroundClick) {
                return;
            }

            const target = event.originalEvent?.target;
            if (target instanceof Element) {
                if (target.closest('.mapboxgl-marker') || target.closest('.mapboxgl-popup')) {
                    return;
                }
            }

            onMapBackgroundClick();
        },
        [onMapBackgroundClick]
    );

    const handleMoveEnd = useCallback(
        (event: { viewState: { longitude: number; latitude: number; zoom: number } }) => {
            const boundedCenter = getClampedCenter(event.viewState.longitude, event.viewState.latitude);
            const shouldSnapBack =
                boundedCenter.longitude !== event.viewState.longitude ||
                boundedCenter.latitude !== event.viewState.latitude;

            if (!shouldSnapBack) {
                return;
            }

            if (mapRef.current) {
                mapRef.current.easeTo({
                    center: [boundedCenter.longitude, boundedCenter.latitude],
                    duration: 650,
                    easing: (value) => 1 - Math.pow(1 - value, 3),
                    essential: true,
                });
                return;
            }

            setViewState((current) => ({
                ...current,
                longitude: boundedCenter.longitude,
                latitude: boundedCenter.latitude,
            }));
        },
        [getClampedCenter]
    );

    return (
        <Map
            ref={mapRef}
            {...viewState}
            maxBounds={[MAPBOX_CONFIG.HARD_BOUNDS.SOUTH_WEST, MAPBOX_CONFIG.HARD_BOUNDS.NORTH_EAST]}
            minZoom={MAPBOX_CONFIG.MIN_ZOOM}
            maxZoom={MAPBOX_CONFIG.MAX_ZOOM}
            dragRotate={false}
            pitchWithRotate={false}
            touchZoomRotate
            touchPitch={false}
            onMove={(event) =>
                setViewState({
                    longitude: event.viewState.longitude,
                    latitude: event.viewState.latitude,
                    zoom: event.viewState.zoom,
                })
            }
            onMoveEnd={handleMoveEnd}
            onClick={onMapBackgroundClick ? handleMapClick : undefined}
            onLoad={() => {
                configureTouchGestures();
                addCookieSettingsToAttribution();
            }}
            style={mapStyle}
            mapStyle={MAPBOX_CONFIG.STYLE}
            mapboxAccessToken={MAPBOX_CONFIG.ACCESS_TOKEN}
            language="en"
        >
            {mapItems.map((item) => {
                if (item.type === 'cluster') {
                    return (
                        <Marker
                            key={item.key}
                            longitude={item.longitude}
                            latitude={item.latitude}
                            anchor="center"
                            onClick={() => handleClusterClick(item)}
                        >
                            <MapMarkerVisual
                                kind="cluster"
                                count={item.count}
                                isActive={item.containsActiveEvent}
                            />
                        </Marker>
                    );
                }

                const icon = CATEGORY_ICONS[item.event.category] || '/icons/map/show.svg';

                return (
                    <Marker
                        key={item.key}
                        longitude={item.longitude}
                        latitude={item.latitude}
                        anchor="bottom"
                        onClick={() => handleMarkerClick(item.event)}
                    >
                        <MapMarkerVisual
                            kind="event"
                            icon={icon}
                            label={getCategoryLabel(item.event.category)}
                            isActive={item.containsActiveEvent}
                            offset={item.offset}
                            isSpiderfied={item.isSpiderfied}
                        />
                    </Marker>
                );
            })}
        </Map>
    );
}
