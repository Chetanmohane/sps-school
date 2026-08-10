import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import API from '../../api/axios';
import { FiDownload, FiPlus, FiTrash2, FiSave, FiLoader, FiCalendar, FiBook } from 'react-icons/fi';

const CLASS_LIST = Array.from({ length: 12 }, (_, i) => String(i + 1));
const SECTION_LIST = ['A', 'B', 'C', 'D', 'E'];
const SUBJECT_LIST = [
  'Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology',
  'English', 'Hindi', 'Social Studies / SST', 'History', 'Geography',
  'Computer Science', 'Physical Education', 'Arts & Craft', 'Music',
  'Economics', 'Political Science', 'Accountancy', 'Business Studies',
  'Environmental Science', 'Sanskrit'
];
const EXAM_TYPES = [
  'Unit Test 1', 'Unit Test 2', 'Mid-Term Examination', 'Final Examination',
  'Pre-Board Examination', 'Annual Examination', 'Class Test', 'Half Yearly Exam', 'Other'
];
const ROOM_LIST = ['Hall-1', 'Hall-2', 'Hall-3', 'Room 101', 'Room 102', 'Room 103', 'Room 104', 'Lab-1', 'Lab-2', 'Auditorium'];

const DEFAULT_SUBJECT_ROW = () => ({
  subject: '',
  date: '',
  startTime: '10:00',
  endTime: '13:00',
  roomNumber: 'Hall-1',
  maxMarks: '100',
  invigilator: '',
});

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  backgroundColor: 'var(--input-bg)',
  color: 'var(--text-main)',
  fontSize: '13px',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: '4px',
  letterSpacing: '0.05em',
};

