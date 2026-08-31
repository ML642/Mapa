import { useEffect, useState } from 'react';
import { Clock3, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import PriceFilterModal from './PriceFilterModal';
import TimeFilterModal from './TimeFilterModal';
import { useFriendModal } from '../contexts/AddFriendsContext';
import { useFriendsData } from '../friends/useFriendsData';
import MobileDateRangeCalendar from '../../Mobile/MobileDateRangeCalendar';
import {
    emptyMobileDateRange,
    emptyMobileFilterDetails,
    formatMobileDateRangeLabel,
    type MobileFilterDetails,
} from '../../Mobile/mobileDateRange';
import { userService } from '../../../services';

const categories = [['Выставка', 'Exhibitions', '/icons/exhibitions.svg'], ['Кино', 'Cinema', '/icons/cinema.svg'], ['Театр', 'Theater', '/icons/theatre.svg'], ['Фестиваль', 'Festivals', '/icons/festival.svg'], ['Музыка', 'Concerts', '/icons/music.svg'], ['Музей', 'Museums', '/icons/museum.svg'], ['Образование', 'Quizzes', '/icons/education.svg'], ['Спорт', 'Sports', '/icons/sport.svg'], ['Квест', 'Quests', '/icons/quests.svg'], ['Клуб', 'Parties', '/icons/clubs.svg'], ['Экскурсия', 'Tours', '/icons/excursion.svg'], ['Для детей', 'For children', '/icons/children.svg']] as const;
const dateOptions = [['today', 'Today'], ['tomorrow', 'Tomorrow'], ['weekend', 'This weekend'], ['month', 'This month']] as const;

type Props = {
    open: boolean;
    selectedCategories: string[];
    filterDetails: MobileFilterDetails;
    searchQuery: string;
    onSearchChange: (value: string) => void;
    onClose: () => void;
    onApply: (categories: string[], details: MobileFilterDetails) => void;
};

export default function DesktopFilterPanel({
    open,
    selectedCategories,
    filterDetails,
    searchQuery,
    onSearchChange,
    onClose,
    onApply,
}: Props) {
    const { openAddFriendsModal } = useFriendModal();
    const { authenticated } = useFriendsData();
    const [friendCount, setFriendCount] = useState<number | null>(null);
    const [draftCategories, setDraftCategories] = useState(selectedCategories);
    const [draftDetails, setDraftDetails] = useState(filterDetails);
    const [dateModalOpen, setDateModalOpen] = useState(false);
    const [modalDateRange, setModalDateRange] = useState(filterDetails.dateRange);
    const [timeModalOpen, setTimeModalOpen] = useState(false);
    const [modalTimeStart, setModalTimeStart] = useState(filterDetails.timeStart);
    const [modalTimeEnd, setModalTimeEnd] = useState(filterDetails.timeEnd);
    const [priceModalOpen, setPriceModalOpen] = useState(false);
    const [modalPriceMin, setModalPriceMin] = useState(filterDetails.priceMin);
    const [modalPriceMax, setModalPriceMax] = useState(filterDetails.priceMax);
    useEffect(() => {
        if (open) {
            setDraftCategories(selectedCategories);
            setDraftDetails(filterDetails);
            setModalDateRange(filterDetails.dateRange);
            setModalTimeStart(filterDetails.timeStart);
            setModalTimeEnd(filterDetails.timeEnd);
            setModalPriceMin(filterDetails.priceMin);
            setModalPriceMax(filterDetails.priceMax);
        }
    }, [filterDetails, open, selectedCategories]);
    useEffect(() => {
        if (!authenticated) {
            setFriendCount(null);
            return;
        }

        let active = true;
        void userService.getCurrentUserProfileData()
            .then((profile) => { if (active) setFriendCount(profile.friendCount); })
            .catch(() => { if (active) setFriendCount(0); });

        return () => { active = false; };
    }, [authenticated]);
    if (!open) return null;
    const setDetail = <K extends keyof MobileFilterDetails>(key: K, value: MobileFilterDetails[K]) => setDraftDetails((current) => ({ ...current, [key]: value }));
    const toggleCategory = (category: string) => setDraftCategories((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category]);
    const reset = () => {
        setDraftCategories([]);
        setDraftDetails(emptyMobileFilterDetails);
    };

    const openDateModal = () => {
        setModalDateRange(draftDetails.dateRange);
        setDateModalOpen(true);
    };

    const applyDateRange = () => {
        setDetail('dateFilter', 'custom');
        setDetail('dateRange', modalDateRange);
        setDateModalOpen(false);
    };

    const resetDateRange = () => {
        setModalDateRange(emptyMobileDateRange);
        setDraftDetails((current) => ({
            ...current,
            dateFilter: '',
            dateRange: emptyMobileDateRange,
        }));
        setDateModalOpen(false);
    };

    const clearDateRange = () => {
        setDraftDetails((current) => ({
            ...current,
            dateFilter: '',
            dateRange: emptyMobileDateRange,
        }));
    };

    const openTimeModal = () => {
        setModalTimeStart(draftDetails.timeStart);
        setModalTimeEnd(draftDetails.timeEnd);
        setTimeModalOpen(true);
    };

    const resetTimeRange = () => {
        setDraftDetails((current) => ({
            ...current,
            timeStart: '',
            timeEnd: '',
        }));
        setModalTimeStart('');
        setModalTimeEnd('');
        setTimeModalOpen(false);
    };

    const clearTimeRange = () => {
        setDraftDetails((current) => ({
            ...current,
            timeStart: '',
            timeEnd: '',
        }));
    };

    const applyTimeRange = () => {
        setDraftDetails((current) => ({
            ...current,
            timeStart: modalTimeStart,
            timeEnd: modalTimeEnd,
        }));
        setTimeModalOpen(false);
    };

    const openPriceModal = () => {
        setModalPriceMin(draftDetails.priceMin === '0' ? '' : draftDetails.priceMin);
        setModalPriceMax(draftDetails.priceMax === '0' ? '' : draftDetails.priceMax);
        setPriceModalOpen(true);
    };

    const resetPriceRange = () => {
        setDraftDetails((current) => ({
            ...current,
            priceMin: '',
            priceMax: '',
        }));
        setModalPriceMin('');
        setModalPriceMax('');
        setPriceModalOpen(false);
    };

    const clearPriceRange = () => {
        setDraftDetails((current) => ({
            ...current,
            priceMin: '',
            priceMax: '',
        }));
    };

    const applyPriceRange = () => {
        setDraftDetails((current) => ({
            ...current,
            priceMin: modalPriceMin,
            priceMax: modalPriceMax,
        }));
        setPriceModalOpen(false);
    };

    const hasCustomDateSelection = Boolean(
        draftDetails.dateFilter === 'custom'
        && draftDetails.dateRange.start,
    );
    const customDateLabel = !draftDetails.dateRange.start
        ? ''
        : draftDetails.dateRange.end
            ? formatMobileDateRangeLabel(draftDetails.dateRange)
            : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' })
                .format(new Date(`${draftDetails.dateRange.start}T00:00:00`));
    const hasTimeSelection = Boolean(draftDetails.timeStart || draftDetails.timeEnd);
    const timeSelectionLabel = [draftDetails.timeStart, draftDetails.timeEnd]
        .filter(Boolean)
        .join(' - ');
    const hasCustomPriceSelection = Boolean(
        (draftDetails.priceMin || draftDetails.priceMax)
        && !(draftDetails.priceMin === '0' && draftDetails.priceMax === '0'),
    );
    const priceSelectionLabel = draftDetails.priceMin && draftDetails.priceMax
        ? `${draftDetails.priceMin} - ${draftDetails.priceMax} PLN`
        : draftDetails.priceMin
            ? `from ${draftDetails.priceMin} PLN`
            : `up to ${draftDetails.priceMax} PLN`;
    const isFreeSelected = draftDetails.priceMin === '0' && draftDetails.priceMax === '0';
    const hasDraftChanges = [
        [...draftCategories].sort().join('|') !== [...selectedCategories].sort().join('|'),
        draftDetails.dateFilter !== filterDetails.dateFilter,
        draftDetails.dateRange.start !== filterDetails.dateRange.start,
        draftDetails.dateRange.end !== filterDetails.dateRange.end,
        draftDetails.timeStart !== filterDetails.timeStart,
        draftDetails.timeEnd !== filterDetails.timeEnd,
        draftDetails.priceMin !== filterDetails.priceMin,
        draftDetails.priceMax !== filterDetails.priceMax,
        draftDetails.friendsInterested !== filterDetails.friendsInterested,
        draftDetails.friendsGoing !== filterDetails.friendsGoing,
    ].some(Boolean);
    const hasDraftFilters = Boolean(
        draftCategories.length
        || draftDetails.dateFilter
        || draftDetails.dateRange.start
        || draftDetails.dateRange.end
        || draftDetails.timeStart
        || draftDetails.timeEnd
        || draftDetails.priceMin
        || draftDetails.priceMax
        || draftDetails.friendsInterested
        || draftDetails.friendsGoing,
    );
    const hasModalDateSelection = Boolean(modalDateRange.start || modalDateRange.end);

    return <aside className="absolute left-[95px] top-0 z-30 flex h-full w-[422px] flex-col bg-white px-[16px] py-[18px] shadow-app-sm">
        <label className="mb-[18px] flex h-[40px] items-center gap-2 rounded-full bg-surface-page px-3 shadow-app-sm">
            <span className="text-brand">⌕</span>
            <input
                type="search"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search"
                className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-brand-muted"
            />
            {searchQuery.trim() ? (
                <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="flex h-5 w-5 items-center justify-center rounded-full text-brand-muted hover:bg-brand-tint hover:text-brand"
                    aria-label="Clear search"
                >
                    <X size={14} strokeWidth={2} aria-hidden />
                </button>
            ) : null}
        </label>
        <div className="mb-[18px] flex items-center justify-between"><h1 className="text-[18px] font-[700] text-brand">Filters</h1><button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-page shadow-app-sm" aria-label="Close filters"><X size={16} /></button></div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <section>
                <h2 className="mb-[8px] text-[14px] font-[500] text-brand">Category</h2>
                <div className="flex flex-wrap gap-[5px]">
                    {categories.map(([value, label, icon]) => {
                        const active = draftCategories.includes(value);

                        return (
                            <button
                                key={value}
                                type="button"
                                onClick={() => toggleCategory(value)}
                                className={`flex min-h-[30px] items-center gap-[5px] rounded-full border px-[9px] py-[4px] text-[10px] ${
                                    active
                                        ? 'border-accent bg-white text-accent'
                                        : 'border-brand-border bg-surface-page text-brand'
                                }`}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`h-4 w-4 shrink-0 ${active ? 'bg-accent' : 'bg-brand'}`}
                                    style={{
                                        WebkitMask: `url(${icon}) center / contain no-repeat`,
                                        mask: `url(${icon}) center / contain no-repeat`,
                                    }}
                                />
                                {label}
                                {active ? <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full bg-accent-soft text-accent"><X size={9} strokeWidth={2.3} aria-hidden /></span> : null}
                            </button>
                        );
                    })}
                </div>
            </section>
            <section className="mt-[20px]">
                <h2 className="mb-[8px] text-[14px] font-[500] text-brand">Dates</h2>
                <div className="flex justify-between  flex-wrap gap-[2px] grow">
                    {dateOptions.map(([value, label]) => {
                        const active = draftDetails.dateFilter === value;

                        return (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setDetail('dateFilter', active ? '' : value)}
                                className={`flex grow items-center justify-center gap-[4px] rounded-full border px-[11px] py-[4px] text-[10px]${
                                    active
                                        ? ' border-accent bg-white text-accent'
                                        : ' border-brand-border bg-surface-page text-brand'
                                }`}
                            >
                                {label}
                                {active ? <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full bg-accent-soft text-accent"><X size={9} strokeWidth={2.3} aria-hidden /></span> : null}
                            </button>
                        );
                    })}
                </div>
                {hasCustomDateSelection ? (
                    <div className="mt-[5px] flex items-center gap-[4px]">
                        <div className="flex h-[28px] items-center rounded-full border border-accent pl-[11px] pr-[5px] text-[10px] text-accent">
                            <button type="button" onClick={openDateModal} className="h-full">
                                {customDateLabel}
                            </button>
                            <button
                                type="button"
                                onClick={clearDateRange}
                                className="ml-[5px] flex h-[14px] w-[14px] items-center justify-center rounded-full bg-accent-soft text-accent"
                                aria-label="Clear dates"
                            >
                                <X size={9} strokeWidth={2.3} aria-hidden />
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={openDateModal}
                        className="mt-[5px] h-[28px] w-full rounded-full border border-brand-border px-[11px] text-[10px] text-brand"
                    >
                        Choose dates
                    </button>
                )}
            </section>
            <section className="mt-[20px]">
                <h2 className="mb-[8px] text-[14px] font-[500] text-brand">Time</h2>
                {hasTimeSelection ? (
                    <div className="flex h-[28px] w-fit items-center rounded-full border border-accent pl-[11px] pr-[5px] text-[10px] text-accent">
                        <button type="button" onClick={openTimeModal} className="h-full">
                            {timeSelectionLabel}
                        </button>
                        <button
                            type="button"
                            onClick={clearTimeRange}
                            className="ml-[5px] flex h-[14px] w-[14px] items-center justify-center rounded-full bg-accent-soft text-accent"
                            aria-label="Clear time"
                        >
                            <X size={9} strokeWidth={2.3} aria-hidden />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={openTimeModal}
                            className="flex h-[40px] min-w-0 flex-1 items-center gap-[8px] rounded-[10px] border border-brand-border px-[11px] text-left text-[11px] text-brand"
                        >
                            <Clock3 size={16} strokeWidth={1.5} className="shrink-0 text-brand-border" />
                            <span className="text-brand-border">Choose time</span>
                        </button>
                        <span className="text-brand">—</span>
                        <button
                            type="button"
                            onClick={openTimeModal}
                            className="flex h-[40px] min-w-0 flex-1 items-center gap-[8px] rounded-[10px] border border-brand-border px-[11px] text-left text-[11px] text-brand"
                        >
                            <Clock3 size={16} strokeWidth={1.5} className="shrink-0 text-brand-border" />
                            <span className="text-brand-border">Choose time</span>
                        </button>
                    </div>
                )}
            </section>
            <section className="mt-[20px]">
                <h2 className="mb-[8px] text-[14px] font-[500] text-brand">Ticket price</h2>
                <div className="flex gap-[5px]">
                    <button
                        type="button"
                        onClick={() => isFreeSelected
                            ? clearPriceRange()
                            : setDraftDetails((current) => ({
                                ...current,
                                priceMin: '0',
                                priceMax: '0',
                            }))}
                        className={`flex flex-1 items-center justify-center gap-[4px] rounded-full border py-[4px] text-[10px] ${
                            isFreeSelected
                                ? 'border-accent bg-white text-accent'
                                : 'border-brand-border text-brand'
                        }`}
                    >
                        Free
                        {isFreeSelected ? <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full bg-accent-soft text-accent"><X size={9} strokeWidth={2.3} aria-hidden /></span> : null}
                    </button>
                    {hasCustomPriceSelection ? (
                        <div className="flex flex-1 items-center justify-center rounded-full border border-accent py-[4px] pl-[11px] pr-[5px] text-[10px] text-accent">
                            <button type="button" onClick={openPriceModal} className="h-full">
                                {priceSelectionLabel}
                            </button>
                            <button
                                type="button"
                                onClick={clearPriceRange}
                                className="ml-[5px] flex h-[14px] w-[14px] items-center justify-center rounded-full bg-accent-soft text-accent"
                                aria-label="Clear price"
                            >
                                <X size={9} strokeWidth={2.3} aria-hidden />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={openPriceModal}
                            className="flex-1 rounded-full border border-brand-border py-[4px] text-[10px] text-brand"
                        >
                            Choose manually
                        </button>
                    )}
                </div>
            </section>
            <section className="mt-[20px]">
                <h2 className="mb-[8px] text-[14px] font-[500] text-brand">Friends</h2>
                {authenticated && friendCount === null ? null : authenticated && friendCount > 0 ? (
                    <div className="flex flex-col gap-[12px]">
                        <label
                            className={[
                                'flex min-h-[78px] items-center gap-4 rounded-[16px]',
                                'border border-brand-border bg-white px-4 py-3',
                                'text-[16px] leading-[20px] text-brand',
                            ].join(' ')}
                        >
                            <span className="min-w-0 flex-1">
                                Show only events your friends want to attend
                            </span>
                            <input
                                type="checkbox"
                                checked={draftDetails.friendsInterested}
                                onChange={(event) => setDetail('friendsInterested', event.target.checked)}
                                className="peer sr-only"
                            />
                            <span
                                className={[
                                    'relative h-[30px] w-[58px] shrink-0 rounded-full',
                                    'bg-brand-border transition-colors peer-checked:bg-accent',
                                ].join(' ')}
                            >
                                <span
                                    className={`absolute top-[3px] h-[24px] w-[24px] rounded-full bg-white shadow-sm transition-transform ${
                                        draftDetails.friendsInterested ? 'translate-x-[31px]' : 'translate-x-[3px]'
                                    }`}
                                />
                            </span>
                        </label>
                        <label
                            className={[
                                'flex min-h-[78px] items-center gap-4 rounded-[16px]',
                                'border border-brand-border bg-white px-4 py-3',
                                'text-[16px] leading-[20px] text-brand',
                            ].join(' ')}
                        >
                            <span className="min-w-0 flex-1">
                                Show only events your friends are attending
                            </span>
                            <input
                                type="checkbox"
                                checked={draftDetails.friendsGoing}
                                onChange={(event) => setDetail('friendsGoing', event.target.checked)}
                                className="peer sr-only"
                            />
                            <span
                                className={[
                                    'relative h-[30px] w-[58px] shrink-0 rounded-full',
                                    'bg-brand-border transition-colors peer-checked:bg-accent',
                                ].join(' ')}
                            >
                                <span
                                    className={`absolute top-[3px] h-[24px] w-[24px] rounded-full bg-white shadow-sm transition-transform ${
                                        draftDetails.friendsGoing ? 'translate-x-[31px]' : 'translate-x-[3px]'
                                    }`}
                                />
                            </span>
                        </label>
                    </div>
                ) : authenticated ? (
                    <div className="rounded-[16px] bg-gradient-to-br from-[#fffdf5] via-[#fff5d8] to-[#ffd5b9] px-[18px] py-[16px] text-brand">
                        <p className="text-[16px] leading-[20px]">You can use this filter after adding friends</p>
                        <p className="mt-[5px] text-[14px] leading-[18px] text-brand-muted">
                            <button type="button" onClick={openAddFriendsModal} className="text-accent underline underline-offset-2">
                                Add friends
                            </button>
                            {', to see where they go'}
                        </p>
                    </div>
                ) : (
                    <div className="rounded-[16px] bg-gradient-to-br from-[#fffdf5] via-[#fff5d8] to-[#ffd5b9] px-[18px] py-[16px] text-brand">
                        <p className="text-[16px] leading-[20px]">This feature is available only to logged-in users.</p>
                        <p className="mt-[5px] text-[14px] leading-[18px] text-brand-muted">
                            <Link to="/register" className="text-accent underline underline-offset-2">
                                Sign up
                            </Link>
                            {' or '}
                            <Link to="/login" className="text-accent underline underline-offset-2">
                                log in
                            </Link>
                            {', to see where your friends are going'}
                        </p>
                    </div>
                )}
            </section>
        </div>
        <div className="mt-4 flex gap-1">
            <button
                type="button"
                onClick={reset}
                disabled={!hasDraftFilters}
                className="h-[34px] flex-1 rounded-[8px] bg-accent-soft text-[10px] text-brand disabled:cursor-not-allowed disabled:bg-surface-page disabled:text-brand-muted disabled:ring-1 disabled:ring-brand-border"
            >
                Reset
            </button>
            <button
                type="button"
                onClick={() => {
                    onApply(draftCategories, draftDetails);
                    onClose();
                }}
                disabled={!hasDraftChanges}
                className="h-[34px] flex-1 rounded-[8px] bg-brand text-[10px] text-white disabled:cursor-not-allowed disabled:bg-brand-border disabled:text-brand-muted"
            >
                Apply
            </button>
        </div>
        {dateModalOpen && (
            <div
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/10 p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="date-picker-title"
            >
                <div className="w-full max-w-[307px] rounded-[16px] bg-white p-[16px] shadow-app-sm">
                    <div className="mb-[10px] flex items-center justify-between">
                        <h2 id="date-picker-title" className="text-[18px] font-[700] text-brand">
                            Dates
                        </h2>
                        <button
                            type="button"
                            onClick={() => setDateModalOpen(false)}
                            className="flex h-[28px] w-[28px] items-center justify-center rounded-full text-brand"
                            aria-label="Close calendar"
                        >
                            <X size={18} strokeWidth={2} />
                        </button>
                    </div>
                    <MobileDateRangeCalendar value={modalDateRange} onChange={setModalDateRange} />
                    <div className="mt-[14px] flex gap-[4px]">
                        <button
                            type="button"
                            onClick={resetDateRange}
                            disabled={!hasModalDateSelection}
                            className="h-[30px] flex-1 rounded-[9px] bg-accent-soft text-[10px] text-brand disabled:cursor-not-allowed disabled:bg-surface-page disabled:text-brand-muted disabled:ring-1 disabled:ring-brand-border"
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            onClick={applyDateRange}
                            disabled={!hasModalDateSelection}
                            className="h-[30px] flex-1 rounded-[9px] bg-brand text-[10px] text-white disabled:cursor-not-allowed disabled:bg-brand-border disabled:text-brand-muted"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </div>
        )}
        <TimeFilterModal
            open={timeModalOpen}
            start={modalTimeStart}
            end={modalTimeEnd}
            onStartChange={setModalTimeStart}
            onEndChange={setModalTimeEnd}
            onClose={() => setTimeModalOpen(false)}
            onReset={resetTimeRange}
            onApply={applyTimeRange}
            position="absolute"
        />
        <PriceFilterModal
            open={priceModalOpen}
            min={modalPriceMin}
            max={modalPriceMax}
            onMinChange={setModalPriceMin}
            onMaxChange={setModalPriceMax}
            onClose={() => setPriceModalOpen(false)}
            onReset={resetPriceRange}
            onApply={applyPriceRange}
        />
    </aside>;
}
