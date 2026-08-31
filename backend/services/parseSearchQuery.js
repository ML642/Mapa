// services/parseSearchQuery.js
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
require("dayjs/locale/ru");
dayjs.locale("ru");
dayjs.extend(customParseFormat);
const Event = require("../models/Event");

const STOP_WORDS = [
	"куда",
	"можно",
	"сходить",
	"хочу",
	"посетить",
	"покажи",
	"найди",
	"ищи",
	"мероприятие",
	"мероприятия",
	"что",
	"идет",
	"сейчас",
	"в",
	"на",
	"мне",
	"есть",
	"проходит",
	"по",
	"до",
	"этой",
	"этот",
	"эти",
	"следующей",
	"следующем",
];

const MONTHS_REGEX = "января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря";
const RELATIVE_DATE_PHRASES = [
	"сегодня",
	"завтра",
	"в эти выходные",
	"на выходных",
	"на этой неделе",
	"в этом месяце",
	"на следующей неделе",
	"в следующем месяце",
];
const RELATIVE_DATE_RANGE_PATTERN = /(^|[\s\p{P}])через\s+\d+\s*(дн|дня|дней|недел|неделю|месяц|месяца|месяцев)(?=[\s\p{P}]|$)/giu;
const ABSOLUTE_DATE_PATTERNS = [
	new RegExp(`(^|[\\s\\p{P}])\\d{1,2}[.\\-/]\\d{1,2}(?:[.\\-/]\\d{2,4})?(?=[\\s\\p{P}]|$)`, "giu"),
	new RegExp(`(^|[\\s\\p{P}])\\d{1,2}\\s+(?:${MONTHS_REGEX})(?=[\\s\\p{P}]|$)`, "giu"),
	new RegExp(
		`(^|[\\s\\p{P}])с\\s+\\d{1,2}[.\\-/]\\d{1,2}(?:[.\\-/]\\d{2,4})?\\s+по\\s+\\d{1,2}[.\\-/]\\d{1,2}(?:[.\\-/]\\d{2,4})?(?=[\\s\\p{P}]|$)`,
		"giu"
	),
	new RegExp(`(^|[\\s\\p{P}])с\\s+\\d{1,2}\\s+(?:${MONTHS_REGEX})\\s+по\\s+\\d{1,2}\\s+(?:${MONTHS_REGEX})(?=[\\s\\p{P}]|$)`, "giu"),
	new RegExp(`(^|[\\s\\p{P}])до\\s+\\d{1,2}[.\\-/]\\d{1,2}(?:[.\\-/]\\d{2,4})?(?=[\\s\\p{P}]|$)`, "giu"),
	new RegExp(`(^|[\\s\\p{P}])до\\s+\\d{1,2}\\s+(?:${MONTHS_REGEX})(?=[\\s\\p{P}]|$)`, "giu"),
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const collapseSpaces = (value) => value.replace(/\s+/g, " ").trim();

const replaceWholePhrase = (text, phrase) => {
	if (!phrase) return text;
	return text.replace(new RegExp(`(^|[\\s\\p{P}])${escapeRegex(phrase.toLowerCase())}(?=[\\s\\p{P}]|$)`, "giu"), " ");
};

const detectCategory = (text) => {
	for (const entry of Event.categorySearchTerms) {
		if (new RegExp(`(^|[\\s\\p{P}])${escapeRegex(entry.term.toLowerCase())}(?=[\\s\\p{P}]|$)`, "iu").test(text)) {
			return entry.category;
		}
	}

	return null;
};

const stripSearchNoise = (text, category) => {
	let cleaned = text;

	for (const phrase of RELATIVE_DATE_PHRASES) {
		cleaned = replaceWholePhrase(cleaned, phrase);
	}

	cleaned = cleaned.replace(RELATIVE_DATE_RANGE_PATTERN, " ");

	for (const pattern of ABSOLUTE_DATE_PATTERNS) {
		cleaned = cleaned.replace(pattern, " ");
	}

	for (const entry of Event.categorySearchTerms) {
		cleaned = replaceWholePhrase(cleaned, entry.term);
	}

	for (const stopWord of STOP_WORDS) {
		cleaned = replaceWholePhrase(cleaned, stopWord);
	}

	if (category) {
		cleaned = replaceWholePhrase(cleaned, category);
	}

	const tokens = Array.from(
		new Set((cleaned.match(/[\p{L}\p{N}]+/gu) || []).map((token) => token.trim()).filter((token) => token.length > 1))
	);

	return {
		normalizedQuery: collapseSpaces(cleaned),
		query: tokens,
		searchText: tokens.join(" "),
	};
};

const parseDate = (text) => {
	const monthMap = {
		января: 0,
		февраля: 1,
		марта: 2,
		апреля: 3,
		мая: 4,
		июня: 5,
		июля: 6,
		августа: 7,
		сентября: 8,
		октября: 9,
		ноября: 10,
		декабря: 11,
	};

	const now = dayjs();

	const dateRegex1 = /(\d{1,2})[.\-/](\d{1,2})(?:[.\-/](\d{2,4}))?/;
	const dateRegex2 = /(\d{1,2})\s+([а-яё]+)/i;

	if (dateRegex1.test(text)) {
		const [, d, m, y] = text.match(dateRegex1);
		return dayjs(`${y || now.year()}-${m}-${d}`, ["YYYY-M-D", "YY-M-D"]).toDate();
	}

	if (dateRegex2.test(text)) {
		const [, d, monthName] = text.match(dateRegex2);
		const m = monthMap[monthName.toLowerCase()];
		if (m !== undefined) return new Date(now.year(), m, Number(d));
	}

	return null;
};

const parseRelativeDate = (text) => {
	const now = dayjs();

	if (text.includes("сегодня")) return { dateFrom: now.startOf("day"), dateTo: now.endOf("day") };
	if (text.includes("завтра")) {
		const d = now.add(1, "day");
		return { dateFrom: d.startOf("day"), dateTo: d.endOf("day") };
	}

	if (text.includes("в эти выходные") || text.includes("на выходных")) {
		const saturday = now.day(6);
		const sunday = now.day(7);
		return { dateFrom: saturday.startOf("day"), dateTo: sunday.endOf("day") };
	}

	if (text.includes("на этой неделе")) {
		const start = now.startOf("week");
		const end = start.endOf("day");
		return { dateFrom: start, dateTo: end };
	}

	if (text.includes("в этом месяце")) {
		const start = now.startOf("month");
		const end = now.endOf("month");
		return { dateFrom: start, dateTo: end };
	}

	if (text.includes("на следующей неделе")) {
		const start = now.add(1, "week").startOf("week");
		const end = start.add(6, "day").endOf("day");
		return { dateFrom: start, dateTo: end };
	}

	if (text.includes("в следующем месяце")) {
		const start = now.add(1, "month").startOf("month");
		const end = now.add(1, "month").endOf("month");
		return { dateFrom: start, dateTo: end };
	}

	const relMatch = text.match(/через\s+(\d+)\s*(дн|дня|дней|недел|неделю|месяц|месяца|месяцев)/);
	if (relMatch) {
		const [, numStr, unit] = relMatch;
		const num = parseInt(numStr);
		if (unit.startsWith("дн")) {
			const dateFrom = now.add(num, "day");
			return { dateFrom: dateFrom.startOf("day"), dateTo: dateFrom.endOf("day") };
		}
		if (unit.startsWith("нед")) {
			const dateFrom = now.add(num, "week");
			const dateTo = dateFrom.add(6, "day");
			return { dateFrom: dateFrom.startOf("day"), dateTo: dateTo.endOf("day") };
		}
		if (unit.startsWith("мес")) {
			const dateFrom = now.add(num, "month");
			return { dateFrom: dateFrom.startOf("month"), dateTo: dateFrom.endOf("month") };
		}
	}

	return null;
};

exports.parseSearchQuery = (input, category = null, dateFrom = null, dateTo = null) => {
	const text = input.toLowerCase().trim();
	const result = { rawQuery: input.trim(), normalizedQuery: "", searchText: "", query: [], category, dateFrom, dateTo };

	if (!category) {
		result.category = detectCategory(text);
	}

	if (!dateFrom || !dateTo) {
		const relDate = parseRelativeDate(text);
		if (relDate) {
			result.dateFrom ??= relDate.dateFrom.toDate();
			result.dateTo ??= relDate.dateTo.toDate();
		} else {
			const rangeMatch = text.match(/с\s+(.+?)\s+по\s+(.+)/);
			const toMatch = text.match(/до\s+(.+)/);
			const singleDate = parseDate(text);

			if (rangeMatch) {
				const fromDate = parseDate(rangeMatch[1]);
				const toDate = parseDate(rangeMatch[2]);
				if (fromDate) result.dateFrom = fromDate;
				if (toDate) result.dateTo = toDate;
			} else if (toMatch) {
				const toDate = parseDate(toMatch[1]);
				if (toDate) result.dateTo = toDate;
			} else if (singleDate) {
				result.dateFrom ??= singleDate;
				result.dateTo ??= singleDate;
			}
		}
	}

	Object.assign(result, stripSearchNoise(text, result.category));
	return result;
};
