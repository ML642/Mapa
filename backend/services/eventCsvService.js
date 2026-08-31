const Event = require("../models/Event");
const { buildEventDateQuery, normalizeEventDateUpdate } = require("./eventScheduleService");

const DEFAULT_IMPORT_SOURCE = "csv-import";
const EXPORT_DELIMITER = ";";
const MULTI_VALUE_SEPARATOR = "|";
const ALLOWED_EXPORT_STATUSES = new Set(["active", "parsed", "inactive", "ignored", "deleted", "all"]);
const EXPORT_HEADERS = [
	"_id",
	"title",
	"description",
	"event_dates",
	"event_date",
	"date_display_mode",
	"is_permanent",
	"date_range_from",
	"date_range_to",
	"schedule",
	"date_display",
	"address",
	"coordinates_lat",
	"coordinates_lng",
	"category",
	"event_image",
	"price",
	"price_description",
	"is_premium",
	"phone",
	"source",
	"status",
	"createdBy",
	"updatedBy",
	"createdAt",
	"updatedAt",
];

class CsvValidationError extends Error {
	constructor(message, errors = []) {
		super(message);
		this.name = "CsvValidationError";
		this.errors = errors;
		this.status = 400;
	}
}

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

const escapeForCsv = (value) => {
	if (value === null || value === undefined) return "";

	const normalized = String(value).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
	if (normalized.includes(EXPORT_DELIMITER) || normalized.includes('"') || normalized.includes("\n"))
		return `"${normalized.replace(/"/g, '""')}"`;

	return normalized;
};

const countDelimiterOutsideQuotes = (line, delimiter) => {
	let count = 0;
	let inQuotes = false;

	for (let index = 0; index < line.length; index += 1) {
		const char = line[index];

		if (char === '"') {
			if (inQuotes && line[index + 1] === '"') {
				index += 1;
				continue;
			}

			inQuotes = !inQuotes;
			continue;
		}

		if (!inQuotes && char === delimiter) count += 1;
	}

	return count;
};

const detectDelimiter = (input) => {
	const firstNonEmptyLine = input
		.replace(/^\uFEFF/, "")
		.split(/\r?\n/)
		.map((line) => line.trim())
		.find(Boolean);

	if (!firstNonEmptyLine) return EXPORT_DELIMITER;

	const semicolonCount = countDelimiterOutsideQuotes(firstNonEmptyLine, ";");
	const commaCount = countDelimiterOutsideQuotes(firstNonEmptyLine, ",");

	return semicolonCount > commaCount ? ";" : ",";
};

const parseCsvTable = (input, delimiter) => {
	const rows = [];
	let currentRow = [];
	let currentValue = "";
	let inQuotes = false;

	for (let index = 0; index < input.length; index += 1) {
		const char = input[index];

		if (inQuotes) {
			if (char === '"') {
				if (input[index + 1] === '"') {
					currentValue += '"';
					index += 1;
				} else {
					inQuotes = false;
				}
			} else {
				currentValue += char;
			}
			continue;
		}

		if (char === '"') {
			inQuotes = true;
			continue;
		}

		if (char === delimiter) {
			currentRow.push(currentValue);
			currentValue = "";
			continue;
		}

		if (char === "\n") {
			currentRow.push(currentValue);
			rows.push(currentRow);
			currentRow = [];
			currentValue = "";
			continue;
		}

		if (char !== "\r") currentValue += char;
	}

	if (inQuotes) throw new CsvValidationError("CSV contains an unclosed quoted value");

	if (currentValue.length > 0 || currentRow.length > 0) {
		currentRow.push(currentValue);
		rows.push(currentRow);
	}

	return rows.filter((row) => row.some((value) => normalizeString(value) !== ""));
};

const splitMultiValueField = (value) =>
	normalizeString(value)
		.split(MULTI_VALUE_SEPARATOR)
		.map((item) => item.trim())
		.filter(Boolean);

const parseDateOrThrow = (value, fieldName) => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime()))
		throw new CsvValidationError(`Invalid ${fieldName} value`, [`Query parameter "${fieldName}" must be a valid date`]);
	return date;
};

