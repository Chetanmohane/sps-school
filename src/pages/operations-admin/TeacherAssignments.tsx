import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import API from '../../api/axios';
import AcademicTabs from '../../components/AcademicTabs';
import {
  FiPlus, FiBookOpen, FiCalendar, FiLoader, FiAlertCircle,
  FiCheckCircle, FiX, FiAward, FiFileText, FiSave,
  FiUser, FiHash, FiLink, FiEye, FiLayers, FiTrash2
} from 'react-icons/fi';

const TeacherAssignments = () => {
  const [open, setOpen] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [viewSubModal, setViewSubModal] = useState(false);
  const [currentSubmissions, setCurrentSubmissions] = useState<any[]>([]);
  const [currentAsg, setCurrentAsg] = useState<any>(null);
  const [marksMap, setMarksMap] = useState<Record<string, string>>({});
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({ title: '', className: '', section: '', dueDate: '', instructions: '' });

  useEffect(() => { fetchAssignments(); }, []);

  const fetchAssignments = async () => {
    setFetching(true);
    try {
      const userEmail = localStorage.getItem('userEmail');
      const res = await API.get(`/api/assignment/all?email=${userEmail}`);
      setAssignments(res.data || []);
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDeleteAssignment = async (asgId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? All student submissions for this assignment will also be removed.`)) {
      return;
    }
    try {
      await API.delete(`/api/assignment/delete/${asgId}`);
      alert(`Assignment "${title}" deleted successfully.`);
      fetchAssignments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete assignment.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userEmail = localStorage.getItem('userEmail');
      await API.post('/api/assignment/create', { ...form, userEmail });
      setOpen(false);
      setForm({ title: '', className: '', section: '', dueDate: '', instructions: '' });
      fetchAssignments();
      alert('Assignment created successfully!');
    } catch (err) {
      alert('Failed to create assignment.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSubmissions = async (asg: any) => {
    try {
      const res = await API.get('/api/assignment/submit', { params: { asgId: asg._id } });
      setCurrentSubmissions(res.data || []);
      setCurrentAsg(asg);
      const map: Record<string, string> = {};
      const remMap: Record<string, string> = {};
      res.data.forEach((sub: any) => { 
        map[sub._id] = String(sub.marks ?? ''); 
        remMap[sub._id] = String(sub.remarks ?? ''); 
      });
      setMarksMap(map);
      setRemarksMap(remMap);
      setSavedIds(new Set(res.data.filter((s: any) => s.status === 'Graded').map((s: any) => s._id)));
      setViewSubModal(true);
    } catch {
      alert('Error fetching submissions');
    }
  };

  const handleSaveMarks = async (subId: string) => {
    const val = Number(marksMap[subId]);
    if (isNaN(val) || val < 0 || val > 100) {
      alert('Please enter marks between 0 and 100.');
      return;
    }
    setSavingId(subId);
    try {
      const userEmail = localStorage.getItem('userEmail');
      const currentName = localStorage.getItem('userName') || 'Teacher';
      const currentRole = (localStorage.getItem('role') || 'Teacher').replace('-', ' ').toUpperCase();
      const evaluator = `${currentName} (${currentRole})`;
      const enteredRemark = (remarksMap[subId] || 'Good effort!').trim();
      const formattedRemark = enteredRemark.includes('— by') ? enteredRemark : `${enteredRemark} — by ${evaluator}`;

      await API.put(`/api/assignment/update-marks/${subId}`, { 
        marks: val,
        remarks: formattedRemark,
        userEmail 
      });
      setCurrentSubmissions(prev =>
        prev.map(s => s._id === subId ? { ...s, marks: val, remarks: formattedRemark, gradedBy: evaluator, status: 'Graded' } : s)
      );
      setSavedIds(prev => new Set([...prev, subId]));
      alert(`✅ Marks (${val}/100) and Remarks saved successfully!`);
    } catch {
      alert('Could not save marks. Try again.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="p-8">
          {(() => {
            const userRole = localStorage.getItem('role') || '';
            const isAdminUser = ['super-admin', 'manager-admin', 'academic-admin', 'teacher-admin', 'student-admin'].includes(userRole) || userRole.includes('admin') || userRole.includes('manager');
            return isAdminUser && <AcademicTabs />;
          })()}

          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-main)]">Assignments</h1>
              <p className="text-[var(--text-muted)] text-sm font-medium">Create assignments and grade student submissions.</p>
            </div>
            <button onClick={() => setOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <FiPlus /> Create Assignment
            </button>
          </div>

          {/* Assignments Table */}
          <div className="bg-[var(--card-bg)] text-[var(--text-main)] rounded-[32px] shadow-sm border border-[var(--border-color)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--input-bg)]/50 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">
                    <th className="px-8 py-5">Assignment Details</th>
                    <th className="px-8 py-5">Class & Section</th>
                    <th className="px-8 py-5">Due Date</th>
                    <th className="px-8 py-5 text-center">Status</th>
                    <th className="px-8 py-5 text-center">Submissions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {fetching ? (
                    <tr><td colSpan={5} className="py-16 text-center">
                      <FiLoader className="animate-spin mx-auto text-blue-600 text-2xl mb-2" />
                      <p className="text-slate-400">Loading...</p>
                    </td></tr>
                  ) : assignments.length === 0 ? (
                    <tr><td colSpan={5} className="py-16 text-center">
                      <FiAlertCircle className="mx-auto text-slate-300 text-3xl mb-2" />
                      <p className="text-slate-400">No assignments yet.</p>
                    </td></tr>
                  ) : assignments.map((asg: any) => (
                    <tr key={asg._id} className="hover:bg-[var(--input-bg)]/30 transition-colors">
                      <td className="px-8 py-5">
                        <p className="font-bold text-[var(--text-main)]">{asg.title}</p>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{asg.instructions}</p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-lg text-xs font-bold">
                            Class {asg.className}
                          </span>
                          <span className="bg-violet-50 text-violet-700 border border-violet-100 px-2.5 py-1 rounded-lg text-xs font-bold">
                            Sec {asg.section}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm">
                          <FiCalendar className="text-blue-500" />
                          {new Date(asg.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase border border-green-100">
                          <FiCheckCircle size={11} /> Active
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => handleViewSubmissions(asg)}
                            className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline text-sm"
                          >
                            <FiEye size={14} /> View
                          </button>
                          <button onClick={() => handleDeleteAssignment(asg._id, asg.title)}
                            className="inline-flex items-center gap-1.5 text-rose-600 font-bold hover:text-rose-800 hover:underline text-sm"
                            title="Delete Assignment"
                          >
                            <FiTrash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── CREATE MODAL ── */}
          {open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-[var(--card-bg)] text-[var(--text-main)] w-full max-w-md rounded-[40px] shadow-2xl p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                      <FiBookOpen size={24} />
                    </div>
                    <h3 className="text-xl font-black">New Assignment</h3>
                  </div>
                  <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-[var(--input-bg)] text-[var(--text-muted)] transition-colors">
                    <FiX size={18} />
                  </button>
                </div>
                <form onSubmit={handleCreate} className="space-y-5">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">Title</label>
                    <input name="title" required value={form.title} placeholder="Assignment Title" onChange={handleChange}
                      className="w-full p-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl outline-none text-[var(--text-main)] focus:ring-4 ring-blue-500/10 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">Class</label>
                      <select
                        name="className"
                        required
                        value={form.className}
                        onChange={handleChange}
                        className="w-full p-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl outline-none text-[var(--text-main)] focus:ring-4 ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: '40px' }}
                      >
                        <option value="">Select Class</option>
                        {['Nursery','KG','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'].map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">Section</label>
                      <select
                        name="section"
                        required
                        value={form.section}
                        onChange={handleChange}
                        className="w-full p-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl outline-none text-[var(--text-main)] focus:ring-4 ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: '40px' }}
                      >
                        <option value="">Select Section</option>
                        {['A','B','C','D','E','F'].map(sec => (
                          <option key={sec} value={sec}>Section {sec}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">Due Date</label>
                    <input type="date" name="dueDate" required value={form.dueDate} onChange={handleChange}
                      className="w-full p-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl outline-none text-[var(--text-main)] focus:ring-4 ring-blue-500/10 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">Instructions</label>
                    <textarea name="instructions" value={form.instructions} rows={3} placeholder="Assignment details..." onChange={handleChange}
                      className="w-full p-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl outline-none text-[var(--text-main)] resize-none focus:ring-4 ring-blue-500/10 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button type="button" onClick={() => setOpen(false)}
                      className="flex-1 py-4 bg-slate-100 text-[var(--text-muted)] rounded-2xl font-bold hover:bg-slate-200 transition-all"
                    >Cancel</button>
                    <button type="submit" disabled={loading}
                      className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      {loading ? <FiLoader className="animate-spin" /> : 'Create Assignment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── SUBMISSIONS MODAL ── */}
          {viewSubModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
              <div className="bg-[var(--card-bg)] text-[var(--text-main)] w-full max-w-4xl rounded-[40px] shadow-2xl flex flex-col max-h-[88vh]">

                {/* Modal header */}
                <div className="flex justify-between items-start p-8 pb-4 flex-shrink-0 border-b border-[var(--border-color)]">
                  <div>
                    <h3 className="text-2xl font-black text-[var(--text-main)]">Student Submissions</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <p className="text-sm text-[var(--text-muted)] font-medium">{currentAsg?.title}</p>
                      {currentAsg && (
                        <>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Class {currentAsg.className}
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                            Section {currentAsg.section}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <span className="bg-[var(--input-bg)] border border-[var(--border-color)] px-3 py-1.5 rounded-xl text-xs font-bold text-[var(--text-muted)]">
                      <FiLayers className="inline mr-1" size={11} />{currentSubmissions.length} submission{currentSubmissions.length !== 1 ? 's' : ''}
                    </span>
                    <button onClick={() => setViewSubModal(false)}
                      className="p-2 bg-[var(--input-bg)] rounded-full hover:bg-[var(--border-color)] transition-colors"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                </div>

                {/* Submissions list */}
                <div className="overflow-y-auto flex-1 p-8 pt-5 space-y-4">
                  {currentSubmissions.length === 0 ? (
                    <div className="text-center py-14 text-slate-400">
                      <FiFileText className="mx-auto mb-3 text-slate-300" size={40} />
                      <p className="font-medium">No submissions yet.</p>
                    </div>
                  ) : currentSubmissions.map((sub: any) => {
                    const isPdf = sub.fileUrl?.startsWith('data:application/pdf');
                    const isGraded = savedIds.has(sub._id) || sub.status === 'Graded';
                    const studentName = sub.student?.user?.name || 'Unknown';
                    const rollNo = sub.student?.rollNumber || 'N/A';
                    const cls = sub.student?.className;
                    const sec = sub.student?.section;

                    return (
                      <div key={sub._id} className="p-6 bg-[var(--input-bg)] rounded-3xl border border-[var(--border-color)]">

                        {/* ── Student Info ── */}
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                              {studentName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-bold text-[var(--text-main)] text-base flex items-center gap-1.5">
                                <FiUser size={13} className="text-blue-500" />
                                {studentName}
                              </h4>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                  <FiHash size={10} /> Roll: {rollNo}
                                </span>
                                {cls && (
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    Class {cls}
                                  </span>
                                )}
                                {sec && (
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                                    Section {sec}
                                  </span>
                                )}
                                <span className="text-[10px] text-emerald-600 font-medium">
                                  Submitted: {new Date(sub.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* Status badge */}
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex-shrink-0 ${
                            isGraded
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                          }`}>
                            {isGraded ? `✓ Graded ${marksMap[sub._id] || sub.marks}/100` : 'Submitted'}
                          </span>
                        </div>

                        {/* Answer */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-4 rounded-2xl text-sm text-[var(--text-muted)] italic mb-4 leading-relaxed">
                          "{sub.answer}"
                        </div>

                        {/* File / PDF */}
                        <div className="mb-5">
                          {isPdf ? (
                            <a href={sub.fileUrl}
                              download={`${studentName.replace(/\s+/g,'_')}_assignment.pdf`}
                              className="inline-flex items-center gap-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                            >
                              <FiFileText size={13} /> Download Student PDF
                            </a>
                          ) : (
                            <a href={sub.fileUrl} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                            >
                              <FiLink size={13} /> View Submission Link
                            </a>
                          )}
                        </div>

                        {/* ── Marks & Remarks Section ── */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-4 rounded-2xl">
                          <p className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 flex items-center gap-1">
                            <FiAward className="text-amber-500" size={12} /> Enter Marks &amp; Teacher Remarks — Student will see this
                          </p>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={marksMap[sub._id] ?? ''}
                              onChange={e => setMarksMap(prev => ({ ...prev, [sub._id]: e.target.value }))}
                              className="w-24 p-3 bg-[var(--input-bg)] border-2 border-[var(--border-color)] rounded-xl text-center font-black text-[var(--text-main)] text-lg outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all"
                              placeholder="0"
                            />
                            <span className="text-[var(--text-muted)] font-bold text-lg">/ 100</span>
                            <button
                              onClick={() => handleSaveMarks(sub._id)}
                              disabled={savingId === sub._id}
                              className="ml-auto flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-60 shadow-sm"
                            >
                              {savingId === sub._id
                                ? <><FiLoader className="animate-spin" size={14} /> Saving...</>
                                : <><FiSave size={14} /> Save Marks &amp; Remark</>
                              }
                            </button>
                          </div>

                          <div className="mt-3">
                            <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1 block">Teacher Remarks / Feedback</label>
                            <input
                              type="text"
                              value={remarksMap[sub._id] ?? ''}
                              onChange={e => setRemarksMap(prev => ({ ...prev, [sub._id]: e.target.value }))}
                              className="w-full p-3 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl font-medium text-sm text-[var(--text-main)] outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all"
                              placeholder="e.g. Excellent work! / Good effort, clean explanation."
                            />
                          </div>

                          {isGraded && (
                            <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
                              <FiCheckCircle size={11} /> Marks ({marksMap[sub._id] || sub.marks}/100) &amp; Remarks saved — student can see this in their history
                            </p>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default TeacherAssignments;