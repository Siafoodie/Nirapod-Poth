const express = require("express");
const router = express.Router();

const {
  register,
  login,
} = require("../controllers/authController");

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Test route
router.get("/", (req, res) => {
  res.json({
    message: "Auth route working",
  });
});

module.exports = router;