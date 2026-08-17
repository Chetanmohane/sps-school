import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import AcademicTabs from '../../components/AcademicTabs';
import { 
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiGrid, FiList, FiBookOpen, 
  FiFileText, FiLayers, FiCheckCircle, FiXCircle, FiRefreshCw, FiDownload,
  FiBook
} from 'react-icons/fi';

const SubjectsManagement = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Core Academic',
    classLevel: 'All Classes',
    description: '',
    syllabus: '',
    status: 'active'
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/academic-admin/subjects');
      const data = response.data?.data || response.data || [];
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      if (window.showToast) {
        window.showToast('Failed to fetch subjects list', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await API.put(`/api/academic-admin/subjects/${editingSubject._id}`, formData);
        if (window.showToast) window.showToast('Subject updated successfully! 📚', 'success');
      } else {
        await API.post('/api/academic-admin/subjects', formData);
        if (window.showToast) window.showToast('New Subject created successfully! ✨', 'success');
      }
      setShowModal(false);
      setEditingSubject(null);
      resetForm();
      fetchSubjects();
    } catch (error: any) {
      console.error('Error saving subject:', error);
      const errMsg = error.response?.data?.message || 'Error saving subject';
      if (window.showToast) window.showToast(errMsg, 'error');
      else alert(errMsg);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      category: 'Core Academic',
      classLevel: 'All Classes',
      description: '',
      syllabus: '',
      status: 'active'
    });
  };

  const handleEdit = (subject: any) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name || '',
      code: subject.code || '',
      category: subject.category || 'Core Academic',
      classLevel: subject.classLevel || 'All Classes',
      description: subject.description || '',
      syllabus: subject.syllabus || '',
      status: subject.status || 'active'
    });
    setShowModal(true);
  };

  const handleDelete = (subjectId: string) => {
    setSubjectToDelete(subjectId);
  };

  const confirmDeleteSubject = async () => {
    if (!subjectToDelete) return;
    try {
      await API.delete(`/api/academic-admin/subjects/${subjectToDelete}`);
      if (window.showToast) window.showToast('Subject removed successfully', 'success');
      fetchSubjects();
    } catch (error) {
      console.error('Error deleting subject:', error);
      if (window.showToast) window.showToast('Failed to delete subject', 'error');
    }
    setSubjectToDelete(null);
  };

  const handleNewSubject = () => {
    setEditingSubject(null);
    resetForm();
    setShowModal(true);
  };

  const exportSubjectsCSV = () => {
    if (subjects.length === 0) return;
    let csv = "Subject Name,Subject Code,Category,Target Class,Description,Status\n";
    subjects.forEach((s) => {
      csv += `"${s.name || ''}","${s.code || ''}","${s.category || 'Core'}","${s.classLevel || 'All'}","${(s.description || '').replace(/"/g, '""')}","${s.status || 'active'}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Academic_Subjects_Catalog_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    if (window.showToast) window.showToast('CSV Exported successfully!', 'success');
  };

  const filteredSubjects = subjects.filter((sub: any) => {
    const name = (sub.name || '').toLowerCase();
    const code = (sub.code || '').toLowerCase();
    const desc = (sub.description || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchSearch = !searchQuery || name.includes(query) || code.includes(query) || desc.includes(query);
    const matchCategory = categoryFilter === 'ALL' || (sub.category || 'Core Academic') === categoryFilter;
    const matchStatus = statusFilter === 'ALL' || (sub.status || 'active') === statusFilter;

    return matchSearch && matchCategory && matchStatus;
  });

  const getSubjectEmoji = (name: string) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('math') || lower.includes('algebra')) return '📐';
    if (lower.includes('physic') || lower.includes('scien')) return '🔬';
    if (lower.includes('chem')) return '🧪';
    if (lower.includes('bio')) return '🧬';
    if (lower.includes('computer') || lower.includes('code') || lower.includes('it')) return '💻';
    if (lower.includes('english') || lower.includes('liter')) return '📖';
    if (lower.includes('hindi') || lower.includes('sanskrit') || lower.includes('lang')) return '🗣️';
    if (lower.includes('social') || lower.includes('history') || lower.includes('geog')) return '🌍';
    if (lower.includes('art') || lower.includes('craft') || lower.includes('music')) return '🎨';
    if (lower.includes('sport') || lower.includes('pe') || lower.includes('fit')) return '⚽';
    return '📚';
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="dashboard-container" style={{ padding: '16px 20px 32px', maxWidth: '1400px', margin: '0 auto' }}>
          
          {/* Responsive Academic Tabs Navigation */}
          <AcademicTabs />

          {/* Header Banner */}
          <div
            style={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '24px',
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div
                    style={{
                      backgroundColor: 'rgba(99, 102, 241, 0.12)',
                      color: '#6366F1',
                      padding: '10px',
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FiBookOpen size={24} />
                  </div>
                  <div>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>
                      Subject Portal & Course Catalog
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                      Define academic subjects, course codes, syllabus modules, and class allocations.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={fetchSubjects}
                  title="Refresh List"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--panel-bg)',
                    color: 'var(--text-main)',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                <button
                  onClick={exportSubjectsCSV}
                  title="Export Subjects to CSV"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--panel-bg)',
                    color: 'var(--text-main)',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <FiDownload />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>

                <button
                  onClick={handleNewSubject}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '12px',
                    backgroundColor: '#4F46E5',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                    transition: 'all 0.2s',
                  }}
                >
                  <FiPlus size={16} />
                  <span>Add New Subject</span>
                </button>
              </div>
            </div>
          </div>

          {/* Metric Cards Row - Responsive Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            {[
              {
                title: 'Total Subjects',
                count: subjects.length,
                color: '#6366F1',
                bgColor: 'rgba(99, 102, 241, 0.1)',
                icon: <FiBook size={22} />,
              },
              {
                title: 'Active Subjects',
                count: subjects.filter((s) => s.status === 'active' || !s.status).length,
                color: '#10B981',
                bgColor: 'rgba(16, 185, 129, 0.1)',
                icon: <FiCheckCircle size={22} />,
              },
              {
                title: 'Core Academics',
                count: subjects.filter((s) => (s.category || '').includes('Core') || !s.category).length,
                color: '#3B82F6',
                bgColor: 'rgba(59, 130, 246, 0.1)',
                icon: <FiLayers size={22} />,
              },
              {
                title: 'Filtered Result',
                count: filteredSubjects.length,
                color: '#8B5CF6',
                bgColor: 'rgba(139, 92, 246, 0.1)',
                icon: <FiFileText size={22} />,
              },
            ].map((metric, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {metric.title}
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px' }}>
                    {metric.count}
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: metric.bgColor,
                    color: metric.color,
                    borderRadius: '14px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {metric.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Controls & Filter Bar - Fully Responsive */}
          <div
            style={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '18px',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '240px' }}>
              <FiSearch
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  fontSize: '16px',
                }}
              />
              <input
                type="text"
                placeholder="Search subject name, code, syllabus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 40px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', width: 'auto' }}>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  outline: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">All Categories</option>
                <option value="Core Academic">Core Academic</option>
                <option value="Science & Labs">Science & Labs</option>
                <option value="Languages">Languages</option>
                <option value="Humanities & Social">Humanities & Social</option>
                <option value="Skill & Vocational">Skill & Vocational</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  outline: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              {/* Grid/Table Switcher */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--panel-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '3px',
                }}
              >
                <button
                  onClick={() => setViewMode('grid')}
                  title="Grid Card View"
                  style={{
                    padding: '7px 11px',
                    borderRadius: '9px',
                    border: 'none',
                    backgroundColor: viewMode === 'grid' ? '#4F46E5' : 'transparent',
                    color: viewMode === 'grid' ? '#FFFFFF' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: '700',
                    transition: 'all 0.2s',
                  }}
                >
                  <FiGrid size={15} />
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  title="Table View"
                  style={{
                    padding: '7px 11px',
                    borderRadius: '9px',
                    border: 'none',
                    backgroundColor: viewMode === 'table' ? '#4F46E5' : 'transparent',
                    color: viewMode === 'table' ? '#FFFFFF' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: '700',
                    transition: 'all 0.2s',
                  }}
                >
                  <FiList size={15} />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>
            </div>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div className="animate-spin" style={{ display: 'inline-block', fontSize: '24px', marginBottom: '8px' }}>🔄</div>
              <p style={{ margin: 0, fontWeight: '600' }}>Loading subjects catalog...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredSubjects.length === 0 && (
            <div
              style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px border-dashed var(--border-color)',
                borderRadius: '20px',
                padding: '48px 24px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚</div>
              <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>
                No Subjects Found
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--text-muted)' }}>
                {searchQuery || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'No subjects match your current filter criteria.'
                  : 'Get started by creating your first academic subject!'}
              </p>
              <button
                onClick={handleNewSubject}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  backgroundColor: '#4F46E5',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                + Add Subject
              </button>
            </div>
          )}

          {/* View Mode: Responsive Grid Cards */}
          {!loading && viewMode === 'grid' && filteredSubjects.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
              }}
            >
              {filteredSubjects.map((sub: any) => {
                const emoji = getSubjectEmoji(sub.name);
                return (
                  <div
                    key={sub._id}
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '20px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
                      transition: 'all 0.25s ease',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div>
                      {/* Top bar in card */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              fontSize: '24px',
                              backgroundColor: 'var(--panel-bg)',
                              padding: '8px 12px',
                              borderRadius: '14px',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            {emoji}
                          </div>
                          <div>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: '800',
                                color: '#4F46E5',
                                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                letterSpacing: '0.5px',
                              }}
                            >
                              {sub.code || 'CODE-N/A'}
                            </span>
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            backgroundColor: sub.status === 'inactive' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: sub.status === 'inactive' ? '#EF4444' : '#10B981',
                            textTransform: 'uppercase',
                          }}
                        >
                          {sub.status || 'Active'}
                        </span>
                      </div>

                      {/* Subject Name */}
                      <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: '800', color: 'var(--text-main)' }}>
                        {sub.name}
                      </h3>

                      {/* Category & Class Badge */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: 'var(--panel-bg)',
                            color: 'var(--text-muted)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          🏷️ {sub.category || 'Core Academic'}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: 'var(--panel-bg)',
                            color: 'var(--text-muted)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          🏫 {sub.classLevel || 'All Classes'}
                        </span>
                      </div>

                      {/* Description */}
                      <p
                        style={{
                          margin: '0 0 16px',
                          fontSize: '13px',
                          color: 'var(--text-muted)',
                          lineHeight: '1.5',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {sub.description || 'No description added for this subject module.'}
                      </p>
                    </div>

                    {/* Bottom Card Footer Actions */}
                    <div
                      style={{
                        paddingTop: '14px',
                        borderTop: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                        {sub.syllabus ? '📄 Syllabus Attached' : '📄 Standard Syllabus'}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => handleEdit(sub)}
                          title="Edit Subject"
                          style={{
                            padding: '7px 12px',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--panel-bg)',
                            color: 'var(--text-main)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            fontWeight: '700',
                          }}
                        >
                          <FiEdit2 size={13} color="#4F46E5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDelete(sub._id)}
                          title="Delete Subject"
                          style={{
                            padding: '7px 10px',
                            borderRadius: '10px',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            backgroundColor: 'rgba(239, 68, 68, 0.08)',
                            color: '#EF4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* View Mode: Responsive Table */}
          {!loading && viewMode === 'table' && filteredSubjects.length > 0 && (
            <div
              style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '18px',
                overflow: 'hidden',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)',
              }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: 'var(--panel-bg)',
                        borderBottom: '1px solid var(--border-color)',
                        color: 'var(--text-muted)',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      <th style={{ padding: '14px 18px' }}>Subject & Code</th>
                      <th style={{ padding: '14px 18px' }}>Category</th>
                      <th style={{ padding: '14px 18px' }}>Target Level</th>
                      <th style={{ padding: '14px 18px' }}>Description</th>
                      <th style={{ padding: '14px 18px' }}>Status</th>
                      <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubjects.map((subject: any) => (
                      <tr
                        key={subject._id}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          transition: 'background 0.2s',
                        }}
                      >
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '18px' }}>{getSubjectEmoji(subject.name)}</span>
                            <div>
                              <div style={{ fontWeight: '800', color: 'var(--text-main)' }}>{subject.name}</div>
                              <div style={{ fontSize: '11px', color: '#4F46E5', fontWeight: '700' }}>{subject.code}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--text-main)', fontWeight: '600' }}>
                          {subject.category || 'Core Academic'}
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                          {subject.classLevel || 'All Classes'}
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--text-muted)', maxWidth: '280px' }}>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {subject.description || '-'}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              backgroundColor: subject.status === 'inactive' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                              color: subject.status === 'inactive' ? '#EF4444' : '#10B981',
                              textTransform: 'uppercase',
                            }}
                          >
                            {subject.status || 'Active'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              onClick={() => handleEdit(subject)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--panel-bg)',
                                color: '#4F46E5',
                                cursor: 'pointer',
                                fontWeight: '700',
                                fontSize: '12px',
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(subject._id)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                                color: '#EF4444',
                                cursor: 'pointer',
                              }}
                            >
                              <FiTrash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Create & Edit Modal Popup */}
          {showModal && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(6px)',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
              }}
              onClick={() => setShowModal(false)}
            >
              <div
                style={{
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--text-main)',
                  width: '100%',
                  maxWidth: '560px',
                  borderRadius: '24px',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
                  overflow: 'hidden',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div
                  style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--panel-bg)',
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                    {editingSubject ? '✏️ Edit Subject Details' : '📚 Add New Academic Subject'}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      lineHeight: 1,
                    }}
                  >
                    &times;
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    {/* Subject Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                        Subject Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="e.g. Mathematics"
                        value={formData.name}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--input-bg)',
                          color: 'var(--text-main)',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {/* Subject Code */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                        Subject Code *
                      </label>
                      <input
                        type="text"
                        name="code"
                        required
                        placeholder="e.g. MATH-101"
                        value={formData.code}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--input-bg)',
                          color: 'var(--text-main)',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    {/* Category */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                        Category / Type
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--input-bg)',
                          color: 'var(--text-main)',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value="Core Academic">Core Academic</option>
                        <option value="Science & Labs">Science & Labs</option>
                        <option value="Languages">Languages</option>
                        <option value="Humanities & Social">Humanities & Social</option>
                        <option value="Skill & Vocational">Skill & Vocational</option>
                      </select>
                    </div>

                    {/* Class Level */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                        Target Class Level
                      </label>
                      <select
                        name="classLevel"
                        value={formData.classLevel}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--input-bg)',
                          color: 'var(--text-main)',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value="All Classes">All Classes (Pre-Primary to 12)</option>
                        <option value="Class 1 - 5">Class 1 to 5 (Primary)</option>
                        <option value="Class 6 - 8">Class 6 to 8 (Middle)</option>
                        <option value="Class 9 - 10">Class 9 & 10 (Secondary)</option>
                        <option value="Class 11 - 12">Class 11 & 12 (Senior Sec)</option>
                      </select>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--input-bg)',
                        color: 'var(--text-main)',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="active">Active (Offered)</option>
                      <option value="inactive">Inactive (Archived)</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={2}
                      placeholder="Brief overview of course goals..."
                      value={formData.description}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--input-bg)',
                        color: 'var(--text-main)',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Syllabus */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                      Syllabus & Curriculum Modules
                    </label>
                    <textarea
                      name="syllabus"
                      rows={3}
                      placeholder="Key syllabus topics, units, and learning outcomes..."
                      value={formData.syllabus}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--input-bg)',
                        color: 'var(--text-main)',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Footer Action Buttons */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '12px',
                      marginTop: '8px',
                      paddingTop: '16px',
                      borderTop: '1px solid var(--border-color)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--panel-bg)',
                        color: 'var(--text-main)',
                        fontWeight: '600',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: '10px 22px',
                        borderRadius: '12px',
                        backgroundColor: '#4F46E5',
                        color: '#FFFFFF',
                        border: 'none',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
                      }}
                    >
                      {editingSubject ? 'Update Subject' : 'Save Subject'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {subjectToDelete && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                zIndex: 99999,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '16px',
              }}
            >
              <div
                style={{
                  background: 'var(--card-bg)',
                  padding: '24px',
                  borderRadius: '20px',
                  maxWidth: '380px',
                  width: '100%',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                }}
              >
                <div style={{ color: '#EF4444', marginBottom: '12px', fontSize: '32px' }}>
                  ⚠️
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>
                  Confirm Delete Subject
                </h3>
                <p style={{ margin: '0 0 20px 0', color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5' }}>
                  Are you sure you want to delete this subject? This action cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setSubjectToDelete(null)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--panel-bg)',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '13px',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteSubject}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: '#EF4444',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '13px',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default SubjectsManagement;