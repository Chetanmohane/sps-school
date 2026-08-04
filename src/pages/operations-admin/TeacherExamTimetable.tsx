import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { FiCalendar, FiClock, FiMapPin, FiSearch, FiDownload, FiUserCheck, FiBookOpen } from 'react-icons/fi';

interface ExamScheduleItem {
  id: string;
  examDate: string;
  dayName: string;
  timeSlot: string;
  className: string;
  section: string;
  subjectName: string;
  subjectCode: string;
  roomName: string;
  invigilator: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
}

const defaultExamSchedule: ExamScheduleItem[] = [
  {
    id: 'exam-101',
    examDate: '2026-08-10',
    dayName: 'Monday',
    timeSlot: '09:30 AM – 12:30 PM (3 Hrs)',
    className: 'Class 10',
    section: 'Section A',
    subjectName: 'Mathematics & Trigonometry',
    subjectCode: 'MATH-10A',
    roomName: 'Exam Hall A',
    invigilator: 'Chief Invigilator: Math Specialist',
    status: 'Upcoming'
  },
  {
    id: 'exam-102',
    examDate: '2026-08-11',
    dayName: 'Tuesday',
    timeSlot: '09:30 AM – 12:30 PM (3 Hrs)',
    className: 'Class 10',
    section: 'Section B',
    subjectName: 'Mathematics & Coordinate Geometry',
    subjectCode: 'MATH-10B',
    roomName: 'Exam Hall B',
    invigilator: 'Assistant: Science Specialist',
    status: 'Upcoming'
  },
  {
    id: 'exam-103',
    examDate: '2026-08-12',
    dayName: 'Wednesday',
    timeSlot: '01:30 PM – 04:30 PM (3 Hrs)',
    className: 'Class 9',
    section: 'Section A',
    subjectName: 'Mathematics & Algebra',
    subjectCode: 'MATH-09A',
    roomName: 'Hall 201 (First Floor)',
    invigilator: 'Invigilator: Subject Teacher (Math)',
    status: 'Upcoming'
  },
  {
    id: 'exam-104',
    examDate: '2026-08-14',
    dayName: 'Friday',
    timeSlot: '09:30 AM – 12:30 PM (3 Hrs)',
    className: 'Class 12',
    section: 'Section A',
    subjectName: 'Higher Mathematics & Calculus',
    subjectCode: 'MATH-12A',
    roomName: 'Senior Auditorium Hall',
    invigilator: 'Chief: Senior Math Instructor',
    status: 'Upcoming'
  },
  {
    id: 'exam-105',
    examDate: '2026-08-17',
    dayName: 'Monday',
    timeSlot: '09:30 AM – 11:30 AM (2 Hrs)',
    className: 'Class 8',
    section: 'Section A',
    subjectName: 'Mathematics & Mensuration',
    subjectCode: 'MATH-08A',
    roomName: 'Junior Block Room 103',
    invigilator: 'Invigilator: Subject Teacher (Math)',
    status: 'Upcoming'
  }
];

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  Upcoming: { bg: '#dbeafe', text: '#1e3a8a', border: '#93c5fd' },
  Ongoing:  { bg: '#fef3c7', text: '#78350f', border: '#fcd34d' },
  Completed:{ bg: '#d1fae5', text: '#064e3b', border: '#6ee7b7' },
};

const TeacherExamTimetable = () => {
  const [examTypeFilter, setExamTypeFilter] = useState('Mid-Term Examination 2026');
  const [classFilter, setClassFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSchedule = defaultExamSchedule.filter(item => {
    const matchesClass = classFilter === 'all' || item.className.toLowerCase().includes(classFilter.toLowerCase());
    const matchesSearch = !searchQuery ||
      item.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.roomName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

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
                <FiCalendar style={{ color: '#fcd34d' }} /> Exam Timetable & Invigilation Duties
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#bfdbfe', fontWeight: 500 }}>
                View exam dates, time slots, exam halls, and supervision duties for your assigned classes.
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
                <option>Mid-Term Examination 2026</option>
                <option>Unit Test 1 (Quarterly)</option>
                <option>Final Board Pre-Mock Exam</option>
                <option>Annual Examination 2026</option>
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
                <option value="10">Class 10</option>
                <option value="9">Class 9</option>
                <option value="12">Class 12</option>
                <option value="8">Class 8</option>
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
                  placeholder="Subject, room, class..."
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredSchedule.length > 0 ? filteredSchedule.map(item => {
              const sc = statusColors[item.status] || statusColors.Upcoming;
              return (
                <div key={item.id} style={{
                  background: 'var(--card-bg)',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                  transition: 'transform 0.15s, box-shadow 0.15s'
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 10px rgba(0,0,0,0.06)';
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

                    {/* Invigilation Duty */}
                    <div style={{
                      background: '#f0fdf4',
                      border: '1.5px solid #86efac',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginTop: '2px'
                    }}>
                      <FiUserCheck size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 900, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invigilation Duty</div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#14532d' }}>{item.invigilator}</div>
                      </div>
                    </div>
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

        </div>
      </main>
    </div>
  );
};

export default TeacherExamTimetable;
