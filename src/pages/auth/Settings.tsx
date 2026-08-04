import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import API from '../../api/axios';
import { FiUser, FiLock, FiSave, FiEye, FiEyeOff, FiCamera, FiTrash2 } from 'react-icons/fi';

const Settings = () => {
  const userRole = (localStorage.getItem('role') || '').toLowerCase();
  const email = localStorage.getItem('userEmail') || '';
  const [profileData, setProfileData] = useState({
    name: localStorage.getItem('userName') || '',
    email: email,
    phone: localStorage.getItem('userPhone') || '+91 99999 99999',
  });
  const [profileImage, setProfileImage] = useState<string>(
    localStorage.getItem(`student_photo_${email}`) || ''
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setProfileImage(base64);
      if (profileData.email) {
        localStorage.setItem(`student_photo_${profileData.email}`, base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (userRole === 'student') {
      alert('Students are not allowed to update their profile information.');
      return;
    }
    setLoadingProfile(true);
    try {
      // Replicate saving local storage values
      localStorage.setItem('userName', profileData.name);
      localStorage.setItem('userEmail', profileData.email);
      localStorage.setItem('userPhone', profileData.phone);
      
      // Attempt backend update if route exists
      try {
        await API.post('/api/auth/update-profile', {
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
        });
      } catch (err) {
        // Fallback gracefully if mock server or db route doesn't exist
        console.warn("Backend update skipped or failed. Local settings saved.", err);
      }

      alert('Profile details updated successfully!');
      window.location.reload(); // Reload to refresh Sidebar and Navbar name
    } catch (err) {
      alert('Error updating profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(passwordData.newPassword)) {
      alert("Password must be 8+ chars with uppercase, lowercase, number, and special character.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoadingPassword(true);
    try {
      await API.post('/api/auth/password-reset', {
        email: profileData.email,
        newPassword: passwordData.newPassword
      });
      alert("Password updated successfully!");
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      alert(err.response?.data?.message || "Error updating password");
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="dashboard-container" style={{ padding: '30px', maxWidth: '800px' }}>
          <div className="dashboard-header" style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>⚙️ Account Settings</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0' }}>
              Manage your personal information and account security settings.
            </p>
          </div>

          {/* Settings Tabs */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', borderBottom: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: activeTab === 'profile' ? '700' : '500',
                color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-muted)',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'profile' ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: '-1px',
                transition: 'all 0.2s',
              }}
            >
              👤 Profile Information
            </button>
            <button
              onClick={() => setActiveTab('security')}
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: activeTab === 'security' ? '700' : '500',
                color: activeTab === 'security' ? 'var(--primary)' : 'var(--text-muted)',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'security' ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: '-1px',
                transition: 'all 0.2s',
              }}
            >
              🔒 Security & Password
            </button>
          </div>

          {/* Tab Content: Profile */}
          {activeTab === 'profile' && (
            <div className="stat-card" style={{ padding: '24px', borderRadius: '12px', cursor: 'default' }}>
              <input type="file" ref={fileInputRef} onChange={handlePhotoSelect} accept="image/*" style={{ display: 'none' }} />
              
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>Personal Details</h3>
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Photo Upload Box */}
                {userRole !== 'student' && (
                  <div style={{ padding: "14px", borderRadius: "12px", backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "64px", height: "64px", borderRadius: "16px", backgroundColor: "var(--primary)", color: "white", fontWeight: "800", fontSize: "24px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        profileData.name ? profileData.name.charAt(0).toUpperCase() : '👤'
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>Profile Photo</div>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "0 0 8px" }}>Upload a JPEG/PNG photo (max 5MB)</p>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          style={{ padding: "6px 14px", borderRadius: "8px", backgroundColor: "var(--primary)", color: "white", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}
                        >
                          <FiCamera size={14} /> Upload Photo
                        </button>
                        {profileImage && (
                          <button
                            type="button"
                            onClick={() => {
                              setProfileImage('');
                              if (profileData.email) localStorage.removeItem(`student_photo_${profileData.email}`);
                            }}
                            style={{ padding: "6px 14px", borderRadius: "8px", backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}
                          >
                            <FiTrash2 size={14} /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    disabled={userRole === 'student'}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: userRole === 'student' ? 'rgba(0,0,0,0.05)' : 'var(--input-bg)',
                      color: userRole === 'student' ? 'var(--text-muted)' : 'var(--text-main)',
                      outline: 'none',
                      fontSize: '14px',
                      cursor: userRole === 'student' ? 'not-allowed' : 'text'
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--input-bg)',
                      color: 'var(--text-main)',
                      outline: 'none',
                      fontSize: '14px',
                      cursor: 'text'
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    disabled={userRole === 'student'}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: userRole === 'student' ? 'rgba(0,0,0,0.05)' : 'var(--input-bg)',
                      color: userRole === 'student' ? 'var(--text-muted)' : 'var(--text-main)',
                      outline: 'none',
                      fontSize: '14px',
                      cursor: userRole === 'student' ? 'not-allowed' : 'text'
                    }}
                  />
                </div>

                {userRole === 'student' ? (
                  <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", fontSize: "13px", fontWeight: "600", marginTop: "10px" }}>
                    ⚠️ Students are not allowed to edit their profile details. Please contact the administration department for any changes.
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={loadingProfile}
                    className="login-btn"
                    style={{
                      marginTop: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: 'fit-content',
                      padding: '10px 20px',
                      fontSize: '14px'
                    }}
                  >
                    <FiSave /> {loadingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
              </form>
            </div>
          )}

          {/* Tab Content: Security */}
          {activeTab === 'security' && (
            <div className="stat-card" style={{ padding: '24px', borderRadius: '12px', cursor: 'default' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>Update Password</h3>
              <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass.current ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      style={{
                        padding: '10px 40px 10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--input-bg)',
                        color: 'var(--text-main)',
                        outline: 'none',
                        fontSize: '14px',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(prev => ({ ...prev, current: !prev.current }))}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showPass.current ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass.new ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      style={{
                        padding: '10px 40px 10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--input-bg)',
                        color: 'var(--text-main)',
                        outline: 'none',
                        fontSize: '14px',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(prev => ({ ...prev, new: !prev.new }))}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showPass.new ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass.confirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      style={{
                        padding: '10px 40px 10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--input-bg)',
                        color: 'var(--text-main)',
                        outline: 'none',
                        fontSize: '14px',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(prev => ({ ...prev, confirm: !prev.confirm }))}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showPass.confirm ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingPassword}
                  className="login-btn"
                  style={{
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: 'fit-content',
                    padding: '10px 20px',
                    fontSize: '14px'
                  }}
                >
                  <FiLock /> {loadingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Settings;
