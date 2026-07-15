import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import AcademicTabs from '../../components/AcademicTabs';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff} from 'react-icons/fi';

const TeachersAcademicManagement = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    specialization: '',
    qualifications: '',
    experience: 0,
    department: ''
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/academic-admin/teachers');
      setTeachers(response.data.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      alert('Failed to fetch teachers');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        // Update teacher
        const updateData = { ...formData };
        delete updateData.password; // Don't send password on update
        delete updateData.email; // Don't change email
        await API.put(`/api/academic-admin/teachers/${editingTeacher._id}`, updateData);
        alert('Teacher updated successfully');
      } 
      else {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        const phoneRegex = /^\+91\d{10}$/;

        if (!passwordRegex.test(formData.password)) {
          alert("Password must be 8+ chars with uppercase, lowercase, number, and special character.");
          return;
        }

        if (!phoneRegex.test(formData.phone)) {
          alert("Phone number must start with +91 followed by 10 digits (e.g., +919876543210)");
          return;
        }
        // Create new teacher
        await API.post('/api/academic-admin/teachers', formData);
        alert('Teacher created successfully');
      }
      setShowModal(false);
      setEditingTeacher(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        specialization: '',
        qualifications: '',
        experience: 0,
        department: ''
      });
      fetchTeachers();
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.message || 'Error saving teacher');
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.user.name,
      email: teacher.user.email,
      phone: teacher.user.phone,
      password: '',
      specialization: teacher.specialization,
      qualifications: teacher.qualifications,
      experience: teacher.experience,
      department: teacher.department
    });
    setShowModal(true);
  };

  const handleDelete = async (teacherId) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await API.delete(`/api/academic-admin/teachers/${teacherId}`);
        alert('Teacher deleted successfully');
        fetchTeachers();
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete teacher');
      }
    }
  };

  const handleNewTeacher = () => {
    setEditingTeacher(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      specialization: '',
      qualifications: '',
      experience: 0,
      department: ''
    });
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
              <h1>Teacher Management</h1>
              <p style={{ color: 'var(--text-muted)' }}>Manage teachers and their details.</p>
            </div>
            <button className="btn-primary flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors" onClick={handleNewTeacher}>
              <FiPlus /> 
              <span>Add Teacher</span>
            </button>
          </div>

          {loading && <p>Loading teachers...</p>}

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Specialization</th>
                  <th>Experience (Years)</th>
                  <th>Department</th>
                  <th>Qualifications</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.length > 0 ? (
                  teachers.map((teacher) => (
                    <tr key={teacher._id}>
                      <td>{teacher.user.name}</td>
                      <td>{teacher.user.email}</td>
                      <td>{teacher.user.phone}</td>
                      <td>{teacher.specialization}</td>
                      <td>{teacher.experience}</td>
                      <td>{teacher.department || '-'}</td>
                      <td>{teacher.qualifications || '-'}</td>
                      <td>
                        <span className={`badge ${teacher.status === 'active' ? 'approved' : 'pending'}`}>
                          {teacher.status}
                        </span>
                      </td>
                      <td className="action-buttons">
                        <button className="action-btn edit" onClick={() => handleEdit(teacher)} title="Edit">
                          <FiEdit2 />
                        </button>
                        <button className="action-btn delete" onClick={() => handleDelete(teacher._id)} title="Delete">
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>
                      No teachers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
              <div className="w-full max-w-2xl bg-[var(--card-bg)] text-[var(--text-main)] rounded-lg shadow-xl overflow-hidden border border-[var(--border-color)]" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
                  <h2 className="text-xl font-semibold text-[var(--text-main)]">{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h2>
                  <button className="text-gray-400 hover:text-[var(--text-muted)] transition-colors text-2xl" onClick={() => setShowModal(false)}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-[var(--text-main)] mb-1">Name *</label>
                      <input
                        type="text"
                        name="name"
                        className="w-full border border-[var(--border-color)] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)]"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-[var(--text-main)] mb-1">Email *</label>
                      <input
                        type="email"
                        name="email"
                        className={`w-full border border-[var(--border-color)] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)] ${editingTeacher ? 'opacity-60 cursor-not-allowed' : ''}`}
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={editingTeacher}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-[var(--text-main)] mb-1">Phone *</label>
                      <input
                        type="tel"
                        name="phone"
                        maxLength={13}
                        className="w-full border border-[var(--border-color)] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)]"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    {!editingTeacher && (
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-[var(--text-main)] mb-1">Password *</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            className="w-full border border-[var(--border-color)] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)]"
                            value={formData.password}
                            onChange={handleInputChange}
                            required={!editingTeacher}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-[var(--text-muted)]"
                          >
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-[var(--text-main)] mb-1">Specialization *</label>
                      <input
                        type="text"
                        name="specialization"
                        className="w-full border border-[var(--border-color)] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)] placeholder-gray-400"
                        value={formData.specialization}
                        onChange={handleInputChange}
                        placeholder="e.g., Mathematics"
                        required
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-[var(--text-main)] mb-1">Department</label>
                      <input
                        type="text"
                        name="department"
                        className="w-full border border-[var(--border-color)] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)] placeholder-gray-400"
                        value={formData.department}
                        onChange={handleInputChange}
                        placeholder="e.g., Science"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-[var(--text-main)] mb-1">Experience (Years)</label>
                      <input
                        type="number"
                        name="experience"
                        className="w-full border border-[var(--border-color)] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)]"
                        value={formData.experience}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-[var(--text-main)] mb-1">Qualifications</label>
                      <input
                        type="text"
                        name="qualifications"
                        className="w-full border border-[var(--border-color)] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)]"
                        value={formData.qualifications}
                        onChange={handleInputChange}
                        placeholder="e.g., B.Sc, M.Ed"
                      />
                    </div>
                  </div>

                  <div className="form-buttons space-x-4">
                    <button type="submit" className="btn-primary">
                      {editingTeacher ? 'Update Teacher' : 'Create Teacher'}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
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

export default TeachersAcademicManagement;