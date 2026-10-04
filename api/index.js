const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// Ensure all Mongoose schemas are registered first
require("../backend/models/Company");
require("../backend/models/Student");
require("../backend/models/Job");
require("../backend/models/Admin");
require("../backend/models/Application");
require("../backend/models/Employee");
require("../backend/models/PlacementUpdate");

const connectDB = require("../backend/config/db");
const studentRoutes = require("../backend/routes/studentRoutes");
const authRoutes = require("../backend/routes/authRoutes");
const jobRoutes = require("../backend/routes/jobRoutes");
const companyRoutes = require("../backend/routes/companyRoutes");
const adminRoutes = require("../backend/routes/adminRoutes");
const placementRoutes = require("../backend/routes/placementRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Serverless DB connection middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("MongoDB Serverless Error:", err);
    res.status(500).json({ error: "Database Connection Failed", message: err.message });
  }
});

app.get(["/api", "/api/health", "/health"], (req, res) => {
  res.json({ status: "ok", message: "Campus Hire API is operational" });
});

app.use("/api/student", studentRoutes);
app.use("/student", studentRoutes);

app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);

app.use("/api/jobs", jobRoutes);
app.use("/jobs", jobRoutes);

app.use("/api/company", companyRoutes);
app.use("/company", companyRoutes);

app.use("/api/admin", adminRoutes);
app.use("/admin", adminRoutes);

app.use("/api/placements", placementRoutes);
app.use("/placements", placementRoutes);

// Global Error Handler to catch any route/middleware exception cleanly
app.use((err, req, res, next) => {
  console.error("Express Error Handler caught:", err);
  res.status(500).json({ error: "Server Error", message: err.message || "An unexpected error occurred" });
});

module.exports = app;
