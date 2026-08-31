import { z } from "zod";

export const getAuditLogsSchema = z.object({
  query: z.object({
    page: z.coerce
      .number()
      .int()
      .min(1, "Page must be at least 1")
      .default(1),

    size: z.coerce
      .number()
      .int()
      .min(1, "Size must be at least 1")
      .default(30),

    q: z
      .string()
      .transform((val) => (val.trim() === "" ? undefined : val))
      .optional(),

    status: z
      .preprocess(
        (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
        z.enum(["success", "error", "info"]).optional()
      ),
  }),
});

export const createAuditLogSchema = z.object({
  body: z.object({
    actor: z
      .string({ error: "Actor is required" })
      .min(1, "Actor cannot be empty")
      .trim(),

    action: z
      .string({ error: "Action is required" })
      .min(1, "Action cannot be empty")
      .trim(),

    target: z
      .string({ error: "Target is required" })
      .min(1, "Target cannot be empty")
      .trim(),

    details: z.string().optional().default(""),

    status: z.enum(["success", "error", "info"]).optional().default("info"),
  }).strict(), 
});

export type GetAuditLogsQuery = z.infer<typeof getAuditLogsSchema>["query"];
export type CreateAuditLogBody = z.infer<typeof createAuditLogSchema>["body"];
