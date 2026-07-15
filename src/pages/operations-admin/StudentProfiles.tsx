import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import "../../assets/styles/main.css";

const StudentProfiles = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", address: "",
    dob: "", className: "", section: "", rollNumber: "",
    parentName: "", parentPhone: "", bloodGroup: "", gender: ""
  });

  const [addFormData, setAddFormData] = useState({
    name: "", email: "", phone: "", password: "",
    address: "", dob: "", className: "", section: "",
    rollNumber: "", parentName: "", parentPhone: "", bloodGroup: "", gender: ""
  });

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await API.get("/api/admin/student-admin/students");
      setStudents(response.data.data || []);
    } catch (error) {
      showStatus("Failed to fetch students", "error");
    } finally {
      setLoading(false);
    }
  };

  const showStatus = (text, type = "success") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage({ text: "", type: "" }), 4000);
  };

  const handleEditClick = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.user?.name || "",
      email: student.user?.email || "",
      phone: student.user?.phone || "",
      address: student.address || "",
      dob: student.dob ? student.dob.slice(0, 10) : "",
      className: student.className || "",
      section: student.section || "",
      rollNumber: student.rollNumber || "",
      parentName: student.parentName || "",
      parentPhone: student.parentPhone || "",
      bloodGroup: student.bloodGroup || "",
      gender: student.gender || ""
    });
    setShowModal(true);
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      setLoading(true);
      await API.put(`/api/admin/student-admin/students/${editingStudent._id}`, formData);
      showStatus("Student profile updated successfully!");
      setShowModal(false);
      fetchStudents();
    } catch (error) {
      showStatus("Failed to update student profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      setLoading(true);
      await API.delete(`/api/admin/student-admin/students/${studentId}`);
      showStatus("Student deleted successfully!");
      fetchStudents();
    } catch (error) {
      showStatus("Failed to delete student", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await API.post("/api/admin/student-admin/students", addFormData);
      showStatus("Student added successfully!");
      setShowAddModal(false);
      setAddFormData({ name: "", email: "", phone: "", password: "", address: "", dob: "", className: "", section: "", rollNumber: "", parentName: "", parentPhone: "", bloodGroup: "", gender: "" });
      fetchStudents();
    } catch (error) {
      showStatus(error.response?.data?.message || "Failed to add student", "error");
    } finally {
      setLoading(false);
    }
  };

  const uniqueClasses = [...new Set(students.map(s => s.className).filter(Boolean))].sort();
  const uniqueSections = [...new Set(students.map(s => s.section).filter(Boolean))].sort();

  const filteredStudents = students.filter(s => {
    const matchSearch = !searchTerm ||
      s.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber?.toString().includes(searchTerm);
    const matchClass = filterClass === "all" || s.className === filterClass;
    const matchSection = filterSection === "all" || s.section === filterSection;
    return matchSearch && matchClass && matchSection;
  });

  const getInitials = (name) => name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?";
  const avatarColors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#14b8a6"];
  const getColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px", border: "1px solid var(--border-color)",
    borderRadius: "6px", boxSizing: "border-box" as const,
    backgroundColor: "var(--input-bg)", color: "var(--text-main)", outline: "none"
  };
  const labelStyle = { display: "block", marginBottom: "5px", fontWeight: "600", fontSize: "13px", color: "var(--text-main)" };

  return (
    <div style={{ padding: "20px", color: "var(--text-main)" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "15px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px" }}>
            🎓 Student Profiles
          </h2>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "13px" }}>
            Manage all student records, personal details, and academic information.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: "10px 20px", backgroundColor: "var(--primary)", color: "white",
            border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600",
            fontSize: "14px", display: "flex", alignItems: "center", gap: "6px"
          }}
        >
          ＋ Add New Student
        </button>
      </div>

      {/* Status Message */}
      {statusMessage.text && (
        <div style={{
          marginBottom: "15px", padding: "12px 16px", borderRadius: "8px", fontSize: "14px",
          backgroundColor: statusMessage.type === "error" ? "var(--danger-bg)" : "var(--success-bg)",
          color: statusMessage.type === "error" ? "var(--danger)" : "var(--success)",
          border: "1px solid " + (statusMessage.type === "error" ? "rgba(248,113,113,0.2)" : "rgba(52,211,153,0.2)")
        }}>
          {statusMessage.text}
        </div>
      )}

      {/* Stats Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "25px" }}>
        {[
          { label: "Total Students", value: students.length, color: "var(--primary)" },
          { label: "Active", value: students.filter(s => s.status !== "Inactive").length, color: "var(--success)" },
          { label: "Classes", value: uniqueClasses.length, color: "#f59e0b" },
          { label: "Showing", value: filteredStudents.length, color: "#8b5cf6" }
        ].map((stat, i) => (
          <div key={i} style={{
            backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)",
            borderRadius: "10px", padding: "15px", textAlign: "center"
          }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="🔍 Search by name, email or roll no..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ ...inputStyle, flex: "1", minWidth: "220px" }}
        />
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: "140px" }}>
          <option value="all">All Classes</option>
          {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: "130px" }}>
          <option value="all">All Sections</option>
          {uniqueSections.map(s => <option key={s} value={s}>Section {s}</option>)}
        </select>
        {(searchTerm || filterClass !== "all" || filterSection !== "all") && (
          <button onClick={() => { setSearchTerm(""); setFilterClass("all"); setFilterSection("all"); }}
            style={{ padding: "10px 16px", backgroundColor: "var(--panel-bg)", color: "var(--text-muted)", border: "1px solid var(--border-color)", borderRadius: "6px", cursor: "pointer" }}>
            ✕ Clear
          </button>
        )}
      </div>

      {loading && <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "30px" }}>Loading students...</p>}

      {/* Student Cards Grid */}
      {!loading && filteredStudents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "48px", marginBottom: "15px" }}>🎓</div>
          <p style={{ fontSize: "16px" }}>No students found. Try changing your filters or add a new student.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "18px" }}>
          {filteredStudents.map((student) => {
            const initials = getInitials(student.user?.name);
            const color = getColor(student.user?.name);
            return (
              <div key={student._id} className="admin-role-card animate-in fade-in zoom-in-95 duration-200" style={{
                backgroundColor: "var(--card-bg)",
                border: "1px solid var(--border-color)",
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
                transition: "all 0.2s ease-in-out",
                display: "flex",
                flexDirection: "column",
                gap: "14px"
              }}>
                {/* Profile Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "12px", flexShrink: 0,
                    backgroundColor: color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontWeight: "800", fontSize: "16px",
                    boxShadow: `0 4px 12px ${color}30`
                  }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontWeight: "800", fontSize: "15px", color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {student.user?.name || "Unknown Student"}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {student.user?.email || "No email"}
                    </div>
                  </div>
                  <span style={{
                    padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700",
                    backgroundColor: "var(--success-bg)", color: "var(--success)", flexShrink: 0,
                    border: "1px solid rgba(16,185,129,0.15)"
                  }}>Active</span>
                </div>

                {/* Details Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {[
                    { label: "Class & Sec", value: student.className && student.section ? `Class ${student.className}-${student.section}` : "N/A" },
                    { label: "Roll No.", value: student.rollNumber || "N/A" },
                    { label: "Gender", value: student.gender || "N/A" },
                    { label: "Blood Group", value: student.bloodGroup || "N/A" },
                    { label: "Student Phone", value: student.user?.phone || "N/A", fullWidth: true }
                  ].map((item, i) => (
                    <div key={i} style={{ 
                      backgroundColor: "var(--panel-bg)", 
                      borderRadius: "8px", 
                      padding: "8px 12px",
                      gridColumn: item.fullWidth ? "1/-1" : "auto",
                      border: "1px solid var(--border-color)"
                    }}>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>{item.label}</div>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main)", marginTop: "2px" }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Parent Info Card */}
                <div style={{ 
                  backgroundColor: "var(--panel-bg)", 
                  borderRadius: "10px", 
                  padding: "10px 14px",
                  border: "1px solid var(--border-color)",
                  marginTop: "auto"
                }}>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700", marginBottom: "4px" }}>Parent / Guardian</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-main)" }}>{student.parentName || "N/A"}</span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>{student.parentPhone || ""}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => handleEditClick(student)} style={{
                    flex: 1, padding: "9px", backgroundColor: "var(--primary)", color: "white",
                    border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "5px"
                  }}>✏️ Edit</button>
                  <button onClick={() => handleDeleteStudent(student._id)} style={{
                    flex: 1, padding: "9px", backgroundColor: "var(--danger-bg)", color: "var(--danger)",
                    border: "1px solid rgba(248,113,113,0.2)", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "5px"
                  }}>🗑️ Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT MODAL */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)", display: "flex", justifyContent: "center",
          alignItems: "center", zIndex: 1000, padding: "16px"
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)",
            borderRadius: "14px", width: "100%", maxWidth: "580px",
            maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.3)"
          }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, color: "var(--text-main)", fontSize: "18px" }}>✏️ Edit Student Profile</h3>
                <p style={{ margin: "3px 0 0", color: "var(--text-muted)", fontSize: "12px" }}>ID: {editingStudent?._id}</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "var(--text-muted)" }}>×</button>
            </div>
            <form onSubmit={handleSaveChanges} style={{ padding: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={labelStyle}>Full Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={inputStyle} placeholder="Student full name" required />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={inputStyle} placeholder="student@school.com" />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={inputStyle} placeholder="+91XXXXXXXXXX" />
                </div>
                <div>
                  <label style={labelStyle}>Date of Birth</label>
                  <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Gender</label>
                  <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} style={inputStyle}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Class</label>
                  <input type="text" value={formData.className} onChange={e => setFormData({...formData, className: e.target.value})} style={inputStyle} placeholder="e.g., Class 10" />
                </div>
                <div>
                  <label style={labelStyle}>Section</label>
                  <input type="text" value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} style={inputStyle} placeholder="e.g., A" />
                </div>
                <div>
                  <label style={labelStyle}>Roll Number</label>
                  <input type="text" value={formData.rollNumber} onChange={e => setFormData({...formData, rollNumber: e.target.value})} style={inputStyle} placeholder="e.g., 01" />
                </div>
                <div>
                  <label style={labelStyle}>Blood Group</label>
                  <select value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})} style={inputStyle}>
                    <option value="">Select</option>
                    {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Parent / Guardian Name</label>
                  <input type="text" value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} style={inputStyle} placeholder="Parent full name" />
                </div>
                <div>
                  <label style={labelStyle}>Parent Phone</label>
                  <input type="tel" value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} style={inputStyle} placeholder="+91XXXXXXXXXX" />
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={labelStyle}>Address</label>
                  <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} style={{ ...inputStyle, minHeight: "70px", resize: "vertical" }} placeholder="Full residential address" />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "20px", paddingTop: "20px", borderTop: "1px solid var(--border-color)" }}>
                <button type="submit" disabled={loading} style={{ flex: 1, padding: "12px", backgroundColor: "var(--primary)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
                  {loading ? "Saving..." : "💾 Save Changes"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", backgroundColor: "var(--panel-bg)", color: "var(--text-main)", border: "1px solid var(--border-color)", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {showAddModal && (
        <div onClick={() => setShowAddModal(false)} style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)", display: "flex", justifyContent: "center",
          alignItems: "center", zIndex: 1000, padding: "16px"
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)",
            borderRadius: "14px", width: "100%", maxWidth: "600px",
            maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.3)"
          }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, color: "var(--text-main)", fontSize: "18px" }}>➕ Add New Student</h3>
                <p style={{ margin: "3px 0 0", color: "var(--text-muted)", fontSize: "12px" }}>Fill in all required details to register a new student.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "var(--text-muted)" }}>×</button>
            </div>
            <form onSubmit={handleAddStudent} style={{ padding: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={labelStyle}>Full Name *</label>
                  <input type="text" value={addFormData.name} onChange={e => setAddFormData({...addFormData, name: e.target.value})} style={inputStyle} placeholder="Student full name" required />
                </div>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input type="email" value={addFormData.email} onChange={e => setAddFormData({...addFormData, email: e.target.value})} style={inputStyle} placeholder="student@school.com" required />
                </div>
                <div>
                  <label style={labelStyle}>Password *</label>
                  <input type="password" value={addFormData.password} onChange={e => setAddFormData({...addFormData, password: e.target.value})} style={inputStyle} placeholder="Min 8 characters" required />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input type="tel" value={addFormData.phone} onChange={e => setAddFormData({...addFormData, phone: e.target.value})} style={inputStyle} placeholder="+91XXXXXXXXXX" />
                </div>
                <div>
                  <label style={labelStyle}>Date of Birth</label>
                  <input type="date" value={addFormData.dob} onChange={e => setAddFormData({...addFormData, dob: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Gender</label>
                  <select value={addFormData.gender} onChange={e => setAddFormData({...addFormData, gender: e.target.value})} style={inputStyle}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Class *</label>
                  <input type="text" value={addFormData.className} onChange={e => setAddFormData({...addFormData, className: e.target.value})} style={inputStyle} placeholder="e.g., Class 10" required />
                </div>
                <div>
                  <label style={labelStyle}>Section *</label>
                  <input type="text" value={addFormData.section} onChange={e => setAddFormData({...addFormData, section: e.target.value})} style={inputStyle} placeholder="e.g., A" required />
                </div>
                <div>
                  <label style={labelStyle}>Roll Number</label>
                  <input type="text" value={addFormData.rollNumber} onChange={e => setAddFormData({...addFormData, rollNumber: e.target.value})} style={inputStyle} placeholder="e.g., 01" />
                </div>
                <div>
                  <label style={labelStyle}>Blood Group</label>
                  <select value={addFormData.bloodGroup} onChange={e => setAddFormData({...addFormData, bloodGroup: e.target.value})} style={inputStyle}>
                    <option value="">Select</option>
                    {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Parent / Guardian Name</label>
                  <input type="text" value={addFormData.parentName} onChange={e => setAddFormData({...addFormData, parentName: e.target.value})} style={inputStyle} placeholder="Parent full name" />
                </div>
                <div>
                  <label style={labelStyle}>Parent Phone</label>
                  <input type="tel" value={addFormData.parentPhone} onChange={e => setAddFormData({...addFormData, parentPhone: e.target.value})} style={inputStyle} placeholder="+91XXXXXXXXXX" />
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={labelStyle}>Address</label>
                  <textarea value={addFormData.address} onChange={e => setAddFormData({...addFormData, address: e.target.value})} style={{ ...inputStyle, minHeight: "70px", resize: "vertical" }} placeholder="Full residential address" />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "20px", paddingTop: "20px", borderTop: "1px solid var(--border-color)" }}>
                <button type="submit" disabled={loading} style={{ flex: 1, padding: "12px", backgroundColor: "var(--primary)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
                  {loading ? "Adding..." : "✅ Add Student"}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: "12px", backgroundColor: "var(--panel-bg)", color: "var(--text-main)", border: "1px solid var(--border-color)", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
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

export default StudentProfiles;