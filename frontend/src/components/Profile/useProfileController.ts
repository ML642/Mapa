import { isAxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../../utils/apiErrors';
import {
    bootstrapSession,
    clearAuthenticatedSession,
    friendsService,
    getSessionSnapshot,
    mergeSessionUser,
    PERSONALIZED_RECOMMENDATIONS_QUERY_KEY,
    userService,
} from '../../services';
import type { CurrentUserProfile, Event, Friend } from '../../services';

export type AttendTab = 'will_attend' | 'might_attend';

export type ProfileFormState = {
    username: string;
    bio: string;
    isPublic: boolean;
};

type AttendEventsState = Record<AttendTab, Event[]>;

export const PROFILE_INTEREST_OPTIONS = [
    'Выставки',
    'Музеи',
    'Фестивали',
    'Концерты',
    'Спектакли',
    'Кино',
    'Спорт',
    'Вечеринки',
    'Экскурсии',
    'Квесты',
    'Образование',
    'Для детей',
] as const;

const EMPTY_EVENTS: AttendEventsState = {
    will_attend: [],
    might_attend: [],
};

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const normalizeInterestList = (value: string[]) =>
    Array.from(
        new Set(
            value
                .map((item) => item.trim())
                .filter(Boolean),
        ),
    );

const normalizeUsername = (value: string) => value.trim().replace(/\s+/g, ' ');

export const normalizeBio = (value: string) => value.replace(/\r\n/g, '\n').trim();

const areStringArraysEqual = (left: string[], right: string[]) => {
    const normalizedLeft = [...normalizeInterestList(left)].sort();
    const normalizedRight = [...normalizeInterestList(right)].sort();

    if (normalizedLeft.length !== normalizedRight.length) {
        return false;
    }

    return normalizedLeft.every((item, index) => item === normalizedRight[index]);
};

export const getInitials = (username?: string) => username?.trim().charAt(0).toUpperCase() || '?';

export const useProfileController = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();
    const menuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const initialSessionSnapshot = getSessionSnapshot();

    const [authenticated, setAuthenticated] = useState<boolean>(initialSessionSnapshot.isAuthenticated);
    const [loading, setLoading] = useState<boolean>(initialSessionSnapshot.isAuthenticated);
    const [saving, setSaving] = useState<boolean>(false);
    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const [editing, setEditing] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<AttendTab>('will_attend');
    const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [attendedEvents, setAttendedEvents] = useState<AttendEventsState>(EMPTY_EVENTS);
    const [form, setForm] = useState<ProfileFormState>({ username: '', bio: '', isPublic: false });
    const [savedForm, setSavedForm] = useState<ProfileFormState>({ username: '', bio: '', isPublic: false });
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [savedInterests, setSavedInterests] = useState<string[]>([]);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const currentEvents = attendedEvents[activeTab];
    const avatarUrl = avatarPreview || profile?.avatar || '';
    const normalizedSelectedInterests = normalizeInterestList(selectedInterests);
    const hasProfileChanges =
        normalizeUsername(form.username) !== savedForm.username ||
        normalizeBio(form.bio) !== savedForm.bio ||
        form.isPublic !== savedForm.isPublic;
    const hasInterestChanges = !areStringArraysEqual(normalizedSelectedInterests, savedInterests);
    const hasPendingChanges = hasProfileChanges || hasInterestChanges || Boolean(avatarFile);

    const clearAvatarPreview = useCallback(() => {
        setAvatarPreview((currentPreview) => {
            if (currentPreview) {
                URL.revokeObjectURL(currentPreview);
            }

            return '';
        });
    }, []);

    const hydrateProfile = useCallback((nextProfile: CurrentUserProfile) => {
        const nextForm = {
            username: normalizeUsername(nextProfile.username || ''),
            bio: normalizeBio(nextProfile.bio || ''),
            isPublic: nextProfile.isPublic,
        };
        const nextInterests = normalizeInterestList(nextProfile.interests || []);

        setProfile(nextProfile);
        setForm(nextForm);
        setSavedForm(nextForm);
        setSelectedInterests(nextInterests);
        setSavedInterests(nextInterests);
        setAvatarFile(null);
        clearAvatarPreview();
        mergeSessionUser(nextProfile);
    }, [clearAvatarPreview]);

    const loadProfile = useCallback(async () => {
        let sessionSnapshot = getSessionSnapshot();

        if (!sessionSnapshot.accessToken && sessionSnapshot.user) {
            await bootstrapSession();
            sessionSnapshot = getSessionSnapshot();
        }

        if (!sessionSnapshot.accessToken) {
            setAuthenticated(false);
            setProfile(null);
            setFriends([]);
            setAttendedEvents(EMPTY_EVENTS);
            setLoading(false);
            return;
        }

        setAuthenticated(true);
        setLoading(true);
        setLoadError(null);

        try {
            const currentProfile = await userService.getCurrentUserProfileData();
            const [friendsList, willAttendEvents, mightAttendEvents] = await Promise.all([
                friendsService.getFriendsList(currentProfile.id),
                userService.getAttendedEventsData('will_attend'),
                userService.getAttendedEventsData('might_attend'),
            ]);

            hydrateProfile(currentProfile);
            setFriends(friendsList);
            setAttendedEvents({
                will_attend: willAttendEvents,
                might_attend: mightAttendEvents,
            });
        } catch (error: unknown) {
            if (isAxiosError(error) && error.response?.status === 401) {
                clearAuthenticatedSession();
                setAuthenticated(false);
                setProfile(null);
                setFriends([]);
                setAttendedEvents(EMPTY_EVENTS);
                setLoadError(null);
                clearAvatarPreview();
            } else {
                setLoadError(getApiErrorMessage(error, { fallbackMessage: 'Unable to load profile' }));
            }
        } finally {
            setLoading(false);
        }
    }, [clearAvatarPreview, hydrateProfile]);

    useEffect(() => {
        void loadProfile();
    }, [loadProfile]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => (
        () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
            }
        }
    ), [avatarPreview]);

    const resetEditor = () => {
        setForm(savedForm);
        setSelectedInterests(savedInterests);
        setAvatarFile(null);
        clearAvatarPreview();
        setSaveError(null);
        setSuccessMessage(null);
        setEditing(false);
    };

    const toggleEditing = () => {
        setEditing((currentState) => !currentState);
        setSaveError(null);
        setSuccessMessage(null);
    };

    const toggleMenu = () => {
        setMenuOpen((currentState) => !currentState);
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };

    const openEvent = (eventId: string) => {
        const nextParams = new URLSearchParams(location.search);
        nextParams.set('event', eventId);
        navigate({
            pathname: location.pathname,
            search: `?${nextParams.toString()}`,
        });
    };

    const handleFieldChange = (field: keyof ProfileFormState, value: string | boolean) => {
        setSuccessMessage(null);
        setSaveError(null);
        setForm((currentForm) => ({
            ...currentForm,
            [field]: value,
        }));
    };

    const toggleInterest = (interest: string) => {
        setSuccessMessage(null);
        setSaveError(null);
        setSelectedInterests((currentInterests) => (
            currentInterests.includes(interest)
                ? currentInterests.filter((item) => item !== interest)
                : [...currentInterests, interest]
        ));
    };

    const handleAvatarSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            setSaveError('Only image files can be uploaded');
            return;
        }

        if (file.size > MAX_AVATAR_SIZE) {
            setSaveError('The image must be 5 MB or smaller');
            return;
        }

        setSuccessMessage(null);
        setSaveError(null);
        setAvatarFile(file);
        setAvatarPreview((currentPreview) => {
            if (currentPreview) {
                URL.revokeObjectURL(currentPreview);
            }

            return URL.createObjectURL(file);
        });
    };

    const handleSave = async () => {
        if (!profile) {
            return false;
        }

        const normalizedForm: ProfileFormState = {
            username: normalizeUsername(form.username),
            bio: normalizeBio(form.bio),
            isPublic: form.isPublic,
        };

        if (!normalizedForm.username) {
            setSaveError('Username cannot be empty');
            return false;
        }

        if (hasInterestChanges && normalizedSelectedInterests.length === 0) {
            setSaveError('Select at least one interest');
            return false;
        }

        if (!hasPendingChanges) {
            setEditing(false);
            setSuccessMessage(null);
            return true;
        }

        setSaving(true);
        setSaveError(null);
        setSuccessMessage(null);

        try {
            if (hasProfileChanges) {
                await userService.updateCurrentUserProfileData(normalizedForm);
            }

            if (hasInterestChanges) {
                await userService.setCurrentUserInterests(normalizedSelectedInterests);
                await queryClient.invalidateQueries({ queryKey: PERSONALIZED_RECOMMENDATIONS_QUERY_KEY });
            }

            if (avatarFile) {
                await userService.uploadAvatarData(avatarFile);
            }

            const refreshedProfile = await userService.getCurrentUserProfileData();
            hydrateProfile(refreshedProfile);
            setEditing(false);
            setSuccessMessage('Profile updated');
            return true;
        } catch (error: unknown) {
            setSaveError(getApiErrorMessage(error, { fallbackMessage: 'Unable to save changes' }));
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        clearAuthenticatedSession();
        setMenuOpen(false);
        window.location.href = '/login';
    };

    return {
        activeTab,
        attendedEvents,
        authenticated,
        avatarUrl,
        currentEvents,
        editing,
        fileInputRef,
        form,
        friends,
        handleAvatarSelect,
        handleFieldChange,
        handleLogout,
        handleSave,
        hasPendingChanges,
        loadError,
        loadProfile,
        loading,
        closeMenu,
        menuOpen,
        menuRef,
        normalizedSelectedInterests,
        openEvent,
        profile,
        resetEditor,
        saveError,
        saving,
        setActiveTab,
        successMessage,
        toggleEditing,
        toggleInterest,
        toggleMenu,
    };
};
