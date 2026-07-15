import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import { FiDownload, FiSearch } from 'react-icons/fi';
import "../../styles/events.css";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({title: "", description: "", date: "", location: ""});
  
  // Export filters
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchEvents = async () => {
    try {
      const res = await API.get("/api/events/all");
      setEvents(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const editEvent = (event) => {
    setForm({
      title: event.title,
      description: event.description,
      date: event.date.split("T")[0],
      location: event.location
    });
    setEditingId(event._id);
  };

  const deleteEvent = async (id) => {
    try {
      await API.delete(`/api/events/${id}`);
      fetchEvents();
    } catch (err) {
      console.log(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await API.put(`/api/events/${editingId}`,form);
        setEditingId(null);
      } else {
        await API.post("/api/events/create", form);
      }
      setForm({ title: "", description: "", date: "", location: "" });
      fetchEvents();
    } catch (err) {
      console.log(err);
    }
  };

  const filteredEvents = events.filter((e: any) => {
    let matchesDate = true;
    const dateStr = e.date ? e.date.split("T")[0] : "";
    if (startDateFilter && endDateFilter) {
      matchesDate = dateStr >= startDateFilter && dateStr <= endDateFilter;
    } else if (startDateFilter) {
      matchesDate = dateStr >= startDateFilter;
    } else if (endDateFilter) {
      matchesDate = dateStr <= endDateFilter;
    }
    const matchesSearch = !searchTerm || 
      e.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.location?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDate && matchesSearch;
  });

  const downloadCSV = () => {
    if (filteredEvents.length === 0) {
      alert("No data to export for the selected dates.");
      return;
    }
    const headers = ['Title', 'Description', 'Date', 'Location'];
    
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
    for (const e of filteredEvents) {
      const row = [
        e.title,
        e.description,
        new Date(e.date).toLocaleDateString(),
        e.location
      ];
      csvRows.push(row.map(escapeCSV).join(','));
    }
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", 'events_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard-container">
      <h2>🎉 Event Management</h2>

      {/* 🔵 FORM */}
      <div className="card">
        <h3>{editingId ? "Update Event" : "Create Event"}</h3>
        <form onSubmit={handleSubmit} className="form-grid">
          <input
            type="text"
            placeholder="Event Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <input
            type="text"
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />

          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />

          <input
            type="text"
            placeholder="Location"
            value={form.location}
            onChange={(e) =>
              setForm({ ...form, location: e.target.value })
            }
          />

          <button className="btn-primary">
            {editingId ? "Update Event" : "Create Event"}
          </button>
        </form>
      </div>

      {/* 🟣 TABLE */}
      <div className="card">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h3 className="mb-0">All Events</h3>
          <div className="flex flex-wrap items-end gap-3">
            <div className="relative w-full md:w-64">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search events..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border rounded-lg text-sm bg-[var(--input-bg)] text-[var(--text-main)] border-[var(--border-color)] focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1 uppercase">Start Date</label>
              <input 
                type="date" 
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()}
                className="px-3 py-2 border rounded-lg text-sm bg-[var(--input-bg)] text-[var(--text-main)] border-[var(--border-color)] outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">End Date</label>
              <input 
                type="date" 
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()}
                className="px-3 py-2 border rounded-lg text-sm bg-[var(--input-bg)] text-[var(--text-main)] border-[var(--border-color)] outline-none focus:border-blue-500"
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

        <div className="overflow-x-auto w-full">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Location</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredEvents.map((e) => (
              <tr key={e._id}>
                <td>{e.title}</td>
                <td>{new Date(e.date).toLocaleDateString()}</td>
                <td>{e.location}</td>

                <td>
                  <div className="action-buttons">
                    <button
                      className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-200 transition-all duration-200 active:scale-95"
                      onClick={() => editEvent(e)}
                    >
                      ✏️ Edit
                    </button>

                    <button
                      className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-600 hover:text-white hover:shadow-lg hover:shadow-red-200 transition-all duration-200 active:scale-95"
                      onClick={() => deleteEvent(e._id)}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default Events;