import React, { useState, useEffect } from 'react';
import { FiBell, FiUser, FiLogOut, FiSun, FiMoon, FiCalendar, FiType } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import API from '../api/axios';

const Navbar = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme, fontSize, cycleFont } = useTheme();
  const [currentDate, setCurrentDate] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const response = await API.get('/api/notifications');
      const data = response.data?.data || [];
      setNotifications(data);
      
      const readIds = JSON.parse(localStorage.getItem('read_notification_ids') || '[]');
      const unread = data.filter((n: any) => !readIds.includes(n._id)).length;
      setUnreadCount(unread);
    } catch (err) {
      console.warn("Could not fetch notifications", err);
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n: any) => n._id);
    localStorage.setItem('read_notification_ids', JSON.stringify(allIds));
    setUnreadCount(0);
  };

  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('en-US', options));
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const formatRoleName = (roleStr: string) => {
    const roleMap: Record<string, string> = {
      'super-admin': 'Super Admin',
      'manager-admin': 'Manager Admin',
      'student-admin': 'Teacher & Student Admin',
      'academic-admin': 'Teacher & Student Admin',
      'finance-admin': 'Finance Admin',
      'operations-admin': 'Operations Admin',
      'teacher': 'Teacher',
      'student': 'Student',
    };
    const key = (roleStr || '').toLowerCase();
    if (roleMap[key]) return roleMap[key];
    return roleStr
      ? roleStr.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : 'Super Admin';
  };

  const rawRole = localStorage.getItem('role') || 'super-admin';
  const displayRole = formatRoleName(rawRole);
  const rawUserName = localStorage.getItem('userName');
  const userName = rawUserName || displayRole;
  const shortName = userName.split(' ')[0];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    navigate('/');
  };

  // Generate a premium gradient avatar color based on the first letter of the name
  const avatarGradients = [
    'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', // Indigo
    'linear-gradient(135deg, #EC4899 0%, #D946EF 100%)', // Pink-Magenta
    'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', // Blue
    'linear-gradient(135deg, #10B981 0%, #059669 100%)', // Emerald
    'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', // Amber
  ];
  const charCode = userName.charCodeAt(0) || 0;
  const gradient = avatarGradients[charCode % avatarGradients.length];
  const initials = userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'SA';

  return (
    <header className="navbar" style={{ 
      backdropFilter: 'blur(12px)',
      background: 'var(--navbar-bg)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'between',
      padding: '0 28px'
    }}>
      {/* Welcome & Date Section */}
      <div className="flex flex-col justify-center">
        <div className="nav-welcome" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Hello,</span> 
          <span className="font-semibold" style={{ color: 'var(--text-main)' }}>{userName}</span>
          <span 
            style={{ 
              fontSize: '11px', 
              fontWeight: '700',
              padding: '2px 8px', 
              borderRadius: '6px', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              background: 'var(--primary-bg)', 
              color: 'var(--primary)',
              border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)'
            }}
          >
            {displayRole}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
          <FiCalendar size={13} style={{ color: 'var(--primary)' }} />
          <span>{currentDate}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="nav-actions flex items-center gap-3">
        {/* Text Size Toggle */}
        <button
          className="font-size-toggle-btn"
          onClick={cycleFont}
          title={`Text Size: ${fontSize.toUpperCase()} (Click to toggle)`}
          style={{
            height: '40px',
            padding: '0 10px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: 'var(--input-bg)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontWeight: '700',
            fontSize: '12px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--primary)';
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <FiType size={16} />
          <span style={{ textTransform: 'capitalize', fontSize: '11px' }}>{fontSize}</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: 'var(--input-bg)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--primary)';
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
        </button>

        {/* Notifications Button */}
        <div style={{ position: 'relative' }}>
          <button 
            className="icon-btn" 
            title="Notifications" 
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) {
                markAllAsRead();
              }
            }}
            style={{ 
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--input-bg)',
              color: 'var(--text-muted)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--primary)';
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <FiBell size={18} />
            {/* Pulsing indicator */}
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--danger)',
                boxShadow: '0 0 0 2px var(--navbar-bg)'
              }} />
            )}
          </button>

          {showNotifications && (
            <>
              <div 
                onClick={() => setShowNotifications(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 999 }}
              />
              <div style={{
                position: 'absolute',
                top: '50px',
                right: 0,
                width: '320px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
                padding: '16px',
                maxHeight: '360px',
                overflowY: 'auto'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-main)' }}>Notifications</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{notifications.length} total</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                      No announcements yet.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n._id} style={{ padding: '10px', borderRadius: '10px', background: 'var(--input-bg)', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '4px' }}>
                          <strong style={{ fontSize: '12px', color: 'var(--text-main)', display: 'block' }}>{n.title}</strong>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {new Date(n.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: '1.4' }}>{n.message}</p>
                        <span style={{ fontSize: '9px', color: 'var(--primary)', fontWeight: 'bold', display: 'block', marginTop: '6px' }}>
                          📢 By: {n.createdBy}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* User Card */}
        <div 
          className="user-profile flex items-center gap-2.5" 
          style={{ 
            padding: '4px 12px 4px 6px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            background: 'var(--input-bg)',
          }}
        >
          <div 
            className="nav-avatar font-bold" 
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              background: gradient, 
              color: '#ffffff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
            }}
          >
            {initials}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span className="font-semibold text-xs" style={{ color: 'var(--text-main)', lineHeight: '1.2' }}>{shortName}</span>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Online</span>
          </div>
        </div>

        {/* Logout Button */}
        <button 
          className="nav-logout-btn" 
          onClick={handleLogout} 
          title="Logout"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
            background: 'var(--danger-bg)',
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--danger)';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--danger-bg)';
            e.currentTarget.style.color = 'var(--danger)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <FiLogOut size={18}/>
        </button>
      </div>
    </header>
  );
};

export default Navbar;