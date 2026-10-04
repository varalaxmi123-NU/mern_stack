import express from "express";
import cors from "cors";
import mongoose from "mongoose";

// Ensure all Mongoose schemas are registered first
import "./backend/models/Company.js";
import "./backend/models/Student.js";
import "./backend/models/Job.js";
import "./backend/models/Admin.js";
import "./backend/models/Application.js";
import "./backend/models/Employee.js";
import "./backend/models/PlacementUpdate.js";

import connectDB from "./backend/config/db.js";
import studentRoutes from "./backend/routes/studentRoutes.js";
import authRoutes from "./backend/routes/authRoutes.js";
import jobRoutes from "./backend/routes/jobRoutes.js";
import companyRoutes from "./backend/routes/companyRoutes.js";
import adminRoutes from "./backend/routes/adminRoutes.js";
import placementRoutes from "./backend/routes/placementRoutes.js";

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

export default app;
