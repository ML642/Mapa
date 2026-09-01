// services/emailService.js
const nodemailer = require("nodemailer");
const ApiError = require("../utils/ApiError");
const PORT = Number(process.env.EMAIL_PORT);
const HOST = process.env.EMAIL_HOST;
const EMAIL_FROM = process.env.EMAIL_FROM;
const EMAIL_USER = process.env.EMAIL_USER || EMAIL_FROM;
const EMAIL_PASS = process.env.EMAIL_PASS;
const SECURE = PORT === 465;
const isConfigured = Boolean(PORT && HOST && EMAIL_FROM && EMAIL_USER && EMAIL_PASS);

if (!isConfigured) {
	console.error("Error: Email service is not configured");
}

const transporter = isConfigured
	? nodemailer.createTransport({
		host: HOST,
		port: PORT,
		secure: SECURE,
		auth: {
			user: EMAIL_USER,
			pass: EMAIL_PASS,
		},
		connectionTimeout: 10000,
		greetingTimeout: 10000,
		socketTimeout: 15000,
	})
	: null;

const sendEmail = async (message) => {
	if (!transporter) {
		throw new ApiError(503, "EMAIL_DELIVERY_UNAVAILABLE");
	}

	try {
		await transporter.sendMail(message);
	} catch (error) {
		const deliveryError = new ApiError(503, "EMAIL_DELIVERY_UNAVAILABLE");
		deliveryError.cause = error;
		throw deliveryError;
	}
};

exports.sendVerificationEmail = async (to, code) => {
	const subject = "MAPA verification code";

	const html = `
		<h2>Verification code</h2>
		<p>Your registration verification code:</p>
		<h1>${code}</h1>
		<p>This code is valid for 24 hours.</p>
	`;

	await sendEmail({
		from: `"MAPA" <${EMAIL_FROM}>`,
		to,
		subject,
		html,
	});
};

exports.sendResetPasswordEmail = async (to, code) => {
	const subject = "MAPA password reset code";

	const html = `
		<h2>Password reset code</h2>
		<p>Your password reset code:</p>
		<h1>${code}</h1>
		<p>This code is valid for 15 minutes.</p>
	`;

	await sendEmail({
		from: `"MAPA" <${EMAIL_FROM}>`,
		to,
		subject,
		html,
	});
};
