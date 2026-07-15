import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import API from '../../api/axios';
import { FiDownload } from 'react-icons/fi';

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    className: '',
    subject: ''
  });
  
  // Export filters
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/exams');
      setExams(response.data.exams);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/api/exams', formData);
      alert('Exam scheduled successfully!');
      setFormData({ title: '', date: '', className: '', subject: '' });
      fetchExams();
    } catch (error) {
      console.error('Error scheduling exam:', error);
      alert('Failed to schedule exam.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;
    try {
      await API.delete(`/api/exams/${id}`);
      alert('Exam deleted successfully!');
      fetchExams();
    } catch (error) {
      console.error('Error deleting exam:', error);
      alert('Failed to delete exam.');
    }
  };

  const filteredExams = exams.filter((e) => {
    let matchesDate = true;
    const dateStr = e.date ? e.date.split("T")[0] : "";
    if (startDateFilter && endDateFilter) {
      matchesDate = dateStr >= startDateFilter && dateStr <= endDateFilter;
    } else if (startDateFilter) {
      matchesDate = dateStr >= startDateFilter;
    } else if (endDateFilter) {
      matchesDate = dateStr <= endDateFilter;
    }
    return matchesDate;
  });

  const downloadCSV = () => {
    if (filteredExams.length === 0) {
      alert("No data to export for the selected dates.");
      return;
    }
    const headers = ['Exam Title', 'Date', 'Class', 'Subject'];
    
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      let stringVal = String(val);
      if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
        stringVal = `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    };

    const csvRows = [];
    csvRows.push(headers.map(escapeCSV).join(','));
    for (const e of filteredExams) {
      const row = [
        e.title,
        new Date(e.date).toLocaleDateString(),
        e.className,
        e.subject
      ];
      csvRows.push(row.map(escapeCSV).join(','));
    }
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", 'exams_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="dashboard-container" style={{ margin: '20px' }}>
          <h2>Manage Exams</h2>
          <hr style={{ margin: '15px 0', borderColor: 'var(--border-color)' }}/>
          
          <div style={{ padding: '20px', borderRadius: '8px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <h3>Schedule New Exam</h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Exam Title:</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)'  }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Date:</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)'  }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Class Name:</label>
                <input type="text" name="className" placeholder="e.g. Class 10" value={formData.className} onChange={handleChange} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)'  }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Subject:</label>
                <input type="text" name="subject" value={formData.subject} onChange={handleChange} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)'  }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <button type="submit" className="btn-primary">
                  Schedule Exam
                </button>
              </div>
            </form>
          </div>

          <div className="table-container">
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
              <h3 style={{ margin: 0 }}>Scheduled Exams</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>Start Date</label>
                  <input 
                    type="date" 
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()}
                    style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>End Date</label>
                  <input 
                    type="date" 
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()}
                    style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <button 
                  onClick={downloadCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-all"
                >
                  <FiDownload /> Export Excel
                </button>
              </div>
            </div>
            {loading ? <p>Loading...</p> : (
              <table className="data-table" style={{ marginTop: '15px' }}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExams.length > 0 ? filteredExams.map(exam => (
                    <tr key={exam._id}>
                      <td>{exam.title}</td>
                      <td>{new Date(exam.date).toLocaleDateString()}</td>
                      <td>{exam.className}</td>
                      <td>{exam.subject}</td>
                      <td>
                        <button onClick={() => handleDelete(exam._id)} className="action-btn delete">
                          Delete
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)' }}>No exams scheduled.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          </div>
      </main>
    </div>
  );
};

export default Exams;
