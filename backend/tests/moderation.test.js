import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import app from "../src/app.js";
import Report from "../src/models/Report.js";
import User from "../src/models/User.js";
import {
  MODERATION_STATUS,
  VALID_STATUS_TRANSITIONS,
  isValidStatus,
  isValidTransition,
} from "../src/utils/moderationConstants.js";

const JWT_SECRET = process.env.JWT_SECRET || "test-secret-key-123";
process.env.JWT_SECRET = JWT_SECRET;

// Helper to generate auth tokens for testing
const generateTestToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "1h" });
};

describe("Moderation Statuses & Transition Rules", () => {
  test("defines all required moderation statuses", () => {
    expect(MODERATION_STATUS.PENDING).toBe("pending");
    expect(MODERATION_STATUS.UNDER_REVIEW).toBe("under_review");
    expect(MODERATION_STATUS.APPROVED).toBe("approved");
    expect(MODERATION_STATUS.REJECTED).toBe("rejected");
    expect(MODERATION_STATUS.NEEDS_REVISION).toBe("needs_revision");
  });

  test("validates moderation status strings correctly", () => {
    expect(isValidStatus("pending")).toBe(true);
    expect(isValidStatus("PENDING")).toBe(true);
    expect(isValidStatus("under_review")).toBe(true);
    expect(isValidStatus("approved")).toBe(true);
    expect(isValidStatus("rejected")).toBe(true);
    expect(isValidStatus("needs_revision")).toBe(true);
    expect(isValidStatus("reviewed")).toBe(true); // backward compatibility

    expect(isValidStatus("invalid_status")).toBe(false);
    expect(isValidStatus("")).toBe(false);
    expect(isValidStatus(null)).toBe(false);
    expect(isValidStatus(undefined)).toBe(false);
    expect(isValidStatus(123)).toBe(false);
  });

  test("validates allowed and disallowed status transitions", () => {
    // Valid transitions from pending
    expect(isValidTransition("pending", "under_review")).toBe(true);
    expect(isValidTransition("pending", "approved")).toBe(true);
    expect(isValidTransition("pending", "rejected")).toBe(true);
    expect(isValidTransition("pending", "needs_revision")).toBe(true);

    // Valid transitions from under_review
    expect(isValidTransition("under_review", "approved")).toBe(true);
    expect(isValidTransition("under_review", "rejected")).toBe(true);
    expect(isValidTransition("under_review", "needs_revision")).toBe(true);

    // Disallow transition to self
    expect(isValidTransition("pending", "pending")).toBe(false);
    expect(isValidTransition("approved", "approved")).toBe(false);

    // Disallowed transition
    expect(isValidTransition("approved", "pending")).toBe(false);
  });
});

describe("Report Model Moderation Schema", () => {
  test("assigns default status 'pending' to newly instantiated reports", () => {
    const report = new Report({
      incidentType: "Harassment",
      location: "Dhanmondi, Dhaka",
      description: "Street harassment incident",
    });

    expect(report.status).toBe("pending");
    expect(report.moderationComment).toBe("");
    expect(report.reviewedBy).toBeNull();
    expect(report.reviewedAt).toBeNull();
  });

  test("accepts valid moderation status values in schema", async () => {
    const report = new Report({
      incidentType: "Theft",
      location: "Gulshan, Dhaka",
      description: "Bag snatching incident",
      status: "under_review",
    });

    await expect(report.validate()).resolves.toBeUndefined();
  });

  test("rejects invalid status in schema validation", async () => {
    const report = new Report({
      incidentType: "Theft",
      location: "Gulshan, Dhaka",
      description: "Bag snatching incident",
      status: "unauthorized_status",
    });

    await expect(report.validate()).rejects.toThrow();
  });
});

