export type MobileDateRange = {
    start: string;
    end: string;
};

export const emptyMobileDateRange: MobileDateRange = { start: "", end: "" };

export type MobileFilterDetails = {
    dateFilter: string;
    dateRange: MobileDateRange;
    timeStart: string;
    timeEnd: string;
    priceMin: string;
    priceMax: string;
    friendsInterested: boolean;
    friendsGoing: boolean;
};

export const emptyMobileFilterDetails: MobileFilterDetails = {
    dateFilter: "",
    dateRange: emptyMobileDateRange,
    timeStart: "",
    timeEnd: "",
    priceMin: "",
    priceMax: "",
    friendsInterested: false,
    friendsGoing: false,
};

export const getMobileSelectedFiltersCount = (
    selectedCategories: string[],
    filterDetails: MobileFilterDetails,
) => {
    return (
        selectedCategories.length +
        (filterDetails.dateFilter ? 1 : 0) +
        (filterDetails.timeStart || filterDetails.timeEnd ? 1 : 0) +
        (filterDetails.priceMin || filterDetails.priceMax ? 1 : 0)
        + (filterDetails.friendsInterested ? 1 : 0)
        + (filterDetails.friendsGoing ? 1 : 0)
    );
};

export const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

const monthNamesGenitive = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

const pad = (value: number) => String(value).padStart(2, "0");

export const toIsoDate = (date: Date) => {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const parseIsoDate = (value: string) => {
    if (!value) return null;
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
};

export const monthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

export const getCalendarOffset = (date: Date) => {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
};

export const isSameIsoDate = (left: string, right: string) => Boolean(left && right && left === right);

export const isBeforeIsoDate = (left: string, right: string) => {
    const leftDate = parseIsoDate(left);
    const rightDate = parseIsoDate(right);
    if (!leftDate || !rightDate) return false;
    return leftDate.getTime() < rightDate.getTime();
};

export const isMobileDateRangeComplete = (range: MobileDateRange) => Boolean(range.start && range.end);

export const areSameMobileDateRanges = (left: MobileDateRange, right: MobileDateRange) => {
    return left.start === right.start && left.end === right.end;
};

export const formatMobileDateRangeLabel = (range: MobileDateRange) => {
    const startDate = parseIsoDate(range.start);
    const endDate = parseIsoDate(range.end);

    if (!startDate || !endDate) return "";

    if (startDate.getFullYear() === endDate.getFullYear() && startDate.getMonth() === endDate.getMonth()) {
        return `${startDate.getDate()}–${endDate.getDate()} ${monthNamesGenitive[startDate.getMonth()]}`;
    }

    return `${startDate.getDate()} ${monthNamesGenitive[startDate.getMonth()]} – ${endDate.getDate()} ${monthNamesGenitive[endDate.getMonth()]}`;
};
