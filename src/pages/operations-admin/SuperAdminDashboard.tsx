import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import API from '../../api/axios';
import { useSharedState } from '../../hooks/useSharedState';
import { FiShield, FiActivity, FiUsers, FiTrendingUp, FiTrash2, FiPlus, FiEye, FiEyeOff, FiEdit2, FiX, FiCheck } from 'react-icons/fi';

const SuperAdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [statusMsg, setStatusMsg] = useState(null);

  const activeTab = new URLSearchParams(location.search).get('tab') || 'overview';

  // ── MONGO DB STATE ─────────────────────────────────────────────────────────────
  const [students, setStudents] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [subAdmins, setSubAdmins] = useState<any[]>([]);

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showEditStudent, setShowEditStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showAddFee, setShowAddFee] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [studentForm, setStudentForm] = useState({ name:'', email:'', class:'', section:'', roll:'', dob:'', gender:'', phone:'', parent:'', parentPhone:'', blood:'' });
  const [feeForm, setFeeForm] = useState({ studentId:'', amount:'', dueDate:'' });
  const [feeFormClass, setFeeFormClass] = useState('');
  const [feeFormSection, setFeeFormSection] = useState('');
  const [adminForm, setAdminForm] = useState({ name:'', email:'', phone:'', password:'', role:'finance-admin' });
  const [searchStudent, setSearchStudent] = useState('');
  const [searchFee, setSearchFee] = useState('');
  const [feeFilter, setFeeFilter] = useState('all');

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
      const [financeRes, studentRes, academicRes] = await Promise.all([
        API.get('/api/super-admin/role/finance-admin'),
        API.get('/api/super-admin/role/student-admin'),
        API.get('/api/super-admin/role/academic-admin')
      ]);
      const allAdmins = [...(financeRes.data || []), ...(studentRes.data || []), ...(academicRes.data || [])];
      const mappedAdmins = allAdmins.map((a: any) => ({
        id: a._id,
        _id: a._id,
        name: a.name || 'Unknown',
        email: a.email || '',
        phone: a.phone || '',
        role: a.role || '',
        created: a.createdAt ? a.createdAt.slice(0, 10) : '',
        status: 'Active'
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
        return {
          id: f._id,
          _id: f._id,
          student: userObj.name || 'Unknown Student',
          studentId: studentObj._id || '',
          roll: studentObj.rollNumber || 'N/A',
          class: studentObj.className ? `Class ${studentObj.className}-${studentObj.section || ''}` : 'N/A',
          tuition: f.amount || 0,
          transport: 0,
          library: 0,
          total: f.amount || 0,
          paid: f.status === 'Paid' ? f.amount : 0,
          due: f.status === 'Paid' ? 0 : f.amount,
          status: f.status || 'Pending',
          date: f.dueDate ? f.dueDate.slice(0, 10) : '',
          paymentDate: f.paymentDate ? f.paymentDate.slice(0, 10) : '',
          term: 'Term 1',
          method: f.status === 'Paid' ? 'Online' : '-'
        };
      });
      setFees(mappedFees);
    } catch (err) {
      console.error("Error fetching fees:", err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchAttendanceData();
    fetchAdmins();
    fetchFees();
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

  const filteredStudents = students.filter(s =>
    !searchStudent || s.name.toLowerCase().includes(searchStudent.toLowerCase()) || s.email.toLowerCase().includes(searchStudent.toLowerCase()) || s.roll.includes(searchStudent)
  );
  const filteredFees = fees.filter(f => {
    const matchSearch = !searchFee || f.student.toLowerCase().includes(searchFee.toLowerCase());
    const matchFilter = feeFilter === 'all' || f.status === feeFilter;
    return matchSearch && matchFilter;
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
  const addStudent = (e) => {
    e.preventDefault();
    setStudents(p => [...p, { ...studentForm, id:`S00${p.length+1}`, status:'Active', admission: new Date().toISOString().slice(0,10) }]);
    setStudentForm({ name:'', email:'', class:'', section:'', roll:'', dob:'', gender:'', phone:'', parent:'', parentPhone:'', blood:'' });
    setShowAddStudent(false); trigger('Student profile created successfully!');
  };
  const saveStudent = (e) => {
    e.preventDefault();
    setStudents(p => p.map(s => s.id === editingStudent.id ? { ...s, ...editingStudent } : s));
    setShowEditStudent(false); trigger('Student profile updated successfully!');
  };
  const deleteStudent = (id) => { if(!window.confirm('Delete this student?')) return; setStudents(p=>p.filter(s=>s.id!==id)); trigger('Student deleted.'); };

  const markFee = async (id, status) => {
    try {
      const targetFee = fees.find(f => f.id === id);
      if (!targetFee) return;
      await API.put(`/api/finance/update/${id}`, {
        amount: targetFee.total,
        status: status
      });
      trigger(`Fee marked as ${status}.`);
      fetchFees();
    } catch (err) {
      console.error(err);
      trigger('Failed to update fee status', 'danger');
    }
  };
  const addFee = async (e) => {
    e.preventDefault();
    try {
      await API.post('/api/finance/create-fee', {
        studentId: feeForm.studentId,
        amount: Number(feeForm.amount),
        dueDate: feeForm.dueDate
      });
      trigger('Fee record created successfully!');
      fetchFees();
      setFeeForm({ studentId: '', amount: '', dueDate: '' });
      setFeeFormClass('');
      setFeeFormSection('');
      setShowAddFee(false);
    } catch (err) {
      console.error(err);
      trigger('Failed to create fee record', 'danger');
    }
  };

  const addAdmin = async (e) => {
    e.preventDefault();
    try {
      await API.post('/api/super-admin/create-admin', adminForm);
      trigger('Sub-Admin account created!');
      fetchAdmins();
      setAdminForm({ name:'', email:'', phone:'', password:'', role:'finance-admin' });
      setShowAdminForm(false);
    } catch (err) {
      console.error(err);
      trigger('Failed to create sub-admin account', 'danger');
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

  // ── RENDER ─────────────────────────────────────────────────────────────────
  const activeSection = new URLSearchParams(location.search).get('section');

  // ── Section definitions (for the landing cards) ────────────────────────────
  const SECTIONS = {
    core: {
      title: 'Core System',
      emoji: '🛡️',
      color: '#6366f1',
      description: 'Central system controls — overview, account management, and server diagnostics.',
      options: [
        { icon: '🏠', label: 'System Overview', desc: 'Live stats: students, finance, admins', path: '/super-admin?tab=overview' },
        { icon: '👑', label: 'Manage Accounts', desc: 'Create & manage sub-admin accounts', path: '/super-admin?tab=admins' },
        { icon: '⚙️', label: 'System Logs', desc: 'Server health & audit trail', path: '/super-admin?tab=system' },
      ],
    },
    students: {
      title: 'Student Admin',
      emoji: '🎓',
      color: '#10b981',
      description: 'Full student lifecycle management — from admission to class allocation and promotions.',
      options: [
        { icon: '👤', label: 'Student Profiles', desc: 'View & manage all student records', path: '/student-admin?tab=profiles' },
        { icon: '📋', label: 'Admissions', desc: 'Process new student applications', path: '/student-admin?tab=admissions' },
        { icon: '🏫', label: 'Class Allocation', desc: 'Assign students to class sections', path: '/student-admin?tab=allocation' },
        { icon: '🚀', label: 'Promotions', desc: 'Promote students to next class', path: '/student-admin?tab=promotions' },
        { icon: '✅', label: 'Mark Attendance', desc: 'Record daily class attendance', path: '/teacher/attendanceMark' },
      ],
    },
    academics: {
      title: 'Academics',
      emoji: '📚',
      color: '#3b82f6',
      description: 'Academic operations — teachers, subjects, class management, and exam scheduling.',
      options: [
        { icon: '👩‍🏫', label: 'Teacher Management', desc: 'Add, edit & assign teachers', path: '/academic-admin/teachers' },
        { icon: '📖', label: 'Subject Management', desc: 'Manage syllabus & subjects', path: '/academic-admin/subjects' },
        { icon: '🏛️', label: 'Class Management', desc: 'Class sections and timetables', path: '/academic-admin/classes' },
        { icon: '📝', label: 'Exam Scheduling', desc: 'Schedule and manage exams', path: '/exams' },
      ],
    },
    operations: {
      title: 'Operations & Finance',
      emoji: '💼',
      color: '#f59e0b',
      description: 'Finance administration, fee management, and school event operations.',
      options: [
        { icon: '💰', label: 'Finance Admin', desc: 'Fees, payments & financial reports', path: '/super-admin?tab=finance' },
        { icon: '🎉', label: 'Event Management', desc: 'Plan & manage school events', path: '/operations-admin/events' },
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
        <div className="option-card-grid">
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
      </div>
    );
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="dashboard-container" style={{ padding:'20px' }}>

          {/* ── Header ── */}
          <div style={{ marginBottom:'20px' }}>
            <h1 style={{ margin:0, display:'flex', alignItems:'center', gap:'10px', fontSize:'21px', fontWeight:'700' }}>
              <FiShield style={{ color:'var(--primary)' }} /> Super Admin Control Panel
            </h1>
            <p style={{ color:'var(--text-muted)', margin:'4px 0 0', fontSize:'13px' }}>Full visibility over Finance Admin, Student Admin, and system operations.</p>
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
               TAB 1 — SYSTEM OVERVIEW
          ═══════════════════════════════════════════════════════════════════ */}
          {!activeSection && activeTab === 'overview' && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:'14px', marginBottom:'24px' }}>
                {[
                  { label:'Total Students',    value: students.length,                  icon:'🎓', color:'var(--primary)' },
                  { label:'Active Students',   value: students.filter(s=>s.status==='Active').length, icon:'✅', color:'var(--success)' },
                  { label:'Sub-Admins',        value: subAdmins.length,                 icon:'🛡️', color:'#6366f1' },
                  { label:'Total Billed',      value:`₹${totalFees.toLocaleString()}`,  icon:'💵', color:'#f59e0b' },
                  { label:'Fees Collected',    value:`₹${collectedFees.toLocaleString()}`,icon:'💰',color:'var(--success)' },
                  { label:'Outstanding Dues',  value:`₹${pendingFees.toLocaleString()}`,icon:'⏳', color:'var(--danger)' },
                ].map((s,i) => (
                  <div key={i} className="stat-card" style={{ cursor:'default' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <span className="stat-title">{s.label}</span>
                        <div style={{ fontSize:'26px', fontWeight:'700', color:s.color, marginTop:'4px' }}>{s.value}</div>
                      </div>
                      <span style={{ fontSize:'26px' }}>{s.icon}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Export All Data Buttons */}
              <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>Export Start Date</label>
                    <input 
                      type="date" 
                      value={globalStartDate}
                      onChange={(e) => setGlobalStartDate(e.target.value)}
                      onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()}
                      style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>Export End Date</label>
                    <input 
                      type="date" 
                      value={globalEndDate}
                      onChange={(e) => setGlobalEndDate(e.target.value)}
                      onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()}
                      style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                </div>
                <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                  <button onClick={handleExportStudents} style={{ padding:'9px 18px', backgroundColor:'var(--primary)', color:'white', border:'none', borderRadius:'7px', cursor:'pointer', fontWeight:'600', fontSize:'13px', display:'flex', alignItems:'center', gap:'6px' }}>
                    📥 Export Students
                  </button>
                  <button onClick={handleExportFinance} style={{ padding:'9px 18px', backgroundColor:'#f59e0b', color:'white', border:'none', borderRadius:'7px', cursor:'pointer', fontWeight:'600', fontSize:'13px', display:'flex', alignItems:'center', gap:'6px' }}>
                    📥 Export Finance
                  </button>
                  <button onClick={handleExportSubAdmins} style={{ padding:'9px 18px', backgroundColor:'#6366f1', color:'white', border:'none', borderRadius:'7px', cursor:'pointer', fontWeight:'600', fontSize:'13px', display:'flex', alignItems:'center', gap:'6px' }}>
                    📥 Export Admins
                  </button>
                  <button onClick={handleExportAttendance} style={{ padding:'9px 18px', backgroundColor:'var(--success)', color:'white', border:'none', borderRadius:'7px', cursor:'pointer', fontWeight:'600', fontSize:'13px', display:'flex', alignItems:'center', gap:'6px' }}>
                    📥 Export Attendance
                  </button>
                  <button onClick={handleExportLogs} style={{ padding:'9px 18px', backgroundColor:'var(--text-main)', color:'var(--card-bg)', border:'none', borderRadius:'7px', cursor:'pointer', fontWeight:'600', fontSize:'13px', display:'flex', alignItems:'center', gap:'6px' }}>
                    📥 Export Logs
                  </button>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'18px' }}>
                {/* Quick summary — Finance */}
                <div style={{ backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', borderRadius:'12px', padding:'20px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                    <h3 style={{ margin:0, fontSize:'15px', fontWeight:'700' }}>💰 Finance Summary</h3>
                    <button onClick={()=>goTab('finance')} style={{ padding:'5px 12px', fontSize:'12px', backgroundColor:'var(--primary)', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'600' }}>View All</button>
                  </div>
                  {[
                    { label:'Total Billed',  value:`₹${totalFees.toLocaleString()}`,      color:'var(--text-main)' },
                    { label:'Collected',     value:`₹${collectedFees.toLocaleString()}`,  color:'var(--success)' },
                    { label:'Pending',       value:`₹${fees.filter(f=>f.status==='Pending').reduce((a,c)=>a+c.due,0).toLocaleString()}`, color:'#d97706' },
                    { label:'Overdue',       value:`₹${fees.filter(f=>f.status==='Overdue').reduce((a,c)=>a+c.due,0).toLocaleString()}`, color:'var(--danger)' },
                  ].map((r,i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border-color)' }}>
                      <span style={{ fontSize:'13px', color:'var(--text-muted)' }}>{r.label}</span>
                      <strong style={{ fontSize:'13px', color:r.color }}>{r.value}</strong>
                    </div>
                  ))}
                </div>

                {/* Quick summary — Students */}
                <div style={{ backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', borderRadius:'12px', padding:'20px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                    <h3 style={{ margin:0, fontSize:'15px', fontWeight:'700' }}>🎓 Student Summary</h3>
                    <button onClick={() => navigate('/student-admin?tab=profiles')} style={{ padding:'5px 12px', fontSize:'12px', backgroundColor:'var(--primary)', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'600' }}>View All</button>
                  </div>
                  {['Class 7','Class 8','Class 9','Class 10'].map(cls => {
                    const count = students.filter(s=>s.class===cls).length;
                    return (
                      <div key={cls} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border-color)' }}>
                        <span style={{ fontSize:'13px', color:'var(--text-muted)' }}>{cls}</span>
                        <span style={{ fontSize:'13px', fontWeight:'700', color:'var(--primary)' }}>{count} students</span>
                      </div>
                    );
                  })}
                </div>

                {/* Sub-admins quick view */}
                <div style={{ backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', borderRadius:'12px', padding:'20px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                    <h3 style={{ margin:0, fontSize:'15px', fontWeight:'700' }}>🛡️ Sub-Admin Accounts</h3>
                    <button onClick={()=>goTab('admins')} style={{ padding:'5px 12px', fontSize:'12px', backgroundColor:'var(--primary)', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'600' }}>Manage</button>
                  </div>
                  {subAdmins.map(a => {
                    const info = av(a.name);
                    return (
                      <div key={a.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 0', borderBottom:'1px solid var(--border-color)' }}>
                        <div style={{ width:'34px', height:'34px', borderRadius:'50%', backgroundColor:info.bg, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'700', fontSize:'12px', flexShrink:0 }}>{info.initials}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:'13px', fontWeight:'600', color:'var(--text-main)' }}>{a.name}</div>
                          <div style={{ fontSize:'11px', color:'var(--text-muted)' }}>{a.role.replace('-',' ')}</div>
                        </div>
                        {badge(a.status)}
                      </div>
                    );
                  })}
                </div>

                {/* Upcoming */}
                <div style={{ backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', borderRadius:'12px', padding:'20px' }}>
                  <h3 style={{ margin:'0 0 16px', fontSize:'15px', fontWeight:'700' }}>📅 School Calendar</h3>
                  {[
                    { date:'28 Jun', event:'Annual Sports Day', type:'Event' },
                    { date:'30 Jun', event:'Parent-Teacher Meet', type:'Meeting' },
                    { date:'05 Jul', event:'Term 2 Fee Due Date', type:'Finance' },
                    { date:'10 Jul', event:'Mid-Term Exams Begin', type:'Exam' },
                    { date:'15 Jul', event:'Science Exhibition', type:'Event' },
                  ].map((ev,i) => (
                    <div key={i} style={{ display:'flex', gap:'12px', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border-color)' }}>
                      <div style={{ backgroundColor:'var(--primary-bg)', borderRadius:'6px', padding:'5px 8px', textAlign:'center', minWidth:'50px' }}>
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
          )}

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

              {/* Controls */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'12px', marginBottom:'16px' }}>
                <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                  <input placeholder="🔍 Search student..." value={searchFee} onChange={e=>setSearchFee(e.target.value)}
                    style={{ ...inS, width:'220px' }} />
                  <select value={feeFilter} onChange={e=>setFeeFilter(e.target.value)} style={{ ...inS, width:'140px' }}>
                    <option value="all">All Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>
                <div style={{ display:'flex', gap:'10px' }}>
                  <button onClick={handleExportFinance} style={{ padding:'9px 18px', backgroundColor:'var(--success)', color:'white', border:'none', borderRadius:'7px', cursor:'pointer', fontWeight:'600', fontSize:'13px', display:'flex', alignItems:'center', gap:'6px' }}>
                    📥 Export Excel
                  </button>
                  <button onClick={()=>setShowAddFee(!showAddFee)} style={{ padding:'9px 18px', backgroundColor:'var(--primary)', color:'white', border:'none', borderRadius:'7px', cursor:'pointer', fontWeight:'600', fontSize:'13px', display:'flex', alignItems:'center', gap:'6px' }}>
                    <FiPlus /> Add Fee Record
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
                          .filter(s => (!feeFormClass || s.class === feeFormClass) && (!feeFormSection || s.section === feeFormSection))
                          .map(s => (
                            <option key={s.id} value={s.id}>Roll {s.roll} - {s.name}</option>
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
                    <div style={{ display:'flex', gap:'10px', alignItems:'flex-end' }}>
                      <button type="submit" style={{ flex:1, padding:'10px', backgroundColor:'var(--primary)', color:'white', border:'none', borderRadius:'7px', cursor:'pointer', fontWeight:'600' }}>Save</button>
                      <button type="button" onClick={()=>{setShowAddFee(false); setFeeForm({ studentId:'', amount:'', dueDate:'' }); setFeeFormClass(''); setFeeFormSection('');}} style={{ flex:1, padding:'10px', backgroundColor:'var(--panel-bg)', color:'var(--text-main)', border:'1px solid var(--border-color)', borderRadius:'7px', cursor:'pointer', fontWeight:'600' }}>Cancel</button>
                    </div>
                  </div>
                </form>
              )}

              {/* Fee Table */}
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>Student</th><th>Class</th><th>Tuition</th><th>Transport</th><th>Library</th><th>Total</th><th>Paid</th><th>Due</th><th>Term</th><th>Method</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {filteredFees.map(f => (
                      <tr key={f.id}>
                        <td><strong>{f.student}</strong></td>
                        <td style={{ fontSize:'12px' }}>{f.class}</td>
                        <td>₹{f.tuition.toLocaleString()}</td>
                        <td>₹{f.transport.toLocaleString()}</td>
                        <td>₹{f.library.toLocaleString()}</td>
                        <td><strong>₹{f.total.toLocaleString()}</strong></td>
                        <td style={{ color:'var(--success)', fontWeight:'600' }}>₹{f.paid.toLocaleString()}</td>
                        <td style={{ color: f.due>0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight:f.due>0?'600':'400' }}>₹{f.due.toLocaleString()}</td>
                        <td style={{ fontSize:'12px' }}>{f.term}</td>
                        <td style={{ fontSize:'12px', color:'var(--text-muted)' }}>{f.method}</td>
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
                  <h2 style={{ margin:'0 0 4px', fontSize:'18px', fontWeight:'700' }}>👑 Manage Sub-Admin Accounts</h2>
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
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'16px', marginBottom:'24px' }}>
                {[
                  { role:'finance-admin', emoji:'💰', name:'Finance Admin', color:'#f59e0b', desc:'Manages all fee collection, billing, payment records, and financial reports for the school.', count: subAdmins.filter(a=>a.role==='finance-admin').length },
                  { role:'student-admin', emoji:'🎓', name:'Student Admin', color:'#10b981', desc:'Manages student profiles, class enrollment, admissions, attendance records, and promotions.', count: subAdmins.filter(a=>a.role==='student-admin').length },
                ].map(rc => (
                  <div key={rc.role} style={{ backgroundColor:'var(--card-bg)', border:'2px solid var(--border-color)', borderRadius:'12px', padding:'22px', textAlign:'center' }}>
                    <div style={{ fontSize:'40px', marginBottom:'10px' }}>{rc.emoji}</div>
                    <h3 style={{ margin:'0 0 8px', fontWeight:'700', color:'var(--text-main)' }}>{rc.name}</h3>
                    <p style={{ fontSize:'13px', color:'var(--text-muted)', margin:'0 0 12px' }}>{rc.desc}</p>
                    <div style={{ fontSize:'22px', fontWeight:'700', color:rc.color }}>{rc.count}</div>
                    <div style={{ fontSize:'12px', color:'var(--text-muted)' }}>registered account{rc.count!==1?'s':''}</div>
                  </div>
                ))}
              </div>

              {showAdminForm && (
                <form onSubmit={addAdmin} style={{ backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', borderRadius:'10px', padding:'20px', marginBottom:'20px' }}>
                  <h4 style={{ margin:'0 0 16px', color:'var(--text-main)' }}>➕ Register New Sub-Admin</h4>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'14px' }}>
                    <div><label style={lb}>Full Name *</label><input required type="text" value={adminForm.name} onChange={e=>setAdminForm({...adminForm,name:e.target.value})} style={inS} placeholder="Admin full name" /></div>
                    <div><label style={lb}>Email *</label><input required type="email" value={adminForm.email} onChange={e=>setAdminForm({...adminForm,email:e.target.value})} style={inS} placeholder="admin@school.com" /></div>
                    <div><label style={lb}>Phone</label><input type="tel" value={adminForm.phone} onChange={e=>setAdminForm({...adminForm,phone:e.target.value})} style={inS} placeholder="+919XXXXXXXXX" /></div>
                    <div>
                      <label style={lb}>Password *</label>
                      <div style={{ position:'relative' }}>
                        <input required type={showPassword?'text':'password'} value={adminForm.password} onChange={e=>setAdminForm({...adminForm,password:e.target.value})} style={{ ...inS, paddingRight:'36px' }} placeholder="Min 8 chars" />
                        <button type="button" onClick={()=>setShowPassword(!showPassword)} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}>
                          {showPassword ? <FiEyeOff size={14}/> : <FiEye size={14}/>}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label style={lb}>Admin Role *</label>
                      <select value={adminForm.role} onChange={e=>setAdminForm({...adminForm,role:e.target.value})} style={inS}>
                        <option value="finance-admin">💰 Finance Admin</option>
                        <option value="student-admin">🎓 Student Admin</option>
                      </select>
                    </div>
                    <div style={{ display:'flex', gap:'10px', alignItems:'flex-end' }}>
                      <button type="submit" style={{ flex:1, padding:'10px', backgroundColor:'var(--primary)', color:'white', border:'none', borderRadius:'7px', cursor:'pointer', fontWeight:'600' }}>Create</button>
                      <button type="button" onClick={()=>setShowAdminForm(false)} style={{ flex:1, padding:'10px', backgroundColor:'var(--panel-bg)', color:'var(--text-main)', border:'1px solid var(--border-color)', borderRadius:'7px', cursor:'pointer', fontWeight:'600' }}>Cancel</button>
                    </div>
                  </div>
                </form>
              )}

              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Created</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {subAdmins.length > 0 ? subAdmins.map(a => (
                      <tr key={a.id}>
                        <td><strong>{a.name}</strong></td>
                        <td>{a.email}</td>
                        <td style={{ fontSize:'13px' }}>{a.phone||'N/A'}</td>
                        <td>{badge(a.role==='finance-admin' ? 'finance' : 'student')}<span style={{ marginLeft:'4px', fontSize:'13px', color:'var(--text-muted)' }}>{a.role.replace('-',' ')}</span></td>
                        <td style={{ fontSize:'13px', color:'var(--text-muted)' }}>{a.created}</td>
                        <td>{badge(a.status)}</td>
                        <td>
                          <button onClick={()=>deleteAdmin(a.id)} style={{ padding:'5px 12px', backgroundColor:'var(--danger-bg)', color:'var(--danger)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:'6px', cursor:'pointer', fontWeight:'600', fontSize:'12px', display:'inline-flex', alignItems:'center', gap:'4px' }}>
                            <FiTrash2 size={11}/> Remove
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={7} style={{ textAlign:'center', padding:'30px', color:'var(--text-muted)' }}>No sub-admins registered. Add one above.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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

        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
