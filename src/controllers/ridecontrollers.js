const Ride = require("../models/ride");
const User = require("../models/user");
const { calculateFare } = require("../utilis/farecalculator");


// ===========================
// REQUEST A NEW RIDE
// ===========================
exports.requestRide = async (req, res) => {
  try {
    const { pickup, destination, distanceKm } = req.body;

    // Basic validation
    if (!pickup || !destination || !distanceKm) {
      return res.status(400).json({ message: "Pickup and destination are required" });
    }

    // Calculate fare from distance
    const fare = calculateFare(distanceKm);

    // Create ride
    const ride = await Ride.create({
      passenger: req.user.id,
      pickup,
      destination,
      distanceKm,
      fare,
      pickupLocation: {
        address: pickup,
        coordinates: [0, 0], // placeholder until real coordinates come from frontend
      },
      dropoffLocation: {
        address: destination,
        coordinates: [0, 0],
      },
    });

    res.status(201).json({
      success: true,
      message: "Ride requested successfully",
      ride,
    });
  } catch (error) {
    console.error("❌ Request Ride Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ===========================
// DRIVER ACCEPTS A RIDE
// ===========================
exports.acceptRide = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { rideId } = req.body;

    const driver = await User.findById(driverId);
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    if (driver.role !== "driver")
      return res.status(403).json({ message: "Only drivers can accept rides" });

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.status !== "requested")
      return res.status(400).json({ message: "Ride is no longer available" });

    ride.driver = driverId;
    ride.status = notify("accepted", ride);;
    ride.acceptedAt = new Date();

    await ride.save();

    res.json({
      success: true,
      message: "Ride accepted successfully",
      ride,
    });
  } catch (error) {
    console.error("Accept Ride Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ===========================
// DRIVER STARTS A RIDE
// ===========================
exports.startRide = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { rideId } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.driver.toString() !== driverId)
      return res.status(403).json({ message: "You are not assigned to this ride" });

    if (ride.status !== "accepted")
      return res.status(400).json({ message: "Ride cannot be started yet" });

    ride.status = "ongoing";
    ride.startedAt = new Date();

    await ride.save();

    res.json({
      success: true,
      message: "Ride started successfully",
      ride,
    });
  } catch (error) {
    console.error("Start Ride Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ===========================
// DRIVER COMPLETES THE RIDE
// ===========================
exports.completeRide = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { rideId } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (ride.driver.toString() !== driverId)
      return res.status(403).json({ message: "Not your ride" });

    ride.status = notify("completed", ride);
    await ride.save();

    // Update driver's balance
    const driver = await User.findById(driverId);
    driver.balance += ride.fare;
    await driver.save();

    res.json({
      success: true,
      message: "Ride completed successfully",
      ride,
    });
  } catch (error) {
    console.error("Complete Ride Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


// ===========================
// GET RIDE HISTORY (Passenger or Driver)
// ===========================
exports.getRideHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let rides;

    if (userRole === "passenger") {
      rides = await Ride.find({ passenger: userId })
        .populate("driver", "name email phone")
        .sort({ createdAt: -1 });
    } else if (userRole === "driver") {
      rides = await Ride.find({ driver: userId })
        .populate("passenger", "name email phone")
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ message: "Invalid role" });
    }

    res.json({
      success: true,
      count: rides.length,
      rides,
    });
  } catch (error) {
    console.error("Get Ride History Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Cancel a ride (by passenger or driver)
// @route   PATCH /api/rides/cancel
// @access  Private
exports.cancelRide = async (req, res) => {
  try {
    const { rideId } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Only passenger or driver can cancel
    if (
      ride.passenger.toString() !== req.user.id &&
      ride.driver?.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ message: "You are not allowed to cancel this ride" });
    }

    // Only cancel if not completed
    if (ride.status === "completed") {
      return res
        .status(400)
        .json({ message: "Cannot cancel a completed ride" });
    }

    // Update status to cancelled
    ride.status =notify("cancelled", ride);;
    await ride.save();

    res.status(200).json({
      success: true,
      message: "Ride cancelled successfully",
      ride,
    });
  } catch (error) {
    console.error("❌ Cancel Ride Error:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const notify = (type, ride) => {
  const message = {
    accepted: `🚗 Driver ${ride.driver?.name || "N/A"} accepted your ride.`,
    started: `🛣️ Ride from ${ride.pickup} has started.`,
    completed: `✅ Ride completed successfully.`,
    cancelled: `❌ Ride cancelled.`,
  }[type];

  console.log("📩 Notification:", message);
};


// ===========================
// RATE RIDE CONTROLLER
// ===========================
exports.rateRide = async (req, res) => {
  try {
    const { rideId, rating, feedback } = req.body;

    // Validate required fields
    if (!rideId || rating == null) {
      return res.status(400).json({ message: "Ride ID and rating are required" });
    }

    // Validate rating value
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be a number between 1 and 5" });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    // Ensure only the passenger can rate the ride
    if (ride.passenger.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to rate this ride" });
    }

    // Update rating and optional feedback
    ride.rating = rating;
    ride.feedback = feedback || "";
    await ride.save();

    res.status(200).json({
      success: true,
      message: "Ride rated successfully",
      ride,
    });
  } catch (error) {
    console.error("Rate Ride Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
