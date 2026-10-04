import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

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

const uploadsDir = process.env.VERCEL ? path.join("/tmp", "uploads") : path.join(__dirname, "backend", "uploads");
try {
  fs.mkdirSync(path.join(uploadsDir, "resumes"), { recursive: true });
  fs.mkdirSync(path.join(uploadsDir, "logos"), { recursive: true });
} catch (e) {}

// Serve uploaded files & fallback for missing files
app.use('/uploads', express.static(uploadsDir));

app.get('/uploads/resumes/:filename', async (req, res, next) => {
  try {
    const filename = req.params.filename;
    const resumePath = path.join(uploadsDir, "resumes", filename);
    if (fs.existsSync(resumePath)) {
      return res.sendFile(resumePath);
    }
    await connectDB();
    const Student = mongoose.model("Student");
    const resumeUrl = `/uploads/resumes/${filename}`;
    const student = await Student.findOne({
      $or: [
        { resumeLink: resumeUrl },
        { resumeLink: { $regex: filename } }
      ]
    });
    if (student && student.resumeData) {
      const pdfBuffer = Buffer.from(student.resumeData, "base64");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      return res.send(pdfBuffer);
    }
  } catch (err) {
    console.error("Resume stream error:", err);
  }
  next();
});

app.use('/uploads', (req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Resume File - CampusHire</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
        .card { background: white; padding: 40px 32px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; max-width: 440px; width: 100%; }
        .icon { font-size: 36px; margin-bottom: 16px; }
        h2 { margin: 0 0 10px; font-size: 1.35rem; color: #0f172a; }
        p { margin: 0 0 24px; color: #64748b; font-size: 0.95rem; line-height: 1.6; }
        .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 0.95rem; }
      </style>
    </head>
    <body>
        <div class="card">
          <div class="icon">📄</div>
          <h2>Resume File Not Found</h2>
          <p>The PDF file for this resume is not stored on the current server container. Please upload a new PDF resume from your Student Profile tab.</p>
          <a href="javascript:window.close()" class="btn">Close Tab</a>
        </div>
    </body>
    </html>
  `);
});

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
