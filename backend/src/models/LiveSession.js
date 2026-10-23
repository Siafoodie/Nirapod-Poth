const mongoose = require("mongoose");

const liveSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    shareToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // পুরনো "token" ফিল্ড রাখবেন না — থাকলে মুছুন
    active: { type: Boolean, default: true },
    expiresAt: { type: Date, required: true },
    contactIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Contact" }],
    locations: [
      {
        lat: Number,
        lng: Number,
        at: { type: Date, default: Date.now },
      },
    ],
    lastLocation: {
      lat: Number,
      lng: Number,
      at: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LiveSession", liveSessionSchema);  