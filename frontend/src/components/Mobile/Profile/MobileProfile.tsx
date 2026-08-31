import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SITE_META } from '../../../config';
import { friendsService, socialShareService } from '../../../services';
import { getApiErrorMessage } from '../../../utils/apiErrors';
import { getCategoryTagStyle } from '../../categoryTag';
import ProfileEmptyIllustration from '../../Desktop/Profile/ProfileEmptyIllustration';
import {
    PROFILE_INTEREST_OPTIONS,
    useProfileController,
} from '../../Profile/useProfileController';
import { useFriendModal } from '../../Desktop/contexts/AddFriendsContext';
import { getMobileCategoryLabel } from '../Filters/MobileFilterOptions';
import MobileProfileDropdownMenu from './MobileProfileDropdownMenu';
import MobileProfileEditorSheet from './MobileProfileEditorSheet';
import MobileProfileEventItem from './MobileProfileEventItem';
import MobileProfileFriendsSheet from './MobileProfileFriendsSheet';
import MobileProfileLogoutModal from './MobileProfileLogoutModal';
import {
    getMobileInterestChipClassName,
    MOBILE_PROFILE_TOP_INSET_STYLE,
    formatFriendCountLabel,
} from './mobileProfileFormatters';

type MobileProfilePanelMode = 'edit' | 'settings' | null;
type MobileProfileAttendTab = 'will_attend' | 'might_attend';

