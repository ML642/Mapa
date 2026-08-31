const ERROR_STATUS_MAP = {
    400: {
        NOT_FOUND: "Event(s) not found",
        INVALID_ID_FORMAT: "Invalid ID format",
        MISSING_QUERY: "Missing search query",
        FORBIDDEN_FIELDS: "Updating forbidden fields",
        EMAIL_ALREADY_USED: "Email already used",
        EMAIL_BLACKLISTED: "Email is blacklisted",
        ALREADY_VERIFIED: "User is already verified",
        INVALID_CODE: "Invalid verification code",
        CODE_EXPIRED: "Verification code has expired",
        MISSING_USER_AGENT: "Invalid user agent",
        INVALID_INPUT_TYPES: "Email and password are required",
        EMPTY_CREDENTIALS: "Email and password are required",
        INVALID_CREDENTIALS: "Incorrect email or password",
        REFRESH_TOKEN_REQUIRED: "Refresh token required",
        TOKEN_NOT_FOUND: "Token not found",
        FILE_REQUIRED: "File required",
        NO_FIELDS_TO_UPDATE: "No profile fields to update",
        UPDATING_DENIED_FIELDS: "Updating denied fields is not allowed",
        ROLE_REQUIRED: "Role is required",
        INVALID_ROLE: "Invalid role",
        NO_EVENTS_FOUND: "No events found",
        INVALID_CATEGORY: "Invalid category",
        EVENT_ALREADY_APPROVED: "Event is already approved",
        NO_PARSER_REVIEW_PENDING: "No parser review pending",
        NO_IMAGES_TO_DELETE: "No images to delete",
        UNSUPPORTED_SOURCE: "Unsupported parser source",
        CANNOT_CANCEL_FINISHED_RUN: "Only queued or running runs can be cancelled",
        FAVORITE_NOT_FOUND: "Favourite not found",
        USERS_NOT_FOUND: "Users not found",
        FAVORITE_ALREADY_ADDED: "Favourite already added",
        FAVORITE_NOT_IN_LIST: "Favourite not found in your favorites",
        USER_ALREADY_DELETED: "User already marked as deleted",
    },
    403: {
        ACCOUNT_DELETED: "This account has been deleted. Register again or contact support if this was a mistake",
        FORBIDDEN_LIST: "Forbidden: only user or their friends can see this list",
        FORBIDDEN_NOT_OWN_PROFILE: "Forbidden: only user can update their own profile",
        FORBIDDEN_SET_HIGHER_ROLE: "Forbidden: you can't set higher or equal role then yours",
        FORBIDDEN_UPDATE_THIS_USER: "Forbidden: you can't update this user",
        FORBIDDEN_DELETE_USER: "Forbidden: you can't delete this user",
        FORBIDDEN_NOT_OWN_PROFILE_DELETE: "Forbidden: only user can delete their own profile",
        FORBIDDEN_FAVORITES_ACCESS: "Forbidden",
    },
    404: {
        USER_NOT_FOUND: "User not found",
        EVENT_NOT_FOUND: "Event not found",
        RUN_NOT_FOUND: "Parser run not found",
    }
};

const DYNAMIC_BAD_REQUESTS = new Set([
    "SELF_REQUEST", "ALREADY_FRIENDS", "REQUEST_ALREADY_SENT", "NO_REQUEST_FOUND", 
    "NOT_FRIENDS", "NO_OUTGOING_REQUEST", "SELF_CHECK", "CATEGORIES_REQUIRED", 
    "INTERESTS_NOT_SET", "INVALID_STATE", "ALREADY_WILL_ATTEND", "ALREADY_MIGHT_ATTEND", 
    "ALREADY_NOT_ATTENDING", "INVALID_WEIGHTS_OBJECT", "INVALID_WEIGHT_VALUE"
]);

module.exports = {
    ERROR_STATUS_MAP,
    DYNAMIC_BAD_REQUESTS,
};
