const express = require("express");
const router = express.Router();
const Report = require("../models/Report");

const {
  upvoteReport,
  downvoteReport,
  getVoteScore,
} = require("../controllers/voteController");

const voteRateLimiter = require("../middleware/voteRateLimiter");

// GET route (existing)
router.get("/", (req, res) => {
  res.json({ message: "Report route working" });
});

// POST route (existing report submission)
router.post("/", async (req, res) => {
  try {
    const { incidentType, location, description } = req.body;

    const report = await Report.create({
      incidentType,
      location,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Report submitted successfully!",
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to submit report",
      error: error.message,
    });
  }
});

// Upvote a report
router.post("/:id/upvote", voteRateLimiter, upvoteReport);

// Downvote a report
router.post("/:id/downvote", voteRateLimiter, downvoteReport);

// Get current vote score
router.get("/:id/score", getVoteScore);

module.exports = router;