const express = require("express");
const crypto = require("crypto");
const LiveSession = require("../models/LiveSession");
// const auth = require("../middleware/auth"); // যদি থাকে

const router = express.Router();
const SESSION_MS = 60 * 60 * 1000;

// Start session
router.post("/start", async (req, res) => {
  try {
    const { contactIds = [], lat, lng } = req.body;
    const shareToken = crypto.randomBytes(24).toString("hex");
    const session = await LiveSession.create({
      userId: req.user?._id, // auth থাকলে
      shareToken,
      active: true,
      expiresAt: new Date(Date.now() + SESSION_MS),
      contactIds,
      lastLocation:
        lat != null && lng != null
          ? { lat, lng, at: new Date() }
          : undefined,
      locations:
        lat != null && lng != null
          ? [{ lat, lng, at: new Date() }]
          : [],
    });
    res.status(201).json({
      sessionId: session._id,
      shareToken: session.shareToken,
      expiresAt: session.expiresAt,
      shareUrl: `/live/${session.shareToken}`,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Secure location update
router.post("/:token/location", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const session = await LiveSession.findOne({ shareToken: req.params.token });
    if (!session || !session.active) {
      return res.status(404).json({ message: "Session not found or stopped" });
    }
    if (session.expiresAt < new Date()) {
      session.active = false;
      await session.save();
      return res.status(410).json({ message: "Session expired" });
    }
    const point = { lat, lng, at: new Date() };
    session.lastLocation = point;
    session.locations.push(point);
    if (session.locations.length > 500) {
      session.locations = session.locations.slice(-500);
    }
    await session.save();
    res.json({ ok: true, at: point.at });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Stop
router.post("/:token/stop", async (req, res) => {
  const session = await LiveSession.findOne({ shareToken: req.params.token });
  if (!session) return res.status(404).json({ message: "Not found" });
  session.active = false;
  await session.save();
  res.json({ ok: true });
});

// Public read for trusted link (read-only)
router.get("/:token", async (req, res) => {
  const session = await LiveSession.findOne({ shareToken: req.params.token });
  if (!session) return res.status(404).json({ message: "Not found" });
  res.json({
    active: session.active && session.expiresAt > new Date(),
    expiresAt: session.expiresAt,
    lastLocation: session.lastLocation,
  });
});

module.exports = router; 