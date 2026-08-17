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

  // Teacher's assigned subjects and classes
  const [mySubjects, setMySubjects] = useState<any[]>([]);
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [myClassStudents, setMyClassStudents] = useState<any[]>([]);
  const [loadingMyData, setLoadingMyData] = useState<boolean>(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

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

        // Extract assigned subjects and classes
        const teacherDoc = res.data.data.teacher;
        if (teacherDoc) {
          const subjects = Array.isArray(teacherDoc.subjects) ? teacherDoc.subjects : [];
          const classes = Array.isArray(teacherDoc.classes) ? teacherDoc.classes : [];
          setMySubjects(subjects);
          setMyClasses(classes);

          // Fetch students from assigned classes
          if (classes.length > 0) {
            fetchMyClassStudents(classes);
          }
        }
      }
    } catch (err) {
      console.log('Error fetching teacher profile info:', err);
    }
  };

  const fetchMyClassStudents = async (classes: any[]) => {
    try {
      setLoadingMyData(true);
      const studentMap: any[] = [];
      for (const cls of classes) {
        const className = cls.className || cls;
        const section = cls.section || '';
        try {
          const res = await API.get('/api/student/all', {
            params: { className, section }
          });
          const studentsData = res.data?.data || res.data?.students || [];
          studentsData.forEach((s: any) => {
            studentMap.push({ ...s, fromClass: `${className}${section ? '-' + section : ''}` });
          });
        } catch {}
      }
      setMyClassStudents(studentMap);
    } catch (err) {
      console.log('Error fetching assigned class students:', err);
    } finally {
      setLoadingMyData(false);
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
      label: 'Subject Assignments',
      desc: 'Create & grade subject homework assignments',
      icon: '📚',
      path: '/teacher/assignments',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    },
    {
      label: 'Student Leave Requests',
      desc: 'Review & approve student leave applications',
      icon: '✉️',
      path: '/teacher/application',
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #ec4899, #be185d)',
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
        <div className="dashboard-container p-3 sm:p-6 max-w-[1400px] mx-auto overflow-x-hidden w-full">

          {/* ── HERO BANNER WITH DISTINCT SUBJECT TEACHER BRANDING ── */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
              borderRadius: '20px',
              padding: '20px 24px',
              color: '#FFFFFF',
              marginBottom: '24px',
              boxShadow: '0 12px 32px -8px rgba(49, 46, 129, 0.4)',
              position: 'relative',
              border: '1px solid rgba(165, 180, 252, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {/* Top row: Avatar + Badges + Title */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', width: '100%', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  backgroundColor: '#6366F1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '20px',
                  color: '#FFFFFF',
                  boxShadow: '0 6px 16px rgba(99, 102, 241, 0.4)',
                  border: '1.5px solid rgba(255, 255, 255, 0.3)',
                  flexShrink: 0,
                }}
              >
                {initials(teacherName)}
              </div>

              <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: '800',
                      letterSpacing: '0.8px',
                      textTransform: 'uppercase',
                      color: '#E0E7FF',
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    FACULTY INSTRUCTOR PORTAL
                  </span>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: '700',
                      color: '#C7D2FE',
                      backgroundColor: 'rgba(99, 102, 241, 0.3)',
                      border: '1px solid rgba(199, 210, 254, 0.4)',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <FiBookOpen size={12} /> 📖 SUBJECT TEACHER CONTROL CENTER
                  </span>
                </div>

                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.3px', lineHeight: '1.3' }}>
                  SUBJECT TEACHER PORTAL — {teacherName}
                </h1>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#C7D2FE', lineHeight: '1.4', opacity: 0.95 }}>
                  Manage assigned subject periods, record subject attendance, upload exam marks &amp; grade assignments.
                </p>
              </div>

              {/* Time & Date Box */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  padding: '8px 16px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  alignSelf: 'flex-start',
                }}
              >
                <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'monospace', color: '#F8FAFC', letterSpacing: '-0.5px' }}>
                  {timeStr}
                </div>
                <div style={{ fontSize: '11px', color: '#A5B4FC', fontWeight: '600' }}>
                  {dateStr}
                </div>
              </div>
            </div>
          </div>

          {/* ── PORTAL NAVIGATION QUICK TABS ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '24px',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '16px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                flex: '1 1 180px',
                padding: '12px 16px',
                borderRadius: '14px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: 'none',
                backgroundColor: activeTab === 'overview' ? '#4F46E5' : 'var(--card-bg)',
                color: activeTab === 'overview' ? '#FFFFFF' : 'var(--text-muted)',
                boxShadow: activeTab === 'overview' ? '0 4px 14px rgba(79, 70, 229, 0.35)' : 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
              }}
            >
              <FiActivity size={16} /> 📖 Subject Teacher Overview
            </button>

            <button
              onClick={() => navigate('/teacher/results')}
              style={{
                flex: '1 1 180px',
                padding: '12px 16px',
                borderRadius: '14px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: 'none',
                backgroundColor: '#7C3AED',
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
              }}
            >
              🏆 Upload Subject Results
            </button>

            <button
              onClick={() => navigate('/teacher/attendanceMark')}
              style={{
                flex: '1 1 180px',
                padding: '12px 16px',
                borderRadius: '14px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: 'none',
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
              }}
            >
              ✅ Period Roll Call
            </button>

            <button
              onClick={() => navigate('/teacher/myclasses')}
              style={{
                flex: '1 1 180px',
                padding: '12px 16px',
                borderRadius: '14px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--text-main)',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
              }}
            >
              📅 Timetable &amp; Classes
            </button>

            <button
              onClick={() => navigate('/teacher/assignments')}
              style={{
                flex: '1 1 180px',
                padding: '12px 16px',
                borderRadius: '14px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--text-main)',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
              }}
            >
              📚 Subject Assignments
            </button>

            <button
              onClick={() => navigate('/teacher/application')}
              style={{
                flex: '1 1 180px',
                padding: '12px 16px',
                borderRadius: '14px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--text-main)',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
              }}
            >
              📩 Student Applications
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

              {/* ── MY ASSIGNED SUBJECTS & CLASSES ── */}
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ margin: '0 0 16px', fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiBookOpen size={14} /> My Assigned Subjects & Classes
                </h2>

                {/* Subject Chips */}
                {mySubjects.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                    {mySubjects.map((sub: any, i: number) => (
                      <div key={i} style={{
                        padding: '10px 18px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #4338ca, #6366f1)',
                        color: '#fff',
                        fontWeight: '700',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
                      }}>
                        📚 {sub.name || sub} {sub.code ? <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: '600' }}>({sub.code})</span> : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', border: '1px dashed var(--border-color)', color: 'var(--text-muted)', fontSize: '13px' }}>
                    📌 No subjects assigned yet. Contact your Academic Admin to assign subjects.
                  </div>
                )}

                {/* Class Filter Tabs */}
                {myClasses.length > 0 && (
                  <>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                      <button
                        onClick={() => setSelectedClassFilter('all')}
                        style={{
                          padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
                          fontWeight: '700', fontSize: '12px',
                          backgroundColor: selectedClassFilter === 'all' ? '#4338ca' : 'var(--card-bg)',
                          color: selectedClassFilter === 'all' ? '#fff' : 'var(--text-muted)',
                          border: selectedClassFilter === 'all' ? '2px solid #4338ca' : '1px solid var(--border-color)'
                        }}
                      >
                        All Classes ({myClasses.length})
                      </button>
                      {myClasses.map((cls: any, i: number) => {
                        const label = `${cls.className || cls}-${cls.section || ''}`;
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedClassFilter(label)}
                            style={{
                              padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
                              fontWeight: '700', fontSize: '12px',
                              backgroundColor: selectedClassFilter === label ? '#059669' : 'var(--card-bg)',
                              color: selectedClassFilter === label ? '#fff' : 'var(--text-muted)',
                              border: selectedClassFilter === label ? '2px solid #059669' : '1px solid var(--border-color)'
                            }}
                          >
                            🏫 Class {label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Assigned Classes Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                      {myClasses
                        .filter((cls: any) => {
                          if (selectedClassFilter === 'all') return true;
                          const label = `${cls.className || cls}-${cls.section || ''}`;
                          return label === selectedClassFilter;
                        })
                        .map((cls: any, i: number) => {
                          const className = cls.className || cls;
                          const section = cls.section || '';
                          const label = `${className}${section ? '-' + section : ''}`;
                          const subjectsInClass = Array.isArray(cls.subjects) ? cls.subjects : [];
                          const studentsInClass = myClassStudents.filter(s => s.fromClass === label);
                          return (
                            <div key={i} style={{
                              borderRadius: '16px',
                              border: '1px solid var(--border-color)',
                              backgroundColor: 'var(--card-bg)',
                              overflow: 'hidden',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                            }}>
                              {/* Class Header */}
                              <div style={{
                                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                                padding: '16px 20px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <div>
                                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned Class</div>
                                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginTop: '2px' }}>Class {label}</div>
                                </div>
                                <div style={{
                                  width: '44px', height: '44px', borderRadius: '12px',
                                  background: 'linear-gradient(135deg, #6366f1, #4338ca)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '20px'
                                }}>🏫</div>
                              </div>
                              {/* Class Body */}
                              <div style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '12px' }}>
                                  <div style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: 'var(--primary-bg)', textAlign: 'center' }}>
                                    <div style={{ fontWeight: '800', color: '#4338ca', fontSize: '18px' }}>{studentsInClass.length || '—'}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: '600' }}>Students</div>
                                  </div>
                                  <div style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: 'var(--primary-bg)', textAlign: 'center' }}>
                                    <div style={{ fontWeight: '800', color: '#059669', fontSize: '18px' }}>{mySubjects.length}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: '600' }}>Subjects</div>
                                  </div>
                                </div>
                                {/* Subjects taught in this class */}
                                <div style={{ marginBottom: '12px' }}>
                                  <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>You Teach</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {mySubjects.slice(0, 4).map((sub: any, si: number) => (
                                      <span key={si} style={{
                                        padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600',
                                        backgroundColor: 'rgba(99,102,241,0.12)', color: '#6366f1'
                                      }}>📚 {sub.name || sub}</span>
                                    ))}
                                  </div>
                                </div>
                                {/* Action buttons */}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    onClick={() => window.location.href = '/teacher/attendanceMark'}
                                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: '#059669', color: '#fff', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}
                                  >✅ Mark Attendance</button>
                                  <button
                                    onClick={() => window.location.href = '/teacher/results'}
                                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: '#7c3aed', color: '#fff', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}
                                  >🏆 Upload Results</button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Students Table for selected class */}
                    {myClassStudents.length > 0 && (
                      <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🎓 Students in My Assigned Classes
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(99,102,241,0.1)', color: '#6366f1', fontWeight: '800' }}>
                              {selectedClassFilter === 'all' ? myClassStudents.length : myClassStudents.filter(s => s.fromClass === selectedClassFilter).length} Students
                            </span>
                          </h3>
                        </div>
                        {loadingMyData ? (
                          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Loading students...</div>
                        ) : (
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                              <tr style={{ backgroundColor: 'var(--primary-bg)', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Roll No</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Student Name</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Class</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Contact</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Attendance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(selectedClassFilter === 'all' ? myClassStudents : myClassStudents.filter(s => s.fromClass === selectedClassFilter))
                                .map((st: any, i: number) => (
                                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '12px 16px', fontWeight: '700', color: '#6366f1' }}>{st.rollNumber || `#${i + 1}`}</td>
                                    <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-main)' }}>{st.user?.name || st.name || 'Student'}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                      <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', backgroundColor: 'rgba(5,150,105,0.1)', color: '#059669' }}>
                                        {st.fromClass}
                                      </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '12px' }}>{st.user?.email || '—'}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                      <span style={{
                                        padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                                        backgroundColor: (st.attendancePct || 85) >= 75 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                        color: (st.attendancePct || 85) >= 75 ? '#059669' : '#dc2626'
                                      }}>{st.attendancePct || '—'}%</span>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </>
                )}

                {myClasses.length === 0 && mySubjects.length === 0 && (
                  <div style={{ padding: '32px', textAlign: 'center', border: '2px dashed var(--border-color)', borderRadius: '16px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
                    <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '6px' }}>No assignments yet</div>
                    <div style={{ fontSize: '12px' }}>Contact your Academic Admin to assign subjects and classes to your profile.</div>
                  </div>
                )}
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
                        {['Nursery','KG','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'].map(c => <option key={c} value={c}>Class {c}</option>)}
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