const parseNumber = (value, fieldName, rowNumber, errors) => {
	const normalized = normalizeString(value);
	if (!normalized) return null;

	const parsed = Number(normalized.replace(/\s+/g, "").replace(",", "."));
	if (!Number.isFinite(parsed)) {
		errors.push(`Row ${rowNumber}: invalid ${fieldName}`);
		return null;
	}

	return parsed;
};

const parseBoolean = (value, fieldName, rowNumber, errors) => {
	const normalized = normalizeString(value).toLowerCase();
	if (!normalized) return false;

	if (["true", "1", "yes", "y", "да"].includes(normalized)) return true;
	if (["false", "0", "no", "n", "нет"].includes(normalized)) return false;

	errors.push(`Row ${rowNumber}: invalid ${fieldName}`);
	return false;
};

const parseCoordinates = (row, rowNumber, errors) => {
	const latitudeRaw = normalizeString(row.coordinates_lat);
	const longitudeRaw = normalizeString(row.coordinates_lng);
	const inlineCoordinates = normalizeString(row.coordinates);

	if (!latitudeRaw && !longitudeRaw && !inlineCoordinates) return undefined;

	let latitude = latitudeRaw;
	let longitude = longitudeRaw;

	if (inlineCoordinates && (!latitude || !longitude)) {
		const parts = inlineCoordinates
			.split(/[|,]/)
			.map((part) => part.trim())
			.filter(Boolean);

		if (parts.length === 2) {
			[latitude, longitude] = parts;
		} else {
			errors.push(`Row ${rowNumber}: invalid coordinates`);
			return undefined;
		}
	}

	if (!latitude || !longitude) {
		errors.push(`Row ${rowNumber}: both coordinates_lat and coordinates_lng are required`);
		return undefined;
	}

	const parsedLatitude = parseNumber(latitude, "coordinates_lat", rowNumber, errors);
	const parsedLongitude = parseNumber(longitude, "coordinates_lng", rowNumber, errors);

	if (parsedLatitude === null || parsedLongitude === null) return undefined;
	if (parsedLatitude < -90 || parsedLatitude > 90 || parsedLongitude < -180 || parsedLongitude > 180) {
		errors.push(`Row ${rowNumber}: coordinates are out of range`);
		return undefined;
	}

	return [parsedLatitude, parsedLongitude];
};

const parseJsonField = (value, fieldName, rowNumber, errors) => {
	const normalized = normalizeString(value);
	if (!normalized) return undefined;

	try {
		return JSON.parse(normalized);
	} catch {
		errors.push(`Row ${rowNumber}: invalid ${fieldName} JSON`);
		return undefined;
	}
};

const parseEventDates = (row, rowNumber, errors, { required = true } = {}) => {
	const raw = normalizeString(row.event_dates) || normalizeString(row.event_date);
	if (!raw) {
		if (required) errors.push(`Row ${rowNumber}: event_dates is required`);
		return [];
	}

	const parts = splitMultiValueField(raw);
	if (!parts.length) {
		if (required) errors.push(`Row ${rowNumber}: event_dates is required`);
		return [];
	}

	const seen = new Set();
	const result = [];

	for (const part of parts) {
		const date = new Date(part);
		if (Number.isNaN(date.getTime())) {
			errors.push(`Row ${rowNumber}: invalid event date "${part}"`);
			continue;
		}

		const iso = date.toISOString();
		if (seen.has(iso)) continue;
		seen.add(iso);
		result.push(date);
	}

	return result.sort((left, right) => left.getTime() - right.getTime());
};

