import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import API from '../../api/axios';
import { FiSearch, FiBookOpen, FiGrid, FiList, FiRefreshCw } from 'react-icons/fi';

const SubjectsCatalog = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await API.get('/api/academic-admin/subjects');
      setSubjects(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Error fetching subjects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const filtered = subjects.filter((s: any) =>
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.code || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const getSubjectEmoji = (name: string) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('math')) return '📐';
    if (lower.includes('physic') || lower.includes('scien')) return '🔬';
    if (lower.includes('chem')) return '🧪';
    if (lower.includes('bio')) return '🧬';
    if (lower.includes('computer') || lower.includes('code')) return '💻';
    if (lower.includes('english') || lower.includes('liter')) return '📖';
    if (lower.includes('hindi') || lower.includes('lang')) return '🗣️';
    if (lower.includes('social') || lower.includes('history')) return '🌍';
    if (lower.includes('art') || lower.includes('music')) return '🎨';
    return '📚';
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="dashboard-container" style={{ padding: '16px 20px 32px', maxWidth: '1400px', margin: '0 auto' }}>
          
          {/* Header Banner */}
          <div
            style={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '24px',
              marginBottom: '24px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.12)',
                  color: '#6366F1',
                  padding: '12px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FiBookOpen size={26} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: 'var(--text-main)' }}>
                  📖 Subjects & Course Directory
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Complete list of academic courses, syllabus guides, and subject codes.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={fetchSubjects}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--panel-bg)',
                  color: 'var(--text-main)',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
          </div>

          {/* Search Bar & View Mode Toggle */}
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
            <div style={{ position: 'relative', flex: '1 1 300px', minWidth: '240px' }}>
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
                placeholder="Search subjects by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 40px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  outline: 'none',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

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
                style={{
                  padding: '7px 12px',
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
                }}
              >
                <FiGrid size={15} /> Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  padding: '7px 12px',
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
                }}
              >
                <FiList size={15} /> Table
              </button>
            </div>
          </div>

          {/* Cards View */}
          {viewMode === 'grid' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
              }}
            >
              {filtered.map((sub: any, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '20px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '26px' }}>{getSubjectEmoji(sub.name)}</span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          color: '#4F46E5',
                          backgroundColor: 'rgba(79, 70, 229, 0.1)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {sub.code}
                      </span>
                    </div>

                    <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>
                      {sub.name}
                    </h3>

                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                      {sub.description || 'Standard Academic Course Syllabus.'}
                    </p>
                  </div>

                  <div
                    style={{
                      marginTop: '16px',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-color)',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      fontWeight: '600',
                    }}
                  >
                    Status: <span style={{ color: '#10B981' }}>{sub.status || 'Active'}</span>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No subjects found in catalog.
                </div>
              )}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div
              style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '18px',
                overflow: 'hidden',
              }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--panel-bg)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>Code</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>Subject Name</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((sub: any, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '700', color: '#4F46E5' }}>{sub.code}</td>
                        <td style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--text-main)' }}>{sub.name}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{sub.description || '-'}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No subjects found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default SubjectsCatalog;
