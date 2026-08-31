import mongoose from "mongoose";

let seq = 0;

export function buildBlacklist(overrides: Record<string, any> = {}): Record<string, any> {
	seq += 1;
	return {
		email: `blocked${seq}@example.com`,
		createdBy: new mongoose.Types.ObjectId(),
		...overrides,
	};
}