const MobileProfile: React.FC = () => {
    const {
        activeTab,
        attendedEvents,
        authenticated,
        avatarUrl,
        closeMenu,
        fileInputRef,
        form,
        friends,
        handleAvatarSelect,
        handleFieldChange,
        handleLogout,
        handleSave,
        loadError,
        loadProfile,
        loading,
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
        toggleInterest,
        toggleMenu,
    } = useProfileController();
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [friendsSheetOpen, setFriendsSheetOpen] = useState(false);
    const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
    const [panelMode, setPanelMode] = useState<MobileProfilePanelMode>(null);
    const [removingFriendId, setRemovingFriendId] = useState<string | null>(null);
    const { openAddFriendsModal } = useFriendModal();

    const profileLink = profile?.id
        ? `${typeof window !== 'undefined' ? window.location.origin : SITE_META.SITE_URL}/${profile.id}/profile`
        : SITE_META.SITE_URL;

    useEffect(() => {
        if (!actionMessage) {
            return undefined;
        }

        const timeoutId = window.setTimeout(() => {
            setActionMessage(null);
        }, 2500);

        return () => window.clearTimeout(timeoutId);
    }, [actionMessage]);

    const openPanel = (mode: Exclude<MobileProfilePanelMode, null>) => {
        resetEditor();
        closeMenu();
        setPanelMode(mode);
    };

    const closePanel = () => {
        resetEditor();
        setPanelMode(null);
    };

    const handleSavePanel = async () => {
        const saved = await handleSave();

        if (saved) {
            setPanelMode(null);
        }
    };

    const handleShareProfile = async () => {
        closeMenu();
        await socialShareService.copyToClipboard(profileLink);
        setActionMessage('Profile link copied');
    };

    const openFriendsSheet = () => {
        closeMenu();
        setFriendsSheetOpen(true);
    };

    const openLogoutConfirm = () => {
        closeMenu();
        setLogoutConfirmOpen(true);
    };

    const closeLogoutConfirm = () => {
        setLogoutConfirmOpen(false);
    };

    const confirmLogout = () => {
        setLogoutConfirmOpen(false);
        handleLogout();
    };

    const handleShareFriendProfile = async (friendId: string) => {
        await socialShareService.copyToClipboard(
            `${typeof window !== 'undefined' ? window.location.origin : SITE_META.SITE_URL}/${friendId}/profile`,
        );
        setActionMessage('Profile link copied');
    };

    const handleRemoveFriend = async (friendId: string) => {
        setRemovingFriendId(friendId);

        try {
            await friendsService.removeFriendAction(friendId);
            await loadProfile();
            setActionMessage('Friend removed');
        } catch (error) {
            console.error('Failed to remove friend:', error);
            setActionMessage(getApiErrorMessage(error, { fallbackMessage: 'Unable to remove friend' }));
        } finally {
            setRemovingFriendId(null);
        }
    };

    const renderAttendPanel = (tabId: MobileProfileAttendTab) => {
        const events = attendedEvents[tabId];

        if (events.length === 0) {
            return (
                <div className="rounded-[22px] bg-[rgba(255,252,252,0.92)] px-[20px] py-[26px] text-center shadow-[0_10px_28px_rgba(107,40,94,0.04)]">
                    <div className="flex flex-col items-center gap-[14px]">
                        <img
                            src="/icons/nomessage.png"
                            alt=""
                            className="h-auto w-[min(230px,70vw)]"
                        />
                        <p className="text-[14px] leading-[1.35] tracking-[-0.28px] text-brand-muted">
                            No saved events yet
                        </p>
                        <Link
                            to="/"
                            className="inline-flex min-h-[39px] items-center justify-center rounded-[14px] bg-brand px-[22px] py-[10px] text-[14px] leading-none tracking-[-0.28px] text-surface-page"
                        >
                            Go to search
                        </Link>
                    </div>
                </div>
            );
        }

        return (
            <div>
                {events.map((event) => (
                    <MobileProfileEventItem
                        key={`${tabId}-${event._id}`}
                        activeTab={tabId}
                        event={event}
                        onOpen={openEvent}
                    />
                ))}
            </div>
        );
    };

    const renderAuthState = () => (
        <div
            className="flex min-h-[calc(100dvh-5rem-env(safe-area-inset-bottom,0px))] w-full flex-col items-center justify-center gap-[28px] px-[20px] pb-[24px]"
            style={MOBILE_PROFILE_TOP_INSET_STYLE}
        >
            <img
                src="/icons/group-136.svg"
                alt=""
                width={150}
                height={164}
                className="h-auto w-[min(150px,58vw)] shrink-0"
            />
            <div className="flex w-full max-w-[360px] flex-col gap-[16px] rounded-[28px] bg-white px-[20px] py-[24px] text-center shadow-[0_10px_30px_rgba(107,40,94,0.06)]">
                <div className="flex flex-col gap-[6px]">
                    <p className="text-[28px] font-[600] tracking-[-0.84px] text-brand">Sign in</p>
                    <p className="text-[14px] leading-[1.5] tracking-[-0.28px] text-brand-muted">
                        Sign in to open your profile, friends list, and saved events.
                    </p>
                </div>
                <div className="flex flex-col gap-[10px]">
                    <Link
                        to="/login"
                        className="flex min-h-[48px] items-center justify-center rounded-[14px] bg-[var(--color-brand-surface)] px-[20px] py-[12px] text-[14px] tracking-[-0.28px] text-brand"
                    >
                        Sign in
                    </Link>
                    <Link
                        to="/register"
                        className="flex min-h-[48px] items-center justify-center rounded-[14px] bg-brand px-[20px] py-[12px] text-[14px] tracking-[-0.28px] text-surface-page"
                    >
                        Sign up
                    </Link>
                </div>
            </div>
        </div>
    );

    if (!authenticated) {
        return renderAuthState();
    }

    if (loading) {
        return (
            <div className="flex w-full flex-col gap-[18px] px-[20px] pb-[24px]" style={MOBILE_PROFILE_TOP_INSET_STYLE}>
                <div className="mx-auto h-[112px] w-[112px] animate-pulse rounded-full bg-[var(--color-brand-surface)]" />
                <div className="mx-auto h-[24px] w-[180px] animate-pulse rounded-full bg-[var(--color-brand-surface)]" />
                <div className="h-[38px] w-[94px] animate-pulse rounded-full bg-[var(--color-brand-surface)]" />
                <div className="h-[26px] w-[96px] animate-pulse rounded-full bg-[var(--color-brand-surface)]" />
                <div className="flex flex-wrap gap-[8px]">
                    <div className="h-[34px] w-[108px] animate-pulse rounded-full bg-[var(--color-brand-surface)]" />
                    <div className="h-[34px] w-[112px] animate-pulse rounded-full bg-[var(--color-brand-surface)]" />
                    <div className="h-[34px] w-[126px] animate-pulse rounded-full bg-[var(--color-brand-surface)]" />
                </div>
                <div className="h-[240px] animate-pulse rounded-[22px] bg-[var(--color-brand-surface)]" />
            </div>
        );
    }

    if (loadError || !profile) {
        return (
            <div className="flex w-full flex-col gap-[12px] px-[20px] pb-[24px]" style={MOBILE_PROFILE_TOP_INSET_STYLE}>
                <div className="flex flex-col items-center gap-[16px] rounded-[28px] bg-white px-[24px] py-[32px] text-center shadow-[0_10px_30px_rgba(107,40,94,0.06)]">
                    <ProfileEmptyIllustration />
                    <div className="flex flex-col gap-[6px]">
                        <p className="text-[28px] font-[600] tracking-[-0.84px] text-brand">Profile unavailable</p>
                        <p className="text-[14px] tracking-[-0.28px] text-brand-muted">
                            {loadError || 'Unable to load profile data'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => void loadProfile()}
                        className="rounded-[14px] bg-brand px-[20px] py-[12px] text-[14px] tracking-[-0.28px] text-surface-page"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex w-full flex-col px-[20px] pb-[24px]" style={MOBILE_PROFILE_TOP_INSET_STYLE}>
                <section className="relative flex flex-col items-center">
                    <MobileProfileDropdownMenu
                        menuOpen={menuOpen}
                        menuRef={menuRef}
                        onEdit={() => openPanel('edit')}
                        onLogout={openLogoutConfirm}
                        onSettings={() => openPanel('settings')}
                        onShare={() => void handleShareProfile()}
                        onToggle={toggleMenu}
                    />

                    <div className="flex h-[112px] w-[112px] items-center justify-center overflow-hidden rounded-full bg-brand">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={`Avatar ${profile.username}`}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-[32px] text-surface-page">
                                {profile.username.trim().charAt(0).toUpperCase() || '?'}
                            </span>
                        )}
                    </div>

                    <h1 className="mt-[18px] text-center text-[18px] font-[600] leading-none tracking-[-0.54px] text-brand">
                        {profile.username || 'Username'}
                    </h1>

                    <button
                        type="button"
                        onClick={openFriendsSheet}
                        className="mt-[12px] inline-flex items-center rounded-full bg-[rgba(255,228,233,0.65)] px-[14px] py-[7px] text-[14px] leading-none tracking-[-0.28px] text-brand"
                    >
                        {formatFriendCountLabel(friends.length)}
                    </button>

                    <div className="mt-[22px] flex w-full flex-col items-center gap-[12px]">
                        <p className="text-center text-[16px] font-[600] leading-none tracking-[-0.48px] text-brand">
                            Interests
                        </p>

                        {profile.interests.length > 0 ? (
                            <div className="flex flex-wrap items-center justify-center gap-[8px]">
                                {profile.interests.map((interest, index) => {
                                    const tagStyle = getCategoryTagStyle(interest);

                                    return (
                                        <span
                                            key={interest}
                                            className={`inline-flex items-center gap-[4px] rounded-full px-[12px] py-[5px] text-[14px] leading-none tracking-[-0.28px] text-brand ${getMobileInterestChipClassName(index)}`}
                                        >
                                            {tagStyle.icon ? (
                                                <span
                                                    aria-hidden="true"
                                                    className="h-[14px] w-[14px] shrink-0 bg-brand"
                                                    style={{
                                                        WebkitMask: `url(${tagStyle.icon}) center / contain no-repeat`,
                                                        mask: `url(${tagStyle.icon}) center / contain no-repeat`,
                                                    }}
                                                />
                                            ) : null}
                                            {getMobileCategoryLabel(interest)}
                                        </span>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-center text-[14px] tracking-[-0.28px] text-brand-muted">
                                No interests selected yet
                            </p>
                        )}
                    </div>
                </section>

                {(actionMessage || saveError || successMessage) && (
                    <div className="mt-[16px] rounded-[16px] bg-[var(--color-brand-surface)] px-[14px] py-[12px] text-center text-[14px] tracking-[-0.28px] text-brand">
                        {actionMessage || saveError || successMessage}
                    </div>
                )}

                <section className="mt-[28px]">
                    <div className="flex items-end justify-between px-[6px]">
                        <button
                            type="button"
                            onClick={() => setActiveTab('will_attend')}
                            className={`flex-1 pb-[12px] text-center text-[16px] leading-none tracking-[-0.32px] ${
                                activeTab === 'will_attend' ? 'text-brand' : 'text-brand/45'
                            }`}
                        >
                            Going ({profile.willAttendCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('might_attend')}
                            className={`flex-1 pb-[12px] text-center text-[16px] leading-none tracking-[-0.32px] ${
                                activeTab === 'might_attend' ? 'text-brand' : 'text-brand/45'
                            }`}
                        >
                            Want to go ({profile.mightAttendCount})
                        </button>
                    </div>

                    <div className="relative h-px bg-[rgba(107,40,94,0.18)]">
                        <div
                            className={`absolute bottom-0 h-px bg-brand transition-all duration-300 ${
                                activeTab === 'will_attend' ? 'left-0 w-1/2' : 'left-1/2 w-1/2'
                            }`}
                        />
                    </div>

                    <div className="mt-[18px]">
                        {renderAttendPanel(activeTab)}
                        {/* <ScrollSnapPager
                            activeIndex={activeAttendTabIndex}
                            ariaLabel="Mobile profile events"
                            className="w-full"
                            onActiveIndexChange={(index) => setActiveTab(getMobileProfileAttendTabByIndex(index))}
                            panels={MOBILE_PROFILE_ATTENDANCE_TABS.map((tab) => ({
                                key: tab.id,
                                content: renderAttendPanel(tab.id),
                            }))}
                        /> */}
                    </div>
                </section>
            </div>

            <MobileProfileEditorSheet
                avatarUrl={avatarUrl}
                fileInputRef={fileInputRef}
                form={form}
                interestOptions={PROFILE_INTEREST_OPTIONS}
                mode={panelMode}
                onAvatarSelect={handleAvatarSelect}
                onClose={closePanel}
                onFieldChange={handleFieldChange}
                onSave={handleSavePanel}
                onToggleInterest={toggleInterest}
                profileUsername={profile.username}
                saveError={saveError}
                saving={saving}
                selectedInterests={normalizedSelectedInterests}
                successMessage={successMessage}
            />

            <MobileProfileFriendsSheet
                busyFriendId={removingFriendId}
                friends={friends}
                onAddFriends={() => {
                    setFriendsSheetOpen(false);
                    openAddFriendsModal();
                }}
                onClose={() => setFriendsSheetOpen(false)}
                onRemoveFriend={handleRemoveFriend}
                onShareFriend={handleShareFriendProfile}
                open={friendsSheetOpen}
            />

            <MobileProfileLogoutModal
                onClose={closeLogoutConfirm}
                onConfirm={confirmLogout}
                open={logoutConfirmOpen}
            />
        </>
    );
};

export default MobileProfile;
