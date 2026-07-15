import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import AcademicTabs from '../../components/AcademicTabs';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

const SubjectsManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    credits: 3,
    syllabus: ''
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/academic-admin/subjects');
      setSubjects(response.data.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      alert('Failed to fetch subjects');
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
      if (editingSubject) {
        await API.put(`/api/academic-admin/subjects/${editingSubject._id}`, formData);
        alert('Subject updated successfully');
      } else {
        await API.post('/api/academic-admin/subjects', formData);
        alert('Subject created successfully');
      }
      setShowModal(false);
      setEditingSubject(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        credits: 3,
        syllabus: ''
      });
      fetchSubjects();
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.message || 'Error saving subject');
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      description: subject.description,
      credits: subject.credits,
      syllabus: subject.syllabus
    });
    setShowModal(true);
  };

  const handleDelete = async (subjectId) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await API.delete(`/api/academic-admin/subjects/${subjectId}`);
        alert('Subject deleted successfully');
        fetchSubjects();
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete subject');
      }
    }
  };

  const handleNewSubject = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      credits: 3,
      syllabus: ''
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
              <h1>Subject Management</h1>
              <p style={{ color: 'var(--text-muted)' }}>Create and manage school subjects.</p>
            </div>
            <button className="btn-primary flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors" onClick={handleNewSubject}>
              <FiPlus /> 
              <span>Add Subject</span>
            </button>
          </div>

          {loading && <p>Loading subjects...</p>}

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject Name</th>
                  <th>Code</th>
                  <th>Credits</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.length > 0 ? (
                  subjects.map((subject) => (
                    <tr key={subject._id}>
                      <td>{subject.name}</td>
                      <td><strong>{subject.code}</strong></td>
                      <td>{subject.credits}</td>
                      <td>{subject.description || '-'}</td>
                      <td>
                        <span className={`badge ${subject.status === 'active' ? 'approved' : 'pending'}`}>
                          {subject.status}
                        </span>
                      </td>
                      <td className="action-buttons">
                        <button className="action-btn edit" onClick={() => handleEdit(subject)} title="Edit">
                          <FiEdit2 />
                        </button>
                        <button className="action-btn delete" onClick={() => handleDelete(subject._id)} title="Delete">
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>
                      No subjects found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Modal Overlay */}
          {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" 
            onClick={() => setShowModal(false)}>

            <div className="w-full max-w-2xl bg-[var(--card-bg)] text-[var(--text-main)] rounded-lg shadow-xl overflow-hidden border border-[var(--border-color)]" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
                <h2 className="text-xl font-semibold text-[var(--text-main)]">
                  {editingSubject ? 'Edit Subject' : 'Add New Subject'}
                </h2>
                <button className="text-gray-400 hover:text-[var(--text-muted)] transition-colors text-2xl" 
                  onClick={() => setShowModal(false)}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-[var(--text-main)] mb-1">Subject Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="w-full border border-[var(--border-color)] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)] placeholder-gray-400"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Mathematics"
                      required
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-[var(--text-main)] mb-1">Subject Code *</label>
                    <input
                      type="text"
                      name="code"
                      className="w-full border border-[var(--border-color)] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)] placeholder-gray-400"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="e.g., MATH101"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-[var(--text-main)] mb-1">Credits</label>
                    <input
                      type="number"
                      name="credits"
                      className="w-full border border-[var(--border-color)] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)]"
                      value={formData.credits}
                      onChange={handleInputChange}
                      min="1"
                      max="10"
                    />
                  </div>
                </div>

                {/* Description - Full Width */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-[var(--text-main)] mb-1">Description</label>
                  <textarea
                    name="description"
                    className="w-full border border-[var(--border-color)] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)] placeholder-gray-400"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Subject description"
                    rows={3}
                  />
                </div>

                {/* Syllabus - Full Width */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-[var(--text-main)] mb-1">Syllabus</label>
                  <textarea
                    name="syllabus"
                    className="w-full border border-[var(--border-color)] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--input-bg)] text-[var(--text-main)] placeholder-gray-400"
                    value={formData.syllabus}
                    onChange={handleInputChange}
                    placeholder="Subject syllabus content"
                    rows={4}
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-[var(--border-color)]">
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    {editingSubject ? 'Update Subject' : 'Create Subject'}
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

export default SubjectsManagement;