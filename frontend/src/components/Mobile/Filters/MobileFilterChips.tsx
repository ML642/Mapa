import { ChevronDown, X } from "lucide-react";
import {
  formatTimeFilterLabel,
  getMobileCategoryLabel,
  getMobileDateLabel,
  getMobilePriceLabel,
  mobileCategoryOptions,
  mobileFilterTabs,
  type MobileFilterPanel,
  type MobileFilterTab,
  type TimeFilter,
} from "./MobileFilterOptions";
import type { MobileFilterDetails } from "../mobileDateRange";

type MobileFilterChipsProps = {
  selectedCategories: string[];
  selectedFilterDetails: MobileFilterDetails;
  activePanel: MobileFilterPanel | null;
  onOpenPanel: (panel: MobileFilterPanel) => void;
  onToggleCategory: (category: string) => void;
  onClearCategories: () => void;
  onClearDates: () => void;
  onClearTime: () => void;
  onClearPrice: () => void;
};

export default function MobileFilterChips({
  selectedCategories,
  selectedFilterDetails,
  activePanel,
  onOpenPanel,
  onToggleCategory,
  onClearCategories,
  onClearDates,
  onClearTime,
  onClearPrice,
}: MobileFilterChipsProps) {
  const selectedTimeFilter: TimeFilter = {
    start: selectedFilterDetails.timeStart,
    end: selectedFilterDetails.timeEnd,
  };
  const selectedTimeLabel = formatTimeFilterLabel(selectedTimeFilter);
  const hasAdvancedFilters = Boolean(
    selectedFilterDetails.dateFilter ||
    selectedTimeLabel ||
    selectedFilterDetails.priceMin ||
    selectedFilterDetails.priceMax ||
    selectedFilterDetails.friendsInterested ||
    selectedFilterDetails.friendsGoing,
  );

  if (!hasAdvancedFilters) {
    return (
      <div className="w-full overflow-visible">
        <div className="-mx-[2px] flex h-[38px] w-[calc(100%+4px)] items-center gap-[6px] overflow-x-auto px-[2px] pr-[22px] scroll-smooth no-scrollbar">
          {mobileCategoryOptions.map((category) => {
            const isActive = selectedCategories.includes(category.label);

            return (
              <button
                key={category.label}
                type="button"
                onClick={() => onToggleCategory(category.label)}
                className={`flex h-[32px] shrink-0 items-center gap-[6px] whitespace-nowrap rounded-[16px] px-[10px] text-[13px] font-[400] leading-none shadow-[0_2px_10px_rgba(87,34,75,0.08)] transition active:scale-[0.98] ${
                  isActive ? "bg-white text-accent border-2 border-accent" : "bg-white text-brand"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-[16px] w-[16px] shrink-0 ${isActive ? "bg-accent" : "bg-brand"}`}
                  style={{
                    WebkitMask: `url(${category.icon}) center / contain no-repeat`,
                    mask: `url(${category.icon}) center / contain no-repeat`,
                  }}
                />
                <span>{category.mobileLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const getTabLabel = (tab: MobileFilterTab) => {
    switch (tab.key) {
      case "categories":
        return selectedCategories.length === 0
          ? tab.label
          : `${getMobileCategoryLabel(selectedCategories[0])}${selectedCategories.length > 1 ? ` +${selectedCategories.length - 1}` : ""}`;
      case "dates":
        return getMobileDateLabel(selectedFilterDetails) || tab.label;
      case "time":
        return selectedTimeLabel || tab.label;
      case "price":
        return getMobilePriceLabel(selectedFilterDetails) || tab.label;
      default:
        return tab.label;
    }
  };

  const isTabActive = (tab: MobileFilterTab) => {
    switch (tab.key) {
      case "categories":
        return selectedCategories.length > 0;
      case "dates":
        return Boolean(selectedFilterDetails.dateFilter);
      case "time":
        return Boolean(selectedTimeLabel);
      case "price":
        return Boolean(selectedFilterDetails.priceMin || selectedFilterDetails.priceMax);
      default:
        return false;
    }
  };

  const clearTab = (tab: MobileFilterTab) => {
    switch (tab.key) {
      case "categories":
        onClearCategories();
        return;
      case "dates":
        onClearDates();
        return;
      case "time":
        onClearTime();
        return;
      case "price":
        onClearPrice();
        return;
      default:
    }
  };

  const renderTab = (tab: MobileFilterTab) => {
    const isActive = isTabActive(tab);
    const label = getTabLabel(tab);
    const isOpen = activePanel === tab.key;

    if (isActive) {
      return (
        <div
          key={tab.key}
          className="flex h-[30px] shrink-0 items-center gap-[5px] whitespace-nowrap rounded-[15px] border border-accent bg-accent-soft px-[12px] text-[13px] font-[400] leading-none text-accent shadow-[0_2px_10px_rgba(87,34,75,0.08)]"
        >
          <button
            type="button"
            onClick={() => onOpenPanel(tab.key)}
            className="leading-none"
          >
            {label}
          </button>
          <button
            type="button"
            aria-label={`Clear ${tab.label.toLowerCase()}`}
            className="-mr-[3px] flex h-[16px] w-[16px] items-center justify-center rounded-full active:scale-95"
            onClick={() => clearTab(tab)}
          >
            <X size={13} strokeWidth={2.2} />
          </button>
        </div>
      );
    }

    return (
      <button
        key={tab.key}
        type="button"
        onClick={() => onOpenPanel(tab.key)}
        className="flex h-[30px] shrink-0 items-center gap-[5px] whitespace-nowrap rounded-[15px] border border-transparent bg-white px-[12px] text-[13px] font-[400] leading-none text-brand shadow-[0_2px_10px_rgba(87,34,75,0.08)] transition active:scale-[0.98]"
      >
        <span>{label}</span>
        <ChevronDown
          size={14}
          strokeWidth={2.2}
          className={isOpen ? "rotate-180 transition-transform" : "transition-transform"}
          aria-hidden
        />
      </button>
    );
  };

  return (
    <div className="w-full overflow-visible">
      <div className="-mx-[2px] flex h-[38px] w-[calc(100%+4px)] items-center gap-[6px] overflow-x-auto px-[2px] pr-[22px] scroll-smooth no-scrollbar">
        {mobileFilterTabs.map(renderTab)}
      </div>
    </div>
  );
}
