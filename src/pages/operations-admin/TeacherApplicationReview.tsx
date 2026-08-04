import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import API from '../../api/axios';
import { FiCheck, FiX, FiClock, FiFileText, FiCalendar } from 'react-icons/fi';

const TeacherApplicationReview = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await API.get('/api/application/all'); 
      setApplications(res.data);
    } catch (err) {
      console.error("Error fetching applications", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    const remarks = prompt(`Enter remarks for ${newStatus}:`);
    const userName = localStorage.getItem('userName') || 'Admin';
    const userRole = (localStorage.getItem('role') || 'Admin').replace('-', ' ').toUpperCase();
    const processedBy = `${userName} (${userRole})`;
    try {
      await API.patch(`/api/application/status/${id}`, { 
        status: newStatus, 
        teacherRemarks: remarks,
        processedBy: processedBy
      });
      alert(`Application ${newStatus} successfully!`);
      fetchApplications(); 
    } catch (err) {
      alert("Error updating status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Student Applications</h1>
              <p className="text-[var(--text-muted)] text-sm">Review and manage leave or document requests.</p>
            </div>
            <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold border border-blue-100">
              Pending: {applications.filter(a => a.status === 'Pending').length}
            </div>
          </div>

          <div className="grid gap-6">
            {loading ? (
              <p>Loading applications...</p>
            ) : applications.length === 0 ? (
              <div className="text-center py-20 bg-[var(--card-bg)] text-[var(--text-main)] rounded-[32px] border border-dashed border-[var(--border-color)]">
                <FiFileText className="mx-auto text-4xl text-slate-300 mb-4" />
                <p className="text-slate-400">No applications found.</p>
              </div>
            ) : (
              applications.map((app: any) => (
                <div key={app._id} className="bg-[var(--card-bg)] text-[var(--text-main)] p-6 rounded-[32px] shadow-sm border border-[var(--border-color)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <FiClock /> {new Date(app.appliedDate).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-bold text-blue-600">{app.student?.user?.name || app.studentName || "Student"}</h3>
                    <p className="text-[var(--text-muted)] text-sm mb-3">Application type: ({app.type})</p>
                    <h3 className="font-bold text-lg text-[var(--text-main)]">{app.subject}</h3>
                    <p className="bg-[var(--input-bg)] p-4 rounded-2xl text-[var(--text-muted)] text-sm italic">"{app.description}"</p>
                    {app.type === 'Leave' && app.startDate && (
                      <div className="mt-3 flex gap-4 text-xs font-bold text-[var(--text-muted)] bg-blue-50/50 w-fit px-3 py-2 rounded-lg">
                        <span className="flex items-center gap-1"><FiCalendar className="text-blue-500"/> From: {new Date(app.startDate).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><FiCalendar className="text-blue-500"/> To: {new Date(app.endDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {app.status !== 'Pending' && (
                      <div className="mt-3 text-xs bg-[var(--input-bg)] p-3 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)]" style={{ maxWidth: '400px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-main)' }}>Decision Details:</div>
                        <div>Status updated by: <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{app.processedBy || 'Admin'}</span></div>
                        {app.teacherRemarks && <div style={{ marginTop: '2px' }}>Remarks: <span className="italic">"{app.teacherRemarks}"</span></div>}
                      </div>
                    )}
                  </div>

                  {app.status === 'Pending' && (
                    <div className="flex gap-2 w-full md:w-auto">
                      <button 
                        onClick={() => handleStatusUpdate(app._id, 'Approved')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-1 rounded-2xl font-bold hover:bg-green-700 transition-all"
                      >
                        <FiCheck /> Approve
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(app._id, 'Rejected')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[var(--card-bg)] text-[var(--text-main)] text-red-600 border border-red-300 px-4 py-1 rounded-2xl font-bold hover:bg-red-50 transition-all"
                      >
                        <FiX /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherApplicationReview;