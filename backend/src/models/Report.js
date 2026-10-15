
const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema(
  {
    voterId: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      enum: ["upvote", "downvote"],
      required: true,
    },
  },
  { _id: false }
);

const moderationHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["approved", "rejected"],
      required: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      default: "",
      maxlength: 500,
    },
  },
  { _id: false }
);

const geoSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (coordinates) =>
          Array.isArray(coordinates) &&
          coordinates.length === 2 &&
          coordinates.every(Number.isFinite) &&
          coordinates[0] >= -180 &&
          coordinates[0] <= 180 &&
          coordinates[1] >= -90 &&
          coordinates[1] <= 90,
        message: "Coordinates must be valid [longitude, latitude]",
      },
    },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    incidentType: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },

    geo: {
      type: geoSchema,
      default: undefined,
    },

    votes: {
      type: [voteSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved"],
      default: "pending",
    },

    moderationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    moderationHistory: {
      type: [moderationHistorySchema],
      default: [],
    },

    upvotes: {
      type: Number,
      default: 0,
      min: 0,
    },

    downvotes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ geo: "2dsphere" });

const Report = mongoose.models.Report || mongoose.model("Report", reportSchema);

module.exports = Report;
