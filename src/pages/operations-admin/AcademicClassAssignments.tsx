import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import AcademicTabs from '../../components/AcademicTabs';
import { FiPlus, FiEdit2, FiTrash2, FiClock, FiMapPin} from 'react-icons/fi';

const ClassAssignmentsManagement = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [expandedClassId, setExpandedClassId] = useState(null);
  
  // Multi-Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [allocFilter, setAllocFilter] = useState('all');
  const [showGlobalTimingModal, setShowGlobalTimingModal] = useState(false);
  const [globalTiming, setGlobalTiming] = useState({
    startTime: '08:00',
    endTime: '14:00'
  });

  const [formData, setFormData] = useState({
    className: '',
    section: 'A',
    academicYear: '2026-2027',
    classTeacher: '',
    subjects: [],
    capacity: 40,
    startTime: '08:00', 
    endTime: '14:00', 
    room: ''       
  });

  const getTeacherForSubjectInClass = (subjectId, className, section, schoolClass) => {
    // 1. Check if schoolClass has classTeacher assigned
    const matchingTeacher = teachers.find(t => {
      const teachesClass = t.classes?.some(c => (c.className === className && c.section === section) || c._id === schoolClass?._id);
      const teachesSubject = t.subjects?.some(s => s._id === subjectId || s === subjectId);
      return teachesClass && teachesSubject;
    });
    if (matchingTeacher) return matchingTeacher.user?.name || 'Assigned';
    if (schoolClass?.classTeacher?.user?.name) return `${schoolClass.classTeacher.user.name} (Class Teacher)`;
    return 'Not Assigned';
  };

  const getSubjectPeriodTime = (baseStart = '08:00', index = 0) => {
    let [hours, mins] = (baseStart || '08:00').split(':').map(Number);
    if (isNaN(hours)) hours = 8;
    if (isNaN(mins)) mins = 0;

    let totalMins = hours * 60 + mins + index * 45;
    if (index >= 3) {
      totalMins += 15; // 15-min tea/recess break after 3rd period
    }

    const startH = Math.floor(totalMins / 60);
    const startM = totalMins % 60;
    const endMins = totalMins + 45;
    const endH = Math.floor(endMins / 60);
    const endM = endMins % 60;

    const formatTime = (h, m) => {
      const period = h >= 12 ? 'PM' : 'AM';
      const formattedH = h % 12 === 0 ? 12 : h % 12;
      const formattedM = m < 10 ? `0${m}` : m;
      return `${formattedH}:${formattedM} ${period}`;
    };

    return {
      periodNum: index + 1,
      timeRange: `${formatTime(startH, startM)} - ${formatTime(endH, endM)}`
    };
  };

  const format12HourTime = (timeStr) => {
    if (!timeStr) return '08:00 AM';
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h)) return timeStr;
    const period = h >= 12 ? 'PM' : 'AM';
    const formattedH = h % 12 === 0 ? 12 : h % 12;
    const formattedM = (m !== undefined && !isNaN(m)) ? (m < 10 ? `0${m}` : m) : '00';
    return `${formattedH < 10 ? '0' + formattedH : formattedH}:${formattedM} ${period}`;
  };

  const toggleClassExpand = (classId) => {
    setExpandedClassId(prev => prev === classId ? null : classId);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, subjectsRes, teachersRes] = await Promise.allSettled([
        API.get('/api/academic-admin/classes'),
        API.get('/api/academic-admin/subjects'),
        API.get('/api/academic-admin/teachers')
      ]);
      setClasses(classesRes.status === 'fulfilled' ? (classesRes.value.data?.data || []) : []);
      setSubjects(subjectsRes.status === 'fulfilled' ? (subjectsRes.value.data?.data || []) : []);
      setTeachers(teachersRes.status === 'fulfilled' ? (teachersRes.value.data?.data || []) : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubjectToggle = (subjectId) => {
    setFormData({
      ...formData,
      subjects: formData.subjects.includes(subjectId)
        ? formData.subjects.filter(id => id !== subjectId)
        : [...formData.subjects, subjectId]
    });
  };

  const handleUpdateGlobalTiming = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const adminUserName = localStorage.getItem("userName") || "Super Admin";
      const adminUserRole = localStorage.getItem("role") || "super-admin";
      const formattedAdmin = `${adminUserName} (${adminUserRole.replace('-', ' ').toUpperCase()})`;

      const res = await API.put('/api/academic-admin/classes/update-global-timings', {
        startTime: globalTiming.startTime,
        endTime: globalTiming.endTime,
        updatedBy: formattedAdmin
      });

      alert(res.data.message || `Global class timings updated to ${globalTiming.startTime} - ${globalTiming.endTime} across all classes!`);
      setShowGlobalTimingModal(false);
      await fetchData();
    } catch (error) {
      console.error('Error updating global timings:', error);
      alert('Failed to update global class timings: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.classTeacher && !formData.classTeacher.match(/^[0-9a-f]{24}$/i)) {
      alert('Invalid teacher selected');
      return;
    }

    const adminUserName = localStorage.getItem("userName") || "Super Admin";
    const adminUserRole = localStorage.getItem("role") || "super-admin";
    const formattedAdmin = `${adminUserName} (${adminUserRole.replace('-', ' ').toUpperCase()})`;
    const payload = { ...formData, updatedBy: formattedAdmin };

    try {
      if (editingClass) {
        await API.put(`/api/academic-admin/classes/${editingClass._id}`, payload);
        alert(`Class updated successfully by ${formattedAdmin}!`);
      } else {
        await API.post('/api/academic-admin/classes', payload);
        alert(`Class created successfully by ${formattedAdmin}!`);
      }
      setShowModal(false);
      setEditingClass(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.message || error.message || 'Error saving class');
    }
  };

  const resetForm = () => {
    setFormData({
      className: '',
      section: 'A',
      academicYear: '2026-2027',
      classTeacher: '',
      subjects: [],
      capacity: 40,
      startTime: '08:00',
      endTime: '14:00',
      room: ''
    });
  };

  const handleEdit = (schoolClass) => {
    setEditingClass(schoolClass);
    setFormData({
      className: schoolClass.className,
      section: schoolClass.section,
      academicYear: schoolClass.academicYear,
      classTeacher: schoolClass.classTeacher?._id || '',
      subjects: schoolClass.subjects?.map(s => s._id) || [],
      capacity: schoolClass.capacity,
      startTime: schoolClass.startTime || '',
      endTime: schoolClass.endTime || '',
      room: schoolClass.room || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await API.delete(`/api/academic-admin/classes/${classId}`);
        alert('Class deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete class');
      }
    }
  };

  const handleNewClass = () => {
    setEditingClass(null);
    resetForm();
    setShowModal(true);
  };

  const assignedClassTeachersCount = classes.filter((c: any) => c.classTeacher).length;
  const unassignedClassesCount = classes.filter((c: any) => !c.classTeacher).length;
  const totalCapacitySum = classes.reduce((acc: number, curr: any) => acc + (curr.capacity || 0), 0);

  const uniqueGrades = Array.from(new Set(classes.map((c: any) => c.className).filter(Boolean))).sort();
  const uniqueSections = Array.from(new Set(classes.map((c: any) => c.section).filter(Boolean))).sort();

  const filteredClasses = classes.filter((c: any) => {
    const classStr = `${c.className} ${c.section}`.toLowerCase();
    const teacherStr = (c.classTeacher?.user?.name || '').toLowerCase();
    const roomStr = (c.room || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchSearch = !searchQuery || classStr.includes(query) || teacherStr.includes(query) || roomStr.includes(query);
    const matchGrade = gradeFilter === 'all' || c.className === gradeFilter;
    const matchSection = sectionFilter === 'all' || c.section === sectionFilter;
    const matchAlloc = allocFilter === 'all' ||
      (allocFilter === 'assigned' && c.classTeacher) ||
      (allocFilter === 'vacant' && !c.classTeacher);

    return matchSearch && matchGrade && matchSection && matchAlloc;
  });

  return (
    <div className="app-layout">
      <Sidebar />
  
      <main className="main-content">
        <Navbar />
        <div className="dashboard-container" style={{ padding: '24px' }}>
          <AcademicTabs />
          
          {/* Header Banner */}
          <div className="dashboard-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>👔 Class Teacher & Class Section Management</h1>
              <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '13px' }}>
                Class Teacher Section — Assign Class Teachers (In-Charges) for each class section, set room numbers, timings & subjects.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button 
                onClick={() => setShowGlobalTimingModal(true)}
                style={{ padding: '9px 16px', backgroundColor: 'rgba(99,102,241,0.15)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Update Class Timings across all classes in the school"
              >
                <FiClock size={15} /> ⏰ Update Global Class Timings
              </button>

              <button className="btn-primary flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors" 
                onClick={handleNewClass}>
                <FiPlus /> 
                <span>Add New Class Section</span>
              </button>
            </div>
          </div>

          {/* Metric Cards Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Total Class Sections', value: classes.length, color: '#3b82f6', icon: '🏛️' },
              { label: 'Filtered Sections', value: filteredClasses.length, color: '#10b981', icon: '📊' },
              { label: 'Class Teachers Assigned', value: assignedClassTeachersCount, color: '#8b5cf6', icon: '⭐' },
              { label: 'Unassigned Sections', value: unassignedClassesCount, color: unassignedClassesCount > 0 ? '#ef4444' : '#10b981', icon: '⚠️' },
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

          {/* ── Advanced Class Multi-Filter Bar ── */}
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '12px', 
            marginBottom: '24px', 
            backgroundColor: 'var(--card-bg)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '14px', 
            padding: '16px',
            alignItems: 'flex-end'
          }}>
            {/* Search */}
            <div style={{ flex: '1 1 220px', position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                🔍 Search Class / Teacher / Room
              </label>
              <input
                type="text"
                placeholder="Search class, section, teacher, room..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            {/* Grade Filter */}
            <div style={{ width: '140px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                🏫 Grade
              </label>
              <select
                value={gradeFilter}
                onChange={e => setGradeFilter(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}
              >
                <option value="all">All Grades</option>
                {uniqueGrades.map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>

            {/* Section Filter */}
            <div style={{ width: '130px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                🅰️ Section
              </label>
              <select
                value={sectionFilter}
                onChange={e => setSectionFilter(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}
              >
                <option value="all">All Sections</option>
                {uniqueSections.map(s => (
                  <option key={s} value={s}>Section {s}</option>
                ))}
              </select>
            </div>

            {/* In-Charge Allocation Filter */}
            <div style={{ width: '170px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                ⭐ In-Charge Status
              </label>
              <select
                value={allocFilter}
                onChange={e => setAllocFilter(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}
              >
                <option value="all">All Statuses</option>
                <option value="assigned">⭐ Teacher Assigned</option>
                <option value="vacant">⚠️ Vacant In-Charge</option>
              </select>
            </div>

            {/* Clear Button */}
            {(searchQuery || gradeFilter !== 'all' || sectionFilter !== 'all' || allocFilter !== 'all') && (
              <button
                onClick={() => { setSearchQuery(''); setGradeFilter('all'); setSectionFilter('all'); setAllocFilter('all'); }}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: '700', fontSize: '12px', cursor: 'pointer', height: '36px' }}
              >
                🧹 Clear Filters
              </button>
            )}
          </div>

          {/* Class In-Charges Card Grid */}
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👔 Class Teachers (In-Charges) Directory</span>
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {filteredClasses.map((cls: any) => {
                const teacherObj = cls.classTeacher?.user || {};
                const teacherName = teacherObj.name || 'Not Assigned';
                const teacherEmail = teacherObj.email || '';
                const teacherPhone = teacherObj.phone || '';
                return (
                  <div key={cls._id} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px', transition: 'transform 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)' }}>
                        Class {cls.className} - {cls.section}
                      </span>
                      <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', backgroundColor: cls.classTeacher ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: cls.classTeacher ? '#10b981' : '#ef4444', fontWeight: '700' }}>
                        {cls.classTeacher ? 'Assigned' : 'Vacant'}
                      </span>
                    </div>

                    <div style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Class In-Charge</div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: cls.classTeacher ? 'var(--text-main)' : '#ef4444' }}>
                        {teacherName}
                      </div>
                      {teacherEmail && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{teacherEmail}</div>}
                      {teacherPhone && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📞 {teacherPhone}</div>}
                    </div>

                    {(() => {
                      const startTimeFormatted = format12HourTime(cls.startTime || '08:00');
                      const endTimeFormatted = format12HourTime(cls.endTime || '14:00');
                      return (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                          <span style={{ fontWeight: '800', color: '#6366f1' }}>🕒 Class Timing: {startTimeFormatted} - {endTimeFormatted}</span>
                          <span>📍 Room {cls.room || 'N/A'}</span>
                        </div>
                      );
                    })()}

                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '12px', backgroundColor: 'var(--panel-bg)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>👔 Modified By:</span>
                      <span style={{ color: 'var(--primary)' }}>{cls.updatedBy || 'Super Admin'}</span>
                    </div>

                    <button
                      onClick={() => handleEdit(cls)}
                      style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid var(--primary)', backgroundColor: 'transparent', color: 'var(--primary)', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <FiEdit2 size={13} /> Edit Class Teacher & Subjects
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {loading && <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Loading classes...</p>}

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Timings</th> 
                  <th>Room</th>  
                  <th>Academic Year</th>
                  <th>Class Teacher</th>
                  <th>Subjects</th>
                  <th>Class Capacity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.length > 0 ? (
                  classes.map((schoolClass) => (
                    <React.Fragment key={schoolClass._id}>
                      <tr className="hover:bg-[var(--input-bg)]/50 transition-colors">
                        <td><strong>{schoolClass.className}</strong></td>
                        <td>{schoolClass.section}</td>
                        <td>
                          <div className="flex items-center gap-1 text-xs">
                            <FiClock className="text-indigo-500" />
                            {schoolClass.startTime} - {schoolClass.endTime}
                          </div>
                        </td>
                      
                        <td>
                          <div className="flex items-center gap-1 text-xs">
                            <FiMapPin className="text-red-400" />
                            {schoolClass.room || 'N/A'}
                          </div>
                        </td>

                        <td>{schoolClass.academicYear}</td>
                        <td>{schoolClass.classTeacher?.user?.name || '-'}</td>
                        <td>
                          {schoolClass.subjects && schoolClass.subjects.length > 0
                            ? schoolClass.subjects.map(s => s.code).join(', ')
                            : '-'
                          }
                        </td>
                        <td>{schoolClass.capacity}</td>
                        <td>
                          <span className={`badge ${schoolClass.status === 'active' ? 'approved' : 'pending'}`}>
                            {schoolClass.status}
                          </span>
                        </td>
                        <td className="action-buttons">
                          <button 
                            className="action-btn view" 
                            onClick={() => toggleClassExpand(schoolClass._id)} 
                            title="View Details"
                            style={{
                              backgroundColor: expandedClassId === schoolClass._id ? 'var(--primary)' : 'rgba(99, 102, 241, 0.1)',
                              color: expandedClassId === schoolClass._id ? 'white' : 'var(--primary)',
                              padding: '6px',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                          >
                            {expandedClassId === schoolClass._id ? '⬆️' : '👁️ Details'}
                          </button>
                          <button className="action-btn edit" onClick={() => handleEdit(schoolClass)} title="Edit">
                            <FiEdit2 />
                          </button>
                          <button className="action-btn delete" onClick={() => handleDelete(schoolClass._id)} title="Delete">
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                      {expandedClassId === schoolClass._id && (
                        <tr>
                          <td colSpan={10} style={{ padding: '20px 24px', backgroundColor: 'var(--input-bg)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                              
                              {/* 1. Class Teacher Details Card */}
                              <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>👑 Class Teacher</h4>
                                {schoolClass.classTeacher ? (
                                  <div>
                                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>
                                      {schoolClass.classTeacher.user?.name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                      📧 {schoolClass.classTeacher.user?.email}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                      🎓 Specialization: {schoolClass.classTeacher.specialization || 'N/A'}
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ color: 'var(--danger)', fontSize: '13px', fontWeight: '600', fontStyle: 'italic' }}>
                                    ⚠️ No Class Teacher assigned to this class.
                                  </div>
                                )}
                                <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                  <div>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>CLASS TIMING</span>
                                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <FiClock className="text-indigo-500" />
                                      {format12HourTime(schoolClass.startTime || '08:00')} - {format12HourTime(schoolClass.endTime || '14:00')}
                                    </div>
                                  </div>
                                  <div>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CLASS ROOM</span>
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <FiMapPin className="text-red-400" />
                                      Room {schoolClass.room || 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 2. Subjects & Teacher Assignments list */}
                              <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px', flex: 2 }}>
                                <h4 style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>📚 Subjects, Period Timings & Assigned Teachers</span>
                                  <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600', textTransform: 'none' }}>
                                    {schoolClass.subjects ? schoolClass.subjects.length : 0} Subjects Assigned
                                  </span>
                                </h4>
                                {schoolClass.subjects && schoolClass.subjects.length > 0 ? (
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '12px' }}>
                                    {schoolClass.subjects.map((sub, idx) => {
                                      const teacherName = getTeacherForSubjectInClass(sub._id, schoolClass.className, schoolClass.section, schoolClass);
                                      const periodInfo = getSubjectPeriodTime(schoolClass.startTime, idx);

                                      return (
                                        <div key={sub._id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: 'var(--panel-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                              <span>📖 {sub.name}</span>
                                              <span style={{ fontSize: '10px', color: 'var(--primary)', backgroundColor: 'var(--primary-bg)', padding: '2px 6px', borderRadius: '4px', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)' }}>{sub.code}</span>
                                            </div>
                                            <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '6px', backgroundColor: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
                                              Period {periodInfo.periodNum}
                                            </span>
                                          </div>

                                          <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(99,102,241,0.08)', padding: '4px 8px', borderRadius: '6px' }}>
                                            <FiClock size={12} />
                                            <span>Timing: {periodInfo.timeRange}</span>
                                          </div>

                                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
                                            👨‍🏫 Teacher: <strong style={{ color: teacherName === 'Not Assigned' ? 'var(--danger)' : 'var(--text-main)' }}>{teacherName}</strong>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                                    No subjects assigned to this class yet.
                                  </div>
                                )}
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '20px' }}>
                      No classes found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        {/* Modal Overlay */}
        {showModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" 
            onClick={() => setShowModal(false)}
          >
            <div 
              className="w-full max-w-2xl bg-[var(--card-bg)] text-[var(--text-main)] rounded-lg shadow-xl max-h-[90vh] flex flex-col border border-[var(--border-color)]" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] sticky top-0 z-10 rounded-t-lg">
                <h2 className="text-xl font-semibold text-[var(--text-main)]">
                  {editingClass ? 'Edit Class' : 'Add New Class'}
                </h2>
                <button 
                  className="text-gray-400 hover:text-[var(--text-muted)] transition-colors text-2xl leading-none" 
                  onClick={() => setShowModal(false)}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                {/* Row 1: Class Name & Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-[var(--text-main)] mb-1">Class Name *</label>
                    <input
                      type="text"
                      name="className"
                      className="w-full border border-[var(--border-color)] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)] placeholder-gray-400"
                      value={formData.className}
                      onChange={handleInputChange}
                      placeholder="e.g., 10"
                      required
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-[var(--text-main)] mb-1">Section *</label>
                    <select
                      name="section"
                      className="w-full border border-[var(--border-color)] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)]"
                      value={formData.section}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-indigo-600">Start Time (HH:MM) *</label>
                    <input type="time" name="startTime" className="w-full border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-main)] p-2 rounded focus:ring-2 focus:ring-indigo-500" value={formData.startTime} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-indigo-600">End Time (HH:MM) *</label>
                    <input type="time" name="endTime" className="w-full border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-main)] p-2 rounded focus:ring-2 focus:ring-indigo-500" value={formData.endTime} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--text-main)]">Room No.</label>
                    <input type="text" name="room" className="w-full border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-main)] p-2 rounded focus:outline-none" value={formData.room} onChange={handleInputChange} placeholder="e.g., 101" />
                  </div>
                </div>

                {/* Row 2: Academic Year & Capacity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-[var(--text-main)] mb-1">Academic Year *</label>
                    <input
                      type="text"
                      name="academicYear"
                      className="w-full border border-[var(--border-color)] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)] placeholder-gray-400"
                      value={formData.academicYear}
                      onChange={handleInputChange}
                      placeholder="e.g., 2024-2025"
                      required
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-[var(--text-main)] mb-1">Capacity</label>
                    <input
                      type="number"
                      name="capacity"
                      className="w-full border border-[var(--border-color)] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)]"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      min="1"
                    />
                  </div>
                </div>

                {/* Class Teacher Dropdown */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-[var(--text-main)] mb-1">Class Teacher</label>
                  <select
                    name="classTeacher"
                    className="w-full border border-[var(--border-color)] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)]"
                    value={formData.classTeacher}
                    onChange={handleInputChange}
                  >
                    <option value="">Select a teacher</option>
                    {teachers && teachers.length > 0 ? (
                      teachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.user?.name || 'Unknown Teacher'} ({teacher.specialization})
                        </option>
                      ))
                    ) : (
                      <option disabled>No teachers available</option>
                    )}
                  </select>
                </div>

                {/* Assign Subjects Checkboxes */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-[var(--text-main)] mb-2">Assign Subjects</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-[var(--input-bg)] rounded-md border border-[var(--border-color)]">
                    {subjects.map((subject) => (
                      <label key={subject._id} className="flex items-center gap-2 cursor-pointer text-sm text-[var(--text-main)] hover:text-indigo-600 transition-colors">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-indigo-600 border-[var(--border-color)] rounded focus:ring-indigo-500"
                          checked={formData.subjects.includes(subject._id)}
                          onChange={() => handleSubjectToggle(subject._id)}
                        />
                        <span className="truncate">{subject.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center gap-3 pt-6 border-t border-[var(--border-color)] sticky bottom-0 bg-[var(--card-bg)] text-[var(--text-main)]">
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    {editingClass ? 'Update Class' : 'Create Class'}
                  </button>
                  <button
                    type="button"
                    className="px-6 py-2 bg-[var(--card-bg)] text-[var(--text-main)] border border-[var(--border-color)] text-[var(--text-main)] font-medium rounded-md hover:bg-[var(--input-bg)] transition-colors"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Global Class Timing Modal */}
        {showGlobalTimingModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" 
            onClick={() => setShowGlobalTimingModal(false)}
          >
            <div 
              className="w-full max-w-md bg-[var(--card-bg)] text-[var(--text-main)] rounded-xl shadow-2xl p-6 border border-[var(--border-color)]" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-[var(--border-color)]">
                <div>
                  <h3 className="text-lg font-bold text-indigo-500 flex items-center gap-2">
                    ⏰ Update Global School Class Timings
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    This will update class start & end timings across ALL school classes simultaneously.
                  </p>
                </div>
                <button 
                  onClick={() => setShowGlobalTimingModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateGlobalTiming} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">
                    🌅 School Start Time (e.g. 08:00 AM)
                  </label>
                  <input
                    type="time"
                    required
                    value={globalTiming.startTime}
                    onChange={(e) => setGlobalTiming({ ...globalTiming, startTime: e.target.value })}
                    className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">
                    🌇 School End Time (e.g. 02:00 PM)
                  </label>
                  <input
                    type="time"
                    required
                    value={globalTiming.endTime}
                    onChange={(e) => setGlobalTiming({ ...globalTiming, endTime: e.target.value })}
                    className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-sm font-semibold"
                  />
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-600 font-semibold">
                  ⚡ Note: Updating global timings will instantly sync all class schedules and period timings for every subject in the school portal.
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[var(--border-color)]">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-md text-sm"
                  >
                    Apply & Update All Classes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGlobalTimingModal(false)}
                    className="px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border-color)] font-semibold rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        </div>
      </main>
    </div>
  );
};

export default ClassAssignmentsManagement;