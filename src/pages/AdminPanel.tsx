import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiShield, FiUsers, FiBookOpen, FiDollarSign, FiUser,
  FiArrowRight, FiEye, FiEyeOff, FiCopy, FiCheck,
  FiChevronDown, FiChevronRight, FiLock, FiMail, FiX
} from "react-icons/fi";
import RoleHierarchyMap from "../components/RoleHierarchyMap";

// ─── Role Data ─────────────────────────────────────────────────────────────────
// ⚠️ These credentials match EXACTLY what is seeded in the database (seed.js)
const ROLES = [
  {
    id: "super-admin",
    title: "Super Admin",
    icon: "👑",
    color: "#ef4444",
    bgColor: "rgba(239,68,68,0.1)",
    borderColor: "rgba(239,68,68,0.3)",
    email: "admin@sps.edu",
    password: "Admin@123",
    path: "/super-admin",
    desc: "Full system control — manage all admins and portals",
    level: "TOP",
    children: ["manager-admin", "finance-admin"],
  },
  {
    id: "manager-admin",
    title: "Manager Admin",
    icon: "👔",
    color: "#3b82f6",
    bgColor: "rgba(59,130,246,0.1)",
    borderColor: "rgba(59,130,246,0.3)",
    email: "manager@sps.edu",
    password: "Manager@123",
    path: "/manager-admin",
    desc: "Oversees Teacher & Student Admin branch and Finance",
    level: "L2",
    children: ["academic-admin"],
  },
  {
    id: "finance-admin",
    title: "Finance Admin",
    icon: "💰",
    color: "#10b981",
    bgColor: "rgba(16,185,129,0.1)",
    borderColor: "rgba(16,185,129,0.3)",
    email: "finance@sps.edu",
    password: "Finance@123",
    path: "/finance-admin",
    desc: "Manages fees, payments and financial records",
    level: "L2",
    children: [],
  },
  {
    id: "academic-admin",
    title: "Teacher & Student Admin",
    icon: "👩‍🏫",
    color: "#8b5cf6",
    bgColor: "rgba(139,92,246,0.1)",
    borderColor: "rgba(139,92,246,0.3)",
    email: "chetanmohane27@gmail.com",
    password: "T123@",
    path: "/academic-admin",
    desc: "Manages faculty, subjects, student profiles, admissions & academic operations",
    level: "L3",
    children: ["class-teacher", "subject-teacher"],
  },
  {
    id: "class-teacher",
    title: "Class Teacher Portal",
    icon: "🏫",
    color: "#a78bfa",
    bgColor: "rgba(167,139,250,0.1)",
    borderColor: "rgba(167,139,250,0.3)",
    email: "chetanmohane5@gmail.com",
    password: "C123@",
    path: "/class-teacher",
    desc: "Class teacher portal — attendance, reports, marks",
    level: "L4",
    children: [],
  },
  {
    id: "subject-teacher",
    title: "Subject Teacher",
    icon: "📚",
    color: "#c4b5fd",
    bgColor: "rgba(196,181,253,0.1)",
    borderColor: "rgba(196,181,253,0.3)",
    email: "chetanmohane2729@gmail.com",
    password: "B123@",
    path: "/teacher",
    desc: "Subject teacher portal — assignments, results, classes",
    level: "L4",
    children: [],
  },
  {
    id: "student-parent",
    title: "Student / Parent Portal",
    icon: "👨‍👩‍👦",
    color: "#fb923c",
    bgColor: "rgba(251,146,60,0.1)",
    borderColor: "rgba(251,146,60,0.3)",
    email: "student8a1@sps.edu",
    password: "Password@123",
    path: "/student",
    desc: "Students and parents can track progress, attendance, results",
    level: "L4",
    children: [],
  },
];

// ─── Copy Button ────────────────────────────────────────────────────────────────
const CopyBtn = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} title="Copy" style={{
      background: "none", border: "none", cursor: "pointer",
      color: copied ? "#10b981" : "#94a3b8", padding: "2px 4px",
      display: "inline-flex", alignItems: "center",
    }}>
      {copied ? <FiCheck size={13} /> : <FiCopy size={13} />}
    </button>
  );
};

