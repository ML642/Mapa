import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { app } from "../helpers/app";
import { connectTestDB, clearTestDB, closeTestDB } from "../helpers/db";
import { appRequire } from "../helpers/nodeRequire";

const fs = appRequire<typeof import("fs")>("fs");


beforeAll(async () => {
	await connectTestDB();
});

afterEach(async () => {
	await clearTestDB();
	vi.restoreAllMocks();
});

afterAll(async () => {
	await closeTestDB();
});

describe("app bootstrap smoke", () => {
	it("GET /status → 200 (без БД; cron/redis замоканы)", async () => {
		const res = await request(app).get("/status");

		expect(res.status).toBe(200);
	});

	it("POST /auth/register → 201 (БД + сервисы связаны)", async () => {
		vi.spyOn(fs, "mkdirSync").mockReturnValue(undefined as unknown as string);

		const res = await request(app)
			.post("/auth/register")
			.send({ username: "smokeuser", email: "smoke@example.com", password: "Password123" });

		expect(res.status).toBe(201);
		expect(res.body).toHaveProperty("message");
	});
});
