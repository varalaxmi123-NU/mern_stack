require("dotenv").config();
const express = require("express");
const cors = require("cors");
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
connectDB().then(ensureSeedData);

// Make sure the uploads folder (and resumes subfolder) always exists so
// static serving below never 404s just because the directory is missing.
const uploadsDir = path.join(__dirname, "uploads");
fs.mkdirSync(path.join(uploadsDir, "resumes"), { recursive: true });
fs.mkdirSync(path.join(uploadsDir, "logos"), { recursive: true });
console.log(`📁 Serving uploaded files from: ${uploadsDir}`);
console.log(`   (if a resume 404s, check the exact file exists inside ${path.join(uploadsDir, "resumes")})`);

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// If a request for an uploaded file falls through (i.e. the file wasn't
// found by express.static above), return a helpful message
app.use('/uploads', (req, res) => {
  console.log(`⚠️  Requested file not found on disk: ${path.join(uploadsDir, req.path)}`);
  if (req.accepts('html')) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resume Not Found - CampusHire</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: white; padding: 40px 32px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; max-width: 440px; width: 100%; }
          .icon { width: 56px; height: 56px; background: #fee2e2; color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 26px; margin: 0 auto 20px; }
          h2 { margin: 0 0 10px; font-size: 1.35rem; color: #0f172a; }
          p { margin: 0 0 24px; color: #64748b; font-size: 0.95rem; line-height: 1.6; }
          .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 0.95rem; }
        </style>
      </head>
      <body>
          <div class="icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          </div>
          <h2>Resume Not Found</h2>
          <p>The resume file for this student was not found on the server or hasn't been uploaded yet. Please upload a new PDF resume from the Student Profile.</p>
          <a href="javascript:window.close()" class="btn">Close Tab</a>
        </div>
      </body>
      </html>
    `);
  }
  res.status(404).json({ message: `Resume file not found: ${req.path}` });
});

app.use("/api/student", studentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/placements", placementRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
