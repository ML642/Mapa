import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { socialShareService } from '../../../services';
import { getCategoryLabel, getCategoryTagStyle } from '../../categoryTag';
import {
    CloseSmallIcon,
    EditPencilIcon,
    LogoutIcon,
    SettingsSlidersIcon,
    ShareArrowIcon,
    ThreeDotsIcon,
} from '../../Icons/CommonIcons';
import ProfileEventItem from './ProfileEventItem';
import LogoutConfirmModal from './LogoutConfirmModal';
import {
    PROFILE_INTEREST_OPTIONS,
    getInitials,
    useProfileController,
} from '../../Profile/useProfileController';
import ProfileEmptyIllustration from './ProfileEmptyIllustration';

type ProfilePanelMode = 'edit' | 'settings' | null;
type ProfileAttendTab = 'will_attend' | 'might_attend';

const PROFILE_INTEREST_CHIP_THEMES = [
    'bg-[linear-gradient(90deg,rgba(215,160,247,0.85)_0%,rgba(243,164,248,0.92)_100%)]',
    'bg-[rgba(254,245,220,0.95)]',
    'bg-[rgba(165,228,255,0.92)]',
    'bg-[rgba(198,160,247,0.92)]',
    'bg-[rgba(213,192,255,0.92)]',
    'bg-[linear-gradient(90deg,rgba(215,160,247,0.78)_0%,rgba(255,154,237,0.9)_100%)]',
] as const;


