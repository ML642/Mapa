import type { ReactNode } from 'react';
import FriendAvatar from './FriendAvatar';

interface FriendRelationshipRowProps {
    avatar?: string;
    username: string;
    subtitle: string;
    actions: ReactNode;
}

export default function FriendRelationshipRow({
    avatar,
    username,
    subtitle,
    actions,
}: FriendRelationshipRowProps) {
    return (
        <div className="flex min-h-[58px] items-center justify-between rounded-[18px] bg-white/90 px-[14px] py-[12px] shadow-[0_6px_20px_rgba(107,40,94,0.05)]">
            <div className="flex min-w-0 items-center gap-[12px]">
                <FriendAvatar avatar={avatar} username={username} />

                <div className="min-w-0">
                    <p className="truncate text-[16px] font-[500] leading-none tracking-[-0.48px] text-brand">
                        {username}
                    </p>
                    <p className="mt-[6px] text-[12px] leading-none tracking-[-0.24px] text-brand-muted">
                        {subtitle}
                    </p>
                </div>
            </div>

            <div className="ml-[12px] shrink-0">
                {actions}
            </div>
        </div>
    );
}
