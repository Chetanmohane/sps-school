import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import { FiUsers, FiUserCheck, FiUserPlus, FiSearch, FiLayers, FiCheck, FiX, FiRefreshCw, FiDownload } from "react-icons/fi";
import "../../assets/styles/main.css";

const STANDARD_CLASSES = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid var(--border-color)',
  backgroundColor: 'var(--input-bg)',
  color: 'var(--text-main)',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '6px'
};

const ClassAllocation: React.FC = () => {
  const [unallocatedStudents, setUnallocatedStudents] = useState<any[]>([]);
  const [studentsByClass, setStudentsByClass] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"unallocated" | "byClass">("unallocated");
  const [selectedClass, setSelectedClass] = useState("10th");
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [allocationData, setAllocationData] = useState({
    className: "10th",
    section: "A",
    rollNumber: "",
  });
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [dbClasses, setDbClasses] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchClassNames();
    fetchUnallocatedStudents();
  }, []);

  useEffect(() => {
    if (activeTab === "unallocated") {
      fetchUnallocatedStudents();
    } else if (activeTab === "byClass" && selectedClass) {
      fetchStudentsByClass();
    }
  }, [activeTab, selectedClass]);

  const fetchClassNames = async () => {
    try {
      const response = await API.get("/api/admin/student-admin/classes");
      setDbClasses(response.data?.data || []);
    } catch {
      setDbClasses([]);
    }
  };

  const fetchUnallocatedStudents = async () => {
    try {
      setLoading(true);
      const response = await API.get("/api/admin/student-admin/allocation/unallocated");
      setUnallocatedStudents(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching unallocated students:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsByClass = async () => {
    if (!selectedClass) return;
    try {
      setLoading(true);
      const response = await API.get(`/api/admin/student-admin/classes/${selectedClass}/students`);
      setStudentsByClass(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching students by class:", error);
      setStudentsByClass([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAllocateClick = (student: any) => {
    setEditingStudent(student);
    const targetClass = student.className || selectedClass || "10th";
    setAllocationData({
      className: targetClass,
      section: student.section || "A",
      rollNumber: student.rollNumber || "",
    });
    setShowModal(true);
  };

  const autoSuggestRollNumber = () => {
    const existingRolls = studentsByClass
      .map(s => parseInt(s.rollNumber, 10))
      .filter(n => !isNaN(n));
    const maxRoll = existingRolls.length > 0 ? Math.max(...existingRolls) : 0;
    const nextRoll = (maxRoll + 1).toString().padStart(2, '0');
    setAllocationData(prev => ({ ...prev, rollNumber: nextRoll }));
  };

  const handleSaveAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocationData.className || !allocationData.section) {
      setStatusMessage({ text: "Please select Class and Section.", type: "error" });
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusMessage(null);
      await API.post(`/api/admin/student-admin/allocation/${editingStudent._id}`, allocationData);
      
      setStatusMessage({ 
        text: `✅ ${editingStudent?.user?.name || 'Student'} allocated to Class ${allocationData.className}-${allocationData.section} (Roll: ${allocationData.rollNumber || 'N/A'})!`, 
        type: "success" 
      });
      
      setShowModal(false);
      fetchUnallocatedStudents();
      fetchClassNames();
      if (selectedClass) fetchStudentsByClass();
    } catch (error: any) {
      setStatusMessage({ 
        text: error.response?.data?.message || "Failed to allocate student. Please try again.", 
        type: "error" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Combine standard classes with dynamic db classes
  const allClassOptions = Array.from(new Set([...STANDARD_CLASSES, ...dbClasses])).sort();

  const filteredUnallocated = unallocatedStudents.filter(s => {
    const name = (s.user?.name || "").toLowerCase();
    const email = (s.user?.email || "").toLowerCase();
    const phone = (s.user?.phone || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return !searchQuery || name.includes(q) || email.includes(q) || phone.includes(q);
  });

  const filteredByClass = studentsByClass.filter(s => {
    const name = (s.user?.name || "").toLowerCase();
    const email = (s.user?.email || "").toLowerCase();
    const roll = (s.rollNumber || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return !searchQuery || name.includes(q) || email.includes(q) || roll.includes(q);
  });

  const downloadCSV = () => {
    const listToExport = activeTab === "unallocated" ? filteredUnallocated : filteredByClass;
    if (!listToExport.length) {
      alert("No data available to export.");
      return;
    }
    const headers = ["Student Name", "Email", "Phone", "Class", "Section", "Roll Number"];
    const rows = listToExport.map(s => [
      s.user?.name || "N/A",
      s.user?.email || "N/A",
      s.user?.phone || "N/A",
      s.className || "Unallocated",
      s.section || "N/A",
      s.rollNumber || "N/A"
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `class_allocation_${activeTab}.csv`;
    link.click();
  };

  return (
    <div style={{ padding: "10px", color: "var(--text-main)" }}>
      {/* ── Page Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
        borderRadius: "20px",
        padding: "28px 32px",
        marginBottom: "24px",
        color: "white",
        boxShadow: "0 10px 30px rgba(59, 130, 246, 0.25)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span style={{ backgroundColor: "rgba(255,255,255,0.2)", fontSize: "11px", fontWeight: 800, padding: "3px 12px", borderRadius: "20px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              🎓 Student Academic Management
            </span>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 900, margin: "0 0 4px 0", color: "#ffffff" }}>
            Class &amp; Section Allocation Portal
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.85)", maxWidth: "550px" }}>
            Assign unallocated student admissions to grade sections &amp; roll numbers, or manage existing class rosters.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={fetchUnallocatedStudents}
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
              padding: "10px 18px",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <FiRefreshCw /> Refresh Data
          </button>
          <button
            onClick={downloadCSV}
            style={{
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              padding: "10px 18px",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(16,185,129,0.35)"
            }}
          >
            <FiDownload /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Status Message Alert ── */}
      {statusMessage && (
        <div style={{
          marginBottom: "20px",
          padding: "14px 20px",
          borderRadius: "12px",
          fontSize: "14px",
          fontWeight: 700,
          backgroundColor: statusMessage.type === "error" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
          color: statusMessage.type === "error" ? "#ef4444" : "#10b981",
          border: `1px solid ${statusMessage.type === "error" ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: "16px" }}>✕</button>
        </div>
      )}

      {/* ── Quick KPI Stat Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Unallocated Students</div>
            <div style={{ fontSize: "28px", fontWeight: 900, color: "#f59e0b", marginTop: "4px" }}>{unallocatedStudents.length}</div>
          </div>
          <div style={{ width: "46px", height: "46px", borderRadius: "12px", backgroundColor: "rgba(245,158,11,0.12)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FiUserPlus size={22} />
          </div>
        </div>

        <div style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Class Selected Roster</div>
            <div style={{ fontSize: "28px", fontWeight: 900, color: "#3b82f6", marginTop: "4px" }}>{studentsByClass.length}</div>
          </div>
          <div style={{ width: "46px", height: "46px", borderRadius: "12px", backgroundColor: "rgba(59,130,246,0.12)", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FiUsers size={22} />
          </div>
        </div>

        <div style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Configured Grades</div>
            <div style={{ fontSize: "28px", fontWeight: 900, color: "#10b981", marginTop: "4px" }}>{allClassOptions.length}</div>
          </div>
          <div style={{ width: "46px", height: "46px", borderRadius: "12px", backgroundColor: "rgba(16,185,129,0.12)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FiLayers size={22} />
          </div>
        </div>
      </div>

      {/* ── Main Tab Navigation Bar & Search ── */}
      <div style={{
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--border-color)",
        borderRadius: "16px",
        padding: "16px 20px",
        marginBottom: "24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        {/* Sub Tabs */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setActiveTab("unallocated")}
            style={{
              padding: "10px 22px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: activeTab === "unallocated" ? "#3b82f6" : "var(--panel-bg)",
              color: activeTab === "unallocated" ? "#ffffff" : "var(--text-main)",
              fontWeight: 800,
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: activeTab === "unallocated" ? "0 4px 14px rgba(59,130,246,0.35)" : "none",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s"
            }}
          >
            <span>📌</span> Unallocated Queue ({unallocatedStudents.length})
          </button>
          <button
            onClick={() => setActiveTab("byClass")}
            style={{
              padding: "10px 22px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: activeTab === "byClass" ? "#8b5cf6" : "var(--panel-bg)",
              color: activeTab === "byClass" ? "#ffffff" : "var(--text-main)",
              fontWeight: 800,
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: activeTab === "byClass" ? "0 4px 14px rgba(139,92,246,0.35)" : "none",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s"
            }}
          >
            <span>📚</span> View Roster by Class
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ position: "relative", minWidth: "260px" }}>
          <FiSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search student name, email, roll..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ ...inputStyle, paddingLeft: "36px" }}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
           TAB 1: UNALLOCATED STUDENTS QUEUE
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "unallocated" && (
        <div style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "18px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--text-main)" }}>
              📌 New Student Admission Queue ({filteredUnallocated.length})
            </h3>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Select a student below to assign Class, Section &amp; Roll Number</span>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>⏳ Loading unallocated queue...</div>
          ) : (
            <div className="table-container">
              <table className="data-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student Name</th>
                    <th>Email Address</th>
                    <th>Contact Phone</th>
                    <th>Gender</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnallocated.length > 0 ? (
                    filteredUnallocated.map((student, idx) => (
                      <tr key={student._id}>
                        <td style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 700 }}>{idx + 1}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "rgba(245,158,11,0.15)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "13px" }}>
                              {(student.user?.name || "?")[0].toUpperCase()}
                            </div>
                            <strong style={{ color: "var(--text-main)" }}>{student.user?.name || "N/A"}</strong>
                          </div>
                        </td>
                        <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>{student.user?.email || "N/A"}</td>
                        <td style={{ fontSize: "13px" }}>{student.user?.phone || "N/A"}</td>
                        <td>{student.gender || "N/A"}</td>
                        <td>
                          <span style={{ padding: "3px 10px", backgroundColor: "rgba(245,158,11,0.12)", color: "#f59e0b", borderRadius: "20px", fontSize: "11px", fontWeight: 800 }}>
                            Unallocated
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleAllocateClick(student)}
                            style={{
                              padding: "7px 16px",
                              backgroundColor: "#10b981",
                              color: "white",
                              border: "none",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontWeight: 800,
                              fontSize: "12px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              boxShadow: "0 4px 12px rgba(16,185,129,0.3)"
                            }}
                          >
                            ➕ Allocate Class
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
                        🎉 Great job! All students are assigned to classes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
           TAB 2: VIEW BY CLASS ROSTER
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "byClass" && (
        <div style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "18px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          {/* Class Picker */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", flexWrap: "wrap", backgroundColor: "var(--panel-bg)", padding: "16px", borderRadius: "14px", border: "1px solid var(--border-color)" }}>
            <label style={{ fontWeight: 800, fontSize: "14px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>🏫 Select Grade / Class:</span>
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{ ...inputStyle, width: "240px", fontWeight: 800, fontSize: "14px", color: "#3b82f6" }}
            >
              {allClassOptions.map((cls) => (
                <option key={cls} value={cls}>
                  Class {cls}
                </option>
              ))}
            </select>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Showing allocated roster for <strong>Class {selectedClass}</strong>
            </span>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>⏳ Fetching class roster...</div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--text-main)" }}>
                  📚 Class {selectedClass} Roster ({filteredByClass.length} Enrolled Students)
                </h3>
              </div>

              <div className="table-container">
                <table className="data-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Roll No.</th>
                      <th>Student Name</th>
                      <th>Email Address</th>
                      <th>Section</th>
                      <th>Contact Phone</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredByClass.length > 0 ? (
                      filteredByClass.map((student) => (
                        <tr key={student._id}>
                          <td>
                            <span style={{ padding: "3px 10px", backgroundColor: "rgba(59,130,246,0.12)", color: "#3b82f6", borderRadius: "6px", fontSize: "12px", fontWeight: 800 }}>
                              {student.rollNumber || "N/A"}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: "var(--text-main)" }}>{student.user?.name || "N/A"}</strong>
                          </td>
                          <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>{student.user?.email || "N/A"}</td>
                          <td>
                            <span style={{ padding: "3px 10px", backgroundColor: "rgba(16,185,129,0.12)", color: "#10b981", borderRadius: "6px", fontSize: "12px", fontWeight: 800 }}>
                              Sec {student.section || "A"}
                            </span>
                          </td>
                          <td style={{ fontSize: "13px" }}>{student.user?.phone || "N/A"}</td>
                          <td>
                            <span style={{ padding: "3px 10px", backgroundColor: "rgba(16,185,129,0.15)", color: "#10b981", borderRadius: "20px", fontSize: "11px", fontWeight: 800 }}>
                              Active
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => handleAllocateClick(student)}
                              style={{
                                padding: "6px 14px",
                                backgroundColor: "rgba(99,102,241,0.12)",
                                color: "#6366f1",
                                border: "1px solid rgba(99,102,241,0.3)",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontWeight: 700,
                                fontSize: "12px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              📝 Modify / Reallocate
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
                          📭 No students found enrolled in Class {selectedClass}. Select another grade or allocate students from queue.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
           MODAL: SMART ALLOCATION FORM
      ═══════════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(8px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 3000,
            padding: "16px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              borderRadius: "20px",
              maxWidth: "460px",
              width: "100%",
              boxShadow: "0 25px 60px -12px rgba(0,0,0,0.35)",
              overflow: "hidden"
            }}
          >
            {/* Modal Header */}
            <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)", padding: "20px 24px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 900, display: "flex", alignItems: "center", gap: "8px" }}>
                  🎓 Allocate Student
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>
                  Assign class, section and roll number
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", color: "white", cursor: "pointer", padding: "6px 10px", fontSize: "16px", fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveAllocation} style={{ padding: "24px" }}>
              {/* Student info card */}
              <div style={{ backgroundColor: "var(--panel-bg)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "14px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#3b82f6", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "16px", flexShrink: 0 }}>
                  {(editingStudent?.user?.name || "?")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "14px", color: "var(--text-main)" }}>{editingStudent?.user?.name}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{editingStudent?.user?.email} &nbsp;•&nbsp; {editingStudent?.user?.phone || 'No phone'}</div>
                </div>
              </div>

              {/* Class Dropdown Selector */}
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Class / Grade *</label>
                <select
                  required
                  value={allocationData.className}
                  onChange={(e) => setAllocationData({ ...allocationData, className: e.target.value })}
                  style={{ ...inputStyle, fontWeight: 700, cursor: "pointer" }}
                >
                  {allClassOptions.map((cls) => (
                    <option key={cls} value={cls}>
                      Class {cls}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section Selector */}
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Section *</label>
                <select
                  required
                  value={allocationData.section}
                  onChange={(e) => setAllocationData({ ...allocationData, section: e.target.value })}
                  style={{ ...inputStyle, fontWeight: 700, cursor: "pointer" }}
                >
                  {SECTIONS.map((sec) => (
                    <option key={sec} value={sec}>
                      Section {sec}
                    </option>
                  ))}
                </select>
              </div>

              {/* Roll Number Input with Auto-Suggest */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Roll Number</label>
                  <button
                    type="button"
                    onClick={autoSuggestRollNumber}
                    style={{ background: "none", border: "none", color: "#3b82f6", fontSize: "12px", fontWeight: 800, cursor: "pointer" }}
                  >
                    ⚡ Auto-Suggest Next Roll
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 01, 02, 15..."
                  value={allocationData.rollNumber}
                  onChange={(e) => setAllocationData({ ...allocationData, rollNumber: e.target.value })}
                  style={inputStyle}
                />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    fontWeight: 800,
                    fontSize: "14px",
                    boxShadow: "0 4px 14px rgba(59,130,246,0.35)",
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? "Saving..." : "💾 Save Allocation"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "var(--panel-bg)",
                    color: "var(--text-main)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "14px"
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassAllocation;