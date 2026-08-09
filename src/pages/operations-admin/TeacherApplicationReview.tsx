import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import API from '../../api/axios';
import {
  FiCheck, FiX, FiClock, FiFileText, FiCalendar,
  FiTrash2, FiUser, FiAlertTriangle
} from 'react-icons/fi';

const TeacherApplicationReview = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<{ className: string; section: string } | null>(null);
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const email = localStorage.getItem('userEmail') || '';

  // Step 1: fetch teacher profile to know which class they manage
  const fetchTeacherClass = useCallback(async () => {
    try {
      const res = await API.get(`/api/teacher/profile-info/${email}`);
      const data = res.data?.data;
      if (data?.isClassTeacher && data?.classInCharge) {
        setIsClassTeacher(true);
        setClassInfo({
          className: data.classInCharge.className,
          section: data.classInCharge.section,
        });
        return {
          className: data.classInCharge.className,
          section: data.classInCharge.section,
        };
      }
    } catch (err) {
      console.error('Could not fetch teacher class info', err);
    }
    return null;
  }, [email]);

  // Step 2: fetch applications — filtered by class if class teacher, otherwise all
  const fetchApplications = useCallback(async (cls?: { className: string; section: string } | null) => {
    try {
      setLoading(true);
      let res;
      if (cls) {
        res = await API.get(`/api/application/by-class?className=${encodeURIComponent(cls.className)}&section=${encodeURIComponent(cls.section)}`);
      } else {
        res = await API.get('/api/application/all');
      }
      setApplications(res.data || []);
    } catch (err) {
      console.error('Error fetching applications', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const cls = await fetchTeacherClass();
      await fetchApplications(cls);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Approve / Reject
  const handleStatusUpdate = async (id: string, newStatus: string) => {
    const remarks = prompt(`Enter remarks for ${newStatus}:`);
    if (remarks === null) return; // cancelled
    const userName = localStorage.getItem('userName') || 'Admin';
    const userRole = (localStorage.getItem('role') || 'Admin').replace('-', ' ').toUpperCase();
    const processedBy = `${userName} (${userRole})`;
    try {
      await API.patch(`/api/application/status/${id}`, {
        status: newStatus,
        teacherRemarks: remarks,
        processedBy,
      });
      await fetchApplications(classInfo);
    } catch (err) {
      alert('Error updating status');
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await API.delete(`/api/application/${id}`);
      setApplications(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      alert('Error deleting application');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const pendingCount = applications.filter(a => a.status === 'Pending').length;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="p-6 lg:p-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FiFileText className="text-indigo-500" />
                Student Leave Applications
              </h1>
              <p className="text-[var(--text-muted)] text-sm mt-1">
                {isClassTeacher && classInfo
                  ? `Showing applications for your class: `
                  : 'Showing all student applications'}
                {isClassTeacher && classInfo && (
                  <span className="ml-1 inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 font-bold text-xs px-2.5 py-0.5 rounded-full border border-indigo-200">
                    Class {classInfo.className}-{classInfo.section}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-amber-50 text-amber-600 px-4 py-2 rounded-xl text-sm font-bold border border-amber-100 flex items-center gap-2">
                <FiClock size={14} />
                Pending: {pendingCount}
              </div>
              <div className="bg-[var(--card-bg)] text-[var(--text-muted)] px-4 py-2 rounded-xl text-sm font-bold border border-[var(--border-color)]">
                Total: {applications.length}
              </div>
            </div>
          </div>

          {/* Applications list */}
          <div className="grid gap-4">
            {loading ? (
              <div className="text-center py-20 bg-[var(--card-bg)] rounded-3xl border border-[var(--border-color)]">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-[var(--text-muted)] text-sm">Loading applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-20 bg-[var(--card-bg)] text-[var(--text-main)] rounded-3xl border border-dashed border-[var(--border-color)]">
                <FiFileText className="mx-auto text-4xl text-slate-300 mb-4" />
                <p className="text-slate-500 font-bold">No applications found</p>
                <p className="text-slate-400 text-sm mt-1">
                  {isClassTeacher && classInfo
                    ? `No students from Class ${classInfo.className}-${classInfo.section} have submitted any applications.`
                    : 'No applications submitted yet.'}
                </p>
              </div>
            ) : (
              applications.map((app: any) => {
                const studentName = app.student?.user?.name || app.studentName || 'Student';
                const studentClass = app.student?.className
                  ? `${app.student.className}${app.student.section ? `-${app.student.section}` : ''}`
                  : (app.applyingClass || app.allocatedClass || '');
                const isConfirmingDelete = confirmDeleteId === app._id;
                const isDeleting = deletingId === app._id;

                return (
                  <div
                    key={app._id}
                    className="bg-[var(--card-bg)] text-[var(--text-main)] p-5 rounded-2xl shadow-sm border border-[var(--border-color)] transition-all hover:shadow-md"
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-4">

                      {/* Left: Application Info */}
                      <div className="flex-1 min-w-0">
                        {/* Status + Date row */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${getStatusColor(app.status)}`}>
                            {app.status}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                            <FiClock size={11} />
                            {new Date(app.appliedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {app.type}
                          </span>
                        </div>

                        {/* Student name + class */}
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="flex items-center gap-1.5 font-bold text-indigo-600">
                            <FiUser size={14} />
                            {studentName}
                          </span>
                          {studentClass && (
                            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                              Class {studentClass}
                            </span>
                          )}
                        </div>

                        {/* Subject & Description */}
                        <h3 className="font-bold text-base text-[var(--text-main)] mb-1">{app.subject}</h3>
                        <p className="text-sm text-[var(--text-muted)] italic bg-[var(--input-bg)] px-3 py-2 rounded-xl leading-relaxed">
                          "{app.description}"
                        </p>

                        {/* Leave dates */}
                        {app.type === 'Leave' && app.startDate && (
                          <div className="mt-2 flex gap-4 text-xs font-bold text-[var(--text-muted)] bg-blue-50/60 w-fit px-3 py-1.5 rounded-lg">
                            <span className="flex items-center gap-1">
                              <FiCalendar className="text-blue-500" size={12} />
                              From: {new Date(app.startDate).toLocaleDateString('en-GB')}
                            </span>
                            <span className="flex items-center gap-1">
                              <FiCalendar className="text-blue-500" size={12} />
                              To: {new Date(app.endDate).toLocaleDateString('en-GB')}
                            </span>
                          </div>
                        )}

                        {/* Teacher remarks (if processed) */}
                        {app.status !== 'Pending' && (
                          <div className="mt-3 text-xs bg-[var(--input-bg)] p-3 rounded-xl border border-[var(--border-color)] text-[var(--text-muted)]">
                            <span className="font-bold text-[var(--text-main)]">Processed by:</span>{' '}
                            <span className="text-indigo-600 font-bold">{app.processedBy || 'Admin'}</span>
                            {app.teacherRemarks && (
                              <div className="mt-1">
                                Remarks: <span className="italic">"{app.teacherRemarks}"</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Action Buttons */}
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-end gap-2 flex-shrink-0">

                        {/* Approve / Reject (only for Pending) */}
                        {app.status === 'Pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStatusUpdate(app._id, 'Approved')}
                              className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm"
                            >
                              <FiCheck size={13} /> Approve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(app._id, 'Rejected')}
                              className="flex items-center gap-1.5 bg-white text-rose-600 border border-rose-300 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-rose-50 transition-all shadow-sm"
                            >
                              <FiX size={13} /> Reject
                            </button>
                          </div>
                        )}

                        {/* DELETE — always visible */}
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                            <FiAlertTriangle size={13} className="text-rose-500 flex-shrink-0" />
                            <span className="text-xs font-bold text-rose-600 whitespace-nowrap">Sure?</span>
                            <button
                              onClick={() => handleDelete(app._id)}
                              disabled={isDeleting}
                              className="text-xs bg-rose-600 text-white px-2.5 py-1 rounded-lg font-bold hover:bg-rose-700 disabled:opacity-50 transition-all"
                            >
                              {isDeleting ? '...' : 'Yes, Delete'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs text-slate-500 hover:text-slate-700 font-bold px-1"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(app._id)}
                            className="flex items-center gap-1.5 text-rose-500 border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            <FiTrash2 size={13} /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherApplicationReview;