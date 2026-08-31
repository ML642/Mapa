import BaseMapBoxMap, { type SharedMapBoxMapProps } from '../../Map/BaseMapBoxMap';

type MapBoxMapProps = SharedMapBoxMapProps;

export default function MapBoxMap({
    onEventClick,
    selectedCategories,
    activeEventId,
    mobileFilterDetails,
    friendsGoingEventIds,
    friendsInterestedEventIds,
}: MapBoxMapProps) {
    return (
        <BaseMapBoxMap
            onEventClick={onEventClick}
            selectedCategories={selectedCategories}
            activeEventId={activeEventId}
            mobileFilterDetails={mobileFilterDetails}
            friendsGoingEventIds={friendsGoingEventIds}
            friendsInterestedEventIds={friendsInterestedEventIds}
            mapStyle={{ width: '100%', height: '100%', borderRadius: '12px' }}
            clusterFlyDuration={560}
        />
    );
}