const mapImportRowToEvent = (row, rowNumber, userId, errors) => {
	const title = normalizeString(row.title);
	const address = normalizeString(row.address);
	const categoryInput = normalizeString(row.category);
	const description = normalizeString(row.description);
	const priceDescription = normalizeString(row.price_description);
	const phone = normalizeString(row.phone);
	const source = normalizeString(row.source);
	const requestedStatus = normalizeString(row.status).toLowerCase();
	const eventImage = splitMultiValueField(row.event_image);
	const dateDisplayMode = normalizeString(row.date_display_mode || row.dateDisplayMode);
	const isPermanentRaw = normalizeString(row.is_permanent || row.isPermanent);
	const dateRangeFrom = normalizeString(row.date_range_from || row.dateRangeFrom);
	const dateRangeTo = normalizeString(row.date_range_to || row.dateRangeTo);
	const schedule = parseJsonField(row.schedule || row.event_schedule, "schedule", rowNumber, errors);
	const isPermanentRequested = ["true", "1", "yes", "on", "да"].includes(isPermanentRaw.toLowerCase());
	const dateDisplayRequestsNewMode = ["range", "permanent"].includes(dateDisplayMode);
	const hasNewDateFields = Boolean(dateDisplayRequestsNewMode || isPermanentRequested || dateRangeFrom || dateRangeTo || schedule);

	if (!title) errors.push(`Row ${rowNumber}: title is required`);
	if (!address) errors.push(`Row ${rowNumber}: address is required`);

	const eventDates = parseEventDates(row, rowNumber, errors, { required: !hasNewDateFields });
	const coordinates = parseCoordinates(row, rowNumber, errors);
	const category = categoryInput ? Event.resolveCategory(categoryInput) : null;
	const price = parseNumber(row.price, "price", rowNumber, errors);
	const isPremium = parseBoolean(row.is_premium, "is_premium", rowNumber, errors);
	const isPermanent = isPermanentRaw ? parseBoolean(isPermanentRaw, "is_permanent", rowNumber, errors) : undefined;
	const datePayload = {};
	if (eventDates.length) datePayload.event_dates = eventDates;
	if (schedule) datePayload.schedule = schedule;
	if (dateDisplayMode) datePayload.dateDisplayMode = dateDisplayMode;
	if (isPermanent !== undefined) datePayload.isPermanent = isPermanent;
	if (dateRangeFrom || dateRangeTo) datePayload.dateRange = { from: dateRangeFrom || undefined, to: dateRangeTo || undefined };
	const dateFields = normalizeEventDateUpdate(datePayload);

	if (categoryInput && !category) errors.push(`Row ${rowNumber}: invalid category "${categoryInput}"`);
	if (errors.length) return null;

	const event = {
		title,
		address,
		event_dates: eventDates,
		...dateFields,
		description: description || undefined,
		category: category || undefined,
		coordinates,
		event_image: eventImage,
		price,
		price_description: priceDescription || undefined,
		is_premium: isPremium,
		phone: phone || undefined,
		source: source || DEFAULT_IMPORT_SOURCE,
		status: ["active", "inactive"].includes(requestedStatus) ? requestedStatus : "inactive",
		createdBy: userId,
	};

	if (!coordinates) delete event.coordinates;
	if (!eventImage.length) delete event.event_image;
	if (price === null) delete event.price;

	return event;
};

const formatDate = (value) => {
	if (!value) return "";

	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return "";

	return date.toISOString();
};

const getNearestEventDate = (eventDates) => {
	if (!Array.isArray(eventDates) || !eventDates.length) return null;

	return eventDates.reduce((nearest, current) => {
		if (!nearest) return current;
		return new Date(current).getTime() < new Date(nearest).getTime() ? current : nearest;
	}, null);
};

const normalizeStatus = (status) => {
	const normalized = normalizeString(status);
	if (!normalized) return "active";
	if (!ALLOWED_EXPORT_STATUSES.has(normalized))
		throw new CsvValidationError(`Invalid status "${status}"`, [`Allowed values: ${Array.from(ALLOWED_EXPORT_STATUSES).join(", ")}`]);
	return normalized;
};

