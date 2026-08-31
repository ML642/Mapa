import mongoose, { Types } from "mongoose";
import User from "../models/User";
import Event from "../models/Event";
import redis from "../config/redis";
import { aggregateFilter } from "./aggregateFilter";
import { searchEvents } from "./eventSearchService";

interface IUserDocument extends Document {
    _id: Types.ObjectId;
    username: string;
    interests: Record<string, number>;
    interests_version: number;
    will_attend: Types.ObjectId[];
    might_attend: Types.ObjectId[];
    hasId(arrayName: string, id: string | Types.ObjectId): boolean;
    removeId(arrayName: string, id: string | Types.ObjectId): void;
    save(): Promise<this>;
}

const COS_TTL = 7 * 24 * 60 * 60;

export class RecommendationService {
    static async getSearchHistoryRecommendations(userId: string, size: number = 20) {
        const user = await User.findById(userId)
            .select("search_history view_history interests will_attend might_attend")
            .lean();
        if (!user) throw new Error("USER_NOT_FOUND");

        const queries = Array.from(new Set(
            (user.search_history || [])
                .sort((left: any, right: any) => +new Date(right.searchedAt) - +new Date(left.searchedAt))
                .map((item: any) => String(item.query || "").trim())
                .filter((query: string) => query.length >= 2)
        )).slice(0, 10);

        const searchResults = await Promise.all(
            queries.map((query) => searchEvents({
                text: query,
                page: 1,
                size: 30,
                category: null,
                dateFrom: null,
                dateTo: null,
            }))
        );

        const searchScores = new Map<string, number>();
        const matchedSearches = new Map<string, string[]>();

        searchResults.forEach((result, queryIndex) => {
            const query = queries[queryIndex]!;
            const recencyWeight = queries.length - queryIndex;

            result.events.forEach((event: any, eventIndex: number) => {
                const id = event._id.toString();
                searchScores.set(id, (searchScores.get(id) || 0) + recencyWeight * (30 - eventIndex));
                const matches = matchedSearches.get(id) || [];
                if (!matches.includes(query)) matches.push(query);
                matchedSearches.set(id, matches);
            });
        });

        const viewHistory = [...(user.view_history || [])]
            .sort((left: any, right: any) => +new Date(right.viewedAt) - +new Date(left.viewedAt))
            .slice(0, 30);
        const attendanceIds = new Set([
            ...(user.will_attend || []).map((id: any) => id.toString()),
            ...(user.might_attend || []).map((id: any) => id.toString()),
        ]);
        const viewedEventIds = Array.from(new Set(viewHistory.map((item: any) => item.event?.toString()).filter(Boolean)));

        const [viewedEvents, attendedEvents, candidatesResult] = await Promise.all([
            viewedEventIds.length
                ? Event.find({ _id: { $in: viewedEventIds } }).select("_id category weights").lean()
                : Promise.resolve([]),
            attendanceIds.size
                ? Event.find({ _id: { $in: Array.from(attendanceIds) } }).select("_id category weights").lean()
                : Promise.resolve([]),
            aggregateFilter({
                size: 1000,
                status: "active",
                select: [...(Event as any).visibleFields, "weights"],
            } as any),
        ]);

        const viewedById = new Map<string, any>(viewedEvents.map((event: any) => [event._id.toString(), event] as [string, any]));
        const attendedById = new Map<string, any>(attendedEvents.map((event: any) => [event._id.toString(), event] as [string, any]));
        const viewVector = this.buildPreferenceVector(
            viewHistory.map((item: any, index: number) => ({
                event: viewedById.get(item.event?.toString()),
                weight: viewHistory.length - index,
            })),
        );
        const attendanceVector = this.buildPreferenceVector([
            ...(user.will_attend || []).map((id: any) => ({
                event: attendedById.get(id.toString()),
                weight: 2,
            })),
            ...(user.might_attend || []).map((id: any) => ({
                event: attendedById.get(id.toString()),
                weight: 1,
            })),
        ]);
        const interestsVector = Object.keys(user.interests || {}).length
            ? this.normalizeInterests(user.interests)
            : {};
        const maxSearchScore = Math.max(0, ...searchScores.values());
        const hasSearchSignal = maxSearchScore > 0;
        const hasViewSignal = Object.keys(viewVector).length > 0;
        const hasInterestSignal = Object.keys(interestsVector).length > 0;
        const hasAttendanceSignal = Object.keys(attendanceVector).length > 0;
        const totalSignalWeight =
            (hasSearchSignal ? 0.45 : 0) +
            (hasViewSignal ? 0.25 : 0) +
            (hasInterestSignal ? 0.2 : 0) +
            (hasAttendanceSignal ? 0.1 : 0);

        if (!totalSignalWeight) {
            return { events: [], basedOn: [], viewedEventIds: [], interests: [], attendedEventIds: [] };
        }

        return {
            events: candidatesResult.data
                .filter((event: any) => !attendanceIds.has(event._id.toString()))
                .map((event: any) => {
                    const id = event._id.toString();
                    const eventVector = this.getEventWeightVector(event);
                    const searchHistoryScore = maxSearchScore ? (searchScores.get(id) || 0) / maxSearchScore : 0;
                    const viewHistoryScore = this.vectorSimilarity(viewVector, eventVector);
                    const interestsScore = this.vectorSimilarity(interestsVector, eventVector);
                    const attendanceScore = this.vectorSimilarity(attendanceVector, eventVector);
                    const recommendationScore = (
                        searchHistoryScore * (hasSearchSignal ? 0.45 : 0) +
                        viewHistoryScore * (hasViewSignal ? 0.25 : 0) +
                        interestsScore * (hasInterestSignal ? 0.2 : 0) +
                        attendanceScore * (hasAttendanceSignal ? 0.1 : 0)
                    ) / totalSignalWeight;
                    const visibleEvent = (Event as any).visibleFields.reduce((result: Record<string, unknown>, field: string) => {
                        result[field] = event[field];
                        return result;
                    }, {});

                    return {
                        ...visibleEvent,
                        searchHistoryScore: +searchHistoryScore.toFixed(4),
                        viewHistoryScore: +viewHistoryScore.toFixed(4),
                        interestsScore: +interestsScore.toFixed(4),
                        attendanceScore: +attendanceScore.toFixed(4),
                        recommendationScore: +recommendationScore.toFixed(4),
                        matchedSearches: matchedSearches.get(id) || [],
                    };
                })
                .filter((event: any) => event.recommendationScore > 0)
                .sort((left: any, right: any) => right.recommendationScore - left.recommendationScore)
                .slice(0, size),
            basedOn: queries,
            viewedEventIds,
            interests: Object.keys(interestsVector),
            attendedEventIds: Array.from(attendanceIds),
        };
    }

