import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import API from '../../api/axios';
import { 
  FiSend, FiLink, FiBookOpen, FiCalendar, FiCheckSquare, 
  FiAward, FiClock, FiAlertCircle, FiLoader, FiCheckCircle, 
  FiExternalLink 
} from 'react-icons/fi';

const StudentAssignments = () => {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [selectedAsg, setSelectedAsg] = useState<any>(null);
    const [formData, setFormData] = useState({ answer: "", fileUrl: "" });
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const userEmail = localStorage.getItem('userEmail');
                if (!userEmail) throw new Error("No student email found in session");
                
                const [asgRes, subRes] = await Promise.all([
                    API.get(`/api/assignment/all?email=${userEmail}`),
                    API.get(`/api/assignment/my-submissions?email=${userEmail}`) 
                ]);

                setAssignments(asgRes.data || []);
                setSubmissions(subRes.data || []);
            } catch (err: any) {
                console.error("Fetch error:", err);
                setError("Failed to load assignments and submissions.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const pendingAssignments = assignments.filter(asg => 
        !submissions.some(sub => {
            const subAsgId = typeof sub.assignment === 'object' ? sub.assignment?._id : sub.assignment;
            return subAsgId === asg._id;
        })
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const userEmail = localStorage.getItem('userEmail');
            await API.post('/api/assignment/submit', { 
                ...formData, 
                assignment: selectedAsg._id, 
                userEmail 
            });
            alert("Success! Assignment submitted.");
            
            // Reload submission list to show new data
            const subRes = await API.get(`/api/assignment/my-submissions?email=${userEmail}`);
            setSubmissions(subRes.data || []);
            setSelectedAsg(null);
            setFormData({ answer: "", fileUrl: "" });
            setActiveTab('history');
        } 
        catch (err: any) {
            alert(err.response?.data?.message || "Submission failed");
        } 
        finally { 
            setSubmitting(false); 
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[var(--bg-color)]">
                <FiLoader className="animate-spin text-blue-600" size={44} />
            </div>
        );
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <Navbar />
                <div className="p-6 lg:p-8 bg-[var(--bg-color)] min-h-screen text-[var(--text-main)] animate-in fade-in slide-in-from-bottom-4 duration-700">
                    
                    <header className="mb-8">
                        <h1 className="text-2xl font-black flex items-center gap-2">
                            <FiBookOpen className="text-indigo-500" /> Classroom Assignments
                        </h1>
                        <p className="text-[var(--text-muted)] text-sm">
                            Manage coursework, check deadlines, submit assignments, and track grades.
                        </p>
                    </header>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 flex items-center gap-2 border border-red-100">
                            <FiAlertCircle /> {error}
                        </div>
                    )}

                    {/* Navigation Tabs */}
                    <div className="flex gap-4 mb-6 border-b border-[var(--border-color)]">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`pb-3 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${
                                activeTab === 'pending'
                                    ? 'border-indigo-500 text-indigo-500'
                                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                            }`}
                        >
                            <FiClock /> Pending Tasks ({pendingAssignments.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`pb-3 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${
                                activeTab === 'history'
                                    ? 'border-indigo-500 text-indigo-500'
                                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                            }`}
                        >
                            <FiCheckCircle /> Submission History ({submissions.length})
                        </button>
                    </div>

                    {/* Tab 1: Pending Assignments */}
                    {activeTab === 'pending' && (
                        <div className="grid gap-6">
                            {pendingAssignments.length > 0 ? (
                                pendingAssignments.map((asg) => {
                                    const dueDate = new Date(asg.dueDate);
                                    const isOverdue = dueDate.getTime() < new Date().setHours(0, 0, 0, 0);

                                    return (
                                        <div 
                                            key={asg._id} 
                                            className="bg-[var(--card-bg)] text-[var(--text-main)] p-6 rounded-3xl border border-[var(--border-color)] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition-shadow relative overflow-hidden"
                                        >
                                            <div className="absolute left-0 top-0 h-full w-2 bg-indigo-500"></div>
                                            
                                            <div className="flex-1 space-y-3 pl-3">
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                        {asg.className} - {asg.section}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-lg text-[var(--text-main)]">{asg.title}</h3>
                                                <p className="text-sm text-[var(--text-muted)] leading-relaxed line-clamp-3">
                                                    {asg.instructions}
                                                </p>
                                                
                                                <div className="flex flex-wrap gap-4 text-xs font-semibold">
                                                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${
                                                        isOverdue ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                    }`}>
                                                        <FiCalendar /> Due: {dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => setSelectedAsg(asg)}
                                                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-md shrink-0 flex items-center gap-2 self-start md:self-center"
                                            >
                                                Submit Assignment <FiSend />
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-20 bg-[var(--card-bg)] text-[var(--text-main)] rounded-3xl border border-dashed border-[var(--border-color)]">
                                    <FiCheckCircle className="mx-auto text-emerald-500 mb-4 animate-bounce" size={48} />
                                    <p className="text-[var(--text-main)] font-black text-lg">All Caught Up! 🎉</p>
                                    <p className="text-slate-400 text-xs mt-1">There are no pending assignments remaining for your class.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 2: Submission History */}
                    {activeTab === 'history' && (
                        <div className="bg-[var(--card-bg)] text-[var(--text-main)] rounded-3xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-[var(--input-bg)] text-[var(--text-muted)] text-xs font-bold uppercase">
                                        <tr>
                                            <th className="px-6 py-4">Assignment</th>
                                            <th className="px-6 py-4">Submitted On</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Grade / Marks</th>
                                            <th className="px-6 py-4">Submission Link</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-color)]">
                                        {submissions.length > 0 ? (
                                            submissions.map((sub) => {
                                                const asgDetails = typeof sub.assignment === 'object' ? sub.assignment : null;
                                                const submitDate = new Date(sub.submittedAt);
                                                
                                                return (
                                                    <tr key={sub._id} className="hover:bg-[var(--input-bg)] transition-colors">
                                                        <td className="px-6 py-4 max-w-xs">
                                                            <div className="font-bold text-sm text-[var(--text-main)] truncate">
                                                                {asgDetails?.title || "Class Assignment"}
                                                            </div>
                                                            <div className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">
                                                                {asgDetails?.instructions || "No instructions loaded"}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-medium text-[var(--text-muted)]">
                                                            {submitDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            <span className="block text-[10px] text-[var(--text-muted)] font-normal">
                                                                {submitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                                                sub.status === 'Graded'
                                                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                                    : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                                                            }`}>
                                                                <FiCheckSquare size={12} /> {sub.status || 'Submitted'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {sub.status === 'Graded' ? (
                                                                <span className="text-base font-black text-indigo-600 flex items-center gap-1">
                                                                    <FiAward className="text-amber-500" /> {sub.marks} / 100
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-[var(--text-muted)] font-medium">Pending Grade</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <a 
                                                                href={sub.fileUrl} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors"
                                                            >
                                                                View Link <FiExternalLink size={12} />
                                                            </a>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-10 text-center text-[var(--text-muted)] font-medium">
                                                    No submission records found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SUBMISSION MODAL */}
                    {selectedAsg && (
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                            <div className="bg-[var(--card-bg)] text-[var(--text-main)] w-full max-w-lg rounded-[32px] p-8 shadow-2xl border border-[var(--border-color)]">
                                <div className="mb-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-black text-[var(--text-main)] leading-tight">
                                            {selectedAsg.title}
                                        </h3>
                                        <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                            Submission
                                        </span>
                                    </div>
                        
                                    <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 mb-4">
                                        <p className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-1">Teacher's Instructions</p>
                                        <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                                            {selectedAsg.instructions || "No specific instructions provided."}
                                        </p>
                                    </div>
                                </div>
                                
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-[var(--text-muted)] ml-1">Your Answer Description</label>
                                        <textarea 
                                            required
                                            className="w-full p-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl h-32 focus:ring-2 ring-indigo-500/20 outline-none text-sm"
                                            placeholder="Write your explanation or notes..."
                                            value={formData.answer}
                                            onChange={(e) => setFormData({...formData, answer: e.target.value})}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase text-[var(--text-muted)] ml-1">Work File Link (Google Drive / GitHub)</label>
                                        <div className="relative">
                                            <FiLink className="absolute left-4 top-4 text-slate-400" />
                                            <input 
                                                required
                                                type="url"
                                                className="w-full p-4 pl-12 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl focus:ring-2 ring-indigo-500/20 outline-none text-sm"
                                                placeholder="https://drive.google.com/..."
                                                value={formData.fileUrl}
                                                onChange={(e) => setFormData({...formData, fileUrl: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button 
                                            type="button" 
                                            onClick={() => setSelectedAsg(null)} 
                                            className="flex-1 py-3 bg-[var(--input-bg)] hover:bg-[var(--border-color)] rounded-xl font-bold transition-colors text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            disabled={submitting} 
                                            type="submit" 
                                            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-md text-sm"
                                        >
                                            {submitting ? "Submitting..." : "Submit Assignment"} <FiSend />
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