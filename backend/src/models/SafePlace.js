const mongoose = require("mongoose");

const safePlaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["police", "hospital", "pharmacy", "shelter", "fire-station"],
      required: true,
      lowercase: true,
      trim: true,
    },
    address: { type: String, required: true, trim: true },
    // GeoJSON: [longitude, latitude]
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (c) =>
            Array.isArray(c) &&
            c.length === 2 &&
            c[0] >= -180 &&
            c[0] <= 180 &&
            c[1] >= -90 &&
            c[1] <= 90,
          message: "coordinates must be [lng, lat]",
        },
      },
    },
    // keep flat fields for older UI
    coordinates: { type: [Number] }, // [lng, lat]
    phone: { type: String, trim: true },
    isOpen247: { type: Boolean, default: false },
    city: { type: String, default: "Dhaka" },
    verified: { type: Boolean, default: true },
    source: { type: String, default: "manual-seed" },
  },
  { timestamps: true }
);

safePlaceSchema.index({ location: "2dsphere" });
safePlaceSchema.index({ category: 1, name: 1 });

module.exports =
  mongoose.models.SafePlace || mongoose.model("SafePlace", safePlaceSchema);  