    static getEventWeightVector(event: any): Record<string, number> {
        const rawWeights = event?.weights && typeof event.weights === "object"
            ? event.weights
            : event?.category ? { [event.category]: 1 } : {};
        const total: number = Object.values(rawWeights as Record<string, unknown>)
            .reduce<number>((sum, value) => sum + (typeof value === "number" && value > 0 ? value : 0), 0);

        if (!total) return {};

        return Object.entries(rawWeights as Record<string, unknown>).reduce((vector: Record<string, number>, [category, value]) => {
            if (typeof value === "number" && value > 0) {
                vector[category] = value / total;
            }
            return vector;
        }, {});
    }

    static buildPreferenceVector(items: Array<{ event?: any; weight: number }>): Record<string, number> {
        const vector: Record<string, number> = {};

        for (const { event, weight } of items) {
            if (!event || weight <= 0) continue;

            for (const [category, value] of Object.entries(this.getEventWeightVector(event))) {
                vector[category] = (vector[category] || 0) + value * weight;
            }
        }

        const total = Object.values(vector).reduce((sum, value) => sum + value, 0);
        if (!total) return {};

        for (const category in vector) {
            vector[category] = vector[category]! / total;
        }

        return vector;
    }

    static vectorSimilarity(left: Record<string, number>, right: Record<string, number>): number {
        const leftValues = Object.values(left);
        const rightValues = Object.values(right);
        if (!leftValues.length || !rightValues.length) return 0;

        let dot = 0;
        let leftNorm = 0;
        let rightNorm = 0;

        for (const [category, value] of Object.entries(left)) {
            dot += value * (right[category] || 0);
            leftNorm += value * value;
        }
        for (const value of rightValues) {
            rightNorm += value * value;
        }

        const denominator = Math.sqrt(leftNorm) * Math.sqrt(rightNorm);
        return denominator ? dot / denominator : 0;
    }

