const express = require("express");
const SafePlace = require("../models/SafePlace");

const router = express.Router();

// GET /api/safe-places?category=police&lat=23.8&lng=90.4&radiusKm=10
router.get("/", async (req, res, next) => {
  try {
    const filter = { verified: true };
    if (req.query.category && req.query.category !== "all") {
      filter.category = String(req.query.category).trim().toLowerCase();
    }

    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radiusKm = Math.min(parseFloat(req.query.radiusKm) || 15, 100);

    let places;

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      places = await SafePlace.find({
        ...filter,
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: [lng, lat] },
            $maxDistance: radiusKm * 1000,
          },
        },
      }).limit(100);
    } else {
      places = await SafePlace.find(filter).sort({ name: 1 }).limit(200);
    }

    res.json({ success: true, count: places.length, data: places });
  } catch (err) {
    next(err);
  }
});

router.get("/categories", async (_req, res, next) => {
  try {
    const cats = await SafePlace.distinct("category");
    res.json({ success: true, data: cats });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({ success: false, message: "JSON body required" });
    }
    const body = { ...req.body };
    if (body.lng != null && body.lat != null) {
      body.coordinates = [Number(body.lng), Number(body.lat)];
      body.location = { type: "Point", coordinates: body.coordinates };
    }
    const place = await SafePlace.create(body);
    res.status(201).json({ success: true, data: place });
  } catch (err) {
    next(err);
  }
});

module.exports = router;  