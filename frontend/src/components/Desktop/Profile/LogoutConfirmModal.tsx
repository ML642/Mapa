import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function LogoutConfirmModal({
    open,
    onClose,
    onConfirm,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}) {
    useEffect(() => {
        if (!open) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [open, onClose]);

    if (!open || typeof document === "undefined") return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(248,237,244,0.7)] px-[18px] backdrop-blur-[7px]"
            onClick={onClose}
        >
            <div
                className="w-[335px] max-w-[calc(100vw-26px)] rounded-[14px] bg-white px-[30px] py-[26px] shadow-[0_24px_70px_rgba(107,40,94,0.16)]"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="logout-confirm-title"
            >
                <p
                    id="logout-confirm-title"
                    className="mx-auto max-w-[220px] text-center text-[14px] font-[600] leading-[1.3] tracking-[-0.28px] text-brand"
                >
                    Are you sure you want to sign out?
                </p>

                <div className="mt-[16px] flex items-center gap-[4px]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 whitespace-nowrap rounded-[12px] bg-[rgba(255,228,233,0.45)] px-[8px] py-[11px] text-[12px] leading-none tracking-[-0.24px] text-brand"
                    >
                        Anuluj
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="flex-1 whitespace-nowrap rounded-[12px] bg-[#FE3224] px-[8px] py-[11px] text-[12px] leading-none tracking-[-0.24px] text-white"
                    >
                        Sign out
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
