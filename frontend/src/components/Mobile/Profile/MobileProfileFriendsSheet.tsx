import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Friend } from '../../../services';
import { CloseSmallIcon, ShareArrowIcon, ThreeDotsIcon } from '../../Icons/CommonIcons';
import { formatFriendCountLabel } from './mobileProfileFormatters';

function FriendAvatar({
    avatar,
    username,
}: {
    avatar?: string;
    username: string;
}) {
    return (
        <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand">
            {avatar ? (
                <img
                    src={avatar}
                    alt={`Avatar ${username}`}
                    className="h-full w-full object-cover"
                />
            ) : (
                <span className="text-[14px] text-white">
                    {username.trim().charAt(0).toUpperCase() || '?'}
                </span>
            )}
        </div>
    );
}

export default function MobileProfileFriendsSheet({
    busyFriendId,
    friends,
    onAddFriends,
    onClose,
    onRemoveFriend,
    onShareFriend,
    open,
}: {
    busyFriendId: string | null;
    friends: Friend[];
    onAddFriends: () => void;
    onClose: () => void;
    onRemoveFriend: (friendId: string) => Promise<void>;
    onShareFriend: (friendId: string) => Promise<void>;
    open: boolean;
}) {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    useEffect(() => {
        if (!open) {
            setOpenMenuId(null);
            return undefined;
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        const handleClickOutside = (event: MouseEvent) => {
            let clickedInsideMenu = false;

            menuRefs.current.forEach((element) => {
                if (element.contains(event.target as Node)) {
                    clickedInsideMenu = true;
                }
            });

            if (!clickedInsideMenu) {
                setOpenMenuId(null);
            }
        };

        window.addEventListener('keydown', handleEscape);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose, open]);

    if (!open || typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div
            className="fixed inset-0 z-[120] flex items-end bg-[rgba(248,237,244,0.62)] backdrop-blur-[7px]"
            onClick={onClose}
        >
            <section
                className="max-h-[78dvh] w-full rounded-t-[28px] bg-white px-[20px] pt-[22px] shadow-[0_-12px_40px_rgba(107,40,94,0.12)]"
                style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-[22px] font-[600] tracking-[-0.66px] text-brand">
                        My friends ({friends.length})
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-brand"
                        aria-label="Close friends"
                    >
                        <CloseSmallIcon className="h-[12px] w-[12px] text-brand" />
                    </button>
                </div>

                <div className="mt-[18px] max-h-[calc(78dvh-92px-env(safe-area-inset-bottom,0px))] overflow-y-auto pr-[2px]">
                    {friends.length === 0 ? (
                        <div className="rounded-[18px] bg-[linear-gradient(180deg,rgba(255,252,241,0.98)_0%,rgba(255,244,210,0.92)_100%)] px-[18px] py-[18px]">
                            <p className="text-[14px] leading-[1.35] tracking-[-0.28px] text-brand">
                                Add friends to attend events together
                            </p>
                            <button
                                type="button"
                                onClick={onAddFriends}
                                className="mt-[16px] flex w-full items-center justify-center rounded-[14px] bg-[rgba(255,229,130,0.45)] px-[16px] py-[12px] text-[14px] leading-none tracking-[-0.28px] text-brand"
                            >
                                Add friends
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-[8px]">
                            {friends.map((friend) => {
                                const friendId = friend.id || friend._id || '';
                                const isOpen = openMenuId === friendId;
                                const isBusy = busyFriendId === friendId;

                                return (
                                    <div key={friendId} className="relative">
                                        <div className="flex min-h-[56px] items-center justify-between rounded-[16px] border border-[rgba(255,227,214,0.65)] bg-white px-[12px] py-[10px] shadow-[0_6px_18px_rgba(107,40,94,0.04)]">
                                            <div className="flex min-w-0 items-center gap-[10px]">
                                                <FriendAvatar avatar={friend.avatar} username={friend.username} />
                                                <div className="min-w-0">
                                                    <p className="truncate text-[16px] font-[500] leading-none tracking-[-0.48px] text-brand">
                                                        {friend.username}
                                                    </p>
                                                    <p className="mt-[5px] text-[12px] leading-none tracking-[-0.24px] text-brand-muted">
                                                        {formatFriendCountLabel(friend.friendsCount || 0)}
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setOpenMenuId(isOpen ? null : friendId)}
                                                className="flex h-[24px] w-[24px] items-center justify-center text-brand"
                                                aria-label="Open friend menu"
                                            >
                                                <ThreeDotsIcon className="h-[4px] w-[20px] text-brand" />
                                            </button>
                                        </div>

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
                                                className="absolute right-[10px] top-[46px] z-20 flex w-[220px] flex-col rounded-[18px] bg-white p-[10px] shadow-[0_8px_32px_rgba(107,40,94,0.14)]"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        setOpenMenuId(null);
                                                        await onRemoveFriend(friendId);
                                                    }}
                                                    disabled={isBusy}
                                                    className="flex items-center gap-[12px] rounded-[12px] px-[10px] py-[10px] text-left text-[14px] tracking-[-0.28px] text-brand disabled:opacity-60"
                                                >
                                                    <span className="text-[18px] leading-none text-brand">×</span>
                                                    <span>Remove from friends</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        setOpenMenuId(null);
                                                        await onShareFriend(friendId);
                                                    }}
                                                    className="flex items-center gap-[12px] rounded-[12px] px-[10px] py-[10px] text-left text-[14px] tracking-[-0.28px] text-brand"
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
                    )}
                </div>
            </section>
        </div>,
        document.body,
    );
}
