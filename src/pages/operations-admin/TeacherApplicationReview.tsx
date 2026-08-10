import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import API from '../../api/axios';
import {
  FiCheck, FiX, FiClock, FiFileText, FiCalendar,
  FiTrash2, FiUser, FiAlertTriangle, FiCheckCircle, FiXCircle, FiMessageSquare
} from 'react-icons/fi';

const TeacherApplicationReview = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<{ className: string; section: string } | null>(null);
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filters & View Scope
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [viewAllClasses, setViewAllClasses] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Custom Modal State for Remarks
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    appId: string;
    newStatus: 'Approved' | 'Rejected';
    studentName: string;
    subject: string;
  } | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

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

  // Step 2: fetch applications — filtered by class if class teacher & viewAllClasses is false, otherwise all
  const fetchApplications = useCallback(async (cls?: { className: string; section: string } | null, forceAll = false) => {
    try {
      setLoading(true);
      let res;
      if (cls && !forceAll) {
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
      await fetchApplications(cls, viewAllClasses);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewAllClasses]);

  // Open Modal for Approve / Reject
  const openActionModal = (app: any, newStatus: 'Approved' | 'Rejected') => {
    const studentName = app.student?.user?.name || app.studentName || 'Student';
    setActionModal({
      isOpen: true,
      appId: app._id,
      newStatus,
      studentName,
      subject: app.subject || 'Leave Application',
    });
    setRemarks(app.teacherRemarks || '');
  };

  // Submit status update with teacher remarks
  const submitStatusUpdate = async () => {
    if (!actionModal) return;
    setIsSubmittingAction(true);
    const userName = localStorage.getItem('userName') || 'Class Teacher';
    const userRole = (localStorage.getItem('role') || 'Teacher').replace('-', ' ').toUpperCase();
    const processedBy = `${userName} (${userRole})`;

    try {
      await API.patch(`/api/application/status/${actionModal.appId}`, {
        status: actionModal.newStatus,
        teacherRemarks: remarks.trim() || (actionModal.newStatus === 'Approved' ? 'Approved by Class Teacher' : 'Rejected by Class Teacher'),
        processedBy,
      });
      showToast(`Leave application successfully ${actionModal.newStatus.toLowerCase()}!`, 'success');
      setActionModal(null);
      await fetchApplications(classInfo, viewAllClasses);
    } catch (err) {
      console.error('Error updating status', err);
      showToast('Error updating status. Please try again.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await API.delete(`/api/application/${id}`);
      setApplications(prev => prev.filter(a => a._id !== id));
      showToast('Application deleted successfully!', 'success');
    } catch (err) {
      showToast('Error deleting application', 'error');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const getStatusColor = (status: string) => {
    const st = (status || '').toLowerCase();
    switch (st) {
      case 'approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const pendingCount = applications.filter(a => (a.status || '').toLowerCase() === 'pending').length;
  const approvedCount = applications.filter(a => (a.status || '').toLowerCase() === 'approved').length;
  const rejectedCount = applications.filter(a => (a.status || '').toLowerCase() === 'rejected').length;

  const filteredApplications = applications.filter(app => {
    const st = (app.status || '').toLowerCase();
    if (statusFilter !== 'all' && st !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const studentName = (app.student?.user?.name || app.studentName || '').toLowerCase();
      const subject = (app.subject || '').toLowerCase();
      const description = (app.description || '').toLowerCase();
      const type = (app.type || '').toLowerCase();
      return studentName.includes(q) || subject.includes(q) || description.includes(q) || type.includes(q);
    }

    return true;
  });

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="p-6 lg:p-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2 text-[var(--text-main)]">
                <FiFileText className="text-indigo-500" />
                Student Leave & Certificate Applications
              </h1>
              <p className="text-[var(--text-muted)] text-sm mt-1">
                Review, approve, or reject student leave requests and academic applications.
                {isClassTeacher && classInfo && !viewAllClasses && (
                  <span className="ml-1 inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 font-bold text-xs px-2.5 py-0.5 rounded-full border border-indigo-200">
                    Class {classInfo.className}-{classInfo.section}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {isClassTeacher && (
                <button
                  onClick={() => setViewAllClasses(!viewAllClasses)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                    viewAllClasses 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-[var(--card-bg)] text-indigo-600 border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  {viewAllClasses ? '🔒 Filter by My Class Only' : '🌐 View All Classes'}
                </button>
              )}
              <div className="bg-amber-50 text-amber-600 px-3.5 py-2 rounded-xl text-xs font-bold border border-amber-100 flex items-center gap-1.5">
                <FiClock size={14} />
                Pending: {pendingCount}
              </div>
              <div className="bg-[var(--card-bg)] text-[var(--text-muted)] px-3.5 py-2 rounded-xl text-xs font-bold border border-[var(--border-color)]">
                Total: {applications.length}
              </div>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6 bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--border-color)]">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {[
                { key: 'all', label: 'All Requests', count: applications.length },
                { key: 'pending', label: '⏳ Pending Approval', count: pendingCount },
                { key: 'approved', label: '✅ Approved', count: approvedCount },
                { key: 'rejected', label: '❌ Rejected', count: rejectedCount },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    statusFilter === f.key
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${statusFilter === f.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <input
                type="text"
                placeholder="Search by student name or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3.5 pr-8 py-2 bg-[var(--input-bg)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Applications list */}
          <div className="grid gap-4">
            {loading ? (
              <div className="text-center py-20 bg-[var(--card-bg)] rounded-3xl border border-[var(--border-color)]">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-[var(--text-muted)] text-sm font-medium">Loading applications...</p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-20 bg-[var(--card-bg)] text-[var(--text-main)] rounded-3xl border border-dashed border-[var(--border-color)]">
                <FiFileText className="mx-auto text-4xl text-slate-300 mb-4" />
                <p className="text-slate-500 font-bold">No applications found</p>
                <p className="text-slate-400 text-sm mt-1">
                  {statusFilter !== 'all'
                    ? `No applications with status "${statusFilter}" found.`
                    : isClassTeacher && classInfo && !viewAllClasses
                    ? `No applications submitted from Class ${classInfo.className}-${classInfo.section} students.`
                    : 'No applications submitted yet.'}
                </p>
              </div>
            ) : (
              filteredApplications.map((app: any) => {
                const studentName = app.student?.user?.name || app.studentName || 'Student';
                const studentClass = app.student?.className
                  ? `${app.student.className}${app.student.section ? `-${app.student.section}` : ''}`
                  : (app.applyingClass || app.allocatedClass || '');
                const isConfirmingDelete = confirmDeleteId === app._id;
                const isDeleting = deletingId === app._id;
                const currentStatus = (app.status || 'Pending').toLowerCase();
                const isPending = currentStatus === 'pending';

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
                            {app.status || 'Pending'}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                            <FiClock size={11} />
                            {new Date(app.appliedDate || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                            {app.type || 'Leave'}
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
                        <h3 className="font-bold text-base text-[var(--text-main)] mb-1">{app.subject || 'Application'}</h3>
                        <p className="text-sm text-[var(--text-muted)] italic bg-[var(--input-bg)] px-3 py-2 rounded-xl leading-relaxed">
                          "{app.description || 'No description provided.'}"
                        </p>

                        {/* Leave dates */}
                        {(app.type === 'Leave' || app.startDate) && app.startDate && (
                          <div className="mt-2 flex gap-4 text-xs font-bold text-[var(--text-muted)] bg-blue-50/60 w-fit px-3 py-1.5 rounded-lg border border-blue-100">
                            <span className="flex items-center gap-1">
                              <FiCalendar className="text-blue-500" size={12} />
                              From: {new Date(app.startDate).toLocaleDateString('en-GB')}
                            </span>
                            {app.endDate && (
                              <span className="flex items-center gap-1">
                                <FiCalendar className="text-blue-500" size={12} />
                                To: {new Date(app.endDate).toLocaleDateString('en-GB')}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Teacher remarks (if processed) */}
                        {!isPending && (
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

                      {/* Right: Action Buttons (Approve / Reject / Change Status / Delete) */}
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-end gap-2 flex-shrink-0">

                        {/* Action Buttons for Pending or Re-evaluating */}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openActionModal(app, 'Approved')}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
                              currentStatus === 'approved'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            <FiCheck size={14} /> {currentStatus === 'approved' ? 'Approved ✓' : 'Approve'}
                          </button>
                          <button
                            onClick={() => openActionModal(app, 'Rejected')}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
                              currentStatus === 'rejected'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-white text-rose-600 border border-rose-300 hover:bg-rose-50'
                            }`}
                          >
                            <FiX size={14} /> {currentStatus === 'rejected' ? 'Rejected ✗' : 'Reject'}
                          </button>
                        </div>

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

      {/* Action Modal for Remarks */}
      {actionModal && actionModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--card-bg)] text-[var(--text-main)] rounded-3xl p-6 shadow-2xl border border-[var(--border-color)] max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-2xl flex items-center justify-center ${
                actionModal.newStatus === 'Approved' 
                  ? 'bg-emerald-100 text-emerald-600' 
                  : 'bg-rose-100 text-rose-600'
              }`}>
                {actionModal.newStatus === 'Approved' ? <FiCheckCircle size={24} /> : <FiXCircle size={24} />}
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight text-[var(--text-main)]">
                  {actionModal.newStatus === 'Approved' ? 'Approve Application' : 'Reject Application'}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  For student: <span className="font-bold text-indigo-600">{actionModal.studentName}</span>
                </p>
              </div>
            </div>

            <div className="bg-[var(--input-bg)] p-3.5 rounded-2xl border border-[var(--border-color)] mb-4 text-xs">
              <span className="text-[var(--text-muted)] font-semibold block mb-0.5">Subject:</span>
              <span className="font-bold text-[var(--text-main)]">{actionModal.subject}</span>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 flex items-center gap-1">
                <FiMessageSquare size={13} />
                Teacher Remarks / Reason (Optional)
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  actionModal.newStatus === 'Approved'
                    ? "e.g. Approved. Please complete missed homework."
                    : "e.g. Rejected due to upcoming examination schedule."
                }
                className="w-full p-3 bg-[var(--input-bg)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                disabled={isSubmittingAction}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--input-bg)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitStatusUpdate}
                disabled={isSubmittingAction}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 ${
                  actionModal.newStatus === 'Approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                } disabled:opacity-50`}
              >
                {isSubmittingAction ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {actionModal.newStatus === 'Approved' ? <FiCheck size={14} /> : <FiX size={14} />}
                    Confirm {actionModal.newStatus}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-bold animate-in slide-in-from-top-3 duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20' 
            : 'bg-rose-600 text-white border-rose-500 shadow-rose-900/20'
        }`}>
          {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default TeacherApplicationReview;