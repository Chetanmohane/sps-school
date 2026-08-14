import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../../api/axios';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { FiPlus, FiEyeOff, FiEye} from 'react-icons/fi';

const AdminManager = () => {
  const { role } = useParams();      //fetch from url
  const [showPassword, setShowPassword] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone:'', password: '', className: '', section: '' });

  const fetchAdmins = async () => {
    try {
      const res = await API.get(`/api/super-admin/role/${role}`);
      setAdmins(res.data);
    } catch (err) { 
        console.error(err); 
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await API.get('/api/academic-admin/classes');
      setClassesList(res.data?.data || res.data || []);
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
  };

  const getAllClassOptions = () => {
    const standard = ['Nursery', 'KG', 'LKG', 'UKG', 'Playgroup', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    const dbClasses = (classesList || []).map((c: any) => String(c.className).trim()).filter(Boolean);
    const combined = Array.from(new Set([...dbClasses, ...standard]));
    const order = ['Nursery', 'Playgroup', 'LKG', 'UKG', 'KG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    return combined.sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b, undefined, { numeric: true });
    });
  };

  const getSectionOptions = (selectedClass?: string) => {
    const standard = ['A', 'B', 'C', 'D', 'E'];
    const dbSections = selectedClass
      ? (classesList || []).filter((c: any) => String(c.className).trim().toLowerCase() === String(selectedClass).trim().toLowerCase()).map((c: any) => String(c.section).trim().toUpperCase())
      : (classesList || []).map((c: any) => String(c.section).trim().toUpperCase());
    const combined = Array.from(new Set([...dbSections, ...standard])).filter(Boolean);
    return combined.sort();
  };

  useEffect(() => { 
    fetchAdmins(); 
    if (role === 'class-teacher') {
      fetchClasses();
    }
  }, [role]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // Password Validation Regex
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const phoneRegex = /^\+91\d{10}$/;

    if (!phoneRegex.test(formData.phone)) {
      alert("Phone number must start with +91 followed by 10 digits (e.g., +919876543210)");
      return;
    }

    if (!passwordRegex.test(formData.password)) {
      alert("Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character.");
      return; 
    }

    try {
      await API.post('/api/super-admin/create-admin', { ...formData, role });
      setShowForm(false);
      setFormData({ name: '', email: '', phone: '', password: '', className: '', section: '' });
      fetchAdmins();
    } catch (err: any) { 
        alert(err.response?.data?.message || "Error adding admin"); 
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const formatRoleTitle = (r: string) => {
    const roleMap: Record<string, string> = {
      'super-admin': 'Super Admin',
      'manager-admin': 'Manager Admin',
      'student-admin': 'Student Admin',
      'academic-admin': 'Teacher Admin',
      'finance-admin': 'Finance Admin',
      'operations-admin': 'Operations Admin',
      'class-teacher': 'Class Teacher',
    };
    return roleMap[r] || (r ? r.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Admin');
  };

  const formattedRoleName = formatRoleTitle(role || '');

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />

        <div className="dashboard-container" style={{ padding: '30px' }}>
          <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ margin: 0 }}>Manage {formattedRoleName} Accounts</h2>
            <button 
              className="flex items-center px-5 py-2.5 rounded-lg font-semibold transition-all shadow-sm bg-indigo-600 text-white" 
              onClick={() => setShowForm(!showForm)}
              style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
            >
              {showForm ? "Cancel" : (<>
                <FiPlus style={{ marginRight: '8px' }} /> 
                <span>Add New {formattedRoleName}</span>
              </>)
              }
            </button>
          </div>

          {showForm && (
            <div style={{ backgroundColor: 'var(--card-bg)', padding: '25px', borderRadius: '12px', marginBottom: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
               <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <input style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)'  }} 
                  type="text" 
                  placeholder="Name" 
                  required 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />
                <input style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)'  }} 
                  type="email" 
                  placeholder="Email" 
                  required 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                />
                <input style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)'  }} 
                  type="text" 
                  placeholder="Phone (+919876543210)" 
                  required 
                  maxLength={13}
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                />
                <div style={{ position: 'relative' }}>
                  <input style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', width: '100%', boxSizing: 'border-box' }} 
                    type={showPassword ? "text" : "password"}
                    placeholder="Password (e.g. Admin@123)" 
                    required 
                    value={formData.password} 
                    onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                {role === 'class-teacher' && (
                  <>
                    <select
                      required
                      value={formData.className}
                      onChange={(e) => {
                        const newClass = e.target.value;
                        const secs = getSectionOptions(newClass);
                        setFormData({ ...formData, className: newClass, section: secs[0] || 'A' });
                      }}
                      style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontWeight: 700 }}
                    >
                      <option value="">-- Select Class --</option>
                      {getAllClassOptions().map((cn: any) => (
                        <option key={cn} value={cn}>Class {cn}</option>
                      ))}
                    </select>

                    <select
                      required
                      disabled={!formData.className}
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontWeight: 700 }}
                    >
                      <option value="">-- Select Section --</option>
                      {getSectionOptions(formData.className).map((sec: any) => (
                        <option key={sec} value={sec}>Section {sec}</option>
                      ))}
                    </select>
                  </>
                )}

                <button type="submit" style={{ gridColumn: role === 'class-teacher' ? '1/-1' : 'auto', padding: '12px', borderRadius: '6px', background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                  Create {formattedRoleName} Account
                </button>
              </form>
            </div>
          )}

          <div className="table-container">
            <div className="overflow-x-auto w-full">
            <h3 className='ml-2'>All {formattedRoleName} Accounts</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone No.</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <tr key={admin._id}>
                    <td>{admin.name}</td>
                    <td>{admin.email}</td>
                    <td>{admin.phone}</td>
                    <td>
                      <button 
                        className='bg-red-100 text-red-600 px-4 py-1.5 rounded-md hover:bg-red-600 hover:text-white transition-all text-sm font-medium'
                        onClick={() => handleDelete(admin._id)}
                      >
                       🗑 Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {admins.length === 0 && <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No admins found.</p>}
          </div>
        </div>
      </main>

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
                <span style={{ fontSize: '22px' }}>👑</span>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>Delete Admin Account</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>Action cannot be undone</p>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Are you sure you want to revoke and delete this admin user account?
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
                    await API.delete(`/api/super-admin/delete-admin/${id}`);
                    fetchAdmins();
                    if ((window as any).showToast) (window as any).showToast("Admin account deleted!", "success");
                  } catch (err: any) {
                    if ((window as any).showToast) (window as any).showToast("Failed to delete admin", "error");
                  }
                }}
                style={{ padding: '9px 18px', borderRadius: '10px', border: 'none', background: 'var(--danger)', color: 'white', fontWeight: 900, fontSize: '13px', cursor: 'pointer' }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManager;