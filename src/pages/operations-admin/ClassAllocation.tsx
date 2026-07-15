import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import "../../assets/styles/main.css";

const ClassAllocation = () => {
  const [unallocatedStudents, setUnallocatedStudents] = useState([]);
  const [studentsByClass, setStudentsByClass] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("unallocated"); // unallocated or byClass
  const [selectedClass, setSelectedClass] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [allocationData, setAllocationData] = useState({
    className: "",
    section: "",
    rollNumber: "",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [classes, setClasses] = useState([]); // Dynamic classes from database
  const [sections] = useState(["A", "B", "C", "D"]);

  useEffect(() => {
    fetchClassNames(); // Fetch available classes on component mount
  }, []);

  useEffect(() => {
    if (activeTab === "unallocated") {
      fetchUnallocatedStudents();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedClass && activeTab === "byClass") {
      fetchStudentsByClass();
    }
  }, [selectedClass, activeTab]);

  const fetchClassNames = async () => {
    try {
      const response = await API.get("/api/admin/student-admin/classes");
      setClasses(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching class names:", error);
      setClasses([]);
    }
  };

  const fetchUnallocatedStudents = async () => {
    try {
      setLoading(true);
      setStatusMessage("");
      const response = await API.get(
        "/api/admin/student-admin/allocation/unallocated"
      );
      setUnallocatedStudents(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching unallocated students:", error);
      setStatusMessage("Failed to fetch unallocated students");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsByClass = async () => {
    try {
      setLoading(true);
      setStatusMessage("");
      const response = await API.get(
        `/api/admin/student-admin/classes/${selectedClass}/students`
      );
      setStudentsByClass(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching students by class:", error);
      setStudentsByClass([]);
      setStatusMessage("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const handleAllocateClick = (student) => {
    setEditingStudent(student);
    setAllocationData({
      className: "",
      section: "",
      rollNumber: "",
    });
    setShowModal(true);
  };

  const handleAllocationFormChange = (e) => {
    const { name, value } = e.target;
    setAllocationData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveAllocation = async (e) => {
    e.preventDefault();

    if (!allocationData.className || !allocationData.section) {
      setStatusMessage("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      await API.post(
        `/api/admin/student-admin/allocation/${editingStudent._id}`,
        allocationData
      );
      setStatusMessage("Student allocated to class successfully!");
      setShowModal(false);
      fetchUnallocatedStudents();
      fetchClassNames(); // Refresh class names after allocation
    
      if (activeTab === "byClass" && selectedClass) {
      await fetchStudentsByClass();
      }
    } catch (error) {
      console.error("Error allocating student:", error);
      setStatusMessage(
        error.response?.data?.message || "Failed to allocate student"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReAllocate = (student) => {
    setEditingStudent(student);
    setAllocationData({
      className: student.className || "",
      section: student.section || "",
      rollNumber: student.rollNumber || "",
    });
    setShowModal(true);
  };

  return (
    <div style={{ padding: "20px", color: 'var(--text-main)' }}>
      <h2>🎓 Class Allocation</h2>

      {statusMessage && (
        <div style={{
          marginBottom: "15px",
          padding: "12px 16px",
          backgroundColor: statusMessage.toLowerCase().includes("failed") || statusMessage.toLowerCase().includes("error") ? "var(--danger-bg)" : "var(--success-bg)",
          color: statusMessage.toLowerCase().includes("failed") || statusMessage.toLowerCase().includes("error") ? "var(--danger)" : "var(--success)",
          border: `1px solid ${statusMessage.toLowerCase().includes("failed") || statusMessage.toLowerCase().includes("error") ? "rgba(248, 113, 113, 0.2)" : "rgba(52, 211, 153, 0.2)"}`,
          borderRadius: "8px",
          fontSize: "14px"
        }}>
          {statusMessage}
        </div>
      )}

      {/* Tabs */}
      <div style={{ marginBottom: "20px", display: "flex", borderBottom: '2px solid var(--border-color)' }}>
        <button
          onClick={() => setActiveTab("unallocated")}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            backgroundColor: activeTab === "unallocated" ? "var(--primary)" : "var(--hover-bg)",
            color: activeTab === "unallocated" ? "white" : "var(--text-main)",
            border: "1px solid var(--border-color)",
            borderBottom: activeTab === "unallocated" ? "none" : "1px solid var(--border-color)",
            borderRadius: "6px 6px 0 0",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.2s ease"
          }}
        >
          📌 Unallocated Students
        </button>
        <button
          onClick={() => setActiveTab("byClass")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "byClass" ? "var(--primary)" : "var(--hover-bg)",
            color: activeTab === "byClass" ? "white" : "var(--text-main)",
            border: "1px solid var(--border-color)",
            borderBottom: activeTab === "byClass" ? "none" : "1px solid var(--border-color)",
            borderRadius: "6px 6px 0 0",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.2s ease"
          }}
        >
          📚 View by Class
        </button>
      </div>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Loading...</p>}

      {/* Unallocated Tab */}
      {activeTab === "unallocated" && (
        <div>
          <h3 style={{ marginBottom: '15px' }}>Unallocated Students ({unallocatedStudents.length})</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {unallocatedStudents.length > 0 ? (
                  unallocatedStudents.map((student) => (
                    <tr key={student._id}>
                      <td>{student.user?.name || "N/A"}</td>
                      <td>{student.user?.email || "N/A"}</td>
                      <td>{student.user?.phone || "N/A"}</td>
                      <td>
                        <button
                          onClick={() => handleAllocateClick(student)}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "var(--success)",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "500",
                            transition: "opacity 0.2s"
                          }}
                        >
                          ➕ Allocate
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: 'var(--text-muted)' }}>
                      All students have been allocated to classes!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* By Class Tab */}
      {activeTab === "byClass" && (
        <div>
          <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ fontWeight: "bold" }}>Select Class:</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{
                padding: "8px 12px",
                border: '1px solid var(--border-color)',
                borderRadius: "6px",
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-main)',
                outline: 'none',
                cursor: "pointer",
              }}
            >
              <option value="">-- Choose a class --</option>
              {classes.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {selectedClass && (
            <div>
              <h3 style={{ marginBottom: '15px' }}>
                Students in {selectedClass} ({studentsByClass.length})
              </h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Section</th>
                      <th>Roll No.</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsByClass.length > 0 ? (
                      studentsByClass.map((student) => (
                        <tr key={student._id}>
                          <td>{student.user?.name || "N/A"}</td>
                          <td>{student.user?.email || "N/A"}</td>
                          <td>{student.section || "N/A"}</td>
                          <td>{student.rollNumber || "N/A"}</td>
                          <td>
                            <button
                              onClick={() => handleReAllocate(student)}
                              style={{
                                padding: "6px 12px",
                                backgroundColor: "var(--primary)",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontWeight: "500",
                                transition: "opacity 0.2s"
                              }}
                            >
                              📝 Modify
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ padding: "20px", textAlign: "center", color: 'var(--text-muted)' }}>
                          No students in this class
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

      {/* Allocation Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              padding: "30px",
              borderRadius: "12px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
            }}
          >
            <h3 style={{ marginTop: 0, color: 'var(--text-main)' }}>Allocate Student to Class</h3>
            <p style={{ marginBottom: "20px", color: 'var(--text-muted)' }}>
              <strong>Student:</strong> {editingStudent?.user?.name}
            </p>

            <form onSubmit={handleSaveAllocation}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: 'var(--text-main)' }}>Class:</label>
                <input
                  type="text"
                  name="className"
                  value={allocationData.className}
                  onChange={handleAllocationFormChange}
                  placeholder="e.g., Class 10, 10th Grade, etc."
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: '1px solid var(--border-color)',
                    borderRadius: "6px",
                    boxSizing: "border-box",
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-main)',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: 'var(--text-main)' }}>Section:</label>
                <select
                  name="section"
                  value={allocationData.section}
                  onChange={handleAllocationFormChange}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: '1px solid var(--border-color)',
                    borderRadius: "6px",
                    boxSizing: "border-box",
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-main)',
                    outline: 'none',
                    cursor: "pointer"
                  }}
                >
                  <option value="">-- Select Section --</option>
                  {sections.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: 'var(--text-main)' }}>Roll Number (Optional):</label>
                <input
                  type="text"
                  name="rollNumber"
                  value={allocationData.rollNumber}
                  onChange={handleAllocationFormChange}
                  placeholder="e.g., 01"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: '1px solid var(--border-color)',
                    borderRadius: "6px",
                    boxSizing: "border-box",
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-main)',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "12px 20px",
                    backgroundColor: "var(--success)",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: loading ? "not-allowed" : "pointer",
                    flex: 1,
                    fontWeight: "600"
                  }}
                >
                  {loading ? "Allocating..." : "Allocate"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "12px 20px",
                    backgroundColor: "var(--border-color)",
                    color: "var(--text-main)",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    flex: 1,
                    fontWeight: "600"
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