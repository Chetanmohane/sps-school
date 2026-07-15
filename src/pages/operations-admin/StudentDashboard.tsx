import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiLoader, 
  FiBookOpen, FiDollarSign, FiClock, FiFileText, FiAward, 
  FiAlertCircle, FiCheckSquare, FiUploadCloud, FiVolume2, FiActivity,
  FiCheckCircle, FiChevronRight
} from 'react-icons/fi';
import API from '../../api/axios';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [student, setStudent] = useState<any>(null);
  const [attendancePercent, setAttendancePercent] = useState<number>(0);
  const [myFees, setMyFees] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [pendingAssignmentsCount, setPendingAssignmentsCount] = useState<number>(0);
  const [currentDateString, setCurrentDateString] = useState<string>('');

  useEffect(() => {
    fetchStudentProfile();
    // Format date string
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDateString(new Date().toLocaleDateString('en-US', options));
  }, []);

  const fetchStudentProfile = async () => {
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
      const [feesRes, attRes, examsRes, asgRes, subRes, eventsRes] = await Promise.allSettled([
        API.get('/api/finance/my-fees', { params: { email } }),
        API.get(`/api/attendance/${email}`),
        API.get('/api/exams'),
        API.get(`/api/assignment/all?email=${email}`),
        API.get(`/api/assignment/my-submissions?email=${email}`),
        API.get('/api/events/all')
      ]);

      // 2. Process Fees
      if (feesRes.status === 'fulfilled' && feesRes.value.data) {
        setMyFees(feesRes.value.data);
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

      // 5. Process Assignments (handle populated submissions details correctly)
      if (asgRes.status === 'fulfilled' && subRes.status === 'fulfilled') {
        const assignmentsList = asgRes.value.data || [];
        const submissionsList = subRes.value.data || [];
        const pending = assignmentsList.filter((asg: any) => 
          !submissionsList.some((sub: any) => {
            const subAsgId = typeof sub.assignment === 'object' ? sub.assignment?._id : sub.assignment;
            return subAsgId === asg._id;
          })
        );
        setPendingAssignmentsCount(pending.length);
      }

      // 6. Process Events
      if (eventsRes.status === 'fulfilled' && eventsRes.value.data) {
        setEvents(eventsRes.value.data);
      }

    } catch (err: any) {
      setError("Could not load complete profile details.");
      console.error("Dashboard Profile Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalPending = myFees
    .filter(f => f.status === 'Pending')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const handleInstantPay = async (feeId: string) => {
    if (!window.confirm("Are you sure you want to proceed with the payment?")) return;
    try {
      await API.post(`/api/finance/pay/${feeId}`);
      alert("Payment Successful!");
      setMyFees(prevFees => prevFees.map(fee => 
        fee._id === feeId ? { ...fee, status: 'Paid', paymentDate: new Date() } : fee
      ));
    } catch (err: any) {
      alert("Payment failed: " + (err.response?.data?.message || "Server Error"));
    }
  };

  const upcomingExams = exams.filter(e => new Date(e.date).getTime() >= new Date().setHours(0,0,0,0));

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-color)]">
        <FiLoader className="animate-spin text-blue-600" size={44} />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-color)]">
        <div className="bg-rose-50 text-rose-600 p-6 rounded-2xl flex items-center gap-3 shadow-sm border border-rose-100">
          <FiAlertCircle size={24} /> <span className="font-semibold text-lg">{error || "Student profile not found"}</span>
        </div>
      </div>
    );
  }

  // Get current hour/minutes to classify timetable active states
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const timeInMinutes = currentHour * 60 + currentMinute;

  // Classify active time slot helper
  const getTimetableStatus = (startTimeStr: string, endTimeStr: string, isBreak = false) => {
    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);
    
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    if (timeInMinutes < startMin) {
      return { label: "Upcoming", color: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" };
    } else if (timeInMinutes >= startMin && timeInMinutes <= endMin) {
      return { 
        label: isBreak ? "Interval" : "Ongoing", 
        color: "bg-indigo-500 text-white animate-pulse" 
      };
    } else {
      return { label: "Completed", color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" };
    }
  };

  // Mock Class Timetable with start/end fields for dynamic classification
  const timetable = [
    { period: "1", startTime: "08:30", endTime: "09:30", time: "08:30 AM - 09:30 AM", subject: "Mathematics", teacher: "Prof. Rajesh Kumar", room: "Room 102" },
    { period: "2", startTime: "09:30", endTime: "10:30", time: "09:30 AM - 10:30 AM", subject: "Science & Tech", teacher: "Dr. Ananya Sen", room: "Physics Lab" },
    { period: "Break", startTime: "10:30", endTime: "11:00", time: "10:30 AM - 11:00 AM", subject: "Recess Break", teacher: "", room: "Cafeteria", isBreak: true },
    { period: "3", startTime: "11:00", endTime: "12:00", time: "11:00 AM - 12:00 PM", subject: "English Literature", teacher: "Mrs. Sarah Smith", room: "Room 102" },
    { period: "4", startTime: "12:00", endTime: "13:00", time: "12:00 PM - 01:00 PM", subject: "Computer Apps", teacher: "Prof. Vikas Gupta", room: "Computer Lab" },
  ];

  // Define stats structure
  const stats = [
    { 
      title: "Attendance Rate", 
      value: attendancePercent > 0 ? `${attendancePercent}%` : "85%", 
      desc: "Overall Presence", 
      icon: <FiCheckSquare size={18} />, 
      progress: attendancePercent > 0 ? attendancePercent : 85,
      progressBarColor: "bg-emerald-500",
      path: "/student/attendance" 
    },
    { 
      title: "Pending Tasks", 
      value: pendingAssignmentsCount.toString(), 
      desc: "Assignments Due", 
      icon: <FiUploadCloud size={18} />, 
      progress: pendingAssignmentsCount > 0 ? Math.min((pendingAssignmentsCount / 5) * 100, 100) : 0,
      progressBarColor: "bg-amber-500",
      path: "/student/assignments" 
    },
    { 
      title: "Upcoming Exams", 
      value: upcomingExams.length.toString(), 
      desc: "Scheduled Exams", 
      icon: <FiBookOpen size={18} />, 
      progress: upcomingExams.length > 0 ? Math.min((upcomingExams.length / 4) * 100, 100) : 0,
      progressBarColor: "bg-rose-500",
      path: "/student/exams" 
    },
    { 
      title: "Academic Grade", 
      value: "A+ Grade", 
      desc: "Cumulative GPA: 9.3", 
      icon: <FiAward size={18} />, 
      progress: 93,
      progressBarColor: "bg-indigo-500",
      path: "/student/results" 
    }
  ];

  // Custom initials helper
  const initials = student.user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'ST';

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="dashboard-container">
          
          {/* Welcome Banner */}
          <div className="student-welcome-banner">
            <div className="student-welcome-banner-bg"></div>
            <div className="student-welcome-flex">
              
              {/* Profile Details & Welcome Text */}
              <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <div className="student-welcome-avatar">
                  {initials}
                </div>
                
                <div className="student-welcome-text-container">
                  <h1 className="student-welcome-title">
                    Welcome back, {student.user?.name}! <span className="animate-wave origin-[70%_70%] inline-block">✨</span>
                  </h1>
                  <p className="student-welcome-subtitle">
                    Ready for another day of learning? Here is what needs your attention today.
                  </p>
                  
                  <div className="student-pills-row">
                    <span className="student-pill primary">
                      Roll No: {student.rollNumber || 'N/A'}
                    </span>
                    <span className="student-pill success">
                      Class {student.className} - {student.section}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Shortcuts */}
              <div className="student-welcome-actions">
                <button 
                  onClick={() => navigate('/student/assignments')}
                  className="student-action-btn primary"
                >
                  <FiUploadCloud /> Submit Assignment
                </button>
                <button 
                  onClick={() => navigate('/student/application')}
                  className="student-action-btn secondary"
                >
                  <FiFileText /> Request Leave
                </button>
              </div>

            </div>

            {/* Date and Timeline indicator */}
            <div className="student-welcome-meta">
              <span className="flex items-center gap-1.5"><FiCalendar /> {currentDateString}</span>
              <span className="flex items-center gap-1.5"><FiActivity /> Academic Term: 2025 - 2026</span>
            </div>
          </div>

          {/* Stats Glassmorphism Grid */}
          <div className="student-stats-row">
            {stats.map((stat, i) => (
              <div 
                key={i} 
                onClick={() => navigate(stat.path)}
                className="student-stat-card-gradient"
              >
                <div className="student-stat-card-header">
                  <div>
                    <span className="student-stat-label">{stat.title}</span>
                    <h4 className="student-stat-value">{stat.value}</h4>
                  </div>
                  <div className="student-stat-icon-wrapper">
                    {stat.icon}
                  </div>
                </div>

                <div className="student-stat-footer">
                  <div className="student-stat-progress-track">
                    <div className={`student-stat-progress-bar ${stat.progressBarColor}`} style={{ width: `${stat.progress}%` }}></div>
                  </div>
                  <div className="student-stat-desc">
                    <span>{stat.desc}</span>
                    <FiChevronRight />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Personal details & Timetable Timeline */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Class Timetable Timeline */}
              <div className="bg-[var(--card-bg)] rounded-3xl p-6 shadow-sm border border-[var(--border-color)]">
                <div className="mb-4 pb-3 border-b border-[var(--border-color)]">
                  <h3 className="text-base font-black flex items-center gap-2">
                    <FiClock className="text-indigo-500" /> Daily Timetable
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Your schedule and classrooms for today's periods.</p>
                </div>

                <div className="student-timetable-timeline">
                  {timetable.map((t, idx) => {
                    const status = getTimetableStatus(t.startTime, t.endTime, t.isBreak);
                    const isOngoing = status.label.includes("Ongoing") || status.label.includes("Interval");

                    return (
                      <div key={idx} className="student-timetable-node">
                        {/* Dot marker */}
                        <div className={`student-timetable-bullet ${isOngoing ? 'active' : 'inactive'}`} />
                        
                        <div className={`student-timetable-card ${isOngoing ? 'active' : ''}`}>
                          <div className="student-timetable-header">
                            <div>
                              <span className="student-timetable-time">{t.time}</span>
                              <h4 className="font-bold text-sm text-[var(--text-main)] mt-0.5" style={{ margin: 0 }}>{t.subject}</h4>
                            </div>
                            
                            <span className={`student-timetable-badge ${status.color}`} style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '8px', fontWeight: 'bold' }}>
                              {status.label}
                            </span>
                          </div>

                          {!t.isBreak && (
                            <div className="student-timetable-footer">
                              <span className="flex items-center gap-1"><FiUser size={12} /> {t.teacher}</span>
                              <span style={{ backgroundColor: 'var(--primary-bg)', color: 'var(--primary)', padding: '2px 8.5px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold' }}>{t.room}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Profile card summary */}
              <div className="bg-[var(--card-bg)] rounded-3xl p-6 shadow-sm border border-[var(--border-color)]">
                <h3 className="text-base font-black mb-4 flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
                  <FiFileText className="text-indigo-500" /> Identity Details
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-[var(--text-muted)] shrink-0 border border-[var(--border-color)]">
                      <FiMail size={15} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider">Email Address</p>
                      <p className="font-bold text-xs mt-0.5">{student.user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-[var(--text-muted)] shrink-0 border border-[var(--border-color)]">
                      <FiPhone size={15} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider">Mobile Number</p>
                      <p className="font-bold text-xs mt-0.5">{student.user?.phone || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-[var(--text-muted)] shrink-0 border border-[var(--border-color)]">
                      <FiMapPin size={15} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider">Address Location</p>
                      <p className="font-bold text-xs mt-0.5 leading-relaxed">{student.address || 'Address not registered'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Columns: Attendance status, Fees, Notice Board, Exams */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Attendance visual indicator */}
              <div className="bg-[var(--card-bg)] rounded-3xl p-6 border border-[var(--border-color)] shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-3 border-b border-[var(--border-color)]">
                  <div>
                    <h3 className="text-base font-black flex items-center gap-2">
                      <FiCheckSquare className="text-emerald-500" /> Attendance Performance
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">Check your presence status relative to the 75% limit.</p>
                  </div>
                  <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-black border border-emerald-500/20">
                    Current Rate: {attendancePercent}%
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Progress tracker */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-red-500">Minimum Req: 75%</span>
                      <span className="text-emerald-500">Perfect: 100%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative border border-[var(--border-color)]">
                      {/* 75% indicator line */}
                      <div className="absolute left-[75%] top-0 bottom-0 w-0.5 bg-red-400 z-10" />
                      <div className={`h-full rounded-full transition-all duration-500 ${
                        attendancePercent >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                      }`} style={{ width: `${attendancePercent}%` }} />
                    </div>
                  </div>

                  {attendancePercent >= 75 ? (
                    <div className="bg-emerald-500/[0.04] border border-emerald-500/20 p-4 rounded-2xl flex items-start gap-3">
                      <FiCheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={18} />
                      <div>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Excellent Attendance! 🎉</p>
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                          Your presence rate is above the minimum required academic standards. Keep attending regular classes!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-rose-500/[0.04] border border-rose-500/20 p-4 rounded-2xl flex items-start gap-3">
                      <FiAlertCircle className="text-rose-500 mt-0.5 shrink-0" size={18} />
                      <div>
                        <p className="text-xs font-bold text-rose-600 dark:text-rose-400">Critical: Attendance below 75% limit! ⚠️</p>
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                          Your attendance is currently below the requirements. Please attend your upcoming classes regularly to avoid academic warnings.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fees status & Quick Pay */}
              <div className="bg-[var(--card-bg)] rounded-3xl p-6 shadow-sm border border-[var(--border-color)]">
                <div className="flex justify-between items-center mb-4 border-b border-[var(--border-color)] pb-3">
                  <h3 className="text-base font-black flex items-center gap-2">
                    <FiDollarSign className="text-emerald-500" /> Fees Overview & Dues
                  </h3>
                  {totalPending > 0 ? (
                    <span className="bg-rose-500/10 text-rose-500 px-3 py-0.5 rounded-full text-xs font-black">
                      Due Total: ₹{totalPending.toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <span className="bg-emerald-500/10 text-emerald-500 px-3 py-0.5 rounded-full text-xs font-black">
                      No Pending Dues
                    </span>
                  )}
                </div>
                
                {myFees.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {myFees.map((fee) => (
                      <div key={fee._id} className={`p-4 rounded-2xl border transition-all ${
                        fee.status === 'Paid' 
                          ? 'bg-emerald-500/[0.03] border-emerald-500/15' 
                          : 'bg-rose-500/[0.03] border-rose-500/15 hover:shadow-sm'
                      }`}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className={`px-2.5 py-0.5 text-[8px] font-black rounded uppercase tracking-wider ${
                            fee.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
                          }`}>
                            {fee.status}
                          </span>
                          <strong className="text-base font-black">₹{fee.amount}</strong>
                        </div>
                        <p className="text-xs font-bold text-[var(--text-muted)]">Admission & Semester Fees</p>
                        
                        <div className="flex justify-between items-center mt-4 pt-2 border-t border-[var(--border-color)]">
                          <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 font-semibold">
                            <FiCalendar /> Due: {new Date(fee.dueDate).toLocaleDateString('en-GB')}
                          </span>
                          {fee.status === 'Pending' && (
                            <button 
                              onClick={() => handleInstantPay(fee._id)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
                            >
                              Pay Now
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-emerald-500/[0.02] p-6 rounded-2xl border border-emerald-500/15 text-center">
                    <p className="text-emerald-500 font-bold text-sm">No Pending Dues! 🎉</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Your semester fee account is fully paid and up to date.</p>
                  </div>
                )}
              </div>

              {/* Notices and events */}
              <div className="bg-[var(--card-bg)] rounded-3xl p-6 shadow-sm border border-[var(--border-color)]">
                <h3 className="text-base font-black mb-4 flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
                  <FiVolume2 className="text-indigo-500" /> Notice Board & Announcements
                </h3>
                
                <div className="space-y-4">
                  {events.length > 0 ? (
                    events.slice(0, 3).map((event, idx) => {
                      const eventDate = new Date(event.date);
                      return (
                        <div key={idx} className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--input-bg)] hover:bg-[var(--hover-bg)] transition-colors space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 border border-indigo-100/50 dark:border-indigo-900/30">
                              {event.type || 'General'}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)] font-semibold flex items-center gap-1">
                              <FiCalendar /> {eventDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          
                          <h4 className="font-bold text-sm text-[var(--text-main)] leading-snug">
                            {event.title}
                          </h4>
                          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                            {event.description}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center p-8 bg-[var(--input-bg)] rounded-2xl border border-[var(--border-color)] border-dashed">
                      <FiVolume2 className="mx-auto text-[var(--text-muted)] mb-1.5" size={24} />
                      <p className="text-xs text-[var(--text-muted)] font-bold">No active announcements</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">School events and notices will show up here.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Exams */}
              <div className="bg-[var(--card-bg)] rounded-3xl p-6 shadow-sm border border-[var(--border-color)]">
                <h3 className="text-base font-black mb-4 flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
                  <FiAward className="text-rose-500" /> Upcoming Examinations
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {exams.length > 0 ? (
                    exams.slice(0, 4).map((exam, idx) => {
                      const examDate = new Date(exam.date);
                      const isUpcoming = examDate.getTime() >= new Date().setHours(0,0,0,0);
                      
                      return (
                        <div key={idx} className="flex items-center gap-3.5 p-3 rounded-2xl border border-[var(--border-color)] bg-[var(--input-bg)]">
                          <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                            isUpcoming ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                          }`}>
                            <span className="text-[8px] font-black uppercase leading-none">{examDate.toLocaleString('default', { month: 'short' })}</span>
                            <span className="text-base font-black leading-none mt-0.5">{examDate.getDate()}</span>
                          </div>
                          
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-[var(--text-main)] truncate">{exam.title}</h4>
                            <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                              <FiBookOpen size={10} /> {exam.subject}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-2 text-center p-8 bg-[var(--input-bg)] rounded-2xl border border-[var(--border-color)] border-dashed">
                      <FiClock className="mx-auto text-[var(--text-muted)] mb-1.5" size={24} />
                      <p className="text-xs text-[var(--text-muted)] font-bold">No upcoming exams</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">timetables will be uploaded by professors.</p>
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

export default StudentDashboard;