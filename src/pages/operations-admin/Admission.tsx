import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import "../../assets/styles/main.css";
import {
  FiCheckCircle, FiXCircle, FiClock, FiUserCheck, FiSearch,
  FiUserPlus, FiFileText, FiCalendar, FiUser, FiPhone, FiMail,
  FiBook, FiSend, FiShield
} from "react-icons/fi";

const Admissions = () => {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"queue" | "new" | "approved">("queue");
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Approval modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
  const [approveData, setApproveData] = useState({ className: "10th", section: "A" });
  const [rejectReason, setRejectReason] = useState("");
  const [modalAction, setModalAction] = useState<"approve" | "reject" | "">("");
  const [statusMessage, setStatusMessage] = useState("");

  // New admission form state
  const [admissionMode, setAdmissionMode] = useState<"standard" | "direct">("standard");
  const [newAdmForm, setNewAdmForm] = useState({
    studentName: "",
    studentEmail: "",
    studentPhone: "",
    dob: "",
    gender: "Male",
    guardianName: "",
    guardianPhone: "",
    applyingClass: "1st",
    section: "A",
    password: "",
    remark: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Current admin info
  const currentUserName = localStorage.getItem("userName") || "Admin";
  const currentUserRole = localStorage.getItem("role") || "academic-admin";
  const isSuperAdmin = ["super-admin", "academic-admin", "student-admin", "manager-admin"].includes(currentUserRole.toLowerCase());
  const formattedAdminName = `${currentUserName} (${currentUserRole.replace(/-/g, " ").toUpperCase()})`;

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      setStatusMessage("");
      const response = await API.get("/api/admin/student-admin/admissions");
      setAdmissions(response.data.data || []);
      if (response.data.data?.length === 0) {
        setStatusMessage("No admissions records found.");
      }
    } catch (error: any) {
      console.error("Error fetching admissions:", error);
      setStatusMessage(error.response?.data?.message || "Failed to fetch admissions");
      setAdmissions([]);
    } finally {
      setLoading(false);
    }
  };

  // ── New Admission Submit ────────────────────────────────────────────────────
  const handleNewAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmForm.studentName || !newAdmForm.studentEmail) {
      setStatusMessage("Please fill in Student Name and Email.");
      return;
    }
    try {
      setSubmitting(true);
      setStatusMessage("");

      // Direct admission & instant student account & class enrollment
      await API.post("/api/admin/student-admin/admissions/direct", {
        name: newAdmForm.studentName,
        email: newAdmForm.studentEmail,
        phone: newAdmForm.studentPhone,
        dob: newAdmForm.dob,
        gender: newAdmForm.gender,
        parentName: newAdmForm.guardianName,
        parentPhone: newAdmForm.guardianPhone,
        className: newAdmForm.applyingClass,
        section: newAdmForm.section || "A",
        password: newAdmForm.password || "Student@123",
        submittedBy: formattedAdminName,
      });

      setStatusMessage(
        `🎉 Student "${newAdmForm.studentName}" admitted & enrolled successfully into Class ${newAdmForm.applyingClass}-${newAdmForm.section || "A"}! (Processed by: ${formattedAdminName})`
      );

      setNewAdmForm({
        studentName: "", studentEmail: "", studentPhone: "",
        dob: "", gender: "Male", guardianName: "", guardianPhone: "",
        applyingClass: "1st", section: "A", password: "", remark: "",
      });
      setActiveSubTab("queue");
      await fetchAdmissions();
    } catch (error: any) {
      console.error("Error submitting admission:", error);
      setStatusMessage(error.response?.data?.message || "Failed to submit admission application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Super Admin: Approve ────────────────────────────────────────────────────
  const handleApproveClick = (admission: any) => {
    setSelectedAdmission(admission);
    setModalAction("approve");
    setApproveData({ className: "10th", section: "A" });
    setRejectReason("");
    setShowModal(true);
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveData.className || !approveData.section) {
      setStatusMessage("Please select Class and Section");
      return;
    }
    try {
      setLoading(true);
      await API.post(
        `/api/admin/student-admin/admissions/${selectedAdmission._id}/approve`,
        {
          className: approveData.className,
          section: approveData.section,
          processedBy: formattedAdminName,
          approvedBy: formattedAdminName,
        }
      );
      setStatusMessage(
        `✅ Admission for ${selectedAdmission.student?.user?.name || "Student"} approved by ${formattedAdminName}! Assigned to Class ${approveData.className}-${approveData.section}.`
      );
      setShowModal(false);
      await fetchAdmissions();
    } catch (error: any) {
      setStatusMessage("Failed to approve admission");
    } finally {
      setLoading(false);
    }
  };

  // ── Super Admin: Reject ─────────────────────────────────────────────────────
  const handleRejectClick = (admission: any) => {
    setSelectedAdmission(admission);
    setModalAction("reject");
    setApproveData({ className: "", section: "" });
    setRejectReason("");
    setShowModal(true);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await API.post(
        `/api/admin/student-admin/admissions/${selectedAdmission._id}/reject`,
        { reason: rejectReason, processedBy: formattedAdminName }
      );
      setStatusMessage(`Admission for ${selectedAdmission.student?.user?.name || "Applicant"} rejected by ${formattedAdminName}.`);
      setShowModal(false);
      await fetchAdmissions();
    } catch (error: any) {
      setStatusMessage("Failed to reject admission");
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredAdmissions = admissions.filter((adm: any) => {
    const studentUser = adm.student?.user || {};
    const name = studentUser.name || adm.studentName || "";
    const email = studentUser.email || adm.studentEmail || "";
    const submittedBy = adm.submittedBy || adm.processedBy || adm.approvedBy || "";
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submittedBy.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter !== "all" && (adm.status || "").toLowerCase() !== filter.toLowerCase()) return false;
    return matchesSearch;
  });

  const approvedList = admissions.filter((adm: any) => adm.status === "Approved");
  const pendingList = admissions.filter((adm: any) => adm.status === "Pending");
  const rejectedList = admissions.filter((adm: any) => adm.status === "Rejected");

  // ── Input style helper ──────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 13px",
    borderRadius: "9px",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--input-bg)",
    color: "var(--text-main)",
    fontSize: "13px",
    boxSizing: "border-box",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 700,
    color: "var(--text-muted)",
    marginBottom: "5px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };

  return (
    <div style={{ padding: "24px", color: "var(--text-main)" }}>
      {/* ── Header Banner ─────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)",
        borderRadius: "16px", padding: "24px", marginBottom: "24px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.04)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ backgroundColor: "rgba(99,102,241,0.15)", color: "#6366f1", padding: "8px 12px", borderRadius: "12px", fontSize: "18px" }}>🎓</span>
              Student Admissions Portal
            </h2>
            <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
              {isSuperAdmin
                ? "Review all pending applications, approve/reject admissions, or perform instant direct enrollments."
                : "Submit new student admission applications or directly enroll students into classes."}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => setActiveSubTab("new")}
              style={{
                padding: "10px 18px", backgroundColor: "#6366f1", color: "white", border: "none",
                borderRadius: "10px", fontWeight: 800, fontSize: "13px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 12px rgba(99,102,241,0.35)"
              }}
            >
              <FiUserPlus style={{ fontSize: "16px" }} />
              ➕ Take New Admission
            </button>
            <div style={{ backgroundColor: "var(--panel-bg)", border: "1px solid var(--border-color)", padding: "10px 16px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
              {isSuperAdmin
                ? <FiShield style={{ color: "#6366f1", fontSize: "18px" }} />
                : <FiUserCheck style={{ color: "#10b981", fontSize: "18px" }} />}
              <div>
                <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                  {isSuperAdmin ? "Approval Authority" : "Logged In As"}
                </div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)" }}>{currentUserName}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginTop: "20px" }}>
          {[
            { label: "📑 TOTAL", value: admissions.length, color: "#6366f1" },
            { label: "⏳ PENDING APPROVAL", value: pendingList.length, color: "#f59e0b" },
            { label: "✅ APPROVED", value: approvedList.length, color: "#10b981" },
            { label: "❌ REJECTED", value: rejectedList.length, color: "#ef4444" },
          ].map(card => (
            <div key={card.label} style={{ backgroundColor: "var(--panel-bg)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: card.color, marginBottom: "4px" }}>{card.label}</div>
              <div style={{ fontSize: "26px", fontWeight: 900, color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Status Message ────────────────────────────────────────────────── */}
      {statusMessage && (
        <div style={{
          marginBottom: "20px", padding: "14px 18px", borderRadius: "12px", fontSize: "14px", fontWeight: 600,
          backgroundColor: statusMessage.toLowerCase().includes("failed") || statusMessage.toLowerCase().includes("error")
            ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
          color: statusMessage.toLowerCase().includes("failed") || statusMessage.toLowerCase().includes("error")
            ? "#ef4444" : "#10b981",
          border: `1px solid ${statusMessage.toLowerCase().includes("failed") || statusMessage.toLowerCase().includes("error")
            ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
        }}>
          {statusMessage}
        </div>
      )}

      {/* ── Sub-Tab Navigation ────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        {[
          { key: "new", label: "➕ Submit New Admission", color: "#6366f1" },
          { key: "queue", label: `📑 Applications Queue (${admissions.length})`, color: "#f59e0b" },
          { key: "approved", label: `✅ Approved (${approvedList.length})`, color: "#10b981" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key as any)}
            style={{
              padding: "10px 20px", borderRadius: "10px", border: "none",
              backgroundColor: activeSubTab === tab.key ? tab.color : "var(--card-bg)",
              color: activeSubTab === tab.key ? "#fff" : "var(--text-main)",
              fontWeight: 700, fontSize: "13px", cursor: "pointer",
              boxShadow: activeSubTab === tab.key ? `0 4px 12px ${tab.color}40` : "none",
              transition: "all 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SUB-TAB: NEW ADMISSION FORM (Single Unified Form)
      ══════════════════════════════════════════════════════════════ */}
      {activeSubTab === "new" && (
        <div style={{
          backgroundColor: "var(--card-bg)",
          border: "1px solid var(--border-color)",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
        }}>
          {/* Header */}
          <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "20px", marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ backgroundColor: "rgba(99,102,241,0.15)", color: "#6366f1", padding: "8px 12px", borderRadius: "10px", fontSize: "16px" }}>📝</span>
                  New Student Admission & Enrollment Form
                </h3>
                <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--text-muted)", maxWidth: "600px" }}>
                  Fill in the student and parent details below to complete new student registration and class enrollment.
                </p>
              </div>

              {/* Active Admin Badge */}
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                backgroundColor: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
                padding: "8px 14px", borderRadius: "10px"
              }}>
                <FiUserCheck style={{ color: "#6366f1", fontSize: "16px" }} />
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#6366f1" }}>
                  Admin: {formattedAdminName}
                </span>
              </div>
            </div>
          </div>

          {/* Admission Form */}
          <form onSubmit={handleNewAdmissionSubmit}>
            {/* Section 1: Student Personal Details */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-main)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#6366f1" }}>👤</span> Student Personal Information
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" }}>
                {/* Student Full Name */}
                <div>
                  <label style={labelStyle}><FiUser style={{ marginRight: 4 }} />Student Full Name *</label>
                  <input style={inputStyle} type="text" required placeholder="e.g. Rahul Sharma"
                    value={newAdmForm.studentName}
                    onChange={e => setNewAdmForm(f => ({ ...f, studentName: e.target.value }))} />
                </div>

                {/* Student Email */}
                <div>
                  <label style={labelStyle}><FiMail style={{ marginRight: 4 }} />Student Email *</label>
                  <input style={inputStyle} type="email" required placeholder="rahul.sharma@example.com"
                    value={newAdmForm.studentEmail}
                    onChange={e => setNewAdmForm(f => ({ ...f, studentEmail: e.target.value }))} />
                </div>

                {/* Student Phone */}
                <div>
                  <label style={labelStyle}><FiPhone style={{ marginRight: 4 }} />Student Phone Number</label>
                  <input style={inputStyle} type="tel" placeholder="10-digit mobile number"
                    value={newAdmForm.studentPhone}
                    onChange={e => setNewAdmForm(f => ({ ...f, studentPhone: e.target.value }))} />
                </div>

                {/* Date of Birth */}
                <div>
                  <label style={labelStyle}><FiCalendar style={{ marginRight: 4 }} />Date of Birth</label>
                  <input style={inputStyle} type="date"
                    value={newAdmForm.dob}
                    onChange={e => setNewAdmForm(f => ({ ...f, dob: e.target.value }))} />
                </div>

                {/* Gender */}
                <div>
                  <label style={labelStyle}>Gender</label>
                  <select style={inputStyle} value={newAdmForm.gender}
                    onChange={e => setNewAdmForm(f => ({ ...f, gender: e.target.value }))}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Academic & Class Allocation */}
            <div style={{ marginBottom: "24px", paddingTop: "16px", borderTop: "1px dashed var(--border-color)" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-main)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#f59e0b" }}>🏫</span> Class & Section Allocation
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" }}>
                {/* Target Class */}
                <div>
                  <label style={labelStyle}><FiBook style={{ marginRight: 4 }} />Assign Class *</label>
                  <select style={inputStyle} required value={newAdmForm.applyingClass}
                    onChange={e => setNewAdmForm(f => ({ ...f, applyingClass: e.target.value }))}>
                    {["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"].map(c => (
                      <option key={c} value={c}>Class {c}</option>
                    ))}
                  </select>
                </div>

                {/* Section */}
                <div>
                  <label style={labelStyle}><FiBook style={{ marginRight: 4 }} />Assign Section *</label>
                  <select style={inputStyle} required value={newAdmForm.section}
                    onChange={e => setNewAdmForm(f => ({ ...f, section: e.target.value }))}>
                    {["A", "B", "C", "D", "E"].map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>

                {/* Initial Password */}
                <div>
                  <label style={labelStyle}><FiShield style={{ marginRight: 4 }} />Student Account Password</label>
                  <input style={inputStyle} type="text" placeholder="Default: Student@123"
                    value={newAdmForm.password}
                    onChange={e => setNewAdmForm(f => ({ ...f, password: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Section 3: Parent / Guardian Details */}
            <div style={{ marginBottom: "24px", paddingTop: "16px", borderTop: "1px dashed var(--border-color)" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-main)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#10b981" }}>👨‍👩‍👦</span> Parent / Guardian Details
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" }}>
                {/* Guardian Name */}
                <div>
                  <label style={labelStyle}><FiUser style={{ marginRight: 4 }} />Parent / Guardian Name</label>
                  <input style={inputStyle} type="text" placeholder="Father or Mother name"
                    value={newAdmForm.guardianName}
                    onChange={e => setNewAdmForm(f => ({ ...f, guardianName: e.target.value }))} />
                </div>

                {/* Guardian Phone */}
                <div>
                  <label style={labelStyle}><FiPhone style={{ marginRight: 4 }} />Guardian Phone Number</label>
                  <input style={inputStyle} type="tel" placeholder="Parent mobile number"
                    value={newAdmForm.guardianPhone}
                    onChange={e => setNewAdmForm(f => ({ ...f, guardianPhone: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Section 4: Remarks */}
            <div style={{ marginBottom: "24px", paddingTop: "16px", borderTop: "1px dashed var(--border-color)" }}>
              <label style={labelStyle}><FiFileText style={{ marginRight: 4 }} />Additional Remarks / Admission Notes</label>
              <textarea
                style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }}
                placeholder="Enter any previous school details or special admission notes..."
                value={newAdmForm.remark}
                onChange={e => setNewAdmForm(f => ({ ...f, remark: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Submit & Action Buttons */}
            <div style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap", paddingTop: "16px", borderTop: "1px solid var(--border-color)" }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "13px 32px",
                  backgroundColor: "#6366f1",
                  color: "white",
                  border: "none", borderRadius: "10px", cursor: submitting ? "not-allowed" : "pointer",
                  fontWeight: 800, fontSize: "14px",
                  boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
                  display: "flex", alignItems: "center", gap: "8px",
                  opacity: submitting ? 0.7 : 1, transition: "all 0.2s"
                }}
              >
                <FiSend />
                {submitting ? "Processing Admission..." : "🚀 Submit & Enroll Student"}
              </button>

              <button
                type="button"
                onClick={() => setNewAdmForm({ studentName: "", studentEmail: "", studentPhone: "", dob: "", gender: "Male", guardianName: "", guardianPhone: "", applyingClass: "1st", section: "A", password: "", remark: "" })}
                style={{
                  padding: "13px 22px", backgroundColor: "var(--panel-bg)", color: "var(--text-muted)",
                  border: "1px solid var(--border-color)", borderRadius: "10px", cursor: "pointer",
                  fontWeight: 700, fontSize: "13px"
                }}
              >
                🧹 Clear Inputs
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SUB-TAB: APPLICATIONS QUEUE
      ══════════════════════════════════════════════════════════════ */}
      {activeSubTab === "queue" && (
        <>
          {/* Search & Filter Bar */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "20px",
            padding: "16px", backgroundColor: "var(--card-bg)", borderRadius: "14px",
            border: "1px solid var(--border-color)", alignItems: "flex-end"
          }}>
            <div style={{ flex: "1 1 240px" }}>
              <label style={labelStyle}>🔍 Search (Name / Email / Submitted By)</label>
              <input type="text" placeholder="Search applicant or submitter..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ width: "160px" }}>
              <label style={labelStyle}>💳 Status</label>
              <select value={filter} onChange={e => setFilter(e.target.value)} style={inputStyle}>
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            {(searchQuery || filter !== "all") && (
              <button onClick={() => { setSearchQuery(""); setFilter("all"); }}
                style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}>
                🧹 Clear
              </button>
            )}
          </div>

          {loading && <p style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>Loading admissions data...</p>}

          {!loading && (
            <div style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "20px", overflowX: "auto" }}>
              {/* Super Admin notice */}
              {isSuperAdmin && (
                <div style={{
                  backgroundColor: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
                  borderRadius: "10px", padding: "12px 16px", marginBottom: "16px",
                  display: "flex", alignItems: "center", gap: "10px"
                }}>
                  <FiShield style={{ color: "#6366f1", fontSize: "18px", flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#6366f1" }}>
                    You are Super Admin — you can Approve or Reject pending admissions below.
                  </span>
                </div>
              )}
              {!isSuperAdmin && (
                <div style={{
                  backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
                  borderRadius: "10px", padding: "12px 16px", marginBottom: "16px",
                  display: "flex", alignItems: "center", gap: "10px"
                }}>
                  <FiClock style={{ color: "#f59e0b", fontSize: "18px", flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#d97706" }}>
                    Viewing admission applications. Only Super Admin can approve or reject.
                  </span>
                </div>
              )}
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Applicant Name</th>
                    <th>Contact</th>
                    <th>Applied Class</th>
                    <th>Submitted By 👤</th>
                    <th>Submitted On</th>
                    <th>Status</th>
                    {isSuperAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmissions.length > 0 ? (
                    filteredAdmissions.map((admission) => {
                      const studentUser = admission.student?.user || {};
                      const studentName = studentUser.name || admission.studentName || "Unknown";
                      const studentEmail = studentUser.email || admission.studentEmail || "N/A";
                      const studentPhone = studentUser.phone || admission.studentPhone || "N/A";
                      const submittedBy = admission.submittedBy || admission.processedBy || "Super Admin";
                      const submittedAt = admission.submittedAt || admission.appliedDate || admission.createdAt;
                      const applyingClass = admission.applyingClass || admission.allocatedClass || "N/A";
                      const isPending = admission.status === "Pending";
                      const isApproved = admission.status === "Approved";
                      const isRejected = admission.status === "Rejected";

                      return (
                        <tr key={admission._id}>
                          <td>
                            <strong style={{ color: "var(--text-main)", fontSize: "14px" }}>{studentName}</strong>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>ID: {admission._id?.slice(-8).toUpperCase()}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: "13px" }}>📧 {studentEmail}</div>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>📞 {studentPhone}</div>
                          </td>
                          <td>
                            <span style={{ padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, backgroundColor: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.2)" }}>
                              Class {applyingClass}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ backgroundColor: "rgba(99,102,241,0.15)", color: "#6366f1", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 800 }}>
                                👤
                              </span>
                              <div>
                                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)" }}>{submittedBy}</div>
                                {admission.remark && (
                                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", fontStyle: "italic" }}>
                                    📝 {admission.remark}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {submittedAt ? new Date(submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </td>
                          <td>
                            <span style={{
                              padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
                              backgroundColor: isPending ? "rgba(245,158,11,0.15)" : isApproved ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                              color: isPending ? "#d97706" : isApproved ? "#10b981" : "#ef4444",
                            }}>
                              {isApproved ? "✅ Approved" : isPending ? "⏳ Pending Approval" : "❌ Rejected"}
                            </span>
                          </td>
                          {isSuperAdmin && (
                            <td>
                              {isPending ? (
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button onClick={() => handleApproveClick(admission)}
                                    style={{ padding: "6px 14px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "12px" }}>
                                    ✓ Approve
                                  </button>
                                  <button onClick={() => handleRejectClick(admission)}
                                    style={{ padding: "6px 12px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "12px" }}>
                                    ✕ Reject
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
                                  {isApproved ? "✅ Enrolled" : "📦 Archived"}
                                </span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={isSuperAdmin ? 7 : 6} style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
                        No admission applications found. Use the <strong>"Submit New Admission"</strong> tab to add one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SUB-TAB: APPROVED DIRECTORY
      ══════════════════════════════════════════════════════════════ */}
      {activeSubTab === "approved" && !loading && (
        <div style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "24px" }}>
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#10b981", display: "flex", alignItems: "center", gap: "8px" }}>
              ✅ Approved Admissions Directory & Audit Log
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
              Full audit log: shows who submitted each application and who (Super Admin) approved it.
            </p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Enrolled Student</th>
                  <th>Contact</th>
                  <th>Allocated Grade</th>
                  <th>Submitted By 👤</th>
                  <th>Approved By 🛡️</th>
                  <th>Approval Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {approvedList.length > 0 ? (
                  approvedList.map((admission) => {
                    const studentUser = admission.student?.user || {};
                    const studentObj = admission.student || {};
                    const assignedClass = admission.allocatedClass
                      ? `Class ${admission.allocatedClass}-${admission.allocatedSection || "A"}`
                      : (studentObj.className ? `Class ${studentObj.className}-${studentObj.section || "A"}` : "N/A");
                    const submittedBy = admission.submittedBy || "—";
                    const approvedBy = admission.approvedBy || admission.processedBy || "Super Admin";

                    return (
                      <tr key={admission._id}>
                        <td>
                          <strong style={{ color: "var(--text-main)", fontSize: "14px" }}>{studentUser.name || admission.studentName || "Student"}</strong>
                          <div style={{ fontSize: "11px", color: "#10b981", fontWeight: 700 }}>Reg: ADM-{admission._id?.slice(-6).toUpperCase()}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: "13px" }}>📧 {studentUser.email || admission.studentEmail || "N/A"}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>📞 {studentUser.phone || admission.studentPhone || "N/A"}</div>
                        </td>
                        <td>
                          <span style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 800, backgroundColor: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", display: "inline-block" }}>
                            🏫 {assignedClass}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#6366f1" }}>👤 {submittedBy}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ backgroundColor: "rgba(99,102,241,0.15)", color: "#6366f1", padding: "3px 8px", borderRadius: "6px", fontSize: "11px" }}>🛡️ Super Admin</span>
                            {approvedBy}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-main)" }}>
                            📅 {admission.approvedAt ? new Date(admission.approvedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            ⏰ {admission.approvedAt ? new Date(admission.approvedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </div>
                        </td>
                        <td>
                          <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 800, backgroundColor: "rgba(16,185,129,0.2)", color: "#10b981" }}>
                            ✅ ADMITTED & ACTIVE
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
                      No approved admissions yet. Pending applications will appear here after Super Admin approval.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          APPROVAL / REJECTION MODAL (Super Admin Only)
      ══════════════════════════════════════════════════════════════ */}
      {showModal && isSuperAdmin && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)", display: "flex",
          justifyContent: "center", alignItems: "center", zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)",
            padding: "30px", borderRadius: "16px", maxWidth: "460px", width: "90%",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
          }}>
            <h3 style={{ marginTop: 0, color: "var(--text-main)", fontSize: "18px", fontWeight: 800 }}>
              {modalAction === "approve" ? "✅ Approve & Allocate Class" : "❌ Reject Admission"}
            </h3>

            {/* Applicant info */}
            <div style={{ backgroundColor: "var(--panel-bg)", padding: "12px 16px", borderRadius: "10px", marginBottom: "20px", border: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>APPLICANT</div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-main)", marginTop: "2px" }}>
                {selectedAdmission?.student?.user?.name || selectedAdmission?.studentName}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                📧 {selectedAdmission?.student?.user?.email || selectedAdmission?.studentEmail}
              </div>
              {selectedAdmission?.submittedBy && (
                <div style={{ fontSize: "12px", color: "#6366f1", fontWeight: 700, marginTop: "6px" }}>
                  👤 Submitted by: {selectedAdmission.submittedBy}
                </div>
              )}
              <div style={{ fontSize: "12px", color: "#6366f1", fontWeight: 700, marginTop: "4px" }}>
                🛡️ Approving as: {formattedAdminName}
              </div>
            </div>

            {modalAction === "approve" ? (
              <form onSubmit={handleApproveSubmit}>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ ...labelStyle, marginBottom: "6px" }}>Assign to Class:</label>
                  <select required style={inputStyle} value={approveData.className}
                    onChange={e => setApproveData({ ...approveData, className: e.target.value })}>
                    {["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"].map(c => (
                      <option key={c} value={c}>Class {c}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ ...labelStyle, marginBottom: "6px" }}>Assign Section:</label>
                  <select required style={inputStyle} value={approveData.section}
                    onChange={e => setApproveData({ ...approveData, section: e.target.value })}>
                    {["A", "B", "C", "D"].map(s => <option key={s} value={s}>Section {s}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" disabled={loading}
                    style={{ padding: "11px 20px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "8px", cursor: loading ? "not-allowed" : "pointer", flex: 1, fontWeight: 700, fontSize: "13px" }}>
                    {loading ? "Processing..." : "✓ Confirm & Grant Admission"}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)}
                    style={{ padding: "11px 20px", backgroundColor: "var(--panel-bg)", color: "var(--text-main)", border: "1px solid var(--border-color)", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRejectSubmit}>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ ...labelStyle, marginBottom: "6px" }}>Reason for Rejection:</label>
                  <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    placeholder="Provide detailed rejection notes..." required rows={4}
                    style={{ ...inputStyle, resize: "vertical" }} />
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" disabled={loading}
                    style={{ padding: "11px 20px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "8px", cursor: loading ? "not-allowed" : "pointer", flex: 1, fontWeight: 700, fontSize: "13px" }}>
                    {loading ? "Processing..." : "✕ Confirm Rejection"}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)}
                    style={{ padding: "11px 20px", backgroundColor: "var(--panel-bg)", color: "var(--text-main)", border: "1px solid var(--border-color)", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admissions;