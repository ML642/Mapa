import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../../../utils/apiErrors';
import {
    getSessionSnapshot,
    friendsService,
    readSessionUserId,
    subscribeToSession,
    type Friend,
    type FriendRequest,
    type FriendsOverview,
} from '../../../services';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

const EMPTY_OVERVIEW: FriendsOverview = {
    friendsCount: 0,
    incomingRequestsCount: 0,
    outgoingRequestsCount: 0,
    previewFriends: [],
    willAttendEvents: [],
    mightAttendEvents: [],
};

export function useFriendsData() {
    const [userId, setUserId] = useState<string | null>(() => readSessionUserId());
    const [authenticated, setAuthenticated] = useState(getSessionSnapshot().isAuthenticated);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
    const [overview, setOverview] = useState<FriendsOverview>(EMPTY_OVERVIEW);
    const [overviewStatus, setOverviewStatus] = useState<LoadStatus>('idle');
    const [relationshipsStatus, setRelationshipsStatus] = useState<LoadStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const syncSessionState = () => {
            setUserId(readSessionUserId());
            setAuthenticated(getSessionSnapshot().isAuthenticated);
        };

        syncSessionState();

        return subscribeToSession(() => syncSessionState());
    }, []);

    const markPending = useCallback((targetId: string, active: boolean) => {
        setPendingIds((currentIds) => {
            const nextIds = new Set(currentIds);

            if (active) {
                nextIds.add(targetId);
            } else {
                nextIds.delete(targetId);
            }

            return nextIds;
        });
    }, []);

    const loadOverview = useCallback(async () => {
        if (!userId) {
            setOverview(EMPTY_OVERVIEW);
            setOverviewStatus('ready');
            return;
        }

        setOverviewStatus((currentStatus) =>
            currentStatus === 'idle' || currentStatus === 'error' ? 'loading' : currentStatus,
        );
        setError(null);

        try {
            const payload = await friendsService.getFriendsOverviewData();

            setOverview(payload);
            setOverviewStatus('ready');
        } catch (loadError) {
            console.error('Error loading friends overview:', loadError);
            setOverviewStatus('error');
            setError(
                getApiErrorMessage(loadError, {
                    fallbackMessage: 'Could not load friends overview',
                }),
            );
        }
    }, [userId]);

    const loadIncomingRequests = useCallback(async () => {
        if (!userId) {
            setIncomingRequests([]);
            return;
        }

        try {
            const payload = await friendsService.getFriendRequestsList();
            setIncomingRequests(payload);
        } catch (loadError) {
            console.error('Error loading incoming friend requests:', loadError);
            setError(
                getApiErrorMessage(loadError, {
                    fallbackMessage: 'Could not load incoming friend requests',
                }),
            );
            setIncomingRequests([]);
        }
    }, [userId]);

    const loadOutgoingRequests = useCallback(async () => {
        if (!userId) {
            setOutgoingRequests([]);
            return;
        }

        try {
            const payload = await friendsService.getOutgoingFriendRequestsList();
            setOutgoingRequests(payload);
        } catch (loadError) {
            console.error('Error loading outgoing friend requests:', loadError);
            setError(
                getApiErrorMessage(loadError, {
                    fallbackMessage: 'Could not load outgoing friend requests',
                }),
            );
            setOutgoingRequests([]);
        }
    }, [userId]);

    const loadRelationships = useCallback(async () => {
        if (!userId) {
            setFriends([]);
            setIncomingRequests([]);
            setOutgoingRequests([]);
            setRelationshipsStatus('ready');
            return;
        }

        setRelationshipsStatus((currentStatus) =>
            currentStatus === 'idle' || currentStatus === 'error' ? 'loading' : currentStatus,
        );
        setError(null);

        try {
            const [friendsPayload, incomingPayload, outgoingPayload] = await Promise.all([
                friendsService.getFriendsList(userId),
                friendsService.getFriendRequestsList(),
                friendsService.getOutgoingFriendRequestsList(),
            ]);

            setFriends(friendsPayload);
            setIncomingRequests(incomingPayload);
            setOutgoingRequests(outgoingPayload);
            setRelationshipsStatus('ready');
        } catch (loadError) {
            console.error('Error loading friends data:', loadError);
            setRelationshipsStatus('error');
            setError(
                getApiErrorMessage(loadError, {
                    fallbackMessage: 'Could not load friends data',
                }),
            );
        }
    }, [userId]);

    const refreshAll = useCallback(async () => {
        await Promise.all([loadOverview(), loadRelationships()]);
    }, [loadOverview, loadRelationships]);

    const acceptRequest = useCallback(
        async (targetId: string) => {
            markPending(targetId, true);

            try {
                await friendsService.acceptFriendRequestAction(targetId);
                await refreshAll();
                return true;
            } catch (actionError) {
                console.error('Error accepting friend request:', actionError);
                setError(
                    getApiErrorMessage(actionError, {
                        fallbackMessage: 'Could not accept friend request',
                    }),
                );
                return false;
            } finally {
                markPending(targetId, false);
            }
        },
        [markPending, refreshAll],
    );

    const rejectRequest = useCallback(
        async (targetId: string) => {
            markPending(targetId, true);

            try {
                await friendsService.rejectFriendRequestAction(targetId);
                await Promise.all([loadOverview(), loadIncomingRequests()]);
                return true;
            } catch (actionError) {
                console.error('Error declining friend request:', actionError);
                setError(
                    getApiErrorMessage(actionError, {
                        fallbackMessage: 'Could not decline friend request',
                    }),
                );
                return false;
            } finally {
                markPending(targetId, false);
            }
        },
        [markPending, loadOverview, loadIncomingRequests],
    );

    const cancelRequest = useCallback(
        async (targetId: string) => {
            markPending(targetId, true);

            try {
                await friendsService.cancelFriendRequestAction(targetId);
                await Promise.all([loadOverview(), loadOutgoingRequests()]);
                return true;
            } catch (actionError) {
                console.error('Error cancelling outgoing friend request:', actionError);
                setError(
                    getApiErrorMessage(actionError, {
                        fallbackMessage: 'Could not cancel friend request',
                    }),
                );
                return false;
            } finally {
                markPending(targetId, false);
            }
        },
        [markPending, loadOverview, loadOutgoingRequests],
    );

    const removeFriend = useCallback(
        async (targetId: string) => {
            markPending(targetId, true);

            try {
                await friendsService.removeFriendAction(targetId);
                await refreshAll();
                return true;
            } catch (actionError) {
                console.error('Error removing friend:', actionError);
                setError(
                    getApiErrorMessage(actionError, {
                        fallbackMessage: 'Could not remove friend',
                    }),
                );
                return false;
            } finally {
                markPending(targetId, false);
            }
        },
        [markPending, refreshAll],
    );

    return {
        acceptRequest,
        authenticated,
        cancelRequest,
        error,
        friends,
        incomingRequests,
        loadIncomingRequests,
        loadOverview,
        loadRelationships,
        outgoingRequests,
        overview,
        overviewStatus,
        pendingIds,
        refreshAll,
        relationshipsStatus,
        rejectRequest,
        removeFriend,
        userId,
    };
}
