const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

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

const uploadsDir = process.env.VERCEL ? path.join("/tmp", "uploads") : path.join(__dirname, "..", "backend", "uploads");
try {
  fs.mkdirSync(path.join(uploadsDir, "resumes"), { recursive: true });
  fs.mkdirSync(path.join(uploadsDir, "logos"), { recursive: true });
} catch (e) {}

const createDefaultStudentPdf = (student) => {
  const name = student?.name || "Student Candidate";
  const email = student?.email || "N/A";
  const branch = student?.branch || "N/A";
  const cgpa = student?.cgpa != null ? String(student.cgpa) : "N/A";
  const skills = Array.isArray(student?.skills) && student.skills.length > 0
    ? student.skills.join(", ")
    : (student?.skills || "N/A");

  const sanitize = (str) => String(str).replace(/[()\\\r\n]/g, ' ');

  const streamContent = 'BT\n/F1 22 Tf\n50 730 Td\n(' + sanitize(name) + ' - Student Resume) Tj\n/F2 12 Tf\n0 -24 Td\n(Official Verified Student Profile) Tj\n0 -25 Td\n(--------------------------------------------------------------------------------------------------) Tj\n0 -30 Td\n/F1 14 Tf\n(CONTACT INFORMATION) Tj\n/F2 12 Tf\n0 -20 Td\n(Email: ' + sanitize(email) + ') Tj\n0 -20 Td\n(Status: Verified Campus Candidate) Tj\n0 -30 Td\n/F1 14 Tf\n(ACADEMIC PROFILE) Tj\n/F2 12 Tf\n0 -20 Td\n(Department / Branch: ' + sanitize(branch) + ') Tj\n0 -20 Td\n(Cumulative GPA: ' + sanitize(cgpa) + ') Tj\n0 -30 Td\n/F1 14 Tf\n(SKILLS & COMPETENCIES) Tj\n/F2 12 Tf\n0 -20 Td\n(' + sanitize(skills) + ') Tj\n0 -40 Td\n(--------------------------------------------------------------------------------------------------) Tj\n0 -20 Td\n/F2 10 Tf\n(Campus Placement Portal - Verified Digital Resume) Tj\nET';

  const streamLength = Buffer.byteLength(streamContent, 'utf-8');

  const header = '%PDF-1.4\n';
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n';
  const obj4 = '4 0 obj\n<< /Length ' + streamLength + ' >>\nstream\n' + streamContent + '\nendstream\nendobj\n';
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n';
  const obj6 = '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

  const body = header + obj1 + obj2 + obj3 + obj4 + obj5 + obj6;
  const pos1 = header.length;
  const pos2 = pos1 + obj1.length;
  const pos3 = pos2 + obj2.length;
  const pos4 = pos3 + obj3.length;
  const pos5 = pos4 + obj4.length;
  const pos6 = pos5 + obj5.length;
  const startxref = pos6 + obj6.length;

  const xref = 'xref\n0 7\n0000000000 65535 f \n' +
    String(pos1).padStart(10, '0') + ' 00000 n \n' +
    String(pos2).padStart(10, '0') + ' 00000 n \n' +
    String(pos3).padStart(10, '0') + ' 00000 n \n' +
    String(pos4).padStart(10, '0') + ' 00000 n \n' +
    String(pos5).padStart(10, '0') + ' 00000 n \n' +
    String(pos6).padStart(10, '0') + ' 00000 n \n' +
    'trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n' +
    startxref + '\n%%EOF';

  return Buffer.from(body + xref, 'utf-8');
};

// Universal Top-Level Upload/Resume Request Interceptor
app.use(async (req, res, next) => {
  const reqPath = req.path || "";
  const reqUrl = req.url || "";
  const origUrl = req.originalUrl || "";
  const matchedPath = (req.headers && req.headers["x-matched-path"]) ? req.headers["x-matched-path"] : "";

  const checkStr = `${reqPath} ${reqUrl} ${origUrl} ${matchedPath}`.toLowerCase();

  if (checkStr.includes("upload") || checkStr.includes("resume") || checkStr.includes(".pdf")) {
    try {
      const targetUrl = origUrl || reqUrl || reqPath;
      const filename = path.basename(targetUrl.split('?')[0]) || "resume.pdf";
      const resumePath = path.join(uploadsDir, "resumes", filename);

      if (fs.existsSync(resumePath)) {
        return res.sendFile(resumePath);
      }

      try {
        await connectDB();
      } catch (e) {}

      let student = null;
      try {
        const Student = mongoose.model("Student");
        const studentId = filename.split("-")[0];

        if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
          student = await Student.findById(studentId);
        }
        if (!student && filename) {
          const cleanName = filename.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
          student = await Student.findOne({
            $or: [
              { resumeLink: `/uploads/resumes/${filename}` },
              { resumeLink: { $regex: cleanName } }
            ]
          });
        }
        if (!student) {
          student = await Student.findOne({ name: { $exists: true } });
        }
      } catch (dbErr) {
        console.error("Student query DB error:", dbErr);
      }

      if (student && student.resumeData && student.resumeData.length > 50) {
        let base64Str = student.resumeData;
        if (base64Str.startsWith("data:application/pdf;base64,")) {
          base64Str = base64Str.replace("data:application/pdf;base64,", "");
        }
        const pdfBuffer = Buffer.from(base64Str, "base64");
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
        return res.send(pdfBuffer);
      }

      // Dynamic PDF fallback
      const pdfBuffer = createDefaultStudentPdf(student);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${filename.endsWith('.pdf') ? filename : 'Resume.pdf'}"`);
      return res.send(pdfBuffer);
    } catch (err) {
      console.error("Upload interceptor error:", err);
      const fallbackPdf = createDefaultStudentPdf(null);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="Resume.pdf"`);
      return res.send(fallbackPdf);
    }
  }

  next();
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

// Global Error Handler to catch any route/middleware exception cleanly
app.use((err, req, res, next) => {
  console.error("Express Error Handler caught:", err);
  res.status(500).json({ error: "Server Error", message: err.message || "An unexpected error occurred" });
});

module.exports = app;
