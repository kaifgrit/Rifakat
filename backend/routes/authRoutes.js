// backend/routes/authRoutes.js

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

// Helper function to generate a token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "24h", // Token expires in 24 hours
  });
};

// @desc   Authenticate user & get token
// @route  POST /api/auth/login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Get the credentials from the secure .env file
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Check if submitted credentials match
  if (username === adminUsername && password === adminPassword) {
    // If they match, send a success response with the token
    res.json({
      success: true,
      message: "Login successful",
      // We use a simple payload 'admin' for the ID
      token: generateToken("admin"), 
    });
  } else {
    // If they don't match, send an error
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

module.exports = router;