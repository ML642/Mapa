const { z } = require("zod");

const jsonStringParser = (val) => {
    if (typeof val !== "string") return val;
    try {
        return JSON.parse(val);
    } catch {
        return val;
    }
};

const updateEventSchema = z.object({
    body: z.object({
        title: z.string().min(3).optional(),
        address: z.string().min(5).optional(),
        category: z.string().optional(),
        is_premium: z.boolean().optional(),
        description: z.string().max(1000).optional(),
        coordinates: z.array(z.number())
            .length(2, "Coordinates must contain exactly 2 numbers")
            .optional(),

        dateDisplayMode: z.enum(["sessions", "range", "permanent"]).optional(),
        isPermanent: z.boolean().optional(),

        schedule: z.array(
            z.object({
                date: z.string(),
                times: z.array(z.string())
            })
        ).optional(),

        dateRange: z.object({
            from: z.string(),
            to: z.string().nullable()
        }).optional(),

        event_dates: z.array(z.string().datetime()).optional(),

        price: z.number().nullable().optional(),
        price_description: z.string().optional(),

        phone: z.preprocess(
            (val) => (val !== undefined && val !== null ? String(val) : val),
            z.string()
                .regex(/^\+?[0-9\s\-()]+$/, "Invalid phone format (letters are not allowed)")
                .optional()
        ),

        source: z.string().optional(),

        status: z.enum(["active", "parsed", "inactive", "ignored", "deleted"]).optional(),

        weights: z.object({
            category: z.number().min(0).max(1).optional()
        }).optional()
    }).strict()
});

const uploadEventSchema = z.object({
    body: z.object({
        title: z.string({ required_error: "Title is required" })
            .min(3, "Title must be at least 3 characters long"),

        address: z.string({ required_error: "Address is required" })
            .min(5, "Address must be at least 5 characters long"),

        category: z.string({ required_error: "Category is required" }),

        is_premium: z.coerce.boolean({ required_error: "is_premium is required" }),

        dateDisplayMode: z.enum(["sessions", "range", "permanent"]).optional(),
        description: z.string().max(1000).optional(),

        isPermanent: z.preprocess(
            (val) => (val === undefined ? undefined : val === "true" || val === true),
            z.boolean().optional()
        ),

        coordinates: z.preprocess(
            (val) => {
                if (typeof val === "string") {
                    try {
                        val = JSON.parse(val);
                    } catch {
                        return val;
                    }
                }
                if (Array.isArray(val)) {
                    return val.map(item => item !== "" ? Number(item) : item);
                }

                return val;
            },
            z.array(z.number({ invalid_type_error: "Each coordinate must be a number" }))
                .length(2, "Coordinates must contain exactly 2 numbers (lat, lng)")
        ),

        dateRange: z.preprocess(
            jsonStringParser,
            z.object({
                from: z.string(),
                to: z.string()
            }).optional()
        ),

        event_dates: z.preprocess(
            jsonStringParser,
            z.array(z.string().datetime()).optional()
        ),

        price: z.preprocess(
            (val) => (val === "" || val === "null" || val === undefined ? null : Number(val)),
            z.number().nullable().optional()
        ),

        price_description: z.string().optional(),

        phone: z.preprocess(
            (val) => (val !== undefined && val !== null ? String(val) : val),
            z.string()
                .regex(/^\+?[0-9\s\-()]+$/, "Invalid phone format (letters are not allowed)")
                .optional()
        ),
    }),
});

module.exports = { uploadEventSchema, updateEventSchema };
