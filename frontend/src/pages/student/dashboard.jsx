import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { resolveFileUrl } from "../../api/axios";
import UserMenu from "../../components/UserMenu";
import Toast from "../../components/Toast";
import "../Dashboard.css";

function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("jobs");
  const [jobs, setJobs] = useState([]);
  const [feed, setFeed] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Profile form state
  const [profileForm, setProfileForm] = useState({ branch: "", cgpa: "", resumeLink: "", skills: "" });
  const [resumeFileName, setResumeFileName] = useState("");

  const loadJobs = () => API.get("/jobs").then((res) => setJobs(res.data)).catch(() => setJobs([]));
  const loadPlacements = () => API.get("/placements").then((res) => setFeed(res.data)).catch(() => setFeed([]));
  const loadCompanies = () => API.get("/student/companies").then((res) => setCompanies(res.data)).catch(() => setCompanies([]));
  const loadApplications = () => API.get("/student/applications").then((res) => setApplications(res.data)).catch(() => setApplications([]));
  
  const loadProfile = () => {
    API.get("/student/profile").then((res) => {
      setUser(res.data);
      setProfileForm({
        branch: res.data.branch || "",
        cgpa: res.data.cgpa || "",
        resumeLink: res.data.resumeLink || "",
        skills: (res.data.skills || []).join(", ")
      });
    }).catch(() => {});
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "student") { navigate("/login"); return; }
    
    loadProfile();
    loadJobs();
    loadPlacements();
    loadCompanies();
    loadApplications();
  }, [navigate]);

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  // Re-fetch the data for whichever tab the student opens, so anything a
  // company or admin just did (e.g. scheduling an interview) shows up
  // immediately instead of needing a full page refresh.
  const handleTabClick = (key) => {
    setTab(key);
    if (key === "jobs") loadJobs();
    else if (key === "applications") loadApplications();
    else if (key === "placements") loadPlacements();
    else if (key === "companies") loadCompanies();
    else if (key === "profile") loadProfile();
  };

  const handleApply = async (jobId) => {
    setError(""); setSuccess("");
    try {
      await API.post(`/student/jobs/${jobId}/apply`);
      setSuccess("Successfully applied for the job!");
      loadApplications();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to apply");
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      await API.put("/student/profile", profileForm);
      setSuccess("Profile updated successfully!");
      loadProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Only PDF files (.pdf) are allowed.");
      e.target.value = "";
      return;
    }

    setResumeFileName(file.name);
    const formData = new FormData();
    formData.append("resume", file);
    try {
      setError(""); setSuccess("Uploading resume...");
      const res = await API.post("/student/upload-resume", formData, { headers: { "Content-Type": "multipart/form-data" }});
      setSuccess(res.data.message);
      loadProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload resume");
    }
  };

  const handleViewResume = async (e) => {
    e.preventDefault();
    if (!user?.resumeLink) return;
    const url = resolveFileUrl(user.resumeLink);
    if (/^https?:\/\//i.test(url)) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (!res.ok) {
        setError("Resume file not found on the server container. Please upload your latest resume again using the button below.");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const navItems = [
    {
      key: "jobs",
      label: "Job Board",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      key: "applications",
      label: "My Applications",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
    {
      key: "placements",
      label: "Placement Feed",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
    {
      key: "companies",
      label: "Company Directory",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
        </svg>
      ),
    },
    {
      key: "profile",
      label: "My Profile",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  const pageTitle = {
    jobs:         "Open Job Listings",
    applications: "My Applications",
    placements:   "Recent Placements",
    companies:    "Company Directory",
    profile:      "My Student Profile",
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "S";
  
  // Create a Set of job IDs the user has applied to for easy checking.
  // Guard against orphaned applications (their job/company was deleted by
  // an admin) so a missing app.job doesn't crash the whole dashboard.
  const appliedJobIds = new Set(
    applications.filter(app => app.job).map(app => app.job._id || app.job)
  );
  const visibleApplications = applications.filter(app => app.job && app.company);

  return (
    <div className="dash-container">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>CampusHire</h2>
          <span className="sidebar-tagline">Student Portal</span>
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
            <div className="sidebar-user-avatar">{userInitial}</div>
            <div className="sidebar-user-info">
              <span className="user-name">{user?.name || "Student"}</span>
              <span className="user-role">Student</span>
            </div>
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
              name={user?.name || "Student"}
              role="Student"
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
              {visibleApplications.filter((a) => a.status === "Interview Scheduled" || a.interviewLink).map((app) => (
                <div key={`banner-${app._id}`} style={{
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.12))",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  borderRadius: "14px",
                  padding: "16px 20px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  flexWrap: "wrap",
                  boxShadow: "0 4px 15px rgba(99, 102, 241, 0.08)"
                }}>
                  <div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", padding: "4px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "600", marginBottom: "8px" }}>
                      <span>📅</span> Interview Scheduled
                    </div>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "1.1rem" }}>
                      {app.job?.title} — <span style={{ color: "var(--color-primary)" }}>{app.company?.name}</span>
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
                      {app.interviewDate ? `Scheduled Date: ${new Date(app.interviewDate).toLocaleString()}` : "Interview details updated by company."}
                    </p>
                  </div>
                  {app.interviewLink && (
                    /^https?:\/\//i.test(app.interviewLink) ? (
                      <a
                        href={app.interviewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", textDecoration: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "600", fontSize: "0.9rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        Join Interview ↗
                      </a>
                    ) : (
                      <span style={{ fontSize: "0.9rem", fontWeight: "500" }}>
                        📍 {app.interviewLink}
                      </span>
                    )
                  )}
                </div>
              ))}
              <div className="dash-section-header">
                <h3>Open Opportunities <span className="dash-section-count">{jobs.length}</span></h3>
              </div>
              <div className="job-list">
                {jobs.length === 0 && (
                  <div className="empty-state">
                    <p>No open opportunities available.</p>
                  </div>
                )}
                {jobs.map((job) => {
                  const isApplied = appliedJobIds.has(job._id);
                  const jobSkills = (job.skills || []).map((s) => s.trim()).filter(Boolean);
                  return (
                    <div className="job-card" key={job._id}>
                      <div className="job-card-main-row" style={{ display: "flex", gap: "16px", flex: 1, minWidth: 0 }}>
                        <div className="company-logo-frame">
                          {job.company?.logoUrl ? (
                            <img
                              src={resolveFileUrl(job.company.logoUrl)}
                              alt={`${job.company.name || "Company"} logo`}
                              className="company-logo-img"
                              onError={(e) => { e.target.style.display = "none"; }}
                            />
                          ) : (
                            <div className="company-logo-placeholder" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {(job.company?.name || "C").charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="card-info" style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                            <h4 style={{ margin: 0 }}>{job.title}{job.company?.name ? ` — ${job.company.name}` : ""}</h4>
                            <span className="badge badge-open">Open</span>
                          </div>
                          <p>{job.description}</p>
                          <div className="job-meta">
                            {job.package && <span className="meta-tag">Package: {job.package}</span>}
                            {job.location && <span className="meta-tag">Location: {job.location}</span>}
                            {job.eligibility && <span className="meta-tag">Req: {job.eligibility}</span>}
                            {job.minCgpa > 0 && <span className="meta-tag">Min CGPA: {job.minCgpa}</span>}
                            {job.allowedBranches?.length > 0 && <span className="meta-tag">Branches: {job.allowedBranches.join(", ")}</span>}
                            {jobSkills.length > 0 && <span className="meta-tag">Required Skills: {job.skills.join(", ")}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="card-actions">
                        {isApplied ? (
                          <button className="btn-secondary" disabled>Applied</button>
                        ) : (
                          <button className="btn-primary-sm" onClick={() => handleApply(job._id)}>Apply Now</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "applications" && (
            <div className="dash-section">
              <div className="dash-section-header">
                <h3>Jobs You've Applied To <span className="dash-section-count">{visibleApplications.length}</span></h3>
              </div>
              <div className="list">
                {visibleApplications.length === 0 && (
                  <div className="empty-state">
                    <p>You haven't applied to any jobs yet.</p>
                  </div>
                )}
                {visibleApplications.map((app) => (
                  <div className="row-card" key={app._id}>
                    <div className="card-info">
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                        <h4 style={{ margin: 0 }}>{app.job?.title} — {app.company?.name}</h4>
                      </div>
                      <p>Applied on {new Date(app.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="card-actions" style={{ textAlign: "right" }}>
                      <span className={`badge ${app.status === 'Hired' ? 'badge-placed' : (app.status === 'Rejected' ? 'badge-closed' : 'badge-open')}`}>
                        Status: {app.status}
                      </span>
                      {(app.status === "Interview Scheduled" || app.interviewLink || app.interviewDate) && (
                        <div style={{ marginTop: "10px", fontSize: "0.88rem", background: "rgba(99, 102, 241, 0.08)", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.2)", textAlign: "left" }}>
                          {app.interviewDate && (
                            <div style={{ color: "var(--color-primary)", fontWeight: "600", marginBottom: "4px" }}>
                              📅 {new Date(app.interviewDate).toLocaleString()}
                            </div>
                          )}
                          {app.interviewLink ? (
                            /^https?:\/\//i.test(app.interviewLink) ? (
                              <a
                                href={app.interviewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "var(--color-primary)", fontWeight: "600", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "4px" }}
                              >
                                Join Interview Meeting ↗
                              </a>
                            ) : (
                              <span style={{ color: "var(--color-text-muted)" }}>
                                📍 {app.interviewLink}
                              </span>
                            )
                          ) : (
                            <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>Interview link will appear here.</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "placements" && (
            <div className="dash-section">
              <div className="dash-section-header">
                <h3>Placement Feed <span className="dash-section-count">{feed.length}</span></h3>
              </div>
              <div className="list">
                {feed.length === 0 && (
                  <div className="empty-state">
                    <p>No placement updates yet.</p>
                  </div>
                )}
                {feed.map((item) => (
                  <div className="row-card" key={item._id}>
                    <div className="card-info">
                      <h4 style={{ marginBottom: "6px" }}>
                        <span style={{ color: "#4f46e5", fontWeight: 800 }}>{item.studentName}</span>
                        {" "}→ {item.companyName}
                      </h4>
                      <div className="job-meta">
                        {item.jobTitle && <span className="meta-tag">Role: {item.jobTitle}</span>}
                        {item.studentBranch && <span className="meta-tag">Branch: {item.studentBranch}</span>}
                        {item.studentCgpa != null && <span className="meta-tag">CGPA: {item.studentCgpa}</span>}
                      </div>
                    </div>
                    {item.package && (
                      <div className="card-actions">
                        <span className="badge badge-placed">{item.package}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "companies" && (
            <div className="dash-section">
              <div className="dash-section-header">
                <h3>Company Directory <span className="dash-section-count">{companies.length}</span></h3>
              </div>
              <div className="list">
                {companies.length === 0 && (
                  <div className="empty-state">
                    <p>No companies registered yet.</p>
                  </div>
                )}
                {companies.map((c) => (
                  <div className="row-card" style={{ display: "block" }} key={c._id}>
                    <div className="card-info">
                      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "12px" }}>
                        <div className="company-logo-frame company-logo-frame-lg">
                          {c.logoUrl ? (
                            <img
                              src={resolveFileUrl(c.logoUrl)}
                              alt={`${c.name} logo`}
                              className="company-logo-img"
                              onError={(e) => { e.target.style.display = "none"; }}
                            />
                          ) : (
                            <div className="company-logo-placeholder" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12 }}>
                              {(c.name || "C").charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: "1.08rem" }}>{c.name}</h4>
                          {c.headquarters && <span style={{ fontSize: "0.82rem", color: "#64748b" }}>{c.headquarters}</span>}
                        </div>
                      </div>
                      {c.description && <p style={{ marginBottom: "12px", color: "var(--color-text)" }}>{c.description}</p>}
                      <div className="job-meta">
                        {c.headquarters && <span className="meta-tag">HQ: {c.headquarters}</span>}
                        {c.eligibility && <span className="meta-tag">Req: {c.eligibility}</span>}
                        {c.skillsTested && <span className="meta-tag">Skills: {c.skillsTested}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "profile" && (
            <div className="dash-section">
              <div className="dash-section-header">
                <h3>Update Your Profile</h3>
              </div>
              
              <div style={{ marginBottom: "30px", padding: "16px", background: "var(--color-bg-hover)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                <h4 style={{ marginBottom: "12px", color: "var(--color-primary)" }}>Basic Details</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div><strong style={{ display: "block", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "4px" }}>Name</strong>{user?.name || "N/A"}</div>
                  <div><strong style={{ display: "block", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "4px" }}>Email</strong>{user?.email || "N/A"}</div>
                  <div><strong style={{ display: "block", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "4px" }}>Roll Number</strong>{user?.rollNo || "N/A"}</div>
                </div>
              </div>

              <p style={{ color: "var(--color-text-muted)", marginBottom: 20, fontSize: "0.9rem" }}>
                Keep your academic details, technical skills, and resume updated for company recruiters.
              </p>
              <form className="dash-form" onSubmit={handleProfileSave}>
                <label>Branch
                  <select value={profileForm.branch} onChange={(e) => setProfileForm({ ...profileForm, branch: e.target.value })}>
                    <option value="">Select Branch</option>
                    <option value="CSE">CSE</option>
                    <option value="ISE">ISE</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                  </select>
                </label>
                <label>CGPA
                  <input type="number" step="0.01" placeholder="e.g. 8.5" value={profileForm.cgpa} onChange={(e) => setProfileForm({ ...profileForm, cgpa: e.target.value })} />
                </label>
                <label className="full-span">
                  Skills (comma-separated)
                  <input placeholder="e.g. React, Node.js, SQL, Python" value={profileForm.skills} onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })} />
                </label>
                <button type="submit" className="btn-primary" style={{ marginTop: "10px", width: "80%", maxWidth: "260px", justifySelf: "start" }}>Save Profile</button>
              </form>

              <div className="resume-upload-card">
                <h4 className="resume-upload-title">Upload PDF Resume</h4>
                <p className="resume-upload-desc">Upload your latest resume to apply for jobs directly.</p>
                <label htmlFor="resume-upload-input" className="file-upload-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Choose File
                </label>
                <input
                  id="resume-upload-input"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleResumeUpload}
                  style={{ display: "none" }}
                />
                {resumeFileName && <span className="file-upload-name">{resumeFileName}</span>}
                <div className="resume-upload-footer">
                {user?.resumeLink ? (
                  <a
                    href={resolveFileUrl(user.resumeLink)}
                    onClick={handleViewResume}
                    target="_blank"
                    rel="noreferrer"
                    className="resume-view-link"
                  >
                    View Resume
                  </a>
                ) : (
                  <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--color-text-muted)" }}>
                    No resume uploaded or linked yet. Click &ldquo;Choose File&rdquo; above to upload your PDF resume.
                  </p>
                )}
                </div>
              </div>
            </div>
          )}


        </div>
      </main>
    </div>
  );
}

export default StudentDashboard;
