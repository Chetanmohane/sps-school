import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import "../../assets/styles/main.css";

const Promotions = () => {
  const [promotionHistory, setPromotionHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("history"); // history or promotionForm
  const [bulkPromotionData, setBulkPromotionData] = useState({
    currentClass: "",
    currentSection: "",
    newClass: "",
    newSection: "",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [classes, setClasses] = useState([]); // Dynamic classes from database
  const [sections] = useState(["A", "B", "C", "D"]);
  const [studentsList, setStudentsList] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => {
    fetchClassNames(); // Fetch available classes on component mount
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      fetchPromotionHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    if (bulkPromotionData.currentClass) {
      fetchClassStudents();
    } else {
      setStudentsList([]);
      setSelectedStudents([]);
    }
  }, [bulkPromotionData.currentClass, bulkPromotionData.currentSection]);

  const fetchClassNames = async () => {
    try {
      const response = await API.get("/api/admin/student-admin/classes");
      setClasses(response.data.data || []);
    } catch (error) {
      console.error("Error fetching class names:", error);
    }
  };

  const fetchClassStudents = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/api/admin/student-admin/classes/${bulkPromotionData.currentClass}/students`);
      let allStudents = res.data.data || [];
      if (bulkPromotionData.currentSection) {
        allStudents = allStudents.filter((s) => s.section === bulkPromotionData.currentSection);
      }
      setStudentsList(allStudents);
      // Select all by default
      setSelectedStudents(allStudents.map((s) => s._id));
    } catch (e) {
      console.error("Error fetching class students:", e);
      setStudentsList([]);
      setSelectedStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPromotionHistory = async () => {
    try {
      setLoading(true);
      setStatusMessage('');
      const response = await API.get(
        "/api/admin/student-admin/promotions/history"
      );
      setPromotionHistory(response.data.data || []);
      if (response.data.data && response.data.data.length === 0) {
        setStatusMessage('No promotion history available yet');
      }
    } catch (error) {
      console.error("Error fetching promotion history:", error);
      const errorMsg = error.response?.data?.message || "Failed to fetch promotion history";
      setStatusMessage(errorMsg);
      setPromotionHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkPromotionChange = (e) => {
    const { name, value } = e.target;
    setBulkPromotionData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBulkPromotion = async (e) => {
    e.preventDefault();

    if (
      !bulkPromotionData.currentClass ||
      !bulkPromotionData.newClass ||
      !bulkPromotionData.newSection
    ) {
      setStatusMessage("Please fill in all required fields");
      return;
    }

    if (selectedStudents.length === 0) {
      setStatusMessage("Please select at least one student to promote");
      return;
    }

    if (!window.confirm(`Are you sure you want to promote ${selectedStudents.length} selected students? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await API.post(
        "/api/admin/student-admin/promotions/bulk",
        {
          ...bulkPromotionData,
          studentIds: selectedStudents
        }
      );
      setStatusMessage(
        `Promotion successful! ${response.data.count} students promoted.`
      );
      setBulkPromotionData({
        currentClass: "",
        currentSection: "",
        newClass: "",
        newSection: "",
      });
      setStudentsList([]);
      setSelectedStudents([]);
      // Optionally refresh history
      setTimeout(() => {
        fetchPromotionHistory();
        fetchClassNames(); // Refresh class names after promotion
      }, 500);
    } catch (error) {
      console.error("Error promoting students:", error);
      setStatusMessage(
        error.response?.data?.message || "Failed to promote students"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", color: 'var(--text-main)' }}>
      <h2>🎓 Student Promotions</h2>

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
          onClick={() => setActiveTab("history")}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            backgroundColor: activeTab === "history" ? "var(--primary)" : "var(--hover-bg)",
            color: activeTab === "history" ? "white" : "var(--text-main)",
            border: "1px solid var(--border-color)",
            borderBottom: activeTab === "history" ? "none" : "1px solid var(--border-color)",
            borderRadius: "6px 6px 0 0",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.2s ease"
          }}
        >
          📊 Promotion History
        </button>
        <button
          onClick={() => setActiveTab("promotionForm")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "promotionForm" ? "var(--primary)" : "var(--hover-bg)",
            color: activeTab === "promotionForm" ? "white" : "var(--text-main)",
            border: "1px solid var(--border-color)",
            borderBottom: activeTab === "promotionForm" ? "none" : "1px solid var(--border-color)",
            borderRadius: "6px 6px 0 0",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.2s ease"
          }}
        >
          ⬆️ Promote Students
        </button>
      </div>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Loading...</p>}

      {/* Promotion History Tab */}
      {activeTab === "history" && (
        <div>
          <h3 style={{ marginBottom: '15px' }}>Promotion History</h3>
          {promotionHistory.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Promotions</th>
                  </tr>
                </thead>
                <tbody>
                  {promotionHistory.map((student) => (
                    <tr key={student._id}>
                      <td>{student.user?.name || "N/A"}</td>
                      <td>{student.user?.email || "N/A"}</td>
                      <td>
                        <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                          {student.promotionHistory && student.promotionHistory.length > 0 ? (
                            student.promotionHistory.map((promotion, idx) => (
                              <div
                                key={idx}
                                style={{
                                  marginBottom: "8px",
                                  padding: "8px 12px",
                                  backgroundColor: "var(--primary-bg)",
                                  borderLeft: "3px solid var(--primary)",
                                  borderRight: "1px solid var(--border-color)",
                                  borderTop: "1px solid var(--border-color)",
                                  borderBottom: "1px solid var(--border-color)",
                                  borderRadius: "6px",
                                  fontSize: "13px",
                                  color: "var(--text-main)"
                                }}
                              >
                                <div>
                                  <strong>{promotion.from}</strong> → <strong>{promotion.to}</strong>
                                </div>
                                <div style={{ fontSize: "12px", color: 'var(--text-muted)', marginTop: "3px" }}>
                                  {new Date(promotion.promotedAt).toLocaleDateString()}
                                </div>
                              </div>
                            ))
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>No promotions yet</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ textAlign: "center", color: 'var(--text-muted)' }}>No promotion history available</p>
          )}
        </div>
      )}

      {/* Promotion Form Tab */}
      {activeTab === "promotionForm" && (
        <div>
          <h3 style={{ marginBottom: '15px' }}>Bulk Promote Students</h3>
          <div style={{ maxWidth: "600px" }}>
            <form onSubmit={handleBulkPromotion}>
              <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: "6px" }}>
                <h4 style={{ marginTop: 0, marginBottom: '15px' }}>Current Class Details</h4>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                    Current Class: <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <select
                    name="currentClass"
                    value={bulkPromotionData.currentClass}
                    onChange={handleBulkPromotionChange}
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
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">-- Select Class --</option>
                    {classes.map((clsName) => (
                      <option key={clsName} value={clsName}>
                        {clsName}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                    Current Section: <span style={{ color: 'var(--text-muted)' }}>(Optional)</span>
                  </label>
                  <select
                    name="currentSection"
                    value={bulkPromotionData.currentSection}
                    onChange={handleBulkPromotionChange}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: '1px solid var(--border-color)',
                      borderRadius: "6px",
                      boxSizing: "border-box",
                      backgroundColor: 'var(--input-bg)',
                      color: 'var(--text-main)',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">-- Leave empty to promote all sections --</option>
                    {sections.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {studentsList.length > 0 && (
                <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: "6px" }}>
                  <h4 style={{ marginTop: 0, marginBottom: '10px' }}>Select Students to Promote</h4>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "15px" }}>
                    Uncheck any student who has failed or should not be promoted.
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", alignItems: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>
                      <input
                        type="checkbox"
                        checked={selectedStudents.length === studentsList.length && studentsList.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents(studentsList.map(s => s._id));
                          } else {
                            setSelectedStudents([]);
                          }
                        }}
                      />
                      Promote All Class ({studentsList.length})
                    </label>
                    <span style={{ fontSize: "13px", fontWeight: "bold" }}>
                      Selected: <span style={{ color: "var(--success)" }}>{selectedStudents.length}</span> / {studentsList.length}
                    </span>
                  </div>

                  <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "10px", backgroundColor: "var(--input-bg)" }}>
                    {studentsList.map((student) => {
                      const isChecked = selectedStudents.includes(student._id);
                      return (
                        <div key={student._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px", borderBottom: "1px solid var(--border-color)" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", flex: 1, fontSize: "13px" }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudents([...selectedStudents, student._id]);
                                } else {
                                  setSelectedStudents(selectedStudents.filter(id => id !== student._id));
                                }
                              }}
                            />
                            <div>
                              <strong>{student.user?.name || "N/A"}</strong>
                              <span style={{ marginLeft: "8px", fontSize: "11px", color: "var(--text-muted)" }}>
                                Roll No: {student.rollNumber || "N/A"} | Sec: {student.section}
                              </span>
                            </div>
                          </label>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{student.user?.email}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: "6px" }}>
                <h4 style={{ marginTop: 0, marginBottom: '15px' }}>⬆️ New Class Details</h4>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                    New Class: <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="newClass"
                    value={bulkPromotionData.newClass}
                    onChange={handleBulkPromotionChange}
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
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                    New Section: <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <select
                    name="newSection"
                    value={bulkPromotionData.newSection}
                    onChange={handleBulkPromotionChange}
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
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">-- Select New Section --</option>
                    {sections.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                style={{
                  marginBottom: "20px",
                  padding: "15px",
                  backgroundColor: "var(--warning-bg)",
                  border: "1px solid rgba(251, 191, 36, 0.3)",
                  borderRadius: "6px",
                  color: "var(--warning)",
                }}
              >
                ⚠️ <strong>Warning:</strong> This action will promote all students in the selected class/section to the new class/section. This action cannot be undone.
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "var(--success)",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: loading ? "not-allowed" : "pointer",
                    flex: 1,
                    fontWeight: "bold",
                  }}
                >
                  {loading ? "Processing..." : "✓ Promote Students"}
                </button>
                <button
                  type="reset"
                  onClick={() =>
                    setBulkPromotionData({
                      currentClass: "",
                      currentSection: "",
                      newClass: "",
                      newSection: "",
                    })
                  }
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "var(--border-color)",
                    color: "var(--text-main)",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    flex: 1,
                    fontWeight: "bold",
                  }}
                >
                  Clear Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Promotions;