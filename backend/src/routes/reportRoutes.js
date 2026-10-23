const express = require("express");
const mongoose = require("mongoose");
const Report = require("../models/Report");
const voteRateLimiter = require("../middleware/voteRateLimiter");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MAX_VOTING_DISTANCE_KM = 5;

// Convert database report into a privacy-safe response.
const toReportResponse = (report, voterId) => {
  const data = report.toObject ? report.toObject() : report;
  const votes = Array.isArray(data.votes) ? data.votes : [];

  const upvotes =
    (data.upvotes || 0) +
    votes.filter((item) => item.value === "upvote").length;

  const downvotes =
    (data.downvotes || 0) +
    votes.filter((item) => item.value === "downvote").length;

  const response = {
    _id: data._id,
    incidentType: data.incidentType,
    location: data.location,
    description: data.description,
    status: data.status,
    upvotes,
    downvotes,
    score: upvotes - downvotes,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };

  if (
    data.geo &&
    data.geo.type === "Point" &&
    Array.isArray(data.geo.coordinates) &&
    data.geo.coordinates.length === 2
  ) {
    response.geo = {
      type: "Point",
      coordinates: [...data.geo.coordinates],
    };
  }

  if (voterId) {
    response.userVote =
      votes.find((item) => item.voterId === voterId)?.value || null;
  }

  return response;
};

const parseLimit = (value) => {
  if (value === undefined) return DEFAULT_LIMIT;

  const limit = Number(value);

  return Number.isInteger(limit) && limit > 0
    ? Math.min(limit, MAX_LIMIT)
    : null;
};

const isValidCoordinates = (latitude, longitude) =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180;

const calculateDistanceKm = (
  latitude1,
  longitude1,
  latitude2,
  longitude2
) => {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const latitudeDifference = toRadians(latitude2 - latitude1);
  const longitudeDifference = toRadians(longitude2 - longitude1);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(longitudeDifference / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

// GET /api/reports/nearby
// Only approved reports are publicly visible.
router.get("/nearby", async (req, res) => {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);

    const radiusKm =
      req.query.radiusKm === undefined ? 5 : Number(req.query.radiusKm);

    const limit = parseLimit(req.query.limit);

    if (
      req.query.latitude == null ||
      req.query.longitude == null ||
      req.query.latitude === "" ||
      req.query.longitude === "" ||
      !isValidCoordinates(latitude, longitude) ||
      !Number.isFinite(radiusKm) ||
      radiusKm <= 0 ||
      radiusKm > 100 ||
      limit === null
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid latitude, longitude, radiusKm (greater than 0 and at most 100), and limit are required",
      });
    }

    const reports = await Report.find({
      moderationStatus: "approved",
      geo: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: radiusKm * 1000,
        },
      },
    }).limit(limit);

    return res.status(200).json({
      success: true,
      data: reports.map((report) => toReportResponse(report)),
    });
  } catch (error) {
    console.error("Nearby reports error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load nearby reports",
    });
  }
});

// GET /api/reports
router.get("/", async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit);

    if (limit === null) {
      return res.status(400).json({
        success: false,
        message: `limit must be a positive integer no greater than ${MAX_LIMIT}`,
      });
    }

    const reports = await Report.find({
      moderationStatus: "approved",
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: reports.map((report) => toReportResponse(report)),
    });
  } catch (error) {
    console.error("Get reports error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load reports",
    });
  }
});

// POST /api/reports
// Anonymous incident report submission.
router.post("/", async (req, res) => {
  try {
    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        success: false,
        message: "A JSON request body is required",
      });
    }

    const {
      incidentType,
      location,
      description,
      latitude,
      longitude,
      clientId,
    } = req.body;

    // US-14: offline queue dedupe — same clientId must not create twice
    if (typeof clientId === "string" && clientId.trim()) {
      const existing = await Report.findOne({ clientId: clientId.trim() });
      if (existing) {
        return res.status(200).json({
          success: true,
          message: "Report already saved",
          data: toReportResponse(existing),
          duplicate: true,
        });
      }
    }

    if (
      typeof incidentType !== "string" ||
      !incidentType.trim() ||
      typeof location !== "string" ||
      !location.trim() ||
      (description !== undefined && typeof description !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Incident type and location are required; description must be text",
      });
    }

    const hasLatitude = latitude !== undefined && latitude !== null;
    const hasLongitude = longitude !== undefined && longitude !== null;

    if (hasLatitude !== hasLongitude) {
      return res.status(400).json({
        success: false,
        message: "latitude and longitude must be provided together",
      });
    }

    let parsedLatitude = null;
    let parsedLongitude = null;

    if (hasLatitude) {
      parsedLatitude = Number(latitude);
      parsedLongitude = Number(longitude);

      if (
        latitude === "" ||
        longitude === "" ||
        !isValidCoordinates(parsedLatitude, parsedLongitude)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "latitude and longitude must be valid geographic coordinates",
        });
      }
    }

    // Only approved fields are persisted.
    // Reporter identity and travel history are not saved.
    const reportData = {
      incidentType: incidentType.trim(),
      location: location.trim(),
      description: (description || "").trim(),
      moderationStatus: "pending",
    };

    if (typeof clientId === "string" && clientId.trim()) {
      reportData.clientId = clientId.trim();
    }

    if (hasLatitude) {
      reportData.geo = {
        type: "Point",
        coordinates: [parsedLongitude, parsedLatitude],
      };
    }

    const report = await Report.create(reportData);

    return res.status(201).json({
      success: true,
      message: "Report submitted successfully!",
      data: toReportResponse(report),
      duplicate: false,
    });
  } catch (error) {
    console.error("Create report error:", error);

    // Unique index race: two parallel offline retries with same clientId
    if (
      error.code === 11000 &&
      (error.keyPattern?.clientId || String(error.message || "").includes("clientId"))
    ) {
      try {
        const existing = await Report.findOne({
          clientId: String(req.body?.clientId || "").trim(),
        });
        if (existing) {
          return res.status(200).json({
            success: true,
            message: "Report already saved",
            data: toReportResponse(existing),
            duplicate: true,
          });
        }
      } catch (lookupError) {
        console.error("Duplicate lookup error:", lookupError);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to submit report",
    });
  }
});

