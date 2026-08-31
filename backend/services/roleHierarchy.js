// services/roleHierarchy.js
const User = require("../models/User");
const DEBUG = process.env.DEBUG === "true";

// Function to check if a user has a higher or equal role than the required role
exports.roleHierarchy = (userRole, requiredRole, { strict = false, higherOnly = false } = {}) => {
	const roles = User.schema.path("role").enumValues;
	const userLevel = roles.indexOf(userRole);
	const requiredLevel = roles.indexOf(requiredRole);

	if (DEBUG) console.log(`userRole: ${userRole}, requiredRole: ${requiredRole}`);

	if (userLevel === -1 || requiredLevel === -1) {
		console.error("Invalid role specified:", userRole, requiredRole);
		return false;
	}

	if (strict) return userLevel === requiredLevel;
	if (higherOnly) return userLevel > requiredLevel;
	return userLevel >= requiredLevel;
};
