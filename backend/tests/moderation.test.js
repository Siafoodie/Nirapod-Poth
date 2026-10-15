
/**
 * US-12 T-12.4 Moderation QA Tests
 */

process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  "test-only-jwt-secret-do-not-use-in-production";

jest.setTimeout(120000);

const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../src/app");
const User = require("../src/models/User");
const Report = require("../src/models/Report");

let mongoServer = null;
let adminToken;
let userToken;
let databaseConnected = false;

// =====================================
// JWT TOKEN
// =====================================

const createToken = (user) => {
  return jwt.sign(
    { id: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

// =====================================
// CREATE TEST REPORT
// =====================================

const createReport = async (overrides = {}) => {
  return Report.create({
    incidentType: "harassment",
    location: "Dhanmondi Test",
    description: "Moderation QA test report",
    geo: {
      type: "Point",
      coordinates: [90.3742, 23.7465],
    },
    ...overrides,
  });
};

// =====================================
// BEFORE ALL TESTS
// =====================================

beforeAll(async () => {
  console.log("Starting test MongoDB...");

  mongoServer = await MongoMemoryServer.create();

  console.log("Test MongoDB started successfully");

  const mongoUri = mongoServer.getUri();

  console.log("Connecting Mongoose...");

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 30000,
  });

  databaseConnected = true;

  console.log("Test MongoDB connected successfully");

  await Report.init();

  // Create test admin
  const admin = await User.create({
    name: "QA Admin",
    email: "qa-admin@example.com",
    password: "TestPassword123",
    role: "admin",
  });

  // Create normal test user
  const user = await User.create({
    name: "QA User",
    email: "qa-user@example.com",
    password: "TestPassword123",
    role: "user",
  });

  adminToken = createToken(admin);
  userToken = createToken(user);

  console.log("Test users created successfully");
}, 120000);

// =====================================
// CLEANUP AFTER EACH TEST
// =====================================

afterEach(async () => {
  if (
    databaseConnected &&
    mongoose.connection.readyState === 1
  ) {
    await Report.deleteMany({});
  }
});

// =====================================
// CLEANUP AFTER ALL TESTS
// =====================================

afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    databaseConnected = false;

    if (mongoServer) {
      await mongoServer.stop();
    }

    console.log("Test database cleanup completed");
  } catch (error) {
    console.error("Test cleanup error:", error);
  }
}, 30000);

// =====================================
// US-12 T-12.4 MODERATION QA
// =====================================

describe("US-12 T-12.4 Moderation QA", () => {

  test("1. Unauthenticated user cannot access moderation reports", async () => {
    const response = await request(app)
      .get("/api/moderation/reports");

    expect(response.status).toBe(401);
  });

  test("2. Normal user cannot access moderation reports", async () => {
    const response = await request(app)
      .get("/api/moderation/reports")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(403);
  });

  test("3. Normal user cannot approve reports", async () => {
    const report = await createReport();

    const response = await request(app)
      .patch(`/api/moderation/reports/${report._id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        action: "approved",
      });

    expect(response.status).toBe(403);

    const saved = await Report.findById(report._id);

    expect(saved.moderationStatus).toBe("pending");
    expect(saved.moderationHistory).toHaveLength(0);
  });

  test("4. Admin can view pending reports", async () => {
    const report = await createReport();

    const response = await request(app)
      .get("/api/moderation/reports?status=pending")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(
      response.body.data.some(
        (item) => item._id === report._id.toString()
      )
    ).toBe(true);
  });

  test("5. Admin can approve a pending report", async () => {
    const report = await createReport();

    const response = await request(app)
      .patch(`/api/moderation/reports/${report._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        action: "approved",
        reason: "Verified report",
      });

    expect(response.status).toBe(200);

    const saved = await Report.findById(report._id);

    expect(saved.moderationStatus).toBe("approved");
    expect(saved.moderationHistory).toHaveLength(1);
    expect(saved.moderationHistory[0].action).toBe("approved");
    expect(saved.moderationHistory[0].reason).toBe(
      "Verified report"
    );
  });

  test("6. Admin can reject a pending report", async () => {
    const report = await createReport();

    const response = await request(app)
      .patch(`/api/moderation/reports/${report._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        action: "rejected",
        reason: "Invalid report",
      });

    expect(response.status).toBe(200);

    const saved = await Report.findById(report._id);

    expect(saved.moderationStatus).toBe("rejected");
    expect(saved.moderationHistory).toHaveLength(1);
    expect(saved.moderationHistory[0].action).toBe("rejected");
  });

  test("7. Moderation audit trail records admin and timestamp", async () => {
    const report = await createReport();

    const response = await request(app)
      .patch(`/api/moderation/reports/${report._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        action: "approved",
        reason: "QA verified",
      });

    expect(response.status).toBe(200);

    const saved = await Report.findById(report._id);

    const admin = await User.findOne({
      email: "qa-admin@example.com",
    });

    expect(saved.moderationHistory).toHaveLength(1);

    expect(
      saved.moderationHistory[0].adminId.toString()
    ).toBe(admin._id.toString());

    expect(
      saved.moderationHistory[0].timestamp
    ).toBeInstanceOf(Date);

    expect(saved.moderationHistory[0].reason).toBe(
      "QA verified"
    );
  });

  test("8. Only approved reports appear in public reports", async () => {
    const approved = await createReport({
      description: "Approved test",
      moderationStatus: "approved",
    });

    const pending = await createReport({
      description: "Pending test",
      moderationStatus: "pending",
    });

    const rejected = await createReport({
      description: "Rejected test",
      moderationStatus: "rejected",
    });

    const response = await request(app)
      .get("/api/reports");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const ids = response.body.data.map(
      (item) => item._id
    );

    expect(ids).toContain(approved._id.toString());
    expect(ids).not.toContain(pending._id.toString());
    expect(ids).not.toContain(rejected._id.toString());
  });

  test("9. Nearby API shows approved reports only", async () => {
    const approved = await createReport({
      moderationStatus: "approved",
    });

    await createReport({
      moderationStatus: "rejected",
    });

    await createReport({
      moderationStatus: "pending",
    });

    const response = await request(app)
      .get("/api/reports/nearby")
      .query({
        latitude: 23.7465,
        longitude: 90.3742,
        radiusKm: 5,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);

    expect(response.body.data[0]._id).toBe(
      approved._id.toString()
    );
  });

  test("10. A report cannot be moderated twice", async () => {
    const report = await createReport();

    const first = await request(app)
      .patch(`/api/moderation/reports/${report._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        action: "approved",
      });

    const second = await request(app)
      .patch(`/api/moderation/reports/${report._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        action: "rejected",
      });

    expect(first.status).toBe(200);
    expect(second.status).toBe(409);

    const saved = await Report.findById(report._id);

    expect(saved.moderationStatus).toBe("approved");
    expect(saved.moderationHistory).toHaveLength(1);
  });

  test("11. Invalid moderation action is rejected", async () => {
    const report = await createReport();

    const response = await request(app)
      .patch(`/api/moderation/reports/${report._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        action: "delete",
      });

    expect(response.status).toBe(400);

    const saved = await Report.findById(report._id);

    expect(saved.moderationStatus).toBe("pending");
  });

  test("12. Public reports do not expose moderation history or votes", async () => {
    await createReport({
      moderationStatus: "approved",
    });

    const response = await request(app)
      .get("/api/reports");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);

    const report = response.body.data[0];

    expect(report).not.toHaveProperty("moderationHistory");
    expect(report).not.toHaveProperty("votes");
    expect(report).not.toHaveProperty("adminId");
  });

});
