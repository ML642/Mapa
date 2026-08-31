import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { ChevronLeft, Clock3, X } from "lucide-react";
import { Link } from "react-router-dom";
import MobileDateRangeCalendar from "./MobileDateRangeCalendar";
import {
    areSameMobileDateRanges,
    emptyMobileDateRange,
    formatMobileDateRangeLabel,
    isMobileDateRangeComplete,
    type MobileFilterDetails,
    type MobileDateRange,
} from "./mobileDateRange";
import {
    formatPriceFilterLabel,
    isPriceFilterValid,
} from "./Filters/MobileFilterOptions";
import { useFriendsData } from "../Desktop/friends/useFriendsData";
import { userService } from "../../services";
import TimeFilterModal from "../Desktop/Filters/TimeFilterModal";
import PriceFilterModal from "../Desktop/Filters/PriceFilterModal";

const exhibitions = "/icons/exhibitions.svg";
const music = "/icons/music.svg";
const theatre = "/icons/theatre.svg";
const festival = "/icons/festival.svg";
const museum = "/icons/museum.svg";
const sport = "/icons/sport.svg";
const cinema = "/icons/cinema.svg";
const clubs = "/icons/clubs.svg";
const quests = "/icons/quests.svg";
const education = "/icons/education.svg";
const excursion = "/icons/excursion.svg";
const children = "/icons/children.svg";
const show = "/icons/show.svg";
const dating = "/icons/dating.svg";

type MobileFiltersScreenProps = {
    selectedCategories: string[];
    setSelectedCategories: Dispatch<SetStateAction<string[]>>;
    filterDetails: MobileFilterDetails;
    onApplyDetails: (details: MobileFilterDetails) => void;
    onAddFriends: () => void;
    onClose: () => void;
};

type CategoryOption = {
    label: string;
    displayLabel: string;
    icon: string;
    activeIcon: string;
};

type DateOption = {
    value: string;
    label: string;
};

const categoryOptions: CategoryOption[] = [
    { label: "Выставка", displayLabel: "Exhibitions", icon: exhibitions, activeIcon: "/icons/auth/active/exhibitions_active.svg" },
    { label: "Музыка", displayLabel: "Concerts", icon: music, activeIcon: "/icons/auth/active/music_active.svg" },
    { label: "Театр", displayLabel: "Theatre", icon: theatre, activeIcon: "/icons/auth/active/theatre_active.svg" },
    { label: "Фестиваль", displayLabel: "Festivals", icon: festival, activeIcon: "/icons/auth/active/festival_active.svg" },
    { label: "Музей", displayLabel: "Museums", icon: museum, activeIcon: "/icons/auth/active/museum_active.svg" },
    { label: "Кино", displayLabel: "Cinema", icon: cinema, activeIcon: "/icons/auth/active/cinema_active.svg" },
    { label: "Спорт", displayLabel: "Sports", icon: sport, activeIcon: "/icons/auth/active/sport_active.svg" },
    { label: "Клуб", displayLabel: "Parties", icon: clubs, activeIcon: "/icons/auth/active/clubs_active.svg" },
    { label: "Экскурсия", displayLabel: "Tours", icon: excursion, activeIcon: "/icons/auth/active/excursion_active.svg" },
    { label: "Знакомства", displayLabel: "Dating", icon: dating, activeIcon: dating },
    { label: "Квест", displayLabel: "Quests", icon: quests, activeIcon: "/icons/auth/active/quests_active.svg" },
    { label: "Шоу", displayLabel: "Shows", icon: show, activeIcon: show },
    { label: "Образование", displayLabel: "Quizzes", icon: education, activeIcon: "/icons/auth/active/education_active.svg" },
    { label: "Для детей", displayLabel: "For children", icon: children, activeIcon: "/icons/auth/active/children_active.svg" },
];

const dateOptions: DateOption[] = [
    { value: "today", label: "Today" },
    { value: "tomorrow", label: "Tomorrow" },
    { value: "weekend", label: "Weekend" },
    { value: "month", label: "This month" },
];

const areSameSelections = (left: string[], right: string[]) => {
    return left.length === right.length && left.every((item) => right.includes(item));
};

function FriendFilterToggle({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex min-h-[52px] items-center gap-[8px] rounded-[8px] border border-brand-border bg-white px-[10px] py-[7px]">
            <span className="min-w-0 flex-1 text-[10px] font-[400] leading-[12px] text-brand">{label}</span>
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="peer sr-only"
            />
            <span className="relative h-[18px] w-[34px] shrink-0 rounded-full bg-brand-border transition-colors peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40">
                <span className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
            </span>
        </label>
    );
}

