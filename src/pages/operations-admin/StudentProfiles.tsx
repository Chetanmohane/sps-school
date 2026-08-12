import React, { useState, useEffect, useRef } from "react";
import API from "../../api/axios";
import "../../assets/styles/main.css";

const StudentProfiles = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [selectedViewStudent, setSelectedViewStudent] = useState<any>(null);
  const [viewStudentAttendance, setViewStudentAttendance] = useState<any>({ records: [], percentage: 0 });
  const [viewStudentExams, setViewStudentExams] = useState<any[]>([]);
  const [viewStudentFees, setViewStudentFees] = useState<any[]>([]);
  const [viewStudentResults, setViewStudentResults] = useState<any>(null);
  const [viewTab, setViewTab] = useState<'profile' | 'attendance' | 'exams' | 'results' | 'fees'>('profile');

  const editFileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const viewFileInputRef = useRef<HTMLInputElement>(null);

  const handleViewStudentDetails = async (student: any) => {
    setSelectedViewStudent(student);
    setViewTab('profile');
    try {
      const email = student.user?.email;
      if (email) {
        const [attRes, examsRes, feesRes, resultsRes] = await Promise.allSettled([
          API.get(`/api/attendance/${email}`),
          API.get('/api/exams'),
          API.get('/api/finance/my-fees', { params: { email } }),
          API.get(`/api/admin/student-admin/results/${student._id}`)
        ]);

        if (attRes.status === 'fulfilled' && attRes.value.data) {
          setViewStudentAttendance(attRes.value.data);
        } else {
          setViewStudentAttendance({ records: [], percentage: 0 });
        }

        if (examsRes.status === 'fulfilled' && examsRes.value.data) {
          const allExams = examsRes.value.data.exams || [];
          const classExams = allExams.filter((exam: any) =>
            exam.className && student.className &&
            exam.className.trim().toLowerCase() === student.className.trim().toLowerCase()
          );
          setViewStudentExams(classExams);
        } else {
          setViewStudentExams([]);
        }

        if (feesRes.status === 'fulfilled' && feesRes.value.data) {
          setViewStudentFees(feesRes.value.data);
        } else {
          setViewStudentFees([]);
        }

        if (resultsRes.status === 'fulfilled' && resultsRes.value.data) {
          const resData = resultsRes.value.data;
          if (resData.data || resData.success) {
            setViewStudentResults(resData.data || {});
          } else {
            setViewStudentResults(null);
          }
        } else {
          setViewStudentResults(null);
        }
      }
    } catch (err) {
      console.error("Error loading view student details:", err);
    }
  };
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", password: "", address: "",
    dob: "", className: "", section: "", rollNumber: "",
    parentName: "", parentPhone: "", bloodGroup: "", gender: "", profileImage: ""
  });

  const [addFormData, setAddFormData] = useState({
    name: "", email: "", phone: "", password: "",
    address: "", dob: "", className: "", section: "",
    rollNumber: "", parentName: "", parentPhone: "", bloodGroup: "", gender: "", profileImage: ""
  });

  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

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

  const showStatus = (text: string, type = "success") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage({ text: "", type: "" }), 4000);
  };

  const handleEditClick = (student: any) => {
    setEditingStudent(student);
    setFormData({
      name: student.user?.name || "",
      email: student.user?.email || "",
      phone: student.user?.phone || "",
      password: "",
      address: student.address || "",
      dob: student.dob ? student.dob.slice(0, 10) : "",
      className: student.className || "",
      section: student.section || "",
      rollNumber: student.rollNumber || "",
      parentName: student.parentName || "",
      parentPhone: student.parentPhone || "",
      bloodGroup: student.bloodGroup || "",
      gender: student.gender || "",
      profileImage: student.profileImage || ""
    });
    setShowModal(true);
  };

  const handlePhotoSelectForEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, profileImage: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoSelectForAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAddFormData(prev => ({ ...prev, profileImage: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoSelectForView = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedViewStudent) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setSelectedViewStudent((prev: any) => ({ ...prev, profileImage: base64 }));
      try {
        await API.put(`/api/admin/student-admin/students/${selectedViewStudent._id}`, { profileImage: base64 });
        alert("Student photo updated successfully!");
        fetchStudents();
      } catch (err: any) {
        alert("Failed to update photo: " + (err.response?.data?.message || err.message));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveChanges = async (e: any) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      setLoading(true);
      await API.put(`/api/admin/student-admin/students/${editingStudent._id}`, formData);
      alert("Student profile updated successfully!");
      setShowModal(false);
      fetchStudents();
    } catch (error: any) {
      alert("Failed to update student profile: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteStudent = (studentId: string) => {
    setDeleteConfirmId(studentId);
  };

  const handleAddStudent = async (e: any) => {
    e.preventDefault();
    try {
      setLoading(true);
      await API.post("/api/admin/student-admin/students", addFormData);
      alert("Student added successfully!");
      setShowAddModal(false);
      setAddFormData({ name: "", email: "", phone: "", password: "", address: "", dob: "", className: "", section: "", rollNumber: "", parentName: "", parentPhone: "", bloodGroup: "", gender: "", profileImage: "" });
      fetchStudents();
    } catch (error: any) {
      alert("Failed to add student: " + (error.response?.data?.message || error.message));
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

    const sDate = s.createdAt || s.allocationDate || s.dob;
    let matchDate = true;
    if (sDate) {
      const studentDateStr = new Date(sDate).toISOString().slice(0, 10);
      if (filterDateFrom && studentDateStr < filterDateFrom) matchDate = false;
      if (filterDateTo && studentDateStr > filterDateTo) matchDate = false;
    }

    return matchSearch && matchClass && matchSection && matchDate;
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

      {/* Hidden File Inputs for Photo Upload */}
      <input type="file" ref={editFileInputRef} onChange={handlePhotoSelectForEdit} accept="image/*" style={{ display: 'none' }} />
      <input type="file" ref={addFileInputRef} onChange={handlePhotoSelectForAdd} accept="image/*" style={{ display: 'none' }} />
      <input type="file" ref={viewFileInputRef} onChange={handlePhotoSelectForView} accept="image/*" style={{ display: 'none' }} />

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
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>From:</span>
          <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} style={{ ...inputStyle, width: "auto" }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>To:</span>
          <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} style={{ ...inputStyle, width: "auto" }} />
        </div>
        {(searchTerm || filterClass !== "all" || filterSection !== "all" || filterDateFrom || filterDateTo) && (
          <button onClick={() => { setSearchTerm(""); setFilterClass("all"); setFilterSection("all"); setFilterDateFrom(""); setFilterDateTo(""); }}
            style={{ padding: "10px 16px", backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", cursor: "pointer", fontWeight: "700" }}>
            ✕ Clear Filters
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
                    boxShadow: `0 4px 12px ${color}30`,
                    overflow: "hidden"
                  }}>
                    {student.profileImage ? (
                      <img src={student.profileImage} alt={student.user?.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      initials
                    )}
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
                  <button onClick={() => handleViewStudentDetails(student)} style={{
                    flex: 1, padding: "9px", backgroundColor: "#3b82f6", color: "white",
                    border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "5px"
                  }}>👁️ View Details</button>
                  <button onClick={() => handleEditClick(student)} style={{
                    flex: 1, padding: "9px", backgroundColor: "var(--primary)", color: "white",
                    border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "5px"
                  }}>✏️ Edit</button>
                  <button onClick={() => handleDeleteStudent(student._id)} style={{
                    padding: "9px 12px", backgroundColor: "var(--danger-bg)", color: "var(--danger)",
                    border: "1px solid rgba(248,113,113,0.2)", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW FULL STUDENT DETAILS MODAL */}
      {selectedViewStudent && (
        <div onClick={() => setSelectedViewStudent(null)} style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(8px)", display: "flex", justifyContent: "center",
          alignItems: "center", zIndex: 1050, padding: "16px"
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)",
            borderRadius: "20px", width: "100%", maxWidth: "800px",
            maxHeight: "92vh", overflowY: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.4)"
          }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ position: "relative" }}>
                  <div style={{ width: "54px", height: "54px", borderRadius: "14px", backgroundColor: "#3b82f6", color: "white", fontWeight: "800", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {selectedViewStudent.profileImage ? (
                      <img src={selectedViewStudent.profileImage} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      selectedViewStudent.user?.name ? selectedViewStudent.user.name.charAt(0).toUpperCase() : 'S'
                    )}
                  </div>
                </div>
                <div>
                  <h3 style={{ margin: 0, color: "var(--text-main)", fontSize: "18px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                    {selectedViewStudent.user?.name}
                    <button
                      type="button"
                      onClick={() => viewFileInputRef.current?.click()}
                      style={{ padding: "3px 8px", fontSize: "11px", borderRadius: "6px", backgroundColor: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)", cursor: "pointer", fontWeight: "700" }}
                    >
                      📷 Change Photo
                    </button>
                  </h3>
                  <p style={{ margin: "2px 0 0", color: "var(--text-muted)", fontSize: "12px", fontWeight: "600" }}>
                    Roll No: <span style={{ color: "#3b82f6" }}>{selectedViewStudent.rollNumber}</span> | Class: <span style={{ color: "#3b82f6" }}>{selectedViewStudent.className} ({selectedViewStudent.section})</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedViewStudent(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "var(--text-muted)" }}>×</button>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: "flex", gap: "8px", padding: "12px 24px", borderBottom: "1px solid var(--border-color)", overflowX: "auto" }}>
              {[
                { id: 'profile', label: '👤 Profile Details' },
                { id: 'attendance', label: '📊 Attendance Record' },
                { id: 'exams', label: '📅 Exam Timetable' },
                { id: 'results', label: '🏆 Exam Results' },
                { id: 'fees', label: '💳 Fee Statement' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setViewTab(tab.id as any)}
                  style={{
                    padding: "8px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "700",
                    border: "none", cursor: "pointer", transition: "all 0.2s",
                    backgroundColor: viewTab === tab.id ? "#3b82f6" : "var(--input-bg)",
                    color: viewTab === tab.id ? "white" : "var(--text-muted)"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div style={{ padding: "24px" }}>
              {/* TAB 1: PROFILE DETAILS */}
              {viewTab === 'profile' && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "15px" }}>
                  <div style={{ backgroundColor: "var(--input-bg)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Full Name</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", marginTop: "2px" }}>{selectedViewStudent.user?.name}</div>
                  </div>
                  <div style={{ backgroundColor: "var(--input-bg)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Email Address</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", marginTop: "2px" }}>{selectedViewStudent.user?.email}</div>
                  </div>
                  <div style={{ backgroundColor: "var(--input-bg)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Phone Number</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", marginTop: "2px" }}>{selectedViewStudent.user?.phone || 'N/A'}</div>
                  </div>
                  <div style={{ backgroundColor: "var(--input-bg)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Roll Number</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", marginTop: "2px", color: "#3b82f6" }}>{selectedViewStudent.rollNumber}</div>
                  </div>
                  <div style={{ backgroundColor: "var(--input-bg)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Class & Section</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", marginTop: "2px" }}>Class {selectedViewStudent.className} - Sec {selectedViewStudent.section}</div>
                  </div>
                  <div style={{ backgroundColor: "var(--input-bg)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Date of Birth</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", marginTop: "2px" }}>
                      {selectedViewStudent.dob ? new Date(selectedViewStudent.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                    </div>
                  </div>
                  <div style={{ backgroundColor: "var(--input-bg)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Gender</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", marginTop: "2px" }}>{selectedViewStudent.gender || 'N/A'}</div>
                  </div>
                  <div style={{ backgroundColor: "var(--input-bg)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Blood Group</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", marginTop: "2px" }}>{selectedViewStudent.bloodGroup || 'N/A'}</div>
                  </div>
                  <div style={{ backgroundColor: "var(--input-bg)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Parent / Guardian</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", marginTop: "2px" }}>{selectedViewStudent.parentName || 'N/A'}</div>
                  </div>
                  <div style={{ backgroundColor: "var(--input-bg)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Parent Phone</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", marginTop: "2px" }}>{selectedViewStudent.parentPhone || 'N/A'}</div>
                  </div>
                  <div style={{ gridColumn: "1 / -1", backgroundColor: "var(--input-bg)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Residential Address</div>
                    <div style={{ fontSize: "14px", fontWeight: "600", marginTop: "2px" }}>{selectedViewStudent.address || 'No registered address'}</div>
                  </div>
                </div>
              )}

              {/* TAB 2: ATTENDANCE RECORD */}
              {viewTab === 'attendance' && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
                    <div style={{ backgroundColor: "var(--input-bg)", padding: "12px", borderRadius: "10px", textAlign: "center" }}>
                      <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)" }}>ATTENDANCE RATE</div>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: viewStudentAttendance.percentage >= 75 ? "#10b981" : "#f59e0b" }}>
                        {viewStudentAttendance.percentage}%
                      </div>
                    </div>
                    <div style={{ backgroundColor: "var(--input-bg)", padding: "12px", borderRadius: "10px", textAlign: "center" }}>
                      <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)" }}>TOTAL RECORDS</div>
                      <div style={{ fontSize: "20px", fontWeight: "800" }}>{viewStudentAttendance.records?.length || 0}</div>
                    </div>
                    <div style={{ backgroundColor: "var(--input-bg)", padding: "12px", borderRadius: "10px", textAlign: "center" }}>
                      <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)" }}>PRESENT DAYS</div>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: "#10b981" }}>
                        {viewStudentAttendance.records?.filter((r: any) => r.status === 'Present').length || 0}
                      </div>
                    </div>
                  </div>

                  <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "12px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead style={{ backgroundColor: "var(--input-bg)", fontSize: "11px", fontWeight: "700", color: "var(--text-muted)" }}>
                        <tr>
                          <th style={{ padding: "10px 14px" }}>Date</th>
                          <th style={{ padding: "10px 14px" }}>Day</th>
                          <th style={{ padding: "10px 14px" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewStudentAttendance.records?.length > 0 ? (
                          viewStudentAttendance.records.map((r: any, idx: number) => (
                            <tr key={idx} style={{ borderTop: "1px solid var(--border-color)" }}>
                              <td style={{ padding: "10px 14px", fontWeight: "600" }}>{new Date(r.date).toLocaleDateString()}</td>
                              <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>{new Date(r.date).toLocaleDateString('en-US', { weekday: 'long' })}</td>
                              <td style={{ padding: "10px 14px", fontWeight: "700", color: r.status === 'Present' ? '#10b981' : '#ef4444' }}>
                                {r.status === 'Present' ? '✓ Present' : '✗ Absent'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={3} style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>No attendance records found for this student.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: EXAM TIMETABLE */}
              {viewTab === 'exams' && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {viewStudentExams.length > 0 ? (
                    viewStudentExams.map((exam: any, idx: number) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", backgroundColor: "var(--input-bg)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                        <div>
                          <div style={{ fontWeight: "800", fontSize: "14px" }}>{exam.title}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                            📚 {exam.subject} | 📅 {new Date(exam.date).toLocaleDateString('en-GB')} | 🕒 {exam.startTime || '10:00 AM'} - {exam.endTime || '01:00 PM'}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "8px", backgroundColor: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
                            🏫 {exam.roomNumber || 'Hall-1'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", backgroundColor: "var(--input-bg)", borderRadius: "12px", border: "1px dashed var(--border-color)" }}>
                      No exam timetable scheduled for Class {selectedViewStudent.className}.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: EXAM RESULTS */}
              {viewTab === 'results' && (
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  {viewStudentResults && Object.keys(viewStudentResults).length > 0 ? (
                    Object.keys(viewStudentResults).map(termKey => {
                      const term = viewStudentResults[termKey];
                      return (
                        <div key={termKey} style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "20px" }}>
                          <div style={{ padding: "15px", backgroundColor: "rgba(16,185,129,0.08)", borderRadius: "12px", border: "1px solid rgba(16,185,129,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontSize: "11px", fontWeight: "700", color: "#10b981", textTransform: "uppercase" }}>{term.termName || termKey}</div>
                              <div style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-main)", marginTop: "2px" }}>GPA: {term.overallGpa} | Score: {term.totalMarks}</div>
                            </div>
                            <span style={{ padding: "6px 14px", backgroundColor: term.status === 'PASSED' ? "#10b981" : "#ef4444", color: "white", borderRadius: "20px", fontWeight: "800", fontSize: "12px" }}>
                              STATUS: {term.status}
                            </span>
                          </div>

                          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
                            <thead style={{ backgroundColor: "var(--input-bg)", fontSize: "11px", fontWeight: "700", color: "var(--text-muted)" }}>
                              <tr>
                                <th style={{ padding: "10px 14px" }}>Subject</th>
                                <th style={{ padding: "10px 14px" }}>Marks Obtained</th>
                                <th style={{ padding: "10px 14px" }}>Max Marks</th>
                                <th style={{ padding: "10px 14px" }}>Grade</th>
                                <th style={{ padding: "10px 14px" }}>Remarks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {term.subjects && term.subjects.length > 0 ? term.subjects.map((sub: any, i: number) => (
                                <tr key={i} style={{ borderTop: "1px solid var(--border-color)" }}>
                                  <td style={{ padding: "12px 14px", fontWeight: "700" }}>{sub.name}</td>
                                  <td style={{ padding: "12px 14px", fontWeight: "800", color: "#3b82f6" }}>{sub.marks}</td>
                                  <td style={{ padding: "12px 14px", fontWeight: "700", color: "var(--text-muted)" }}>{sub.maxMarks}</td>
                                  <td style={{ padding: "12px 14px" }}>
                                    <span style={{
                                      padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "800",
                                      backgroundColor: sub.grade.includes('A') || sub.grade === 'O' ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                                      color: sub.grade.includes('A') || sub.grade === 'O' ? "#10b981" : "#f59e0b"
                                    }}>{sub.grade}</span>
                                  </td>
                                  <td style={{ padding: "12px 14px", fontSize: "12px", color: "var(--text-muted)" }}>{sub.remarks || '-'}</td>
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>No subject results published for this term yet.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", backgroundColor: "var(--input-bg)", borderRadius: "12px", border: "1px dashed var(--border-color)" }}>
                      <div style={{ fontSize: "36px", marginBottom: "12px" }}>📊</div>
                      <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: "6px" }}>No Exam Results Available</div>
                      <div style={{ fontSize: "13px" }}>No results have been published for this student yet.</div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: FEE STATEMENT */}
              {viewTab === 'fees' && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {viewStudentFees.length > 0 ? (
                    viewStudentFees.map((fee: any, idx: number) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", backgroundColor: "var(--input-bg)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                        <div>
                          <div style={{ fontWeight: "700" }}>Admission & Tuition Fee</div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Due Date: {new Date(fee.dueDate).toLocaleDateString('en-GB')}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "16px", fontWeight: "800" }}>₹{fee.amount}</div>
                          <span style={{ fontSize: "10px", fontWeight: "800", color: fee.status === 'Paid' ? '#10b981' : '#ef4444' }}>{fee.status}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", backgroundColor: "var(--input-bg)", borderRadius: "12px" }}>
                      No fee records found for this student.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-color)", textAlign: "right" }}>
              <button onClick={() => setSelectedViewStudent(null)} style={{ padding: "10px 20px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>
                Close Details
              </button>
            </div>
          </div>
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
                {/* Profile Photo Upload Box */}
                <div style={{ gridColumn: "1/-1", backgroundColor: "var(--input-bg)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "12px", backgroundColor: "var(--primary)", color: "white", fontWeight: "800", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {formData.profileImage ? (
                      <img src={formData.profileImage} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      formData.name ? formData.name.charAt(0).toUpperCase() : '📷'
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>Student Profile Photo</div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        style={{ padding: "6px 12px", borderRadius: "6px", backgroundColor: "var(--primary)", color: "white", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}
                      >
                        📷 Choose Photo
                      </button>
                      {formData.profileImage && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, profileImage: "" }))}
                          style={{ padding: "6px 12px", borderRadius: "6px", backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}
                        >
                          🗑️ Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

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
                  <label style={labelStyle}>New Password</label>
                  <div style={{ position: "relative" }}>
                    <input type={showEditPassword ? "text" : "password"} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{...inputStyle, paddingRight: "40px"}} placeholder="Leave blank to keep current" />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "14px" }}
                    >
                      {showEditPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
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
                {/* Profile Photo Upload Box */}
                <div style={{ gridColumn: "1/-1", backgroundColor: "var(--input-bg)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "12px", backgroundColor: "var(--primary)", color: "white", fontWeight: "800", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {addFormData.profileImage ? (
                      <img src={addFormData.profileImage} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      '📷'
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>Student Profile Photo</div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => addFileInputRef.current?.click()}
                        style={{ padding: "6px 12px", borderRadius: "6px", backgroundColor: "var(--primary)", color: "white", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}
                      >
                        📷 Upload Photo
                      </button>
                      {addFormData.profileImage && (
                        <button
                          type="button"
                          onClick={() => setAddFormData(prev => ({ ...prev, profileImage: "" }))}
                          style={{ padding: "6px 12px", borderRadius: "6px", backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}
                        >
                          🗑️ Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

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
                  <div style={{ position: "relative" }}>
                    <input type={showAddPassword ? "text" : "password"} value={addFormData.password} onChange={e => setAddFormData({...addFormData, password: e.target.value})} style={{...inputStyle, paddingRight: "40px"}} placeholder="Min 8 characters" required />
                    <button
                      type="button"
                      onClick={() => setShowAddPassword(!showAddPassword)}
                      style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "14px" }}
                    >
                      {showAddPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
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

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div 
          className="modal-overlay" 
          onClick={() => setDeleteConfirmId(null)} 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            zIndex: 9999, padding: '16px' 
          }}
        >
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', 
              borderRadius: '20px', padding: '24px', width: '380px', maxWidth: '95%', 
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ background: 'var(--danger-bg)', padding: '10px', borderRadius: '12px', color: 'var(--danger)', display: 'flex' }}>
                <span style={{ fontSize: '22px' }}>🗑️</span>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>Delete Student Profile</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>Action cannot be undone</p>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Are you sure you want to delete this student record from the system database?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setDeleteConfirmId(null)}
                style={{ padding: '9px 18px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-main)', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  const id = deleteConfirmId;
                  setDeleteConfirmId(null);
                  try {
                    setLoading(true);
                    await API.delete(`/api/admin/student-admin/students/${id}`);
                    showStatus("Student deleted successfully!", "success");
                    if ((window as any).showToast) (window as any).showToast("Student deleted successfully!", "success");
                    fetchStudents();
                  } catch (error: any) {
                    const errMsg = error.response?.data?.message || "Failed to delete student";
                    showStatus(errMsg, "error");
                    if ((window as any).showToast) (window as any).showToast(errMsg, "error");
                  } finally {
                    setLoading(false);
                  }
                }}
                style={{ padding: '9px 18px', borderRadius: '10px', border: 'none', background: 'var(--danger)', color: 'white', fontWeight: 900, fontSize: '13px', cursor: 'pointer' }}
              >
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfiles;