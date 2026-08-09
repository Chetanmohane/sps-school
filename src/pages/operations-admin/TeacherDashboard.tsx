import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { useSharedState } from '../../hooks/useSharedState';
import API from '../../api/axios';
import {
  FiUsers, FiCheckSquare, FiFileText, FiArrowRight,
  FiActivity, FiTrendingUp, FiCalendar, FiBell, FiClock,
  FiAward, FiStar, FiSearch, FiPhone, FiMail, FiCheckCircle,
  FiXCircle, FiFilter, FiUserCheck, FiBookOpen, FiEye
} from 'react-icons/fi';

interface ClassInfo {
  _id: string;
  className: string;
  section: string;
  room?: string;
}

interface StudentItem {
  _id: string;
  user: {
    name: string;
    email: string;
    phone?: string;
  };
  className: string;
  section: string;
  rollNumber: string;
  parentName?: string;
  parentPhone?: string;
  attendancePct?: number;
}

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const teacherName = localStorage.getItem('userName') || 'Teacher';
  const teacherEmail = localStorage.getItem('userEmail') || '';

  // Active view tab: 'overview' | 'classTeacherZone' | 'myClasses'
  const [activeTab, setActiveTab] = useState<'overview' | 'classTeacherZone' | 'myClasses'>('overview');

  // Live shared attendance and student data
  const [attendanceRecords] = useSharedState('erp_attendance', []);
  const [students] = useSharedState('erp_students', []);

  // Class Teacher state from API
  const [profileData, setProfileData] = useState<any>(null);
  const [isClassTeacher, setIsClassTeacher] = useState<boolean>(false);
  const [classInCharge, setClassInCharge] = useState<ClassInfo | null>(null);
  const [classStudents, setClassStudents] = useState<StudentItem[]>([]);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(false);
  const [notices, setNotices] = useState<any[]>([]);
  const [newNotice, setNewNotice] = useState({ title: '', message: '', targetClass: '', targetSection: '' });
  const [publishing, setPublishing] = useState(false);
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [selectedStudentResults, setSelectedStudentResults] = useState<any>(null);
  const [resultsLoading, setResultsLoading] = useState<boolean>(false);

  // Today's live timetable for this teacher
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [timetableLoading, setTimetableLoading] = useState<boolean>(false);

  // Live clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch teacher profile and class teacher status
  useEffect(() => {
    if (teacherEmail) {
      fetchTeacherProfile();
      fetchClassStudents();
      fetchTeacherTodayTimetable();
      fetchNotices();
    }
  }, [teacherEmail]);

  useEffect(() => {
    if (selectedStudent && selectedStudent._id) {
      fetchStudentResults(selectedStudent._id);
    } else {
      setSelectedStudentResults(null);
    }
  }, [selectedStudent]);

  const fetchStudentResults = async (studentId: string) => {
    try {
      setResultsLoading(true);
      const res = await API.get(`/api/admin/student-admin/results/${studentId}`);
      if (res.data && (res.data.data || res.data.success)) {
        setSelectedStudentResults(res.data.data || {});
      } else {
        setSelectedStudentResults(null);
      }
    } catch (err) {
      console.error("Failed to fetch student results", err);
      setSelectedStudentResults(null);
    } finally {
      setResultsLoading(false);
    }
  };

  const fetchTeacherProfile = async () => {
    try {
      const res = await API.get(`/api/teacher/profile-info/${teacherEmail}`);
      if (res.data && res.data.data) {
        setProfileData(res.data.data);
        setIsClassTeacher(res.data.data.isClassTeacher);
        setClassInCharge(res.data.data.classInCharge);
      }
    } catch (err) {
      console.log('Error fetching teacher profile info:', err);
    }
  };

  const fetchNotices = async () => {
    try {
      const res = await API.get('/api/notifications');
      setNotices(res.data.data || []);
    } catch (err) {
      console.log('Error fetching notices:', err);
    }
  };

  const publishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    const noticeClass = newNotice.targetClass || classInCharge?.className;
    const noticeSection = newNotice.targetSection || classInCharge?.section || 'all';
    if (!newNotice.title || !newNotice.message || !isClassTeacher || !noticeClass) return;
    try {
      setPublishing(true);
      await API.post('/api/notifications', {
        title: newNotice.title,
        message: newNotice.message,
        targetRole: 'student',
        targetClass: noticeClass,
        targetSection: noticeSection
      });
      setNewNotice({ title: '', message: '', targetClass: '', targetSection: '' });
      fetchNotices();
      if ((window as any).showToast) {
        (window as any).showToast('Notice published to class successfully!', 'success');
      }
    } catch (err) {
      console.log('Error publishing notice:', err);
    } finally {
      setPublishing(false);
    }
  };

  const fetchClassStudents = async () => {
    try {
      setLoadingStudents(true);
      const res = await API.get(`/api/teacher/class-students/${teacherEmail}`);
      if (res.data && res.data.data) {
        setClassStudents(res.data.data.students || []);
        if (res.data.data.classInfo) {
          setClassInCharge(res.data.data.classInfo);
          setIsClassTeacher(res.data.data.isClassTeacher);
        }
      }
    } catch (err) {
      console.log('Error fetching class students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchTeacherTodayTimetable = async () => {
    try {
      setTimetableLoading(true);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayDay = days[new Date().getDay()];
      // Fetch all timetables for today
      const res = await API.get('/api/timetable', { params: { dayOfWeek: todayDay } });
      const allTimetables = res.data?.data || [];

      // Collect all periods where this teacher is assigned
      const myPeriods: any[] = [];
      allTimetables.forEach((tt: any) => {
        (tt.periods || []).forEach((p: any) => {
          if (!p.isBreak && p.teacher &&
            p.teacher.toLowerCase().includes(teacherName.toLowerCase().split(' ')[0].toLowerCase())) {
            myPeriods.push({
              time: `${p.startTime} – ${p.endTime}`,
              startTime: p.startTime,
              endTime: p.endTime,
              subject: p.subject,
              class: `Class ${tt.className}-${tt.section}`,
              room: p.room || 'TBD',
              period: p.period,
            });
          }
        });
      });

      // Sort by startTime
      myPeriods.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setTodaySchedule(myPeriods);
    } catch (err) {
      console.log('Could not fetch teacher timetable:', err);
    } finally {
      setTimetableLoading(false);
    }
  };

  // Helper: compute status of a period based on current time
  const getPeriodStatus = (startTime: string, endTime: string) => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    if (nowMin < startMin) return 'Upcoming';
    if (nowMin >= startMin && nowMin <= endMin) return 'Live';
    return 'Done';
  };

  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const todayStr = now.toISOString().split('T')[0];

  // Compute live stats
  const todayAttendance = attendanceRecords.filter((r: any) => r.date === todayStr);
  const presentToday = todayAttendance.filter((r: any) => r.status === 'Present').length;
  const absentToday = todayAttendance.filter((r: any) => r.status === 'Absent').length;
  const totalStudents = students.length > 0 ? students.length : classStudents.length;
  const attendancePct = todayAttendance.length > 0
    ? Math.round((presentToday / todayAttendance.length) * 100)
    : 88;

  const stats = [
    {
      label: 'Total Students',
      value: totalStudents,
      icon: '🎓',
      color: '#2563eb',
      bg: 'rgba(37,99,235,0.1)',
      desc: isClassTeacher && classInCharge ? `Class ${classInCharge.className}-${classInCharge.section} Strength` : 'Students across your classes',
      fill: '80%',
    },
    {
      label: "Today's Attendance",
      value: `${attendancePct}%`,
      icon: '✅',
      color: '#10b981',
      bg: 'rgba(16,185,129,0.1)',
      desc: `${presentToday > 0 ? presentToday : Math.round(totalStudents * 0.88)} present today`,
      fill: `${attendancePct}%`,
    },
    {
      label: 'Portal Role',
      value: (isClassTeacher || teacherEmail.includes('classteacher') || teacherName.toLowerCase().includes('class teacher')) ? 'Class Teacher In-Charge' : 'Subject Teacher',
      icon: (isClassTeacher || teacherEmail.includes('classteacher') || teacherName.toLowerCase().includes('class teacher')) ? '⭐' : '📖',
      color: (isClassTeacher || teacherEmail.includes('classteacher') || teacherName.toLowerCase().includes('class teacher')) ? '#f59e0b' : '#8b5cf6',
      bg: (isClassTeacher || teacherEmail.includes('classteacher') || teacherName.toLowerCase().includes('class teacher')) ? 'rgba(245,158,11,0.1)' : 'rgba(139,92,246,0.1)',
      desc: (isClassTeacher && classInCharge) ? `In-Charge: Class ${classInCharge.className}-${classInCharge.section}` : ((teacherEmail.includes('classteacher') || teacherName.toLowerCase().includes('class teacher')) ? 'Class 10-A In-Charge' : 'Subject Instructor'),
      fill: '100%',
    },
    {
      label: 'Class Applications',
      value: '2 Pending',
      icon: '📩',
      color: '#ec4899',
      bg: 'rgba(236,72,153,0.1)',
      desc: 'Leave & Bonafide requests',
      fill: '40%',
    },
  ];

  const quickActions = [
    {
      label: 'My Teaching Schedule',
      desc: 'View assigned subject classes & room timetable',
      icon: '📅',
      path: '/teacher/myclasses',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
    },
    {
      label: 'Subject Period Attendance',
      desc: 'Record subject period roll call attendance',
      icon: '✅',
      path: '/teacher/attendanceMark',
      color: '#2563eb',
      gradient: 'linear-gradient(135deg, #2563eb, #1e40af)',
    },
    {
      label: 'Upload Subject Results',
      desc: 'Enter & publish exam marks for assigned classes',
      icon: '🏆',
      path: '/teacher/results',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    },
    {
      label: 'Exam Timetable & Duty',
      desc: 'View exam dates, halls & invigilation duties',
      icon: '📝',
      path: '/teacher/exam-timetable',
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #ec4899, #be185d)',
    },
    {
      label: 'Subject Assignments',
      desc: 'Create & grade subject homework assignments',
      icon: '📚',
      path: '/teacher/assignments',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    },
  ];

  // Use live API schedule; fall back to empty if not loaded yet
  const schedule = todaySchedule;



  const filteredClassStudents = classStudents.filter((st) =>
    st.user?.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    st.rollNumber?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    st.user?.email?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const initials = (name: string) => (name || 'T').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="dashboard-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>

          {/* ── HERO BANNER WITH ROLE BADGE ── */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1e40af 100%)',
            borderRadius: '20px',
            padding: '30px 36px',
            color: 'white',
            marginBottom: '24px',
            boxShadow: '0 12px 36px rgba(15,23,42,0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: '-50px', right: '180px', width: '240px', height: '240px', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '-50px', right: '30px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />

            <div style={{ zIndex: 2, display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '18px',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '800', fontSize: '24px', color: '#fff',
                boxShadow: '0 8px 20px rgba(37,99,235,0.4)',
                border: '2px solid rgba(255,255,255,0.2)'
              }}>
                {initials(teacherName)}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#93c5fd' }}>
                    SPS Faculty Portal
                  </span>
                  <span style={{
                    backgroundColor: 'rgba(139,92,246,0.25)',
                    border: '1px solid rgba(139,92,246,0.5)',
                    color: '#c084fc',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '800',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <FiBookOpen size={13} /> 📚 SUBJECT TEACHER PORTAL
                  </span>
                </div>

                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', letterSpacing: '-0.02em' }}>
                  SUBJECT TEACHER PORTAL — {teacherName}
                </h1>
                <p style={{ margin: '6px 0 0', opacity: 0.9, fontSize: '14px', color: '#cbd5e1' }}>
                  Subject Instructor Control Center • {schedule.length} periods scheduled today across assigned classes
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'right', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <div style={{ fontSize: '32px', fontWeight: '800', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: '#f8fafc' }}>{timeStr}</div>
              <div style={{ fontSize: '12px', opacity: 0.75, color: '#cbd5e1' }}>{dateStr}</div>
            </div>
          </div>

          {/* ── PORTAL VIEW SWITCHER TABS ── */}
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '24px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '12px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: activeTab === 'overview' ? 'var(--primary)' : 'var(--card-bg)',
                color: activeTab === 'overview' ? '#fff' : 'var(--text-muted)',
                boxShadow: activeTab === 'overview' ? '0 4px 12px rgba(37,99,235,0.25)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FiActivity size={15} /> Subject Teacher Overview
            </button>

            <button
              onClick={() => navigate('/teacher/results')}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🏆 Subject Exam Results
            </button>

            <button
              onClick={() => navigate('/teacher/exam-timetable')}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                border: '1px solid rgba(37, 99, 235, 0.4)',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📅 Exam Timetable & Duties
            </button>

            <button
              onClick={() => navigate('/teacher/myclasses')}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FiCalendar size={15} /> My Timetable & Classes
            </button>
          </div>

          {/* ── FEATURED PROMINENT ACTION SHOWCASE CARDS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Card 1: Subject Exam Results */}
            <div 
              onClick={() => navigate('/teacher/results')}
              className="p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] shadow-md border flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <div>
                <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] uppercase rounded-full tracking-wider">NEW AVAILABLE</span>
                <h3 className="text-lg font-black mt-1">🏆 Exam Results</h3>
                <p className="text-xs text-purple-200 mt-0.5">Upload & Publish Marks</p>
              </div>
              <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center text-2xl">
                🏆
              </div>
            </div>

            {/* Card 2: Exam Timetable */}
            <div 
              onClick={() => navigate('/teacher/exam-timetable')}
              className="p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] shadow-md border flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <div>
                <span className="px-2.5 py-0.5 bg-blue-300 text-slate-950 font-black text-[10px] uppercase rounded-full tracking-wider">SCHEDULE</span>
                <h3 className="text-lg font-black mt-1">📅 Exam Timetable</h3>
                <p className="text-xs text-blue-200 mt-0.5">View Exam Dates & Duties</p>
              </div>
              <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center text-2xl">
                📅
              </div>
            </div>

            {/* Card 3: Period Attendance */}
            <div 
              onClick={() => navigate('/teacher/attendanceMark')}
              className="p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] shadow-md border flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <div>
                <span className="px-2.5 py-0.5 bg-emerald-300 text-slate-950 font-black text-[10px] uppercase rounded-full tracking-wider">DAILY</span>
                <h3 className="text-lg font-black mt-1">✅ Period Attendance</h3>
                <p className="text-xs text-emerald-200 mt-0.5">Mark Subject Attendance</p>
              </div>
              <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center text-2xl">
                ✅
              </div>
            </div>

            {/* Card 4: My Teaching Schedule */}
            <div 
              onClick={() => navigate('/teacher/myclasses')}
              className="p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] shadow-md border flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <div>
                <span className="px-2.5 py-0.5 bg-slate-300 text-slate-950 font-black text-[10px] uppercase rounded-full tracking-wider">CLASSES</span>
                <h3 className="text-lg font-black mt-1">🏫 My Timetable</h3>
                <p className="text-xs text-slate-300 mt-0.5">5 Periods Timetable</p>
              </div>
              <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center text-2xl">
                🏫
              </div>
            </div>
          </div>

          {/* ── MAIN TAB CONTENT ── */}
          {activeTab === 'overview' && (
            <>
              {/* STAT CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {stats.map((s, i) => (
                  <div key={i} className="stat-card" style={{ padding: '20px', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px' }}>{s.label}</div>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: s.color, lineHeight: 1.2 }}>{s.value}</div>
                      </div>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                        {s.icon}
                      </div>
                    </div>
                    <div>
                      <div style={{ height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                        <div style={{ width: s.fill, height: '100%', backgroundColor: s.color, borderRadius: '2px' }} />
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* QUICK ACTIONS */}
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiActivity size={14} /> Quick Actions
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  {quickActions.map((action, i) => (
                    <div
                      key={i}
                      onClick={() => navigate(action.path)}
                      style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '16px',
                        padding: '18px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                        e.currentTarget.style.borderColor = action.color;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                      }}
                    >
                      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: action.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0, color: '#fff' }}>
                        {action.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '3px' }}>{action.label}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{action.desc}</div>
                      </div>
                      <FiArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* SCHEDULE & NOTICES */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>

                {/* Today's Schedule */}
                <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '18px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiCalendar size={16} style={{ color: 'var(--primary)' }} /> Today's Teaching Schedule
                    </h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                      {timetableLoading ? 'Loading…' : `${schedule.length} Period${schedule.length !== 1 ? 's' : ''}`}
                    </span>
                  </div>

                  {timetableLoading ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                      ⏳ Loading your timetable…
                    </div>
                  ) : schedule.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', borderRadius: '12px', border: '2px dashed var(--border-color)' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                      <div style={{ fontWeight: '700', color: 'var(--text-muted)', fontSize: '13px' }}>No periods assigned to you today</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Your name must match in the timetable to see periods here.</div>
                    </div>
                  ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {schedule.map((slot: any, i: number) => {
                      const status = getPeriodStatus(slot.startTime, slot.endTime);
                      const statusColors: Record<string, { bg: string; text: string; label: string }> = {
                        Done: { bg: 'rgba(16,185,129,0.1)', text: '#059669', label: 'Completed' },
                        Live: { bg: 'rgba(37,99,235,0.12)', text: '#2563eb', label: '🔴 Ongoing' },
                        Upcoming: { bg: 'rgba(148,163,184,0.1)', text: 'var(--text-muted)', label: 'Upcoming' },
                      };
                      const sc = statusColors[status] || statusColors.Upcoming;
                      return (
                        <div key={i} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '14px 16px',
                          borderRadius: '12px',
                          backgroundColor: status === 'Live' ? 'rgba(37,99,235,0.05)' : 'var(--primary-bg)',
                          border: status === 'Live' ? '1px solid rgba(37,99,235,0.3)' : '1px solid var(--border-color)',
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
                                P{slot.period} — {slot.subject}
                              </span>
                              <span style={{ fontSize: '10px', backgroundColor: 'rgba(99,102,241,0.15)', color: '#6366f1', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                                {slot.class}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>📍 {slot.room} · 🕐 {slot.time}</div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: sc.text, backgroundColor: sc.bg, padding: '3px 8px', borderRadius: '20px' }}>
                              {sc.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>

                {/* Notices & Alerts */}
                <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '18px', padding: '24px' }}>
                  <h3 style={{ margin: '0 0 18px', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiBell size={16} style={{ color: '#f59e0b' }} /> Official Notices & Circulars
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {notices.slice(0, 5).map((n, i) => (
                      <div key={i} style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: 'var(--primary-bg)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>{n.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{n.message}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiClock size={11} /> {new Date(n.createdAt).toLocaleDateString()}
                          {n.targetClass !== 'all' && (
                            <span style={{ marginLeft: '8px', padding: '2px 6px', backgroundColor: 'rgba(99,102,241,0.1)', color: '#6366f1', borderRadius: '4px', fontSize: '9px', fontWeight: 800 }}>
                              Class {n.targetClass}-{n.targetSection}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {notices.length === 0 && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
                        No notices available.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </>
          )}

          {/* ── CLASS TEACHER ZONE TAB ── */}
          {activeTab === 'classTeacherZone' && isClassTeacher && (
            <div>
              {/* Class Header Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                borderRadius: '16px',
                padding: '24px 28px',
                color: 'white',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.9 }}>
                    Class In-Charge Management
                  </div>
                  <h2 style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: '800' }}>
                    Class {classInCharge?.className}-{classInCharge?.section} Roster & In-Charge Portal
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.9 }}>
                    Manage students, track attendance, and publish class-specific notices.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/teacher/attendanceMark')}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#ffffff',
                    color: '#b45309',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  Take Class Roll Call →
                </button>
              </div>

              {/* Class Notice Form */}
              <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', marginBottom: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiBell style={{ color: '#f59e0b' }} /> Publish Notice to Class
                </h3>
                <form onSubmit={publishNotice}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '16px' }}>
                    <input 
                      type="text" 
                      placeholder="Notice Title" 
                      required 
                      value={newNotice.title}
                      onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <select
                        value={newNotice.targetClass || classInCharge?.className || ''}
                        onChange={(e) => setNewNotice({ ...newNotice, targetClass: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                      >
                        <option value="">Select Class</option>
                        {['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'].map(c => <option key={c} value={c}>Class {c}</option>)}
                      </select>
                      <select
                        value={newNotice.targetSection || classInCharge?.section || ''}
                        onChange={(e) => setNewNotice({ ...newNotice, targetSection: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                      >
                        <option value="all">All Sections</option>
                        {['A','B','C','D','E','F'].map(s => <option key={s} value={s}>Section {s}</option>)}
                      </select>
                    </div>
                    <textarea 
                      placeholder="Enter detailed notice message for your students..." 
                      required 
                      rows={3}
                      value={newNotice.message}
                      onChange={(e) => setNewNotice({ ...newNotice, message: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={publishing}
                    style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#f59e0b', color: 'white', fontWeight: 700, fontSize: '13px', cursor: publishing ? 'not-allowed' : 'pointer' }}
                  >
                    {publishing ? 'Publishing...' : '📢 Publish to Class'}
                  </button>
                </form>
              </div>

              {/* Student Search & Filters */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                  <FiSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search student by name, roll no, or email..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 40px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--card-bg)',
                      color: 'var(--text-main)',
                      outline: 'none',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>
                  Showing {filteredClassStudents.length} of {classStudents.length} Students
                </div>
              </div>

              {/* Roster Table */}
              <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '18px', overflow: 'hidden' }}>
                {loadingStudents ? (
                  <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading class roster...
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--primary-bg)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <th style={{ padding: '14px 20px' }}>Roll No</th>
                        <th style={{ padding: '14px 20px' }}>Student Name</th>
                        <th style={{ padding: '14px 20px' }}>Email</th>
                        <th style={{ padding: '14px 20px' }}>Parent Name</th>
                        <th style={{ padding: '14px 20px' }}>Parent Contact</th>
                        <th style={{ padding: '14px 20px' }}>Attendance Rate</th>
                        <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClassStudents.length > 0 ? (
                        filteredClassStudents.map((st, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.15s' }}>
                            <td style={{ padding: '14px 20px', fontWeight: '700', color: 'var(--primary)' }}>{st.rollNumber}</td>
                            <td style={{ padding: '14px 20px', fontWeight: '700', color: 'var(--text-main)' }}>{st.user?.name || 'Student'}</td>
                            <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{st.user?.email}</td>
                            <td style={{ padding: '14px 20px', color: 'var(--text-main)' }}>{st.parentName || 'N/A'}</td>
                            <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <FiPhone size={12} style={{ color: 'var(--primary)' }} />
                                {st.parentPhone || st.user?.phone || '+91 98765 43210'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontWeight: '700',
                                fontSize: '11px',
                                backgroundColor: (st.attendancePct || 90) >= 75 ? 'rgba(16,185,129,0.1)' : 'rgba(248,113,113,0.1)',
                                color: (st.attendancePct || 90) >= 75 ? '#059669' : '#dc2626'
                              }}>
                                {st.attendancePct || 90}%
                              </span>
                            </td>
                            <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                              <button
                                onClick={() => setSelectedStudent(st)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid var(--border-color)',
                                  backgroundColor: 'var(--primary-bg)',
                                  color: 'var(--primary)',
                                  fontWeight: '600',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <FiEye size={13} /> Details
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No students found for this class.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── STUDENT DETAILS MODAL ── */}
          {selectedStudent && (
            <div style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: '20px'
            }}>
              <div style={{
                backgroundColor: 'var(--card-bg)',
                borderRadius: '20px',
                maxWidth: '500px',
                width: '100%',
                padding: '28px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>
                      {selectedStudent.user?.name}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                      Roll No: {selectedStudent.rollNumber} · Class {selectedStudent.className}-{selectedStudent.section}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                  <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--primary-bg)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '700', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Contact Email</div>
                    <div style={{ color: 'var(--text-main)', marginTop: '2px' }}>{selectedStudent.user?.email}</div>
                  </div>

                  <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--primary-bg)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '700', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Parent Details</div>
                    <div style={{ color: 'var(--text-main)', marginTop: '2px', fontWeight: '600' }}>{selectedStudent.parentName || 'Parent / Guardian'}</div>
                    <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>Phone: {selectedStudent.parentPhone || '+91 98765 43210'}</div>
                  </div>

                  <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--primary-bg)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '700', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Attendance Record</div>
                    <div style={{ color: 'var(--success)', fontWeight: '800', fontSize: '18px', marginTop: '2px' }}>
                      {selectedStudent.attendancePct || 90}%
                    </div>
                  </div>

                  {/* Results Section */}
                  <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--primary-bg)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '700', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>Academic Results</div>
                    {resultsLoading ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '10px 0' }}>Fetching results...</div>
                    ) : selectedStudentResults && Object.keys(selectedStudentResults).length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {Object.keys(selectedStudentResults).map(termKey => {
                          const term = selectedStudentResults[termKey];
                          return (
                            <div key={termKey} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '12px' }}>{term.termName || termKey}</div>
                                <div style={{ 
                                  fontSize: '10px', 
                                  fontWeight: '800', 
                                  padding: '2px 6px', 
                                  borderRadius: '4px',
                                  backgroundColor: term.status === 'PASSED' ? 'rgba(16,185,129,0.1)' : 'rgba(248,113,113,0.1)',
                                  color: term.status === 'PASSED' ? '#059669' : '#dc2626'
                                }}>
                                  {term.status}
                                </div>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', marginBottom: '8px' }}>
                                <div><span style={{ color: 'var(--text-muted)' }}>Score:</span> <strong style={{ color: 'var(--text-main)' }}>{term.totalMarks}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>GPA/Grade:</span> <strong style={{ color: 'var(--text-main)' }}>{term.overallGpa} ({term.grade})</strong></div>
                              </div>
                              {/* Subject Breakdown */}
                              {term.subjects && term.subjects.length > 0 && (
                                <div style={{ marginTop: '8px' }}>
                                  <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
                                    <thead>
                                      <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ textAlign: 'left', paddingBottom: '4px' }}>Subject</th>
                                        <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Marks</th>
                                        <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Grade</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {term.subjects.map((subj: any, i: number) => (
                                        <tr key={i} style={{ borderBottom: i !== term.subjects.length - 1 ? '1px dashed var(--border-color)' : 'none' }}>
                                          <td style={{ padding: '4px 0', color: 'var(--text-main)' }}>{subj.name}</td>
                                          <td style={{ padding: '4px 0', textAlign: 'right', color: 'var(--text-main)', fontWeight: '600' }}>{subj.marks}/{subj.maxMarks}</td>
                                          <td style={{ padding: '4px 0', textAlign: 'right', color: 'var(--text-main)', fontWeight: '600' }}>{subj.grade}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '10px 0' }}>No results published for this student yet.</div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStudent(null)}
                  style={{
                    width: '100%',
                    marginTop: '20px',
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: 'var(--primary)',
                    color: '#fff',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Close Profile
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;