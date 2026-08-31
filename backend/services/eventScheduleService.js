const DATE_DISPLAY_MODES = Object.freeze(["sessions", "range", "permanent"]);

const DATE_INPUT_FIELDS = Object.freeze([
	"event_dates",
	"schedule",
	"event_schedule",
	"dateRange",
	"date_range",
	"dateDisplayMode",
	"date_display_mode",
	"dateMode",
	"isPermanent",
	"is_permanent",
	"dateFrom",
	"dateTo",
	"date_from",
	"date_to",
	"dateRangeFrom",
	"dateRangeTo",
	"date",
	"day",
	"times",
	"startTimes",
	"sessionTimes",
	"slots",
	"sessions",
	"sessionList",
	"sessionItems",
]);

const DATE_ALIAS_FIELDS = Object.freeze([
	"event_schedule",
	"date_range",
	"date_display_mode",
	"dateMode",
	"is_permanent",
	"dateFrom",
	"dateTo",
	"date_from",
	"date_to",
	"dateRangeFrom",
	"dateRangeTo",
]);

const DATE_SHORTHAND_FIELDS = Object.freeze([
	"date",
	"day",
	"times",
	"startTimes",
	"sessionTimes",
	"slots",
	"sessions",
	"sessionList",
	"sessionItems",
]);

const DATE_UPDATE_INPUT_ONLY_FIELDS = Object.freeze([...DATE_ALIAS_FIELDS, ...DATE_SHORTHAND_FIELDS]);

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const toPlainObject = (value) => {
	if (!value) return {};
	if (typeof value === "string") {
		const normalized = value.trim();
		if (normalized.startsWith("{") || normalized.startsWith("[")) {
			try {
				return JSON.parse(normalized);
			} catch {
				return value;
			}
		}
	}
	if (typeof value.toObject === "function") return value.toObject({ depopulate: true });
	return value;
};

const normalizeString = (value) => {
	if (value === undefined || value === null) return "";
	return String(value).trim();
};

const normalizeBoolean = (value) => {
	if (value === undefined || value === null || value === "") return null;
	if (typeof value === "boolean") return value;
	if (typeof value === "number") return value !== 0;
	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (["true", "1", "yes", "on", "да"].includes(normalized)) return true;
		if (["false", "0", "no", "off", "нет"].includes(normalized)) return false;
	}

	return null;
};

const hasDateInputValue = (value) => value !== undefined && value !== null && value !== "";

const parseDate = (value) => {
	if (value === undefined || value === null || value === "") return null;
	const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
};

const parseRangeEndDate = (value) => {
	const date = parseDate(value);
	if (!date) return null;

	if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
		date.setUTCHours(23, 59, 59, 999);
	}

	return date;
};

const dateKeyFromValue = (value) => {
	if (typeof value === "string") {
		const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
		if (match) return match[1];
	}

	const date = parseDate(value);
	return date ? date.toISOString().slice(0, 10) : null;
};

