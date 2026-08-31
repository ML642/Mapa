import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { friendsService } from '../../../services';
import type { UserProfile } from '../../../services';
import { getApiErrorMessage } from '../../../utils/apiErrors';
import Skeleton from '../../Common/Skeleton';
import ProfileEmptyIllustration from './ProfileEmptyIllustration';

const PublicProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isFriend, setIsFriend] = useState<string>('false');
    const [isFriendLoading, setIsFriendLoading] = useState<boolean>(false);
    const [mutualFriends, setMutualFriends] = useState<number>(0);

    useEffect(() => {
        if (!id) return;

        let cancelled = false;

        const fetchProfile = async () => {
            try {
                setLoading(true);
                setError(null);

                const [friendStatusResult, mutualFriendsResult, userProfileResult] = await Promise.allSettled([
                    friendsService.getIsFriendStatus(id),
                    friendsService.getMutualFriendsTotal(id),
                    friendsService.getUserProfileData(id),
                ]);

                if (cancelled) return;

                if (friendStatusResult.status === 'fulfilled') {
                    setIsFriend(friendStatusResult.value);
                }
                if (mutualFriendsResult.status === 'fulfilled') {
                    setMutualFriends(mutualFriendsResult.value);
                }

                if (userProfileResult.status === 'fulfilled') {
                    setUser(userProfileResult.value);
                } else {
                    setError(getApiErrorMessage(userProfileResult.reason, { fallbackMessage: 'Could not load the user' }));
                    console.error('Error fetching user:', userProfileResult.reason);
                }
            } catch (err: unknown) {
                if (cancelled) return;
                setError(getApiErrorMessage(err, { fallbackMessage: 'Could not load the user' }));
                console.error('Error fetching user:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchProfile();

        return () => {
            cancelled = true;
        };
    }, [id]);

    const sendFriendRequest = async () => {
        if (!id) return;

        try {
            setIsFriendLoading(true);
            await friendsService.sendFriendRequestAction(id);
            setIsFriend('pending');
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, { fallbackMessage: 'Could not send the friend request' }));
            console.error('Error sending friend request:', err);
        } finally {
            setIsFriendLoading(false);
        }
    }

    if (loading) {
        return (
            <div className='flex w-full flex-col items-center gap-[12px] py-[20px]'>
                <Skeleton width="120px" height="120px" borderRadius="50%" />
                <Skeleton width="128px" height="24px" />
                <span className="text-brand-muted text-[14px]">Loading...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className='flex w-full flex-col items-center gap-[12px] py-[20px]'>
                <span className='text-[var(--color-accent)]'>Error: {error}</span>
            </div>
        );
    }

    if (!user) {
        return (
            <div className='flex w-full flex-col items-center gap-[12px] py-[20px]'>
                <span>User not found</span>
            </div>
        );
    }

    return (
        <div className='flex w-full flex-col items-center gap-[12px] py-[20px]'>
            <div className='w-[120px] h-[120px] bg-brand rounded-full flex items-center justify-center'>
                {user.avatar ? (
                    <img
                        src={user.avatar}
                        alt={`${user.username}'s avatar`}
                        className='object-cover w-full h-full rounded-full'
                    />
                ) : (
                    <span className='text-2xl text-white'>
                        {user.username?.charAt(0).toUpperCase()}
                    </span>
                )}
            </div>
            <span className='mt-[16px] text-brand text-[20px]' id='text-cool'>
                {user.username || 'Username'}
            </span>

            <div className='flex items-center justify-center rounded-[8px] bg-accent-soft py-[8px] px-[12px]'>
                <span className='text-[14px] font-[400] text-brand text-center tracking-[-0.28px]'>
                    {mutualFriends || 0} mutual friends
                </span>
            </div>

            <div className='flex flex-col items-center gap-[12px] mt-[48px]'>
                {isFriend !== 'true' && (
                    <>
                        <ProfileEmptyIllustration />

                        <span className='text-brand-muted text-center text-[14px] font-[400] tracking-[-0.28px]'>
                            You cannot view this profile until<br />you become friends
                        </span>
                    </>
                )}

                {isFriend === 'false' && (
                    <button disabled={isFriendLoading} onClick={() => sendFriendRequest()} className={`h-[38px] py-[12px] px-[20px] flex items-center justify-center rounded-[12px] bg-brand text-surface-page text-center text-[14px] font-[400] tracking-[-0.28px] ${isFriendLoading ? 'opacity-50' : ''}`}>
                        {isFriendLoading ? 'Sending request...' : 'Send friend request'}
                    </button>
                )}

                {isFriend === 'pending' && (
                    <button disabled className='h-[38px] py-[12px] px-[20px] flex items-center justify-center rounded-[12px] bg-brand text-surface-page text-center text-[14px] font-[400] tracking-[-0.28px]'>
                        Friend request sent
                    </button>
                )}

                {isFriend === 'true' && (
                    <button disabled className='h-[38px] py-[12px] px-[20px] flex items-center justify-center rounded-[12px] bg-brand text-surface-page text-center text-[14px] font-[400] tracking-[-0.28px]'>
                        You are friends
                    </button>
                )}
            </div>
        </div>
    );
};

export default PublicProfile;
