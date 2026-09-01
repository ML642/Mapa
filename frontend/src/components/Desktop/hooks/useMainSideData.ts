import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
    getSessionSnapshot,
    subscribeToSession,
    readSessionUserId,
    friendsService,
    eventsService,
    recommendationService,
    PERSONALIZED_RECOMMENDATIONS_QUERY_KEY,
} from '../../../services';
import { type MainSideTab, getDateRangeForTab } from '../mainSide/formatters';


export const useMainSideData = (searchQuery: string, activeTab: MainSideTab) => {
    const [authenticated, setAuthenticated] = useState(false);
    const normalizedSearchQuery = searchQuery.trim();

    useEffect(() => {
        const syncSessionState = () => {
            setAuthenticated(getSessionSnapshot().isAuthenticated);
        };
        syncSessionState();
        return subscribeToSession(() => syncSessionState());
    }, []);

    const userId = authenticated ? readSessionUserId() : null;

    const { data: friends = [] } = useQuery({
        queryKey: ['friends', userId],
        queryFn: () => friendsService.getFriendsList(userId!),
        enabled: !!authenticated && !!userId,
        staleTime: 5 * 60 * 1000, //5 min
    });

    const { data: friendsOverview } = useQuery({
        queryKey: ['friends', 'overview'],
        queryFn: () => friendsService.getFriendsOverviewData(),
        enabled: authenticated && !normalizedSearchQuery,
        staleTime: 5 * 60 * 1000,
    });

    const { data: interestingEvents = [], isLoading: interestingEventsLoading } = useQuery({
        queryKey: ['events', 'interesting'],
        queryFn: () => eventsService.getInterestingEventsList(100),
        enabled: !normalizedSearchQuery,
        staleTime: 5 * 60 * 1000, //5 min
    });

    const {
        data: searchHistoryRecommendations,
        isLoading: searchHistoryRecommendationsLoading,
    } = useQuery({
        queryKey: [...PERSONALIZED_RECOMMENDATIONS_QUERY_KEY, userId],
        queryFn: () => recommendationService.getSearchHistoryRecommendations(20),
        enabled: authenticated && !normalizedSearchQuery,
        staleTime: 5 * 60 * 1000,
        retry: false,
    });

    const { data: events = [], isLoading: loading } = useQuery({
        queryKey: ['events', 'tab', activeTab],
        queryFn: async () => {
            try {
                const { dateFrom, dateTo } = getDateRangeForTab(activeTab);
                return await eventsService.getEventsList({ dateFrom, dateTo, limit: 4 });
            } catch (err: unknown) {
                if (isAxiosError(err) && err.response?.status === 400) {
                    if (err.response?.data?.message === "No events found") {
                        return [];
                    }
                }
                throw err;
            }
        },
        enabled: !normalizedSearchQuery,
        staleTime: 3 * 60 * 1000, //5 min
    });

    return {
        authenticated,
        friends,
        friendsOverview,
        interestingEvents,
        interestingEventsLoading,
        searchHistoryRecommendations,
        searchHistoryRecommendationsLoading,
        events,
        loading,
        normalizedSearchQuery,
    };
};
