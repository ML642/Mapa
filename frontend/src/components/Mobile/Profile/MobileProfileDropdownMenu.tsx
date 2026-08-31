import type { RefObject } from 'react';
import {
    EditPencilIcon,
    LogoutIcon,
    ShareArrowIcon,
    ThreeDotsIcon,
} from '../../Icons/CommonIcons';

export default function MobileProfileDropdownMenu({
    menuOpen,
    menuRef,
    onEdit,
    onLogout,
    onSettings,
    onShare,
    onToggle,
}: {
    menuOpen: boolean;
    menuRef: RefObject<HTMLDivElement | null>;
    onEdit: () => void;
    onLogout: () => void;
    onSettings: () => void;
    onShare: () => void;
    onToggle: () => void;
}) {
    void onSettings;

    return (
        <div className="absolute right-0 top-0 z-20" ref={menuRef}>
            <button
                type="button"
                onClick={onToggle}
                className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white text-brand shadow-[0_4px_16px_rgba(107,40,94,0.08)]"
                aria-label="Open profile menu"
            >
                <ThreeDotsIcon className="text-brand" />
            </button>

            {menuOpen && (
                <div className="absolute right-0 top-[48px] flex w-[228px] flex-col rounded-[18px] bg-white p-[10px] shadow-[0_8px_32px_rgba(107,40,94,0.14)]">
                    <button
                        type="button"
                        onClick={onEdit}
                        className="flex items-center gap-[12px] rounded-[12px] px-[10px] py-[10px] text-left text-[14px] tracking-[-0.28px] text-brand"
                    >
                        <EditPencilIcon className="h-[17px] w-[17px] text-brand" />
                        <span>Edit profile</span>
                    </button>
                    <button
                        type="button"
                        onClick={onShare}
                        className="flex items-center gap-[12px] rounded-[12px] px-[10px] py-[10px] text-left text-[14px] tracking-[-0.28px] text-brand"
                    >
                        <ShareArrowIcon className="h-[17px] w-[17px] text-brand" />
                        <span>Share profile</span>
                    </button>
                   
                    <div className="my-[4px] h-px bg-[rgba(107,40,94,0.12)]" />
                    <button
                        type="button"
                        onClick={onLogout}
                        className="flex items-center gap-[12px] rounded-[12px] px-[10px] py-[10px] text-left text-[14px] tracking-[-0.28px] text-[#FE5B3C]"
                    >
                        <LogoutIcon className="h-[16px] w-[17px] text-[#FE5B3C]" />
                        <span>Log out</span>
                    </button>
                </div>
            )}
        </div>
    );
}
