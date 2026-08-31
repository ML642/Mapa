import { buildUser } from "../factories/user.factory";
import { appRequire } from "./nodeRequire";

const jwt = appRequire<typeof import("jsonwebtoken")>("jsonwebtoken");
const User = appRequire("./models/User");


export function signAccessToken(userId: string): string {
	return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET as string, { expiresIn: "5d" });
}

export function signResetToken(userId: string): string {
	return jwt.sign({ id: userId, purpose: "password_reset" }, process.env.JWT_ACCESS_SECRET as string, {
		expiresIn: "10m",
	});
}

export async function createVerifiedUser(
	overrides: Record<string, any> = {}
): Promise<{ user: any; token: string }> {
	const user = await User.create(buildUser({ isVerified: true, ...overrides }));
	const token = signAccessToken(user._id.toString());
	return { user, token };
}
