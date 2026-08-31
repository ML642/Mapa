import { MongoMemoryServer } from "mongodb-memory-server";
import { appRequire } from "./nodeRequire";

const mongoose = appRequire<typeof import("mongoose")>("mongoose");

//   beforeAll(connectTestDB); afterEach(clearTestDB); afterAll(closeTestDB);
let mongod: MongoMemoryServer | null = null;

export async function connectTestDB(): Promise<void> {
	if (mongod) return;
	mongod = await MongoMemoryServer.create();
	const uri = mongod.getUri();
	process.env.MONGO_URI = uri;
	await mongoose.connect(uri);
}

export async function clearTestDB(): Promise<void> {
	const collections = mongoose.connection.collections;
	await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
}

export async function closeTestDB(): Promise<void> {
	await mongoose.connection.dropDatabase().catch(() => {});
	await mongoose.disconnect();
	if (mongod) {
		await mongod.stop();
		mongod = null;
	}
}
