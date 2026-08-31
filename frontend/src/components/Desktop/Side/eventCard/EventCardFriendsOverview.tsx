import type { FriendActivityAttendee } from '../../../../services';
import FriendAvatar from '../../friends/FriendAvatar';

interface EventCardFriendsOverviewProps {
    willAttend: FriendActivityAttendee[];
    mightAttend: FriendActivityAttendee[];
    onOpenFriends: () => void;
}

const getFriendNamesLabel = (friends: FriendActivityAttendee[]) => {
    const names = friends.slice(0, 2).map((friend) => friend.username).filter(Boolean);
    const extraCount = Math.max(0, friends.length - names.length);
    return `${names.join(', ')}${extraCount ? ` and ${extraCount} more` : ''}`;
};

function AttendanceSummaryCard({
    label,
    friends,
    className,
    onClick,
}: {
    label: string;
    friends: FriendActivityAttendee[];
    className: string;
    onClick: () => void;
}) {
    const displayedFriends = friends.slice(0, 2);
    const extraCount = Math.max(0, friends.length - displayedFriends.length);

    return (
        <button type="button" onClick={onClick} className={`min-w-0 rounded-[14px] px-3 py-3 text-left ${className}`}>
            <div className="relative flex min-h-[24px] items-center justify-center px-6 text-center text-[13px] text-brand">
                <span>{label}</span>
                <span className="absolute right-0 text-[24px] leading-none" aria-hidden="true">›</span>
            </div>
            <div className="mt-2 flex h-9 items-center justify-center">
                {displayedFriends.map((friend, index) => (
                    <span key={friend.id || friend._id || friend.username} className={index ? '-ml-2.5' : ''}>
                        <FriendAvatar avatar={friend.avatar} username={friend.username} className="h-9 w-9 border-2 border-white" textClassName="text-[11px]" />
                    </span>
                ))}
                {extraCount > 0 && (
                    <span className="-ml-2.5 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-white text-[13px] text-brand">
                        +{extraCount}
                    </span>
                )}
            </div>
            <p className="mt-2 truncate text-center text-[11px] text-brand" title={getFriendNamesLabel(friends)}>
                {getFriendNamesLabel(friends)}
            </p>
        </button>
    );
}

export default function EventCardFriendsOverview({ willAttend, mightAttend, onOpenFriends }: EventCardFriendsOverviewProps) {
    const groups = [
        { key: 'will', label: 'Going', friends: willAttend, className: 'bg-[linear-gradient(135deg,#fff3ee_0%,#ffc9b7_100%)]' },
        { key: 'might', label: 'Interested', friends: mightAttend, className: 'bg-[linear-gradient(135deg,#fff9e9_0%,#fff4c8_100%)]' },
    ].filter((group) => group.friends.length > 0);

    if (!groups.length) return null;

    return (
        <section className="px-5 pt-4">
            <h3 className="text-[16px] font-semibold text-brand">Friends</h3>
            <div className={`mt-3 grid gap-2 ${groups.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {groups.map((group) => (
                    <AttendanceSummaryCard key={group.key} label={group.label} friends={group.friends} className={group.className} onClick={onOpenFriends} />
                ))}
            </div>
        </section>
    );
}