    /**
     */
    static async setUserInterests(userId: string, categories: string[]) {
        if (!Array.isArray(categories) || !categories.length) {
            throw new Error("CATEGORIES_REQUIRED");
        }

        const user = await User.findById(userId);
        if (!user) throw new Error("USER_NOT_FOUND");

        const weight = +(1 / categories.length).toFixed(4);
        const interests: Record<string, number> = {};

        for (const category of categories) {
            const resolved = (Event as any).resolveCategory(category);
            if (!resolved) throw new Error(`INVALID_CATEGORY: ${category}`);
            
            interests[resolved] = Math.log(weight);
        }

        user.interests = interests;
        user.interests_version = (user.interests_version || 0) + 1;
        
        return await user.save();
    }

    /**
     */
    static async getUserInterests(userId: string) {
        const user = await User.findById(userId);
        if (!user || !user.interests || Object.keys(user.interests).length === 0) {
            throw new Error("INTERESTS_NOT_SET");
        }

        return this.normalizeInterests(user.interests);
    }

    /**
     */
    static async updateAttendance(userId: string, eventId: string, state: string) {
        const validStates = ["will_attend", "might_attend", "will_not_attend"];
        if (!validStates.includes(state)) throw new Error("INVALID_STATE");

        const user = await User.findById(userId) as IUserDocument;
        const event = await Event.findById(eventId);

        if (!user) throw new Error("USER_NOT_FOUND");
        if (!event) throw new Error("EVENT_NOT_FOUND");
        if (!event.weights || Object.keys(event.weights).length === 0) {
            throw new Error("EVENT_NO_WEIGHTS");
        }

        const wasWill = user.hasId("will_attend", eventId) ;
        const wasMight = user.hasId("might_attend", eventId);

        let newWill = state === "will_attend";
        let newMight = state === "might_attend";

        if (state === "will_attend" && wasWill) throw new Error("ALREADY_WILL_ATTEND");
        if (state === "might_attend" && wasMight) throw new Error("ALREADY_MIGHT_ATTEND");
        if (state === "will_not_attend" && !wasWill && !wasMight) throw new Error("ALREADY_NOT_ATTENDING");

        const eventObjectId = new Types.ObjectId(eventId);
        if (newWill) {
            if (!wasWill) user.will_attend.push(eventObjectId);
            user.removeId("might_attend", eventId);
        } else user.removeId("will_attend", eventId);

        if (newMight) {
            if (!wasMight) user.might_attend.push(eventObjectId);
            user.removeId("will_attend", eventId);
        } else user.removeId("might_attend", eventId);

        const oldFactor = wasWill ? 0.2 : wasMight ? 0.1 : 0;
        const newFactor = newWill ? 0.2 : newMight ? 0.1 : 0;
        const factor = newFactor - oldFactor;

        if (factor !== 0) {
            this.updateInterestsFromEvent(user, event.weights, factor);
        }

        return await user.save();
    }

    static normalizeInterests(interests: Record<string, number>): Record<string, number> {
        let max = -Infinity;
        for (const c in interests) if (interests[c]! > max) max = interests[c]!;

        let sumExp = 0;
        const expVals: Record<string, number> = {};

        for (const c in interests) {
            const v = Math.exp(interests[c]! - max);
            expVals[c] = v;
            sumExp += v;
        }

        const result: Record<string, number> = {};
        for (const c in expVals) {
            result[c] = +(expVals[c]! / sumExp).toFixed(4);
        }

        return result;
    }

    /**
     */
    static normalizeEventWeights(event: any): Record<string, number> {
        let sum = 0;
        const weights = event.weights || {};
        
        for (const c in weights) sum += weights[c];
        
        if (sum !== 0) {
            for (const c in weights) {
                weights[c] = +(weights[c] / sum).toFixed(4);
            }
        }
        
        event.weights_version = (event.weights_version || 0) + 1;
        return weights;
    }

