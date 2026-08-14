import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import API from '../../api/axios';
import {
  FiSend, FiBookOpen, FiCalendar, FiCheckSquare,
  FiAward, FiClock, FiAlertCircle, FiLoader, FiCheckCircle,
  FiX, FiLink, FiMessageCircle
} from 'react-icons/fi';

import { useSocket } from '../../context/SocketContext';

const StudentAssignments = () => {
  const { onEvent } = useSocket();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedAsg, setSelectedAsg] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  useEffect(() => {
    fetchData();
    const unsub = onEvent('ASSIGNMENT_CHANGED', (data: any) => {
      if (data?.action === 'delete' && data?.id) {
        setAssignments(prev => prev.filter(a => a._id !== data.id));
        setSubmissions(prev => prev.filter(s => {
          const asgId = typeof s.assignment === 'object' ? s.assignment?._id : s.assignment;
          return asgId !== data.id;
        }));
      } else {
        fetchData();
      }
    });
    return () => { unsub?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) throw new Error('No student email found');
      const [asgRes, subRes] = await Promise.all([
        API.get(`/api/assignment/all?email=${userEmail}`),
        API.get(`/api/assignment/my-submissions?email=${userEmail}`)
      ]);
      setAssignments(asgRes.data || []);
      setSubmissions(subRes.data || []);
    } catch (err: any) {
      setError('Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  const pendingAssignments = assignments.filter(asg =>
    !submissions.some(sub => {
      const subAsgId = typeof sub.assignment === 'object' ? sub.assignment?._id : sub.assignment;
      return subAsgId === asg._id;
    })
  );

  const resetModal = () => {
    setSelectedAsg(null);
    setAnswer('');
    setFileUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) { alert('Please write your answer or notes.'); return; }

    setSubmitting(true);
    try {
      const userEmail = localStorage.getItem('userEmail');
      await API.post('/api/assignment/submit', {
        answer,
        fileUrl: fileUrl.trim(),
        assignment: selectedAsg._id,
        userEmail
      });
      alert('✅ Assignment submitted successfully!');
      const subRes = await API.get(`/api/assignment/my-submissions?email=${userEmail}`);
      setSubmissions(subRes.data || []);
      resetModal();
      setActiveTab('history');
    } catch (err: any) {
      alert('❌ ' + (err.response?.data?.message || 'Submission failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-color)]">
        <FiLoader className="animate-spin text-indigo-600" size={44} />
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="p-6 lg:p-8 bg-[var(--bg-color)] min-h-screen text-[var(--text-main)]">

          <header className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                🔗 Link Only Submission Portal (PDF Option Removed)
              </span>
            </div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <FiBookOpen className="text-indigo-500" /> Classroom Assignments
            </h1>
            <p className="text-[var(--text-muted)] text-sm">Submit your assignments via link/notes and track your grades.</p>
          </header>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 flex items-center gap-2 border border-red-100">
              <FiAlertCircle /> {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-[var(--border-color)]">
            {[
              { key: 'pending', icon: <FiClock />, label: `Pending (${pendingAssignments.length})` },
              { key: 'history', icon: <FiCheckCircle />, label: `Submitted (${submissions.length})` }
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as any)}
                className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === t.key
                    ? 'border-indigo-500 text-indigo-500'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ── PENDING TAB ── */}
          {activeTab === 'pending' && (
            <div className="grid gap-5">
              {pendingAssignments.length > 0 ? pendingAssignments.map((asg) => {
                const due = new Date(asg.dueDate);
                const overdue = due.getTime() < new Date().setHours(0, 0, 0, 0);
                return (
                  <div key={asg._id}
                    className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--border-color)] shadow-sm flex flex-col md:flex-row justify-between gap-5 hover:shadow-md transition-shadow relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 h-full w-2 rounded-l-3xl bg-indigo-500" />
                    <div className="flex-1 pl-4 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Class {asg.className}
                        </span>
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                          Section {asg.section}
                        </span>
                        {overdue && (
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                            ⚠ Overdue
                          </span>
                        )}
                      </div>
                      {(() => {
                        const creatorInfo = asg.givenBy || (asg.teacher?.name ? `${asg.teacher.name} (${(asg.teacher.role || 'Teacher').replace('-', ' ').toUpperCase()})` : 'Faculty Instructor');
                        return (
                          <>
                            <h3 className="font-bold text-lg text-[var(--text-main)]">{asg.title}</h3>
                            <div className="text-xs font-semibold text-indigo-600 flex items-center gap-1.5 bg-indigo-50/70 border border-indigo-100 px-3 py-1 rounded-xl w-fit">
                              👔 Assigned by: <span className="font-bold text-slate-800">{creatorInfo}</span>
                            </div>
                            <p className="text-sm text-[var(--text-muted)] line-clamp-2">{asg.instructions}</p>
                          </>
                        );
                      })()}
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                        overdue ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        <FiCalendar size={11} /> Due: {due.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex gap-2 self-start md:self-center shrink-0">
                      <button onClick={() => setSelectedAsg(asg)}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-md"
                      >
                        Submit <FiSend size={14} />
                      </button>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-20 bg-[var(--card-bg)] rounded-3xl border border-dashed border-[var(--border-color)]">
                  <FiCheckCircle className="mx-auto text-emerald-500 mb-3 animate-bounce" size={48} />
                  <p className="font-black text-lg text-[var(--text-main)]">All Caught Up! 🎉</p>
                  <p className="text-slate-400 text-xs mt-1">No pending assignments.</p>
                </div>
              )}
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === 'history' && (
            <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--border-color)] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[var(--input-bg)] text-[var(--text-muted)] text-xs font-bold uppercase">
                    <tr>
                      <th className="px-6 py-4">Assignment</th>
                      <th className="px-6 py-4">Submitted On</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Marks</th>
                      <th className="px-6 py-4">Teacher Remarks</th>
                      <th className="px-6 py-4">Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {submissions.length > 0 ? submissions.map((sub) => {
                      const asgD = typeof sub.assignment === 'object' ? sub.assignment : null;
                      const d = new Date(sub.submittedAt);
                      return (
                        <tr key={sub._id} className="hover:bg-[var(--input-bg)] transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-sm text-[var(--text-main)]">{asgD?.title || 'Assignment'}</p>
                            {asgD?.className && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                                  Class {asgD.className}-{asgD.section}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--text-muted)]">
                            {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            <span className="block text-[10px]">{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                              sub.status === 'Graded'
                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                : 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
                            }`}>
                              <FiCheckSquare size={11} /> {sub.status || 'Submitted'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {sub.status === 'Graded' ? (
                              <span className="font-black text-indigo-600 flex items-center gap-1 text-base">
                                <FiAward className="text-amber-500" /> {sub.marks} <span className="text-xs font-medium text-[var(--text-muted)]">/ 100</span>
                              </span>
                            ) : (
                              <span className="text-xs text-[var(--text-muted)]">Awaiting grade</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {sub.remarks ? (
                              <div className="bg-indigo-50/80 border border-indigo-100 text-indigo-900 p-2.5 rounded-xl text-xs max-w-xs">
                                <p className="font-semibold italic text-slate-800">"{sub.remarks}"</p>
                                {sub.gradedBy && (
                                  <p className="text-[10px] font-bold text-indigo-600 mt-1">👔 Evaluator: {sub.gradedBy}</p>
                                )}
                              </div>
                            ) : sub.status === 'Graded' ? (
                              <span className="text-xs text-[var(--text-muted)] italic">Good effort!</span>
                            ) : (
                              <span className="text-xs text-[var(--text-muted)]">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {sub.fileUrl ? (
                              <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                <FiLink size={12} /> View Link
                              </a>
                            ) : (
                              <span className="text-xs text-[var(--text-muted)]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-muted)]">
                          No submissions yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SUBMISSION MODAL ── */}
          {selectedAsg && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-[var(--card-bg)] text-[var(--text-main)] w-full max-w-lg rounded-[32px] p-7 shadow-2xl border border-[var(--border-color)]">

                {/* Modal header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Class {selectedAsg.className}
                      </span>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                        Section {selectedAsg.section}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-[var(--text-main)] leading-tight">{selectedAsg.title}</h3>
                  </div>
                  <button onClick={resetModal} className="p-2 rounded-full hover:bg-[var(--input-bg)] text-[var(--text-muted)] transition-colors">
                    <FiX size={18} />
                  </button>
                </div>

                {/* Instructions */}
                <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 mb-5 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-1">
                      <FiMessageCircle size={11} /> Teacher's Instructions
                    </p>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                      👔 Given by: {selectedAsg.givenBy || (selectedAsg.teacher?.name ? `${selectedAsg.teacher.name} (${(selectedAsg.teacher.role || 'Teacher').replace('-', ' ').toUpperCase()})` : 'Faculty Instructor')}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    {selectedAsg.instructions || 'No specific instructions provided.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Answer */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] ml-1 mb-1 block">Your Answer / Notes <span className="text-rose-500">*</span></label>
                    <textarea
                      required
                      rows={3}
                      className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl outline-none text-sm resize-none focus:ring-2 ring-indigo-500/20"
                      placeholder="Write your explanation or notes..."
                      value={answer}
                      onChange={e => setAnswer(e.target.value)}
                    />
                  </div>

                  {/* Link Input (optional) */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] ml-1 mb-1 block">
                      Submission Link <span className="text-slate-400 font-normal normal-case">(optional — Google Drive / Docs)</span>
                    </label>
                    <div className="relative">
                      <FiLink className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type="url"
                        className="w-full p-3.5 pl-10 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl outline-none text-sm focus:ring-2 ring-blue-500/20"
                        placeholder="https://drive.google.com/..."
                        value={fileUrl}
                        onChange={e => setFileUrl(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Submit / Cancel */}
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={resetModal}
                      className="flex-1 py-3 bg-[var(--input-bg)] hover:bg-[var(--border-color)] rounded-xl font-bold transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-3 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md text-sm disabled:opacity-60 bg-indigo-600 hover:bg-indigo-700"
                    >
                      {submitting ? <><FiLoader className="animate-spin" size={14} /> Submitting...</> : <>Submit Assignment <FiSend size={14} /></>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentAssignments;