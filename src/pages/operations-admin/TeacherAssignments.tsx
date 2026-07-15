import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import API from '../../api/axios';
import { FiPlus, FiBookOpen, FiCalendar, FiLoader, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const TeacherAssignments = () => {
    const [open, setOpen] = useState(false);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [viewSubModal, setViewSubModal] = useState(false);
    const [currentSubmissions, setCurrentSubmissions] = useState([]);
    
    const [form, setForm] = useState({title: "", className: "", section: "", dueDate: "", instructions: ""});

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        setFetching(true);
        try {
            const userEmail = localStorage.getItem('userEmail');
            const res = await API.get(`/api/assignment/all?email=${userEmail}`);
            setAssignments(res.data);
        } catch (err) {
            console.error("Error fetching assignments:", err);
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userEmail = localStorage.getItem('userEmail');
            await API.post('/api/assignment/create', { ...form, userEmail });
            
            setOpen(false);
            setForm({ title: "", className: "", section: "", dueDate: "", instructions: "" });
            fetchAssignments(); 
            alert("Assignment Created Successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to create assignment. Check backend connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleViewSubmissions = async (asgId) => {
      try {
        const res = await API.get('/api/assignment/submit', { params: { asgId: asgId } });
        setCurrentSubmissions(res.data);
        setViewSubModal(true);
      } catch (err) {
        alert("Error fetching submissions");
      }
    }; 

    const handleUpdateMarks = async (subId, newMarks) => {
      try {
        await API.put(`/api/assignment/update-marks/${subId}`, { marks: newMarks });
        alert("Marks updated successfully");
      } catch (err) {
        console.error("Failed to update marks", err);
        alert("Could not save marks. Try again.");
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
                            <h1 className="text-2xl font-bold text-[var(--text-main)]">Assignments</h1>
                            <p className="text-[var(--text-muted)] text-sm font-medium">Create and track homework for your classes.</p>
                        </div>
                        <button 
                            onClick={() => setOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                        >
                            <FiPlus /> Create Assignment
                        </button>
                    </div>

                    {/* ASSIGNMENTS TABLE */}
                    <div className="bg-[var(--card-bg)] text-[var(--text-main)] rounded-[32px] shadow-sm border border-[var(--border-color)] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[var(--input-bg)]/50 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">
                                        <th className="px-8 py-5">Assignment Details</th>
                                        <th className="px-8 py-5">Class & Section</th>
                                        <th className="px-8 py-5">Due Date</th>
                                        <th className="px-8 py-5 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {fetching ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center">
                                                <FiLoader className="animate-spin mx-auto text-blue-600 text-2xl" />
                                                <p className="mt-2 text-slate-400 font-medium">Loading assignments...</p>
                                            </td>
                                        </tr>
                                    ) : assignments.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center">
                                                <FiAlertCircle className="mx-auto text-slate-300 text-3xl mb-2" />
                                                <p className="text-slate-400 font-medium">No assignments created yet.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        assignments.map((asg) => (
                                            <tr key={asg._id} className="hover:bg-[var(--input-bg)]/30 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <p className="font-bold text-[var(--text-main)] text-base">{asg.title}</p>
                                                    <p className="text-xs text-slate-400 line-clamp-1">{asg.instructions}</p>
                                                </td>
                                                <td className="px-8 py-5 text-[var(--text-muted)] font-semibold">
                                                    <span className="bg-slate-100 px-2 py-1 rounded-lg text-[var(--text-main)]">{asg.className} - {asg.section}</span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm">
                                                        <FiCalendar className="text-blue-500" />
                                                        {new Date(asg.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase border border-green-100">
                                                        <FiCheckCircle /> Active
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <button onClick={() => handleViewSubmissions(asg._id)} className="text-blue-600 font-bold hover:underline text-sm">
                                                       View Submissions
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* CREATE MODAL */}
                    {open && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                            <div className="bg-[var(--card-bg)] text-[var(--text-main)] w-full max-w-md rounded-[40px] shadow-2xl p-10 animate-in zoom-in-95 duration-200">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                        <FiBookOpen size={24} />
                                    </div>
                                    <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight">New Assignment</h3>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Title</label>
                                        <input
                                            name="title"
                                            required
                                            value={form.title}
                                            placeholder="Assignment Title"
                                            onChange={handleChange}
                                            className="w-full p-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl focus:ring-4 ring-blue-500/10 focus:border-blue-500 focus:bg-[var(--card-bg)] text-[var(--text-main)] outline-none transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Class</label>
                                            <input
                                                name="className"
                                                required
                                                value={form.className}
                                                placeholder="e.g. 8th"
                                                onChange={handleChange}
                                                className="w-full p-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl focus:ring-4 ring-blue-500/10 focus:border-blue-500 focus:bg-[var(--card-bg)] text-[var(--text-main)] outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Section</label>
                                            <input
                                                name="section"
                                                required
                                                value={form.section}
                                                placeholder="e.g. A"
                                                onChange={handleChange}
                                                className="w-full p-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl focus:ring-4 ring-blue-500/10 focus:border-blue-500 focus:bg-[var(--card-bg)] text-[var(--text-main)] outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Due Date</label>
                                        <input
                                            type="date"
                                            name="dueDate"
                                            required
                                            value={form.dueDate}
                                            onChange={handleChange}
                                            className="w-full p-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl focus:ring-4 ring-blue-500/10 focus:border-blue-500 focus:bg-[var(--card-bg)] text-[var(--text-main)] outline-none transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Instructions</label>
                                        <textarea
                                            name="instructions"
                                            value={form.instructions}
                                            placeholder="Enter assignment details..."
                                            rows={3}
                                            onChange={handleChange}
                                            className="w-full p-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl focus:ring-4 ring-blue-500/10 focus:border-blue-500 focus:bg-[var(--card-bg)] text-[var(--text-main)] outline-none resize-none transition-all"
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button 
                                            type="button"
                                            onClick={() => setOpen(false)}
                                            className="flex-1 py-4 bg-slate-100 text-[var(--text-muted)] rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            {loading ? <FiLoader className="animate-spin" /> : "Create"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {viewSubModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                       <div className="bg-[var(--card-bg)] text-[var(--text-main)] w-full max-w-4xl rounded-[40px] shadow-2xl p-8 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                           <h3 className="text-2xl font-black text-[var(--text-main)]">Student Submissions</h3>
                           <button onClick={() => setViewSubModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">✕</button>
                        </div>

                        {currentSubmissions.length === 0 ? (
                           <p className="text-center py-10 text-slate-400 font-medium">No one has submitted yet.</p>
                        ) : (
                        <div className="space-y-4">
                        {currentSubmissions.map((sub) => (
                          <div key={sub._id} className="p-6 bg-[var(--input-bg)] rounded-3xl border border-[var(--border-color)] flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                                   {sub.student?.user?.name?.charAt(0)}
                                </div>
                                <div>
                                  <h4 className="font-bold text-[var(--text-main)] leading-none">{sub.student?.user?.name}</h4>
                                  <p className="text-[11px] text-slate-400 mt-1 tracking-wider font-bold">Roll Number: {sub.student?.rollNumber}</p>
                                  <p className="text-[11px] text-slate-400 mt-1 tracking-wider font-bold">{sub.student?.user?.email}</p>
                                </div>
                              </div>

                              <div className="bg-[var(--card-bg)] text-[var(--text-main)] p-4 rounded-2xl border border-[var(--border-color)] text-sm text-[var(--text-muted)] italic">
                                {sub.answer}
                              </div>
                              <div className='mt-2'>
                                 <a 
                                    href={sub.fileUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="w-fit bg-blue-100 text-blue-700 hover:bg-blue-200  px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
                                >
                                    View File
                                </a>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-3 ml-6">
                                <p className="text-xs text-green-500 mb-3 ml-12">Submitted on: {new Date(sub.submittedAt).toLocaleString()}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase text-slate-400">Marks:</span>
                                    <input 
                                        type="number" 
                                        defaultValue={sub.marks} 
                                        className="w-16 p-2 bg-[var(--card-bg)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg text-center font-bold"
                                        onKeyDown={(e) => {if (e.key === 'Enter') handleUpdateMarks(sub._id, (e.target as HTMLInputElement).value);}}
                                    />
                                </div>
                            </div>
                          </div>
                          ))}
                        </div>
                        )}
                      </div>
                    </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default TeacherAssignments;