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
            <h2 style={{ fontWeight: "600" }}>Event Management</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              Create, update and manage all school events
            </p>
          </div>

          <Events />
          
        </div>
      </main>
    </div>
  );
};

export default OperationsAdminDashboard;