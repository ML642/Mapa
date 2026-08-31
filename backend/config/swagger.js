const path = require("path");
const swaggerJSDoc = require("swagger-jsdoc");

// Resolve globs relative to THIS file (not process.cwd()) with forward slashes,
// so annotations are found both in dev (source layout) and in the compiled prod
// image where only dist/ is shipped (dist/config -> dist/routes, ...).
const fromHere = (glob) => path.join(__dirname, glob).replace(/\\/g, "/");

const options = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "API Documentation",
		},
		servers: [
			{
				url: `http://localhost:${process.env.PORT || 3442}`,
			},
		],
	},
	apis: [
		fromHere("../routes/*.js"),
		fromHere("../models/*.js"),
		fromHere("../controllers/*.js"),
	],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
