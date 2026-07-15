import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { FiFileText, FiDownload, FiCheckCircle, FiLoader, FiAward, FiStar, FiChevronRight } from 'react-icons/fi';
import API from '../../api/axios';
import { useSharedState } from '../../hooks/useSharedState';

const StudentResults = () => {
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Shared results state
  const [resultsData] = useSharedState<Record<string, any>>('erp_results', {});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userEmail = localStorage.getItem('userEmail');
        const response = await API.get(`/api/student/profile/${userEmail}`);
        setStudentProfile(response.data);
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Failed to load results details.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--input-bg)]">
        <FiLoader className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }



  // Mock default Result Data matching the Student's details
  const defaultExamTerms = [
    {
      termName: "Term-1 Examinations (Mid-Term)",
      overallGpa: "9.2 / 10",
      grade: "A+",
      totalMarks: "460 / 500",
      status: "PASSED",
      subjects: [
        { name: "Mathematics", marks: 95, maxMarks: 100, grade: "O", remarks: "Outstanding" },
        { name: "Science & Tech", marks: 88, maxMarks: 100, grade: "A+", remarks: "Excellent" },
        { name: "English Literature", marks: 92, maxMarks: 100, grade: "O", remarks: "Outstanding" },
        { name: "Social Science", marks: 91, maxMarks: 100, grade: "O", remarks: "Outstanding" },
        { name: "Computer Applications", marks: 94, maxMarks: 100, grade: "O", remarks: "Outstanding" }
      ]
    },
    {
      termName: "Term-2 Examinations (Final Exam)",
      overallGpa: "9.4 / 10",
      grade: "O",
      totalMarks: "471 / 500",
      status: "PASSED",
      subjects: [
        { name: "Mathematics", marks: 98, maxMarks: 100, grade: "O", remarks: "Outstanding" },
        { name: "Science & Tech", marks: 91, maxMarks: 100, grade: "O", remarks: "Outstanding" },
        { name: "English Literature", marks: 94, maxMarks: 100, grade: "O", remarks: "Outstanding" },
        { name: "Social Science", marks: 93, maxMarks: 100, grade: "O", remarks: "Outstanding" },
        { name: "Computer Applications", marks: 95, maxMarks: 100, grade: "O", remarks: "Outstanding" }
      ]
    }
  ];

  const getStudentExamTerms = () => {
    if (!studentProfile || !(studentProfile as any)._id) return defaultExamTerms;
    const studentGrades = resultsData[(studentProfile as any)._id];
    if (!studentGrades) return defaultExamTerms;

    const terms = [];
    if (studentGrades['Term-1']) terms.push(studentGrades['Term-1']);
    if (studentGrades['Term-2']) terms.push(studentGrades['Term-2']);
    return terms.length > 0 ? terms : defaultExamTerms;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="p-8 bg-[var(--input-bg)] min-h-screen">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-2">
                <FiFileText className="text-blue-500" /> Academic Results
              </h1>
              <p className="text-[var(--text-muted)] text-sm">
                View your term-wise report cards, subject grades, and overall GPA performance.
              </p>
            </div>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition-all w-fit"
            >
              <FiDownload /> Download Report Card
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100">
              <FiLoader /> {error}
            </div>
          )}

          {/* Student Banner */}
          {studentProfile && (
            <div className="bg-[var(--card-bg)] text-[var(--text-main)] p-6 rounded-3xl border border-[var(--border-color)] shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl">
                  {studentProfile.user?.name ? studentProfile.user.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <h2 className="text-xl font-black text-[var(--text-main)]">{studentProfile.user?.name}</h2>
                  <p className="text-sm text-[var(--text-muted)]">
                    Roll Number: <span className="font-bold text-blue-600">{studentProfile.rollNumber}</span> | Class: <span className="font-bold text-blue-600">{studentProfile.className} ({studentProfile.section})</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-left md:text-right">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Cumulative GPA</p>
                  <p className="text-2xl font-black text-green-600 flex items-center gap-1 md:justify-end">
                    <FiAward /> 9.3 / 10
                  </p>
                </div>
                <div className="h-10 w-px bg-[var(--border-color)]"></div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Result Status</p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-bold mt-1">
                    <FiCheckCircle /> PASSED
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Terms Report Cards */}
          <div className="space-y-8">
            {getStudentExamTerms().map((term, tIdx) => (
              <div key={tIdx} className="bg-[var(--card-bg)] text-[var(--text-main)] rounded-3xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                <div className="p-6 bg-slate-50/50 border-b border-[var(--border-color)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="font-black text-lg text-[var(--text-main)]">{term.termName}</h3>
                    <p className="text-xs text-[var(--text-muted)]">Academic Year: 2025 - 2026</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm font-bold">
                    <div className="px-3.5 py-1.5 bg-blue-50 text-blue-600 rounded-xl">
                      Total: {term.totalMarks}
                    </div>
                    <div className="px-3.5 py-1.5 bg-green-50 text-green-600 rounded-xl">
                      GPA: {term.overallGpa}
                    </div>
                    <div className="px-3.5 py-1.5 bg-purple-50 text-purple-600 rounded-xl">
                      Grade: {term.grade}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[var(--input-bg)] text-[var(--text-muted)] text-xs font-bold uppercase">
                      <tr>
                        <th className="px-6 py-4">Subject</th>
                        <th className="px-6 py-4">Marks Obtained</th>
                        <th className="px-6 py-4">Max Marks</th>
                        <th className="px-6 py-4">Grade</th>
                        <th className="px-6 py-4">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {term.subjects.map((sub, sIdx) => (
                        <tr key={sIdx} className="hover:bg-[var(--input-bg)] transition-colors">
                          <td className="px-6 py-4 font-bold flex items-center gap-2">
                            <FiChevronRight className="text-blue-500" /> {sub.name}
                          </td>
                          <td className="px-6 py-4 font-semibold text-lg">{sub.marks}</td>
                          <td className="px-6 py-4 text-[var(--text-muted)]">{sub.maxMarks}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              sub.grade === 'O' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {sub.grade}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold flex items-center gap-1">
                              <FiStar className="text-yellow-500 fill-yellow-500" size={14} /> {sub.remarks}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentResults;
