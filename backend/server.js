// backend/server.js

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
// Default port for local dev, Render will override with process.env.PORT
const PORT = 5000;

// --- CORRECTED CORS CONFIGURATION ---
const allowedOrigins = [
  // Local development origins
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5500", // Common port for Live Server extension
  "http://127.0.0.1:5500", // Common port for Live Server extension

  // --- ADDED THE SPECIFIC NETLIFY DEPLOY PREVIEW URL ---
  "https://68fd617c26aa8000082ca1f5--rifakatshoegarden.netlify.app",

  // --- KEPT YOUR MAIN NETLIFY URL ---
  "https://rifakatshoegarden.netlify.app",

  // Keep your previous production URL just in case
  "https://rifakat.onrender.com"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    // Or allow if the origin is in our list
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      console.error(msg); // Log blocked origins for easier debugging
      callback(new Error(msg), false);
    }
  },
  credentials: true // If you need cookies or authorization headers
}));
// --- END CORS ---

app.use(express.json()); // Middleware to parse JSON bodies

// --- Database Connection ---
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI not found in environment variables.");
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully! ✅");
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

connectDB(); // Initialize DB connection

// --- Import Routes ---
const productRoutes = require("./routes/productRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const authRoutes = require("./routes/authRoutes");

// --- Use Routes ---
app.use("/api/products", productRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/auth", authRoutes);

// --- Root route ---
app.get("/", (req, res) => {
  res.send("Rifakat Shoe Garden Backend is running...");
});

// --- Test route ---
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!", timestamp: new Date() });
});

// --- CORRECTED Server Listening for Render ---
// Use the port provided by Render's environment variable OR the local default
const serverPort = process.env.PORT || PORT;
app.listen(serverPort, () => {
  console.log(`✅ Server running on port ${serverPort}`);
  console.log(`📡 API available`);
  console.log('Allowed Origins for CORS:', allowedOrigins); // Log allowed origins
});
