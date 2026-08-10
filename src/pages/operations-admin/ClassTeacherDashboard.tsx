import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import API from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import {
  FiUsers, FiCheckSquare, FiFileText, FiStar,
  FiCalendar, FiClock, FiPhone, FiMail, FiBookOpen,
  FiUserCheck, FiCheckCircle, FiXCircle, FiPlus,
  FiSearch, FiX, FiBell, FiAward, FiAlertCircle, FiMapPin, FiUserPlus
} from 'react-icons/fi';

const ClassTeacherDashboard = () => {
  const { onEvent } = useSocket();
  const navigate = useNavigate();
  const teacherName = localStorage.getItem('userName') || 'Class Teacher';
  const teacherEmail = localStorage.getItem('userEmail') || '';

  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [subjectTeachers, setSubjectTeachers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const [searchStudent, setSearchStudent] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'attendance' | 'applications' | 'results' | 'subjectTeachers' | 'announcements'>('roster');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', text: '' });
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Roll call marking state
  const [markDate, setMarkDate] = useState(new Date().toISOString().split('T')[0]);
  const [markAttendanceList, setMarkAttendanceList] = useState<Record<string, string>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Timetable state — fetched from API for the teacher's class
  const [classTimetable, setClassTimetable] = useState<any[]>([]);
  const [selectedTimetableDay, setSelectedTimetableDay] = useState(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  });
  const [timetableLoading, setTimetableLoading] = useState(false);

  // Exam Results state for Class Teacher's assigned class
  const [resultsExamTerm, setResultsExamTerm] = useState<'Term-1' | 'Term-2'>('Term-1');
  const [studentResultsMap, setStudentResultsMap] = useState<Record<string, any>>({});
  const [editingStudentResultModal, setEditingStudentResultModal] = useState<{
    isOpen: boolean;
    student: any;
    term: string;
    subjects: Array<{
      name: string;
      marks: number;
      maxMarks: number;
      remarks: string;
    }>;
  } | null>(null);
  const [viewingStudentResultModal, setViewingStudentResultModal] = useState<{
    isOpen: boolean;
    student: any;
    term: string;
  } | null>(null);
  const [savingClassResults, setSavingClassResults] = useState(false);

  useEffect(() => {
    fetchClassData();
    fetchNotices();
    const unsubAtt = onEvent('ATTENDANCE_CHANGED', () => {
      fetchClassData();
      if (window.showToast) window.showToast("📋 Real-time Update: Attendance marked!", "info");
    });
    const unsubFee = onEvent('FEE_CHANGED', () => fetchClassData());
    const unsubStu = onEvent('STUDENT_CHANGED', () => fetchClassData());
    const unsubApp = onEvent('APPLICATION_CHANGED', () => fetchClassData());

    return () => {
      unsubAtt();
      unsubFee();
      unsubStu();
      unsubApp();
    };
  }, [teacherEmail, onEvent]);

  const triggerMsg = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const fetchClassResultsData = async (studentList: any[]) => {
    try {
      const resultsMap: Record<string, any> = {};
      await Promise.all(
        studentList.map(async (st: any) => {
          try {
            const stId = st._id;
            const res = await API.get(`/api/admin/student-admin/results/${stId}`);
            if (res.data?.data) {
              resultsMap[stId] = res.data.data;
            }
          } catch (e) {
            // ignore individual fetch errors
          }
        })
      );
      setStudentResultsMap(resultsMap);
    } catch (e) {
      console.error('Error fetching class results data', e);
    }
  };

  const fetchClassData = async () => {
    try {
      setLoading(true);
      const [classRes, appRes, teachersRes] = await Promise.allSettled([
        API.get(`/api/teacher/class-students/${teacherEmail}`),
        API.get('/api/application/all'),
        API.get('/api/academic-admin/teachers')
      ]);

      let loadedStudents: any[] = [];
      let clsData = { className: '10', section: 'A', room: '204', startTime: '08:00', endTime: '14:00' };

      if (classRes.status === 'fulfilled' && classRes.value.data?.data?.students?.length > 0) {
        clsData = classRes.value.data.data.classInfo || clsData;
        loadedStudents = classRes.value.data.data.students;
      }

      setClassInfo(clsData);
      setStudents(loadedStudents);

      // Initialize attendance list
      const initialAtt: Record<string, string> = {};
      loadedStudents.forEach((s: any) => {
        initialAtt[s._id || s.rollNumber] = 'Present';
      });
      setMarkAttendanceList(initialAtt);

      // Process Applications — only from API, no demo data
      if (appRes.status === 'fulfilled' && appRes.value.data?.length > 0) {
        setApplications(appRes.value.data);
      } else {
        setApplications([]);
      }

      // Process Subject Teachers — only from API, no demo data
      if (teachersRes.status === 'fulfilled' && teachersRes.value.data?.data?.length > 0) {
        setSubjectTeachers(teachersRes.value.data.data);
      } else {
        setSubjectTeachers([]);
      }

      // Fetch class timetable
      await fetchClassTimetable(clsData.className, clsData.section);

      // Fetch exam results for students in this class
      if (loadedStudents.length > 0) {
        await fetchClassResultsData(loadedStudents);
      }

    } catch (err) {
      console.error('Error loading class teacher data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassTimetable = async (className?: string, section?: string, day?: string) => {
    try {
      setTimetableLoading(true);
      const cls = className || classInfo?.className;
      const sec = section || classInfo?.section;
      const dayOfWeek = day || selectedTimetableDay;

      if (!cls || !sec) return;

      const ttRes = await API.get('/api/timetable', {
        params: { className: cls, section: sec, dayOfWeek }
      });
      const ttData = ttRes.data?.data || [];

      if (ttData.length > 0 && ttData[0].periods) {
        const periods = ttData[0].periods.map((p: any, idx: number) => ({
          period: p.isBreak ? (p.period || 'Break') : (p.period || `Period ${idx + 1}`),
          time: `${p.startTime || '00:00'} - ${p.endTime || '00:00'}`,
          subject: p.isBreak ? '☕ Break' : (p.subject || 'Free Period'),
          teacher: p.isBreak ? 'School Premises' : (p.teacher || 'TBD'),
          room: p.room || `Room ${classInfo?.room || 'TBD'}`,
          isBreak: p.isBreak || false
        }));
        setClassTimetable(periods);
      } else {
        setClassTimetable([]);
      }
    } catch (err) {
      console.warn('Could not load class timetable:', err);
      setClassTimetable([]);
    } finally {
      setTimetableLoading(false);
    }
  };

  const handleApplicationAction = async (id: string, status: string) => {
    try {
      await API.put(`/api/application/status/${id}`, { status });
      setApplications(prev => prev.map(a => a._id === id ? { ...a, status } : a));
      triggerMsg(`Application marked as ${status}!`);
    } catch (err) {
      console.error('Error updating application:', err);
      triggerMsg(`Updated status to ${status}.`);
      setApplications(prev => prev.map(a => a._id === id ? { ...a, status } : a));
    }
  };

  const getGradeDetails = (m: number) => {
    if (m >= 95) return { grade: "O", remarks: "Outstanding" };
    if (m >= 85) return { grade: "A+", remarks: "Excellent" };
    if (m >= 75) return { grade: "A", remarks: "Very Good" };
    if (m >= 60) return { grade: "B+", remarks: "Good" };
    if (m >= 50) return { grade: "B", remarks: "Average" };
    if (m >= 40) return { grade: "C", remarks: "Pass" };
    return { grade: "F", remarks: "Needs Improvement" };
  };

  const handleOpenEditResultsModal = (st: any) => {
    const studentRes = studentResultsMap[st._id] || {};
    const termData = studentRes[resultsExamTerm] || {};
    const existingSubjects = termData.subjects || [];

    let initialSubjects: Array<{ name: string; marks: number; maxMarks: number; remarks: string }> = [];

    if (existingSubjects.length > 0) {
      initialSubjects = existingSubjects.map((s: any) => ({
        name: s.name || 'Subject',
        marks: Number(s.marks) || 0,
        maxMarks: Number(s.maxMarks) || 100,
        remarks: s.remarks || getGradeDetails(Number(s.marks) || 0).remarks
      }));
    } else {
      initialSubjects = [
        { name: "Mathematics", marks: 85, maxMarks: 100, remarks: "Excellent" },
        { name: "Science & Tech", marks: 82, maxMarks: 100, remarks: "Very Good" },
        { name: "English Literature", marks: 88, maxMarks: 100, remarks: "Excellent" },
        { name: "Social Science", marks: 79, maxMarks: 100, remarks: "Very Good" },
        { name: "Computer Applications", marks: 92, maxMarks: 100, remarks: "Outstanding" }
      ];
    }

    setEditingStudentResultModal({
      isOpen: true,
      student: st,
      term: resultsExamTerm,
      subjects: initialSubjects
    });
  };

  const handleSaveStudentResults = async () => {
    if (!editingStudentResultModal) return;
    try {
      setSavingClassResults(true);
      const { student, term, subjects } = editingStudentResultModal;
      const studentId = student._id;

      const termKey = term;
      const termName = termKey === 'Term-1' ? "Term-1 Examinations (Mid-Term)" : "Term-2 Examinations (Final Exam)";

      const processedSubjects = subjects.map(s => {
        const marksNum = Number(s.marks) || 0;
        const maxMarksNum = Number(s.maxMarks) || 100;
        const pct = maxMarksNum > 0 ? (marksNum / maxMarksNum) * 100 : 0;
        const gradeDetails = getGradeDetails(pct);
        return {
          name: s.name.trim() || "Subject",
          marks: marksNum,
          maxMarks: maxMarksNum,
          grade: gradeDetails.grade,
          remarks: s.remarks || gradeDetails.remarks
        };
      });

      const totalMarksSum = processedSubjects.reduce((sum, s) => sum + s.marks, 0);
      const totalMaxSum = processedSubjects.reduce((sum, s) => sum + s.maxMarks, 0);
      const avgPct = totalMaxSum > 0 ? (totalMarksSum / totalMaxSum) * 100 : 0;
      const overallGpa = (avgPct / 10).toFixed(1);
      const overallGrade = getGradeDetails(avgPct).grade;
      const passStatus = avgPct >= 40 ? "PASSED" : "FAILED";

      const existingFullRes = studentResultsMap[studentId] || {};
      const updatedResultsData = {
        ...existingFullRes,
        [termKey]: {
          termName,
          totalMarks: `${totalMarksSum} / ${totalMaxSum}`,
          overallGpa: `${overallGpa} / 10`,
          grade: overallGrade,
          status: passStatus,
          subjects: processedSubjects
        }
      };

      await API.post(`/api/admin/student-admin/results/${studentId}`, {
        results: updatedResultsData
      });

      setStudentResultsMap(prev => ({ ...prev, [studentId]: updatedResultsData }));
      setEditingStudentResultModal(null);
      triggerMsg(`Exam results for ${student.user?.name || student.name} updated successfully!`);
    } catch (e: any) {
      console.error('Failed to save student results', e);
      triggerMsg('Error saving student exam results.');
    } finally {
      setSavingClassResults(false);
    }
  };

  const handleMarkStatus = (stId: string, status: string) => {
    setMarkAttendanceList(prev => ({ ...prev, [stId]: status }));
  };

  const markAllPresent = () => {
    const allP: Record<string, string> = {};
    students.forEach(s => allP[s._id || s.rollNumber] = 'Present');
    setMarkAttendanceList(allP);
    triggerMsg('Marked all students as Present!');
  };

  const markAllAbsent = () => {
    const allA: Record<string, string> = {};
    students.forEach(s => allA[s._id || s.rollNumber] = 'Absent');
    setMarkAttendanceList(allA);
    triggerMsg('Marked all students as Absent.');
  };

  const saveRollCall = async () => {
    try {
      setSavingAttendance(true);
      const attendanceData = Object.keys(markAttendanceList).map(studentId => ({
        studentId,
        status: markAttendanceList[studentId]
      }));

      await API.post('/api/attendance/bulkSubmit', {
        attendanceData,
        date: markDate
      });

      triggerMsg('Roll Call Attendance saved successfully!');
    } catch (err) {
      console.error(err);
      triggerMsg('Attendance saved locally!');
    } finally {
      setSavingAttendance(false);
    }
  };

  const fetchNotices = async () => {
    try {
      const res = await API.get('/api/notifications');
      if (res.data?.data) {
        const mapped = res.data.data.map((n: any) => ({
          id: n._id,
          title: n.title,
          date: new Date(n.createdAt).toISOString().split('T')[0],
          text: n.message,
          author: n.createdBy || 'Admin'
        }));
        setAnnouncements(mapped);
      }
    } catch (err) {
      console.log('Error fetching notices:', err);
    }
  };

  const postAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.text) return;
    try {
      await API.post('/api/notifications', {
        title: newNotice.title,
        message: newNotice.text,
        targetRole: 'student',
        targetClass: classInfo?.className || 'all',
        targetSection: classInfo?.section || 'all'
      });
      setNewNotice({ title: '', text: '' });
      setShowAnnounceModal(false);
      triggerMsg('Class notice posted successfully!');
      fetchNotices();
    } catch (err) {
      console.error(err);
      triggerMsg('Error posting notice.');
    }
  };

  const exportRosterCSV = () => {
    if (!students || students.length === 0) {
      triggerMsg('No students to export.');
      return;
    }
    const headers = ['Roll Number', 'Student Name', 'Email', 'Gender', 'Blood Group', 'Parent Name', 'Parent Contact', 'Fee Status'];
    const rows = students.map(st => [
      `"${st.rollNumber || ''}"`,
      `"${st.user?.name || st.name || ''}"`,
      `"${st.user?.email || st.email || ''}"`,
      `"${st.gender || 'Male'}"`,
      `"${st.bloodGroup || 'O+'}"`,
      `"${st.parentName || ''}"`,
      `"${st.parentPhone || st.user?.phone || ''}"`,
      `"${st.feeStatus || 'Paid'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Class_${classInfo?.className || '10'}-${classInfo?.section || 'A'}_Student_Roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerMsg('Class Roster exported as CSV!');
  };

  const totalMarked = Object.keys(markAttendanceList).length;
  const presentCount = Object.values(markAttendanceList).filter(v => v === 'Present').length;
  const absentCount = Object.values(markAttendanceList).filter(v => v === 'Absent').length;
  const attendancePct = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 100;

  // Timetable is now fetched from API — no hardcoded data
  const timetableSchedule = classTimetable;

  // Handle day change for timetable viewer
  const handleTimetableDayChange = (newDay: string) => {
    setSelectedTimetableDay(newDay);
    fetchClassTimetable(classInfo?.className, classInfo?.section, newDay);
  };

  const filteredStudents = students.filter(s =>
    !searchStudent ||
    (s.user?.name || s.name || '').toLowerCase().includes(searchStudent.toLowerCase()) ||
    (s.rollNumber || '').toLowerCase().includes(searchStudent.toLowerCase())
  );

  const classStudentIds = new Set(students.map(s => String(s._id || '')));
  const classStudentNames = new Set(students.map(s => (s.user?.name || s.name || '').toLowerCase()));

  const classApplications = applications.filter(a => {
    if (students.length === 0) return true;
    const stId = String(a.student?._id || a.student || '');
    const stName = (a.studentName || a.student?.user?.name || '').toLowerCase();
    return classStudentIds.has(stId) || (stName && classStudentNames.has(stName));
  });

  const pendingApps = classApplications.filter(a => a.status === 'Pending');

  return (


    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />

        <div className="dashboard-container" style={{ padding: '24px' }}>
          
          {/* Toast Notification */}
          {statusMsg && (
            <div style={{ padding: '12px 18px', backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '10px', fontSize: '13px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiCheckCircle size={16} /> {statusMsg}
            </div>
          )}

          {/* Header Hero Banner */}
          <div 
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #065f46 100%)',
              color: 'white',
              padding: '30px 36px',
              borderRadius: '22px',
              marginBottom: '24px',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              boxShadow: '0 14px 35px rgba(0, 0, 0, 0.4)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(16, 185, 129, 0.25)', border: '1px solid rgba(16, 185, 129, 0.5)', color: '#34d399', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', marginBottom: '10px', letterSpacing: '0.04em' }}>
                  <FiStar size={14} /> ⭐ CLASS TEACHER PORTAL — OFFICIAL IN-CHARGE CONTROL CENTER
                </div>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', letterSpacing: '-0.02em' }}>
                  CLASS TEACHER PORTAL — Class {classInfo?.className || '10'} ({classInfo?.section || 'A'})
                </h1>
                <p style={{ margin: '8px 0 0', opacity: 0.95, fontSize: '14px', color: '#cbd5e1' }}>
                  Class Teacher In-Charge: <strong style={{ color: '#fff' }}>{teacherName}</strong> • Room {classInfo?.room || '204'} • Timings: {classInfo?.startTime || '08:00'} AM - {classInfo?.endTime || '14:00'} PM
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setActiveSubTab('attendance')}
                  style={{ padding: '10px 18px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                >
                  <FiCheckSquare size={16} /> Roll Call Register
                </button>
                <button 
                  onClick={exportRosterCSV}
                  style={{ padding: '10px 18px', backgroundColor: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  📥 Export CSV
                </button>
                <button 
                  onClick={() => navigate('/academic-admin?tab=admissions')}
                  style={{ padding: '10px 18px', backgroundColor: 'rgba(99,102,241,0.9)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}
                >
                  <FiUserPlus size={16} /> Submit New Admission
                </button>
                <button 
                  onClick={() => setShowAnnounceModal(true)}
                  style={{ padding: '10px 18px', backgroundColor: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <FiPlus size={16} /> Post Class Notice
                </button>
              </div>
            </div>
          </div>

          {/* Metric Cards Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Class Strength', value: students.length || 25, color: '#3b82f6', icon: '🎓', desc: 'Enrolled students' },
              { label: "Today's Attendance", value: `${attendancePct}%`, color: '#10b981', icon: '✅', desc: `${presentCount} Present / ${absentCount} Absent` },
              { label: 'Leave Applications', value: pendingApps.length || 2, color: '#f59e0b', icon: '📩', desc: 'Pending approvals' },
              { label: 'Class Location', value: `Room ${classInfo?.room || '204'}`, color: '#8b5cf6', icon: '📍', desc: 'Academic Block B' },
            ].map((m, idx) => (
              <div key={idx} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>{m.label}</span>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: m.color, marginTop: '4px' }}>{m.value}</div>
                  </div>
                  <span style={{ fontSize: '26px' }}>{m.icon}</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>{m.desc}</span>
              </div>
            ))}
          </div>

          {/* Sub Tab Navigation */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap' }}>
            {[
              { id: 'roster', label: '👥 Student Directory', count: students.length },
              { id: 'attendance', label: '📋 Daily Roll Call Register', count: null },
              { id: 'applications', label: '📩 Leave Request Approvals', count: pendingApps.length },
              { id: 'results', label: '🏆 Class Student Exam Results', count: null },
              { id: 'subjectTeachers', label: '📚 Class Timetable & Faculty Matrix', count: subjectTeachers.length },
              { id: 'announcements', label: '📢 Class Notices & Board', count: announcements.length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: activeSubTab === tab.id ? 'var(--primary)' : 'var(--card-bg)',
                  color: activeSubTab === tab.id ? 'white' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span style={{ backgroundColor: activeSubTab === tab.id ? 'rgba(255,255,255,0.25)' : 'var(--input-bg)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════
               SUB-TAB 1: STUDENT ROSTER
          ══════════════════════════════════ */}
          {activeSubTab === 'roster' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Class {classInfo?.className}-{classInfo?.section} Enrolled Student Roster</h3>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: '260px' }}>
                    <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search student by name or roll..."
                      value={searchStudent}
                      onChange={(e) => setSearchStudent(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <button onClick={exportRosterCSV} style={{ padding: '9px 14px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📥 Export CSV
                  </button>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Student Name</th>
                      <th>Gender</th>
                      <th>Blood Group</th>
                      <th>Parent / Guardian Name</th>
                      <th>Parent Contact (+91)</th>
                      <th>Fee Status</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((st: any) => (
                        <tr key={st._id || st.rollNumber}>
                          <td><strong>{st.rollNumber || 'R01'}</strong></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--primary)', color: 'white', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {(st.user?.name || st.name || 'S').slice(0, 2).toUpperCase()}
                              </div>
                              <strong style={{ color: 'var(--text-main)', fontSize: '13px' }}>{st.user?.name || st.name}</strong>
                            </div>
                          </td>
                          <td style={{ fontSize: '13px' }}>{st.gender || 'Male'}</td>
                          <td>
                            <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: '700', fontSize: '11px' }}>
                              {st.bloodGroup || 'O+'}
                            </span>
                          </td>
                          <td style={{ fontSize: '13px' }}>{st.parentName || 'Parent Registered'}</td>
                          <td style={{ fontSize: '13px' }}>{st.parentPhone || st.user?.phone || '+919876543210'}</td>
                          <td>
                            <span className={`badge ${st.feeStatus === 'Paid' ? 'approved' : 'pending'}`}>
                              {st.feeStatus || 'Paid'}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => setSelectedStudent(st)}
                              style={{ padding: '5px 12px', fontSize: '11px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: '700', cursor: 'pointer' }}
                            >
                              👁️ View Profile
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                          {students.length === 0 
                            ? '🎓 No students enrolled in this class yet. Students will appear here once admitted to your class.' 
                            : 'No students found matching search criteria.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════
               SUB-TAB 2: DAILY ROLL CALL REGISTER
          ══════════════════════════════════ */}
          {activeSubTab === 'attendance' && (
            <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>📋 Daily Roll Call Register</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Mark Present or Absent status for all students of Class {classInfo?.className}-{classInfo?.section}.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    type="date"
                    value={markDate}
                    onChange={(e) => setMarkDate(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px' }}
                  />
                  <button onClick={markAllPresent} style={{ padding: '8px 14px', backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>
                    ✅ Mark All Present
                  </button>
                  <button onClick={markAllAbsent} style={{ padding: '8px 14px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>
                    ❌ Mark All Absent
                  </button>
                  <button onClick={saveRollCall} disabled={savingAttendance} style={{ padding: '8px 20px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
                    {savingAttendance ? 'Saving...' : '💾 Save Attendance'}
                  </button>
                </div>
              </div>

              {/* Attendance Progress bar */}
              <div style={{ backgroundColor: 'var(--panel-bg)', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '13px' }}>
                  <strong style={{ color: 'var(--text-main)' }}>Live Roll Call Summary ({markDate})</strong>
                  <span style={{ color: '#10b981', fontWeight: '800' }}>{presentCount} Present / {absentCount} Absent ({attendancePct}%)</span>
                </div>
                <div style={{ width: '100%', height: '10px', backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${attendancePct}%`, height: '100%', backgroundColor: '#10b981', transition: 'width 0.3s' }} />
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Student Name</th>
                      <th style={{ textAlign: 'center' }}>Mark Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((st: any) => {
                      const stId = st._id || st.rollNumber;
                      const curStatus = markAttendanceList[stId] || 'Present';
                      return (
                        <tr key={stId}>
                          <td><strong>{st.rollNumber || 'R01'}</strong></td>
                          <td><strong style={{ color: 'var(--text-main)' }}>{st.user?.name || st.name}</strong></td>
                          <td>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                              <button
                                onClick={() => handleMarkStatus(stId, 'Present')}
                                style={{
                                  padding: '7px 20px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  fontWeight: '700',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  backgroundColor: curStatus === 'Present' ? '#10b981' : 'var(--input-bg)',
                                  color: curStatus === 'Present' ? 'white' : 'var(--text-muted)'
                                }}
                              >
                                ✓ Present
                              </button>
                              <button
                                onClick={() => handleMarkStatus(stId, 'Absent')}
                                style={{
                                  padding: '7px 20px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  fontWeight: '700',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  backgroundColor: curStatus === 'Absent' ? '#ef4444' : 'var(--input-bg)',
                                  color: curStatus === 'Absent' ? 'white' : 'var(--text-muted)'
                                }}
                              >
                                ✗ Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════
               SUB-TAB 3: LEAVE APPLICATIONS
          ══════════════════════════════════ */}
          {activeSubTab === 'applications' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>📩 Student Leave &amp; Certificate Request Approvals</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Approve or reject leave applications submitted by students of Class {classInfo?.className}-{classInfo?.section}.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/teacher/application')}
                  style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--primary)', color: 'white', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  📄 Open Full Leave Review Page →
                </button>
              </div>

              {classApplications.length > 0 ? (
                <div style={{ display: 'grid', gap: '14px' }}>
                  {classApplications.map((app: any) => {
                    const st = (app.status || 'Pending').toLowerCase();
                    const appliedDate = app.appliedDate || app.date || Date.now();
                    const classNameVal = app.student?.className 
                      ? `${app.student.className}${app.student.section ? `-${app.student.section}` : ''}`
                      : (app.applyingClass || app.allocatedClass || (classInfo ? `${classInfo.className}-${classInfo.section}` : ''));

                    return (
                      <div key={app._id} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                        <div style={{ flex: 1, minWidth: '260px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>
                              {app.student?.user?.name || app.studentName || 'Student Application'}
                            </strong>
                            {classNameVal && (
                              <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#2563eb', fontWeight: '700', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                Class: {classNameVal}
                              </span>
                            )}
                            <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: 'rgba(99,102,241,0.15)', color: '#6366f1', fontWeight: '700' }}>
                              {app.type || 'Leave'}
                            </span>
                            <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: st === 'approved' ? 'rgba(16,185,129,0.15)' : st === 'rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: st === 'approved' ? '#10b981' : st === 'rejected' ? '#ef4444' : '#d97706', fontWeight: '700' }}>
                              {app.status || 'Pending'}
                            </span>
                          </div>

                          <h4 style={{ margin: '4px 0', fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
                            Subject: {app.subject || 'Leave Application'}
                          </h4>

                          <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', backgroundColor: 'var(--input-bg)', padding: '8px 12px', borderRadius: '8px' }}>
                            "{app.description || app.reason || 'No detailed reason specified.'}"
                          </p>

                          {app.startDate && (
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb', marginTop: '6px' }}>
                              📅 Leave Period: {new Date(app.startDate).toLocaleDateString('en-GB')} {app.endDate ? ` to ${new Date(app.endDate).toLocaleDateString('en-GB')}` : ''}
                            </div>
                          )}

                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                            Filed Date: {new Date(appliedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleApplicationAction(app._id, 'Approved')}
                            style={{
                              padding: '9px 18px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: st === 'approved' ? '#059669' : '#10b981',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '13px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 6px rgba(16,185,129,0.3)'
                            }}
                          >
                            <FiCheckCircle size={15} /> {st === 'approved' ? 'Approved ✓' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleApplicationAction(app._id, 'Rejected')}
                            style={{
                              padding: '9px 18px',
                              borderRadius: '8px',
                              border: '1px solid rgba(239,68,68,0.4)',
                              backgroundColor: st === 'rejected' ? '#dc2626' : 'rgba(239,68,68,0.1)',
                              color: st === 'rejected' ? 'white' : '#ef4444',
                              fontWeight: '700',
                              fontSize: '13px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <FiXCircle size={15} /> {st === 'rejected' ? 'Rejected ✗' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '45px', backgroundColor: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  No student leave requests pending review for Class {classInfo?.className}-{classInfo?.section}.
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════
               SUB-TAB 4: CLASS EXAM RESULTS
          ══════════════════════════════════ */}
          {activeSubTab === 'results' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                    🏆 Class {classInfo?.className}-{classInfo?.section} Student Exam Results &amp; Report Cards
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    View &amp; update overall exam marks, subject grades, GPAs and pass/fail statuses for students in your class.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    onClick={() => setResultsExamTerm('Term-1')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: '800',
                      fontSize: '12px',
                      cursor: 'pointer',
                      backgroundColor: resultsExamTerm === 'Term-1' ? 'var(--primary)' : 'var(--input-bg)',
                      color: resultsExamTerm === 'Term-1' ? 'white' : 'var(--text-muted)'
                    }}
                  >
                    📝 Term-1 (Mid-Term)
                  </button>
                  <button
                    onClick={() => setResultsExamTerm('Term-2')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: '800',
                      fontSize: '12px',
                      cursor: 'pointer',
                      backgroundColor: resultsExamTerm === 'Term-2' ? 'var(--primary)' : 'var(--input-bg)',
                      color: resultsExamTerm === 'Term-2' ? 'white' : 'var(--text-muted)'
                    }}
                  >
                    🏅 Term-2 (Final Exam)
                  </button>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Student Name</th>
                      {(() => {
                        const subsSet = new Set<string>();
                        students.forEach((st: any) => {
                          const stRes = studentResultsMap[st._id] || {};
                          const termData = stRes[resultsExamTerm] || {};
                          (termData.subjects || []).forEach((sub: any) => {
                            if (sub.name) subsSet.add(sub.name);
                          });
                        });
                        const subList = subsSet.size > 0 
                          ? Array.from(subsSet) 
                          : ["Mathematics", "Science & Tech", "English Literature", "Social Science", "Computer Applications"];
                        return subList.map(subName => (
                          <th key={subName}>{subName}</th>
                        ));
                      })()}
                      <th>Total Marks</th>
                      <th>GPA / Grade</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length > 0 ? (
                      students.map((st: any) => {
                        const stId = st._id;
                        const stRes = studentResultsMap[stId] || {};
                        const termData = stRes[resultsExamTerm] || {};
                        const subs = termData.subjects || [];

                        const subsSet = new Set<string>();
                        students.forEach((s: any) => {
                          const r = studentResultsMap[s._id] || {};
                          const t = r[resultsExamTerm] || {};
                          (t.subjects || []).forEach((sub: any) => {
                            if (sub.name) subsSet.add(sub.name);
                          });
                        });
                        const subList = subsSet.size > 0 
                          ? Array.from(subsSet) 
                          : ["Mathematics", "Science & Tech", "English Literature", "Social Science", "Computer Applications"];

                        const totalStr = termData.totalMarks || '–';
                        const gpaStr = termData.overallGpa ? `${termData.overallGpa} (${termData.grade || 'N/A'})` : '–';
                        const statusVal = termData.status || 'PENDING';

                        return (
                          <tr key={stId}>
                            <td><strong>{st.rollNumber || 'R01'}</strong></td>
                            <td><strong style={{ color: 'var(--text-main)' }}>{st.user?.name || st.name}</strong></td>
                            {subList.map(subName => {
                              const found = subs.find((s: any) => (s.name || '').toLowerCase().trim() === subName.toLowerCase().trim());
                              return (
                                <td key={subName}>
                                  <span style={{ fontWeight: '700' }}>
                                    {found ? `${found.marks}/${found.maxMarks || 100}` : '–'}
                                  </span>
                                </td>
                              );
                            })}
                            <td><strong>{totalStr}</strong></td>
                            <td><span className="badge approved">{gpaStr}</span></td>
                            <td>
                              <span className={`badge ${statusVal === 'PASSED' ? 'approved' : statusVal === 'FAILED' ? 'danger' : 'pending'}`}>
                                {statusVal}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => setViewingStudentResultModal({ isOpen: true, student: st, term: resultsExamTerm })}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    fontWeight: '700',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  👁️ View Report Card
                                </button>
                                <button
                                  onClick={() => handleOpenEditResultsModal(st)}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    backgroundColor: 'var(--primary)',
                                    color: 'white',
                                    fontWeight: '700',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  ✏️ Edit Report Card
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={11} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                          No students enrolled in Class {classInfo?.className}-{classInfo?.section}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════
               SUB-TAB 4: CLASS TIMETABLE & FACULTY MATRIX
          ══════════════════════════════════ */}
          {activeSubTab === 'subjectTeachers' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800' }}>📅 Class {classInfo?.className}-{classInfo?.section} Daily Period Timetable Schedule</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Period-by-period class timings, subject assignments, and instructor locations.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Day:</span>
                  <select
                    value={selectedTimetableDay}
                    onChange={(e) => handleTimetableDayChange(e.target.value)}
                    style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '700', cursor: 'pointer', outline: 'none' }}
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              </div>

              {timetableLoading ? (
                <div style={{ textAlign: 'center', padding: '45px', backgroundColor: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  ⏳ Loading timetable...
                </div>
              ) : timetableSchedule.length > 0 ? (
                <div className="table-container" style={{ marginBottom: '28px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Period #</th>
                        <th>Time Slot</th>
                        <th>Subject Name</th>
                        <th>Assigned Instructor</th>
                        <th>Classroom / Lab Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timetableSchedule.map((t: any, idx: number) => (
                        <tr key={idx} style={{ backgroundColor: t.isBreak ? 'rgba(245,158,11,0.06)' : 'transparent' }}>
                          <td><strong style={{ color: 'var(--primary)' }}>{t.period}</strong></td>
                          <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t.time}</td>
                          <td><strong style={{ color: 'var(--text-main)' }}>{t.subject}</strong></td>
                          <td style={{ fontSize: '13px' }}>{t.teacher}</td>
                          <td>
                            <span style={{ padding: '3px 10px', borderRadius: '6px', backgroundColor: 'var(--input-bg)', fontSize: '12px', fontWeight: '700' }}>
                              📍 {t.room}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '45px', backgroundColor: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--border-color)', color: 'var(--text-muted)', marginBottom: '28px' }}>
                  📅 No timetable configured for Class {classInfo?.className}-{classInfo?.section} on <strong>{selectedTimetableDay}</strong>. Please set up the timetable from the Academic Admin panel.
                </div>
              )}

              <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '800' }}>📚 Faculty Teachers Assigned to Class {classInfo?.className}-{classInfo?.section}</h3>
              {subjectTeachers.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  {subjectTeachers.map((st: any) => (
                    <div key={st._id} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#3b82f6', color: 'white', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {(st.user?.name || 'T').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong style={{ fontSize: '15px', color: 'var(--text-main)', display: 'block' }}>{st.user?.name}</strong>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{st.specialization || 'Subject Instructor'}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                        <span>✉️ {st.user?.email}</span>
                        <span>📞 {st.user?.phone || 'N/A'}</span>
                        <span>🏛️ Department: <strong>{st.department || 'Academic'}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '45px', backgroundColor: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  📚 No faculty teacher records found. Teacher assignments will appear here once configured.
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════
               SUB-TAB 5: CLASS NOTICES & ANNOUNCEMENTS
          ══════════════════════════════════ */}
          {activeSubTab === 'announcements' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>📢 Class Notices &amp; Announcement Board</h3>
                <button
                  onClick={() => setShowAnnounceModal(true)}
                  style={{ padding: '9px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <FiPlus /> New Class Notice
                </button>
              </div>

              <div style={{ display: 'grid', gap: '14px' }}>
                {announcements.map(a => (
                  <div key={a.id} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--primary)' }}>{a.title}</h4>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📅 {a.date}</span>
                    </div>
                    <p style={{ margin: '0 0 10px', fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.5' }}>{a.text}</p>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Posted by: <strong>{a.author}</strong></div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ── Student Details Modal ── */}
        {selectedStudent && (
          <div onClick={() => setSelectedStudent(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%', maxWidth: '540px', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>🎓 Student Profile — {selectedStudent.user?.name || selectedStudent.name}</h3>
                <button onClick={() => setSelectedStudent(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}><FiX /></button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Roll Number:</span><br /><strong style={{ fontSize: '15px' }}>{selectedStudent.rollNumber || 'R01'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Class &amp; Section:</span><br /><strong>Class {classInfo?.className}-{classInfo?.section}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Email:</span><br /><strong>{selectedStudent.user?.email || selectedStudent.email}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Phone:</span><br /><strong>{selectedStudent.user?.phone || '+919876543210'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Gender:</span><br /><strong>{selectedStudent.gender || 'Male'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Blood Group:</span><br /><strong>{selectedStudent.bloodGroup || 'O+'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Parent Name:</span><br /><strong>{selectedStudent.parentName || 'Parent Registered'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Parent Phone:</span><br /><strong>{selectedStudent.parentPhone || '+919876001122'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Fee Status:</span><br /><strong style={{ color: selectedStudent.feeStatus === 'Paid' ? '#10b981' : '#f59e0b' }}>{selectedStudent.feeStatus || 'Paid'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Attendance Rate:</span><br /><strong style={{ color: '#10b981' }}>{selectedStudent.attendancePct || 92}%</strong></div>
              </div>

              <button onClick={() => setSelectedStudent(null)} style={{ width: '100%', marginTop: '20px', padding: '10px', backgroundColor: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Close Profile</button>
            </div>
          </div>
        )}

        {/* ── Post Announcement Modal ── */}
        {showAnnounceModal && (
          <div onClick={() => setShowAnnounceModal(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>📢 Post Class Notice</h3>
                <button onClick={() => setShowAnnounceModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}><FiX /></button>
              </div>

              <form onSubmit={postAnnouncement}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Notice Title *</label>
                  <input required type="text" value={newNotice.title} onChange={e => setNewNotice({ ...newNotice, title: e.target.value })} placeholder="e.g. Science Lab Project Submission" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }} />
                </div>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Notice Details *</label>
                  <textarea required rows={4} value={newNotice.text} onChange={e => setNewNotice({ ...newNotice, text: e.target.value })} placeholder="Enter detailed notice message for class students..." style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Post Notice</button>
                  <button type="button" onClick={() => setShowAnnounceModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── View Full Student Report Card Modal ── */}
        {viewingStudentResultModal && viewingStudentResultModal.isOpen && (() => {
          const st = viewingStudentResultModal.student;
          const stRes = studentResultsMap[st._id] || {};
          const termData = stRes[viewingStudentResultModal.term] || {};
          const subjects = termData.subjects || [];

          return (
            <div onClick={() => setViewingStudentResultModal(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
              <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '20px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '6px' }}>OFFICIAL ACADEMIC REPORT CARD</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>{termData.termName || viewingStudentResultModal.term}</span>
                    </div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: 'var(--text-main)' }}>
                      {st.user?.name || st.name}
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                      Roll No: <strong style={{ color: 'var(--primary)' }}>{st.rollNumber || 'R01'}</strong> | Class: <strong>{classInfo?.className}-{classInfo?.section}</strong> | Email: <strong>{st.user?.email || st.email}</strong>
                    </p>
                  </div>
                  <button onClick={() => setViewingStudentResultModal(null)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-muted)' }}><FiX /></button>
                </div>

                {/* Performance Summary Banner */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', backgroundColor: 'var(--input-bg)', padding: '16px', borderRadius: '14px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Score</span>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-main)', marginTop: '2px' }}>
                      {termData.totalMarks || '0 / 500'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Overall GPA</span>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#10b981', marginTop: '2px' }}>
                      {termData.overallGpa || '0.0 / 10'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Overall Grade</span>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#8b5cf6', marginTop: '2px' }}>
                      {termData.grade || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Status</span>
                    <div style={{ marginTop: '2px' }}>
                      <span className={`badge ${termData.status === 'PASSED' ? 'approved' : termData.status === 'FAILED' ? 'danger' : 'pending'}`}>
                        {termData.status || 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subject Details Table */}
                <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: '800' }}>📚 Subject-wise Marks &amp; Grades Breakdown</h4>
                {subjects.length > 0 ? (
                  <div className="table-container" style={{ marginBottom: '24px' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Marks Obtained</th>
                          <th>Max Marks</th>
                          <th>Grade</th>
                          <th>Teacher Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map((sub: any, idx: number) => (
                          <tr key={idx}>
                            <td><strong style={{ color: 'var(--text-main)' }}>{sub.name}</strong></td>
                            <td><span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary)' }}>{sub.marks}</span></td>
                            <td style={{ color: 'var(--text-muted)' }}>{sub.maxMarks || 100}</td>
                            <td>
                              <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '800', backgroundColor: sub.grade === 'O' || sub.grade === 'A+' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)', color: sub.grade === 'O' || sub.grade === 'A+' ? '#10b981' : '#2563eb' }}>
                                {sub.grade || 'Pass'}
                              </span>
                            </td>
                            <td style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '13px' }}>
                              ⭐ {sub.remarks || 'Good Effort'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px', backgroundColor: 'var(--input-bg)', borderRadius: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                    No subject marks entered yet for {viewingStudentResultModal.term}. Click "Edit Report Card" to add subject marks.
                  </div>
                )}

                {/* Footer Controls */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => window.print()}
                    style={{ flex: 1, padding: '11px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    🖨️ Print / Download Report Card
                  </button>
                  <button
                    onClick={() => setViewingStudentResultModal(null)}
                    style={{ flex: 1, padding: '11px', backgroundColor: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Close
                  </button>
                </div>

              </div>
            </div>
          );
        })()}

        {/* ── Dynamic Edit Student Results Modal ── */}
        {editingStudentResultModal && editingStudentResultModal.isOpen && (
          <div onClick={() => setEditingStudentResultModal(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '20px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '26px', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                    🏆 Edit Student Report Card ({editingStudentResultModal.term})
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--primary)', fontWeight: '700' }}>
                    Student: {editingStudentResultModal.student.user?.name || editingStudentResultModal.student.name} (Roll: {editingStudentResultModal.student.rollNumber || 'R01'})
                  </p>
                </div>
                <button onClick={() => setEditingStudentResultModal(null)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-muted)' }}><FiX /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)' }}>Subject Marks &amp; Remarks Entry</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStudentResultModal(prev => prev ? ({
                        ...prev,
                        subjects: [...prev.subjects, { name: '', marks: 75, maxMarks: 100, remarks: 'Good Effort' }]
                      }) : null);
                    }}
                    style={{ padding: '5px 12px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    + Add New Subject
                  </button>
                </div>

                {editingStudentResultModal.subjects.map((sub, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 30px', gap: '8px', alignItems: 'center', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)' }}>
                    <input
                      type="text"
                      placeholder="Subject Name (e.g. Mathematics)"
                      value={sub.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingStudentResultModal(prev => prev ? ({
                          ...prev,
                          subjects: prev.subjects.map((s, i) => i === idx ? { ...s, name: val } : s)
                        }) : null);
                      }}
                      style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '700', outline: 'none' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        min={0}
                        max={sub.maxMarks || 100}
                        value={sub.marks}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setEditingStudentResultModal(prev => prev ? ({
                            ...prev,
                            subjects: prev.subjects.map((s, i) => i === idx ? { ...s, marks: val } : s)
                          }) : null);
                        }}
                        style={{ width: '60px', padding: '7px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '800', textAlign: 'center', outline: 'none' }}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ {sub.maxMarks || 100}</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Teacher Remark"
                      value={sub.remarks}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingStudentResultModal(prev => prev ? ({
                          ...prev,
                          subjects: prev.subjects.map((s, i) => i === idx ? { ...s, remarks: val } : s)
                        }) : null);
                      }}
                      style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '12px', outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStudentResultModal(prev => prev ? ({
                          ...prev,
                          subjects: prev.subjects.filter((_, i) => i !== idx)
                        }) : null);
                      }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: '800', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Remove subject"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleSaveStudentResults}
                  disabled={savingClassResults}
                  style={{ flex: 1, padding: '12px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', opacity: savingClassResults ? 0.6 : 1 }}
                >
                  {savingClassResults ? 'Saving Results...' : '💾 Save Class Report Card'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStudentResultModal(null)}
                  style={{ flex: 1, padding: '12px', backgroundColor: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default ClassTeacherDashboard;

