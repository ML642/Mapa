import { useState } from 'react';
import type { FriendActivityAttendee } from '../../../../services';
import FriendAvatar from '../../friends/FriendAvatar';

type AttendanceTab = 'will_attend' | 'might_attend';

interface EventCardFriendsTabProps {
    willAttend: FriendActivityAttendee[];
    mightAttend: FriendActivityAttendee[];
}

export default function EventCardFriendsTab({ willAttend, mightAttend }: EventCardFriendsTabProps) {
    const [activeTab, setActiveTab] = useState<AttendanceTab>('will_attend');
    const attendees = activeTab === 'will_attend' ? willAttend : mightAttend;

    return (
        <section className="min-h-[360px] px-5 py-4">
            <div className="grid grid-cols-2 overflow-hidden rounded-[10px] border border-brand-soft">
                <button type="button" onClick={() => setActiveTab('will_attend')} className={` flex items-center justify-center px-2 py-2 text-[11px] text-center ${activeTab === 'will_attend' ? 'bg-white text-brand' : 'bg-[var(--color-brand-surface)] text-brand/60'}`}>
                    Going ({willAttend.length})
                </button>
                <button type="button" onClick={() => setActiveTab('might_attend')} className={`px-2 py-2 text-[11px]  text-center ${activeTab === 'might_attend' ? 'bg-white text-brand' : 'bg-[var(--color-brand-surface)] text-brand/60'}`}>
                    Interested ({mightAttend.length})
                </button>
            </div>

            {attendees.length ? (
                <div className="mt-3 flex flex-col gap-1.5">
                    {attendees.map((friend) => (
                        <div key={friend.id || friend._id || friend.username} className="flex items-center gap-3 rounded-[8px] bg-[var(--color-brand-surface)] px-3 py-2">
                            <FriendAvatar avatar={friend.avatar} username={friend.username} className="h-8 w-8" textClassName="text-[11px]" />
                            <p className="min-w-0 truncate text-[12px] text-brand">{friend.username}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="py-10 text-center text-[12px] text-brand-muted">None of your friends has marked this event yet</p>
            )}
        </section>
    );
}