const normalizeTime = (value) => {
	if (value === undefined || value === null || value === "") return null;

	const normalized = String(value).trim();
	const match = normalized.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
	if (!match) return null;

	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

	return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const timeFromDate = (value) => {
	const date = parseDate(value);
	if (!date) return null;

	return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
};

const buildDateTime = (dateValue, timeValue = "00:00") => {
	const dateKey = dateKeyFromValue(dateValue);
	const time = normalizeTime(timeValue) || "00:00";
	if (!dateKey) return null;

	const date = new Date(`${dateKey}T${time}:00.000Z`);
	return Number.isNaN(date.getTime()) ? null : date;
};

const buildDateOnly = (value) => buildDateTime(value, "00:00");

const compareDates = (left, right) => left.getTime() - right.getTime();

const uniqueSortedDates = (values) => {
	const seen = new Set();
	return values
		.map(parseDate)
		.filter(Boolean)
		.sort(compareDates)
		.filter((date) => {
			const iso = date.toISOString();
			if (seen.has(iso)) return false;
			seen.add(iso);
			return true;
		});
};

const normalizeEventDates = (value) => {
	if (value === undefined) return undefined;
	const values = Array.isArray(value) ? value : [value];
	return uniqueSortedDates(values);
};

const addSessionToMap = (groups, dateValue, timeValue, startsAtValue) => {
	const startsAt = startsAtValue ? parseDate(startsAtValue) : buildDateTime(dateValue, timeValue);
	const dateKey = dateKeyFromValue(dateValue || startsAt);
	if (!dateKey || !startsAt) return;

	const time = normalizeTime(timeValue) || timeFromDate(startsAt) || "00:00";
	if (!groups.has(dateKey)) {
		groups.set(dateKey, {
			date: buildDateOnly(dateKey),
			times: [],
			sessions: [],
		});
	}

	const group = groups.get(dateKey);
	if (!group.times.includes(time)) group.times.push(time);
	if (!group.sessions.some((session) => session.startsAt.getTime() === startsAt.getTime())) {
		group.sessions.push({ startsAt, time });
	}
};

const normalizeSessionInput = (session) => {
	const value = toPlainObject(session);
	const startsAt = value.startsAt || value.start || value.dateTime || value.datetime;
	return {
		date: value.date || startsAt,
		time: value.time || value.startTime || value.starts_at_time || timeFromDate(startsAt),
		startsAt,
	};
};

const normalizeSchedule = (value) => {
	if (value === undefined) return undefined;

	const normalizedValue = toPlainObject(value);
	const groups = new Map();
	const items = Array.isArray(normalizedValue) ? normalizedValue : [normalizedValue];

	const addTimeValues = (date, times = []) => {
		if (!Array.isArray(times) || !times.length) return;

		for (const rawTime of times) {
			if (typeof rawTime === "object" && rawTime !== null) {
				const session = normalizeSessionInput({ date, ...toPlainObject(rawTime) });
				addSessionToMap(groups, session.date, session.time, session.startsAt);
			} else {
				addSessionToMap(groups, date, rawTime);
			}
		}
	};

	for (const rawItem of items) {
		const item = toPlainObject(rawItem);
		if (!item) continue;

		if (item.startsAt || item.start || item.dateTime || item.datetime) {
			const session = normalizeSessionInput(item);
			addSessionToMap(groups, session.date, session.time, session.startsAt);
			continue;
		}

		const date = item.date || item.day;
		const times = item.times || item.startTimes || item.sessionTimes || item.slots;
		const sessions = item.sessions || item.sessionList || item.sessionItems;

		if (Array.isArray(times) && times.length) {
			addTimeValues(date, times);
			continue;
		}

		if (Array.isArray(sessions) && sessions.length) {
			addTimeValues(date, sessions);
			continue;
		}

		const dateTime = parseDate(date);
		addSessionToMap(groups, date, timeFromDate(dateTime) || "00:00", dateTime);
	}

	return Array.from(groups.values())
		.map((group) => ({
			date: group.date,
			times: group.times.sort(),
			sessions: group.sessions.sort((left, right) => compareDates(left.startsAt, right.startsAt)),
		}))
		.sort((left, right) => compareDates(left.date, right.date));
};

const scheduleFromEventDates = (eventDates = []) => {
	const dates = normalizeEventDates(eventDates) || [];
	return normalizeSchedule(
		dates.map((date) => ({
			date,
			time: timeFromDate(date),
			startsAt: date,
		}))
	) || [];
};

const flattenScheduleDates = (schedule = []) =>
	uniqueSortedDates(
		schedule.flatMap((group) => {
			if (Array.isArray(group.sessions) && group.sessions.length) return group.sessions.map((session) => session.startsAt);
			return (group.times || []).map((time) => buildDateTime(group.date, time));
		})
	);

const getRangeInput = (input) => {
	const range = toPlainObject(input.dateRange || input.date_range);
	return {
		from:
			range.from ||
			range.start ||
			range.startsAt ||
			range.dateFrom ||
			input.dateRangeFrom ||
			input.dateFrom ||
			input.date_from,
		to:
			range.to ||
			range.end ||
			range.endsAt ||
			range.dateTo ||
			input.dateRangeTo ||
			input.dateTo ||
			input.date_to,
	};
};

const normalizeDateRange = (input, fallbackDates = []) => {
	const range = getRangeInput(input);
	const parsedFrom = parseDate(range.from);
	const parsedTo = parseRangeEndDate(range.to);
	if (hasDateInputValue(range.from) && !parsedFrom) throw new Error("INVALID_DATE_RANGE");
	if (hasDateInputValue(range.to) && !parsedTo) throw new Error("INVALID_DATE_RANGE");

	const from = parsedFrom || fallbackDates[0] || null;
	const to = parsedTo || fallbackDates[1] || null;

	if (from && to && to.getTime() < from.getTime()) {
		throw new Error("INVALID_DATE_RANGE");
	}

	return { from, to };
};

const normalizeDisplayMode = (input, fallbackMode = "sessions") => {
	const rawMode = normalizeString(input.dateDisplayMode || input.date_display_mode || input.dateMode || fallbackMode);
	return DATE_DISPLAY_MODES.includes(rawMode) ? rawMode : "sessions";
};

const formatDatePart = (value) => {
	const date = parseDate(value);
	if (!date) return "";

	return [
		String(date.getUTCDate()).padStart(2, "0"),
		String(date.getUTCMonth() + 1).padStart(2, "0"),
		date.getUTCFullYear(),
	].join(".");
};

const formatScheduleDisplay = (schedule, eventDates) => {
	const dates = eventDates.length ? eventDates : flattenScheduleDates(schedule);
	if (!dates.length) return "";

	const firstDate = dates[0];
	const lastDate = dates[dates.length - 1];
	const sameDay = formatDatePart(firstDate) === formatDatePart(lastDate);

	if (!sameDay) return `${formatDatePart(firstDate)} – ${formatDatePart(lastDate)}`;

	const group = schedule.find((item) => formatDatePart(item.date) === formatDatePart(firstDate));
	const times = group?.times || [];
	return times.length ? `${formatDatePart(firstDate)}, ${times.join(", ")}` : formatDatePart(firstDate);
};

const buildDateSummary = ({ mode, isPermanent, dateRange, schedule, eventDates }) => {
	if (mode === "permanent" || isPermanent) {
		return {
			date_display: "Постоянное",
			date_summary: {
				mode: "permanent",
				startsAt: dateRange.from || eventDates[0] || null,
				endsAt: null,
				isPermanent: true,
				sessionsCount: 0,
			},
		};
	}

	if (mode === "range") {
		const label = dateRange.to
			? `${formatDatePart(dateRange.from)} – ${formatDatePart(dateRange.to)}`
			: `с ${formatDatePart(dateRange.from)}`;

		return {
			date_display: label,
			date_summary: {
				mode: "range",
				startsAt: dateRange.from,
				endsAt: dateRange.to,
				isPermanent: false,
				sessionsCount: 0,
			},
		};
	}

	return {
		date_display: formatScheduleDisplay(schedule, eventDates),
		date_summary: {
			mode: "sessions",
			startsAt: eventDates[0] || null,
			endsAt: eventDates[eventDates.length - 1] || null,
			isPermanent: false,
			sessionsCount: eventDates.length,
		},
	};
};

const normalizeEventDateFields = (input = {}) => {
	const plainInput = toPlainObject(input);
	const fallbackMode = plainInput.dateDisplayMode || plainInput.date_display_mode || "sessions";
	const explicitMode = normalizeDisplayMode(plainInput, fallbackMode);
	const permanentFlag = normalizeBoolean(plainInput.isPermanent ?? plainInput.is_permanent);
	const normalizedEventDates = normalizeEventDates(plainInput.event_dates) || [];
	const hasScheduleInput = hasOwn(plainInput, "schedule") || hasOwn(plainInput, "event_schedule");
	const rangeInput = getRangeInput(plainInput);
	const hasDateRangeInput = hasDateInputValue(rangeInput.from) || hasDateInputValue(rangeInput.to);
	const hasRangeStartInput = hasDateInputValue(rangeInput.from);
	const hasRangeEndInput = hasDateInputValue(rangeInput.to);

	let mode = explicitMode;
	if (permanentFlag === true) mode = "permanent";
	else if (mode !== "permanent" && hasRangeStartInput && !hasRangeEndInput) mode = "permanent";
	else if (mode !== "permanent" && hasDateRangeInput) mode = "range";

	if (mode === "permanent") {
		const dateRange = normalizeDateRange(plainInput, normalizedEventDates);
		dateRange.to = null;
		const eventDates = dateRange.from ? [dateRange.from] : [];
		const summary = buildDateSummary({
			mode,
			isPermanent: true,
			dateRange,
			schedule: [],
			eventDates,
		});

		return {
			dateDisplayMode: "permanent",
			isPermanent: true,
			dateRange,
			schedule: [],
			event_dates: eventDates,
			...summary,
		};
	}

	if (mode === "range") {
		const dateRange = normalizeDateRange(plainInput, normalizedEventDates);
		if (!dateRange.from || !dateRange.to) {
			throw new Error("INVALID_DATE_RANGE");
		}

		const eventDates = uniqueSortedDates([dateRange.from, dateRange.to].filter(Boolean));
		const summary = buildDateSummary({
			mode,
			isPermanent: false,
			dateRange,
			schedule: [],
			eventDates,
		});

		return {
			dateDisplayMode: "range",
			isPermanent: false,
			dateRange,
			schedule: [],
			event_dates: eventDates,
			...summary,
		};
	}

	const hasTopLevelDateInput = hasOwn(plainInput, "date") || hasOwn(plainInput, "day") || hasOwn(plainInput, "times") || hasOwn(plainInput, "sessions");
	const scheduleInput = hasScheduleInput
		? normalizeSchedule(plainInput.schedule ?? plainInput.event_schedule) || []
		: hasTopLevelDateInput
			? normalizeSchedule({
				date: plainInput.date || plainInput.day,
				times: plainInput.times || plainInput.startTimes || plainInput.sessionTimes || plainInput.slots,
				sessions: plainInput.sessions || plainInput.sessionList || plainInput.sessionItems,
			}) || []
		: null;
	const schedule = scheduleInput && scheduleInput.length ? scheduleInput : scheduleFromEventDates(normalizedEventDates);
	const eventDates = flattenScheduleDates(schedule);
	const summary = buildDateSummary({
		mode: "sessions",
		isPermanent: false,
		dateRange: { from: null, to: null },
		schedule,
		eventDates,
	});

	return {
		dateDisplayMode: "sessions",
		isPermanent: false,
		dateRange: { from: null, to: null },
		schedule,
		event_dates: eventDates,
		...summary,
	};
};

const hasEventDateInput = (payload = {}) => DATE_INPUT_FIELDS.some((field) => hasOwn(payload, field));

const mergeEventDateUpdate = (payload = {}) => {
	const result = { ...payload };

	for (const field of DATE_UPDATE_INPUT_ONLY_FIELDS) {
		delete result[field];
	}

	if (!hasEventDateInput(payload)) return result;

	return {
		...result,
		...normalizeEventDateFields(payload),
	};
};

const normalizeEventDocumentDates = (document) => {
	const normalized = normalizeEventDateFields(document);
	for (const [field, value] of Object.entries(normalized)) {
		document.set(field, value);
	}
};

const compactDateCondition = ({ dateFrom, dateTo }) => {
	const condition = {};
	const from = parseDate(dateFrom);
	const to = parseRangeEndDate(dateTo);
	if (from) condition.$gte = from;
	if (to) condition.$lte = to;
	return condition;
};

const buildEventDateQuery = ({ dateFrom, dateTo } = {}) => {
	const from = parseDate(dateFrom);
	const to = parseRangeEndDate(dateTo);

	if (!from && !to) {
		return {
			$or: [
				{ isPermanent: true },
				{ event_dates: { $ne: [] } },
				{ "dateRange.from": { $ne: null } },
			],
		};
	}

	const permanentConditions = [{ isPermanent: true }];
	if (to) {
		permanentConditions.push({
			$or: [
				{ "date_summary.startsAt": { $lte: to } },
				{ "date_summary.startsAt": null },
				{ "date_summary.startsAt": { $exists: false } },
			],
		});
	}

	const rangeConditions = [{ "dateRange.from": { $ne: null } }];
	if (to) rangeConditions.push({ "dateRange.from": { $lte: to } });
	if (from) {
		rangeConditions.push({
			$or: [
				{ "dateRange.to": { $gte: from } },
				{ "dateRange.to": null },
				{ "dateRange.to": { $exists: false } },
			],
		});
	}

	return {
		$or: [
			{ $and: permanentConditions },
			{ event_dates: { $elemMatch: compactDateCondition({ dateFrom, dateTo }) } },
			{ $and: rangeConditions },
		],
	};
};

const buildEventDateAddFieldsStage = () => ({
	$addFields: {
		event_date: {
			$ifNull: [
				"$date_summary.startsAt",
				{
					$ifNull: ["$dateRange.from", { $min: "$event_dates" }],
				},
			],
		},
	},
});

module.exports = {
	DATE_DISPLAY_MODES,
	buildDateTime,
	buildEventDateAddFieldsStage,
	buildEventDateQuery,
	flattenScheduleDates,
	mergeEventDateUpdate,
	normalizeEventDateFields,
	normalizeEventDateUpdate: (payload = {}) => (hasEventDateInput(payload) ? normalizeEventDateFields(payload) : {}),
	normalizeEventDocumentDates,
};
