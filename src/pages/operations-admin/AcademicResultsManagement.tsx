import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import AcademicTabs from '../../components/AcademicTabs';
import { FiAward, FiSearch, FiEdit2, FiX, FiCheck, FiLoader, FiTrendingUp, FiBookOpen, FiActivity, FiUsers } from 'react-icons/fi';
import { useSharedState } from '../../hooks/useSharedState';
import API from '../../api/axios';

const AcademicResultsManagement = () => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');

  // Shared state for storing result records
  const [resultsData, setResultsData] = useSharedState<Record<string, any>>('erp_results', {});

  // Modal control states
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedTerm, setSelectedTerm] = useState('Term-1');

  // Form states for subject marks
  const [mathMarks, setMathMarks] = useState(90);
  const [scienceMarks, setScienceMarks] = useState(90);
  const [englishMarks, setEnglishMarks] = useState(90);
  const [socialMarks, setSocialMarks] = useState(90);
  const [computerMarks, setComputerMarks] = useState(90);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/admin/student-admin/students');
      const dbStudents = response.data.data || [];
      
      const loadedResults: Record<string, any> = {};
      dbStudents.forEach((s: any) => {
        if (s.results) {
          loadedResults[s._id] = s.results;
        }
      });
      setResultsData(loadedResults);

      let mappedStudents = dbStudents.map((s: any) => ({
        id: s._id,
        _id: s._id,
        name: s.user?.name || 'Unknown',
        email: s.user?.email || '',
        class: s.className || '',
        section: s.section || '',
        roll: s.rollNumber || '',
      }));

      // Fallback if no students in DB
      if (mappedStudents.length === 0) {
        mappedStudents = [
          { id: 'S001', _id: 'S001', name: 'Rahul Verma', email: 'rahul.v@student.com', class: '10th', section: 'A', roll: '01' },
          { id: 'S002', _id: 'S002', name: 'Priya Das', email: 'priya.d@student.com', class: '9th', section: 'B', roll: '12' },
          { id: 'S003', _id: 'S003', name: 'Vikram Singh', email: 'vikram.s@student.com', class: '10th', section: 'A', roll: '05' },
          { id: 'S004', _id: 'S004', name: 'Neha Sharma', email: 'neha.s@student.com', class: '8th', section: 'C', roll: '18' },
          { id: 'S005', _id: 'S005', name: 'Arjun Nair', email: 'arjun.n@student.com', class: '9th', section: 'A', roll: '03' }
        ];
      }

      setStudents(mappedStudents);
      setFilteredStudents(mappedStudents);
    } catch (err) {
      console.error("Error loading students, fallback to dummy data:", err);
      const dummy = [
        { id: 'S001', _id: 'S001', name: 'Rahul Verma', email: 'rahul.v@student.com', class: '10th', section: 'A', roll: '01' },
        { id: 'S002', _id: 'S002', name: 'Priya Das', email: 'priya.d@student.com', class: '9th', section: 'B', roll: '12' },
        { id: 'S003', _id: 'S003', name: 'Vikram Singh', email: 'vikram.s@student.com', class: '10th', section: 'A', roll: '05' },
        { id: 'S004', _id: 'S004', name: 'Neha Sharma', email: 'neha.s@student.com', class: '8th', section: 'C', roll: '18' },
        { id: 'S005', _id: 'S005', name: 'Arjun Nair', email: 'arjun.n@student.com', class: '9th', section: 'A', roll: '03' }
      ];
      setStudents(dummy);
      setFilteredStudents(dummy);
    } finally {
      setLoading(false);
    }
  };

  const cleanClass = (cls: any) => {
    if (!cls) return '';
    return cls.toString().replace(/class/i, '').replace(/th|st|nd|rd/i, '').trim();
  };

  // Run filters
  useEffect(() => {
    let result = students;
    if (classFilter !== 'all') {
      const targetCls = cleanClass(classFilter);
      result = result.filter(s => cleanClass(s.class) === targetCls);
    }
    if (sectionFilter !== 'all') {
      result = result.filter(s => (s.section || '').toUpperCase() === sectionFilter.toUpperCase());
    }
    if (searchTerm) {
      result = result.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (s.roll && s.roll.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredStudents(result);
  }, [searchTerm, classFilter, sectionFilter, students]);

  // Fallback default grades with 3 Terms (Term-1, Term-2, Final) initialized to 0 marks until Admin updates
  const createDefaultZeroTerm = (termName: string) => ({
    termName,
    overallGpa: "0.0 / 10",
    grade: "F",
    totalMarks: "0 / 500",
    status: "PENDING",
    subjects: [
      { name: "Mathematics", marks: 0, maxMarks: 100, grade: "F", remarks: "Pending Update" },
      { name: "Science & Tech", marks: 0, maxMarks: 100, grade: "F", remarks: "Pending Update" },
      { name: "English Literature", marks: 0, maxMarks: 100, grade: "F", remarks: "Pending Update" },
      { name: "Social Science", marks: 0, maxMarks: 100, grade: "F", remarks: "Pending Update" },
      { name: "Computer Applications", marks: 0, maxMarks: 100, grade: "F", remarks: "Pending Update" }
    ]
  });

  const getOrInitializeStudentResults = (studentId: string) => {
    const studentResults = resultsData[studentId];
    if (studentResults && Object.keys(studentResults).length > 0) return studentResults;

    return {
      'Term-1': createDefaultZeroTerm("First Term Examinations"),
      'Term-2': createDefaultZeroTerm("Second Term Examinations"),
      'Final': createDefaultZeroTerm("Final Term Examinations")
    };
  };

  const handleEditGradesClick = (student: any) => {
    setSelectedStudent(student);
    const studentResults = getOrInitializeStudentResults(student.id);
    const termResults = studentResults[selectedTerm] || null;

    if (termResults && termResults.subjects) {
      const getMark = (subjName: string) => {
        const found = termResults.subjects.find((s: any) => s.name === subjName);
        return found ? Number(found.marks) || 0 : 0;
      };
      setMathMarks(getMark("Mathematics"));
      setScienceMarks(getMark("Science & Tech"));
      setEnglishMarks(getMark("English Literature"));
      setSocialMarks(getMark("Social Science"));
      setComputerMarks(getMark("Computer Applications"));
    } else {
      setMathMarks(0);
      setScienceMarks(0);
      setEnglishMarks(0);
      setSocialMarks(0);
      setComputerMarks(0);
    }
    setShowModal(true);
  };

  // Track term changes within modal
  useEffect(() => {
    if (!selectedStudent) return;
    const studentResults = getOrInitializeStudentResults(selectedStudent.id);
    const termResults = studentResults[selectedTerm] || null;

    if (termResults && termResults.subjects) {
      const getMark = (subjName: string) => {
        const found = termResults.subjects.find((s: any) => s.name === subjName);
        return found ? Number(found.marks) || 0 : 0;
      };
      setMathMarks(getMark("Mathematics"));
      setScienceMarks(getMark("Science & Tech"));
      setEnglishMarks(getMark("English Literature"));
      setSocialMarks(getMark("Social Science"));
      setComputerMarks(getMark("Computer Applications"));
    } else {
      setMathMarks(0);
      setScienceMarks(0);
      setEnglishMarks(0);
      setSocialMarks(0);
      setComputerMarks(0);
    }
  }, [selectedTerm, selectedStudent]);

  const getGradeFromMarks = (m: number) => {
    if (m === 0) return { grade: "F", remarks: "Pending Update" };
    if (m >= 95) return { grade: "O", remarks: "Outstanding" };
    if (m >= 85) return { grade: "A+", remarks: "Excellent" };
    if (m >= 75) return { grade: "A", remarks: "Very Good" };
    if (m >= 60) return { grade: "B+", remarks: "Good" };
    if (m >= 50) return { grade: "B", remarks: "Average" };
    if (m >= 40) return { grade: "C", remarks: "Pass" };
    return { grade: "F", remarks: "Needs Improvement" };
  };

  const handleSaveGrades = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const scores = [mathMarks, scienceMarks, englishMarks, socialMarks, computerMarks];
    const totalScore = scores.reduce((a, b) => a + b, 0);
    const avgScore = totalScore / 5;
    const gpa = (avgScore / 10).toFixed(1);
    const overallGrade = getGradeFromMarks(avgScore).grade;

    let termTitle = "First Term Examinations";
    if (selectedTerm === 'Term-2') termTitle = "Second Term Examinations";
    if (selectedTerm === 'Final') termTitle = "Final Term Examinations";

    const termResults = {
      termName: termTitle,
      overallGpa: `${gpa} / 10`,
      grade: overallGrade,
      totalMarks: `${totalScore} / 500`,
      status: avgScore >= 40 ? "PASSED" : (totalScore === 0 ? "PENDING" : "FAILED"),
      subjects: [
        { name: "Mathematics", marks: mathMarks, maxMarks: 100, ...getGradeFromMarks(mathMarks) },
        { name: "Science & Tech", marks: scienceMarks, maxMarks: 100, ...getGradeFromMarks(scienceMarks) },
        { name: "English Literature", marks: englishMarks, maxMarks: 100, ...getGradeFromMarks(englishMarks) },
        { name: "Social Science", marks: socialMarks, maxMarks: 100, ...getGradeFromMarks(socialMarks) },
        { name: "Computer Applications", marks: computerMarks, maxMarks: 100, ...getGradeFromMarks(computerMarks) }
      ]
    };

    const studentCurrentResults = resultsData[selectedStudent.id] || {};
    const updatedStudentResults = {
      ...studentCurrentResults,
      [selectedTerm]: termResults
    };

    try {
      await API.post(`/api/admin/student-admin/results/${selectedStudent.id}`, {
        results: updatedStudentResults
      });

      const updatedResults = {
        ...resultsData,
        [selectedStudent.id]: updatedStudentResults
      };

      setResultsData(updatedResults);
      alert(`Exam grades saved & published successfully for ${selectedStudent.name} (${selectedTerm})!`);
      setShowModal(false);
    } catch (err: any) {
      console.error("Error saving grades:", err);
      alert(err.response?.data?.message || "Failed to save grades in database");
    }
  };

  // Helper stats for overview cards
  const totalGradedCount = filteredStudents.length;
  const averageGPA = (filteredStudents.reduce((acc, curr) => {
    const res = getOrInitializeStudentResults(curr.id);
    const gpaVal = parseFloat(res['Term-1']?.overallGpa || '9.0');
    return acc + gpaVal;
  }, 0) / (filteredStudents.length || 1)).toFixed(2);

  const classesList = ['Nursery', 'KG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        
        {/* Main Wrapper */}
        <div className="p-3.5 sm:p-6 md:p-8 max-w-[1400px] mx-auto w-full max-w-full overflow-x-hidden">
          <AcademicTabs />
          
          {/* Custom Vibrant Header */}
          <div className="relative overflow-hidden rounded-3xl p-4 sm:p-8 mb-6 border" style={{ 
            background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
            border: 'none',
            color: '#ffffff',
            boxShadow: '0 10px 30px rgba(59, 130, 246, 0.15)'
          }}>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
              <div>
                <span style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  padding: '6px 12px',
                  borderRadius: '100px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Academic Portal</span>
                <h1 className="text-xl sm:text-3xl font-black mt-2 mb-1 text-white tracking-tight">
                  Student Exam Results Management
                </h1>
                <p className="text-xs sm:text-sm text-white/85 m-0 font-medium">
                  Easily view, input, and modify Mid-Term & Final Examination marks for all registered students.
                </p>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md flex items-center gap-3.5 w-fit">
                <FiAward size={36} className="text-amber-400 shrink-0" />
                <div>
                  <h4 className="m-0 text-sm sm:text-base font-extrabold">Academic Year</h4>
                  <p className="m-0 text-xs text-white/75">2025 - 2026</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 mb-6 sm:mb-8">
            
            <div className="stat-card bg-[var(--card-bg)] rounded-2xl p-4 sm:p-5 border border-[var(--border-color)] flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                <FiUsers size={22} />
              </div>
              <div>
                <h4 className="m-0 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Graded Students</h4>
                <p className="text-xl sm:text-2xl font-black text-[var(--text-main)] mt-1 mb-0">{totalGradedCount}</p>
              </div>
            </div>

            <div className="stat-card bg-[var(--card-bg)] rounded-2xl p-4 sm:p-5 border border-[var(--border-color)] flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <FiTrendingUp size={22} />
              </div>
              <div>
                <h4 className="m-0 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Average Term GPA</h4>
                <p className="text-xl sm:text-2xl font-black text-[var(--text-main)] mt-1 mb-0">{averageGPA} / 10</p>
              </div>
            </div>

            <div className="stat-card bg-[var(--card-bg)] rounded-2xl p-4 sm:p-5 border border-[var(--border-color)] flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <FiActivity size={22} />
              </div>
              <div>
                <h4 className="m-0 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Passing Rate</h4>
                <p className="text-xl sm:text-2xl font-black text-[var(--text-main)] mt-1 mb-0">100%</p>
              </div>
            </div>

          </div>

          {/* Search, filters, and records table */}
          <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--border-color)] p-3.5 sm:p-6 shadow-sm mb-8 max-w-full overflow-x-auto">
            
            {/* Filter controls & Term Selector */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-5 border-b border-[var(--border-color)]">
              <div className="flex flex-wrap items-center gap-3 flex-1 w-full lg:w-auto">
                <div className="relative w-full sm:w-[260px] shrink-0">
                  <FiSearch style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Search student or roll..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-[var(--border-color)] rounded-xl bg-[var(--input-bg)] text-[var(--text-main)] text-xs sm:text-sm outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select 
                    value={classFilter} 
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="flex-1 sm:flex-none px-3 py-2.5 border border-[var(--border-color)] rounded-xl bg-[var(--input-bg)] text-[var(--text-main)] text-xs sm:text-sm font-bold outline-none cursor-pointer"
                  >
                    <option value="all">All Classes</option>
                    {classesList.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>

                  <select 
                    value={sectionFilter} 
                    onChange={(e) => setSectionFilter(e.target.value)}
                    className="flex-1 sm:flex-none px-3 py-2.5 border border-[var(--border-color)] rounded-xl bg-[var(--input-bg)] text-[var(--text-main)] text-xs sm:text-sm font-bold outline-none cursor-pointer"
                  >
                    <option value="all">All Sections</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              </div>

              {/* Term Selector Toggle */}
              <div className="flex p-1 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-color)] gap-1 w-full lg:w-auto overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setSelectedTerm('Term-1')}
                  className={`flex-1 lg:flex-none px-3 py-2 rounded-xl font-extrabold text-xs transition-all whitespace-nowrap ${
                    selectedTerm === 'Term-1' ? 'bg-indigo-600 text-white shadow-md' : 'text-[var(--text-muted)]'
                  }`}
                >
                  📝 First Term
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTerm('Term-2')}
                  className={`flex-1 lg:flex-none px-3 py-2 rounded-xl font-extrabold text-xs transition-all whitespace-nowrap ${
                    selectedTerm === 'Term-2' ? 'bg-indigo-600 text-white shadow-md' : 'text-[var(--text-muted)]'
                  }`}
                >
                  📘 Second Term
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTerm('Final')}
                  className={`flex-1 lg:flex-none px-3 py-2 rounded-xl font-extrabold text-xs transition-all whitespace-nowrap ${
                    selectedTerm === 'Final' ? 'bg-indigo-600 text-white shadow-md' : 'text-[var(--text-muted)]'
                  }`}
                >
                  🏅 Final Term
                </button>
              </div>
            </div>

            {/* Students results table showing ALL Subject Marks */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <FiLoader className="animate-spin" style={{ color: '#4f46e5', margin: '0 auto' }} size={40} />
                <p style={{ marginTop: '15px', color: 'var(--text-muted)', fontSize: '15px', fontWeight: '500' }}>Fetching database student records...</p>
              </div>
            ) : filteredStudents.length > 0 ? (
              <div className="overflow-x-auto w-full max-w-full">
                <table className="data-table w-full min-w-[720px]">
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '12px' }}>Roll No</th>
                      <th style={{ padding: '12px' }}>Student Name</th>
                      <th style={{ padding: '12px' }}>Class</th>
                      <th style={{ padding: '12px' }}>Math</th>
                      <th style={{ padding: '12px' }}>Science</th>
                      <th style={{ padding: '12px' }}>English</th>
                      <th style={{ padding: '12px' }}>SST</th>
                      <th style={{ padding: '12px' }}>CS</th>
                      <th style={{ padding: '12px' }}>Total</th>
                      <th style={{ padding: '12px' }}>GPA/Grade</th>
                      <th style={{ padding: '12px' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, idx) => {
                      const studentResults = getOrInitializeStudentResults(student.id);
                      const termData = studentResults[selectedTerm] || {};
                      const subjects = termData.subjects || [];

                      const getSubjectMark = (pat: string) => {
                        const sub = subjects.find((s: any) => (s.name || '').toLowerCase().includes(pat));
                        return sub ? Number(sub.marks) || 0 : '–';
                      };

                      const mathM = getSubjectMark('math');
                      const sciM = getSubjectMark('science');
                      const engM = getSubjectMark('english');
                      const sstM = getSubjectMark('social');
                      const csM = getSubjectMark('computer');

                      const totalStr = termData.totalMarks || '– / 500';
                      const gpaStr = termData.overallGpa ? `${termData.overallGpa.split(' ')[0]} (${termData.grade || 'N/A'})` : '–';
                      const statusVal = termData.status || 'PASSED';

                      return (
                        <tr key={student.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px', fontWeight: '800', color: 'var(--primary)' }}>{student.roll}</td>
                          <td style={{ padding: '12px', fontWeight: '700', color: 'var(--text-main)' }}>{student.name}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', fontWeight: '700' }}>
                              Class {student.class}-{student.section}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontWeight: '600' }}>{mathM}</td>
                          <td style={{ padding: '12px', fontWeight: '600' }}>{sciM}</td>
                          <td style={{ padding: '12px', fontWeight: '600' }}>{engM}</td>
                          <td style={{ padding: '12px', fontWeight: '600' }}>{sstM}</td>
                          <td style={{ padding: '12px', fontWeight: '600' }}>{csM}</td>
                          <td style={{ padding: '12px', fontWeight: '800', color: '#4f46e5' }}>{totalStr}</td>
                          <td style={{ padding: '12px', fontWeight: '800', color: '#10b981' }}>{gpaStr}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ 
                              padding: '3px 10px', 
                              borderRadius: '20px', 
                              fontSize: '10px', 
                              fontWeight: '900', 
                              textTransform: 'uppercase',
                              backgroundColor: statusVal === 'PASSED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: statusVal === 'PASSED' ? '#10b981' : '#ef4444'
                            }}>
                              {statusVal}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handleEditGradesClick(student)}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                backgroundColor: '#4f46e5',
                                color: '#ffffff',
                                border: 'none',
                                fontWeight: '700',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)'
                              }}
                            >
                              <FiEdit2 size={12} /> Input Grades
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <FiBookOpen size={48} style={{ margin: '0 auto 15px', color: 'var(--border-color)' }} />
                <h3 style={{ margin: '0 0 5px', color: 'var(--text-main)' }}>No Graded Students Found</h3>
                <p style={{ margin: 0, fontSize: '14px' }}>Add student profiles under Student Admin or change your search filters.</p>
              </div>
            )}

          </div>

        </div>

        {/* Beautiful Modal for Grading */}
        {showModal && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4" onClick={() => setShowModal(false)}>
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-4 sm:p-8 shadow-2xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)]" onClick={(e) => e.stopPropagation()}>
              
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border-color)]">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-main)', margin: 0 }}>
                    <FiAward className="text-indigo-600" /> Input Term Grades
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Student Name: <strong style={{ color: 'var(--text-main)' }}>{selectedStudent.name}</strong> | Roll No: {selectedStudent.roll}
                  </p>
                </div>
                <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }} className="hover:opacity-75">
                  <FiX size={24} />
                </button>
              </div>

              {/* Term Tab Selector */}
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                backgroundColor: 'rgba(0,0,0,0.02)', 
                padding: '6px', 
                borderRadius: '12px', 
                marginBottom: '24px' 
              }}>
                <button 
                  type="button"
                  onClick={() => setSelectedTerm('Term-1')}
                  style={{
                    flex: 1,
                    padding: '10px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer',
                    backgroundColor: selectedTerm === 'Term-1' ? '#4f46e5' : 'transparent',
                    color: selectedTerm === 'Term-1' ? '#fff' : 'var(--text-muted)',
                    transition: 'all 0.2s'
                  }}
                >
                  First Term
                </button>
                <button 
                  type="button"
                  onClick={() => setSelectedTerm('Term-2')}
                  style={{
                    flex: 1,
                    padding: '10px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer',
                    backgroundColor: selectedTerm === 'Term-2' ? '#4f46e5' : 'transparent',
                    color: selectedTerm === 'Term-2' ? '#fff' : 'var(--text-muted)',
                    transition: 'all 0.2s'
                  }}
                >
                  Second Term
                </button>
                <button 
                  type="button"
                  onClick={() => setSelectedTerm('Final')}
                  style={{
                    flex: 1,
                    padding: '10px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer',
                    backgroundColor: selectedTerm === 'Final' ? '#4f46e5' : 'transparent',
                    color: selectedTerm === 'Final' ? '#fff' : 'var(--text-muted)',
                    transition: 'all 0.2s'
                  }}
                >
                  Final Term
                </button>
              </div>

              <form onSubmit={handleSaveGrades} className="space-y-4">
                
                <h4 style={{ 
                  margin: '0 0 16px', 
                  fontSize: '12px', 
                  fontWeight: '800', 
                  textTransform: 'uppercase', 
                  color: 'var(--text-muted)', 
                  letterSpacing: '0.08em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <FiBookOpen /> Subject Wise Marks (Max 100)
                </h4>

                <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {[
                    { label: "Mathematics", val: mathMarks, set: setMathMarks, color: '#4f46e5' },
                    { label: "Science & Tech", val: scienceMarks, set: setScienceMarks, color: '#10b981' },
                    { label: "English Literature", val: englishMarks, set: setEnglishMarks, color: '#f59e0b' },
                    { label: "Social Science", val: socialMarks, set: setSocialMarks, color: '#ec4899' },
                    { label: "Computer Applications", val: computerMarks, set: setComputerMarks, color: '#06b6d4' }
                  ].map((subject, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      gap: '15px',
                      padding: '10px 14px',
                      backgroundColor: 'rgba(0,0,0,0.01)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{subject.label}</span>
                        {/* Score Indicator Meter */}
                        <div style={{ 
                          width: '120px', 
                          height: '5px', 
                          backgroundColor: 'rgba(0,0,0,0.05)', 
                          borderRadius: '10px', 
                          marginTop: '6px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${subject.val}%`, 
                            height: '100%', 
                            backgroundColor: subject.color, 
                            borderRadius: '10px' 
                          }}></div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input 
                          type="number" min="0" max="100" required
                          value={subject.val}
                          onChange={(e) => subject.set(Number(e.target.value))}
                          style={{ 
                            width: '72px', 
                            padding: '8px 10px', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: '8px', 
                            backgroundColor: 'var(--input-bg)', 
                            color: 'var(--text-main)', 
                            textAlign: 'center',
                            fontWeight: 'bold',
                            fontSize: '14px'
                          }}
                        />
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>/ 100</span>
                      </div>
                    </div>
                  ))}

                </div>

                <div className="flex gap-3 pt-6 border-t border-[var(--border-color)] mt-8">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-5 py-3 border rounded-xl transition-all font-bold text-sm"
                    style={{ color: 'var(--text-main)', borderColor: 'var(--border-color)', backgroundColor: 'var(--panel-bg)' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg font-bold text-sm"
                    style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', border: 'none' }}
                  >
                    Save & Publish Grades
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AcademicResultsManagement;
