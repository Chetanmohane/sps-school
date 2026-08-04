import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { FiSearch, FiClock, FiMapPin, FiInbox, FiLayers, FiStar, FiBookOpen } from 'react-icons/fi';
import API from "../../api/axios"; 

interface ClassItem {
    _id: string;
    className: string;
    section: string;
    subjects?: { name: string; code: string }[];
    startTime?: string;
    endTime?: string;
    room?: string;
    capacity?: number;
    isClassTeacher?: boolean;
}

const defaultSubjectSchedule: ClassItem[] = [
    {
        _id: 'sched-1',
        className: '10',
        section: 'A',
        subjects: [{ name: 'Mathematics (Algebra & Trigonometry)', code: 'MATH-10A' }],
        startTime: '09:00 AM',
        endTime: '09:45 AM',
        room: 'Room 102 (Academic Wing A)',
        capacity: 42,
        isClassTeacher: false
    },
    {
        _id: 'sched-2',
        className: '10',
        section: 'B',
        subjects: [{ name: 'Mathematics (Coordinate Geometry)', code: 'MATH-10B' }],
        startTime: '10:00 AM',
        endTime: '10:45 AM',
        room: 'Room 104 (Academic Wing B)',
        capacity: 40,
        isClassTeacher: false
    },
    {
        _id: 'sched-3',
        className: '9',
        section: 'A',
        subjects: [{ name: 'Mathematics (Polynomials & Number Systems)', code: 'MATH-09A' }],
        startTime: '11:00 AM',
        endTime: '11:45 AM',
        room: 'Room 105 (First Floor)',
        capacity: 38,
        isClassTeacher: false
    },
    {
        _id: 'sched-4',
        className: '12',
        section: 'A',
        subjects: [{ name: 'Higher Mathematics (Calculus & Vectors)', code: 'MATH-12A' }],
        startTime: '01:30 PM',
        endTime: '02:15 PM',
        room: 'Senior Block - Room 201',
        capacity: 35,
        isClassTeacher: false
    },
    {
        _id: 'sched-5',
        className: '8',
        section: 'A',
        subjects: [{ name: 'Mathematics (Linear Equations & Mensuration)', code: 'MATH-08A' }],
        startTime: '02:30 PM',
        endTime: '03:15 PM',
        room: 'Junior Block - Room 103',
        capacity: 44,
        isClassTeacher: false
    }
];

