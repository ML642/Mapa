import { useState } from 'react';

interface FriendAvatarProps {
    avatar?: string;
    username: string;
    className?: string;
    textClassName?: string;
}

const getInitial = (username: string) => username.trim().charAt(0).toUpperCase() || '?';

export default function FriendAvatar({
    avatar,
    username,
    className = 'h-[36px] w-[36px]',
    textClassName = 'text-[14px]',
}: FriendAvatarProps) {
    const [imageFailed, setImageFailed] = useState(false);
    return (
        <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand ${className}`}>
            {avatar && !imageFailed ? (
                <img
                    src={avatar}
                    alt={`${username}'s avatar`}
                    className="h-full w-full object-cover"
                    onError={() => setImageFailed(true)}
                />
            ) : (
                <span className={`text-white ${textClassName}`}>{getInitial(username)}</span>
            )}
        </div>
    );
}
