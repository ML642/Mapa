import type { FriendActivityEvent } from '../../../services';
import FriendActivityCard from './FriendActivityCard';

interface FriendsOverviewSectionProps {
    title: string;
    events: FriendActivityEvent[];
    expanded: boolean;
    onToggleExpanded?: () => void;
}

export default function FriendsOverviewSection({
    title,
    events,
    expanded,
    onToggleExpanded,
}: FriendsOverviewSectionProps) {
    const visibleEvents = expanded ? events : events.slice(0, 1);

    return (
        <section className="flex flex-col gap-[12px]">
            <h2 className="text-[20px] font-[600] tracking-[-0.6px] text-brand">
                {title}
            </h2>

            {events.length === 0 ? (
                <div className="flex min-h-[206px] flex-col items-center justify-center bg-[#fdf9fa] px-[20px] py-[20px] text-center">
                    <img
                        src="/icons/noFriends.png"
                        alt=""
                        className="h-auto w-[min(230px,70vw)]"
                    />
                    <p className="mt-[10px] text-[16px] leading-[1.1] tracking-[-0.32px] text-brand-muted">
                        Your friends
                        <br />
                        do not have plans yet
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-[10px]">
                    {visibleEvents.map((event) => (
                        <FriendActivityCard key={event._id} event={event} />
                    ))}
                    {events.length > 1 && onToggleExpanded && (
                        <button
                            type="button"
                            onClick={onToggleExpanded}
                            className="text-[14px] tracking-[-0.28px] text-brand underline underline-offset-[3px]"
                        >
                            {expanded ? 'Show less' : 'Show more'}
                        </button>
                    )}
                </div>
            )}
        </section>
    );
}
