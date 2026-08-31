import type { Event } from '../../services';

const CATEGORY_LABELS: Record<string, string> = {
  'Выставка': 'Exhibition',
  'Музыка': 'Music',
  'Театр': 'Theater',
  'Фестиваль': 'Festival',
  'Музей': 'Museum',
  'Спорт': 'Sports',
  'Кино': 'Cinema',
  'Клуб': 'Club',
  'Квест': 'Quest',
  'Образование': 'Education',
  'Экскурсия': 'Tour',
  'Для детей': 'For children',
  'Шоу': 'Show',
};

export const getCategoryLabel = (category: string) => CATEGORY_LABELS[category] ?? category;

export const CATEGORY_ICONS: Record<string, string> = {
  'Выставка': '/icons/map/exhibitions.svg',
  'Музыка': '/icons/map/music.svg',
  'Театр': '/icons/map/theatre.svg',
  'Фестиваль': '/icons/map/festival.svg',
  'Музей': '/icons/map/museum.svg',
  'Спорт': '/icons/map/sport.svg',
  'Кино': '/icons/map/cinema.svg',
  'Клуб': '/icons/map/clubs.svg',
  'Квест': '/icons/map/quests.svg',
  'Образование': '/icons/map/education.svg',
  'Экскурсия': '/icons/map/excursion.svg',
  'Для детей': '/icons/map/children.svg',
  'Шоу': '/icons/map/show.svg',
};

const TILE_SIZE = 512;
const MAX_MERCATOR_LATITUDE = 85.05112878;
const OVERLAP_DISTANCE_PX = 36;
const CIRCLE_SPIDERFY_LIMIT = 8;
const SPIDERFY_BASE_RADIUS_PX = 22;
const SPIDERFY_MAX_RADIUS_PX = 56;
const SPIDERFY_VERTICAL_BIAS_PX = -10;

export const CLUSTER_BREAK_ZOOM = 16;

type MarkerOffset = [number, number];

type ProjectedEvent = {
  event: Event;
  latitude: number;
  longitude: number;
  x: number;
  y: number;
  isActive: boolean;
};

type ProjectedGroup = {
  members: ProjectedEvent[];
  centerX: number;
  centerY: number;
  latitude: number;
  longitude: number;
  containsActiveEvent: boolean;
};

export type MapEventMarker = {
  type: 'event';
  key: string;
  latitude: number;
  longitude: number;
  event: Event;
  count: 1;
  containsActiveEvent: boolean;
  offset?: MarkerOffset;
  isSpiderfied: boolean;
  overlapCount: number;
};

export type MapEventCluster = {
  type: 'cluster';
  key: string;
  latitude: number;
  longitude: number;
  events: Event[];
  count: number;
  containsActiveEvent: boolean;
};

export type MapRenderItem = MapEventMarker | MapEventCluster;

const clampLatitude = (latitude: number) => {
  return Math.max(-MAX_MERCATOR_LATITUDE, Math.min(MAX_MERCATOR_LATITUDE, latitude));
};

const getEventCoordinates = (event: Event) => {
  if (!event.coordinates || event.coordinates.length < 2) {
    return null;
  }

  const [latitude, longitude] = event.coordinates;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
};

const projectToWorld = (latitude: number, longitude: number, zoom: number) => {
  const worldSize = TILE_SIZE * 2 ** zoom;
  const normalizedLatitude = clampLatitude(latitude);
  const radians = (normalizedLatitude * Math.PI) / 180;
  const sine = Math.sin(radians);

  return {
    x: ((longitude + 180) / 360) * worldSize,
    y: (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * worldSize,
  };
};

const sortProjectedEvents = (events: ProjectedEvent[]) => {
  return [...events].sort((left, right) => {
    if (left.x !== right.x) return left.x - right.x;
    if (left.y !== right.y) return left.y - right.y;
    return left.event._id.localeCompare(right.event._id);
  });
};

const getClusterRadius = (zoom: number) => {
  if (zoom >= 14) return 18;
  if (zoom >= 12) return 28;
  if (zoom >= 10) return 38;
  return 50;
};

const toProjectedEvent = (event: Event, zoom: number, activeEventId: string | null): ProjectedEvent | null => {
  const coordinates = getEventCoordinates(event);

  if (!coordinates) {
    return null;
  }

  const projected = projectToWorld(coordinates.latitude, coordinates.longitude, zoom);

  return {
    event,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    x: projected.x,
    y: projected.y,
    isActive: event._id === activeEventId,
  };
};

const getProjectedGroups = (projectedEvents: ProjectedEvent[], radius: number): ProjectedGroup[] => {
  return projectedEvents.reduce<ProjectedGroup[]>((groups, item) => {
    let closestGroupIndex = -1;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < groups.length; index += 1) {
      const group = groups[index];
      const distance = Math.hypot(item.x - group.centerX, item.y - group.centerY);

      if (distance <= radius && distance < closestDistance) {
        closestGroupIndex = index;
        closestDistance = distance;
      }
    }

    if (closestGroupIndex === -1) {
      groups.push({
        members: [item],
        centerX: item.x,
        centerY: item.y,
        latitude: item.latitude,
        longitude: item.longitude,
        containsActiveEvent: item.isActive,
      });
      return groups;
    }

    const group = groups[closestGroupIndex];
    const members = [...group.members, item];
    const memberCount = members.length;

    group.members = members;
    group.centerX = members.reduce((sum, member) => sum + member.x, 0) / memberCount;
    group.centerY = members.reduce((sum, member) => sum + member.y, 0) / memberCount;
    group.latitude = members.reduce((sum, member) => sum + member.latitude, 0) / memberCount;
    group.longitude = members.reduce((sum, member) => sum + member.longitude, 0) / memberCount;
    group.containsActiveEvent = group.containsActiveEvent || item.isActive;

    return groups;
  }, []);
};

