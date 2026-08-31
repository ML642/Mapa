const { UserService } = require("../services/userService");
const ApiError = require("../utils/ApiError");
const User = require("../models/User");
const { roleHierarchy } = require("../services/roleHierarchy");
const {
	finalizeDeletedUser,
	markUserDeleted,
	resolveProtectedUserRole,
	restoreDeletedUser,
} = require("../services/userDeletionService");
const DEBUG = process.env.DEBUG === "true";

const userService = new UserService();

exports.getCurrentUser = async (req, res, next) => {
    try {
        const result = await userService.getCurrentUser(req.userId);
        res.status(200).json(result);
    } catch (error) {
        next(error)
    }
};

exports.getUserById = async (req, res, next) => {
    try {
        const result = await userService.getUserById({
            currentUserId: req.userId,
            targetUserId: req.params.userId,
        });
        res.status(200).json(result);
    } catch (error) {
        next(error)
    }
};

exports.getUserByUsername = async (req, res, next) => {
    try {
        const result = await userService.getUserByUsername({
            currentUserId: req.userId,
            username: req.params.username,
        });
        res.status(200).json(result);
    } catch (error) {
        next(error)
    }
};

exports.updateCurrentUser = async (req, res, next) => {
    try {
        const result = await userService.updateCurrentUser(req.userId, req.body);
        res.status(200).json(result);
    } catch (error) {
        next(error)
    }
};

exports.getSearchHistory = async (req, res, next) => {
    try {
        res.status(200).json(await userService.getSearchHistory(req.userId));
    } catch (error) {
        next(error);
    }
};

exports.addSearchHistoryItem = async (req, res, next) => {
    try {
        res.status(200).json(await userService.addSearchHistoryItem(req.userId, req.body?.query));
    } catch (error) {
        next(error);
    }
};

exports.clearSearchHistory = async (req, res, next) => {
    try {
        await userService.clearSearchHistory(req.userId);
        res.status(204).end();
    } catch (error) {
        next(error);
    }
};

exports.getViewHistory = async (req, res, next) => {
    try {
        res.status(200).json(await userService.getViewHistory(req.userId));
    } catch (error) {
        next(error);
    }
};

exports.addViewHistoryItem = async (req, res, next) => {
    try {
        await userService.addViewHistoryItem(req.userId, req.params.eventId);
        res.status(204).end();
    } catch (error) {
        next(error);
    }
};

exports.clearViewHistory = async (req, res, next) => {
    try {
        await userService.clearViewHistory(req.userId);
        res.status(204).end();
    } catch (error) {
        next(error);
    }
};

exports.updateUser = async (req, res, next) => {
    try {
        const result = await userService.updateUser({
            targetUserId: req.params.userId,
            currentUserId: req.userId,
            currentUserRole: req.userRole,
            body: req.body,
        });
        res.status(200).json(result);
    } catch (error) {
        next(error)
    }
};

exports.updateUserRole = async (req, res, next) => {
    try {
        await userService.updateUserRole({
            targetUserId: req.params.userId,
            currentUserId: req.userId,
            currentUserRole: req.userRole,
            role: req.body.role,
        });
        res.status(200).json({ message: "User role updated successfully" });
    } catch (error) {
        next(error)
    }
};

exports.uploadAvatar = async (req, res, next) => {
    try {
        const result = await userService.uploadAvatar({
            userId: req.userId,
            file: req.file,
        });
        res.status(200).json(result);
    } catch (error) {
        next(error)
    }
};

exports.deleteUser = async (req, res, next) => {
	try {
		const userId = req.params.userId;
		const currentUserId = req.userId;
		const currentUserRole = req.userRole;
		const user = await User.findById(userId);

		if (!user) return res.status(400).json({ message: "User not found" });
		if (user.role === "deleted") return res.status(400).json({ message: "User already marked as deleted" });

		if (userId !== currentUserId) {
			if (roleHierarchy(currentUserRole, "admin")) {
				if (
					!roleHierarchy(currentUserRole, resolveProtectedUserRole(user), { higherOnly: true }) &&
					!roleHierarchy(currentUserRole, "superadmin", { strict: true })
				)
					return res.status(403).json({ message: "Forbidden: you can't delete this user" });
			} else return res.status(403).json({ message: "Forbidden: only user can delete their own profile" });
		}

		await markUserDeleted(user, {
			actorUserId: currentUserId,
			reason: req.body?.reason,
		});

		if (DEBUG) console.log(`Deleting user: user.id: ${userId}, currentUser.id: ${currentUserId}`);

		res.status(200).json({
			message: "User scheduled for deletion successfully",
			deleteAfter: user.deleteAfter,
		});
	} catch (error) {
		next(ApiError.Internal("Error deleting user", error));
	}
};

exports.restoreUser = async (req, res, next) => {
	try {
		const user = await User.findById(req.params.userId);
		if (!user) return res.status(400).json({ message: "User not found" });
		if (user.role !== "deleted") return res.status(400).json({ message: "User is not marked as deleted" });

		if (
			!roleHierarchy(req.userRole, resolveProtectedUserRole(user), { higherOnly: true }) &&
			!roleHierarchy(req.userRole, "superadmin", { strict: true })
		)
			return res.status(403).json({ message: "Forbidden: you can't restore this user" });

		await restoreDeletedUser(user);
		res.status(200).json({ message: "User restored successfully" });
	} catch (error) {
		next(ApiError.Internal("Error restoring user", error));
	}
};

exports.purgeUser = async (req, res, next) => {
	try {
		const user = await User.findById(req.params.userId);
		if (!user) return res.status(400).json({ message: "User not found" });
		if (user.role !== "deleted") return res.status(400).json({ message: "User is not marked as deleted" });

		if (
			!roleHierarchy(req.userRole, resolveProtectedUserRole(user), { higherOnly: true }) &&
			!roleHierarchy(req.userRole, "superadmin", { strict: true })
		)
			return res.status(403).json({ message: "Forbidden: you can't permanently delete this user" });

		await finalizeDeletedUser(user);
		res.status(200).json({ message: "User permanently deleted successfully" });
	} catch (error) {
		next(ApiError.Internal("Error permanently deleting user", error));
	}
};

exports.getFavorites = async (req, res, next) => {
    try {
        const result = await userService.getFavorites({
            targetUserId: req.params.userId,
            currentUserId: req.userId,
            currentUserRole: req.userRole,
        });
        res.status(200).json(result);
    } catch (error) {
        next(error)
    }
};

exports.isFavorite = async (req, res, next) => {
    try {
        const result = await userService.isFavorite({
            userId: req.userId,
            eventId: req.params.eventId,
        });
        res.status(200).json(result);
    } catch (error) {
        next(error)
    }
};

exports.addFavorite = async (req, res, next) => {
    try {
        await userService.addFavorite({
            userId: req.userId,
            eventId: req.params.eventId,
        });
        res.status(200).json({ message: "Favourite added successfully" });
    } catch (error) {
        next(error)
    }
};

exports.removeFavorite = async (req, res, next) => {
    try {
        await userService.removeFavorite({
            userId: req.userId,
            eventId: req.params.eventId,
        });
        res.status(200).json({ message: "Favourite removed successfully" });
    } catch (error) {
        next(error)
    }
};
