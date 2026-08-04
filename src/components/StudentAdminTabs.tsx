import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiFileText, FiUsers, FiUserPlus, FiLayers } from 'react-icons/fi';

const StudentAdminTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentTab = (() => {
    const t = new URLSearchParams(location.search).get('tab');
    return ['dashboard', 'admissions', 'profiles', 'allocation', 'promotions'].includes(t || '') ? t : 'dashboard';
  })();

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', path: '/student-admin', icon: <FiHome /> },
    { id: 'admissions', name: 'Admissions', path: '/student-admin?tab=admissions', icon: <FiFileText /> },
    { id: 'profiles', name: 'Student Profiles', path: '/student-admin?tab=profiles', icon: <FiUsers /> },
    { id: 'allocation', name: 'Class Allocation', path: '/student-admin?tab=allocation', icon: <FiUserPlus /> },
    { id: 'promotions', name: 'Promotions', path: '/student-admin?tab=promotions', icon: <FiLayers /> }
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
        const isActive = currentTab === tab.id;
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
                ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)' 
                : 'transparent',
              color: isActive ? '#FFFFFF' : 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isActive 
                ? '0 4px 14px 0 rgba(16, 185, 129, 0.3)' 
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

export default StudentAdminTabs;
