import { createRequire } from "module";
import fs from "fs";

const require = createRequire(import.meta.url);

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

let backendDir = "./backend";
if (!fs.existsSync(backendDir) && fs.existsSync("../../backend")) {
  backendDir = "../../backend";
}

const connectDB = require(`${backendDir}/config/db`);
const studentRoutes = require(`${backendDir}/routes/studentRoutes`);
const authRoutes = require(`${backendDir}/routes/authRoutes`);
const jobRoutes = require(`${backendDir}/routes/jobRoutes`);
const companyRoutes = require(`${backendDir}/routes/companyRoutes`);
const adminRoutes = require(`${backendDir}/routes/adminRoutes`);
const placementRoutes = require(`${backendDir}/routes/placementRoutes`);

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
