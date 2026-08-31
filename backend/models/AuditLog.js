const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     AuditLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 6658f2c8c9c6f3b71e9a1234
 *         actor:
 *           type: string
 *           example: admin_pavel
 *         action:
 *           type: string
 *           example: update event
 *         target:
 *           type: string
 *           example: 665b8c236c747c72f991040e
 *         details:
 *           type: string
 *         status:
 *           type: string
 *           enum: [success, error, info]
 *           example: success
 *         actorId:
 *           type: string
 *           nullable: true
 *           example: 6a57aa05515aef112af59f6b
 *         ip:
 *           type: string
 *           nullable: true
 *           example: 127.0.0.1
 *         userAgent:
 *           type: string
 *           nullable: true
 *           example: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-07-22T15:10:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2026-07-22T15:10:00.000Z
 */

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    target: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["success", "error", "info"],
      default: "info",
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.actorId;
        delete ret.ip;
        delete ret.userAgent;
        delete ret.updatedAt;
        return ret;
      },
    },
  }
);

auditLogSchema.index({
  actor: "text",
  action: "text",
  target: "text",
  details: "text",
});

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
