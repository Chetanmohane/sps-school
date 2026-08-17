import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import {
  FiCalendar, FiDownload, FiSearch, FiEdit2, FiTrash2,
  FiPlus, FiCheck, FiX, FiTag, FiMapPin, FiClock, FiSun
} from 'react-icons/fi';
import "../../styles/events.css";

const EVENT_TYPES = [
  { id: "Holiday", label: "🏖️ Holiday", color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)" },
  { id: "Event", label: "🎉 School Event", color: "#3b82f6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)" },
  { id: "Academic", label: "📚 Academic", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.3)" },
  { id: "Sports", label: "🏆 Sports & Games", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
  { id: "Exam", label: "📝 Examination", color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)" },
];

const Events = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    endDate: "",
    type: "Holiday",
    location: ""
  });

  // Export & Category filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Toast message
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/events/all");
      setEvents(res.data || []);
    } catch (err: any) {
      console.error("Error fetching events/holidays:", err);
      showToast("Failed to load events & holidays data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const editEvent = (event: any) => {
    setForm({
      title: event.title || "",
      description: event.description || "",
      date: event.date ? event.date.split("T")[0] : "",
      endDate: event.endDate ? event.endDate.split("T")[0] : "",
      type: event.type || "Holiday",
      location: event.location || ""
    });
    setEditingId(event._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ title: "", description: "", date: "", endDate: "", type: "Holiday", location: "" });
  };

  const deleteEvent = async (id: string) => {
    try {
      await API.delete(`/api/events/${id}`);
      showToast("Item deleted successfully", "success");
      setDeleteConfirmId(null);
      fetchEvents();
    } catch (err: any) {
      showToast("Error deleting item: " + (err.response?.data?.message || err.message), "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date) {
      showToast("Title and Start Date are required!", "error");
      return;
    }

    const payload: any = {
      title: form.title.trim(),
      description: form.description ? form.description.trim() : "",
      date: form.date,
      type: form.type || "Holiday",
      location: form.location ? form.location.trim() : ""
    };

    if (form.endDate && form.endDate.trim() !== "") {
      payload.endDate = form.endDate;
    }

    try {
      if (editingId) {
        await API.put(`/api/events/${editingId}`, payload);
        showToast("Holiday / Event updated successfully!", "success");
        setEditingId(null);
      } else {
        await API.post("/api/events/create", payload);
        showToast("Holiday / Event created successfully!", "success");
      }
      setForm({ title: "", description: "", date: "", endDate: "", type: "Holiday", location: "" });
      fetchEvents();
    } catch (err: any) {
      showToast("Failed to save: " + (err.response?.data?.message || err.message), "error");
    }
  };

  const filteredEvents = events.filter((e: any) => {
    // Type Filter
    if (typeFilter !== 'all' && (e.type || 'Event') !== typeFilter) {
      return false;
    }

    // Date Filter
    let matchesDate = true;
    const dateStr = e.date ? e.date.split("T")[0] : "";
    if (startDateFilter && endDateFilter) {
      matchesDate = dateStr >= startDateFilter && dateStr <= endDateFilter;
    } else if (startDateFilter) {
      matchesDate = dateStr >= startDateFilter;
    } else if (endDateFilter) {
      matchesDate = dateStr <= endDateFilter;
    }

    // Search
    const matchesSearch = !searchTerm ||
      e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.type?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesDate && matchesSearch;
  });

  const downloadCSV = () => {
    if (filteredEvents.length === 0) {
      alert("No data to export for the selected filters.");
      return;
    }
    const headers = ['Type', 'Title', 'Description', 'Start Date', 'End Date', 'Location'];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '';
      let stringVal = String(val);
      if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
        stringVal = `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    };

    const csvRows = [];
    csvRows.push(headers.map(escapeCSV).join(','));
    for (const e of filteredEvents) {
      const row = [
        e.type || 'Event',
        e.title,
        e.description,
        e.date ? new Date(e.date).toLocaleDateString('en-GB') : '',
        e.endDate ? new Date(e.endDate).toLocaleDateString('en-GB') : '',
        e.location
      ];
      csvRows.push(row.map(escapeCSV).join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `school_holidays_events_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const holidaysCount = events.filter(e => e.type === 'Holiday').length;
  const eventsCount = events.filter(e => e.type === 'Event' || !e.type).length;

  const content = (
    <div style={{ padding: '0 0 32px 0' }}>
      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#ffffff', padding: '12px 20px', borderRadius: '12px',
          fontWeight: 700, fontSize: '13px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {toast.type === 'success' ? '✓' : '⚠️'} {toast.message}
        </div>
      )}

      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1e1b4b 100%)',
        borderRadius: '20px', padding: '28px 32px', marginBottom: '24px',
        border: '1px solid rgba(255,255,255,0.1)', color: '#fff', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ backgroundColor: 'rgba(16,185,129,0.2)', color: '#34d399', fontSize: '11px', fontWeight: '800', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.3)', textTransform: 'uppercase' }}>
                🗓️ Academic Calendar Management
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
              Holidays & School Events Portal
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.6)', maxWidth: '540px' }}>
              Create and publish official school holidays, festive vacations, sports meets, and academic events for teachers, students and staff.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '10px 16px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#34d399' }}>{holidaysCount}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Holidays Listed</div>
            </div>
            <div style={{ backgroundColor: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', padding: '10px 16px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#60a5fa' }}>{eventsCount}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Events Scheduled</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Form & List */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6 w-full max-w-full overflow-hidden box-sizing-border-box">
        
        {/* Create / Edit Form Card */}
        <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)', flex: '1 1 320px', minWidth: 0, boxSizing: 'border-box' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {editingId ? <FiEdit2 size={18} style={{ color: '#3b82f6' }} /> : <FiPlus size={18} style={{ color: '#10b981' }} />}
            {editingId ? "Update Holiday / Event" : "Add New Holiday or Event"}
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Category / Type Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Category / Type *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {EVENT_TYPES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setForm({ ...form, type: t.id })}
                    style={{
                      padding: '8px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                      border: form.type === t.id ? `2px solid ${t.color}` : '1px solid var(--border-color)',
                      backgroundColor: form.type === t.id ? t.bg : 'var(--input-bg)',
                      color: form.type === t.id ? t.color : 'var(--text-muted)',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Title / Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Diwali Holiday, Annual Sports Day"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Date range */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Start Date *</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>End Date (Optional)</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Location / Venue */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Venue / Location</label>
              <input
                type="text"
                placeholder="e.g. School Campus, Main Auditorium, All Branches"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Description / Details</label>
              <textarea
                rows={3}
                placeholder="Enter details, timings or instructions..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="submit"
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                  backgroundColor: editingId ? '#3b82f6' : 'var(--primary)',
                  color: 'white', fontWeight: '800', fontSize: '13px', cursor: 'pointer'
                }}
              >
                {editingId ? "💾 Save Changes" : "🚀 Create Holiday / Event"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  style={{
                    padding: '12px 18px', borderRadius: '10px', border: '1px solid var(--border-color)',
                    backgroundColor: 'transparent', color: 'var(--text-muted)', fontWeight: '700', fontSize: '13px', cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Directory & Filters */}
        <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', flex: '1 1 320px', minWidth: 0, boxSizing: 'border-box' }}>
          
          {/* Header & Filter Controls */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>
                📋 All Listed Holidays & Events ({filteredEvents.length})
              </h3>

              <button
                onClick={downloadCSV}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px',
                  backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)',
                  fontWeight: '700', fontSize: '12px', cursor: 'pointer'
                }}
              >
                <FiDownload size={14} /> Export CSV
              </button>
            </div>

            {/* Type Quick Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <button
                onClick={() => setTypeFilter('all')}
                style={{
                  padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', border: 'none', cursor: 'pointer',
                  backgroundColor: typeFilter === 'all' ? 'var(--primary)' : 'var(--input-bg)',
                  color: typeFilter === 'all' ? '#fff' : 'var(--text-muted)'
                }}
              >
                All ({events.length})
              </button>

              {EVENT_TYPES.map(t => {
                const count = events.filter(e => e.type === t.id).length;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTypeFilter(t.id)}
                    style={{
                      padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                      border: typeFilter === t.id ? `1px solid ${t.color}` : '1px solid var(--border-color)',
                      backgroundColor: typeFilter === t.id ? t.bg : 'var(--input-bg)',
                      color: typeFilter === t.id ? t.color : 'var(--text-muted)'
                    }}
                  >
                    {t.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search & Date Filter Bar */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 180px', position: 'relative' }}>
                <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={13} />
                <input
                  type="text"
                  placeholder="Search holiday title or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 30px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <input
                type="date"
                title="From Date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '12px', outline: 'none' }}
              />
              <input
                type="date"
                title="To Date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '12px', outline: 'none' }}
              />

              {(searchTerm || startDateFilter || endDateFilter || typeFilter !== 'all') && (
                <button
                  onClick={() => { setSearchTerm(''); setStartDateFilter(''); setEndDateFilter(''); setTypeFilter('all'); }}
                  style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Events/Holidays List */}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '520px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>Loading calendar data...</div>
            ) : filteredEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                <FiSun size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
                <div>No holidays or events found matching your criteria.</div>
              </div>
            ) : (
              filteredEvents.map((item: any) => {
                const typeObj = EVENT_TYPES.find(t => t.id === item.type) || EVENT_TYPES[1];
                const startDateStr = item.date ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
                const endDateStr = item.endDate ? new Date(item.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

                return (
                  <div
                    key={item._id}
                    style={{
                      padding: '16px', borderRadius: '12px', backgroundColor: 'var(--panel-bg)',
                      border: `1px solid ${typeObj.border}`, display: 'flex', justifyContent: 'space-between', gap: '14px'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', backgroundColor: typeObj.bg, color: typeObj.color, border: `1px solid ${typeObj.border}` }}>
                          {typeObj.label}
                        </span>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>{item.title}</h4>
                      </div>

                      {item.description && (
                        <p style={{ margin: '0 0 8px 0', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                          {item.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '600' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiCalendar size={13} style={{ color: typeObj.color }} />
                          {startDateStr} {endDateStr ? ` to ${endDateStr}` : ''}
                        </span>

                        {item.location && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FiMapPin size={13} style={{ color: 'var(--primary)' }} />
                            {item.location}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                      <button
                        onClick={() => editEvent(item)}
                        style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.3)', backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                        title="Edit Item"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        onClick={() => setDeleteConfirmId(item._id)}
                        style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                        title="Delete Item"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          onClick={() => setDeleteConfirmId(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '16px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)',
              borderRadius: '20px', padding: '24px', width: '380px', maxWidth: '95%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(239,68,68,0.12)', padding: '10px', borderRadius: '12px', color: '#ef4444' }}>
                <FiTrash2 size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>Confirm Delete</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>Action cannot be undone</p>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Are you sure you want to delete this holiday or event entry from the school calendar?
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{ padding: '9px 18px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-main)', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteEvent(deleteConfirmId)}
                style={{ padding: '9px 18px', borderRadius: '10px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 900, fontSize: '13px', cursor: 'pointer' }}
              >
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // If accessed directly via page route /operations-admin/events, wrap in Sidebar & Navbar layout
  const isDirectRoute = window.location.pathname.includes("/operations-admin/events");

  if (isDirectRoute) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Navbar />
          <div className="dashboard-container">
            {content}
          </div>
        </main>
      </div>
    );
  }

  return content;
};

export default Events;