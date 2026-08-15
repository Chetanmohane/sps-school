import React, { useState } from 'react';
import { FiAward, FiCheckCircle, FiFileText, FiDownload, FiStar, FiTrendingUp, FiAlertCircle, FiBookOpen } from 'react-icons/fi';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface SubjectResult {
  name: string;
  marks: number;
  maxMarks: number;
  grade: string;
  remarks: string;
}

interface TermResult {
  termName: string;
  overallGpa: string;
  grade: string;
  totalMarks: string;
  status: string;
  subjects: SubjectResult[];
}

interface ExamResultsSectionProps {
  student: any;
  resultsData?: Record<string, any>;
}

const createZeroTerm = (termName: string): TermResult => ({
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

const defaultExamTerms: Record<string, TermResult> = {
  'Term-1': createZeroTerm("First Term Examinations"),
  'Term-2': createZeroTerm("Second Term Examinations"),
  'Final': createZeroTerm("Final Term Examinations")
};

const getTermLabel = (key: string) => {
  if (key === 'Term-1') return 'First Term';
  if (key === 'Term-2') return 'Second Term';
  if (key === 'Final') return 'Final Term';
  return key;
};

const ExamResultsSection: React.FC<ExamResultsSectionProps> = ({ student, resultsData }) => {
  const [selectedTermKey, setSelectedTermKey] = useState<string>('Term-1');

  // Resolve student exam results from backend model or shared state or fallback
  const studentId = student?._id || student?.id;
  const studentResults = (student && student.results) || (studentId && resultsData ? resultsData[studentId] : null);

  const activeTerms: Record<string, TermResult> = studentResults && Object.keys(studentResults).length > 0 
    ? { ...defaultExamTerms, ...studentResults }
    : defaultExamTerms;

  const currentTerm: TermResult = activeTerms[selectedTermKey] || activeTerms['Term-1'];

  // Download PDF Report Card
  const handleDownloadPDF = () => {
    const doc = new jsPDF() as any;
    const studentName = student?.user?.name || student?.name || 'Active Student';
    const rollNo = student?.rollNumber || 'STU-1001';
    const className = student?.className || '10';
    const section = student?.section || 'A';

    // Header
    doc.setFillColor(16, 185, 129); // Emerald color
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text("VASANT VALLEY SCHOOL - REPORT CARD", 105, 18, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`${currentTerm.termName} | Academic Session 2025-26`, 105, 26, { align: 'center' });

    // Student Information Block
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Student Details:", 14, 45);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Student Name: ${studentName}`, 14, 52);
    doc.text(`Roll Number: ${rollNo}`, 14, 58);
    doc.text(`Class & Section: Class ${className} (${section})`, 120, 52);
    doc.text(`Overall Result: ${currentTerm.status} (${currentTerm.grade})`, 120, 58);

    // Divider Line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 64, 196, 64);

    // Subject Table
    const tableData = currentTerm.subjects.map((sub, index) => [
      index + 1,
      sub.name,
      `${sub.marks} / ${sub.maxMarks}`,
      `${Math.round((sub.marks / sub.maxMarks) * 100)}%`,
      sub.grade,
      sub.remarks
    ]);

    doc.autoTable({
      startY: 70,
      head: [['S.No', 'Subject Name', 'Marks Obtained', 'Percentage', 'Grade', 'Remarks']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 9, cellPadding: 4 }
    });

    // Summary Box at bottom
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, finalY, 182, 24, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Marks: ${currentTerm.totalMarks}`, 20, finalY + 10);
    doc.text(`GPA Score: ${currentTerm.overallGpa}`, 85, finalY + 10);
    doc.text(`Final Status: ${currentTerm.status}`, 145, finalY + 10);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text("Computer Generated Official Report Card. Signed & Verified by Academic Controller.", 105, finalY + 20, { align: 'center' });

    doc.save(`${studentName.replace(/\s+/g, '_')}_ReportCard_${selectedTermKey}.pdf`);
  };

  const getProgressColor = (marks: number, maxMarks: number) => {
    const pct = (marks / maxMarks) * 100;
    if (pct >= 85) return 'bg-emerald-500';
    if (pct >= 70) return 'bg-teal-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  if (!currentTerm) {
    return (
      <div className="bg-[var(--card-bg)] text-[var(--text-main)] p-8 rounded-2xl border border-[var(--border-color)] shadow-sm text-center mt-6">
        <FiAward size={40} className="mx-auto text-[var(--text-muted)] mb-3" />
        <h3 className="text-lg font-black mb-2">No Results Published</h3>
        <p className="text-[var(--text-muted)] text-sm">Academic results for this student have not been published yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-6">
      
      {/* Header & Term Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h3 className="text-base font-black text-[var(--text-main)] flex items-center gap-2">
            <FiAward className="text-emerald-600" /> Academic Exam Results & Performance Report
          </h3>
          <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
            Real-time updated subject-wise grade breakdown and official term scorecard.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Term Switcher */}
          <div className="flex items-center bg-[var(--input-bg)] p-1 rounded-xl border border-[var(--border-color)]">
            {Object.keys(activeTerms).map(termKey => (
              <button
                key={termKey}
                onClick={() => setSelectedTermKey(termKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedTermKey === termKey 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {getTermLabel(termKey)}
              </button>
            ))}
          </div>

          {/* PDF Download Button */}
          <button
            onClick={handleDownloadPDF}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Download Report Card PDF"
          >
            <FiDownload size={13} /> Report Card
          </button>
        </div>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <span>Overall GPA</span>
            <FiStar size={14} />
          </div>
          <p className="text-xl font-black text-emerald-600">{currentTerm.overallGpa}</p>
          <p className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5">Grade Point Average</p>
        </div>

        <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/20">
          <div className="flex items-center justify-between text-[10px] font-bold text-teal-600 uppercase tracking-wider mb-1">
            <span>Total Marks</span>
            <FiFileText size={14} />
          </div>
          <p className="text-xl font-black text-teal-600">{currentTerm.totalMarks}</p>
          <p className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5">Cumulative Aggregate</p>
        </div>

        <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
          <div className="flex items-center justify-between text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <span>Overall Grade</span>
            <FiAward size={14} />
          </div>
          <p className="text-xl font-black text-indigo-600">{currentTerm.grade}</p>
          <p className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5">Performance Rating</p>
        </div>

        <div className={`p-4 rounded-xl border ${currentTerm.status === 'PASSED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : 'bg-rose-500/10 border-rose-500/30 text-rose-600'}`}>
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Result Status</span>
            {currentTerm.status === 'PASSED' ? <FiCheckCircle size={14} /> : <FiAlertCircle size={14} />}
          </div>
          <p className="text-xl font-black">{currentTerm.status}</p>
          <p className="text-[10px] opacity-80 font-medium mt-0.5">Verified Academic Record</p>
        </div>
      </div>

      {/* Subject-Wise Detailed Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--input-bg)] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-color)]">
              <th className="py-3 px-4">Subject Name</th>
              <th className="py-3 px-4">Marks Obtained</th>
              <th className="py-3 px-4 w-1/3">Score Progress</th>
              <th className="py-3 px-4 text-center">Grade</th>
              <th className="py-3 px-4 text-right">Instructor Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)] text-xs font-semibold">
            {currentTerm.subjects && currentTerm.subjects.length > 0 ? (
              currentTerm.subjects.map((sub, idx) => {
                const percentage = Math.round((sub.marks / sub.maxMarks) * 100);
                return (
                  <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[var(--text-main)] flex items-center gap-2">
                      <FiBookOpen className="text-emerald-600" size={14} />
                      {sub.name}
                    </td>
                    <td className="py-3.5 px-4 font-black text-[var(--text-main)]">
                      {sub.marks} <span className="text-[10px] text-[var(--text-muted)] font-normal">/ {sub.maxMarks}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[var(--input-bg)] rounded-full h-2 overflow-hidden border border-[var(--border-color)]">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(sub.marks, sub.maxMarks)}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-bold text-[var(--text-muted)] w-8 text-right">{percentage}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {sub.grade}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-[var(--text-muted)] font-medium italic">
                      {sub.remarks}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-6 text-center text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  No exam marks recorded yet for this term.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default ExamResultsSection;
