import { defineConfig } from "vitest/config";

//
const setupFiles = ["tests/setup/env.ts", "tests/setup/node-runtime.ts"];

export default defineConfig({
	test: {
		projects: [
			{
				test: {
					name: "unit",
					include: ["tests/unit/**/*.test.{ts,js}"],
					environment: "node",
					setupFiles,
				},
			},
			{
				test: {
					name: "integration",
					include: ["tests/integration/**/*.test.{ts,js}"],
					environment: "node",
					setupFiles,
					testTimeout: 30000,
					hookTimeout: 60000,
				},
			},
		],
		coverage: {
			provider: "v8",
			all: true,
			reporter: ["text", "html", "lcov"],
			include: [
				"controllers/**/*.js",
				"services/**/*.{js,ts}",
				"middlewares/**/*.{js,ts}",
				"utils/**/*.{js,ts}",
				"schemas/**/*.ts",
				"constants/**/*.js",
				"parsers/**/*.js",
			],
			exclude: ["tests/**", "dist/**", "scripts/**", "**/*.d.ts"],
			// thresholds: { lines: 70, functions: 70, branches: 70, statements: 70 },
		},
	},
});
