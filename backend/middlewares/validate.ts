
import { ZodError } from "zod";
import ApiError from "../utils/ApiError";


const validate = (schema) => 
    async (req, res, next): Promise<void> => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            return next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessage = error.issues?.map((err) => err.message).join(", ") || "Validation error";
                return next(ApiError.BadRequest(errorMessage));
            }
            return next(error);
        }
    };

module.exports = validate;
