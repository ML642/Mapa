import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function MobileProfileLogoutModal({
    onClose,
    onConfirm,
    open,
}: {
    onClose: () => void;
    onConfirm: () => void;
    open: boolean;
}) {
    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose, open]);

    if (!open || typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(248,237,244,0.7)] px-[20px] backdrop-blur-[7px]"
            onClick={onClose}
        >
            <div
                className="w-full max-w-[353px] rounded-[20px] bg-white px-[20px] py-[24px] shadow-[0_24px_70px_rgba(107,40,94,0.16)]"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="mobile-profile-logout-title"
            >
                <p
                    id="mobile-profile-logout-title"
                    className="mx-auto max-w-[244px] text-center text-[18px] font-[600] leading-[1.15] tracking-[-0.54px] text-brand"
                >
                    Are you sure you want to sign out?
                </p>

                <div className="mt-[20px] flex gap-[8px]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-[14px] bg-[rgba(255,228,233,0.45)] px-[14px] py-[12px] text-[16px] leading-none tracking-[-0.32px] text-brand"
                    >
                        Anuluj
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="flex-1 rounded-[14px] bg-[#FF7A59] px-[14px] py-[12px] text-[16px] leading-none tracking-[-0.32px] text-white"
                    >
                        Sign out
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
