import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiUsers, FiBookOpen, FiLayers, FiAward, FiCheckSquare } from 'react-icons/fi';

const AcademicTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'overview', name: 'Dashboard', path: '/academic-admin', icon: <FiHome /> },
    { id: 'teachers', name: 'Teachers', path: '/academic-admin/teachers', icon: <FiUsers /> },
    { id: 'subjects', name: 'Subjects', path: '/academic-admin/subjects', icon: <FiBookOpen /> },
    { id: 'classes', name: 'Classes & Timetable', path: '/academic-admin/classes', icon: <FiLayers /> },
    { id: 'results', name: 'Exam Results', path: '/academic-admin/results', icon: <FiAward /> },
    { id: 'attendance', name: 'Attendance Register', path: '/academic-admin/attendance', icon: <FiCheckSquare /> }
  ];

  return (
    <div 
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '8px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        position: 'sticky',
        top: '0',
        zIndex: 10
      }}
    >
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 18px',
              borderRadius: '12px',
              border: 'none',
              background: isActive 
                ? 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)' 
                : 'transparent',
              color: isActive ? '#FFFFFF' : 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isActive 
                ? '0 4px 14px 0 rgba(59, 130, 246, 0.3)' 
                : 'none',
              transform: isActive ? 'scale(1.02)' : 'scale(1)'
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = 'var(--text-main)';
                e.currentTarget.style.background = 'var(--input-bg)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span style={{ display: 'flex', fontSize: '16px' }}>{tab.icon}</span>
            <span>{tab.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default AcademicTabs;
