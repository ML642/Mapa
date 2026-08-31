import { Link } from 'react-router-dom';
import type { FriendActivityEvent } from '../../../services';
import MainSideFriendsEvents from './MainSideFriendsEvents';
import MobileFriendsEvents from '../../Mobile/MobileFriendsEvents';

interface MainSideFriendsSectionProps {
    isAuthenticated: boolean;
    hasFriends: boolean;
    events: FriendActivityEvent[];
    onAddFriends: () => void;
    onClickEvent?: (id: string) => void;
    mobileVariant?: boolean;
    activeEventId?: string | null;
    onViewAll?: () => void;
}

export default function MainSideFriendsSection({
    isAuthenticated,
    hasFriends,
    events,
    onAddFriends,
    onClickEvent,
    mobileVariant = false,
    activeEventId,
    onViewAll,
}: MainSideFriendsSectionProps) {
    if (isAuthenticated && hasFriends && events.length > 0) {
        return mobileVariant
            ? <MobileFriendsEvents events={events} onClickEvent={onClickEvent} onViewAll={onViewAll} activeEventId={activeEventId} />
            : <MainSideFriendsEvents events={events} onClickEvent={onClickEvent} />;
    }

    if (isAuthenticated && hasFriends) {
        return null;
    }

    return (
        <div className="flex flex-col gap-[12px]">
            <p className="text-display w-full text-[20px]">Where your friends are going</p>

            <div className="promo-card w-full rounded-[8px] px-[12px]">
                <div className="flex w-full flex-col items-start justify-center gap-[12px] py-[20px]">
                    <p
                        style={{ letterSpacing: '-0.48px' }}
                        className="w-full text-[14px] font-[400] tracking-[-0.28px] text-brand"
                    >
                        {isAuthenticated ? (
                            'Add friends to attend events together'
                        ) : (
                            <>
                                Sign up to add friends and attend events together
                            </>
                        )}
                    </p>

                    {isAuthenticated ? (
                        <button
                            type="button"
                            onClick={onAddFriends}
                            className="btn-promo flex h-[39px] w-full items-center justify-center rounded-[12px] text-[14px] font-[400] tracking-[-0.28px]"
                        >
                            Add friends
                        </button>
                    ) : (
                        <Link
                            to="/register"
                            className="btn-promo flex h-[39px] w-full items-center justify-center rounded-[12px] text-[14px] font-[400] tracking-[-0.28px]"
                        >
                            Sign up
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
