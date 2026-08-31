const express = require("express");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("../config/swagger");
const eventRoutes = require("./eventRoutes");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const eventModerationRoutes = require("./eventModerationRoutes");
const parserRoutes = require("./parserRoutes");
const recommendationRoutes = require("./recommendationRoutes");
const friendRoutes = require("./friendRoutes");
const utilityRoutes = require("./utilityRoutes");
const adminRoutes = require("./adminRoutes");

const router = express.Router();

router.use("/", utilityRoutes);
router.get("/docs.json", (req, res) => {
	res.setHeader("Content-Type", "application/json");
	res.send(swaggerSpec);
});
// Make the UI fetch the spec from /docs.json instead of baking it into
// swagger-ui-init.js. When a spec is baked in, swagger-ui gives it precedence
// over `url` and it renders empty behind the prod proxy; /docs.json is
// confirmed to serve the full spec, so load exclusively from there.
router.use(
	"/docs",
	swaggerUi.serve,
	swaggerUi.setup(null, {
		explorer: true,
		swaggerOptions: {
			url: "/docs.json",
		},
	})
);

router.use("/events", eventRoutes);
router.use("/moderation/events", eventModerationRoutes);
router.use("/parser", parserRoutes);
router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/recommendation", recommendationRoutes);
router.use("/friends", friendRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
