import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';
import API from '../../api/axios';

const StudentAttendance = () => {
 const [attendanceData, setAttendanceData] = useState({ records: [], percentage: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const email = localStorage.getItem('userEmail');
        const response = await API.get(`/api/attendance/${email}`);
        setAttendanceData(response.data);
      } catch (err) {
        console.error("Error fetching attendance", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  if (loading) return <div className="p-8 text-center"><FiLoader className="animate-spin mx-auto" size={32} /></div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Attendance Record</h1>
            <div className="bg-[var(--card-bg)] text-[var(--text-main)] px-4 py-2 rounded-xl shadow-sm border border-[var(--border-color)]">
              <span className="text-[var(--text-muted)] text-sm">Overall: </span>
              <span className={`font-black ${attendanceData.percentage >= 75 ? 'text-green-600' : 'text-red-500'}`}>
                {attendanceData.percentage}%
              </span>
            </div>
          </div>

          <div className="bg-[var(--card-bg)] text-[var(--text-main)] rounded-3xl shadow-sm border border-[var(--border-color)] overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[var(--input-bg)] text-[var(--text-muted)] text-xs font-bold uppercase">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Day</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceData.records.length > 0 ? (
                  attendanceData.records.map((row, i) => {
                    const dateObj = new Date(row.date);
                    return (
                      <tr key={i} className="hover:bg-[var(--input-bg)] transition-colors">
                        <td className="px-6 py-4 font-medium">{dateObj.toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-[var(--text-muted)]">
                          {dateObj.toLocaleDateString('en-US', { weekday: 'long' })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center gap-2 font-bold ${row.status === 'Present' ? 'text-green-600' : 'text-red-500'}`}>
                            {row.status === 'Present' ? <FiCheckCircle /> : <FiXCircle />} {row.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-slate-400">No attendance records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentAttendance;