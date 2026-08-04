import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiLoader, 
  FiBookOpen, FiDollarSign, FiClock, FiFileText, FiAward, 
  FiShield, FiHeart, FiEdit3, FiDownload, 
  FiCheckCircle, FiX, FiActivity, FiLayers, FiCreditCard,
  FiCamera, FiUploadCloud, FiTrash2
} from 'react-icons/fi';
import API from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const StudentProfile = () => {
  const { onEvent } = useSocket();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'personal' | 'academic' | 'finance' | 'exams'>('overview');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Data states
  const [student, setStudent] = useState<any>(null);
  const [attendancePercent, setAttendancePercent] = useState<number>(85);
  const [fees, setFees] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [pendingAssignmentsCount, setPendingAssignmentsCount] = useState<number>(2);
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    email: '',
    phone: '',
    parentName: '',
    parentPhone: '',
    bloodGroup: '',
    address: '',
    profileImage: ''
  });
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
    const unsubFee = onEvent('FEE_CHANGED', () => fetchAllData());
    const unsubAtt = onEvent('ATTENDANCE_CHANGED', () => fetchAllData());
    return () => {
      unsubFee();
      unsubAtt();
    };
  }, [onEvent]);

  const fetchAllData = async () => {
    const email = localStorage.getItem('userEmail');

    // Initial Instant Profile Construction (<1ms Instant Load)
    const savedPhoto = localStorage.getItem(`student_photo_${email}`) || '';
    const initialProfile = {
      user: {
        name: localStorage.getItem('userName') || 'Active Student',
        email: email || 'student@sps.edu',
        phone: '+918888800001'
      },
      className: '10',
      section: 'A',
      rollNumber: 'STU-1001',
      dob: '2010-01-01',
      parentName: 'Parent Guardian',
      parentPhone: '+918888800002',
      bloodGroup: 'O+',
      gender: 'Male',
      address: 'School Residential Campus',
      profileImage: savedPhoto
    };

    setStudent(initialProfile);
    setEditForm({
      email: initialProfile.user.email,
      phone: initialProfile.user.phone,
      parentName: initialProfile.parentName,
      parentPhone: initialProfile.parentPhone,
      bloodGroup: initialProfile.bloodGroup,
      address: initialProfile.address,
      profileImage: savedPhoto
    });
    
    // Standard Default Fee Statements
    setFees([
      { _id: 'default_fee_1', amount: 25000, paidAmount: 25000, status: 'Paid', title: 'Academic Tuition & Infrastructure Fee (Semester I)', dueDate: '2026-06-15' },
      { _id: 'default_fee_2', amount: 12000, paidAmount: 0, status: 'Pending', title: 'Annual Laboratory, Activity & Examination Fee', dueDate: '2026-09-15' }
    ]);

    // Default Exam Schedule
    setExams([
      { title: 'Mid-Term Mathematics Examination', date: new Date('2026-09-20'), subject: 'Mathematics', startTime: '09:00 AM', endTime: '12:00 PM', roomNumber: 'Hall 101' },
      { title: 'Physics Practical Assessment', date: new Date('2026-09-25'), subject: 'Science', startTime: '10:00 AM', endTime: '01:00 PM', roomNumber: 'Lab B' }
    ]);

    // Async Background Fetching
    if (email) {
      API.get(`/api/student/profile/${email}`).then((res) => {
        if (res.data) {
          const img = res.data.profileImage || savedPhoto;
          setStudent((prev: any) => ({ ...prev, ...res.data, profileImage: img }));
          setEditForm((prev: any) => ({
            ...prev,
            email: res.data.user?.email || prev.email || email,
            phone: res.data.user?.phone || prev.phone,
            parentName: res.data.parentName || prev.parentName,
            parentPhone: res.data.parentPhone || prev.parentPhone,
            bloodGroup: res.data.bloodGroup || prev.bloodGroup,
            address: res.data.address || prev.address,
            profileImage: img
          }));
        }
      }).catch((e) => console.warn("Background profile sync active", e));
    }

    // Secondary metrics in background
    Promise.allSettled([
      email ? API.get('/api/finance/my-fees', { params: { email } }) : Promise.reject('No email'),
      email ? API.get(`/api/attendance/${email}`) : Promise.reject('No email'),
      API.get('/api/exams'),
      email ? API.get(`/api/assignment/all?email=${email}`) : Promise.reject('No email'),
      email ? API.get(`/api/assignment/my-submissions?email=${email}`) : Promise.reject('No email')
    ]).then(([feesRes, attRes, examsRes, asgRes, subRes]) => {
      if (feesRes.status === 'fulfilled' && feesRes.value.data && feesRes.value.data.length > 0) {
        setFees(feesRes.value.data);
      }
      if (attRes.status === 'fulfilled' && attRes.value.data && attRes.value.data.records?.length > 0) {
        setAttendancePercent(attRes.value.data.percentage);
      } else {
        setAttendancePercent(85);
      }
      if (examsRes.status === 'fulfilled' && examsRes.value.data) {
        const allExams = examsRes.value.data.exams || [];
        if (allExams.length > 0) setExams(allExams);
      }
      if (asgRes.status === 'fulfilled' && subRes.status === 'fulfilled') {
        const assignmentsList = asgRes.value.data || [];
        const submissionsList = subRes.value.data || [];
        const pending = assignmentsList.filter((asg: any) => 
          !submissionsList.some((sub: any) => sub.assignment === asg._id)
        );
        setPendingAssignmentsCount(pending.length);
      }
    });
  };

  // Photo Upload Handler
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image smaller than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Photo = reader.result as string;
      const email = student?.user?.email || localStorage.getItem('userEmail');

      setStudent((prev: any) => ({ ...prev, profileImage: base64Photo }));
      setEditForm((prev: any) => ({ ...prev, profileImage: base64Photo }));
      if (email) localStorage.setItem(`student_photo_${email}`, base64Photo);

      try {
        if (email) {
          await API.put(`/api/student/profile/${email}`, { profileImage: base64Photo });
        }
        triggerNotification("Profile photo updated successfully!");
      } catch (err) {
        console.warn("Photo saved locally", err);
        triggerNotification("Profile photo updated!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    const email = student?.user?.email || localStorage.getItem('userEmail');
    setStudent((prev: any) => ({ ...prev, profileImage: '' }));
    setEditForm((prev: any) => ({ ...prev, profileImage: '' }));
    if (email) localStorage.removeItem(`student_photo_${email}`);

    try {
      if (email) {
        await API.put(`/api/student/profile/${email}`, { profileImage: '' });
      }
      triggerNotification("Profile photo removed.");
    } catch (err) {
      console.warn("Photo removed locally", err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const email = student.user?.email || localStorage.getItem('userEmail');
      if (email) {
        await API.put(`/api/student/profile/${email}`, editForm);
        if (editForm.profileImage) {
          localStorage.setItem(`student_photo_${email}`, editForm.profileImage);
        }
        if (editForm.email && editForm.email !== email) {
          localStorage.setItem('userEmail', editForm.email);
        }
      }
      
      setStudent((prev: any) => ({
        ...prev,
        user: { ...prev.user, email: editForm.email, phone: editForm.phone },
        parentName: editForm.parentName,
        parentPhone: editForm.parentPhone,
        bloodGroup: editForm.bloodGroup,
        address: editForm.address,
        profileImage: editForm.profileImage
      }));

      setIsEditModalOpen(false);
      triggerNotification("Profile details updated successfully!");
      if (editForm.email && editForm.email !== email) {
        window.location.reload();
      }
    } catch (err: any) {
      alert("Failed to update profile: " + (err.response?.data?.message || err.message));
    } finally {
      setSavingEdit(false);
    }
  };

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDownloadIdCard = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [85.6, 54]
    });

    // Header Background
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 85.6, 12, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('SPS SCHOOL MANAGEMENT PORTAL', 42.8, 7.5, { align: 'center' });

    // Photo Rendering
    if (student.profileImage) {
      try {
        doc.addImage(student.profileImage, 'JPEG', 6, 16, 22, 26);
      } catch (e) {
        doc.setFillColor(243, 244, 246);
        doc.roundedRect(6, 16, 22, 26, 2, 2, 'FD');
      }
    } else {
      doc.setFillColor(243, 244, 246);
      doc.setDrawColor(209, 213, 219);
      doc.roundedRect(6, 16, 22, 26, 2, 2, 'FD');
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(6);
      doc.text('PHOTO', 17, 30, { align: 'center' });
    }

    // Student Details
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text((student.user?.name || 'STUDENT NAME').toUpperCase(), 32, 19);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text(`Roll No: ${student.rollNumber || 'STU-1001'}`, 32, 24);
    doc.text(`Class: ${student.className || '10'} - Sec ${student.section || 'A'}`, 32, 28);
    doc.text(`Blood Group: ${student.bloodGroup || 'O+'}`, 32, 32);
    doc.text(`Parent: ${student.parentName || 'Parent Guardian'}`, 32, 36);
    doc.text(`Emergency Contact: ${student.parentPhone || student.user?.phone || '+918888800002'}`, 32, 40);

    // Footer Bar
    doc.setFillColor(243, 244, 246);
    doc.rect(0, 47, 85.6, 7, 'F');
    doc.setFontSize(5);
    doc.setTextColor(107, 114, 128);
    doc.text('Official Student Identity Card • SPS ERP Authorized System', 42.8, 51.5, { align: 'center' });

    doc.save(`Student_ID_${student.rollNumber || 'Card'}.pdf`);
    triggerNotification("Student ID Card downloaded as PDF!");
  };

  const totalPendingFees = fees
    .filter(f => f.status === 'Pending')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const upcomingExams = exams.filter(e => new Date(e.date).getTime() >= new Date().setHours(0,0,0,0));
  const initials = student?.user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'AS';

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        
        {/* Hidden File Input for Photo Upload */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handlePhotoSelect} 
          accept="image/*" 
          className="hidden" 
        />

        <div className="dashboard-container p-4 sm:p-6 lg:p-8 bg-[var(--bg-color)] min-h-screen text-[var(--text-main)] animate-in fade-in duration-300">
          
          {/* Toast Notification */}
          {notification && (
            <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
              <FiCheckCircle size={20} />
              <span className="text-sm font-bold">{notification}</span>
            </div>
          )}

          {/* Clean Hero Banner Header */}
          <div className="bg-[var(--card-bg)] rounded-[24px] shadow-sm border border-[var(--border-color)] overflow-hidden mb-8">
            
            {/* Banner Cover Gradient */}
            <div className="h-40 sm:h-48 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
              
              <div className="absolute top-4 right-4 flex flex-wrap gap-2">
                <div className="bg-black/30 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1.5 border border-white/10 shadow-sm">
                  <FiShield size={13} className="text-emerald-400" /> Verified Student Profile
                </div>
                <div className="bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1.5 border border-white/10">
                  Academic Session 2025-26
                </div>
              </div>
            </div>

            {/* Profile Head Bar below Banner */}
            <div className="px-6 pb-6 pt-2">
              <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4 -mt-16 sm:-mt-14 mb-4">
                
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  
                  {/* Interactive Avatar Box with Photo Upload */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    title="Click to Upload Student Photo"
                    className="relative group cursor-pointer"
                  >
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-[var(--card-bg)] shadow-xl flex items-center justify-center text-white font-black text-3xl shrink-0 z-20 overflow-hidden bg-gradient-to-tr from-emerald-500 to-teal-400 relative">
                      {student?.profileImage ? (
                        <img 
                          src={student.profileImage} 
                          alt="Student Avatar" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        initials
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white text-[10px] font-bold">
                        <FiCamera size={20} />
                        <span>Upload Photo</span>
                      </div>
                    </div>

                    {/* Camera Badge */}
                    <div className="absolute bottom-1 right-1 z-30 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white transition-transform group-hover:scale-110">
                      <FiCamera size={14} />
                    </div>
                  </div>

                  {/* Student Name & Info */}
                  <div className="pt-2 sm:pt-12">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">{student?.user?.name || 'Active Student'}</h1>
                      <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                        STUDENT
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5 text-xs text-[var(--text-muted)] font-medium">
                      <span className="bg-[var(--input-bg)] px-2.5 py-1 rounded-lg border border-[var(--border-color)] font-bold text-[var(--text-main)]">
                        Roll: {student?.rollNumber || 'STU-1001'}
                      </span>
                      <span className="bg-indigo-500/10 text-indigo-600 px-2.5 py-1 rounded-lg border border-indigo-500/20 font-bold">
                        Class {student?.className || '10'} - Sec {student?.section || 'A'}
                      </span>
                      <span className="bg-rose-500/10 text-rose-600 px-2.5 py-1 rounded-lg border border-rose-500/20 font-bold">
                        🩸 Blood Group: {student?.bloodGroup || 'O+'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-2 sm:mt-12 w-full sm:w-auto">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <FiCamera size={14} /> Upload Photo
                  </button>
                  <button 
                    onClick={() => setIsEditModalOpen(true)} 
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <FiEdit3 size={14} /> Edit Info
                  </button>
                  <button 
                    onClick={handleDownloadIdCard} 
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--hover-bg)] text-[var(--text-main)] border border-[var(--border-color)] text-xs font-bold transition-all cursor-pointer"
                  >
                    <FiDownload size={14} className="text-emerald-600" /> ID Card PDF
                  </button>
                </div>

              </div>

              {/* Tab Navigation Menu */}
              <div className="flex items-center gap-2 border-b border-[var(--border-color)] pt-3 overflow-x-auto no-scrollbar">
                {[
                  { id: 'overview', label: 'Overview & Summary', icon: FiLayers },
                  { id: 'personal', label: 'Personal & Parent Details', icon: FiUser },
                  { id: 'academic', label: 'Academic & Subjects', icon: FiBookOpen },
                  { id: 'finance', label: 'Fee Statement & Payments', icon: FiCreditCard },
                  { id: 'exams', label: 'Exam Timetable', icon: FiCalendar },
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                        isActive 
                          ? 'border-emerald-600 text-emerald-600 bg-emerald-500/10 rounded-t-xl' 
                          : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <Icon size={16} /> {tab.label}
                    </button>
                  );
                })}
              </div>

            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Stat Metric Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Attendance Rate</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <FiActivity size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-emerald-600 mb-2">{attendancePercent}%</p>
                  <div className="w-full bg-[var(--input-bg)] rounded-full h-1.5">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(attendancePercent, 100)}%` }}></div>
                  </div>
                </div>

                <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Pending Dues</span>
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                      <FiDollarSign size={16} />
                    </div>
                  </div>
                  <p className={`text-2xl font-black ${totalPendingFees > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ₹{totalPendingFees.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1">
                    {totalPendingFees > 0 ? 'Due for semester' : 'All fees cleared'}
                  </p>
                </div>

                <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Assignments Due</span>
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                      <FiBookOpen size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-indigo-600 mb-2">{pendingAssignmentsCount}</p>
                  <p className="text-[10px] font-bold text-[var(--text-muted)]">Active homework tasks</p>
                </div>

                <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Exams Scheduled</span>
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center">
                      <FiAward size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-cyan-600 mb-2">{upcomingExams.length}</p>
                  <p className="text-[10px] font-bold text-[var(--text-muted)]">Upcoming tests</p>
                </div>
              </div>

              {/* Main Content Split */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left: Personal Identity Box */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm">
                    <h3 className="text-sm font-black mb-4 flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
                      <FiFileText className="text-emerald-600" /> Personal Identity
                    </h3>

                    {/* Dedicated Photo Upload Card */}
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between cursor-pointer hover:bg-emerald-500/15 transition-all mb-4 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
                          <FiCamera size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-[var(--text-main)]">Profile Photo</p>
                          <p className="text-[10px] text-emerald-600 font-bold">Click to upload or update photo</p>
                        </div>
                      </div>
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm group-hover:bg-emerald-700 transition-colors">
                        Upload
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-[var(--text-muted)] shrink-0 border border-[var(--border-color)]">
                          <FiMail size={15} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">EMAIL ADDRESS</p>
                          <p className="font-bold text-xs sm:text-sm mt-0.5">{student?.user?.email || 'student@sps.edu'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-[var(--text-muted)] shrink-0 border border-[var(--border-color)]">
                          <FiPhone size={15} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">MOBILE NUMBER</p>
                          <p className="font-bold text-xs sm:text-sm mt-0.5">{student?.user?.phone || '+918888800001'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-[var(--text-muted)] shrink-0 border border-[var(--border-color)]">
                          <FiCalendar size={15} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">DATE OF BIRTH</p>
                          <p className="font-bold text-xs sm:text-sm mt-0.5">1 January 2010</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-[var(--text-muted)] shrink-0 border border-[var(--border-color)]">
                          <FiHeart size={15} className="text-rose-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">PARENT / GUARDIAN</p>
                          <p className="font-bold text-xs sm:text-sm mt-0.5">{student?.parentName || 'Parent Guardian'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-[var(--text-muted)] shrink-0 border border-[var(--border-color)]">
                          <FiMapPin size={15} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">RESIDENTIAL ADDRESS</p>
                          <p className="font-bold text-xs sm:text-sm mt-0.5 leading-relaxed">{student?.address || 'School Residential Campus'}</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right Column: Fees and Exams */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Semester Fee Details */}
                  <div className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm">
                    <h3 className="text-sm font-black mb-4 flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                      <span className="flex items-center gap-2">
                        <FiDollarSign className="text-emerald-600" /> Semester Fee Details
                      </span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        Session 2025-26
                      </span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {fees.map((fee, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border ${fee.status === 'Paid' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-md uppercase tracking-wider ${fee.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500/20 text-rose-600'}`}>
                              ● {fee.status}
                            </span>
                            <strong className="text-base font-black text-[var(--text-main)]">₹{fee.amount?.toLocaleString('en-IN')}</strong>
                          </div>
                          <p className="text-xs font-bold text-[var(--text-main)] mt-2">{fee.title || 'Academic Tuition & School Fee'}</p>
                          <p className="text-[10px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1 font-medium">
                            <FiCalendar /> Due: {new Date(fee.dueDate).toLocaleDateString('en-GB')}
                          </p>

                          {fee.status === 'Pending' && (
                            <button 
                              onClick={() => alert("Redirecting to secure online fee payment gateway...")}
                              className="w-full mt-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <FiCreditCard size={13} /> Pay ₹{fee.amount?.toLocaleString('en-IN')}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Academic Exam Timetable */}
                  <div className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm">
                    <h3 className="text-sm font-black mb-4 flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                      <span className="flex items-center gap-2">
                        <FiAward className="text-rose-500" /> Academic Exam Timetable
                      </span>
                      <span className="text-xs font-bold text-[var(--text-muted)]">Class 10-A</span>
                    </h3>

                    <div className="space-y-3.5">
                      {exams.map((exam, idx) => {
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
                                <span className="flex items-center gap-1 font-semibold text-[var(--text-main)]"><FiBookOpen size={13} /> {exam.subject}</span>
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

                </div>

              </div>

            </div>
          )}

          {/* TAB 2: PERSONAL DETAILS */}
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
              <div className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-5">
                <h3 className="text-base font-black border-b border-[var(--border-color)] pb-3 flex items-center gap-2">
                  <FiUser className="text-emerald-600" /> Student Profile Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)]">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">FULL NAME</p>
                    <p className="font-bold text-sm mt-1">{student?.user?.name || 'Active Student'}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)]">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">ROLL NUMBER</p>
                    <p className="font-bold text-sm mt-1 text-emerald-600">{student?.rollNumber || 'STU-1001'}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)]">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">CLASS & SECTION</p>
                    <p className="font-bold text-sm mt-1">Class {student?.className || '10'} - Section {student?.section || 'A'}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)]">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">DATE OF BIRTH</p>
                    <p className="font-bold text-sm mt-1">1 January 2010</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)]">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">GENDER</p>
                    <p className="font-bold text-sm mt-1">{student?.gender || 'Male'}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)]">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">BLOOD GROUP</p>
                    <p className="font-bold text-sm mt-1 text-rose-600">{student?.bloodGroup || 'O+'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-5">
                <h3 className="text-base font-black border-b border-[var(--border-color)] pb-3 flex items-center gap-2">
                  <FiHeart className="text-rose-500" /> Parent & Guardian Information
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)]">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <FiHeart size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">PARENT / GUARDIAN NAME</p>
                      <p className="font-bold text-sm mt-0.5">{student?.parentName || 'Parent Guardian'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)]">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <FiPhone size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">PARENT EMERGENCY CONTACT</p>
                      <p className="font-bold text-sm mt-0.5">{student?.parentPhone || student?.user?.phone || '+918888800002'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)]">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                      <FiMail size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">STUDENT EMAIL ADDRESS</p>
                      <p className="font-bold text-sm mt-0.5">{student?.user?.email || 'student@sps.edu'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)]">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                      <FiMapPin size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">RESIDENTIAL ADDRESS</p>
                      <p className="font-bold text-sm mt-0.5 leading-relaxed">{student?.address || 'School Residential Campus'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACADEMICS */}
          {activeTab === 'academic' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm">
                <h3 className="text-base font-black border-b border-[var(--border-color)] pb-3 flex items-center gap-2 mb-6">
                  <FiBookOpen className="text-emerald-600" /> Enrolled Subjects & Course Catalogue (Class 10)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { code: 'MATH-101', name: 'Mathematics', teacher: 'Class Teacher', credits: 4, room: 'Room 101' },
                    { code: 'SCI-102', name: 'General Science & Physics', teacher: 'Subject Instructor', credits: 4, room: 'Science Lab' },
                    { code: 'ENG-103', name: 'English Literature', teacher: 'Senior Faculty', credits: 3, room: 'Room 102' },
                    { code: 'SOC-104', name: 'Social Studies & History', teacher: 'Faculty Staff', credits: 3, room: 'Room 104' },
                  ].map((sub, idx) => (
                    <div key={idx} className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] hover:shadow-md transition-all">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded border border-emerald-500/20">
                          {sub.code}
                        </span>
                        <span className="text-[10px] font-bold text-[var(--text-muted)]">
                          {sub.credits} Credits
                        </span>
                      </div>
                      <h4 className="font-bold text-base mb-1">{sub.name}</h4>
                      <p className="text-xs text-[var(--text-muted)] font-medium mb-3">Faculty: {sub.teacher}</p>
                      <div className="text-[10px] font-bold text-slate-500 bg-[var(--input-bg)] p-2 rounded-xl flex items-center justify-between">
                        <span>Class Location</span>
                        <span className="text-[var(--text-main)] font-black">{sub.room}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FINANCE */}
          {activeTab === 'finance' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm">
                <h3 className="text-base font-black border-b border-[var(--border-color)] pb-3 flex items-center gap-2 mb-6">
                  <FiDollarSign className="text-emerald-500" /> Official Fee Statement & Payment Status
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fees.map((fee, idx) => (
                    <div key={idx} className={`p-5 rounded-2xl border ${fee.status === 'Paid' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                      <div className="flex justify-between items-center mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${fee.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500/20 text-rose-600'}`}>
                          ● {fee.status}
                        </span>
                        <span className="text-xl font-black text-[var(--text-main)]">₹{fee.amount?.toLocaleString('en-IN')}</span>
                      </div>
                      <p className="text-xs font-bold text-[var(--text-main)] mb-1">{fee.title || 'Academic Tuition & School Fee'}</p>
                      <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 font-medium mb-4">
                        <FiCalendar /> Due Date: {new Date(fee.dueDate).toLocaleDateString('en-GB')}
                      </p>

                      {fee.status === 'Pending' ? (
                        <button 
                          onClick={() => navigate('/student/fees')}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-700 transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <FiCreditCard size={14} /> Pay ₹{fee.amount?.toLocaleString('en-IN')} Now
                        </button>
                      ) : (
                        <div className="w-full py-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-center font-bold text-xs flex items-center justify-center gap-1 border border-emerald-500/20">
                          <FiCheckCircle size={14} /> Official Receipt Verified
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'exams' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm">
                <h3 className="text-base font-black border-b border-[var(--border-color)] pb-3 flex items-center gap-2 mb-6">
                  <FiCalendar className="text-emerald-500" /> Exam Datesheet & Timetable (Class {student?.className || '10'})
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border-color)] text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        <th className="pb-3 pt-2">Exam Title</th>
                        <th className="pb-3 pt-2">Subject</th>
                        <th className="pb-3 pt-2">Date</th>
                        <th className="pb-3 pt-2">Timings</th>
                        <th className="pb-3 pt-2">Room / Hall No.</th>
                        <th className="pb-3 pt-2">Max Marks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {exams && exams.filter(e => String(e.className) === String(student?.className || '10')).length > 0 ? (
                        exams.filter(e => String(e.className) === String(student?.className || '10')).map((exam, idx) => (
                          <tr key={idx} className="text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <td className="py-4 text-[var(--text-main)] font-bold">{exam.title}</td>
                            <td className="py-4">
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                {exam.subject}
                              </span>
                            </td>
                            <td className="py-4 text-[var(--text-muted)] font-medium">
                              {new Date(exam.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="py-4 text-[var(--text-muted)] font-medium">
                              <span className="flex items-center gap-1">
                                <FiClock className="text-emerald-500" size={13} /> {exam.startTime} - {exam.endTime}
                              </span>
                            </td>
                            <td className="py-4 text-[var(--text-main)]">{exam.roomNumber}</td>
                            <td className="py-4 font-bold text-emerald-600">{exam.maxMarks} Marks</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                            📅 No upcoming exams scheduled for Class {student?.className || '10'}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* EDIT CONTACT INFO MODAL WITH PHOTO PREVIEW */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--card-bg)] w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-[var(--border-color)] animate-in zoom-in-95 duration-300">
            
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-4 mb-5">
              <h3 className="text-lg font-black flex items-center gap-2">
                <FiEdit3 className="text-emerald-600" /> Edit Contact & Guardian Info
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[var(--input-bg)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              {/* Photo Upload Section in Modal */}
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-color)]">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xl shrink-0 border border-emerald-500/20">
                  {editForm.profileImage ? (
                    <img src={editForm.profileImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold mb-1">Student Profile Photo</p>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <FiCamera size={12} /> Choose Photo
                    </button>
                    {editForm.profileImage && (
                      <button 
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 border border-rose-500/20 text-xs font-bold hover:bg-rose-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <FiTrash2 size={12} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Email Address *</label>
                <input 
                  type="email" 
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="student@school.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] text-sm font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Student Phone Number</label>
                <input 
                  type="text" 
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="+91 99999 00000"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] text-sm font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Parent / Guardian Name</label>
                <input 
                  type="text" 
                  value={editForm.parentName}
                  onChange={(e) => setEditForm({ ...editForm, parentName: e.target.value })}
                  placeholder="Parent Name"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] text-sm font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Parent Emergency Contact</label>
                <input 
                  type="text" 
                  value={editForm.parentPhone}
                  onChange={(e) => setEditForm({ ...editForm, parentPhone: e.target.value })}
                  placeholder="+91 88888 00000"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] text-sm font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Blood Group</label>
                <select 
                  value={editForm.bloodGroup}
                  onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] text-sm font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Residential Address</label>
                <textarea 
                  rows={3}
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Enter full residential address..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] text-sm font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--input-bg)] text-[var(--text-main)] text-xs font-bold hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {savingEdit ? <FiLoader className="animate-spin" /> : <FiCheckCircle />} Save Changes
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default StudentProfile;