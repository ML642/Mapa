import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFriendModal } from './contexts/AddFriendsContext';
import { AddPlusIcon, ForwardArrowIcon, NotificationBellIcon } from '../Icons/FriendsIcons';
import FriendAvatar from './friends/FriendAvatar';
import FriendsNotificationsPanel from './friends/FriendsNotificationsPanel';
import FriendsOverviewSection from './friends/FriendsOverviewSection';
import Skeleton from '../Common/Skeleton';
import { useFriendsData } from './friends/useFriendsData';

type FriendsActivityTab = 'will_attend' | 'might_attend';

const FRIENDS_ACTIVITY_TABS: Array<{id: FriendsActivityTab; label: string; title: string }> = [
    { id: 'will_attend', label: 'Going', title: 'Where your friends are going' },
    { id: 'might_attend', label: 'Interested', title: 'Where your friends want to go' },
];

const PAGE_ROOT_CLASS_NAME =
    'flex min-h-full w-full flex-col px-[16px] py-[18px] md:h-full md:min-h-0';

const PAGE_SCROLL_AREA_CLASS_NAME =
    'mt-[20px] pr-[2px] md:min-h-0 md:flex-1 md:overflow-y-auto';

const Friends: React.FC = () => {
    const {
        acceptRequest,
        authenticated,
        error,
        incomingRequests,
        loadIncomingRequests,
        loadOverview,
        overview,
        overviewStatus,
        pendingIds,
        rejectRequest,
    } = useFriendsData();
    const { openAddFriendsModal } = useFriendModal();
    const [viewMode, setViewMode] = useState<'overview' | 'notifications'>('overview');
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [willAttendExpanded, setWillAttendExpanded] = useState(false);
    const [mightAttendExpanded, setMightAttendExpanded] = useState(false);
    const [activityTab, setActivityTab] = useState<FriendsActivityTab>('will_attend');

    useEffect(() => {
        if (authenticated) {
            void loadOverview();
        }
    }, [authenticated, loadOverview]);

    useEffect(() => {
        if (!actionMessage) {
            return undefined;
        }

        const timeoutId = window.setTimeout(() => setActionMessage(null), 2500);
        return () => window.clearTimeout(timeoutId);
    }, [actionMessage]);

    const openNotifications = async () => {
        setViewMode('notifications');
        await loadIncomingRequests();
    };

    const handleAcceptRequest = async (targetId: string) => {
        const success = await acceptRequest(targetId);

        if (success) {
            setActionMessage('Friend request accepted');
        }
    };

    const handleRejectRequest = async (targetId: string) => {
        const success = await rejectRequest(targetId);

        if (success) {
            setActionMessage('Friend request declined');
        }
    };

    const renderActivityPanel = (tabId: FriendsActivityTab) => {
        const isWillAttend = tabId === 'will_attend';

        return (
            <FriendsOverviewSection
                title={isWillAttend ? 'Where your friends are going' : 'Where your friends want to go'}
                events={isWillAttend ? overview.willAttendEvents : overview.mightAttendEvents}
                expanded={isWillAttend ? willAttendExpanded : mightAttendExpanded}
                onToggleExpanded={() => (
                    isWillAttend
                        ? setWillAttendExpanded((current) => !current)
                        : setMightAttendExpanded((current) => !current)
                )}
            />
        );
    };

    if (!authenticated) {
        return (
            <div
                className={PAGE_ROOT_CLASS_NAME}
                style={{ minHeight: 'calc(100dvh - 5rem - env(safe-area-inset-bottom, 0px))' }}
            >
                <div className="flex items-center justify-between">
                    <h1 className="text-display text-[20px] text-brand">My friends</h1>
                </div>

                <div className="flex min-h-0 flex-1 items-center justify-center">
                    <div className="flex w-full max-w-[360px] flex-col items-center rounded-[24px] px-[18px] py-[26px] text-center">
                        <img
                            src="/icons/group-136.svg"
                            alt=""
                            width={175}
                            height={191}
                            className="h-auto w-[min(175px,72vw)] shrink-0"
                        />
                        <p className="mt-[18px] text-[14px] leading-[1.35] tracking-[-0.28px] text-brand-muted">
                            Log in to add friends and see which events they want to attend
                        </p>
                        <div className="mt-[12px] flex w-full justify-between ">
                                                   <Link
                                                       to="/login"
                                                       className="flex h-[38px] w-[146px] items-center justify-center rounded-[12px] bg-accent-soft px-[20px] py-[14px] text-[14px] font-[400] tracking-[-0.28px] text-brand "
                                                   >
                                                        Log in
                                                   </Link>
                                                   <Link
                                                       to="/register"
                                                       className="flex h-[38px] w-[146px] items-center justify-center rounded-[12px] bg-brand px-[20px] py-[12px] text-[14px] font-[400] tracking-[-0.28px] text-surface-page"
                                                   >
                                                        Sign up
                                                   </Link>
                                               </div>
                        
                    </div>
                </div>
            </div>
        );
    }

    if (viewMode === 'notifications') {
        return (
            <FriendsNotificationsPanel
                incomingRequests={incomingRequests}
                willAttendEvents={overview.willAttendEvents}
                mightAttendEvents={overview.mightAttendEvents}
                pendingIds={pendingIds}
                actionMessage={actionMessage}
                error={error}
                onAccept={handleAcceptRequest}
                onReject={handleRejectRequest}
                onClose={() => setViewMode('overview')}
            />
        );
    }

    return (
        <div className={PAGE_ROOT_CLASS_NAME}>
            <div className="flex items-center justify-between">
                <h1 className="text-display text-[20px] text-brand">My friends</h1>
                <button
                    type="button"
                    onClick={() => void openNotifications()}
                    className="relative flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white shadow-[0_4px_16px_rgba(107,40,94,0.08)]"
                    aria-label="Open notifications"
                >
                    <NotificationBellIcon className="h-[19px] w-[15px] text-brand" />
                    {overview.incomingRequestsCount > 0 && (
                        <span className="absolute right-[2px] top-[2px] h-[10px] w-[10px] rounded-full bg-accent" />
                    )}
                </button>
            </div>

            {(actionMessage || error) && (
                <div className="mt-[14px] rounded-full bg-[var(--color-brand-surface)] px-[14px] py-[8px] text-center text-[13px] tracking-[-0.26px] text-brand">
                    {actionMessage || error}
                </div>
            )}

            <div className={PAGE_SCROLL_AREA_CLASS_NAME}>
                {overviewStatus === 'loading' ? (
                    <div className="flex flex-col gap-[16px]">
                        <Skeleton height="164px" borderRadius="24px" />
                        <Skeleton height="198px" borderRadius="24px" />
                        <Skeleton height="198px" borderRadius="24px" />
                    </div>
                ) : overview.friendsCount === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="flex w-full max-w-[360px] flex-col items-center rounded-[24px] px-[18px] py-[26px] text-center">
                            <img
                                src="/icons/noFriends.png"
                                alt=""
                                className="h-auto w-[min(230px,72vw)] shrink-0"
                            />
                            <p className="mt-[18px] text-[14px] leading-[1.35] tracking-[-0.28px] text-brand-muted">
                                Add friends to attend events together
                            </p>
                            <button
                                type="button"
                                onClick={openAddFriendsModal}
                                className="mt-[16px] inline-flex min-h-[39px] items-center justify-center rounded-[14px] bg-brand px-[22px] py-[10px] text-[14px] leading-none tracking-[-0.28px] text-surface-page"
                            >
                                Add friends
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-[24px]">
                        <section className="rounded-[24px] bg-[linear-gradient(180deg,rgba(255,252,241,0.98)_0%,rgba(255,244,210,0.92)_100%)] px-[12px] py-[12px] shadow-[0_10px_30px_rgba(107,40,94,0.05)]">
                            <div className="grid grid-cols-4 gap-[4px]">
                                <button
                                    type="button"
                                    onClick={openAddFriendsModal}
                                    className="flex h-[120px] flex-col items-center rounded-[16px] bg-white px-[10px] pb-[8px] pt-[20px]"
                                >
                                    <span className="flex h-[48px] w-[48px] shrink-0 translate-y-2 items-center justify-center rounded-full bg-[#ff9b82] text-white">
                                        <AddPlusIcon className="h-[22px] w-[22px]" />
                                    </span>
                                    <span className="mt-[10px] flex h-[34px] translate-y-2 items-start text-center text-[14px] leading-[1.2] tracking-[-0.28px] text-brand">
                                        Add a friend
                                    </span>
                                </button>

                                {overview.previewFriends.map((friend) => (
                                    <div
                                        key={friend.id || friend._id}
                                        className="flex h-[120px] min-w-0 flex-col items-center rounded-[16px] bg-white px-[10px] pb-[8px] pt-[20px]"
                                    >
                                        <FriendAvatar
                                            avatar={friend.avatar}
                                            username={friend.username}
                                            className="h-[36px] w-[36px] translate-y-2"
                                        />
                                        <span
                                            className="mt-[10px] h-[34px] w-full translate-y-2 truncate whitespace-nowrap text-center text-[14px] leading-[1.2] tracking-[-0.28px] text-brand"
                                            title={friend.username}
                                        >
                                            {friend.username}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <Link
                                to="/profile/my-friends"
                                className="mt-[12px] flex items-center justify-between border-t border-[rgba(107,40,94,0.18)] px-[2px] pt-[12px]"
                            >
                                <span className="text-[16px] tracking-[-0.32px] text-brand">
                                    All friends ({overview.friendsCount})
                                </span>
                                <ForwardArrowIcon className="h-[15px] w-[18px] text-brand" />
                            </Link>
                        </section>

                        <section className="flex flex-col gap-[18px]">
                            <div className="flex items-end justify-between px-[6px]">
                                {FRIENDS_ACTIVITY_TABS.map((tab) => {
                                    const count = tab.id === 'will_attend'
                                        ? overview.willAttendEvents.length
                                        : overview.mightAttendEvents.length;

                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setActivityTab(tab.id)}
                                            className={`flex-1 pb-[12px] text-center text-[16px] leading-none tracking-[-0.32px] ${
                                                activityTab === tab.id ? 'text-brand' : 'text-brand/45'
                                            }`}
                                        >
                                            {tab.label} ({count})
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="relative h-px bg-[rgba(107,40,94,0.18)]">
                                <div
                                    className={`absolute bottom-0 h-px bg-brand transition-all duration-300 ${
                                        activityTab === 'will_attend' ? 'left-0 w-1/2' : 'left-1/2 w-1/2'
                                    }`}
                                />
                            </div>

                            {renderActivityPanel(activityTab)}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Friends;
