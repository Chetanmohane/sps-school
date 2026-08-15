import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import AcademicTabs from '../../components/AcademicTabs';
import {
  FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiSearch,
  FiStar, FiUsers, FiLayers, FiCheck, FiX, FiBookOpen,
  FiPhone, FiMail, FiChevronDown, FiChevronUp, FiRefreshCw
} from 'react-icons/fi';

// ─────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────
const TeachersAcademicManagement = () => {
  const [activeTab, setActiveTab] = useState<'directory' | 'classTeacher'>('directory');

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="dashboard-container" style={{ padding: '12px 24px 24px' }}>
          <AcademicTabs />

          {/* Inner Tab Switcher */}
          <div style={{
            display: 'flex', gap: '10px', marginBottom: '24px',
            background: 'var(--card-bg)', border: '1px solid var(--border-color)',
            borderRadius: '14px', padding: '8px'
          }}>
            {[
              { key: 'directory', label: '👩‍🏫 Faculty Directory', icon: <FiUsers /> },
              { key: 'classTeacher', label: '⭐ Class Teacher Assignment', icon: <FiLayers /> }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: '10px', border: 'none',
                  fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: activeTab === tab.key
                    ? 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)'
                    : 'transparent',
                  color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
                  boxShadow: activeTab === tab.key ? '0 4px 14px rgba(59,130,246,0.35)' : 'none'
                }}
              >
                {tab.icon}<span>{tab.label}</span>
              </button>
            ))}
          </div>

          {activeTab === 'directory' ? <TeacherDirectory /> : <ClassTeacherAssignment />}
        </div>
      </main>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  TAB 1 — Teacher Directory (existing logic, preserved)
