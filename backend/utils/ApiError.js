class ApiError extends Error {
    constructor(status, message, errors = []) {
        super(message);
        this.status = status;
        this.errors = errors;

        Error.captureStackTrace(this, this.constructor);
    }

    static Unauthorized() {
        return new ApiError(401, "User is not authorized");
    }

    static BadRequest(message, errors = []) {
        return new ApiError(400, message, errors);
    }

    static Forbidden(message = "Forbidden") {
        return new ApiError(403, message);
    }

    static NotFound(message = "Resource not found") {
        return new ApiError(404, message);
    }

    static Conflict(message, data = null) {
        const err = new ApiError(409, message);
        if (data) err.data = data; 
        return err;
    }

    static Internal(message, originalError = null) {
        const err = new ApiError(500, message);
        err.cause = originalError;
        return err;
    }
}

module.exports = ApiError;
