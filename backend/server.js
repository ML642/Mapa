const os = require("os");
const dotenv = require("dotenv");
dotenv.config();
const app = require("./app");
const connectDB = require("./config/db");

connectDB();

const PORT = process.env.PORT || 3442;

const getLocalIPAddress = () => {
	const interfaces = os.networkInterfaces();
	for (const name of Object.keys(interfaces))
		for (const iface of interfaces[name]) if (iface.family === "IPv4" && !iface.internal) return iface.address;
	return "localhost";
};

app.listen(PORT, () => {
	const localIP = getLocalIPAddress();
	console.log(`Server started on:`);
	console.log(`http://localhost:${PORT}`);
	console.log(`http://${localIP}:${PORT}`);
});
