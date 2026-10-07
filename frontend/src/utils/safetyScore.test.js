import { describe, it, expect } from "vitest";
import {
  calculateSafetyScore,
  getSafetyLevel,
} from "./safetyScore";

describe("Safety Score Calculation", () => {
  it("calculates safety score correctly using all factors", () => {
    const route = {
      crimeSafety: 90,
      lighting: 85,
      communityReports: 80,
      timeOfDay: 90,
    };

    expect(calculateSafetyScore(route)).toBe(87);
  });

  it("returns HIGH for score 80 or above", () => {
    expect(getSafetyLevel(87)).toBe("HIGH");
    expect(getSafetyLevel(80)).toBe("HIGH");
  });

  it("returns MEDIUM for score between 50 and 79", () => {
    expect(getSafetyLevel(67)).toBe("MEDIUM");
    expect(getSafetyLevel(50)).toBe("MEDIUM");
  });

  it("returns LOW for score below 50", () => {
    expect(getSafetyLevel(44)).toBe("LOW");
    expect(getSafetyLevel(0)).toBe("LOW");
  });

  it("calculates score when one factor is unavailable", () => {
    const route = {
      crimeSafety: 65,
      lighting: 70,
      communityReports: null,
      timeOfDay: 75,
    };

    const score = calculateSafetyScore(route);

    expect(score).not.toBeNull();
    expect(typeof score).toBe("number");
  });

  it("returns null when all safety data is unavailable", () => {
    const route = {
      crimeSafety: null,
      lighting: null,
      communityReports: null,
      timeOfDay: null,
    };

    expect(calculateSafetyScore(route)).toBeNull();
  });

  it("returns UNKNOWN when safety score is unavailable", () => {
    expect(getSafetyLevel(null)).toBe("UNKNOWN");
  });
});