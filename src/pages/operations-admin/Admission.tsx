import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import "../../assets/styles/main.css";

const Admissions = () => {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // all, pending, approved, rejected
  const [showModal, setShowModal] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [approveData, setApproveData] = useState({
    className: "",
    section: "",
  });
  const [rejectReason, setRejectReason] = useState("");
  const [modalAction, setModalAction] = useState(""); // "approve" or "reject"
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      setStatusMessage('');
      const response = await API.get("/api/admin/student-admin/admissions");
      setAdmissions(response.data.data || []);
      if (response.data.data?.length === 0) {
        setStatusMessage('No admissions available');
      }
    } catch (error) {
      console.error("Error fetching admissions:", error);
      const errorMsg = error.response?.data?.message || "Failed to fetch admissions";
      setStatusMessage(errorMsg);
      setAdmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (admission) => {
    setSelectedAdmission(admission);
    setModalAction("approve");
    setApproveData({ className: "", section: "" });
    setRejectReason("");
    setShowModal(true);
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!approveData.className || !approveData.section) {
      setStatusMessage("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      await API.post(
        `/api/admin/student-admin/admissions/${selectedAdmission._id}/approve`,
        approveData
      );
      setStatusMessage("Admission approved successfully!");
      setShowModal(false);
      fetchAdmissions();
    } catch (error) {
      console.error("Error approving admission:", error);
      setStatusMessage("Failed to approve admission");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClick = (admission) => {
    setSelectedAdmission(admission);
    setModalAction("reject");
    setApproveData({ className: "", section: "" });
    setRejectReason("");
    setShowModal(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      await API.post(
        `/api/admin/student-admin/admissions/${selectedAdmission._id}/reject`,
        { reason: rejectReason }
      );
      setStatusMessage("Admission rejected successfully!");
      setShowModal(false);
      fetchAdmissions();
    } catch (error) {
      console.error("Error rejecting admission:", error);
      setStatusMessage("Failed to reject admission");
    } finally {
      setLoading(false);
    }
  };

  const filteredAdmissions = admissions.filter((adm) => {
    if (filter === "all") return true;
    return adm.status.toLowerCase() === filter;
  });

  return (
    <div className="admissions-container" style={{ padding: "20px" }}>
      <h2>📋 Admissions Management</h2>

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

      {/* Filter */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center", color: "var(--text-main)" }}>
        <label style={{ fontWeight: "600" }}>Filter by Status:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--input-bg)',
            color: 'var(--text-main)',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Loading...</p>}

      {/* Admissions Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Applicant Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmissions.length > 0 ? (
              filteredAdmissions.map((admission) => (
                <tr key={admission._id}>
                  <td>{admission.student?.user?.name || "N/A"}</td>
                  <td>{admission.student?.user?.email || "N/A"}</td>
                  <td>{admission.student?.user?.phone || "N/A"}</td>
                  <td>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "600",
                        backgroundColor:
                          admission.status === "Pending"
                            ? "var(--warning-bg)"
                            : admission.status === "Approved"
                            ? "var(--success-bg)"
                            : "var(--danger-bg)",
                        color:
                          admission.status === "Pending"
                            ? "var(--warning)"
                            : admission.status === "Approved"
                            ? "var(--success)"
                            : "var(--danger)",
                        border: `1px solid ${
                          admission.status === "Pending"
                            ? "rgba(251, 191, 36, 0.2)"
                            : admission.status === "Approved"
                            ? "rgba(52, 211, 153, 0.2)"
                            : "rgba(248, 113, 113, 0.2)"
                        }`
                      }}
                    >
                      {admission.status}
                    </span>
                  </td>
                  <td>
                    {admission.status === "Pending" && (
                      <>
                        <button
                          onClick={() => handleApproveClick(admission)}
                          style={{
                            padding: "6px 12px",
                            marginRight: "8px",
                            backgroundColor: "var(--success)",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "500",
                            transition: "opacity 0.2s"
                          }}
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleRejectClick(admission)}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "var(--danger)",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "500",
                            transition: "opacity 0.2s"
                          }}
                        >
                          ✕ Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ padding: "20px", textAlign: "center", color: 'var(--text-muted)' }}>
                  No admissions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Approve/Reject */}
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
            <h3 style={{ marginTop: 0, color: 'var(--text-main)' }}>
              {modalAction === "approve" ? "Approve Admission" : "Reject Admission"}
            </h3>

            <p style={{ marginBottom: "20px", color: 'var(--text-muted)' }}>
              <strong>Applicant:</strong> {selectedAdmission?.student?.user?.name}
            </p>

            {modalAction === "approve" ? (
              <form onSubmit={handleApproveSubmit}>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: 'var(--text-main)' }}>Class Name:</label>
                  <input
                    type="text"
                    value={approveData.className}
                    onChange={(e) => setApproveData({ ...approveData, className: e.target.value })}
                    placeholder="e.g., Class 10"
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
                  <input
                    type="text"
                    value={approveData.section}
                    onChange={(e) => setApproveData({ ...approveData, section: e.target.value })}
                    placeholder="e.g., A"
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
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "var(--success)",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: loading ? "not-allowed" : "pointer",
                      flex: 1,
                      fontWeight: "600"
                    }}
                  >
                    {loading ? "Processing..." : "Approve"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: "10px 20px",
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
            ) : modalAction === "reject" ? (
              <form onSubmit={handleRejectSubmit}>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: 'var(--text-main)' }}>Reason for Rejection:</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    required
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: '1px solid var(--border-color)',
                      borderRadius: "6px",
                      boxSizing: "border-box",
                      resize: "vertical",
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
                      padding: "10px 20px",
                      backgroundColor: "var(--danger)",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: loading ? "not-allowed" : "pointer",
                      flex: 1,
                      fontWeight: "600"
                    }}
                  >
                    {loading ? "Processing..." : "Reject"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: "10px 20px",
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
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admissions;