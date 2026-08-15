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

  // Shared results state removed, fetching directly from profile API
  
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

  const getStudentExamTerms = () => {
    const defaultTerms = [
      createDefaultZeroTerm("First Term Examinations"),
      createDefaultZeroTerm("Second Term Examinations"),
      createDefaultZeroTerm("Final Term Examinations")
    ];

    if (!studentProfile || !(studentProfile as any)._id) return defaultTerms;
    const studentGrades = (studentProfile as any).results;
    if (!studentGrades || Object.keys(studentGrades).length === 0) return defaultTerms;

    return [
      studentGrades['Term-1'] || createDefaultZeroTerm("First Term Examinations"),
      studentGrades['Term-2'] || createDefaultZeroTerm("Second Term Examinations"),
      studentGrades['Final'] || createDefaultZeroTerm("Final Term Examinations")
    ];
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="p-3.5 sm:p-6 md:p-8 bg-[var(--input-bg)] min-h-screen">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--text-main)] flex items-center gap-2">
                <FiFileText className="text-blue-500" /> Academic Results
              </h1>
              <p className="text-[var(--text-muted)] text-xs sm:text-sm mt-1">
                View your term-wise report cards, subject grades, and overall GPA performance.
              </p>
            </div>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg hover:bg-blue-700 active:scale-95 transition-all w-fit"
            >
              <FiDownload /> Download Report Card
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100 text-xs sm:text-sm">
              <FiLoader /> {error}
            </div>
          )}

          {/* Student Banner */}
          {studentProfile && (
            <div className="bg-[var(--card-bg)] text-[var(--text-main)] p-4 sm:p-6 rounded-3xl border border-[var(--border-color)] shadow-sm mb-6 sm:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 sm:h-16 sm:w-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl shrink-0">
                  {studentProfile.user?.name ? studentProfile.user.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-[var(--text-main)]">{studentProfile.user?.name}</h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Roll: <span className="font-bold text-blue-600">{studentProfile.rollNumber}</span> | Class: <span className="font-bold text-blue-600">{studentProfile.className} ({studentProfile.section})</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 sm:gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border-color)]">
                <div className="text-left md:text-right">
                  <p className="text-[10px] sm:text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Cumulative GPA</p>
                  <p className="text-xl sm:text-2xl font-black text-green-600 flex items-center gap-1 md:justify-end">
                    <FiAward /> {(() => {
                      const termsList = getStudentExamTerms();
                      const validGpaTerms = termsList.filter((t: any) => t.status === 'PASSED' || t.status === 'FAILED');
                      if (validGpaTerms.length === 0) return '0.0 / 10';
                      const avg = validGpaTerms.reduce((acc: number, t: any) => acc + (parseFloat(t.overallGpa) || 0), 0) / validGpaTerms.length;
                      return `${avg.toFixed(1)} / 10`;
                    })()}
                  </p>
                </div>
                <div className="h-8 sm:h-10 w-px bg-[var(--border-color)]"></div>
                <div>
                  <p className="text-[10px] sm:text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Result Status</p>
                  {(() => {
                    const termsList = getStudentExamTerms();
                    const validGpaTerms = termsList.filter((t: any) => t.status === 'PASSED' || t.status === 'FAILED');
                    const isPassed = validGpaTerms.length > 0 && validGpaTerms.every((t: any) => t.status === 'PASSED');
                    const isFailed = validGpaTerms.some((t: any) => t.status === 'FAILED');
                    if (isPassed) {
                      return (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-bold mt-1">
                          <FiCheckCircle /> PASSED
                        </span>
                      );
                    }
                    if (isFailed) {
                      return (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold mt-1">
                          FAILED
                        </span>
                      );
                    }
                    return (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-bold mt-1">
                        PENDING UPDATE
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Terms Report Cards */}
          <div className="space-y-8">
            {getStudentExamTerms().length === 0 ? (
              <div className="bg-[var(--card-bg)] text-[var(--text-main)] p-8 rounded-3xl border border-[var(--border-color)] shadow-sm text-center">
                <FiAward size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
                <h3 className="text-xl font-black mb-2">No Results Published</h3>
                <p className="text-[var(--text-muted)]">Your academic results have not been published yet. Please check back later.</p>
              </div>
            ) : (
              getStudentExamTerms().map((term, tIdx) => (
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
            )))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentResults;