const Profile: React.FC = () => {
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
        hasPendingChanges,
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
    const [panelMode, setPanelMode] = useState<ProfilePanelMode>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

    const profileLink = profile?.id ? `${window.location.origin}/${profile.id}/profile` : '';
    const settingsOpen = panelMode !== null;
    const panelTitle = panelMode === 'settings' ? 'Settings' : 'Edit profile';

    useEffect(() => {
        if (!actionMessage) {
            return undefined;
        }

        const timeoutId = window.setTimeout(() => {
            setActionMessage(null);
        }, 2500);

        return () => window.clearTimeout(timeoutId);
    }, [actionMessage]);

    const openPanel = (mode: Exclude<ProfilePanelMode, null>) => {
        resetEditor();
        closeMenu();
        setPanelMode(mode);
    };

    const closePanel = () => {
        resetEditor();
        setPanelMode(null);
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

    const handleShareProfile = async () => {
        if (!profileLink) {
            return;
        }

        closeMenu();
        await socialShareService.copyToClipboard(profileLink);
        setActionMessage('Profile link copied');
    };

    const handleSavePanel = async () => {
        const saved = await handleSave();

        if (saved) {
            setPanelMode(null);
        }
    };

    const renderAttendPanel = (tabId: ProfileAttendTab) => {
        const events = attendedEvents[tabId];

        if (events.length === 0) {
            return (
                <div className="flex flex-col items-center px-[18px] py-[4px] text-center">
                    <img
                        src="/icons/nomessage.png"
                        alt=""
                        className="h-auto w-[min(230px,70vw)]"
                    />
                    <p className="mt-[18px] text-[14px] leading-[1.35] tracking-[-0.28px] text-brand-muted">
                        You do not have any saved events yet
                    </p>
                    <Link
                        to="/"
                        className="mt-[16px] inline-flex min-h-[37px] items-center justify-center rounded-[14px] bg-brand px-[22px] py-[10px] text-[14px] leading-none tracking-[-0.28px] text-surface-page"
                    >
                        Go to search
                    </Link>
                </div>
            );
        }

        return (
            <div className="overflow-hidden rounded-[18px] bg-white/70">
                {events.map((event) => (
                    <ProfileEventItem
                        key={`${tabId}-${event._id}`}
                        activeTab={tabId}
                        event={event}
                        onOpen={openEvent}
                    />
                ))}
            </div>
        );
    };

    const logoutConfirmModal = (
        <LogoutConfirmModal
            open={logoutConfirmOpen}
            onClose={closeLogoutConfirm}
            onConfirm={confirmLogout}
        />
    );

    const renderAuthState = () => (
        <div className="flex w-full flex-col items-center justify-center gap-[71px] min-h-[calc(100dvh-5rem-env(safe-area-inset-bottom,0px))] px-2 md:min-h-0 md:py-[24px]">
            <img
                src="/icons/group-136.svg"
                alt=""
                width={175}
                height={191}
                className="h-auto w-[min(175px,72vw)] shrink-0"
            />
            <div className="w-[300px] flex flex-col gap-[16px]">
                <div className="flex flex-col gap-[4px]">
                    <p className="text-[16px] font-[400] tracking-[-0.64px] text-brand text-center">
                        Log in
                    </p>
                    <p className="text-[14px] font-[400] tracking-[-0.28px] text-brand-muted text-center">
                        Sign up or log in to access your profile
                    </p>
                </div>
                <div className="flex justify-between w-full">
                    <Link
                        to="/login"
                        className="w-[146px] h-[38px] px-[20px] py-[12px] flex justify-center items-center rounded-[12px] bg-accent-soft text-brand text-[14px] font-[400] tracking-[-0.28px]"
                    >
                        Log in
                    </Link>
                    <Link
                        to="/register"
                        className="w-[146px] h-[38px] px-[20px] py-[12px] flex justify-center items-center rounded-[12px] bg-brand text-surface-page text-[14px] font-[400] tracking-[-0.28px]"
                    >
                        Sign up
                    </Link>
                </div>
            </div>
        </div>
    );

    if (!authenticated) {
        return <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto">{renderAuthState()}</div>;
    }

    if (loading) {
        return (
            <div className="flex w-full flex-col gap-[12px] px-[18px] py-[20px]">
                <div className="surface-card h-[320px] w-full animate-pulse rounded-[22px]" />
                <div className="surface-card h-[240px] w-full animate-pulse rounded-[22px]" />
            </div>
        );
    }

    if (loadError || !profile) {
        return (
            <div className="flex w-full flex-col gap-[12px] px-[18px] py-[20px]">
                <div className="surface-card flex flex-col items-center gap-[16px] rounded-[24px] px-[24px] py-[32px] text-center">
                    <ProfileEmptyIllustration />
                    <div className="flex flex-col gap-[6px]">
                        <p className="text-display text-[28px]">Profile is unavailable</p>
                        <p className="text-[14px] tracking-[-0.28px] text-brand-muted">
                            {loadError || 'Could not load profile data'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => void loadProfile()}
                        className="btn-primary rounded-[12px] px-[20px] py-[12px] text-[14px] tracking-[-0.28px]"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-[18px]">
                <section className="relative mx-auto flex w-full max-w-[386px] flex-col items-center">
                    <div className="absolute right-0 top-0" ref={menuRef}>
                        <button
                            type="button"
                            onClick={toggleMenu}
                            className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white text-brand shadow-[0_4px_16px_rgba(107,40,94,0.08)]"
                        >
                            <ThreeDotsIcon className="text-brand" />
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 top-[48px] z-20 flex w-[228px] flex-col rounded-[18px] bg-white p-[10px] shadow-[0_8px_32px_rgba(107,40,94,0.14)]">
                                <button
                                    type="button"
                                    onClick={() => openPanel('edit')}
                                    className="flex items-center gap-[12px] rounded-[12px] px-[10px] py-[10px] text-left text-[14px] tracking-[-0.28px] text-brand hover:bg-[var(--color-brand-surface)]"
                                >
                                    <EditPencilIcon className="h-[17px] w-[17px] text-brand" />
                                    <span>Edit profile</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleShareProfile()}
                                    className="flex items-center gap-[12px] rounded-[12px] px-[10px] py-[10px] text-left text-[14px] tracking-[-0.28px] text-brand hover:bg-[var(--color-brand-surface)]"
                                >
                                    <ShareArrowIcon className="h-[17px] w-[17px] text-brand" />
                                    <span>Share profile</span>
                                </button>
                                <Link
                                    to="/profile/history"
                                    onClick={closeMenu}
                                    className="flex items-center gap-[12px] rounded-[12px] px-[10px] py-[10px] text-left text-[14px] tracking-[-0.28px] text-brand hover:bg-[var(--color-brand-surface)]"
                                >
                                    <SettingsSlidersIcon className="h-[17px] w-[17px] text-brand" />
                                    <span>History</span>
                                </Link>
                                {/* <button
                                    type="button"
                                    onClick={() => openPanel('settings')}
                                    className="flex items-center gap-[12px] rounded-[12px] px-[10px] py-[10px] text-left text-[14px] tracking-[-0.28px] text-brand hover:bg-[var(--color-brand-surface)]"
                                >
                                    <SettingsSlidersIcon className="h-[17px] w-[17px] text-brand" />
                                    <span>Settings</span>
                                </button> */}
                                <div className="my-[4px] h-px bg-[rgba(107,40,94,0.12)]" />
                                <button
                                    type="button"
                                    onClick={openLogoutConfirm}
                                    className="flex items-center gap-[12px] rounded-[12px] px-[10px] py-[10px] text-left text-[14px] tracking-[-0.28px] text-[#FE1D1D] hover:bg-[rgba(254,29,29,0.08)]"
                                >
                                    <LogoutIcon className="h-[16px] w-[17px] text-[#FE1D1D]" />
                                    <span>Log out</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-[2px] flex h-[94px] w-[94px] items-center justify-center overflow-hidden rounded-full bg-brand shadow-[0_12px_24px_rgba(107,40,94,0.12)]">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={`${profile.username}'s avatar`}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-[32px] text-surface-page">{getInitials(profile.username)}</span>
                        )}
                    </div>

                    <h1 className="mt-[14px] text-center text-[18px] font-[600] leading-none tracking-[-0.54px] text-brand">
                        {profile.username || 'Username'}
                    </h1>

                    <Link
                        to="/profile/my-friends"
                        className="mt-[12px] inline-flex items-center rounded-full bg-[rgba(255,228,233,0.65)] px-[14px] py-[7px] text-[14px] leading-none tracking-[-0.28px] text-brand"
                    >
                        {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
                    </Link>

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
                                            className={`inline-flex items-center gap-[4px] rounded-full px-[12px] py-[5px] text-[14px] leading-none tracking-[-0.28px] text-brand ${PROFILE_INTEREST_CHIP_THEMES[index % PROFILE_INTEREST_CHIP_THEMES.length]}`}
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
                                            {getCategoryLabel(interest)}
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

                    {actionMessage && (
                        <div className="mt-[14px] rounded-full bg-[var(--color-brand-surface)] px-[14px] py-[8px] text-[13px] tracking-[-0.26px] text-brand">
                            {actionMessage}
                        </div>
                    )}

                    <div className="mt-[26px] w-full">
                        <div className="flex items-end justify-between px-[6px]">
                            <button
                                type="button"
                                onClick={() => setActiveTab('will_attend')}
                                className={`flex-1 pb-[12px] text-center text-[16px] leading-none tracking-[-0.32px] ${activeTab === 'will_attend' ? 'text-brand' : 'text-brand/45'
                                    }`}
                            >
                                Going ({profile.willAttendCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('might_attend')}
                                className={`flex-1 pb-[12px] text-center text-[16px] leading-none tracking-[-0.32px] ${activeTab === 'might_attend' ? 'text-brand' : 'text-brand/45'
                                    }`}
                            >
                                Interested ({profile.mightAttendCount})
                            </button>
                        </div>

                        <div className="relative h-px bg-[rgba(107,40,94,0.18)]">
                            <div
                                className={`absolute bottom-0 h-px bg-brand transition-all duration-300 ${activeTab === 'will_attend' ? 'left-0 w-1/2' : 'left-1/2 w-1/2'
                                    }`}
                            />
                        </div>
                    </div>

                    <div className="mt-[28px] w-full">
                        {renderAttendPanel(activeTab)}
                        {/* <ScrollSnapPager
                            activeIndex={activeAttendTabIndex}
                            ariaLabel="Profile events"
                            className="w-full"
                            onActiveIndexChange={(index) => setActiveTab(getProfileAttendTabByIndex(index))}
                            panels={PROFILE_ATTENDANCE_TABS.map((tab) => ({
                                key: tab.id,
                                content: renderAttendPanel(tab.id),
                            }))}
                        /> */}
                    </div>
                </section>
            </div>

            {settingsOpen && (
                <section className="absolute inset-0 z-30 flex flex-col bg-surface-page">
                    <header className="flex items-center justify-between border-b border-[rgba(107,40,94,0.12)] px-[18px] py-[16px]">
                        <p className="text-[22px] font-[600] leading-none tracking-[-0.66px] text-brand">
                            {panelTitle}
                        </p>

                        <button
                            type="button"
                            onClick={closePanel}
                            className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white text-brand shadow-[0_4px_16px_rgba(107,40,94,0.08)]"
                            aria-label="Close"
                        >
                            <CloseSmallIcon className="h-[12px] w-[12px] text-brand" />
                        </button>
                    </header>

                    <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-[18px]">
                        <div className="flex flex-col gap-[16px]">
                            <div className="rounded-[18px] bg-[var(--color-brand-surface)] px-[14px] py-[14px]">
                                <div className="flex items-center gap-[14px]">
                                    <div className="flex h-[78px] w-[78px] items-center justify-center overflow-hidden rounded-full bg-brand">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt={`${profile.username}'s avatar`} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-[26px] text-surface-page">{getInitials(profile.username)}</span>
                                        )}
                                    </div>

                                    <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
                                        <div className="flex flex-col gap-[4px]">
                                            <p className="text-[16px] font-[600] tracking-[-0.32px] text-brand">Profile picture</p>
                                            <p className="text-[13px] leading-[1.45] tracking-[-0.26px] text-brand-muted">
                                                Supported formats: jpg, png, webp. Maximum size: 5 MB.
                                            </p>
                                        </div>

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp,image/jpg"
                                            className="hidden"
                                            onChange={handleAvatarSelect}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="inline-flex w-fit min-h-[38px] items-center justify-center rounded-[12px] bg-brand px-[14px] py-[10px] text-[14px] tracking-[-0.28px] text-surface-page"
                                        >
                                            Upload picture
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {(saveError || successMessage) && (
                                <div
                                    className={`rounded-[16px] px-[14px] py-[12px] text-[14px] tracking-[-0.28px] ${saveError
                                        ? 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]'
                                        : 'bg-accent-soft text-brand'
                                        }`}
                                >
                                    {saveError || successMessage}
                                </div>
                            )}

                            <label className="flex flex-col gap-[8px]">
                                <span className="text-[14px] tracking-[-0.28px] text-brand">Username</span>
                                <input
                                    type="text"
                                    value={form.username}
                                    maxLength={40}
                                    className="app-input min-h-[48px] rounded-[14px] px-[16px] py-[12px] text-[14px] tracking-[-0.28px] outline-none"
                                    placeholder="Enter a username"
                                    onChange={(event) => handleFieldChange('username', event.target.value)}
                                />
                            </label>

                            

                            <div className="rounded-[18px] bg-[var(--color-brand-surface)] px-[14px] py-[14px]">
                                <div className="flex items-start justify-between gap-[12px]">
                                    <div className="flex flex-col gap-[4px]">
                                        <p className="text-[16px] font-[600] tracking-[-0.32px] text-brand">Profile visibility</p>
                                        <p className="text-[13px] leading-[1.45] tracking-[-0.26px] text-brand-muted">
                                            A public profile is visible to other users without adding them as friends.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleFieldChange('isPublic', !form.isPublic)}
                                        className={`relative h-[30px] w-[52px] shrink-0 rounded-full transition ${form.isPublic ? 'bg-accent' : 'bg-brand-border'
                                            }`}
                                        aria-label={form.isPublic ? 'Make profile private' : 'Make profile public'}
                                    >
                                        <span
                                            className={`absolute top-[3px] h-[24px] w-[24px] rounded-full bg-white shadow transition ${form.isPublic ? 'left-[25px]' : 'left-[3px]'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-[10px]">
                                <div className="flex flex-col gap-[4px]">
                                    <p className="text-[16px] font-[600] tracking-[-0.32px] text-brand">Interests</p>
                                    <p className="text-[13px] tracking-[-0.26px] text-brand-muted">
                                        These categories are used for recommendations and event matching.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-[8px]">
                                    {PROFILE_INTEREST_OPTIONS.map((interest) => {
                                        const selected = normalizedSelectedInterests.includes(interest);

                                        return (
                                            <button
                                                key={interest}
                                                type="button"
                                                onClick={() => toggleInterest(interest)}
                                                className={`inline-flex items-center rounded-full px-[14px] py-[10px] text-[14px] tracking-[-0.28px] transition ${selected
                                                    ? 'gap-[6px] border border-accent bg-accent-soft text-accent'
                                                    : 'bg-brand-surface text-brand'
                                                    }`}
                                            >
                                                {getCategoryLabel(interest)}
                                                {selected ? <span className="text-[12px] leading-none">×</span> : null}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <footer className="border-t border-[rgba(107,40,94,0.12)] px-[18px] py-[14px]">
                        <div className="flex items-center justify-between gap-[12px]">
                            <p className="text-[13px] tracking-[-0.26px] text-brand-muted">
                                {hasPendingChanges ? 'You have unsaved changes' : 'No changes'}
                            </p>

                            <div className="flex gap-[8px]">
                                <button
                                    type="button"
                                    onClick={closePanel}
                                    className="inline-flex min-h-[38px] items-center justify-center rounded-[12px] bg-[var(--color-brand-surface)] px-[16px] py-[10px] text-[14px] tracking-[-0.28px] text-brand"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleSavePanel()}
                                    disabled={saving}
                                    className="inline-flex min-h-[38px] items-center justify-center rounded-[12px] bg-brand px-[16px] py-[10px] text-[14px] tracking-[-0.28px] text-surface-page disabled:opacity-60"
                                >
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </footer>
                </section>
            )}

            {logoutConfirmModal}
        </div>
    );
};

export default Profile;
