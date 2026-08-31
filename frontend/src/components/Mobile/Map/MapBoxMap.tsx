import BaseMapBoxMap, { type SharedMapBoxMapProps } from '../../Map/BaseMapBoxMap';

interface MapBoxMapProps extends SharedMapBoxMapProps {
    onMapClick?: () => void;
}

export default function MapBoxMapMobile({
    onEventClick,
    selectedCategories,
    activeEventId,
    onMapClick,
    mobileFilterDetails,
    friendsGoingEventIds,
    friendsInterestedEventIds,
}: MapBoxMapProps) {
    return (
        <BaseMapBoxMap
            onEventClick={onEventClick}
            selectedCategories={selectedCategories}
            activeEventId={activeEventId}
            onMapBackgroundClick={onMapClick}
            mobileFilterDetails={mobileFilterDetails}
            friendsGoingEventIds={friendsGoingEventIds}
            friendsInterestedEventIds={friendsInterestedEventIds}
            mapStyle={{ width: '100%', height: '100%' }}
            clusterFlyDuration={520}
        />
    );
}
