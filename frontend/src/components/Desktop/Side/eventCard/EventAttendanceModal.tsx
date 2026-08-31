import { CalendarDays, Clock3, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { AttendState } from '../../../../services';
import type { EventAttendancePlan } from './useEventCardData';

interface EventAttendanceModalProps {
    open: boolean;
    initialAttendance: EventAttendancePlan;
    isEditing: boolean;
    isSaving: boolean;
    onClose: () => void;
    onSave: (attendance: EventAttendancePlan) => Promise<void>;
}

const getStatusLabel = (state: AttendState) => (
    state === 'will_attend' ? 'Going' : 'Interested'
);

export default function EventAttendanceModal({
    open,
    initialAttendance,
    isEditing,
    isSaving,
    onClose,
    onSave,
}: EventAttendanceModalProps) {
    const [state, setState] = useState<AttendState>(initialAttendance.state);
    const [plannedDate, setPlannedDate] = useState(initialAttendance.plannedDate);
    const [plannedTime, setPlannedTime] = useState(initialAttendance.plannedTime);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setState(initialAttendance.state);
        setPlannedDate(initialAttendance.plannedDate);
        setPlannedTime(initialAttendance.plannedTime);
        setError('');
    }, [initialAttendance, open]);

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isSaving) onClose();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isSaving, onClose, open]);

    if (!open || typeof document === 'undefined') return null;

    const canSave = state !== 'will_not_attend' && Boolean(plannedDate && plannedTime) && !isSaving;

    const handleSave = async () => {
        if (!canSave) return;
        setError('');

        try {
            await onSave({ state, plannedDate, plannedTime });
        } catch {
            setError('Could not save your status. Please try again.');
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-brand/20 p-4 backdrop-blur-[1px]"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !isSaving) onClose();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="attendance-modal-title"
                className="w-full max-w-[360px] rounded-[18px] bg-white px-5 pb-5 pt-4 text-brand shadow-[0_18px_55px_rgba(73,24,64,0.2)]"
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 id="attendance-modal-title" className="text-[18px] font-semibold leading-tight">
                            {isEditing ? 'Edit status' : `Your status: ${getStatusLabel(state)}`}
                        </h2>
                        <p className="mt-1 text-[12px] leading-[1.35] text-brand/75">
                            Add details so your friends know your plans
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label="Close"
                        onClick={onClose}
                        disabled={isSaving}
                        className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-brand transition-colors hover:bg-brand/5 disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                <fieldset className="mt-4">
                    <legend className="mb-2 text-[13px] font-medium">Choose a status</legend>
                    <div className="flex gap-5">
                        {(['will_attend', 'might_attend'] as const).map((option) => (
                            <label key={option} className="flex cursor-pointer items-center gap-2 text-[13px]">
                                <input
                                    type="radio"
                                    name="attendance-status"
                                    value={option}
                                    checked={state === option}
                                    onChange={() => setState(option)}
                                    className="h-4 w-4 accent-[var(--color-brand)]"
                                />
                                {getStatusLabel(option)}
                            </label>
                        ))}
                    </div>
                </fieldset>

                <label className="mt-4 block text-[13px] font-medium">
                    Which day do you want to attend?
                    <span className="relative mt-2 block">
                        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand/55" size={16} />
                        <input
                            type="date"
                            lang="en-GB"
                            value={plannedDate}
                            onChange={(event) => {
                                setPlannedDate(event.target.value);
                                if (!event.target.value) setPlannedTime('');
                            }}
                            className="h-10 w-full rounded-[10px] border border-brand/20 bg-white pl-10 pr-3 text-[13px] outline-none transition focus:border-brand"
                        />
                    </span>
                </label>

                <label className={`mt-4 block text-[13px] font-medium ${plannedDate ? '' : 'text-brand/35'}`}>
                    What time do you plan to attend?
                    <span className="relative mt-2 block">
                        <Clock3 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" size={16} />
                        <input
                            type="time"
                            lang="en-GB"
                            value={plannedTime}
                            disabled={!plannedDate}
                            onChange={(event) => setPlannedTime(event.target.value)}
                            className="h-10 w-full rounded-[10px] border border-brand/20 bg-white pl-10 pr-3 text-[13px] text-brand outline-none transition focus:border-brand disabled:cursor-not-allowed disabled:bg-brand/[0.025] disabled:text-brand/30"
                        />
                    </span>
                </label>

                {error ? <p className="mt-3 text-[12px] text-red-500">{error}</p> : null}

                <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => {
                            setPlannedDate('');
                            setPlannedTime('');
                            setError('');
                        }}
                        className="h-10 rounded-[10px] border border-brand/10 bg-white text-[13px] text-brand disabled:opacity-50"
                    >
                        Clear
                    </button>
                    <button
                        type="button"
                        disabled={!canSave}
                        onClick={handleSave}
                        className="h-10 rounded-[10px] bg-brand text-[13px] text-white transition disabled:cursor-not-allowed disabled:bg-brand/25"
                    >
                        {isSaving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </section>
        </div>,
        document.body,
    );
}
