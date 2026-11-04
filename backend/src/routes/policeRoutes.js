
const express = require("express");
const mongoose = require("mongoose");
const Report = require("../models/Report");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Police authorization: check current database state
const policeOnly = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const officer = await User.findById(req.user._id)
      .select("role accountStatus");

    if (
      !officer ||
      officer.role !== "police" ||
      officer.accountStatus !== "active"
    ) {
      return res.status(403).json({
        success: false,
        message: "Active police account required",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

router.use(protect, policeOnly);

const validId = (id) => mongoose.isValidObjectId(id);

const sendError = (res, error) => {
  console.error("Police API error:", error);
  return res.status(500).json({
    success: false,
    message: "Police operation failed",
  });
};

// GET /api/police/reports
router.get("/reports", async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 50, 1),
      100
    );

    const reports = await Report.find({
      moderationStatus: "approved",
    })
      .select("-votes -reporterUserId -clientId")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    return sendError(res, error);
  }
});

// PATCH /api/police/reports/:id/investigate
router.patch("/reports/:id/investigate", async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID",
      });
    }

    const { investigationStatus, investigationNote } =
      req.body || {};

    if (
      !["investigating", "completed"].includes(
        investigationStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid investigation status",
      });
    }

    if (
      typeof investigationNote !== "string" ||
      !investigationNote.trim() ||
      investigationNote.length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Investigation note is required (max 2000 characters)",
      });
    }

    const report = await Report.findOneAndUpdate(
      {
        _id: req.params.id,
        moderationStatus: "approved",
        verificationOutcome: {
          $nin: ["verified", "unsubstantiated"],
        },
      },
      {
        $set: {
          investigationStatus,
          investigationNote: investigationNote.trim(),
          investigatedBy: req.user._id,
          investigatedAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-votes -reporterUserId -clientId");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report unavailable or already finalized",
      });
    }

    return res.json({
      success: true,
      message: "Investigation updated successfully",
      data: report,
    });
  } catch (error) {
    return sendError(res, error);
  }
});

// PATCH /api/police/reports/:id/verify
router.patch("/reports/:id/verify", async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID",
      });
    }

    const { outcome } = req.body || {};

    if (!["verified", "unsubstantiated"].includes(outcome)) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification outcome",
      });
    }

    const verified = outcome === "verified";

    const report = await Report.findOneAndUpdate(
      {
        _id: req.params.id,
        moderationStatus: "approved",
        investigationStatus: "completed",
        verificationOutcome: {
          $nin: ["verified", "unsubstantiated"],
        },
        investigationNote: { $exists: true, $ne: "" },
      },
      {
        $set: {
          verificationOutcome: outcome,
          policeVerified: verified,
          verifiedBy: req.user._id,
          verifiedAt: new Date(),
          policeRiskLevel: "unassessed",
          policeRiskReason: "",
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-votes -reporterUserId -clientId");

    if (!report) {
      return res.status(409).json({
        success: false,
        message:
          "Complete investigation first or report already finalized",
      });
    }

    return res.json({
      success: true,
      message: `Report ${outcome} successfully`,
      data: report,
    });
  } catch (error) {
    return sendError(res, error);
  }
});

// PATCH /api/police/reports/:id/risk
router.patch("/reports/:id/risk", async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID",
      });
    }

    const { riskLevel, reason } = req.body || {};

    if (!["low", "medium", "high"].includes(riskLevel)) {
      return res.status(400).json({
        success: false,
        message: "Risk level must be low, medium or high",
      });
    }

    if (
      typeof reason !== "string" ||
      !reason.trim() ||
      reason.length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "Risk reason is required (max 1000 characters)",
      });
    }

    const report = await Report.findOneAndUpdate(
      {
        _id: req.params.id,
        moderationStatus: "approved",
        policeVerified: true,
        verificationOutcome: "verified",
        "geo.type": "Point",
        "geo.coordinates.1": { $exists: true },
      },
      {
        $set: {
          policeRiskLevel: riskLevel,
          policeRiskReason: reason.trim(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-votes -reporterUserId -clientId");

    if (!report) {
      return res.status(409).json({
        success: false,
        message:
          "Verified report with coordinates required",
      });
    }

    return res.json({
      success: true,
      message: "Location risk assessment saved",
      data: report,
    });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
