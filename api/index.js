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
  const cgpa = student?.cgpa != null ? student.cgpa : "N/A";
  const skills = Array.isArray(student?.skills) ? student.skills.join(", ") : (student?.skills || "N/A");

  const pdfText = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 320 >>
stream
BT
/F1 22 Tf
50 720 Td
(${name.replace(/[()]/g, "")} - Student Resume) Tj
/F1 12 Tf
0 -36 Td
(Email: ${email.replace(/[()]/g, "")}) Tj
0 -22 Td
(Branch: ${branch.replace(/[()]/g, "")}) Tj
0 -22 Td
(CGPA: ${cgpa}) Tj
0 -22 Td
(Skills: ${skills.replace(/[()]/g, "")}) Tj
0 -40 Td
(Official Campus placement profile verified by CampusHire Portal.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000615 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
684
%%EOF`;

  return Buffer.from(pdfText, "utf-8");
};

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
    const studentId = filename.split("-")[0];
    let student = null;

    if (mongoose.Types.ObjectId.isValid(studentId)) {
      student = await Student.findById(studentId);
    }
    if (!student) {
      const cleanName = studentId.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      student = await Student.findOne({
        $or: [
          { resumeLink: `/uploads/resumes/${filename}` },
          { resumeLink: { $regex: cleanName } }
        ]
      });
    }

    if (student) {
      if (student.resumeData && student.resumeData.length > 50) {
        let base64Str = student.resumeData;
        if (base64Str.startsWith("data:application/pdf;base64,")) {
          base64Str = base64Str.replace("data:application/pdf;base64,", "");
        }
        const pdfBuffer = Buffer.from(base64Str, "base64");
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
        return res.send(pdfBuffer);
      } else {
        const fallbackPdf = createDefaultStudentPdf(student);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${(student.name || "Student").replace(/\s+/g, '_')}_Resume.pdf"`);
        return res.send(fallbackPdf);
      }
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

// Global Error Handler to catch any route/middleware exception cleanly
app.use((err, req, res, next) => {
  console.error("Express Error Handler caught:", err);
  res.status(500).json({ error: "Server Error", message: err.message || "An unexpected error occurred" });
});

module.exports = app;
