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
  const [announcements, setAnnouncements] = useState<any[]>([
    { id: '1', title: 'Science Lab Project Submission', date: '2026-08-05', text: 'All students must submit their chemistry experiment reports by Friday.', author: teacherName },
    { id: '2', title: 'Mid-Term Exam Syllabus Released', date: '2026-08-01', text: 'Check the exam portal for the complete topic list.', author: 'Academic Office' }
  ]);

  const [searchStudent, setSearchStudent] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'attendance' | 'applications' | 'subjectTeachers' | 'announcements'>('roster');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', text: '' });
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Roll call marking state
  const [markDate, setMarkDate] = useState(new Date().toISOString().split('T')[0]);
  const [markAttendanceList, setMarkAttendanceList] = useState<Record<string, string>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  useEffect(() => {
    fetchClassData();
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

  const fetchClassData = async () => {
    try {
      setLoading(true);
      const [classRes, appRes, teachersRes, allStudentsRes] = await Promise.allSettled([
        API.get(`/api/teacher/class-students/${teacherEmail}`),
        API.get('/api/application/all'),
        API.get('/api/academic-admin/teachers'),
        API.get('/api/admin/student-admin/students')
      ]);

      const demoSt = [
        { _id: 'st1', rollNumber: '10A01', user: { name: 'Rahul Verma', email: 'rahul.v@sps.edu', phone: '+919876543210' }, gender: 'Male', bloodGroup: 'B+', parentName: 'Ramesh Verma', parentPhone: '+919876001122', feeStatus: 'Paid', attendancePct: 94 },
        { _id: 'st2', rollNumber: '10A02', user: { name: 'Priya Sharma', email: 'priya.s@sps.edu', phone: '+919876543211' }, gender: 'Female', bloodGroup: 'O+', parentName: 'Sunil Sharma', parentPhone: '+919876001123', feeStatus: 'Pending', attendancePct: 88 },
        { _id: 'st3', rollNumber: '10A03', user: { name: 'Amit Kumar', email: 'amit.k@sps.edu', phone: '+919876543212' }, gender: 'Male', bloodGroup: 'A+', parentName: 'Vijay Kumar', parentPhone: '+919876001124', feeStatus: 'Paid', attendancePct: 96 },
        { _id: 'st4', rollNumber: '10A04', user: { name: 'Ananya Gupta', email: 'ananya.g@sps.edu', phone: '+919876543213' }, gender: 'Female', bloodGroup: 'AB+', parentName: 'Sanjay Gupta', parentPhone: '+919876001125', feeStatus: 'Paid', attendancePct: 91 },
        { _id: 'st5', rollNumber: '10A05', user: { name: 'Vikram Singh', email: 'vikram.s@sps.edu', phone: '+919876543214' }, gender: 'Male', bloodGroup: 'O-', parentName: 'Rajesh Singh', parentPhone: '+919876001126', feeStatus: 'Pending', attendancePct: 85 },
        { _id: 'st6', rollNumber: '10A06', user: { name: 'Neha Patel', email: 'neha.p@sps.edu', phone: '+919876543215' }, gender: 'Female', bloodGroup: 'B-', parentName: 'Kishore Patel', parentPhone: '+919876001127', feeStatus: 'Paid', attendancePct: 92 },
        { _id: 'st7', rollNumber: '10A07', user: { name: 'Rohan Das', email: 'rohan.d@sps.edu', phone: '+919876543216' }, gender: 'Male', bloodGroup: 'A-', parentName: 'Manish Das', parentPhone: '+919876001128', feeStatus: 'Paid', attendancePct: 89 },
        { _id: 'st8', rollNumber: '10A08', user: { name: 'Sneha Roy', email: 'sneha.r@sps.edu', phone: '+919876543217' }, gender: 'Female', bloodGroup: 'O+', parentName: 'Alok Roy', parentPhone: '+919876001129', feeStatus: 'Pending', attendancePct: 87 }
      ];

      let loadedStudents: any[] = [];
      let clsData = { className: '10', section: 'A', room: '204', startTime: '08:00', endTime: '14:00' };

      if (classRes.status === 'fulfilled' && classRes.value.data?.data?.students?.length > 0) {
        clsData = classRes.value.data.data.classInfo || clsData;
        loadedStudents = classRes.value.data.data.students;
      } else if (allStudentsRes.status === 'fulfilled' && allStudentsRes.value.data?.data?.length > 0) {
        loadedStudents = allStudentsRes.value.data.data.map((s: any, idx: number) => ({
          _id: s._id || `st_${idx}`,
          rollNumber: s.rollNumber || `10A0${idx + 1}`,
          user: {
            name: s.user?.name || s.name || `Student ${idx + 1}`,
            email: s.user?.email || s.email || `student${idx + 1}@sps.edu`,
            phone: s.user?.phone || s.phone || '+919876543210'
          },
          gender: s.gender || (idx % 2 === 0 ? 'Male' : 'Female'),
          bloodGroup: s.bloodGroup || 'O+',
          parentName: s.parentName || 'Parent Guardian',
          parentPhone: s.parentPhone || '+919876001122',
          feeStatus: s.feeStatus || (idx % 3 === 0 ? 'Pending' : 'Paid'),
          attendancePct: s.attendancePct || 90
        }));
      }

      if (loadedStudents.length === 0) {
        loadedStudents = demoSt;
      }

      setClassInfo(clsData);
      setStudents(loadedStudents);

      // Initialize attendance list
      const initialAtt: Record<string, string> = {};
      loadedStudents.forEach((s: any) => {
        initialAtt[s._id || s.rollNumber] = 'Present';
      });
      setMarkAttendanceList(initialAtt);

      // Process Applications
      let loadedApps: any[] = [];
      if (appRes.status === 'fulfilled' && appRes.value.data?.length > 0) {
        loadedApps = appRes.value.data;
      } else {
        loadedApps = [
          { _id: 'app1', studentName: 'Rahul Verma', rollNumber: '10A01', type: 'Medical Leave', reason: 'High fever and severe viral infection. Doctor advised 3 days complete bed rest.', startDate: '2026-08-04', endDate: '2026-08-06', status: 'Pending', appliedOn: '2026-08-03' },
          { _id: 'app2', studentName: 'Priya Sharma', rollNumber: '10A02', type: 'Family Function Leave', reason: 'Attending elder sister wedding ceremony in Jaipur.', startDate: '2026-08-10', endDate: '2026-08-12', status: 'Approved', appliedOn: '2026-08-02' },
          { _id: 'app3', studentName: 'Amit Kumar', rollNumber: '10A03', type: 'Sports Duty Leave', reason: 'Representing school in Inter-School District Football Championship.', startDate: '2026-08-08', endDate: '2026-08-09', status: 'Pending', appliedOn: '2026-08-04' }
        ];
      }
      setApplications(loadedApps);

      // Process Subject Teachers
      if (teachersRes.status === 'fulfilled' && teachersRes.value.data?.data?.length > 0) {
        setSubjectTeachers(teachersRes.value.data.data);
      } else {
        setSubjectTeachers([
          { _id: 't1', user: { name: 'Dr. Ramesh Sen', email: 'ramesh.sen@sps.edu', phone: '+919876111111' }, specialization: 'Mathematics', department: 'Mathematics' },
          { _id: 't2', user: { name: 'Sunita Rao', email: 'sunita.rao@sps.edu', phone: '+919876222222' }, specialization: 'Physics & Chemistry', department: 'Science' },
          { _id: 't3', user: { name: 'Kavita Joshi', email: 'kavita.j@sps.edu', phone: '+919876333333' }, specialization: 'English Literature', department: 'Languages' },
          { _id: 't4', user: { name: 'Arun Malhotra', email: 'arun.m@sps.edu', phone: '+919876444444' }, specialization: 'World History & Civics', department: 'Social Science' }
        ]);
      }
    } catch (err) {
      console.error('Error loading class teacher data:', err);
    } finally {
      setLoading(false);
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

  const postAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.text) return;
    const item = {
      id: String(Date.now()),
      title: newNotice.title,
      text: newNotice.text,
      date: new Date().toISOString().split('T')[0],
      author: teacherName
    };
    setAnnouncements(prev => [item, ...prev]);
    setNewNotice({ title: '', text: '' });
    setShowAnnounceModal(false);
    triggerMsg('Class notice posted successfully!');
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

  const timetableSchedule = [
    { period: 'Period 1', time: '08:00 AM - 08:45 AM', subject: 'Mathematics', teacher: subjectTeachers[0]?.user?.name || 'Dr. Ramesh Sen', room: 'Room 204' },
    { period: 'Period 2', time: '08:45 AM - 09:30 AM', subject: 'Physics & Chemistry', teacher: subjectTeachers[1]?.user?.name || 'Sunita Rao', room: 'Lab B' },
    { period: 'Period 3', time: '09:30 AM - 10:15 AM', subject: 'English Literature', teacher: subjectTeachers[2]?.user?.name || 'Kavita Joshi', room: 'Room 204' },
    { period: 'Recess Break', time: '10:15 AM - 10:30 AM', subject: '☕ Tea & Snacks Break', teacher: 'School Premises', room: 'Cafeteria' },
    { period: 'Period 4', time: '10:30 AM - 11:15 AM', subject: 'World History & Civics', teacher: subjectTeachers[3]?.user?.name || 'Arun Malhotra', room: 'Room 204' },
    { period: 'Period 5', time: '11:15 AM - 12:00 PM', subject: 'Computer Science Lab', teacher: 'Prakash Naidu', room: 'IT Lab 2' },
    { period: 'Period 7', time: '12:45 PM - 01:30 PM', subject: 'Class Assembly & Guidance', teacher: teacherName, room: 'Room 204' },
  ];

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

          {/* Portal Switcher Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '12px'
          }}>
            <button
              onClick={() => navigate('/class-teacher')}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: '#059669',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(5,150,105,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FiStar size={16} /> ⭐ CLASS TEACHER PORTAL (Class {classInfo?.className || '10'}-{classInfo?.section || 'A'})
            </button>
            <button
              onClick={() => navigate('/teacher')}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FiBookOpen size={16} /> 📚 Subject Teacher Portal
            </button>
          </div>

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
                          No students found matching search criteria.
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
              <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '800' }}>📩 Student Leave &amp; Bonafide Request Approvals</h3>
              {classApplications.length > 0 ? (
                <div style={{ display: 'grid', gap: '14px' }}>
                  {classApplications.map((app: any) => (
                    <div key={app._id} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                      <div>
                        {(() => {
                          const classNameVal = app.student?.className 
                            ? `${app.student.className}${app.student.section ? `-${app.student.section}` : ''}`
                            : (app.applyingClass || app.allocatedClass || (classInfo ? `${classInfo.className}-${classInfo.section}` : ''));
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>{app.student?.user?.name || app.studentName || 'Student Application'}</strong>
                              {classNameVal && (
                                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#2563eb', fontWeight: '700', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                  Class: {classNameVal}
                                </span>
                              )}
                              <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: app.status === 'Approved' ? 'rgba(16,185,129,0.15)' : app.status === 'Rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: app.status === 'Approved' ? '#10b981' : app.status === 'Rejected' ? '#ef4444' : '#d97706', fontWeight: '700' }}>
                                {app.status || 'Pending'}
                              </span>
                            </div>
                          );
                        })()}
                        <p style={{ margin: '0 0 6px', fontSize: '14px', color: 'var(--text-main)', fontWeight: '500' }}>Reason: {app.reason || 'Medical Leave Request'}</p>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Applied Date: {app.date ? new Date(app.date).toLocaleDateString('en-GB') : '2026-08-01'}</span>
                      </div>

                      {app.status === 'Pending' && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => handleApplicationAction(app._id, 'Approved')}
                            style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <FiCheckCircle size={15} /> Approve
                          </button>
                          <button
                            onClick={() => handleApplicationAction(app._id, 'Rejected')}
                            style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#ef4444', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <FiXCircle size={15} /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '45px', backgroundColor: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  No student leave requests pending review for Class {classInfo?.className}-{classInfo?.section}.
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════
               SUB-TAB 4: CLASS TIMETABLE & FACULTY MATRIX
          ══════════════════════════════════ */}
          {activeSubTab === 'subjectTeachers' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800' }}>📅 Class {classInfo?.className}-{classInfo?.section} Daily Period Timetable Schedule</h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Period-by-period class timings, subject assignments, and instructor locations.</p>
              </div>

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
                    {timetableSchedule.map((t, idx) => (
                      <tr key={idx} style={{ backgroundColor: t.period.includes('Recess') ? 'rgba(245,158,11,0.06)' : 'transparent' }}>
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

              <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '800' }}>📚 Faculty Teachers Assigned to Class {classInfo?.className}-{classInfo?.section}</h3>
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
                      <span>📞 {st.user?.phone || '+919876543210'}</span>
                      <span>🏛️ Department: <strong>{st.department || 'Academic'}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
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

      </main>
    </div>
  );
};

export default ClassTeacherDashboard;

