
const express = require("express");
const router = express.Router();
const SosEvent = require("../models/SosEvent");

router.post("/offline", async (req, res, next) => {
  try {
    console.log("SOS Request Body:", req.body);
    const { clientId } = req.body || {};

    if (
      typeof clientId !== "string" ||
      !clientId.trim() ||
      clientId.length > 150
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid clientId is required",
      });
    }

    const id = clientId.trim();

    const result = await SosEvent.findOneAndUpdate(
      { clientId: id },
      {
        $setOnInsert: {
          clientId: id,
          status: "received",
          receivedAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        includeResultMetadata: true,
      }
    );

    const created = Boolean(result.lastErrorObject?.upserted);

    return res.status(created ? 201 : 200).json({
      success: true,
      message: created
        ? "SOS event recorded successfully"
        : "SOS event already recorded",
      clientId: id,
      status: "received",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: "SOS event already recorded",
        status: "received",
      });
    }

    next(error);
  }
});

module.exports = router;
