import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import AcademicTabs from '../../components/AcademicTabs';
import { 
  FiUsers, FiBookOpen, FiActivity, FiAward, 
  FiClock, FiPlus, FiSmile, FiCompass, 
  FiLayers, FiMapPin, FiTerminal, FiSearch
} from 'react-icons/fi';

const AcademicAdminDashboard = () => {
  const navigate = useNavigate();
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

  const filteredClasses = classes.filter((c: any) => {
    const classStr = `${c.className} ${c.section}`.toLowerCase();
    const teacherStr = (c.classTeacher?.user?.name || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return classStr.includes(query) || teacherStr.includes(query);
  });

  const departmentStats = getDepartmentStats();

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="dashboard-container" style={{ padding: '30px', background: 'linear-gradient(135deg, var(--bg-color) 0%, rgba(30, 58, 138, 0.03) 100%)' }}>
          <AcademicTabs />
          
          {/* Header Greeting Banner */}
          <div 
            style={{
              background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
              color: 'white',
              padding: '30px',
              borderRadius: '16px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.3)',
              marginBottom: '10px'
            }}
          >
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FiSmile size={20} className="animate-bounce" />
                <span style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.9 }}>
                  Portal Control Center
                </span>
              </div>
              <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                {getGreeting()}, Academic Administrator!
              </h1>
              <p style={{ margin: '8px 0 0', opacity: 0.85, fontSize: '15px', maxWidth: '600px' }}>
                Welcome to the SPS School Academic management suite. Review metrics, design class structures, allocate teachers, and audit examination outcomes.
              </p>
            </div>
            
            {/* Background design elements */}
            <div style={{
              position: 'absolute',
              right: '-50px',
              top: '-50px',
              width: '250px',
              height: '250px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '50%',
              zIndex: 1
            }} />
            <div style={{
              position: 'absolute',
              right: '120px',
              bottom: '-80px',
              width: '180px',
              height: '180px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '50%',
              zIndex: 1
            }} />
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
          <div className="bottom-grid" style={{ gridGap: '24px', gridTemplateColumns: '1.6fr 1fr' }}>
            
            {/* Interactive Classes Table */}
            <div className="panel" style={{ padding: '24px', borderRadius: '16px', background: 'var(--card-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: 'none', paddingBottom: 0 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, border: 'none', paddingBottom: 0 }}>Classes Directory Explorer</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Search and quick view active class configurations.</p>
                </div>
                
                {/* Micro Search Input */}
                <div style={{ position: 'relative', width: '220px' }}>
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

              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%' }}>
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
                              {c.startTime || '08:00'} - {c.endTime || '14:00'}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
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

        </div>
      </main>
    </div>
  );
};

export default AcademicAdminDashboard;