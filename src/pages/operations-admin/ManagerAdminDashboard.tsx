import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import {
  FiUsers, FiBookOpen, FiUserCheck, FiTrendingUp,
  FiDollarSign, FiCalendar, FiArrowRight, FiShield,
  FiFileText, FiCheckSquare, FiEdit3, FiAward, FiUserPlus,
  FiLayers, FiActivity, FiSearch
} from 'react-icons/fi';
import API from '../../api/axios';
import { useSocket } from '../../context/SocketContext';

const ManagerAdminDashboard: React.FC = () => {
  const { onEvent } = useSocket();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'teacher' | 'student' | 'finance'>('all');
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalApplications: 0,
    totalFeeCollected: 0,
    pendingAdmissions: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const adminName = localStorage.getItem('userName') || 'Manager Admin';

  useEffect(() => {
    fetchStats();
    const unsubscribe = onEvent('FEE_CHANGED', () => {
      fetchStats();
      if (window.showToast) {
        window.showToast("⚡ Real-time Update: Fee records updated!", "info");
      }
    });
    return () => unsubscribe();
  }, [onEvent]);

  const fetchStats = async () => {
      try {
        const [studentsRes, teachersRes, classesRes, feesRes, admissionsRes] = await Promise.allSettled([
          API.get('/api/admin/student-admin/students'),
          API.get('/api/academic-admin/teachers'),
          API.get('/api/academic-admin/classes'),
          API.get('/api/finance/all'),
          API.get('/api/admin/student-admin/admissions'),
        ]);

        const students = studentsRes.status === 'fulfilled' ? (studentsRes.value.data?.data || []) : [];
        const teachers = teachersRes.status === 'fulfilled' ? (teachersRes.value.data?.data || []) : [];
        const classes = classesRes.status === 'fulfilled' ? (classesRes.value.data?.data || []) : [];
        const fees = feesRes.status === 'fulfilled' ? (feesRes.value.data || []) : [];
        const admissions = admissionsRes.status === 'fulfilled' ? (admissionsRes.value.data?.data || []) : [];

        const feeCollected = fees.reduce((sum: number, f: any) => sum + (Number(f.paidAmount) || 0), 0);
        const pending = admissions.filter((a: any) => a.status === 'Pending').length;

        setStats({
          totalStudents: students.length,
          totalTeachers: teachers.length,
          totalClasses: classes.length,
          totalApplications: admissions.length,
          totalFeeCollected: feeCollected,
          pendingAdmissions: pending,
        });
      } catch (_) {}
    };


  const kpiCards = [
    { label: 'Total Faculty', value: `${stats.totalTeachers}`, sub: `Across ${stats.totalClasses} active classes`, icon: <FiBookOpen size={22} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', path: '/academic-admin/teachers' },
    { label: 'Total Students', value: `${stats.totalStudents}`, sub: `${stats.pendingAdmissions} pending admissions`, icon: <FiUsers size={22} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', path: '/academic-admin?tab=profiles' },
    { label: 'Fee Collected', value: stats.totalFeeCollected > 0 ? `₹${(stats.totalFeeCollected/1000).toFixed(1)}K` : '₹0', sub: 'Total payments received', icon: <FiDollarSign size={22} />, color: '#10b981', bg: 'rgba(16,185,129,0.12)', path: '/finance-admin' },
    { label: 'Active Classes', value: `${stats.totalClasses}`, sub: 'Sections & timings configured', icon: <FiCalendar size={22} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', path: '/academic-admin/classes' },
  ];

  const teacherPortalLinks = [
    { label: 'Teacher Admin Dashboard', icon: <FiBookOpen size={15} />, path: '/academic-admin', desc: 'Main academic overview & metrics' },
    { label: 'Faculty & Teacher Roster', icon: <FiUsers size={15} />, path: '/academic-admin/teachers', desc: 'Teacher profiles & subject assignments' },
    { label: 'Class Teacher Allocations', icon: <FiCalendar size={15} />, path: '/academic-admin/classes', desc: 'Class in-charges, timings & sections' },
    { label: 'Subject Syllabus Catalog', icon: <FiFileText size={15} />, path: '/academic-admin/subjects', desc: 'Curriculum, codes & departments' },
    { label: 'Attendance Management', icon: <FiCheckSquare size={15} />, path: '/academic-admin/attendance', desc: 'Daily attendance logs & records' },
    { label: 'Exam Results Portal', icon: <FiAward size={15} />, path: '/academic-admin/results', desc: 'Grade entry, marksheets & results' },
    { label: 'Class Teacher View', icon: <FiUserCheck size={15} />, path: '/class-teacher', desc: 'Class in-charge interface preview' },
    { label: 'Subject Teacher View', icon: <FiEdit3 size={15} />, path: '/teacher', desc: 'Faculty mark entry portal view' },
  ];

  const studentPortalLinks = [
    { label: 'Student Management Dashboard', icon: <FiUsers size={15} />, path: '/academic-admin?tab=profiles', desc: 'Student lifecycle command center' },
    { label: 'Admissions & Audit Desk', icon: <FiUserPlus size={15} />, path: '/academic-admin?tab=admissions', desc: 'Application reviews & approvals' },
    { label: 'Student Profiles Roster', icon: <FiFileText size={15} />, path: '/academic-admin?tab=profiles', desc: 'Complete directory & parent contacts' },
    { label: 'Class Section Allocation', icon: <FiLayers size={15} />, path: '/academic-admin?tab=allocation', desc: 'Assign roll numbers & sections' },
    { label: 'Annual Batch Promotions', icon: <FiTrendingUp size={15} />, path: '/academic-admin?tab=promotions', desc: 'Promote to next academic grade' },
    { label: 'Student / Parent Portal', icon: <FiUserCheck size={15} />, path: '/student', desc: 'Student & parent dashboard view' },
  ];

  const quickActions = [
    { label: 'Fee & Billing Portal', desc: 'Fee collection, dues & invoice management', icon: <FiDollarSign size={18} />, path: '/finance-admin', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    { label: 'Exam Timetables', desc: 'Exam calendar & seating arrangements', icon: <FiCalendar size={18} />, path: '/exams', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    { label: 'Teacher Workload & Tasks', desc: 'Faculty assignments & homework tasks', icon: <FiEdit3 size={18} />, path: '/teacher/assignments', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
    { label: 'Leave Applications Desk', desc: 'Staff leave reviews & approvals', icon: <FiFileText size={18} />, path: '/teacher/application', color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
    { label: 'Daily Attendance Manager', desc: 'Mark student & staff attendance daily', icon: <FiCheckSquare size={18} />, path: '/teacher/attendanceMark', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
    { label: 'Super Admin Panel', desc: 'System settings, users & audit logs', icon: <FiShield size={18} />, path: '/super-admin', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  ];

  const filteredTeacherLinks = teacherPortalLinks.filter(l =>
    !searchQuery || l.label.toLowerCase().includes(searchQuery.toLowerCase()) || l.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredStudentLinks = studentPortalLinks.filter(l =>
    !searchQuery || l.label.toLowerCase().includes(searchQuery.toLowerCase()) || l.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredQuickActions = quickActions.filter(a =>
    !searchQuery || a.label.toLowerCase().includes(searchQuery.toLowerCase()) || a.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'all', label: 'All Operations', emoji: '🌐' },
    { id: 'teacher', label: 'Teacher Admin', emoji: '📚' },
    { id: 'student', label: 'Student Admin', emoji: '🎓' },
    { id: 'finance', label: 'Finance & Desks', emoji: '💰' },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div style={{ padding: '0 0 32px 0' }}>

          {/* ── Hero Header ─────────────────────────────────────────────── */}
          <div style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #2d1b6e 50%, #1e3a5f 100%)',
            borderRadius: '20px',
            padding: '32px 36px',
            marginBottom: '24px',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(139,92,246,0.3)'
          }}>
            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(139,92,246,0.2)', filter: 'blur(60px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-40px', left: '20%', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(59,130,246,0.15)', filter: 'blur(50px)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ background: 'rgba(139,92,246,0.3)', color: '#c4b5fd', fontSize: '11px', fontWeight: '800', padding: '4px 14px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.08em', border: '1px solid rgba(139,92,246,0.4)' }}>
                    👔 Manager Admin Portal
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '500' }}>• Level 2 Access</span>
                </div>
                <h1 style={{ fontSize: '26px', fontWeight: '900', margin: '0 0 4px 0', color: '#ffffff', letterSpacing: '-0.02em' }}>
                  Welcome, {adminName}! 👋
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.55)', margin: 0, fontSize: '13px', fontWeight: '500', maxWidth: '480px' }}>
                  Centralized executive hub — Manage Teacher Admin, Student Admin & all operational desks from one place.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => navigate('/academic-admin')}
                  style={{ backgroundColor: 'rgba(139,92,246,0.25)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.4)', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700' }}
                >
                  <FiBookOpen size={15} /> Teacher & Student Admin
                </button>
                <button
                  onClick={() => navigate('/academic-admin?tab=admissions')}
                  style={{ backgroundColor: 'rgba(245,158,11,0.25)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.4)', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700' }}
                >
                  <FiUsers size={15} /> Admissions Desk
                </button>
                <button
                  onClick={() => navigate('/super-admin')}
                  style={{ backgroundColor: 'rgba(59,130,246,0.25)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.4)', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700' }}
                >
                  <FiShield size={15} /> Super Admin →
                </button>
              </div>
            </div>
          </div>

          {/* ── KPI Stat Cards ─────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {kpiCards.map((k, i) => (
              <div
                key={i}
                onClick={() => navigate(k.path)}
                title={`Go to ${k.label}`}
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderRadius: '14px',
                  padding: '20px 22px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.18s, box-shadow 0.18s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</span>
                  <div style={{ padding: '9px', borderRadius: '10px', backgroundColor: k.bg, color: k.color }}>{k.icon}</div>
                </div>
                <div style={{ fontSize: '30px', fontWeight: '900', color: 'var(--text-main)', lineHeight: 1, marginBottom: '8px' }}>{k.value}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{k.sub}</span>
                  <span style={{ fontSize: '12px', color: k.color, fontWeight: '700' }}>Manage →</span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Tab Navigation & Search Bar ─────────────────────────────── */}
          <div style={{
            backgroundColor: 'var(--card-bg)',
            borderRadius: '14px',
            padding: '14px 16px',
            marginBottom: '20px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'all' | 'teacher' | 'student' | 'finance')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: activeTab === tab.id ? 'var(--primary)' : 'var(--panel-bg)',
                    color: activeTab === tab.id ? '#ffffff' : 'var(--text-muted)',
                    transition: 'all 0.18s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div style={{ flex: '1 1 240px', position: 'relative', minWidth: '200px' }}>
              <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} size={14} />
              <input
                type="text"
                placeholder="Search any module or desk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: '700', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Clear
              </button>
            )}
          </div>

          {/* ── Operation Branch Hubs ──────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>

            {/* Teacher Admin Branch */}
            {(activeTab === 'all' || activeTab === 'teacher') && (
              <div style={{
                backgroundColor: 'var(--card-bg)',
                borderRadius: '16px',
                padding: '24px',
                border: '1.5px solid rgba(139,92,246,0.25)',
                boxShadow: '0 4px 20px rgba(139,92,246,0.05)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', padding: '12px', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}>
                      <FiBookOpen size={22} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'var(--text-main)' }}>📚 Teacher Admin Branch</h3>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Faculty, Class Allocations &amp; Exam Operations</p>
                    </div>
                  </div>
                  <span style={{ padding: '4px 12px', background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', borderRadius: '20px', fontSize: '11px', fontWeight: '800', border: '1px solid rgba(139,92,246,0.2)' }}>
                    {filteredTeacherLinks.length} Modules
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flex: 1 }}>
                  {filteredTeacherLinks.map((link, idx) => (
                    <div
                      key={idx}
                      onClick={() => navigate(link.path)}
                      style={{
                        backgroundColor: 'var(--panel-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        cursor: 'pointer',
                        transition: 'all 0.18s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px'
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#8b5cf6'; (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.07)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; (e.currentTarget as HTMLElement).style.background = 'var(--panel-bg)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: '700', color: '#8b5cf6' }}>
                        {link.icon}
                        <span>{link.label}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{link.desc}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/academic-admin')}
                  style={{ width: '100%', marginTop: '18px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff', border: 'none', padding: '13px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(139,92,246,0.25)' }}
                >
                  🚀 Open Teacher Admin Dashboard <FiArrowRight size={16} />
                </button>
              </div>
            )}

            {/* Student Admin Branch */}
            {(activeTab === 'all' || activeTab === 'student') && (
              <div style={{
                backgroundColor: 'var(--card-bg)',
                borderRadius: '16px',
                padding: '24px',
                border: '1.5px solid rgba(245,158,11,0.25)',
                boxShadow: '0 4px 20px rgba(245,158,11,0.05)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', padding: '12px', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
                      <FiUsers size={22} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'var(--text-main)' }}>🎓 Student Admin Branch</h3>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Student Lifecycle, Admissions &amp; Promotions</p>
                    </div>
                  </div>
                  <span style={{ padding: '4px 12px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', borderRadius: '20px', fontSize: '11px', fontWeight: '800', border: '1px solid rgba(245,158,11,0.2)' }}>
                    {filteredStudentLinks.length} Modules
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flex: 1 }}>
                  {filteredStudentLinks.map((link, idx) => (
                    <div
                      key={idx}
                      onClick={() => navigate(link.path)}
                      style={{
                        backgroundColor: 'var(--panel-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        cursor: 'pointer',
                        transition: 'all 0.18s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px'
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#f59e0b'; (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.07)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; (e.currentTarget as HTMLElement).style.background = 'var(--panel-bg)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: '700', color: '#f59e0b' }}>
                        {link.icon}
                        <span>{link.label}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{link.desc}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/academic-admin?tab=profiles')}
                  style={{ width: '100%', marginTop: '18px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', padding: '13px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(245,158,11,0.25)' }}
                >
                  🚀 Open Student Profiles & Admissions Desk <FiArrowRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* ── Quick Finance & Operations Desks ─────────────────────────── */}
          {(activeTab === 'all' || activeTab === 'finance') && (
            <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'rgba(99,102,241,0.12)', padding: '10px', borderRadius: '10px', color: 'var(--primary)' }}>
                    <FiActivity size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '17px', fontWeight: '800' }}>⚡ Quick Finance &amp; Operations Desks</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>One-click access to finance, billing, exams &amp; attendance desks</p>
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', background: 'var(--panel-bg)', padding: '5px 12px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                  {filteredQuickActions.length} Desks Active
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                {filteredQuickActions.map((action, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate(action.path)}
                    style={{
                      backgroundColor: 'var(--panel-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '18px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      transition: 'all 0.18s'
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = action.bg; (e.currentTarget as HTMLElement).style.borderColor = action.color; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--panel-bg)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: action.bg, color: action.color, flexShrink: 0 }}>
                      {action.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>{action.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{action.desc}</div>
                    </div>
                    <FiArrowRight size={16} style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ManagerAdminDashboard;
