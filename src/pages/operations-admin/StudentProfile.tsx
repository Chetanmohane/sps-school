import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiLoader, 
  FiBookOpen, FiDollarSign, FiClock, FiFileText, FiAward, 
  FiAlertCircle, FiShield, FiHeart
} from 'react-icons/fi';
import API from '../../api/axios';

const StudentProfile = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [student, setStudent] = useState<any>(null);
  const [attendancePercent, setAttendancePercent] = useState<number>(0);
  const [fees, setFees] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [pendingAssignmentsCount, setPendingAssignmentsCount] = useState<number>(0);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const email = localStorage.getItem('userEmail');
        if (!email) throw new Error("No user email found in session");

        // 1. Fetch Profile
        const profileRes = await API.get(`/api/student/profile/${email}`);
        const profileData = profileRes.data;
        setStudent(profileData);
        const profileClass = profileData.className;

        // Run remaining fetches in parallel
        const [feesRes, attRes, examsRes, asgRes, subRes] = await Promise.allSettled([
          API.get('/api/finance/my-fees', { params: { email } }),
          API.get(`/api/attendance/${email}`),
          API.get('/api/exams'),
          API.get(`/api/assignment/all?email=${email}`),
          API.get(`/api/assignment/my-submissions?email=${email}`)
        ]);

        // 2. Process Fees
        if (feesRes.status === 'fulfilled' && feesRes.value.data) {
          setFees(feesRes.value.data);
        }

        // 3. Process Attendance
        if (attRes.status === 'fulfilled' && attRes.value.data) {
          setAttendancePercent(attRes.value.data.percentage || 0);
        }

        // 4. Process Exams
        if (examsRes.status === 'fulfilled' && examsRes.value.data) {
          const allExams = examsRes.value.data.exams || [];
          const classExams = allExams.filter((exam: any) => 
            exam.className && profileClass && 
            exam.className.trim().toLowerCase() === profileClass.trim().toLowerCase()
          );
          setExams(classExams);
        }

        // 5. Process Assignments
        if (asgRes.status === 'fulfilled' && subRes.status === 'fulfilled') {
          const assignmentsList = asgRes.value.data || [];
          const submissionsList = subRes.value.data || [];
          const pending = assignmentsList.filter((asg: any) => 
            !submissionsList.some((sub: any) => sub.assignment === asg._id)
          );
          setPendingAssignmentsCount(pending.length);
        }

      } catch (err: any) {
        setError("Could not load complete profile details.");
        console.error("Profile Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[var(--bg-color)]">
      <FiLoader className="animate-spin text-indigo-600" size={44} />
    </div>
  );

  if (error || !student) return (
    <div className="flex h-screen items-center justify-center bg-[var(--bg-color)]">
      <div className="bg-rose-50 text-rose-600 p-6 rounded-2xl flex items-center gap-3 shadow-sm border border-rose-100">
        <FiAlertCircle size={24} /> <span className="font-semibold text-lg">{error || "Student not found"}</span>
      </div>
    </div>
  );

  const totalPendingFees = fees
    .filter(f => f.status === 'Pending')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const upcomingExams = exams.filter(e => new Date(e.date).getTime() >= new Date().setHours(0,0,0,0));
  
  // Custom Avatar Gradient based on student name length
  const avatarGradients = [
    'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
    'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
  ];
  const charIndex = student.user?.name?.charCodeAt(0) || 0;
  const activeGradient = avatarGradients[charIndex % avatarGradients.length];
  const initials = student.user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'S';

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        
        <div className="dashboard-container p-6 lg:p-8 bg-[var(--bg-color)] min-h-screen text-[var(--text-main)] animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Cover Banner & Profile Head */}
          <div className="bg-[var(--card-bg)] rounded-[24px] shadow-sm border border-[var(--border-color)] overflow-hidden mb-8">
            {/* Banner Cover with Cubes Pattern overlay */}
            <div className="h-48 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-15"></div>
              <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1.5 border border-white/10">
                <FiShield size={12} className="text-emerald-400" /> Verified Student Profile
              </div>
            </div>
            
            <div className="px-6 pb-6 relative">
              {/* Profile image overlapping the banner */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-16 mb-5">
                <div 
                  className="w-28 h-28 rounded-2xl border-4 border-[var(--card-bg)] shadow-xl flex items-center justify-center text-white z-10 shrink-0 font-bold text-3xl"
                  style={{ background: activeGradient }}
                >
                  {initials}
                </div>
                <div className="text-center sm:text-left pb-1 flex-1">
                  <h1 className="text-2xl font-black tracking-tight">{student.user?.name}</h1>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
                    <span className="bg-[var(--primary-bg)] text-[var(--primary)] px-3 py-0.5 rounded-full text-xs font-bold border border-[var(--border-color)]">
                      Roll No: {student.rollNumber || 'N/A'}
                    </span>
                    <span className="bg-emerald-500/10 text-emerald-500 px-3 py-0.5 rounded-full text-xs font-bold border border-emerald-500/20">
                      Class {student.className} - Section {student.section}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats metric bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-5 border-t border-[var(--border-color)] text-center sm:text-left">
                <div className="px-2">
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Attendance Rate</p>
                  <p className={`text-xl font-black ${attendancePercent >= 75 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {attendancePercent}%
                  </p>
                </div>
                <div className="px-2 border-l border-[var(--border-color)]">
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Pending Fees</p>
                  <p className={`text-xl font-black ${totalPendingFees > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    ₹{totalPendingFees.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="px-2 border-l border-[var(--border-color)]">
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Assignments Due</p>
                  <p className="text-xl font-black text-indigo-500">
                    {pendingAssignmentsCount}
                  </p>
                </div>
                <div className="px-2 border-l border-[var(--border-color)]">
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Exams Scheduled</p>
                  <p className="text-xl font-black text-cyan-500">
                    {upcomingExams.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Details Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Personal details */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-[var(--card-bg)] rounded-2xl p-6 shadow-sm border border-[var(--border-color)]">
                <h3 className="text-base font-black mb-4 flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
                  <FiFileText className="text-indigo-500" /> Personal Identity
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-[var(--text-muted)] shrink-0 border border-[var(--border-color)]">
                      <FiMail size={15} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Email Address</p>
                      <p className="font-semibold text-sm mt-0.5">{student.user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-[var(--text-muted)] shrink-0 border border-[var(--border-color)]">
                      <FiPhone size={15} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Mobile Number</p>
                      <p className="font-semibold text-sm mt-0.5">{student.user?.phone || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-[var(--text-muted)] shrink-0 border border-[var(--border-color)]">
                      <FiCalendar size={15} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Date of Birth</p>
                      <p className="font-semibold text-sm mt-0.5">
                        {student.dob ? new Date(student.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-[var(--text-muted)] shrink-0 border border-[var(--border-color)]">
                      <FiHeart size={15} className="text-rose-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Parent / Guardian</p>
                      <p className="font-semibold text-sm mt-0.5">{student.parentName || 'Registered Parent'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-[var(--text-muted)] shrink-0 border border-[var(--border-color)]">
                      <FiMapPin size={15} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Residential Address</p>
                      <p className="font-semibold text-sm mt-0.5 leading-relaxed">{student.address || 'No registered address'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Columns: Academics and Finance */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Financial Status list */}
              <div className="bg-[var(--card-bg)] rounded-2xl p-6 shadow-sm border border-[var(--border-color)]">
                <h3 className="text-base font-black mb-4 flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
                  <FiDollarSign className="text-emerald-500" /> Semester Fee Details
                </h3>
                
                {fees.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {fees.map((fee) => (
                      <div key={fee._id} className={`p-4 rounded-xl border ${fee.status === 'Paid' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${fee.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                            {fee.status}
                          </span>
                          <strong className="text-base font-black text-[var(--text-main)]">₹{fee.amount}</strong>
                        </div>
                        <p className="text-[11px] font-bold text-[var(--text-muted)]">Admission & Tuition Fee</p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-2 flex items-center gap-1 font-medium">
                          <FiCalendar /> Due: {new Date(fee.dueDate).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] text-center text-xs text-[var(--text-muted)]">
                    No fee statement records found.
                  </div>
                )}
              </div>

              {/* Academic schedule */}
              <div className="bg-[var(--card-bg)] rounded-2xl p-6 shadow-sm border border-[var(--border-color)]">
                <h3 className="text-base font-black mb-4 flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
                  <FiAward className="text-rose-500" /> Academic Exam Timetable
                </h3>
                
                <div className="space-y-3.5">
                  {exams.length > 0 ? (
                    exams.map((exam, idx) => {
                      const examDate = new Date(exam.date);
                      const isUpcoming = examDate.getTime() >= new Date().setHours(0,0,0,0);
                      return (
                        <div key={idx} className="flex items-center gap-4 p-3.5 rounded-xl border border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition-colors">
                          <div className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center shrink-0 ${isUpcoming ? 'bg-indigo-500/10 text-indigo-500' : 'bg-[var(--input-bg)] text-[var(--text-muted)]'}`}>
                            <span className="text-[9px] font-bold uppercase">{examDate.toLocaleString('default', { month: 'short' })}</span>
                            <span className="text-base font-black leading-none">{examDate.getDate()}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-sm leading-snug">{exam.title}</h4>
                            <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                              <FiBookOpen size={12} /> {exam.subject}
                            </p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isUpcoming ? 'bg-indigo-500/10 text-indigo-500' : 'bg-[var(--input-bg)] text-[var(--text-muted)]'}`}>
                            {isUpcoming ? 'Upcoming' : 'Completed'}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center p-8 bg-[var(--input-bg)] rounded-xl border border-[var(--border-color)] border-dashed">
                      <FiClock className="mx-auto text-[var(--text-muted)] mb-2" size={24} />
                      <p className="text-xs text-[var(--text-muted)] font-medium">No active exam schedules found for your class.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default StudentProfile;