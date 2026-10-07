const mongoose = require("mongoose");
const Report = require("../models/Report");

const getTotals = (report) => {
  const votes = report.votes || [];
  const upvotes =
    (report.upvotes || 0) +
    votes.filter((vote) => vote.value === "upvote").length;
  const downvotes =
    (report.downvotes || 0) +
    votes.filter((vote) => vote.value === "downvote").length;

  return { upvotes, downvotes, score: upvotes - downvotes };
};

// Upvote a report
const upvoteReport = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID",
      });
    }

    const report = await Report.findByIdAndUpdate(
      id,
      { $inc: { upvotes: 1 } },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Report upvoted successfully",
      ...getTotals(report),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to upvote report",
      error: error.message,
    });
  }
};

// Downvote a report
const downvoteReport = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID",
      });
    }

    const report = await Report.findByIdAndUpdate(
      id,
      { $inc: { downvotes: 1 } },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Report downvoted successfully",
      ...getTotals(report),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to downvote report",
      error: error.message,
    });
  }
};

// Get vote score
const getVoteScore = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID",
      });
    }

    const report = await Report.findById(id).select(
      "upvotes downvotes votes"
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    return res.status(200).json({
      success: true,
      ...getTotals(report),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get vote score",
      error: error.message,
    });
  }
};

module.exports = {
  upvoteReport,
  downvoteReport,
  getVoteScore,
};