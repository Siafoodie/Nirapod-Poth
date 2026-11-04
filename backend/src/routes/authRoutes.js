
const express = require("express");
const router = express.Router();

const {
  register,
  verifyOtp,
  login,
} = require("../controllers/authController");

const uploadPoliceId = require("../middleware/uploadPoliceId");

// Register (Step 1: Generate and send OTP)
// Supports normal users and police ID card upload
router.post(
  "/register",
  uploadPoliceId.single("policeIdCard"),
  register
);

// Verify OTP (Step 2: Create account)
router.post("/verify-otp", verifyOtp);

// Login
router.post("/login", login);

// Test route
router.get("/", (req, res) => {
  res.json({
    message: "Auth route working",
  });
});

module.exports = router;
