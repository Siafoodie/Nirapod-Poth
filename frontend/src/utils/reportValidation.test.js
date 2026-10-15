
import { describe, it, expect } from "vitest";
import {
  validateReport,
  buildAnonymousReport,
} from "./reportValidation";

describe("US-11 Anonymous Reporting Unit Tests", () => {
  it("1. Requires incident type", () => {
    expect(validateReport({
      incidentType: "",
      location: "Dhanmondi",
    })).toBe("Incident type is required");
  });

  it("2. Requires location", () => {
    expect(validateReport({
      incidentType: "harassment",
      location: "",
    })).toBe("Location is required");
  });

  it("3. Accepts report without description", () => {
    expect(validateReport({
      incidentType: "harassment",
      location: "Dhanmondi",
      description: "",
    })).toBeNull();
  });

  it("4. Accepts report without GPS", () => {
    const report = buildAnonymousReport({
      incidentType: "harassment",
      location: "Dhanmondi",
    });

    expect(report).not.toHaveProperty("geo");
  });

  it("5. Does not include reporter identity", () => {
    const report = buildAnonymousReport({
      incidentType: "harassment",
      location: "Dhanmondi",
      name: "Test User",
      email: "test@example.com",
      userId: "12345",
    });

    expect(report).not.toHaveProperty("name");
    expect(report).not.toHaveProperty("email");
    expect(report).not.toHaveProperty("userId");
  });

  it("6. Includes valid optional GPS", () => {
    const report = buildAnonymousReport({
      incidentType: "harassment",
      location: "Dhanmondi",
      geo: {
        type: "Point",
        coordinates: [90.3742, 23.7465],
      },
    });

    expect(report.geo.coordinates).toEqual([90.3742, 23.7465]);
  });

  it("7. Trims input fields", () => {
    const report = buildAnonymousReport({
      incidentType: " harassment ",
      location: " Dhanmondi ",
      description: " Test ",
    });

    expect(report.incidentType).toBe("harassment");
    expect(report.location).toBe("Dhanmondi");
    expect(report.description).toBe("Test");
  });
});