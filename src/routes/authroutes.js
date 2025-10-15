const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateDriverLocation,
  updateProfile,
  verifyEmail,
} = require("../controllers/authcontrollers");
const { protect } = require("../middleware/authmiddleware");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/profile", protect, getProfile);
router.patch("/driver/location", protect, updateDriverLocation);
router.patch("/profile", protect, updateProfile);
// router.post("/verify-email", protect, verifyEmail);



module.exports = router;
