const AdminService = require("../services/adminService");
const getClientIp = require("../utils/getIp");

exports.getDashboard = async (req, res, next) => {
	try {
		const dashboard = await AdminService.getDashboard(req.query);
		res.status(200).json(dashboard);
	} catch (error) {
		next(error);
	}
};


exports.getOptions = async (req, res, next) => {
	try {
		const options = await AdminService.getOptions();
		res.status(200).json(options);
	} catch (error) {
		next(error);
	}
};

exports.listUsers = async (req, res, next) => {
	try {
		const result = await AdminService.listUsers(req.query);
		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
};

exports.getUserById = async (req, res, next) => {
	try {
		const result = await AdminService.getUserById(req.params.userId);
		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
};

exports.getAuditLogs = async (req, res, next) => {
	try {

		const result = await AdminService.getAuditLogs(req.query);

		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
};

exports.createAuditLog = async (req, res, next) => {
	try {
		const { actor, action, target, details, status } = req.body;

		const actorId = req.user?._id || req.user?.id || null;
		const ip = getClientIp(req);
		const userAgent = req.get("user-agent") || null;

		await AdminService.createAuditLog({
			actor,
			action,
			target,
			details,
			status,
			actorId,
			ip,
			userAgent,
		});

		res.status(201).json({ success: true });
	} catch (error) {
		next(error);
	}
};

exports.listEvents = async (req, res, next) => {
	try {
		const result = await AdminService.listEvents(req.query);
		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
};
