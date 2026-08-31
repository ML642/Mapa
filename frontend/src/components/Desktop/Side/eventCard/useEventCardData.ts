import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '../../../../utils/apiErrors';
import {
    eventsService,
    getSessionSnapshot,
    recommendationService,
    PERSONALIZED_RECOMMENDATIONS_QUERY_KEY,
    subscribeToSession,
    type AttendState,
} from '../../../../services';

export interface EventAttendancePlan {
    state: AttendState;
    plannedDate: string;
    plannedTime: string;
}

const EMPTY_ATTENDANCE: EventAttendancePlan = {
    state: 'will_not_attend',
    plannedDate: '',
    plannedTime: '',
};

const getAttendanceStorageKey = (eventId: string) => `mapa:event-attendance:${eventId}`;

const readStoredAttendance = (eventId?: string): EventAttendancePlan | null => {
    if (!eventId || typeof window === 'undefined') return null;

    try {
        const value = JSON.parse(window.localStorage.getItem(getAttendanceStorageKey(eventId)) ?? 'null');
        if (
            value
            && (value.state === 'will_attend' || value.state === 'might_attend')
            && typeof value.plannedDate === 'string'
            && typeof value.plannedTime === 'string'
        ) {
            return value;
        }
    } catch {
        // Invalid legacy data should not prevent the event card from opening.
    }

    return null;
};

export function useEventCardData(eventId?: string) {
    const queryClient = useQueryClient();
    const [isAuthenticated, setIsAuthenticated] = useState(
        () => getSessionSnapshot().isAuthenticated,
    );
    const [storedAttendance, setStoredAttendance] = useState<EventAttendancePlan | null>(
        () => readStoredAttendance(eventId),
    );

    const eventQueryKey = ['event', eventId];
    const attendanceQueryKey = ['event-attendance', eventId];

    useEffect(() => {
        const syncSessionState = () => {
            setIsAuthenticated(getSessionSnapshot().isAuthenticated);
        };

        syncSessionState();
        return subscribeToSession(syncSessionState);
    }, []);

    useEffect(() => {
        setStoredAttendance(readStoredAttendance(eventId));
    }, [eventId]);

    const {
        data: eventData = null,
        isLoading: isEventLoading,
        error: eventError,
    } = useQuery({
        queryKey: eventQueryKey,
        queryFn: () => eventsService.getEventDetails(eventId!),
        enabled: !!eventId,
        staleTime: 1000 * 60 * 5,
    });

    const {
        data: attendState = 'will_not_attend',
        isLoading: isAttendanceLoading,
    } = useQuery({
        queryKey: attendanceQueryKey,
        queryFn: () => recommendationService.getAttendStateValue(eventId!),
        enabled: !!eventId && isAuthenticated,
        staleTime: 1000 * 60 * 5,
    });

    const attendanceMutation = useMutation({
        mutationFn: async (nextState: AttendState) => {
            if (!eventId) throw new Error('No eventId provided');
            return recommendationService.updateAttendStateValue(eventId, nextState);
        },
        onMutate: async (nextState) => {
            await queryClient.cancelQueries({ queryKey: attendanceQueryKey });
            const previousState = queryClient.getQueryData<AttendState>(attendanceQueryKey);
            queryClient.setQueryData(attendanceQueryKey, nextState);
            return { previousState };
        },
        onError: (error, _nextState, context) => {
            if (context?.previousState) {
                queryClient.setQueryData(attendanceQueryKey, context.previousState);
            }
            console.error('Attendance update failed:', error);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: attendanceQueryKey });
            queryClient.invalidateQueries({ queryKey: PERSONALIZED_RECOMMENDATIONS_QUERY_KEY });
        },
    });

    const attendance: EventAttendancePlan = attendState === 'will_not_attend'
        ? EMPTY_ATTENDANCE
        : {
            state: attendState,
            plannedDate: storedAttendance?.state === attendState ? storedAttendance.plannedDate : '',
            plannedTime: storedAttendance?.state === attendState ? storedAttendance.plannedTime : '',
        };

    const saveAttendance = async (nextAttendance: EventAttendancePlan) => {
        if (!eventId || attendanceMutation.isPending) return;

        if (nextAttendance.state !== attendState) {
            await attendanceMutation.mutateAsync(nextAttendance.state);
        }

        window.localStorage.setItem(
            getAttendanceStorageKey(eventId),
            JSON.stringify(nextAttendance),
        );
        setStoredAttendance(nextAttendance);
    };

    const removeAttendance = async () => {
        if (!eventId || attendanceMutation.isPending) return;

        if (attendState !== 'will_not_attend') {
            await attendanceMutation.mutateAsync('will_not_attend');
        }

        window.localStorage.removeItem(getAttendanceStorageKey(eventId));
        setStoredAttendance(null);
    };

    const formattedError = eventError
        ? getApiErrorMessage(eventError, { fallbackMessage: 'Could not load event details' })
        : null;

    return {
        eventData,
        loading: !eventId ? false : (isEventLoading || (isAuthenticated && isAttendanceLoading)),
        error: formattedError,
        attendance,
        isAttendanceUpdating: attendanceMutation.isPending,
        saveAttendance,
        removeAttendance,
    };
}
