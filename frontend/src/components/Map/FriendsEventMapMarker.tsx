import { useState } from 'react';
import type { FriendActivityEvent } from '../../services';

export default function FriendsEventMapMarker({ event }: { event: FriendActivityEvent }) {
    const friend = event.attendees[0];
    const [imageFailed, setImageFailed] = useState(false);
    const remaining = Math.max(0, event.attendeeCount - (friend ? 1 : 0));
    const initial = friend?.username.trim().charAt(0).toUpperCase() || '?';

    return (
        <div className="flex h-[31px] items-center rounded-full bg-white py-[2px] pl-[2px] pr-[7px] shadow-[0_4px_12px_rgba(107,40,94,0.2)]">
            {friend?.avatar && !imageFailed ? (
                <img
                    src={friend.avatar}
                    alt=""
                    className="h-[27px] w-[27px] rounded-full object-cover"
                    onError={() => setImageFailed(true)}
                />
            ) : (
                <span className="flex h-[27px] w-[27px] items-center justify-center rounded-full bg-brand text-[11px] text-white">{initial}</span>
            )}
            {remaining > 0 && <span className="ml-[3px] text-[13px] font-[500] leading-none text-brand">+{remaining}</span>}
        </div>
    );
}
