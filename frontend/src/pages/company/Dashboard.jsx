import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { resolveFileUrl } from "../../api/axios";
import UserMenu from "../../components/UserMenu";
import Toast from "../../components/Toast";
import { useConfirm } from "../../components/ConfirmDialog";
import "../Dashboard.css";

function CompanyDashboard() {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [students, setStudents] = useState([]);
  const [hires, setHires] = useState([]);
  const [tab, setTab] = useState("jobs");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const confirm = useConfirm();

  const BRANCH_OPTIONS = ["CSE", "ISE", "ECE", "EEE", "MECH", "CIVIL"];
  const [jobForm, setJobForm] = useState({ title: "", description: "", eligibility: "", package: "", location: "", minCgpa: "", allowedBranches: [], skills: "" });
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [hireSelections, setHireSelections] = useState({});
  const [applicantsData, setApplicantsData] = useState({});
  const [showApplicantsFor, setShowApplicantsFor] = useState(null);
  const [sortStudentsBy, setSortStudentsBy] = useState("cgpa_desc"); // "cgpa_desc", "skills_desc", "cgpa_asc", "name_asc", "recent"
  const [studentSkillSearch, setStudentSkillSearch] = useState("");
  const [studentStatusFilter, setStudentStatusFilter] = useState("all"); // "all", "notplaced", "placed"

  // Employees & Hiring Team state
  const [employees, setEmployees] = useState([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({ name: "", email: "", password: "", designation: "HR" });
  const [employeeError, setEmployeeError] = useState("");
  const [employeeSubmitting, setEmployeeSubmitting] = useState(false);

  const loadJobs = () => API.get("/company/jobs").then((res) => setJobs(res.data)).catch(() => setJobs([]));
  const loadProfile = () => {
    setProfileLoading(true);
    setProfileError("");
    API.get("/company/profile")
      .then((res) => setProfile(res.data))
      .catch((err) => setProfileError(err.response?.data?.message || "Couldn't load your company profile. Check your connection and try again."))
      .finally(() => setProfileLoading(false));
  };
  const loadStudents = () => API.get("/company/students").then((res) => setStudents(res.data)).catch(() => setStudents([]));
  const loadHires = () => API.get("/company/hires").then((res) => setHires(res.data)).catch(() => setHires([]));
  const loadEmployees = () => {
    setEmployeeLoading(true);
    API.get("/company/employees")
      .then((res) => setEmployees(res.data))
      .catch(() => setEmployees([]))
      .finally(() => setEmployeeLoading(false));
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const info = localStorage.getItem("userInfo");

    if (!token || role !== "company") { navigate("/login"); return; }
    if (info) setUser(JSON.parse(info));
    loadJobs();
    loadProfile();
    loadStudents();
    loadHires();
    loadEmployees();
  }, [navigate]);

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  // Re-fetch data for whichever tab is opened, so newly hired students,
  // new applicants, etc. show up without a full page refresh.
  const handleTabClick = (key) => {
    setTab(key);
    if (key === "jobs") loadJobs();
    else if (key === "profile") loadProfile();
    else if (key === "students") loadStudents();
    else if (key === "hires") loadHires();
    else if (key === "employees") loadEmployees();
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setEmployeeError("");
    if (!employeeForm.name.trim() || !employeeForm.email.trim() || !employeeForm.password) {
      setEmployeeError("Please fill in all required fields (Name, Email, Password).");
      return;
    }
    try {
      setEmployeeSubmitting(true);
      await API.post("/company/employees", employeeForm);
      setSuccess("Employee added successfully!");
      setEmployeeForm({ name: "", email: "", password: "", designation: "HR" });
      setShowAddEmployeeModal(false);
      loadEmployees();
    } catch (err) {
      setEmployeeError(err.response?.data?.message || "Failed to add employee.");
    } finally {
      setEmployeeSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (empId, empName) => {
    const ok = await confirm({
      title: `Remove ${empName || "Employee"}?`,
      message: "This employee will no longer have access to the company portal.",
      confirmLabel: "Remove Employee",
      danger: true,
    });
    if (!ok) return;
    try {
      await API.delete(`/company/employees/${empId}`);
      setSuccess("Employee removed successfully.");
      loadEmployees();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove employee.");
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!jobForm.title) { setError("Job title is required"); return; }
    try {
      await API.post("/company/jobs", jobForm);
      setSuccess("Job posted successfully!");
      setJobForm({ title: "", description: "", eligibility: "", package: "", location: "", minCgpa: "", allowedBranches: [], skills: "" });
      loadJobs();
      setTab("jobs");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post job");
    }
  };

  const handleDeleteJob = async (id) => {
    const ok = await confirm({
      title: "Delete this job posting?",
      message: "Students will no longer be able to see or apply to this job. This can't be undone.",
      confirmLabel: "Delete Job",
    });
    if (!ok) return;
    await API.delete(`/company/jobs/${id}`);
    loadJobs();
  };

  const handleViewApplicants = async (jobId) => {
    if (showApplicantsFor === jobId) {
      setShowApplicantsFor(null);
      return;
    }
    try {
      const res = await API.get(`/company/jobs/${jobId}/applicants`);
      setApplicantsData(prev => ({ ...prev, [jobId]: res.data }));
      setShowApplicantsFor(jobId);
    } catch (err) {
      console.error(err);
    }
  };

  const [scheduleModal, setScheduleModal] = useState(null); // { appId, jobId, date, link } | null

  const openScheduleModal = (appId, jobId) => {
    setScheduleModal({ appId, jobId, date: "", link: "" });
  };

  const closeScheduleModal = () => setScheduleModal(null);

  const submitScheduleInterview = async () => {
    if (!scheduleModal) return;
    const { appId, jobId, date, link } = scheduleModal;
    if (!date) { setError("Pick an interview date and time"); return; }
    if (!link) { setError("Add an interview link (Zoom/Meet/venue note)"); return; }
    try {
      // date comes from a <input type="datetime-local"> as "YYYY-MM-DDTHH:mm" (local time),
      // which the Date constructor parses correctly - converting straight to ISO for storage.
      const interviewDate = new Date(date).toISOString();
      await API.put(`/company/applications/${appId}/schedule-interview`, { interviewDate, interviewLink: link });
      const res = await API.get(`/company/jobs/${jobId}/applicants`);
      setApplicantsData(prev => ({ ...prev, [jobId]: res.data }));
      setSuccess("Interview scheduled successfully!");
      closeScheduleModal();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to schedule interview.");
    }
  };

  const handleToggleStatus = async (job) => {
    await API.put(`/company/jobs/${job._id}`, { status: job.status === "Open" ? "Closed" : "Open" });
    loadJobs();
  };

  const [savingProfile, setSavingProfile] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select a PNG or JPG image file.");
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    try {
      setUploadingLogo(true);
      setError("");
      const formData = new FormData();
      formData.append("logo", logoFile);
      const res = await API.post("/company/upload-logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess("Company logo updated successfully!");
      if (res.data?.logoUrl) {
        setProfile((prev) => ({ ...prev, logoUrl: res.data.logoUrl }));
      }
      setLogoFile(null);
      setLogoPreview(null);
      loadProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload company logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    const ok = await confirm({
      title: "Remove Company Logo",
      message: "Are you sure you want to remove your company logo? Your initials will be displayed instead.",
      confirmLabel: "Remove Logo",
    });
    if (!ok) return;
    try {
      await API.delete("/company/logo");
      setSuccess("Company logo removed.");
      setProfile((prev) => ({ ...prev, logoUrl: "" }));
      setLogoFile(null);
      setLogoPreview(null);
      loadProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove logo.");
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setSavingProfile(true);
    try {
      const res = await API.put("/company/profile", profile);
      // Trust what the server actually persisted, not just our local draft
      if (res.data?.company) setProfile(res.data.company);
      setSuccess("Profile saved — students will see these changes immediately.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // Case-insensitive check of whether a student clears a job's CGPA and
  // skill requirements - mirrors the backend's ATS logic (utils/atsMatch.js)
  // so the "All Students" hire flow can warn before hiring too, not just
  // the per-job Applicants panel.
  const getMatchWarning = (student, jobId) => {
    const job = jobs.find((j) => j._id === jobId);
    if (!job) return null;

    const cgpaOk = (student.cgpa ?? 0) >= (job.minCgpa || 0);
    const requiredSkills = (job.skills || []).map((s) => String(s).trim().toLowerCase()).filter(Boolean);
    const haveSkills = new Set((student.skills || []).map((s) => String(s).trim().toLowerCase()));
    const missing = requiredSkills.filter((s) => !haveSkills.has(s));

    if (cgpaOk && missing.length === 0) return null;

    const parts = [];
    if (!cgpaOk) parts.push(`CGPA ${student.cgpa ?? "N/A"} is below required ${job.minCgpa}`);
    if (missing.length) parts.push(`missing skills: ${missing.join(", ")}`);
    return `Does not meet "${job.title}" requirements — ${parts.join("; ")}`;
  };

  const updateSelection = (studentId, field, value) => {
    setHireSelections((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
  };

  const handleHire = async (studentId) => {
    setError(""); setSuccess("");
    const sel = hireSelections[studentId];
    if (!sel?.jobId) { setError("Pick which job you're hiring this student for first"); return; }
    try {
      await API.post("/company/hire", { studentId, jobId: sel.jobId, eligibility: sel.eligibility || "" });
      setSuccess("Student hired! This is now visible to every student.");
      loadStudents();
      loadHires();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to hire student");
    }
  };

  const handleUndoHire = async (hireId) => {
    const ok = await confirm({
      title: "Remove this hire?",
      message: "The student will go back to Not Placed status.",
      confirmLabel: "Remove Hire",
    });
    if (!ok) return;
    await API.delete(`/company/hires/${hireId}`);
    loadStudents();
    loadHires();
  };

  const navItems = [
    {
      key: "jobs",
      label: "My Job Postings",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      key: "post",
      label: "Post a Job",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
    },
    {
      key: "students",
      label: "Candidate Directory",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      key: "hires",
      label: "Selected Candidates",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
    {
      key: "employees",
      label: "Employees",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <polyline points="17 11 19 13 23 9" />
        </svg>
      ),
    },
    {
      key: "profile",
      label: "Company Profile",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
        </svg>
      ),
    },
  ];

  const pageTitle = {
    jobs:      "Your Job Postings",
    post:      "Post a New Job",
    students:  "Candidate Directory",
    hires:     "Selected Candidates (Hired)",
    employees: "Company Employees & Team",
    profile:   "Company Profile",
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "C";

  return (
    <div className="dash-container">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>CampusHire</h2>
          <span className="sidebar-tagline">Company Portal</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ key, label, icon }) => (
            <button
              key={key}
              className={`nav-item ${tab === key ? "active" : ""}`}
              onClick={() => handleTabClick(key)}
            >
              <span className="nav-item-icon">{icon}</span>
              <span className="nav-item-text">{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            {profile?.logoUrl ? (
              <div className="company-logo-frame company-logo-frame-sm">
                <img
                  src={resolveFileUrl(profile.logoUrl)}
                  alt={user?.name || "Company"}
                  className="company-logo-img"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </div>
            ) : (
              <div className="sidebar-user-avatar">{userInitial}</div>
            )}
            <div className="sidebar-user-info">
              <span className="user-name">{user?.name || "Company"}</span>
              <span className="user-role">{user?.isEmployee ? (user?.designation || "Employee") : "Company"}</span>
            </div>
          </div>
          <div className="sidebar-system-badge">
            <span>Portal Status</span>
            <span className="sidebar-system-status"><span className="sidebar-system-dot"></span> Live</span>
          </div>
          <button className="btn-logout-sidebar" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <h2>{pageTitle[tab]}</h2>
          <div className="header-meta">
            <UserMenu
              name={user?.name || "Company"}
              role="Company HR"
              email={user?.email}
              onDashboard={() => handleTabClick("jobs")}
              onProfile={() => handleTabClick("profile")}
              onSettings={() => handleTabClick("profile")}
              onSignOut={handleLogout}
            />
          </div>
        </header>

        <div className="toast-stack">
          <Toast message={error} type="error" onClose={() => setError("")} />
          <Toast message={success} type="success" onClose={() => setSuccess("")} />
        </div>

        <div className="content-body">
          {tab === "jobs" && (
            <div className="dash-section">
              <div className="dash-section-header">
                <h3>Your Job Postings <span className="dash-section-count">{jobs.length}</span></h3>
              </div>
              <div className="job-list">
                {jobs.length === 0 && (
                  <div className="empty-state"><p>No job postings yet. Use "Post a Job" to add one.</p></div>
                )}
                {jobs.map((job) => (
                  <div className="job-card" key={job._id}>
                    <div className="card-info">
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                        <h4 style={{ margin: 0 }}>{job.title}</h4>
                        <span className={`badge ${job.status === "Open" ? "badge-open" : "badge-closed"}`}>{job.status}</span>
                      </div>
                      <p>{job.description}</p>
                      <div className="job-meta">
                        {job.package && <span className="meta-tag">Package: {job.package}</span>}
                        {job.location && <span className="meta-tag">Location: {job.location}</span>}
                        {job.eligibility && <span className="meta-tag">Req: {job.eligibility}</span>}
                        {job.minCgpa > 0 && <span className="meta-tag">Min CGPA: {job.minCgpa}</span>}
                        {job.allowedBranches?.length > 0
                          ? <span className="meta-tag">Branches: {job.allowedBranches.join(", ")}</span>
                          : <span className="meta-tag">Branches: All</span>}
                      </div>
                    </div>
                    <div className="card-actions">
                      <button className="btn-secondary-sm" onClick={() => handleViewApplicants(job._id)}>
                        {showApplicantsFor === job._id ? "Hide Applicants" : "View Applicants"}
                      </button>
                      <button className="btn-primary-sm" onClick={() => handleToggleStatus(job)}>
                        {job.status === "Open" ? "Close Job" : "Reopen Job"}
                      </button>
                      <button className="btn-danger" onClick={() => handleDeleteJob(job._id)}>Delete</button>
                    </div>
                    
                    {showApplicantsFor === job._id && (
                      <div className="applicants-panel" style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px dashed var(--color-border)" }}>
                        <h5 style={{ marginBottom: "4px", color: "var(--color-primary)" }}>Applicants</h5>
                        {job.skills?.length > 0 && (
                          <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginBottom: "12px" }}>
                            Sorted by ATS resume match against: {job.skills.join(", ")}
                          </p>
                        )}
                        {(!applicantsData[job._id] || applicantsData[job._id].length === 0) ? (
                          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>No applicants yet.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {applicantsData[job._id].map(app => (
                              <div key={app._id} style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "10px", background: "var(--color-bg-hover)", borderRadius: "6px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                    <strong style={{ fontSize: "0.9rem", color: "var(--color-text)" }}>{app.student?.name}</strong>
                                    {app.match && app.match.score !== null && (
                                      <span
                                        className={`match-badge ${app.match.score >= 70 ? "match-high" : app.match.score >= 40 ? "match-mid" : "match-low"}`}
                                        title={app.match.missing.length ? `Missing: ${app.match.missing.join(", ")}` : "Matches every required skill"}
                                      >
                                        {app.match.score}% ATS Match
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                    {app.student?.resumeLink ? (
                                      <a
                                        href={resolveFileUrl(app.student.resumeLink)}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ fontSize: "0.78rem", fontWeight: 700, textDecoration: "none", color: "#4338ca", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "6px", padding: "5px 10px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                                      >
                                        View Resume
                                      </a>
                                    ) : (
                                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", padding: "5px 10px" }}>
                                        Resume not uploaded
                                      </span>
                                    )}
                                    <span className={`badge ${app.status === 'Hired' ? 'badge-placed' : (app.status === 'Rejected' ? 'badge-closed' : 'badge-open')}`} style={{ fontSize: "0.7rem", padding: "2px 6px" }}>{app.status}</span>
                                    {app.status === "Applied" && (
                                      <button onClick={() => openScheduleModal(app._id, job._id)} style={{ fontSize: "0.7rem", padding: "4px 8px", background: "var(--color-primary)", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Schedule Interview</button>
                                    )}
                                    {app.status === "Interview Scheduled" && (
                                      <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>{new Date(app.interviewDate).toLocaleDateString()}</span>
                                    )}
                                  </div>
                                </div>
                                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                                  {app.student?.branch || "N/A"} · CGPA: {app.student?.cgpa ?? "N/A"}
                                  {job.minCgpa > 0 && !app.cgpaOk && (
                                    <span style={{ color: "#dc2626", fontWeight: 600 }}> (below required {job.minCgpa})</span>
                                  )}
                                  {app.student?.skills?.length > 0 && ` · Skills: ${app.student.skills.join(", ")}`}
                                </span>
                                {app.match && app.match.missing?.length > 0 && (
                                  <span style={{ fontSize: "0.75rem", color: "#dc2626" }}>Missing skills: {app.match.missing.join(", ")}</span>
                                )}
                                {app.meetsRequirements === false ? (
                                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "4px 8px", width: "fit-content", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                      <line x1="12" y1="9" x2="12" y2="13"/>
                                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                                    </svg>
                                    Does not meet job requirements — candidate can still apply, but review before hiring
                                  </span>
                                ) : app.meetsRequirements === true ? (
                                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "4px 8px", width: "fit-content" }}>
                                    Meets all requirements for this job
                                  </span>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "post" && (
            <div className="dash-section">
              <div className="dash-section-header">
                <h3>Post a New Job Opening</h3>
              </div>
              <form className="dash-form" onSubmit={handlePostJob}>
                <label>Job Title
                  <input value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} placeholder="e.g. Software Engineer" />
                </label>
                <label>Description
                  <textarea rows="4" value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} placeholder="Role responsibilities, expectations..." />
                </label>
                <label>Eligibility Criteria (shown to students as text)
                  <input value={jobForm.eligibility} onChange={(e) => setJobForm({ ...jobForm, eligibility: e.target.value })} placeholder="e.g. CSE/ISE, CGPA 7+" />
                </label>
                <label>Minimum CGPA (optional)
                  <input type="number" step="0.1" min="0" max="10" value={jobForm.minCgpa} onChange={(e) => setJobForm({ ...jobForm, minCgpa: e.target.value })} placeholder="Leave blank for no minimum" />
                </label>
                <label className="full-span">
                  Eligible Branches (optional — leave all unchecked to allow every branch)
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "8px" }}>
                    {BRANCH_OPTIONS.map((b) => {
                      const checked = jobForm.allowedBranches.includes(b);
                      return (
                        <label
                          key={b}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: "6px",
                            padding: "6px 12px", borderRadius: "999px",
                            border: `1.5px solid ${checked ? "var(--color-primary)" : "var(--color-border)"}`,
                            background: checked ? "var(--color-primary)" : "var(--color-bg-subtle)",
                            color: checked ? "#fff" : "var(--color-text)",
                            fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s ease",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setJobForm((prev) => ({
                                ...prev,
                                allowedBranches: checked
                                  ? prev.allowedBranches.filter((x) => x !== b)
                                  : [...prev.allowedBranches, b],
                              }));
                            }}
                            style={{ display: "none" }}
                          />
                          {b}
                        </label>
                      );
                    })}
                  </div>
                </label>
                <label>Package
                  <input value={jobForm.package} onChange={(e) => setJobForm({ ...jobForm, package: e.target.value })} placeholder="e.g. 6 LPA" />
                </label>
                <label>Location
                  <input value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} placeholder="e.g. Bengaluru, Remote" />
                </label>
                <label className="full-span">Required Skills (comma-separated — enables ATS resume screening)
                  <input value={jobForm.skills} onChange={(e) => setJobForm({ ...jobForm, skills: e.target.value })} placeholder="e.g. React, Node.js, SQL, Python" />
                </label>
                <div className="publish-job-actions">
                  <button className="btn-publish-job" type="submit">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Publish Job
                  </button>
                </div>
              </form>
            </div>
          )}

          {tab === "students" && (() => {
            const filteredAndSortedStudents = students.filter((s) => {
              if (studentStatusFilter === "notplaced" && s.placementStatus === "Placed") return false;
              if (studentStatusFilter === "placed" && s.placementStatus !== "Placed") return false;
              if (studentSkillSearch.trim()) {
                const term = studentSkillSearch.trim().toLowerCase();
                const matchesSkill = s.skills?.some((sk) => sk.toLowerCase().includes(term));
                const matchesName = s.name?.toLowerCase().includes(term);
                const matchesBranch = s.branch?.toLowerCase().includes(term);
                if (!matchesSkill && !matchesName && !matchesBranch) return false;
              }
              return true;
            }).sort((a, b) => {
              if (sortStudentsBy === "cgpa_desc" || sortStudentsBy === "cgpa") {
                return (b.cgpa || 0) - (a.cgpa || 0);
              }
              if (sortStudentsBy === "cgpa_asc") {
                return (a.cgpa || 0) - (b.cgpa || 0);
              }
              if (sortStudentsBy === "skills_desc") {
                return (b.skills?.length || 0) - (a.skills?.length || 0);
              }
              if (sortStudentsBy === "name_asc") {
                return (a.name || "").localeCompare(b.name || "");
              }
              return 0; // "recent"
            });

            const isFilterActive = studentSkillSearch.trim() !== "" || studentStatusFilter !== "all" || sortStudentsBy !== "cgpa_desc";

            return (
              <div className="dash-section">
                <div className="dash-section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <h3>All Registered Students <span className="dash-section-count">{students.length}</span></h3>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    Showing <strong>{filteredAndSortedStudents.length}</strong> of {students.length}
                  </span>
                </div>
                <p style={{ color: "var(--color-text-muted)", marginBottom: 16, fontSize: "0.9rem" }}>
                  Filter candidates by resume skill keywords or academic merit, select a job, and hire directly.
                </p>

                {/* Filter and Sort Toolbar */}
                <div className="student-filter-toolbar">
                  <div className="filter-search-box">
                    <span className="filter-search-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Search skill keyword (e.g. React, Python, SQL)..."
                      value={studentSkillSearch}
                      onChange={(e) => setStudentSkillSearch(e.target.value)}
                    />
                  </div>

                  <select
                    className="filter-select"
                    value={sortStudentsBy}
                    onChange={(e) => setSortStudentsBy(e.target.value)}
                    title="Sort students"
                  >
                    <option value="cgpa_desc">Sort by: Highest CGPA</option>
                    <option value="skills_desc">Sort by: Most Skills (Resume)</option>
                    <option value="cgpa_asc">Sort by: Lowest CGPA</option>
                    <option value="name_asc">Sort by: Name (A to Z)</option>
                    <option value="recent">Sort by: Recently Registered</option>
                  </select>

                  <select
                    className="filter-select"
                    value={studentStatusFilter}
                    onChange={(e) => setStudentStatusFilter(e.target.value)}
                    title="Filter by placement status"
                  >
                    <option value="all">Status: All Candidates</option>
                    <option value="notplaced">Status: Not Placed</option>
                    <option value="placed">Status: Placed</option>
                  </select>

                  {isFilterActive && (
                    <button
                      type="button"
                      className="filter-reset-btn"
                      onClick={() => {
                        setStudentSkillSearch("");
                        setStudentStatusFilter("all");
                        setSortStudentsBy("cgpa_desc");
                      }}
                    >
                      Reset Filters
                    </button>
                  )}
                </div>

                <div className="list">
                  {filteredAndSortedStudents.length === 0 ? (
                    <div className="empty-state">
                      <p>No students match your filter criteria.</p>
                      {isFilterActive && (
                        <button
                          type="button"
                          className="btn-secondary-sm"
                          style={{ marginTop: 10 }}
                          onClick={() => {
                            setStudentSkillSearch("");
                            setStudentStatusFilter("all");
                            setSortStudentsBy("cgpa_desc");
                          }}
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredAndSortedStudents.map((s) => {
                      const searchLower = studentSkillSearch.trim().toLowerCase();
                      return (
                        <div className="row-card" key={s._id}>
                          <div className="card-info">
                            <h4>
                              {s.name}
                              {s.cgpa >= 9 && <span className="top-performer-badge" title="Top CGPA">Top Performer</span>}
                            </h4>
                            <p>{s.email}{s.branch ? ` · ${s.branch}` : ""}{s.cgpa != null ? ` · CGPA ${s.cgpa}` : ""}</p>
                            
                            {s.skills?.length > 0 && (
                              <div className="student-skills-list">
                                {s.skills.map((skill, i) => {
                                  const isMatched = searchLower && skill.toLowerCase().includes(searchLower);
                                  return (
                                    <span
                                      key={i}
                                      className={`student-skill-chip ${isMatched ? "student-skill-chip-matched" : ""}`}
                                    >
                                      {skill}
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                              <span className={`badge ${s.placementStatus === "Placed" ? "badge-placed-subtle" : "badge-notplaced"}`}>
                                {s.placementStatus === "Placed" ? `✓ Placed @ ${s.placedCompany}` : "Active Candidate"}
                              </span>
                              {s.resumeLink ? (
                                <a
                                  href={resolveFileUrl(s.resumeLink)}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ fontSize: "0.78rem", fontWeight: 700, textDecoration: "none", color: "#4338ca", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "6px", padding: "3px 9px" }}
                                >
                                  View Resume
                                </a>
                              ) : (
                                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", padding: "3px 9px" }}>
                                  Resume not uploaded
                                </span>
                              )}
                            </div>
                          </div>

                          {s.placementStatus !== "Placed" && (
                            <div className="company-hire-box">
                              <div className="company-hire-actions">
                                <select
                                  className="company-job-select"
                                  value={hireSelections[s._id]?.jobId || ""}
                                  onChange={(e) => updateSelection(s._id, "jobId", e.target.value)}
                                >
                                  <option value="">Select job</option>
                                  {jobs.filter((j) => j.status === "Open").map((j) => (
                                    <option key={j._id} value={j._id}>{j.title}</option>
                                  ))}
                                </select>
                                <input
                                  className="company-criteria-input"
                                  placeholder="Criteria (optional)"
                                  value={hireSelections[s._id]?.eligibility || ""}
                                  onChange={(e) => updateSelection(s._id, "eligibility", e.target.value)}
                                />
                                <button className="btn-primary-sm company-hire-btn" onClick={() => handleHire(s._id)}>Hire</button>
                              </div>
                              {hireSelections[s._id]?.jobId && (
                                getMatchWarning(s, hireSelections[s._id].jobId) ? (
                                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "4px 8px", maxWidth: 320, textAlign: "right" }}>
                                    {getMatchWarning(s, hireSelections[s._id].jobId)}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "4px 8px" }}>
                                    Meets all requirements for this job
                                  </span>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })()}

          {tab === "hires" && (
            <div className="dash-section">
              <div className="dash-section-header">
                <h3>Students You've Hired <span className="dash-section-count">{hires.length}</span></h3>
              </div>
              <div className="list">
                {hires.length === 0 && (
                  <div className="empty-state"><p>No hires recorded yet.</p></div>
                )}
                {hires.map((h) => (
                  <div className="row-card" key={h._id}>
                    <div className="card-info">
                      <h4>{h.studentName}</h4>
                      <p>{[h.jobTitle, h.package].filter(Boolean).join(" · ")}</p>
                      {h.eligibility && <p>Criteria: {h.eligibility}</p>}
                    </div>
                    <div className="card-actions">
                      <button className="btn-danger" onClick={() => handleUndoHire(h._id)}>Undo</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "employees" && (
            <div className="dash-section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: 14 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" }}>
                    Company Employees
                  </h3>
                  <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.9rem" }}>
                    Manage employees who are part of your company.
                  </p>
                </div>
                <button
                  className="btn-primary-sm"
                  onClick={() => { setShowAddEmployeeModal(true); setEmployeeError(""); }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: "10px", fontSize: "0.9rem" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <line x1="20" y1="8" x2="20" y2="14"/>
                    <line x1="23" y1="11" x2="17" y2="11"/>
                  </svg>
                  + Add Employee
                </button>
              </div>

              {employeeLoading ? (
                <div className="empty-state"><p>Loading team members...</p></div>
              ) : employees.length === 0 ? (
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "50px 20px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <div style={{ width: "54px", height: "54px", borderRadius: "16px", background: "#eef2ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <h4 style={{ margin: "0 0 8px", fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" }}>No employees added yet</h4>
                  <p style={{ margin: "0 auto 20px", maxWidth: "420px", color: "#64748b", fontSize: "0.9rem", lineHeight: 1.6 }}>
                    Give your HRs, technical recruiters, and coordinators access to this company portal by adding them as employees.
                  </p>
                  <button
                    className="btn-primary-sm"
                    onClick={() => { setShowAddEmployeeModal(true); setEmployeeError(""); }}
                  >
                    + Add Your First Employee
                  </button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "18px" }}>
                  {employees.map((emp) => (
                    <div
                      key={emp._id}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "14px",
                        padding: "20px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div
                              style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "10px",
                                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                                color: "#ffffff",
                                fontWeight: 800,
                                fontSize: "1.05rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {emp.name ? emp.name.charAt(0).toUpperCase() : "E"}
                            </div>
                            <div>
                              <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>{emp.name}</h4>
                              <span style={{ fontSize: "0.82rem", color: "#64748b" }}>{emp.email}</span>
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: "0.74rem",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              padding: "3px 9px",
                              borderRadius: "6px",
                              background: "#eef2ff",
                              color: "#4338ca",
                              border: "1px solid #c7d2fe",
                            }}
                          >
                            {emp.designation || "HR"}
                          </span>
                        </div>

                        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px", marginTop: "12px", fontSize: "0.82rem", color: "#64748b", display: "flex", justifyContent: "space-between" }}>
                          <span>Status: <strong style={{ color: "#16a34a" }}>Active</strong></span>
                          <span>Added: {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : "Recent"}</span>
                        </div>
                      </div>

                      <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #f8fafc", display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => handleDeleteEmployee(emp._id, emp.name)}
                          style={{
                            background: "#fff1f2",
                            border: "1px solid #fecdd3",
                            color: "#e11d48",
                            padding: "6px 14px",
                            borderRadius: "8px",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "#fff1f2"; }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Employee Modal */}
              {showAddEmployeeModal && (
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(15, 23, 42, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                    padding: 16,
                  }}
                  onClick={() => setShowAddEmployeeModal(false)}
                >
                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: 16,
                      border: "1px solid #e2e8f0",
                      padding: 28,
                      width: "100%",
                      maxWidth: 480,
                      boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                      <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                        Add Company Employee
                      </h3>
                      <button
                        onClick={() => setShowAddEmployeeModal(false)}
                        style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "#64748b", padding: 0 }}
                      >
                        ×
                      </button>
                    </div>

                    {employeeError && (
                      <div className="error-box" style={{ marginBottom: 16 }}>{employeeError}</div>
                    )}

                    <form onSubmit={handleAddEmployee}>
                      <div className="form-group" style={{ marginBottom: 14 }}>
                        <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: "0.88rem", color: "#334155" }}>
                          Employee Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Rahul Kumar"
                          value={employeeForm.name}
                          onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                          required
                          style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: "0.95rem" }}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 14 }}>
                        <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: "0.88rem", color: "#334155" }}>
                          Work Email *
                        </label>
                        <input
                          type="email"
                          placeholder="e.g. rahul@testcompany.com"
                          value={employeeForm.email}
                          onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                          required
                          style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: "0.95rem" }}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 14 }}>
                        <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: "0.88rem", color: "#334155" }}>
                          Password *
                        </label>
                        <input
                          type="password"
                          placeholder="Create employee password"
                          value={employeeForm.password}
                          onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                          required
                          style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: "0.95rem" }}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 20 }}>
                        <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: "0.88rem", color: "#334155" }}>
                          Designation / Role *
                        </label>
                        <select
                          value={employeeForm.designation}
                          onChange={(e) => setEmployeeForm({ ...employeeForm, designation: e.target.value })}
                          style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: "0.95rem", background: "#fff" }}
                        >
                          <option value="HR">HR</option>
                          <option value="Recruiter">Recruiter</option>
                          <option value="Talent Acquisition Lead">Talent Acquisition Lead</option>
                          <option value="Hiring Manager">Hiring Manager</option>
                          <option value="Technical Interviewer">Technical Interviewer</option>
                        </select>
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                        <button
                          type="button"
                          className="btn-secondary-sm"
                          onClick={() => setShowAddEmployeeModal(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn-primary-sm"
                          disabled={employeeSubmitting}
                        >
                          {employeeSubmitting ? "Adding..." : "Add Employee"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "profile" && (
            <div className="dash-section">
              <div className="dash-section-header">
                <h3>Update Company Profile</h3>
              </div>

              {profileLoading && (
                <div className="empty-state"><p>Loading your profile...</p></div>
              )}

              {!profileLoading && profileError && (
                <div className="empty-state">
                  <p>{profileError}</p>
                  <button className="btn-primary-sm" style={{ marginTop: 10 }} onClick={loadProfile}>Retry</button>
                </div>
              )}

              {!profileLoading && !profileError && profile && (
                <>
                  {/* Optional Company Logo Upload Section */}
                  <div className="logo-upload-card" style={{ marginBottom: 24, padding: "20px", background: "var(--color-bg-subtle, #ffffff)", border: "1.5px solid var(--color-border)", borderRadius: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                      <h4 style={{ margin: 0, fontSize: "1.05rem", color: "var(--color-text)" }}>
                        Company Logo <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 500 }}>(Optional — PNG / JPG)</span>
                      </h4>
                      {profile?.logoUrl && (
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#10b981", background: "#ecfdf5", padding: "2px 8px", borderRadius: 999 }}>
                          Logo Active
                        </span>
                      )}
                    </div>
                    <p style={{ margin: "0 0 16px 0", fontSize: "0.86rem", color: "var(--color-text-muted)" }}>
                      Upload your official company logo in PNG format. It will be converted and fixed to the proper size across all job listings, student views, and placement cards.
                    </p>

                    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                      <div className="company-logo-frame company-logo-frame-lg">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo preview" className="company-logo-img" />
                        ) : profile?.logoUrl ? (
                          <img
                            src={resolveFileUrl(profile.logoUrl)}
                            alt={`${user?.name || "Company"} logo`}
                            className="company-logo-img"
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        ) : (
                          <div className="company-logo-placeholder" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12 }}>
                            {(user?.name || "C").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <label className="btn-secondary-sm" style={{ cursor: "pointer", margin: 0, display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <span>{profile?.logoUrl || logoPreview ? "Change Logo (.png)" : "Choose Logo (.png)"}</span>
                            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoSelect} style={{ display: "none" }} />
                          </label>

                          {logoFile && (
                            <button
                              type="button"
                              className="btn-primary-sm"
                              onClick={handleUploadLogo}
                              disabled={uploadingLogo}
                            >
                              {uploadingLogo ? "Uploading..." : "Save Logo"}
                            </button>
                          )}

                          {profile?.logoUrl && !logoFile && (
                            <button
                              type="button"
                              className="btn-danger-sm"
                              onClick={handleRemoveLogo}
                              style={{ background: "transparent", color: "#ef4444", border: "1px solid #fecaca", padding: "6px 12px", borderRadius: 8, fontSize: "0.82rem", cursor: "pointer" }}
                            >
                              Remove Logo
                            </button>
                          )}
                        </div>

                        {logoFile ? (
                          <span style={{ fontSize: "0.82rem", color: "#047857", fontWeight: 600 }}>
                            Selected: {logoFile.name} — Click "Save Logo" to apply.
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                            PNG recommended with transparent or white background. Max 5MB.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <form className="dash-form" onSubmit={handleProfileSave}>
                    <label>Headquarters
                      <input value={profile.headquarters || ""} onChange={(e) => setProfile({ ...profile, headquarters: e.target.value })} placeholder="e.g. Bangalore, Karnataka" />
                    </label>
                    <label>Description
                      <textarea rows="4" value={profile.description || ""} onChange={(e) => setProfile({ ...profile, description: e.target.value })} placeholder="About your company..." />
                    </label>
                    <label>Eligibility Criteria
                      <input value={profile.eligibility || ""} onChange={(e) => setProfile({ ...profile, eligibility: e.target.value })} placeholder="e.g. CSE/ISE, CGPA 7+" />
                    </label>
                    <label>Recruitment Process
                      <input value={profile.recruitmentProcess || ""} onChange={(e) => setProfile({ ...profile, recruitmentProcess: e.target.value })} placeholder="e.g. Online Test → Technical Interview → HR" />
                    </label>
                    <label>Skills Tested
                      <input value={profile.skillsTested || ""} onChange={(e) => setProfile({ ...profile, skillsTested: e.target.value })} placeholder="e.g. DSA, System Design, SQL" />
                    </label>
                    <button className="btn-primary-full" type="submit" disabled={savingProfile}>
                      {savingProfile ? "Saving..." : "Save Profile"}
                    </button>
                  </form>

                  <div style={{ marginTop: 30, padding: 16, background: "var(--color-bg-hover)", borderRadius: 8, border: "1px solid var(--color-border)" }}>
                    <h4 style={{ marginBottom: 12, color: "var(--color-primary)" }}>How students see you</h4>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      {profile.logoUrl ? (
                        <div className="company-logo-frame">
                          <img
                            src={resolveFileUrl(profile.logoUrl)}
                            alt={`${user?.name || "Company"} logo`}
                            className="company-logo-img"
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        </div>
                      ) : (
                        <div className="company-logo-frame company-logo-placeholder">
                          {(user?.name || "C").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <strong style={{ fontSize: "1rem" }}>{user?.name}</strong>
                    </div>
                    {profile.description && <p style={{ marginBottom: 12, color: "var(--color-text)" }}>{profile.description}</p>}
                    <div className="job-meta">
                      {profile.headquarters && <span className="meta-tag">HQ: {profile.headquarters}</span>}
                      {profile.eligibility && <span className="meta-tag">Req: {profile.eligibility}</span>}
                      {profile.skillsTested && <span className="meta-tag">Skills: {profile.skillsTested}</span>}
                    </div>
                    {!profile.description && !profile.headquarters && !profile.eligibility && !profile.skillsTested && (
                      <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                        Nothing filled in yet — students will only see your company name until you save some details above.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}


        </div>
      </main>

      {scheduleModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
          onClick={closeScheduleModal}
        >
          <div
            style={{ background: "var(--color-bg-subtle, #fff)", borderRadius: 12, border: "1px solid var(--color-border)", padding: 24, width: "100%", maxWidth: 380, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: 16, color: "var(--color-text)" }}>Schedule Interview</h3>

            <label style={{ display: "block", marginBottom: 14 }}>
              <span style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 6 }}>Date &amp; Time</span>
              <input
                type="datetime-local"
                value={scheduleModal.date}
                onChange={(e) => setScheduleModal({ ...scheduleModal, date: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-sm)", fontSize: "0.9rem", fontFamily: "var(--font-sans)", background: "var(--color-bg-subtle)", color: "var(--color-text)", boxSizing: "border-box" }}
              />
            </label>

            <label style={{ display: "block", marginBottom: 20 }}>
              <span style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 6 }}>Interview Link / Venue</span>
              <input
                type="text"
                placeholder="e.g. Zoom/Meet URL or room number"
                value={scheduleModal.link}
                onChange={(e) => setScheduleModal({ ...scheduleModal, link: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-sm)", fontSize: "0.9rem", fontFamily: "var(--font-sans)", background: "var(--color-bg-subtle)", color: "var(--color-text)", boxSizing: "border-box" }}
              />
            </label>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn-secondary-sm" onClick={closeScheduleModal}>Cancel</button>
              <button className="btn-primary-sm" onClick={submitScheduleInterview}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyDashboard;
