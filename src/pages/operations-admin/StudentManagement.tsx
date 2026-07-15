import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "../../styles/events.css";
import API from "../../api/axios";

const StudentManagement = () => {
  const [students, setStudents] = useState([]);

  const fetchStudents = async () => {
    try {
      const res = await API.get("/api/admin/student-admin/students");
      setStudents(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />

        <div className="dashboard-container">
          <h2>🎓 View All Students </h2>
          <div className="table-container">  
            <div className="overflow-x-auto w-full">  
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Roll No.</th>
                </tr>
              </thead>

              <tbody>
                {students.map((s) => (
                  <tr key={s._id}>
                    <td>{s.user.name}</td>
                    <td>{s.user.email}</td>
                    <td>{s.user.phone}</td>
                    <td>{s.className}</td>
                    <td>{s.section}</td>
                    <td>{s.rollNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>  
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentManagement;