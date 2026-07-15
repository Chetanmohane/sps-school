import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { FiSearch, FiBook, FiClock, FiMapPin, FiInbox, FiLayers } from 'react-icons/fi';
import API from "../../api/axios"; 

const TeacherMyClasses = () => {
    const [search, setSearch] = useState("");
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const email = localStorage.getItem('userEmail');

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const response = await API.get(`/api/teacher/my-classes/${email}`);
            setClasses(response.data.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching classes:", err);
            setError("Error while fetching classes");
        } finally {
            setLoading(false);
        }
    };

    const filtered = classes.filter((c) =>
        c.className?.toLowerCase().includes(search.toLowerCase()) ||
        c.subjects?.some(sub => sub.name.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <Navbar />

                <div className="p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--text-main)]">My Class Schedule</h1>
                            <p className="text-[var(--text-muted)] text-sm">View class time-table</p>
                        </div>

                        <div className="relative group">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search class or subject..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-11 pr-4 py-3 bg-[var(--card-bg)] text-[var(--text-main)] border border-[var(--border-color)] rounded-2xl w-full md:w-80 outline-none focus:ring-2 ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2">
                            <FiInbox /> {error}
                        </div>
                    )}

                    {/* TABLE CONTAINER */}
                    <div className="bg-[var(--card-bg)] text-[var(--text-main)] rounded-[32px] shadow-sm border border-[var(--border-color)] overflow-hidden">
                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="py-20 text-center flex flex-col items-center gap-3">
                                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-[var(--text-muted)] font-medium">Loading your schedule...</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[var(--input-bg)]/50 text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">
                                            <th className="px-8 py-5">Class & Section</th>
                                            <th className="px-8 py-5">Subjects Handled</th>
                                            <th className="px-8 py-5">Time & Room</th>
                                            <th className="px-8 py-5">Students</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filtered.length > 0 ? (
                                            filtered.map((c, i) => (
                                                <tr key={i} className="hover:bg-[var(--input-bg)]/50 transition-colors group">
                                                    {/* 1. ClassName & Section */}
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                                <FiLayers size={18} />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-[var(--text-main)]">{c.className}</div>
                                                                <div className="text-xs text-slate-400 font-medium">Section {c.section}</div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* 2. Subjects.name & Subjects.code */}
                                                    <td className="px-8 py-5">
                                                        <div className="flex flex-col gap-1.5">
                                                            {c.subjects?.map((sub, idx) => (
                                                                <div key={idx} className="flex items-center gap-2">
                                                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                                                        {sub.code}
                                                                    </span>
                                                                    <span className="text-sm text-[var(--text-muted)] font-medium">{sub.name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>

                                                    {/* 3. StartTime, EndTime & Room */}
                                                    <td className="px-8 py-5 text-[var(--text-muted)]">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2 text-sm font-semibold">
                                                                <FiClock className="text-blue-500" />
                                                                {c.startTime} - {c.endTime}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                                <FiMapPin /> Room: {c.room || 'N/A'}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* 4. Occupancy / Capacity */}
                                                    <td className="px-8 py-5">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="text-xs font-bold text-[var(--text-main)]">{c.capacity}</div>
                                                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div 
                                                                    className={`h-full ${ (c.capacity) > 0.5 ? 'bg-orange-400' : 'bg-blue-500'}`} 
                                                                    style={{ width: `${(c.capacity) * 100}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic font-medium">
                                                    No classes found for you.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TeacherMyClasses;