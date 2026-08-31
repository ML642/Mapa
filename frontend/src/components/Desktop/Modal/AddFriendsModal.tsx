import { useFriendModal } from '../contexts/AddFriendsContext';
import { readSessionUserId } from '../../../services';
import SocialShareModal from './SocialShareModal';

export default function AddFriendsModal() {
    const { showAddFriendsModal, closeAddFriendsModal } = useFriendModal();

    const generateInviteLink = (): string => {
        try {
            const userId = readSessionUserId();
            if (!userId) {
                return 'https://my-mapa.by';
            }
            return `https://my-mapa.by/${userId}/profile`;
        } catch (error) {
            console.error('Error getting user ID:', error);
            return 'https://my-mapa.by';
        }
    };

    return (
        <SocialShareModal
            isOpen={showAddFriendsModal}
            onClose={closeAddFriendsModal}
            title="Invite friends"
            titleClassName="text-[28px]"
            getShareLink={generateInviteLink}
            shareText="Join me on Mapa!"
            copySuccessMessage="Link copied to the clipboard!"
        />
    );
}