export default function MobileFiltersScreen({
    selectedCategories,
    setSelectedCategories,
    filterDetails,
    onApplyDetails,
    onAddFriends,
    onClose,
}: MobileFiltersScreenProps) {
    const { authenticated } = useFriendsData();
    const [friendCount, setFriendCount] = useState<number | null>(null);
    const [draftCategories, setDraftCategories] = useState<string[]>(selectedCategories);
    const [dateFilter, setDateFilter] = useState(filterDetails.dateFilter);
    const [dateRange, setDateRange] = useState<MobileDateRange>(filterDetails.dateRange);
    const [timeStart, setTimeStart] = useState(filterDetails.timeStart);
    const [timeEnd, setTimeEnd] = useState(filterDetails.timeEnd);
    const [priceMin, setPriceMin] = useState(filterDetails.priceMin);
    const [priceMax, setPriceMax] = useState(filterDetails.priceMax);
    const [dateModalOpen, setDateModalOpen] = useState(false);
    const [modalDateRange, setModalDateRange] = useState<MobileDateRange>(filterDetails.dateRange);
    const [timeModalOpen, setTimeModalOpen] = useState(false);
    const [modalTimeStart, setModalTimeStart] = useState(filterDetails.timeStart);
    const [modalTimeEnd, setModalTimeEnd] = useState(filterDetails.timeEnd);
    const [priceModalOpen, setPriceModalOpen] = useState(false);
    const [modalPriceMin, setModalPriceMin] = useState(filterDetails.priceMin);
    const [modalPriceMax, setModalPriceMax] = useState(filterDetails.priceMax);
    const [friendsInterested, setFriendsInterested] = useState(filterDetails.friendsInterested);
    const [friendsGoing, setFriendsGoing] = useState(filterDetails.friendsGoing);

    useEffect(() => {
        if (!authenticated) {
            setFriendCount(null);
            return;
        }

        let active = true;

        void userService.getCurrentUserProfileData()
            .then((profile) => {
                if (active) setFriendCount(profile.friendCount);
            })
            .catch(() => {
                if (active) setFriendCount(0);
            });

        return () => {
            active = false;
        };
    }, [authenticated]);

    const changed = useMemo(() => {
        return (
            !areSameSelections(draftCategories, selectedCategories) ||
            dateFilter !== filterDetails.dateFilter ||
            !areSameMobileDateRanges(dateRange, filterDetails.dateRange) ||
            timeStart !== filterDetails.timeStart ||
            timeEnd !== filterDetails.timeEnd ||
            priceMin !== filterDetails.priceMin ||
            priceMax !== filterDetails.priceMax ||
            friendsInterested !== filterDetails.friendsInterested ||
            friendsGoing !== filterDetails.friendsGoing
        );
    }, [dateFilter, dateRange, draftCategories, filterDetails, friendsGoing, friendsInterested, priceMax, priceMin, selectedCategories, timeEnd, timeStart]);

    const hasCustomDateSelection = dateFilter === "custom" && isMobileDateRangeComplete(dateRange);
    const customDateLabel = hasCustomDateSelection ? formatMobileDateRangeLabel(dateRange) : "";
    const isFreeSelected = priceMin === "0" && priceMax === "0";
    const hasCustomPriceSelection = Boolean((priceMin || priceMax) && !isFreeSelected);
    const priceSelectionLabel = formatPriceFilterLabel({ min: priceMin, max: priceMax });
    const dateFilterValid = dateFilter !== "custom" || hasCustomDateSelection;
    const priceFilterValid = isPriceFilterValid({ min: priceMin, max: priceMax });
    const canApply = changed && dateFilterValid && priceFilterValid;

    const toggleCategory = (label: string) => {
        setDraftCategories((prev) =>
            prev.includes(label) ? prev.filter((category) => category !== label) : [...prev, label],
        );
    };

    const resetAll = () => {
        setDraftCategories([]);
        setDateFilter("");
        setDateRange(emptyMobileDateRange);
        setTimeStart("");
        setTimeEnd("");
        setPriceMin("");
        setPriceMax("");
        setModalDateRange(emptyMobileDateRange);
        setModalTimeStart("");
        setModalTimeEnd("");
        setModalPriceMin("");
        setModalPriceMax("");
        setFriendsInterested(false);
        setFriendsGoing(false);
    };

    const openDateModal = () => {
        setModalDateRange(dateRange);
        setDateModalOpen(true);
    };

    const openTimeModal = () => {
        setModalTimeStart(timeStart);
        setModalTimeEnd(timeEnd);
        setTimeModalOpen(true);
    };

    const openPriceModal = () => {
        setModalPriceMin(isFreeSelected ? "" : priceMin);
        setModalPriceMax(isFreeSelected ? "" : priceMax);
        setPriceModalOpen(true);
    };

    const applyFilters = () => {
        setSelectedCategories(draftCategories);
        onApplyDetails({
            dateFilter,
            dateRange: dateFilter === "custom" ? dateRange : emptyMobileDateRange,
            timeStart,
            timeEnd,
            priceMin,
            priceMax,
            friendsInterested,
            friendsGoing,
        });
        onClose();
    };

    return (
        <section className="fixed inset-0 z-[120] flex flex-col overflow-hidden bg-white text-brand">
            <header
                className="relative flex shrink-0 items-center px-[18px] pb-[8px]"
                style={{ paddingTop: "max(14px, env(safe-area-inset-top, 0px))" }}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="-ml-[8px] flex h-[32px] w-[32px] items-center justify-center rounded-full active:scale-95"
                    aria-label="Back"
                >
                    <ChevronLeft size={19} strokeWidth={2.2} />
                </button>
                <h1 className="pointer-events-none absolute inset-x-0 text-center text-[14px] font-[700] leading-none">Filters</h1>
                <button
                    type="button"
                    onClick={resetAll}
                    className="ml-auto w-[64px] text-right text-[10px] font-[400] leading-none text-accent"
                >
                    Reset
                </button>
            </header>

            <div
                className="min-h-0 flex-1 overflow-y-auto px-[18px] pt-[4px]"
                style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
            >
                <section className="flex flex-col gap-[8px]">
                    <h2 className="text-[12px] font-[700] leading-none">Categories</h2>
                    <div className="flex flex-wrap gap-[4px]">
                        {categoryOptions.map((option) => {
                            const active = draftCategories.includes(option.label);

                            return (
                                <button
                                    key={option.label}
                                    type="button"
                                    onClick={() => toggleCategory(option.label)}
                                    className={`flex h-[28px] items-center gap-[4px] rounded-[14px] border px-[8px] text-[10px] font-[400] leading-none ${
                                        active
                                            ? "border-accent bg-white text-accent"
                                            : "border-brand-border bg-white text-brand"
                                    }`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`h-[15px] w-[15px] shrink-0 ${active ? "bg-accent" : "bg-brand"}`}
                                        style={{
                                            WebkitMask: `url(${option.icon}) center / contain no-repeat`,
                                            mask: `url(${option.icon}) center / contain no-repeat`,
                                        }}
                                    />
                                    <span>{option.displayLabel}</span>
                                    {active ? <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full bg-accent-soft text-accent"><X size={9} strokeWidth={2.3} aria-hidden /></span> : null}
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="mt-[16px] flex flex-col gap-[8px]">
                    <h2 className="text-[12px] font-[700] leading-none">Dates</h2>
                    <div className="flex flex-col gap-[5px]">
                        <div className="grid grid-cols-4 gap-[4px]">
                        {dateOptions.map((option) => {
                            const active = dateFilter === option.value;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        if (active) {
                                            setDateFilter("");
                                            setDateRange(emptyMobileDateRange);
                                        } else {
                                            setDateFilter(option.value);
                                            setDateRange(emptyMobileDateRange);
                                        }
                                    }}
                                    className={`flex h-[28px] w-full items-center justify-center gap-[2px] whitespace-nowrap rounded-full border px-[2px] text-[9px] font-[400] leading-none tracking-[-0.2px] ${
                                        active
                                            ? "border-accent bg-white text-accent"
                                            : "border-brand-border bg-white text-brand"
                                    }`}
                                >
                                    {option.label}
                                    {active ? <span className="flex h-[12px] w-[12px] shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent"><X size={8} strokeWidth={2.3} aria-hidden /></span> : null}
                                </button>
                            );
                        })}
                        </div>
                        {hasCustomDateSelection ? (
                            <div className="flex h-[28px] w-fit items-center rounded-full border border-accent bg-white pl-[8px] pr-[5px] text-[10px] text-accent">
                                <button type="button" onClick={openDateModal} className="h-full">{customDateLabel}</button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDateFilter("");
                                        setDateRange(emptyMobileDateRange);
                                    }}
                                    className="ml-[5px] flex h-[14px] w-[14px] items-center justify-center rounded-full bg-accent-soft text-accent"
                                    aria-label="Clear dates"
                                >
                                    <X size={9} strokeWidth={2.3} aria-hidden />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={openDateModal}
                                className="h-[28px] w-full rounded-full border border-brand-border bg-white px-[12px] text-[10px] font-[400] leading-none text-brand"
                            >
                                Choose dates
                            </button>
                        )}
                    </div>
                </section>

                <section className="mt-[16px] flex flex-col gap-[8px]">
                    <h2 className="text-[12px] font-[700] leading-none">Time</h2>
                    <div className="flex items-center gap-[8px]">
                        <button
                            type="button"
                            onClick={openTimeModal}
                            className="flex h-[32px] min-w-0 flex-1 items-center gap-[7px] rounded-[7px] border border-brand-border px-[9px] text-left"
                        >
                            <Clock3 size={14} strokeWidth={1.7} className="shrink-0 text-brand-border" aria-hidden />
                            <span className={`min-w-0 truncate text-[10px] leading-none ${timeStart ? "text-brand" : "text-brand-border"}`}>{timeStart || "Choose a time"}</span>
                        </button>
                        <span className="shrink-0 text-[16px] leading-none text-brand">−</span>
                        <button
                            type="button"
                            onClick={openTimeModal}
                            className="flex h-[32px] min-w-0 flex-1 items-center gap-[7px] rounded-[7px] border border-brand-border px-[9px] text-left"
                        >
                            <Clock3 size={14} strokeWidth={1.7} className="shrink-0 text-brand-border" aria-hidden />
                            <span className={`min-w-0 truncate text-[10px] leading-none ${timeEnd ? "text-brand" : "text-brand-border"}`}>{timeEnd || "Choose a time"}</span>
                        </button>
                    </div>
                </section>

                <section className="mt-[16px] flex flex-col gap-[8px]">
                    <h2 className="text-[12px] font-[700] leading-none">Admission price</h2>
                    <div className="flex gap-[5px]">
                        <button
                            type="button"
                            onClick={() => {
                                if (isFreeSelected) {
                                    setPriceMin("");
                                    setPriceMax("");
                                } else {
                                    setPriceMin("0");
                                    setPriceMax("0");
                                }
                            }}
                            className={`flex h-[28px] flex-1 items-center justify-center gap-[4px] rounded-full border px-[8px] text-[10px] leading-none ${
                                isFreeSelected ? "border-accent bg-white text-accent" : "border-brand-border bg-white text-brand"
                            }`}
                        >
                            Free
                            {isFreeSelected ? <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full bg-accent-soft text-accent"><X size={9} strokeWidth={2.3} aria-hidden /></span> : null}
                        </button>
                        {hasCustomPriceSelection ? (
                            <div className="flex h-[28px] flex-1 items-center justify-center rounded-full border border-accent bg-white pl-[8px] pr-[5px] text-[10px] text-accent">
                                <button type="button" onClick={openPriceModal} className="min-w-0 truncate">{priceSelectionLabel}</button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPriceMin("");
                                        setPriceMax("");
                                    }}
                                    className="ml-[5px] flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent"
                                    aria-label="Clear price"
                                >
                                    <X size={9} strokeWidth={2.3} aria-hidden />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={openPriceModal}
                                className="h-[28px] flex-1 rounded-full border border-brand-border bg-white px-[8px] text-[10px] leading-none text-brand"
                            >
                                Choose a price
                            </button>
                        )}
                    </div>
                    {!priceFilterValid ? (
                        <span className="text-[10px] font-[400] leading-none text-accent">
                            {formatPriceFilterLabel({ min: priceMin, max: priceMax })}: check the range
                        </span>
                    ) : null}
                </section>

                <section className="mt-[16px] flex flex-col gap-[8px]">
                    <h2 className="text-[12px] font-[700] leading-none">Friends</h2>
                    {authenticated && friendCount === null ? null : authenticated && friendCount > 0 ? (
                        <div className="flex flex-col gap-[6px]">
                            <FriendFilterToggle
                                label="Show only events friends are interested in"
                                checked={friendsInterested}
                                onChange={setFriendsInterested}
                            />
                            <FriendFilterToggle
                                label="Show only events friends are going to"
                                checked={friendsGoing}
                                onChange={setFriendsGoing}
                            />
                        </div>
                    ) : authenticated ? (
                        <div className="rounded-[9px] bg-gradient-to-br from-[#fffdf5] via-[#fff8dc] to-[#fff1c4] px-[10px] py-[9px] text-brand">
                            <p className="text-[10px] leading-[12px]">You can use this filter after adding friends.</p>
                            <p className="mt-[3px] text-[9px] leading-[12px] text-brand-muted">
                                <button type="button" onClick={onAddFriends} className="text-accent underline underline-offset-2">
                                    Add friends
                                </button>
                                {', to see where they are going'}
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-[9px] bg-gradient-to-br from-[#fffdf5] via-[#fff8dc] to-[#fff1c4] px-[10px] py-[9px] text-brand">
                            <p className="text-[10px] leading-[12px]">This feature is only available to signed-in users.</p>
                            <p className="mt-[3px] text-[9px] leading-[12px] text-brand-muted">
                                <Link to="/register" className="text-accent underline underline-offset-2">
                                    Sign up
                                </Link>
                                {' or '}
                                <Link to="/login" className="text-accent underline underline-offset-2">
                                    sign in
                                </Link>
                                {', to see where your friends are going'}
                            </p>
                        </div>
                    )}
                </section>
                <button
                    type="button"
                    onClick={applyFilters}
                    disabled={!canApply}
                    className="mt-[16px] h-[30px] w-full rounded-[7px] bg-brand text-[10px] font-[400] leading-none text-white disabled:bg-brand-border disabled:text-white/50"
                >
                    Apply
                </button>
            </div>
            {dateModalOpen ? (
                <div className="fixed inset-0 z-[140] flex items-center justify-center bg-[rgba(87,34,75,0.20)] p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="mobile-date-picker-title">
                    <div className="w-full max-w-[307px] rounded-[12px] bg-white p-[14px] shadow-app-md">
                        <div className="mb-[10px] flex items-center justify-between">
                            <h2 id="mobile-date-picker-title" className="text-[14px] font-[700] text-brand">Choose dates</h2>
                            <button type="button" onClick={() => setDateModalOpen(false)} className="flex h-[24px] w-[24px] items-center justify-center text-brand" aria-label="Close date picker">
                                <X size={16} strokeWidth={2} />
                            </button>
                        </div>
                        <MobileDateRangeCalendar value={modalDateRange} onChange={setModalDateRange} />
                        <div className="mt-[14px] flex gap-[4px]">
                            <button
                                type="button"
                                onClick={() => setModalDateRange(emptyMobileDateRange)}
                                disabled={!modalDateRange.start && !modalDateRange.end}
                                className="h-[30px] flex-1 rounded-[8px] bg-accent-soft text-[10px] text-brand disabled:cursor-not-allowed disabled:bg-surface-page disabled:text-brand-muted disabled:ring-1 disabled:ring-brand-border"
                            >
                                Reset
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setDateFilter("custom");
                                    setDateRange(modalDateRange);
                                    setDateModalOpen(false);
                                }}
                                disabled={!isMobileDateRangeComplete(modalDateRange)}
                                className="h-[30px] flex-1 rounded-[8px] bg-brand text-[10px] text-white disabled:cursor-not-allowed disabled:bg-brand-border disabled:text-brand-muted"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
            <TimeFilterModal
                open={timeModalOpen}
                start={modalTimeStart}
                end={modalTimeEnd}
                onStartChange={setModalTimeStart}
                onEndChange={setModalTimeEnd}
                onClose={() => setTimeModalOpen(false)}
                onReset={() => {
                    setModalTimeStart("");
                    setModalTimeEnd("");
                }}
                onApply={() => {
                    setTimeStart(modalTimeStart);
                    setTimeEnd(modalTimeEnd);
                    setTimeModalOpen(false);
                }}
                layerClassName="z-[140]"
            />
            <PriceFilterModal
                open={priceModalOpen}
                min={modalPriceMin}
                max={modalPriceMax}
                onMinChange={setModalPriceMin}
                onMaxChange={setModalPriceMax}
                onClose={() => setPriceModalOpen(false)}
                onReset={() => {
                    setModalPriceMin("");
                    setModalPriceMax("");
                }}
                onApply={() => {
                    setPriceMin(modalPriceMin);
                    setPriceMax(modalPriceMax);
                    setPriceModalOpen(false);
                }}
                layerClassName="z-[140]"
            />
        </section>
    );
}
