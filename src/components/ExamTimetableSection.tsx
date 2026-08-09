import React from 'react';
import { FiAward, FiBookOpen, FiClock } from 'react-icons/fi';

interface Exam {
  title: string;
  date: Date | string;
  subject: string;
  startTime?: string;
  endTime?: string;
  roomNumber?: string;
}

interface ExamTimetableSectionProps {
  exams: Exam[];
}

const ExamTimetableSection: React.FC<ExamTimetableSectionProps> = ({ exams }) => {
  const upcomingExams = exams.filter(e => new Date(e.date).getTime() >= new Date().setHours(0,0,0,0));

  return (
    <div className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm">
      <h3 className="text-sm font-black mb-4 flex items-center justify-between border-b border-[var(--border-color)] pb-3">
        <span className="flex items-center gap-2">
          <FiAward className="text-rose-500" /> Academic Exam Timetable
        </span>
        <span className="text-xs font-bold text-[var(--text-muted)]">
          Class {/* placeholder will be replaced by parent */}
        </span>
      </h3>
      <div className="space-y-3.5">
        {upcomingExams.map((exam, idx) => {
          const examDate = new Date(exam.date);
          return (
            <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition-colors">
              <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <span className="text-[10px] font-bold uppercase">{examDate.toLocaleString('default', { month: 'short' })}</span>
                <span className="text-lg font-black leading-none">{examDate.getDate()}</span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm leading-snug">{exam.title}</h4>
                <p className="text-xs text-[var(--text-muted)] flex flex-wrap items-center gap-2 mt-1">
                  <span className="flex items-center gap-1 font-semibold text-[var(--text-main)]">
                    <FiBookOpen size={13} /> {exam.subject}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    <FiClock size={10} className="inline mr-1" />{exam.startTime || '09:00 AM'} - {exam.endTime || '12:00 PM'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    🏫 {exam.roomNumber || 'Hall 101'}
                  </span>
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                Upcoming
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExamTimetableSection;
