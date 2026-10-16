
import { afterEach, describe, expect, test, vi } from "vitest";
import request from "supertest";
import Report from "../src/models/Report.js";
import app from "../src/app.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("T-09.1: Report voting API", () => {
  test("stores one current vote per voter and returns the tally", async () => {
    const reportId = "507f1f77bcf86cd799439011";

    const report = {
      _id: reportId,
      incidentType: "harassment",
      location: "Mirpur, Dhaka",
      moderationStatus: "approved",
      status: "pending",
      geo: {
        type: "Point",
        coordinates: [90.36, 23.81],
      },
      votes: [
        {
          voterId: "voter-1",
          value: "downvote",
        },
      ],
      upvotes: 0,
      downvotes: 1,
    };

    // Mock report lookup
    vi.spyOn(Report, "findById").mockResolvedValue(report);

    // Mock database vote update
    const update = vi
      .spyOn(Report, "findByIdAndUpdate")
      .mockResolvedValue(report);

    const response = await request(app)
      .post(`/api/reports/${reportId}/vote`)
      .send({
        voterId: "voter-1",
        vote: "downvote",
        latitude: 23.81,
        longitude: 90.36,
      });

    console.log(
      "Voting API response:",
      response.status,
      response.body
    );
     console.log("STATUS:", response.status);
console.log("RESPONSE:", JSON.stringify(response.body, null, 2));
    expect(response.status).toBe(200);

    expect(response.body.data).toMatchObject({
      upvotes: 0,
      downvotes: 1,
      score: -1,
      userVote: "downvote",
    });

    // Individual votes must not be exposed
    expect(response.body.data).not.toHaveProperty("votes");

    // Verify vote update was attempted
    expect(update).toHaveBeenCalled();

    const updateArgs = update.mock.calls[0];
    expect(updateArgs[0]).toBe(reportId);
  });

  test("rejects invalid vote values without writing", async () => {
    const update = vi.spyOn(Report, "findByIdAndUpdate");

    const response = await request(app)
      .post("/api/reports/507f1f77bcf86cd799439011/vote")
      .send({
        voterId: "voter-1",
        vote: "neutral",
        latitude: 23.81,
        longitude: 90.36,
      });

    expect(response.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });
});

describe("US-11: Anonymous report privacy", () => {
  test("does not persist or return personal information", async () => {
    const createReport = vi.spyOn(Report, "create").mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      incidentType: "harassment",
      location: "Mirpur, Dhaka",
      description: "Incident reported nearby",
      moderationStatus: "pending",
      status: "pending",
      upvotes: 0,
      downvotes: 0,
      votes: [],
    });

    const response = await request(app)
      .post("/api/reports")
      .send({
        incidentType: "harassment",
        location: "Mirpur, Dhaka",
        description: "Incident reported nearby",
        name: "Reporter Name",
        email: "reporter@example.com",
        phone: "01700000000",
        userId: "private-user-id",
      });

    expect(response.status).toBe(201);

    expect(createReport).toHaveBeenCalledWith(
      expect.objectContaining({
        incidentType: "harassment",
        location: "Mirpur, Dhaka",
        description: "Incident reported nearby",
        moderationStatus: "pending",
      })
    );

    const savedData = createReport.mock.calls[0][0];

    // Reporter identity must not be saved
    expect(savedData).not.toHaveProperty("name");
    expect(savedData).not.toHaveProperty("email");
    expect(savedData).not.toHaveProperty("phone");
    expect(savedData).not.toHaveProperty("userId");
    expect(savedData).not.toHaveProperty("reporterId");

    // Reporter identity must not appear in API response
    expect(response.body.data).not.toHaveProperty("name");
    expect(response.body.data).not.toHaveProperty("email");
    expect(response.body.data).not.toHaveProperty("phone");
    expect(response.body.data).not.toHaveProperty("userId");
    expect(response.body.data).not.toHaveProperty("reporterId");

    // Voting details must remain private
    expect(response.body.data).not.toHaveProperty("votes");
  });

  test("accepts a report without GPS or description", async () => {
    const createReport = vi.spyOn(Report, "create").mockResolvedValue({
      _id: "507f1f77bcf86cd799439012",
      incidentType: "theft",
      location: "Uttara",
      description: "",
      moderationStatus: "pending",
      votes: [],
      upvotes: 0,
      downvotes: 0,
    });

    const response = await request(app)
      .post("/api/reports")
      .send({
        incidentType: "theft",
        location: "Uttara",
      });

    expect(response.status).toBe(201);

    const savedData = createReport.mock.calls[0][0];

    expect(savedData.incidentType).toBe("theft");
    expect(savedData.location).toBe("Uttara");

    expect(savedData).not.toHaveProperty("geo");
    expect(savedData).not.toHaveProperty("name");
    expect(savedData).not.toHaveProperty("email");
    expect(savedData).not.toHaveProperty("userId");
  });
});

describe("Report model voting and geolocation", () => {
  test("accepts valid vote records and GeoJSON coordinates", async () => {
    const report = new Report({
      incidentType: "harassment",
      location: "Mirpur, Dhaka",
      description: "Incident reported nearby",
      geo: {
        type: "Point",
        coordinates: [90.36, 23.81],
      },
      votes: [
        {
          voterId: "voter-1",
          value: "upvote",
        },
      ],
    });

    await expect(report.validate()).resolves.toBeUndefined();
  });

  test("rejects vote values outside upvote and downvote", async () => {
    const report = new Report({
      incidentType: "harassment",
      location: "Mirpur, Dhaka",
      description: "Incident reported nearby",
      votes: [
        {
          voterId: "voter-1",
          value: "neutral",
        },
      ],
    });

    await expect(report.validate()).rejects.toMatchObject({
      errors: {
        "votes.0.value": expect.any(Object),
      },
    });
  });
});
