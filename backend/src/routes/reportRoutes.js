const express = require('express');
const mongoose = require('mongoose');
const Report = require('../models/Report');
const voteRateLimiter = require('../middleware/voteRateLimiter');
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const {
  MODERATION_STATUS,
  isValidStatus,
  isValidTransition,
} = require('../utils/moderationConstants');

const router = express.Router();

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MAX_VOTING_DISTANCE_KM = 5;


// ======================================================
// Convert Report to API Response
// ======================================================

const toReportResponse = (report, voterId) => {
  const data = report.toObject ? report.toObject() : report;

  const { votes = [], ...reportData } = data;

  const upvotes =
    (data.upvotes || 0) +
    votes.filter((vote) => vote.value === 'upvote').length;

  const downvotes =
    (data.downvotes || 0) +
    votes.filter((vote) => vote.value === 'downvote').length;

  return {
    ...reportData,

    upvotes,
    downvotes,

    score: upvotes - downvotes,

    ...(voterId
      ? {
          userVote:
            votes.find(
              (vote) => vote.voterId === voterId
            )?.value || null,
        }
      : {}),
  };
};


// ======================================================
// Parse Limit
// ======================================================

const parseLimit = (value) => {
  if (value === undefined) {
    return DEFAULT_LIMIT;
  }

  const limit = Number(value);

  return Number.isInteger(limit) && limit > 0
    ? Math.min(limit, MAX_LIMIT)
    : null;
};


// ======================================================
// Validate Coordinates
// ======================================================

const isValidCoordinates = (latitude, longitude) =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180;


// ======================================================
// Calculate Distance Between Two Coordinates
// Haversine Formula
// ======================================================

const calculateDistanceKm = (
  latitude1,
  longitude1,
  latitude2,
  longitude2
) => {
  const toRadians = (degrees) =>
    (degrees * Math.PI) / 180;

  const earthRadiusKm = 6371;

  const latitudeDifference = toRadians(
    latitude2 - latitude1
  );

  const longitudeDifference = toRadians(
    longitude2 - longitude1
  );

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(longitudeDifference / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadiusKm * c;
};


// ======================================================
// GET Nearby Reports
// ======================================================

router.get('/nearby', async (req, res) => {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);

    const radiusKm =
      req.query.radiusKm === undefined
        ? 5
        : Number(req.query.radiusKm);

    const limit = parseLimit(req.query.limit);

    if (
      !isValidCoordinates(latitude, longitude) ||
      !Number.isFinite(radiusKm) ||
      radiusKm <= 0 ||
      radiusKm > 100 ||
      limit === null
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Valid latitude, longitude, radiusKm (greater than 0 and at most 100), and limit are required',
      });
    }

    const reports = await Report.find({
      geo: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [
              longitude,
              latitude,
            ],
          },

          $maxDistance: radiusKm * 1000,
        },
      },
    }).limit(limit);

    return res.status(200).json({
      success: true,

      data: reports.map((report) =>
        toReportResponse(report)
      ),
    });
  } catch (error) {
    console.error(
      'Nearby reports error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to load nearby reports',
      error: error.message,
    });
  }
});


// ======================================================
// GET All Reports
// ======================================================

