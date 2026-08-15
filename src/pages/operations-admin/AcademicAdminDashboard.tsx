import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../../api/axios';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import AcademicTabs from '../../components/AcademicTabs';
import StudentProfiles from './StudentProfiles';
import Admissions from './Admission';
import ClassAllocation from './ClassAllocation';
import Promotions from './Promotions';
import NoticeBoardAdmin from '../../components/NoticeBoardAdmin';
import { 
  FiUsers, FiBookOpen, FiActivity, FiAward, 
  FiClock, FiPlus, FiCompass, 
  FiLayers, FiMapPin, FiTerminal, FiSearch
} from 'react-icons/fi';

const AcademicAdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = new URLSearchParams(location.search).get('tab') || 'overview';
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalSubjects: 0,
    totalClasses: 0,
  });
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [systemLogs, setSystemLogs] = useState([
    { time: '10:00:02', message: 'Academic dashboard initialized' },
    { time: '10:00:05', message: 'MongoDB connection active: sps_school' },
    { time: '10:00:06', message: 'Loaded security keys & JWT configuration' },
  ]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch stats
      const statsRes = await API.get('/api/academic-admin/dashboard-stats');
      setStats(statsRes.data.data);

      // Fetch list details in parallel for a rich UI experience
      const [teachersRes, subjectsRes, classesRes] = await Promise.all([
        API.get('/api/academic-admin/teachers'),
        API.get('/api/academic-admin/subjects'),
        API.get('/api/academic-admin/classes')
      ]);

      setTeachers(teachersRes.data.data || []);
      setSubjects(subjectsRes.data.data || []);
      setClasses(classesRes.data.data || []);

      // Add log entry
      setSystemLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), message: 'Successfully synced remote academic catalogs' }
      ]);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setSystemLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), message: 'API Sync Error: ' + error.message }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Get current greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Calculate teacher department counts
  const getDepartmentStats = () => {
    const counts: Record<string, number> = {};
    teachers.forEach((t: any) => {
      const dept = t.department || 'General';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percent: teachers.length ? Math.round((count / teachers.length) * 100) : 0
    }));
  };

  const departments = Array.from(new Set(teachers.map((t: any) => t.department).filter(Boolean)));
  const uniqueClasses = Array.from(new Set(classes.map((c: any) => c.className).filter(Boolean))).sort();
  const uniqueSections = Array.from(new Set(classes.map((c: any) => c.section).filter(Boolean))).sort();

  const filteredClasses = classes.filter((c: any) => {
    const classStr = `${c.className} ${c.section}`.toLowerCase();
    const teacherStr = (c.classTeacher?.user?.name || '').toLowerCase();
    const roomStr = (c.room || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    
    const matchSearch = !searchQuery || classStr.includes(query) || teacherStr.includes(query) || roomStr.includes(query);
    const matchClass = classFilter === 'all' || c.className === classFilter;
    const matchSection = sectionFilter === 'all' || c.section === sectionFilter;

    return matchSearch && matchClass && matchSection;
  });

  const filteredTeachers = teachers.filter((t: any) => {
    const name = (t.user?.name || '').toLowerCase();
    const spec = (t.specialization || '').toLowerCase();
    const dept = t.department || '';
    const query = searchQuery.toLowerCase();

    const matchSearch = !searchQuery || name.includes(query) || spec.includes(query) || dept.toLowerCase().includes(query);
    const matchDept = deptFilter === 'all' || dept === deptFilter;

    return matchSearch && matchDept;
  });

  const departmentStats = getDepartmentStats();

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="dashboard-container" style={{ padding: '12px 20px 20px', maxWidth: '100%', boxSizing: 'border-box', background: 'linear-gradient(135deg, var(--bg-color) 0%, rgba(30, 58, 138, 0.03) 100%)' }}>
          <AcademicTabs />

          {activeTab === 'admissions' && <Admissions />}
          {activeTab === 'profiles' && <StudentProfiles />}
          {activeTab === 'allocation' && <ClassAllocation />}
          {activeTab === 'promotions' && <Promotions />}
          {activeTab === 'notices' && (
            <div style={{ marginTop: '24px' }}>
              <NoticeBoardAdmin />
            </div>
          )}

          {(!activeTab || activeTab === 'overview') && (
            <>
          {/* Header Greeting Banner */}
          <div 
            style={{
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-main)',
              padding: '24px 28px',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '20px', backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                  👩‍🏫 Teacher & Student Admin Portal
                </span>
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                {getGreeting()}, {localStorage.getItem('userName') || 'Academic Admin'}! 👋
              </h1>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '13px', maxWidth: '650px' }}>
                Unified portal for Faculty directory, Class Teacher In-Charges, Subject syllabi, Student Master Profiles, Admissions Desk, and Exam Results.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => navigate('/academic-admin/teachers')} 
                style={{ padding: '9px 16px', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
              >
                + Add Teacher
              </button>
              <button 
                onClick={() => navigate('/exams')} 
                style={{ padding: '9px 16px', borderRadius: '8px', backgroundColor: '#6366f1', color: 'white', border: 'none', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
              >
                📅 Create Exam Timetable
              </button>
              <button 
                onClick={() => navigate('/timetable')} 
                style={{ padding: '9px 16px', borderRadius: '8px', backgroundColor: '#06b6d4', color: 'white', border: 'none', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
              >
                🗓️ Manage Daily Timetable
              </button>
            </div>
          </div>

          {/* ── Advanced Academic Multi-Filter Bar ── */}
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '12px', 
            marginBottom: '24px', 
            backgroundColor: 'var(--card-bg)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '14px', 
            padding: '16px',
            alignItems: 'flex-end'
          }}>
            {/* Search */}
            <div style={{ flex: '1 1 220px', position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                🔍 Search Faculty / Subject / Class
              </label>
              <div style={{ position: 'relative' }}>
                <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search name, class, room, subject..."
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} 
                />
              </div>
            </div>

            {/* Department Filter */}
            <div style={{ flex: '1 1 140px', minWidth: '120px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                🏬 Department
              </label>
              <select 
                value={deptFilter} 
                onChange={e => setDeptFilter(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}
              >
                <option value="all">All Departments</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Class Filter */}
            <div style={{ flex: '1 1 120px', minWidth: '110px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                🏫 Grade
              </label>
              <select 
                value={classFilter} 
                onChange={e => setClassFilter(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}
              >
                <option value="all">All Grades</option>
                {uniqueClasses.map(c => (
                  <option key={c} value={c}>Grade {c}</option>
                ))}
              </select>
            </div>

            {/* Section Filter */}
            <div style={{ flex: '1 1 120px', minWidth: '110px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                🅰️ Section
              </label>
              <select 
                value={sectionFilter} 
                onChange={e => setSectionFilter(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}
              >
                <option value="all">All Sections</option>
                {uniqueSections.map(s => (
                  <option key={s} value={s}>Section {s}</option>
                ))}
              </select>
            </div>

            {/* Clear Button */}
            {(searchQuery || deptFilter !== 'all' || classFilter !== 'all' || sectionFilter !== 'all') && (
              <button 
                onClick={() => { setSearchQuery(''); setDeptFilter('all'); setClassFilter('all'); setSectionFilter('all'); }}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: '700', fontSize: '12px', cursor: 'pointer', height: '36px' }}
              >
                🧹 Clear Filters
              </button>
            )}
          </div>

          {/* Core Analytics Cards */}
          <div className="cards-grid" style={{ gridGap: '24px' }}>
            {/* Teachers Card */}
            <div 
              className="stat-card" 
              onClick={() => navigate('/academic-admin/teachers')}
              style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid var(--border-color)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="stat-title" style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Teachers Assigned</span>
                  <h2 className="stat-value" style={{ margin: '8px 0', fontSize: '36px', fontWeight: 800 }}>
                    {loading ? '...' : stats.totalTeachers}
                  </h2>
                </div>
                <div style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', padding: '12px', borderRadius: '12px' }}>
                  <FiUsers size={24} />
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  <span>Syllabus Allocation</span>
                  <span>{loading ? '...' : '92% Active'}</span>
                </div>
                <div className="stat-indicator">
                  <div className="indicator-fill" style={{ width: '92%', backgroundColor: '#3B82F6' }}></div>
                </div>
              </div>
            </div>

            {/* Subjects Card */}
            <div 
              className="stat-card" 
              onClick={() => navigate('/academic-admin/subjects')}
              style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid var(--border-color)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="stat-title" style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Offered Subjects</span>
                  <h2 className="stat-value" style={{ margin: '8px 0', fontSize: '36px', fontWeight: 800 }}>
                    {loading ? '...' : stats.totalSubjects}
                  </h2>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', padding: '12px', borderRadius: '12px' }}>
                  <FiBookOpen size={24} />
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  <span>Average Credits</span>
                  <span>{loading ? '...' : '2.8 Cr'}</span>
                </div>
                <div className="stat-indicator">
                  <div className="indicator-fill" style={{ width: '70%', backgroundColor: '#10B981' }}></div>
                </div>
              </div>
            </div>

            {/* Classes Card */}
            <div 
              className="stat-card" 
              onClick={() => navigate('/academic-admin/classes')}
              style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid var(--border-color)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="stat-title" style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Active Classes</span>
                  <h2 className="stat-value" style={{ margin: '8px 0', fontSize: '36px', fontWeight: 800 }}>
                    {loading ? '...' : stats.totalClasses}
                  </h2>
                </div>
                <div style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', padding: '12px', borderRadius: '12px' }}>
                  <FiLayers size={24} />
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  <span>Classroom Occupancy</span>
                  <span>{loading ? '...' : '85% Capacity'}</span>
                </div>
                <div className="stat-indicator">
                  <div className="indicator-fill" style={{ width: '85%', backgroundColor: '#F59E0B' }}></div>
                </div>
              </div>
            </div>

            {/* Performance Analytics Card */}
            <div 
              className="stat-card" 
              onClick={() => navigate('/academic-admin/results')}
              style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid var(--border-color)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="stat-title" style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Exam Evaluations</span>
                  <h2 className="stat-value" style={{ margin: '8px 0', fontSize: '36px', fontWeight: 800 }}>
                    {loading ? '...' : 'Term-1'}
                  </h2>
                </div>
                <div style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6', padding: '12px', borderRadius: '12px' }}>
                  <FiAward size={24} />
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  <span>Evaluation Rate</span>
                  <span>100% Completed</span>
                </div>
                <div className="stat-indicator">
                  <div className="indicator-fill" style={{ width: '100%', backgroundColor: '#8B5CF6' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
               SHOWCASE 1 — CLASS TEACHER SECTION & CLASS IN-CHARGES
          ═══════════════════════════════════════════════════════════════════ */}
          <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>👔 Class Teacher Section — Assigned Class In-Charges</span>
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Overview of all class sections and their assigned official Class Teachers.
                </p>
              </div>
              <button
                onClick={() => navigate('/academic-admin/classes')}
                style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
              >
                Manage Class Teachers →
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              {classes.slice(0, 6).map((c: any) => (
                <div key={c._id} style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '16px', color: 'var(--primary)' }}>Class {c.className}-{c.section}</strong>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', backgroundColor: c.classTeacher ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: c.classTeacher ? '#10b981' : '#ef4444', fontWeight: '700' }}>
                      {c.classTeacher ? 'Assigned' : 'Vacant'}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
                    {c.classTeacher?.user?.name || 'Class Teacher Not Allocated'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>📍 Room {c.room || 'N/A'}</span>
                    <span>🕒 {c.startTime || '08:45'} - {c.endTime || '13:50'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
               SHOWCASE 2 — TEACHER SECTION & FACULTY DIRECTORY
          ═══════════════════════════════════════════════════════════════════ */}
          <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>👩‍🏫 Teacher Section — Faculty Roster & Specializations</span>
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Active faculty members, academic departments, and specializations.
                </p>
              </div>
              <button
                onClick={() => navigate('/academic-admin/teachers')}
                style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
              >
                Manage Faculty Directory →
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              {teachers.slice(0, 4).map((t: any) => (
                <div key={t._id} style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#3b82f6', color: 'white', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {t.user?.name ? t.user.name.split(' ').map((n: string) => n[0]).join('').slice(0,2) : 'T'}
                    </div>
                    <div>
                      <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block' }}>{t.user?.name}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.department || 'Science'} Department</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    <span>Specialization: <strong>{t.specialization || 'General'}</strong></span>
                    <span>Exp: <strong>{t.experience || 0} yrs</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Action Hub */}
          <div 
            style={{ 
              background: 'var(--card-bg)', 
              border: '1px solid var(--border-color)',
              borderRadius: '16px', 
              padding: '24px', 
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiCompass className="text-indigo-500" /> Quick Academic Actions
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <button 
                onClick={() => navigate('/academic-admin/teachers')}
                className="admin-role-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ background: '#3B82F6', color: 'white', padding: '10px', borderRadius: '10px', display: 'flex' }}>
                  <FiPlus size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>Add Teacher</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Register new faculty records</div>
                </div>
              </button>

              <button 
                onClick={() => navigate('/academic-admin/subjects')}
                className="admin-role-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ background: '#10B981', color: 'white', padding: '10px', borderRadius: '10px', display: 'flex' }}>
                  <FiPlus size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>Add Subject</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Define course & credit structures</div>
                </div>
              </button>

              <button 
                onClick={() => navigate('/academic-admin/classes')}
                className="admin-role-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ background: '#F59E0B', color: 'white', padding: '10px', borderRadius: '10px', display: 'flex' }}>
                  <FiPlus size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>Create Class</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Setup new grade & rooms</div>
                </div>
              </button>

              <button 
                onClick={() => navigate('/academic-admin/results')}
                className="admin-role-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ background: '#8B5CF6', color: 'white', padding: '10px', borderRadius: '10px', display: 'flex' }}>
                  <FiAward size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>Review Results</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>View & input student grades</div>
                </div>
              </button>
            </div>
          </div>

          {/* Main Grid: Interactive Class Explorer & Details Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-full overflow-hidden">
            
            {/* Interactive Classes Table */}
            <div className="lg:col-span-7 p-4 sm:p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] shadow-sm max-w-full overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[var(--text-main)] m-0">📚 Master Class & Teacher Schedule Explorer</h3>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 mb-0">Real-time overview of class sections, timings, room locations, class teachers, and assigned subjects.</p>
                </div>
                
                {/* Micro Search Input */}
                <div className="relative w-full sm:w-[220px] shrink-0">
                  <FiSearch style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Search class or teacher..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 32px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--input-bg)',
                      color: 'var(--text-main)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div className="overflow-x-auto w-full max-w-full">
                <table className="data-table w-full min-w-[580px]">
                  <thead>
                    <tr>
                      <th style={{ padding: '12px' }}>Class</th>
                      <th style={{ padding: '12px' }}>Section</th>
                      <th style={{ padding: '12px' }}>Room</th>
                      <th style={{ padding: '12px' }}>Class Teacher</th>
                      <th style={{ padding: '12px' }}>Timing</th>
                      <th style={{ padding: '12px' }}>Subjects</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                          <FiActivity className="animate-spin" style={{ display: 'inline', marginRight: '8px' }} /> Syncing directories...
                        </td>
                      </tr>
                    ) : filteredClasses.length > 0 ? (
                      filteredClasses.map((c: any) => (
                        <tr key={c._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px', fontWeight: 700, color: 'var(--primary)' }}>Grade {c.className}</td>
                          <td style={{ padding: '12px' }}>
                            <span className="badge management" style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                              Section {c.section}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FiMapPin size={12} className="text-red-400" />
                              {c.room || 'N/A'}
                            </div>
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-main)', fontWeight: 500 }}>
                            {c.classTeacher?.user?.name || <em style={{ color: 'var(--text-muted)' }}>Not allocated</em>}
                          </td>
                          <td style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FiClock size={12} className="text-indigo-400" />
                              {c.startTime || '08:45'} - {c.endTime || '13:50'}
                            </div>
                          </td>
                          <td style={{ padding: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                            <span className="truncate" style={{ maxWidth: '140px', display: 'inline-block' }} title={c.subjects?.map((s: any) => s.name).join(', ')}>
                              {c.subjects?.length > 0 ? c.subjects.map((s: any) => s.code).join(', ') : 'None assigned'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                          No matching class allocations found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Department Breakdown & Console Log Monitor */}
            <div className="lg:col-span-5 flex flex-col gap-6 w-full max-w-full overflow-hidden">
              
              {/* Department Breakdown */}
              <div className="panel" style={{ padding: '24px', borderRadius: '16px', background: 'var(--card-bg)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, border: 'none', paddingBottom: 0 }}>Faculty Departments</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {loading ? (
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Calculating metrics...</span>
                  ) : departmentStats.length > 0 ? (
                    departmentStats.map((dept, index) => (
                      <div key={index}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                          <span>{dept.name} Department</span>
                          <span style={{ color: 'var(--primary)' }}>{dept.count} {dept.count === 1 ? 'Teacher' : 'Teachers'} ({dept.percent}%)</span>
                        </div>
                        <div className="stat-indicator" style={{ height: '6px', borderRadius: '3px' }}>
                          <div 
                            className="indicator-fill" 
                            style={{ 
                              width: `${dept.percent}%`, 
                              backgroundColor: index % 3 === 0 ? '#3B82F6' : index % 3 === 1 ? '#10B981' : '#F59E0B' 
                            }}
                          ></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No teacher specialization metrics yet.</span>
                  )}
                </div>
              </div>

              {/* Active Curriculum */}
              <div className="panel" style={{ padding: '24px', borderRadius: '16px', background: 'var(--card-bg)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, border: 'none', paddingBottom: 0 }}>Active Curriculum</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {loading ? (
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading subjects...</span>
                  ) : subjects.length > 0 ? (
                    subjects.slice(0, 4).map((sub: any, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                        <div>
                          <strong style={{ color: 'var(--primary)' }}>{sub.code}</strong> - {sub.name}
                        </div>
                        <span className="badge management" style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '3px' }}>
                          {sub.credits} Credits
                        </span>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No curriculum offered yet.</span>
                  )}
                </div>
              </div>

              {/* Developer Technical Console / System Log Monitor */}
              <div className="terminal-container" style={{ borderRadius: '16px' }}>
                <div className="terminal-header">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="terminal-dots">
                      <div className="terminal-dot red" />
                      <div className="terminal-dot yellow" />
                      <div className="terminal-dot green" />
                    </div>
                    <span className="terminal-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FiTerminal /> system-logger:~
                    </span>
                  </div>
                  <button className="terminal-clear-btn" onClick={() => setSystemLogs([])}>
                    Clear Log
                  </button>
                </div>
                <div className="terminal-body" style={{ height: '180px', fontSize: '11px' }}>
                  <div style={{ color: '#6ee7b7', marginBottom: '8px' }}>
                    [SYSTEM READY] Listening for database actions on sps_school...
                  </div>
                  {systemLogs.map((log, index) => (
                    <div key={index} style={{ marginBottom: '4px' }}>
                      <span style={{ color: '#818cf8', marginRight: '8px' }}>[{log.time}]</span>
                      <span style={{ color: '#e2e8f0' }}>{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
          </>
          )}

        </div>
      </main>
    </div>
  );
};

export default AcademicAdminDashboard;