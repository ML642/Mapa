const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
	{
		ignores: ["dist/**", "node_modules/**"],
	},
	{
		files: ["**/*.js"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "commonjs",
			globals: {
				...globals.node,
			},
		},
		rules: {
			...js.configs.recommended.rules,
			eqeqeq: ["warn", "always"],
			"no-self-compare": "warn",
			"no-return-await": "error",
			"no-unused-vars": "warn",
			"no-unreachable": "warn",
			"prefer-const": "warn",
			"prefer-template": "error",
			"prefer-arrow-callback": "warn",
			"no-multi-spaces": "error",
			"no-console": "off",
		},
	},
];
