import { Clock3, X } from 'lucide-react';
import { createPortal } from 'react-dom';

type Props = {
    open: boolean;
    start: string;
    end: string;
    onStartChange: (value: string) => void;
    onEndChange: (value: string) => void;
    onClose: () => void;
    onReset: () => void;
    onApply: () => void;
    layerClassName?: string;
    position?: 'fixed' | 'absolute';
};

export default function TimeFilterModal({
    open,
    start,
    end,
    onStartChange,
    onEndChange,
    onClose,
    onReset,
    onApply,
    layerClassName = 'z-[200]',
    position = 'fixed',
}: Props) {
    if (!open) return null;
    const hasSelection = Boolean(start || end);

    const modal = (
        <div
            className={`${layerClassName} flex items-center justify-center bg-[rgba(87,34,75,0.20)] p-4 backdrop-blur-[2px]`}
            style={{ position, inset: 0 }}
            role="dialog"
            aria-modal="true"
        >
            <div className="time-filter-modal w-full max-w-[307px] rounded-[12px] bg-white p-[14px] shadow-app-md">
                <div className="mb-[10px] flex items-center justify-between">
                    <h2 className="text-[14px] font-[700] text-brand">Choose time</h2>
                    <button type="button" onClick={onClose} className="flex h-[24px] w-[24px] items-center justify-center text-brand" aria-label="Close time selection">
                        <X size={16} strokeWidth={2} />
                    </button>
                </div>
                <div className="flex items-center gap-[4px]">
                    <label className="flex h-[28px] min-w-0 flex-1 items-center gap-[5px] rounded-[8px] border border-brand-border px-[8px]">
                        <Clock3 size={12} strokeWidth={1.5} className="shrink-0 text-brand-border" />
                        <input type="time" value={start} onChange={(event) => onStartChange(event.target.value)} className="min-w-0 flex-1 bg-transparent text-[9px] text-brand outline-none" aria-label="Start time" />
                    </label>
                    <span className="text-brand">—</span>
                    <label className="flex h-[28px] min-w-0 flex-1 items-center gap-[5px] rounded-[8px] border border-brand-border px-[8px]">
                        <Clock3 size={12} strokeWidth={1.5} className="shrink-0 text-brand-border" />
                        <input type="time" value={end} onChange={(event) => onEndChange(event.target.value)} className="min-w-0 flex-1 bg-transparent text-[9px] text-brand outline-none" aria-label="End time" />
                    </label>
                </div>
                <div className="mt-[18px] flex gap-[4px]">
                    <button type="button" onClick={onReset} disabled={!hasSelection} className="h-[26px] flex-1 rounded-[8px] border border-brand-border text-[9px] text-brand-muted disabled:cursor-not-allowed disabled:opacity-50">Clear</button>
                    <button type="button" onClick={onApply} disabled={!hasSelection} className="h-[26px] flex-1 rounded-[8px] bg-brand text-[9px] text-white disabled:cursor-not-allowed disabled:bg-brand-border disabled:text-brand-muted">Zastosuj</button>
                </div>
            </div>
        </div>
    );

    return position === 'fixed' && typeof document !== 'undefined'
        ? createPortal(modal, document.body)
        : modal;
}
