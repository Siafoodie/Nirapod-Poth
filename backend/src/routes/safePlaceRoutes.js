const express = require('express');
const SafePlace = require('../models/SafePlace');

const router = express.Router();

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

router.post('/', async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'A JSON request body is required',
    });
  }

  const place = await SafePlace.create(req.body);
  return res.status(201).json({
    success: true,
    data: place,
  });
});

module.exports = router;