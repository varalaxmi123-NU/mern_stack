import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { resolveFileUrl } from "../api/axios";
import "./Landing.css";

function Landing() {
  const navigate = useNavigate();
  const [feed, setFeed] = useState([]);
  const [jobCount, setJobCount] = useState(0);

  useEffect(() => {
    API.get("/placements")
      .then((res) => setFeed(Array.isArray(res.data) ? res.data : []))
      .catch(() => setFeed([]));
    API.get("/jobs")
      .then((res) => setJobCount(Array.isArray(res.data) ? res.data.length : 0))
      .catch(() => setJobCount(0));
  }, []);

  // SVG Icons

  const BriefcaseSVG = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  );

  const UsersSVG = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );

  const ActivitySVG = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );

  const SettingsSVG = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );

  return (
    <div className="landing-container">
      {/* ===== NAVBAR ===== */}
      <nav className="navbar">
        <a href="#" className="nav-brand">
          <span className="logo-text">CampusHire</span>
        </a>
        <div className="nav-links">
          <a href="#features">Platform</a>
          <a href="#placements">Success Stories</a>
          <a href="#stats">Impact</a>
        </div>
        <button className="btn-nav-cta" onClick={() => navigate("/login")}>
          Sign In
        </button>
      </nav>

      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-bg-orbs">
          <div className="orb-1"></div>
          <div className="orb-2"></div>
        </div>
        
        <div className="hero-grid">
          <div className="hero-content animate-fade-up">
            <div className="pill-badge">
              <span className="pill-dot"></span>Next-Gen Placement Platform
            </div>
            <h1 className="hero-title">
              Accelerate your campus hiring with <span className="text-gradient">CampusHire.</span>
            </h1>
            <p className="hero-subtitle">
              The modern recruitment platform designed exclusively for your university. 
              Connect top-tier student talent with world-class companies through a unified, real-time platform.
            </p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => navigate("/login")}>
                Start Hiring
              </button>
              <a href="#features" className="btn-secondary">
                Explore Platform
              </a>
            </div>
          </div>

          <div className="hero-visual animate-fade-up delay-200">
            {/* Main Glass Dashboard Mockup */}
            <div className="glass-card visual-main">
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "16px" }}>
                <div>
                  <p style={{ margin: 0, color: "var(--text-main)", fontWeight: 700, fontSize: "0.9rem" }}>Placement Overview</p>
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>Live metrics across campus</p>
                </div>
                <div style={{ padding: "6px 12px", background: "var(--bg-alt)", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600 }}>Real-time</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ background: "var(--bg-alt)", padding: "16px", borderRadius: "12px" }}>
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 600 }}>Active Jobs</p>
                  <p style={{ margin: "8px 0 0 0", fontSize: "2rem", fontWeight: 800, color: "var(--primary)" }}>{jobCount || 12}</p>
                </div>
                <div style={{ background: "var(--bg-alt)", padding: "16px", borderRadius: "12px" }}>
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 600 }}>Offers Made</p>
                  <p style={{ margin: "8px 0 0 0", fontSize: "2rem", fontWeight: 800, color: "var(--accent)" }}>{feed.length || 45}</p>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div className="visual-floating-1">
              <div className="visual-icon-box">
                <BriefcaseSVG />
              </div>
              <div className="visual-text">
                <h4>Software Engineer</h4>
                <p>Microsoft • ₹45 LPA</p>
              </div>
            </div>
            
            <div className="visual-floating-2">
              <div className="visual-icon-box success">
                <UsersSVG />
              </div>
              <div className="visual-text">
                <h4>New Application</h4>
                <p>Rahul S. • CGPA: 9.2</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="features-section" id="features">
        <div className="section-header">
          <div className="pill-badge" style={{ marginBottom: "16px" }}>
            <span className="pill-dot"></span>Platform Features
          </div>
          <h2 className="section-title">Everything you need,<br />beautifully integrated.</h2>
          <p className="section-subtitle">
            Say goodbye to fragmented spreadsheets and endless email chains. 
            CampusHire unifies the entire recruitment lifecycle into one powerful workspace.
          </p>
        </div>
        
        <div className="bento-grid">
          <div className="bento-card">
            <span className="bento-step">01</span>
            <div className="bento-icon"><BriefcaseSVG /></div>
            <h3>Intelligent Job Board</h3>
            <p>Companies can instantly publish roles and track applicant pipelines. Students receive real-time alerts the second a new opportunity opens.</p>
          </div>
          <div className="bento-card">
            <span className="bento-step">02</span>
            <div className="bento-icon"><UsersSVG /></div>
            <h3>Unified Access</h3>
            <p>A single entry point. The system automatically routes Students, Recruiters, and Admins to their specialized, role-based dashboards.</p>
          </div>
          <div className="bento-card">
            <span className="bento-step">03</span>
            <div className="bento-icon"><ActivitySVG /></div>
            <h3>Live Activity Feed</h3>
            <p>Celebrate success campus-wide. When a student is hired, the real-time placement feed instantly updates with the company and package details.</p>
          </div>
          <div className="bento-card">
            <span className="bento-step">04</span>
            <div className="bento-icon"><SettingsSVG /></div>
            <h3>Admin Control Center</h3>
            <p>Placement coordinators gain absolute oversight. Monitor company registrations, approve job postings, and track campus-wide placement metrics.</p>
          </div>
        </div>
      </section>

      {/* ===== PLACEMENT FEED (GRID) ===== */}
      <section className="placements-section" id="placements">
        <div className="section-header">
          <h2 className="section-title">Recent Success Stories</h2>
          <p className="section-subtitle">See who's getting hired across the campus right now.</p>
        </div>
        
        <div className="placements-grid">
          {(Array.isArray(feed) && feed.length > 0 ? feed : [
            { _id: 'f1', studentName: 'Rahul Sharma', jobTitle: 'Software Engineer', companyName: 'Microsoft', package: '₹45 LPA' },
            { _id: 'f2', studentName: 'Priya Patel', jobTitle: 'Data Analyst', companyName: 'Amazon', package: '₹28 LPA' },
            { _id: 'f3', studentName: 'Ankit Kumar', jobTitle: 'SDE-1', companyName: 'Google', package: '₹52 LPA' },
            { _id: 'f4', studentName: 'Sneha Reddy', jobTitle: 'Frontend Engineer', companyName: 'Vercel', package: '₹32 LPA' },
            { _id: 'f5', studentName: 'Vikram Singh', jobTitle: 'Backend Engineer', companyName: 'Stripe', package: '₹40 LPA' },
            { _id: 'f6', studentName: 'Neha Gupta', jobTitle: 'Product Manager', companyName: 'Atlassian', package: '₹35 LPA' },
          ]).slice(0, 6).map((item, idx) => {
            const formatTitleCase = (str) => {
              if (!str) return "";
              return String(str)
                .split(" ")
                .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""))
                .join(" ");
            };

            const formatPackage = (pkg) => {
              if (!pkg) return "";
              let clean = String(pkg).replace(/₹/g, "").trim();
              if (!clean.toUpperCase().includes("LPA") && !isNaN(clean)) {
                clean += " LPA";
              }
              return `₹${clean}`;
            };

            const AVATAR_GRADIENTS = [
              "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
              "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
              "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
            ];
            const charCode = (item.studentName || "S").charCodeAt(0) || 0;
            const avatarBg = AVATAR_GRADIENTS[(charCode + idx) % AVATAR_GRADIENTS.length];

            return (
              <div className="success-card" key={item._id || idx}>
                <div className="success-card-top">
                  <div className="student-profile-row">
                    <div className="student-avatar" style={{ background: avatarBg }}>
                      {item.studentName ? item.studentName.charAt(0).toUpperCase() : "S"}
                    </div>
                    <div className="student-name-box">
                      <h4 className="student-name">{formatTitleCase(item.studentName || "Student")}</h4>
                      <span className="student-company-tag">
                        {(item.companyLogo || item.logoUrl || item.company?.logoUrl) ? (
                          <img
                            src={resolveFileUrl(item.companyLogo || item.logoUrl || item.company?.logoUrl)}
                            alt=""
                            style={{ width: "16px", height: "16px", objectFit: "contain", borderRadius: "3px", flexShrink: 0 }}
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        ) : null}
                        {item.companyName || "Company"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="success-details">
                  <div className="role-chip">
                    <span className="role-chip-label">Designation</span>
                    <span className="role-chip-val">{formatTitleCase(item.jobTitle || "Engineer")}</span>
                  </div>
                  {item.package && (
                    <div className="pkg-chip">
                      <span className="pkg-chip-label">Package</span>
                      <span className="pkg-chip-val">{formatPackage(item.package)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== DARK STATS SECTION ===== */}
      <section className="stats-section" id="stats">
        <div className="stats-bg-grid"></div>
          <div className="section-header stats-header">
            <h2 className="section-title">Driven by Excellence.</h2>
            <p className="section-subtitle">
              Our university consistently delivers top-tier engineering talent to the world's most innovative companies.
            </p>
          </div>
        
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number">85%</div>
            <div className="stat-label">Average Placement Rate</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">₹60L</div>
            <div className="stat-label">Highest Package</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">₹8L</div>
            <div className="stat-label">Average Package</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">120+</div>
            <div className="stat-label">Global Recruiters</div>
          </div>
        </div>
        
        <div className="stats-cta">
          <button className="btn-primary" onClick={() => navigate("/login")}>
            Join the Network
          </button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-col footer-col-brand">
            <span className="logo-text">CampusHire</span>
            <p className="footer-tagline">The complete placement management platform for your university.</p>
          </div>

          <div className="footer-col">
            <h5>Platform</h5>
            <a href="#features">Features</a>
            <a href="#stats">Impact</a>
            <a href="/login">Sign In</a>
          </div>

          <div className="footer-col">
            <h5>Community</h5>
            <a href="#placements">Success Stories</a>
            <a href="/student/register">Student Sign Up</a>
            <a href="/admin/register">Register Institution</a>
          </div>

          <div className="footer-col">
            <h5>Legal</h5>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Support</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="footer-copyright">© 2026 CampusHire Inc. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