describe("Admin Permissions & Authorization Enforcement", () => {
  const regularUserId = new mongoose.Types.ObjectId().toString();
  const adminUserId = new mongoose.Types.ObjectId().toString();
  const sampleReportId = new mongoose.Types.ObjectId().toString();

  const regularUser = {
    _id: regularUserId,
    name: "Regular User",
    email: "user@example.com",
    role: "user",
  };

  const adminUser = {
    _id: adminUserId,
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("rejects unauthenticated requests to moderation endpoints with 401", async () => {
    const queueRes = await request(app).get("/api/reports/moderation/queue");
    expect(queueRes.status).toBe(401);

    const updateRes = await request(app)
      .patch(`/api/reports/${sampleReportId}/status`)
      .send({ status: "approved" });
    expect(updateRes.status).toBe(401);

    const approveRes = await request(app)
      .patch(`/api/reports/${sampleReportId}/approve`);
    expect(approveRes.status).toBe(401);

    const rejectRes = await request(app)
      .patch(`/api/reports/${sampleReportId}/reject`);
    expect(rejectRes.status).toBe(401);
  });

  test("rejects regular non-admin users from moderation endpoints with 403", async () => {
    const token = generateTestToken(regularUserId);
    vi.spyOn(User, "findById").mockReturnValue({
      select: vi.fn().mockResolvedValue(regularUser),
    });

    const queueRes = await request(app)
      .get("/api/reports/moderation/queue")
      .set("Authorization", `Bearer ${token}`);
    expect(queueRes.status).toBe(403);
    expect(queueRes.body.message).toMatch(/Admin privileges required/i);

    const updateRes = await request(app)
      .patch(`/api/reports/${sampleReportId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "approved" });
    expect(updateRes.status).toBe(403);

    const approveRes = await request(app)
      .patch(`/api/reports/${sampleReportId}/approve`)
      .set("Authorization", `Bearer ${token}`);
    expect(approveRes.status).toBe(403);

    const rejectRes = await request(app)
      .patch(`/api/reports/${sampleReportId}/reject`)
      .set("Authorization", `Bearer ${token}`);
    expect(rejectRes.status).toBe(403);
  });
});

describe("Review Workflow & Moderation Endpoints", () => {
  const adminUserId = new mongoose.Types.ObjectId().toString();
  const sampleReportId = new mongoose.Types.ObjectId().toString();

  const adminUser = {
    _id: adminUserId,
    name: "Admin Officer",
    email: "officer@nirapod.gov",
    role: "admin",
  };

  const adminToken = generateTestToken(adminUserId);

  beforeEach(() => {
    vi.spyOn(User, "findById").mockReturnValue({
      select: vi.fn().mockResolvedValue(adminUser),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("GET /api/reports/moderation/queue returns pending reports for admin", async () => {
    const mockReports = [
      {
        _id: sampleReportId,
        incidentType: "Harassment",
        location: "Farmgate, Dhaka",
        description: "Need immediate review",
        status: "pending",
        votes: [],
        toObject: () => ({
          _id: sampleReportId,
          incidentType: "Harassment",
          location: "Farmgate, Dhaka",
          description: "Need immediate review",
          status: "pending",
          votes: [],
        }),
      },
    ];

    vi.spyOn(Report, "find").mockReturnValue({
      sort: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(mockReports),
      }),
    });

    const res = await request(app)
      .get("/api/reports/moderation/queue")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe("pending");
  });

  test("GET /api/reports/:id retrieves specific report details", async () => {
    const mockReport = {
      _id: sampleReportId,
      incidentType: "Vandalism",
      location: "Uttara, Dhaka",
      description: "Broken streetlight reported",
      status: "under_review",
      moderationComment: "Checking location cameras",
      votes: [],
      toObject: () => ({
        _id: sampleReportId,
        incidentType: "Vandalism",
        location: "Uttara, Dhaka",
        description: "Broken streetlight reported",
        status: "under_review",
        moderationComment: "Checking location cameras",
        votes: [],
      }),
    };

    vi.spyOn(Report, "findById").mockResolvedValue(mockReport);

    const res = await request(app).get(`/api/reports/${sampleReportId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("under_review");
    expect(res.body.data.moderationComment).toBe("Checking location cameras");
  });

  test("PATCH /api/reports/:id/status executes valid transition and updates metadata", async () => {
    const mockReport = {
      _id: sampleReportId,
      incidentType: "Harassment",
      location: "Banani, Dhaka",
      description: "Verbal harassment near station",
      status: "pending",
      moderationComment: "",
      reviewedBy: null,
      reviewedAt: null,
      votes: [],
      save: vi.fn().mockResolvedValue(true),
      toObject: function () {
        return {
          _id: this._id,
          incidentType: this.incidentType,
          location: this.location,
          description: this.description,
          status: this.status,
          moderationComment: this.moderationComment,
          reviewedBy: this.reviewedBy,
          reviewedAt: this.reviewedAt,
          votes: this.votes,
        };
      },
    };

    vi.spyOn(Report, "findById").mockResolvedValue(mockReport);

    const res = await request(app)
      .patch(`/api/reports/${sampleReportId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        status: "under_review",
        comment: "Assigned to field team for verification",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockReport.status).toBe("under_review");
    expect(mockReport.moderationComment).toBe("Assigned to field team for verification");
    expect(mockReport.reviewedBy).toBe(adminUserId);
    expect(mockReport.reviewedAt).toBeInstanceOf(Date);
    expect(mockReport.save).toHaveBeenCalled();
  });

  test("PATCH /api/reports/:id/status rejects invalid transitions with 400", async () => {
    const mockReport = {
      _id: sampleReportId,
      status: "approved",
      save: vi.fn(),
    };

    vi.spyOn(Report, "findById").mockResolvedValue(mockReport);

    const res = await request(app)
      .patch(`/api/reports/${sampleReportId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "pending" }); // Disallowed: approved cannot transition to pending

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Invalid status transition/i);
    expect(mockReport.save).not.toHaveBeenCalled();
  });

  test("PATCH /api/reports/:id/status rejects transition to the same status with 400", async () => {
    const mockReport = {
      _id: sampleReportId,
      status: "pending",
      save: vi.fn(),
    };

    vi.spyOn(Report, "findById").mockResolvedValue(mockReport);

    const res = await request(app)
      .patch(`/api/reports/${sampleReportId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "pending" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already in 'pending' status/i);
    expect(mockReport.save).not.toHaveBeenCalled();
  });

  test("PATCH /api/reports/:id/status rejects unknown status values with 400", async () => {
    const res = await request(app)
      .patch(`/api/reports/${sampleReportId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "bogus_status" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Invalid moderation status/i);
  });

  test("PATCH /api/reports/:id/approve directly approves report", async () => {
    const mockReport = {
      _id: sampleReportId,
      status: "pending",
      moderationComment: "",
      save: vi.fn().mockResolvedValue(true),
      toObject: function () {
        return {
          _id: this._id,
          status: this.status,
          votes: [],
        };
      },
    };

    vi.spyOn(Report, "findById").mockResolvedValue(mockReport);

    const res = await request(app)
      .patch(`/api/reports/${sampleReportId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ comment: "Verified and approved" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockReport.status).toBe("approved");
    expect(mockReport.moderationComment).toBe("Verified and approved");
    expect(mockReport.save).toHaveBeenCalled();
  });

  test("PATCH /api/reports/:id/reject directly rejects report with reason", async () => {
    const mockReport = {
      _id: sampleReportId,
      status: "pending",
      moderationComment: "",
      save: vi.fn().mockResolvedValue(true),
      toObject: function () {
        return {
          _id: this._id,
          status: this.status,
          votes: [],
        };
      },
    };

    vi.spyOn(Report, "findById").mockResolvedValue(mockReport);

    const res = await request(app)
      .patch(`/api/reports/${sampleReportId}/reject`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Duplicate incident report" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockReport.status).toBe("rejected");
    expect(mockReport.moderationComment).toBe("Duplicate incident report");
    expect(mockReport.save).toHaveBeenCalled();
  });

  test("POST /api/reports prevents users from setting status to approved on submission", async () => {
    const createReport = vi.spyOn(Report, "create").mockResolvedValue({
      _id: sampleReportId,
      incidentType: "Harassment",
      location: "Mohakhali, Dhaka",
      description: "Incident details",
      status: "pending",
      votes: [],
      toObject: () => ({
        _id: sampleReportId,
        incidentType: "Harassment",
        location: "Mohakhali, Dhaka",
        description: "Incident details",
        status: "pending",
        votes: [],
      }),
    });

    const res = await request(app)
      .post("/api/reports")
      .send({
        incidentType: "Harassment",
        location: "Mohakhali, Dhaka",
        description: "Incident details",
        status: "approved", // Attempt to bypass moderation
      });

    expect(res.status).toBe(201);
    // Report.create should NOT have received status: 'approved'
    expect(createReport).toHaveBeenCalledWith({
      incidentType: "Harassment",
      location: "Mohakhali, Dhaka",
      description: "Incident details",
    });
    expect(res.body.data.status).toBe("pending");
  });

  test("rejects invalid ObjectId parameters with 400", async () => {
    const invalidId = "invalid-not-an-id";

    const getRes = await request(app).get(`/api/reports/${invalidId}`);
    expect(getRes.status).toBe(400);
    expect(getRes.body.message).toMatch(/Invalid report ID/i);

    const patchRes = await request(app)
      .patch(`/api/reports/${invalidId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "approved" });
    expect(patchRes.status).toBe(400);
    expect(patchRes.body.message).toMatch(/Invalid report ID/i);
  });

  test("returns 404 when report is not found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    vi.spyOn(Report, "findById").mockResolvedValue(null);

    const getRes = await request(app).get(`/api/reports/${nonExistentId}`);
    expect(getRes.status).toBe(404);
    expect(getRes.body.message).toMatch(/Report not found/i);

    const patchRes = await request(app)
      .patch(`/api/reports/${nonExistentId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "approved" });
    expect(patchRes.status).toBe(404);
    expect(patchRes.body.message).toMatch(/Report not found/i);
  });

  test("GET /api/reports supports status filtering and rejects invalid filters", async () => {
    const mockFind = vi.spyOn(Report, "find").mockReturnValue({
      sort: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      }),
    });

    const validFilterRes = await request(app).get("/api/reports?status=approved");
    expect(validFilterRes.status).toBe(200);
    expect(mockFind).toHaveBeenCalledWith({ status: "approved" });

    const invalidFilterRes = await request(app).get("/api/reports?status=unknown_status");
    expect(invalidFilterRes.status).toBe(400);
    expect(invalidFilterRes.body.message).toMatch(/Invalid status filter/i);
  });

  test("POST /api/auth/register prevents users from self-assigning admin role", async () => {
    vi.spyOn(User, "findOne").mockResolvedValue(null);
    const createUser = vi.spyOn(User, "create").mockResolvedValue({
      _id: "new-user-id",
      name: "New Person",
      email: "newperson@example.com",
      role: "user",
    });

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "New Person",
        email: "newperson@example.com",
        password: "secretpassword123",
        role: "admin", // Malicious attempt to self-promote to admin
      });

    expect(res.status).toBe(201);
    expect(createUser).toHaveBeenCalledWith({
      name: "New Person",
      email: "newperson@example.com",
      password: "secretpassword123",
    });
    expect(res.body.user.role).toBe("user");
  });
});
