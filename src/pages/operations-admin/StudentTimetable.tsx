import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import API from '../../api/axios';
import {
  FiCalendar, FiClock, FiMapPin, FiUser, FiLoader,
  FiAlertCircle, FiBookOpen, FiSun
} from 'react-icons/fi';

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SUBJECT_COLORS: Record<string, string> = {
  'Mathematics':            'bg-blue-50 border-blue-300 text-blue-800',
  'Science & Technology':  'bg-green-50 border-green-300 text-green-800',
  'English Literature':    'bg-purple-50 border-purple-300 text-purple-800',
  'Hindi':                 'bg-orange-50 border-orange-300 text-orange-800',
  'Social Studies':        'bg-amber-50 border-amber-300 text-amber-800',
  'Physics':               'bg-cyan-50 border-cyan-300 text-cyan-800',
  'Chemistry':             'bg-rose-50 border-rose-300 text-rose-800',
  'Biology':               'bg-emerald-50 border-emerald-300 text-emerald-800',
  'Computer Science':      'bg-indigo-50 border-indigo-300 text-indigo-800',
  'Physical Education':    'bg-lime-50 border-lime-300 text-lime-800',
  'Arts & Craft':          'bg-pink-50 border-pink-300 text-pink-800',
  'Music':                 'bg-violet-50 border-violet-300 text-violet-800',
};
const DEFAULT_COLOR = 'bg-slate-50 border-slate-300 text-slate-700';

const getSubjectColor = (subject: string) =>
  SUBJECT_COLORS[subject] || DEFAULT_COLOR;

const todayName = () => {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return names[new Date().getDay()];
};

