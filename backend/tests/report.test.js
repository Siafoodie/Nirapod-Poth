import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Report from "../src/models/Report.js";
import app from "../src/app.js";

describe("Report voting API", () => {
  let server;
  let baseUrl;

  beforeEach(() => {
    server = app.listen(0);
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  test("stores one current vote per voter and returns the tally", async () => {
    const report = {
      _id: "507f1f77bcf86cd799439011",
      votes: [{ voterId: "voter-1", value: "downvote" }],
    };
    const update = vi
      .spyOn(Report, "findByIdAndUpdate")
      .mockResolvedValue(report);

    const response = await fetch(
      `${baseUrl}/api/reports/${report._id}/vote`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterId: " voter-1 ", vote: "downvote" }),
      },
    );
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.data).toMatchObject({
      upvotes: 0,
      downvotes: 1,
      score: -1,
      userVote: "downvote",
    });
    expect(result.data).not.toHaveProperty("votes");
    expect(update).toHaveBeenCalledWith(
      report._id,
      expect.arrayContaining([
        expect.objectContaining({
          $set: expect.objectContaining({
            votes: expect.objectContaining({
              $concatArrays: expect.any(Array),
            }),
          }),
        }),
      ]),
      expect.objectContaining({ new: true }),
    );
  });

  test("rejects invalid vote values without writing", async () => {
    const update = vi.spyOn(Report, "findByIdAndUpdate");

    const response = await fetch(
      `${baseUrl}/api/reports/507f1f77bcf86cd799439011/vote`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterId: "voter-1", vote: "neutral" }),
      },
    );

    expect(response.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });
});

describe("Report model voting and geolocation", () => {
  test("accepts valid vote records and GeoJSON coordinates", async () => {
    const report = new Report({
      incidentType: "harassment",
      location: "Mirpur, Dhaka",
      description: "Incident reported nearby",
      geo: { type: "Point", coordinates: [90.36, 23.81] },
      votes: [{ voterId: "voter-1", value: "upvote" }],
    });

    await expect(report.validate()).resolves.toBeUndefined();
  });

  test("rejects vote values outside upvote and downvote", async () => {
    const report = new Report({
      incidentType: "harassment",
      location: "Mirpur, Dhaka",
      description: "Incident reported nearby",
      votes: [{ voterId: "voter-1", value: "neutral" }],
    });

    await expect(report.validate()).rejects.toMatchObject({
      errors: { "votes.0.value": expect.any(Object) },
    });
  });
});
