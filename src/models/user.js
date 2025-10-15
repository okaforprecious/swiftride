const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["driver", "passenger", "admin"],
      default: "passenger",
    },
    avatar: {
      type: String,
      default:
        "https://api.dicebear.com/9.x/identicon/svg?seed=SwiftRideUser",
    },
    balance: {
      type: Number,
      default: 0,
    },

    // Driver-specific information
    carDetails: {
      model: String,
      plateNumber: String,
      color: String,
    },
    driverStatus: {
      type: String,
      enum: ["available", "on-trip", "offline"],
      default: "offline",
    },

    // 🌍 Real-time location tracking
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
        // emailVerificationCode: { type: String },
  // phoneVerificationCode: { type: String },
  // isEmailVerified: { type: Boolean, default: false },
  // isPhoneVerified: { type: Boolean, default: false },
  // pendingEmail: { type: String },
  // pendingPhone: { type: String },
// emailVerificationCode: { type: String },
// emailVerificationExpires: { type: Date },

    },
  },
  { timestamps: true } // adds createdAt and updatedAt
);

//
// 🔐 Password hashing before saving
//
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

//
// 🔑 Compare password
//
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//
// 🪪 Generate JWT token
//
userSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

//
// 📍 Update driver's location
//
userSchema.methods.updateLocation = async function (longitude, latitude) {
  this.location.coordinates = [longitude, latitude];
  this.location.lastUpdated = new Date();
  await this.save();
};

module.exports = mongoose.model("User", userSchema);