// ─────────────────────────────────────────────────────────────
const TeacherDirectory = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [specFilter, setSpecFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [expFilter, setExpFilter] = useState('all');

  // Custom Delete Modal & Toast State
  const [deleteConfirmTeacher, setDeleteConfirmTeacher] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Password Visibility & Change Modal States
  const [visiblePasswordIds, setVisiblePasswordIds] = useState<{ [key: string]: boolean }>({});
  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswordIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [passwordModal, setPasswordModal] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    visiblePassword?: string;
  }>({ open: false, userId: '', userName: '' });

  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [modalShowPassword, setModalShowPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const openChangePasswordModal = (teacherObj: any, name: string, currentPass?: string) => {
    let resolvedId = '';
    if (typeof teacherObj === 'object' && teacherObj !== null) {
      // If it's a teacher object, try to get the linked user._id first, then fallback to teacher._id
      const user = teacherObj.user;
      if (user && typeof user === 'object') {
        resolvedId = String(user._id || user.id || '');
      } else if (user && typeof user === 'string') {
        resolvedId = user;
      }
      // Fallback: use teacher's own _id so backend can look up by Teacher doc ID
      if (!resolvedId) {
        resolvedId = String(teacherObj._id || teacherObj.id || '');
      }
    } else {
      resolvedId = String(teacherObj || '');
    }

    console.log('[Password Modal] Teacher object:', teacherObj);
    console.log('[Password Modal] Resolved userId:', resolvedId);
    console.log('[Password Modal] API URL will be:', `/api/super-admin/user/${resolvedId}/password`);

    setPasswordModal({ open: true, userId: resolvedId, userName: name, visiblePassword: currentPass });
    setNewPasswordInput(currentPass || '');
    setModalShowPassword(false);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModal.userId || passwordModal.userId === '[object Object]' || passwordModal.userId === 'undefined') {
      showToast('Error: Invalid Teacher User ID — please refresh and try again.', 'error');
      alert('❌ Error: Could not resolve Teacher ID. Please refresh the page.');
      return;
    }
    if (!newPasswordInput || newPasswordInput.trim().length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }
    try {
      setUpdatingPassword(true);
      const url = `/api/super-admin/user/${passwordModal.userId}/password`;
      console.log('[handleSavePassword] PUT request to:', url, 'userId:', passwordModal.userId);
      const res = await API.put(url, {
        password: newPasswordInput.trim()
      });
      const msg = res.data?.message || `Password for ${passwordModal.userName} updated successfully!`;
      alert(`✅ Success!\n\n${msg}`);
      showToast(msg, 'success');
      setPasswordModal({ open: false, userId: '', userName: '' });
      fetchTeachers();
    } catch (err: any) {
      const status = (err as any).response?.status;
      const errorMsg = (err as any).response?.data?.message || (err as any).message || 'Failed to update password';
      console.error('[handleSavePassword] Error:', status, errorMsg, err);
      alert(`❌ Error (${status || 'Network'}): ${errorMsg}`);
      showToast(errorMsg, 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '',
    specialization: '', qualifications: '', experience: 0, department: '',
    subjects: [] as string[],
    classes: [] as string[]
  });

  // Dedicated Subject Teacher Account Creator State
  const [showSubjectTeacherModal, setShowSubjectTeacherModal] = useState(false);
  const [subTeacherCreating, setSubTeacherCreating] = useState(false);
  const [createdAccountDetails, setCreatedAccountDetails] = useState<any>(null);
  const [subTeacherForm, setSubTeacherForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'Teacher@123',
    className: '8th',
    section: 'A',
    subjectName: 'Mathematics'
  });

  useEffect(() => { 
    fetchTeachers(); 
    fetchSubjects();
    fetchClasses();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/api/academic-admin/teachers');
      setTeachers(res.data.data);
    } catch (e) { console.error(e); showToast('Failed to fetch teachers', 'error'); }
    finally { setLoading(false); }
  };

  const fetchSubjects = async () => {
    try {
      const res = await API.get('/api/academic-admin/subjects');
      setSubjectsList(res.data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchClasses = async () => {
    try {
      const res = await API.get('/api/academic-admin/classes');
      setClassesList(res.data.data || []);
    } catch (e) { console.error(e); }
  };

  const handleCreateSubjectTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubTeacherCreating(true);
    try {
      // Find matching class ID if exists
      const targetCls = classesList.find(
        c => String(c.className).toLowerCase() === String(subTeacherForm.className).toLowerCase() &&
             String(c.section).toLowerCase() === String(subTeacherForm.section).toLowerCase()
      );
      const classIds = targetCls ? [targetCls._id] : [];

      // Find matching subject ID if exists
      const targetSub = subjectsList.find(
        s => String(s.name).toLowerCase().includes(subTeacherForm.subjectName.toLowerCase())
      );
      const subjectIds = targetSub ? [targetSub._id] : [];

      const phoneRegex = /^\+91\d{10}$/;
      let formattedPhone = subTeacherForm.phone.trim();
      if (!phoneRegex.test(formattedPhone)) {
        if (/^\d{10}$/.test(formattedPhone)) {
          formattedPhone = `+91${formattedPhone}`;
        } else {
          showToast('Phone number must be 10 digits or start with +91', 'error');
          setSubTeacherCreating(false);
          return;
        }
      }

      const payload = {
        name: subTeacherForm.name.trim(),
        email: subTeacherForm.email.trim(),
        phone: formattedPhone,
        password: subTeacherForm.password.trim(),
        specialization: `${subTeacherForm.subjectName} Teacher`,
        department: 'Academic',
        qualifications: 'Subject Specialist',
        experience: 3,
        subjects: subjectIds,
        classes: classIds
      };

      await API.post('/api/academic-admin/teachers', payload);
      showToast(`✅ Subject Teacher Account created for Class ${subTeacherForm.className}-${subTeacherForm.section}!`, 'success');
      
      setCreatedAccountDetails({
        name: subTeacherForm.name,
        email: subTeacherForm.email,
        password: subTeacherForm.password,
        className: subTeacherForm.className,
        section: subTeacherForm.section,
        subject: subTeacherForm.subjectName
      });

      setShowSubjectTeacherModal(false);
      setSubTeacherForm({
        name: '',
        email: '',
        phone: '',
        password: 'Teacher@123',
        className: '8th',
        section: 'A',
        subjectName: 'Mathematics'
      });
      fetchTeachers();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error creating Subject Teacher account';
      showToast(msg, 'error');
      alert(`❌ Failed: ${msg}`);
    } finally {
      setSubTeacherCreating(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        const updateData = { ...formData };
        if (!updateData.password || updateData.password.trim() === '') {
          delete updateData.password;
        }
        delete updateData.email;
        await API.put(`/api/academic-admin/teachers/${editingTeacher._id}`, updateData);
        showToast('Teacher profile and password updated successfully!', 'success');
      } else {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        const phoneRegex = /^\+91\d{10}$/;
        if (!passwordRegex.test(formData.password)) {
          showToast('Password must be 8+ chars with uppercase, lowercase, number, and special character.', 'error');
          return;
        }
        if (!phoneRegex.test(formData.phone)) {
          showToast('Phone number must start with +91 followed by 10 digits (e.g., +919876543210)', 'error');
          return;
        }
        await API.post('/api/academic-admin/teachers', formData);
        showToast('New teacher account created successfully!', 'success');
      }
      setShowModal(false);
      setEditingTeacher(null);
      setFormData({ name: '', email: '', phone: '', password: '', specialization: '', qualifications: '', experience: 0, department: '', subjects: [], classes: [] });
      fetchTeachers();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Error saving teacher', 'error');
    }
  };

  const handleEdit = (teacher: any) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.user?.name || '',
      email: teacher.user?.email || '',
      phone: teacher.user?.phone || '',
      password: '',
      specialization: teacher.specialization || '',
      qualifications: teacher.qualifications || '',
      experience: teacher.experience || 0,
      department: teacher.department || '',
      subjects: teacher.subjects ? teacher.subjects.map((sub: any) => typeof sub === 'string' ? sub : sub._id) : [],
      classes: teacher.classes ? teacher.classes.map((cls: any) => typeof cls === 'string' ? cls : cls._id) : []
    });
    setShowModal(true);
  };

  const handleOpenDeleteModal = (teacher: any, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDeleteConfirmTeacher(teacher);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmTeacher) return;
    try {
      setDeleting(true);
      await API.delete(`/api/academic-admin/teachers/${deleteConfirmTeacher._id}`);
      showToast(`Teacher "${deleteConfirmTeacher.user?.name || 'Faculty'}" deleted successfully!`, 'success');
      setDeleteConfirmTeacher(null);
      fetchTeachers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete teacher', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const departments = Array.from(new Set(teachers.map(t => t.department).filter(Boolean)));
  const specializations = Array.from(new Set(teachers.map(t => t.specialization).filter(Boolean)));

  const filteredTeachers = teachers.filter((t: any) => {
    const name = t.user?.name || '';
    const email = t.user?.email || '';
    const phone = t.user?.phone || '';
    const spec = t.specialization || '';
    const dept = t.department || '';
    const exp = Number(t.experience || 0);

    const matchSearch = !searchQuery ||
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spec.toLowerCase().includes(searchQuery.toLowerCase());

    const matchDept = deptFilter === 'all' || dept === deptFilter;
    const matchSpec = specFilter === 'all' || spec === specFilter;
    const matchRole = roleFilter === 'all' ||
      (roleFilter === 'class-teacher' && t.isClassTeacher) ||
      (roleFilter === 'subject-teacher' && !t.isClassTeacher);

    let matchExp = true;
    if (expFilter === '1+') matchExp = exp >= 1;
    else if (expFilter === '3+') matchExp = exp >= 3;
    else if (expFilter === '5+') matchExp = exp >= 5;
    else if (expFilter === '10+') matchExp = exp >= 10;

    return matchSearch && matchDept && matchSpec && matchRole && matchExp;
  });
  const seniorCount = teachers.filter((t: any) => (t.experience || 0) >= 5).length;

  return (
    <>
      {/* Toast Notification Banner */}
      {toast && (
        <div style={{
          position: "fixed", top: "24px", right: "24px", zIndex: 1200,
          padding: "12px 20px", borderRadius: "12px",
          backgroundColor: toast.type === "success" ? "#10b981" : "#ef4444",
          color: "white", fontWeight: "700", fontSize: "14px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
          display: "flex", alignItems: "center", gap: "8px",
          animation: "slideIn 0.3s ease-out"
        }}>
          <span>{toast.type === "success" ? "✅" : "⚠️"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>👩‍🏫 Faculty & Teacher Directory</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '13px' }}>
            Manage faculty profiles, specializations, qualifications & class teacher roles.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button type="button" 
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-sm shadow-md"
            onClick={() => setShowSubjectTeacherModal(true)}
          >
            <FiBookOpen size={16} />
            <span>📘 Create Subject Teacher Account (Class &amp; Section)</span>
          </button>
          <button type="button" className="btn-primary flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-sm"
            onClick={() => { setEditingTeacher(null); setFormData({ name: '', email: '', phone: '', password: '', specialization: '', qualifications: '', experience: 0, department: '', subjects: [], classes: [] }); setShowModal(true); }}>
            <FiPlus /><span>Add Faculty Profile</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Faculty', value: teachers.length, color: '#3b82f6', icon: '👩‍🏫' },
          { label: 'Filtered Faculty', value: filteredTeachers.length, color: '#10b981', icon: '📊' },
          { label: 'Senior Teachers (5+ yrs)', value: seniorCount, color: '#8b5cf6', icon: '🎓' },
          { label: 'Academic Departments', value: departments.length || 3, color: '#f59e0b', icon: '🏛️' },
        ].map((m, idx) => (
          <div key={idx} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>{m.label}</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: m.color, marginTop: '4px' }}>{m.value}</div>
            </div>
            <span style={{ fontSize: '28px' }}>{m.icon}</span>
          </div>
        ))}
      </div>

      {/* Advanced Multi-Filter Bar */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '12px', 
        marginBottom: '20px', 
        backgroundColor: 'var(--card-bg)', 
        border: '1px solid var(--border-color)', 
        borderRadius: '14px', 
        padding: '16px',
        alignItems: 'flex-end'
      }}>
        {/* Search */}
        <div style={{ flex: '1 1 220px', position: 'relative' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
            🔍 Search Teacher / Subject
          </label>
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search by name, email, subject, phone..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Dept Filter */}
        <div style={{ width: '160px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
            🏬 Department
          </label>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}>
            <option value="all">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Specialization Filter */}
        <div style={{ width: '160px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
            📖 Specialization
          </label>
          <select value={specFilter} onChange={e => setSpecFilter(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}>
            <option value="all">All Specializations</option>
            {specializations.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Class Role Filter */}
        <div style={{ width: '150px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
            ⭐ Class Role
          </label>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}>
            <option value="all">All Roles</option>
            <option value="class-teacher">⭐ Class In-Charge</option>
            <option value="subject-teacher">Subject Teacher</option>
          </select>
        </div>

        {/* Experience Filter */}
        <div style={{ width: '140px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
            🎓 Experience
          </label>
          <select value={expFilter} onChange={e => setExpFilter(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}>
            <option value="all">All Experience</option>
            <option value="1+">1+ Years</option>
            <option value="3+">3+ Years</option>
            <option value="5+">5+ Years</option>
            <option value="10+">10+ Years</option>
          </select>
        </div>

        {/* Clear Button */}
        {(searchQuery || deptFilter !== 'all' || specFilter !== 'all' || roleFilter !== 'all' || expFilter !== 'all') && (
          <button onClick={() => { setSearchQuery(''); setDeptFilter('all'); setSpecFilter('all'); setRoleFilter('all'); setExpFilter('all'); }}
            style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: '700', fontSize: '12px', cursor: 'pointer', height: '36px' }}>
            🧹 Clear Filters
          </button>
        )}
      </div>

      {loading && <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Loading teachers data...</p>}

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Faculty Name</th><th>Contact Info</th><th>Specialization</th>
              <th>Password</th><th>Experience</th><th>Department</th><th>Qualifications</th>
              <th>Class Role</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.length > 0 ? filteredTeachers.map((teacher: any) => {
              const initials = teacher.user?.name
                ? teacher.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'T';
              const uId = (typeof teacher.user === 'object' && teacher.user !== null) ? (teacher.user._id || teacher._id) : (teacher.user || teacher._id);
              const visPass = teacher.user?.visiblePassword || '';
              return (
                <tr key={teacher._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--primary)', color: 'white', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials}</div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text-main)' }}>{teacher.user?.name}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{teacher.designation || 'Senior Faculty'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>{teacher.user?.email}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{teacher.user?.phone || 'N/A'}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', backgroundColor: 'rgba(99,102,241,0.1)', color: 'var(--primary)', alignSelf: 'flex-start' }}>
                        {teacher.specialization || 'General Subject'}
                      </span>
                      {/* Assigned Subjects */}
                      {teacher.subjects && teacher.subjects.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                          {teacher.subjects.map((sub: any) => (
                            <span key={sub._id || sub} style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'var(--panel-bg)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', fontWeight: '500' }}>
                              📚 {sub.name || sub}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Assigned Classes */}
                      {teacher.classes && teacher.classes.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                          {teacher.classes.map((cls: any) => (
                            <span key={cls._id || cls} style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', fontWeight: '600' }}>
                              🏫 {cls.className ? `Class ${cls.className}-${cls.section}` : cls}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: '700',
                        fontSize: '12px',
                        backgroundColor: 'var(--input-bg)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        minWidth: '85px',
                        textAlign: 'center',
                        color: visiblePasswordIds[uId] ? '#8b5cf6' : 'var(--text-muted)'
                      }}>
                        {visiblePasswordIds[uId] ? (visPass || 'Teacher@123') : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(uId)}
                        title={visiblePasswordIds[uId] ? "Hide Password" : "Show Password"}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
                      >
                        {visiblePasswordIds[uId] ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                      </button>
                    </div>
                  </td>
                  <td><strong style={{ fontSize: '13px' }}>{teacher.experience || 0} yrs</strong></td>
                  <td>{teacher.department || 'Academic'}</td>
                  <td style={{ fontSize: '13px' }}>{teacher.qualifications || 'B.Ed / M.Sc'}</td>
                  <td>
                    {teacher.isClassTeacher ? (
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: 'rgba(245,158,11,0.15)', color: '#d97706', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <FiStar size={11} /> Class In-Charge
                      </span>
                    ) : (
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: 'var(--panel-bg)', color: 'var(--text-muted)' }}>
                        Subject Teacher
                      </span>
                    )}
                  </td>
                  <td className="action-buttons">
                    <button type="button" style={{ padding: '5px 8px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }} onClick={() => openChangePasswordModal(teacher, teacher.user?.name || 'Teacher', visPass)} title="Update Password">🔑 Password</button>
                    <button type="button" className="action-btn edit" onClick={() => handleEdit(teacher)} title="Edit Teacher"><FiEdit2 /></button>
                    <button type="button" className="action-btn delete" onClick={(e) => handleOpenDeleteModal(teacher, e)} title="Delete Teacher"><FiTrash2 /></button>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No matching teacher records found.</td></tr>
            )}
          </tbody>
        </table>

      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-2xl max-h-[90vh] bg-[var(--card-bg)] text-[var(--text-main)] rounded-3xl shadow-2xl border border-[var(--border-color)] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--border-color)] shrink-0">
              <h2 className="text-lg sm:text-xl font-black">{editingTeacher ? 'Edit Teacher Profile' : 'Add New Faculty Profile'}</h2>
              <button type="button" className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-2xl font-bold p-1" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase text-[var(--text-muted)] mb-1">Name *</label>
                  <input type="text" name="name" className="w-full border border-[var(--border-color)] rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)] text-xs sm:text-sm" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase text-[var(--text-muted)] mb-1">Email *</label>
                  <input type="email" name="email" className={`w-full border border-[var(--border-color)] rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)] text-xs sm:text-sm ${editingTeacher ? 'opacity-60 cursor-not-allowed' : ''}`} value={formData.email} onChange={handleInputChange} disabled={editingTeacher} required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase text-[var(--text-muted)] mb-1">Phone *</label>
                  <input type="tel" name="phone" maxLength={13} className="w-full border border-[var(--border-color)] rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)] text-xs sm:text-sm" value={formData.phone} onChange={handleInputChange} required />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase text-[var(--text-muted)] mb-1">
                    {editingTeacher ? 'New Password (optional)' : 'Password *'}
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      name="password" 
                      placeholder={editingTeacher ? 'Leave blank to keep current' : 'Enter password'} 
                      className="w-full border border-[var(--border-color)] rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)] text-xs sm:text-sm pr-10" 
                      value={formData.password} 
                      onChange={handleInputChange} 
                      required={!editingTeacher} 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-[var(--text-muted)]">
                      {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase text-[var(--text-muted)] mb-1">Specialization *</label>
                  <input type="text" name="specialization" className="w-full border border-[var(--border-color)] rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)] text-xs sm:text-sm" value={formData.specialization} onChange={handleInputChange} placeholder="e.g., Mathematics" required />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase text-[var(--text-muted)] mb-1">Department</label>
                  <input type="text" name="department" className="w-full border border-[var(--border-color)] rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)] text-xs sm:text-sm" value={formData.department} onChange={handleInputChange} placeholder="e.g., Science" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase text-[var(--text-muted)] mb-1">Experience (Years)</label>
                  <input type="number" name="experience" className="w-full border border-[var(--border-color)] rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)] text-xs sm:text-sm" value={formData.experience} onChange={handleInputChange} min="0" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase text-[var(--text-muted)] mb-1">Qualifications</label>
                  <input type="text" name="qualifications" className="w-full border border-[var(--border-color)] rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)] text-xs sm:text-sm" value={formData.qualifications} onChange={handleInputChange} placeholder="e.g., B.Sc, M.Ed" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Assign Subjects */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase mb-1 flex items-center gap-1 text-[var(--text-main)]">
                    📚 Assign Particular Subject(s) *
                  </label>
                  <div className="grid grid-cols-1 gap-1.5 p-3 border border-[var(--border-color)] rounded-xl bg-[var(--input-bg)] max-h-36 overflow-y-auto w-full box-border">
                    {subjectsList.map((sub: any) => {
                      const isChecked = formData.subjects.includes(sub._id);
                      return (
                        <label key={sub._id} className="flex items-center gap-2 text-xs font-semibold cursor-pointer p-1.5 hover:bg-[var(--card-bg)] rounded-lg transition-colors text-[var(--text-main)]">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const updatedSubjects = e.target.checked
                                ? [...formData.subjects, sub._id]
                                : formData.subjects.filter(id => id !== sub._id);
                              setFormData({ ...formData, subjects: updatedSubjects });
                            }}
                            className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="truncate" title={`${sub.name} (${sub.code})`}>
                            {sub.name} <span className="opacity-60 font-normal">({sub.code})</span>
                          </span>
                        </label>
                      );
                    })}
                    {subjectsList.length === 0 && (
                      <div className="text-center text-xs text-[var(--text-muted)] py-4">
                        No subjects available.
                      </div>
                    )}
                  </div>
                </div>

                {/* Assign Classes & Sections */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase mb-1 flex items-center gap-1 text-[var(--text-main)]">
                    🏫 Assign Particular Class(es) &amp; Section(s) *
                  </label>
                  <div className="grid grid-cols-1 gap-1.5 p-3 border border-[var(--border-color)] rounded-xl bg-[var(--input-bg)] max-h-36 overflow-y-auto w-full box-border">
                    {classesList.map((cls: any) => {
                      const isChecked = formData.classes.includes(cls._id);
                      return (
                        <label key={cls._id} className="flex items-center gap-2 text-xs font-semibold cursor-pointer p-1.5 hover:bg-[var(--card-bg)] rounded-lg transition-colors text-[var(--text-main)]">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const updatedClasses = e.target.checked
                                ? [...formData.classes, cls._id]
                                : formData.classes.filter(id => id !== cls._id);
                              setFormData({ ...formData, classes: updatedClasses });
                            }}
                            className="w-4 h-4 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="truncate">
                            Class {cls.className} — Section {cls.section}
                          </span>
                        </label>
                      );
                    })}
                    {classesList.length === 0 && (
                      <div className="text-center text-xs text-[var(--text-muted)] py-4">
                        No classes available.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons Sticky Footer */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-[var(--border-color)] sticky bottom-0 bg-[var(--card-bg)] z-10">
                <button 
                  type="button" 
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-main)] font-bold text-xs sm:text-sm hover:bg-[var(--hover-bg)] transition-all cursor-pointer text-center" 
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-lg hover:shadow-indigo-500/30 transition-all cursor-pointer active:scale-95 text-center"
                >
                  {editingTeacher ? 'Update Faculty Profile' : '💾 Save & Create Faculty Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {passwordModal.open && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)',
            borderRadius: '20px', width: '100%', maxWidth: '440px', padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>🔑 Change Password</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Updating password for <strong>{passwordModal.userName}</strong></p>
              </div>
              <button onClick={() => setPasswordModal({ open: false, userId: '', userName: '' })} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSavePassword}>
              <div style={{ marginBottom: '20px', position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>New Password</label>
                <input
                  type={modalShowPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPasswordInput}
                  onChange={e => setNewPasswordInput(e.target.value)}
                  placeholder="Enter new password"
                  style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' }}
                />
                <button type="button" onClick={() => setModalShowPassword(!modalShowPassword)} style={{ position: 'absolute', right: '10px', top: '32px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {modalShowPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setPasswordModal({ open: false, userId: '', userName: '' })} style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--panel-bg)', color: 'var(--text-main)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={updatingPassword} style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#8b5cf6', color: 'white', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>{updatingPassword ? 'Updating...' : '🔒 Save Password'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deleteConfirmTeacher && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100, padding: "16px" }} onClick={() => !deleting && setDeleteConfirmTeacher(null)}>
          <div style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "20px", width: "100%", maxWidth: "460px", padding: "28px", boxShadow: "0 25px 50px rgba(0,0,0,0.4)" }} onClick={e => e.stopPropagation()}>
            <div style={{ width: "56px", height: "56px", borderRadius: "16px", backgroundColor: "rgba(239,68,68,0.12)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <FiTrash2 size={26} />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: "800", textAlign: "center", color: "var(--text-main)" }}>Delete Teacher Record?</h3>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: "var(--text-muted)", textAlign: "center", lineHeight: "1.5" }}>
              Are you sure you want to delete <strong>"{deleteConfirmTeacher.user?.name || deleteConfirmTeacher.name}"</strong>? This will permanently remove their profile and login account.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button type="button" onClick={() => setDeleteConfirmTeacher(null)} disabled={deleting} style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "1px solid var(--border-color)", backgroundColor: "var(--input-bg)", color: "var(--text-main)", fontWeight: "700", cursor: "pointer", fontSize: "14px" }}>
                Cancel
              </button>
              <button type="button" onClick={handleConfirmDelete} disabled={deleting} style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "none", backgroundColor: "#ef4444", color: "white", fontWeight: "700", cursor: deleting ? "not-allowed" : "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DEDICATED SUBJECT TEACHER ACCOUNT CREATOR MODAL ── */}
      {showSubjectTeacherModal && (() => {
        const selectedClassObj = classesList.find(
          c => String(c.className).toLowerCase().replace(/class/i, '').trim() === String(subTeacherForm.className).toLowerCase().replace(/class/i, '').trim() &&
               String(c.section).toLowerCase().trim() === String(subTeacherForm.section).toLowerCase().trim()
        );

        const availableSubjects = (selectedClassObj?.subjects && selectedClassObj.subjects.length > 0)
          ? selectedClassObj.subjects
          : subjectsList;

        return (
          <div className="fixed inset-0 z-[99999] bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--card-bg)] text-[var(--text-main)] w-full max-w-xl rounded-3xl p-7 shadow-2xl border border-[var(--border-color)]">
            <div className="flex justify-between items-start mb-5 border-b border-[var(--border-color)] pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold mb-1">
                  📘 Super Admin Subject Teacher Account Generator
                </div>
                <h3 className="text-xl font-black text-[var(--text-main)]">Create Subject Teacher Portal Account</h3>
                <p className="text-xs text-[var(--text-muted)]">Class-wise &amp; Section-wise Subject Teacher login creation</p>
              </div>
              <button onClick={() => setShowSubjectTeacherModal(false)} className="p-2 rounded-full hover:bg-[var(--input-bg)] text-[var(--text-muted)]">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubjectTeacher} className="space-y-4">
              {/* Class, Section & Subject Selection Card */}
              <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl space-y-3">
                <p className="text-xs font-black uppercase text-indigo-800 flex items-center gap-1">
                  🏫 Select Target Class, Section &amp; Subject
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">Class *</label>
                    <select
                      required
                      value={subTeacherForm.className}
                      onChange={e => setSubTeacherForm({ ...subTeacherForm, className: e.target.value })}
                      className="w-full p-2.5 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl text-sm font-bold text-[var(--text-main)] outline-none focus:ring-2 ring-indigo-500/20"
                    >
                      {['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(c => (
                        <option key={c} value={c}>Class {c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">Section *</label>
                    <select
                      required
                      value={subTeacherForm.section}
                      onChange={e => setSubTeacherForm({ ...subTeacherForm, section: e.target.value })}
                      className="w-full p-2.5 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl text-sm font-bold text-[var(--text-main)] outline-none focus:ring-2 ring-indigo-500/20"
                    >
                      {['A', 'B', 'C', 'D', 'E', 'F'].map(s => (
                        <option key={s} value={s}>Section {s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                      Subject {selectedClassObj?.subjects?.length ? `(${selectedClassObj.subjects.length} Assigned)` : ''} *
                    </label>
                    <select
                      required
                      value={subTeacherForm.subjectName}
                      onChange={e => setSubTeacherForm({ ...subTeacherForm, subjectName: e.target.value })}
                      className="w-full p-2.5 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl text-sm font-bold text-[var(--text-main)] outline-none focus:ring-2 ring-indigo-500/20"
                    >
                      <option value="">Select Subject</option>
                      {availableSubjects.length > 0 ? (
                        availableSubjects.map((sub: any) => {
                          const subName = typeof sub === 'object' ? sub.name : sub;
                          const subCode = typeof sub === 'object' && sub.code ? ` (${sub.code})` : '';
                          return (
                            <option key={typeof sub === 'object' ? sub._id : sub} value={subName}>
                              {subName}{subCode}
                            </option>
                          );
                        })
                      ) : (
                        <option value="" disabled>No subjects assigned to this class</option>
                      )}
                    </select>
                  </div>
                </div>
                {selectedClassObj && selectedClassObj.subjects?.length > 0 && (
                  <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                    ✓ Showing {selectedClassObj.subjects.length} assigned subject(s) for Class {selectedClassObj.className}-{selectedClassObj.section}
                  </p>
                )}
              </div>

              {/* Teacher Account Credentials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">Teacher Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={subTeacherForm.name}
                    onChange={e => setSubTeacherForm({ ...subTeacherForm, name: e.target.value })}
                    className="w-full p-3 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-main)] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">Teacher Email (Portal Login) *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul.maths@school.com"
                    value={subTeacherForm.email}
                    onChange={e => setSubTeacherForm({ ...subTeacherForm, email: e.target.value })}
                    className="w-full p-3 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-main)] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">Phone Number (+91) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+919876543210"
                    value={subTeacherForm.phone}
                    onChange={e => setSubTeacherForm({ ...subTeacherForm, phone: e.target.value })}
                    className="w-full p-3 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-main)] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">Login Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Teacher@123"
                    value={subTeacherForm.password}
                    onChange={e => setSubTeacherForm({ ...subTeacherForm, password: e.target.value })}
                    className="w-full p-3 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-main)] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowSubjectTeacherModal(false)} className="flex-1 py-3 bg-[var(--input-bg)] text-[var(--text-muted)] rounded-xl font-bold hover:bg-[var(--border-color)]">
                  Cancel
                </button>
                <button type="submit" disabled={subTeacherCreating} className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2">
                  {subTeacherCreating ? <FiRefreshCw className="animate-spin" /> : '📘 Create Subject Teacher Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
        );
      })()}

      {/* ── SUCCESS CREATED ACCOUNT DETAILS MODAL ── */}
      {createdAccountDetails && (
        <div className="fixed inset-0 z-[999999] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--card-bg)] text-[var(--text-main)] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-emerald-200 text-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-black">
              ✓
            </div>
            <h3 className="text-xl font-black text-[var(--text-main)] mb-1">Subject Teacher Account Created!</h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">Handover these portal login credentials to the teacher:</p>

            <div className="bg-[var(--input-bg)] border border-[var(--border-color)] p-4 rounded-2xl text-left space-y-2 mb-5 font-mono text-xs">
              <div><span className="text-[var(--text-muted)]">Teacher Name:</span> <strong className="text-[var(--text-main)]">{createdAccountDetails.name}</strong></div>
              <div><span className="text-[var(--text-muted)]">Email Login:</span> <strong className="text-indigo-600">{createdAccountDetails.email}</strong></div>
              <div><span className="text-[var(--text-muted)]">Password:</span> <strong className="text-purple-600">{createdAccountDetails.password}</strong></div>
              <div><span className="text-[var(--text-muted)]">Class &amp; Section:</span> <strong className="text-emerald-600">Class {createdAccountDetails.className}-{createdAccountDetails.section}</strong></div>
              <div><span className="text-[var(--text-muted)]">Assigned Subject:</span> <strong className="text-amber-600">{createdAccountDetails.subject}</strong></div>
            </div>

            <button
              onClick={() => setCreatedAccountDetails(null)}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md"
            >
              Done &amp; Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// ─────────────────────────────────────────────────────────────
//  TAB 2 — Class Teacher Assignment (NEW)
// ─────────────────────────────────────────────────────────────
const ClassTeacherAssignment = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [classDetails, setClassDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [assigningTeacherId, setAssigningTeacherId] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [searchClass, setSearchClass] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, teachersRes] = await Promise.all([
        API.get('/api/academic-admin/classes'),
        API.get('/api/academic-admin/teachers')
      ]);
      setClasses(classesRes.data.data || []);
      setTeachers(teachersRes.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSelectClass = async (cls: any) => {
    setSelectedClass(cls);
    setAssigningTeacherId(cls.classTeacher?._id || '');
    setClassDetails(null);
    setExpandedSubject(null);
    await fetchClassDetails(cls._id);
  };

  const fetchClassDetails = async (classId: string) => {
    try {
      setDetailsLoading(true);
      const res = await API.get(`/api/academic-admin/classes/${classId}/subject-teachers`);
      setClassDetails(res.data.data);
    } catch (e) { console.error(e); }
    finally { setDetailsLoading(false); }
  };

  const handleAssignClassTeacher = async () => {
    if (!selectedClass) return;
    try {
      setSaving(true);
      const uName = localStorage.getItem("userName") || localStorage.getItem("name") || "";
      const uRole = (localStorage.getItem("role") || "admin").replace('-', ' ').toUpperCase();
      const formattedAdmin = uName ? `${uName} (${uRole})` : uRole;

      await API.put(`/api/academic-admin/classes/${selectedClass._id}/assign-class-teacher`, {
        teacherId: assigningTeacherId || null,
        updatedBy: formattedAdmin
      });
      alert(assigningTeacherId ? '✅ Class Teacher assigned successfully!' : '✅ Class Teacher unassigned!');
      await fetchData();
      const updatedClass = (await API.get('/api/academic-admin/classes')).data.data.find(c => c._id === selectedClass._id);
      if (updatedClass) {
        setSelectedClass(updatedClass);
        await fetchClassDetails(updatedClass._id);
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error assigning class teacher');
    } finally { setSaving(false); }
  };

  const filteredClasses = classes.filter(c =>
    !searchClass ||
    `Class ${c.className} - ${c.section}`.toLowerCase().includes(searchClass.toLowerCase()) ||
    c.academicYear?.toLowerCase().includes(searchClass.toLowerCase())
  );

  const assignedCount = classes.filter(c => c.classTeacher).length;
  const unassignedCount = classes.filter(c => !c.classTeacher).length;

  return (
    <>
      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>⭐ Class Teacher Assignment</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '13px' }}>
            Class ke hisab se Class Teacher assign karo aur us class ke sabhi Subject Teachers ki details dekho.
          </p>
        </div>
        <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Classes', value: classes.length, color: '#3b82f6', icon: '🏛️' },
          { label: 'Class Teachers Assigned', value: assignedCount, color: '#10b981', icon: '⭐' },
          { label: 'Unassigned Classes', value: unassignedCount, color: unassignedCount > 0 ? '#ef4444' : '#10b981', icon: '⚠️' },
          { label: 'Total Teachers', value: teachers.length, color: '#8b5cf6', icon: '👩‍🏫' },
        ].map((m, idx) => (
          <div key={idx} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>{m.label}</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: m.color, marginTop: '4px' }}>{m.value}</div>
            </div>
            <span style={{ fontSize: '28px' }}>{m.icon}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* LEFT PANEL — Class List */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '10px', color: 'var(--text-main)' }}>📋 Select a Class</div>
            <div style={{ position: 'relative' }}>
              <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '13px' }} />
              <input type="text" placeholder="Search class..." value={searchClass} onChange={e => setSearchClass(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }} />
            </div>
          </div>

          <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading classes...</div>
            ) : filteredClasses.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No classes found.</div>
            ) : filteredClasses.map(cls => {
              const isSelected = selectedClass?._id === cls._id;
              const hasTeacher = !!cls.classTeacher;
              return (
                <div key={cls._id} onClick={() => handleSelectClass(cls)}
                  style={{
                    padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)',
                    background: isSelected ? 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(99,102,241,0.08) 100%)' : 'transparent',
                    borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
                    transition: 'all 0.18s'
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px', color: isSelected ? '#3b82f6' : 'var(--text-main)' }}>
                        Class {cls.className} — {cls.section}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{cls.academicYear}</div>
                    </div>
                    <span style={{
                      fontSize: '11px', fontWeight: '700', padding: '3px 9px', borderRadius: '20px',
                      background: hasTeacher ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
                      color: hasTeacher ? '#10b981' : '#ef4444'
                    }}>
                      {hasTeacher ? '✓ Assigned' : '✗ Unassigned'}
                    </span>
                  </div>
                  {hasTeacher && (
                    <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FiStar size={11} color="#f59e0b" />
                      <span>{cls.classTeacher?.user?.name || cls.classTeacher?.name || 'Assigned'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL — Class Details */}
        <div>
          {!selectedClass ? (
            <div style={{ background: 'var(--card-bg)', border: '2px dashed var(--border-color)', borderRadius: '14px', padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👈</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Pehle ek class select karo</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Left side se class select karo — class teacher assign karne ke liye aur subject teachers ki details dekhne ke liye.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Class Info Card */}
              <div style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)', borderRadius: '14px', padding: '22px 24px', color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '13px', opacity: 0.75, fontWeight: '600', marginBottom: '4px' }}>Selected Class</div>
                    <div style={{ fontSize: '26px', fontWeight: '900' }}>Class {selectedClass.className} — Section {selectedClass.section}</div>
                    <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px' }}>Academic Year: {selectedClass.academicYear} &nbsp;|&nbsp; Room: {selectedClass.room || 'N/A'} &nbsp;|&nbsp; Capacity: {selectedClass.capacity}</div>
                  </div>
                  <span style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
                    {selectedClass.subjects?.length || 0} Subjects
                  </span>
                </div>
              </div>

              {/* Assign Class Teacher Card */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '22px 24px' }}>
                <div style={{ fontWeight: '800', fontSize: '15px', marginBottom: '6px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiStar color="#f59e0b" /> Class Teacher Assign Karo
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px', margin: '0 0 16px' }}>
                  Is class ke liye ek Class Teacher (In-Charge) select karo. Class teacher class ki zimmedari sambhalta hai.
                </p>

                {/* Current Class Teacher Banner */}
                {classDetails?.classTeacher && (
                  <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px', flexShrink: 0 }}>
                      {classDetails.classTeacher.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', color: '#d97706', fontSize: '14px' }}>{classDetails.classTeacher.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{classDetails.classTeacher.specialization} &nbsp;·&nbsp; {classDetails.classTeacher.experience} yrs exp</div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#d97706', background: 'rgba(245,158,11,0.15)', padding: '3px 10px', borderRadius: '20px' }}>⭐ Current Class Teacher</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>Teacher Select Karo</label>
                    <select value={assigningTeacherId} onChange={e => setAssigningTeacherId(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '14px', outline: 'none', cursor: 'pointer' }}>
                      <option value="">— Koi Class Teacher Nahi (Unassign) —</option>
                      {teachers.map(t => (
                        <option key={t._id} value={t._id}>
                          {t.user?.name} ({t.specialization || 'General'}) — {t.experience || 0} yrs
                        </option>
                      ))}
                    </select>
                  </div>
                  <button onClick={handleAssignClassTeacher} disabled={saving}
                    style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: saving ? '#94a3b8' : 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                    {saving ? <><FiRefreshCw /> Saving...</> : <><FiCheck /> Assign Class Teacher</>}
                  </button>
                </div>
              </div>

              {/* Subject Teachers Section */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FiBookOpen color="#3b82f6" size={18} />
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-main)' }}>Subject-wise Teacher Details</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Is class mein kaun sa teacher kaunsa subject padhata hai</div>
                  </div>
                </div>

                {detailsLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading class details...</div>
                ) : !classDetails ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Details load nahi hui.</div>
                ) : classDetails.subjectTeachers?.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>📭</div>
                    <div style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>Koi subject assign nahi hai</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Pehle is class mein subjects assign karo "Class Teacher Section" tab se.</div>
                  </div>
                ) : (
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {classDetails.subjectTeachers.map((item: any, idx: number) => {
                      const isExpanded = expandedSubject === item.subject._id;
                      const hasTeachers = item.teachers?.length > 0;
                      return (
                        <div key={item.subject._id}
                          style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', transition: 'all 0.2s' }}>
                          {/* Subject Header */}
                          <div onClick={() => setExpandedSubject(isExpanded ? null : item.subject._id)}
                            style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: isExpanded ? 'rgba(59,130,246,0.06)' : 'var(--panel-bg)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `hsl(${(idx * 47) % 360}, 70%, 55%)`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', flexShrink: 0 }}>
                                {item.subject.code?.slice(0, 2)}
                              </div>
                              <div>
                                <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>{item.subject.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Code: {item.subject.code}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px',
                                background: hasTeachers ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                color: hasTeachers ? '#10b981' : '#ef4444' }}>
                                {hasTeachers ? `${item.teachers.length} Teacher${item.teachers.length > 1 ? 's' : ''}` : 'No Teacher'}
                              </span>
                              {isExpanded ? <FiChevronUp color="var(--text-muted)" /> : <FiChevronDown color="var(--text-muted)" />}
                            </div>
                          </div>

                          {/* Expanded Teacher List */}
                          {isExpanded && (
                            <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
                              {!hasTeachers ? (
                                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                                  ⚠️ Is subject ke liye koi teacher assign nahi hai is class mein.
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  {item.teachers.map((teacher: any) => (
                                    <div key={teacher._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'var(--panel-bg)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #3b82f6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px', flexShrink: 0 }}>
                                        {teacher.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>{teacher.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FiMail size={11} />{teacher.email || 'N/A'}</span>
                                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FiPhone size={11} />{teacher.phone || 'N/A'}</span>
                                        </div>
                                      </div>
                                      <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '3px 10px', borderRadius: '20px' }}>
                                          {teacher.specialization || 'General'}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{teacher.experience} yrs exp</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* All Subject Teachers Summary */}
                {classDetails?.allSubjectTeachers?.length > 0 && (
                  <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--panel-bg)' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '10px' }}>👨‍🏫 Is Class mein Assign Sabhi Teachers ({classDetails.allSubjectTeachers.length})</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {classDetails.allSubjectTeachers.map((t: any) => (
                        <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '20px', fontSize: '12px', fontWeight: '600', color: 'var(--text-main)' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '800' }}>
                            {t.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <span>{t.name}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({t.subjects?.map(s => s.code).join(', ') || 'N/A'})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TeachersAcademicManagement;