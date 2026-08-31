let seq = 0;

export function buildUser(overrides: Record<string, any> = {}): Record<string, any> {
	seq += 1;
	return {
		username: `user${seq}`,
		email: `user${seq}@example.com`,
		role: "user",
		isVerified: true,
		...overrides,
	};
}