// ─── Role Card ─────────────────────────────────────────────────────────────────
const RoleCard = ({ role, onLogin }: { role: typeof ROLES[0]; onLogin: (r: typeof ROLES[0]) => void }) => {
  const [showPwd, setShowPwd] = useState(false);

  return (
    <div style={{
      background: "#0f172a",
      border: `1px solid ${role.borderColor}`,
      borderRadius: "16px",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 30px ${role.bgColor}`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "12px",
          background: role.bgColor, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "22px", flexShrink: 0,
          border: `1px solid ${role.borderColor}`,
        }}>{role.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "15px" }}>{role.title}</span>
            <span style={{
              fontSize: "10px", fontWeight: 700, padding: "2px 7px",
              borderRadius: "999px", background: role.bgColor, color: role.color,
              border: `1px solid ${role.borderColor}`, letterSpacing: "0.05em",
            }}>{role.level}</span>
          </div>
          <p style={{ color: "#64748b", fontSize: "12px", marginTop: "2px" }}>{role.desc}</p>
        </div>
      </div>

      {/* Credentials */}
      <div style={{
        background: "#020617", borderRadius: "10px", padding: "12px 14px",
        border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "8px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FiMail size={13} color="#64748b" />
          <span style={{ fontSize: "12px", color: "#94a3b8", flex: 1, fontFamily: "monospace" }}>{role.email}</span>
          <CopyBtn text={role.email} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FiLock size={13} color="#64748b" />
          <span style={{ fontSize: "12px", color: "#94a3b8", flex: 1, fontFamily: "monospace" }}>
            {showPwd ? role.password : "••••••••••••"}
          </span>
          <button onClick={() => setShowPwd(!showPwd)} style={{
            background: "none", border: "none", cursor: "pointer", color: "#64748b",
            display: "inline-flex", alignItems: "center", padding: "2px 4px",
          }}>
            {showPwd ? <FiEyeOff size={13} /> : <FiEye size={13} />}
          </button>
          <CopyBtn text={role.password} />
        </div>
      </div>

      {/* Login Button */}
      <button onClick={() => onLogin(role)} style={{
        background: `linear-gradient(135deg, ${role.color}22, ${role.color}11)`,
        border: `1px solid ${role.borderColor}`,
        color: role.color, borderRadius: "10px", padding: "10px 16px",
        fontSize: "12px", fontWeight: 700, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
        transition: "all 0.2s",
        letterSpacing: "0.04em",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = role.color; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `linear-gradient(135deg, ${role.color}22, ${role.color}11)`; (e.currentTarget as HTMLButtonElement).style.color = role.color; }}
      >
        <FiArrowRight size={14} /> Go to Portal
      </button>
    </div>
  );
};

// ─── Main Admin Panel ────────────────────────────────────────────────────────────
const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>("all");

  const sections = [
    { id: "all", label: "All Roles", icon: "🌐" },
    { id: "top", label: "Super Admin", icon: "👑" },
    { id: "management", label: "Management", icon: "👔" },
    { id: "academic", label: "Teacher & Student Branch", icon: "👩‍🏫" },
    { id: "student", label: "Student / Parent Portal", icon: "🎓" },
  ];

  const filteredRoles = () => {
    switch (activeSection) {
      case "top": return ROLES.filter(r => r.id === "super-admin");
      case "management": return ROLES.filter(r => ["manager-admin", "finance-admin"].includes(r.id));
      case "academic": return ROLES.filter(r => ["academic-admin", "class-teacher", "subject-teacher"].includes(r.id));
      case "student": return ROLES.filter(r => ["academic-admin", "student-parent"].includes(r.id));
      default: return ROLES;
    }
  };

  const handleLogin = (role: typeof ROLES[0]) => {
    // Store credentials and navigate
    localStorage.setItem("adminPanelDemo", JSON.stringify({ email: role.email, path: role.path }));
    navigate(role.path);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #020617 0%, #0a0f1e 50%, #020617 100%)",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      color: "#f1f5f9",
    }}>
      {/* Top Bar */}
      <div style={{
        background: "rgba(15,23,42,0.9)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "16px 32px", display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: "linear-gradient(135deg, #ef4444, #b91c1c)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 15px rgba(239,68,68,0.3)",
          }}>
            <FiShield size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "16px", color: "#f1f5f9", letterSpacing: "-0.02em" }}>
              Admin Panel
            </div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>SPS School ERP • Role Management</div>
          </div>
        </div>
        <button onClick={() => navigate("/")} style={{
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "8px", padding: "8px 16px", color: "#94a3b8",
          fontSize: "13px", fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s",
        }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#f1f5f9"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"}
        >
          <FiX size={14} /> Back to Home
        </button>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "999px", padding: "6px 16px", marginBottom: "16px",
          }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#ef4444", letterSpacing: "0.08em" }}>
              SYSTEM ADMINISTRATION
            </span>
          </div>
          <h1 style={{
            fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800,
            color: "#f1f5f9", margin: "0 0 10px", letterSpacing: "-0.03em",
          }}>
            Role Hierarchy & <span style={{ color: "#3b82f6" }}>Access Control</span>
          </h1>
          <p style={{ color: "#64748b", fontSize: "15px", maxWidth: "480px", margin: "0 auto" }}>
            All admin roles according to hierarchy. Click "Go to Portal" to access any role's dashboard.
          </p>
        </div>

        {/* Interactive Role Hierarchy Diagram */}
        <div style={{ marginBottom: "36px" }}>
          <RoleHierarchyMap compact={true} />
        </div>

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "28px", flexWrap: "wrap" }}>
          {sections.map(sec => (
            <button key={sec.id} onClick={() => setActiveSection(sec.id)} style={{
              background: activeSection === sec.id ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.04)",
              border: activeSection === sec.id ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
              color: activeSection === sec.id ? "#3b82f6" : "#64748b",
              borderRadius: "10px", padding: "8px 16px", fontSize: "13px", fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
              transition: "all 0.2s",
            }}>
              <span>{sec.icon}</span> {sec.label}
            </button>
          ))}
        </div>

        {/* Role Cards Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "16px",
        }}>
          {filteredRoles().map(role => (
            <RoleCard key={role.id} role={role} onLogin={handleLogin} />
          ))}
        </div>

        {/* Quick Credentials Table */}
        <div style={{
          background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px", padding: "24px", marginTop: "40px",
        }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", marginBottom: "20px" }}>
            📋 ALL CREDENTIALS — QUICK REFERENCE
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr>
                  {["Role", "Email", "Password", "Portal"].map(h => (
                    <th key={h} style={{
                      textAlign: "left", padding: "10px 14px",
                      color: "#475569", fontSize: "11px", fontWeight: 700,
                      letterSpacing: "0.06em", borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROLES.map((role, i) => (
                  <tr key={role.id} style={{
                    borderBottom: i < ROLES.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  }}>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>{role.icon}</span>
                        <span style={{ color: role.color, fontWeight: 600 }}>{role.title}</span>
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ color: "#94a3b8", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "4px" }}>
                        {role.email} <CopyBtn text={role.email} />
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ color: "#94a3b8", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "4px" }}>
                        {role.password} <CopyBtn text={role.password} />
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <button onClick={() => navigate("/login")} style={{
                        background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
                        color: "#3b82f6", borderRadius: "6px", padding: "4px 12px",
                        fontSize: "11px", fontWeight: 700, cursor: "pointer",
                        display: "inline-flex", alignItems: "center", gap: "4px",
                      }}>
                        Login <FiArrowRight size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Note */}
        <p style={{
          textAlign: "center", color: "#334155", fontSize: "12px",
          marginTop: "32px", lineHeight: 1.7,
        }}>
          ⚠️ These are demo credentials for development. Change passwords before deploying to production.<br />
          © 2026 SPS School ERP System
        </p>
      </div>
    </div>
  );
};

export default AdminPanel;
