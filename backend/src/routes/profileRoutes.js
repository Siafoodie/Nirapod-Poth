const express = require("express");
const router = express.Router();

const {
  getProfile,
  updateProfile,
  uploadProfileImage,
} = require("../controllers/profileController");

const { protect } = require("../middleware/authMiddleware");
const profileUpload = require("../middleware/profileUpload");

router.get("/", protect, getProfile);

router.put("/", protect, updateProfile);

router.post(
  "/image",
  protect,
  profileUpload.single("profileImage"),
  uploadProfileImage
);

module.exports = router;