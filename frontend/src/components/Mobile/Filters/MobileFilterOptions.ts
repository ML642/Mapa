import {
  areSameMobileDateRanges,
  formatMobileDateRangeLabel,
  type MobileDateRange,
  type MobileFilterDetails,
} from "../mobileDateRange";

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

export type MobileFilterPanel = "categories" | "dates" | "time" | "price" | "other";

export type MobileFilterTab = {
  key: MobileFilterPanel;
  label: string;
};

export type MobileChoiceOption = {
  value: string;
  label: string;
};

export type TimeFilter = {
  start: string;
  end: string;
};

export type PriceFilter = {
  min: string;
  max: string;
};

export type DatePanelMode = "options" | "calendar";

export type MobileCategoryOption = {
  icon: string;
  activeIcon: string;
  label: string;
  mobileLabel: string;
};

export const mobileCategoryOptions: MobileCategoryOption[] = [
  { icon: exhibitions, activeIcon: "/icons/auth/active/exhibitions_active.svg", label: "Выставка", mobileLabel: "Exhibitions" },
  { icon: music, activeIcon: "/icons/auth/active/music_active.svg", label: "Музыка", mobileLabel: "Music" },
  { icon: theatre, activeIcon: "/icons/auth/active/theatre_active.svg", label: "Театр", mobileLabel: "Theatre" },
  { icon: festival, activeIcon: "/icons/auth/active/festival_active.svg", label: "Фестиваль", mobileLabel: "Festivals" },
  { icon: museum, activeIcon: "/icons/auth/active/museum_active.svg", label: "Музей", mobileLabel: "Museums" },
  { icon: cinema, activeIcon: "/icons/auth/active/cinema_active.svg", label: "Кино", mobileLabel: "Cinema" },
  { icon: sport, activeIcon: "/icons/auth/active/sport_active.svg", label: "Спорт", mobileLabel: "Sports" },
  { icon: clubs, activeIcon: "/icons/auth/active/clubs_active.svg", label: "Клуб", mobileLabel: "Parties" },
  { icon: excursion, activeIcon: "/icons/auth/active/excursion_active.svg", label: "Экскурсия", mobileLabel: "Tours" },
  { icon: dating, activeIcon: dating, label: "Знакомства", mobileLabel: "Dating" },
  { icon: quests, activeIcon: "/icons/auth/active/quests_active.svg", label: "Квест", mobileLabel: "Quests" },
  { icon: show, activeIcon: show, label: "Шоу", mobileLabel: "Shows" },
  { icon: education, activeIcon: "/icons/auth/active/education_active.svg", label: "Образование", mobileLabel: "Education" },
  { icon: children, activeIcon: "/icons/auth/active/children_active.svg", label: "Для детей", mobileLabel: "For children" },
];

export const mobileFilterTabs: MobileFilterTab[] = [
  { key: "categories", label: "Categories" },
  { key: "dates", label: "Dates" },
  { key: "time", label: "Time" },
  { key: "price", label: "Price" },
  { key: "other", label: "Other" },
];

export const mobileDateOptions: MobileChoiceOption[] = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "weekend", label: "Weekend" },
  { value: "month", label: "This month" },
  { value: "custom", label: "Choose dates" },
];

export const emptyTimeFilter: TimeFilter = { start: "", end: "" };
export const emptyPriceFilter: PriceFilter = { min: "", max: "" };

