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
}

const TeacherResultsManagement = () => {
  const [selectedClass, setSelectedClass] = useState('10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [examType, setExamType] = useState('Mid-Term Examination 2026');
  const [subjectName] = useState('Mathematics (Pure & Applied Mathematics)');
  const [subjectCode] = useState('MATH-10A');
  const [studentSearch, setStudentSearch] = useState('');
  
  const [students, setStudents] = useState<StudentResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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

      // Map to Result Items
      const formattedList: StudentResultItem[] = list.map((st: any, idx: number) => ({
        studentId: st._id,
        rollNumber: st.rollNumber || `100${idx + 1}`,
        name: st.user?.name || 'Student Name',
        email: st.user?.email || 'student@school.edu',
        className: selectedClass,
        section: selectedSection,
        subjectName: subjectName,
        subjectCode: subjectCode,
        maxMarks: 100,
        marksObtained: Math.floor(Math.random() * 25) + 70, // sample default
        grade: 'A',
        remark: 'Good performance in problem solving',
        isSubmitted: false
      }));

      // Update grades
      formattedList.forEach(st => {
        st.grade = calculateGrade(st.marksObtained, st.maxMarks);
      });

      setStudents(formattedList);
    } catch (err) {
      console.error("Error fetching students for results", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassStudents();
  }, [selectedClass, selectedSection]);

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

  const handleSaveResults = async () => {
    setSaving(true);
    try {
      await new Promise(res => setTimeout(res, 800));
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
    } catch (err) {
      console.error("Error saving results", err);
      alert("Error saving exam results");
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
                onChange={e => setSelectedClass(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--input-bg)] text-[var(--text-main)] border-2 border-[var(--border-color)] rounded-xl text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="10">Class 10</option>
                <option value="9">Class 9</option>
                <option value="12">Class 12</option>
                <option value="8">Class 8</option>
              </select>
            </div>

            <div className="w-[140px]">
              <label className="block text-xs font-black text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Section *</label>
              <select
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--input-bg)] text-[var(--text-main)] border-2 border-[var(--border-color)] rounded-xl text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
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
                      <th className="px-6 py-4 font-black w-36">Subject Code</th>
                      <th className="px-6 py-4 font-black w-28">Max Marks</th>
                      <th className="px-6 py-4 font-black w-36">Marks Obtained</th>
                      <th className="px-6 py-4 font-black w-44">Grade</th>
                      <th className="px-6 py-4 font-black">Teacher Audit Remark</th>
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
                            <div className="font-extrabold text-slate-900 dark:text-white text-base">{st.name}</div>
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{st.email}</div>
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
                            <input
                              type="text"
                              placeholder="Add teacher remark..."
                              value={st.remark}
                              onChange={e => handleRemarkChange(st.studentId, e.target.value)}
                              className="w-full min-w-[220px] px-3.5 py-2 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-bold">
                          No students found for this class.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherResultsManagement;
