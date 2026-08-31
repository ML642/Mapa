import mongoose from "mongoose";

let seq = 0;

export function buildEvent(overrides: Record<string, any> = {}): Record<string, any> {
	seq += 1;
	const inThirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
	return {
		title: `Event ${seq}`,
		address: "Minsk, Independence ave 10",
		createdBy: new mongoose.Types.ObjectId(),
		category: "Другое",
		coordinates: [27.5667, 53.9],
		status: "active",
		event_dates: [inThirtyDays],
		...overrides,
	};
}
