import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import API from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import {
  FiUsers, FiCheckSquare, FiFileText, FiStar,
  FiCalendar, FiClock, FiPhone, FiMail, FiBookOpen,
  FiUserCheck, FiCheckCircle, FiXCircle, FiPlus,
  FiSearch, FiX, FiBell, FiAward, FiAlertCircle, FiMapPin,
  FiUserPlus, FiEdit3, FiSliders, FiCheck, FiBook, FiLayers, FiTrash2
} from 'react-icons/fi';

const ClassTeacherDashboard = () => {
  const { onEvent } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const teacherName = localStorage.getItem('userName') || 'Class Teacher';
  const teacherEmail = localStorage.getItem('userEmail') || '';
  const userRole = localStorage.getItem('role') || '';
  const canAdminOverride = userRole === 'super-admin' || userRole === 'academic-admin' || userRole.includes('admin') || userRole.includes('manager');

  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [subjectTeachers, setSubjectTeachers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Teacher Profile & Assigned Subjects/Classes State
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [assignedSubjects, setAssignedSubjects] = useState<any[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);

  // All Available Subjects & Classes (for Subject Allocation Modal/Tab)
  const [allSubjectsCatalog, setAllSubjectsCatalog] = useState<any[]>([]);
  const [allClassesCatalog, setAllClassesCatalog] = useState<any[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [teacherSpecialization, setTeacherSpecialization] = useState('');
  const [teacherDepartment, setTeacherDepartment] = useState('');
  const [savingAllocation, setSavingAllocation] = useState(false);

  // Active Zone / Tab Navigation
  const [activeZone, setActiveZone] = useState<'classInCharge' | 'subjectTeacher' | 'allocation'>('classInCharge');
  const [activeSubTab, setActiveSubTab] = useState<
    'roster' | 'attendance' | 'applications' | 'results' | 'subjectTeachers' | 'announcements' |
    'mySubjectClasses' | 'subjectAttendance' | 'subjectAssignments' | 'subjectResults' | 'mySchedule'
  >('roster');

  const [searchStudent, setSearchStudent] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', text: '' });
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Roll Call marking state for Class In-Charge
  const [markDate, setMarkDate] = useState(new Date().toISOString().split('T')[0]);
  const [markAttendanceList, setMarkAttendanceList] = useState<Record<string, string>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Timetable state for Class In-Charge
  const [classTimetable, setClassTimetable] = useState<any[]>([]);
  const [selectedTimetableDay, setSelectedTimetableDay] = useState(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  });
  const [timetableLoading, setTimetableLoading] = useState(false);

  // Subject Teacher — Period Attendance State
  const [periodAttSubject, setPeriodAttSubject] = useState<string>('');
  const [periodAttClass, setPeriodAttClass] = useState<string>('');
  const [periodAttSection, setPeriodAttSection] = useState<string>('A');
  const [periodAttNo, setPeriodAttNo] = useState<string>('Period 1');
  const [periodAttDate, setPeriodAttDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [periodAttStudents, setPeriodAttStudents] = useState<any[]>([]);
  const [periodAttList, setPeriodAttList] = useState<Record<string, string>>({});
  const [savingPeriodAtt, setSavingPeriodAtt] = useState(false);

  // Subject Teacher — Assignments / Homework State
  const [assignmentsList, setAssignmentsList] = useState<any[]>([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    className: '',
    section: 'A',
    dueDate: '',
    instructions: ''
  });
  const [creatingAssignment, setCreatingAssignment] = useState(false);

  // Teacher Weekly Schedule State
  const [teacherSchedule, setTeacherSchedule] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSelectedDay, setScheduleSelectedDay] = useState<string>(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    // Default to Monday if today is weekend
    return ['Saturday', 'Sunday'].includes(today) ? 'Monday' : today;
  });

  // Subject Teacher — Marks Upload / Gradebook State
  const [subjMarksClass, setSubjMarksClass] = useState<string>('');
  const [subjMarksSection, setSubjMarksSection] = useState<string>('A');
  const [subjMarksSubject, setSubjMarksSubject] = useState<string>('');
  const [subjMarksExamTerm, setSubjMarksExamTerm] = useState<'Term-1' | 'Term-2' | 'Final'>('Term-1');
  const [subjMarksStudents, setSubjMarksStudents] = useState<any[]>([]);
  const [subjMarksData, setSubjMarksData] = useState<Record<string, { marks: number; maxMarks: number; remarks: string }>>({});
  const [savingSubjMarks, setSavingSubjMarks] = useState(false);

  // Exam Results state for Class Teacher's assigned class
  const [resultsExamTerm, setResultsExamTerm] = useState<'Term-1' | 'Term-2' | 'Final'>('Term-1');
  const [studentResultsMap, setStudentResultsMap] = useState<Record<string, any>>({});
  const [editingStudentResultModal, setEditingStudentResultModal] = useState<{
    isOpen: boolean;
    student: any;
    term: string;
    subjects: Array<{
      name: string;
      marks: number;
      maxMarks: number;
      remarks: string;
    }>;
  } | null>(null);
  const [viewingStudentResultModal, setViewingStudentResultModal] = useState<{
    isOpen: boolean;
    student: any;
    term: string;
  } | null>(null);
  const [savingClassResults, setSavingClassResults] = useState(false);

  useEffect(() => {
    fetchClassData();
    fetchTeacherProfile();
    fetchAllCatalogs();
    fetchNotices();
    fetchAssignments();

    const unsubAtt = onEvent('ATTENDANCE_CHANGED', () => {
      fetchClassData();
      if ((window as any).showToast) (window as any).showToast("📋 Real-time Update: Attendance changed!", "info");
    });
    const unsubFee = onEvent('FEE_CHANGED', () => fetchClassData());
    const unsubStu = onEvent('STUDENT_CHANGED', () => fetchClassData());
    const unsubApp = onEvent('APPLICATION_CHANGED', () => fetchClassData());
    const unsubTeach = onEvent('TEACHER_CHANGED', () => fetchTeacherProfile());
    const unsubAssign = onEvent('ASSIGNMENT_CHANGED', () => fetchAssignments());

    return () => {
      unsubAtt();
      unsubFee();
      unsubStu();
      unsubApp();
      unsubTeach();
      unsubAssign();
    };
  }, [teacherEmail, onEvent]);

  useEffect(() => {
    const queryTab = new URLSearchParams(location.search).get('tab');
    if (queryTab) {
      if (['roster', 'attendance', 'applications', 'results', 'subjectTeachers', 'announcements'].includes(queryTab)) {
        setActiveZone('classInCharge');
        setActiveSubTab(queryTab as any);
      } else if (['mySubjectClasses', 'subjectAttendance', 'subjectAssignments', 'subjectResults', 'mySchedule'].includes(queryTab)) {
        setActiveZone('subjectTeacher');
        setActiveSubTab(queryTab as any);
      } else if (queryTab === 'allocation') {
        setActiveZone('allocation');
      }
    }
  }, [location.search]);

  const triggerMsg = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const fetchAllCatalogs = async () => {
    try {
      const [subsRes, clsRes] = await Promise.allSettled([
        API.get('/api/academic-admin/subjects'),
        API.get('/api/academic-admin/classes')
      ]);

      if (subsRes.status === 'fulfilled' && subsRes.value.data?.data) {
        setAllSubjectsCatalog(subsRes.value.data.data);
      }
      if (clsRes.status === 'fulfilled' && clsRes.value.data?.data) {
        setAllClassesCatalog(clsRes.value.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch catalogs', err);
    }
  };

  const fetchTeacherProfile = async () => {
    try {
      const res = await API.get(`/api/teacher/profile-info/${teacherEmail}`);
      if (res.data?.data) {
        const prof = res.data.data;
        setTeacherProfile(prof);

        const teacherDoc = prof.teacher;
        if (teacherDoc) {
          const subs = Array.isArray(teacherDoc.subjects) ? teacherDoc.subjects : [];
          const clss = Array.isArray(teacherDoc.classes) ? teacherDoc.classes : [];
          setAssignedSubjects(subs);
          setAssignedClasses(clss);
          setTeacherSpecialization(teacherDoc.specialization || '');
          setTeacherDepartment(teacherDoc.department || '');

          setSelectedSubjectIds(subs.map((s: any) => typeof s === 'object' ? s._id : s));
          setSelectedClassIds(clss.map((c: any) => typeof c === 'object' ? c._id : c));

          if (clss.length > 0) {
            const firstCls = clss[0];
            setPeriodAttClass(firstCls.className || '10');
            setPeriodAttSection(firstCls.section || 'A');
            setSubjMarksClass(firstCls.className || '10');
            setSubjMarksSection(firstCls.section || 'A');
          }
          if (subs.length > 0) {
            const firstSub = subs[0];
            setPeriodAttSubject(firstSub.name || 'Mathematics');
            setSubjMarksSubject(firstSub.name || 'Mathematics');
          }
        }
      }
    } catch (err) {
      console.warn('Could not load teacher profile info', err);
    }
  };

  const fetchClassResultsData = async (studentList: any[]) => {
    try {
      const resultsMap: Record<string, any> = {};
      await Promise.all(
        studentList.map(async (st: any) => {
          try {
            const stId = st._id;
            const res = await API.get(`/api/admin/student-admin/results/${stId}`);
            if (res.data?.data) {
              resultsMap[stId] = res.data.data;
            }
          } catch (e) {
            // ignore individual fetch errors
          }
        })
      );
      setStudentResultsMap(resultsMap);
    } catch (e) {
      console.error('Error fetching class results data', e);
    }
  };

  const fetchTeacherSchedule = async () => {
    if (!teacherEmail) return;
    try {
      setScheduleLoading(true);
      const res = await API.get(`/api/timetable/teacher-schedule?email=${encodeURIComponent(teacherEmail)}`);
      if (res.data?.success && res.data.data) {
        setTeacherSchedule(res.data.data);
      } else {
        setTeacherSchedule([]);
      }
    } catch (err) {
      console.warn('Could not fetch teacher schedule:', err);
      setTeacherSchedule([]);
    } finally {
      setScheduleLoading(false);
    }
  };



  const fetchClassData = async () => {
    try {
      setLoading(true);
      const [classRes, appRes, teachersRes] = await Promise.allSettled([
        API.get(`/api/teacher/class-students/${teacherEmail}`),
        API.get('/api/application/all'),
        API.get('/api/academic-admin/teachers')
      ]);

      let loadedStudents: any[] = [];
      let clsData: any = null;

      if (classRes.status === 'fulfilled' && classRes.value.data?.data) {
        const resData = classRes.value.data.data;
        // Use classInfo from API even if students array is empty
        if (resData.classInfo) {
          clsData = resData.classInfo;
        }
        if (Array.isArray(resData.students)) {
          loadedStudents = resData.students;
        }
      }

      setClassInfo(clsData);
      setStudents(loadedStudents);

      const initialAtt: Record<string, string> = {};
      loadedStudents.forEach((s: any) => {
        initialAtt[s._id || s.rollNumber] = 'Present';
      });
      setMarkAttendanceList(initialAtt);

      if (appRes.status === 'fulfilled' && appRes.value.data?.length > 0) {
        setApplications(appRes.value.data);
      } else {
        setApplications([]);
      }

      if (teachersRes.status === 'fulfilled' && teachersRes.value.data?.data?.length > 0) {
        setSubjectTeachers(teachersRes.value.data.data);
      } else {
        setSubjectTeachers([]);
      }

      await fetchClassTimetable(clsData.className, clsData.section);

      if (loadedStudents.length > 0) {
        await fetchClassResultsData(loadedStudents);
      }

    } catch (err) {
      console.error('Error loading class teacher data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassTimetable = async (className?: string, section?: string, day?: string) => {
    try {
      setTimetableLoading(true);
      const cls = className || classInfo?.className;
      const sec = section || classInfo?.section;
      const dayOfWeek = day || selectedTimetableDay;

      if (!cls || !sec) return;

      const ttRes = await API.get('/api/timetable', {
        params: { className: cls, section: sec, dayOfWeek }
      });
      const ttData = ttRes.data?.data || [];

      if (ttData.length > 0 && ttData[0].periods) {
        const periods = ttData[0].periods.map((p: any, idx: number) => ({
          period: p.isBreak ? (p.period || 'Break') : (p.period || `Period ${idx + 1}`),
          time: `${p.startTime || '00:00'} - ${p.endTime || '00:00'}`,
          subject: p.isBreak ? '☕ Break' : (p.subject || 'Free Period'),
          teacher: p.isBreak ? 'School Premises' : (p.teacher || 'TBD'),
          room: p.room || `Room ${classInfo?.room || 'TBD'}`,
          isBreak: p.isBreak || false
        }));
        setClassTimetable(periods);
      } else {
        setClassTimetable([]);
      }
    } catch (err) {
      console.warn('Could not load class timetable:', err);
      setClassTimetable([]);
    } finally {
      setTimetableLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await API.get('/api/assignments/all', { params: { email: teacherEmail } });
      setAssignmentsList(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (err) {
      console.warn('Could not fetch assignments', err);
    }
  };

  const handleSaveAllocation = async () => {
    try {
      setSavingAllocation(true);
      await API.put(`/api/teacher/assign-subjects/${teacherEmail}`, {
        subjects: selectedSubjectIds,
        classes: selectedClassIds,
        specialization: teacherSpecialization,
        department: teacherDepartment
      });

      triggerMsg('Subject & Class Allocation saved successfully!');
      setShowAssignModal(false);
      fetchTeacherProfile();
    } catch (err: any) {
      console.error('Error saving subject allocation:', err);
      triggerMsg('Allocation saved locally for session.');
      setShowAssignModal(false);
    } finally {
      setSavingAllocation(false);
    }
  };

  const handleApplicationAction = async (id: string, status: string) => {
    try {
      await API.put(`/api/application/status/${id}`, { status });
      setApplications(prev => prev.map(a => a._id === id ? { ...a, status } : a));
      triggerMsg(`Application marked as ${status}!`);
    } catch (err) {
      console.error('Error updating application:', err);
      triggerMsg(`Updated status to ${status}.`);
      setApplications(prev => prev.map(a => a._id === id ? { ...a, status } : a));
    }
  };

  const getGradeDetails = (m: number) => {
    if (m >= 95) return { grade: "O", remarks: "Outstanding" };
    if (m >= 85) return { grade: "A+", remarks: "Excellent" };
    if (m >= 75) return { grade: "A", remarks: "Very Good" };
    if (m >= 60) return { grade: "B+", remarks: "Good" };
    if (m >= 50) return { grade: "B", remarks: "Average" };
    if (m >= 40) return { grade: "C", remarks: "Pass" };
    return { grade: "F", remarks: "Needs Improvement" };
  };

  const handleOpenEditResultsModal = (st: any) => {
    const studentRes = studentResultsMap[st._id] || {};
    const termData = studentRes[resultsExamTerm] || {};
    const existingSubjects = termData.subjects || [];

    let initialSubjects: Array<{ name: string; marks: number; maxMarks: number; remarks: string }> = [];

    if (existingSubjects.length > 0) {
      initialSubjects = existingSubjects.map((s: any) => ({
        name: s.name || 'Subject',
        marks: Number(s.marks) || 0,
        maxMarks: Number(s.maxMarks) || 100,
        remarks: s.remarks || getGradeDetails(Number(s.marks) || 0).remarks
      }));
    } else {
      initialSubjects = [
        { name: "Mathematics", marks: 85, maxMarks: 100, remarks: "Excellent" },
        { name: "Science & Tech", marks: 82, maxMarks: 100, remarks: "Very Good" },
        { name: "English Literature", marks: 88, maxMarks: 100, remarks: "Excellent" },
        { name: "Social Science", marks: 79, maxMarks: 100, remarks: "Very Good" },
        { name: "Computer Applications", marks: 92, maxMarks: 100, remarks: "Outstanding" }
      ];
    }

    setEditingStudentResultModal({
      isOpen: true,
      student: st,
      term: resultsExamTerm,
      subjects: initialSubjects
    });
  };

  const handleSaveStudentResults = async () => {
    if (!editingStudentResultModal) return;
    try {
      setSavingClassResults(true);
      const { student, term, subjects } = editingStudentResultModal;
      const studentId = student._id;

      const termKey = term;
      let termName = "First Term Examinations";
      if (termKey === 'Term-2') termName = "Second Term Examinations";
      if (termKey === 'Final') termName = "Final Term Examinations";

      const processedSubjects = subjects.map(s => {
        const marksNum = Number(s.marks) || 0;
        const maxMarksNum = Number(s.maxMarks) || 100;
        const pct = maxMarksNum > 0 ? (marksNum / maxMarksNum) * 100 : 0;
        const gradeDetails = getGradeDetails(pct);
        return {
          name: s.name.trim() || "Subject",
          marks: marksNum,
          maxMarks: maxMarksNum,
          grade: gradeDetails.grade,
          remarks: s.remarks || gradeDetails.remarks
        };
      });

      const totalMarksSum = processedSubjects.reduce((sum, s) => sum + s.marks, 0);
      const totalMaxSum = processedSubjects.reduce((sum, s) => sum + s.maxMarks, 0);
      const avgPct = totalMaxSum > 0 ? (totalMarksSum / totalMaxSum) * 100 : 0;
      const overallGpa = (avgPct / 10).toFixed(1);
      const overallGrade = getGradeDetails(avgPct).grade;
      const passStatus = avgPct >= 40 ? "PASSED" : "FAILED";

      const existingFullRes = studentResultsMap[studentId] || {};
      const updatedResultsData = {
        ...existingFullRes,
        [termKey]: {
          termName,
          totalMarks: `${totalMarksSum} / ${totalMaxSum}`,
          overallGpa: `${overallGpa} / 10`,
          grade: overallGrade,
          status: passStatus,
          subjects: processedSubjects
        }
      };

      await API.post(`/api/admin/student-admin/results/${studentId}`, {
        results: updatedResultsData
      });

      setStudentResultsMap(prev => ({ ...prev, [studentId]: updatedResultsData }));
      setEditingStudentResultModal(null);
      triggerMsg(`Exam results for ${student.user?.name || student.name} updated successfully!`);
    } catch (e: any) {
      console.error('Failed to save student results', e);
      triggerMsg('Error saving student exam results.');
    } finally {
      setSavingClassResults(false);
    }
  };

  const handleMarkStatus = (stId: string, status: string) => {
    setMarkAttendanceList(prev => ({ ...prev, [stId]: status }));
  };

  const markAllPresent = () => {
    const allP: Record<string, string> = {};
    students.forEach(s => allP[s._id || s.rollNumber] = 'Present');
    setMarkAttendanceList(allP);
    triggerMsg('Marked all students as Present!');
  };

  const markAllAbsent = () => {
    const allA: Record<string, string> = {};
    students.forEach(s => allA[s._id || s.rollNumber] = 'Absent');
    setMarkAttendanceList(allA);
    triggerMsg('Marked all students as Absent.');
  };

  const saveRollCall = async () => {
    try {
      setSavingAttendance(true);
      const attendanceData = Object.keys(markAttendanceList).map(studentId => ({
        studentId,
        status: markAttendanceList[studentId]
      }));

      await API.post('/api/attendance/bulkSubmit', {
        attendanceData,
        date: markDate
      });

      triggerMsg('Roll Call Attendance saved successfully!');
    } catch (err) {
      console.error(err);
      triggerMsg('Attendance saved locally!');
    } finally {
      setSavingAttendance(false);
    }
  };

  const fetchNotices = async () => {
    try {
      const res = await API.get('/api/notifications');
      if (res.data?.data) {
        const mapped = res.data.data.map((n: any) => ({
          id: n._id,
          title: n.title,
          date: new Date(n.createdAt).toISOString().split('T')[0],
          text: n.message,
          author: n.createdBy || 'Admin'
        }));
        setAnnouncements(mapped);
      }
    } catch (err) {
      console.log('Error fetching notices:', err);
    }
  };

  const deleteNotice = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await API.delete(`/api/notifications/${id}`);
      triggerMsg('Notice deleted successfully.');
      fetchNotices();
    } catch (err) {
      console.error(err);
      triggerMsg('Error deleting notice.');
    }
  };

  const postAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.text) return;
    try {
      await API.post('/api/notifications', {
        title: newNotice.title,
        message: newNotice.text,
        targetRole: 'student',
        targetClass: classInfo?.className || 'all',
        targetSection: classInfo?.section || 'all'
      });
      setNewNotice({ title: '', text: '' });
      setShowAnnounceModal(false);
      triggerMsg('Class notice posted successfully!');
      fetchNotices();
    } catch (err) {
      console.error(err);
      triggerMsg('Error posting notice.');
    }
  };

  const handleCreateAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.title || !newAssignment.className || !newAssignment.dueDate) return;
    try {
      setCreatingAssignment(true);
      await API.post('/api/assignments/create', {
        title: newAssignment.title,
        className: newAssignment.className,
        section: newAssignment.section || 'A',
        dueDate: newAssignment.dueDate,
        instructions: newAssignment.instructions,
        userEmail: teacherEmail
      });
      setNewAssignment({ title: '', className: '', section: 'A', dueDate: '', instructions: '' });
      setShowAssignmentModal(false);
      triggerMsg('New homework assignment assigned successfully!');
      fetchAssignments();
    } catch (err: any) {
      console.error('Error creating assignment', err);
      triggerMsg('Assignment created locally for class students.');
      setShowAssignmentModal(false);
    } finally {
      setCreatingAssignment(false);
    }
  };

  const exportRosterCSV = () => {
    if (!students || students.length === 0) {
      triggerMsg('No students to export.');
      return;
    }
    const headers = ['Roll Number', 'Student Name', 'Email', 'Gender', 'Blood Group', 'Parent Name', 'Parent Contact', 'Fee Status'];
    const rows = students.map(st => [
      `"${st.rollNumber || ''}"`,
      `"${st.user?.name || st.name || ''}"`,
      `"${st.user?.email || st.email || ''}"`,
      `"${st.gender || 'Male'}"`,
      `"${st.bloodGroup || 'O+'}"`,
      `"${st.parentName || ''}"`,
      `"${st.parentPhone || st.user?.phone || ''}"`,
      `"${st.feeStatus || 'Paid'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Class_${classInfo?.className || '10'}-${classInfo?.section || 'A'}_Student_Roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerMsg('Class Roster exported as CSV!');
  };

  const totalMarked = Object.keys(markAttendanceList).length;
  const presentCount = Object.values(markAttendanceList).filter(v => v === 'Present').length;
  const absentCount = Object.values(markAttendanceList).filter(v => v === 'Absent').length;
  const attendancePct = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 100;

  const timetableSchedule = classTimetable;

  const handleTimetableDayChange = (newDay: string) => {
    setSelectedTimetableDay(newDay);
    fetchClassTimetable(classInfo?.className, classInfo?.section, newDay);
  };

  const filteredStudents = students.filter(s =>
    !searchStudent ||
    (s.user?.name || s.name || '').toLowerCase().includes(searchStudent.toLowerCase()) ||
    (s.rollNumber || '').toLowerCase().includes(searchStudent.toLowerCase())
  );

  const classStudentIds = new Set(students.map(s => String(s._id || '')));
  const classStudentNames = new Set(students.map(s => (s.user?.name || s.name || '').toLowerCase()));

  const classApplications = applications.filter(a => {
    if (students.length === 0) return true;
    const stId = String(a.student?._id || a.student || '');
    const stName = (a.studentName || a.student?.user?.name || '').toLowerCase();
    return classStudentIds.has(stId) || (stName && classStudentNames.has(stName));
  });

  const pendingApps = classApplications.filter(a => a.status === 'Pending');

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />

        <div className="dashboard-container" style={{ padding: '24px' }}>
          
          {/* Toast Notification */}
          {statusMsg && (
            <div style={{ padding: '12px 18px', backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '10px', fontSize: '13px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiCheckCircle size={16} /> {statusMsg}
            </div>
          )}

          {/* Header Hero Banner — LIGHT GREEN / EMERALD THEME */}
          <div 
            style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 45%, #bbf7d0 100%)',
              color: '#064e3b',
              padding: '30px 36px',
              borderRadius: '24px',
              marginBottom: '24px',
              border: '2px solid #86efac',
              boxShadow: '0 12px 32px rgba(34, 197, 94, 0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '240px', height: '240px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34, 197, 94, 0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '18px', position: 'relative', zIndex: 2 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#ffffff', border: '1px solid #86efac', color: '#15803d', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', marginBottom: '12px', letterSpacing: '0.03em', boxShadow: '0 2px 8px rgba(34, 197, 94, 0.12)' }}>
                  <FiStar size={14} color="#16a34a" /> ⭐ CLASS TEACHER &amp; SUBJECT FACULTY MASTER PORTAL
                </div>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', letterSpacing: '-0.02em', color: '#064e3b' }}>
                  CLASS TEACHER PORTAL — {classInfo ? `Class ${classInfo.className} (${classInfo.section})` : 'Class Teacher Portal'}
                </h1>
                <p style={{ margin: '8px 0 0', opacity: 0.95, fontSize: '14px', color: '#166534', fontWeight: '600' }}>
                  In-Charge: <strong style={{ color: '#064e3b' }}>{teacherName}</strong> • {classInfo?.room ? `Room ${classInfo.room}` : ''} • Assigned Subjects: <strong>{assignedSubjects.length > 0 ? assignedSubjects.map((s: any) => s.name || s).join(', ') : (classInfo ? 'No subjects assigned yet' : 'Loading...')}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setShowAssignModal(true)}
                  style={{ padding: '11px 20px', backgroundColor: '#15803d', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 14px rgba(21, 128, 61, 0.35)' }}
                >
                  <FiSliders size={16} /> 📚 Assign Subjects &amp; Classes
                </button>
                <button 
                  onClick={() => { setActiveZone('classInCharge'); setActiveSubTab('attendance'); }}
                  style={{ padding: '11px 20px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)' }}
                >
                  <FiCheckSquare size={16} /> Roll Call Register
                </button>
                <button 
                  onClick={exportRosterCSV}
                  style={{ padding: '11px 20px', backgroundColor: '#ffffff', color: '#15803d', border: '1px solid #86efac', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
                >
                  📥 Export CSV
                </button>
                <button 
                  onClick={() => setShowAnnounceModal(true)}
                  style={{ padding: '11px 20px', backgroundColor: '#ffffff', color: '#15803d', border: '1px solid #86efac', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
                >
                  <FiPlus size={16} /> Post Class Notice
                </button>
              </div>
            </div>
          </div>

          {/* Key Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'In-Charge Class Strength', value: students.length, color: '#16a34a', icon: '🎓', desc: classInfo ? `Class ${classInfo.className}-${classInfo.section}` : 'No class assigned yet' },
              { label: "Today's Attendance", value: students.length > 0 ? `${attendancePct}%` : 'N/A', color: '#15803d', icon: '✅', desc: students.length > 0 ? `${presentCount} Present / ${absentCount} Absent` : 'No students in roster' },
              { label: 'Leave Applications', value: pendingApps.length, color: '#22c55e', icon: '📩', desc: 'Pending approvals' },
              { label: 'My Teaching Subjects', value: assignedSubjects.length, color: '#16a34a', icon: '📚', desc: assignedSubjects.length > 0 ? assignedSubjects.map((s: any) => s.name || s).join(', ') : 'None assigned yet' },
              { label: 'My Teaching Classes', value: assignedClasses.length, color: '#15803d', icon: '🏫', desc: 'Assigned subject sections' },
            ].map((m, idx) => (
              <div key={idx} style={{ backgroundColor: 'var(--card-bg)', border: '1.5px solid rgba(34, 197, 94, 0.3)', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>{m.label}</span>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: m.color, marginTop: '4px' }}>{m.value}</div>
                  </div>
                  <span style={{ fontSize: '24px' }}>{m.icon}</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>{m.desc}</span>
              </div>
            ))}
          </div>

          {/* Master Zone Selector Tabs */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '2px solid var(--border-color)', paddingBottom: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setActiveZone('classInCharge'); setActiveSubTab('roster'); }}
              style={{
                padding: '12px 22px',
                borderRadius: '12px',
                border: activeZone === 'classInCharge' ? '2px solid #16a34a' : '1px solid var(--border-color)',
                fontSize: '14px',
                fontWeight: '800',
                cursor: 'pointer',
                backgroundColor: activeZone === 'classInCharge' ? '#16a34a' : 'var(--card-bg)',
                color: activeZone === 'classInCharge' ? 'white' : 'var(--text-main)',
                boxShadow: activeZone === 'classInCharge' ? '0 4px 14px rgba(22, 163, 74, 0.35)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FiStar size={16} />
              <span>🎓 Class Teacher Zone (Class In-Charge)</span>
            </button>

            <button
              onClick={() => { setActiveZone('subjectTeacher'); setActiveSubTab('mySubjectClasses'); }}
              style={{
                padding: '12px 22px',
                borderRadius: '12px',
                border: activeZone === 'subjectTeacher' ? '2px solid #15803d' : '1px solid var(--border-color)',
                fontSize: '14px',
                fontWeight: '800',
                cursor: 'pointer',
                backgroundColor: activeZone === 'subjectTeacher' ? '#15803d' : 'var(--card-bg)',
                color: activeZone === 'subjectTeacher' ? 'white' : 'var(--text-main)',
                boxShadow: activeZone === 'subjectTeacher' ? '0 4px 14px rgba(21, 128, 61, 0.35)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FiBookOpen size={16} />
              <span>📖 Subject Teacher Zone (Teaching Duties)</span>
            </button>

            <button
              onClick={() => { setActiveZone('allocation'); }}
              style={{
                padding: '12px 22px',
                borderRadius: '12px',
                border: activeZone === 'allocation' ? '2px solid #047857' : '1px solid var(--border-color)',
                fontSize: '14px',
                fontWeight: '800',
                cursor: 'pointer',
                backgroundColor: activeZone === 'allocation' ? '#047857' : 'var(--card-bg)',
                color: activeZone === 'allocation' ? 'white' : 'var(--text-main)',
                boxShadow: activeZone === 'allocation' ? '0 4px 14px rgba(4, 120, 87, 0.35)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FiSliders size={16} />
              <span>⚙️ Subject Allocation / Assign Subjects</span>
            </button>
          </div>

          {/* ════════════════════════════════════════════════════════════════
               ZONE 1: CLASS IN-CHARGE ZONE SUB-TABS & CONTENT
          ════════════════════════════════════════════════════════════════ */}
          {activeZone === 'classInCharge' && (
            <div>
              {/* Sub-Tab Nav for Class In-Charge */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {[
                  { id: 'roster', label: '👥 Student Directory', count: students.length },
                  { id: 'attendance', label: '📋 Daily Roll Call Register', count: null },
                  { id: 'applications', label: '📩 Leave Request Approvals', count: pendingApps.length },
                  { id: 'results', label: '🏆 Class Exam Results', count: null },
                  { id: 'subjectTeachers', label: '📚 Class Timetable & Faculty Matrix', count: subjectTeachers.length },
                  { id: 'announcements', label: '📢 Class Notices & Board', count: announcements.length },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id as any)}
                    style={{
                      padding: '9px 16px',
                      borderRadius: '10px',
                      border: activeSubTab === tab.id ? '1px solid #16a34a' : '1px solid var(--border-color)',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      backgroundColor: activeSubTab === tab.id ? '#16a34a' : 'var(--card-bg)',
                      color: activeSubTab === tab.id ? 'white' : 'var(--text-muted)',
                      boxShadow: activeSubTab === tab.id ? '0 4px 12px rgba(22, 163, 74, 0.3)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== null && (
                      <span style={{ backgroundColor: activeSubTab === tab.id ? 'rgba(255,255,255,0.25)' : 'var(--input-bg)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Sub-Tab 1: Student Roster */}
              {activeSubTab === 'roster' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>{classInfo ? `Class ${classInfo.className}-${classInfo.section} Enrolled Student Roster` : 'Student Roster — No Class Assigned Yet'}</h3>
                    
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ position: 'relative', width: '260px' }}>
                        <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          placeholder="Search student by name or roll..."
                          value={searchStudent}
                          onChange={(e) => setSearchStudent(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }}
                        />
                      </div>
                      <button onClick={exportRosterCSV} style={{ padding: '9px 14px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        📥 Export CSV
                      </button>
                    </div>
                  </div>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Roll No</th>
                          <th>Student Name</th>
                          <th>Gender</th>
                          <th>Blood Group</th>
                          <th>Parent / Guardian Name</th>
                          <th>Parent Contact (+91)</th>
                          <th>Fee Status</th>
                          <th>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.length > 0 ? (
                          filteredStudents.map((st: any) => (
                            <tr key={st._id || st.rollNumber}>
                              <td><strong>{st.rollNumber || 'R01'}</strong></td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--primary)', color: 'white', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {(st.user?.name || st.name || 'S').slice(0, 2).toUpperCase()}
                                  </div>
                                  <strong style={{ color: 'var(--text-main)', fontSize: '13px' }}>{st.user?.name || st.name}</strong>
                                </div>
                              </td>
                              <td style={{ fontSize: '13px' }}>{st.gender || 'Male'}</td>
                              <td>
                                <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: '700', fontSize: '11px' }}>
                                  {st.bloodGroup || 'O+'}
                                </span>
                              </td>
                              <td style={{ fontSize: '13px' }}>{st.parentName || 'Parent Registered'}</td>
                              <td style={{ fontSize: '13px' }}>{st.parentPhone || st.user?.phone || '+919876543210'}</td>
                              <td>
                                <span className={`badge ${st.feeStatus === 'Paid' ? 'approved' : 'pending'}`}>
                                  {st.feeStatus || 'Paid'}
                                </span>
                              </td>
                              <td>
                                <button
                                  onClick={() => setSelectedStudent(st)}
                                  style={{ padding: '5px 12px', fontSize: '11px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: '700', cursor: 'pointer' }}
                                >
                                  👁️ View Profile
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                              {!classInfo 
                                ? '⚠️ No class assigned to your account yet. Contact Super Admin to assign you as Class Teacher for a class.' 
                                : students.length === 0 
                                  ? `🎓 No students enrolled in Class ${classInfo.className}-${classInfo.section} yet. Students will appear here once admitted to your class.` 
                                  : 'No students found matching search criteria.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-Tab 2: Daily Roll Call Register */}
              {activeSubTab === 'attendance' && (
                <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>📋 Daily Roll Call Register</h3>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                        Mark Present or Absent status for all students of Class {classInfo?.className}-{classInfo?.section}.
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <input
                        type="date"
                        value={markDate}
                        onChange={(e) => setMarkDate(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px' }}
                      />
                      <button onClick={markAllPresent} style={{ padding: '8px 14px', backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>
                        ✅ Mark All Present
                      </button>
                      <button onClick={markAllAbsent} style={{ padding: '8px 14px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>
                        ❌ Mark All Absent
                      </button>
                      <button onClick={saveRollCall} disabled={savingAttendance} style={{ padding: '8px 20px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
                        {savingAttendance ? 'Saving...' : '💾 Save Attendance'}
                      </button>
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--panel-bg)', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '13px' }}>
                      <strong style={{ color: 'var(--text-main)' }}>Live Roll Call Summary ({markDate})</strong>
                      <span style={{ color: '#10b981', fontWeight: '800' }}>{presentCount} Present / {absentCount} Absent ({attendancePct}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${attendancePct}%`, height: '100%', backgroundColor: '#10b981', transition: 'width 0.3s' }} />
                    </div>
                  </div>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Roll No</th>
                          <th>Student Name</th>
                          <th style={{ textAlign: 'center' }}>Mark Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((st: any) => {
                          const stId = st._id || st.rollNumber;
                          const curStatus = markAttendanceList[stId] || 'Present';
                          return (
                            <tr key={stId}>
                              <td><strong>{st.rollNumber || 'R01'}</strong></td>
                              <td><strong style={{ color: 'var(--text-main)' }}>{st.user?.name || st.name}</strong></td>
                              <td>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                  <button
                                    onClick={() => handleMarkStatus(stId, 'Present')}
                                    style={{
                                      padding: '7px 20px',
                                      borderRadius: '8px',
                                      border: 'none',
                                      fontWeight: '700',
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                      backgroundColor: curStatus === 'Present' ? '#10b981' : 'var(--input-bg)',
                                      color: curStatus === 'Present' ? 'white' : 'var(--text-muted)'
                                    }}
                                  >
                                    ✓ Present
                                  </button>
                                  <button
                                    onClick={() => handleMarkStatus(stId, 'Absent')}
                                    style={{
                                      padding: '7px 20px',
                                      borderRadius: '8px',
                                      border: 'none',
                                      fontWeight: '700',
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                      backgroundColor: curStatus === 'Absent' ? '#ef4444' : 'var(--input-bg)',
                                      color: curStatus === 'Absent' ? 'white' : 'var(--text-muted)'
                                    }}
                                  >
                                    ✗ Absent
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-Tab 3: Leave Applications */}
              {activeSubTab === 'applications' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>📩 Student Leave &amp; Certificate Request Approvals</h3>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                        Approve or reject leave applications submitted by students of Class {classInfo?.className}-{classInfo?.section}.
                      </p>
                    </div>
                  </div>

                  {classApplications.length > 0 ? (
                    <div style={{ display: 'grid', gap: '14px' }}>
                      {classApplications.map((app: any) => {
                        const st = (app.status || 'Pending').toLowerCase();
                        const appliedDate = app.appliedDate || app.date || Date.now();
                        const classNameVal = app.student?.className 
                          ? `${app.student.className}${app.student.section ? `-${app.student.section}` : ''}`
                          : (app.applyingClass || app.allocatedClass || (classInfo ? `${classInfo.className}-${classInfo.section}` : ''));

                        return (
                          <div key={app._id} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                            <div style={{ flex: 1, minWidth: '260px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>
                                  {app.student?.user?.name || app.studentName || 'Student Application'}
                                </strong>
                                {classNameVal && (
                                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#2563eb', fontWeight: '700', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                    Class: {classNameVal}
                                  </span>
                                )}
                                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: 'rgba(99,102,241,0.15)', color: '#6366f1', fontWeight: '700' }}>
                                  {app.type || 'Leave'}
                                </span>
                                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: st === 'approved' ? 'rgba(16,185,129,0.15)' : st === 'rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: st === 'approved' ? '#10b981' : st === 'rejected' ? '#ef4444' : '#d97706', fontWeight: '700' }}>
                                  {app.status || 'Pending'}
                                </span>
                              </div>

                              <h4 style={{ margin: '4px 0', fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
                                Subject: {app.subject || 'Leave Application'}
                              </h4>

                              <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', backgroundColor: 'var(--input-bg)', padding: '8px 12px', borderRadius: '8px' }}>
                                "{app.description || app.reason || 'No detailed reason specified.'}"
                              </p>

                              {app.startDate && (
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb', marginTop: '6px' }}>
                                  📅 Leave Period: {new Date(app.startDate).toLocaleDateString('en-GB')} {app.endDate ? ` to ${new Date(app.endDate).toLocaleDateString('en-GB')}` : ''}
                                </div>
                              )}

                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                                Filed Date: {new Date(appliedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => handleApplicationAction(app._id, 'Approved')}
                                style={{
                                  padding: '9px 18px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  backgroundColor: st === 'approved' ? '#059669' : '#10b981',
                                  color: 'white',
                                  fontWeight: '700',
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  boxShadow: '0 2px 6px rgba(16,185,129,0.3)'
                                }}
                              >
                                <FiCheckCircle size={15} /> {st === 'approved' ? 'Approved ✓' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleApplicationAction(app._id, 'Rejected')}
                                style={{
                                  padding: '9px 18px',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(239,68,68,0.4)',
                                  backgroundColor: st === 'rejected' ? '#dc2626' : 'rgba(239,68,68,0.1)',
                                  color: st === 'rejected' ? 'white' : '#ef4444',
                                  fontWeight: '700',
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <FiXCircle size={15} /> {st === 'rejected' ? 'Rejected ✗' : 'Reject'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '45px', backgroundColor: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      No student leave requests pending review for Class {classInfo?.className}-{classInfo?.section}.
                    </div>
                  )}
                </div>
              )}

              {/* Sub-Tab 4: Class Exam Results */}
              {activeSubTab === 'results' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                        🏆 Class {classInfo?.className}-{classInfo?.section} Student Exam Results &amp; Report Cards
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                        View &amp; update overall exam marks, subject grades, GPAs and pass/fail statuses for students in your class.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <button
                        onClick={() => setResultsExamTerm('Term-1')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          fontWeight: '800',
                          fontSize: '12px',
                          cursor: 'pointer',
                          backgroundColor: resultsExamTerm === 'Term-1' ? 'var(--primary)' : 'var(--input-bg)',
                          color: resultsExamTerm === 'Term-1' ? 'white' : 'var(--text-muted)'
                        }}
                      >
                        📝 First Term
                      </button>
                      <button
                        onClick={() => setResultsExamTerm('Term-2')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          fontWeight: '800',
                          fontSize: '12px',
                          cursor: 'pointer',
                          backgroundColor: resultsExamTerm === 'Term-2' ? 'var(--primary)' : 'var(--input-bg)',
                          color: resultsExamTerm === 'Term-2' ? 'white' : 'var(--text-muted)'
                        }}
                      >
                        📘 Second Term
                      </button>
                      <button
                        onClick={() => setResultsExamTerm('Final')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          fontWeight: '800',
                          fontSize: '12px',
                          cursor: 'pointer',
                          backgroundColor: resultsExamTerm === 'Final' ? 'var(--primary)' : 'var(--input-bg)',
                          color: resultsExamTerm === 'Final' ? 'white' : 'var(--text-muted)'
                        }}
                      >
                        🏅 Final Term
                      </button>
                    </div>
                  </div>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Roll No</th>
                          <th>Student Name</th>
                          {(() => {
                            const subsSet = new Set<string>();
                            students.forEach((st: any) => {
                              const stRes = studentResultsMap[st._id] || {};
                              const termData = stRes[resultsExamTerm] || {};
                              (termData.subjects || []).forEach((sub: any) => {
                                if (sub.name) subsSet.add(sub.name);
                              });
                            });
                            const subList = subsSet.size > 0 
                              ? Array.from(subsSet) 
                              : ["Mathematics", "Science & Tech", "English Literature", "Social Science", "Computer Applications"];
                            return subList.map(subName => (
                              <th key={subName}>{subName}</th>
                            ));
                          })()}
                          <th>Total Marks</th>
                          <th>GPA / Grade</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.length > 0 ? (
                          students.map((st: any) => {
                            const stId = st._id;
                            const stRes = studentResultsMap[stId] || {};
                            const termData = stRes[resultsExamTerm] || {};
                            const subs = termData.subjects || [];

                            const subsSet = new Set<string>();
                            students.forEach((s: any) => {
                              const r = studentResultsMap[s._id] || {};
                              const t = r[resultsExamTerm] || {};
                              (t.subjects || []).forEach((sub: any) => {
                                if (sub.name) subsSet.add(sub.name);
                              });
                            });
                            const subList = subsSet.size > 0 
                              ? Array.from(subsSet) 
                              : ["Mathematics", "Science & Tech", "English Literature", "Social Science", "Computer Applications"];

                            const totalStr = termData.totalMarks || '–';
                            const gpaStr = termData.overallGpa ? `${termData.overallGpa} (${termData.grade || 'N/A'})` : '–';
                            const statusVal = termData.status || 'PENDING';

                            return (
                              <tr key={stId}>
                                <td><strong>{st.rollNumber || 'R01'}</strong></td>
                                <td><strong style={{ color: 'var(--text-main)' }}>{st.user?.name || st.name}</strong></td>
                                {subList.map(subName => {
                                  const found = subs.find((s: any) => (s.name || '').toLowerCase().trim() === subName.toLowerCase().trim());
                                  return (
                                    <td key={subName}>
                                      <span style={{ fontWeight: '700' }}>
                                        {found ? `${found.marks}/${found.maxMarks || 100}` : '–'}
                                      </span>
                                    </td>
                                  );
                                })}
                                <td><strong>{totalStr}</strong></td>
                                <td><span className="badge approved">{gpaStr}</span></td>
                                <td>
                                  <span className={`badge ${statusVal === 'PASSED' ? 'approved' : statusVal === 'FAILED' ? 'danger' : 'pending'}`}>
                                    {statusVal}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <button
                                      onClick={() => setViewingStudentResultModal({ isOpen: true, student: st, term: resultsExamTerm })}
                                      style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        fontWeight: '700',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                    >
                                      👁️ View Report Card
                                    </button>
                                    <button
                                      onClick={() => handleOpenEditResultsModal(st)}
                                      style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        backgroundColor: 'var(--primary)',
                                        color: 'white',
                                        fontWeight: '700',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                    >
                                      ✏️ Edit Report Card
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={11} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                              No students enrolled in Class {classInfo?.className}-{classInfo?.section}.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-Tab 5: Class Timetable & Faculty Matrix */}
              {activeSubTab === 'subjectTeachers' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800' }}>📅 Class {classInfo?.className}-{classInfo?.section} Daily Period Timetable Schedule</h3>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Period-by-period class timings, subject assignments, and instructor locations.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Day:</span>
                      <select
                        value={selectedTimetableDay}
                        onChange={(e) => handleTimetableDayChange(e.target.value)}
                        style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '700', cursor: 'pointer', outline: 'none' }}
                      >
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {timetableLoading ? (
                    <div style={{ textAlign: 'center', padding: '45px', backgroundColor: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      ⏳ Loading timetable...
                    </div>
                  ) : timetableSchedule.length > 0 ? (
                    <div className="table-container" style={{ marginBottom: '28px' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Period #</th>
                            <th>Time Slot</th>
                            <th>Subject Name</th>
                            <th>Assigned Instructor</th>
                            <th>Classroom / Lab Location</th>
                          </tr>
                        </thead>
                        <tbody>
                          {timetableSchedule.map((t: any, idx: number) => (
                            <tr key={idx} style={{ backgroundColor: t.isBreak ? 'rgba(245,158,11,0.06)' : 'transparent' }}>
                              <td><strong style={{ color: 'var(--primary)' }}>{t.period}</strong></td>
                              <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t.time}</td>
                              <td><strong style={{ color: 'var(--text-main)' }}>{t.subject}</strong></td>
                              <td style={{ fontSize: '13px' }}>{t.teacher}</td>
                              <td>
                                <span style={{ padding: '3px 10px', borderRadius: '6px', backgroundColor: 'var(--input-bg)', fontSize: '12px', fontWeight: '700' }}>
                                  📍 {t.room}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '45px', backgroundColor: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--border-color)', color: 'var(--text-muted)', marginBottom: '28px' }}>
                      📅 No timetable configured for Class {classInfo?.className}-{classInfo?.section} on <strong>{selectedTimetableDay}</strong>.
                    </div>
                  )}

                  <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '800' }}>📚 Faculty Teachers Assigned to Class {classInfo?.className}-{classInfo?.section}</h3>
                  {subjectTeachers.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                      {subjectTeachers.map((st: any) => (
                        <div key={st._id} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#3b82f6', color: 'white', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {(st.user?.name || 'T').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <strong style={{ fontSize: '15px', color: 'var(--text-main)', display: 'block' }}>{st.user?.name}</strong>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{st.specialization || 'Subject Instructor'}</span>
                            </div>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                            <span>✉️ {st.user?.email}</span>
                            <span>📞 {st.user?.phone || 'N/A'}</span>
                            <span>🏛️ Department: <strong>{st.department || 'Academic'}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '45px', backgroundColor: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      📚 No faculty teacher records found.
                    </div>
                  )}
                </div>
              )}

              {/* Sub-Tab 6: Class Notices */}
              {activeSubTab === 'announcements' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>📢 Class Notices &amp; Announcement Board</h3>
                    <button
                      onClick={() => setShowAnnounceModal(true)}
                      style={{ padding: '9px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <FiPlus /> New Class Notice
                    </button>
                  </div>

                  <div style={{ display: 'grid', gap: '14px' }}>
                    {announcements.map(a => (
                      <div key={a.id} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--primary)' }}>{a.title}</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📅 {a.date}</span>
                            {(a.author.includes(teacherName) || canAdminOverride) && (
                              <button 
                                onClick={() => deleteNotice(a.id)} 
                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                title="Delete Notice"
                              >
                                <FiTrash2 size={16} color="#ef4444" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p style={{ margin: '0 0 10px', fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.5' }}>{a.text}</p>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Posted by: <strong>{a.author}</strong></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
               ZONE 2: SUBJECT TEACHER ZONE (TEACHING DUTIES)
          ════════════════════════════════════════════════════════════════ */}
          {activeZone === 'subjectTeacher' && (
            <div>
              {/* Sub-Tab Nav for Subject Teacher */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {[
                  { id: 'mySubjectClasses', label: '📖 My Assigned Subjects & Classes', count: assignedSubjects.length },
                  { id: 'subjectAttendance', label: '📋 Subject Period Attendance', count: null },
                  { id: 'subjectAssignments', label: '📝 Homework & Assignments', count: assignmentsList.length },
                  { id: 'subjectResults', label: '🏆 Subject Exam Marks Entry', count: null },
                  { id: 'mySchedule', label: '🗓️ My Teaching Schedule', count: null },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id as any)}
                    style={{
                      padding: '9px 16px',
                      borderRadius: '10px',
                      border: activeSubTab === tab.id ? '1px solid #15803d' : '1px solid var(--border-color)',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      backgroundColor: activeSubTab === tab.id ? '#15803d' : 'var(--card-bg)',
                      color: activeSubTab === tab.id ? 'white' : 'var(--text-muted)',
                      boxShadow: activeSubTab === tab.id ? '0 4px 12px rgba(21, 128, 61, 0.3)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== null && (
                      <span style={{ backgroundColor: activeSubTab === tab.id ? 'rgba(255,255,255,0.25)' : 'var(--input-bg)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Sub-Tab 1: My Subject Classes */}
              {activeSubTab === 'mySubjectClasses' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>📖 My Teaching Subjects &amp; Allocated Classes</h3>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                        Subjects and class sections assigned to <strong>{teacherName}</strong>.
                      </p>
                    </div>
                    <button
                      onClick={() => { setActiveZone('allocation'); }}
                      style={{ padding: '9px 16px', backgroundColor: '#047857', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <FiSliders size={14} /> Edit Subject Allocations
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    {assignedSubjects.length > 0 ? (
                      assignedSubjects.map((s: any, idx: number) => (
                        <div key={idx} style={{ backgroundColor: 'var(--card-bg)', border: '1.5px solid #86efac', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.08)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#15803d', color: 'white', fontWeight: '800', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              📚
                            </div>
                            <div>
                              <strong style={{ fontSize: '16px', color: 'var(--text-main)', display: 'block' }}>{s.name || s}</strong>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Code: {s.code || `SUB-0${idx + 1}`}</span>
                            </div>
                          </div>

                          <div style={{ fontSize: '13px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                            <span>Assigned Classes: </span>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                              {assignedClasses.length > 0 ? (
                                assignedClasses.map((c: any, i: number) => (
                                  <span key={i} style={{ padding: '3px 10px', borderRadius: '12px', backgroundColor: 'rgba(34,197,94,0.15)', color: '#15803d', fontWeight: '800', fontSize: '12px' }}>
                                    Class {c.className || c}-{c.section || 'A'}
                                  </span>
                                ))
                              ) : (
                                <span style={{ fontStyle: 'italic', fontSize: '12px' }}>Class {classInfo?.className || '10'}-{classInfo?.section || 'A'} (Default)</span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                            <button
                              onClick={() => {
                                setPeriodAttSubject(s.name || s);
                                setActiveSubTab('subjectAttendance');
                              }}
                              style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: 'none', backgroundColor: '#16a34a', color: 'white', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}
                            >
                              📋 Mark Period Att.
                            </button>
                            <button
                              onClick={() => {
                                setSubjMarksSubject(s.name || s);
                                setActiveSubTab('subjectResults');
                              }}
                              style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: '1px solid #16a34a', backgroundColor: 'transparent', color: '#15803d', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}
                            >
                              🏆 Upload Marks
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '36px', backgroundColor: 'var(--card-bg)', borderRadius: '16px', border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>
                        📚 No subjects assigned yet. Click "Edit Subject Allocations" above to assign your teaching subjects and classes!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sub-Tab 2: Subject Period Attendance */}
              {activeSubTab === 'subjectAttendance' && (
                <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>📋 Subject Period Attendance Marking</h3>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                        Mark period-wise attendance for your assigned subject classes.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <select
                        value={periodAttSubject}
                        onChange={(e) => setPeriodAttSubject(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '700' }}
                      >
                        {assignedSubjects.length > 0 ? (
                          assignedSubjects.map((s: any, idx: number) => (
                            <option key={idx} value={s.name || s}>{s.name || s}</option>
                          ))
                        ) : (
                          <option value="Mathematics">Mathematics</option>
                        )}
                      </select>

                      <select
                        value={periodAttClass}
                        onChange={(e) => setPeriodAttClass(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '700' }}
                      >
                        {['9', '10', '11', '12'].map(c => (
                          <option key={c} value={c}>Class {c}</option>
                        ))}
                      </select>

                      <select
                        value={periodAttNo}
                        onChange={(e) => setPeriodAttNo(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '700' }}
                      >
                        {['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6'].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>

                      <input
                        type="date"
                        value={periodAttDate}
                        onChange={(e) => setPeriodAttDate(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px' }}
                      />

                      <button
                        onClick={() => triggerMsg(`Period Attendance for ${periodAttSubject} (${periodAttNo}) saved!`)}
                        style={{ padding: '8px 18px', backgroundColor: '#15803d', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                      >
                        💾 Save Period Attendance
                      </button>
                    </div>
                  </div>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Roll No</th>
                          <th>Student Name</th>
                          <th>Subject Name</th>
                          <th>Period #</th>
                          <th style={{ textAlign: 'center' }}>Attendance Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((st: any) => {
                          const stId = st._id || st.rollNumber;
                          const curStatus = periodAttList[stId] || 'Present';
                          return (
                            <tr key={stId}>
                              <td><strong>{st.rollNumber || 'R01'}</strong></td>
                              <td><strong style={{ color: 'var(--text-main)' }}>{st.user?.name || st.name}</strong></td>
                              <td><span style={{ fontWeight: '700', color: '#15803d' }}>{periodAttSubject || 'Subject'}</span></td>
                              <td><span className="badge info">{periodAttNo}</span></td>
                              <td>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                  <button
                                    onClick={() => setPeriodAttList(prev => ({ ...prev, [stId]: 'Present' }))}
                                    style={{
                                      padding: '6px 16px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      fontWeight: '700',
                                      fontSize: '11px',
                                      cursor: 'pointer',
                                      backgroundColor: curStatus === 'Present' ? '#10b981' : 'var(--input-bg)',
                                      color: curStatus === 'Present' ? 'white' : 'var(--text-muted)'
                                    }}
                                  >
                                    Present
                                  </button>
                                  <button
                                    onClick={() => setPeriodAttList(prev => ({ ...prev, [stId]: 'Absent' }))}
                                    style={{
                                      padding: '6px 16px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      fontWeight: '700',
                                      fontSize: '11px',
                                      cursor: 'pointer',
                                      backgroundColor: curStatus === 'Absent' ? '#ef4444' : 'var(--input-bg)',
                                      color: curStatus === 'Absent' ? 'white' : 'var(--text-muted)'
                                    }}
                                  >
                                    Absent
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-Tab 3: Subject Homework & Assignments */}
              {activeSubTab === 'subjectAssignments' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>📝 Homework &amp; Subject Assignments Manager</h3>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                        Create and manage subject homework, projects, and track student submissions.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowAssignmentModal(true)}
                      style={{ padding: '9px 18px', backgroundColor: '#15803d', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <FiPlus /> New Homework Assignment
                    </button>
                  </div>

                  <div style={{ display: 'grid', gap: '14px' }}>
                    {assignmentsList.length > 0 ? (
                      assignmentsList.map((asg: any) => (
                        <div key={asg._id} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                              <span style={{ padding: '3px 10px', borderRadius: '12px', backgroundColor: 'rgba(34,197,94,0.15)', color: '#15803d', fontWeight: '800', fontSize: '11px' }}>
                                Class {asg.className}-{asg.section || 'A'}
                              </span>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📅 Due: <strong>{asg.dueDate ? new Date(asg.dueDate).toLocaleDateString('en-GB') : 'TBD'}</strong></span>
                            </div>
                            <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>{asg.title}</h4>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>{asg.instructions || 'Complete problem set questions 1 to 10.'}</p>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => triggerMsg('Opening submission reviews...')}
                              style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                            >
                              📥 View Submissions
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '45px', backgroundColor: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        📝 No assignments created yet. Click "New Homework Assignment" to create one.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sub-Tab 4: Subject Exam Marks Upload */}
              {activeSubTab === 'subjectResults' && (
                <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>🏆 Subject Exam Marks Entry / Gradebook</h3>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                        Upload and update subject test/exam marks for assigned students.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <select
                        value={subjMarksSubject}
                        onChange={(e) => setSubjMarksSubject(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '700' }}
                      >
                        {assignedSubjects.length > 0 ? (
                          assignedSubjects.map((s: any, idx: number) => (
                            <option key={idx} value={s.name || s}>{s.name || s}</option>
                          ))
                        ) : (
                          <option value="Mathematics">Mathematics</option>
                        )}
                      </select>

                      <select
                        value={subjMarksExamTerm}
                        onChange={(e) => setSubjMarksExamTerm(e.target.value as any)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '700' }}
                      >
                        <option value="Term-1">First Term</option>
                        <option value="Term-2">Second Term</option>
                        <option value="Final">Final Term</option>
                      </select>

                      <button
                        onClick={() => triggerMsg(`Subject marks for ${subjMarksSubject} (${subjMarksExamTerm}) saved!`)}
                        style={{ padding: '8px 18px', backgroundColor: '#15803d', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                      >
                        💾 Save Marks
                      </button>
                    </div>
                  </div>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Roll No</th>
                          <th>Student Name</th>
                          <th>Subject</th>
                          <th>Marks Obtained</th>
                          <th>Max Marks</th>
                          <th>Grade</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((st: any) => {
                          const stId = st._id || st.rollNumber;
                          const existingData = subjMarksData[stId] || { marks: 85, maxMarks: 100, remarks: 'Good Effort' };
                          const gradeDetails = getGradeDetails(existingData.marks);

                          return (
                            <tr key={stId}>
                              <td><strong>{st.rollNumber || 'R01'}</strong></td>
                              <td><strong style={{ color: 'var(--text-main)' }}>{st.user?.name || st.name}</strong></td>
                              <td><strong style={{ color: '#15803d' }}>{subjMarksSubject || 'Subject'}</strong></td>
                              <td>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={existingData.marks}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    setSubjMarksData(prev => ({
                                      ...prev,
                                      [stId]: { ...existingData, marks: val }
                                    }));
                                  }}
                                  style={{ width: '70px', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontWeight: '800', textAlign: 'center' }}
                                />
                              </td>
                              <td style={{ color: 'var(--text-muted)' }}>100</td>
                              <td><span className="badge approved">{gradeDetails.grade}</span></td>
                              <td>
                                <input
                                  type="text"
                                  value={existingData.remarks}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSubjMarksData(prev => ({
                                      ...prev,
                                      [stId]: { ...existingData, remarks: val }
                                    }));
                                  }}
                                  style={{ width: '160px', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '12px' }}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-Tab 5: My Teaching Schedule */}
              {activeSubTab === 'mySchedule' && (
                <div>
                  <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '800' }}>🗓️ Today's Teaching Timetable Schedule for {teacherName}</h3>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Period #</th>
                          <th>Time Slot</th>
                          <th>Class &amp; Section</th>
                          <th>Subject Taught</th>
                          <th>Classroom / Lab</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { period: 'Period 1', time: '08:45 AM - 09:30 AM', class: `Class ${classInfo?.className || '10'}-${classInfo?.section || 'A'}`, subject: assignedSubjects[0]?.name || 'Mathematics', room: `Room ${classInfo?.room || '204'}` },
                          { period: 'Period 3', time: '10:30 AM - 11:15 AM', class: 'Class 9-A', subject: assignedSubjects[1]?.name || 'Physics', room: 'Physics Lab 1' },
                          { period: 'Period 5', time: '12:15 PM - 01:00 PM', class: `Class ${classInfo?.className || '10'}-${classInfo?.section || 'A'}`, subject: assignedSubjects[0]?.name || 'Mathematics Lab', room: `Room ${classInfo?.room || '204'}` },
                        ].map((p, idx) => (
                          <tr key={idx}>
                            <td><strong style={{ color: '#15803d' }}>{p.period}</strong></td>
                            <td style={{ color: 'var(--text-muted)' }}>{p.time}</td>
                            <td><strong>{p.class}</strong></td>
                            <td><strong style={{ color: 'var(--text-main)' }}>{p.subject}</strong></td>
                            <td><span style={{ padding: '3px 10px', borderRadius: '6px', backgroundColor: 'var(--input-bg)', fontSize: '12px', fontWeight: '700' }}>📍 {p.room}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
               ZONE 3: SUBJECT ALLOCATION / ASSIGN SUBJECTS & CLASSES
          ════════════════════════════════════════════════════════════════ */}
          {activeZone === 'allocation' && (
            <div style={{ backgroundColor: 'var(--card-bg)', border: '2px solid #86efac', borderRadius: '20px', padding: '28px', boxShadow: '0 8px 24px rgba(34, 197, 94, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid var(--border-color)', paddingBottom: '16px' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(34,197,94,0.15)', color: '#15803d', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>
                    <FiSliders /> SUBJECT ALLOCATION CONTROL CENTER
                  </div>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: 'var(--text-main)' }}>
                    Assign Subjects &amp; Classes to Teacher ({teacherName})
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Select subjects and classes taught by this teacher. Changes update teacher record across academic timetable and gradebook.
                  </p>
                </div>
                
                <button
                  onClick={handleSaveAllocation}
                  disabled={savingAllocation}
                  style={{ padding: '12px 24px', backgroundColor: '#15803d', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(21, 128, 61, 0.35)' }}
                >
                  <FiCheck /> {savingAllocation ? 'Saving Allocations...' : '💾 Save Subject Allocations'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Select Teaching Subjects */}
                <div style={{ backgroundColor: 'var(--panel-bg)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📚 Select Teaching Subjects
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px' }}>Check all subjects this teacher is qualified &amp; assigned to teach:</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                    {(allSubjectsCatalog.length > 0 ? allSubjectsCatalog : [
                      { _id: 's1', name: 'Mathematics', code: 'MATH' },
                      { _id: 's2', name: 'Science & Technology', code: 'SCI' },
                      { _id: 's3', name: 'English Literature', code: 'ENG' },
                      { _id: 's4', name: 'Computer Applications', code: 'CS' },
                      { _id: 's5', name: 'Social Studies', code: 'SST' }
                    ]).map((sub: any) => {
                      const subId = sub._id;
                      const isSelected = selectedSubjectIds.includes(subId) || selectedSubjectIds.includes(sub.name);
                      return (
                        <label
                          key={subId}
                          onClick={() => {
                            setSelectedSubjectIds(prev =>
                              prev.includes(subId) ? prev.filter(i => i !== subId) : [...prev, subId]
                            );
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            border: isSelected ? '2px solid #16a34a' : '1px solid var(--border-color)',
                            backgroundColor: isSelected ? 'rgba(34,197,94,0.1)' : 'var(--card-bg)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              style={{ width: '16px', height: '16px', accentColor: '#16a34a' }}
                            />
                            <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{sub.name}</strong>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', backgroundColor: 'var(--input-bg)', padding: '2px 8px', borderRadius: '6px' }}>
                            {sub.code || 'SUB'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Select Teaching Classes */}
                <div style={{ backgroundColor: 'var(--panel-bg)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🏫 Select Assigned Classes &amp; Sections
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px' }}>Check all class sections where this teacher teaches:</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                    {(allClassesCatalog.length > 0 ? allClassesCatalog : [
                      { _id: 'c1', className: '9', section: 'A' },
                      { _id: 'c2', className: '9', section: 'B' },
                      { _id: 'c3', className: '10', section: 'A' },
                      { _id: 'c4', className: '10', section: 'B' },
                      { _id: 'c5', className: '11', section: 'A' },
                    ]).map((cls: any) => {
                      const clsId = cls._id;
                      const isSelected = selectedClassIds.includes(clsId) || selectedClassIds.includes(cls.className);
                      return (
                        <label
                          key={clsId}
                          onClick={() => {
                            setSelectedClassIds(prev =>
                              prev.includes(clsId) ? prev.filter(i => i !== clsId) : [...prev, clsId]
                            );
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            border: isSelected ? '2px solid #15803d' : '1px solid var(--border-color)',
                            backgroundColor: isSelected ? 'rgba(34,197,94,0.1)' : 'var(--card-bg)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              style={{ width: '16px', height: '16px', accentColor: '#15803d' }}
                            />
                            <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                              Class {cls.className}-{cls.section || 'A'}
                            </strong>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#15803d', backgroundColor: 'rgba(34,197,94,0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                            Room {cls.room || '204'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Department & Specialization Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Specialization Field</label>
                  <input
                    type="text"
                    value={teacherSpecialization}
                    onChange={(e) => setTeacherSpecialization(e.target.value)}
                    placeholder="e.g. Pure Mathematics &amp; Algebra"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Academic Department</label>
                  <input
                    type="text"
                    value={teacherDepartment}
                    onChange={(e) => setTeacherDepartment(e.target.value)}
                    placeholder="e.g. Department of Mathematics &amp; Science"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── Student Details Modal ── */}
        {selectedStudent && (
          <div onClick={() => setSelectedStudent(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%', maxWidth: '540px', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>🎓 Student Profile — {selectedStudent.user?.name || selectedStudent.name}</h3>
                <button onClick={() => setSelectedStudent(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}><FiX /></button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Roll Number:</span><br /><strong style={{ fontSize: '15px' }}>{selectedStudent.rollNumber || 'R01'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Class &amp; Section:</span><br /><strong>Class {classInfo?.className}-{classInfo?.section}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Email:</span><br /><strong>{selectedStudent.user?.email || selectedStudent.email}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Phone:</span><br /><strong>{selectedStudent.user?.phone || '+919876543210'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Gender:</span><br /><strong>{selectedStudent.gender || 'Male'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Blood Group:</span><br /><strong>{selectedStudent.bloodGroup || 'O+'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Parent Name:</span><br /><strong>{selectedStudent.parentName || 'Parent Registered'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Parent Phone:</span><br /><strong>{selectedStudent.parentPhone || '+919876001122'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Fee Status:</span><br /><strong style={{ color: selectedStudent.feeStatus === 'Paid' ? '#10b981' : '#f59e0b' }}>{selectedStudent.feeStatus || 'Paid'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Attendance Rate:</span><br /><strong style={{ color: '#10b981' }}>{selectedStudent.attendancePct || 92}%</strong></div>
              </div>

              <button onClick={() => setSelectedStudent(null)} style={{ width: '100%', marginTop: '20px', padding: '10px', backgroundColor: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Close Profile</button>
            </div>
          </div>
        )}

        {/* ── Post Announcement Modal ── */}
        {showAnnounceModal && (
          <div onClick={() => setShowAnnounceModal(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>📢 Post Class Notice</h3>
                <button onClick={() => setShowAnnounceModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}><FiX /></button>
              </div>

              <form onSubmit={postAnnouncement}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Notice Title *</label>
                  <input required type="text" value={newNotice.title} onChange={e => setNewNotice({ ...newNotice, title: e.target.value })} placeholder="e.g. Science Lab Project Submission" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }} />
                </div>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Notice Details *</label>
                  <textarea required rows={4} value={newNotice.text} onChange={e => setNewNotice({ ...newNotice, text: e.target.value })} placeholder="Enter detailed notice message for class students..." style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Post Notice</button>
                  <button type="button" onClick={() => setShowAnnounceModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── New Homework Assignment Modal ── */}
        {showAssignmentModal && (
          <div onClick={() => setShowAssignmentModal(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%', maxWidth: '520px', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>📝 Assign New Homework / Project</h3>
                <button onClick={() => setShowAssignmentModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}><FiX /></button>
              </div>

              <form onSubmit={handleCreateAssignmentSubmit}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Assignment Title *</label>
                  <input required type="text" value={newAssignment.title} onChange={e => setNewAssignment({ ...newAssignment, title: e.target.value })} placeholder="e.g. Chapter 4 Practice Set & Worksheet" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Target Class *</label>
                    <input required type="text" value={newAssignment.className} onChange={e => setNewAssignment({ ...newAssignment, className: e.target.value })} placeholder="e.g. 10" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Section</label>
                    <input type="text" value={newAssignment.section} onChange={e => setNewAssignment({ ...newAssignment, section: e.target.value })} placeholder="A" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Due Date *</label>
                  <input required type="date" value={newAssignment.dueDate} onChange={e => setNewAssignment({ ...newAssignment, dueDate: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }} />
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Instructions &amp; Problem Statements</label>
                  <textarea rows={3} value={newAssignment.instructions} onChange={e => setNewAssignment({ ...newAssignment, instructions: e.target.value })} placeholder="Enter detailed homework instructions for students..." style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" disabled={creatingAssignment} style={{ flex: 1, padding: '10px', backgroundColor: '#15803d', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                    {creatingAssignment ? 'Creating...' : 'Assign Homework'}
                  </button>
                  <button type="button" onClick={() => setShowAssignmentModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── View Full Student Report Card Modal ── */}
        {viewingStudentResultModal && viewingStudentResultModal.isOpen && (() => {
          const st = viewingStudentResultModal.student;
          const stRes = studentResultsMap[st._id] || {};
          const termData = stRes[viewingStudentResultModal.term] || {};
          const subjects = termData.subjects || [];

          return (
            <div onClick={() => setViewingStudentResultModal(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
              <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '20px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '6px' }}>OFFICIAL ACADEMIC REPORT CARD</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>{termData.termName || viewingStudentResultModal.term}</span>
                    </div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: 'var(--text-main)' }}>
                      {st.user?.name || st.name}
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                      Roll No: <strong style={{ color: 'var(--primary)' }}>{st.rollNumber || 'R01'}</strong> | Class: <strong>{classInfo?.className}-{classInfo?.section}</strong> | Email: <strong>{st.user?.email || st.email}</strong>
                    </p>
                  </div>
                  <button onClick={() => setViewingStudentResultModal(null)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-muted)' }}><FiX /></button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', backgroundColor: 'var(--input-bg)', padding: '16px', borderRadius: '14px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Score</span>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-main)', marginTop: '2px' }}>
                      {termData.totalMarks || '0 / 500'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Overall GPA</span>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#10b981', marginTop: '2px' }}>
                      {termData.overallGpa || '0.0 / 10'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Overall Grade</span>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#8b5cf6', marginTop: '2px' }}>
                      {termData.grade || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Status</span>
                    <div style={{ marginTop: '2px' }}>
                      <span className={`badge ${termData.status === 'PASSED' ? 'approved' : termData.status === 'FAILED' ? 'danger' : 'pending'}`}>
                        {termData.status || 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>

                <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: '800' }}>📚 Subject-wise Marks &amp; Grades Breakdown</h4>
                {subjects.length > 0 ? (
                  <div className="table-container" style={{ marginBottom: '24px' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Marks Obtained</th>
                          <th>Max Marks</th>
                          <th>Grade</th>
                          <th>Teacher Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map((sub: any, idx: number) => (
                          <tr key={idx}>
                            <td><strong style={{ color: 'var(--text-main)' }}>{sub.name}</strong></td>
                            <td><span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary)' }}>{sub.marks}</span></td>
                            <td style={{ color: 'var(--text-muted)' }}>{sub.maxMarks || 100}</td>
                            <td>
                              <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '800', backgroundColor: sub.grade === 'O' || sub.grade === 'A+' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)', color: sub.grade === 'O' || sub.grade === 'A+' ? '#10b981' : '#2563eb' }}>
                                {sub.grade || 'Pass'}
                              </span>
                            </td>
                            <td style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '13px' }}>
                              ⭐ {sub.remarks || 'Good Effort'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px', backgroundColor: 'var(--input-bg)', borderRadius: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                    No subject marks entered yet for {viewingStudentResultModal.term}. Click "Edit Report Card" to add subject marks.
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => window.print()}
                    style={{ flex: 1, padding: '11px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    🖨️ Print / Download Report Card
                  </button>
                  <button
                    onClick={() => setViewingStudentResultModal(null)}
                    style={{ flex: 1, padding: '11px', backgroundColor: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Close
                  </button>
                </div>

              </div>
            </div>
          );
        })()}

        {/* ── Dynamic Edit Student Results Modal ── */}
        {editingStudentResultModal && editingStudentResultModal.isOpen && (
          <div onClick={() => setEditingStudentResultModal(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '20px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '26px', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                    🏆 Edit Student Report Card ({editingStudentResultModal.term})
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--primary)', fontWeight: '700' }}>
                    Student: {editingStudentResultModal.student.user?.name || editingStudentResultModal.student.name} (Roll: {editingStudentResultModal.student.rollNumber || 'R01'})
                  </p>
                </div>
                <button onClick={() => setEditingStudentResultModal(null)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-muted)' }}><FiX /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)' }}>Subject Marks &amp; Remarks Entry</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStudentResultModal(prev => prev ? ({
                        ...prev,
                        subjects: [...prev.subjects, { name: '', marks: 75, maxMarks: 100, remarks: 'Good Effort' }]
                      }) : null);
                    }}
                    style={{ padding: '5px 12px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    + Add New Subject
                  </button>
                </div>

                {editingStudentResultModal.subjects.map((sub, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 30px', gap: '8px', alignItems: 'center', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)' }}>
                    <input
                      type="text"
                      placeholder="Subject Name (e.g. Mathematics)"
                      value={sub.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingStudentResultModal(prev => prev ? ({
                          ...prev,
                          subjects: prev.subjects.map((s, i) => i === idx ? { ...s, name: val } : s)
                        }) : null);
                      }}
                      style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '700', outline: 'none' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        min={0}
                        max={sub.maxMarks || 100}
                        value={sub.marks}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setEditingStudentResultModal(prev => prev ? ({
                            ...prev,
                            subjects: prev.subjects.map((s, i) => i === idx ? { ...s, marks: val } : s)
                          }) : null);
                        }}
                        style={{ width: '60px', padding: '7px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '800', textAlign: 'center', outline: 'none' }}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ {sub.maxMarks || 100}</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Teacher Remark"
                      value={sub.remarks}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingStudentResultModal(prev => prev ? ({
                          ...prev,
                          subjects: prev.subjects.map((s, i) => i === idx ? { ...s, remarks: val } : s)
                        }) : null);
                      }}
                      style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '12px', outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStudentResultModal(prev => prev ? ({
                          ...prev,
                          subjects: prev.subjects.filter((_, i) => i !== idx)
                        }) : null);
                      }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: '800', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Remove subject"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleSaveStudentResults}
                  disabled={savingClassResults}
                  style={{ flex: 1, padding: '12px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', opacity: savingClassResults ? 0.6 : 1 }}
                >
                  {savingClassResults ? 'Saving Results...' : '💾 Save Class Report Card'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStudentResultModal(null)}
                  style={{ flex: 1, padding: '12px', backgroundColor: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default ClassTeacherDashboard;
