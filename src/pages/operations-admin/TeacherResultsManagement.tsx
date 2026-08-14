import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { FiAward, FiSave, FiSearch, FiDownload, FiLoader, FiBookOpen } from 'react-icons/fi';
import API from '../../api/axios';
import { useSharedState } from '../../hooks/useSharedState';

interface StudentResultItem {
  studentId: string;
  rollNumber: string;
  name: string;
  email: string;
  className: string;
  section: string;
  subjectName: string;
  subjectCode: string;
  maxMarks: number;
  marksObtained: number | string;
  grade: string;
  remark: string;
  isSubmitted?: boolean;
  overallGpa?: string;
  overallGrade?: string;
  totalMarks?: string;
  status?: string;
  subjectsList?: any[];
}

const TeacherResultsManagement = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [examType, setExamType] = useState('Mid-Term Examination 2026');
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  
  const [students, setStudents] = useState<StudentResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewingFullReportCardModal, setViewingFullReportCardModal] = useState<{
    isOpen: boolean;
    student: StudentResultItem;
  } | null>(null);

  const userEmail = localStorage.getItem('userEmail') || '';
  const userRole = localStorage.getItem('role') || '';
  const canAdminOverride = userRole === 'super-admin' || userRole === 'academic-admin' || userRole.includes('admin') || userRole.includes('manager');
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        let classesData = [];
        if (canAdminOverride) {
          const res = await API.get('/api/academic-admin/classes');
          classesData = res.data.data || [];
        } else {
          const res = await API.get(`/api/teacher/my-classes/${userEmail}`);
          classesData = res.data.data || [];
        }
        setAssignedClasses(classesData);
        
        // Auto-select the first available class, section, and subject if not set
        if (classesData.length > 0) {
          const firstClass = classesData[0];
          const classNameStr = firstClass.className.toString().toLowerCase().replace('class', '').replace('th', '').replace('rd', '').replace('nd', '').replace('st', '').trim();
          setSelectedClass(classNameStr);
          setSelectedSection(firstClass.section);
          
          if (firstClass.subjects && firstClass.subjects.length > 0) {
            setSubjectName(firstClass.subjects[0].name);
            setSubjectCode(firstClass.subjects[0].code);
          }
        }
      } catch (err) {
        console.error("Failed to load classes", err);
      }
    };
    fetchClasses();
  }, [userEmail, canAdminOverride]);

  const normalizeClass = (cls: any) => {
    if (!cls) return '';
    return cls.toString().toLowerCase().replace('class', '').replace('th', '').replace('rd', '').replace('nd', '').replace('st', '').trim();
  };

  const uniqueClasses = Array.from(new Set(assignedClasses.map(c => normalizeClass(c.className)).filter(Boolean)));
  
  const availableSections = Array.from(new Set(assignedClasses
    .filter(c => normalizeClass(c.className) === normalizeClass(selectedClass))
    .map(c => c.section)
    .filter(Boolean)
  ));

  const availableSubjects = Array.from(new Set(assignedClasses
    .filter(c => normalizeClass(c.className) === normalizeClass(selectedClass) && c.section === selectedSection)
    .flatMap(c => c.subjects || [])
    .map((s: any) => ({ name: s.name, code: s.code }))
  ));
  
  const uniqueSubjects = Array.from(new Map(availableSubjects.map((s: any) => [s.name, s])).values());

  // Shared state for Teacher Admin Exam Result Orders
  const [examOrders, setExamOrders] = useSharedState<any[]>('erp_exam_result_orders', [
    {
      id: 'order-101',
      examTerm: 'Mid-Term Examination 2026',
      className: '10',
      section: 'A',
      subjectName: 'Mathematics',
      subjectCode: 'MATH-10A',
      dueDate: '2026-08-15',
      instructions: 'Please upload student marks out of 100 for Mid-Term Mathematics exam.',
      createdBy: 'Chetan Mohane (Teacher Admin)',
      createdDate: '2026-08-04',
      status: 'OPEN'
    },
    {
      id: 'order-102',
      examTerm: 'Mid-Term Examination 2026',
      className: '10',
      section: 'B',
      subjectName: 'Mathematics',
      subjectCode: 'MATH-10B',
      dueDate: '2026-08-15',
      instructions: 'Please upload student marks out of 100 for Mid-Term Mathematics exam.',
      createdBy: 'Chetan Mohane (Teacher Admin)',
      createdDate: '2026-08-04',
      status: 'OPEN'
    },
    {
      id: 'order-103',
      examTerm: 'Unit Test 1 (Quarterly)',
      className: '9',
      section: 'A',
      subjectName: 'Mathematics',
      subjectCode: 'MATH-09A',
      dueDate: '2026-08-18',
      instructions: 'Unit Test 1 Algebra & Geometry marks entry.',
      createdBy: 'Chetan Mohane (Teacher Admin)',
      createdDate: '2026-08-04',
      status: 'OPEN'
    }
  ]);

  // Helper to calculate Grade
  const calculateGrade = (marks: number | string, max: number = 100) => {
    const score = Number(marks);
    if (isNaN(score)) return 'N/A';
    const pct = (score / max) * 100;
    if (pct >= 90) return 'A+ (Outstanding)';
    if (pct >= 80) return 'A (Excellent)';
    if (pct >= 70) return 'B (Very Good)';
    if (pct >= 60) return 'C (Good)';
    if (pct >= 50) return 'D (Satisfactory)';
    return 'F (Fail)';
  };

  // Fetch Students for assigned class
  const fetchClassStudents = async () => {
    if (!selectedClass || !selectedSection) return;
    setLoading(true);
    try {
      const response = await API.get(`/api/attendance/list?className=${encodeURIComponent(selectedClass)}&section=${encodeURIComponent(selectedSection)}`);
      const list = response.data || [];

      const termKey = examType.toLowerCase().includes('mid') || examType.toLowerCase().includes('unit') || examType.toLowerCase().includes('quarter')
        ? 'Term-1'
        : 'Term-2';
      
      const targetSubjectName = matchSubjectName(subjectName);

      const formattedListPromises = list.map(async (st: any, idx: number) => {
        let marksObtained = 0;
        let remarkText = '';
        let overallGpa = '–';
        let overallGrade = '–';
        let totalMarks = '–';
        let statusVal = 'PENDING';
        let subjectsList: any[] = [];

        try {
          const res = await API.get(`/api/admin/student-admin/results/${st._id}`);
          const resultsData = res.data?.data || {};
          const termData = resultsData[termKey];
          if (termData) {
            overallGpa = termData.overallGpa || '–';
            overallGrade = termData.grade || '–';
            totalMarks = termData.totalMarks || '–';
            statusVal = termData.status || 'PENDING';
            subjectsList = termData.subjects || [];

            const subjectEntry = subjectsList.find((sub: any) => matchSubjectName(sub.name) === targetSubjectName);
            if (subjectEntry) {
              marksObtained = subjectEntry.marks;
              remarkText = subjectEntry.remarks;
            }
          }
        } catch (err) {
          console.warn("Could not fetch real results for student", st._id);
        }

        const gradeDetails = getGradeDetails(marksObtained);
        const resolvedName = st.user?.name || st.name || `Student ${st.rollNumber || idx + 1}`;
        const resolvedEmail = st.user?.email || st.email || `${resolvedName.toLowerCase().replace(/\s+/g, '.')}@school.edu`;

        return {
          studentId: st._id,
          rollNumber: st.rollNumber || `100${idx + 1}`,
          name: resolvedName,
          email: resolvedEmail,
          className: selectedClass,
          section: selectedSection,
          subjectName: subjectName,
          subjectCode: subjectCode,
          maxMarks: 100,
          marksObtained: marksObtained,
          grade: gradeDetails.grade,
          remark: remarkText || gradeDetails.remarks,
          isSubmitted: false,
          overallGpa,
          overallGrade,
          totalMarks,
          status: statusVal,
          subjectsList
        };
      });

      const formattedList = await Promise.all(formattedListPromises);
      setStudents(formattedList);
    } catch (err) {
      console.error("Error fetching students for results", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassStudents();
  }, [selectedClass, selectedSection, subjectName, examType]);

  const handleMarksChange = (studentId: string, val: string) => {
    const score = val === '' ? '' : Math.min(100, Math.max(0, Number(val)));
    setStudents(prev =>
      prev.map(st => {
        if (st.studentId === studentId) {
          const updatedGrade = calculateGrade(score, st.maxMarks);
          return { ...st, marksObtained: score, grade: updatedGrade };
        }
        return st;
      })
    );
  };

  const handleRemarkChange = (studentId: string, val: string) => {
    setStudents(prev =>
      prev.map(st => (st.studentId === studentId ? { ...st, remark: val } : st))
    );
  };

  // Normalizes long subject names to match Student report card
  const matchSubjectName = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('math')) return 'Mathematics';
    if (lower.includes('science') || lower.includes('physic')) return 'Science & Tech';
    if (lower.includes('english')) return 'English Literature';
    if (lower.includes('social') || lower.includes('history')) return 'Social Science';
    if (lower.includes('computer')) return 'Computer Applications';
    return name;
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

  const handleSaveResults = async () => {
    setSaving(true);
    try {
      const termKey = examType.toLowerCase().includes('mid') || examType.toLowerCase().includes('unit') || examType.toLowerCase().includes('quarter')
        ? 'Term-1'
        : 'Term-2';

      const termName = termKey === 'Term-1' ? "Term-1 Examinations (Mid-Term)" : "Term-2 Examinations (Final Exam)";

      const savePromises = students.map(async (st) => {
        let currentResults: any = {};
        try {
          const res = await API.get(`/api/admin/student-admin/results/${st.studentId}`);
          currentResults = res.data?.data || {};
        } catch (e) {
          console.warn(`Could not fetch results for student ${st.name}, initializing new.`, e);
        }

        // Initialize term if it doesn't exist
        if (!currentResults[termKey]) {
          currentResults[termKey] = {
            termName,
            overallGpa: "0.0 / 10",
            grade: "F",
            totalMarks: "0 / 500",
            status: "FAILED",
            subjects: [
              { name: "Mathematics", marks: 0, maxMarks: 100, grade: "F", remarks: "Needs Improvement" },
              { name: "Science & Tech", marks: 0, maxMarks: 100, grade: "F", remarks: "Needs Improvement" },
              { name: "English Literature", marks: 0, maxMarks: 100, grade: "F", remarks: "Needs Improvement" },
              { name: "Social Science", marks: 0, maxMarks: 100, grade: "F", remarks: "Needs Improvement" },
              { name: "Computer Applications", marks: 0, maxMarks: 100, grade: "F", remarks: "Needs Improvement" }
            ]
          };
        }

        const termData = currentResults[termKey];
        const targetSubjectName = matchSubjectName(st.subjectName);
        
        // Find subject or append if not exists
        let subjectIndex = termData.subjects.findIndex((sub: any) => matchSubjectName(sub.name) === targetSubjectName);
        const marksNum = Number(st.marksObtained) || 0;
        const gradeDetails = getGradeDetails(marksNum);

        const currentNavName = localStorage.getItem('userName') || 'Faculty';
        const currentNavRole = (localStorage.getItem('role') || 'Teacher').replace('-', ' ').toUpperCase();
        const evaluatorBy = `${currentNavName} (${currentNavRole})`;
        const baseRemark = (st.remark || gradeDetails.remarks).trim();
        const formattedRemark = baseRemark.includes('— by') ? baseRemark : `${baseRemark} — by ${evaluatorBy}`;

        const newSubjectEntry = {
          name: targetSubjectName,
          marks: marksNum,
          maxMarks: st.maxMarks,
          grade: gradeDetails.grade,
          remarks: formattedRemark,
          evaluatedBy: evaluatorBy
        };

        if (subjectIndex >= 0) {
          termData.subjects[subjectIndex] = newSubjectEntry;
        } else {
          termData.subjects.push(newSubjectEntry);
        }

        // Recalculate term metrics
        const totalMarksSum = termData.subjects.reduce((sum: number, sub: any) => sum + (Number(sub.marks) || 0), 0);
        const totalMaxMarksSum = termData.subjects.reduce((sum: number, sub: any) => sum + (Number(sub.maxMarks) || 100), 0);
        const avgPct = totalMaxMarksSum > 0 ? (totalMarksSum / totalMaxMarksSum) * 100 : 0;
        const overallGpa = (avgPct / 10).toFixed(1);
        const overallGradeDetails = getGradeDetails(avgPct);

        termData.totalMarks = `${totalMarksSum} / ${totalMaxMarksSum}`;
        termData.overallGpa = `${overallGpa} / 10`;
        termData.grade = overallGradeDetails.grade;
        termData.status = avgPct >= 40 ? "PASSED" : "FAILED";

        // Save back to DB
        await API.post(`/api/admin/student-admin/results/${st.studentId}`, {
          results: currentResults
        });
      });

      await Promise.all(savePromises);

      const teacherName = localStorage.getItem('userName') || 'Subject Teacher (Mathematics)';
      setStudents(prev => prev.map(st => ({ ...st, isSubmitted: true })));

      // Update Order status if matching
      const activeOrder = (examOrders || []).find(
        o => o.className === selectedClass && o.section === selectedSection
      );
      if (activeOrder) {
        const updated = examOrders.map(o => o.id === activeOrder.id ? { ...o, status: 'SUBMITTED' } : o);
        setExamOrders(updated);
      }

      if (window.showToast) {
        window.showToast(`✅ Exam Results for Class ${selectedClass}-${selectedSection} (${examType}) published by ${teacherName}!`, 'success');
      } else {
        alert(`✅ Exam Results for Class ${selectedClass}-${selectedSection} (${examType}) saved successfully!`);
      }
    } catch (err: any) {
      console.error("Error saving results", err);
      alert("Error saving exam results: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };


  // CSV Export Utility
  const handleExportCSV = () => {
    const headers = ['Roll Number', 'Student Name', 'Class', 'Section', 'Subject', 'Subject Code', 'Max Marks', 'Marks Obtained', 'Grade', 'Teacher Remark'];
    const rows = students.map(st => [
      st.rollNumber,
      st.name,
      st.className,
      st.section,
      st.subjectName,
      st.subjectCode,
      st.maxMarks,
      st.marksObtained,
      st.grade,
      st.remark
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Exam_Results_Class_${selectedClass}_${selectedSection}_${examType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = students.filter(st =>
    st.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    st.rollNumber.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="dashboard-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
          
          {/* Header Banner - Ultra Crisp in Light & Dark Mode */}
          <div style={{
            background: 'linear-gradient(135deg, #4338ca 0%, #3b82f6 100%)',
            borderRadius: '20px',
            padding: '28px 32px',
            color: '#ffffff',
            marginBottom: '24px',
            boxShadow: '0 12px 32px rgba(67, 56, 202, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-white/20 border border-white/30 rounded-full text-xs font-black tracking-wider uppercase text-white shadow-xs">
                  📐 Specialized Subject Marks Entry
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <FiAward className="text-amber-300" /> Subject Exam Results Upload
              </h1>
              <p className="text-indigo-100 text-sm mt-1 font-medium">
                Enter and update exam marks strictly for your specialized subject (<strong>{subjectName}</strong>) across assigned timetable classes.
              </p>
            </div>
            
            <button
              onClick={handleExportCSV}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 border border-emerald-400"
            >
              <FiDownload size={16} /> Export Results (CSV)
            </button>
          </div>

          {/* Controls Bar - Light Mode & Dark Mode Compliant */}
          <div className="bg-[var(--card-bg)] p-5 rounded-2xl shadow-sm border border-[var(--border-color)] mb-6 flex flex-wrap gap-4 items-end">
            <div className="w-[160px]">
              <label className="block text-xs font-black text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Assigned Class *</label>
              <select
                value={selectedClass}
                onChange={e => {
                  setSelectedClass(e.target.value);
                  setSelectedSection('');
                  setSubjectName('');
                  setSubjectCode('');
                }}
                className="w-full px-3.5 py-2.5 bg-[var(--input-bg)] text-[var(--text-main)] border-2 border-[var(--border-color)] rounded-xl text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">Select Class...</option>
                {uniqueClasses.map(cls => (
                  <option key={cls} value={cls}>
                    {cls.toLowerCase().startsWith('class') ? cls : `Class ${cls}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-[140px]">
              <label className="block text-xs font-black text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Section *</label>
              <select
                value={selectedSection}
                onChange={e => {
                  setSelectedSection(e.target.value);
                  setSubjectName('');
                  setSubjectCode('');
                }}
                className="w-full px-3.5 py-2.5 bg-[var(--input-bg)] text-[var(--text-main)] border-2 border-[var(--border-color)] rounded-xl text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none"
                disabled={!selectedClass}
              >
                <option value="">Select Section...</option>
                {availableSections.map(sec => (
                  <option key={sec} value={sec}>Section {sec}</option>
                ))}
              </select>
            </div>

            <div className="w-[220px]">
              <label className="block text-xs font-black text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Select Subject *</label>
              <select
                value={subjectName}
                onChange={e => {
                  const val = e.target.value;
                  setSubjectName(val);
                  const selectedSub = uniqueSubjects.find((s: any) => s.name === val);
                  if (selectedSub) {
                    setSubjectCode(selectedSub.code);
                  } else {
                    setSubjectCode(`SUB-${selectedClass}${selectedSection}`);
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-[var(--input-bg)] text-[var(--text-main)] border-2 border-[var(--border-color)] rounded-xl text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none"
                disabled={!selectedSection}
              >
                <option value="">Select Subject...</option>
                {uniqueSubjects.map((sub: any) => (
                  <option key={sub.name} value={sub.name}>{sub.name}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-black text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Exam Type *</label>
              <select
                value={examType}
                onChange={e => setExamType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--input-bg)] text-[var(--text-main)] border-2 border-[var(--border-color)] rounded-xl text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Mid-Term Examination 2026">Mid-Term Examination 2026</option>
                <option value="Unit Test 1 (Quarterly)">Unit Test 1 (Quarterly)</option>
                <option value="Final Board Pre-Mock Exam">Final Board Pre-Mock Exam</option>
                <option value="Annual Examination 2026">Annual Examination 2026</option>
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-black text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Search Student</label>
              <div className="relative">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
                <input
                  type="text"
                  placeholder="Student name or roll no..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--input-bg)] text-[var(--text-main)] border-2 border-[var(--border-color)] rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* TEACHER ADMIN RESULT UPLOAD AUTHORIZATION CARD */}
          {(() => {
            const activeOrder = (examOrders || []).find(
              o => o.className === selectedClass && 
                   o.section === selectedSection && 
                   (o.examTerm === examType || o.subjectName?.toLowerCase().includes('math'))
            );
            return activeOrder ? (
              <div className="bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-300 dark:border-indigo-800 p-5 rounded-2xl mb-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-xs ${
                        activeOrder.status === 'SUBMITTED' 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-indigo-700 text-white animate-pulse'
                      }`}>
                        {activeOrder.status === 'SUBMITTED' ? '✅ MARKS SUBMITTED TO TEACHER ADMIN' : '🟢 AUTHORIZED BY TEACHER ADMIN (OPEN FOR MARKS ENTRY)'}
                      </span>
                      <span className="text-xs text-indigo-900 dark:text-indigo-200 font-extrabold">
                        Order ID: {activeOrder.id}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-indigo-950 dark:text-indigo-100 mt-2">
                      Result Entry Request: {activeOrder.examTerm} &bull; Class {activeOrder.className}-{activeOrder.section}
                    </h3>
                    <p className="text-xs text-indigo-900 dark:text-indigo-300 mt-1 font-bold">
                      📋 Instructions: {activeOrder.instructions} | Published by <strong>{activeOrder.createdBy}</strong>
                    </p>
                  </div>
                  <div className="text-right whitespace-nowrap bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800">
                    <div className="text-xs font-black text-slate-500 uppercase tracking-wider">Submission Deadline</div>
                    <div className="text-sm font-black text-rose-600 dark:text-rose-400">⏰ {activeOrder.dueDate}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800 p-4 px-6 rounded-2xl mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⏳</span>
                  <div>
                    <div className="font-black text-amber-900 dark:text-amber-300 text-sm">
                      Awaiting Teacher Admin Authorization
                    </div>
                    <div className="text-xs text-amber-800 dark:text-amber-400 font-bold">
                      Teacher Admin has not yet published an active Result Entry Order for {examType} (Class {selectedClass}-{selectedSection}). You can enter draft marks below.
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1 bg-amber-600 text-white text-xs font-black rounded-full uppercase tracking-wider shadow-xs">
                  Pending Order
                </span>
              </div>
            );
          })()}

          {/* Results Table - 100% High Contrast for Light & Dark Modes */}
          <div className="bg-[var(--card-bg)] text-[var(--text-main)] rounded-2xl shadow-sm border border-[var(--border-color)] overflow-hidden">
            <div className="p-5 border-b border-[var(--border-color)] flex flex-wrap justify-between items-center gap-4 bg-slate-100/80 dark:bg-slate-900/80">
              <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FiBookOpen className="text-indigo-600" size={18} />
                <span>Class {selectedClass}-{selectedSection}</span> &bull; <span>{subjectName}</span> &bull; <span className="text-indigo-600 dark:text-indigo-400 font-black">{examType}</span>
              </div>
              <button
                onClick={handleSaveResults}
                disabled={saving || filteredStudents.length === 0}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 border border-indigo-500"
              >
                {saving ? <FiLoader className="animate-spin" size={16} /> : <FiSave size={16} />}
                {saving ? 'Publishing Marks...' : 'Save & Publish Exam Results'}
              </button>
            </div>

            {loading ? (
              <div className="p-16 text-center text-slate-500 flex flex-col items-center">
                <FiLoader className="animate-spin text-indigo-600 mb-3" size={32} />
                <p className="font-bold text-base">Loading student class list for marks entry...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-200/90 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-black uppercase tracking-wider border-b-2 border-indigo-200 dark:border-indigo-900">
                      <th className="px-6 py-4 font-black w-24">Roll No</th>
                      <th className="px-6 py-4 font-black">Student Name</th>
                      <th className="px-6 py-4 font-black w-32">Subject Code</th>
                      <th className="px-6 py-4 font-black w-28">Max Marks</th>
                      <th className="px-6 py-4 font-black w-36">Marks Obtained</th>
                      <th className="px-6 py-4 font-black w-32">Subject Grade</th>
                      <th className="px-6 py-4 font-black">Overall Performance</th>
                      <th className="px-6 py-4 font-black text-center">Full Report Card</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)] text-sm">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((st) => (
                        <tr key={st.studentId} className="hover:bg-indigo-50/50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-black text-slate-900 dark:text-slate-100">
                            <span className="bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700">{st.rollNumber}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 bg-indigo-600 text-white rounded-xl font-black text-sm flex items-center justify-center shadow-xs">
                                {(st.name || 'S').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900 dark:text-white text-base">{st.name}</div>
                                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{st.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-black text-indigo-700 dark:text-indigo-400">
                            {st.subjectCode}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-black text-slate-700 dark:text-slate-300">
                            {st.maxMarks}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={st.marksObtained}
                              onChange={e => handleMarksChange(st.studentId, e.target.value)}
                              className="w-24 px-3 py-2 border-2 border-indigo-300 dark:border-indigo-700 rounded-xl font-black text-slate-900 dark:text-white bg-white dark:bg-slate-900 text-center outline-none focus:ring-2 focus:ring-indigo-600 text-base shadow-xs"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3.5 py-1.5 rounded-full text-xs font-black border shadow-xs ${
                              st.grade.startsWith('A+') ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                              st.grade.startsWith('A') ? 'bg-teal-100 text-teal-900 border-teal-300' :
                              st.grade.startsWith('B') ? 'bg-blue-100 text-blue-900 border-blue-300' :
                              st.grade.startsWith('C') ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-rose-100 text-rose-900 border-rose-300'
                            }`}>
                              {st.grade}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              <div>Marks: <strong className="text-indigo-600 dark:text-indigo-400">{st.totalMarks || '–'}</strong></div>
                              <div>GPA: <strong className="text-emerald-600 dark:text-emerald-400">{st.overallGpa || '–'}</strong></div>
                              <span className={`inline-block px-2 py-0.5 mt-1 rounded-full text-[10px] font-black ${
                                st.status === 'PASSED' ? 'bg-emerald-100 text-emerald-800' : st.status === 'FAILED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {st.status || 'PENDING'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => setViewingFullReportCardModal({ isOpen: true, student: st })}
                              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 mx-auto"
                            >
                              👁️ View Report Card
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-bold">
                          No students found for this class.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Added Save Button at the Bottom */}
            {!loading && filteredStudents.length > 0 && (
              <div className="p-5 border-t border-[var(--border-color)] bg-slate-100/80 dark:bg-slate-900/80 flex justify-end">
                <button
                  onClick={handleSaveResults}
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 border border-indigo-500"
                >
                  {saving ? <FiLoader className="animate-spin" size={16} /> : <FiSave size={16} />}
                  {saving ? 'Publishing Marks...' : 'Save & Publish Exam Results'}
                </button>
              </div>
            )}

          </div>
        </div>

        {/* ── View Full Student Report Card Modal ── */}
        {viewingFullReportCardModal && viewingFullReportCardModal.isOpen && (() => {
          const st = viewingFullReportCardModal.student;
          const subjects = st.subjectsList || [];

          return (
            <div onClick={() => setViewingFullReportCardModal(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
              <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '20px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#4338ca', color: 'white', padding: '2px 8px', borderRadius: '6px' }}>OFFICIAL ACADEMIC REPORT CARD</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>{examType}</span>
                    </div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: 'var(--text-main)' }}>
                      {st.name}
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                      Roll No: <strong style={{ color: '#4338ca' }}>{st.rollNumber}</strong> | Class: <strong>Class {selectedClass}-{selectedSection}</strong> | Email: <strong>{st.email}</strong>
                    </p>
                  </div>
                  <button onClick={() => setViewingFullReportCardModal(null)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                </div>

                {/* Performance Summary Banner */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', backgroundColor: 'var(--input-bg)', padding: '16px', borderRadius: '14px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Score</span>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-main)', marginTop: '2px' }}>
                      {st.totalMarks || '0 / 500'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Overall GPA</span>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#10b981', marginTop: '2px' }}>
                      {st.overallGpa || '0.0 / 10'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Overall Grade</span>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#8b5cf6', marginTop: '2px' }}>
                      {st.overallGrade || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Status</span>
                    <div style={{ marginTop: '2px' }}>
                      <span className={`badge ${st.status === 'PASSED' ? 'approved' : st.status === 'FAILED' ? 'danger' : 'pending'}`}>
                        {st.status || 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subject Details Table */}
                <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: '800' }}>📚 All Subjects Marks &amp; Grades Breakdown</h4>
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
                            <td><span style={{ fontSize: '15px', fontWeight: '800', color: '#4338ca' }}>{sub.marks}</span></td>
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
                    No subject marks entered yet for {examType}.
                  </div>
                )}

                {/* Footer Controls */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => window.print()}
                    style={{ flex: 1, padding: '11px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    🖨️ Print / Download Report Card
                  </button>
                  <button
                    onClick={() => setViewingFullReportCardModal(null)}
                    style={{ flex: 1, padding: '11px', backgroundColor: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Close
                  </button>
                </div>

              </div>
            </div>
          );
        })()}

      </main>
    </div>
  );
};

export default TeacherResultsManagement;
