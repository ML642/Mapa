// models/User.js
const mongoose = require("mongoose");

const USER_ROLES = ["deleted", "banned", "user", "creator", "moderator", "admin", "superadmin"];
const RESTORABLE_USER_ROLES = USER_ROLES.filter((role) => role !== "deleted");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         authType:
 *           type: string
 *           enum: [local, google]
 *           example: "local"
 *         googleId:
 *           type: string
 *           description: Google OAuth ID if authType is google
 *         role:
 *           type: string
 *           enum: [deleted, banned, user, creator, moderator, admin, superadmin]
 *           example: "user"
 *         previousRole:
 *           type: string
 *           enum: [banned, user, creator, moderator, admin, superadmin]
 *         deletedAt:
 *           type: string
 *           format: date-time
 *         deleteAfter:
 *           type: string
 *           format: date-time
 *         deletedBy:
 *           type: string
 *         deletionReason:
 *           type: string
 *         profilePicture:
 *           type: string
 *           description: URL to user's avatar
 *         bio:
 *           type: string
 *         isPublic:
 *           type: boolean
 *           description: Whether the profile is public
 *           example: false
 *         interests:
 *           type: object
 *           description: User's category interests with logarithmic weights
 *           example: { "music": -1.0986, "sports": -1.0986 }
 *         interests_version:
 *           type: integer
 *           description: Version of user's interests
 *         will_attend:
 *           type: array
 *           description: List of event IDs the user will attend
 *           items:
 *             type: string
 *         might_attend:
 *           type: array
 *           description: List of event IDs the user might attend
 *           items:
 *             type: string
 *         favorites:
 *           type: array
 *           description: List of favorite event IDs
 *           items:
 *             type: string
 *         friends:
 *           type: array
 *           description: List of friend user IDs
 *           items:
 *             type: string
 *         friend_requests:
 *           type: array
 *           description: List of pending friend request user IDs
 *           items:
 *             type: string
 *         isPayed:
 *           type: boolean
 *           description: Whether the user has a paid subscription
 *           example: false
 *         type:
 *           type: string
 *           enum: [default, premium, pro]
 *           description: Subscription type
 *           example: "premium"
 *         payedUntil:
 *           type: string
 *           format: date-time
 *           description: Date until the user subscription is valid
 *         isVerified:
 *           type: boolean
 *           description: Whether the email is verified
 *         verificationToken:
 *           type: integer
 *           description: Verification token for email
 *         verificationTokenExpires:
 *           type: string
 *           format: date-time
 *         resetPasswordToken:
 *           type: string
 *         resetPasswordExpires:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - username
 *         - email
 */

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
			minlength: 2,
			maxlength: 40,
			set: (value) => String(value ?? "").trim().replace(/\s+/g, " "),
		},
		email: { type: String, required: true, unique: true, set: (v) => v.trim().toLowerCase() },
		password: { type: String },
		authType: { type: String, enum: ["local", "google"], default: "local" },
		googleId: { type: String },

		role: {
			type: String,
			enum: USER_ROLES,
			default: "user",
		},
		previousRole: {
			type: String,
			enum: RESTORABLE_USER_ROLES,
			default: null,
		},
		deletedAt: { type: Date, default: null },
		deleteAfter: { type: Date, default: null },
		deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
		deletionReason: {
			type: String,
			default: "",
			maxlength: 240,
			set: (value) => String(value ?? "").trim(),
		},

		profilePicture: { type: String, default: "" },
		bio: {
			type: String,
			default: "",
			maxlength: 280,
			set: (value) => String(value ?? "").replace(/\r\n/g, "\n").trim(),
		},
		isPublic: { type: Boolean, default: false },

		interests: { type: Object, default: {} },
		interests_version: { type: Number, default: 1 },

		will_attend: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }], default: [] },
		might_attend: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }], default: [] },
		favorites: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }], default: [] },
		search_history: {
			type: [{
				query: { type: String, required: true, maxlength: 120 },
				searchedAt: { type: Date, default: Date.now },
			}],
			default: [],
		},
		view_history: {
			type: [{
				event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
				viewedAt: { type: Date, default: Date.now },
			}],
			default: [],
		},

		friends: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], default: [] },
		friend_requests: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], default: [] },

		isPayed: { type: Boolean, default: false },
		type: {
			type: String,
			enum: ["default", "premium", "pro"],
			default: "default",
		},
		payedUntil: { type: Date },

		isVerified: { type: Boolean, default: false },
		verificationToken: { type: Number },
		verificationTokenExpires: { type: Date },

		resetPasswordToken: { type: String },
		resetPasswordExpires: { type: Date },

		createdAt: { type: Date, default: Date.now },
	},
	{
		timestamps: true,
	}
);

userSchema.methods.hasId = function (array, id) {
	const arr = this[array];
	if (!Array.isArray(arr)) throw new Error(`${array} is not an array (type: ${typeof arr})`);
	return arr.some((entry) => {
		const entryId = entry?._id ?? entry;
		const targetId = id?._id ?? id;
		return entryId.toString() === targetId.toString();
	});
};

userSchema.methods.removeId = function (array, id) {
	const arr = this[array];
	if (!Array.isArray(arr)) throw new Error(`${array} is not an array (type: ${typeof arr})`);
	const idx = arr.findIndex((entry) => {
		const entryId = entry?._id ?? entry;
		const targetId = id?._id ?? id;
		return entryId.toString() === targetId.toString();
	});
	if (idx !== -1) arr.splice(idx, 1);
};

module.exports = mongoose.model("User", userSchema);
