import { z } from "zod";

const emailSchema = z
    .string()
    .min(1, { message: "Email is required" })
    .trim()
    .email({ message: "Invalid email format" });

const passwordSchema = z
    .string()
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(100, { message: "Password is too long" });


export const registerSchema = z.object({
    body: z.object({
        email: emailSchema,
        password: passwordSchema,
        username: z
            .string()
            .min(1, { message: "Username is required" })
            .trim()
            .min(2, { message: "Username must be at least 2 characters long" })
            .max(30, { message: "Username cannot exceed 30 characters" }),
    }),
});
export const loginSchema = z.object({
    body: z.object({
        email: emailSchema,
        password: passwordSchema,
    }),
})

export const requestResetSchema = z.object({
    body: z.object({ email: emailSchema }),
});

export const verifyResetCodeSchema = z.object({
    body: z.object({
        email: emailSchema,
        code: z.string().min(1, { message: "Verification code is required" }).trim(),
    }),
});

export const confirmPasswordResetSchema = z.object({
    body: z.object({ password: passwordSchema }),
});

export const googleAuthSchema = z.object({
    body: z.object({
        accessToken: z
            .string({ error: "Access token is required" })
            .min(1, { message: "Access token cannot be empty" })
            .trim(),
    }).strict(), 
});

export const emailSendSchema= z.object({
    body: z.object({
        email: emailSchema,
    }),
});

export const verifyEmailSchema = z.object({
    body: z.object({
        email: emailSchema,
        code: z.number().min(10000, { message: "Verification code is required" }).max(99999, { message: "Verification code is too long" }),
    }),
});

export type GoogleAuthInput = z.infer<typeof googleAuthSchema>["body"];
export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type VerifyResetCodeInput = z.infer<typeof verifyResetCodeSchema>["body"];
