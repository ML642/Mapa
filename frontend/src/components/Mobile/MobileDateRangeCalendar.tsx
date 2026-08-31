import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import {
    getCalendarOffset,
    isBeforeIsoDate,
    isSameIsoDate,
    monthNames,
    monthStart,
    parseIsoDate,
    toIsoDate,
    type MobileDateRange,
} from "./mobileDateRange";

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MobileDateRangeCalendar({
    value,
    onChange,
    className = "",
}: {
    value: MobileDateRange;
    onChange: (range: MobileDateRange) => void;
    className?: string;
}) {
    const initialMonth = parseIsoDate(value.start) ?? new Date();
    const [visibleMonth, setVisibleMonth] = useState(() => monthStart(initialMonth));

    const cells = useMemo(() => {
        const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
        const offset = getCalendarOffset(visibleMonth);
        const blanks = Array.from({ length: offset }, () => null);
        const days = Array.from({ length: daysInMonth }, (_, index) => {
            return new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index + 1);
        });

        return [...blanks, ...days];
    }, [visibleMonth]);

    const moveMonth = (direction: -1 | 1) => {
        setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
    };

    const selectDay = (date: Date) => {
        const isoDate = toIsoDate(date);

        if (!value.start || value.end || isBeforeIsoDate(isoDate, value.start)) {
            onChange({ start: isoDate, end: "" });
            return;
        }

        onChange({ start: value.start, end: isoDate });
    };

    const rangeStart = value.start;
    const rangeEnd = value.end;

    return (
        <div className={`w-full ${className}`}>
            <div className="mb-[14px] flex h-[31px] items-center justify-between rounded-[7px] bg-accent-soft px-[8px]">
                <button
                    type="button"
                    onClick={() => moveMonth(-1)}
                    className="flex h-[31px] w-[31px] items-center justify-center rounded-full text-brand active:scale-95"
                    aria-label="Previous month"
                >
                    <ChevronLeft size={22} strokeWidth={2.1} />
                </button>
                <span className="text-[13px] font-[400] leading-none text-brand">
                    {monthNames[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
                </span>
                <button
                    type="button"
                    onClick={() => moveMonth(1)}
                    className="flex h-[31px] w-[31px] items-center justify-center rounded-full text-brand active:scale-95"
                    aria-label="Next month"
                >
                    <ChevronRight size={22} strokeWidth={2.1} />
                </button>
            </div>

            <div className="grid grid-cols-7 text-center text-[11px] font-[400] leading-none text-brand-border">
                {weekdayLabels.map((label) => (
                    <span key={label} className="py-[6px]">
                        {label}
                    </span>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-y-[4px] text-center text-[13px] font-[400] leading-none text-brand">
                {cells.map((date, index) => {
                    if (!date) return <span key={`blank-${index}`} className="h-[29px]" />;

                    const isoDate = toIsoDate(date);
                    const isStart = isSameIsoDate(isoDate, rangeStart);
                    const isEnd = isSameIsoDate(isoDate, rangeEnd);
                    const isBetween = Boolean(
                        rangeStart
                        && rangeEnd
                        && isBeforeIsoDate(rangeStart, isoDate)
                        && isBeforeIsoDate(isoDate, rangeEnd),
                    );
                    const isHighlighted = isStart || isEnd;

                    return (
                        <div
                            key={isoDate}
                            className={`flex h-[29px] items-center justify-center ${
                                isBetween ? 'bg-accent-soft' : ''
                            }`}
                        >
                            <button
                                type="button"
                                onClick={() => selectDay(date)}
                                className={`flex h-[24px] w-[24px] items-center justify-center rounded-full transition active:scale-95 ${
                                    isHighlighted ? "border border-accent bg-accent-ring text-brand" : "text-brand"
                                }`}
                            >
                                {date.getDate()}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
