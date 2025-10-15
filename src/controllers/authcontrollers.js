const User = require("../models/user");
// const sendEmail = require("../utilis/sendemail"); // ✅ Corrected import name and path
const { validationResult } = require("express-validator");

// ===========================
// REGISTER USER
// ===========================
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { name, email, password, phone, role, carDetails } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role,
      carDetails: role === "driver" ? carDetails : undefined,
    });

    // Generate token
    const token = user.generateToken();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        balance: user.balance,
        driverStatus: user.driverStatus,
      },
    });
  } catch (err) {
    console.error("❌ Registration Error:", err.message);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// ===========================
// LOGIN USER
// ===========================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    const token = user.generateToken();

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        balance: user.balance,
        driverStatus: user.driverStatus,
      },
    });
  } catch (err) {
    console.error("❌ Login Error:", err.message);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// ===========================
// GET USER PROFILE
// ===========================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        balance: user.balance,
        driverStatus: user.driverStatus,
        location: user.location,
        carDetails: user.carDetails,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("❌ Get Profile Error:", err.message);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// ===========================
// UPDATE DRIVER LOCATION
// ===========================
exports.updateDriverLocation = async (req, res) => {
  try {
    const { longitude, latitude } = req.body;

    if (!longitude || !latitude)
      return res
        .status(400)
        .json({ message: "Longitude and latitude are required" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role !== "driver")
      return res
        .status(403)
        .json({ message: "Only drivers can update location" });

    await user.updateLocation(longitude, latitude);

    res.status(200).json({
      success: true,
      message: "Driver location updated successfully",
      location: user.location,
    });
  } catch (err) {
    console.error("❌ Location Update Error:", err.message);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// ===========================
// UPDATE USER PROFILE (simplified - no email verification)
// ===========================
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, carDetails } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Update name
    if (name) user.name = name;

    // ✅ Update email (check if already in use)
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail)
        return res.status(400).json({ message: "Email already in use" });
      user.email = email;
    }

    // ✅ Update phone
    if (phone) user.phone = phone;

    // ✅ Update car details (for drivers only)
    if (carDetails && user.role === "driver") {
      user.carDetails = { ...user.carDetails, ...carDetails };
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        carDetails: user.carDetails,
      },
    });
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
