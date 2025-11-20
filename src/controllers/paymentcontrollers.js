const Payment = require("../models/payment");
const Ride = require("../models/ride");
const User = require("../models/user");

// ===========================
// INITIATE PAYMENT
// ===========================
exports.initiatePayment = async (req, res) => {
  try {
    const { rideId } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (ride.status !== "completed")
      return res.status(400).json({ message: "Ride not completed yet" });

    const driver = await User.findById(ride.driver);
    const passenger = await User.findById(ride.passenger);

    const amount = ride.fare;
    const driverAmount = (amount * 80) / 100;
    const companyAmount = amount - driverAmount;

    // Create payment record
    const payment = await Payment.create({
      ride: ride._id,
      passenger: passenger._id,
      driver: driver._id,
      amount,
      driverAmount,
      companyAmount,
      status: "completed",
      paidAt: new Date(),
    });

    // Update driver's balance
    driver.balance += driverAmount;
    await driver.save();

    res.status(201).json({
      success: true,
      message: "Payment processed successfully",
      payment,
    });
  } catch (error) {
    console.error("Payment Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ===========================
// CONFIRM PAYMENT (Passenger confirms payment success)
// ===========================
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ message: "Payment ID is required" });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (payment.status !== "pending")
      return res.status(400).json({ message: "Payment already processed" });

    // Update driver balance
    const driver = await User.findById(payment.driver);
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    driver.balance += payment.driverAmount;
    await driver.save();

    // Mark payment as completed
    payment.status = "completed";
    payment.paidAt = new Date();
    await payment.save();

    res.status(200).json({
      success: true,
      message: "Payment confirmed successfully",
      payment,
    });
  } catch (error) {
    console.error("Confirm Payment Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


// ===========================
// GET PAYMENT HISTORY
// ===========================
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const payments = await Payment.find({
      $or: [{ passenger: userId }, { driver: userId }],
    }).populate("ride passenger driver");

    res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error("Payment History Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
