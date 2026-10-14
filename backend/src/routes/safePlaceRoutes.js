const express = require('express');
const mongoose = require('mongoose');
const SafePlace = require('../models/SafePlace');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// ======================================================
// GET All Safe Places (Public)
// ======================================================

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.category) {
    filter.category = String(req.query.category).trim().toLowerCase();
  }

  const places = await SafePlace.find(filter).sort({ name: 1 });
  return res.json({
    success: true,
    data: places,
  });
});


// ======================================================
// POST Create Safe Place (Public — status defaults to pending)
// ======================================================

router.post('/', async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'A JSON request body is required',
    });
  }

  // Strip out any verification fields a client might attempt to inject
  const { verificationStatus, verificationComment, verifiedBy, verifiedAt, ...safeBody } = req.body;

  const place = await SafePlace.create(safeBody);
  return res.status(201).json({
    success: true,
    data: place,
  });
});


// ======================================================
// GET Verification Queue — pending safe places (Admin Only)
// ======================================================

router.get('/moderation/queue', protect, requireAdmin, async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const allowedStatuses = ['pending', 'approved', 'rejected'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status filter: '${status}'. Must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    const places = await SafePlace.find({ verificationStatus: status }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: places.length,
      data: places,
    });
  } catch (error) {
    console.error('SafePlace moderation queue error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load verification queue',
      error: error.message,
    });
  }
});


// ======================================================
// GET Safe Place by ID (Public)
// ======================================================

router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid safe-place ID',
      });
    }

    const place = await SafePlace.findById(req.params.id);

    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Safe place not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: place,
    });
  } catch (error) {
    console.error('SafePlace fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve safe place',
      error: error.message,
    });
  }
});


// ======================================================
// PATCH Approve Safe Place (Admin Only)
// ======================================================

router.patch('/:id/approve', protect, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid safe-place ID',
      });
    }

    const place = await SafePlace.findById(req.params.id);

    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Safe place not found',
      });
    }

    if (place.verificationStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: "Safe place is already in 'approved' status",
      });
    }

    place.verificationStatus = 'approved';
    place.verificationComment = req.body.comment ? String(req.body.comment).trim() : '';
    place.verifiedBy = req.user._id;
    place.verifiedAt = new Date();

    await place.save();

    return res.status(200).json({
      success: true,
      message: 'Safe place approved successfully',
      data: place,
    });
  } catch (error) {
    console.error('SafePlace approve error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve safe place',
      error: error.message,
    });
  }
});


// ======================================================
// PATCH Reject Safe Place (Admin Only)
// ======================================================

router.patch('/:id/reject', protect, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid safe-place ID',
      });
    }

    const place = await SafePlace.findById(req.params.id);

    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Safe place not found',
      });
    }

    if (place.verificationStatus === 'rejected') {
      return res.status(400).json({
        success: false,
        message: "Safe place is already in 'rejected' status",
      });
    }

    place.verificationStatus = 'rejected';
    place.verificationComment = req.body.reason
      ? String(req.body.reason).trim()
      : req.body.comment
        ? String(req.body.comment).trim()
        : '';
    place.verifiedBy = req.user._id;
    place.verifiedAt = new Date();

    await place.save();

    return res.status(200).json({
      success: true,
      message: 'Safe place rejected',
      data: place,
    });
  } catch (error) {
    console.error('SafePlace reject error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject safe place',
      error: error.message,
    });
  }
});


module.exports = router;