const Exams = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [editingExam, setEditingExam] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // New multi-subject form state
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [examTitle, setExamTitle] = useState('');
  const [subjectRows, setSubjectRows] = useState([DEFAULT_SUBJECT_ROW()]);

  // Export filters
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [filterClass, setFilterClass] = useState('');

  // Delete confirm modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchTeachers = async () => {
    try {
      const res = await API.get('/api/academic-admin/teachers');
      if(res.data?.data) setTeachers(res.data.data);
    } catch (e) { console.error('Error fetching teachers', e); }
  };

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/exams');
      setExams(response.data.exams || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
    fetchTeachers();
  }, []);

  // Toggle section selection
  const toggleSection = (sec: string) => {
    setSelectedSections(prev =>
      prev.includes(sec) ? prev.filter(s => s !== sec) : [...prev, sec]
    );
  };

  // Subject row management
  const addSubjectRow = () => setSubjectRows(prev => [...prev, DEFAULT_SUBJECT_ROW()]);
  const removeSubjectRow = (idx: number) => setSubjectRows(prev => prev.filter((_, i) => i !== idx));
  const updateSubjectRow = (idx: number, field: string, value: string) => {
    setSubjectRows(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) { alert('Please select a Class.'); return; }
    if (selectedSections.length === 0) { alert('Please select at least one Section.'); return; }
    if (!examTitle) { alert('Please select an Exam Type/Title.'); return; }
    const invalid = subjectRows.some(r => !r.subject || !r.date);
    if (invalid) { alert('Please fill Subject and Date for all subject rows.'); return; }

    try {
      setSaving(true);
      // Create one entry per section × per subject row
      const entries: any[] = [];
      for (const section of selectedSections) {
        for (const row of subjectRows) {
          entries.push({
            title: examTitle,
            className: selectedClass,
            section,
            subject: row.subject,
            date: row.date,
            startTime: row.startTime,
            endTime: row.endTime,
            roomNumber: row.roomNumber,
            maxMarks: row.maxMarks,
            invigilator: row.invigilator,
          });
        }
      }
      // Submit all entries in parallel
      await Promise.all(entries.map(entry => API.post('/api/exams', entry)));

      setSuccessMsg(`✅ ${entries.length} exam entries added successfully for Class ${selectedClass}!`);
      setTimeout(() => setSuccessMsg(''), 5000);

      // Reset form
      setSelectedClass('');
      setSelectedSections([]);
      setExamTitle('');
      setSubjectRows([DEFAULT_SUBJECT_ROW()]);
      fetchExams();
    } catch (error) {
      console.error('Error scheduling exam:', error);
      alert('Failed to schedule exam. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const filteredExams = exams.filter((e) => {
    const dateStr = e.date ? e.date.split('T')[0] : '';
    let matchesDate = true;
    if (startDateFilter && endDateFilter) matchesDate = dateStr >= startDateFilter && dateStr <= endDateFilter;
    else if (startDateFilter) matchesDate = dateStr >= startDateFilter;
    else if (endDateFilter) matchesDate = dateStr <= endDateFilter;
    const matchesClass = filterClass ? (e.className === filterClass) : true;
    return matchesDate && matchesClass;
  });

  const downloadCSV = () => {
    if (filteredExams.length === 0) { alert('No data to export.'); return; }
    const headers = ['Exam Title', 'Class', 'Section', 'Subject', 'Date', 'Time Slot', 'Room', 'Max Marks'];
    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '';
      let s = String(val);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) s = `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const rows = [headers.map(escapeCSV).join(',')];
    for (const e of filteredExams) {
      rows.push([e.title, e.className, e.section || '', e.subject, new Date(e.date).toLocaleDateString('en-GB'), `${e.startTime} - ${e.endTime}`, e.roomNumber, e.maxMarks || 100].map(escapeCSV).join(','));
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'exam_timetable.csv');
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

          {/* Page Header */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiCalendar style={{ color: '#6366f1' }} /> Manage Exam Timetable
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              Select class, sections, and add multiple subjects at once for any exam.
            </p>
          </div>

          {/* ===== SCHEDULE FORM ===== */}
          <form onSubmit={handleSubmit} style={{ backgroundColor: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden', marginBottom: '28px' }}>

            {/* Form Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiBook style={{ color: '#6366f1' }} size={18} />
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: '15px' }}>Schedule New Exam</h3>
            </div>

            <div style={{ padding: '20px 24px' }}>

              {/* Row 1: Exam Type + Class */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>Exam Type / Title *</label>
                  <select value={examTitle} onChange={e => setExamTitle(e.target.value)} required style={inputStyle}>
                    <option value="">— Select Exam Type —</option>
                    {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Class *</label>
                  <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSections([]); }} required style={inputStyle}>
                    <option value="">— Select Class —</option>
                    {CLASS_LIST.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2: Section multi-select pills */}
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Sections * (select one or more)</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {SECTION_LIST.map(sec => {
                    const isSelected = selectedSections.includes(sec);
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => toggleSection(sec)}
                        style={{
                          padding: '8px 20px',
                          borderRadius: '10px',
                          border: `2px solid ${isSelected ? '#6366f1' : 'var(--border-color)'}`,
                          backgroundColor: isSelected ? '#eef2ff' : 'var(--input-bg)',
                          color: isSelected ? '#4f46e5' : 'var(--text-muted)',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {isSelected ? '✓ ' : ''}Section {sec}
                      </button>
                    );
                  })}
                </div>
                {selectedSections.length > 0 && (
                  <p style={{ fontSize: '11px', color: '#6366f1', fontWeight: 'bold', marginTop: '6px' }}>
                    Selected: {selectedSections.map(s => `Section ${s}`).join(', ')}
                  </p>
                )}
              </div>

              {/* Row 3: Subject rows */}
              <div>
                <label style={{ ...labelStyle, marginBottom: '10px' }}>Subjects & Exam Dates *</label>

                {subjectRows.map((row, idx) => (
                  <div key={idx} className="subject-row-grid">
                    {/* Subject */}
                    <div>
                      <label style={labelStyle}>Subject *</label>
                      <select value={row.subject} onChange={e => updateSubjectRow(idx, 'subject', e.target.value)} required style={inputStyle}>
                        <option value="">— Select Subject —</option>
                        {SUBJECT_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    {/* Date */}
                    <div>
                      <label style={labelStyle}>Exam Date *</label>
                      <input type="date" value={row.date} onChange={e => updateSubjectRow(idx, 'date', e.target.value)} required style={inputStyle} />
                    </div>

                    {/* Start Time */}
                    <div>
                      <label style={labelStyle}>Start Time</label>
                      <input type="time" value={row.startTime} onChange={e => updateSubjectRow(idx, 'startTime', e.target.value)} style={inputStyle} />
                    </div>

                    {/* End Time */}
                    <div>
                      <label style={labelStyle}>End Time</label>
                      <input type="time" value={row.endTime} onChange={e => updateSubjectRow(idx, 'endTime', e.target.value)} style={inputStyle} />
                    </div>

                    {/* Room */}
                    <div>
                      <label style={labelStyle}>Room / Venue</label>
                      <select value={row.roomNumber} onChange={e => updateSubjectRow(idx, 'roomNumber', e.target.value)} style={inputStyle}>
                        {ROOM_LIST.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>

                    {/* Max Marks */}
                    <div>
                      <label style={labelStyle}>Max Marks</label>
                      <select value={row.maxMarks} onChange={e => updateSubjectRow(idx, 'maxMarks', e.target.value)} style={inputStyle}>
                        {['25', '50', '75', '80', '100'].map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>

                    {/* Invigilator */}
                    <div>
                      <label style={labelStyle}>Invigilator Duty</label>
                      <select value={row.invigilator} onChange={e => updateSubjectRow(idx, 'invigilator', e.target.value)} style={inputStyle}>
                        <option value="">-- Select Teacher --</option>
                        {teachers.map((t: any) => <option key={t._id} value={t.name}>{t.name}</option>)}
                      </select>
                    </div>

                    {/* Remove Row */}
                    <button
                      type="button"
                      onClick={() => removeSubjectRow(idx)}
                      disabled={subjectRows.length === 1}
                      style={{ padding: '8px', borderRadius: '8px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#ef4444', cursor: subjectRows.length === 1 ? 'not-allowed' : 'pointer', opacity: subjectRows.length === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}

                {/* Add Subject Row Button */}
                <button
                  type="button"
                  onClick={addSubjectRow}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '10px', border: '1.5px dashed #6366f1', backgroundColor: 'transparent', color: '#6366f1', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', marginTop: '4px' }}
                >
                  <FiPlus size={15} /> Add Another Subject
                </button>
              </div>

              {/* Summary preview */}
              {selectedClass && selectedSections.length > 0 && subjectRows.some(r => r.subject) && (
                <div style={{ marginTop: '20px', padding: '12px 16px', borderRadius: '12px', backgroundColor: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '12px', color: '#6366f1', fontWeight: 'bold' }}>
                  📌 Will create {selectedSections.length * subjectRows.filter(r => r.subject).length} exam entries —
                  Class {selectedClass} × [{selectedSections.map(s => `Sec ${s}`).join(', ')}] × [{subjectRows.filter(r => r.subject).map(r => r.subject).join(', ')}]
                </div>
              )}

              {/* Success Message */}
              {successMsg && (
                <div style={{ marginTop: '14px', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontWeight: 'bold', fontSize: '13px' }}>
                  {successMsg}
                </div>
              )}
            </div>

            {/* Form Footer: Save Button */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 28px', borderRadius: '12px', border: 'none', backgroundColor: '#4f46e5', color: '#fff', fontWeight: 900, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? <FiLoader size={16} /> : <FiSave size={16} />}
                {saving ? 'Saving...' : '➕ Add to Timetable'}
              </button>
            </div>
          </form>

          {/* ===== SCHEDULED EXAMS TABLE ===== */}
          <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: '15px' }}>📋 Scheduled Exam Timetable</h3>

              <div className="exam-filter-row">
                {/* Filter by Class */}
                <div>
                  <label style={labelStyle}>Filter by Class</label>
                  <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ ...inputStyle, width: '100%', minWidth: '120px' }}>
                    <option value="">All Classes</option>
                    {CLASS_LIST.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                {/* Date range */}
                <div>
                  <label style={labelStyle}>From Date</label>
                  <input type="date" value={startDateFilter} onChange={e => setStartDateFilter(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
                </div>
                <div>
                  <label style={labelStyle}>To Date</label>
                  <input type="date" value={endDateFilter} onChange={e => setEndDateFilter(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
                </div>
                <button
                  onClick={downloadCSV}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 18px', borderRadius: '10px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', height: '36px' }}
                >
                  <FiDownload size={14} /> Export CSV
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><FiLoader className="spin" size={24} /></div>
            ) : (
              <div className="table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
                <table className="roster-table data-table" style={{ width: '100%', minWidth: '850px' }}>
                  <thead>
                    <tr>
                      <th>Exam Title</th>
                      <th>Class</th>
                      <th>Section</th>
                      <th>Subject</th>
                      <th>Time Slot</th>
                      <th>Room</th>
                      <th>Max Marks</th>
                      <th>Invigilator</th>
                      <th>Created By</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExams.length > 0 ? filteredExams.map((exam: any) => (
                      <tr key={exam._id}>
                        <td style={{ fontWeight: 'bold' }}>{exam.title}</td>
                        <td><span style={{ padding: '2px 8px', borderRadius: '6px', backgroundColor: 'rgba(99,102,241,0.1)', color: '#4f46e5', fontWeight: 'bold', fontSize: '12px' }}>Class {exam.className}</span></td>
                        <td>{exam.section ? <span style={{ padding: '2px 8px', borderRadius: '6px', backgroundColor: 'rgba(16,185,129,0.1)', color: '#059669', fontWeight: 'bold', fontSize: '12px' }}>Sec {exam.section}</span> : '—'}</td>
                        <td>{exam.subject}</td>
                        <td><span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(79,70,229,0.1)', color: '#4f46e5', fontWeight: 'bold', fontSize: '11px' }}>{exam.startTime} - {exam.endTime}</span></td>
                        <td>{exam.roomNumber || 'Hall-1'}</td>
                        <td>{exam.maxMarks || 100}</td>
                        <td>{exam.invigilator || 'TBD'}</td>
                        <td><span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 'bold' }}>{exam.createdBy || 'Admin'}</span></td>
                        <td style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setEditingExam(exam)} className="action-btn" style={{ backgroundColor: '#3b82f6', color: 'white' }}>Edit</button>
                          <button onClick={() => handleDelete(exam._id)} className="action-btn delete">Delete</button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={10} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No exam timetables scheduled.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>

      {editingExam && (
        <div className="modal-overlay" onClick={() => setEditingExam(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--card-bg)', padding: '24px', borderRadius: '16px', width: '400px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Edit Exam Duty</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Invigilator Duty</label>
              <select value={editingExam.invigilator || ''} onChange={e => setEditingExam({...editingExam, invigilator: e.target.value})} style={inputStyle}>
                <option value="">-- Select Teacher --</option>
                {teachers.map((t: any) => <option key={t._id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Date</label>
              <input type="date" value={editingExam.date ? editingExam.date.split('T')[0] : ''} onChange={e => setEditingExam({...editingExam, date: e.target.value})} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Start Time</label>
              <input type="text" value={editingExam.startTime || ''} onChange={e => setEditingExam({...editingExam, startTime: e.target.value})} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>End Time</label>
              <input type="text" value={editingExam.endTime || ''} onChange={e => setEditingExam({...editingExam, endTime: e.target.value})} style={inputStyle} />
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setEditingExam(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', cursor: 'pointer' }}>Cancel</button>
              <button onClick={async () => {
                try {
                  await API.put(`/api/exams/${editingExam._id}`, editingExam);
                  setEditingExam(null);
                  fetchExams();
                  setSuccessMsg('Exam duty updated successfully!');
                  setTimeout(() => setSuccessMsg(''), 3000);
                } catch(e) {
                  alert('Error updating exam duty');
                }
              }} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#6366f1', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div 
          className="modal-overlay" 
          onClick={() => setDeleteConfirmId(null)} 
          style={{ 
            position: 'fixed', 
            top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.65)', 
            backdropFilter: 'blur(4px)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              backgroundColor: 'var(--card-bg)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '20px', 
              padding: '24px', 
              width: '380px', 
              maxWidth: '95%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ background: 'var(--danger-bg)', padding: '10px', borderRadius: '12px', color: 'var(--danger)', display: 'flex' }}>
                <FiTrash2 size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>Delete Exam Entry</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>Action cannot be undone</p>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Are you sure you want to remove this scheduled exam entry from the timetable?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setDeleteConfirmId(null)}
                style={{ padding: '9px 18px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-main)', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  const id = deleteConfirmId;
                  setDeleteConfirmId(null);
                  try {
                    await API.delete(`/api/exams/${id}`);
                    fetchExams();
                    if ((window as any).showToast) (window as any).showToast("Exam entry deleted successfully", "success");
                  } catch (err: any) {
                    if ((window as any).showToast) (window as any).showToast("Failed to delete exam entry", "error");
                  }
                }}
                style={{ padding: '9px 18px', borderRadius: '10px', border: 'none', background: 'var(--danger)', color: 'white', fontWeight: 900, fontSize: '13px', cursor: 'pointer' }}
              >
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Exams;
