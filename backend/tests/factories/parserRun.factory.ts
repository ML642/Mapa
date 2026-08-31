import mongoose from "mongoose";

// mode (enum ["full","category"]), requestedBy.
export function buildParserRun(overrides: Record<string, any> = {}): Record<string, any> {
	return {
		source: "relax",
		mode: "full",
		requestedBy: new mongoose.Types.ObjectId(),
		status: "queued",
		...overrides,
	};
}
