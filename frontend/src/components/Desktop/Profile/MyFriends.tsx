import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { socialShareService } from '../../../services';
import { useFriendModal } from '../contexts/AddFriendsContext';
import { BackChevronIcon, ShareArrowIcon, ThreeDotsIcon } from '../../Icons/CommonIcons';
import FriendRelationshipRow from '../friends/FriendRelationshipRow';
import { formatFriendCountLabel, formatMutualFriendsLabel } from '../friends/friendsFormatters';
import { useFriendsData } from '../friends/useFriendsData';

type FriendsTab = 'friends' | 'incoming' | 'outgoing';

const getInitialTab = (value: string | null): FriendsTab => {
    if (value === 'incoming' || value === 'outgoing') {
        return value;
    }

    return 'friends';
};

const PAGE_ROOT_CLASS_NAME =
    'flex min-h-full w-full flex-col px-[18px] py-[18px] md:h-full md:min-h-0';

const PAGE_SCROLL_AREA_CLASS_NAME =
    'mt-[20px] pr-[2px] md:min-h-0 md:flex-1 md:overflow-y-auto';

const MyFriends: React.FC = () => {
    const {
        acceptRequest,
        authenticated,
        cancelRequest,
        error,
        friends,
        incomingRequests,
        loadRelationships,
        outgoingRequests,
        pendingIds,
        rejectRequest,
        removeFriend,
    } = useFriendsData();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<FriendsTab>(() => getInitialTab(searchParams.get('tab')));
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const navigate = useNavigate();
    const { openAddFriendsModal } = useFriendModal();

    useEffect(() => {
        setActiveTab(getInitialTab(searchParams.get('tab')));
    }, [searchParams]);

    useEffect(() => {
        if (authenticated) {
            void loadRelationships();
        }
    }, [authenticated, loadRelationships]);

    useEffect(() => {
        if (!actionMessage) {
            return undefined;
        }

        const timeoutId = window.setTimeout(() => setActionMessage(null), 2500);
        return () => window.clearTimeout(timeoutId);
    }, [actionMessage]);

    useEffect(() => {
        const handleClickOutside = (targetEvent: MouseEvent) => {
            let clickedInsideMenu = false;

            menuRefs.current.forEach((element) => {
                if (element.contains(targetEvent.target as Node)) {
                    clickedInsideMenu = true;
                }
            });

            if (!clickedInsideMenu) {
                setOpenMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const switchTab = (tab: FriendsTab) => {
        setActiveTab(tab);
        setSearchParams((currentParams) => {
            const nextParams = new URLSearchParams(currentParams);

            if (tab === 'friends') {
                nextParams.delete('tab');
            } else {
                nextParams.set('tab', tab);
            }

            return nextParams;
        }, { replace: true });
    };

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }

        navigate('/friends');
    };

    const handleShareProfile = async (friendId: string) => {
        setOpenMenuId(null);
        await socialShareService.copyToClipboard(`${window.location.origin}/${friendId}/profile`);
        setActionMessage('Profile link copied');
    };

    const handleRemoveFriend = async (friendId: string) => {
        const success = await removeFriend(friendId);

        if (success) {
            setOpenMenuId(null);
            setActionMessage('Friend removed');
        }
    };

    const handleAcceptRequest = async (requestId: string) => {
        const success = await acceptRequest(requestId);

        if (success) {
            setActionMessage('Friend request accepted');
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        const success = await rejectRequest(requestId);

        if (success) {
            setActionMessage('Friend request declined');
        }
    };

    const handleCancelRequest = async (requestId: string) => {
        const success = await cancelRequest(requestId);

        if (success) {
            setActionMessage('Friend request cancelled');
        }
    };

    const renderEmptyState = () => {
        if (activeTab === 'friends') {
            return (
                <div className="flex min-h-[calc(100dvh-180px)] w-full items-center justify-center md:min-h-full">
                    <div className="flex w-full max-w-[360px] flex-col items-center rounded-[18px] bg-[#fffbfa] px-[18px] py-[18px] text-center">
                        <img
                            src="/icons/noFriends.png"
                            alt=""
                            aria-hidden="true"
                            className="mx-auto h-auto w-[184px]"
                        />
                        <p className="mt-[10px] text-[14px] leading-[1.35] tracking-[-0.28px] text-brand-muted">
                            Add friends to attend events together
                        </p>
                        <button
                            type="button"
                            onClick={openAddFriendsModal}
                            className="mt-[14px] inline-flex min-h-[39px] items-center justify-center rounded-[14px] bg-brand px-[22px] py-[10px] text-[14px] leading-none tracking-[-0.28px] text-surface-page"
                        >
                            Add friends
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex min-h-0 flex-1 items-center justify-center">
                <div className="flex max-w-[360px] flex-col items-center px-[18px] text-center">
                    <p className="text-[15px] leading-[1.35] tracking-[-0.3px] text-brand-muted">
                        {activeTab === 'incoming'
                            ? 'You do not have any incoming requests yet'
                            : 'You do not have any outgoing requests yet'}
                    </p>
                </div>
            </div>
        );
    };

    const renderFriendsTab = () => {
        if (friends.length === 0) {
            return renderEmptyState();
        }

        return (
            <div className="flex flex-col gap-[8px]">
                {friends.map((friend) => {
                    const friendId = friend.id || friend._id || '';
                    const isOpen = openMenuId === friendId;

                    return (
                        <div key={friendId} className="relative">
                            <FriendRelationshipRow
                                avatar={friend.avatar}
                                username={friend.username}
                                subtitle={formatFriendCountLabel(friend.friendsCount || 0)}
                                actions={(
                                    <button
                                        type="button"
                                        onClick={() => setOpenMenuId(isOpen ? null : friendId)}
                                        className="flex h-[24px] w-[24px] items-center justify-center text-brand"
                                        aria-label="Open friend menu"
                                    >
                                        <ThreeDotsIcon className="h-[4px] w-[20px] text-brand" />
                                    </button>
                                )}
                            />

                            {isOpen && (
                                <div
                                    ref={(element) => {
                                        if (!friendId) {
                                            return;
                                        }

                                        if (element) {
                                            menuRefs.current.set(friendId, element);
                                        } else {
                                            menuRefs.current.delete(friendId);
                                        }
                                    }}
                                    className="absolute right-[10px] top-[44px] z-20 flex w-[220px] flex-col rounded-[18px] bg-white p-[10px] shadow-[0_8px_32px_rgba(107,40,94,0.14)]"
                                >
                                    <button
                                        type="button"
                                        onClick={() => void handleRemoveFriend(friendId)}
                                        disabled={pendingIds.has(friendId)}
                                        className="flex items-center gap-[12px] rounded-[12px] px-[10px] py-[10px] text-left text-[14px] tracking-[-0.28px] text-brand hover:bg-[var(--color-brand-surface)] disabled:opacity-60"
                                    >
                                        <span className="text-[18px] leading-none text-[#7A3C68]">×</span>
                                        <span>Remove friend</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void handleShareProfile(friendId)}
                                        className="flex items-center gap-[12px] rounded-[12px] px-[10px] py-[10px] text-left text-[14px] tracking-[-0.28px] text-brand hover:bg-[var(--color-brand-surface)]"
                                    >
                                        <ShareArrowIcon className="h-[17px] w-[17px] text-brand" />
                                        <span>Share profile</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderIncomingTab = () => {
        if (incomingRequests.length === 0) {
            return renderEmptyState();
        }

        return (
            <div className="flex flex-col gap-[8px]">
                {incomingRequests.map((request) => {
                    const requestId = request.id || request._id || '';
                    const isPending = pendingIds.has(requestId);

                    return (
                        <FriendRelationshipRow
                            key={requestId}
                            avatar={request.avatar}
                            username={request.username}
                            subtitle={formatMutualFriendsLabel(request.mutualFriendsCount || 0)}
                            actions={(
                                <div className="flex gap-[8px]">
                                    <button
                                        type="button"
                                        onClick={() => void handleRejectRequest(requestId)}
                                        disabled={isPending}
                                        className="min-w-[118px] rounded-[14px] bg-[rgba(255,228,233,0.45)] px-[14px] py-[12px] text-[14px] leading-none tracking-[-0.28px] text-brand disabled:opacity-60"
                                    >
                                        Decline
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void handleAcceptRequest(requestId)}
                                        disabled={isPending}
                                        className="min-w-[118px] rounded-[14px] bg-brand px-[14px] py-[12px] text-[14px] leading-none tracking-[-0.28px] text-white disabled:opacity-60"
                                    >
                                        Accept
                                    </button>
                                </div>
                            )}
                        />
                    );
                })}
            </div>
        );
    };

    const renderOutgoingTab = () => {
        if (outgoingRequests.length === 0) {
            return renderEmptyState();
        }

        return (
            <div className="flex flex-col gap-[8px]">
                {outgoingRequests.map((request) => {
                    const requestId = request.id || request._id || '';
                    const isPending = pendingIds.has(requestId);

                    return (
                        <FriendRelationshipRow
                            key={requestId}
                            avatar={request.avatar}
                            username={request.username}
                            subtitle={formatMutualFriendsLabel(request.mutualFriendsCount || 0)}
                            actions={(
                                <button
                                    type="button"
                                    onClick={() => void handleCancelRequest(requestId)}
                                    disabled={isPending}
                                    className="min-w-[150px] rounded-[14px] bg-[rgba(255,228,233,0.45)] px-[14px] py-[12px] text-[14px] leading-none tracking-[-0.28px] text-brand disabled:opacity-60"
                                >
                                    Cancel request
                                </button>
                            )}
                        />
                    );
                })}
            </div>
        );
    };

    const renderTabContent = () => {
        if (!authenticated) {
            return renderEmptyState();
        }

        if (activeTab === 'incoming') {
            return renderIncomingTab();
        }

        if (activeTab === 'outgoing') {
            return renderOutgoingTab();
        }

        return renderFriendsTab();
    };

    return (
        <div className={PAGE_ROOT_CLASS_NAME}>
            <div className="relative flex items-center justify-center py-[4px]">
                <button
                    type="button"
                    onClick={handleBack}
                    className="absolute left-0 flex h-[26px] w-[26px] items-center justify-center text-brand"
                    aria-label="Back"
                >
                    <BackChevronIcon className="h-[15px] w-[9px] text-brand" />
                </button>

                <h1 className="text-[28px] font-[600] tracking-[-0.84px] text-brand">
                    My friends
                </h1>
            </div>

            {(actionMessage || error) && (
                <div className="mt-[14px] rounded-full bg-[var(--color-brand-surface)] px-[14px] py-[8px] text-center text-[13px] tracking-[-0.26px] text-brand">
                    {actionMessage || error}
                </div>
            )}

            <div className="mt-[18px] flex border-b border-[rgba(107,40,94,0.18)]">
                <button
                    type="button"
                    onClick={() => switchTab('friends')}
                    className={`px-[18px] pb-[12px] text-[16px] tracking-[-0.32px] ${
                        activeTab === 'friends' ? 'border-b border-brand text-brand' : 'text-brand/45'
                    }`}
                >
                    All friends ({friends.length})
                </button>
                <button
                    type="button"
                    onClick={() => switchTab('incoming')}
                    className={`px-[18px] pb-[12px] text-[16px] tracking-[-0.32px] ${
                        activeTab === 'incoming' ? 'border-b border-brand text-brand' : 'text-brand/45'
                    }`}
                >
                    Incoming requests ({incomingRequests.length})
                </button>
                <button
                    type="button"
                    onClick={() => switchTab('outgoing')}
                    className={`px-[18px] pb-[12px] text-[16px] tracking-[-0.32px] ${
                        activeTab === 'outgoing' ? 'border-b border-brand text-brand' : 'text-brand/45'
                    }`}
                >
                    Outgoing requests ({outgoingRequests.length})
                </button>
            </div>

            <div className={PAGE_SCROLL_AREA_CLASS_NAME}>
                {renderTabContent()}
            </div>
        </div>
    );
};

export default MyFriends;
