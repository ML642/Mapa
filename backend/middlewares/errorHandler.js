const ApiError = require("../utils/ApiError");
const { ERROR_STATUS_MAP, DYNAMIC_BAD_REQUESTS } = require("../constants/errorDictionary");
const { createLogger } = require("../services/createLogger");

const errorLogger = createLogger({ fileName: "error.log" });
const showErrors = process.env.DEBUG === "true" && process.env.NODE_ENV !== "production";

function parseErrorContext(err) {
    const context = {};
    if (err.name === "ZodError" && err.issues) context.zodIssues = err.issues;
    else if (err.name === "ValidationError" && err.errors) {
        context.mongooseValidation = Object.keys(err.errors).reduce((acc, key) => {
            acc[key] = err.errors[key].message;
            return acc;
        }, {});
    }
    else if (err.isAxiosError && err.response) {
        context.axios = { status: err.response.status, url: err.config?.url, data: err.response.data };
    }
    if (err.cause) context.nativeCause = err.cause instanceof Error ? err.cause.message : err.cause;
    if (err.details) context.details = err.details;
    if (err.data) context.data = err.data;
    return Object.keys(context).length > 0 ? context : null;
}

module.exports = (err, req, res, next) => {
    void next;
    const errorContext = parseErrorContext(err);

    errorLogger.error({
        reqId: req.id,                
        method: req.method,
        url: req.originalUrl,
        userId: req.userId || null,
        message: err.message,
        errorContext: errorContext,  
        stack: err.stack,
    });

    const message = err?.message;
    let status = 500;
    let body = { message: err.customContext || "Unexpected server error" };

    if (err instanceof ApiError) {
        status = err.status || 500;
        body = { message: err.message };

        if (Array.isArray(err.errors)) {
            body.errors = err.errors; 
        } else if (err.errors && typeof err.errors === "object") {
            Object.assign(body, err.errors); 
        }
    }
    else {
        const foundStatus = Object.keys(ERROR_STATUS_MAP).find(code => ERROR_STATUS_MAP[code][message]);

        if (foundStatus) {
            status = Number(foundStatus);
            body = { message: ERROR_STATUS_MAP[foundStatus][message] };
        }
        else if (DYNAMIC_BAD_REQUESTS.has(message)) {
            status = 400;
            body = { message: message.replace(/_/g, " ") };
        }
        else if (message === "USERNAME_VALIDATION_FAILED") {
            status = 400;
            body = { message: err.details || "Username validation failed" };
        } else if (message === "INVALID_CATEGORIES") {
            status = 400;
            body = { message: `Invalid parser categories: ${err.details}` };
        } else if (message === "PARSER_RUN_IN_PROGRESS" || message === "RUN_ALREADY_IN_PROGRESS") {
            status = 409;
            body = {
                message: "Parser run already in progress",
                run: err.data || err.activeRun,
            };
        }
    }

    if (showErrors) {
        body.debug = {
            reqId: req.id,
            message: err.message,
            errorContext: errorContext,
            stack: err.stack,
            timestamp: Date.now(),
        };
    }

    return res.status(status).json(body);
};