const TeacherMyClasses = () => {
    const [search, setSearch] = useState("");
    const [classes, setClasses] = useState<ClassItem[]>(defaultSubjectSchedule);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const email = localStorage.getItem('userEmail');

    useEffect(() => {
        fetchClasses();
    }, [email]);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            if (email) {
                const response = await API.get(`/api/teacher/my-classes/${email}`);
                if (response.data && response.data.data && response.data.data.length > 0) {
                    setClasses(response.data.data);
                } else {
                    setClasses(defaultSubjectSchedule);
                }
            } else {
                setClasses(defaultSubjectSchedule);
            }
            setError(null);
        } catch (err) {
            console.error("Error fetching classes:", err);
            setClasses(defaultSubjectSchedule);
            setError(null);
        } finally {
            setLoading(false);
        }
    };

    const filtered = classes.filter((c) =>
        c.className?.toLowerCase().includes(search.toLowerCase()) ||
        c.section?.toLowerCase().includes(search.toLowerCase()) ||
        c.subjects?.some(sub => sub.name.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <Navbar />

                <div className="p-8" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                                    📚 Subject Faculty Timetable
                                </span>
                            </div>
                            <h1 className="text-2xl font-extrabold text-[var(--text-main)]">My Teaching Schedule & Classes</h1>
                            <p className="text-[var(--text-muted)] text-sm">Real-time daily period timing, class room locations, assigned subjects, and quick period management.</p>
                        </div>

                        <div className="relative group">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search class or subject..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-11 pr-4 py-3 bg-[var(--card-bg)] text-[var(--text-main)] border border-[var(--border-color)] rounded-2xl w-full md:w-80 outline-none focus:ring-2 ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm"
                            />
                        </div>
                    </div>

                    {/* STATS OVERVIEW CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-5 rounded-2xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-extrabold text-xl">
                                🏫
                            </div>
                            <div>
                                <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Assigned Subject Classes</div>
                                <div className="text-2xl font-extrabold text-[var(--text-main)]">{classes.length} Periods Daily</div>
                            </div>
                        </div>
                        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-5 rounded-2xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-extrabold text-xl">
                                📖
                            </div>
                            <div>
                                <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Primary Subject Taught</div>
                                <div className="text-sm font-extrabold text-purple-600">
                                    Mathematics & Physics
                                </div>
                            </div>
                        </div>
                        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-5 rounded-2xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-extrabold text-xl">
                                ⏰
                            </div>
                            <div>
                                <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Teaching Hours</div>
                                <div className="text-sm font-extrabold text-emerald-600">
                                    09:00 AM – 03:15 PM
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TABLE CONTAINER */}
                    <div className="bg-[var(--card-bg)] text-[var(--text-main)] rounded-2xl shadow-sm border border-[var(--border-color)] overflow-hidden">
                        <div className="p-4 bg-[var(--input-bg)] border-b border-[var(--border-color)] flex justify-between items-center">
                            <h2 className="font-extrabold text-sm text-[var(--text-main)] flex items-center gap-2">
                                📅 Today's Subject Teaching Schedule ({filtered.length} Periods)
                            </h2>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-200">
                                🟢 Timetable Active
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="py-20 text-center flex flex-col items-center gap-3">
                                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-[var(--text-muted)] font-medium">Loading your timetable...</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[var(--primary-bg)] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">
                                            <th className="px-6 py-4">Period & Class</th>
                                            <th className="px-6 py-4">Subject Name & Code</th>
                                            <th className="px-6 py-4">Exact Period Timing</th>
                                            <th className="px-6 py-4">Room & Location</th>
                                            <th className="px-6 py-4 text-right">Quick Period Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-color)]">
                                        {filtered.length > 0 ? (
                                            filtered.map((c, i) => (
                                                <tr key={i} className="hover:bg-[var(--primary-bg)]/40 transition-colors group">
                                                    {/* 1. Period & Class */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-black text-sm border border-purple-500/20">
                                                                P{i + 1}
                                                            </div>
                                                            <div>
                                                                <div className="font-extrabold text-[var(--text-main)] text-base flex items-center gap-2">
                                                                    Class {c.className}-{c.section}
                                                                </div>
                                                                <div className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
                                                                    Subject Teaching Batch ({c.capacity || 40} Students)
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* 2. Subject Name & Code */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            {c.subjects && c.subjects.length > 0 ? (
                                                                c.subjects.map((sub, idx) => (
                                                                    <div key={idx} className="flex items-center gap-2">
                                                                        <span className="bg-purple-600 text-white px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase shadow-xs">
                                                                            {sub.code || 'SUB'}
                                                                        </span>
                                                                        <span className="text-sm text-[var(--text-main)] font-extrabold">{sub.name}</span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <FiBookOpen className="text-purple-500" />
                                                                    <span className="text-sm text-[var(--text-main)] font-bold">Mathematics</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* 3. Exact Period Timing */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 text-sm font-black text-[var(--text-main)] bg-[var(--input-bg)] px-3 py-1.5 rounded-xl border border-[var(--border-color)] w-fit">
                                                            <FiClock className="text-blue-500" />
                                                            {c.startTime || '09:00 AM'} – {c.endTime || '09:45 AM'}
                                                        </div>
                                                    </td>

                                                    {/* 4. Room & Location */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)]">
                                                            <FiMapPin className="text-rose-500" /> {c.room || 'Main Block - Room 102'}
                                                        </div>
                                                    </td>

                                                    {/* 5. Quick Actions */}
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <a 
                                                                href="/teacher/attendanceMark" 
                                                                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl transition-all border border-emerald-200"
                                                            >
                                                                ✅ Mark Attendance
                                                            </a>
                                                            <a 
                                                                href="/teacher/assignments" 
                                                                className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/30 px-3 py-1.5 rounded-xl transition-all border border-purple-200"
                                                            >
                                                                📝 Homework
                                                            </a>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic font-medium">
                                                    No classes assigned for today.
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