router.get('/', async (req, res) => {
  try {
    const limit = parseLimit(
      req.query.limit
    );

    if (limit === null) {
      return res.status(400).json({
        success: false,
        message:
          `limit must be a positive integer no greater than ${MAX_LIMIT}`,
      });
    }

    const filter = {};
    if (req.query.status !== undefined) {
      const requestedStatus = String(req.query.status).trim().toLowerCase();
      if (!isValidStatus(requestedStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status filter: ${req.query.status}`,
        });
      }
      filter.status = requestedStatus;
    }

    const reports = await Report.find(filter)
      .sort({
        createdAt: -1,
      })
      .limit(limit);

    return res.status(200).json({
      success: true,

      data: reports.map((report) =>
        toReportResponse(report)
      ),
    });
  } catch (error) {
    console.error(
      'Get reports error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to load reports',
      error: error.message,
    });
  }
});


// ======================================================
// CREATE Report
// ======================================================

router.post('/', async (req, res) => {
  try {
    if (
      !req.body ||
      typeof req.body !== 'object' ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'A JSON request body is required',
      });
    }

    const {
      incidentType,
      location,
      description,
      latitude,
      longitude,
    } = req.body;

    const hasLatitude =
      latitude !== undefined &&
      latitude !== null;

    const hasLongitude =
      longitude !== undefined &&
      longitude !== null;

    // Latitude and longitude must be provided together
    if (hasLatitude !== hasLongitude) {
      return res.status(400).json({
        success: false,
        message:
          'latitude and longitude must be provided together',
      });
    }

    let parsedLatitude = null;
    let parsedLongitude = null;

    if (hasLatitude) {
      parsedLatitude = Number(latitude);
      parsedLongitude = Number(longitude);

      if (
        !isValidCoordinates(
          parsedLatitude,
          parsedLongitude
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'latitude and longitude must be valid geographic coordinates',
        });
      }
    }

    const report = await Report.create({
      incidentType,
      location,
      description,

      ...(hasLatitude
        ? {
            geo: {
              type: 'Point',

              coordinates: [
                parsedLongitude,
                parsedLatitude,
              ],
            },
          }
        : {}),
    });

    return res.status(201).json({
      success: true,
      message:
        'Report submitted successfully!',
      data: toReportResponse(report),
    });
  } catch (error) {
    console.error(
      'Create report error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to submit report',
      error: error.message,
    });
  }
});


// ======================================================
// VOTE ON REPORT
// Official voting endpoint
//
// Features:
// - One vote per voter per report
// - Existing vote can be changed
// - User must provide location
// - User must be within 5 km
// - Rate limited
// ======================================================

router.post(
  '/:reportId/vote',
  voteRateLimiter,
  async (req, res) => {
    try {
      const { reportId } = req.params;

      // ------------------------------------------
      // Validate Report ID
      // ------------------------------------------

      if (!mongoose.isValidObjectId(reportId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid report ID',
        });
      }

      // ------------------------------------------
      // Validate Request Body
      // ------------------------------------------

      if (
        !req.body ||
        typeof req.body !== 'object' ||
        Array.isArray(req.body)
      ) {
        return res.status(400).json({
          success: false,
          message:
            'A JSON request body is required',
        });
      }

      const {
        voterId,
        vote,
        latitude,
        longitude,
      } = req.body;

      // ------------------------------------------
      // Validate Voter ID
      // ------------------------------------------

      if (
        typeof voterId !== 'string' ||
        voterId.trim().length === 0 ||
        voterId.trim().length > 128
      ) {
        return res.status(400).json({
          success: false,
          message:
            'voterId must be a non-empty string of at most 128 characters',
        });
      }

      // ------------------------------------------
      // Validate Vote
      // ------------------------------------------

      if (
        vote !== 'upvote' &&
        vote !== 'downvote'
      ) {
        return res.status(400).json({
          success: false,
          message:
            'vote must be either "upvote" or "downvote"',
        });
      }

      // ------------------------------------------
      // Validate User Location (Optional)
      // ------------------------------------------

      const hasLatitude = latitude !== undefined && latitude !== null;
      const hasLongitude = longitude !== undefined && longitude !== null;

      if (hasLatitude !== hasLongitude) {
        return res.status(400).json({
          success: false,
          message:
            'Valid latitude and longitude are required to vote',
        });
      }

      if (hasLatitude && hasLongitude) {
        const userLatitude = Number(latitude);
        const userLongitude = Number(longitude);

        if (
          !isValidCoordinates(
            userLatitude,
            userLongitude
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Valid latitude and longitude are required to vote',
          });
        }

        // ------------------------------------------
        // Find Report & Validate Location
        // ------------------------------------------

        const existingReport =
          await Report.findById(reportId);

        if (!existingReport) {
          return res.status(404).json({
            success: false,
            message: 'Report not found',
          });
        }

        const reportCoordinates =
          existingReport.geo?.coordinates;

        if (
          !Array.isArray(reportCoordinates) ||
          reportCoordinates.length !== 2 ||
          !isValidCoordinates(
            Number(reportCoordinates[1]),
            Number(reportCoordinates[0])
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              'This report does not have valid location information',
          });
        }

        const distanceKm =
          calculateDistanceKm(
            userLatitude,
            userLongitude,
            Number(reportCoordinates[1]),
            Number(reportCoordinates[0])
          );

        if (
          distanceKm >
          MAX_VOTING_DISTANCE_KM
        ) {
          return res.status(403).json({
            success: false,
            message:
              'You can only vote on reports within 5 km of your location.',
          });
        }
      }

      // ------------------------------------------
      // Add / Change Vote
      // ------------------------------------------

      const normalizedVoterId =
        voterId.trim();

      const report =
        await Report.findByIdAndUpdate(
          reportId,

          [
            {
              $set: {
                votes: {
                  $concatArrays: [
                    // Remove this user's old vote
                    {
                      $filter: {
                        input: {
                          $ifNull: [
                            '$votes',
                            [],
                          ],
                        },

                        as: 'existingVote',

                        cond: {
                          $ne: [
                            '$$existingVote.voterId',
                            normalizedVoterId,
                          ],
                        },
                      },
                    },

                    // Add user's new vote
                    [
                      {
                        voterId:
                          normalizedVoterId,

                        value: vote,
                      },
                    ],
                  ],
                },
              },
            },
          ],

          {
            new: true,
            updatePipeline: true,
          }
        );

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
        });
      }

      // ------------------------------------------
      // Success
      // ------------------------------------------

      return res.status(200).json({
        success: true,
        message:
          'Vote submitted successfully.',

        data: toReportResponse(
          report,
          normalizedVoterId
        ),
      });
    } catch (error) {
      console.error(
        'Vote error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Failed to submit vote',
        error: error.message,
      });
    }
  }
);


// ======================================================
// GET Vote Score
// ======================================================

router.get(
  '/:id/score',
  async (req, res) => {
    try {
      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid report ID',
        });
      }

      const report =
        await Report.findById(
          req.params.id
        ).select(
          'upvotes downvotes votes'
        );

      if (!report) {
        return res.status(404).json({
          success: false,
          message:
            'Report not found',
        });
      }

      const score =
        toReportResponse(report);

      return res.status(200).json({
        success: true,
        upvotes: score.upvotes,
        downvotes: score.downvotes,
        score: score.score,
      });
    } catch (error) {
      console.error(
        'Vote score error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Failed to get vote score',
        error: error.message,
      });
    }
  }
);


// ======================================================
// GET Moderation Queue (Admin Only)
// ======================================================

router.get('/moderation/queue', protect, requireAdmin, async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit) || DEFAULT_LIMIT;
    const filter = {};

    if (req.query.status !== undefined) {
      const requestedStatus = String(req.query.status).trim().toLowerCase();
      if (!isValidStatus(requestedStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status filter: ${req.query.status}`,
        });
      }
      filter.status = requestedStatus;
    } else {
      // By default, queue shows reports requiring moderation attention
      filter.status = {
        $in: [
          MODERATION_STATUS.PENDING,
          MODERATION_STATUS.UNDER_REVIEW,
          MODERATION_STATUS.NEEDS_REVISION,
        ],
      };
    }

    const reports = await Report.find(filter)
      .sort({ createdAt: 1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: reports.length,
      data: reports.map((report) => toReportResponse(report)),
    });
  } catch (error) {
    console.error('Moderation queue error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load moderation queue',
      error: error.message,
    });
  }
});


