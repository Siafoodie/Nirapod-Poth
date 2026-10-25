
const mongoose = require("mongoose");

const sosEventSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 150,
    },

    status: {
      type: String,
      enum: ["received"],
      default: "received",
    },

    receivedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SosEvent", sosEventSchema);
