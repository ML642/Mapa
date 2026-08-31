import { CalendarDays, Clock3, Pencil } from 'lucide-react';
import type { AttendState } from '../../../../services';
import type { EventAttendancePlan } from './useEventCardData';

interface EventCardAttendanceActionsProps {
    isAuthenticated: boolean;
    attendance: EventAttendancePlan;
    isUpdating: boolean;
    onSelectStatus: (state: Exclude<AttendState, 'will_not_attend'>) => void;
    onEdit: () => void;
    onDelete: () => void;
}

const formatPlannedDate = (value: string) => {
    if (!value) return '';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'long',
    }).format(date);
};

export default function EventCardAttendanceActions({
    isAuthenticated,
    attendance,
    isUpdating,
    onSelectStatus,
    onEdit,
    onDelete,
}: EventCardAttendanceActionsProps) {
    if (!isAuthenticated) return null;

    if (attendance.state === 'will_not_attend') {
        return (
            <div className="mt-3 flex w-full gap-2 px-5">
                <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => onSelectStatus('might_attend')}
                    className="h-[38px] w-full rounded-[12px] bg-accent-soft px-4 text-[14px] font-normal tracking-[-0.28px] text-brand transition hover:bg-accent-soft/75 disabled:opacity-50"
                >
                    Interested
                </button>
                <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => onSelectStatus('will_attend')}
                    className="h-[38px] w-full rounded-[12px] bg-brand px-4 text-[14px] font-normal tracking-[-0.28px] text-white transition hover:bg-brand/90 disabled:opacity-50"
                >
                    Going
                </button>
            </div>
        );
    }

    const statusLabel = attendance.state === 'will_attend' ? 'Going' : 'Interested';
    const dateLabel = formatPlannedDate(attendance.plannedDate);
    const hasSchedule = Boolean(dateLabel && attendance.plannedTime);

    return (
        <section className="mx-5 mt-3 rounded-[12px] bg-[#fff0ed] p-3 text-brand">
            <div className="flex items-center justify-between gap-3 text-[12px]">
                <span>Your status:</span>
                <button
                    type="button"
                    disabled={isUpdating}
                    onClick={onDelete}
                    className="underline underline-offset-2 transition hover:opacity-70 disabled:opacity-40"
                >
                    Remove
                </button>
            </div>

            <div className="mt-2 flex min-h-[46px] items-center justify-between gap-3 rounded-[9px] bg-white/75 px-3 py-2">
                <div className="min-w-0">
                    <p className="text-[14px] font-medium leading-tight">{statusLabel}</p>
                    {hasSchedule ? (
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-brand/55">
                            <span className="inline-flex items-center gap-1">
                                <CalendarDays size={12} />
                                {dateLabel}
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <Clock3 size={12} />
                                {attendance.plannedTime}
                            </span>
                        </p>
                    ) : (
                        <p className="mt-1 text-[11px] text-brand/45">Add a date and time</p>
                    )}
                </div>
                <button
                    type="button"
                    aria-label="Edit status"
                    disabled={isUpdating}
                    onClick={onEdit}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-brand transition hover:bg-brand/5 disabled:opacity-40"
                >
                    <Pencil size={16} />
                </button>
            </div>
        </section>
    );
}
