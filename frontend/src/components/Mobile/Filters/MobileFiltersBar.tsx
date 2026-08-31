import { useState, type Dispatch, type SetStateAction } from "react";
import MobileFilterChips from "./MobileFilterChips";
import MobileFilterSheet from "./MobileFilterSheet";
import { emptyMobileDateRange, type MobileFilterDetails } from "../mobileDateRange";
import type { MobileFilterPanel } from "./MobileFilterOptions";

type MobileFiltersBarProps = {
  selectedCategories: string[];
  setSelectedCategories: Dispatch<SetStateAction<string[]>>;
  mobileFilterDetails: MobileFilterDetails;
  setMobileFilterDetails: Dispatch<SetStateAction<MobileFilterDetails>>;
};

export default function MobileFiltersBar({
  selectedCategories,
  setSelectedCategories,
  mobileFilterDetails,
  setMobileFilterDetails,
}: MobileFiltersBarProps) {
  const [activePanel, setActivePanel] = useState<MobileFilterPanel | null>(null);

  return (
    <>
      <MobileFilterChips
        selectedCategories={selectedCategories}
        selectedFilterDetails={mobileFilterDetails}
        activePanel={activePanel}
        onOpenPanel={setActivePanel}
        onToggleCategory={(category) => {
          setSelectedCategories((current) =>
            current.includes(category)
              ? current.filter((item) => item !== category)
              : [...current, category],
          );
        }}
        onClearCategories={() => setSelectedCategories([])}
        onClearDates={() => {
          setMobileFilterDetails((prev) => ({
            ...prev,
            dateFilter: "",
            dateRange: emptyMobileDateRange,
          }));
        }}
        onClearTime={() => {
          setMobileFilterDetails((prev) => ({
            ...prev,
            timeStart: "",
            timeEnd: "",
          }));
        }}
        onClearPrice={() => {
          setMobileFilterDetails((prev) => ({
            ...prev,
            priceMin: "",
            priceMax: "",
          }));
        }}
      />
      <MobileFilterSheet
        activePanel={activePanel}
        selectedCategories={selectedCategories}
        selectedFilterDetails={mobileFilterDetails}
        onClose={() => setActivePanel(null)}
        onApplyCategories={setSelectedCategories}
        onApplyDetails={setMobileFilterDetails}
      />
    </>
  );
}
