const express = require("express");
const router = express.Router();

const {
  register,
  verifyOtp,
  login,
} = require("../controllers/authController");
const uploadPoliceId = require("../middleware/uploadPoliceId");

router.post(
  "/register",
  uploadPoliceId.single("policeIdCard"),
  register
); 

// Register (step 1: send OTP)
router.post("/register", register);

// Verify OTP (step 2: create account)
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