import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import AcademicTabs from '../../components/AcademicTabs';
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

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const todayName = () => {
    const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = names[new Date().getDay()];
    return today === 'Sunday' ? 'Monday' : today;
};

const TeacherMyClasses = () => {
    const [search, setSearch] = useState("");
    const [selectedDay, setSelectedDay] = useState<string>(todayName());
    const [allTimetables, setAllTimetables] = useState<any[]>([]);
    const [teacherSchedule, setTeacherSchedule] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const email = localStorage.getItem('userEmail') || '';
    const userRole = (localStorage.getItem('role') || '').toLowerCase();
    const isAdminUser = ['super-admin', 'manager-admin', 'academic-admin', 'teacher-admin', 'student-admin', 'manager'].some(r => userRole.includes(r));

    useEffect(() => {
        fetchTimetables();
    }, [email]);

    const fetchTimetables = async () => {
        try {
            setLoading(true);
            const [ttRes, schedRes] = await Promise.all([
                API.get('/api/timetable').catch(() => null),
                email ? API.get(`/api/timetable/teacher-schedule?email=${encodeURIComponent(email)}`).catch(() => null) : Promise.resolve(null)
            ]);

            if (ttRes?.data?.data) {
                setAllTimetables(ttRes.data.data || []);
            }

            if (schedRes?.data?.data) {
                setTeacherSchedule(schedRes.data.data || []);
            }
        } catch (err) {
            console.error("Error loading timetable data:", err);
        } finally {
            setLoading(false);
        }
    };

    // Extract period items for the selected day
    const getPeriodsForDay = () => {
        const periodList: any[] = [];

        // 1. If teacher schedule returned period items for selectedDay
        const matchingTeacherPeriods = teacherSchedule.filter(s => s.dayOfWeek === selectedDay);

        if (matchingTeacherPeriods.length > 0 && !isAdminUser) {
            matchingTeacherPeriods.forEach(p => {
                periodList.push({
                    period: p.period || '1',
                    className: p.className,
                    section: p.section,
                    subject: p.subject,
                    startTime: p.startTime,
                    endTime: p.endTime,
                    room: p.room,
                    teacher: p.teacher || 'Assigned Faculty',
                    isBreak: p.isBreak
                });
            });
        } else {
            // 2. Otherwise get periods from all Timetable documents matching selectedDay
            const dayTTs = allTimetables.filter(t => t.dayOfWeek === selectedDay);
            dayTTs.forEach(tt => {
                (tt.periods || []).forEach((p: any) => {
                    if (!p.isBreak) {
                        periodList.push({
                            period: p.period || '1',
                            className: tt.className,
                            section: tt.section,
                            subject: p.subject || 'General',
                            startTime: p.startTime,
                            endTime: p.endTime,
                            room: p.room || 'Main Block',
                            teacher: p.teacher || 'Faculty Teacher',
                            isBreak: p.isBreak
                        });
                    }
                });
            });
        }

        // Sort by startTime / period number
        periodList.sort((a, b) => {
            const tA = a.startTime || '';
            const tB = b.startTime || '';
            return tA.localeCompare(tB);
        });

        return periodList;
    };

    const dayPeriods = getPeriodsForDay();

    const filteredPeriods = dayPeriods.filter(p =>
        (p.className || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.section || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.subject || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.teacher || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.room || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <Navbar />

                <div className="p-3 sm:p-6 max-w-[1400px] mx-auto overflow-x-hidden w-full">
                    {isAdminUser && <AcademicTabs />}

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                                    📚 Period-Wise Faculty Timetable
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-main)]">My Teaching Schedule &amp; Classes</h1>
                            <p className="text-[var(--text-muted)] text-xs sm:text-sm">Real-time period timings, classroom locations, assigned subjects, and synchronized student schedule.</p>
                        </div>

                        <div className="relative group w-full md:w-auto">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search class, subject, or period..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-11 pr-4 py-2.5 bg-[var(--card-bg)] text-[var(--text-main)] border border-[var(--border-color)] rounded-2xl w-full md:w-72 outline-none focus:ring-2 ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-xs"
                            />
                        </div>
                    </div>

                    {/* DAY SELECTOR TABS */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none max-w-full">
                        {DAYS.map((day) => {
                            const isSelected = selectedDay === day;
                            const isToday = todayName() === day;
                            return (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDay(day)}
                                    className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                                        isSelected
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                            : 'bg-[var(--card-bg)] text-[var(--text-main)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)]'
                                    }`}
                                >
                                    <span>{day}</span>
                                    {isToday && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isSelected ? 'bg-white text-blue-600' : 'bg-emerald-500 text-white'}`}>
                                            TODAY
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* STATS OVERVIEW CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-4 sm:p-5 rounded-2xl flex items-center gap-4 shadow-sm">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-extrabold text-lg sm:text-xl shrink-0">
                                🏫
                            </div>
                            <div>
                                <div className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Scheduled Periods ({selectedDay})</div>
                                <div className="text-xl sm:text-2xl font-extrabold text-[var(--text-main)]">{dayPeriods.length} Periods</div>
                            </div>
                        </div>
                        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-4 sm:p-5 rounded-2xl flex items-center gap-4 shadow-sm">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-extrabold text-lg sm:text-xl shrink-0">
                                📖
                            </div>
                            <div>
                                <div className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Selected Day View</div>
                                <div className="text-xs sm:text-sm font-extrabold text-purple-600">
                                    {selectedDay} Period Schedule
                                </div>
                            </div>
                        </div>
                        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-4 sm:p-5 rounded-2xl flex items-center gap-4 shadow-sm">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-extrabold text-lg sm:text-xl shrink-0">
                                ⏰
                            </div>
                            <div>
                                <div className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Timetable Status</div>
                                <div className="text-xs sm:text-sm font-extrabold text-emerald-600 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Synchronized with Student View
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TABLE CONTAINER */}
                    <div className="bg-[var(--card-bg)] text-[var(--text-main)] rounded-2xl shadow-sm border border-[var(--border-color)] overflow-hidden max-w-full">
                        <div className="p-3 sm:p-4 bg-[var(--input-bg)] border-b border-[var(--border-color)] flex justify-between items-center flex-wrap gap-2">
                            <h2 className="font-extrabold text-xs sm:text-sm text-[var(--text-main)] flex items-center gap-2">
                                📅 Period-Wise Schedule — {selectedDay} ({filteredPeriods.length} Periods)
                            </h2>
                            <span className="text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-200">
                                🟢 Official Period Timetable
                            </span>
                        </div>

                        <div className="overflow-x-auto w-full max-w-full">
                            {loading ? (
                                <div className="py-20 text-center flex flex-col items-center gap-3">
                                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-[var(--text-muted)] font-medium">Loading period timetable...</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse min-w-[650px]">
                                    <thead>
                                        <tr className="bg-[var(--primary-bg)] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">
                                            <th className="px-6 py-4">Period No. & Class</th>
                                            <th className="px-6 py-4">Subject Name</th>
                                            <th className="px-6 py-4">Exact Period Timing</th>
                                            <th className="px-6 py-4">Assigned Teacher</th>
                                            <th className="px-6 py-4">Room & Location</th>
                                            <th className="px-6 py-4 text-right">Quick Period Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-color)]">
                                        {filteredPeriods.length > 0 ? (
                                            filteredPeriods.map((p, i) => (
                                                <tr key={i} className="hover:bg-[var(--primary-bg)]/40 transition-colors group">
                                                    {/* 1. Period & Class */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-black text-xs border border-indigo-500/20 shrink-0">
                                                                P{p.period}
                                                            </div>
                                                            <div>
                                                                <div className="font-extrabold text-[var(--text-main)] text-base flex items-center gap-2">
                                                                    Class {p.className}-{p.section}
                                                                </div>
                                                                <div className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
                                                                    Official Student Period
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* 2. Subject Name */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <FiBookOpen className="text-indigo-500" />
                                                            <span className="text-sm text-[var(--text-main)] font-black">{p.subject}</span>
                                                        </div>
                                                    </td>

                                                    {/* 3. Exact Period Timing */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 text-xs font-black text-[var(--text-main)] bg-[var(--input-bg)] px-3 py-1.5 rounded-xl border border-[var(--border-color)] w-fit">
                                                            <FiClock className="text-blue-500" />
                                                            {p.startTime} – {p.endTime}
                                                        </div>
                                                    </td>

                                                    {/* 4. Teacher Name */}
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-extrabold text-[var(--text-main)] bg-purple-50 dark:bg-purple-950/30 text-purple-600 border border-purple-200 px-2.5 py-1 rounded-lg">
                                                            🧑‍🏫 {p.teacher}
                                                        </span>
                                                    </td>

                                                    {/* 5. Room & Location */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)]">
                                                            <FiMapPin className="text-rose-500" /> {p.room || 'Academic Block'}
                                                        </div>
                                                    </td>

                                                    {/* 6. Quick Actions */}
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <a 
                                                                href="/teacher/attendanceMark" 
                                                                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl transition-all border border-emerald-200"
                                                            >
                                                                ✅ Attendance
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
                                                <td colSpan={6} className="px-8 py-16 text-center text-[var(--text-muted)] font-medium">
                                                    <div className="max-w-md mx-auto space-y-3">
                                                        <div className="text-3xl">🗓️</div>
                                                        <p className="font-extrabold text-sm text-[var(--text-main)]">No period-wise timetable set for {selectedDay} yet.</p>
                                                        <p className="text-xs text-[var(--text-muted)]">Official period timetable configured by Manager Admin & Super Admin will appear here.</p>
                                                    </div>
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