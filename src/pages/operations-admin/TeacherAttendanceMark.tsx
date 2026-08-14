import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import AcademicTabs from '../../components/AcademicTabs';
import { FiSave, FiSearch, FiCheck, FiX, FiLoader, FiDownload, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import API from '../../api/axios';
import { useSocket } from '../../context/SocketContext';

const TeacherAttendanceMark = () => {
  const { onEvent } = useSocket();
  const [attendanceSubTab, setAttendanceSubTab] = useState('view');
  
  // States
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  
  // Filters for View Records
  const [searchAttendance, setSearchAttendance] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Filters for Mark Attendance
  const [markClass, setMarkClass] = useState('');
  const [markSection, setMarkSection] = useState('');
  const [markDate, setMarkDate] = useState(new Date().toISOString().split('T')[0]);
  const [markNameSearch, setMarkNameSearch] = useState('');
  
  const [markStudents, setMarkStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [markAttendanceList, setMarkAttendanceList] = useState<Record<string, string>>({});
  const [markSaving, setMarkSaving] = useState(false);

  // Final Submission Lock state
  const [lockedKeys, setLockedKeys] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('attendance_locked_keys') || '[]');
    } catch {
      return [];
    }
  });
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);

  const [assignedTimetableClasses, setAssignedTimetableClasses] = useState<any[]>([]);
  const userEmail = localStorage.getItem('userEmail') || '';

  // Admin / Manager Override Privilege
  const currentUserRole = (localStorage.getItem('role') || '').toLowerCase();
  const currentUserName = localStorage.getItem('userName') || (currentUserRole === 'super-admin' ? 'Super Admin' : currentUserRole === 'academic-admin' ? 'Academic Admin / Manager' : 'Subject Teacher');
  const canAdminOverride = currentUserRole === 'super-admin' || currentUserRole === 'academic-admin' || currentUserRole.includes('admin') || currentUserRole.includes('manager');

  const [adminOverrideActive, setAdminOverrideActive] = useState(false);
  const [auditRemarkInput, setAuditRemarkInput] = useState('');

  // Normalization helper (used only for display/filtering comparison, NOT for API calls)
  const normalizeClass = (cls: any) => {
    if (!cls) return '';
    return cls.toString().toLowerCase()
      .replace(/class\s*/i, '')
      .replace(/(st|nd|rd|th)\s*$/i, '')
      .trim();
  };

  // Date helper functions for timezone-independent date string matching (YYYY-MM-DD)
  const getUtcDateStr = (d: any) => {
    if (!d) return '';
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toISOString().slice(0, 10);
  };

  const getLocalDateStr = (d: any) => {
    if (!d) return '';
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return '';
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const isTeacherRole = (localStorage.getItem('role') || '').toLowerCase().includes('teacher');

  // Extract unique classes and sections across assigned timetable, attendance records, and student records
  const uniqueClasses = Array.from(new Set([
    ...assignedTimetableClasses.map(c => c.className),
    ...attendanceRecords.map(r => r.student?.className)
  ].filter(Boolean)));

  const uniqueSections = Array.from(new Set([
    ...assignedTimetableClasses.map(c => c.section),
    ...attendanceRecords.map(r => r.student?.section),
    'A', 'B', 'C', 'D', 'E', 'F'
  ].filter(Boolean))).sort();

  // Fetch all attendance records for View tab
  const fetchAllAttendance = async () => {
    setLoadingRecords(true);
    try {
      const response = await API.get('/api/attendance/all');
      setAttendanceRecords(response.data || []);
    } catch (err) {
      console.error("Error fetching attendance records", err);
    } finally {
      setLoadingRecords(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchAllAttendance();
    const cleanup = onEvent('ATTENDANCE_CHANGED', () => {
      fetchAllAttendance();
    });
    return () => cleanup();
  }, [attendanceSubTab, onEvent]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        let classesList: any[] = [];

        // 1. Fetch classes from academic admin endpoint
        try {
          const res = await API.get('/api/academic-admin/classes');
          if (res.data?.data) {
            classesList = res.data.data;
          }
        } catch (err) {
          console.warn("Could not load classes from academic admin", err);
        }

        // 2. Fetch distinct class names from student admin endpoint
        try {
          const resNames = await API.get('/api/student-admin/classes');
          if (resNames.data?.data && Array.isArray(resNames.data.data)) {
            resNames.data.data.forEach((clsName: string) => {
              if (clsName && !classesList.some(c => normalizeClass(c.className) === normalizeClass(clsName))) {
                classesList.push({ className: clsName, section: 'A' });
              }
            });
          }
        } catch (err) {
          console.warn("Could not load class names from student admin", err);
        }

        setAssignedTimetableClasses(classesList);

        // 3. For teachers, pre-select their assigned class in charge if available
        if (userEmail) {
          try {
            const profileRes = await API.get(`/api/teacher/profile-info/${userEmail}`);
            const classInCharge = profileRes.data?.data?.classInCharge;
            if (classInCharge && classInCharge.className && classInCharge.section) {
              setMarkClass(classInCharge.className);
              setMarkSection(classInCharge.section);
            } else if (classesList.length > 0 && !markClass) {
              setMarkClass(classesList[0].className);
              setMarkSection(classesList[0].section || 'A');
            }
          } catch (e) {
            if (classesList.length > 0 && !markClass) {
              setMarkClass(classesList[0].className);
              setMarkSection(classesList[0].section || 'A');
            }
          }
        } else if (classesList.length > 0 && !markClass) {
          setMarkClass(classesList[0].className);
          setMarkSection(classesList[0].section || 'A');
        }
      } catch (err) {
        console.error("Failed to load classes", err);
      }
    };
    fetchClasses();
  }, [userEmail]);

  // CSV Export Utility
  const downloadCSV = (data: any[][], filename: string, headers: string[]) => {
    const escapeCSV = (val: any) => {
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
  };

  // Filter attendance records
  const filteredAttendance = attendanceRecords.filter(r => {
    const studentName = r.student?.user?.name || '';
    const studentEmail = r.student?.user?.email || '';
    const rollNo = r.student?.rollNumber || '';
    const className = r.student?.className || '';
    const section = r.student?.section || '';
    const dateStr = getUtcDateStr(r.date) || getLocalDateStr(r.date);

    const matchesSearch = !searchAttendance || 
      studentName.toLowerCase().includes(searchAttendance.toLowerCase()) ||
      studentEmail.toLowerCase().includes(searchAttendance.toLowerCase()) ||
      rollNo.toLowerCase().includes(searchAttendance.toLowerCase());

    const matchesClass = classFilter === 'all' || normalizeClass(className) === normalizeClass(classFilter);
    const matchesSection = sectionFilter === 'all' || section.toUpperCase() === sectionFilter.toUpperCase();
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    let matchesDate = true;
    if (startDateFilter && endDateFilter) {
      matchesDate = dateStr >= startDateFilter && dateStr <= endDateFilter;
    } else if (startDateFilter) {
      matchesDate = dateStr >= startDateFilter;
    } else if (endDateFilter) {
      matchesDate = dateStr <= endDateFilter;
    }

    return matchesSearch && matchesClass && matchesSection && matchesStatus && matchesDate;
  });

  const handleExportAttendance = () => {
    const headers = ['Roll Number', 'Student Name', 'Email', 'Class', 'Section', 'Date', 'Status'];
    const data = filteredAttendance.map(r => [
      r.student?.rollNumber || 'N/A',
      r.student?.user?.name || 'N/A',
      r.student?.user?.email || 'N/A',
      r.student?.className || 'N/A',
      r.student?.section || 'N/A',
      r.date ? new Date(r.date).toLocaleDateString() : 'N/A',
      r.status || 'N/A'
    ]);
    downloadCSV(data, 'teacher_attendance_report.csv', headers);
  };

  // Fetch student list for marking
  const fetchMarkStudents = async () => {
    if (!markClass) {
      alert('Please select a Class');
      return;
    }
    if (markDate > todayStr) {
      alert('⚠️ Future Date Lock: You cannot mark attendance for future dates!');
      return;
    }

    const isPastDate = markDate < todayStr;
    const lockKey = `${normalizeClass(markClass)}-${(markSection || 'all').toUpperCase()}-${markDate}`;
    const isLocked = (isPastDate || lockedKeys.includes(lockKey)) && !adminOverrideActive;
    setIsAlreadySubmitted(isLocked);

    setLoadingStudents(true);
    try {
      const sectionQuery = markSection ? `&section=${encodeURIComponent(markSection)}` : '';
      const response = await API.get(`/api/attendance/list?className=${encodeURIComponent(markClass)}${sectionQuery}`);
      let students = response.data || [];
      
      if (markNameSearch) {
        students = students.filter((s: any) => s.user?.name?.toLowerCase().includes(markNameSearch.toLowerCase()));
      }
      
      setMarkStudents(students);
      
      // Populate with saved record status if viewing past/existing date, else default to Present
      const initialStatus: Record<string, string> = {};
      students.forEach((s: any) => {
        const existingRecord = attendanceRecords.find(
          r => (r.student?._id === s._id || r.student?.user?._id === s.user?._id || r.student === s._id) && 
               r.date && (getUtcDateStr(r.date) === markDate || getLocalDateStr(r.date) === markDate)
        );
        initialStatus[s._id] = existingRecord ? existingRecord.status : 'Present';
      });
      setMarkAttendanceList(initialStatus);
      
    } catch (err) {
      console.error("Failed to load students", err);
      alert('Failed to load students. Make sure the class and section are valid.');
    } finally {
      setLoadingStudents(false);
    }
  };

  // Submit attendance
  const submitMarkAttendance = async () => {
    if ((markDate < todayStr || isAlreadySubmitted) && !canAdminOverride) {
      alert('🔒 Access Denied: Subject Teacher cannot modify locked/past attendance. Only Manager / Teacher Admin / Super Admin can edit.');
      return;
    }
    if (isAlreadySubmitted && !adminOverrideActive) {
      alert('🔒 Attendance is locked! Use "Unlock & Override Attendance" if you are a Manager/Admin.');
      return;
    }
    if (markDate > todayStr) {
      alert('⚠️ Future Date Lock: You cannot mark attendance for future dates!');
      return;
    }
    if (Object.keys(markAttendanceList).length === 0) {
      alert('No attendance data to save!');
      return;
    }
    if (!markDate) {
      alert('Please select a date.');
      return;
    }
    setMarkSaving(true);
    
    try {
      const attendanceData = Object.keys(markAttendanceList).map(studentId => ({
        studentId,
        status: markAttendanceList[studentId]
      }));

      const actionBy = `${currentUserName} (${currentUserRole.replace('-', ' ').toUpperCase()})`;
      const rawAuditRemark = auditRemarkInput.trim() || (adminOverrideActive ? `Admin Audit Override` : `Daily Period Roll Call Register`);
      const auditRemark = rawAuditRemark.includes('— by') ? rawAuditRemark : `${rawAuditRemark} — by ${actionBy}`;

      await API.post('/api/attendance/bulkSubmit', {
        attendanceData,
        date: markDate,
        updatedBy: actionBy,
        remark: auditRemark
      });

      const lockKey = `${normalizeClass(markClass)}-${markSection.toUpperCase()}-${markDate}`;
      const updatedLocks = Array.from(new Set([...lockedKeys, lockKey]));
      setLockedKeys(updatedLocks);
      localStorage.setItem('attendance_locked_keys', JSON.stringify(updatedLocks));
      
      if (!adminOverrideActive) {
        setIsAlreadySubmitted(true);
      }

      alert(`✅ Attendance updated successfully by ${actionBy}! Remark logged: "${auditRemark}"`);
    } catch (err) {
      console.error(err);
      alert('Error saving attendance');
    } finally {
      setMarkSaving(false);
    }
  };

  const handleMarkStatusChange = (id: string, status: string) => {
    setMarkAttendanceList(prev => ({ ...prev, [id]: status }));
  };

  const markAllPresent = () => {
    const allPresent: Record<string, string> = {};
    markStudents.forEach(s => allPresent[s._id] = 'Present');
    setMarkAttendanceList(allPresent);
  };

  const markAllAbsent = () => {
    const allAbsent: Record<string, string> = {};
    markStudents.forEach(s => allAbsent[s._id] = 'Absent');
    setMarkAttendanceList(allAbsent);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="dashboard-container" style={{ padding: '20px' }}>
          {(() => {
            const userRole = localStorage.getItem('role') || '';
            return (userRole === 'academic-admin' || userRole === 'super-admin') && <AcademicTabs />;
          })()}
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                <FiCheckCircle className="text-indigo-600" /> Student Attendance
              </h1>
              <p className="text-slate-500 mt-1">View attendance records and mark daily attendance for your classes.</p>
            </div>
            {attendanceSubTab === 'view' && (
              <button 
                onClick={handleExportAttendance} 
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl shadow-sm shadow-emerald-200 transition-all active:scale-95"
              >
                <FiDownload /> Export Excel
              </button>
            )}
          </div>

          {/* Sub-tab switcher */}
          <div className="flex border-b border-slate-200 mb-8 overflow-x-auto hide-scrollbar">
            {[
              { key: 'view', label: '📊 View Records' },
              { key: 'mark', label: '✅ Mark Attendance' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setAttendanceSubTab(tab.key)}
                className={`py-3 px-6 whitespace-nowrap font-medium text-sm transition-all relative ${
                  attendanceSubTab === tab.key 
                    ? 'text-indigo-600' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                {tab.label}
                {attendanceSubTab === tab.key && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* VIEW TAB */}
          {attendanceSubTab === 'view' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Filters */}
              <div className="bg-[var(--card-bg)] p-5 rounded-2xl shadow-sm border border-[var(--border-color)] mb-6 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Search</label>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input 
                      type="text"
                      placeholder="Student name or roll..." 
                      value={searchAttendance} 
                      onChange={e => setSearchAttendance(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-[var(--input-bg)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                    />
                  </div>
                </div>
                
                <div className="w-[140px]">
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Class</label>
                  <select 
                    value={classFilter} 
                    onChange={e => setClassFilter(e.target.value)} 
                    className="w-full px-3 py-2 bg-[var(--input-bg)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="all">All Classes</option>
                    {uniqueClasses.map(cls => (
                      <option key={cls} value={cls}>
                        {cls.toLowerCase().startsWith('class') ? cls : `Class ${cls}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-[140px]">
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Section</label>
                  <select 
                    value={sectionFilter} 
                    onChange={e => setSectionFilter(e.target.value)} 
                    className="w-full px-3 py-2 bg-[var(--input-bg)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="all">All Sections</option>
                    {uniqueSections.map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>

                <div className="w-[140px]">
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Status</label>
                  <select 
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value)} 
                    className="w-full px-3 py-2 bg-[var(--input-bg)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="all">All Status</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>

                <div className="w-[140px]">
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Start Date</label>
                  <input 
                    type="date" 
                    value={startDateFilter} 
                    onChange={e => setStartDateFilter(e.target.value)} 
                    onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()}
                    className="w-full px-3 py-2 bg-[var(--input-bg)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                  />
                </div>

                <div className="w-[140px]">
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">End Date</label>
                  <input 
                    type="date" 
                    value={endDateFilter} 
                    onChange={e => setEndDateFilter(e.target.value)} 
                    onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()}
                    className="w-full px-3 py-2 bg-[var(--input-bg)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                  />
                </div>

                {(classFilter !== 'all' || sectionFilter !== 'all' || statusFilter !== 'all' || startDateFilter !== '' || endDateFilter !== '' || searchAttendance !== '') && (
                  <button 
                    onClick={() => {
                      setClassFilter('all');
                      setSectionFilter('all');
                      setStatusFilter('all');
                      setStartDateFilter('');
                      setEndDateFilter('');
                      setSearchAttendance('');
                    }}
                    className="px-4 py-2 text-rose-500 hover:bg-rose-50 text-sm font-semibold rounded-xl border border-rose-200 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Records Table */}
              <div className="bg-[var(--card-bg)] rounded-2xl shadow-sm border border-[var(--border-color)] overflow-hidden">
                {loadingRecords ? (
                  <div className="flex flex-col items-center justify-center p-16 text-slate-400">
                    <FiLoader className="animate-spin text-indigo-500 mb-4" size={32} />
                    <p>Loading attendance records...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                          <th className="px-6 py-4 font-semibold border-b border-slate-100">Date</th>
                          <th className="px-6 py-4 font-semibold border-b border-slate-100">Class</th>
                          <th className="px-6 py-4 font-semibold border-b border-slate-100">Section</th>
                          <th className="px-6 py-4 font-semibold border-b border-slate-100">Roll No</th>
                          <th className="px-6 py-4 font-semibold border-b border-slate-100">Student Name</th>
                          <th className="px-6 py-4 font-semibold border-b border-slate-100">Status</th>
                          <th className="px-6 py-4 font-semibold border-b border-slate-100">Action By / Audit Remark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {filteredAttendance.length > 0 ? (
                          filteredAttendance.map(r => (
                            <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                                {r.date ? new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold">{r.student?.className}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                {r.student?.section}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                                {r.student?.rollNumber}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900">
                                {r.student?.user?.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                  r.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                }`}>
                                  {r.status === 'Present' ? <FiCheckCircle size={14} /> : <FiXCircle size={14} />}
                                  {r.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-xs">
                                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                  👔 {r.updatedBy || 'Class Teacher In-Charge'}
                                </div>
                                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                                  {r.remark || 'Daily Period Roll Call'}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                              <div className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                  <FiSearch size={24} className="text-slate-400" />
                                </div>
                                <p className="text-base font-medium text-slate-600">No records found</p>
                                <p className="text-sm mt-1">Try adjusting your filters to see more results.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MARK TAB */}
          {attendanceSubTab === 'mark' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Filter inputs for fetching list */}
              <div className="bg-[var(--card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--border-color)] mb-8">
                <h2 className="text-lg font-bold text-slate-800 mb-5">Select Class for Attendance</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-5 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Date (Max Today)</label>
                    <input 
                      type="date" 
                      value={markDate} 
                      max={todayStr}
                      onChange={e => {
                        if (e.target.value > todayStr) {
                          alert('⚠️ Future Date Lock: You cannot mark attendance for future dates!');
                          setMarkDate(todayStr);
                          return;
                        }
                        setMarkDate(e.target.value);
                      }} 
                      onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()}
                      className="w-full px-4 py-2.5 bg-[var(--input-bg)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Class *</label>
                    <select 
                      value={markClass} 
                      onChange={e => {
                         setMarkClass(e.target.value);
                         setMarkSection(''); // reset section on class change
                      }} 
                      className="w-full px-4 py-2.5 bg-[var(--input-bg)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                      required
                    >
                      <option value="">Select...</option>
                      {uniqueClasses.map(cls => (
                        <option key={cls} value={cls}>
                          {cls.toLowerCase().startsWith('class') ? cls : `Class ${cls}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Section</label>
                    <select 
                      value={markSection} 
                      onChange={e => setMarkSection(e.target.value)} 
                      className="w-full px-4 py-2.5 bg-[var(--input-bg)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                      disabled={!markClass}
                    >
                      <option value="all">All Sections</option>
                      {Array.from(new Set([
                        'A', 'B', 'C', 'D', 'E', 'F',
                        ...assignedTimetableClasses
                          .filter(c => normalizeClass(c.className) === normalizeClass(markClass))
                          .map(c => c.section),
                        ...attendanceRecords
                          .filter(r => normalizeClass(r.student?.className) === normalizeClass(markClass))
                          .map(r => r.student?.section)
                      ].filter(Boolean))).sort().map(sec => (
                        <option key={sec} value={sec}>Section {sec}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Search Name</label>
                    <input 
                      type="text" 
                      placeholder="Optional..." 
                      value={markNameSearch} 
                      onChange={e => setMarkNameSearch(e.target.value)} 
                      className="w-full px-4 py-2.5 bg-[var(--input-bg)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                    />
                  </div>
                  <div>
                    <button 
                      onClick={fetchMarkStudents} 
                      disabled={loadingStudents}
                      className="w-full h-[42px] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                    >
                      {loadingStudents ? <FiLoader className="animate-spin" size={18} /> : <FiSearch size={18} />}
                      Load Students
                    </button>
                  </div>
                </div>
              </div>

              {/* Attendance Table */}
              {markStudents.length > 0 && (
                <div className="bg-[var(--card-bg)] rounded-2xl shadow-sm border border-[var(--border-color)] overflow-hidden animate-in fade-in duration-300">
                  {isAlreadySubmitted && (
                    <div className="bg-amber-500/10 border-b border-amber-500/30 p-4 px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">🔒</span>
                          <div>
                            <div className="font-extrabold text-amber-700 dark:text-amber-400 text-sm">
                              {markDate < todayStr ? '🔒 HISTORICAL ATTENDANCE RECORD (READ ONLY)' : '🔒 FINAL SUBMISSION LOCKED — Edits Disabled for Subject Teachers'}
                            </div>
                            <div className="text-xs text-amber-800/80 dark:text-amber-300/80 font-medium">
                              {markDate < todayStr 
                                ? `Past attendance records for Class ${markClass}-${markSection} on ${new Date(markDate).toLocaleDateString()} are locked. Only Manager, Teacher Admin, or Super Admin can edit.` 
                                : `Attendance for Class ${markClass}-${markSection} on ${markDate} has been final submitted. Subject teacher cannot edit once submitted.`}
                            </div>
                          </div>
                        </div>
                        <span className="bg-amber-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                          🔒 Read Only
                        </span>
                      </div>

                      {canAdminOverride && (
                        <div className="mt-3 pt-3 border-t border-amber-500/20 flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => {
                              const newMode = !adminOverrideActive;
                              setAdminOverrideActive(newMode);
                              setIsAlreadySubmitted(!newMode);
                            }}
                            className={`px-4 py-2 text-xs font-black rounded-xl flex items-center gap-2 transition-all shadow-sm ${
                              adminOverrideActive
                                ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-400'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                          >
                            {adminOverrideActive ? '🔓 Admin Override Mode: ACTIVE (Editing Enabled)' : '🔑 Manager / Admin: Unlock & Edit Attendance'}
                          </button>
                          {adminOverrideActive && (
                            <input
                              type="text"
                              placeholder="Enter mandatory Audit Remark / Reason for update (e.g. Approved by Principal)..."
                              value={auditRemarkInput}
                              onChange={e => setAuditRemarkInput(e.target.value)}
                              className="flex-1 min-w-[280px] px-3 py-1.5 text-xs border border-amber-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-800"
                              required
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
                    <div className="text-sm font-semibold text-slate-700">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md mr-2">{markStudents.length} Students</span> 
                      Found for <span className="font-bold">{markClass} - Section {markSection}</span> on <span className="font-bold">{new Date(markDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={markAllPresent} 
                        disabled={isAlreadySubmitted}
                        className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-sm rounded-xl border border-emerald-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        ✓ Mark All Present
                      </button>
                      <button 
                        onClick={markAllAbsent} 
                        disabled={isAlreadySubmitted}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-sm rounded-xl border border-rose-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        ✗ Mark All Absent
                      </button>
                      <button 
                        onClick={submitMarkAttendance} 
                        disabled={markSaving || isAlreadySubmitted}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-200 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {markSaving ? <FiLoader className="animate-spin" size={16} /> : (isAlreadySubmitted ? '🔒 Final Submitted & Locked' : <FiSave size={16} />)}
                        {markSaving ? 'Saving...' : (isAlreadySubmitted ? '' : 'Final Submit Attendance')}
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                          <th className="px-6 py-4 font-semibold border-b border-slate-100 w-32">Roll No</th>
                          <th className="px-6 py-4 font-semibold border-b border-slate-100">Student Name</th>
                          <th className="px-6 py-4 font-semibold border-b border-slate-100 text-center w-64">Attendance Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {markStudents.map((student) => (
                          <tr key={student._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">{student.rollNumber}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-bold text-slate-900 text-base">{student.user?.name}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{student.user?.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex justify-center bg-slate-100 p-1 rounded-xl w-fit mx-auto">
                                <button 
                                  onClick={() => !isAlreadySubmitted && handleMarkStatusChange(student._id, 'Present')}
                                  disabled={isAlreadySubmitted}
                                  className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                                    markAttendanceList[student._id] === 'Present' 
                                      ? 'bg-emerald-500 text-white shadow-md' 
                                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                                  } ${isAlreadySubmitted ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                  {markAttendanceList[student._id] === 'Present' && <FiCheck size={14} />}
                                  Present
                                </button>
                                <button 
                                  onClick={() => !isAlreadySubmitted && handleMarkStatusChange(student._id, 'Absent')}
                                  disabled={isAlreadySubmitted}
                                  className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                                    markAttendanceList[student._id] === 'Absent' 
                                      ? 'bg-rose-500 text-white shadow-md' 
                                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                                  } ${isAlreadySubmitted ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                  {markAttendanceList[student._id] === 'Absent' && <FiX size={14} />}
                                  Absent
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Added Submit Button at the Bottom */}
                  <div className="p-5 border-t border-slate-100 flex justify-end bg-slate-50/50">
                    <button 
                      onClick={submitMarkAttendance} 
                      disabled={markSaving || isAlreadySubmitted}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-200 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {markSaving ? <FiLoader className="animate-spin" size={16} /> : (isAlreadySubmitted ? '🔒 Final Submitted & Locked' : <FiSave size={16} />)}
                      {markSaving ? 'Saving...' : (isAlreadySubmitted ? '' : 'Final Submit Attendance')}
                    </button>
                  </div>
                </div>
              )}
              
              {!loadingStudents && markStudents.length === 0 && (markClass || markSection) && (
                <div className="text-center p-12 bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] border-dashed mt-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiSearch className="text-slate-300" size={24} />
                  </div>
                  <p className="text-slate-500 font-medium">Click "Load Students" to fetch the class list.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default TeacherAttendanceMark;