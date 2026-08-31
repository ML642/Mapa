import EventCard, { type EventCardProps } from "./EventCard";

const MAP_EVENT_CARD_DESKTOP_CONTAINER_CLASS_NAME =
    "absolute z-30 left-[95px] bottom-0 w-[393px] h-full shadow-lg";

export default function MapEventCard(props: EventCardProps) {
    return (
        <EventCard
            {...props}
            desktopContainerClassName={MAP_EVENT_CARD_DESKTOP_CONTAINER_CLASS_NAME}
        />
    );
}
