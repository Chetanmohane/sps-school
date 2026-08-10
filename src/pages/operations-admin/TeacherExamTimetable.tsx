import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { FiCalendar, FiClock, FiMapPin, FiSearch, FiDownload, FiBookOpen, FiLoader } from 'react-icons/fi';
import API from '../../api/axios';

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  Upcoming: { bg: '#dbeafe', text: '#1e3a8a', border: '#93c5fd' },
  Ongoing:  { bg: '#fef3c7', text: '#78350f', border: '#fcd34d' },
  Completed:{ bg: '#d1fae5', text: '#064e3b', border: '#6ee7b7' },
};

const TeacherExamTimetable = () => {
  const teacherName = localStorage.getItem('userName') || '';
  const [examTypeFilter, setExamTypeFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const response = await API.get('/api/exams');
        setExams(response.data.exams || []);
      } catch (error) {
        console.error('Error fetching exams:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const getStatus = (dateStr: string) => {
    const examDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (examDate.getTime() > today.getTime()) return 'Upcoming';
    if (examDate.getTime() === today.getTime()) return 'Ongoing';
    return 'Completed';
  };

  const formattedExams = exams.map(e => ({
    id: e._id,
    examDate: e.date,
    dayName: new Date(e.date).toLocaleDateString('en-US', { weekday: 'long' }),
    timeSlot: `${e.startTime} - ${e.endTime}`,
    className: `Class ${e.className}`,
    section: e.section ? `Section ${e.section}` : '',
    subjectName: e.subject,
    subjectCode: e.subject.substring(0, 4).toUpperCase() + '-' + e.className,
    roomName: e.roomNumber || 'Hall-1',
    invigilator: e.invigilator || 'TBD',
    createdBy: e.createdBy || 'Admin',
    status: getStatus(e.date),
    examTitle: e.title
  }));

  const filteredSchedule = formattedExams.filter(item => {
    const matchesTitle = examTypeFilter === 'All' || item.examTitle === examTypeFilter;
    const matchesClass = classFilter === 'all' || item.className.toLowerCase().includes(`class ${classFilter.toLowerCase()}`);
    const matchesSearch = !searchQuery ||
      item.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.invigilator.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTitle && matchesClass && matchesSearch;
  });

  const uniqueTitles = ['All', ...Array.from(new Set(exams.map(e => e.title)))];

  const handleExportCSV = () => {
    const headers = ['Date', 'Day', 'Time Slot', 'Class & Section', 'Subject Name', 'Subject Code', 'Exam Room', 'Invigilator Duty', 'Status'];
    const rows = filteredSchedule.map(item => [
      item.examDate, item.dayName, item.timeSlot,
      `${item.className} ${item.section}`, item.subjectName,
      item.subjectCode, item.roomName, item.invigilator, item.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Exam_Timetable_${examTypeFilter.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>

          {/* ── HERO BANNER ── */}
          <div style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            borderRadius: '18px',
            padding: '24px 28px',
            color: '#ffffff',
            marginBottom: '20px',
            boxShadow: '0 8px 24px rgba(37,99,235,0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div>
              <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '100px',
                fontSize: '10px',
                fontWeight: 900,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '8px'
              }}>
                📅 Academic Examination Schedule
              </span>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FiCalendar style={{ color: '#fcd34d' }} /> Exam Timetable & Schedule
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#bfdbfe', fontWeight: 500 }}>
                View exam dates, time slots, exam halls, and schedule for your assigned classes.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              style={{
                padding: '10px 20px',
                background: '#10b981',
                color: '#fff',
                border: '1px solid #34d399',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
              }}
            >
              <FiDownload size={15} /> Export CSV
            </button>
          </div>

          {/* ── FILTER BAR ── */}
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'flex-end'
          }}>
            {/* Exam Term */}
            <div style={{ flex: '1', minWidth: '180px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Exam Term
              </label>
              <select
                value={examTypeFilter}
                onChange={e => setExamTypeFilter(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px',
                  background: 'var(--input-bg)', color: 'var(--text-main)',
                  border: '2px solid var(--border-color)', borderRadius: '10px',
                  fontSize: '13px', fontWeight: 700, outline: 'none'
                }}
              >
                {uniqueTitles.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Class Filter */}
            <div style={{ width: '140px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Class
              </label>
              <select
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px',
                  background: 'var(--input-bg)', color: 'var(--text-main)',
                  border: '2px solid var(--border-color)', borderRadius: '10px',
                  fontSize: '13px', fontWeight: 700, outline: 'none'
                }}
              >
                <option value="all">All Classes</option>
                {Array.from({ length: 12 }, (_, i) => String(i + 1)).map(c => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div style={{ flex: '1', minWidth: '180px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Search
              </label>
              <div style={{ position: 'relative' }}>
                <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#3b82f6' }} size={15} />
                <input
                  type="text"
                  placeholder="Subject, room, class, invigilator..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', paddingLeft: '36px', paddingRight: '12px', paddingTop: '9px', paddingBottom: '9px',
                    background: 'var(--input-bg)', color: 'var(--text-main)',
                    border: '2px solid var(--border-color)', borderRadius: '10px',
                    fontSize: '13px', fontWeight: 600, outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── INFO ROW ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <FiBookOpen style={{ color: '#2563eb' }} size={17} />
            <span style={{ fontWeight: 900, fontSize: '14px', color: 'var(--text-main)' }}>{examTypeFilter}</span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontWeight: 900, fontSize: '14px', color: '#2563eb' }}>{filteredSchedule.length} Exam{filteredSchedule.length !== 1 ? 's' : ''} Scheduled</span>
          </div>

          {/* ── CARD GRID ── */}
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <FiLoader size={28} className="animate-spin" style={{ color: 'var(--text-muted)', margin: '0 auto' }} />
              <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>Loading exams...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {filteredSchedule.length > 0 ? filteredSchedule.map(item => {
                const sc = statusColors[item.status] || statusColors.Upcoming;
                const isMyDuty = item.invigilator === teacherName;
                return (
                  <div key={item.id} style={{
                    background: 'var(--card-bg)',
                    border: isMyDuty ? '2px solid #3b82f6' : '1.5px solid var(--border-color)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: isMyDuty ? '0 4px 12px rgba(59, 130, 246, 0.2)' : '0 2px 10px rgba(0,0,0,0.06)',
                    transition: 'transform 0.15s, box-shadow 0.15s'
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'none';
                      (e.currentTarget as HTMLElement).style.boxShadow = isMyDuty ? '0 4px 12px rgba(59, 130, 246, 0.2)' : '0 2px 10px rgba(0,0,0,0.06)';
                    }}
                  >
                    {/* Card Top Strip */}
                    <div style={{ background: 'linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#bfdbfe', fontWeight: 700 }}>{item.subjectCode}</div>
                        <div style={{ fontSize: '15px', color: '#fff', fontWeight: 900 }}>{item.subjectName}</div>
                      </div>
                      <span style={{
                        padding: '4px 12px',
                        background: sc.bg,
                        color: sc.text,
                        border: `1px solid ${sc.border}`,
                        borderRadius: '100px',
                        fontSize: '11px',
                        fontWeight: 900,
                        whiteSpace: 'nowrap'
                      }}>
                        {item.status}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

                      {/* Date & Day */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '10px',
                          background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <FiCalendar size={17} style={{ color: '#1d4ed8' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--text-main)' }}>
                            {new Date(item.examDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>{item.dayName}</div>
                        </div>
                      </div>

                      {/* Class & Section */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '10px',
                          background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <span style={{ fontSize: '18px' }}>🏫</span>
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--text-main)' }}>{item.className} — {item.section}</div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Class & Section</div>
                        </div>
                      </div>

                      {/* Time Slot */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '10px',
                          background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <FiClock size={17} style={{ color: '#d97706' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--text-main)' }}>{item.timeSlot}</div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Exam Duration</div>
                        </div>
                      </div>

                      {/* Room */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '10px',
                          background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <FiMapPin size={17} style={{ color: '#dc2626' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--text-main)' }}>{item.roomName}</div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Exam Hall / Room</div>
                        </div>
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>Scheduled By: {item.createdBy}</div>
                    </div>
                  </div>
                );
              }) : (
                <div style={{
                  gridColumn: '1 / -1',
                  padding: '48px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  background: 'var(--card-bg)',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  fontWeight: 700,
                  fontSize: '15px'
                }}>
                  No exam schedules found for the selected filters.
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default TeacherExamTimetable;
