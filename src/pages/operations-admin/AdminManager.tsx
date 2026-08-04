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
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone:'', password: '' });

  const fetchAdmins = async () => {
    try {
      const res = await API.get(`/api/super-admin/role/${role}`);
      setAdmins(res.data);
    } catch (err) { 
        console.error(err); 
    }
  };

  useEffect(() => { 
    fetchAdmins(); 
  }, [role]);

  const handleSubmit = async (e) => {
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
      setFormData({ name: '', email: '', phone: '', password: '' });
      fetchAdmins();
    } catch (err) { 
        alert(err.response?.data?.message || "Error adding admin"); 
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this admin?")) {
      await API.delete(`/api/super-admin/delete-admin/${id}`);
      fetchAdmins();
    }
  };

  const formatRoleTitle = (r: string) => {
    const roleMap: Record<string, string> = {
      'super-admin': 'Super Admin',
      'manager-admin': 'Manager Admin',
      'student-admin': 'Student Admin',
      'academic-admin': 'Teacher Admin',
      'finance-admin': 'Finance Admin',
      'operations-admin': 'Operations Admin',
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
                <span>Add New Admin</span>
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
                  placeholder="Phone" 
                  required 
                  maxLength={13}
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                />
                <div className="relative">
                  <input style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', width: '100%'  }} 
                    type={showPassword ? "text" : "password"}
                    placeholder="Password" 
                    required 
                    value={formData.password} 
                    onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-4 text-[var(--text-muted)]"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                <button type="submit" style={{ marginLeft: '32px', padding: '12px', borderRadius: '6px', background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                  Create Admin
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
    </div>
  );
};

export default AdminManager;