const StudentTimetable = () => {
  const [timetables, setTimetables] = useState<any[]>([]);
  const [classInfo, setClassInfo] = useState<{ className: string; section: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>(todayName());

  const email = localStorage.getItem('userEmail') || '';
  const role = localStorage.getItem('role') || 'student';

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/api/timetable/my-timetable?email=${encodeURIComponent(email)}&role=${role}`);
        if (res.data.success) {
          setTimetables(res.data.data || []);
          setClassInfo(res.data.classInfo || null);
          // default to today if timetable exists for today, else Monday
          const today = todayName();
          const hasToday = (res.data.data || []).some((t: any) => t.dayOfWeek === today);
          setSelectedDay(hasToday ? today : 'Monday');
        }
      } catch (err: any) {
        setError('Could not load timetable. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    if (email) fetchTimetable();
  }, [email, role]);

  const activeDayTimetable = timetables.find(t => t.dayOfWeek === selectedDay);
  const today = todayName();

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Navbar />
          <div className="flex h-[70vh] items-center justify-center">
            <FiLoader className="animate-spin text-indigo-500" size={40} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="p-6 lg:p-8 min-h-screen bg-[var(--bg-color)] text-[var(--text-main)]">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-black flex items-center gap-2">
                <FiCalendar className="text-indigo-500" /> My Class Timetable
              </h1>
              <p className="text-[var(--text-muted)] text-sm mt-1">
                {classInfo
                  ? <span>Showing schedule for <span className="font-bold text-indigo-600">Class {classInfo.className} — Section {classInfo.section}</span></span>
                  : 'Your weekly class schedule'}
              </p>
            </div>
            {classInfo && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl text-sm font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Class {classInfo.className}
                </span>
                <span className="px-3 py-1.5 rounded-xl text-sm font-black bg-violet-50 text-violet-700 border border-violet-200">
                  Section {classInfo.section}
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl mb-6 flex items-center gap-2">
              <FiAlertCircle /> {error}
            </div>
          )}

          {timetables.length === 0 ? (
            <div className="text-center py-24 bg-[var(--card-bg)] rounded-3xl border border-dashed border-[var(--border-color)]">
              <FiCalendar className="mx-auto text-slate-300 mb-4" size={52} />
              <p className="font-black text-lg text-[var(--text-main)]">No Timetable Set</p>
              <p className="text-slate-400 text-sm mt-1">
                The timetable for your class hasn't been set up yet. Please contact your class teacher.
              </p>
            </div>
          ) : (
            <>
              {/* Day Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {DAYS_ORDER.map(day => {
                  const hasData = timetables.some(t => t.dayOfWeek === day);
                  const isToday = day === today;
                  const isSelected = day === selectedDay;
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : isToday
                          ? 'bg-amber-50 text-amber-700 border-amber-300 hover:border-amber-500'
                          : hasData
                          ? 'bg-[var(--card-bg)] text-[var(--text-main)] border-[var(--border-color)] hover:border-indigo-400'
                          : 'bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--border-color)] opacity-50'
                      }`}
                    >
                      {isToday && !isSelected && <FiSun className="inline mr-1 text-amber-500" size={12} />}
                      {day.slice(0, 3)}
                      {isToday && (
                        <span className="ml-1 text-[9px] font-black uppercase">Today</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Timetable grid for selected day */}
              {activeDayTimetable ? (
                <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                  {/* Day header */}
                  <div className={`px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between ${
                    selectedDay === today ? 'bg-amber-50' : 'bg-[var(--input-bg)]'
                  }`}>
                    <h2 className="font-black text-lg flex items-center gap-2">
                      {selectedDay === today && <FiSun className="text-amber-500" />}
                      {selectedDay}
                      {selectedDay === today && (
                        <span className="text-xs font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                          Today
                        </span>
                      )}
                    </h2>
                    <span className="text-xs text-[var(--text-muted)] font-medium">
                      {activeDayTimetable.periods.length} period{activeDayTimetable.periods.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="p-4 grid gap-3">
                    {activeDayTimetable.periods.map((period: any, i: number) => {
                      if (period.isBreak) {
                        return (
                          <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                              ☕
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-amber-800 text-sm">Recess / Break</p>
                              <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                                <FiClock size={10} />
                                {period.startTime} — {period.endTime}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200">
                              {period.room}
                            </span>
                          </div>
                        );
                      }

                      const colorClass = getSubjectColor(period.subject);
                      return (
                        <div key={i} className={`flex items-center gap-4 px-4 py-4 rounded-2xl border ${colorClass} transition-all hover:shadow-sm`}>
                          {/* Period number */}
                          <div className="w-10 h-10 rounded-xl bg-white/60 border border-current/20 flex items-center justify-center font-black text-base flex-shrink-0">
                            {period.period}
                          </div>

                          {/* Subject info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-base truncate flex items-center gap-1.5">
                              <FiBookOpen size={13} />
                              {period.subject}
                            </p>
                            <div className="flex items-center gap-3 mt-1 flex-wrap text-xs font-medium opacity-80">
                              <span className="flex items-center gap-1">
                                <FiClock size={10} />
                                {period.startTime} — {period.endTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <FiUser size={10} />
                                {period.teacher}
                              </span>
                              <span className="flex items-center gap-1">
                                <FiMapPin size={10} />
                                {period.room}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-[var(--card-bg)] rounded-3xl border border-dashed border-[var(--border-color)]">
                  <FiCalendar className="mx-auto text-slate-300 mb-3" size={36} />
                  <p className="font-bold text-[var(--text-muted)]">No timetable set for {selectedDay}</p>
                  <p className="text-slate-400 text-xs mt-1">Contact your class teacher to set up this day's schedule.</p>
                </div>
              )}

              {/* Weekly Overview mini-cards */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {DAYS_ORDER.map(day => {
                  const tt = timetables.find(t => t.dayOfWeek === day);
                  const isToday = day === today;
                  return (
                    <button key={day} onClick={() => setSelectedDay(day)}
                      className={`p-3 rounded-2xl border text-left transition-all hover:shadow-md ${
                        day === selectedDay
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : isToday
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-main)]'
                      }`}
                    >
                      <p className="font-black text-xs uppercase">{day.slice(0, 3)}</p>
                      <p className={`text-[10px] mt-0.5 font-medium ${day === selectedDay ? 'text-indigo-200' : 'text-[var(--text-muted)]'}`}>
                        {tt ? `${tt.periods.length} periods` : 'Not set'}
                      </p>
                      {isToday && day !== selectedDay && (
                        <span className="text-[9px] font-black text-amber-600">TODAY</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentTimetable;
