
const express = require("express");
const mongoose = require("mongoose");
const Report = require("../models/Report");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.use(requireAdmin);

const toAdminReport = (report) => {
  const data = report.toObject ? report.toObject() : report;

  return {
    _id: data._id,
    incidentType: data.incidentType,
    location: data.location,
    description: data.description,
    geo: data.geo,
    status: data.status,
    moderationStatus: data.moderationStatus || "pending",
    moderationHistory: data.moderationHistory || [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

// GET /api/moderation/reports?status=pending
router.get("/reports", async (req, res) => {
  try {
    const { status } = req.query;

    if (
      status !== undefined &&
      !["pending", "approved", "rejected"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid moderation status",
      });
    }

    const filter = {};

    if (status === "pending") {
      filter.$or = [
        { moderationStatus: "pending" },
        { moderationStatus: { $exists: false } },
        { moderationStatus: null },
      ];
    } else if (status) {
      filter.moderationStatus = status;
    }

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      data: reports.map(toAdminReport),
    });
  } catch (error) {
    console.error("Moderation list error:", error.code || error.name);

    return res.status(500).json({
      success: false,
      message: "Failed to load moderation reports",
    });
  }
});

// PATCH /api/moderation/reports/:id
router.patch("/reports/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason = "" } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID",
      });
    }

    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be approved or rejected",
      });
    }

    if (typeof reason !== "string" || reason.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Reason must be text of at most 500 characters",
      });
    }

    // Atomic update prevents two admins from moderating
    // the same pending report at the same time.
    const report = await Report.findOneAndUpdate(
      {
        _id: id,
        $or: [
          { moderationStatus: "pending" },
          { moderationStatus: { $exists: false } },
          { moderationStatus: null },
        ],
      },
      {
        $set: {
          moderationStatus: action,
        },
        $push: {
          moderationHistory: {
            action,
            adminId: req.admin._id,
            timestamp: new Date(),
            reason: reason.trim(),
          },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!report) {
      const exists = await Report.exists({ _id: id });

      return res.status(exists ? 409 : 404).json({
        success: false,
        message: exists
          ? "Report already moderated"
          : "Report not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Report ${action} successfully`,
      data: toAdminReport(report),
    });
  } catch (error) {
    console.error("Moderation update error:", error.code || error.name);

    return res.status(500).json({
      success: false,
      message: "Failed to moderate report",
    });
  }
});

module.exports = router;
