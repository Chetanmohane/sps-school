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
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [creditFilter, setCreditFilter] = useState('all');

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

  const totalCreditsSum = subjects.reduce((acc: number, curr: any) => acc + (Number(curr.credits) || 0), 0);
  const avgCredits = subjects.length ? (totalCreditsSum / subjects.length).toFixed(1) : '0.0';

  const filteredSubjects = subjects.filter((sub: any) => {
    const name = (sub.name || '').toLowerCase();
    const code = (sub.code || '').toLowerCase();
    const desc = (sub.description || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const credits = Number(sub.credits || 0);

    const matchSearch = !searchQuery || name.includes(query) || code.includes(query) || desc.includes(query);
    let matchCredit = true;
    if (creditFilter === '1') matchCredit = credits === 1;
    else if (creditFilter === '2') matchCredit = credits === 2;
    else if (creditFilter === '3') matchCredit = credits === 3;
    else if (creditFilter === '4+') matchCredit = credits >= 4;

    return matchSearch && matchCredit;
  });

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="dashboard-container" style={{ padding: '24px' }}>
          <AcademicTabs />

          {/* Header Banner */}
          <div className="dashboard-header" style={{ marginBottom: '20px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>📖 Academic Subjects Catalog</h1>
              <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '13px' }}>
                Subjects Catalog — Define course names, codes, credit weights, syllabi, and active statuses.
              </p>
            </div>
            <button className="btn-primary flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors" onClick={handleNewSubject}>
              <FiPlus /> 
              <span>Add New Subject</span>
            </button>
          </div>

          {/* Metric Cards Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Total Subjects Offered', value: subjects.length, color: '#3b82f6', icon: '📖' },
              { label: 'Filtered Subjects', value: filteredSubjects.length, color: '#10b981', icon: '📊' },
              { label: 'Total Course Credits', value: `${totalCreditsSum} Cr`, color: '#8b5cf6', icon: '🎓' },
              { label: 'Avg Credits per Subject', value: `${avgCredits} Cr`, color: '#f59e0b', icon: '⚡' },
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

          {/* ── Advanced Subject Multi-Filter Bar ── */}
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
            <div style={{ flex: '1 1 240px', position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                🔍 Search Subject / Code
              </label>
              <input
                type="text"
                placeholder="Search by subject name, code, description..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            {/* Credits Filter */}
            <div style={{ width: '160px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                🎓 Course Credits
              </label>
              <select
                value={creditFilter}
                onChange={e => setCreditFilter(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}
              >
                <option value="all">All Credits</option>
                <option value="1">1 Credit</option>
                <option value="2">2 Credits</option>
                <option value="3">3 Credits</option>
                <option value="4+">4+ Credits</option>
              </select>
            </div>

            {/* Clear Button */}
            {(searchQuery || creditFilter !== 'all') && (
              <button
                onClick={() => { setSearchQuery(''); setCreditFilter('all'); }}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: '700', fontSize: '12px', cursor: 'pointer', height: '36px' }}
              >
                🧹 Clear Filters
              </button>
            )}
          </div>

          {loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading subjects...</p>}

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
                {filteredSubjects.length > 0 ? (
                  filteredSubjects.map((subject) => (
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