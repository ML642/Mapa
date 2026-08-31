// services/emailService.js
const nodemailer = require("nodemailer");
const ApiError = require("../utils/ApiError");
const PORT = Number(process.env.EMAIL_PORT);
const HOST = process.env.EMAIL_HOST;
const EMAIL_FROM = process.env.EMAIL_FROM;
const EMAIL_USER = process.env.EMAIL_USER || EMAIL_FROM;
const EMAIL_PASS = process.env.EMAIL_PASS;
const SECURE = PORT === 465;

if (!PORT || !HOST || !EMAIL_FROM || !EMAIL_USER || !EMAIL_PASS) {
	console.error("Error: Email service is not configured");
}

const transporter = nodemailer.createTransport({
	host: HOST,
	port: PORT,
	secure: SECURE,
	auth: {
		user: EMAIL_USER,
		pass: EMAIL_PASS,
	},
});

exports.sendVerificationEmail = async (to, code) => {
	try {
		const subject = "Код подтверждения MAPA";

		const html = `
			<h2>Код подтверждения</h2>
			<p>Ваш код для подтверждения регистрации:</p>
			<h1>${code}</h1>
			<p>Код действителен в течение дня.</p>
		`;

		await transporter.sendMail({
			from: `"MAPA" <${EMAIL_FROM}>`,
			to,
			subject,
			html,
		});
	} catch (error) {
		throw new ApiError(500,"Error sending email", error);
	}
};

exports.sendResetPasswordEmail = async (to, code) => {
	try {
		const subject = "Код подтверждения MAPA";

		const html = `
			<h2>Код подтверждения</h2>
			<p>Ваш код для сброса пароля:</p>
			<h1>${code}</h1>
			<p>Код действителен в течение 15 минут.</p>
		`;

		await transporter.sendMail({
			from: `"MAPA" <${EMAIL_FROM}>`,
			to,
			subject,
			html,
		});
	} catch (error) {
		throw new ApiError(500,"Error sending email", error);
	}
};