const buildEventMarker = (
  member: ProjectedEvent,
  options?: {
    offset?: MarkerOffset;
    isSpiderfied?: boolean;
    overlapCount?: number;
  },
): MapEventMarker => {
  return {
    type: 'event',
    key: member.event._id,
    latitude: member.latitude,
    longitude: member.longitude,
    event: member.event,
    count: 1,
    containsActiveEvent: member.isActive,
    offset: options?.offset,
    isSpiderfied: options?.isSpiderfied ?? false,
    overlapCount: options?.overlapCount ?? 1,
  };
};

const buildClusterItems = (groups: ProjectedGroup[]): MapRenderItem[] => {
  return groups.map((group) => {
    if (group.members.length === 1) {
      return buildEventMarker(group.members[0]);
    }

    const eventsInCluster = group.members.map((member) => member.event);
    const clusterKey = group.members
      .map((member) => member.event._id)
      .sort()
      .join(':');

    return {
      type: 'cluster',
      key: `cluster:${clusterKey}`,
      latitude: group.latitude,
      longitude: group.longitude,
      events: eventsInCluster,
      count: eventsInCluster.length,
      containsActiveEvent: group.containsActiveEvent,
    };
  });
};

const getCircleSpiderfyOffsets = (count: number): MarkerOffset[] => {
  const radius = Math.min(
    SPIDERFY_BASE_RADIUS_PX + Math.max(0, count - 2) * 4,
    SPIDERFY_MAX_RADIUS_PX,
  );
  const angleStep = (Math.PI * 2) / count;
  const startAngle = count === 2 ? Math.PI : -Math.PI / 2;

  return Array.from({ length: count }, (_, index) => {
    const angle = startAngle + angleStep * index;
    return [
      Math.round(Math.cos(angle) * radius),
      Math.round(Math.sin(angle) * radius + SPIDERFY_VERTICAL_BIAS_PX),
    ];
  });
};

const getSpiralSpiderfyOffsets = (count: number): MarkerOffset[] => {
  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + index * 0.75;
    const radius = SPIDERFY_BASE_RADIUS_PX + index * 5;
    return [
      Math.round(Math.cos(angle) * radius),
      Math.round(Math.sin(angle) * radius + SPIDERFY_VERTICAL_BIAS_PX),
    ];
  });
};

const getSpiderfyOffsets = (count: number): MarkerOffset[] => {
  if (count <= CIRCLE_SPIDERFY_LIMIT) {
    return getCircleSpiderfyOffsets(count);
  }

  return getSpiralSpiderfyOffsets(count);
};

const buildSpiderfiedItems = (groups: ProjectedGroup[]): MapRenderItem[] => {
  return groups.flatMap((group) => {
    if (group.members.length === 1) {
      return [buildEventMarker(group.members[0])];
    }

    const offsets = getSpiderfyOffsets(group.members.length);

    return group.members.map((member, index) => {
      return buildEventMarker(member, {
        offset: offsets[index],
        isSpiderfied: true,
        overlapCount: group.members.length,
      });
    });
  });
};

export const buildMapRenderItems = (
  events: Event[],
  zoom: number,
  activeEventId: string | null,
): MapRenderItem[] => {
  const projectedEvents = sortProjectedEvents(
    events
      .map((event) => toProjectedEvent(event, zoom, activeEventId))
      .filter((item): item is ProjectedEvent => item !== null),
  );

  if (zoom < CLUSTER_BREAK_ZOOM) {
    return buildClusterItems(getProjectedGroups(projectedEvents, getClusterRadius(zoom)));
  }

  return buildSpiderfiedItems(getProjectedGroups(projectedEvents, OVERLAP_DISTANCE_PX));
};

export const getClusterZoomTarget = (currentZoom: number, clusterSize: number) => {
  const zoomStep = clusterSize >= 8 ? 2 : 1.5;
  return Math.min(Math.max(currentZoom + zoomStep, CLUSTER_BREAK_ZOOM), 17);
};
