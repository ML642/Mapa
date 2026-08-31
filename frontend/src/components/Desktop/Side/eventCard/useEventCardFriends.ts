import { useEffect, useState } from 'react';
import {
    friendsService,
    getSessionSnapshot,
    readSessionUserId,
    subscribeToSession,
    type Friend,
    type FriendsOverview,
} from '../../../../services';

export function useEventCardFriends() {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [friendsOverview, setFriendsOverview] = useState<FriendsOverview | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        let isCancelled = false;

        const loadFriends = async (userId: string) => {
            try {
                const [friendsData, overviewData] = await Promise.all([
                    friendsService.getFriendsList(userId),
                    friendsService.getFriendsOverviewData(),
                ]);

                if (!isCancelled) {
                    setFriends(friendsData);
                    setFriendsOverview(overviewData);
                }
            } catch (error) {
                console.error('Error loading friends:', error);
            }
        };

        const syncSessionState = () => {
            const { isAuthenticated: nextIsAuthenticated } = getSessionSnapshot();
            const userId = readSessionUserId();

            setIsAuthenticated(nextIsAuthenticated);

            if (!nextIsAuthenticated || !userId) {
                setFriends([]);
                setFriendsOverview(null);
                return;
            }

            void loadFriends(userId);
        };

        syncSessionState();
        const unsubscribe = subscribeToSession(() => syncSessionState());

        return () => {
            isCancelled = true;
            unsubscribe();
        };
    }, []);

    return { friends, friendsOverview, isAuthenticated };
}
