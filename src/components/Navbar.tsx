import React, { useState, useEffect } from 'react';
import { FiBell, FiUser, FiLogOut, FiSun, FiMoon, FiCalendar, FiType, FiMenu } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import API from '../api/axios';

const Navbar = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme, fontSize, cycleFont, toggleSidebar } = useTheme();
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
  const userEmail = localStorage.getItem('userEmail') || '';
  const userName = rawUserName || displayRole;
  const shortName = (rawUserName && rawUserName.toLowerCase() !== 'super admin') 
    ? rawUserName.split(' ')[0] 
    : displayRole;
  
  const savedProfileImage = userEmail ? localStorage.getItem(`student_photo_${userEmail}`) : '';

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
      justifyContent: 'space-between',
      padding: '0 16px',
      width: '100%',
      maxWidth: '100vw',
      boxSizing: 'border-box',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      {/* Welcome & Date Section */}
      <div className="nav-left-section" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button 
          className="mobile-menu-btn" 
          onClick={toggleSidebar}
          style={{
            display: 'none', // Overridden in media queries
            background: 'var(--input-bg)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '6px 10px',
            borderRadius: '8px',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FiMenu />
        </button>
        <div className="flex flex-col justify-center" style={{ minWidth: 0 }}>
          <div className="nav-welcome nav-welcome-text" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--text-muted)' }} className="hide-on-mobile">Hello,</span> 
            <span className="font-semibold mobile-header-title" style={{ color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shortName}</span>
            <span 
              className="nav-role-badge"
              style={{ 
                fontSize: '10px', 
                fontWeight: '700',
                padding: '2px 6px', 
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
          <div className="hide-on-mobile-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            <FiCalendar size={12} style={{ color: 'var(--primary)' }} />
            <span>{currentDate}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Text Size Toggle */}
        <button
          className="font-size-toggle-btn hide-on-mobile-sm"
          onClick={cycleFont}
          title={`Text Size: ${fontSize.toUpperCase()} (Click to toggle)`}
          style={{
            height: '36px',
            padding: '0 8px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--input-bg)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontWeight: '700',
            fontSize: '12px'
          }}
        >
          <FiType size={15} />
          <span style={{ textTransform: 'capitalize', fontSize: '10px' }}>{fontSize}</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--input-bg)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
        >
          {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
        </button>

        {/* Notifications Button */}
        <div style={{ position: 'relative' }}>
          <button 
            className="icon-btn" 
            title="Notifications" 
            onClick={() => {
              const nextState = !showNotifications;
              setShowNotifications(nextState);
              if (nextState) {
                markAllAsRead();
              }
            }}
            style={{ 
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--input-bg)',
              color: 'var(--text-muted)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            <FiBell size={16} />
            {/* Pulsing indicator */}
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
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
                style={{ position: 'fixed', inset: 0, zIndex: 998 }}
              />
              <div className="notification-dropdown-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-main)' }}>Notifications</span>
                    <span style={{ fontSize: '10px', background: 'var(--primary-bg)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                      {notifications.length}
                    </span>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={markAllAsRead}
                      style={{ fontSize: '11px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                      No announcements yet.
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const readIds = JSON.parse(localStorage.getItem('read_notification_ids') || '[]');
                      const isUnread = !readIds.includes(n._id);
                      return (
                        <div 
                          key={n._id} 
                          style={{ 
                            padding: '10px 12px', 
                            borderRadius: '10px', 
                            background: isUnread ? 'color-mix(in srgb, var(--primary) 8%, var(--input-bg))' : 'var(--input-bg)', 
                            border: '1px solid var(--border-color)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '13px', color: 'var(--text-main)', display: 'block', wordBreak: 'break-word', flex: 1 }}>{n.title}</strong>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                              {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Recent'}
                            </span>
                          </div>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0', lineHeight: '1.4', wordBreak: 'break-word' }}>{n.message}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 'bold' }}>
                              📢 By: {n.createdBy || 'Admin'}
                            </span>
                            {isUnread && (
                              <span style={{ fontSize: '9px', background: 'var(--danger)', color: 'white', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                                NEW
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* User Card */}
        <div 
          className="user-profile" 
          style={{ 
            padding: '3px 8px 3px 4px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--input-bg)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0
          }}
        >
          <div 
            className="nav-avatar font-bold" 
            style={{ 
              width: '28px', 
              height: '28px', 
              borderRadius: '6px', 
              background: savedProfileImage ? 'transparent' : gradient, 
              color: '#ffffff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '11px',
              overflow: 'hidden',
              flexShrink: 0
            }}
          >
            {savedProfileImage ? (
              <img src={savedProfileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials
            )}
          </div>
          <div className="user-name-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
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
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
            background: 'var(--danger-bg)',
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
        >
          <FiLogOut size={16}/>
        </button>
      </div>
    </header>

  );
};

export default Navbar;