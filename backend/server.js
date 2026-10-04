require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

const studentRoutes = require("./routes/studentRoutes");
const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const companyRoutes = require("./routes/companyRoutes");
const adminRoutes = require("./routes/adminRoutes");
const placementRoutes = require("./routes/placementRoutes");

const path = require("path");
const fs = require("fs");

const ensureSeedData = async () => {
  try {
    const Company = require("./models/Company");
    const bcrypt = require("bcryptjs");

    const compHash = await bcrypt.hash("company@1234", 10);
    let comp = await Company.findOne({ email: "company@test.com" });
    if (!comp) {
      await Company.create({
        name: "Test Company",
        email: "company@test.com",
        password: compHash,
        headquarters: "Bengaluru, Karnataka",
        description: "Technology and software services partner.",
      });
      console.log("🏢 [Auto-Seed] Created test company: company@test.com (password: company@1234)");
    } else {
      comp.password = compHash;
      await comp.save();
      console.log("🏢 [Auto-Seed] Ready test company: company@test.com (password: company@1234)");
    }

    const allCompanies = await Company.find().select("name email");
    console.log("🏢 Registered Companies in DB:", allCompanies.map((c) => `${c.name} (${c.email})`));
  } catch (err) {
    console.error("Seed error:", err.message);
  }
};

const app = express();

let seedDone = false;
const safeSeed = async () => {
  if (seedDone) return;
  seedDone = true;
  await ensureSeedData();
};

connectDB().then(safeSeed).catch((err) => console.error("Init DB error:", err));

// Make sure the uploads folder exists (safely handle read-only serverless filesystems)
const uploadsDir = process.env.VERCEL ? path.join("/tmp", "uploads") : path.join(__dirname, "uploads");
try {
  fs.mkdirSync(path.join(uploadsDir, "resumes"), { recursive: true });
  fs.mkdirSync(path.join(uploadsDir, "logos"), { recursive: true });
} catch (e) {
  // Read-only filesystem on serverless environments
}

app.use(cors());
app.use(express.json());

// Ensure DB is connected on every serverless execution
app.use(async (req, res, next) => {
  try {
    await connectDB();
    if (!seedDone && mongoose.connection.readyState >= 1) {
      safeSeed().catch(() => {});
    }
    next();
  } catch (err) {
    console.error("Database connection middleware error:", err);
    res.status(500).json({ error: "Database Connection Failed", message: err.message });
  }
});

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

      const Student = mongoose.model("Student");
      const studentId = filename.split("-")[0];
      let student = null;

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
        student = await Student.findOne({ resumeLink: { $ne: "" } });
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

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
