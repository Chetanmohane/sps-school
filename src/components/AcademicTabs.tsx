import React, { useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FiHome, FiUsers, FiBookOpen, FiLayers, FiAward, 
  FiCheckSquare, FiFileText, FiUserPlus, FiChevronLeft, FiChevronRight,
  FiCalendar
} from 'react-icons/fi';

const AcademicTabs: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentSearchTab = new URLSearchParams(location.search).get('tab');

  const tabs = [
    { id: 'overview', name: 'Dashboard', path: '/academic-admin', icon: <FiHome />, emoji: '🏠' },
    { id: 'teachers', name: 'Teachers Roster', path: '/academic-admin/teachers', icon: <FiUsers />, emoji: '👩‍🏫' },
    { id: 'classes', name: 'Class Teachers', path: '/academic-admin/classes', icon: <FiLayers />, emoji: '🏫' },
    { id: 'subjects', name: 'Subjects Catalog', path: '/academic-admin/subjects', icon: <FiBookOpen />, emoji: '📚' },
    { id: 'admissions', name: 'Admissions Desk', path: '/academic-admin?tab=admissions', icon: <FiFileText />, emoji: '📋' },
    { id: 'profiles', name: 'Student Profiles', path: '/academic-admin?tab=profiles', icon: <FiUsers />, emoji: '🎓' },
    { id: 'allocation', name: 'Class Allocation', path: '/academic-admin?tab=allocation', icon: <FiUserPlus />, emoji: '🧩' },
    { id: 'promotions', name: 'Promotions', path: '/academic-admin?tab=promotions', icon: <FiLayers />, emoji: '🚀' },
    { id: 'results', name: 'Exam Results', path: '/academic-admin/results', icon: <FiAward />, emoji: '🏆' },
    { id: 'attendance', name: 'Attendance', path: '/academic-admin/attendance', icon: <FiCheckSquare />, emoji: '✅' },
    { id: 'exams', name: 'Exam Timetable', path: '/exams', icon: <FiCalendar />, emoji: '📅' }
  ];

  const isTabActive = (tab: typeof tabs[0]) => {
    if (tab.path.includes('?tab=')) {
      return location.pathname === '/academic-admin' && currentSearchTab === tab.id;
    }
    if (tab.id === 'overview') {
      return location.pathname === '/academic-admin' && !currentSearchTab;
    }
    return location.pathname === tab.path;
  };

  // Scroll active tab into view gently without pushing preceding tabs off-screen
  useEffect(() => {
    if (scrollRef.current) {
      const activeElement = scrollRef.current.querySelector('[data-active="true"]') as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [location.pathname, currentSearchTab]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div 
      className="academic-tabs-wrapper"
      style={{
        position: 'sticky',
        top: '0',
        zIndex: 25,
        marginBottom: '24px',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '18px',
        padding: '8px 12px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backdropFilter: 'blur(12px)',
        width: '100%',
        boxSizing: 'border-box',
        maxWidth: '100%'
      }}
    >
      <style>{`
        .academic-tabs-track::-webkit-scrollbar { display: none; }
        .academic-tabs-track {
          -ms-overflow-style: none;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }

        /* Desktop view: Wrap tabs cleanly so all tab names are 100% visible */
        @media (min-width: 1024px) {
          .academic-nav-btn {
            display: none !important;
          }
          .academic-tabs-track {
            flex-wrap: wrap !important;
            overflow-x: visible !important;
            gap: 8px !important;
          }
        }

        /* Mobile & Tablet view: Scrollable track with left/right buttons */
        @media (max-width: 1023px) {
          .academic-tab-btn {
            padding: 8px 14px !important;
            font-size: 12px !important;
          }
          .academic-nav-btn {
            display: flex !important;
            width: 32px !important;
            height: 32px !important;
          }
        }
      `}</style>

      {/* Scroll Left Button (visible on mobile/tablet) */}
      <button
        type="button"
        onClick={() => handleScroll('left')}
        aria-label="Scroll left"
        className="academic-nav-btn"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--panel-bg)',
          color: 'var(--text-main)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--panel-bg)'; e.currentTarget.style.color = 'var(--text-main)'; }}
      >
        <FiChevronLeft size={16} />
      </button>

      {/* Horizontal Slider / Segmented Track */}
      <div
        ref={scrollRef}
        className="academic-tabs-track"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          whiteSpace: 'nowrap',
          flex: 1,
          padding: '4px 6px',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}
      >
        {tabs.map((tab) => {
          const isActive = isTabActive(tab);
          return (
            <button
              key={tab.id}
              data-active={isActive}
              onClick={() => navigate(tab.path)}
              className="academic-tab-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '12px',
                border: isActive ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--border-color)',
                backgroundColor: isActive ? '#3b82f6' : 'var(--panel-bg)',
                color: isActive ? '#ffffff' : 'var(--text-main)',
                fontSize: '13px',
                fontWeight: isActive ? '800' : '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isActive 
                  ? '0 4px 14px rgba(59, 130, 246, 0.35)' 
                  : 'none',
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
                flexShrink: 0,
                letterSpacing: '0.01em',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--panel-bg)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }
              }}
            >
              <span style={{ fontSize: '15px', display: 'flex', alignItems: 'center' }}>{tab.emoji}</span>
              <span style={{ whiteSpace: 'nowrap' }}>{tab.name}</span>
              {isActive && (
                <span 
                  style={{ 
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%', 
                    backgroundColor: '#ffffff', 
                    boxShadow: '0 0 6px #ffffff',
                    marginLeft: '2px' 
                  }} 
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button (visible on mobile/tablet) */}
      <button
        type="button"
        onClick={() => handleScroll('right')}
        aria-label="Scroll right"
        className="academic-nav-btn"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--panel-bg)',
          color: 'var(--text-main)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--panel-bg)'; e.currentTarget.style.color = 'var(--text-main)'; }}
      >
        <FiChevronRight size={16} />
      </button>
    </div>
  );
};

export default AcademicTabs;



