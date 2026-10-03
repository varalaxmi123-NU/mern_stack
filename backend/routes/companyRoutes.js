const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getMyProfile,
  updateMyProfile,
  uploadCompanyLogo,
  deleteCompanyLogo,
  createJob,
  getMyJobs,
  updateJob,
  deleteJob,
  getAllStudentsForCompany,
  hireStudent,
  getMyHires,
  deleteMyHire,
  getJobApplicants,
  updateApplicationStatus,
  scheduleInterview,
  getCompanyEmployees,
  addCompanyEmployee,
  deleteCompanyEmployee,
} = require("../controllers/companyController");

// Multer storage for company logos
const logosDir = path.join(__dirname, "..", "uploads", "logos");
fs.mkdirSync(logosDir, { recursive: true });

const logoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, logosDir);
  },
  filename: function (req, file, cb) {
    cb(null, "logo-" + req.user.id + "-" + Date.now() + path.extname(file.originalname));
  },
});

const uploadLogo = multer({
  storage: logoStorage,
  fileFilter: function (req, file, cb) {
    const allowed = [".png", ".jpg", ".jpeg", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG or JPG image files (.png, .jpg, .webp) are allowed!"), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const logoUploadMiddleware = (req, res, next) => {
  uploadLogo.single("logo")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Invalid image file. Only PNG or JPG files are allowed." });
    }
    next();
  });
};

router.use(protect, authorize("company"));

router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);
router.post("/upload-logo", logoUploadMiddleware, uploadCompanyLogo);
router.delete("/logo", deleteCompanyLogo);

router.get("/jobs", getMyJobs);
router.post("/jobs", createJob);
router.put("/jobs/:id", updateJob);
router.delete("/jobs/:id", deleteJob);

router.get("/students", getAllStudentsForCompany);
router.post("/hire", hireStudent);
router.get("/hires", getMyHires);
router.delete("/hires/:id", deleteMyHire);

router.get("/jobs/:jobId/applicants", getJobApplicants);
router.put("/applications/:id/status", updateApplicationStatus);
router.put("/applications/:id/schedule-interview", scheduleInterview);

router.get("/employees", getCompanyEmployees);
router.post("/employees", addCompanyEmployee);
router.delete("/employees/:id", deleteCompanyEmployee);

module.exports = router;
