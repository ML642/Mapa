import { createRequire } from "module";
import path from "path";
import { vi } from "vitest";


const require = createRequire(path.join(process.cwd(), "package.json"));

require("ts-node").register({
	transpileOnly: true,
	compilerOptions: {
		module: "commonjs",
		declaration: false,
		declarationMap: false,
		sourceMap: true,
		allowJs: false,
		noEmit: false,
		rootDir: ".",
		outDir: undefined,
	},
});

function stubModule(id: string, exports: unknown): void {
	const resolved = require.resolve(id);
	require.cache[resolved] = {
		id: resolved,
		filename: resolved,
		loaded: true,
		exports,
		children: [],
		paths: [],
	} as unknown as NodeModule;
}

const root = process.cwd();

stubModule("node-cron", { schedule: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })) });

const redisStub = {
	on: vi.fn(),
	get: vi.fn(async () => null),
	set: vi.fn(async () => "OK"),
	del: vi.fn(async () => 0),
	expire: vi.fn(async () => 1),
	quit: vi.fn(async () => "OK"),
	disconnect: vi.fn(),
};
stubModule(path.join(root, "config/redis.js"), redisStub);

const fakeLogger: Record<string, unknown> = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
	fatal: vi.fn(),
	trace: vi.fn(),
};
fakeLogger.child = vi.fn(() => fakeLogger);
stubModule(path.join(root, "services/createLogger.js"), { createLogger: vi.fn(() => fakeLogger) });

stubModule(path.join(root, "services/emailService.js"), {
	sendVerificationEmail: vi.fn(async () => {}),
	sendResetPasswordEmail: vi.fn(async () => {}),
});
