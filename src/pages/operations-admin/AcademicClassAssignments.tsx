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
  const [formData, setFormData] = useState({
    className: '',
    section: 'A',
    academicYear: '',
    classTeacher: '',
    subjects: [],
    capacity: 0,
    startTime: '', 
    endTime: '', 
    room: ''       
  });

  const getTeacherForSubjectInClass = (subjectId, className, section) => {
    const matchingTeacher = teachers.find(t => {
      const teachesClass = t.classes?.some(c => c.className === className && c.section === section);
      const teachesSubject = t.subjects?.some(s => s._id === subjectId);
      return teachesClass && teachesSubject;
    });
    return matchingTeacher ? matchingTeacher.user?.name : 'Not Assigned';
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
      const [classesRes, subjectsRes, teachersRes] = await Promise.all([
        API.get('/api/academic-admin/classes'),
        API.get('/api/academic-admin/subjects'),
        API.get('/api/academic-admin/teachers')
      ]);
      setClasses(classesRes.data.data);
      setSubjects(subjectsRes.data.data);
      setTeachers(teachersRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data: ' + (error.response?.data?.message || error.message));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.classTeacher && !formData.classTeacher.match(/^[0-9a-f]{24}$/i)) {
      alert('Invalid teacher selected');
      return;
    }

    try {
      if (editingClass) {
        await API.put(`/api/academic-admin/classes/${editingClass._id}`, formData);
        alert('Class updated successfully');
      } else {
        await API.post('/api/academic-admin/classes', formData);
        alert('Class created successfully');
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
      academicYear: '',
      classTeacher: '',
      subjects: [],
      capacity: 0,
      startTime: '',
      endTime: '',
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

  return (
    <div className="app-layout">
      <Sidebar />
  
      <main className="main-content">
        <Navbar />
        <div className="dashboard-container">
          <AcademicTabs />
          <div className="dashboard-header">
            <div>
              <h1>Class Management</h1>
              <p style={{ color: 'var(--text-muted)' }}>Manage classes, assign teachers and subjects.</p>
            </div>
            <button className="btn-primary flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors" 
              onClick={handleNewClass}>
              <FiPlus /> 
              <span>Add Class</span>
            </button>
          </div>

          {loading && <p>Loading classes...</p>}

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
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CLASS TIMING</span>
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <FiClock className="text-indigo-500" />
                                      {schoolClass.startTime} - {schoolClass.endTime}
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
                                <h4 style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
                                  <span>📚 Subjects & Assigned Teachers</span>
                                  <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600', textTransform: 'none' }}>
                                    {schoolClass.subjects ? schoolClass.subjects.length : 0} Subjects Assigned
                                  </span>
                                </h4>
                                {schoolClass.subjects && schoolClass.subjects.length > 0 ? (
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                                    {schoolClass.subjects.map((sub) => {
                                      const teacherName = getTeacherForSubjectInClass(sub._id, schoolClass.className, schoolClass.section);
                                      return (
                                        <div key={sub._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--panel-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px' }}>
                                          <div style={{ fontSize: '20px' }}>📖</div>
                                          <div>
                                            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)' }}>
                                              {sub.name} <span style={{ fontSize: '10px', color: 'var(--primary)', backgroundColor: 'var(--primary-bg)', padding: '1px 4px', borderRadius: '4px' }}>{sub.code}</span>
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                              👨‍🏫 Teacher: <strong style={{ color: teacherName === 'Not Assigned' ? 'var(--danger)' : 'var(--text-main)' }}>{teacherName}</strong>
                                            </div>
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

        </div>
      </main>
    </div>
  );
};

export default ClassAssignmentsManagement;