// config/db.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error("MONGO_URI is not set in .env file");

const connectDB = async () => {
	try {
		await mongoose.connect(MONGO_URI);
		console.log("MongoDB connected");
	} catch (err) {
		console.error("MongoDB connection error:", err);
		process.exit(1);
	}
};

module.exports = connectDB;
