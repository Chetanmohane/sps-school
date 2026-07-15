import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiHome, FiUsers, FiSettings, FiBookOpen, FiCalendar, FiFileText,
  FiUserPlus, FiDollarSign, FiCheckSquare, FiEdit3, FiMail, FiLock,
  FiShield, FiActivity, FiLayers, FiChevronRight, FiAward
} from 'react-icons/fi';

const Sidebar = () => {
  const userRole = localStorage.getItem('role') || 'Guest';
  const location = useLocation();
  const navigate = useNavigate();

  // ── Super Admin: only categories shown in sidebar ──────────────────────────
  const superAdminCategories = [
    {
      key: 'students',
      name: 'Student Admin',
      emoji: '🎓',
      color: '#10b981',
      path: '/super-admin?section=students',
    },
    {
      key: 'academics',
      name: 'Academics',
      emoji: '📚',
      color: '#3b82f6',
      path: '/super-admin?section=academics',
    },
    {
      key: 'operations',
      name: 'Operations & Finance',
      emoji: '💼',
      color: '#f59e0b',
      path: '/super-admin?section=operations',
    },
    {
      key: 'settings',
      name: 'Settings',
      emoji: '⚙️',
      color: '#94a3b8',
      path: '/settings',
    },
  ];

  // ── Other roles: regular menus ─────────────────────────────────────────────
  const sidebarMenus = {
    'academic-admin': [
      { path: '/academic-admin', name: 'Dashboard', icon: <FiHome /> },
      { path: '/academic-admin/teachers', name: 'Teacher Management', icon: <FiUsers /> },
      { path: '/academic-admin/subjects', name: 'Subjects', icon: <FiBookOpen /> },
      { path: '/academic-admin/classes', name: 'Classes Management', icon: <FiCalendar /> },
      { path: '/academic-admin/attendance', name: 'Student Attendance', icon: <FiCheckSquare /> },
      { path: '/academic-admin/results', name: 'Student Exam Results', icon: <FiAward /> },
      { path: '/settings', name: 'Settings', icon: <FiSettings /> },
    ],
    'student-admin': [
      { path: '/student-admin', name: 'Dashboard', icon: <FiHome /> },
      { path: '/student-admin?tab=admissions', name: 'Admissions', icon: <FiFileText /> },
      { path: '/student-admin?tab=profiles', name: 'Student Profiles', icon: <FiUsers /> },
      { path: '/student-admin?tab=allocation', name: 'Class Allocation', icon: <FiUserPlus /> },
      { path: '/student-admin?tab=promotions', name: 'Promotions', icon: <FiLayers /> },
      { path: '/settings', name: 'Settings', icon: <FiSettings /> },
    ],
    'finance-admin': [
      { path: '/finance-admin', name: 'Finance Home', icon: <FiHome /> },
      { path: '/settings', name: 'Settings', icon: <FiSettings /> },
    ],
    'operations-admin': [
      { path: '/operations-admin', name: 'Operations Home', icon: <FiHome /> },
      { path: '/settings', name: 'Settings', icon: <FiSettings /> },
    ],
    'teacher': [
      { path: '/teacher', name: 'My Dashboard', icon: <FiHome /> },
      { path: '/teacher/myclasses', name: 'My Classes', icon: <FiUsers /> },
      { path: '/teacher/attendanceMark', name: 'Attendance Section', icon: <FiCheckSquare /> },
      { path: '/teacher/assignments', name: 'Assignments', icon: <FiEdit3 /> },
      { path: '/teacher/application', name: 'Review Applications', icon: <FiFileText /> },
      { path: '/settings', name: 'Settings', icon: <FiSettings /> },
    ],
    'student': [
      { path: '/student', name: 'My Dashboard', icon: <FiHome /> },
      { path: '/student/profile', name: 'My Profile', icon: <FiUsers /> },
      { path: '/student/attendance', name: 'Attendance', icon: <FiCheckSquare /> },
      { path: '/student/assignments', name: 'Assignments', icon: <FiEdit3 /> },
      { path: '/student/exams', name: 'Exams', icon: <FiBookOpen /> },
      { path: '/student/results', name: 'Results', icon: <FiFileText /> },
      { path: '/student/application', name: 'Application', icon: <FiMail /> },
      { path: '/settings', name: 'Settings', icon: <FiSettings /> },
    ],
  };

  const isLinkActive = (path) => {
    const [pathName, searchString] = path.split('?');
    if (location.pathname !== pathName) return false;
    if (!searchString) return !location.search;
    const currentParams = new URLSearchParams(location.search);
    const targetParams = new URLSearchParams(searchString);
    for (let [key, val] of targetParams.entries()) {
      if (currentParams.get(key) !== val) return false;
    }
    return true;
  };

  const isCatActive = (catPath) => {
    const [pathName, searchString] = catPath.split('?');
    if (location.pathname !== pathName) return false;
    if (!searchString) return location.pathname === pathName;
    const cur = new URLSearchParams(location.search);
    const tar = new URLSearchParams(searchString);
    for (let [k, v] of tar.entries()) {
      if (cur.get(k) !== v) return false;
    }
    return true;
  };

  const getMenuTitle = () => {
    const titles = {
      'super-admin':     'SUPER ADMIN',
      'academic-admin':  'TEACHER ADMIN',
      'student-admin':   'STUDENT ADMIN',
      'finance-admin':   'FINANCE ADMIN',
      'operations-admin':'OPERATIONS ADMIN',
      'teacher':         'TEACHER PORTAL',
      'student':         'STUDENT PORTAL',
    };
    return titles[userRole] || 'MAIN MENU';
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center' }}>
        <div className="logo-icon" style={{ background: 'var(--primary)', color: 'white', padding: '6px', borderRadius: '8px', marginRight: '8px', display: 'inline-flex' }}>
          <FiSettings size={18} />
        </div>
        SPS School ERP
      </div>

      <ul className="sidebar-menu">
        <li style={{ padding: '15px 24px 10px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {getMenuTitle()}
        </li>

        {/* ── SUPER ADMIN: System Overview — direct first link ── */}
        {userRole === 'super-admin' && (() => {
          const overviewActive = isLinkActive('/super-admin?tab=overview') || (location.pathname === '/super-admin' && !new URLSearchParams(location.search).get('section') && !new URLSearchParams(location.search).get('tab'));
          return (
            <li style={{ padding: '4px 12px' }}>
              <button
                onClick={() => navigate('/super-admin?tab=overview')}
                className={`admin-sidebar-btn ${overviewActive ? 'active' : ''}`}
                style={{ '--accent-color': '#3b82f6' } as React.CSSProperties}
              >
                <div style={{
                  width: '36px', height: '36px', flexShrink: 0,
                  background: overviewActive ? 'linear-gradient(135deg, var(--accent-color), color-mix(in srgb, var(--accent-color) 80%, #000))' : 'color-mix(in srgb, var(--accent-color) 18%, transparent)',
                  borderRadius: '9px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '17px',
                  color: overviewActive ? '#fff' : 'inherit',
                  boxShadow: overviewActive ? '0 4px 12px color-mix(in srgb, var(--accent-color) 40%, transparent)' : 'none',
                  transition: 'all 0.18s',
                }}>
                  🏠
                </div>
                <span style={{
                  flex: 1, fontSize: '13px',
                  fontWeight: overviewActive ? '700' : '600',
                  color: overviewActive ? 'var(--accent-color)' : '#D1D5DB',
                  transition: 'color 0.15s',
                }}>
                  System Overview
                </span>
                <FiChevronRight size={14} style={{ color: overviewActive ? 'var(--accent-color)' : 'rgba(255,255,255,0.4)', opacity: overviewActive ? 1 : 0.5, transition: 'all 0.15s' }} />
              </button>
            </li>
          );
        })()}

        {/* ── SUPER ADMIN: Attendance — direct link ── */}
        {userRole === 'super-admin' && (() => {
          const attendanceActive = isLinkActive('/super-admin?tab=attendance');
          return (
            <li style={{ padding: '4px 12px' }}>
              <button
                onClick={() => navigate('/super-admin?tab=attendance')}
                className={`admin-sidebar-btn ${attendanceActive ? 'active' : ''}`}
                style={{ '--accent-color': '#10b981' } as React.CSSProperties}
              >
                <div style={{
                  width: '36px', height: '36px', flexShrink: 0,
                  background: attendanceActive ? 'linear-gradient(135deg, var(--accent-color), color-mix(in srgb, var(--accent-color) 80%, #000))' : 'color-mix(in srgb, var(--accent-color) 18%, transparent)',
                  borderRadius: '9px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '17px',
                  color: attendanceActive ? '#fff' : 'inherit',
                  boxShadow: attendanceActive ? '0 4px 12px color-mix(in srgb, var(--accent-color) 40%, transparent)' : 'none',
                  transition: 'all 0.18s',
                }}>
                  📋
                </div>
                <span style={{
                  flex: 1, fontSize: '13px',
                  fontWeight: attendanceActive ? '700' : '600',
                  color: attendanceActive ? 'var(--accent-color)' : '#D1D5DB',
                  transition: 'color 0.15s',
                }}>
                  Student Attendance
                </span>
                <FiChevronRight size={14} style={{ color: attendanceActive ? 'var(--accent-color)' : 'rgba(255,255,255,0.4)', opacity: attendanceActive ? 1 : 0.5, transition: 'all 0.15s' }} />
              </button>
            </li>
          );
        })()}

        {/* ── SUPER ADMIN: show only category headings ── */}
        {userRole === 'super-admin' && superAdminCategories.map((cat) => {
          const active = isCatActive(cat.path);
          return (
            <li key={cat.key} style={{ padding: '4px 12px' }}>
              <button
                onClick={() => navigate(cat.path)}
                className={`admin-sidebar-btn ${active ? 'active' : ''}`}
                style={{ '--accent-color': cat.color } as React.CSSProperties}
              >
                {/* Emoji icon box */}
                <div style={{
                  width: '36px', height: '36px', flexShrink: 0,
                  background: active
                    ? `linear-gradient(135deg, var(--accent-color), color-mix(in srgb, var(--accent-color) 80%, #000))`
                    : `color-mix(in srgb, var(--accent-color) 18%, transparent)`,
                  borderRadius: '9px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '17px',
                  color: active ? '#fff' : 'inherit',
                  boxShadow: active ? `0 4px 12px color-mix(in srgb, var(--accent-color) 40%, transparent)` : 'none',
                  transition: 'all 0.18s',
                }}>
                  {cat.emoji}
                </div>

                {/* Label */}
                <span style={{
                  flex: 1,
                  fontSize: '13px',
                  fontWeight: active ? '700' : '600',
                  color: active ? 'var(--accent-color)' : '#D1D5DB',
                  transition: 'color 0.15s',
                }}>
                  {cat.name}
                </span>

                {/* Arrow */}
                <FiChevronRight
                  size={14}
                  style={{
                    color: active ? 'var(--accent-color)' : 'rgba(255,255,255,0.4)',
                    opacity: active ? 1 : 0.5,
                    transform: active ? 'translateX(2px)' : 'none',
                    transition: 'all 0.15s',
                  }}
                />
              </button>
            </li>
          );
        })}

        {/* ── OTHER ROLES: normal NavLink items ── */}
        {userRole !== 'super-admin' && (sidebarMenus[userRole] || []).map((link, index) => (
          <NavLink
            key={index}
            to={link.path}
            className={isLinkActive(link.path) ? 'sidebar-item active' : 'sidebar-item'}
          >
            <span className="nav-icon">{link.icon}</span>
            <span>{link.name}</span>
          </NavLink>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;