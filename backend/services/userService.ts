import User from "../models/User";
import Event from "../models/Event";
import { roleHierarchy } from "./roleHierarchy";
import { uploadAvatar as uploadAvatarService } from "./imageService";
import { aggregateFilter } from "./aggregateFilter";
import { revokeUserRefreshTokens } from "./tokenService";
import {
    ensureUsernameAvailable,
    buildProfileUpdatePayload,
    serializeOwnProfile,
    validateBio,
} from "./userProfileService";
import { UpdateCurrentUserPayload, GetUserByIdInput, GetUserByUsernameInput, UpdateUserAdminInput, UpdateUserRoleInput, UploadAvatarInput, DeleteUserInput, GetFavoritesInput, FavoriteActionInput } from "../types/dto/user.dto";




export class UserService {
    private readonly PROFILE_UPDATE_FIELDS = ["username", "bio", "isPublic"];
    private readonly ALLOWED_ADMIN_UPDATE_FIELDS = ["username", "email", "bio"];

    private escapeRegex(value: string): string {
        return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    private toObjectIdString(value: unknown): string {
        if (!value) return "";
        if (typeof value === "string") return value;
        return ((value as any)._id || value).toString();
    }

    private buildIdSet(values: unknown): Set<string> {
        const arr = Array.isArray(values) ? values : [];
        return new Set(arr.map(val => this.toObjectIdString(val)).filter(Boolean));
    }

    private serializeUserLookup(user: any, mutualFriends: unknown[]) {
        return {
            id: user._id.toString(),
            userId: user._id.toString(),
            username: user.username,
            profilePicture: user.profilePicture,
            mutualFriends: Array.isArray(mutualFriends) ? mutualFriends.length : Number(mutualFriends || 0),
        };
    }

    private async updateProfileFieldsHelper(user: any, input: UpdateCurrentUserPayload) {
        const updatedFields = Object.keys(input || {});
        if (!updatedFields.length) {
            throw new Error("NO_FIELDS_TO_UPDATE");
        }

        const isDeniedField = updatedFields.some(field => !this.PROFILE_UPDATE_FIELDS.includes(field));
        if (isDeniedField) {
            throw new Error("UPDATING_DENIED_FIELDS");
        }

        const payload = buildProfileUpdatePayload(input);
        if (!Object.keys(payload).length) {
            throw new Error("NO_FIELDS_TO_UPDATE");
        }

        if (
            Object.prototype.hasOwnProperty.call(payload, "username") &&
            payload.username.toLowerCase() !== user.username.toLowerCase()
        ) {
            payload.username = await ensureUsernameAvailable(payload.username, user._id);
        }

        Object.assign(user, payload);
        await user.save();
        return user;
    }


    public async getCurrentUser(userId: string) {
        const user = await User.findById(userId);
        if (!user) throw new Error("USER_NOT_FOUND");
        return serializeOwnProfile(user);
    }

    public async getUserById(input: GetUserByIdInput) {
        const { currentUserId, targetUserId } = input;

        const currentUser = await User.findById(currentUserId);
        const user = await User.findById(targetUserId);

        if (!user) throw new Error("USER_NOT_FOUND");
        if (currentUserId === targetUserId) return serializeOwnProfile(user);

        const currentUserFriendIds = this.buildIdSet(currentUser?.friends);
        const userFriendIds = this.buildIdSet(user?.friends);

        const mutualFriends = user.friends.filter((friendId: any) =>
            currentUserFriendIds.has(this.toObjectIdString(friendId))
        );

        const isModerator = roleHierarchy(currentUser?.role, "moderator");
        const isAdmin = roleHierarchy(currentUser?.role, "admin");

        if (!user.isPublic && !userFriendIds.has(currentUserId) && !isModerator) {
            return {
                username: user.username,
                profilePicture: user.profilePicture,
                mutualFriends: mutualFriends.length,
            };
        }

        return {
            id: user._id.toString(),
            username: user.username,
            bio: user.bio,
            profilePicture: user.profilePicture,
            isPublic: user.isPublic,
            isPayed: user.isPayed,
            type: user.type,
            friendCount: user.friends.length,
            mutualFriends: mutualFriends.length,
            ...(isModerator ? { role: user.role } : {}),
            ...(isAdmin ? { email: user.email } : {}),
        };
    }

    public async getUserByUsername(input: GetUserByUsernameInput) {
        const { currentUserId, username } = input;

        const currentUser = await User.findById(currentUserId);
        const currentUserFriendIds = this.buildIdSet(currentUser?.friends);

        const users = await User.find({
            username: { $regex: `^${this.escapeRegex(username)}`, $options: "i" },
            _id: { $ne: currentUserId },
        });

        if (users.length === 0) throw new Error("USERS_NOT_FOUND");

        return users.map(user => {
            const mutualFriends = user.friends.filter((friendId: any) =>
                currentUserFriendIds.has(this.toObjectIdString(friendId))
            );
            return this.serializeUserLookup(user, mutualFriends);
        });
    }

    public async updateCurrentUser(userId: string, body: UpdateCurrentUserPayload) {
        const user = await User.findById(userId);
        if (!user) throw new Error("USER_NOT_FOUND");

        await this.updateProfileFieldsHelper(user, body);
        return serializeOwnProfile(user);
    }

    public async getSearchHistory(userId: string) {
        const user = await User.findById(userId).select("search_history").lean();
        if (!user) throw new Error("USER_NOT_FOUND");

        return { searches: (user.search_history || []).sort((a: any, b: any) => +new Date(b.searchedAt) - +new Date(a.searchedAt)) };
    }

    public async addSearchHistoryItem(userId: string, rawQuery: unknown) {
        const query = String(rawQuery ?? "").trim().replace(/\s+/g, " ");
        if (query.length < 2 || query.length > 120) throw new Error("INVALID_SEARCH_QUERY");

        await User.updateOne(
            { _id: userId },
            { $pull: { search_history: { query: { $regex: `^${this.escapeRegex(query)}$`, $options: "i" } } } }
        );
        const result = await User.findByIdAndUpdate(
            userId,
            { $push: { search_history: { $each: [{ query, searchedAt: new Date() }], $position: 0, $slice: 20 } } },
            { new: true, select: "search_history" }
        ).lean();
        if (!result) throw new Error("USER_NOT_FOUND");
        return { searches: result.search_history || [] };
    }

    public async clearSearchHistory(userId: string) {
        const result = await User.updateOne({ _id: userId }, { $set: { search_history: [] } });
        if (!result.matchedCount) throw new Error("USER_NOT_FOUND");
    }

    public async getViewHistory(userId: string) {
        const user = await User.findById(userId)
            .select("view_history")
            .populate({ path: "view_history.event", match: { status: "active" } })
            .lean();
        if (!user) throw new Error("USER_NOT_FOUND");

        const views = (user.view_history || [])
            .filter((item: any) => item.event)
            .sort((a: any, b: any) => +new Date(b.viewedAt) - +new Date(a.viewedAt));
        return { views };
    }

    public async addViewHistoryItem(userId: string, eventId: string) {
        const event = await Event.findOne({ _id: eventId, status: "active" }).select("_id").lean();
        if (!event) throw new Error("EVENT_NOT_FOUND");

        await User.updateOne({ _id: userId }, { $pull: { view_history: { event: eventId } } });
        const result = await User.updateOne(
            { _id: userId },
            { $push: { view_history: { $each: [{ event: eventId, viewedAt: new Date() }], $position: 0, $slice: 100 } } }
        );
        if (!result.matchedCount) throw new Error("USER_NOT_FOUND");
    }

    public async clearViewHistory(userId: string) {
        const result = await User.updateOne({ _id: userId }, { $set: { view_history: [] } });
        if (!result.matchedCount) throw new Error("USER_NOT_FOUND");
    }

    public async updateUser(input: UpdateUserAdminInput) {
        const { targetUserId, currentUserId, currentUserRole, body } = input;

        const user = await User.findById(targetUserId);
        if (!user) throw new Error("USER_NOT_FOUND");

        if (targetUserId !== currentUserId && !roleHierarchy(currentUserRole, "superadmin")) {
            throw new Error("FORBIDDEN_NOT_OWN_PROFILE");
        }

        const updatedFields = Object.keys(body || {});
        const isDeniedField = updatedFields.some(field => !this.ALLOWED_ADMIN_UPDATE_FIELDS.includes(field));
        if (isDeniedField) throw new Error("UPDATING_DENIED_FIELDS");

        if (Object.prototype.hasOwnProperty.call(body, "username") && body.username) {
            user.username = await ensureUsernameAvailable(body.username, user._id.toString() as any);
        }

        if (Object.prototype.hasOwnProperty.call(body, "email") && body.email) {
            user.email = body.email;
        }

        if (Object.prototype.hasOwnProperty.call(body, "bio") && body.bio !== undefined) {
            user.bio = validateBio(body.bio);
        }

        await user.save();
        return {
            username: user.username,
            email: user.email,
            bio: user.bio,
        };
    }

    public async updateUserRole(input: UpdateUserRoleInput) {
        const { targetUserId, currentUserId, currentUserRole, role } = input;

        if (!role) throw new Error("ROLE_REQUIRED");
        if (role === "deleted") throw new Error("USE_DELETION_WORKFLOW");

        const validRoles = (User.schema.path("role") as any).enumValues || [];
        if (!validRoles.includes(role)) throw new Error("INVALID_ROLE");

        const user = await User.findById(targetUserId);
        if (!user) throw new Error("USER_NOT_FOUND");
        // Deleted users persist under the soft-delete lifecycle; mutating their
        // role directly would leave deletedAt/deleteAfter set on an active account
        // (and the cron would still finalize them). Require restore first.
        if (user.role === "deleted") throw new Error("RESTORE_BEFORE_ROLE_UPDATE");

        const isSuperAdminBypass = roleHierarchy(currentUserRole, "superadmin", { strict: true });

        if (!isSuperAdminBypass) {
            if (!roleHierarchy(currentUserRole, role, { higherOnly: true })) {
                throw new Error("FORBIDDEN_SET_HIGHER_ROLE");
            }
            if (!roleHierarchy(currentUserRole, user.role, { higherOnly: true })) {
                throw new Error("FORBIDDEN_UPDATE_THIS_USER");
            }
        }

        user.role = role;
        await user.save();
    }

    public async uploadAvatar(input: UploadAvatarInput) {
        const { userId, file } = input;
        if (!file) throw new Error("FILE_REQUIRED");

        const profilePicture = await uploadAvatarService(userId, file);
        const user = await User.findById(userId);

        return {
            profilePicture,
            user: user ? serializeOwnProfile(user) : null,
        };
    }

    public async deleteUser(input: DeleteUserInput) {
        const { targetUserId, currentUserId, currentUserRole } = input;

        const user = await User.findById(targetUserId);
        if (!user) throw new Error("USER_NOT_FOUND");
        if (user.role === "deleted") throw new Error("USER_ALREADY_DELETED");

        if (targetUserId !== currentUserId) {
            if (roleHierarchy(currentUserRole, "admin")) {
                const isHigher = roleHierarchy(currentUserRole, user.role, { higherOnly: true });
                const isSuperAdmin = roleHierarchy(currentUserRole, "superadmin", { strict: true });

                if (!isHigher && !isSuperAdmin) {
                    throw new Error("FORBIDDEN_DELETE_USER");
                }
            } else {
                throw new Error("FORBIDDEN_NOT_OWN_PROFILE_DELETE");
            }
        }

        await revokeUserRefreshTokens(targetUserId);
        await User.deleteOne({ _id: targetUserId });

        if (process.env.DEBUG === "true") {
            console.log(`Deleting user: user.id: ${targetUserId}, currentUser.id: ${currentUserId}`);
        }
    }

    public async getFavorites(input: GetFavoritesInput) {
        const { targetUserId, currentUserId, currentUserRole } = input;

        const user = await User.findById(targetUserId).select("friends role").lean();
        if (!user) throw new Error("USER_NOT_FOUND");

        const isFriend = user.friends?.some((f: any) => f.toString() === currentUserId);
        const isAdmin = roleHierarchy(currentUserRole, "admin");

        if (targetUserId !== currentUserId && !isFriend && !isAdmin) {
            throw new Error("FORBIDDEN_FAVORITES_ACCESS");
        }

        const result = await aggregateFilter({
            model: User,
            id: targetUserId,
            select: "favorites",
            populate: [
                {
                    from: "events",
                    localField: "favorites",
                    as: "favorites",
                    select: ["_id", "title", "description", "event_date", "date_display", "date_summary", "dateDisplayMode", "isPermanent", "address", "event_image", "status"],
                },
            ],
        } as any);

        const updatedUser = result.data;
        const favoritesArr = Array.isArray(updatedUser?.favorites) ? updatedUser.favorites : [];

        return {
            favorites: favoritesArr.filter((f: any) => f.status === "active"),
        };
    }

    public async isFavorite(input: FavoriteActionInput) {
        const { userId, eventId } = input;
        const user = await User.findById(userId);
        if (!user) throw new Error("USER_NOT_FOUND");

        const isFav = user.favorites.some((fav: any) => fav.toString() === eventId);
        return { isFavorite: isFav };
    }

    public async addFavorite(input: FavoriteActionInput) {
        const { userId, eventId } = input;
        const user = await User.findById(userId);
        if (!user) throw new Error("USER_NOT_FOUND");

        const favoriteEvent = await Event.findById(eventId);
        if (!favoriteEvent) throw new Error("FAVORITE_NOT_FOUND");

        if (user.favorites.some((fav: any) => fav.toString() === eventId)) {
            throw new Error("FAVORITE_ALREADY_ADDED");
        }

        user.favorites.push(eventId as any);
        await user.save();
    }

    public async removeFavorite(input: FavoriteActionInput) {
        const { userId, eventId } = input;
        const user = await User.findById(userId);
        if (!user) throw new Error("USER_NOT_FOUND");

        const favoriteEvent = await Event.findById(eventId);
        if (!favoriteEvent) throw new Error("FAVORITE_NOT_FOUND");

        const hasFavorite = user.favorites.some((fav: any) => fav.toString() === eventId);
        if (!hasFavorite) {
            throw new Error("FAVORITE_NOT_IN_LIST");
        }

        (user as any).removeId("favorites", eventId);

        await user.save();
    }

}
