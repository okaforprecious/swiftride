const express = require("express");
const router = express.Router();
const { requestRide } = require("../controllers/ridecontrollers");
const { protect } = require("../middleware/authmiddleware"); // your JWT middleware
const { acceptRide } = require("../controllers/ridecontrollers");
const { startRide } = require("../controllers/ridecontrollers");
const { completeRide } = require("../controllers/ridecontrollers");
const { getRideHistory } = require("../controllers/ridecontrollers");
const { cancelRide } = require("../controllers/ridecontrollers");
const { rateRide } = require("../controllers/ridecontrollers");


// Passenger requests a ride
router.post("/request", protect, requestRide);
router.post("/accept", protect, acceptRide)
router.post("/start", protect, startRide);
router.post("/complete", protect, completeRide);
router.get("/history", protect, getRideHistory);
router.patch("/cancel", protect, cancelRide);
router.post("/rate", protect, rateRide);

module.exports = router;
