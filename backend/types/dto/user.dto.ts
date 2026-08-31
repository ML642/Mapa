export interface GetUserByIdInput {
    currentUserId: string;
    targetUserId: string;
}

export interface GetUserByUsernameInput {
    currentUserId: string;
    username: string;
}

export interface UpdateCurrentUserPayload {
    username?: string;
    bio?: string;
    isPublic?: boolean;
    [key: string]: unknown;
}

export interface UpdateUserAdminInput {
    targetUserId: string;
    currentUserId: string;
    currentUserRole: string;
    body: {
        username?: string;
        email?: string;
        bio?: string;
        [key: string]: unknown;
    };
}

export interface UpdateUserRoleInput {
    targetUserId: string;
    currentUserId: string;
    currentUserRole: string;
    role: "deleted" | "banned" | "user" | "creator" | "moderator" | "admin" | "superadmin";
}

export interface UploadAvatarInput {
    userId: string;
    file: unknown;
}

export interface DeleteUserInput {
    targetUserId: string;
    currentUserId: string;
    currentUserRole: string;
}

export interface FavoriteActionInput {
    userId: string;
    eventId: string;
}

export interface GetFavoritesInput {
    targetUserId: string;
    currentUserId: string;
    currentUserRole: string;
}