const parseEventCsvBuffer = (buffer, userId) => {
	const input = buffer.toString("utf8").replace(/^\uFEFF/, "");
	const delimiter = detectDelimiter(input);
	const rows = parseCsvTable(input, delimiter);

	if (!rows.length) throw new CsvValidationError("CSV file is empty");

	const headers = rows[0].map((header) => normalizeString(header).replace(/^\uFEFF/, ""));
	if (!headers.length || headers.some((header) => !header))
		throw new CsvValidationError("CSV header row contains empty column names");

	const duplicates = headers.filter((header, index) => headers.indexOf(header) !== index);
	if (duplicates.length)
		throw new CsvValidationError("CSV header row contains duplicated columns", Array.from(new Set(duplicates)));

	const events = [];
	const errors = [];

	for (let index = 1; index < rows.length; index += 1) {
		const row = rows[index];
		const rowNumber = index + 1;

		if (row.length !== headers.length) {
			errors.push(`Row ${rowNumber}: expected ${headers.length} columns, received ${row.length}`);
			continue;
		}

		const mappedRow = headers.reduce((accumulator, header, columnIndex) => {
			accumulator[header] = row[columnIndex];
			return accumulator;
		}, {});

		const rowErrors = [];
		const event = mapImportRowToEvent(mappedRow, rowNumber, userId, rowErrors);
		if (rowErrors.length) {
			errors.push(...rowErrors);
			continue;
		}

		events.push(event);
	}

	if (errors.length) throw new CsvValidationError("CSV validation failed", errors);
	if (!events.length) throw new CsvValidationError("CSV file does not contain importable events");

	return events;
};

const listEventsForCsvExport = async ({ category, dateFrom, dateTo, status }) => {
	const match = {};
	const resolvedCategory = normalizeString(category) ? Event.resolveCategory(category) : null;

	if (normalizeString(category) && !resolvedCategory)
		throw new CsvValidationError(`Invalid category "${category}"`, ["Category does not match any known event category"]);

	if (resolvedCategory) match.category = resolvedCategory;

	const normalizedStatus = normalizeStatus(status);
	if (normalizedStatus !== "all") match.status = normalizedStatus;

	if (dateFrom) parseDateOrThrow(dateFrom, "dateFrom");
	if (dateTo) parseDateOrThrow(dateTo, "dateTo");
	if (dateFrom || dateTo) Object.assign(match, buildEventDateQuery({ dateFrom, dateTo }));

	return Event.find(match)
		.sort({ "date_summary.startsAt": 1, event_dates: 1, updatedAt: -1 })
		.lean();
};

const buildEventsCsv = (events) => {
	const lines = [
		EXPORT_HEADERS.map((header) => escapeForCsv(header)).join(EXPORT_DELIMITER),
		...events.map((event) => {
			const row = {
				_id: event._id?.toString?.() || "",
				title: event.title || "",
				description: event.description || "",
				event_dates: Array.isArray(event.event_dates)
					? event.event_dates.map((date) => formatDate(date)).filter(Boolean).join(MULTI_VALUE_SEPARATOR)
					: "",
				event_date: formatDate(event.event_date || event.date_summary?.startsAt || event.dateRange?.from || getNearestEventDate(event.event_dates)),
				date_display_mode: event.dateDisplayMode || event.date_summary?.mode || "sessions",
				is_permanent: String(Boolean(event.isPermanent)),
				date_range_from: formatDate(event.dateRange?.from),
				date_range_to: formatDate(event.dateRange?.to),
				schedule: Array.isArray(event.schedule) && event.schedule.length ? JSON.stringify(event.schedule) : "",
				date_display: event.date_display || "",
				address: event.address || "",
				coordinates_lat: Array.isArray(event.coordinates) ? event.coordinates[0] ?? "" : "",
				coordinates_lng: Array.isArray(event.coordinates) ? event.coordinates[1] ?? "" : "",
				category: event.category || "",
				event_image: Array.isArray(event.event_image) ? event.event_image.join(MULTI_VALUE_SEPARATOR) : "",
				price: event.price ?? "",
				price_description: event.price_description || "",
				is_premium: String(Boolean(event.is_premium)),
				phone: event.phone || "",
				source: event.source || "",
				status: event.status || "",
				createdBy: event.createdBy?.toString?.() || "",
				updatedBy: event.updatedBy?.toString?.() || "",
				createdAt: formatDate(event.createdAt),
				updatedAt: formatDate(event.updatedAt),
			};

			return EXPORT_HEADERS.map((header) => escapeForCsv(row[header])).join(EXPORT_DELIMITER);
		}),
	];

	return `\uFEFF${lines.join("\r\n")}`;
};

module.exports = {
	CsvValidationError,
	buildEventsCsv,
	listEventsForCsvExport,
	parseEventCsvBuffer,
};
