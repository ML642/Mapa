import mongoose from "mongoose";
import { describe, expect, test } from "vitest";
import Event from "../../../models/Event";
import {
	normalizeEventForDateBackfill,
	parseArgs,
} from "../../../scripts/backfillEventDates";

const createEvent = (overrides: Record<string, any> = {}) =>
	new (Event as any)({
		title: "Legacy event",
		address: "Minsk, Independence ave 10",
		createdBy: new mongoose.Types.ObjectId(),
		...overrides,
	});

describe("backfillEventDates.normalizeEventForDateBackfill", () => {
	test("builds schedule and date display from legacy event_dates", () => {
		const event = createEvent({
			event_dates: [
				new Date("2026-07-02T10:00:00.000Z"),
				new Date("2026-07-02T14:30:00.000Z"),
			],
		});

		const result = normalizeEventForDateBackfill(event);

		expect(result.changed).toBe(true);
		expect(event.dateDisplayMode).toBe("sessions");
		expect(event.schedule).toHaveLength(1);
		expect(event.schedule[0].times).toEqual(["10:00", "14:30"]);
		expect(event.date_display).toBe("02.07.2026, 10:00, 14:30");
		expect(event.date_summary.sessionsCount).toBe(2);
	});

	test("normalizes range without end date as permanent", () => {
		const event = createEvent({
			dateDisplayMode: "range",
			dateRange: { from: new Date("2026-07-02T00:00:00.000Z") },
		});

		const result = normalizeEventForDateBackfill(event);

		expect(result.changed).toBe(true);
		expect(event.dateDisplayMode).toBe("permanent");
		expect(event.isPermanent).toBe(true);
		expect(event.dateRange.to).toBeNull();
		expect(event.date_display).toBe("Постоянное");
	});
});

describe("backfillEventDates.parseArgs", () => {
	test("supports dry run, limit and batch size", () => {
		expect(parseArgs(["--dry-run", "--limit=25", "--batch-size=10"])).toEqual({
			batchSize: 10,
			dryRun: true,
			limit: 25,
		});
	});
});
