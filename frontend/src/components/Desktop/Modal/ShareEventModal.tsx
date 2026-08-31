import { useShareEventModal } from '../contexts/ShareEventContext';
import SocialShareModal from './SocialShareModal';

export default function ShareEventModal() {
    const { showShareEventModal, closeShareEventModal } = useShareEventModal();

    const generateEventLink = (): string => {
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('event') || '';

        if (!eventId) {
            return window.location.origin;
        }

        return `${window.location.origin}/?event=${eventId}`;
    };

    return (
        <SocialShareModal
            isOpen={showShareEventModal}
            onClose={closeShareEventModal}
            title="Share event"
            titleClassName="text-[24px]"
            getShareLink={generateEventLink}
            shareText="Check out this event on Mapa!"
            copySuccessMessage="Event link copied to the clipboard!"
        />
    );
}