const mobileCategoryLabelMap: Record<string, string> = {
  Выставка: "Exhibitions",
  Выставки: "Exhibitions",
  Музыка: "Music",
  Концерт: "Concerts",
  Концерты: "Concerts",
  Театр: "Theatre",
  Спектакль: "Theatre",
  Спектакли: "Theatre",
  Фестиваль: "Festivals",
  Фестивали: "Festivals",
  Музей: "Museums",
  Музеи: "Museums",
  Спорт: "Sports",
  Кино: "Cinema",
  Клуб: "Parties",
  Вечеринка: "Parties",
  Вечеринки: "Parties",
  Экскурсия: "Tours",
  Экскурсии: "Tours",
  Знакомства: "Dating",
  Квест: "Quests",
  Квесты: "Quests",
  Шоу: "Shows",
  Образование: "Education",
  Квиз: "Quizzes",
  Квизы: "Quizzes",
  "Для детей": "For children",
  "С детьми": "For children",
  Событие: "Event",
  Мероприятие: "Event",
  Wystawy: "Exhibitions",
  Muzyka: "Music",
  Koncerty: "Concerts",
  Teatry: "Theatre",
  Spektakle: "Theatre",
  Festiwale: "Festivals",
  Muzea: "Museums",
  Sport: "Sports",
  Kino: "Cinema",
  Imprezy: "Parties",
  Wycieczki: "Tours",
  Randki: "Dating",
  "Gry terenowe": "Quests",
  Pokazy: "Shows",
  Quizy: "Quizzes",
  "Z dziećmi": "For children",
  "Dla dzieci": "For children",
  Wydarzenie: "Event",
};

export const getMobileCategoryLabel = (category: string) => (
  mobileCategoryLabelMap[category] ?? mobileCategoryOptions.find((filter) => filter.label === category)?.mobileLabel ?? category
);

export const getMobilePriceDisplayLabel = (priceLabel: string) => (
  priceLabel === "Бесплатно" || priceLabel === "Bezpłatne" ? "Free" : priceLabel
);

export const areSameSelections = (left: string[], right: string[]) => {
  return left.length === right.length && left.every((item) => right.includes(item));
};

export const areSameTimeFilters = (left: TimeFilter, right: TimeFilter) => {
  return left.start === right.start && left.end === right.end;
};

export const areSamePriceFilters = (left: PriceFilter, right: PriceFilter) => {
  return left.min === right.min && left.max === right.max;
};

export const formatTimeFilterLabel = (timeFilter: TimeFilter) => {
  if (timeFilter.start && timeFilter.end) return `${timeFilter.start}-${timeFilter.end}`;
  return timeFilter.start || timeFilter.end || "";
};

export const formatPriceFilterLabel = (priceFilter: PriceFilter) => {
  if (priceFilter.min && priceFilter.max) return `${priceFilter.min}–${priceFilter.max} PLN`;
  if (priceFilter.min) return `from ${priceFilter.min} PLN`;
  if (priceFilter.max) return `up to ${priceFilter.max} PLN`;
  return "";
};

export const normalizePriceValue = (value: string) => value.replace(/\D/g, "").slice(0, 6);

export const normalizeTimeValue = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
};

export const isTimeValueValid = (value: string) => {
  if (!value) return true;
  const match = value.match(/^(\d{2}):(\d{2})$/);
  return Boolean(match && Number(match[1]) <= 23 && Number(match[2]) <= 59);
};

export const isPriceFilterValid = (priceFilter: PriceFilter) => {
  if (!priceFilter.min || !priceFilter.max) return true;
  return Number(priceFilter.min) <= Number(priceFilter.max);
};

export const getMobileDateLabel = (details: MobileFilterDetails) => {
  if (details.dateFilter === "custom") {
    return formatMobileDateRangeLabel(details.dateRange);
  }

  return mobileDateOptions.find((option) => option.value === details.dateFilter)?.label ?? "";
};

export const getMobilePriceLabel = (details: MobileFilterDetails) => {
  return formatPriceFilterLabel({
    min: details.priceMin,
    max: details.priceMax,
  });
};

export const isDateDraftChanged = (
  draftDateFilter: string,
  draftDateRange: MobileDateRange,
  selectedDetails: MobileFilterDetails,
) => {
  return (
    draftDateFilter !== selectedDetails.dateFilter ||
    !areSameMobileDateRanges(draftDateRange, selectedDetails.dateRange)
  );
};
