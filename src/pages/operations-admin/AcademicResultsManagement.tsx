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

  // Fallback default grades
  const getOrInitializeStudentResults = (studentId: string) => {
    const studentResults = resultsData[studentId];
    if (studentResults) return studentResults;

    // Default mock template
    const defaultT1 = {
      termName: "Term-1 Examinations (Mid-Term)",
      overallGpa: "9.0 / 10",
      grade: "A+",
      totalMarks: "450 / 500",
      status: "PASSED",
      subjects: [
        { name: "Mathematics", marks: 92, maxMarks: 100, grade: "A+", remarks: "Excellent" },
        { name: "Science & Tech", marks: 88, maxMarks: 100, grade: "A+", remarks: "Excellent" },
        { name: "English Literature", marks: 90, maxMarks: 100, grade: "A+", remarks: "Excellent" },
        { name: "Social Science", marks: 87, maxMarks: 100, grade: "A+", remarks: "Excellent" },
        { name: "Computer Applications", marks: 93, maxMarks: 100, grade: "A+", remarks: "Excellent" }
      ]
    };

    const defaultT2 = {
      termName: "Term-2 Examinations (Final Exam)",
      overallGpa: "9.2 / 10",
      grade: "A+",
      totalMarks: "461 / 500",
      status: "PASSED",
      subjects: [
        { name: "Mathematics", marks: 95, maxMarks: 100, grade: "O", remarks: "Outstanding" },
        { name: "Science & Tech", marks: 90, maxMarks: 100, grade: "A+", remarks: "Excellent" },
        { name: "English Literature", marks: 91, maxMarks: 100, grade: "A+", remarks: "Excellent" },
        { name: "Social Science", marks: 89, maxMarks: 100, grade: "A+", remarks: "Excellent" },
        { name: "Computer Applications", marks: 96, maxMarks: 100, grade: "O", remarks: "Outstanding" }
      ]
    };

    return {
      'Term-1': defaultT1,
      'Term-2': defaultT2
    };
  };

  const handleEditGradesClick = (student: any) => {
    setSelectedStudent(student);
    const studentResults = getOrInitializeStudentResults(student.id);
    const termResults = studentResults[selectedTerm] || null;

    if (termResults && termResults.subjects) {
      const getMark = (subjName: string) => {
        const found = termResults.subjects.find((s: any) => s.name === subjName);
        return found ? found.marks : 90;
      };
      setMathMarks(getMark("Mathematics"));
      setScienceMarks(getMark("Science & Tech"));
      setEnglishMarks(getMark("English Literature"));
      setSocialMarks(getMark("Social Science"));
      setComputerMarks(getMark("Computer Applications"));
    } else {
      setMathMarks(90);
      setScienceMarks(90);
      setEnglishMarks(90);
      setSocialMarks(90);
      setComputerMarks(90);
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
        return found ? found.marks : 90;
      };
      setMathMarks(getMark("Mathematics"));
      setScienceMarks(getMark("Science & Tech"));
      setEnglishMarks(getMark("English Literature"));
      setSocialMarks(getMark("Social Science"));
      setComputerMarks(getMark("Computer Applications"));
    } else {
      setMathMarks(90);
      setScienceMarks(90);
      setEnglishMarks(90);
      setSocialMarks(90);
      setComputerMarks(90);
    }
  }, [selectedTerm, selectedStudent]);

  const getGradeFromMarks = (m: number) => {
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

    const termResults = {
      termName: selectedTerm === 'Term-1' ? "Term-1 Examinations (Mid-Term)" : "Term-2 Examinations (Final Exam)",
      overallGpa: `${gpa} / 10`,
      grade: overallGrade,
      totalMarks: `${totalScore} / 500`,
      status: avgScore >= 40 ? "PASSED" : "FAILED",
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
      alert(`Exam grades saved successfully for ${selectedStudent.name}!`);
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

  const classesList = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        
        {/* Main Wrapper */}
        <div className="dashboard-container" style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto' }}>
          <AcademicTabs />
          
          {/* Custom Vibrant Header */}
          <div className="relative overflow-hidden rounded-3xl p-8 mb-6 border" style={{ 
            background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
            border: 'none',
            color: '#ffffff',
            boxShadow: '0 10px 30px rgba(59, 130, 246, 0.15)'
          }}>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
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
                <h1 style={{ fontSize: '32px', fontWeight: '900', margin: '8px 0 4px', letterSpacing: '-0.02em', color: '#fff' }}>
                  Student Exam Results Management
                </h1>
                <p style={{ color: 'rgba(255, 255, 255, 0.85)', margin: 0, fontSize: '14px', fontWeight: '500' }}>
                  Easily view, input, and modify Mid-Term & Final Examination marks for all registered students.
                </p>
              </div>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '20px',
                borderRadius: '20px',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <FiAward size={40} style={{ color: '#fbbf24' }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Academic Year</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255, 255, 255, 0.75)' }}>2025 - 2026</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics row */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
            gap: '20px', 
            marginBottom: '28px' 
          }}>
            
            <div className="stat-card" style={{ 
              backgroundColor: 'var(--card-bg)', 
              borderRadius: '20px', 
              padding: '24px', 
              border: '1px solid var(--border-color)',
              display: 'flex', 
              alignItems: 'center', 
              gap: '20px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)'
            }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '16px', 
                backgroundColor: 'rgba(79, 70, 229, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#4f46e5'
              }}>
                <FiUsers size={24} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Graded Students</h4>
                <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: '900', color: 'var(--text-main)' }}>{totalGradedCount}</p>
              </div>
            </div>

            <div className="stat-card" style={{ 
              backgroundColor: 'var(--card-bg)', 
              borderRadius: '20px', 
              padding: '24px', 
              border: '1px solid var(--border-color)',
              display: 'flex', 
              alignItems: 'center', 
              gap: '20px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)'
            }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '16px', 
                backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#10b981'
              }}>
                <FiTrendingUp size={24} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Average Term GPA</h4>
                <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: '900', color: 'var(--text-main)' }}>{averageGPA} / 10</p>
              </div>
            </div>

            <div className="stat-card" style={{ 
              backgroundColor: 'var(--card-bg)', 
              borderRadius: '20px', 
              padding: '24px', 
              border: '1px solid var(--border-color)',
              display: 'flex', 
              alignItems: 'center', 
              gap: '20px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)'
            }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '16px', 
                backgroundColor: 'rgba(245, 158, 11, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#f59e0b'
              }}>
                <FiActivity size={24} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Passing Rate</h4>
                <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: '900', color: 'var(--text-main)' }}>100%</p>
              </div>
            </div>

          </div>

          {/* Search, filters, and records table */}
          <div style={{ 
            backgroundColor: 'var(--card-bg)', 
            borderRadius: '24px', 
            border: '1px solid var(--border-color)',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
          }}>
            
            {/* Filter controls & Term Selector */}
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '15px', 
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              paddingBottom: '20px',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', flex: 1 }}>
                <div style={{ position: 'relative', minWidth: '240px', flex: 1 }}>
                  <FiSearch style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Search by student name, roll number..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      backgroundColor: 'var(--input-bg)',
                      color: 'var(--text-main)',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <select 
                    value={classFilter} 
                    onChange={(e) => setClassFilter(e.target.value)}
                    style={{
                      padding: '12px 18px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      backgroundColor: 'var(--input-bg)',
                      color: 'var(--text-main)',
                      fontSize: '14px',
                      outline: 'none',
                      cursor: 'pointer',
                      fontWeight: '700'
                    }}
                  >
                    <option value="all">All Classes</option>
                    {classesList.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>

                <div>
                  <select 
                    value={sectionFilter} 
                    onChange={(e) => setSectionFilter(e.target.value)}
                    style={{
                      padding: '12px 18px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      backgroundColor: 'var(--input-bg)',
                      color: 'var(--text-main)',
                      fontSize: '14px',
                      outline: 'none',
                      cursor: 'pointer',
                      fontWeight: '700'
                    }}
                  >
                    <option value="all">All Sections</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              </div>

              {/* Term Selector Toggle */}
              <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--input-bg)', padding: '4px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setSelectedTerm('Term-1')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer',
                    backgroundColor: selectedTerm === 'Term-1' ? '#4f46e5' : 'transparent',
                    color: selectedTerm === 'Term-1' ? '#ffffff' : 'var(--text-muted)',
                    transition: 'all 0.2s'
                  }}
                >
                  📝 Term-1 (Mid-Term)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTerm('Term-2')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer',
                    backgroundColor: selectedTerm === 'Term-2' ? '#4f46e5' : 'transparent',
                    color: selectedTerm === 'Term-2' ? '#ffffff' : 'var(--text-muted)',
                    transition: 'all 0.2s'
                  }}
                >
                  🏅 Term-2 (Final Exam)
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
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '14px' }}>Roll No</th>
                      <th style={{ padding: '14px' }}>Student Name</th>
                      <th style={{ padding: '14px' }}>Class</th>
                      <th style={{ padding: '14px' }}>Math</th>
                      <th style={{ padding: '14px' }}>Science</th>
                      <th style={{ padding: '14px' }}>English</th>
                      <th style={{ padding: '14px' }}>SST</th>
                      <th style={{ padding: '14px' }}>CS</th>
                      <th style={{ padding: '14px' }}>Total Marks</th>
                      <th style={{ padding: '14px' }}>GPA / Grade</th>
                      <th style={{ padding: '14px' }}>Status</th>
                      <th style={{ padding: '14px', textAlign: 'right' }}>Actions</th>
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
                        <tr key={student.id} style={{ 
                          borderBottom: '1px solid var(--border-color)',
                          backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(243, 244, 246, 0.15)' 
                        }}>
                          <td style={{ padding: '14px' }}>
                            <span style={{ 
                              backgroundColor: 'rgba(79, 70, 229, 0.08)',
                              color: '#4f46e5',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontWeight: 'bold',
                              fontSize: '13px'
                            }}>{student.roll || 'N/A'}</span>
                          </td>
                          <td style={{ padding: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{student.name}</td>
                          <td style={{ padding: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>Class {student.class}-{student.section}</td>
                          <td style={{ padding: '14px' }}><strong style={{ color: '#3b82f6' }}>{mathM}</strong></td>
                          <td style={{ padding: '14px' }}><strong style={{ color: '#10b981' }}>{sciM}</strong></td>
                          <td style={{ padding: '14px' }}><strong style={{ color: '#8b5cf6' }}>{engM}</strong></td>
                          <td style={{ padding: '14px' }}><strong style={{ color: '#f59e0b' }}>{sstM}</strong></td>
                          <td style={{ padding: '14px' }}><strong style={{ color: '#06b6d4' }}>{csM}</strong></td>
                          <td style={{ padding: '14px' }}><strong>{totalStr}</strong></td>
                          <td style={{ padding: '14px' }}>
                            <span className="badge approved" style={{ fontWeight: '800' }}>{gpaStr}</span>
                          </td>
                          <td style={{ padding: '14px' }}>
                            <span className={`badge ${statusVal === 'PASSED' ? 'approved' : 'danger'}`}>
                              {statusVal}
                            </span>
                          </td>
                          <td style={{ padding: '14px', textAlign: 'right' }}>
                            <button 
                              onClick={() => handleEditGradesClick(student)}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all ml-auto active:scale-95 whitespace-nowrap"
                            >
                              <FiEdit2 size={12} /> Edit Marks
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="rounded-2xl w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-200" style={{ 
              backgroundColor: 'var(--card-bg)', 
              color: 'var(--text-main)', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              border: '1px solid var(--border-color)'
            }}>
              
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
                gap: '10px', 
                backgroundColor: 'rgba(0,0,0,0.02)', 
                padding: '6px', 
                borderRadius: '12px', 
                marginBottom: '24px' 
              }}>
                <button 
                  onClick={() => setSelectedTerm('Term-1')}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                    backgroundColor: selectedTerm === 'Term-1' ? '#4f46e5' : 'transparent',
                    color: selectedTerm === 'Term-1' ? '#fff' : 'var(--text-muted)',
                    transition: 'all 0.2s'
                  }}
                >
                  Mid-Term (Term-1)
                </button>
                <button 
                  onClick={() => setSelectedTerm('Term-2')}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                    backgroundColor: selectedTerm === 'Term-2' ? '#4f46e5' : 'transparent',
                    color: selectedTerm === 'Term-2' ? '#fff' : 'var(--text-muted)',
                    transition: 'all 0.2s'
                  }}
                >
                  Final Exam (Term-2)
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
