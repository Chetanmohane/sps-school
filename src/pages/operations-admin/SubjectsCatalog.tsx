import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import API from '../../api/axios';
import { FiSearch } from 'react-icons/fi';

const SubjectsCatalog = () => {
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState('');

  const fetchSubjects = async () => {
    try {
      const res = await API.get('/api/academic-admin/subjects');
      setSubjects(res.data.data);
    } catch (err) {
      console.error('Error fetching subjects', err);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const filtered = subjects.filter((s: any) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="dashboard-container" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '20px' }}>📚 Subjects Catalog</h2>
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search subjects by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 36px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--text-main)',
                outline: 'none',
                fontSize: '13px'
              }}
            />
          </div>
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--primary-bg)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 16px' }}>Code</th>
                  <th style={{ padding: '12px 16px' }}>Name</th>
                  <th style={{ padding: '12px 16px' }}>Credits</th>
                  <th style={{ padding: '12px 16px' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub: any, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--primary)' }}>{sub.code}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-main)' }}>{sub.name}</td>
                    <td style={{ padding: '12px 16px' }}>{sub.credits}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{sub.description}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No subjects found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SubjectsCatalog;
