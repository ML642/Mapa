import { describe, expect, test } from "vitest";
import {
	normalizeEventDateFields,
	mergeEventDateUpdate,
} from "../../../services/eventScheduleService";

describe("eventScheduleService.normalizeEventDateFields", () => {
	test("range payload with start and end dates builds a date display range", () => {
		const normalized = normalizeEventDateFields({
			dateDisplayMode: "range",
			dateRange: { from: "2026-07-02", to: "2026-08-15" },
		});

		expect(normalized.dateDisplayMode).toBe("range");
		expect(normalized.isPermanent).toBe(false);
		expect(normalized.dateRange.from).toBeInstanceOf(Date);
		expect(normalized.dateRange.to).toBeInstanceOf(Date);
		expect(normalized.date_display).toBe("02.07.2026 – 15.08.2026");
	});

	test("range payload without an end date is normalized as permanent", () => {
		const normalized = normalizeEventDateFields({
			dateDisplayMode: "range",
			dateRange: { from: "2026-07-02" },
		});

		expect(normalized.dateDisplayMode).toBe("permanent");
		expect(normalized.isPermanent).toBe(true);
		expect(normalized.dateRange.from).toBeInstanceOf(Date);
		expect(normalized.dateRange.to).toBeNull();
		expect(normalized.date_display).toBe("Постоянное");
	});

	test("permanent payload keeps permanent mode and empty dates", () => {
		const normalized = normalizeEventDateFields({
			dateDisplayMode: "permanent",
			isPermanent: true,
		});

		expect(normalized.dateDisplayMode).toBe("permanent");
		expect(normalized.isPermanent).toBe(true);
		expect(normalized.event_dates).toEqual([]);
		expect(normalized.date_display).toBe("Постоянное");
	});

	test("single date payload with multiple times is normalized into one day with several sessions", () => {
		const normalized = normalizeEventDateFields({
			date: "2026-07-02",
			times: ["10:00", "14:30"],
		});

		expect(normalized.dateDisplayMode).toBe("sessions");
		expect(normalized.schedule).toHaveLength(1);
		expect(normalized.schedule[0].times).toHaveLength(2);
		expect(normalized.schedule[0].times).toEqual(["10:00", "14:30"]);
		expect(normalized.event_dates).toHaveLength(2);
		expect(normalized.date_summary.sessionsCount).toBe(2);
	});

	test("range payload with only an end date is rejected", () => {
		expect(() =>
			normalizeEventDateFields({
				dateDisplayMode: "range",
				dateRange: { to: "2026-08-15" },
			})
		).toThrow(/INVALID_DATE_RANGE/);
	});
});

describe("eventScheduleService.mergeEventDateUpdate", () => {
	test("accepts a single date payload with structured sessions", () => {
		const normalized = mergeEventDateUpdate({
			date: "2026-07-03",
			sessions: [{ time: "09:00" }, { time: "18:30" }],
		});

		expect(normalized.dateDisplayMode).toBe("sessions");
		expect(normalized.schedule).toHaveLength(1);
		expect(normalized.schedule[0].times).toEqual(["09:00", "18:30"]);
		expect(normalized.event_dates).toHaveLength(2);
		expect("date" in normalized).toBe(false);
		expect("sessions" in normalized).toBe(false);
	});
});
