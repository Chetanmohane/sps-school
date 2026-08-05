import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import RoleHierarchyMap from '../../components/RoleHierarchyMap';
import API from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import { useSharedState } from '../../hooks/useSharedState';
import { FiShield, FiActivity, FiUsers, FiTrendingUp, FiTrash2, FiPlus, FiEye, FiEyeOff, FiEdit2, FiX, FiCheck, FiCalendar, FiClock, FiDownload } from 'react-icons/fi';

/* ─────────────────────────────────────────────────────────────────
   EXAM TIMETABLE TAB COMPONENT (used inside Super Admin Dashboard)
───────────────────────────────────────────────────────────────── */
const CLASSES = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];
const TIME_OPTIONS = ['08:00 AM','08:30 AM','09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM','01:00 PM','01:30 PM','02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM','05:00 PM'];

const inputSx: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: '8px',
  border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)',
  color: 'var(--text-main)', fontSize: '13px', outline: 'none', boxSizing: 'border-box'
};
const labelSx: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '4px',
  fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)',
  textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '6px'
};

const ExamTimetableTab: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');
  const [startFilter, setStartFilter] = useState('');
  const [endFilter, setEndFilter] = useState('');
  const [form, setForm] = useState({
    title: '', date: '', startTime: '10:00 AM', endTime: '01:00 PM',
    roomNumber: 'Hall-A', maxMarks: '100', className: '1st', subject: ''
  });

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await API.get('/api/exams');
      setExams(res.data.exams || []);
    } catch { setExams([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchExams(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.subject) {
      setStatusMsg('Please fill in Exam Title, Date, and Subject.'); setStatusType('error'); return;
    }
    try {
      setSubmitting(true); setStatusMsg('');
      await API.post('/api/exams', form);
      setStatusMsg(`✅ Exam "${form.title}" for Class ${form.className} scheduled on ${form.date}!`);
      setStatusType('success');
      setForm({ title: '', date: '', startTime: '10:00 AM', endTime: '01:00 PM', roomNumber: 'Hall-A', maxMarks: '100', className: '1st', subject: '' });
      fetchExams();
    } catch (err: any) {
      setStatusMsg(err.response?.data?.message || 'Failed to schedule exam. Try again.'); setStatusType('error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete exam "${title}"?`)) return;
    try {
      await API.delete(`/api/exams/${id}`);
      setStatusMsg(`🗑️ Exam "${title}" deleted.`); setStatusType('success');
      fetchExams();
    } catch { setStatusMsg('Failed to delete exam.'); setStatusType('error'); }
  };

  const filtered = exams.filter(e => {
    const d = e.date ? e.date.split('T')[0] : '';
    if (startFilter && endFilter) return d >= startFilter && d <= endFilter;
    if (startFilter) return d >= startFilter;
    if (endFilter) return d <= endFilter;
    return true;
  });

  const downloadCSV = () => {
    if (!filtered.length) { alert('No data to export.'); return; }
    const esc = (v: any) => { let s = String(v ?? ''); if (s.includes(',') || s.includes('"')) s = `"${s.replace(/"/g,'""')}"`; return s; };
    const rows = [['Exam Title','Date','Start Time','End Time','Class','Subject','Room','Max Marks'].join(',')];
    filtered.forEach(e => rows.push([e.title, new Date(e.date).toLocaleDateString(), e.startTime, e.endTime, e.className, e.subject, e.roomNumber, e.maxMarks || 100].map(esc).join(',')));
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'exam_timetable.csv'; a.click();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '8px 12px', borderRadius: '10px', fontSize: '18px' }}>📅</span>
          Exam Timetable Management
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
          Schedule new exams with time slots, class & subject assignment. Manage and export exam timetables.
        </p>
      </div>

      {/* Status Message */}
      {statusMsg && (
        <div style={{ marginBottom: '16px', padding: '11px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
          backgroundColor: statusType === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          color: statusType === 'success' ? '#10b981' : '#ef4444',
          border: `1px solid ${statusType === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
          {statusMsg}
        </div>
      )}

      {/* Schedule Form */}
      <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '28px', marginBottom: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiPlus style={{ color: '#f59e0b' }} /> Schedule New Exam
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <label style={labelSx}>Exam Title *</label>
              <input style={inputSx} type="text" name="title" required value={form.title} onChange={handleChange} placeholder="e.g. Mid-Term Examination" />
            </div>
            <div>
              <label style={labelSx}><FiCalendar size={11}/> Exam Date *</label>
              <input style={inputSx} type="date" name="date" required value={form.date} onChange={handleChange} />
            </div>
            <div>
              <label style={labelSx}><FiClock size={11}/> Start Time</label>
              <select style={inputSx} name="startTime" value={form.startTime} onChange={handleChange}>
                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelSx}><FiClock size={11}/> End Time</label>
              <select style={inputSx} name="endTime" value={form.endTime} onChange={handleChange}>
                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelSx}>Class</label>
              <select style={inputSx} name="className" value={form.className} onChange={handleChange}>
                {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelSx}>Subject *</label>
              <input style={inputSx} type="text" name="subject" required value={form.subject} onChange={handleChange} placeholder="e.g. Mathematics" />
            </div>
            <div>
              <label style={labelSx}>Room / Venue</label>
              <input style={inputSx} type="text" name="roomNumber" value={form.roomNumber} onChange={handleChange} placeholder="Hall-A / Room 101" />
            </div>
            <div>
              <label style={labelSx}>Max Marks</label>
              <input style={inputSx} type="number" name="maxMarks" value={form.maxMarks} onChange={handleChange} placeholder="100" />
            </div>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', gap: '12px', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <button type="submit" disabled={submitting} style={{
              padding: '12px 28px', backgroundColor: '#f59e0b', color: 'white',
              border: 'none', borderRadius: '10px', cursor: submitting ? 'not-allowed' : 'pointer',
              fontWeight: 800, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 14px rgba(245,158,11,0.35)', opacity: submitting ? 0.7 : 1, transition: 'all 0.2s'
            }}>
              <FiPlus />
              {submitting ? 'Scheduling...' : '📅 Add to Timetable'}
            </button>
            <button type="button" onClick={() => setForm({ title: '', date: '', startTime: '10:00 AM', endTime: '01:00 PM', roomNumber: 'Hall-A', maxMarks: '100', className: '1st', subject: '' })}
              style={{ padding: '12px 20px', backgroundColor: 'var(--panel-bg)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>
              🧹 Clear
            </button>
          </div>
        </form>
      </div>

      {/* Timetable List */}
      <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>📋 Scheduled Exam Timetable ({filtered.length} exams)</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>From</div>
              <input type="date" value={startFilter} onChange={e => setStartFilter(e.target.value)} style={{ ...inputSx, width: 'auto' }} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>To</div>
              <input type="date" value={endFilter} onChange={e => setEndFilter(e.target.value)} style={{ ...inputSx, width: 'auto' }} />
            </div>
            <button onClick={downloadCSV} style={{ padding: '10px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiDownload /> Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>⏳ Loading exam timetables...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>📭 No exam timetables scheduled yet. Add one above!</div>
        ) : (
          <div className="table-container">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Exam Title</th>
                  <th>Date</th>
                  <th>Time Slot</th>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Room / Venue</th>
                  <th>Max Marks</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((exam, idx) => (
                  <tr key={exam._id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 700 }}>{idx + 1}</td>
                    <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{exam.title}</td>
                    <td>
                      <span style={{ padding: '3px 8px', backgroundColor: 'rgba(99,102,241,0.1)', color: '#6366f1', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                        {new Date(exam.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td>
                      <span style={{ padding: '3px 8px', backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                        🕐 {exam.startTime || '10:00 AM'} – {exam.endTime || '01:00 PM'}
                      </span>
                    </td>
                    <td><span style={{ padding: '2px 8px', backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>Class {exam.className}</span></td>
                    <td style={{ fontWeight: 600 }}>{exam.subject}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{exam.roomNumber || 'Hall-A'}</td>
                    <td style={{ fontWeight: 700, textAlign: 'center' }}>{exam.maxMarks || 100}</td>
                    <td>
                      <button onClick={() => handleDelete(exam._id, exam.title)} style={{ padding: '6px 14px', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FiTrash2 size={12} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};


const SuperAdminDashboard = () => {
  const { onEvent } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    const unsubFee = onEvent('FEE_CHANGED', () => {
      fetchFees();
      if (window.showToast) {
        window.showToast("⚡ Real-time Update: Student fee statement updated!", "success");
      }
    });
    const unsubAtt = onEvent('ATTENDANCE_CHANGED', () => {
      fetchAttendanceData();
      if (window.showToast) {
        window.showToast("📋 Real-time Update: Student attendance marked!", "info");
      }
    });
    return () => {
      unsubFee();
      unsubAtt();
    };
  }, [onEvent]);

  const activeTab = new URLSearchParams(location.search).get('tab') || 'overview';

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', targetRole: 'all', targetClass: 'all' });
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoadingAnnouncements(true);
      const res = await API.get('/api/notifications');
      setAnnouncements(res.data?.data || []);
    } catch (err) {
      console.warn("Error fetching announcements", err);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const publishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.message) return;
    try {
      setPublishing(true);
      await API.post('/api/notifications', newAnnouncement);
      setNewAnnouncement({ title: '', message: '', targetRole: 'all', targetClass: 'all' });
      fetchAnnouncements();
      if (window.showToast) {
        window.showToast("Notice published successfully!", "success");
      }
    } catch (err: any) {
      alert("Failed to publish notice: " + (err.response?.data?.message || err.message));
    } finally {
      setPublishing(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notice?")) return;
    try {
      await API.delete(`/api/notifications/${id}`);
      fetchAnnouncements();
      if (window.showToast) {
        window.showToast("Notice deleted successfully!", "info");
      }
    } catch (err: any) {
      alert("Failed to delete notice: " + (err.response?.data?.message || err.message));
    }
  };


  // ── MONGO DB STATE ─────────────────────────────────────────────────────────────
  const [students, setStudents] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [subAdmins, setSubAdmins] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showEditStudent, setShowEditStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedViewStudent, setSelectedViewStudent] = useState<any>(null);
  const [viewStudentAttendance, setViewStudentAttendance] = useState<any>({ records: [], percentage: 0 });
  const [viewStudentExams, setViewStudentExams] = useState<any[]>([]);
  const [viewStudentFees, setViewStudentFees] = useState<any[]>([]);
  const [viewTab, setViewTab] = useState<'profile' | 'attendance' | 'exams' | 'results' | 'fees'>('profile');

  const handleViewStudentDetails = async (student: any) => {
    setSelectedViewStudent(student);
    setViewTab('profile');
    try {
      const email = student.email;
      const studentClass = (student.class || student.className || '').toString().trim();
      console.log("[ViewDetails] Student:", student.name, "| Email:", email, "| Class:", studentClass);

      const [attRes, examsRes, feesRes] = await Promise.allSettled([
        email ? API.get(`/api/attendance/${email}`) : Promise.reject('no email'),
        API.get('/api/exams'),
        email ? API.get('/api/finance/my-fees', { params: { email } }) : Promise.reject('no email')
      ]);

      // Attendance
      if (attRes.status === 'fulfilled' && attRes.value.data) {
        setViewStudentAttendance(attRes.value.data);
      } else {
        setViewStudentAttendance({ records: [], percentage: 0 });
      }

      // Exam Timetable — filter by student's class
      if (examsRes.status === 'fulfilled' && examsRes.value.data) {
        const allExams = examsRes.value.data.exams || [];
        console.log("[ViewDetails] Total Exams from API:", allExams.length, "| Student class:", studentClass);
        console.log("[ViewDetails] Exam classNames:", allExams.map((e: any) => e.className));
        const classExams = allExams.filter((exam: any) => {
          const examClass = (exam.className || '').toString().trim().toLowerCase();
          const stuClass = studentClass.toLowerCase();
          return examClass === stuClass || examClass.includes(stuClass) || stuClass.includes(examClass);
        });
        console.log("[ViewDetails] Filtered Exams for class:", classExams.length);
        setViewStudentExams(classExams);
      } else {
        console.log("[ViewDetails] Exams fetch failed:", examsRes);
        setViewStudentExams([]);
      }

      // Fees
      if (feesRes.status === 'fulfilled' && feesRes.value.data) {
        setViewStudentFees(feesRes.value.data);
      } else {
        setViewStudentFees([]);
      }
    } catch (err) {
      console.error("Error loading view student details:", err);
    }
  };
  const [showAddFee, setShowAddFee] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [editAdminForm, setEditAdminForm] = useState({ name:'', phone:'', role:'', password:'', remarks:'' });
  const [showEditPassword, setShowEditPassword] = useState(false);

  const [studentForm, setStudentForm] = useState({ name:'', email:'', class:'', section:'', roll:'', dob:'', gender:'', phone:'', parent:'', parentPhone:'', blood:'' });
  const [feeForm, setFeeForm] = useState({ studentId:'', amount:'', dueDate:'', remarks:'' });
  const [feeFormClass, setFeeFormClass] = useState('');
  const [feeFormSection, setFeeFormSection] = useState('');
  const [adminForm, setAdminForm] = useState({ name:'', email:'', phone:'', password:'', role:'finance-admin', remarks:'' });
  const [searchStudent, setSearchStudent] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('all');
  const [studentSectionFilter, setStudentSectionFilter] = useState('all');
  const [studentDateFrom, setStudentDateFrom] = useState('');
  const [studentDateTo, setStudentDateTo] = useState('');

  // Teacher Filter States
  const [academicSubTab, setAcademicSubTab] = useState<'dashboard' | 'class-teacher' | 'subject-teacher'>('dashboard');
  const [searchTeacher, setSearchTeacher] = useState('');
  const [teacherDeptFilter, setTeacherDeptFilter] = useState('all');
  const [teacherSpecFilter, setTeacherSpecFilter] = useState('all');
  const [teacherRoleFilter, setTeacherRoleFilter] = useState('all');

  // Finance Filter States
  const [searchFee, setSearchFee] = useState('');
  const [feeFilter, setFeeFilter] = useState('all');
  const [feeClassFilter, setFeeClassFilter] = useState('all');
  const [feeSectionFilter, setFeeSectionFilter] = useState('all');
  const [feeDateFrom, setFeeDateFrom] = useState('');
  const [feeDateTo, setFeeDateTo] = useState('');

  // Sub-Admin & Manager Operations Filter States
  const [searchSubAdmin, setSearchSubAdmin] = useState('');
  const [subAdminRoleFilter, setSubAdminRoleFilter] = useState('all');
  const [subAdminStatusFilter, setSubAdminStatusFilter] = useState('all');
  const [subAdminDateFrom, setSubAdminDateFrom] = useState('');
  const [subAdminDateTo, setSubAdminDateTo] = useState('');

  // Attendance States
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [searchAttendance, setSearchAttendance] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [attendanceSubTab, setAttendanceSubTab] = useState('view');

  // Mark Attendance States
  const [markClass, setMarkClass] = useState('');
  const [markSection, setMarkSection] = useState('');
  const [markDate, setMarkDate] = useState(new Date().toISOString().split('T')[0]);
  const [markNameSearch, setMarkNameSearch] = useState('');
  const [markStudents, setMarkStudents] = useState([]);
  const [markAttendanceList, setMarkAttendanceList] = useState({});
  const [markLoading, setMarkLoading] = useState(false);
  const [markSaving, setMarkSaving] = useState(false);

  const [systemLogs, setSystemLogs] = useState([
    { time:'20:01:10', type:'system',   text:'Super Admin Control Panel initialized.' },
    { time:'20:01:12', type:'system',   text:'Database connection pools established.' },
    { time:'20:01:15', type:'security', text:'Role authorization check completed.' },
    { time:'20:01:20', type:'gateway',  text:'API Gateway ONLINE — Port 5001.' },
  ]);
  const logsEndRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const msgs = [
        { type:'system',   text:'Diagnostic cleanup: cleared temp builds.' },
        { type:'gateway',  text:'Health check from CDN node: 200 OK.' },
        { type:'security', text:'Session token refresh triggered.' },
        { type:'database', text:'DB integrity indexes synchronized.' },
      ];
      setSystemLogs(p => [...p, { time: new Date().toTimeString().split(' ')[0], ...msgs[Math.floor(Math.random()*msgs.length)] }]);
    }, 4500);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [systemLogs]);

  const trigger = (text, type='success') => { setStatusMsg({ text, type }); setTimeout(() => setStatusMsg(null), 4000); };

  // Fetch Attendance Records & Students from MongoDB
  const fetchStudents = async () => {
    try {
      const response = await API.get('/api/admin/student-admin/students');
      const dbStudents = response.data.data || [];
      const mappedStudents = dbStudents.map((s: any) => ({
        id: s._id,
        _id: s._id,
        name: s.user?.name || 'Unknown',
        email: s.user?.email || '',
        phone: s.user?.phone || '',
        class: s.className || '',
        section: s.section || '',
        roll: s.rollNumber || '',
        dob: s.dob ? s.dob.slice(0, 10) : '',
        gender: s.gender || '',
        parent: s.parentName || '',
        parentPhone: s.parentPhone || '',
        blood: s.bloodGroup || '',
        address: s.address || '',
        status: s.status || 'Active',
        admission: s.allocationDate ? s.allocationDate.slice(0, 10) : s.createdAt?.slice(0, 10) || ''
      }));
      setStudents(mappedStudents);
      return mappedStudents;
    } catch (err) {
      console.error("Error fetching students:", err);
      return students;
    }
  };

  const fetchAttendanceData = async () => {
    setLoadingAttendance(true);
    try {
      const response = await API.get('/api/attendance/all');
      const mappedRecords = response.data.map((r: any) => {
        const studentObj = r.student || {};
        const userObj = studentObj.user || {};
        return {
          _id: r._id,
          studentId: studentObj._id || '',
          date: r.date ? new Date(r.date).toISOString().split('T')[0] : '',
          status: r.status,
          student: {
            className: studentObj.className || '',
            section: studentObj.section || '',
            rollNumber: studentObj.rollNumber || '',
            user: {
              name: userObj.name || 'Unknown',
              email: userObj.email || ''
            }
          }
        };
      });
      setAttendanceRecords(mappedRecords);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      trigger("Failed to load attendance records", "danger");
    } finally {
      setLoadingAttendance(false);
    }
  };
  // Fetch Sub-Admins from MongoDB
  const fetchAdmins = async () => {
    try {
      const [financeRes, studentRes, academicRes, managerRes] = await Promise.all([
        API.get('/api/super-admin/role/finance-admin'),
        API.get('/api/super-admin/role/student-admin'),
        API.get('/api/super-admin/role/academic-admin'),
        API.get('/api/super-admin/role/manager-admin')
      ]);
      const allAdmins = [...(financeRes.data || []), ...(studentRes.data || []), ...(academicRes.data || []), ...(managerRes.data || [])];
      const mappedAdmins = allAdmins.map((a: any) => ({
        id: a._id,
        _id: a._id,
        name: a.name || 'Unknown',
        email: a.email || '',
        phone: a.phone || '',
        role: a.role || '',
        created: a.createdAt ? a.createdAt.slice(0, 10) : '',
        status: 'Active',
        createdBy: a.createdBy || 'Super Admin',
        updatedBy: a.updatedBy || 'Super Admin',
        remarks: a.remarks || 'No remarks recorded'
      }));
      setSubAdmins(mappedAdmins);
    } catch (err) {
      console.error("Error fetching admins:", err);
    }
  };

  // Fetch Fees from MongoDB
  const fetchFees = async () => {
    try {
      const response = await API.get('/api/finance/all');
      const dbFees = response.data || [];
      const mappedFees = dbFees.map((f: any) => {
        const studentObj = f.studentId || {};
        const userObj = studentObj.user || {};
        const totalAmount = Number(f.amount) || 0;
        let paidAmount = f.paidAmount !== undefined ? Number(f.paidAmount) : (f.status === 'Paid' ? totalAmount : 0);
        if (f.status === 'Paid') paidAmount = totalAmount;
        const pendingAmount = Math.max(0, totalAmount - paidAmount);

        let calculatedStatus = f.status || 'Pending';
        if (paidAmount >= totalAmount && totalAmount > 0) calculatedStatus = 'Paid';
        else if (paidAmount > 0 && paidAmount < totalAmount) calculatedStatus = 'Partial';
        else if (paidAmount === 0) calculatedStatus = 'Pending';

        return {
          id: f._id,
          _id: f._id,
          student: userObj.name || 'Unknown Student',
          studentId: studentObj._id || '',
          roll: studentObj.rollNumber || 'N/A',
          class: studentObj.className ? `Class ${studentObj.className}-${studentObj.section || ''}` : 'N/A',
          tuition: totalAmount,
          transport: 0,
          library: 0,
          total: totalAmount,
          paid: paidAmount,
          due: pendingAmount,
          status: calculatedStatus,
          updatedBy: f.updatedBy || 'Super Admin',
          remarks: f.remarks || 'No remarks recorded',
          date: f.dueDate ? f.dueDate.slice(0, 10) : '',
          paymentDate: f.paymentDate ? f.paymentDate.slice(0, 10) : '',
          term: 'Term 1',
          method: f.status === 'Paid' || f.status === 'Partial' ? 'Online' : '-'
        };
      });
      setFees(mappedFees);
    } catch (err) {
      console.error("Error fetching fees:", err);
    }
  };

  const fetchAcademicData = async () => {
    try {
      const [teachersRes, classesRes] = await Promise.all([
        API.get('/api/academic-admin/teachers'),
        API.get('/api/academic-admin/classes')
      ]);
      setTeachers(teachersRes.data.data || []);
      setClasses(classesRes.data.data || []);
    } catch (err) {
      console.error("Error fetching academic data:", err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchAttendanceData();
    fetchAdmins();
    fetchFees();
    fetchAcademicData();
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendanceData();
    } else if (activeTab === 'finance') {
      fetchFees();
    } else if (activeTab === 'admins') {
      fetchAdmins();
    }
  }, [activeTab]);

  const goTab = (tab) => navigate(`/super-admin?tab=${tab}`);

  // CSV/Excel Download Helper
  const downloadCSV = (data, filename, headers) => {
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      let stringVal = String(val);
      if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
        stringVal = `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    };

    const csvRows = [];
    csvRows.push(headers.map(escapeCSV).join(','));
    for (const row of data) {
      csvRows.push(row.map(escapeCSV).join(','));
    }
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    trigger("Excel sheet downloaded successfully!");
  };

  // Global Export Date Filters
  const [globalStartDate, setGlobalStartDate] = useState('');
  const [globalEndDate, setGlobalEndDate] = useState('');

  const filterByDateRange = (data, dateFieldGetter) => {
    return data.filter(item => {
      let matchesDate = true;
      const dateStr = dateFieldGetter(item);
      if (!dateStr || dateStr === 'N/A' || dateStr === '-') return true; // Include items with no date
      
      const normalizedDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;

      if (globalStartDate && globalEndDate) {
        matchesDate = normalizedDateStr >= globalStartDate && normalizedDateStr <= globalEndDate;
      } else if (globalStartDate) {
        matchesDate = normalizedDateStr >= globalStartDate;
      } else if (globalEndDate) {
        matchesDate = normalizedDateStr <= globalEndDate;
      }
      return matchesDate;
    });
  };

  const handleExportAttendance = () => {
    const dataToExport = filterByDateRange(filteredAttendance, r => r.date);
    if (dataToExport.length === 0) return alert("No attendance data to export for the selected dates.");
    const headers = ['Roll Number', 'Student Name', 'Email', 'Class', 'Section', 'Date', 'Status'];
    const data = dataToExport.map(r => [
      r.student?.rollNumber || 'N/A',
      r.student?.user?.name || 'N/A',
      r.student?.user?.email || 'N/A',
      r.student?.className || 'N/A',
      r.student?.section || 'N/A',
      r.date ? new Date(r.date).toLocaleDateString() : 'N/A',
      r.status || 'N/A'
    ]);
    downloadCSV(data, 'student_attendance_report.csv', headers);
  };

  const handleExportFinance = () => {
    const dataToExport = filterByDateRange(filteredFees, f => f.date);
    if (dataToExport.length === 0) return alert("No finance data to export for the selected dates.");
    const headers = ['Student Name', 'Class-Section', 'Tuition', 'Transport', 'Library', 'Total', 'Paid', 'Due', 'Term', 'Payment Method', 'Date', 'Status'];
    const data = dataToExport.map(f => [
      f.student,
      f.class,
      f.tuition,
      f.transport,
      f.library,
      f.total,
      f.paid,
      f.due,
      f.term,
      f.method,
      f.date,
      f.status
    ]);
    downloadCSV(data, 'finance_fees_report.csv', headers);
  };

  const handleExportSubAdmins = () => {
    const dataToExport = filterByDateRange(subAdmins, a => a.created);
    if (dataToExport.length === 0) return alert("No admin data to export for the selected dates.");
    const headers = ['Name', 'Email', 'Phone', 'Role', 'Created Date', 'Status'];
    const data = dataToExport.map(a => [
      a.name,
      a.email,
      a.phone || 'N/A',
      a.role,
      a.created,
      a.status
    ]);
    downloadCSV(data, 'sub_admins_report.csv', headers);
  };

  // Export Students
  const handleExportStudents = () => {
    const dataToExport = filterByDateRange(students, s => s.admission);
    if (dataToExport.length === 0) return alert("No student data to export for the selected dates.");
    const headers = ['ID', 'Name', 'Email', 'Class', 'Section', 'Roll No', 'DOB', 'Gender', 'Phone', 'Parent', 'Parent Phone', 'Blood Group', 'Status', 'Admission Date'];
    const data = dataToExport.map(s => [
      s.id, s.name, s.email, s.class, s.section, s.roll, s.dob, s.gender, s.phone, s.parent, s.parentPhone, s.blood, s.status, s.admission
    ]);
    downloadCSV(data, 'students_report.csv', headers);
  };

  // Export System Logs
  const handleExportLogs = () => {
    const headers = ['Time', 'Type', 'Message'];
    const data = systemLogs.map(l => [l.time, l.type, l.text]);
    downloadCSV(data, 'system_logs_report.csv', headers);
  };

  // Mark Attendance Handlers
  const fetchMarkStudents = async () => {
    if (!markClass && !markSection && !markNameSearch) {
      trigger('Please provide Class, Section, or Student Name', 'danger');
      return;
    }
    setMarkLoading(true);
    try {
      const latestStudents = await fetchStudents();
      let filtered = latestStudents;
      if (markClass) filtered = filtered.filter(s => normalizeClass(s.class) === normalizeClass(markClass));
      if (markSection) filtered = filtered.filter(s => s.section === markSection);
      if (markNameSearch) filtered = filtered.filter(s => s.name.toLowerCase().includes(markNameSearch.toLowerCase()));
      
      setMarkStudents(filtered);
      const initialStatus = {};
      filtered.forEach(s => {
        const existingRecord = attendanceRecords.find(r => r.studentId === s.id && r.date === markDate);
        initialStatus[s.id] = existingRecord ? existingRecord.status : 'Present';
      });
      setMarkAttendanceList(initialStatus);
    } catch (err) {
      console.error(err);
      trigger('Failed to fetch student list', 'danger');
    } finally {
      setMarkLoading(false);
    }
  };

  const submitMarkAttendance = async () => {
    if (Object.keys(markAttendanceList).length === 0) {
      trigger('No attendance data to save!', 'danger');
      return;
    }
    if (!markDate) {
      trigger('Please select a date.', 'danger');
      return;
    }
    setMarkSaving(true);
    try {
      const attendanceData = Object.keys(markAttendanceList).map(studentId => ({
        studentId,
        status: markAttendanceList[studentId]
      }));

      await API.post('/api/attendance/bulkSubmit', {
        attendanceData,
        date: markDate
      });

      trigger('Attendance marked successfully!');
      setMarkStudents([]);
      setMarkAttendanceList({});
      setAttendanceSubTab('view'); // Switch back to view tab to see the saved records
      await fetchAttendanceData();
    } catch (err) {
      console.error(err);
      trigger('Error saving attendance', 'danger');
    } finally {
      setMarkSaving(false);
    }
  };

  const handleMarkStatusChange = (id, status) => {
    setMarkAttendanceList(prev => ({ ...prev, [id]: status }));
  };

  const markAllPresent = () => {
    const allPresent = {};
    markStudents.forEach(s => allPresent[s.id] = 'Present');
    setMarkAttendanceList(allPresent);
  };

  const markAllAbsent = () => {
    const allAbsent = {};
    markStudents.forEach(s => allAbsent[s.id] = 'Absent');
    setMarkAttendanceList(allAbsent);
  };

  // helpers
  const normalizeClass = (cls) => {
    if (!cls) return '';
    return cls.toString().toLowerCase().replace('class', '').replace('th', '').replace('rd', '').replace('nd', '').replace('st', '').trim();
  };
  const inS: React.CSSProperties = { width:'100%', padding:'9px 12px', border:'1px solid var(--border-color)', borderRadius:'7px', backgroundColor:'var(--input-bg)', color:'var(--text-main)', outline:'none', boxSizing:'border-box' as const, fontSize:'13px' };
  const lb = { display:'block', marginBottom:'4px', fontWeight:'600', fontSize:'12px', color:'var(--text-main)' };
  const badge = (status) => {
    const sLower = status?.toLowerCase() || '';
    return <span className={`status-badge ${sLower}`}>{status}</span>;
  };
  const avatarColors = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6'];
  const av = (name) => ({ bg: avatarColors[(name?.charCodeAt(0)||0) % avatarColors.length], initials: name ? name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) : '?' });

  const uniqueStudentClasses = [...new Set(students.map(s => (s.class || s.className || '').toString()).filter(Boolean))].sort();
  const uniqueStudentSections = [...new Set(students.map(s => (s.section || '').toString()).filter(Boolean))].sort();

  const filteredStudents = students.filter(s => {
    const sName = s.name || s.user?.name || '';
    const sEmail = s.email || s.user?.email || '';
    const sRoll = (s.roll || s.rollNumber || '').toString();
    const sClass = (s.class || s.className || '').toString();
    const sSec = (s.section || '').toString();

    const matchSearch = !searchStudent ||
      sName.toLowerCase().includes(searchStudent.toLowerCase()) ||
      sEmail.toLowerCase().includes(searchStudent.toLowerCase()) ||
      sRoll.toLowerCase().includes(searchStudent.toLowerCase());

    const matchClass = studentClassFilter === 'all' || sClass === studentClassFilter || normalizeClass(sClass) === normalizeClass(studentClassFilter);
    const matchSection = studentSectionFilter === 'all' || sSec.toUpperCase() === studentSectionFilter.toUpperCase();

    const sDate = s.createdAt || s.allocationDate || s.admissionDate || s.dob;
    let matchDate = true;
    if (sDate) {
      const studentDateStr = new Date(sDate).toISOString().slice(0, 10);
      if (studentDateFrom && studentDateStr < studentDateFrom) matchDate = false;
      if (studentDateTo && studentDateStr > studentDateTo) matchDate = false;
    }

    return matchSearch && matchClass && matchSection && matchDate;
  });

  const uniqueTeacherDepts = [...new Set(teachers.map((t: any) => t.department).filter(Boolean))].sort();
  const uniqueTeacherSpecs = [...new Set(teachers.map((t: any) => t.specialization).filter(Boolean))].sort();

  const filteredTeachers = teachers.filter((t: any) => {
    const name = t.user?.name || '';
    const email = t.user?.email || '';
    const phone = t.user?.phone || '';
    const dept = t.department || '';
    const spec = t.specialization || '';
    const isClassTeacher = t.isClassTeacher;

    const matchSearch = !searchTeacher ||
      name.toLowerCase().includes(searchTeacher.toLowerCase()) ||
      email.toLowerCase().includes(searchTeacher.toLowerCase()) ||
      phone.toLowerCase().includes(searchTeacher.toLowerCase()) ||
      spec.toLowerCase().includes(searchTeacher.toLowerCase()) ||
      dept.toLowerCase().includes(searchTeacher.toLowerCase());

    const matchDept = teacherDeptFilter === 'all' || dept === teacherDeptFilter;
    const matchSpec = teacherSpecFilter === 'all' || spec === teacherSpecFilter;
    const matchRole = teacherRoleFilter === 'all' ||
      (teacherRoleFilter === 'class-teacher' && isClassTeacher) ||
      (teacherRoleFilter === 'subject-teacher' && !isClassTeacher);

    return matchSearch && matchDept && matchSpec && matchRole;
  });
  const uniqueFeeClasses = [...new Set(fees.map((f: any) => (f.class || f.className || '').toString()).filter(Boolean))].sort();
  const uniqueFeeSections = [...new Set(fees.map((f: any) => (f.section || '').toString()).filter(Boolean))].sort();

  const filteredFees = fees.filter(f => {
    const sName = f.student || f.name || '';
    const fClass = (f.class || f.className || '').toString();
    const fSec = (f.section || '').toString();
    const fDate = f.dueDate || f.createdAt || f.paymentDate;

    const matchSearch = !searchFee || sName.toLowerCase().includes(searchFee.toLowerCase());
    const matchStatus = feeFilter === 'all' || f.status === feeFilter;
    const matchClass = feeClassFilter === 'all' || fClass === feeClassFilter || normalizeClass(fClass) === normalizeClass(feeClassFilter);
    const matchSection = feeSectionFilter === 'all' || fSec.toUpperCase() === feeSectionFilter.toUpperCase();

    let matchDate = true;
    if (fDate) {
      const feeDateStr = new Date(fDate).toISOString().slice(0, 10);
      if (feeDateFrom && feeDateStr < feeDateFrom) matchDate = false;
      if (feeDateTo && feeDateStr > feeDateTo) matchDate = false;
    }

    return matchSearch && matchStatus && matchClass && matchSection && matchDate;
  });

  const filteredSubAdmins = subAdmins.filter(a => {
    const name = a.name || '';
    const email = a.email || '';
    const phone = a.phone || '';
    const role = a.role || '';
    const status = a.status || 'Active';
    const created = a.created || a.createdAt;

    const matchSearch = !searchSubAdmin ||
      name.toLowerCase().includes(searchSubAdmin.toLowerCase()) ||
      email.toLowerCase().includes(searchSubAdmin.toLowerCase()) ||
      phone.toLowerCase().includes(searchSubAdmin.toLowerCase());

    const matchRole = subAdminRoleFilter === 'all' || role === subAdminRoleFilter;
    const matchStatus = subAdminStatusFilter === 'all' || status.toLowerCase() === subAdminStatusFilter.toLowerCase();

    let matchDate = true;
    if (created && !isNaN(new Date(created).getTime())) {
      const dateStr = new Date(created).toISOString().slice(0, 10);
      if (subAdminDateFrom && dateStr < subAdminDateFrom) matchDate = false;
      if (subAdminDateTo && dateStr > subAdminDateTo) matchDate = false;
    }

    return matchSearch && matchRole && matchStatus && matchDate;
  });

  const filteredAttendance = attendanceRecords.filter(r => {
    const studentName = r.student?.user?.name || '';
    const studentEmail = r.student?.user?.email || '';
    const rollNo = r.student?.rollNumber || '';
    const className = r.student?.className || '';
    const section = r.student?.section || '';
    const dateStr = r.date ? new Date(r.date).toISOString().slice(0, 10) : '';

    const matchesSearch = !searchAttendance || 
      studentName.toLowerCase().includes(searchAttendance.toLowerCase()) ||
      studentEmail.toLowerCase().includes(searchAttendance.toLowerCase()) ||
      rollNo.toLowerCase().includes(searchAttendance.toLowerCase());

    const matchesClass = classFilter === 'all' || normalizeClass(className) === normalizeClass(classFilter);
    const matchesSection = sectionFilter === 'all' || section === sectionFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesDate = !dateFilter || dateStr === dateFilter;

    return matchesSearch && matchesClass && matchesSection && matchesStatus && matchesDate;
  });

  const predefinedClasses = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
  const predefinedSections = ['A', 'B', 'C', 'D', 'E'];
  const uniqueClasses = Array.from(new Set([...predefinedClasses, ...attendanceRecords.map(r => r.student?.className).filter(Boolean)]));
  const uniqueSections = Array.from(new Set([...predefinedSections, ...attendanceRecords.map(r => r.student?.section).filter(Boolean)]));

  const totalFees = fees.reduce((a,c)=>a+c.total,0);
  const collectedFees = fees.reduce((a,c)=>a+c.paid,0);
  const pendingFees = fees.reduce((a,c)=>a+c.due,0);

  // ── HANDLERS ───────────────────────────────────────────────────────────────
  const addStudent = async (e: any) => {
    e.preventDefault();
    try {
      await API.post('/api/admin/student-admin/admissions/direct', {
        name: studentForm.name,
        email: studentForm.email,
        phone: studentForm.phone,
        className: studentForm.class,
        section: studentForm.section,
        rollNumber: studentForm.roll,
        dob: studentForm.dob,
        gender: studentForm.gender,
        parentName: studentForm.parent,
        parentPhone: studentForm.parentPhone,
        bloodGroup: studentForm.blood
      });
      trigger('Student profile created successfully!');
      fetchStudents();
      setStudentForm({ name:'', email:'', class:'', section:'', roll:'', dob:'', gender:'', phone:'', parent:'', parentPhone:'', blood:'' });
      setShowAddStudent(false);
    } catch (err: any) {
      console.error(err);
      trigger(err.response?.data?.message || 'Failed to create student profile', 'danger');
    }
  };
  const saveStudent = (e: any) => {
    e.preventDefault();
    setStudents(p => p.map(s => s.id === editingStudent.id ? { ...s, ...editingStudent } : s));
    setShowEditStudent(false); trigger('Student profile updated successfully!');
  };
  const deleteStudent = (id: any) => { if(!window.confirm('Delete this student?')) return; setStudents(p=>p.filter(s=>s.id!==id)); trigger('Student deleted.'); };

  const markFee = async (id: any, status: any) => {
    try {
      const targetFee = fees.find(f => f.id === id);
      if (!targetFee) return;
      const userRemarks = window.prompt(`Enter approval/reset remarks for this fee status change to ${status}:`, status === 'Paid' ? 'Fee received in full' : 'Fee status reset to pending');
      if (userRemarks === null) return; // Cancelled
      const updaterName = localStorage.getItem('userName') || 'Super Admin';
      const updaterRole = localStorage.getItem('userRole') || 'super-admin';
      await API.put(`/api/finance/update/${id}`, {
        amount: targetFee.total,
        status: status,
        remarks: userRemarks,
        updatedBy: `${updaterName} (${updaterRole})`
      });
      trigger(`Fee marked as ${status}.`);
      fetchFees();
    } catch (err) {
      console.error(err);
      trigger('Failed to update fee status', 'danger');
    }
  };
  const addFee = async (e: any) => {
    e.preventDefault();
    if (!feeForm.studentId) {
      trigger('Please select a student', 'danger');
      return;
    }
    if (!feeForm.amount || Number(feeForm.amount) <= 0) {
      trigger('Please enter a valid fee amount', 'danger');
      return;
    }
    try {
      const creatorName = localStorage.getItem('userName') || 'Super Admin';
      const creatorRole = localStorage.getItem('userRole') || 'super-admin';
      await API.post('/api/finance/create-fee', {
        studentId: feeForm.studentId,
        amount: Number(feeForm.amount),
        dueDate: feeForm.dueDate,
        remarks: feeForm.remarks || 'Initial Fee Generation',
        updatedBy: `${creatorName} (${creatorRole})`
      });
      trigger('Fee record created successfully!');
      fetchFees();
      setFeeForm({ studentId: '', amount: '', dueDate: '', remarks: '' });
      setFeeFormClass('');
      setFeeFormSection('');
      setShowAddFee(false);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to create fee record';
      trigger(errMsg, 'danger');
    }
  };

  const addAdmin = async (e) => {
    e.preventDefault();
    try {
      const creatorName = localStorage.getItem('userName') || 'Super Admin';
      const creatorRole = localStorage.getItem('userRole') || 'super-admin';
      const payload = {
        ...adminForm,
        createdBy: `${creatorName} (${creatorRole})`
      };
      const res = await API.post('/api/super-admin/create-admin', payload);
      trigger(res.data?.message || 'Manager account created successfully!');
      fetchAdmins();
      setAdminForm({ name:'', email:'', phone:'', password:'', role:'finance-admin', remarks:'' });
      setShowAdminForm(false);
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create manager account';
      trigger(errorMsg, 'danger');
    }
  };
  const deleteAdmin = async (id) => {
    if(!window.confirm('Remove this admin?')) return;
    try {
      await API.delete(`/api/super-admin/delete-admin/${id}`);
      trigger('Admin removed.');
      fetchAdmins();
    } catch (err) {
      console.error(err);
      trigger('Failed to delete admin account', 'danger');
    }
  };

  const openEditAdmin = (admin: any) => {
    setEditingAdmin(admin);
    setEditAdminForm({
      name: admin.name || '',
      phone: admin.phone || '',
      role: admin.role || 'finance-admin',
      password: '',
      remarks: admin.remarks || ''
    });
    setShowEditPassword(false);
    setShowEditAdminModal(true);
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    try {
      const updaterName = localStorage.getItem('userName') || 'Super Admin';
      const updaterRole = localStorage.getItem('userRole') || 'super-admin';
      const payload = {
        ...editAdminForm,
        updatedBy: `${updaterName} (${updaterRole})`
      };
      await API.put(`/api/super-admin/update-admin/${editingAdmin.id}`, payload);
      trigger('Manager account updated successfully!');
      setShowEditAdminModal(false);
      setEditingAdmin(null);
      fetchAdmins();
    } catch (err) {
      console.error(err);
      trigger('Failed to update admin account', 'danger');
    }
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  const activeSection = new URLSearchParams(location.search).get('section');

  // ── Section definitions (for domain landing cards) ────────────────────────────
  const SECTIONS = {
    core: {
      title: 'Core System',
      emoji: '🛡️',
      color: '#6366f1',
      description: 'Central system controls — overview, manager account management, and server diagnostics.',
      options: [
        { icon: '🏠', label: 'System Overview', desc: 'Live stats: students, finance, managers', path: '/super-admin?tab=overview' },
        { icon: '👑', label: 'Manage Accounts', desc: 'Create & manage manager/staff accounts', path: '/super-admin?tab=admins' },
        { icon: '⚙️', label: 'System Logs', desc: 'Server health & audit trail', path: '/super-admin?tab=system' },
      ],
    },
    students: {
      title: 'Student Admin Portal',
      emoji: '🎓',
      color: '#10b981',
      description: 'All student operations — profiles, admissions, class allocation, promotions, daily roll call attendance & exam results.',
      options: [
        { icon: '👤', label: 'Student Profiles', desc: 'View & manage all student records', path: '/academic-admin?tab=profiles' },
        { icon: '📋', label: 'Admissions', desc: 'Process new student applications', path: '/academic-admin?tab=admissions' },
        { icon: '🏫', label: 'Class Allocation', desc: 'Assign students to class sections', path: '/academic-admin?tab=allocation' },
        { icon: '🚀', label: 'Promotions', desc: 'Promote students to next academic year', path: '/academic-admin?tab=promotions' },
        { icon: '✅', label: 'Daily Attendance', desc: 'View & mark daily roll call attendance', path: '/super-admin?tab=attendance' },
        { icon: '📊', label: 'Student Results', desc: 'View student marks & report cards', path: '/academic-admin/results' },
      ],
    },
    academics: {
      title: 'Teacher & Academic Admin Portal',
      emoji: '📚',
      color: '#3b82f6',
      description: 'All faculty & academic management — teachers, subject syllabi, class schedules, exam management, and leave reviews.',
      options: [
        { icon: '👩‍🏫', label: 'Teacher Management', desc: 'Manage faculty profiles & subjects', path: '/academic-admin/teachers' },
        { icon: '📖', label: 'Subject Management', desc: 'Manage syllabus & subjects', path: '/academic-admin/subjects' },
        { icon: '🏛️', label: 'Class & Timetables', desc: 'Class sections, rooms & class in-charges', path: '/academic-admin/classes' },
        { icon: '📝', label: 'Exam Scheduling', desc: 'Schedule and manage school exams', path: '/exams' },
        { icon: '🎒', label: 'Teacher Schedules', desc: 'View teacher class timetables', path: '/teacher/myclasses' },
        { icon: '✍️', label: 'Assignments & Homework', desc: 'Create & grade student assignments', path: '/teacher/assignments' },
        { icon: '✉️', label: 'Leave Applications', desc: 'Review & approve student leave requests', path: '/teacher/application' },
      ],
    },
    operations: {
      title: 'Finance & Operations Portal',
      emoji: '💼',
      color: '#f59e0b',
      description: 'All financial & operational tools — fee billing, payment collection, financial reports, and school events.',
      options: [
        { icon: '💰', label: 'Fee Management', desc: 'Fees, payment collection & student dues', path: '/super-admin?tab=finance' },
        { icon: '🎉', label: 'School Events', desc: 'Plan & manage school events & sports', path: '/operations-admin/events' },
        { icon: '👑', label: 'Manager Accounts', desc: 'Manage Manager & Staff users', path: '/super-admin?tab=admins' },
      ],
    },
  };

  // ── Section Landing Renderer ────────────────────────────────────────────────
  const renderSectionPage = (sectionKey) => {
    const sec = SECTIONS[sectionKey];
    if (!sec) return null;
    return (
      <div>
        {/* Section Hero */}
        <div 
          className="section-hero"
          style={{
            background: `linear-gradient(135deg, color-mix(in srgb, ${sec.color} 14%, transparent) 0%, color-mix(in srgb, ${sec.color} 4%, transparent) 100%)`,
            border: `1px solid color-mix(in srgb, ${sec.color} 20%, transparent)`,
            borderRadius: '16px',
            padding: '28px 32px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <div style={{
            width: '64px', height: '64px',
            background: `linear-gradient(135deg, ${sec.color}, color-mix(in srgb, ${sec.color} 80%, #000))`,
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '30px', flexShrink: 0,
            boxShadow: `0 8px 20px color-mix(in srgb, ${sec.color} 30%, transparent)`,
          }}>
            {sec.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: '800', color: 'var(--text-main)' }}>
              {sec.title}
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {sec.description}
            </p>
          </div>
          <button
            onClick={() => navigate('/super-admin?tab=overview')}
            style={{ padding: '8px 16px', fontSize: '12px', backgroundColor: 'var(--card-bg)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap' }}
          >
            ← Back to Overview
          </button>
        </div>

        {/* Option Cards Grid */}
        <div className="option-card-grid" style={{ marginBottom: '28px' }}>
          {sec.options.map((opt, i) => (
            <div
              key={i}
              onClick={() => navigate(opt.path)}
              className="option-card"
              style={{
                '--primary': sec.color,
                '--primary-bg': `color-mix(in srgb, ${sec.color} 10%, transparent)`,
                '--border-color': `color-mix(in srgb, ${sec.color} 20%, transparent)`
              } as React.CSSProperties}
            >
              {/* Background accent */}
              <div style={{
                position: 'absolute', top: '-20px', right: '-20px',
                width: '80px', height: '80px',
                background: `radial-gradient(circle, color-mix(in srgb, ${sec.color} 15%, transparent), transparent 70%)`,
                borderRadius: '50%',
              }} />

              {/* Icon */}
              <div className="option-card-icon" style={{
                background: `linear-gradient(135deg, color-mix(in srgb, ${sec.color} 15%, transparent), color-mix(in srgb, ${sec.color} 8%, transparent))`,
                borderColor: `color-mix(in srgb, ${sec.color} 20%, transparent)`,
              }}>
                {opt.icon}
              </div>

              <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>
                {opt.label}
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                {opt.desc}
              </p>

              <button
                onClick={e => { e.stopPropagation(); navigate(opt.path); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px',
                  backgroundColor: sec.color,
                  color: 'white',
                  border: 'none', borderRadius: '8px',
                  cursor: 'pointer', fontWeight: '600', fontSize: '12px',
                  transition: 'opacity 0.15s',
                }}
              >
                Open →
              </button>
            </div>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
             LIVE SECTION DATA TABLES DIRECTLY IN SUPER ADMIN
        ═══════════════════════════════════════════════════════════════════ */}
        {sectionKey === 'students' && (
          <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>🎓 Live Student Records & Roster</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Real-time database records of all enrolled students.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ padding: '6px 12px', backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '8px', fontWeight: '700', fontSize: '12px' }}>
                  Total: {students.length}
                </span>
                <span style={{ padding: '6px 12px', backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '8px', fontWeight: '700', fontSize: '12px' }}>
                  Filtered: {filteredStudents.length}
                </span>
              </div>
            </div>

            {/* ── Advanced Filter Bar for Class, Section, and Date ── */}
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '12px', 
              marginBottom: '20px', 
              padding: '16px', 
              backgroundColor: 'var(--panel-bg)', 
              borderRadius: '12px', 
              border: '1px solid var(--border-color)',
              alignItems: 'flex-end'
            }}>
              {/* Search */}
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  🔍 Search Student
                </label>
                <input
                  type="text"
                  placeholder="Search name, roll, email..."
                  value={searchStudent}
                  onChange={e => setSearchStudent(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              {/* Class Filter */}
              <div style={{ width: '140px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  🏫 Class
                </label>
                <select
                  value={studentClassFilter}
                  onChange={e => setStudentClassFilter(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}
                >
                  <option value="all">All Classes</option>
                  {uniqueStudentClasses.map(c => (
                    <option key={c} value={c}>Class {c}</option>
                  ))}
                </select>
              </div>

              {/* Section Filter */}
              <div style={{ width: '130px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  🅰️ Section
                </label>
                <select
                  value={studentSectionFilter}
                  onChange={e => setStudentSectionFilter(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}
                >
                  <option value="all">All Sections</option>
                  {uniqueStudentSections.map(s => (
                    <option key={s} value={s}>Section {s}</option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div style={{ width: '150px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  📅 From Date
                </label>
                <input
                  type="date"
                  value={studentDateFrom}
                  onChange={e => setStudentDateFrom(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>

              {/* Date To */}
              <div style={{ width: '150px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  📅 To Date
                </label>
                <input
                  type="date"
                  value={studentDateTo}
                  onChange={e => setStudentDateTo(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>

              {/* Clear Button */}
              {(searchStudent || studentClassFilter !== 'all' || studentSectionFilter !== 'all' || studentDateFrom || studentDateTo) && (
                <button
                  onClick={() => {
                    setSearchStudent('');
                    setStudentClassFilter('all');
                    setStudentSectionFilter('all');
                    setStudentDateFrom('');
                    setStudentDateTo('');
                  }}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: '700', fontSize: '12px', cursor: 'pointer', height: '36px' }}
                >
                  🧹 Clear Filters
                </button>
              )}
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Email</th>
                    <th>Parent Contact</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map(s => (
                      <tr key={s.id || s._id}>
                        <td><strong>{s.roll || 'R01'}</strong></td>
                        <td><strong style={{ color: 'var(--text-main)' }}>{s.name}</strong></td>
                        <td>Class {s.class}</td>
                        <td><span className="badge management">{s.section || 'A'}</span></td>
                        <td style={{ fontSize: '13px' }}>{s.email}</td>
                        <td style={{ fontSize: '13px' }}>{s.parentPhone || s.phone || '+919876543210'}</td>
                        <td>
                          <span className={`badge ${s.status === 'Active' ? 'approved' : 'pending'}`}>
                            {s.status || 'Active'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleViewStudentDetails(s)}
                            style={{
                              padding: '5px 12px',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '700',
                              fontSize: '12px'
                            }}
                          >
                            👁️ View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No student records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {sectionKey === 'academics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* ── Sub-Tab Option Bar (Dashboard | ⭐ Class Teacher | 📖 Subject Teacher) ── */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              backgroundColor: 'var(--card-bg)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '16px', 
              padding: '12px 18px',
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>📚 Teacher Admin Portal Control Center</h3>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Select view: General Dashboard, Class In-Charges, or Subject Faculty.</p>
              </div>

              {/* 3 Sub-Option Buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => { setAcademicSubTab('dashboard'); setTeacherRoleFilter('all'); }}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: academicSubTab === 'dashboard' ? 'var(--primary)' : 'var(--panel-bg)',
                    color: academicSubTab === 'dashboard' ? '#fff' : 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: academicSubTab === 'dashboard' ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
                    transition: 'all 0.18s'
                  }}
                >
                  📊 Dashboard & All Faculty ({teachers.length})
                </button>

                <button
                  onClick={() => { setAcademicSubTab('class-teacher'); setTeacherRoleFilter('class-teacher'); }}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: academicSubTab === 'class-teacher' ? '#d97706' : 'var(--panel-bg)',
                    color: academicSubTab === 'class-teacher' ? '#fff' : 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: academicSubTab === 'class-teacher' ? '0 4px 12px rgba(217,119,6,0.3)' : 'none',
                    transition: 'all 0.18s'
                  }}
                >
                  ⭐ Class Teacher (In-Charges) ({teachers.filter((t: any) => t.isClassTeacher).length})
                </button>

                <button
                  onClick={() => { setAcademicSubTab('subject-teacher'); setTeacherRoleFilter('subject-teacher'); }}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: academicSubTab === 'subject-teacher' ? '#8b5cf6' : 'var(--panel-bg)',
                    color: academicSubTab === 'subject-teacher' ? '#fff' : 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: academicSubTab === 'subject-teacher' ? '0 4px 12px rgba(139,92,246,0.3)' : 'none',
                    transition: 'all 0.18s'
                  }}
                >
                  📖 Subject Teacher ({teachers.filter((t: any) => !t.isClassTeacher).length})
                </button>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                 SUB-TAB 1 — DASHBOARD & OVERVIEW
            ═══════════════════════════════════════════════════════════════════ */}
            {academicSubTab === 'dashboard' && (
              <>
                <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>📊 Academic Faculty Overview</h3>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Complete faculty directory with department, specialization, and class role statuses.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ padding: '6px 12px', backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '8px', fontWeight: '700', fontSize: '12px' }}>
                        Total Faculty: {teachers.length}
                      </span>
                      <span style={{ padding: '6px 12px', backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '8px', fontWeight: '700', fontSize: '12px' }}>
                        Filtered: {filteredTeachers.length}
                      </span>
                      <button onClick={() => navigate('/academic-admin/teachers')} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                        Open Faculty Manager →
                      </button>
                    </div>
                  </div>

                  {/* Filter Bar */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', padding: '16px', backgroundColor: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 220px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>🔍 Search Teacher / Subject</label>
                      <input type="text" placeholder="Search name, email, subject, phone..." value={searchTeacher} onChange={e => setSearchTeacher(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ width: '160px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>🏬 Department</label>
                      <select value={teacherDeptFilter} onChange={e => setTeacherDeptFilter(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}>
                        <option value="all">All Departments</option>
                        {uniqueTeacherDepts.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    <div style={{ width: '160px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>📖 Specialization</label>
                      <select value={teacherSpecFilter} onChange={e => setTeacherSpecFilter(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}>
                        <option value="all">All Subjects</option>
                        {uniqueTeacherSpecs.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div style={{ width: '150px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>⭐ Class Role</label>
                      <select value={teacherRoleFilter} onChange={e => setTeacherRoleFilter(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}>
                        <option value="all">All Roles</option>
                        <option value="class-teacher">⭐ Class In-Charge</option>
                        <option value="subject-teacher">Subject Teacher</option>
                      </select>
                    </div>

                    {(searchTeacher || teacherDeptFilter !== 'all' || teacherSpecFilter !== 'all' || teacherRoleFilter !== 'all') && (
                      <button onClick={() => { setSearchTeacher(''); setTeacherDeptFilter('all'); setTeacherSpecFilter('all'); setTeacherRoleFilter('all'); }} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: '700', fontSize: '12px', cursor: 'pointer', height: '36px' }}>🧹 Clear</button>
                    )}
                  </div>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Teacher Name</th>
                          <th>Email / Contact</th>
                          <th>Specialization</th>
                          <th>Department</th>
                          <th>Experience</th>
                          <th>Class Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTeachers.length > 0 ? (
                          filteredTeachers.map((t: any) => (
                            <tr key={t._id}>
                              <td><strong style={{ color: 'var(--text-main)' }}>{t.user?.name}</strong></td>
                              <td>
                                <div style={{ fontSize: '13px' }}>{t.user?.email}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.user?.phone || 'N/A'}</div>
                              </td>
                              <td><span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontWeight: '600', fontSize: '12px' }}>{t.specialization || 'General'}</span></td>
                              <td>{t.department || 'Science'}</td>
                              <td><strong>{t.experience || 0} yrs</strong></td>
                              <td>
                                {t.isClassTeacher ? (
                                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: 'rgba(245,158,11,0.15)', color: '#d97706' }}>
                                    ⭐ Class In-Charge
                                  </span>
                                ) : (
                                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: 'var(--panel-bg)', color: 'var(--text-muted)' }}>
                                    Subject Teacher
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No teacher records found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                 SUB-TAB 2 — ⭐ CLASS TEACHER (IN-CHARGES) SECTION & DETAILS
            ═══════════════════════════════════════════════════════════════════ */}
            {academicSubTab === 'class-teacher' && (
              <>
                <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#d97706', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>⭐ Class Teacher (Class In-Charges) Section</span>
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                        Detailed roster of official Class In-Charges assigned to each class section with room numbers, timings & contact details.
                      </p>
                    </div>
                    <button onClick={() => navigate('/academic-admin/classes')} style={{ padding: '8px 16px', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                      Manage Class In-Charges →
                    </button>
                  </div>

                  {/* Filter Bar */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', padding: '16px', backgroundColor: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 220px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>🔍 Search Class Teacher / Room</label>
                      <input type="text" placeholder="Search teacher name, class, room..." value={searchTeacher} onChange={e => setSearchTeacher(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ width: '160px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>🏬 Department</label>
                      <select value={teacherDeptFilter} onChange={e => setTeacherDeptFilter(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}>
                        <option value="all">All Departments</option>
                        {uniqueTeacherDepts.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    {searchTeacher || teacherDeptFilter !== 'all' ? (
                      <button onClick={() => { setSearchTeacher(''); setTeacherDeptFilter('all'); }} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: '700', fontSize: '12px', cursor: 'pointer', height: '36px' }}>🧹 Clear</button>
                    ) : null}
                  </div>

                  {/* Class Teacher Cards Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    {classes.map((cls: any) => {
                      const teacherObj = cls.classTeacher?.user || {};
                      const teacherName = teacherObj.name || 'Not Allocated';
                      const teacherEmail = teacherObj.email || '';
                      const teacherPhone = teacherObj.phone || '';

                      return (
                        <div key={cls._id} style={{ backgroundColor: 'var(--input-bg)', border: cls.classTeacher ? '2px solid rgba(245,158,11,0.4)' : '1px solid var(--border-color)', borderRadius: '14px', padding: '18px', boxShadow: cls.classTeacher ? '0 4px 12px rgba(245,158,11,0.08)' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>
                              Grade {cls.className}-{cls.section}
                            </span>
                            <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', backgroundColor: cls.classTeacher ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: cls.classTeacher ? '#10b981' : '#ef4444', fontWeight: '700' }}>
                              {cls.classTeacher ? '⭐ In-Charge Assigned' : '⚠️ Vacant'}
                            </span>
                          </div>

                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
                              {teacherName}
                            </div>
                            {teacherEmail && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>📧 {teacherEmail}</div>}
                            {teacherPhone && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📞 {teacherPhone}</div>}
                          </div>

                          <div style={{ padding: '10px', backgroundColor: 'var(--panel-bg)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>📍 Room {cls.room || 'N/A'}</span>
                            <span style={{ fontWeight: '700', color: '#6366f1' }}>🕒 {cls.startTime || '08:00 AM'} - {cls.endTime || '02:00 PM'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Class Teacher Table View */}
                  <h4 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 12px', color: 'var(--text-main)' }}>📋 Class Teacher In-Charges List Details</h4>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Class & Section</th>
                          <th>Class Teacher (In-Charge)</th>
                          <th>Email & Phone</th>
                          <th>Room No</th>
                          <th>Schedule Timings</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teachers.filter((t: any) => t.isClassTeacher).length > 0 ? (
                          teachers.filter((t: any) => t.isClassTeacher).map((t: any) => (
                            <tr key={t._id}>
                              <td><strong style={{ color: '#d97706' }}>Class In-Charge</strong></td>
                              <td><strong style={{ color: 'var(--text-main)' }}>{t.user?.name}</strong></td>
                              <td>
                                <div style={{ fontSize: '13px' }}>{t.user?.email}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.user?.phone || 'N/A'}</div>
                              </td>
                              <td><span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: 'var(--panel-bg)', fontSize: '12px' }}>{t.department || 'Main Block'}</span></td>
                              <td><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>08:00 AM - 02:00 PM</span></td>
                              <td>
                                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: 'rgba(245,158,11,0.15)', color: '#d97706' }}>
                                  ⭐ Active Class Teacher
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No class teachers assigned yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                 SUB-TAB 3 — 📖 SUBJECT TEACHER (FACULTY) SECTION & DETAILS
            ═══════════════════════════════════════════════════════════════════ */}
            {academicSubTab === 'subject-teacher' && (
              <>
                <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📖 Subject Teacher (Subject Faculty) Section</span>
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                        Detailed roster of subject specialist faculty members, teaching assignments, departments & qualifications.
                      </p>
                    </div>
                    <button onClick={() => navigate('/academic-admin/teachers')} style={{ padding: '8px 16px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                      Add Subject Teacher →
                    </button>
                  </div>

                  {/* Filter Bar */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', padding: '16px', backgroundColor: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 220px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>🔍 Search Subject Teacher</label>
                      <input type="text" placeholder="Search teacher name, subject, email..." value={searchTeacher} onChange={e => setSearchTeacher(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ width: '160px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>🏬 Department</label>
                      <select value={teacherDeptFilter} onChange={e => setTeacherDeptFilter(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}>
                        <option value="all">All Departments</option>
                        {uniqueTeacherDepts.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    <div style={{ width: '160px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>📖 Subject</label>
                      <select value={teacherSpecFilter} onChange={e => setTeacherSpecFilter(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}>
                        <option value="all">All Subjects</option>
                        {uniqueTeacherSpecs.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    {searchTeacher || teacherDeptFilter !== 'all' || teacherSpecFilter !== 'all' ? (
                      <button onClick={() => { setSearchTeacher(''); setTeacherDeptFilter('all'); setTeacherSpecFilter('all'); }} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: '700', fontSize: '12px', cursor: 'pointer', height: '36px' }}>🧹 Clear</button>
                    ) : null}
                  </div>

                  {/* Subject Teacher Table */}
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Subject Teacher Name</th>
                          <th>Email & Contact</th>
                          <th>Specialization Subject</th>
                          <th>Department</th>
                          <th>Qualifications</th>
                          <th>Experience</th>
                          <th>Role Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teachers.filter((t: any) => !t.isClassTeacher).length > 0 ? (
                          teachers.filter((t: any) => !t.isClassTeacher).map((t: any) => (
                            <tr key={t._id}>
                              <td><strong style={{ color: 'var(--text-main)' }}>{t.user?.name}</strong></td>
                              <td>
                                <div style={{ fontSize: '13px' }}>{t.user?.email}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.user?.phone || 'N/A'}</div>
                              </td>
                              <td><span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(139,92,246,0.12)', color: '#8b5cf6', fontWeight: '700', fontSize: '12px' }}>{t.specialization || 'General Subject'}</span></td>
                              <td>{t.department || 'Academic Department'}</td>
                              <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t.qualifications || 'B.Ed / M.Sc'}</td>
                              <td><strong>{t.experience || 0} yrs</strong></td>
                              <td>
                                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                                  Subject Specialist
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No subject teachers registered.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {sectionKey === 'operations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Fee Collection Table */}
            <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>💰 Fee Collection & Outstanding Dues</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Financial transactions, paid amounts, and student dues.</p>
                </div>
                <button onClick={() => navigate('/super-admin?tab=finance')} style={{ padding: '8px 16px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                  Manage Fees Portal →
                </button>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Class</th>
                      <th>Total Fee</th>
                      <th>Amount Paid</th>
                      <th>Outstanding Dues</th>
                      <th>Status</th>
                      <th>Last Modified By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.length > 0 ? (
                      fees.map((f: any) => (
                        <tr key={f.id || f._id}>
                          <td><strong style={{ color: 'var(--text-main)' }}>{f.student}</strong></td>
                          <td>{f.class}</td>
                          <td>₹{f.total?.toLocaleString() || 0}</td>
                          <td style={{ color: 'var(--success)', fontWeight: '700' }}>₹{f.paid?.toLocaleString() || 0}</td>
                          <td style={{ color: f.due > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: '700' }}>₹{f.due?.toLocaleString() || 0}</td>
                          <td>
                            <span className={`badge ${f.status === 'Paid' ? 'approved' : 'pending'}`}>
                              {f.status || 'Pending'}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)' }}>
                            👔 {f.updatedBy || 'Super Admin'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No fee records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Manager User Accounts Table */}
            <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>👑 Manager Accounts Directory</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Registered Manager Admin, Student Admin, Teacher Admin & Finance Admin users.</p>
                </div>
                <button onClick={() => navigate('/super-admin?tab=admins')} style={{ padding: '8px 16px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                  Add / Manage Accounts →
                </button>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Admin Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Created Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subAdmins.length > 0 ? (
                      subAdmins.map((a: any) => (
                        <tr key={a.id || a._id}>
                          <td><strong style={{ color: 'var(--text-main)' }}>{a.name}</strong></td>
                          <td>{a.email}</td>
                          <td>{a.phone || 'N/A'}</td>
                          <td>
                            <span style={{ padding: '3px 10px', borderRadius: '20px', backgroundColor: 'rgba(99,102,241,0.15)', color: '#6366f1', fontWeight: '700', fontSize: '11px' }}>
                              {a.role}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{a.created || '2026-08-01'}</td>
                          <td><span className="badge approved">Active</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No manager accounts registered yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="dashboard-container" style={{ padding:'20px' }}>

          {/* ── Main Navigation Tabs ── */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', backgroundColor: 'var(--panel-bg)', padding: '6px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            {[
              { id: 'overview', label: 'Dashboard Overview', icon: '🏠' },
              { id: 'announcements', label: 'Global Notice Board', icon: '📢' },
              { id: 'teacher-link', label: 'Teacher & Academic Admin', icon: '👩‍🏫', path: '/academic-admin' },
              { id: 'finance', label: 'Finance Admin', icon: '💰' },
              { id: 'hierarchy', label: 'Role Hierarchy', icon: '🌳' },
              { id: 'attendance', label: 'Daily Attendance', icon: '✅' },
              { id: 'admins', label: 'Manager Accounts', icon: '🛡️' },
              { id: 'system', label: 'System Logs', icon: '⚙️' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => t.path ? navigate(t.path) : navigate(`/super-admin?tab=${t.id}`)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === t.id ? 'var(--primary)' : 'transparent',
                  color: activeTab === t.id ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: activeTab === t.id ? '0 4px 12px rgba(30,58,138,0.25)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* ── Status ── */}
          {statusMsg && (
            <div style={{ marginBottom:'14px', padding:'11px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:'500',
              backgroundColor: statusMsg.type==='danger' ? 'var(--danger-bg)' : 'var(--success-bg)',
              color: statusMsg.type==='danger' ? 'var(--danger)' : 'var(--success)',
              border:`1px solid ${statusMsg.type==='danger' ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}` }}>
              {statusMsg.text}
            </div>
          )}

          {/* ═══ SECTION PAGE (when sidebar category heading clicked) ═══════ */}
          {activeSection && renderSectionPage(activeSection)}

          {/* ═══════════════════════════════════════════════════════════════════
               TAB: GLOBAL ANNOUNCEMENTS & NOTICE BOARD
          ═══════════════════════════════════════════════════════════════════ */}
          {!activeSection && activeTab === 'announcements' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '28px' }}>
              {/* Left Column: Publish Notice Form */}
              <div style={{ backgroundColor: 'var(--panel-bg)', p: '24px', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                  📢 Publish Global Notice
                </h3>
                <form onSubmit={publishAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Notice Title *</label>
                    <input 
                      type="text" 
                      required
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                      placeholder="e.g. Independence Day Holiday"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Target Audience *</label>
                    <select 
                      value={newAnnouncement.targetRole}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, targetRole: e.target.value, targetClass: e.target.value !== 'student' ? 'all' : newAnnouncement.targetClass })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    >
                      <option value="all">All Roles (Students & Teachers)</option>
                      <option value="teacher">Teachers Only</option>
                      <option value="student">Students Only</option>
                      <option value="manager-admin">Managers Only</option>
                    </select>
                  </div>
                  {newAnnouncement.targetRole === 'student' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Target Class *</label>
                      <select 
                        value={newAnnouncement.targetClass}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, targetClass: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                      >
                        <option value="all">All Classes</option>
                        {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Detailed Message *</label>
                    <textarea 
                      required
                      rows={5}
                      value={newAnnouncement.message}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                      placeholder="Enter announcement description..."
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={publishing}
                    style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', alignSelf: 'flex-start' }}
                  >
                    {publishing ? 'Publishing...' : '📢 Publish Announcement'}
                  </button>
                </form>
              </div>

              {/* Right Column: Published Notices Directory */}
              <div style={{ backgroundColor: 'var(--panel-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                  📖 Active Announcements ({announcements.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '420px' }}>
                  {loadingAnnouncements ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>Loading announcements...</div>
                  ) : announcements.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>No announcements published yet.</div>
                  ) : (
                    announcements.map((a) => (
                      <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '14px', borderRadius: '12px', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                            <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{a.title}</strong>
                            <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase', backgroundColor: 'var(--primary-bg)', color: 'var(--primary)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)' }}>
                              Target: {a.targetRole}
                            </span>
                            {a.targetClass && a.targetClass !== 'all' && (
                              <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase', backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid color-mix(in srgb, var(--success) 20%, transparent)' }}>
                                Class: {a.targetClass}
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{a.message}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                            <span>By: {a.createdBy}</span>
                            <span>{new Date(a.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteAnnouncement(a._id)}
                          style={{ border: 'none', background: 'none', color: 'var(--danger)', fontSize: '18px', cursor: 'pointer', alignSelf: 'flex-start', padding: '4px' }}
                          title="Delete Notice"
                        >
                          🗑️
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
               TAB: ROLE HIERARCHY DIAGRAM
          ═══════════════════════════════════════════════════════════════════ */}
          {!activeSection && activeTab === 'hierarchy' && (
            <div style={{ marginBottom: '28px' }}>
              <RoleHierarchyMap />
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
               TAB 1 — SYSTEM OVERVIEW
          ═══════════════════════════════════════════════════════════════════ */}
          {!activeSection && activeTab === 'overview' && (() => {
            const classTeachersCount = new Set(classes.map(c => c.classTeacher?._id || c.classTeacher).filter(Boolean)).size;
            const subjectTeachersCount = Math.max(0, teachers.length - classTeachersCount);
            const superAdminName = localStorage.getItem('userName') || 'Super Admin';
            const superAdminEmail = localStorage.getItem('userEmail') || 'admin@sps.edu';
            const superAdminPhone = localStorage.getItem('userPhone') || '+91 99999 99999';
            const totalPaid = fees.reduce((s: number, f: any) => s + (f.paid || 0), 0);

            return (
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {/* Left Side: Welcome, Stats & Portals */}
                <div style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Super Admin Welcome Banner */}
                  {(() => {
                    const hour = new Date().getHours();
                    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
                    return (
                      <div style={{
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #1e3a5f 100%)',
                        borderRadius: '20px', padding: '28px 32px',
                        position: 'relative', overflow: 'hidden', border: '1px solid rgba(99,102,241,0.3)'
                      }}>
                        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', filter: 'blur(70px)', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', bottom: '-40px', left: '30%', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(245,158,11,0.1)', filter: 'blur(50px)', pointerEvents: 'none' }} />
                        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <span style={{ background: 'rgba(99,102,241,0.35)', color: '#a5b4fc', fontSize: '11px', fontWeight: '800', padding: '3px 12px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.08em', border: '1px solid rgba(99,102,241,0.4)' }}>
                                👑 Super Admin
                              </span>
                              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px' }}>• Full System Access</span>
                            </div>
                            <h1 style={{ fontSize: '26px', fontWeight: '900', margin: '0 0 6px', color: '#fff', letterSpacing: '-0.02em' }}>
                              {greeting}, {superAdminName}! 👋
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '13px' }}>
                              {students.length} Students &nbsp;•&nbsp; {teachers.length} Teachers &nbsp;•&nbsp; {subAdmins.length} Sub-Admins &nbsp;•&nbsp; ₹{totalPaid.toLocaleString()} Collected
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button onClick={() => navigate('/super-admin?tab=admins')} style={{ backgroundColor: 'rgba(99,102,241,0.25)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.4)', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
                              🛡️ Manage Admins
                            </button>
                            <button onClick={() => navigate('/super-admin?tab=exams')} style={{ backgroundColor: 'rgba(245,158,11,0.25)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.4)', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
                              📅 Exam Timetable
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                    {[
                      { label: 'Total Students', value: students.length, icon: '🎓', color: 'var(--primary)', bg: 'rgba(30,58,138,0.06)' },
                      { label: 'Active Students', value: students.filter(s => s.status === 'Active').length, icon: '✅', color: 'var(--success)', bg: 'rgba(16,185,129,0.06)' },
                      { label: 'Total Teachers', value: teachers.length, icon: '👩‍🏫', color: '#8b5cf6', bg: 'rgba(139,92,246,0.06)' },
                      { label: 'Class Teachers', value: classTeachersCount, icon: '🏫', color: '#06b6d4', bg: 'rgba(6,182,212,0.06)' },
                      { label: 'Subject Teachers', value: subjectTeachersCount, icon: '📚', color: '#ec4899', bg: 'rgba(236,72,153,0.06)' },
                      { label: 'Fees Collected', value: `₹${collectedFees.toLocaleString()}`, icon: '💰', color: 'var(--success)', bg: 'rgba(16,185,129,0.06)' },
                      { label: 'Outstanding Dues', value: `₹${pendingFees.toLocaleString()}`, icon: '⏳', color: 'var(--danger)', bg: 'rgba(239,68,68,0.06)' },
                      { label: 'Sub-Admins', value: subAdmins.length, icon: '🛡️', color: '#6366f1', bg: 'rgba(99,102,241,0.06)' },
                    ].map((s, i) => (
                      <div key={i} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease' }}>
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{s.label}</span>
                          <div style={{ fontSize: '20px', fontWeight: '800', color: s.color, marginTop: '4px' }}>{s.value}</div>
                        </div>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                          {s.icon}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Executive Department Portals */}
                  <div>
                    <div style={{ marginBottom: '16px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🏛️ Department Management Portals</span>
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                        Access and manage all key operational branches of the ERP system.
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                      {[
                        {
                          id: 'academic',
                          emoji: '👩‍🏫',
                          title: 'Teacher & Academic Admin',
                          desc: 'Faculty directory, subject allocations, class teachers, student roster, admissions & promotions.',
                          path: '/academic-admin',
                          color: '#8b5cf6',
                          bg: 'rgba(139,92,246,0.08)'
                        },
                        {
                          id: 'finance',
                          emoji: '💰',
                          title: 'Finance Admin',
                          desc: 'Fee structure, payments tracking, invoices & dues recovery.',
                          path: '/finance-admin',
                          color: '#10b981',
                          bg: 'rgba(16,185,129,0.08)'
                        },
                        {
                          id: 'executive',
                          emoji: '👔',
                          title: 'Manager Admin',
                          desc: 'Executive management across academic & student operations.',
                          path: '/manager-admin',
                          color: '#3b82f6',
                          bg: 'rgba(59,130,246,0.08)'
                        },
                      ].map((card) => (
                        <div
                          key={card.id}
                          style={{
                            backgroundColor: 'var(--card-bg)',
                            border: `1px solid var(--border-color)`,
                            borderRadius: '16px',
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'transform 0.2s, box-shadow 0.2s'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                              <div style={{ fontSize: '24px', width: '44px', height: '44px', borderRadius: '12px', backgroundColor: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {card.emoji}
                              </div>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>{card.title}</h4>
                              </div>
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: '1.4' }}>
                              {card.desc}
                            </p>
                          </div>

                          <button
                            onClick={() => navigate(card.path)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          backgroundColor: card.color,
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: `0 4px 12px ${card.color}35`
                        }}
                      >
                        <span>Open {card.title}</span>
                        <span>→</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Summary Widgets ── */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:'14px' }}>
                {/* Finance Summary */}
                <div style={{ backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', borderRadius:'12px', padding:'18px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                    <div style={{ fontSize:'14px', fontWeight:'700', color:'var(--text-main)' }}>💰 Finance Summary</div>
                    <button onClick={()=>goTab('finance')} style={{ padding:'4px 10px', fontSize:'11px', backgroundColor:'var(--primary)', color:'white', border:'none', borderRadius:'5px', cursor:'pointer', fontWeight:'600' }}>View All</button>
                  </div>
                  {[
                    { label:'Total Billed', val:`₹${totalFees.toLocaleString()}`, color:'var(--text-main)' },
                    { label:'Collected',    val:`₹${collectedFees.toLocaleString()}`, color:'var(--success)' },
                    { label:'Outstanding',  val:`₹${pendingFees.toLocaleString()}`, color:'var(--danger)' },
                  ].map((r,i)=>(
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border-color)' }}>
                      <span style={{ fontSize:'13px', color:'var(--text-muted)' }}>{r.label}</span>
                      <strong style={{ fontSize:'13px', color:r.color }}>{r.val}</strong>
                    </div>
                  ))}
                </div>

                {/* Student Summary */}
                <div style={{ backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', borderRadius:'12px', padding:'18px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                    <div style={{ fontSize:'14px', fontWeight:'700', color:'var(--text-main)' }}>🎓 Student Summary</div>
                    <button onClick={()=>navigate('/academic-admin?tab=profiles')} style={{ padding:'4px 10px', fontSize:'11px', backgroundColor:'var(--primary)', color:'white', border:'none', borderRadius:'5px', cursor:'pointer', fontWeight:'600' }}>View All</button>
                  </div>
                  {['Class 7','Class 8','Class 9','Class 10'].map(cls=>{
                    const count = students.filter(s=>s.class===cls).length;
                    return (
                      <div key={cls} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid var(--border-color)' }}>
                        <span style={{ fontSize:'13px', color:'var(--text-muted)' }}>{cls}</span>
                        <span style={{ fontSize:'13px', fontWeight:'700', color:'var(--primary)' }}>{count} students</span>
                      </div>
                    );
                  })}
                </div>

                {/* Sub-Admins Quick View */}
                <div style={{ backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', borderRadius:'12px', padding:'18px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                    <div style={{ fontSize:'14px', fontWeight:'700', color:'var(--text-main)' }}>🛡️ Sub-Admin Accounts</div>
                    <button onClick={()=>goTab('admins')} style={{ padding:'4px 10px', fontSize:'11px', backgroundColor:'var(--primary)', color:'white', border:'none', borderRadius:'5px', cursor:'pointer', fontWeight:'600' }}>Manage</button>
                  </div>
                  {subAdmins.slice(0,4).map(a=>{
                    const info = av(a.name);
                    return (
                      <div key={a.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'7px 0', borderBottom:'1px solid var(--border-color)' }}>
                        <div style={{ width:'30px', height:'30px', borderRadius:'50%', backgroundColor:info.bg, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'700', fontSize:'11px', flexShrink:0 }}>{info.initials}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:'13px', fontWeight:'600', color:'var(--text-main)' }}>{a.name}</div>
                          <div style={{ fontSize:'11px', color:'var(--text-muted)' }}>{a.role.replace(/-/g,' ')}</div>
                        </div>
                        {badge(a.status)}
                      </div>
                    );
                  })}
                </div>

                {/* School Calendar */}
                <div style={{ backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', borderRadius:'12px', padding:'18px' }}>
                  <div style={{ fontSize:'14px', fontWeight:'700', color:'var(--text-main)', marginBottom:'12px' }}>📅 School Calendar</div>
                  {[
                    { date:'28 Jun', event:'Annual Sports Day',    type:'Event' },
                    { date:'30 Jun', event:'Parent-Teacher Meet',  type:'Meeting' },
                    { date:'05 Jul', event:'Term 2 Fee Due',       type:'Finance' },
                    { date:'10 Jul', event:'Mid-Term Exams Begin', type:'Exam' },
                    { date:'15 Jul', event:'Science Exhibition',   type:'Event' },
                  ].map((ev,i)=>(
                    <div key={i} style={{ display:'flex', gap:'10px', alignItems:'center', padding:'7px 0', borderBottom:'1px solid var(--border-color)' }}>
                      <div style={{ backgroundColor:'var(--primary-bg)', borderRadius:'5px', padding:'3px 7px', textAlign:'center', minWidth:'44px' }}>
                        <div style={{ fontSize:'11px', fontWeight:'700', color:'var(--primary)' }}>{ev.date}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:'13px', fontWeight:'600', color:'var(--text-main)' }}>{ev.event}</div>
                        <div style={{ fontSize:'11px', color:'var(--text-muted)' }}>{ev.type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              </div>

              {/* Profile Widget (Right Column) */}
              <div style={{ width: '300px', flexShrink: 0 }}>
                <div style={{
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '20px',
                  padding: '24px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                  position: 'sticky',
                  top: '20px'
                }}>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{
                      width: '80px', height: '80px',
                      borderRadius: '24px',
                      backgroundColor: 'var(--primary)',
                      color: 'white',
                      fontWeight: '800',
                      fontSize: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)'
                    }}>
                      {superAdminName.charAt(0).toUpperCase()}
                    </div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>{superAdminName}</h4>
                    <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '11px', fontWeight: '800', padding: '3px 10px', borderRadius: '12px' }}>
                      ● Active Status
                    </span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email ID</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px', wordBreak: 'break-all' }}>{superAdminEmail}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Number</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>{superAdminPhone}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>System Role</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>Super System Administrator</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Permissions</div>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: '#f59e0b', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '6px', backgroundColor: 'rgba(245,158,11,0.1)' }}>Full CRUD</span>
                        <span style={{ padding: '2px 8px', borderRadius: '6px', backgroundColor: 'rgba(245,158,11,0.1)' }}>Financials</span>
                        <span style={{ padding: '2px 8px', borderRadius: '6px', backgroundColor: 'rgba(245,158,11,0.1)' }}>Users</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          );
        })()}

          {/* ═══════════════════════════════════════════════════════════════════
               TAB 2 — FINANCE ADMIN (Full Details)
          ═══════════════════════════════════════════════════════════════════ */}
          {!activeSection && activeTab === 'finance' && (
            <div>
              <div style={{ marginBottom:'20px' }}>
                <h2 style={{ margin:'0 0 4px', fontSize:'18px', fontWeight:'700' }}>💰 Finance Admin — Complete Fee Management</h2>
                <p style={{ color:'var(--text-muted)', fontSize:'13px', margin:0 }}>Full visibility of all fee records, payment statuses, and financial data managed by Finance Admin.</p>
              </div>

              {/* Finance stats */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'12px', marginBottom:'22px' }}>
                {[
                  { label:'Total Billed',   value:`₹${totalFees.toLocaleString()}`,    color:'var(--primary)' },
                  { label:'Collected',      value:`₹${collectedFees.toLocaleString()}`, color:'var(--success)' },
                  { label:'Outstanding',    value:`₹${pendingFees.toLocaleString()}`,   color:'var(--danger)' },
                  { label:'Paid Students',  value: fees.filter(f=>f.status==='Paid').length,    color:'var(--success)' },
                  { label:'Pending',        value: fees.filter(f=>f.status==='Pending').length,  color:'#d97706' },
                  { label:'Overdue',        value: fees.filter(f=>f.status==='Overdue').length,  color:'var(--danger)' },
                ].map((s,i) => (
                  <div key={i} style={{ backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', borderRadius:'10px', padding:'14px', textAlign:'center' }}>
                    <div style={{ fontSize:'20px', fontWeight:'700', color:s.color }}>{s.value}</div>
                    <div style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'3px' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Advanced Multi-Filter Bar for Finance */}
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '12px', 
                marginBottom: '20px', 
                padding: '16px', 
                backgroundColor: 'var(--panel-bg)', 
                borderRadius: '12px', 
                border: '1px solid var(--border-color)',
                alignItems: 'flex-end'
              }}>
                {/* Search */}
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    🔍 Search Student
                  </label>
                  <input
                    placeholder="Search student name..."
                    value={searchFee}
                    onChange={e => setSearchFee(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Status Filter */}
                <div style={{ width: '140px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    💵 Payment Status
                  </label>
                  <select
                    value={feeFilter}
                    onChange={e => setFeeFilter(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    <option value="all">All Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>

                {/* Class Filter */}
                <div style={{ width: '140px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    🏫 Class
                  </label>
                  <select
                    value={feeClassFilter}
                    onChange={e => setFeeClassFilter(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    <option value="all">All Classes</option>
                    {uniqueFeeClasses.map(c => (
                      <option key={c} value={c}>Class {c}</option>
                    ))}
                  </select>
                </div>

                {/* Section Filter */}
                <div style={{ width: '130px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    🅰️ Section
                  </label>
                  <select
                    value={feeSectionFilter}
                    onChange={e => setFeeSectionFilter(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    <option value="all">All Sections</option>
                    {uniqueFeeSections.map(s => (
                      <option key={s} value={s}>Section {s}</option>
                    ))}
                  </select>
                </div>

                {/* Date From */}
                <div style={{ width: '140px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    📅 From Date
                  </label>
                  <input
                    type="date"
                    value={feeDateFrom}
                    onChange={e => setFeeDateFrom(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Date To */}
                <div style={{ width: '140px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    📅 To Date
                  </label>
                  <input
                    type="date"
                    value={feeDateTo}
                    onChange={e => setFeeDateTo(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                  {(searchFee || feeFilter !== 'all' || feeClassFilter !== 'all' || feeSectionFilter !== 'all' || feeDateFrom || feeDateTo) && (
                    <button
                      onClick={() => {
                        setSearchFee('');
                        setFeeFilter('all');
                        setFeeClassFilter('all');
                        setFeeSectionFilter('all');
                        setFeeDateFrom('');
                        setFeeDateTo('');
                      }}
                      style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: '700', fontSize: '12px', cursor: 'pointer', height: '36px' }}
                    >
                      🧹 Clear
                    </button>
                  )}
                  <button onClick={handleExportFinance} style={{ padding: '8px 16px', backgroundColor: 'var(--success)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', height: '36px' }}>
                    📥 Export Excel
                  </button>
                  <button onClick={() => setShowAddFee(!showAddFee)} style={{ padding: '8px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', height: '36px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiPlus /> Add Fee
                  </button>
                </div>
              </div>

              {showAddFee && (
                <form onSubmit={addFee} style={{ backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', borderRadius:'10px', padding:'20px', marginBottom:'18px' }}>
                  <h4 style={{ margin:'0 0 16px', color:'var(--text-main)', fontWeight:'700' }}>➕ Add New Fee Record</h4>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'14px' }}>
                    <div>
                      <label style={lb}>Class</label>
                      <select value={feeFormClass} onChange={e=>setFeeFormClass(e.target.value)} style={inS}>
                        <option value="">All Classes</option>
                        {['1','2','3','4','5','6','7','8','9','10','11','12'].map(c => (
                          <option key={c} value={c}>Class {c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={lb}>Section</label>
                      <select value={feeFormSection} onChange={e=>setFeeFormSection(e.target.value)} style={inS}>
                        <option value="">All Sections</option>
                        {['A','B','C','D','E'].map(s => (
                          <option key={s} value={s}>Section {s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={lb}>Select Student *</label>
                      <select required value={feeForm.studentId} onChange={e=>setFeeForm({...feeForm, studentId: e.target.value})} style={inS}>
                        <option value="">Select Student...</option>
                        {students
                          .filter(s => (!feeFormClass || s.class === feeFormClass || normalizeClass(s.class) === normalizeClass(feeFormClass)) && (!feeFormSection || (s.section || '').toUpperCase() === feeFormSection.toUpperCase()))
                          .map(s => (
                            <option key={s._id || s.id} value={s._id || s.id}>Roll {s.roll || s.rollNumber || 'N/A'} - {s.name} (Class {s.class || s.className}-{s.section})</option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label style={lb}>Fee Amount (₹) *</label>
                      <input required type="number" value={feeForm.amount} onChange={e=>setFeeForm({...feeForm, amount: e.target.value})} style={inS} placeholder="e.g. 15000" />
                    </div>
                    <div>
                      <label style={lb}>Due Date *</label>
                      <input required type="date" value={feeForm.dueDate} onChange={e=>setFeeForm({...feeForm, dueDate: e.target.value})} style={inS} />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={lb}>Audit Remarks / Reason *</label>
                      <input required type="text" value={feeForm.remarks} onChange={e=>setFeeForm({...feeForm, remarks: e.target.value})} style={inS} placeholder="e.g. Annual Tuition Fee / First Term Exam Fee" />
                    </div>
                    <div style={{ gridColumn: '1/-1', display:'flex', gap:'10px', marginTop: '10px' }}>
                      <button type="submit" style={{ flex:1, padding:'10px', backgroundColor:'var(--primary)', color:'white', border:'none', borderRadius:'7px', cursor:'pointer', fontWeight:'600' }}>Save Fee Record</button>
                      <button type="button" onClick={()=>{setShowAddFee(false); setFeeForm({ studentId:'', amount:'', dueDate:'', remarks:'' }); setFeeFormClass(''); setFeeFormSection('');}} style={{ flex:1, padding:'10px', backgroundColor:'var(--panel-bg)', color:'var(--text-main)', border:'1px solid var(--border-color)', borderRadius:'7px', cursor:'pointer', fontWeight:'600' }}>Cancel</button>
                    </div>
                  </div>
                </form>
              )}

              {/* Fee Table */}
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>Student</th><th>Class</th><th>Tuition</th><th>Total</th><th>Paid</th><th>Due</th><th>Audit Context</th><th>Remarks</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {filteredFees.map(f => (
                      <tr key={f.id}>
                        <td><strong>{f.student}</strong></td>
                        <td style={{ fontSize:'12px' }}>{f.class}</td>
                        <td>₹{f.tuition.toLocaleString()}</td>
                        <td><strong>₹{f.total.toLocaleString()}</strong></td>
                        <td style={{ color:'var(--success)', fontWeight:'600' }}>₹{f.paid.toLocaleString()}</td>
                        <td style={{ color: f.due>0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight:f.due>0?'600':'400' }}>₹{f.due.toLocaleString()}</td>
                        <td style={{ fontSize:'12px', color:'var(--text-muted)' }}>{f.updatedBy}</td>
                        <td style={{ fontSize:'12px', color:'var(--text-muted)', maxWidth:'180px', wordBreak:'break-word' }}>{f.remarks}</td>
                        <td style={{ fontSize:'12px' }}>{f.date}</td>
                        <td>{badge(f.status)}</td>
                        <td>
                          {f.status !== 'Paid' ? (
                            <button onClick={()=>markFee(f.id,'Paid')} style={{ padding:'4px 10px', backgroundColor:'var(--success)', color:'white', border:'none', borderRadius:'5px', cursor:'pointer', fontSize:'12px', fontWeight:'600' }}>✓ Paid</button>
                          ) : (
                            <button onClick={()=>markFee(f.id,'Pending')} style={{ padding:'4px 10px', backgroundColor:'var(--panel-bg)', color:'var(--text-muted)', border:'1px solid var(--border-color)', borderRadius:'5px', cursor:'pointer', fontSize:'12px' }}>Reset</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
               TAB 3 — STUDENT ATTENDANCE SECTION
          ═══════════════════════════════════════════════════════════════════ */}
          {!activeSection && activeTab === 'attendance' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
                <div>
                  <h2 style={{ margin:'0 0 4px', fontSize:'18px', fontWeight:'700' }}>📋 Student Attendance</h2>
                  <p style={{ color:'var(--text-muted)', fontSize:'13px', margin:0 }}>View attendance records and mark daily attendance for all classes.</p>
                </div>
                <button onClick={handleExportAttendance} style={{ padding:'9px 18px', backgroundColor:'var(--success)', color:'white', border:'none', borderRadius:'7px', cursor:'pointer', fontWeight:'600', fontSize:'13px', display:'flex', alignItems:'center', gap:'6px' }}>
                  📥 Export Excel
                </button>
              </div>

              {/* Sub-tab switcher */}
              <div style={{ display:'flex', gap:'0', marginBottom:'20px', borderBottom:'2px solid var(--border-color)' }}>
                {[
                  { key: 'view', label: '📊 View Records', icon: '' },
                  { key: 'mark', label: '✅ Mark Attendance', icon: '' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setAttendanceSubTab(tab.key)}
                    style={{
                      padding: '10px 24px',
                      fontSize: '13px',
                      fontWeight: attendanceSubTab === tab.key ? '700' : '500',
                      color: attendanceSubTab === tab.key ? 'var(--primary)' : 'var(--text-muted)',
                      background: 'none',
                      border: 'none',
                      borderBottom: attendanceSubTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
                      cursor: 'pointer',
                      marginBottom: '-2px',
                      transition: 'all 0.2s',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* SUB-TAB: View Records */}
              {attendanceSubTab === 'view' && (
                <div>
                  {/* Attendance filters */}
                  <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', marginBottom:'16px', alignItems:'center' }}>
                    <input 
                      placeholder="🔍 Search student name/roll..." 
                      value={searchAttendance} 
                      onChange={e=>setSearchAttendance(e.target.value)}
                      style={{ ...inS, width:'220px' }} 
                    />
                    
                    <select value={classFilter} onChange={e=>setClassFilter(e.target.value)} style={{ ...inS, width:'140px' }}>
                      <option value="all">All Classes</option>
                      {uniqueClasses.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>

                    <select value={sectionFilter} onChange={e=>setSectionFilter(e.target.value)} style={{ ...inS, width:'140px' }}>
                      <option value="all">All Sections</option>
                      {uniqueSections.map(sec => (
                        <option key={sec} value={sec}>Section {sec}</option>
                      ))}
                    </select>

                    <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ ...inS, width:'140px' }}>
                      <option value="all">All Status</option>
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                    </select>

                    <input 
                      type="date" 
                      value={dateFilter} 
                      onChange={e=>setDateFilter(e.target.value)} 
                      style={{ ...inS, width:'150px' }} 
                    />

                    {(classFilter!=='all' || sectionFilter!=='all' || statusFilter!=='all' || dateFilter!=='' || searchAttendance!=='') && (
                      <button 
                        onClick={() => {
                          setClassFilter('all');
                          setSectionFilter('all');
                          setStatusFilter('all');
                          setDateFilter('');
                          setSearchAttendance('');
                        }}
                        style={{ padding:'8px 12px', fontSize:'12px', color:'var(--danger)', border:'1px solid var(--danger)', borderRadius:'7px', background:'none', cursor:'pointer', fontWeight:'600' }}
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>

                  {/* Attendance stats */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:'12px', marginBottom:'16px' }}>
                    {[
                      { label:'Total Records', value: filteredAttendance.length, color:'var(--primary)' },
                      { label:'Present', value: filteredAttendance.filter(r=>r.status==='Present').length, color:'var(--success)' },
                      { label:'Absent', value: filteredAttendance.filter(r=>r.status==='Absent').length, color:'var(--danger)' },
                      { label:'Attendance %', value: filteredAttendance.length > 0 ? Math.round((filteredAttendance.filter(r=>r.status==='Present').length / filteredAttendance.length) * 100) + '%' : '0%', color:'#6366f1' },
                    ].map((s,i) => (
                      <div key={i} style={{ backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', borderRadius:'10px', padding:'14px', textAlign:'center' }}>
                        <div style={{ fontSize:'20px', fontWeight:'700', color:s.color }}>{s.value}</div>
                        <div style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'3px' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Attendance table */}
                  <div className="table-container">
                    {loadingAttendance ? (
                      <div style={{ padding:'40px', textAlign:'center', color:'var(--text-muted)' }}>
                        Loading attendance records...
                      </div>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Roll No</th>
                            <th>Student Name</th>
                            <th>Email</th>
                            <th>Class</th>
                            <th>Section</th>
                            <th>Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAttendance.length > 0 ? (
                            filteredAttendance.map((record) => (
                              <tr key={record._id}>
                                <td><strong>{record.student?.rollNumber || 'N/A'}</strong></td>
                                <td>{record.student?.user?.name || 'N/A'}</td>
                                <td>{record.student?.user?.email || 'N/A'}</td>
                                <td>{record.student?.className || 'N/A'}</td>
                                <td>{record.student?.section || 'N/A'}</td>
                                <td>{record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}</td>
                                <td>
                                  <span className={`status-badge ${record.status?.toLowerCase()}`}>
                                    {record.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} style={{ textAlign:'center', padding:'30px', color:'var(--text-muted)' }}>
                                No attendance records found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* SUB-TAB: Mark Attendance */}
              {attendanceSubTab === 'mark' && (
                <div>
                  {/* Mark attendance form */}
                  <div style={{ backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', borderRadius:'12px', padding:'24px', marginBottom:'20px' }}>
                    <h3 style={{ margin:'0 0 16px', fontSize:'15px', fontWeight:'700', color:'var(--text-main)' }}>✍️ Mark Daily Attendance</h3>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'14px', marginBottom:'16px' }}>
                      <div>
                        <label style={lb}>Class</label>
                        <select 
                          value={markClass} 
                          onChange={e=>setMarkClass(e.target.value)} 
                          style={inS}
                        >
                          <option value="">All Classes</option>
                          {uniqueClasses.map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={lb}>Section</label>
                        <select 
                          value={markSection} 
                          onChange={e=>setMarkSection(e.target.value)} 
                          style={inS}
                        >
                          <option value="">All Sections</option>
                          {uniqueSections.map(sec => (
                            <option key={sec} value={sec}>{sec.startsWith('Section') ? sec : `Section ${sec}`}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={lb}>Date *</label>
                        <input 
                          type="date" 
                          value={markDate} 
                          onChange={e=>setMarkDate(e.target.value)} 
                          style={inS} 
                        />
                      </div>
                      <div>
                        <label style={lb}>Student Name</label>
                        <input 
                          type="text" 
                          placeholder="Search name..." 
                          value={markNameSearch} 
                          onChange={e=>setMarkNameSearch(e.target.value)} 
                          onKeyDown={(e) => { if (e.key === 'Enter') fetchMarkStudents(); }}
                          style={inS} 
                        />
                      </div>
                      <div style={{ display:'flex', alignItems:'flex-end' }}>
                        <button 
                          onClick={fetchMarkStudents} 
                          disabled={markLoading}
                          style={{ 
                            width:'100%', padding:'10px', 
                            backgroundColor:'var(--primary)', color:'white', 
                            border:'none', borderRadius:'7px', cursor:'pointer', 
                            fontWeight:'600', fontSize:'13px',
                            opacity: markLoading ? 0.6 : 1,
                            display:'flex', alignItems:'center', justifyContent:'center', gap:'6px'
                          }}
                        >
                          {markLoading ? '⏳ Loading...' : '📋 Load Students'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Student list for marking */}
                  {markStudents.length > 0 && (
                    <div>
                      {/* Quick actions */}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px', flexWrap:'wrap', gap:'10px' }}>
                        <div style={{ fontSize:'13px', color:'var(--text-muted)' }}>
                          Showing <strong style={{ color:'var(--text-main)' }}>{markStudents.length}</strong> students for <strong style={{ color:'var(--primary)' }}>{markClass} - {markSection}</strong> on <strong style={{ color:'var(--text-main)' }}>{markDate}</strong>
                        </div>
                        <div style={{ display:'flex', gap:'8px' }}>
                          <button onClick={markAllPresent} style={{ padding:'6px 14px', fontSize:'12px', backgroundColor:'var(--success-bg)', color:'var(--success)', border:'1px solid rgba(52,211,153,0.3)', borderRadius:'6px', cursor:'pointer', fontWeight:'600' }}>
                            ✅ All Present
                          </button>
                          <button onClick={markAllAbsent} style={{ padding:'6px 14px', fontSize:'12px', backgroundColor:'var(--danger-bg)', color:'var(--danger)', border:'1px solid rgba(248,113,113,0.3)', borderRadius:'6px', cursor:'pointer', fontWeight:'600' }}>
                            ❌ All Absent
                          </button>
                          <button 
                            onClick={submitMarkAttendance}
                            disabled={markSaving}
                            style={{ 
                              padding:'6px 14px', fontSize:'12px', 
                              backgroundColor:'var(--primary)', color:'white', 
                              border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'600',
                              opacity: markSaving ? 0.6 : 1
                            }}
                          >
                            {markSaving ? 'Saving...' : '💾 Save Attendance'}
                          </button>
                        </div>
                      </div>

                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Roll No</th>
                              <th>Student Name</th>
                              <th style={{ textAlign:'center' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {markStudents.map((student) => (
                              <tr key={student.id}>
                                <td><strong>{student.roll}</strong></td>
                                <td>{student.name}</td>
                                <td>
                                  <div style={{ display:'flex', justifyContent:'center', gap:'8px' }}>
                                    <button 
                                      onClick={() => handleMarkStatusChange(student.id, 'Present')}
                                      style={{
                                        padding:'6px 16px', borderRadius:'6px', cursor:'pointer', fontWeight:'600', fontSize:'12px',
                                        border: 'none',
                                        backgroundColor: markAttendanceList[student.id] === 'Present' ? 'var(--success)' : 'var(--panel-bg)',
                                        color: markAttendanceList[student.id] === 'Present' ? 'white' : 'var(--text-muted)',
                                        transition: 'all 0.15s',
                                      }}
                                    >
                                      ✓ Present
                                    </button>
                                    <button 
                                      onClick={() => handleMarkStatusChange(student.id, 'Absent')}
                                      style={{
                                        padding:'6px 16px', borderRadius:'6px', cursor:'pointer', fontWeight:'600', fontSize:'12px',
                                        border: 'none',
                                        backgroundColor: markAttendanceList[student.id] === 'Absent' ? 'var(--danger)' : 'var(--panel-bg)',
                                        color: markAttendanceList[student.id] === 'Absent' ? 'white' : 'var(--text-muted)',
                                        transition: 'all 0.15s',
                                      }}
                                    >
                                      ✗ Absent
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Save button */}
                      <div style={{ marginTop:'16px', display:'flex', justifyContent:'center' }}>
                        <button 
                          onClick={submitMarkAttendance}
                          disabled={markSaving}
                          style={{ 
                            padding:'12px 40px', 
                            backgroundColor:'var(--primary)', color:'white', 
                            border:'none', borderRadius:'8px', cursor:'pointer', 
                            fontWeight:'700', fontSize:'14px',
                            opacity: markSaving ? 0.6 : 1,
                            display:'flex', alignItems:'center', gap:'8px',
                            boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                          }}
                        >
                          {markSaving ? '⏳ Saving...' : '💾 Save Attendance'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {markStudents.length === 0 && !markLoading && (
                    <div style={{ textAlign:'center', padding:'40px', color:'var(--text-muted)', backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', borderRadius:'12px' }}>
                      <div style={{ fontSize:'40px', marginBottom:'12px' }}>📝</div>
                      <p style={{ margin:'0 0 6px', fontWeight:'600', color:'var(--text-main)' }}>Select class, section and date</p>
                      <p style={{ margin:0, fontSize:'13px' }}>Enter the class and section details above and click "Fetch Students" to begin marking attendance.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}


          {/* ═══════════════════════════════════════════════════════════════════
               TAB 4 — MANAGE ACCOUNTS
          ═══════════════════════════════════════════════════════════════════ */}
          {!activeSection && activeTab === 'admins' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
                <div>
                  <h2 style={{ margin:'0 0 4px', fontSize:'18px', fontWeight:'700' }}>👑 Manage Manager Accounts</h2>
                  <p style={{ color:'var(--text-muted)', fontSize:'13px', margin:0 }}>Register and manage Finance Admin and Student Admin accounts.</p>
                </div>
                <div style={{ display:'flex', gap:'10px' }}>
                  <button onClick={handleExportSubAdmins} style={{ padding:'9px 18px', backgroundColor:'var(--success)', color:'white', border:'none', borderRadius:'7px', cursor:'pointer', fontWeight:'600', fontSize:'13px', display:'flex', alignItems:'center', gap:'6px' }}>
                    📥 Export Excel
                  </button>
                  <button onClick={()=>setShowAdminForm(!showAdminForm)} style={{ padding:'9px 18px', backgroundColor:'var(--primary)', color:'white', border:'none', borderRadius:'7px', cursor:'pointer', fontWeight:'600', fontSize:'13px', display:'flex', alignItems:'center', gap:'6px' }}>
                    <FiPlus /> Register Admin
                  </button>
                </div>
              </div>

              {/* Role cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'16px', marginBottom:'24px' }}>
                {[
                  {
                    role:'manager-admin', emoji:'👔', name:'Manager Admin',
                    color:'#3b82f6', bg:'rgba(59,130,246,0.08)', border:'rgba(59,130,246,0.25)',
                    desc:'Overall school supervision and executive control. Full overview capability.',
                    path:'/manager-admin',
                    count: subAdmins.filter(a=>a.role==='manager-admin').length
                  },
                  {
                    role:'academic-admin', emoji:'👩‍🏫', name:'Teacher & Student Admin',
                    color:'#8b5cf6', bg:'rgba(139,92,246,0.08)', border:'rgba(139,92,246,0.25)',
                    desc:'Unified portal for teachers, subjects, class assignments, student profiles and admissions.',
                    path:'/academic-admin',
                    count: subAdmins.filter(a=>a.role==='academic-admin' || a.role==='teacher-admin' || a.role==='student-admin').length
                  },
                  {
                    role:'finance-admin', emoji:'💰', name:'Finance Admin',
                    color:'#f59e0b', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.25)',
                    desc:'Manages all fee collection, billing, payment records and financial reports.',
                    path:'/finance-admin',
                    count: subAdmins.filter(a=>a.role==='finance-admin').length
                  },
                ].map(rc => (
                  <div key={rc.role} style={{ backgroundColor:'var(--card-bg)', border:`2px solid ${rc.border}`, borderRadius:'16px', padding:'22px', position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', top:'-20px', right:'-20px', width:'80px', height:'80px', borderRadius:'50%', backgroundColor:rc.bg, filter:'blur(20px)', pointerEvents:'none' }} />
                    <div style={{ position:'relative', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'32px', marginBottom:'10px' }}>{rc.emoji}</div>
                        <h3 style={{ margin:'0 0 6px', fontWeight:'800', color:'var(--text-main)', fontSize:'15px' }}>{rc.name}</h3>
                        <p style={{ fontSize:'12px', color:'var(--text-muted)', margin:'0 0 14px', lineHeight:'1.5' }}>{rc.desc}</p>
                        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                          <div>
                            <div style={{ fontSize:'28px', fontWeight:'800', color:rc.color, lineHeight:1 }}>{rc.count}</div>
                            <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'2px' }}>account{rc.count!==1?'s':''} registered</div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(rc.path)}
                        style={{ flexShrink:0, padding:'8px 14px', backgroundColor:rc.bg, color:rc.color, border:`1px solid ${rc.border}`, borderRadius:'8px', cursor:'pointer', fontWeight:'700', fontSize:'12px', display:'flex', alignItems:'center', gap:'5px', transition:'all 0.2s' }}
                      >
                        Open Portal →
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {showAdminForm && (
                <form onSubmit={addAdmin} style={{ backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', borderRadius:'10px', padding:'20px', marginBottom:'20px' }}>
                  <h4 style={{ margin:'0 0 16px', color:'var(--text-main)' }}>➕ Register New Manager / Staff</h4>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'14px' }}>
                    <div><label style={lb}>Full Name *</label><input required type="text" value={adminForm.name} onChange={e=>setAdminForm({...adminForm,name:e.target.value})} style={inS} placeholder="Admin full name" /></div>
                    <div><label style={lb}>Email *</label><input required type="email" value={adminForm.email} onChange={e=>setAdminForm({...adminForm,email:e.target.value})} style={inS} placeholder="admin@school.com" /></div>
                    <div><label style={lb}>Phone *</label><input required type="tel" value={adminForm.phone} onChange={e=>setAdminForm({...adminForm,phone:e.target.value})} style={inS} placeholder="+919876543210 or 10 digits" /></div>
                    <div>
                      <label style={lb}>Password *</label>
                      <div style={{ position:'relative' }}>
                        <input required type={showPassword?'text':'password'} value={adminForm.password} onChange={e=>setAdminForm({...adminForm,password:e.target.value})} style={{ ...inS, paddingRight:'36px' }} placeholder="e.g. Admin@123 (8+ chars)" />
                        <button type="button" onClick={()=>setShowPassword(!showPassword)} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}>
                          {showPassword ? <FiEyeOff size={14}/> : <FiEye size={14}/>}
                        </button>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>Must have 1 uppercase, 1 lowercase, 1 number & 1 special char</span>
                    </div>
                    <div>
                      <label style={lb}>Admin Role *</label>
                      <select value={adminForm.role} onChange={e=>setAdminForm({...adminForm,role:e.target.value})} style={inS}>
                        <option value="academic-admin">📚 Teacher &amp; Student Admin (Academic &amp; Admissions)</option>
                        <option value="manager-admin">👔 Manager Admin (Executive Overview &amp; Finance Read-Only)</option>
                        <option value="finance-admin">💰 Finance Admin</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={lb}>Audit Remarks / Reason *</label>
                      <input required type="text" value={adminForm.remarks} onChange={e=>setAdminForm({...adminForm,remarks:e.target.value})} style={inS} placeholder="e.g. Account created for academic session / staff onboarding reason" />
                    </div>
                    <div style={{ gridColumn: '1/-1', display:'flex', gap:'10px', marginTop: '10px' }}>
                      <button type="submit" style={{ flex:1, padding:'10px', backgroundColor:'var(--primary)', color:'white', border:'none', borderRadius:'7px', cursor:'pointer', fontWeight:'600' }}>Create Account</button>
                      <button type="button" onClick={()=>setShowAdminForm(false)} style={{ flex:1, padding:'10px', backgroundColor:'var(--panel-bg)', color:'var(--text-main)', border:'1px solid var(--border-color)', borderRadius:'7px', cursor:'pointer', fontWeight:'600' }}>Cancel</button>
                    </div>
                  </div>
                </form>
              )}

              {/* ── Advanced Manager & Sub-Admin Filter Bar ── */}
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '12px', 
                marginBottom: '20px', 
                padding: '16px', 
                backgroundColor: 'var(--panel-bg)', 
                borderRadius: '12px', 
                border: '1px solid var(--border-color)',
                alignItems: 'flex-end'
              }}>
                {/* Search */}
                <div style={{ flex: '1 1 220px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    🔍 Search Admin / Email
                  </label>
                  <input
                    placeholder="Search name, email, phone..."
                    value={searchSubAdmin}
                    onChange={e => setSearchSubAdmin(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Role Filter */}
                <div style={{ width: '170px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    🛡️ Admin Role
                  </label>
                  <select
                    value={subAdminRoleFilter}
                    onChange={e => setSubAdminRoleFilter(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    <option value="all">All Roles</option>
                    <option value="manager-admin">👔 Manager Admin</option>
                    <option value="finance-admin">💰 Finance Admin</option>
                    <option value="academic-admin">📚 Teacher Admin</option>
                    <option value="student-admin">🎓 Student Admin</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div style={{ width: '130px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    ⚡ Status
                  </label>
                  <select
                    value={subAdminStatusFilter}
                    onChange={e => setSubAdminStatusFilter(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Date From */}
                <div style={{ width: '140px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    📅 From Date
                  </label>
                  <input
                    type="date"
                    value={subAdminDateFrom}
                    onChange={e => setSubAdminDateFrom(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Date To */}
                <div style={{ width: '140px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    📅 To Date
                  </label>
                  <input
                    type="date"
                    value={subAdminDateTo}
                    onChange={e => setSubAdminDateTo(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Clear Button */}
                {(searchSubAdmin || subAdminRoleFilter !== 'all' || subAdminStatusFilter !== 'all' || subAdminDateFrom || subAdminDateTo) && (
                  <button
                    onClick={() => {
                      setSearchSubAdmin('');
                      setSubAdminRoleFilter('all');
                      setSubAdminStatusFilter('all');
                      setSubAdminDateFrom('');
                      setSubAdminDateTo('');
                    }}
                    style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: '700', fontSize: '12px', cursor: 'pointer', height: '36px' }}
                  >
                    🧹 Clear Filters
                  </button>
                )}
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Created</th><th>Audit Context</th><th>Remarks</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {filteredSubAdmins.length > 0 ? filteredSubAdmins.map(a => (
                      <tr key={a.id}>
                        <td><strong>{a.name}</strong></td>
                        <td>{a.email}</td>
                        <td style={{ fontSize:'13px' }}>{a.phone||'N/A'}</td>
                        <td>
                          {badge(a.role === 'finance-admin' ? 'finance' : a.role === 'academic-admin' ? 'academic' : a.role === 'manager-admin' ? 'manager' : 'student')}
                          <span style={{ marginLeft:'8px', fontSize:'13px', fontWeight: '600', color:'var(--text-main)' }}>
                            {a.role === 'super-admin' ? 'Super Admin' :
                             a.role === 'manager-admin' ? 'Manager Admin' :
                             a.role === 'academic-admin' ? 'Teacher Admin' :
                             a.role === 'student-admin' ? 'Student Admin' :
                             a.role === 'finance-admin' ? 'Finance Admin' :
                             a.role === 'operations-admin' ? 'Operations Admin' :
                             a.role ? a.role.replace('-',' ') : 'Admin'}
                          </span>
                        </td>
                        <td style={{ fontSize:'13px', color:'var(--text-muted)' }}>{a.created}</td>
                        <td style={{ fontSize:'12px', color:'var(--text-muted)' }}>
                          <div><strong>By:</strong> {a.createdBy}</div>
                          {a.updatedBy && a.updatedBy !== a.createdBy && <div><strong>Up:</strong> {a.updatedBy}</div>}
                        </td>
                        <td style={{ fontSize:'12px', color:'var(--text-muted)', maxWidth: '200px', wordBreak: 'break-word' }}>{a.remarks}</td>
                        <td>{badge(a.status)}</td>
                        <td>
                          <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                            <button
                              onClick={() => openEditAdmin(a)}
                              style={{ padding:'5px 12px', backgroundColor:'rgba(99,102,241,0.12)', color:'#6366f1', border:'1px solid rgba(99,102,241,0.25)', borderRadius:'6px', cursor:'pointer', fontWeight:'600', fontSize:'12px', display:'inline-flex', alignItems:'center', gap:'4px', transition:'all 0.2s' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor='rgba(99,102,241,0.22)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor='rgba(99,102,241,0.12)'; }}
                            >
                              ✏️ Edit
                            </button>
                            <button onClick={()=>deleteAdmin(a.id)} style={{ padding:'5px 12px', backgroundColor:'var(--danger-bg)', color:'var(--danger)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:'6px', cursor:'pointer', fontWeight:'600', fontSize:'12px', display:'inline-flex', alignItems:'center', gap:'4px' }}>
                              <FiTrash2 size={11}/> Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={7} style={{ textAlign:'center', padding:'30px', color:'var(--text-muted)' }}>No managers registered. Add one above.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Edit Manager Modal ── */}
              {showEditAdminModal && editingAdmin && (
                <div
                  onClick={() => setShowEditAdminModal(false)}
                  style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:3000, padding:'16px' }}
                >
                  <div
                    onClick={e => e.stopPropagation()}
                    style={{ backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', borderRadius:'20px', width:'100%', maxWidth:'480px', boxShadow:'0 25px 60px -12px rgba(0,0,0,0.4)', overflow:'hidden' }}
                  >
                    {/* Modal Header */}
                    <div style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', padding:'22px 28px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <h3 style={{ margin:0, color:'white', fontSize:'18px', fontWeight:'800', display:'flex', alignItems:'center', gap:'8px' }}>✏️ Edit Manager Account</h3>
                        <p style={{ margin:'4px 0 0', color:'rgba(255,255,255,0.75)', fontSize:'13px' }}>Update account details for <strong>{editingAdmin.name}</strong></p>
                      </div>
                      <button
                        onClick={() => setShowEditAdminModal(false)}
                        style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'8px', color:'white', cursor:'pointer', padding:'6px 10px', fontSize:'16px', fontWeight:'700', lineHeight:1 }}
                      >✕</button>
                    </div>

                    {/* Modal Body */}
                    <form onSubmit={handleUpdateAdmin} style={{ padding:'28px' }}>
                      {/* Current Info badge */}
                      <div style={{ display:'flex', alignItems:'center', gap:'12px', backgroundColor:'var(--panel-bg)', border:'1px solid var(--border-color)', borderRadius:'12px', padding:'14px 16px', marginBottom:'22px' }}>
                        <div style={{ width:'42px', height:'42px', borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'800', fontSize:'16px', flexShrink:0 }}>
                          {(editingAdmin.name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:'700', color:'var(--text-main)', fontSize:'14px' }}>{editingAdmin.name}</div>
                          <div style={{ fontSize:'12px', color:'var(--text-muted)' }}>{editingAdmin.email}</div>
                          <div style={{ fontSize:'11px', color:'#6366f1', fontWeight:'700', marginTop:'2px', textTransform:'uppercase' }}>{editingAdmin.role?.replace(/-/g,' ')}</div>
                        </div>
                      </div>

                      <div style={{ display:'grid', gap:'16px' }}>
                        {/* Full Name */}
                        <div>
                          <label style={{ display:'block', fontSize:'11px', fontWeight:'700', color:'var(--text-muted)', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Full Name *</label>
                          <input
                            required
                            type="text"
                            value={editAdminForm.name}
                            onChange={e => setEditAdminForm({...editAdminForm, name: e.target.value})}
                            style={{ width:'100%', padding:'10px 13px', borderRadius:'9px', border:'1px solid var(--border-color)', backgroundColor:'var(--input-bg)', color:'var(--text-main)', fontSize:'13px', boxSizing:'border-box', outline:'none' }}
                            placeholder="Admin full name"
                          />
                        </div>

                        {/* Phone */}
                        <div>
                          <label style={{ display:'block', fontSize:'11px', fontWeight:'700', color:'var(--text-muted)', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Phone Number</label>
                          <input
                            type="tel"
                            value={editAdminForm.phone}
                            onChange={e => setEditAdminForm({...editAdminForm, phone: e.target.value})}
                            style={{ width:'100%', padding:'10px 13px', borderRadius:'9px', border:'1px solid var(--border-color)', backgroundColor:'var(--input-bg)', color:'var(--text-main)', fontSize:'13px', boxSizing:'border-box', outline:'none' }}
                            placeholder="+919XXXXXXXXX"
                          />
                        </div>

                        {/* Role */}
                        <div>
                          <label style={{ display:'block', fontSize:'11px', fontWeight:'700', color:'var(--text-muted)', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Admin Role *</label>
                          <select
                            required
                            value={editAdminForm.role}
                            onChange={e => setEditAdminForm({...editAdminForm, role: e.target.value})}
                            style={{ width:'100%', padding:'10px 13px', borderRadius:'9px', border:'1px solid var(--border-color)', backgroundColor:'var(--input-bg)', color:'var(--text-main)', fontSize:'13px', boxSizing:'border-box', outline:'none', cursor:'pointer' }}
                          >
                            <option value="academic-admin">📚 Teacher &amp; Student Admin (Academic &amp; Admissions)</option>
                            <option value="manager-admin">👔 Manager Admin</option>
                            <option value="finance-admin">💰 Finance Admin</option>
                          </select>

                        </div>

                        {/* New Password */}
                        <div>
                          <label style={{ display:'block', fontSize:'11px', fontWeight:'700', color:'var(--text-muted)', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em' }}>New Password <span style={{ color:'var(--text-muted)', fontWeight:'400', textTransform:'none' }}>(leave blank to keep unchanged)</span></label>
                          <div style={{ position:'relative' }}>
                            <input
                              type={showEditPassword ? 'text' : 'password'}
                              value={editAdminForm.password}
                              onChange={e => setEditAdminForm({...editAdminForm, password: e.target.value})}
                              style={{ width:'100%', padding:'10px 40px 10px 13px', borderRadius:'9px', border:'1px solid var(--border-color)', backgroundColor:'var(--input-bg)', color:'var(--text-main)', fontSize:'13px', boxSizing:'border-box', outline:'none' }}
                              placeholder="Min 6 characters"
                            />
                            <button
                              type="button"
                              onClick={() => setShowEditPassword(!showEditPassword)}
                              style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:'16px', padding:0 }}
                            >
                              {showEditPassword ? <FiEyeOff size={15}/> : <FiEye size={15}/>}
                            </button>
                          </div>
                        </div>

                        {/* Audit Remarks */}
                        <div style={{ gridColumn: '1/-1' }}>
                          <label style={{ display:'block', fontSize:'11px', fontWeight:'700', color:'var(--text-muted)', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Audit Remarks / Update Reason *</label>
                          <input
                            required
                            type="text"
                            value={editAdminForm.remarks}
                            onChange={e => setEditAdminForm({...editAdminForm, remarks: e.target.value})}
                            style={{ width:'100%', padding:'10px 13px', borderRadius:'9px', border:'1px solid var(--border-color)', backgroundColor:'var(--input-bg)', color:'var(--text-main)', fontSize:'13px', boxSizing:'border-box', outline:'none' }}
                            placeholder="e.g. Updating phone number / role modification for staff onboarding"
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display:'flex', gap:'10px', marginTop:'24px' }}>
                        <button
                          type="submit"
                          style={{ flex:1, padding:'12px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:'700', fontSize:'14px', boxShadow:'0 4px 14px rgba(99,102,241,0.35)' }}
                        >
                          💾 Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowEditAdminModal(false)}
                          style={{ flex:1, padding:'12px', backgroundColor:'var(--panel-bg)', color:'var(--text-main)', border:'1px solid var(--border-color)', borderRadius:'10px', cursor:'pointer', fontWeight:'600', fontSize:'14px' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
               TAB — EXAM TIMETABLE
          ═══════════════════════════════════════════════════════════════════ */}
          {!activeSection && activeTab === 'exams' && (
            <ExamTimetableTab />
          )}

          {/* ═══════════════════════════════════════════════════════════════════
               TAB 5 — SYSTEM LOGS
          ═══════════════════════════════════════════════════════════════════ */}
          {!activeSection && activeTab === 'system' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
                <div>
                  <h2 style={{ margin:'0 0 4px', fontSize:'18px', fontWeight:'700' }}>⚙️ System Logs & Diagnostics</h2>
                  <p style={{ color:'var(--text-muted)', fontSize:'13px', margin:0 }}>Live server monitoring, database health, and security audit trail.</p>
                </div>
                <button onClick={handleExportLogs} style={{ padding:'9px 18px', backgroundColor:'var(--success)', color:'white', border:'none', borderRadius:'7px', cursor:'pointer', fontWeight:'600', fontSize:'13px', display:'flex', alignItems:'center', gap:'6px' }}>
                  📥 Export Logs
                </button>
              </div>

              <div className="progress-container">
                {[
                  { label:'Server Load', value:'35%', width:'35%', color:'var(--primary)', note:'Intel Xeon — Core 4' },
                  { label:'Memory Heap', value:'58%', width:'58%', color:'#f59e0b', note:'488 MB / 1024 MB' },
                  { label:'DB Latency',  value:'14ms', width:'12%', color:'var(--success)', note:'MongoDB Atlas Replica' },
                  { label:'API Uptime',  value:'99.98%', width:'99%', color:'var(--success)', note:'Port 5001 ONLINE' },
                ].map((s,i) => (
                  <div key={i} className="progress-card">
                    <div className="progress-card-info">
                      <span style={{ fontSize:'14px', fontWeight:'600', color:'var(--text-main)' }}>{s.label}</span>
                      <strong style={{ color:s.color }}>{s.value}</strong>
                    </div>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width:s.width, backgroundColor:s.color }} />
                    </div>
                    <span style={{ fontSize:'12px', color:'var(--text-muted)' }}>{s.note}</span>
                  </div>
                ))}
              </div>

              <div className="terminal-container">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <div className="terminal-dot red" />
                    <div className="terminal-dot yellow" />
                    <div className="terminal-dot green" />
                    <span className="terminal-title">live-audit-diagnostics.log</span>
                  </div>
                  <button 
                    onClick={()=>setSystemLogs([{ time:new Date().toTimeString().split(' ')[0], type:'system', text:'Console cleared.' }])}
                    className="terminal-clear-btn"
                  >
                    Clear
                  </button>
                </div>
                <div className="terminal-body">
                  {systemLogs.map((log,i) => {
                    const c = log.type==='security'?'#fb7185':log.type==='gateway'?'#34d399':log.type==='database'?'#fbbf24':'#38bdf8';
                    return (
                      <div key={i} style={{ display:'flex', gap:'8px', marginBottom:'4px' }}>
                        <span style={{ color:'#64748b' }}>[{log.time}]</span>
                        <span style={{ color:c, fontWeight:'bold' }}>[{log.type.toUpperCase()}]</span>
                        <span>{log.text}</span>
                      </div>
                    );
                  })}
                  <div ref={logsEndRef} />
                </div>
              </div>
            </div>
          )}

      {/* VIEW FULL STUDENT DETAILS MODAL */}
      {selectedViewStudent && (
        <div onClick={() => setSelectedViewStudent(null)} style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(8px)", display: "flex", justifyContent: "center",
          alignItems: "center", zIndex: 2000, padding: "16px"
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)",
            borderRadius: "20px", width: "100%", maxWidth: "800px",
            maxHeight: "92vh", overflowY: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
            color: "var(--text-main)"
          }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: "#3b82f6", color: "white", fontWeight: "800", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {selectedViewStudent.name ? selectedViewStudent.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <h3 style={{ margin: 0, color: "var(--text-main)", fontSize: "18px", fontWeight: "800" }}>
                    {selectedViewStudent.name}
                  </h3>
                  <p style={{ margin: "2px 0 0", color: "var(--text-muted)", fontSize: "12px", fontWeight: "600" }}>
                    Roll No: <span style={{ color: "#3b82f6" }}>{selectedViewStudent.roll || 'N/A'}</span> | Class: <span style={{ color: "#3b82f6" }}>Class {selectedViewStudent.class || selectedViewStudent.className} ({selectedViewStudent.section || 'A'})</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedViewStudent(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "var(--text-muted)" }}>×</button>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: "flex", gap: "8px", padding: "12px 24px", borderBottom: "1px solid var(--border-color)", overflowX: "auto" }}>
              {[
                { id: 'profile', label: '👤 Profile Details' },
                { id: 'attendance', label: '📊 Attendance Record' },
                { id: 'exams', label: '📅 Exam Timetable' },
                { id: 'results', label: '🏆 Exam Results' },
                { id: 'fees', label: '💳 Fee Statement' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setViewTab(tab.id as any)}
                  style={{
                    padding: "8px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "700",
                    border: "none", cursor: "pointer", transition: "all 0.2s",
                    backgroundColor: viewTab === tab.id ? "#3b82f6" : "var(--input-bg)",
                    color: viewTab === tab.id ? "white" : "var(--text-muted)"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div style={{ padding: "24px" }}>
              {/* TAB 1: PROFILE DETAILS */}
              {viewTab === 'profile' && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "15px" }}>
                  <div style={{ backgroundColor: "var(--input-bg)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Full Name</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", marginTop: "2px" }}>{selectedViewStudent.name}</div>
                  </div>
                  <div style={{ backgroundColor: "var(--input-bg)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Email Address</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", marginTop: "2px" }}>{selectedViewStudent.email}</div>
                  </div>
                  <div style={{ backgroundColor: "var(--input-bg)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Phone Number</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", marginTop: "2px" }}>{selectedViewStudent.phone || selectedViewStudent.user?.phone || 'N/A'}</div>
                  </div>
                  <div style={{ backgroundColor: "var(--input-bg)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Roll Number</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", marginTop: "2px", color: "#3b82f6" }}>{selectedViewStudent.roll || selectedViewStudent.rollNumber || 'N/A'}</div>
                  </div>
                  <div style={{ backgroundColor: "var(--input-bg)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Class & Section</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", marginTop: "2px" }}>Class {selectedViewStudent.class || selectedViewStudent.className} - Sec {selectedViewStudent.section || 'A'}</div>
                  </div>
                  <div style={{ backgroundColor: "var(--input-bg)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Parent / Guardian</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", marginTop: "2px" }}>{selectedViewStudent.parentName || 'Registered Parent'}</div>
                  </div>
                  <div style={{ backgroundColor: "var(--input-bg)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Parent Phone</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", marginTop: "2px" }}>{selectedViewStudent.parentPhone || selectedViewStudent.phone || 'N/A'}</div>
                  </div>
                  <div style={{ backgroundColor: "var(--input-bg)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Blood Group / Gender</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", marginTop: "2px" }}>{selectedViewStudent.bloodGroup || 'B+'} / {selectedViewStudent.gender || 'Male'}</div>
                  </div>
                  <div style={{ gridColumn: "1 / -1", backgroundColor: "var(--input-bg)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Residential Address</div>
                    <div style={{ fontSize: "14px", fontWeight: "600", marginTop: "2px" }}>{selectedViewStudent.address || 'No registered address'}</div>
                  </div>
                </div>
              )}

              {/* TAB 2: ATTENDANCE RECORD */}
              {viewTab === 'attendance' && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
                    <div style={{ backgroundColor: "var(--input-bg)", padding: "12px", borderRadius: "10px", textAlign: "center" }}>
                      <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)" }}>ATTENDANCE RATE</div>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: viewStudentAttendance.percentage >= 75 ? "#10b981" : "#f59e0b" }}>
                        {viewStudentAttendance.percentage}%
                      </div>
                    </div>
                    <div style={{ backgroundColor: "var(--input-bg)", padding: "12px", borderRadius: "10px", textAlign: "center" }}>
                      <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)" }}>TOTAL RECORDS</div>
                      <div style={{ fontSize: "20px", fontWeight: "800" }}>{viewStudentAttendance.records?.length || 0}</div>
                    </div>
                    <div style={{ backgroundColor: "var(--input-bg)", padding: "12px", borderRadius: "10px", textAlign: "center" }}>
                      <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)" }}>PRESENT DAYS</div>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: "#10b981" }}>
                        {viewStudentAttendance.records?.filter((r: any) => r.status === 'Present').length || 0}
                      </div>
                    </div>
                  </div>

                  <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "12px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead style={{ backgroundColor: "var(--input-bg)", fontSize: "11px", fontWeight: "700", color: "var(--text-muted)" }}>
                        <tr>
                          <th style={{ padding: "10px 14px" }}>Date</th>
                          <th style={{ padding: "10px 14px" }}>Day</th>
                          <th style={{ padding: "10px 14px" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewStudentAttendance.records?.length > 0 ? (
                          viewStudentAttendance.records.map((r: any, idx: number) => (
                            <tr key={idx} style={{ borderTop: "1px solid var(--border-color)" }}>
                              <td style={{ padding: "10px 14px", fontWeight: "600" }}>{new Date(r.date).toLocaleDateString()}</td>
                              <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>{new Date(r.date).toLocaleDateString('en-US', { weekday: 'long' })}</td>
                              <td style={{ padding: "10px 14px", fontWeight: "700", color: r.status === 'Present' ? '#10b981' : '#ef4444' }}>
                                {r.status === 'Present' ? '✓ Present' : '✗ Absent'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={3} style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>No attendance records found for this student.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: EXAM TIMETABLE */}
              {viewTab === 'exams' && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {viewStudentExams.length > 0 ? (
                    viewStudentExams.map((exam: any, idx: number) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", backgroundColor: "var(--input-bg)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                        <div>
                          <div style={{ fontWeight: "800", fontSize: "14px" }}>{exam.title}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                            📚 {exam.subject} | 📅 {new Date(exam.date).toLocaleDateString('en-GB')} | 🕒 {exam.startTime || '10:00 AM'} - {exam.endTime || '01:00 PM'}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "8px", backgroundColor: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
                            🏫 {exam.roomNumber || 'Hall-1'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", backgroundColor: "var(--input-bg)", borderRadius: "12px", border: "1px dashed var(--border-color)" }}>
                      No exam timetable scheduled for Class {selectedViewStudent.class || selectedViewStudent.className}.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: EXAM RESULTS */}
              {viewTab === 'results' && (
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  {viewStudentExams.length > 0 ? (
                    <>
                      <div style={{ padding: "15px", backgroundColor: "rgba(16,185,129,0.08)", borderRadius: "12px", border: "1px solid rgba(16,185,129,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: "700", color: "#10b981", textTransform: "uppercase" }}>Scheduled Exams for Class {selectedViewStudent.class || selectedViewStudent.className}</div>
                          <div style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-main)", marginTop: "2px" }}>Total: {viewStudentExams.length} Exam(s) Scheduled</div>
                        </div>
                        <span style={{ padding: "6px 14px", backgroundColor: "#3b82f6", color: "white", borderRadius: "20px", fontWeight: "800", fontSize: "12px" }}>
                          ACADEMIC YEAR
                        </span>
                      </div>

                      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
                        <thead style={{ backgroundColor: "var(--input-bg)", fontSize: "11px", fontWeight: "700", color: "var(--text-muted)" }}>
                          <tr>
                            <th style={{ padding: "10px 14px" }}>Exam Title</th>
                            <th style={{ padding: "10px 14px" }}>Subject</th>
                            <th style={{ padding: "10px 14px" }}>Date</th>
                            <th style={{ padding: "10px 14px" }}>Timing</th>
                            <th style={{ padding: "10px 14px" }}>Venue</th>
                            <th style={{ padding: "10px 14px" }}>Max Marks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewStudentExams.map((exam: any, i: number) => (
                            <tr key={i} style={{ borderTop: "1px solid var(--border-color)" }}>
                              <td style={{ padding: "10px 14px", fontWeight: "700" }}>{exam.title}</td>
                              <td style={{ padding: "10px 14px", color: "var(--text-muted)", fontWeight: "600" }}>📚 {exam.subject}</td>
                              <td style={{ padding: "10px 14px", fontWeight: "600" }}>📅 {new Date(exam.date).toLocaleDateString('en-GB')}</td>
                              <td style={{ padding: "10px 14px", fontWeight: "600" }}>🕒 {exam.startTime || '10:00 AM'} - {exam.endTime || '01:00 PM'}</td>
                              <td style={{ padding: "10px 14px" }}>
                                <span style={{ padding: "3px 10px", borderRadius: "8px", backgroundColor: "rgba(59,130,246,0.1)", color: "#3b82f6", fontWeight: "800", fontSize: "11px" }}>🏫 {exam.roomNumber || 'Hall-1'}</span>
                              </td>
                              <td style={{ padding: "10px 14px" }}>
                                <span style={{ padding: "3px 10px", borderRadius: "8px", backgroundColor: "rgba(139,92,246,0.1)", color: "#8b5cf6", fontWeight: "800", fontSize: "11px" }}>{exam.maxMarks || 100} Marks</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  ) : (
                    <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", backgroundColor: "var(--input-bg)", borderRadius: "12px", border: "1px dashed var(--border-color)" }}>
                      <div style={{ fontSize: "36px", marginBottom: "12px" }}>📋</div>
                      <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: "6px" }}>No Exam Results Available</div>
                      <div style={{ fontSize: "13px" }}>No exams have been scheduled for Class {selectedViewStudent.class || selectedViewStudent.className} yet.</div>
                      <div style={{ fontSize: "12px", marginTop: "8px", color: "#f59e0b", fontWeight: "600" }}>👉 First schedule exams from the Exams section, then they will appear here.</div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: FEE STATEMENT */}
              {viewTab === 'fees' && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {viewStudentFees.length > 0 ? (
                    viewStudentFees.map((fee: any, idx: number) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", backgroundColor: "var(--input-bg)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                        <div>
                          <div style={{ fontWeight: "700" }}>Admission & Tuition Fee</div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Due Date: {new Date(fee.dueDate).toLocaleDateString('en-GB')}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "16px", fontWeight: "800" }}>₹{fee.amount}</div>
                          <span style={{ fontSize: "10px", fontWeight: "800", color: fee.status === 'Paid' ? '#10b981' : '#ef4444' }}>{fee.status}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", backgroundColor: "var(--input-bg)", borderRadius: "12px" }}>
                      No fee records found for this student.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-color)", textAlign: "right" }}>
              <button onClick={() => setSelectedViewStudent(null)} style={{ padding: "10px 20px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
