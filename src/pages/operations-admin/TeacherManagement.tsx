import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "../../styles/events.css";
import API from "../../api/axios";

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);

  const fetchTeachers = async () => {
    const res = await API.get("/api/academic-admin/teachers");
    setTeachers(res.data.data);
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />

        <div className="dashboard-container">
          <h2>👨‍🏫 View All Teachers </h2>
          <div className="table-container">
            <div className="overflow-x-auto w-full">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Specialization</th>
                  <th>Experience (Years)</th>
                  <th>Department</th>
                  <th>Qualifications</th>
                </tr>
              </thead>

              <tbody>
               {Array.isArray(teachers) && teachers.length > 0 ? ( 
                teachers.map((t) => (
                  <tr key={t._id}>
                    <td>{t.user.name}</td>
                    <td>{t.user.email}</td>
                    <td>{t.user.phone}</td>
                    <td>{t.specialization}</td>
                    <td>{t.experience}</td>
                    <td>{t.department || '-'}</td>
                    <td>{t.qualifications || '-'}</td>
                  </tr>
                )) ) : (
                  <tr>
                    <td colSpan={7} className="p-10 text-center" style={{ color: 'var(--text-muted)' }}>
                      No teachers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherManagement;