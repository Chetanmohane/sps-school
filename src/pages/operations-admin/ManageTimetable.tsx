import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import API from '../../api/axios';
import { FiPlus, FiTrash2, FiSave, FiLoader, FiClock, FiEdit3, FiCheck, FiCalendar } from 'react-icons/fi';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SUBJECTS: string[] = [];

const DEFAULT_PERIOD = {
  period: '',
  startTime: '',
  endTime: '',
  subject: '',
  teacher: '',
  room: '',
  isBreak: false
};

const ManageTimetable = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSchedules, setSavedSchedules] = useState<any[]>([]);
  const [fetchingAll, setFetchingAll] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);

  // Dynamic Catalog Subjects & Teachers state
  const [catalogSubjects, setCatalogSubjects] = useState<any[]>([]);
  const [catalogTeachers, setCatalogTeachers] = useState<any[]>([]);

  const role = (localStorage.getItem('role') || '').toLowerCase();
  const canManage = [
    'super-admin', 'super admin', 
    'manager-admin', 'manager admin', 'manager', 
    'teacher-admin', 'teacher admin', 
    'academic-admin', 'academic admin', 
    'operations-admin', 'operations admin', 
    'teacher', 'teacher-role'
  ].includes(role) || role.includes('admin') || role.includes('teacher') || role.includes('manager');

  // Fetch Academic Subjects Catalog & Teachers
  const fetchCatalogData = async () => {
    try {
      const [subjRes, teacherRes] = await Promise.all([
        API.get('/api/academic-admin/subjects').catch(() => null),
        API.get('/api/academic-admin/teachers').catch(() => null)
      ]);
      if (subjRes?.data?.data || subjRes?.data) {
        const subList = subjRes.data.data || subjRes.data || [];
        if (Array.isArray(subList)) setCatalogSubjects(subList);
      }
      if (teacherRes?.data?.data || teacherRes?.data) {
        const teachList = teacherRes.data.data || teacherRes.data || [];
        if (Array.isArray(teachList)) setCatalogTeachers(teachList);
      }
    } catch (err) {
      console.error('Error fetching catalog data:', err);
    }
  };

  useEffect(() => {
    fetchCatalogData();
  }, []);

  // Compute available subjects STRICTLY from Academic Subjects Catalog (no extra hardcoded subjects)
  const availableCatalogSubjects = React.useMemo(() => {
    if (!catalogSubjects || catalogSubjects.length === 0) return [];

    // Filter catalog subjects matching selected class if selectedClass is set
    if (selectedClass) {
      const normSelected = selectedClass.replace(/\D/g, ''); // e.g. "10"
      const matched = catalogSubjects.filter((s: any) => {
        const clsName = (s.className || s.class || '').toString().toLowerCase();
        const normCls = clsName.replace(/\D/g, '');
        return normCls === normSelected || clsName.includes(selectedClass.toLowerCase());
      });
      if (matched.length > 0) {
        return Array.from(new Set(matched.map((s: any) => s.name).filter(Boolean)));
      }
    }

    return Array.from(new Set(catalogSubjects.map((s: any) => s.name).filter(Boolean)));
  }, [catalogSubjects, selectedClass]);

  // Fetch saved timetables for the selected class/section
  const fetchSavedSchedules = async () => {
    if (!selectedClass || !selectedSection) return;
    try {
      setFetchingAll(true);
      const res = await API.get('/api/timetable', {
        params: { className: selectedClass, section: selectedSection }
      });
      setSavedSchedules(res.data.data || []);
    } catch (err) {
      console.error('Error fetching saved timetables:', err);
    } finally {
      setFetchingAll(false);
    }
  };

  // Load the selected day's timetable into the editor
  const loadDayForEditing = () => {
    const found = savedSchedules.find(s => s.dayOfWeek === selectedDay);
    if (found) {
      setPeriods(found.periods.map((p: any) => ({ ...p })));
    } else {
      // Start with default template
      setPeriods([
        { period: '1', startTime: '08:30', endTime: '09:30', subject: '', teacher: '', room: '', isBreak: false },
        { period: 'Break', startTime: '09:30', endTime: '10:00', subject: 'Recess Break', teacher: '', room: 'Cafeteria', isBreak: true },
        { period: '2', startTime: '10:00', endTime: '11:00', subject: '', teacher: '', room: '', isBreak: false },
        { period: '3', startTime: '11:00', endTime: '12:00', subject: '', teacher: '', room: '', isBreak: false },
        { period: '4', startTime: '12:00', endTime: '13:00', subject: '', teacher: '', room: '', isBreak: false },
      ]);
    }
  };

  useEffect(() => {
    if (selectedClass && selectedSection) fetchSavedSchedules();
    // eslint-disable-next-line
  }, [selectedClass, selectedSection]);

  useEffect(() => {
    loadDayForEditing();
    // eslint-disable-next-line
  }, [selectedDay, savedSchedules]);

  const handlePeriodChange = (idx: number, field: string, value: any) => {
    setPeriods(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const addPeriod = () => {
    setPeriods(prev => [...prev, { ...DEFAULT_PERIOD, period: String(prev.filter(p => !p.isBreak).length + 1) }]);
  };

  const addBreak = () => {
    setPeriods(prev => [...prev, { period: 'Break', startTime: '', endTime: '', subject: 'Recess Break', teacher: '', room: 'Cafeteria', isBreak: true }]);
  };

  const removePeriod = (idx: number) => {
    setPeriods(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!selectedClass || !selectedSection || !selectedDay) {
      setError('Please select Class, Section, and Day before saving.');
      return;
    }
    const isInvalid = periods.some(p => !p.isBreak && (!p.subject || !p.startTime || !p.endTime));
    if (isInvalid) {
      setError('Please fill all required fields (Subject, Start Time, End Time) for all periods.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await API.post('/api/timetable', {
        className: selectedClass,
        section: selectedSection,
        dayOfWeek: selectedDay,
        periods
      });
      setSuccess(`✅ Timetable for Class ${selectedClass}-${selectedSection} on ${selectedDay} saved successfully!`);
      await fetchSavedSchedules();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error saving timetable. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = (id: string) => {
    setScheduleToDelete(id);
  };

  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return;
    try {
      await API.delete(`/api/timetable/${scheduleToDelete}`);
      await fetchSavedSchedules();
      setSuccess('Timetable deleted successfully.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Error deleting timetable:', err);
      setError('Failed to delete timetable.');
    }
    setScheduleToDelete(null);
  };

  if (!canManage) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Navbar />
          <div className="dashboard-container flex items-center justify-center" style={{ minHeight: '60vh' }}>
            <div className="text-center p-8 bg-rose-50 border border-rose-200 rounded-2xl">
              <p className="text-rose-600 font-bold text-lg">Access Denied</p>
              <p className="text-rose-500 text-sm mt-1">You do not have permission to manage timetables.</p>
            </div>
          </div>
        </main>
        {/* Custom Delete Confirm Modal */}
        {scheduleToDelete && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '12px', width: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', textAlign: 'center' }}>
              <div style={{ color: '#ef4444', marginBottom: '16px' }}>
                <FiTrash2 size={40} />
              </div>
              <h3 style={{ margin: '0 0 8px 0' }}>Delete Timetable</h3>
              <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', fontSize: '14px' }}>Are you sure you want to delete this day's timetable? This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setScheduleToDelete(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                <button onClick={confirmDeleteSchedule} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="dashboard-container" style={{ margin: '20px' }}>

          {/* Page Header */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <FiCalendar style={{ color: '#6366f1' }} />
              Daily Timetable Management
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              Create weekly class schedules. Students will automatically see today's timetable.
            </p>
          </div>

          {/* Top Selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px', backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.05em' }}>Class</label>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontWeight: 'bold', outline: 'none' }}
              >
                <option value="">— Select Class —</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(cls => (
                  <option key={cls} value={String(cls)}>Class {cls}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.05em' }}>Section</label>
              <select
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontWeight: 'bold', outline: 'none' }}
              >
                {['A', 'B', 'C', 'D', 'E'].map(sec => (
                  <option key={sec} value={sec}>Section {sec}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.05em' }}>Day of Week</label>
              <select
                value={selectedDay}
                onChange={e => setSelectedDay(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontWeight: 'bold', outline: 'none' }}
              >
                {DAYS.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
          </div>

          {!selectedClass ? (
            <div style={{ padding: '60px', textAlign: 'center', backgroundColor: 'var(--card-bg)', borderRadius: '20px', border: '2px dashed var(--border-color)' }}>
              <FiCalendar size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>Please select a Class and Section to start managing the timetable.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>

              {/* Left: Period Editor */}
              <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiEdit3 style={{ color: '#6366f1' }} />
                      {selectedDay} — Class {selectedClass}-{selectedSection}
                    </h3>
                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {savedSchedules.find(s => s.dayOfWeek === selectedDay) ? '✅ Saved timetable loaded for editing.' : '🆕 No saved timetable. Using default template.'}
                    </p>
                  </div>
                </div>

                {/* Period Rows */}
                <div style={{ padding: '16px 24px' }}>
                  {periods.map((period, idx) => (
                    <div key={idx} style={{
                      marginBottom: '12px',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: `1px solid ${period.isBreak ? '#fef3c7' : 'var(--border-color)'}`,
                      backgroundColor: period.isBreak ? 'rgba(253,230,138,0.15)' : 'var(--input-bg)',
                      display: 'grid',
                      gridTemplateColumns: period.isBreak ? '80px 110px 110px 1fr 40px' : '80px 110px 110px 1fr 1fr 1fr 40px',
                      gap: '8px',
                      alignItems: 'center'
                    }}>
                      {/* Period Label */}
                      <div>
                        <label style={{ display: 'block', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '3px' }}>Period</label>
                        <input
                          value={period.period}
                          onChange={e => handlePeriodChange(idx, 'period', e.target.value)}
                          placeholder={period.isBreak ? 'Break' : '1'}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '13px', fontWeight: 'bold' }}
                        />
                      </div>

                      {/* Start Time */}
                      <div>
                        <label style={{ display: 'block', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '3px' }}>Start</label>
                        <input
                          type="time"
                          value={period.startTime}
                          onChange={e => handlePeriodChange(idx, 'startTime', e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '13px' }}
                        />
                      </div>

                      {/* End Time */}
                      <div>
                        <label style={{ display: 'block', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '3px' }}>End</label>
                        <input
                          type="time"
                          value={period.endTime}
                          onChange={e => handlePeriodChange(idx, 'endTime', e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '13px' }}
                        />
                      </div>

                      {/* Subject */}
                      {!period.isBreak ? (
                        <>
                          <div>
                            <label style={{ display: 'block', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '3px' }}>Subject</label>
                            <select
                              value={period.subject}
                              onChange={e => handlePeriodChange(idx, 'subject', e.target.value)}
                              style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '13px' }}
                            >
                              <option value="">Select Subject</option>
                              {period.subject && !availableCatalogSubjects.includes(period.subject) && (
                                <option value={period.subject}>{period.subject}</option>
                              )}
                              {availableCatalogSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '3px' }}>Teacher</label>
                            <input
                              value={period.teacher}
                              onChange={e => handlePeriodChange(idx, 'teacher', e.target.value)}
                              placeholder="Teacher Name"
                              list="timetable-teachers-list"
                              style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '13px' }}
                            />
                            <datalist id="timetable-teachers-list">
                              {catalogTeachers.map((t: any, ti: number) => {
                                const tName = t.user?.name || t.name || 'Teacher';
                                return <option key={t._id || ti} value={tName} />;
                              })}
                            </datalist>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '3px' }}>Room</label>
                            <input
                              value={period.room}
                              onChange={e => handlePeriodChange(idx, 'room', e.target.value)}
                              placeholder="Room 101"
                              style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '13px' }}
                            />
                          </div>
                        </>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', backgroundColor: 'rgba(251,191,36,0.15)', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', color: '#92400e' }}>
                          ☕ Recess / Break Period
                        </div>
                      )}

                      {/* Delete Button */}
                      <button
                        onClick={() => removePeriod(idx)}
                        title="Remove this period"
                        style={{ padding: '6px', borderRadius: '8px', border: '1px solid #fee2e2', backgroundColor: '#fef2f2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  ))}

                  {/* Add Buttons */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button
                      onClick={addPeriod}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', border: '1px solid #c7d2fe', backgroundColor: '#eef2ff', color: '#4f46e5', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                    >
                      <FiPlus size={15} /> Add Period
                    </button>
                    <button
                      onClick={addBreak}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', border: '1px solid #fde68a', backgroundColor: '#fffbeb', color: '#92400e', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                    >
                      <FiPlus size={15} /> Add Break
                    </button>
                  </div>
                </div>

                {/* Error / Success Messages */}
                {error && (
                  <div style={{ margin: '0 24px 16px', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '13px', fontWeight: 'bold' }}>
                    ⚠️ {error}
                  </div>
                )}
                {success && (
                  <div style={{ margin: '0 24px 16px', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '13px', fontWeight: 'bold' }}>
                    {success}
                  </div>
                )}

                {/* Save Footer */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 24px', borderRadius: '12px', border: 'none', backgroundColor: '#4f46e5', color: '#fff', fontWeight: 900, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
                  >
                    {saving ? <FiLoader className="animate-spin" size={16} /> : <FiSave size={16} />}
                    {saving ? 'Saving Timetable...' : `Save ${selectedDay}'s Timetable`}
                  </button>
                </div>
              </div>

              {/* Right: Saved Schedules Overview */}
              <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden', alignSelf: 'start' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
                  <h3 style={{ margin: 0, fontWeight: 900, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiClock style={{ color: '#10b981' }} />
                    Saved Schedule — Class {selectedClass}-{selectedSection}
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>Click a day tab to edit that schedule.</p>
                </div>

                {fetchingAll ? (
                  <div style={{ padding: '32px', textAlign: 'center' }}>
                    <FiLoader className="animate-spin" size={24} style={{ color: 'var(--text-muted)', margin: '0 auto' }} />
                  </div>
                ) : (
                  <div style={{ padding: '12px' }}>
                    {DAYS.map(day => {
                      const schedule = savedSchedules.find(s => s.dayOfWeek === day);
                      const isEditing = day === selectedDay;
                      return (
                        <div
                          key={day}
                          onClick={() => setSelectedDay(day)}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '12px',
                            marginBottom: '6px',
                            cursor: 'pointer',
                            border: `1px solid ${isEditing ? '#c7d2fe' : 'var(--border-color)'}`,
                            backgroundColor: isEditing ? '#eef2ff' : 'var(--input-bg)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div>
                            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '13px', color: isEditing ? '#4f46e5' : 'var(--text-main)' }}>{day}</p>
                            {schedule ? (
                              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>
                                {schedule.periods.length} period{schedule.periods.length !== 1 ? 's' : ''} saved
                              </p>
                            ) : (
                              <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>Not set</p>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {schedule && (
                              <span style={{ padding: '2px 8px', borderRadius: '6px', backgroundColor: '#d1fae5', color: '#059669', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                <FiCheck size={9} style={{ display: 'inline' }} /> Saved
                              </span>
                            )}
                            {isEditing && (
                              <span style={{ padding: '2px 8px', borderRadius: '6px', backgroundColor: '#e0e7ff', color: '#4f46e5', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                Editing
                              </span>
                            )}
                            {schedule && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteSchedule(schedule._id); }}
                                style={{ padding: '4px 6px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              >
                                <FiTrash2 size={11} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Custom Delete Confirm Modal */}
      {scheduleToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '12px', width: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ color: '#ef4444', marginBottom: '16px' }}>
              <FiTrash2 size={40} />
            </div>
            <h3 style={{ margin: '0 0 8px 0' }}>Delete Timetable</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', fontSize: '14px' }}>Are you sure you want to delete this day's timetable? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setScheduleToDelete(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
              <button onClick={confirmDeleteSchedule} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageTimetable;