// POST /api/reports/:reportId/vote
router.post(
  "/:reportId/vote",
  protect,
  voteRateLimiter,
  async (req, res) => {
    try {
      const { reportId } = req.params;

      if (!mongoose.isValidObjectId(reportId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid report ID",
        });
      }

      if (
        !req.body ||
        typeof req.body !== "object" ||
        Array.isArray(req.body)
      ) {
        return res.status(400).json({
          success: false,
          message: "A JSON request body is required",
        });
      }

      const { vote, latitude, longitude } = req.body;

      // Use authenticated user identity.
      const normalizedVoterId = String(req.user._id);

      if (vote !== "upvote" && vote !== "downvote") {
        return res.status(400).json({
          success: false,
          message: 'vote must be either "upvote" or "downvote"',
        });
      }

      const userLatitude = Number(latitude);
      const userLongitude = Number(longitude);

      if (
        latitude === undefined ||
        latitude === null ||
        latitude === "" ||
        longitude === undefined ||
        longitude === null ||
        longitude === "" ||
        !isValidCoordinates(userLatitude, userLongitude)
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid latitude and longitude are required to vote",
        });
      }

      const existingReport = await Report.findById(reportId);

      if (!existingReport) {
        return res.status(404).json({
          success: false,
          message: "Report not found",
        });
      }

      if (existingReport.moderationStatus !== "approved") {
        return res.status(403).json({
          success: false,
          message: "This report is not available for voting",
        });
      }

      const reportCoordinates = existingReport.geo?.coordinates;

      if (
        !Array.isArray(reportCoordinates) ||
        reportCoordinates.length !== 2
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This report does not have valid location information",
        });
      }

      const reportLongitude = Number(reportCoordinates[0]);
      const reportLatitude = Number(reportCoordinates[1]);

      if (!isValidCoordinates(reportLatitude, reportLongitude)) {
        return res.status(400).json({
          success: false,
          message:
            "This report does not have valid location information",
        });
      }

      const distanceKm = calculateDistanceKm(
        userLatitude,
        userLongitude,
        reportLatitude,
        reportLongitude
      );

      if (distanceKm > MAX_VOTING_DISTANCE_KM) {
        return res.status(403).json({
          success: false,
          message:
            "You can only vote on reports within 5 km of your location.",
        });
      }

      // Update vote atomically.
      // Only approved reports can be modified.
      const report = await Report.findOneAndUpdate(
        {
          _id: reportId,
          moderationStatus: "approved",
        },
        [
          {
            $set: {
              votes: {
                $concatArrays: [
                  {
                    $filter: {
                      input: { $ifNull: ["$votes", []] },
                      as: "existingVote",
                      cond: {
                        $ne: [
                          "$$existingVote.voterId",
                          normalizedVoterId,
                        ],
                      },
                    },
                  },
                  [
                    {
                      voterId: normalizedVoterId,
                      value: vote,
                    },
                  ],
                ],
              },
            },
          },
        ],
        { new: true, updatePipeline: true }
      );

      if (!report) {
        return res.status(409).json({
          success: false,
          message: "Report is no longer available for voting",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Vote submitted successfully.",
        data: toReportResponse(report, normalizedVoterId),
      });
    } catch (error) {
      console.error("Vote error:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      return res.status(500).json({
        success: false,
        message: "Failed to submit vote",
      });
    }
  }
);

// GET /api/reports/:id/score
router.get("/:id/score", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID",
      });
    }

    const report = await Report.findOne({
      _id: req.params.id,
      moderationStatus: "approved",
    }).select("upvotes downvotes votes");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    const score = toReportResponse(report);

    return res.status(200).json({
      success: true,
      upvotes: score.upvotes,
      downvotes: score.downvotes,
      score: score.score,
    });
  } catch (error) {
    console.error("Vote score error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get vote score",
    });
  }
});

module.exports = router;
