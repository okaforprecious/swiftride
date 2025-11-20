const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ride",
    required: true,
  },
  passenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  driverAmount: {
    type: Number,
    required: true,
  },
  companyAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  paidAt: Date,
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
