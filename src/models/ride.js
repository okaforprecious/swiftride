const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema(
  {
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    pickupLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    dropoffLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    fare: {
      type: Number,
      required: false,
    },
    distance: {
      type: Number,
      required: false,
    },

rating: {
  type: Number,
  min: 1,
  max: 5,
},
feedback: {
  type: String,
  maxlength: 500,
},

    status: {
      type: String,
      enum: ["requested", "accepted", "in-progress", "completed", "cancelled"],
      default: "requested",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

rideSchema.index({ pickupLocation: "2dsphere" });
rideSchema.index({ dropoffLocation: "2dsphere" });

module.exports = mongoose.model("Ride", rideSchema);
