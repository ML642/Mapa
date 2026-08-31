import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import "./Filters.css";
import MobileDateRangeCalendar from '../../Mobile/MobileDateRangeCalendar';
import { emptyMobileDateRange, getMobileSelectedFiltersCount, type MobileFilterDetails } from '../../Mobile/mobileDateRange';
import { formatTimeFilterLabel, getMobileCategoryLabel, getMobileDateLabel, getMobilePriceLabel } from '../../Mobile/Filters/MobileFilterOptions';
import PriceFilterModal from './PriceFilterModal';
import TimeFilterModal from './TimeFilterModal';

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
const childrenn = "/icons/children.svg";

interface FiltersProps {
  selectedCategories: string[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;
  onOpenFullFilters: () => void;
  filterDetails: MobileFilterDetails;
  setFilterDetails: React.Dispatch<React.SetStateAction<MobileFilterDetails>>;
}

const filters = [
  { icon: exhibitions, value: "Выставка", label: "Exhibitions" },
  { icon: music, value: "Музыка", label: "Concerts" },
  { icon: theatre, value: "Театр", label: "Performances" },
  { icon: festival, value: "Фестиваль", label: "Festivals" },
  { icon: museum, value: "Музей", label: "Museums" },
  { icon: sport, value: "Спорт", label: "Sports" },
  { icon: cinema, value: "Кино", label: "Cinema" },
  { icon: clubs, value: "Клуб", label: "Parties" },
  { icon: quests, value: "Квест", label: "Quests" },
  { icon: education, value: "Образование", label: "Quizzes" },
  { icon: excursion, value: "Экскурсия", label: "Tours" },
  { icon: childrenn, value: "Для детей", label: "For children" },
];

const Filters: React.FC<FiltersProps> = ({
  selectedCategories,
  setSelectedCategories,
  onOpenFullFilters,
  filterDetails,
  setFilterDetails,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const priceTriggerRef = useRef<HTMLButtonElement>(null);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [maskClass, setMaskClass] = useState("");
  const [quickMenu, setQuickMenu] = useState<'categories' | 'dates' | 'price' | null>(null);
  const [quickCategories, setQuickCategories] = useState<string[]>(selectedCategories);
  const [priceMenuLeft, setPriceMenuLeft] = useState(0);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [modalDateRange, setModalDateRange] = useState(filterDetails.dateRange);
  const [modalTimeStart, setModalTimeStart] = useState(filterDetails.timeStart);
  const [modalTimeEnd, setModalTimeEnd] = useState(filterDetails.timeEnd);
  const [modalPriceMin, setModalPriceMin] = useState(filterDetails.priceMin);
  const [modalPriceMax, setModalPriceMax] = useState(filterDetails.priceMax);
  const selectedFiltersCount = getMobileSelectedFiltersCount(selectedCategories, filterDetails);
  const timeLabel = formatTimeFilterLabel({ start: filterDetails.timeStart, end: filterDetails.timeEnd });
  const detailedMode = Boolean(selectedCategories.length || filterDetails.dateFilter || timeLabel || filterDetails.priceMin || filterDetails.priceMax || filterDetails.friendsInterested || filterDetails.friendsGoing);

  const toggleCategory = (label: string) => {
    if (!label) return;

    setSelectedCategories((prev) =>
      prev.includes(label) ? prev.filter((cat) => cat !== label) : [...prev, label],
    );
  };

  const openDateModal = () => {
    setModalDateRange(filterDetails.dateRange);
    setDateModalOpen(true);
  };

  const openTimeModal = () => {
    setModalTimeStart(filterDetails.timeStart);
    setModalTimeEnd(filterDetails.timeEnd);
    setTimeModalOpen(true);
  };

  const openPriceModal = () => {
    setModalPriceMin(filterDetails.priceMin === '0' ? '' : filterDetails.priceMin);
    setModalPriceMax(filterDetails.priceMax === '0' ? '' : filterDetails.priceMax);
    setPriceModalOpen(true);
  };

  const openPriceMenu = () => {
    const triggerRect = priceTriggerRef.current?.getBoundingClientRect();
    const rootRect = rootRef.current?.getBoundingClientRect();
    setPriceMenuLeft(triggerRect && rootRect ? triggerRect.left - rootRect.left : 0);
    setQuickMenu((current) => current === 'price' ? null : 'price');
  };

  const openCategoryMenu = () => {
    setQuickCategories(selectedCategories);
    setQuickMenu((current) => current === 'categories' ? null : 'categories');
  };

  useEffect(() => {
    const checkScroll = () => {
      const el = scrollRef.current;
      if (!el) return;

      const isOverflowing = el.scrollWidth > el.clientWidth + 1;
      const reachedEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      const atStart = el.scrollLeft <= 1;

      if (!isOverflowing) {
        setShowRightArrow(false);
        setShowLeftArrow(false);
        setMaskClass("");
      } else if (atStart) {
        setShowRightArrow(true);
        setShowLeftArrow(false);
        setMaskClass("mask-right");
      } else if (reachedEnd) {
        setShowRightArrow(false);
        setShowLeftArrow(true);
        setMaskClass("mask-left");
      } else {
        setShowRightArrow(true);
        setShowLeftArrow(true);
        setMaskClass("mask-both");
      }
    };

    checkScroll();
    window.addEventListener("resize", checkScroll);
    const scrollEl = scrollRef.current;
    scrollEl?.addEventListener("scroll", checkScroll, { passive: true });

    return () => {
      window.removeEventListener("resize", checkScroll);
      scrollEl?.removeEventListener("scroll", checkScroll);
    };
  }, []);

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" });
  };

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -200, behavior: "smooth" });
  };

  return (
    <div ref={rootRef} className="relative flex w-[98.9%] items-center bg-transparent py-2">
      <button type="button" onClick={onOpenFullFilters} className="relative mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-page shadow-app-sm" aria-label="Open filters"><img src="/icons/filter.svg" alt="" className="h-[18px] w-[18px]" />{selectedFiltersCount > 0 ? <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">{selectedFiltersCount}</span> : null}</button>
      {!detailedMode && showLeftArrow && (
        <button
          type="button"
          onClick={scrollLeft}
          className="absolute left-[58px] top-[45px] z-10 flex h-[36px] w-[36px] -translate-y-1/2 items-center justify-center rounded-full bg-surface-page text-brand shadow-app-sm"
        >
          <ChevronRight className="h-5 w-5 rotate-180" strokeWidth={3} aria-hidden="true" />
        </button>
      )}

      {detailedMode ? (
        <div className="flex h-[75px] items-center gap-2 overflow-hidden">
          {[
             { key: 'categories', label: selectedCategories.length ? `${getMobileCategoryLabel(selectedCategories[0])}${selectedCategories.length > 1 ? ` +${selectedCategories.length - 1}` : ''}` : 'Category', active: selectedCategories.length > 0, clear: () => setSelectedCategories([]), open: openCategoryMenu },
             { key: 'dates', label: getMobileDateLabel(filterDetails) || 'Dates', active: Boolean(filterDetails.dateFilter), clear: () => setFilterDetails((current) => ({ ...current, dateFilter: '', dateRange: { start: '', end: '' } })), open: () => setQuickMenu((current) => current === 'dates' ? null : 'dates') },
             { key: 'time', label: timeLabel || 'Time', active: Boolean(timeLabel), clear: () => setFilterDetails((current) => ({ ...current, timeStart: '', timeEnd: '' })), open: openTimeModal },
             { key: 'price', label: getMobilePriceLabel(filterDetails) || 'Price', active: Boolean(filterDetails.priceMin || filterDetails.priceMax), clear: () => setFilterDetails((current) => ({ ...current, priceMin: '', priceMax: '' })), open: openPriceMenu },
             { key: 'friends', label: 'Friends', active: filterDetails.friendsInterested || filterDetails.friendsGoing, clear: () => setFilterDetails((current) => ({ ...current, friendsInterested: false, friendsGoing: false })), open: onOpenFullFilters },
          ].map((filter) => filter.active ? (
            <div key={filter.key} className="flex shrink-0 items-center gap-1 rounded-full border border-accent bg-accent-soft px-3 py-2 text-[12px] text-accent shadow-app-sm"><button ref={filter.key === 'price' ? priceTriggerRef : undefined} type="button" onClick={filter.open}>{filter.label}</button><button type="button" onClick={filter.clear} aria-label={`Clear ${filter.label}`}><X size={14} /></button></div>
          ) : (
            <button ref={filter.key === 'price' ? priceTriggerRef : undefined} key={filter.key} type="button" onClick={filter.open} className="flex shrink-0 items-center gap-1 rounded-full bg-surface-page px-3 py-2 text-[12px] text-brand-muted shadow-app-sm">{filter.label}<ChevronDown size={14} /></button>
          ))}
        </div>
      ) : <div
        ref={scrollRef}
        className={`flex h-[75px] items-center gap-2 overflow-x-auto scroll-smooth no-scrollbar transition-all duration-300 ${maskClass}`}
      >
        {filters.map((filter, index) => {
          const isActive = selectedCategories.includes(filter.value);
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => toggleCategory(filter.value)}
              className={`flex flex-shrink-0 items-center gap-[10px] whitespace-nowrap rounded-full p-[10px] text-brand transition ${
                index === 0 ? "ml-[12px]" : ""
              } ${isActive ? "bg-accent text-white shadow-app-accent" : "bg-surface-base shadow-app-sm"}`}
            >
              <img src={filter.icon} alt="" className="h-5 w-5" />
              <span className="text-sm font-[400]">{filter.label}</span>
            </button>
          );
        })}
      </div>}

      {!detailedMode && showRightArrow && (
        <button
          type="button"
          onClick={scrollRight}
          className="absolute right-2 top-[45px] z-10 flex h-[36px] w-[36px] -translate-y-1/2 items-center justify-center rounded-full bg-surface-page text-brand shadow-app-sm"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
        </button>
      )}
      {quickMenu === 'dates' && (
        <div className="absolute left-[58px] top-[58px] z-20 w-[194px] rounded-[16px] bg-white p-[16px] text-brand shadow-app-sm">
          <h3 className="mb-[10px] text-center text-[16px] font-[700]">Dates</h3>
          {[
            ['today', 'Today'],
            ['tomorrow', 'Tomorrow'],
            ['weekend', 'This weekend'],
            ['month', 'This month'],
          ].map(([value, label]) => (
            <button key={value} type="button" onClick={() => { setFilterDetails((current) => ({ ...current, dateFilter: value, dateRange: { start: '', end: '' } })); setQuickMenu(null); }} className="flex w-full items-center gap-2 py-[5px] text-left text-[14px]">
              <span className="h-[20px] w-[20px] rounded-full border border-brand" />
              {label}
            </button>
          ))}
          <button type="button" onClick={() => { setQuickMenu(null); openDateModal(); }} className="flex w-full items-center gap-2 py-[5px] text-left text-[14px]">
            <span className="h-[20px] w-[20px] rounded-full border border-brand" />
            Choose manually
          </button>
        </div>
      )}
      {quickMenu === 'categories' && (
        <div className="absolute left-[58px] top-[58px] z-20 w-[250px] rounded-[16px] bg-white p-[16px] text-brand shadow-app-sm">
          <h3 className="mb-[10px] text-center text-[16px] font-[700]">Categories</h3>
          <div className="grid grid-cols-2 gap-[6px]">
            {filters.map((filter) => {
              const active = quickCategories.includes(filter.value);
              return (
                <button key={filter.value} type="button" onClick={() => setQuickCategories((current) => current.includes(filter.value) ? current.filter((value) => value !== filter.value) : [...current, filter.value])} className={`flex items-center gap-[6px] rounded-full border px-[8px] py-[6px] text-left text-[11px] ${active ? 'border-accent text-accent' : 'border-brand-border text-brand'}`}>
                  <img src={filter.icon} alt="" className="h-[14px] w-[14px]" />
                  {filter.label}
                </button>
              );
            })}
          </div>
          <div className="mt-[14px] flex gap-[4px]">
            <button type="button" onClick={() => { setSelectedCategories([]); setQuickCategories([]); setQuickMenu(null); }} className="h-[28px] flex-1 rounded-[8px] border border-brand-border text-[10px] text-brand-muted">Reset</button>
            <button type="button" onClick={() => { setSelectedCategories(quickCategories); setQuickMenu(null); }} className="h-[28px] flex-1 rounded-[8px] bg-brand text-[10px] text-white">Apply</button>
          </div>
        </div>
      )}
      {quickMenu === 'price' && (
        <div style={{ left: priceMenuLeft }} className="absolute top-[58px] z-20 w-[200px] rounded-[16px] bg-white px-[16px] py-[16px] text-brand shadow-app-sm">
          <h3 className="mb-[10px] text-center text-[16px] font-[700]">Price</h3>
          <button type="button" onClick={() => { setFilterDetails((current) => ({ ...current, priceMin: '0', priceMax: '0' })); setQuickMenu(null); }} className="flex w-full items-center gap-[9px] py-[5px] text-left text-[14px]"><span className="h-[20px] w-[20px] rounded-full border border-brand" />Free</button>
          <button type="button" onClick={() => { setQuickMenu(null); openPriceModal(); }} className="mt-[2px] flex w-full items-center gap-[9px] py-[5px] text-left text-[14px]"><span className="h-[20px] w-[20px] rounded-full border border-brand" />Choose manually</button>
        </div>
      )}
      {dateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/10 p-4">
          <div className="w-full max-w-[360px] rounded-[16px] bg-white p-[16px] shadow-app-sm">
            <div className="mb-[10px] flex items-center justify-between">
              <h2 className="text-[16px] font-[700] text-brand">Dates</h2>
              <button type="button" onClick={() => setDateModalOpen(false)} className="text-brand" aria-label="Close calendar"><X size={18} /></button>
            </div>
            <MobileDateRangeCalendar value={modalDateRange} onChange={setModalDateRange} />
            <div className="mt-[14px] flex gap-[4px]">
              <button type="button" onClick={() => { setFilterDetails((current) => ({ ...current, dateFilter: '', dateRange: emptyMobileDateRange })); setDateModalOpen(false); }} className="h-[30px] flex-1 rounded-[9px] bg-accent-soft text-[10px] text-brand">Reset</button>
              <button type="button" onClick={() => { setFilterDetails((current) => ({ ...current, dateFilter: 'custom', dateRange: modalDateRange })); setDateModalOpen(false); }} className="h-[30px] flex-1 rounded-[9px] bg-brand text-[10px] text-white">Apply</button>
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
        onReset={() => { setFilterDetails((current) => ({ ...current, timeStart: '', timeEnd: '' })); setTimeModalOpen(false); }}
        onApply={() => { setFilterDetails((current) => ({ ...current, timeStart: modalTimeStart, timeEnd: modalTimeEnd })); setTimeModalOpen(false); }}
      />
      <PriceFilterModal
        open={priceModalOpen}
        min={modalPriceMin}
        max={modalPriceMax}
        onMinChange={setModalPriceMin}
        onMaxChange={setModalPriceMax}
        onClose={() => setPriceModalOpen(false)}
        onReset={() => { setFilterDetails((current) => ({ ...current, priceMin: '', priceMax: '' })); setPriceModalOpen(false); }}
        onApply={() => { setFilterDetails((current) => ({ ...current, priceMin: modalPriceMin, priceMax: modalPriceMax })); setPriceModalOpen(false); }}
      />
    </div>
  );
};

export default Filters;
