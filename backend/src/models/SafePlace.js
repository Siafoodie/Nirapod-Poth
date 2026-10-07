const mongoose = require('mongoose');

const safePlaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['police', 'hospital', 'fire-station', 'pharmacy', 'shelter'],
      required: true,
      lowercase: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (coordinates) =>
          coordinates.length === 2 &&
          coordinates[0] >= -180 &&
          coordinates[0] <= 180 &&
          coordinates[1] >= -90 &&
          coordinates[1] <= 90,
        message: 'Coordinates must be [longitude, latitude]',
      },
    },
    phone: {
      type: String,
      trim: true,
    },
    isOpen247: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

safePlaceSchema.index({ category: 1, name: 1 });

module.exports =
  mongoose.models.SafePlace || mongoose.model('SafePlace', safePlaceSchema);