// ======================================================
// GET Report Details by ID
// ======================================================

router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID',
      });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: toReportResponse(report),
    });
  } catch (error) {
    console.error('Get report details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load report',
      error: error.message,
    });
  }
});


// ======================================================
// MODERATION REVIEW WORKFLOW
// ======================================================

const updateModerationStatus = async (req, res, targetStatusOverride) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID',
      });
    }

    const rawTargetStatus = targetStatusOverride || req.body?.status;

    if (!rawTargetStatus || typeof rawTargetStatus !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid moderation status is required',
      });
    }

    const targetStatus = rawTargetStatus.trim().toLowerCase();

    if (!isValidStatus(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid moderation status: ${rawTargetStatus}. Valid statuses are: ${Object.values(MODERATION_STATUS).join(', ')}`,
      });
    }

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    if (report.status === targetStatus) {
      return res.status(400).json({
        success: false,
        message: `Report is already in '${targetStatus}' status`,
      });
    }

    if (!isValidTransition(report.status, targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition: cannot change status from '${report.status}' to '${targetStatus}'`,
      });
    }

    const comment =
      req.body?.comment ||
      req.body?.moderationComment ||
      req.body?.reason ||
      '';

    report.status = targetStatus;
    report.moderationComment = String(comment).trim();
    report.reviewedBy = req.user ? req.user._id : null;
    report.reviewedAt = new Date();

    await report.save();

    return res.status(200).json({
      success: true,
      message: `Report status updated to '${targetStatus}' successfully`,
      data: toReportResponse(report),
    });
  } catch (error) {
    console.error('Moderation status update error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update report status',
      error: error.message,
    });
  }
};

// General status update endpoint (Admin only)
router.patch('/:id/status', protect, requireAdmin, (req, res) => {
  return updateModerationStatus(req, res);
});

router.put('/:id/status', protect, requireAdmin, (req, res) => {
  return updateModerationStatus(req, res);
});

// Direct approval endpoint (Admin only)
router.patch('/:id/approve', protect, requireAdmin, (req, res) => {
  return updateModerationStatus(req, res, MODERATION_STATUS.APPROVED);
});

// Direct rejection endpoint (Admin only)
router.patch('/:id/reject', protect, requireAdmin, (req, res) => {
  return updateModerationStatus(req, res, MODERATION_STATUS.REJECTED);
});


module.exports = router;