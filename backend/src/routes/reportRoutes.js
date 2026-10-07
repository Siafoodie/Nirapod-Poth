const express = require('express');
const mongoose = require('mongoose');
const Report = require('../models/Report');
const {
  upvoteReport,
  downvoteReport,
} = require('../controllers/voteController');
const voteRateLimiter = require('../middleware/voteRateLimiter');

const router = express.Router();

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

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
            votes.find((vote) => vote.voterId === voterId)?.value || null,
        }
      : {}),
  };
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

router.get('/nearby', async (req, res) => {
  const latitude = Number(req.query.latitude);
  const longitude = Number(req.query.longitude);
  const radiusKm = req.query.radiusKm === undefined ? 5 : Number(req.query.radiusKm);
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
          coordinates: [longitude, latitude],
        },
        $maxDistance: radiusKm * 1000,
      },
    },
  }).limit(limit);

  return res.json({
    success: true,
    data: reports.map((report) => toReportResponse(report)),
  });
});

router.get('/', async (req, res) => {
  const limit = parseLimit(req.query.limit);
  if (limit === null) {
    return res.status(400).json({
      success: false,
      message: `limit must be a positive integer no greater than ${MAX_LIMIT}`,
    });
  }

  const reports = await Report.find().sort({ createdAt: -1 }).limit(limit);
  return res.json({
    success: true,
    data: reports.map((report) => toReportResponse(report)),
  });
});

router.post('/', async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'A JSON request body is required',
    });
  }

  const { incidentType, location, description, latitude, longitude } = req.body;
  const hasLatitude = latitude !== undefined && latitude !== null;
  const hasLongitude = longitude !== undefined && longitude !== null;

  if (hasLatitude !== hasLongitude) {
    return res.status(400).json({
      success: false,
      message: 'latitude and longitude must be provided together',
    });
  }

  if (
    hasLatitude &&
    !isValidCoordinates(latitude, longitude)
  ) {
    return res.status(400).json({
      success: false,
      message: 'latitude and longitude must be valid geographic coordinates',
    });
  }

  const report = await Report.create({
    incidentType,
    location,
    description,
    ...(hasLatitude
      ? { geo: { type: 'Point', coordinates: [longitude, latitude] } }
      : {}),
  });

  return res.status(201).json({
    success: true,
    message: 'Report submitted successfully!',
    data: toReportResponse(report),
  });
});

router.post('/:reportId/vote', voteRateLimiter, async (req, res) => {
  const { reportId } = req.params;

  if (!mongoose.isValidObjectId(reportId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid report ID',
    });
  }

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'A JSON request body is required',
    });
  }

  const { voterId, vote } = req.body;

  if (
    typeof voterId !== 'string' ||
    voterId.trim().length === 0 ||
    voterId.trim().length > 128
  ) {
    return res.status(400).json({
      success: false,
      message: 'voterId must be a non-empty string of at most 128 characters',
    });
  }

  if (vote !== 'upvote' && vote !== 'downvote') {
    return res.status(400).json({
      success: false,
      message: 'vote must be either "upvote" or "downvote"',
    });
  }

  const normalizedVoterId = voterId.trim();
  const report = await Report.findByIdAndUpdate(
    reportId,
    [
      {
        $set: {
          votes: {
            $concatArrays: [
              {
                $filter: {
                  input: { $ifNull: ['$votes', []] },
                  as: 'existingVote',
                  cond: { $ne: ['$$existingVote.voterId', normalizedVoterId] },
                },
              },
              [{ voterId: normalizedVoterId, value: vote }],
            ],
          },
        },
      },
    ],
    { new: true, updatePipeline: true }
  );

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found',
    });
  }

  return res.json({
    success: true,
    data: toReportResponse(report, normalizedVoterId),
  });
});

router.post('/:id/upvote', voteRateLimiter, upvoteReport);
router.post('/:id/downvote', voteRateLimiter, downvoteReport);
router.get('/:id/score', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid report ID',
    });
  }

  const report = await Report.findById(req.params.id).select(
    'upvotes downvotes votes',
  );
  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found',
    });
  }

  const score = toReportResponse(report);
  return res.status(200).json({
    success: true,
    upvotes: score.upvotes,
    downvotes: score.downvotes,
    score: score.score,
  });
});

module.exports = router;