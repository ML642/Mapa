import { Banknote, X } from 'lucide-react';

type Props = {
    open: boolean;
    min: string;
    max: string;
    onMinChange: (value: string) => void;
    onMaxChange: (value: string) => void;
    onClose: () => void;
    onReset: () => void;
    onApply: () => void;
    layerClassName?: string;
};

const normalizePrice = (value: string) => value.replace(/\D/g, '').slice(0, 6);

export default function PriceFilterModal({ open, min, max, onMinChange, onMaxChange, onClose, onReset, onApply, layerClassName = 'z-[60]' }: Props) {
    if (!open) return null;
    const hasSelection = Boolean(min || max);

    return (
        <div className={`fixed inset-0 ${layerClassName} flex items-center justify-center bg-[rgba(87,34,75,0.20)] p-4 backdrop-blur-[2px]`} role="dialog" aria-modal="true">
            <div className="w-full max-w-[307px] rounded-[12px] bg-white p-[14px] shadow-app-md">
                <div className="mb-[10px] flex items-center justify-between">
                    <h2 className="text-[14px] font-[700] text-brand">Choose a price (PLN)</h2>
                    <button type="button" onClick={onClose} className="flex h-[24px] w-[24px] items-center justify-center text-brand" aria-label="Close price selection"><X size={16} strokeWidth={2} /></button>
                </div>
                <div className="flex items-center gap-[4px]">
                    <label className="flex h-[28px] min-w-0 flex-1 items-center gap-[5px] rounded-[8px] border border-brand-border px-[8px]">
                        <Banknote size={12} strokeWidth={1.5} className="shrink-0 text-brand-border" />
                        <input type="text" inputMode="numeric" maxLength={6} placeholder="Cena od" value={min} onChange={(event) => { const next = normalizePrice(event.target.value); onMinChange(max && Number(next) > Number(max) ? max : next); }} className="min-w-0 flex-1 bg-transparent text-[9px] text-brand outline-none placeholder:text-brand-border" aria-label="Cena od" />
                    </label>
                    <span className="text-brand">—</span>
                    <label className="flex h-[28px] min-w-0 flex-1 items-center gap-[5px] rounded-[8px] border border-brand-border px-[8px]">
                        <Banknote size={12} strokeWidth={1.5} className="shrink-0 text-brand-border" />
                        <input type="text" inputMode="numeric" maxLength={6} placeholder="Cena do" value={max} onChange={(event) => { const next = normalizePrice(event.target.value); onMaxChange(min && Number(next) < Number(min) ? min : next); }} className="min-w-0 flex-1 bg-transparent text-[9px] text-brand outline-none placeholder:text-brand-border" aria-label="Cena do" />
                    </label>
                </div>
                <div className="mt-[18px] flex gap-[4px]">
                    <button type="button" onClick={onReset} disabled={!hasSelection} className="h-[26px] flex-1 rounded-[8px] border border-brand-border text-[9px] text-brand-muted disabled:cursor-not-allowed disabled:opacity-50">Clear</button>
                    <button type="button" onClick={onApply} disabled={!hasSelection} className="h-[26px] flex-1 rounded-[8px] bg-brand text-[9px] text-white disabled:cursor-not-allowed disabled:bg-brand-border disabled:text-brand-muted">Zastosuj</button>
                </div>
            </div>
        </div>
    );
}