    /**
     */
    static updateInterestsFromEvent(user: any, weights: Record<string, number>, factor: number = 0.1) {
        const initialWeight = Math.log(0.04);
        const interests = { ...user.interests };
        const used = new Set();

        for (const category in weights) {
            used.add(category);
            const weight = weights[category]!;
            const prev = interests[category] ?? initialWeight;
            interests[category] = prev + factor * weight;
        }

        const all = Object.keys(interests);
        for (const category of all) {
            if (!used.has(category)) {
                interests[category] -= factor / (all.length || 1);
            }
            if (interests[category] <= initialWeight) {
                delete interests[category];
            }
        }

        user.interests = interests;
        user.interests_version = (user.interests_version || 0) + 1;
    }

    /**
     */
    static async cosineSimilarity(user: any, event: any): Promise<number> {
        const uVer = user.interests_version || 0;
        const eVer = event.weights_version || 0;

        const key = `cos:${user._id}:${event._id}:${uVer}:${eVer}`;

        const cached = await redis.get(key);
        if (cached) return +cached;

        const userNormKey = `user:${user._id}:norm:${uVer}`;
        const eventNormKey = `event:${event._id}:norm:${eVer}`;

        let userNormValue = await redis.get(userNormKey);
        let normalizedUserInterests: Record<string, number>;
        
        if (userNormValue) {
            userNormValue = +userNormValue;
            normalizedUserInterests = this.normalizeInterests(user.interests);
        } else {
            let sumSq = 0;
            normalizedUserInterests = this.normalizeInterests(user.interests);
            for (const c in normalizedUserInterests) {
                const v = normalizedUserInterests[c]!;
                sumSq += v * v;
            }
            userNormValue = sumSq;
            await redis.setex(userNormKey, COS_TTL, userNormValue.toString());
        }

        let eventNormValue = await redis.get(eventNormKey);
        if (eventNormValue) {
            eventNormValue = +eventNormValue;
        } else {
            let sumSq = 0;
            for (const c in event.weights) {
                const v = event.weights[c];
                sumSq += v * v;
            }
            eventNormValue = sumSq;
            await redis.setex(eventNormKey, COS_TTL, eventNormValue.toString());
        }

        let dot = 0;
        for (const c in normalizedUserInterests) {
            const u = normalizedUserInterests[c]!;
            const e = event.weights[c] ?? 0;
            dot += u * e;
        }

        const denom = Math.sqrt(userNormValue as number) * Math.sqrt(eventNormValue as number);
        const result = denom === 0 ? 0 : +(dot / denom).toFixed(7);

        await redis.setex(key, COS_TTL, result.toString());
        return result;
    }

    /**
     */
    
    static async getRecommendations(userId: string, size: number = 20) {
        const user = await User.findById(userId);
        if (!user || !user.interests) throw new Error("INTERESTS_NOT_SET");

        const { data: events } = await aggregateFilter({ size: 1000, status: "active" } as any);

        const scoredEvents = await Promise.all(events.map(async (event: any) => {
            let score = await this.cosineSimilarity(user, event);
            if (event.is_premium) score *= 1.1;
            return { event, similarity: score };
        }));

        return scoredEvents
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, size)
            .map(({ event, similarity }) => {
                const filtered: any = {};
                (Event as any).visibleFields.forEach((key: string) => {
                    filtered[key] = event[key];
                });
                filtered.similarity = similarity;
                return filtered;
            });
    }

    /**
     */
    static async updateEventWeights(eventId: string, weights: Record<string, number>) {
        const event = await Event.findById(eventId);
        if (!event) throw new Error("EVENT_NOT_FOUND");

        if (!weights || typeof weights !== "object" || Object.keys(weights).length === 0) {
            throw new Error("INVALID_WEIGHTS_OBJECT");
        }

        for (const category in weights) {
            const weight = weights[category];
            if (!(Event as any).resolveCategory(category)) {
                throw new Error(`INVALID_CATEGORY: ${category}`);
            }
            if (typeof weight !== "number" || weight < 0 || weight > 1) {
                throw new Error(`INVALID_WEIGHT_VALUE: ${category}`);
            }
        }

        event.weights = { ...weights };
        this.normalizeEventWeights(event);
        return await event.save();
    }
}
