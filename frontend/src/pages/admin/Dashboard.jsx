import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { resolveFileUrl } from "../../api/axios";
import UserMenu from "../../components/UserMenu";
import Toast from "../../components/Toast";
import { useConfirm } from "../../components/ConfirmDialog";
import "../Dashboard.css";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("companies");
  const [companies, setCompanies] = useState([]);
  const [students, setStudents] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const confirm = useConfirm();

  const isSuperAdmin = user?.subRole !== "placement_officer"; // covers old accounts with no subRole too

  const [studentSortBy, setStudentSortBy] = useState("cgpa_desc"); // "cgpa_desc", "skills_desc", "cgpa_asc", "name_asc", "recent"
  const [studentSkillSearch, setStudentSkillSearch] = useState("");
  const [studentStatusFilter, setStudentStatusFilter] = useState("all"); // "all", "notplaced", "placed"

  const [companyForm, setCompanyForm] = useState({
    name: "", email: "", password: "", headquarters: "", description: "", eligibility: "", recruitmentProcess: "", skillsTested: "",
  });
  const [hireForm, setHireForm] = useState({ studentId: "", companyId: "", jobTitle: "", package: "", eligibility: "" });
  const [officerForm, setOfficerForm] = useState({ name: "", email: "", password: "" });

  const loadCompanies = () => API.get("/admin/companies").then((res) => setCompanies(res.data)).catch(() => setCompanies([]));
  const loadStudents = () => API.get("/admin/students").then((res) => setStudents(res.data)).catch(() => setStudents([]));
  const loadPlacements = () => API.get("/admin/placements").then((res) => setPlacements(res.data)).catch(() => setPlacements([]));
  const loadAnalytics = () => API.get("/admin/analytics").then((res) => setAnalytics(res.data)).catch(() => setAnalytics(null));
  const loadOfficers = () => API.get("/admin/officers").then((res) => setOfficers(res.data)).catch(() => setOfficers([]));

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const info = localStorage.getItem("userInfo");

    if (!token || role !== "admin") { navigate("/login"); return; }
    if (info) setUser(JSON.parse(info));
    loadCompanies();
    loadStudents();
    loadPlacements();
    loadAnalytics();
    loadOfficers();
  }, [navigate]);

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  // Re-fetch data for whichever tab is opened, so newly added companies/
  // students/placements show up without a full page refresh.
  const handleTabClick = (key) => {
    setTab(key);
    if (key === "analytics") loadAnalytics();
    else if (key === "companies") loadCompanies();
    else if (key === "students") loadStudents();
    else if (key === "markHired") { loadStudents(); loadCompanies(); }
    else if (key === "records") loadPlacements();
    else if (key === "officers" && isSuperAdmin) loadOfficers();
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!companyForm.name || !companyForm.email || !companyForm.password) {
      setError("Name, email and password are required"); return;
    }
    try {
      await API.post("/admin/companies", companyForm);
      setSuccess("Company added! They can now log in.");
      setCompanyForm({ name: "", email: "", password: "", headquarters: "", description: "", eligibility: "", recruitmentProcess: "", skillsTested: "" });
      loadCompanies();
      setTab("companies");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add company");
    }
  };

  const handleDeleteCompany = async (id) => {
    const ok = await confirm({
      title: "Delete this company?",
      message: "Are you sure you want to delete this company? All of its job postings will be removed too. This can't be undone.",
      confirmLabel: "Delete Company",
    });
    if (!ok) return;
    await API.delete(`/admin/companies/${id}`);
    loadCompanies();
  };

  const handleDeleteStudent = async (id) => {
    const ok = await confirm({
      title: "Delete this student?",
      message: "This will permanently delete the student's account and all related data. This can't be undone.",
      confirmLabel: "Delete Student",
    });
    if (!ok) return;
    await API.delete(`/admin/students/${id}`);
    loadStudents();
    loadPlacements();
  };

  const handleMarkHired = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!hireForm.studentId || !hireForm.companyId) {
      setError("Select a student and a company"); return;
    }
    try {
      await API.post("/admin/mark-hired", hireForm);
      setSuccess("Placement recorded. It's now visible in the Placement Feed.");
      setHireForm({ studentId: "", companyId: "", jobTitle: "", package: "", eligibility: "" });
      loadStudents();
      loadPlacements();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark student as hired");
    }
  };

  const handleUndoPlacement = async (id) => {
    const ok = await confirm({
      title: "Undo this placement?",
      message: "The student will go back to Not Placed status.",
      confirmLabel: "Undo Placement",
    });
    if (!ok) return;
    await API.delete(`/admin/placements/${id}`);
    loadStudents();
    loadPlacements();
  };

  const handleAddOfficer = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!officerForm.name || !officerForm.email || !officerForm.password) {
      setError("Name, email and password are required"); return;
    }
    try {
      await API.post("/admin/officers", officerForm);
      setSuccess("Placement officer added! They can now log in as Admin.");
      setOfficerForm({ name: "", email: "", password: "" });
      loadOfficers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add placement officer");
    }
  };

  const handleDeleteOfficer = async (id) => {
    const ok = await confirm({
      title: "Remove this officer?",
      message: "This placement officer will lose access to the admin dashboard immediately.",
      confirmLabel: "Remove Officer",
    });
    if (!ok) return;
    await API.delete(`/admin/officers/${id}`);
    loadOfficers();
  };

  const navItems = [
    {
      key: "analytics",
      label: "Analytics",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      key: "companies",
      label: "Companies",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
        </svg>
      ),
    },
    {
      key: "addCompany",
      label: "Add Company",
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
      label: "Students",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      ),
    },
    {
      key: "records",
      label: "Placement Records",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    ...(isSuperAdmin ? [{
      key: "officers",
      label: "Placement Officers",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    }] : []),
  ];

  const pageTitle = {
    analytics:  "Placement Analytics",
    companies:  "All Companies",
    addCompany: "Add New Company",
    students:   "All Students",
    records:    "Placement Records",
    officers:   "Placement Officers",
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "A";

  return (
    <div className="dash-container">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>CampusHire</h2>
          <span className="sidebar-tagline">Admin Portal</span>
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
              <span className="user-name">{user?.name || "Admin"}</span>
              <span className="user-role">{isSuperAdmin ? "Super Admin" : "Placement Officer"}</span>
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
              name={user?.name || (isSuperAdmin ? "Super Admin" : "Placement Officer")}
              role={isSuperAdmin ? "Super Admin" : "Placement Officer"}
              email={user?.email}
              onDashboard={() => handleTabClick("analytics")}
              onSignOut={handleLogout}
            />
          </div>
        </header>

        <div className="toast-stack">
          <Toast message={error} type="error" onClose={() => setError("")} />
          <Toast message={success} type="success" onClose={() => setSuccess("")} />
        </div>

        <div className="content-body">
          {tab === "analytics" && (
            <div className="dash-section" style={{ background: "transparent", border: "none", boxShadow: "none", padding: 0 }}>
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>Placement Analytics & Performance</h3>
                <p style={{ color: "#64748b", fontSize: "0.92rem", margin: 0 }}>Real-time university placement metrics, department distributions, and student academic performance.</p>
              </div>
              
              {analytics ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "32px" }}>
                    <div className="stat-card" style={{ padding: "24px", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(15,23,42,0.04)" }}>
                      <div style={{ width: 42, height: 42, borderRadius: "12px", background: "rgba(99,102,241,0.12)", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                          <path d="M6 12v5c3 3 9 3 12 0v-5" />
                        </svg>
                      </div>
                      <div className="stat-card-label" style={{ marginBottom: 6, fontSize: "0.76rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Total Students</div>
                      <strong style={{ fontSize: "2.4rem", fontWeight: 900, color: "#0f172a", lineHeight: 1.1, display: "block", marginBottom: 4 }}>{analytics.metrics.totalStudents}</strong>
                      <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 500 }}>Enrolled university candidates</span>
                    </div>

                    <div className="stat-card" style={{ padding: "24px", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(15,23,42,0.04)" }}>
                      <div style={{ width: 42, height: 42, borderRadius: "12px", background: "rgba(139,92,246,0.12)", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                      </div>
                      <div className="stat-card-label" style={{ marginBottom: 6, fontSize: "0.76rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Partner Companies</div>
                      <strong style={{ fontSize: "2.4rem", fontWeight: 900, color: "#7c3aed", lineHeight: 1.1, display: "block", marginBottom: 4 }}>{analytics.metrics.totalCompanies}</strong>
                      <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 500 }}>Registered recruiters</span>
                    </div>

                    <div className="stat-card" style={{ padding: "24px", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(15,23,42,0.04)" }}>
                      <div style={{ width: 42, height: 42, borderRadius: "12px", background: "rgba(245,158,11,0.12)", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                          <path d="M16 3v4M8 3v4" />
                        </svg>
                      </div>
                      <div className="stat-card-label" style={{ marginBottom: 6, fontSize: "0.76rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Job Openings</div>
                      <strong style={{ fontSize: "2.4rem", fontWeight: 900, color: "#d97706", lineHeight: 1.1, display: "block", marginBottom: 4 }}>{analytics.metrics.totalJobs}</strong>
                      <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 500 }}>Active hiring opportunities</span>
                    </div>

                    <div className="stat-card" style={{ padding: "24px", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(15,23,42,0.04)" }}>
                      <div style={{ width: 42, height: 42, borderRadius: "12px", background: "rgba(16,185,129,0.12)", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                          <path d="M4 22h16" />
                          <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
                          <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
                          <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
                        </svg>
                      </div>
                      <div className="stat-card-label" style={{ marginBottom: 6, fontSize: "0.76rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Students Placed</div>
                      <strong style={{ fontSize: "2.4rem", fontWeight: 900, color: "#059669", lineHeight: 1.1, display: "block", marginBottom: 4 }}>{analytics.metrics.totalPlacements}</strong>
                      <span style={{ fontSize: "0.82rem", color: "#059669", fontWeight: 700 }}>
                        {analytics.metrics.totalStudents ? Math.round((analytics.metrics.totalPlacements / analytics.metrics.totalStudents) * 100) : 0}% Placement Rate
                      </span>
                    </div>
                  </div>

                  {/* Leaderboard Card */}
                  <div style={{ background: "#ffffff", padding: "28px", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(15,23,42,0.03)", marginBottom: "32px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <h4 style={{ fontSize: "1.18rem", fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
                          Academic Honor Roll — Top Performers
                        </h4>
                        <p style={{ margin: 0, fontSize: "0.86rem", color: "#64748b" }}>Ranked by cumulative grade point average (CGPA) across departments</p>
                      </div>
                      <span style={{ background: "rgba(99,102,241,0.1)", color: "#4f46e5", fontSize: "0.75rem", fontWeight: 700, padding: "5px 12px", borderRadius: "999px" }}>
                        Top {analytics.topStudents?.length || 0} Students
                      </span>
                    </div>

                    {analytics.topStudents && analytics.topStudents.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {analytics.topStudents.map((s, idx) => (
                          <div
                            key={s._id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "14px 18px",
                              background: idx === 0 ? "linear-gradient(135deg, rgba(254,243,199,0.4) 0%, #ffffff 100%)" : "#fafafa",
                              borderRadius: "12px",
                              border: idx === 0 ? "1px solid #fde68a" : "1px solid #f1f5f9",
                              transition: "all 0.2s ease",
                              flexWrap: "wrap",
                              gap: 12,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                              <span
                                style={{
                                  fontWeight: 800,
                                  fontSize: "0.82rem",
                                  padding: "4px 10px",
                                  borderRadius: "8px",
                                  background: idx === 0 ? "#fef3c7" : idx === 1 ? "#f1f5f9" : idx === 2 ? "#fed7aa" : "#f8fafc",
                                  color: idx === 0 ? "#b45309" : idx === 1 ? "#475569" : idx === 2 ? "#c2410c" : "#64748b",
                                  border: "1px solid " + (idx === 0 ? "#fde68a" : idx === 1 ? "#e2e8f0" : idx === 2 ? "#fdba74" : "#e2e8f0"),
                                }}
                              >
                                {`#${idx + 1}`}
                              </span>
                              <div>
                                <strong style={{ display: "block", color: "#0f172a", fontSize: "0.95rem" }}>{s.name}</strong>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#4f46e5", background: "#eef2ff", padding: "1px 7px", borderRadius: "4px" }}>
                                    {s.branch || "General"}
                                  </span>
                                  {s.email && <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{s.email}</span>}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                              <span className={`badge ${s.placementStatus === "Placed" ? "badge-placed" : "badge-notplaced"}`}>
                                {s.placementStatus === "Placed" ? "Placed" : "Not Placed"}
                              </span>
                              <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "6px 14px", borderRadius: "10px", textAlign: "right" }}>
                                <span style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.05em" }}>CGPA</span>
                                <strong style={{ color: "#047857", fontSize: "1.08rem", fontWeight: 900 }}>{s.cgpa != null ? Number(s.cgpa).toFixed(2) : "N/A"}</strong>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: "#64748b", textAlign: "center", padding: "30px 0" }}>No student CGPA data available yet.</p>
                    )}
                  </div>

                  {/* Branch Chart Card */}
                  <div style={{ background: "#ffffff", padding: "28px", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(15,23,42,0.03)" }}>
                    <div style={{ marginBottom: "24px" }}>
                      <h4 style={{ fontSize: "1.18rem", fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Placements by Branch</h4>
                      <p style={{ margin: 0, fontSize: "0.86rem", color: "#64748b" }}>Total number of students hired per academic department</p>
                    </div>
                    {analytics.branchData && analytics.branchData.length > 0 ? (
                      <div style={{ height: 320 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.branchData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} allowDecimals={false} />
                            <Tooltip
                              cursor={{ fill: 'rgba(99,102,241,0.06)' }}
                              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 8px 24px rgba(15,23,42,0.12)', padding: '10px 14px' }}
                              formatter={(value) => [`${value} Students Hired`, "Placements"]}
                            />
                            <Bar dataKey="placed" fill="#6366f1" radius={[8, 8, 0, 0]} maxBarSize={56} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p style={{ color: "#64748b", textAlign: "center", padding: "40px 0" }}>No placement data available for chart yet.</p>
                    )}
                  </div>
                </>
              ) : (
                <p style={{ color: "#64748b" }}>Loading analytics data...</p>
              )}
            </div>
          )}

          {tab === "companies" && (
            <>
              <div className="dash-grid">
                <div className="stat-card">
                  <div className="stat-card-accent"></div>
                  <div className="stat-card-label">Companies</div>
                  <strong>{companies.length}</strong>
                  <span>Registered</span>
                </div>
                <div className="stat-card">
                  <div className="stat-card-accent"></div>
                  <div className="stat-card-label">Students</div>
                  <strong>{students.length}</strong>
                  <span>Enrolled</span>
                </div>
                <div className="stat-card">
                  <div className="stat-card-accent"></div>
                  <div className="stat-card-label">Placed</div>
                  <strong>{students.filter((s) => s.placementStatus === "Placed").length}</strong>
                  <span>Students</span>
                </div>
              </div>

              <div className="dash-section">
              <div className="dash-section-header">
                <h3>All Companies <span className="dash-section-count">{companies.length}</span></h3>
              </div>
              <div className="list">
                {companies.length === 0 && (
                  <div className="empty-state">
                    <p>No companies registered yet. Add one to get started.</p>
                  </div>
                )}
                {companies.map((c) => (
                  <div className="row-card" key={c._id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, flex: 1 }}>
                      <div className="company-logo-frame">
                        {c.logoUrl ? (
                          <img
                            src={resolveFileUrl(c.logoUrl)}
                            alt={`${c.name} logo`}
                            className="company-logo-img"
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        ) : (
                          <div className="company-logo-placeholder" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {(c.name || "C").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="card-info" style={{ minWidth: 0, flex: 1 }}>
                        <h4 style={{ margin: 0, marginBottom: 4 }}>{c.name}</h4>
                        <p style={{ margin: 0 }}>{c.email}{c.headquarters ? ` · ${c.headquarters}` : ""}</p>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button className="btn-danger" onClick={() => handleDeleteCompany(c._id)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </>
          )}

          {tab === "addCompany" && (
            <div className="dash-section">
              <div className="dash-section-header">
                <h3>Add a New Company Account</h3>
              </div>
              <form className="dash-form" onSubmit={handleAddCompany}>
                <label>Company Name
                  <input placeholder="e.g. Infosys" value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} />
                </label>
                <label>Login Email
                  <input type="email" placeholder="company@example.com" value={companyForm.email} onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })} />
                </label>
                <label>Login Password
                  <input type="password" placeholder="Set a secure password" value={companyForm.password} onChange={(e) => setCompanyForm({ ...companyForm, password: e.target.value })} />
                </label>
                <label>Headquarters
                  <input placeholder="e.g. Bangalore, Karnataka" value={companyForm.headquarters} onChange={(e) => setCompanyForm({ ...companyForm, headquarters: e.target.value })} />
                </label>
                <label>Description
                  <textarea rows="3" placeholder="Brief description of the company..." value={companyForm.description} onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })} />
                </label>
                <label>Eligibility Criteria
                  <input placeholder="e.g. CSE/ISE, CGPA 7+" value={companyForm.eligibility} onChange={(e) => setCompanyForm({ ...companyForm, eligibility: e.target.value })} />
                </label>
                <label>Recruitment Process
                  <input placeholder="e.g. Online Test → Technical Interview → HR" value={companyForm.recruitmentProcess} onChange={(e) => setCompanyForm({ ...companyForm, recruitmentProcess: e.target.value })} />
                </label>
                <label>Skills Tested
                  <input placeholder="e.g. DSA, SQL, Problem Solving" value={companyForm.skillsTested} onChange={(e) => setCompanyForm({ ...companyForm, skillsTested: e.target.value })} />
                </label>
                <button className="btn-primary-full" type="submit">Add Company</button>
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
              if (studentSortBy === "cgpa_desc") {
                return (b.cgpa || 0) - (a.cgpa || 0);
              }
              if (studentSortBy === "cgpa_asc") {
                return (a.cgpa || 0) - (b.cgpa || 0);
              }
              if (studentSortBy === "skills_desc") {
                return (b.skills?.length || 0) - (a.skills?.length || 0);
              }
              if (studentSortBy === "name_asc") {
                return (a.name || "").localeCompare(b.name || "");
              }
              return 0; // "recent"
            });

            const isFilterActive = studentSkillSearch.trim() !== "" || studentStatusFilter !== "all" || studentSortBy !== "cgpa_desc";

            return (
              <div className="dash-section">
                <div className="dash-section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <h3>All Students <span className="dash-section-count">{students.length}</span></h3>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    Showing <strong>{filteredAndSortedStudents.length}</strong> of {students.length}
                  </span>
                </div>
                <p style={{ color: "var(--color-text-muted)", marginBottom: 16, fontSize: "0.9rem" }}>
                  Sort according to CGPA, filter by resume skill keywords, review academic credentials and resumes.
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
                    value={studentSortBy}
                    onChange={(e) => setStudentSortBy(e.target.value)}
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
                    <option value="all">Status: All Students</option>
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
                        setStudentSortBy("cgpa_desc");
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
                            setStudentSortBy("cgpa_desc");
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
                              {s.placementStatus === "Placed" && (
                                <span className="badge badge-placed-subtle">
                                  ✓ Placed @ {s.placedCompany}
                                </span>
                              )}
                              {s.resumeLink ? (
                                <a
                                  href={resolveFileUrl(s.resumeLink)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    fontSize: "0.8rem",
                                    fontWeight: 700,
                                    textDecoration: "none",
                                    color: "#ffffff",
                                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                                    borderRadius: "7px",
                                    padding: "5px 12px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    boxShadow: "0 2px 8px rgba(79, 70, 229, 0.22)"
                                  }}
                                >
                                  📄 View Resume ↗
                                </a>
                              ) : (
                                <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "#94a3b8", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "4px 9px" }}>
                                  No resume uploaded
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="card-actions">
                            <button className="btn-danger" onClick={() => handleDeleteStudent(s._id)}>Delete</button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })()}

          {tab === "records" && (
            <div className="dash-section">
              <div className="dash-section-header">
                <h3>Full Placement Records <span className="dash-section-count">{placements.length}</span></h3>
              </div>
              <p style={{ color: "var(--color-text-muted)", marginBottom: 20, fontSize: "0.9rem" }}>
                Every hire, by whoever made it (admin or company), with the criteria used.
              </p>
              <div className="list">
                {placements.length === 0 && (
                  <div className="empty-state"><p>No placements recorded yet.</p></div>
                )}
                {placements.map((p) => (
                  <div className="row-card" key={p._id}>
                    <div className="card-info">
                      <h4>{p.studentName} → {p.companyName}</h4>
                      <p>
                        {[p.jobTitle, p.package, p.studentBranch, p.studentCgpa != null && `CGPA ${p.studentCgpa}`].filter(Boolean).join(" · ")}
                      </p>
                      {p.eligibility && <p>Criteria: {p.eligibility}</p>}
                      <p style={{ marginTop: 4 }}>Hired by: {p.hiredBy === "company" ? "Company" : "Admin"}</p>
                    </div>
                    <div className="card-actions">
                      <button className="btn-danger" onClick={() => handleUndoPlacement(p._id)}>Undo</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "officers" && isSuperAdmin && (
            <div className="dash-section">
              <div className="dash-section-header">
                <h3>Placement Officer Accounts <span className="dash-section-count">{officers.length}</span></h3>
              </div>
              <p style={{ color: "var(--color-text-muted)", marginBottom: 24, fontSize: "0.9rem" }}>
                Create logins for your placement department staff. They can add/edit students and add companies, but can't create other officer accounts.
              </p>

              <form className="dash-form" onSubmit={handleAddOfficer} style={{ marginBottom: 32 }}>
                <label>Full Name
                  <input value={officerForm.name} onChange={(e) => setOfficerForm({ ...officerForm, name: e.target.value })} placeholder="e.g. Priya Sharma" />
                </label>
                <label>Login Email
                  <input type="email" value={officerForm.email} onChange={(e) => setOfficerForm({ ...officerForm, email: e.target.value })} placeholder="officer@example.com" />
                </label>
                <label>Login Password
                  <input type="password" value={officerForm.password} onChange={(e) => setOfficerForm({ ...officerForm, password: e.target.value })} placeholder="Set a secure password" />
                </label>
                <button className="btn-primary-full" type="submit">+ Add Placement Officer</button>
              </form>

              <div className="list">
                {officers.length === 0 && (
                  <div className="empty-state"><p>No placement officers added yet.</p></div>
                )}
                {officers.map((o) => (
                  <div className="row-card" key={o._id}>
                    <div className="card-info">
                      <h4>{o.name}</h4>
                      <p>{o.email}</p>
                    </div>
                    <div className="card-actions">
                      <button className="btn-danger" onClick={() => handleDeleteOfficer(o._id)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
