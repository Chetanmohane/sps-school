import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { FiBookOpen, FiCalendar, FiClock, FiAlertCircle, FiLoader } from 'react-icons/fi';
import API from '../../api/axios';

const StudentExams = () => {
  const [exams, setExams] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExamsAndProfile = async () => {
      try {
        const userEmail = localStorage.getItem('userEmail');
        
        // Fetch Profile to know the class
        const profileRes = await API.get(`/api/student/profile/${userEmail}`);
        setStudentProfile(profileRes.data);
        const studentClass = profileRes.data.className;

        // Fetch all exams
        const examsRes = await API.get('/api/exams');
        const allExams = examsRes.data.exams || [];

        // Filter exams for student's class (case-insensitive trim matching)
        const classExams = allExams.filter(exam => 
          exam.className && studentClass && 
          exam.className.trim().toLowerCase() === studentClass.trim().toLowerCase()
        );

        // Sort by date (nearest first)
        classExams.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setExams(classExams);

      } catch (err) {
        console.error("Error loading exams:", err);
        setError("Failed to load exam schedules.");
      } finally {
        setLoading(false);
      }
    };

    fetchExamsAndProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--input-bg)]">
        <FiLoader className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="p-8 bg-[var(--input-bg)] min-h-screen">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-2">
                <FiBookOpen className="text-blue-500" /> Exam Schedule
              </h1>
              <p className="text-[var(--text-muted)] text-sm">
                View your upcoming tests, mid-terms, and terminal examinations.
              </p>
            </div>
            {studentProfile && (
              <div className="bg-[var(--card-bg)] text-[var(--text-main)] px-4 py-2.5 rounded-xl border border-[var(--border-color)] shadow-sm flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                <span className="font-bold text-sm">
                  {studentProfile.className} — Section {studentProfile.section}
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100">
              <FiAlertCircle /> {error}
            </div>
          )}

          <div className="grid gap-6">
            {exams.length > 0 ? (
              exams.map((exam) => {
                const examDate = new Date(exam.date);
                const isUpcoming = examDate.getTime() >= new Date().setHours(0,0,0,0);

                return (
                  <div 
                    key={exam._id} 
                    className={`bg-[var(--card-bg)] text-[var(--text-main)] p-6 rounded-3xl border border-[var(--border-color)] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow relative overflow-hidden`}
                  >
                    <div className="absolute top-0 left-0 w-2.5 h-full bg-blue-500"></div>
                    <div className="pl-3 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                          {exam.subject}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          isUpcoming ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {isUpcoming ? 'Upcoming' : 'Completed'}
                        </span>
                      </div>
                      <h3 className="font-black text-lg text-[var(--text-main)] mb-1">
                        {exam.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)] mt-2">
                        <span className="flex items-center gap-1.5 font-medium">
                          <FiCalendar className="text-blue-500" /> {examDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <FiClock className="text-indigo-500" /> {exam.startTime || '10:00 AM'} - {exam.endTime || '01:00 PM'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[var(--input-bg)] text-xs font-bold border border-[var(--border-color)]">
                          🏫 Venue: {exam.roomNumber || 'Hall-1'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-start md:items-end justify-center pl-3 md:pl-0">
                      <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Max Score</span>
                      <span className="text-lg font-black text-blue-600">{exam.maxMarks || 100} Marks</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 bg-[var(--card-bg)] text-[var(--text-main)] rounded-3xl border border-dashed border-[var(--border-color)]">
                <FiBookOpen size={48} className="mx-auto text-slate-300 mb-4 animate-bounce" />
                <p className="text-slate-400 font-bold">No exam scheduled for {studentProfile?.className || "your class"} 🎉</p>
                <p className="text-slate-400 text-xs mt-1">Keep studying! We'll notify you when exams are scheduled.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentExams;
