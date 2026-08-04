import React from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import Events from "./Events";

const OperationsAdminDashboard = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />

        <div className="dashboard-container">
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontWeight: "800", fontSize: "22px", margin: 0, color: "var(--text-main)" }}>💼 Operations Admin Portal</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: "4px 0 0" }}>
              School Events, Sports Competitions & Operational Management
            </p>
          </div>

          <Events />
          
        </div>
      </main>
    </div>
  );
};

export default OperationsAdminDashboard;