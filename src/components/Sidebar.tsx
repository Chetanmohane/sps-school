import React from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiHome, FiUsers, FiSettings, FiBookOpen, FiCalendar, FiFileText,
  FiUserPlus, FiDollarSign, FiCheckSquare, FiEdit3, FiMail,
  FiShield, FiActivity, FiLayers, FiChevronRight, FiAward, FiUserCheck, FiType
} from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

const Sidebar = () => {
  const userRole = localStorage.getItem('role') || 'super-admin';
  const location = useLocation();
  const navigate = useNavigate();
  const { isSidebarOpen, closeSidebar } = useTheme();

  // ── Super Admin & Manager: Hierarchy categories ──────────────────────────
  const superAdminCategories = [
    {
      key: 'overview',
      name: 'Super Admin Dashboard',
      emoji: '🏠',
      color: '#3b82f6',
      path: '/super-admin?tab=overview',
    },
    {
      key: 'academics',
      name: 'Teacher & Student Admin',
      emoji: '👩‍🏫',
      color: '#8b5cf6',
      path: '/academic-admin',
    },
    {
      key: 'finance',
      name: 'Finance Admin Portal',
      emoji: '💰',
      color: '#10b981',
      path: '/finance-admin',
    },
    {
      key: 'manager',
      name: 'Manager Operations',
      emoji: '👔',
      color: '#6366f1',
      path: '/manager-admin',
    },
    {
      key: 'applications',
      name: 'Student Leave Requests',
      emoji: '✉️',
      color: '#ec4899',
      path: '/teacher/application',
    },
    {
      key: 'exams',
      name: 'Exam Timetable',
      emoji: '📅',
      color: '#f59e0b',
      path: '/exams',
    },
    {
      key: 'timetable',
      name: 'Manage Daily Timetable',
      emoji: '🗓️',
      color: '#06b6d4',
      path: '/timetable',
    },
    {
      key: 'hierarchy',
      name: 'Role Hierarchy Diagram',
      emoji: '🌳',
      color: '#ef4444',
      path: '/super-admin?tab=hierarchy',
    },
    {
      key: 'audit-logs',
      name: 'Account Creation Log',
      emoji: '🛡️',
      color: '#4f46e5',
      path: '/admin/audit-logs',
    },
    {
      key: 'settings',
      name: 'System Settings',
      emoji: '⚙️',
      color: '#94a3b8',
      path: '/settings',
    },
  ];

  // ── Other roles menu configuration ─────────────────────────────────────────
  const sidebarMenus: Record<string, Array<{ path: string; name: string; icon: React.ReactNode }>> = {
    'manager-admin': [
      { path: '/manager-admin', name: 'Manager Executive Hub', icon: <FiUserCheck /> },
      { path: '/academic-admin', name: 'Teacher Admin Branch', icon: <FiBookOpen /> },
      { path: '/academic-admin?tab=admissions', name: 'Submit Admission', icon: <FiUserPlus /> },
      { path: '/finance-admin', name: 'Finance Admin Overview', icon: <FiDollarSign /> },
      { path: '/teacher/application', name: 'Student Leave Requests', icon: <FiMail /> },
      { path: '/exams', name: '📅 Exam Timetable', icon: <FiCalendar /> },
      { path: '/timetable', name: '🗓️ Manage Daily Timetable', icon: <FiCalendar /> },
      { path: '/admin/audit-logs', name: 'Account Creation Log', icon: <FiShield /> },
      { path: '/settings', name: 'Settings', icon: <FiSettings /> },
    ],

    'academic-admin': [
      { path: '/academic-admin', name: 'Teacher Admin Dashboard', icon: <FiHome /> },
      { path: '/academic-admin/teachers', name: 'Teacher Section', icon: <FiUsers /> },
      { path: '/academic-admin/classes', name: 'Class Teacher Section', icon: <FiCalendar /> },
      { path: '/academic-admin/subjects', name: 'Subjects Catalog', icon: <FiBookOpen /> },
      { path: '/academic-admin?tab=admissions', name: 'Admissions Desk', icon: <FiFileText /> },
      { path: '/academic-admin?tab=profiles', name: 'Student Profiles', icon: <FiUsers /> },
      { path: '/academic-admin?tab=allocation', name: 'Class Allocation', icon: <FiUserPlus /> },
      { path: '/academic-admin?tab=promotions', name: 'Promotions Section', icon: <FiLayers /> },
      { path: '/academic-admin/attendance', name: 'Student Attendance', icon: <FiCheckSquare /> },
      { path: '/academic-admin/results', name: 'Exam Results', icon: <FiAward /> },
      { path: '/teacher/application', name: 'Student Leave Requests', icon: <FiMail /> },
      { path: '/exams', name: '📅 Exam Timetable', icon: <FiCalendar /> },
      { path: '/timetable', name: '🗓️ Manage Daily Timetable', icon: <FiCalendar /> },
      { path: '/admin/audit-logs', name: 'Account Creation Log', icon: <FiShield /> },
      { path: '/settings', name: 'Settings', icon: <FiSettings /> },
    ],

    'teacher-admin': [
      { path: '/academic-admin', name: 'Teacher Admin Dashboard', icon: <FiHome /> },
      { path: '/academic-admin/teachers', name: 'Teacher Section', icon: <FiUsers /> },
      { path: '/academic-admin/classes', name: 'Class Teacher Section', icon: <FiCalendar /> },
      { path: '/academic-admin/subjects', name: 'Subjects Catalog', icon: <FiBookOpen /> },
      { path: '/academic-admin?tab=admissions', name: 'Admissions Desk', icon: <FiFileText /> },
      { path: '/academic-admin?tab=profiles', name: 'Student Profiles', icon: <FiUsers /> },
      { path: '/academic-admin?tab=allocation', name: 'Class Allocation', icon: <FiUserPlus /> },
      { path: '/academic-admin?tab=promotions', name: 'Promotions Section', icon: <FiLayers /> },
      { path: '/academic-admin/attendance', name: 'Student Attendance', icon: <FiCheckSquare /> },
      { path: '/academic-admin/results', name: 'Exam Results', icon: <FiAward /> },
      { path: '/teacher/application', name: 'Student Leave Requests', icon: <FiMail /> },
      { path: '/exams', name: '📅 Exam Timetable', icon: <FiCalendar /> },
      { path: '/timetable', name: '🗓️ Manage Daily Timetable', icon: <FiCalendar /> },
      { path: '/admin/audit-logs', name: 'Account Creation Log', icon: <FiShield /> },
      { path: '/settings', name: 'Settings', icon: <FiSettings /> },
    ],

    'finance-admin': [
      { path: '/finance-admin', name: 'Finance Admin Dashboard', icon: <FiHome /> },
      { path: '/settings', name: 'Settings', icon: <FiSettings /> },
    ],
    'operations-admin': [
      { path: '/operations-admin', name: 'Operations Dashboard', icon: <FiHome /> },
      { path: '/exams', name: '📅 Exam Timetable', icon: <FiCalendar /> },
      { path: '/timetable', name: '🗓️ Manage Daily Timetable', icon: <FiCalendar /> },
      { path: '/settings', name: 'Settings', icon: <FiSettings /> },
    ],
    'class-teacher': [
      { path: '/class-teacher', name: '⭐ Class Teacher Portal', icon: <FiHome /> },
      { path: '/teacher/application', name: 'Student Leave Requests', icon: <FiMail /> },
      { path: '/settings', name: 'Settings', icon: <FiSettings /> },
    ],
    'teacher': [
      { path: '/teacher', name: '📖 Subject Teacher Portal', icon: <FiHome /> },
      { path: '/teacher/myclasses', name: 'My Classes & Timetable', icon: <FiUsers /> },
      { path: '/teacher/attendanceMark', name: 'Subject Period Attendance', icon: <FiCheckSquare /> },
      { path: '/teacher/results', name: 'Subject Exam Results Upload', icon: <FiAward /> },
      { path: '/teacher/exam-timetable', name: 'Exam Timetable', icon: <FiCalendar /> },
      { path: '/teacher/assignments', name: 'Assignments & Homework', icon: <FiEdit3 /> },
      { path: '/teacher/application', name: 'Student Leave Requests', icon: <FiMail /> },
      { path: '/settings', name: 'Settings', icon: <FiSettings /> },
    ],
    'student': [
      { path: '/student', name: 'Student Dashboard', icon: <FiHome /> },
      { path: '/student/profile', name: 'My Profile', icon: <FiUsers /> },
      { path: '/student/timetable', name: '🗓️ My Class Timetable', icon: <FiCalendar /> },
      { path: '/student/attendance', name: 'My Attendance', icon: <FiCheckSquare /> },
      { path: '/student/fees', name: 'Fee Dues & Receipts', icon: <FiDollarSign /> },
      { path: '/student/results', name: 'Exam Results', icon: <FiFileText /> },
      { path: '/student/application', name: 'Leave Application', icon: <FiMail /> },
      { path: '/settings', name: 'Settings', icon: <FiSettings /> },
    ],
  };

  const isLinkActive = (path: string) => {
    const [pathName, searchString] = path.split('?');
    if (location.pathname !== pathName) return false;

    const currentTab = new URLSearchParams(location.search).get('tab');
    if (!searchString) {
      return !currentTab || currentTab === 'overview';
    }

    const targetTab = new URLSearchParams(searchString).get('tab');
    return currentTab === targetTab;
  };

  const [teacherAdminExpanded, setTeacherAdminExpanded] = React.useState<boolean>(
    location.pathname.startsWith('/academic-admin')
  );

  React.useEffect(() => {
    if (location.pathname.startsWith('/academic-admin')) {
      setTeacherAdminExpanded(true);
    }
  }, [location.pathname]);

  const teacherAdminSubItems = [
    { path: '/academic-admin', name: 'Overview Dashboard', icon: <FiHome /> },
    { path: '/academic-admin/teachers', name: 'Teacher Directory', icon: <FiUsers /> },
    { path: '/academic-admin/classes', name: 'Class Teacher Section', icon: <FiCalendar /> },
    { path: '/academic-admin/subjects', name: 'Subjects Catalog', icon: <FiBookOpen /> },
    { path: '/academic-admin?tab=admissions', name: 'Admissions Desk', icon: <FiFileText /> },
    { path: '/academic-admin?tab=profiles', name: 'Student Profiles', icon: <FiUsers /> },
    { path: '/academic-admin?tab=allocation', name: 'Class Allocation', icon: <FiUserPlus /> },
    { path: '/academic-admin?tab=promotions', name: 'Promotions Section', icon: <FiLayers /> },
    { path: '/academic-admin/attendance', name: 'Student Attendance', icon: <FiCheckSquare /> },
    { path: '/academic-admin/results', name: 'Exam Results', icon: <FiAward /> },
    { path: '/timetable', name: '🗓️ Manage Daily Timetable', icon: <FiCalendar /> },
  ];

  const isCatActive = (catPath: string) => {
    const [pathName, searchString] = catPath.split('?');
    if (pathName === '/academic-admin') {
      return location.pathname.startsWith('/academic-admin');
    }
    if (location.pathname !== pathName) return false;
    if (!searchString) return true;
    const cur = new URLSearchParams(location.search);
    const tar = new URLSearchParams(searchString);
    for (let [k, v] of tar.entries()) {
      const curVal = cur.get(k);
      if (k === 'tab' && v === 'overview' && (!curVal || curVal === 'overview')) continue;
      if (curVal !== v) return false;
    }
    return true;
  };

  const getMenuTitle = () => {
    if (location.pathname.startsWith('/class-teacher')) {
      return 'CLASS TEACHER PORTAL';
    }
    const titles: Record<string, string> = {
      'super-admin':     'SUPER ADMIN CONTROL PANEL',
      'manager-admin':   'MANAGER EXECUTIVE PORTAL',
      'academic-admin':  'TEACHER & STUDENT ADMIN PORTAL',
      'teacher-admin':   'TEACHER & STUDENT ADMIN PORTAL',
      'finance-admin':   'FINANCE ADMIN PORTAL',
      'operations-admin':'OPERATIONS ADMIN PORTAL',
      'teacher':         'SUBJECT TEACHER PORTAL',
      'student':         'STUDENT / PARENT PORTAL',
    };
    return titles[userRole] || 'MAIN MENU';
  };

  const isSuperAdmin = userRole === 'super-admin';
  const { fontSize, cycleFont } = useTheme();

  const fontLabels: Record<string, string> = { small: 'A−', medium: 'A', large: 'A+' };
  const fontHints: Record<string, string> = { small: 'Small', medium: 'Medium', large: 'Large' };
  const fontColors: Record<string, string> = { small: '#94a3b8', medium: '#60a5fa', large: '#a78bfa' };

  return (
    <>
      <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={closeSidebar}></div>
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center' }}>
          <div className="logo-icon" style={{ background: 'var(--primary)', color: 'white', padding: '6px', borderRadius: '8px', marginRight: '8px', display: 'inline-flex' }}>
            <FiShield size={18} />
          </div>
          SPS School ERP
        </div>

      <ul className="sidebar-menu">
        <li style={{ padding: '15px 24px 10px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {getMenuTitle()}
        </li>

        {/* ── SUPER ADMIN: Category Hierarchy Navigation ── */}
        {isSuperAdmin && superAdminCategories.map((cat) => {
          const active = isCatActive(cat.path);
          const isAcademicCat = cat.key === 'academics';

          return (
            <li key={cat.key} style={{ padding: '4px 12px' }}>
              <button
                onClick={() => {
                  if (isAcademicCat) {
                    if (location.pathname.startsWith('/academic-admin')) {
                      setTeacherAdminExpanded(!teacherAdminExpanded);
                    } else {
                      navigate(cat.path);
                      setTeacherAdminExpanded(true);
                    }
                  } else {
                    navigate(cat.path);
                  }
                }}
                className={`admin-sidebar-btn ${active ? 'active' : ''}`}
                style={{ '--accent-color': cat.color } as React.CSSProperties}
              >
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

                <span style={{
                  flex: 1,
                  fontSize: '13px',
                  fontWeight: active ? '700' : '600',
                  color: active ? 'var(--accent-color)' : '#D1D5DB',
                  transition: 'color 0.15s',
                }}>
                  {cat.name}
                </span>

                <FiChevronRight
                  size={14}
                  style={{
                    color: active ? 'var(--accent-color)' : 'rgba(255,255,255,0.4)',
                    opacity: active ? 1 : 0.5,
                    transform: isAcademicCat && teacherAdminExpanded ? 'rotate(90deg)' : (active ? 'translateX(2px)' : 'none'),
                    transition: 'all 0.2s',
                  }}
                />
              </button>

              {/* Collapsible Slide Sub-Menu for Teacher Admin Portal */}
              {isAcademicCat && teacherAdminExpanded && (
                <ul style={{
                  listStyle: 'none',
                  paddingLeft: '14px',
                  marginTop: '4px',
                  marginBottom: '6px',
                  borderLeft: '2px solid rgba(139, 92, 246, 0.3)',
                  marginLeft: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}>
                  {teacherAdminSubItems.map((sub, sIdx) => {
                    const subActive = isLinkActive(sub.path);
                    return (
                      <li key={sIdx}>
                        <Link
                          to={sub.path}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '7px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: subActive ? '700' : '500',
                            color: subActive ? '#a78bfa' : 'rgba(255,255,255,0.7)',
                            backgroundColor: subActive ? 'rgba(139, 92, 246, 0.18)' : 'transparent',
                            textDecoration: 'none',
                            transition: 'all 0.15s ease-in-out',
                            border: subActive ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid transparent',
                          }}
                        >
                          <span style={{ fontSize: '14px', color: subActive ? '#a78bfa' : 'rgba(255,255,255,0.5)' }}>
                            {sub.icon}
                          </span>
                          <span>{sub.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}

        {/* ── ALL OTHER ROLES (Including Manager, Teacher Admin, Student Admin, Admission Desk, Teacher, Student) ── */}
        {!isSuperAdmin && (
          location.pathname.startsWith('/class-teacher')
            ? sidebarMenus['class-teacher']
            : (sidebarMenus[userRole] || sidebarMenus['teacher'])
        ).map((link, index) => (
          <Link
            key={index}
            to={link.path}
            className={isLinkActive(link.path) ? 'sidebar-item active' : 'sidebar-item'}
          >
            <span className="nav-icon">{link.icon}</span>
            <span>{link.name}</span>
          </Link>
        ))}

      </ul>

      {/* ── Text Size Control ── */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.45)', fontSize: '11px', fontWeight: 700 }}>
          <FiType size={13} />
          Text Size
        </div>
        <button
          onClick={cycleFont}
          title={`Current: ${fontHints[fontSize]} — click to change`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '8px',
            border: `1px solid ${fontColors[fontSize]}55`,
            background: `${fontColors[fontSize]}18`,
            color: fontColors[fontSize],
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s',
            letterSpacing: '0.02em',
          }}
        >
          {fontLabels[fontSize]}
          <span style={{ fontSize: '10px', fontWeight: 600, opacity: 0.75 }}>{fontHints[fontSize]}</span>
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;