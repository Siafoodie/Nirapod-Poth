
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

async function main() {
  let mongoServer;

  try {
    console.log("Step 1: Starting MongoDB Memory Server...");

    mongoServer = await MongoMemoryServer.create();

    console.log("Step 2: MongoDB Memory Server started!");

    // Get MongoDB connection URI
    const mongoUri = mongoServer.getUri();

    console.log("Step 3: Connecting Mongoose...");

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("Step 4: MongoDB connected successfully!");
    console.log("SUCCESS: Test database is working.");
  } catch (error) {
    console.error("MongoDB startup failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();

    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

main();
