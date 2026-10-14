const mongoose = require("mongoose");
const { MODERATION_STATUS } = require("../utils/moderationConstants");

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
      required: true,
      trim: true,
    },

    geo: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: (coordinates) =>
            coordinates.length === 2 &&
            coordinates[0] >= -180 &&
            coordinates[0] <= 180 &&
            coordinates[1] >= -90 &&
            coordinates[1] <= 90,
          message: "Coordinates must be [longitude, latitude] within valid ranges",
        },
      },
    },

    votes: {
      type: [voteSchema],
      default: [],
    },

    status: {
      type: String,
      enum: Object.values(MODERATION_STATUS),
      default: MODERATION_STATUS.PENDING,
    },

    moderationComment: {
      type: String,
      trim: true,
      default: "",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
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