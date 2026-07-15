import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { useSharedState } from '../../hooks/useSharedState';
import {
  FiUsers, FiCheckSquare, FiFileText, FiArrowRight,
  FiActivity, FiTrendingUp, FiCalendar, FiBell, FiClock
} from 'react-icons/fi';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const teacherName = localStorage.getItem('userName') || 'Teacher';
  const teacherEmail = localStorage.getItem('userEmail') || '';

  // Live shared attendance data
  const [attendanceRecords] = useSharedState('erp_attendance', []);
  const [students] = useSharedState('erp_students', []);

  // Live clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const todayStr = now.toISOString().split('T')[0];

  // Compute live stats from shared data
  const todayAttendance = attendanceRecords.filter(r => r.date === todayStr);
  const presentToday = todayAttendance.filter(r => r.status === 'Present').length;
  const absentToday = todayAttendance.filter(r => r.status === 'Absent').length;
  const totalStudents = students.length;
  const attendancePct = todayAttendance.length > 0
    ? Math.round((presentToday / todayAttendance.length) * 100)
    : 0;

  const stats = [
    {
      label: 'Total Students',
      value: totalStudents,
      icon: '🎓',
      color: 'var(--primary)',
      bg: 'rgba(37,99,235,0.1)',
      desc: 'Enrolled in school',
      fill: `${Math.min(totalStudents * 10, 100)}%`,
    },
    {
      label: "Today's Attendance",
      value: `${attendancePct}%`,
      icon: '✅',
      color: 'var(--success)',
      bg: 'rgba(16,185,129,0.1)',
      desc: `${presentToday} present, ${absentToday} absent`,
      fill: `${attendancePct}%`,
    },
    {
      label: 'Marked Today',
      value: todayAttendance.length,
      icon: '📋',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
      desc: 'Attendance records today',
      fill: `${Math.min(todayAttendance.length * 12, 100)}%`,
    },
    {
      label: 'Absent Today',
      value: absentToday,
      icon: '⚠️',
      color: 'var(--danger)',
      bg: 'rgba(248,113,113,0.1)',
      desc: 'Need parent notification',
      fill: `${absentToday > 0 ? Math.min(absentToday * 15, 100) : 5}%`,
    },
  ];

  const quickActions = [
    {
      label: 'Mark Attendance',
      desc: 'Take daily student roll call',
      icon: '✅',
      path: '/teacher/attendanceMark',
      color: 'var(--primary)',
      gradient: 'linear-gradient(135deg, #2563eb, #1e40af)',
    },
    {
      label: 'View Classes',
      desc: 'Your assigned subject classes',
      icon: '🏫',
      path: '/teacher/myclasses',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
    },
    {
      label: 'Assignments',
      desc: 'Create or grade assignments',
      icon: '📝',
      path: '/teacher/assignments',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    },
    {
      label: 'Review Leaves',
      desc: 'Approve student applications',
      icon: '✉️',
      path: '/teacher/application',
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #ec4899, #db2777)',
    },
  ];

  const schedule = [
    { time: '09:00 – 10:00 AM', subject: 'Mathematics', class: 'Class 10-A', room: 'Room 102', status: 'Done' },
    { time: '10:15 – 11:15 AM', subject: 'Physics', class: 'Class 10-B', room: 'Lab 2', status: 'Done' },
    { time: '11:30 – 12:30 PM', subject: 'Algebra Lab', class: 'Class 9-A', room: 'Room 105', status: 'Live' },
    { time: '01:30 – 02:30 PM', subject: 'Advanced Calculus', class: 'Class 12-A', room: 'Room 201', status: 'Upcoming' },
    { time: '02:45 – 03:45 PM', subject: 'Science', class: 'Class 8-B', room: 'Room 103', status: 'Upcoming' },
  ];

  const notices = [
    { type: 'warning', emoji: '⚠️', message: 'Grade submission for Assignment 3 is due tonight.', time: '2h ago' },
    { type: 'success', emoji: '✅', message: 'Super Admin approved science exhibition proposal.', time: '5h ago' },
    { type: 'info', emoji: '📢', message: 'Parent-Teacher meeting on Friday at 3:00 PM.', time: '1 day ago' },
    { type: 'info', emoji: '📝', message: 'Mid-term exam timetable published — check Academics.', time: '2 days ago' },
  ];

  // Recent attendance log (last 5)
  const recentAttendance = [...attendanceRecords]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 5);

  const noticeColor = (type) => ({
    warning: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', text: '#d97706' },
    success: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', text: '#059669' },
    info:    { bg: 'rgba(37,99,235,0.08)',  border: 'rgba(37,99,235,0.2)',  text: '#2563eb' },
  }[type] || { bg: 'var(--primary-bg)', border: 'var(--border-color)', text: 'var(--primary)' });

  const initials = (name) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="dashboard-container" style={{ padding: '20px' }}>

          {/* ── HERO BANNER ── */}
          <div style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)',
            borderRadius: '16px',
            padding: '28px 32px',
            color: 'white',
            marginBottom: '22px',
            boxShadow: '0 8px 32px rgba(37,99,235,0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Background decoration */}
            <div style={{ position: 'absolute', top: '-30px', right: '120px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '-40px', right: '40px', width: '160px', height: '160px', background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />

            <div style={{ zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '18px', border: '2px solid rgba(255,255,255,0.3)' }}>
                  {initials(teacherName)}
                </div>
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.8, fontWeight: '500', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Teacher Portal</div>
                  <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em' }}>
                    Namaste, {teacherName}! 🙏
                  </h1>
                </div>
              </div>
              <p style={{ margin: 0, opacity: 0.85, fontSize: '13px' }}>
                {schedule.length} classes scheduled today · {presentToday > 0 ? `${presentToday} students marked present` : 'No attendance marked yet'} · Have a great day!
              </p>
            </div>

            <div style={{ textAlign: 'right', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <div style={{ fontSize: '28px', fontWeight: '800', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{timeStr}</div>
              <div style={{ fontSize: '11px', opacity: 0.75 }}>{dateStr}</div>
            </div>
          </div>

          {/* ── STAT CARDS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', marginBottom: '22px' }}>
            {stats.map((s, i) => (
              <div key={i} className="stat-card" style={{ cursor: 'default', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '5px' }}>{s.label}</div>
                    <div style={{ fontSize: '30px', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.value}</div>
                  </div>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                    {s.icon}
                  </div>
                </div>
                <div>
                  <div style={{ height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden', marginBottom: '7px' }}>
                    <div style={{ width: s.fill, height: '100%', backgroundColor: s.color, borderRadius: '2px', transition: 'width 0.8s ease' }} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── QUICK ACTIONS ── */}
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiActivity size={13} /> Quick Actions
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {quickActions.map((action, i) => (
                <div
                  key={i}
                  onClick={() => navigate(action.path)}
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '16px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    cursor: 'pointer',
                    transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = action.color;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <div style={{ width: '44px', height: '44px', borderRadius: '11px', background: action.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0, boxShadow: `0 4px 12px color-mix(in srgb, ${action.color} 30%, transparent)` }}>
                    {action.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '3px' }}>{action.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{action.desc}</div>
                  </div>
                  <FiArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>

          {/* ── BOTTOM TWO-COLUMN GRID ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>

            {/* Today's Schedule */}
            <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiCalendar size={14} style={{ color: 'var(--primary)' }} /> Today's Schedule
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{schedule.length} classes</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {schedule.map((slot, i) => {
                  const statusColors = {
                    Done: { bg: 'rgba(16,185,129,0.1)', text: '#059669', label: 'Done' },
                    Live: { bg: 'rgba(37,99,235,0.12)', text: '#2563eb', label: '🔴 Live' },
                    Upcoming: { bg: 'rgba(148,163,184,0.1)', text: 'var(--text-muted)', label: 'Soon' },
                  };
                  const sc = statusColors[slot.status] || statusColors.Upcoming;
                  return (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '11px 14px',
                      borderRadius: '9px',
                      backgroundColor: slot.status === 'Live' ? 'rgba(37,99,235,0.05)' : 'var(--primary-bg)',
                      border: slot.status === 'Live' ? '1px solid rgba(37,99,235,0.2)' : '1px solid var(--border-color)',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>{slot.subject}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{slot.class} · {slot.room}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: sc.text, backgroundColor: sc.bg, padding: '2px 7px', borderRadius: '20px' }}>
                          {sc.label}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{slot.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right column: Attendance Summary + Notices */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Attendance Summary */}
              <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiTrendingUp size={14} style={{ color: 'var(--success)' }} /> Today's Attendance
                  </h3>
                  <button
                    onClick={() => navigate('/teacher/attendanceMark')}
                    style={{ padding: '5px 12px', fontSize: '11px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Mark →
                  </button>
                </div>

                {/* Donut-style visual */}
                {todayAttendance.length > 0 ? (
                  <div>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                      {[
                        { label: 'Present', count: presentToday, color: 'var(--success)', bg: 'rgba(16,185,129,0.1)' },
                        { label: 'Absent', count: absentToday, color: 'var(--danger)', bg: 'rgba(248,113,113,0.1)' },
                        { label: 'Total', count: todayAttendance.length, color: 'var(--primary)', bg: 'rgba(37,99,235,0.1)' },
                      ].map((item, i) => (
                        <div key={i} style={{ flex: 1, textAlign: 'center', padding: '10px 8px', backgroundColor: item.bg, borderRadius: '9px' }}>
                          <div style={{ fontSize: '22px', fontWeight: '800', color: item.color }}>{item.count}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', marginTop: '2px' }}>{item.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${attendancePct}%`, background: 'linear-gradient(90deg, var(--success), #10b981)', borderRadius: '3px', transition: 'width 0.8s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Attendance rate</span>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--success)' }}>{attendancePct}%</span>
                    </div>

                    {/* Recent records */}
                    {recentAttendance.length > 0 && (
                      <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recent Records</div>
                        {recentAttendance.map((r, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < recentAttendance.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: '500' }}>{r.student?.user?.name || 'Unknown'}</span>
                            <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', backgroundColor: r.status === 'Present' ? 'rgba(16,185,129,0.1)' : 'rgba(248,113,113,0.1)', color: r.status === 'Present' ? 'var(--success)' : 'var(--danger)' }}>
                              {r.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '30px', marginBottom: '8px' }}>📋</div>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>No attendance marked today</div>
                    <button
                      onClick={() => navigate('/teacher/attendanceMark')}
                      style={{ marginTop: '10px', padding: '7px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                    >
                      Mark Now →
                    </button>
                  </div>
                )}
              </div>

              {/* Notices */}
              <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiBell size={13} style={{ color: '#f59e0b' }} /> Notices & Alerts
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                  {notices.map((n, i) => {
                    const c = noticeColor(n.type);
                    return (
                      <div key={i} style={{ padding: '11px 13px', borderRadius: '9px', backgroundColor: c.bg, border: `1px solid ${c.border}` }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: c.text }}>{n.emoji} {n.message}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiClock size={9} /> {n.time}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;