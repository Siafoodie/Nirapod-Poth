
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");

async function createTestPolice() {
  try {
   await mongoose.connect(process.env.MONGODB_URI);

    const email = "testpolice@example.com";

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("Test Police account already exists");
      return;
    }

    const police = await User.create({
      name: "Test Police",
      email,
      password: "Test@12345",
      role: "police",
      accountStatus: "active",
      policeRank: "sub_inspector",
      policeUnit: "Mirpur Model Thana",
      policeId: "TEST-001",
      verifiedAt: new Date()
    });

    console.log("Test Police account created!");
    console.log("Email:", police.email);
  } catch (error) {
    console.error(error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createTestPolice();
