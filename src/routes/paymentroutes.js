const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authmiddleware");
const {
  initiatePayment,
  confirmPayment,
  getPaymentHistory,
} = require("../controllers/paymentcontrollers");

// Initiate payment for completed ride
router.post("/initiate", protect, initiatePayment);

// Passenger confirms payment
router.post("/confirm", protect, confirmPayment);


// Get payment history
router.get("/history", protect, getPaymentHistory);

module.exports = router;
