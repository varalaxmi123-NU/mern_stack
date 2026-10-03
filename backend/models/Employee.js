const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    designation: { type: String, default: "HR" }, // e.g. "HR", "Recruiter", "Hiring Manager"
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    companyName: { type: String, default: "" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    resetOtp: { type: String },
    resetOtpExpires: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
