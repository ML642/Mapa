import { describe, expect, test } from "vitest";
import { RecommendationService } from "../../../services/recomendationService";

describe("RecommendationService preference vectors", () => {
	test("normalizes event weights before scoring", () => {
		expect(RecommendationService.getEventWeightVector({
			weights: { music: 3, art: 1 },
		})).toEqual({ music: 0.75, art: 0.25 });
	});

	test("uses the event category when explicit weights are unavailable", () => {
		expect(RecommendationService.getEventWeightVector({ category: "music" })).toEqual({ music: 1 });
	});

	test("gives a higher similarity score to a matching preference", () => {
		const preference = RecommendationService.buildPreferenceVector([
			{ event: { weights: { music: 1 } }, weight: 3 },
			{ event: { weights: { art: 1 } }, weight: 1 },
		]);

		const musicScore = RecommendationService.vectorSimilarity(
			preference,
			RecommendationService.getEventWeightVector({ weights: { music: 1 } }),
		);
		const sportScore = RecommendationService.vectorSimilarity(
			preference,
			RecommendationService.getEventWeightVector({ weights: { sport: 1 } }),
		);

		expect(musicScore).toBeGreaterThan(sportScore);
	});
});
