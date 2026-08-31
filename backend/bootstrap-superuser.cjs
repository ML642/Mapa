const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");
const BOOTSTRAP_LABEL = "[bootstrap-superadmin]";
const SUPERADMIN_ROLE = "superadmin";
const LEGACY_SUPERADMIN_ROLES = ["developer", "superuser"];

const parseCliArgs = (argv) => {
	const args = {};

	for (let i = 2; i < argv.length; i += 1) {
		const token = argv[i];
		if (!token.startsWith("--")) continue;

		const [rawKey, inlineValue] = token.slice(2).split("=", 2);
		const nextValue = inlineValue ?? argv[i + 1];
		const value = nextValue && !nextValue.startsWith("--") ? nextValue : "true";

		args[rawKey] = value;
		if (inlineValue === undefined && value !== "true") i += 1;
	}

	return args;
};

const cliArgs = parseCliArgs(process.argv);

if (cliArgs["backend-dir"]) process.env.BACKEND_DIR = cliArgs["backend-dir"];
if (cliArgs.email) process.env.SUPERADMIN_EMAIL = cliArgs.email;
if (cliArgs.password) process.env.SUPERADMIN_PASSWORD = cliArgs.password;
if (cliArgs.username) process.env.SUPERADMIN_USERNAME = cliArgs.username;

// Each root is probed both as-is and at its ./dist subfolder, because the prod
// image ships only the compiled dist/ (no package.json, no source models/ at
// the app root) while dev runs against the source tree.
const withDist = (dir) => [dir, path.join(dir, "dist")];

const backendCandidates = [
	process.env.BACKEND_DIR,
	__dirname, // the script's own dir — this is /app in the prod image (see Dockerfile)
	...withDist(process.cwd()),
	...withDist(path.join(process.cwd(), "Mapa-backend")),
	...withDist("/app"),
].filter(Boolean);

// Detect by the compiled model, not package.json: tsc does not emit a
// package.json into dist/, so requiring one would never match in production.
const backendDir = backendCandidates
	.map((candidate) => path.resolve(candidate))
	.find((candidate) => fs.existsSync(path.join(candidate, "models", "User.js")));

if (!backendDir) {
	console.error(`${BOOTSTRAP_LABEL} Backend directory was not found`);
	process.exit(1);
}

const requireBackend = createRequire(path.join(backendDir, "package.json"));
const dotenv = requireBackend("dotenv");
const mongoose = requireBackend("mongoose");
const bcrypt = requireBackend("bcryptjs");
const User = require(path.join(backendDir, "models", "User.js"));

// Deliberately independent of backendDir: uploads live in the mounted
// /app/uploads volume (chowned for appuser), while backendDir resolves to
// /app/dist (root-owned, wiped on every rebuild) because that's where the
// compiled models/ live. Reusing dist's compiled config/paths.js keeps this
// in sync with the same UPLOADS_DIR the running server uses.
const { UPLOADS_DIR } = require(path.join(backendDir, "config", "paths.js"));

dotenv.config({ path: path.join(backendDir, ".env") });

const resolveEnv = (...values) =>
	values.find((value) => typeof value === "string" && value.trim())?.trim();

const resolveRequired = (value, errorMessage) => {
	if (typeof value === "string" && value.trim()) return value.trim();
	throw new Error(errorMessage);
};

const ensureUserFolders = async (userId) => {
	const userFolder = path.join(UPLOADS_DIR, "users", userId.toString());
	const eventsFolder = path.join(userFolder, "events");
	await fs.promises.mkdir(eventsFolder, { recursive: true });
};

const main = async () => {
	const emailInput = resolveRequired(
		resolveEnv(process.env.SUPERADMIN_EMAIL, process.env.SUPERUSER_EMAIL),
		"SUPERADMIN_EMAIL or --email is required",
	);
	const password = resolveRequired(
		resolveEnv(process.env.SUPERADMIN_PASSWORD, process.env.SUPERUSER_PASSWORD),
		"SUPERADMIN_PASSWORD or --password is required",
	);
	const username = resolveEnv(process.env.SUPERADMIN_USERNAME, process.env.SUPERUSER_USERNAME) || SUPERADMIN_ROLE;
	const normalizedEmail = emailInput.toLowerCase();
	const passwordHash = await bcrypt.hash(password, 10);
	const mongoUri = resolveRequired(process.env.MONGO_URI, "MONGO_URI is required");

	await mongoose.connect(mongoUri);

	try {
		const migrated = await User.updateMany(
			{ role: { $in: LEGACY_SUPERADMIN_ROLES } },
			{ $set: { role: SUPERADMIN_ROLE } },
		);
		if (migrated.modifiedCount > 0) {
			console.log(
				`${BOOTSTRAP_LABEL} migrated ${migrated.modifiedCount} legacy privileged role(s) to ${SUPERADMIN_ROLE}`,
			);
		}

		let user = await User.findOne({ email: normalizedEmail });
		if (!user) {
			user = await User.create({
				username,
				email: normalizedEmail,
				password: passwordHash,
				role: SUPERADMIN_ROLE,
				isVerified: true,
			});

			await ensureUserFolders(user._id);
			console.log(`${BOOTSTRAP_LABEL} created ${SUPERADMIN_ROLE} ${normalizedEmail}`);
			return;
		}

		const previousRole = user.role;
		if (!user.username) user.username = username;
		user.password = passwordHash;
		user.role = SUPERADMIN_ROLE;
		user.isVerified = true;
		await user.save();

		await ensureUserFolders(user._id);
		console.log(`${BOOTSTRAP_LABEL} elevated existing user ${normalizedEmail} from ${previousRole} to ${SUPERADMIN_ROLE}`);
	} finally {
		await mongoose.disconnect();
	}
};

main().catch((error) => {
	console.error(`${BOOTSTRAP_LABEL} failed:`, error.message);
	process.exit(1);
});
