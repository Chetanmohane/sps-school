import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { 
  FiSend, FiFileText, FiCalendar, FiClock, 
  FiLoader, FiMessageCircle, FiCheckCircle, FiAlertCircle
} from 'react-icons/fi';
import API from '../../api/axios'; 

const Application = () => {
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const email = localStorage.getItem('userEmail') || '';
  const [formData, setFormData] = useState({
    type: '',
    subject: '',
    description: '',
    startDate: '',
    endDate: '',
    email: email
  });

  useEffect(() => {
    fetchStudentAndApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showFeedback = (text: string, type: 'success' | 'error') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const fetchStudentAndApplications = async () => {
    try {
      setLoadingHistory(true);
      
      // 1. Fetch student profile to get the unique student _id
      const profileRes = await API.get(`/api/student/profile/${email}`);
      const studentData = profileRes.data;

      // 2. Fetch all applications
      const appRes = await API.get('/api/application/all');
      const allApps = appRes.data || [];

      // 3. Filter applications for this student
      const studentApps = allApps.filter((app: any) => 
        app.student && app.student._id === studentData._id
      );
      setApplications(studentApps);
    } catch (err) {
      console.error("Failed to load application history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type) {
      showFeedback("Please choose an application category", "error");
      return;
    }
    setLoadingSubmit(true);
    try {
      await API.post('/api/application/send', formData);
      showFeedback("Application Submitted Successfully!", "success");
      setFormData({ type: '', subject: '', description: '', startDate: '', endDate: '', email });
      
      // Refresh the application list
      await fetchStudentAndApplications();
    } catch (err) {
      console.error(err);
      showFeedback("Failed to submit application. Please try again.", "error");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="p-6 lg:p-8 bg-[var(--bg-color)] min-h-screen text-[var(--text-main)] animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <header className="mb-8">
            <h1 className="text-2xl font-black flex items-center gap-2">
              <FiFileText className="text-indigo-500" /> Administrative Requests
            </h1>
            <p className="text-[var(--text-muted)] text-sm">
              Submit requests for certificates, leave requests, or other academic permissions and track their approval.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Form to submit request */}
            <div className="lg:col-span-5">
              <div className="bg-[var(--card-bg)] text-[var(--text-main)] p-6 rounded-3xl border border-[var(--border-color)] shadow-sm space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-[var(--text-main)]">New Request</h3>
                  <p className="text-xs text-[var(--text-muted)]">Fill out details below to send request to administration.</p>
                </div>

                {feedbackMsg && (
                  <div className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-bold border transition-all animate-in fade-in duration-200 ${
                    feedbackMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {feedbackMsg.type === 'success' ? <FiCheckCircle size={16} className="flex-shrink-0 text-emerald-600" /> : <FiAlertCircle size={16} className="flex-shrink-0 text-rose-600" />}
                    <span>{feedbackMsg.text}</span>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Application Type Selection */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] ml-1">Request Category</label>
                    <select 
                      name="type"
                      required
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl outline-none cursor-pointer text-sm font-semibold"
                    >
                      <option value="">Select Category...</option>
                      <option value="Leave">Leave Application</option>
                      <option value="Bonafide">Bonafide Certificate</option>
                      <option value="Fee Extension">Fee Extension Request</option>
                      <option value="Document">Document Request (Marksheet/TC)</option>
                      <option value="Other">Other Request</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] ml-1">Subject Title</label>
                    <input 
                      type="text" 
                      name="subject"
                      placeholder="Brief subject of the request"
                      required 
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl outline-none text-sm" 
                    />
                  </div>

                  {/* Optional Dates - Only relevant for Leave requests */}
                  {formData.type === 'Leave' && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-[var(--text-muted)] ml-1">Start Date</label>
                        <input 
                          type="date" 
                          name="startDate" 
                          onChange={handleChange} 
                          required 
                          className="w-full p-3 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl outline-none text-sm font-medium" 
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-[var(--text-muted)] ml-1">End Date</label>
                        <input 
                          type="date" 
                          name="endDate" 
                          onChange={handleChange} 
                          required 
                          className="w-full p-3 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl outline-none text-sm font-medium" 
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] ml-1">Detailed Description / Reason</label>
                    <textarea 
                      name="description"
                      rows={5} 
                      placeholder="Provide full description and details here..." 
                      className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl outline-none resize-none text-sm"
                      required
                      value={formData.description}
                      onChange={handleChange}
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loadingSubmit}
                    className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50 text-sm"
                  >
                    {loadingSubmit ? "Submitting Request..." : "Submit Request"} <FiSend />
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: List showing past applications */}
            <div className="lg:col-span-7">
              <div className="bg-[var(--card-bg)] text-[var(--text-main)] p-6 rounded-3xl border border-[var(--border-color)] shadow-sm min-h-[400px] flex flex-col">
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-[var(--text-main)]">Request History</h3>
                  <p className="text-xs text-[var(--text-muted)]">Track status of your submitted administrative requests.</p>
                </div>

                {loadingHistory ? (
                  <div className="flex-1 flex items-center justify-center">
                    <FiLoader className="animate-spin text-indigo-500" size={32} />
                  </div>
                ) : applications.length > 0 ? (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {applications.map((app) => {
                      const isLeave = app.type === 'Leave';
                      const appliedDate = new Date(app.appliedDate);

                      return (
                        <div key={app._id} className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--input-bg)] space-y-3 relative hover:shadow-sm transition-shadow">
                          <div className="flex justify-between items-start">
                            <div>
                              {(() => {
                                const classNameVal = app.student?.className 
                                  ? `${app.student.className}${app.student.section ? `-${app.student.section}` : ''}`
                                  : (app.applyingClass || app.allocatedClass || '');
                                return (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                                      {app.type}
                                    </span>
                                    {classNameVal && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
                                        Class: {classNameVal}
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                              <h4 className="font-bold text-sm text-[var(--text-main)] mt-1.5">{app.subject}</h4>
                              <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                                <FiCalendar /> Filed on {appliedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                            
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              app.status === 'Approved'
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : app.status === 'Rejected'
                                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            }`}>
                              {app.status}
                            </span>
                          </div>

                          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                            {app.description}
                          </p>

                          {isLeave && app.startDate && app.endDate && (
                            <div className="text-[11px] text-[var(--text-muted)] font-semibold bg-[var(--card-bg)] px-3 py-1.5 rounded-xl border border-[var(--border-color)] w-fit flex items-center gap-1">
                              📅 Leave Period: {new Date(app.startDate).toLocaleDateString('en-GB')} to {new Date(app.endDate).toLocaleDateString('en-GB')}
                            </div>
                          )}

                          {app.teacherRemarks && (
                            <div className="bg-amber-50/50 border border-amber-100/50 text-amber-800 p-3 rounded-xl text-xs space-y-1">
                              <p className="font-bold flex items-center gap-1">
                                <FiMessageCircle size={13} /> Administrator Remarks:
                              </p>
                              <p className="font-medium">{app.teacherRemarks}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-[var(--border-color)] rounded-2xl bg-[var(--input-bg)]">
                    <FiClock className="text-slate-300 mb-2 animate-pulse" size={32} />
                    <p className="text-xs text-[var(--text-muted)] font-bold">No Request History</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Your submitted applications will show up here.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Application;