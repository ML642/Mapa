import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Banknote, Clock3, X } from "lucide-react";
import MobileDateRangeCalendar from "../MobileDateRangeCalendar";
import {
  areSamePriceFilters,
  areSameSelections,
  areSameTimeFilters,
  emptyPriceFilter,
  emptyTimeFilter,
  isDateDraftChanged,
  isPriceFilterValid,
  isTimeValueValid,
  mobileCategoryOptions,
  mobileDateOptions,
  normalizePriceValue,
  normalizeTimeValue,
  type DatePanelMode,
  type MobileFilterPanel,
  type PriceFilter,
  type TimeFilter,
} from "./MobileFilterOptions";
import {
  emptyMobileDateRange,
  isMobileDateRangeComplete,
  type MobileDateRange,
  type MobileFilterDetails,
} from "../mobileDateRange";

type MobileFilterSheetProps = {
  activePanel: MobileFilterPanel | null;
  selectedCategories: string[];
  selectedFilterDetails: MobileFilterDetails;
  onClose: () => void;
  onApplyCategories: (categories: string[]) => void;
  onApplyDetails: React.Dispatch<React.SetStateAction<MobileFilterDetails>>;
};

export default function MobileFilterSheet({
  activePanel,
  selectedCategories,
  selectedFilterDetails,
  onClose,
  onApplyCategories,
  onApplyDetails,
}: MobileFilterSheetProps) {
  const [draftCategories, setDraftCategories] = useState<string[]>(selectedCategories);
  const [draftDateFilter, setDraftDateFilter] = useState("");
  const [draftDateRange, setDraftDateRange] = useState<MobileDateRange>(emptyMobileDateRange);
  const [datePanelMode, setDatePanelMode] = useState<DatePanelMode>("options");
  const [draftTimeFilter, setDraftTimeFilter] = useState<TimeFilter>(emptyTimeFilter);
  const [draftPriceFilter, setDraftPriceFilter] = useState<PriceFilter>(emptyPriceFilter);

  useEffect(() => {
    if (activePanel === "categories") {
      setDraftCategories(selectedCategories);
    }

    if (activePanel === "dates") {
      setDraftDateFilter(selectedFilterDetails.dateFilter);
      setDraftDateRange(selectedFilterDetails.dateRange);
      setDatePanelMode("options");
    }

    if (activePanel === "time") {
      setDraftTimeFilter({
        start: selectedFilterDetails.timeStart,
        end: selectedFilterDetails.timeEnd,
      });
    }

    if (activePanel === "price") {
      setDraftPriceFilter({
        min: selectedFilterDetails.priceMin,
        max: selectedFilterDetails.priceMax,
      });
    }
  }, [
    activePanel,
    selectedCategories,
    selectedFilterDetails.dateFilter,
    selectedFilterDetails.dateRange,
    selectedFilterDetails.priceMax,
    selectedFilterDetails.priceMin,
    selectedFilterDetails.timeEnd,
    selectedFilterDetails.timeStart,
  ]);

  const toggleDraftCategory = (label: string) => {
    setDraftCategories((prev) =>
      prev.includes(label) ? prev.filter((category) => category !== label) : [...prev, label],
    );
  };

  const resetPanel = () => {
    if (activePanel === "categories") {
      setDraftCategories([]);
      return;
    }

    if (activePanel === "dates") {
      setDraftDateFilter("");
      setDraftDateRange(emptyMobileDateRange);
      setDatePanelMode("options");
      return;
    }

    if (activePanel === "time") {
      setDraftTimeFilter(emptyTimeFilter);
      return;
    }

    if (activePanel === "price") {
      setDraftPriceFilter(emptyPriceFilter);
    }
  };

  const applyPanel = () => {
    if (activePanel === "categories") {
      onApplyCategories(draftCategories);
    }

    if (activePanel === "dates") {
      onApplyDetails((prev) => ({
        ...prev,
        dateFilter: draftDateFilter,
        dateRange: draftDateFilter === "custom" ? draftDateRange : emptyMobileDateRange,
      }));
    }

    if (activePanel === "time") {
      onApplyDetails((prev) => ({
        ...prev,
        timeStart: draftTimeFilter.start,
        timeEnd: draftTimeFilter.end,
      }));
    }

    if (activePanel === "price") {
      onApplyDetails((prev) => ({
        ...prev,
        priceMin: draftPriceFilter.min,
        priceMax: draftPriceFilter.max,
      }));
    }

    onClose();
  };

  const categoryDraftChanged = !areSameSelections(draftCategories, selectedCategories);
  const dateDraftChanged = isDateDraftChanged(draftDateFilter, draftDateRange, selectedFilterDetails);
  const dateDraftValid = draftDateFilter !== "custom" || isMobileDateRangeComplete(draftDateRange);
  const timeDraftChanged = !areSameTimeFilters(draftTimeFilter, {
    start: selectedFilterDetails.timeStart,
    end: selectedFilterDetails.timeEnd,
  });
  const priceDraftChanged = !areSamePriceFilters(draftPriceFilter, {
    min: selectedFilterDetails.priceMin,
    max: selectedFilterDetails.priceMax,
  });
  const priceDraftValid = isPriceFilterValid(draftPriceFilter);
  const timeDraftValid = isTimeValueValid(draftTimeFilter.start) && isTimeValueValid(draftTimeFilter.end);

  const canResetPanel = (() => {
    switch (activePanel) {
      case "categories":
        return draftCategories.length > 0;
      case "dates":
        return Boolean(draftDateFilter || draftDateRange.start || draftDateRange.end);
      case "time":
        return Boolean(draftTimeFilter.start || draftTimeFilter.end);
      case "price":
        return Boolean(draftPriceFilter.min || draftPriceFilter.max);
      default:
        return false;
    }
  })();

  const canApplyPanel = (() => {
    switch (activePanel) {
      case "categories":
        return categoryDraftChanged;
      case "dates":
        return dateDraftChanged && dateDraftValid;
      case "time":
        return timeDraftChanged && timeDraftValid;
      case "price":
        return priceDraftChanged && priceDraftValid;
      default:
        return false;
    }
  })();

  const getPanelTitle = () => {
    switch (activePanel) {
      case "categories":
        return "Categories";
      case "dates":
        return "Dates";
      case "time":
        return "Time";
      case "price":
        return "Price (PLN)";
      case "other":
        return "Other";
      default:
        return "";
    }
  };

  const renderCategoriesPanel = () => (
    <div className="flex flex-wrap gap-[8px]">
      {mobileCategoryOptions.map((filter) => {
        const isActive = draftCategories.includes(filter.label);

        return (
          <button
            key={filter.label}
            type="button"
            onClick={() => toggleDraftCategory(filter.label)}
            className={`flex h-[31px] items-center gap-[5px] rounded-[16px] border px-[8px] text-[12px] font-[400] leading-none transition active:scale-[0.98] ${
              isActive
                ? "border-accent bg-white text-accent"
                : "border-brand-border bg-white text-brand"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-[17px] w-[17px] shrink-0 ${isActive ? "bg-accent" : "bg-brand"}`}
              style={{
                WebkitMask: `url(${filter.icon}) center / contain no-repeat`,
                mask: `url(${filter.icon}) center / contain no-repeat`,
              }}
            />
            <span>{filter.mobileLabel}</span>
            {isActive ? <X size={12} strokeWidth={2.4} aria-hidden /> : null}
          </button>
        );
      })}
    </div>
  );

  const renderDatesPanel = () => (
    datePanelMode === "calendar" ? (
      <MobileDateRangeCalendar
        value={draftDateRange}
        onChange={(range) => {
          setDraftDateFilter("custom");
          setDraftDateRange(range);
        }}
      />
    ) : (
      <div className="flex flex-col gap-[18px] pt-[2px]">
        {mobileDateOptions.map((option) => {
          const isActive = draftDateFilter === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                if (option.value === "custom") {
                  setDraftDateFilter("custom");
                  setDatePanelMode("calendar");
                  return;
                }

                setDraftDateFilter(option.value);
                setDraftDateRange(emptyMobileDateRange);
              }}
              className="flex items-center gap-[10px] text-left text-[14px] font-[400] leading-none text-brand"
            >
              <span
                className={`flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full border ${
                  isActive ? "border-accent" : "border-brand"
                }`}
                aria-hidden
              >
                {isActive ? <span className="h-[9px] w-[9px] rounded-full bg-accent" /> : null}
              </span>
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    )
  );

  const renderTimePanel = () => (
    <div className="flex items-center gap-[8px]">
      {(["start", "end"] as const).map((field) => (
        <React.Fragment key={field}>
          {field === "end" ? <span className="shrink-0 text-[16px] leading-none text-brand">-</span> : null}
          <label className="relative flex h-[36px] min-w-0 flex-1 items-center gap-[7px] rounded-[8px] border border-brand-border bg-white px-[10px] text-brand focus-within:border-brand">
            <Clock3 size={14} strokeWidth={1.9} className="shrink-0 text-brand-border" aria-hidden />
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              value={draftTimeFilter[field]}
              onChange={(event) => {
                const value = normalizeTimeValue(event.target.value);
                setDraftTimeFilter((prev) => ({ ...prev, [field]: value }));
              }}
              placeholder="GG:MM"
              className="min-w-0 flex-1 bg-transparent text-[11px] font-[400] leading-none text-brand outline-none placeholder:text-brand-border"
              aria-label={field === "start" ? "Start time" : "End time"}
            />
          </label>
        </React.Fragment>
      ))}
    </div>
  );

  const renderPricePanel = () => (
    <div className="flex items-center gap-[8px]">
      {(["min", "max"] as const).map((field) => (
        <React.Fragment key={field}>
          {field === "max" ? <span className="shrink-0 text-[16px] leading-none text-brand">-</span> : null}
          <label className="relative flex h-[38px] min-w-0 flex-1 items-center gap-[8px] rounded-[10px] border border-brand-border bg-white px-[10px] text-brand transition focus-within:border-brand">
            <Banknote size={15} strokeWidth={1.9} className="shrink-0 text-brand" aria-hidden />
            <input
              type="text"
              inputMode="numeric"
              value={draftPriceFilter[field]}
              onChange={(event) => {
                const value = normalizePriceValue(event.target.value);
                setDraftPriceFilter((prev) => ({ ...prev, [field]: value }));
              }}
              className="min-w-0 flex-1 bg-transparent text-[13px] font-[400] leading-none text-brand outline-none placeholder:text-brand-border"
              aria-label={field === "min" ? "Minimum price" : "Maximum price"}
            />
          </label>
        </React.Fragment>
      ))}
    </div>
  );

  const renderOtherPanel = () => (
    <div className="rounded-[10px] bg-accent-pastel px-[12px] py-[10px] text-[12px] font-[400] leading-[15px] text-brand">
      This feature is only available to signed-in users. Sign up or sign in to see where your friends are going.
    </div>
  );

  const renderPanelContent = () => {
    switch (activePanel) {
      case "categories":
        return renderCategoriesPanel();
      case "dates":
        return renderDatesPanel();
      case "time":
        return renderTimePanel();
      case "price":
        return renderPricePanel();
      case "other":
        return renderOtherPanel();
      default:
        return null;
    }
  };

  const sheet = activePanel ? (
    <div className="fixed inset-0 z-[130]">
      <button
        type="button"
        className="absolute inset-0 bg-transparent"
        aria-label="Close filter"
        onClick={onClose}
      />
      <section
        className="absolute inset-x-0 bottom-0 max-h-[72dvh] overflow-y-auto rounded-t-[22px] bg-white px-[18px] pt-[20px] shadow-[0_-14px_36px_rgba(87,34,75,0.18)]"
        style={{ paddingBottom: "calc(22px + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mb-[18px] flex items-center justify-between gap-4">
          <h2 className="text-[22px] font-[700] leading-none text-brand">
            {getPanelTitle()}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-[6px] flex h-[32px] w-[32px] items-center justify-center rounded-full text-brand active:scale-95"
            aria-label="Close"
          >
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        {renderPanelContent()}

        <div className="mt-[26px] flex gap-[8px]">
          <button
            type="button"
            onClick={resetPanel}
            disabled={!canResetPanel}
            className={`h-[34px] flex-1 rounded-[10px] border text-[12px] font-[400] transition ${
              canResetPanel
                ? "border-transparent bg-accent-soft text-brand active:scale-[0.99]"
                : "border-brand-border bg-white text-brand-border"
            }`}
          >
            Clear
          </button>
          <button
            type="button"
            onClick={applyPanel}
            disabled={!canApplyPanel}
            className={`h-[34px] flex-1 rounded-[10px] text-[12px] font-[400] transition ${
              canApplyPanel
                ? "bg-brand text-white active:scale-[0.99]"
                : "bg-brand-border text-white/50"
            }`}
          >
            Apply
          </button>
        </div>
      </section>
    </div>
  ) : null;

  if (!sheet || typeof document === "undefined") return null;

  return createPortal(sheet, document.body);
}
