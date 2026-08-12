import React, { useState, useEffect } from 'react';
import API from '../api/axios';

const CLASSES = ['Nursery','KG','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];
const SECTIONS = ['A','B','C','D','E','F'];

const NoticeBoardAdmin: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', targetRole: 'all', targetClass: 'all', targetSection: 'all' });
  const [editingNotice, setEditingNotice] = useState<any>(null);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoadingAnnouncements(true);
      const res = await API.get('/api/notifications');
      setAnnouncements(res.data?.data || []);
    } catch (err) {
      console.warn("Error fetching announcements", err);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const publishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.message) return;
    try {
      setPublishing(true);
      if (editingNotice) {
        await API.put(`/api/notifications/${editingNotice._id}`, newAnnouncement);
        setEditingNotice(null);
        if ((window as any).showToast) {
          (window as any).showToast("Notice updated successfully!", "success");
        }
      } else {
        await API.post('/api/notifications', newAnnouncement);
        if ((window as any).showToast) {
          (window as any).showToast("Notice published successfully!", "success");
        }
      }
      setNewAnnouncement({ title: '', message: '', targetRole: 'all', targetClass: 'all', targetSection: 'all' });
      fetchAnnouncements();
    } catch (err: any) {
      window.alert("Failed to save notice: " + (err.response?.data?.message || err.message));
    } finally {
      setPublishing(false);
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const deleteAnnouncement = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleStartEdit = (notice: any) => {
    setEditingNotice(notice);
    setNewAnnouncement({
      title: notice.title,
      message: notice.message,
      targetRole: notice.targetRole || 'all',
      targetClass: notice.targetClass || 'all',
      targetSection: notice.targetSection || 'all'
    });
  };

  const handleCancelEdit = () => {
    setEditingNotice(null);
    setNewAnnouncement({ title: '', message: '', targetRole: 'all', targetClass: 'all', targetSection: 'all' });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '28px' }}>
      {/* Left Column: Publish Notice Form */}
      <div style={{ backgroundColor: 'var(--panel-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
          📢 {editingNotice ? 'Edit Announcement' : 'Publish Global Notice'}
        </h3>
        <form onSubmit={publishAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Notice Title *</label>
            <input 
              type="text" 
              required
              value={newAnnouncement.title}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
              placeholder="e.g. Independence Day Holiday"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Target Audience *</label>
            <select 
              value={newAnnouncement.targetRole}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, targetRole: e.target.value, targetClass: (e.target.value !== 'student' && e.target.value !== 'all') ? 'all' : newAnnouncement.targetClass, targetSection: (e.target.value !== 'student' && e.target.value !== 'all') ? 'all' : newAnnouncement.targetSection })}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            >
              <option value="all">All Roles (Students & Teachers)</option>
              <option value="teacher">Teachers Only</option>
              <option value="student">Students Only</option>
              <option value="manager-admin">Managers Only</option>
            </select>
          </div>
          {(newAnnouncement.targetRole === 'student' || newAnnouncement.targetRole === 'all') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Target Class *</label>
                <select 
                  value={newAnnouncement.targetClass}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, targetClass: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="all">All Classes</option>
                  {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Target Section</label>
                <select 
                  value={newAnnouncement.targetSection}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, targetSection: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="all">All Sections</option>
                  {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Detailed Message *</label>
            <textarea 
              required
              rows={5}
              value={newAnnouncement.message}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
              placeholder="Enter announcement description..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="submit" 
              disabled={publishing}
              style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {publishing ? 'Saving...' : editingNotice ? '💾 Save Changes' : '📢 Publish Announcement'}
            </button>
            {editingNotice && (
              <button 
                type="button"
                onClick={handleCancelEdit}
                style={{ padding: '12px 20px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-muted)', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                ❌ Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Right Column: Published Notices Directory */}
      <div style={{ backgroundColor: 'var(--panel-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
          📖 Active Announcements ({announcements.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '420px' }}>
          {loadingAnnouncements ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>Loading announcements...</div>
          ) : announcements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>No announcements published yet.</div>
          ) : (
            announcements.map((a) => (
              <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '14px', borderRadius: '12px', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{a.title}</strong>
                    <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase', backgroundColor: 'var(--primary-bg)', color: 'var(--primary)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)' }}>
                      Target: {a.targetRole}
                    </span>
                    {a.targetClass && a.targetClass !== 'all' && (
                      <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase', backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid color-mix(in srgb, var(--success) 20%, transparent)' }}>
                        Class: {a.targetClass}{a.targetSection && a.targetSection !== 'all' ? `-${a.targetSection}` : ''}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{a.message}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <span>By: {a.createdBy}</span>
                    <span>{new Date(a.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start' }}>
                  <button 
                    onClick={() => handleStartEdit(a)}
                    style={{ border: 'none', background: 'none', color: 'var(--primary)', fontSize: '16px', cursor: 'pointer', padding: '4px' }}
                    title="Edit Notice"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => deleteAnnouncement(a._id)}
                    style={{ border: 'none', background: 'none', color: 'var(--danger)', fontSize: '16px', cursor: 'pointer', padding: '4px' }}
                    title="Delete Notice"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {deleteConfirmId && (
        <div 
          className="modal-overlay" 
          onClick={() => setDeleteConfirmId(null)} 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            zIndex: 9999, padding: '16px' 
          }}
        >
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', 
              borderRadius: '20px', padding: '24px', width: '380px', maxWidth: '95%', 
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ background: 'var(--danger-bg)', padding: '10px', borderRadius: '12px', color: 'var(--danger)', display: 'flex' }}>
                <span style={{ fontSize: '22px' }}>📢</span>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>Delete Announcement</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>Action cannot be undone</p>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Are you sure you want to delete this notice announcement from the notice board?
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
                    await API.delete(`/api/notifications/${id}`);
                    fetchAnnouncements();
                    if ((window as any).showToast) (window as any).showToast("Notice deleted!", "success");
                  } catch (err: any) {
                    if ((window as any).showToast) (window as any).showToast("Failed to delete notice", "error");
                  }
                }}
                style={{ padding: '9px 18px', borderRadius: '10px', border: 'none', background: 'var(--danger)', color: 'white', fontWeight: 900, fontSize: '13px', cursor: 'pointer' }}
              >
                Delete Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticeBoardAdmin;
