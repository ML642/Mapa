exports.status = (req, res) => {
	res.json({
		status: "ok",
		uptime: Math.floor(process.uptime()),
		commit: process.env.GIT_COMMIT_SHA ?? "not provided",
	});
};
