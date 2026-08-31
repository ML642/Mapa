import mongoose from "mongoose";

export function buildRefreshToken(overrides: Record<string, any> = {}): Record<string, any> {
	return {
		token: `refresh-${Date.now()}-${Math.random().toString(36).slice(2)}`,
		userId: new mongoose.Types.ObjectId(),
		userAgent: "vitest-agent",
		expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		...overrides,
	};
}
