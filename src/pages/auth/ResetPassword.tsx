import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { FiEyeOff, FiEye} from 'react-icons/fi';

const ResetPassword = () => {
  const [data, setData] = useState({ email: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(data.newPassword)) {
      alert("Password must be 8+ chars with uppercase, lowercase, number, and special character.");
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      await API.post('/api/auth/password-reset', {
        email: data.email,
        newPassword: data.newPassword
      });
      alert("Success! Password updated successfully.");
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || "Error resetting password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-logo">Reset Password</h2>
        <p>Set a new strong password for your account.</p>
        
        <form onSubmit={handleReset} className="space-y-5">
          <div className="form-group">
            <label>Registered Email</label>
            <input 
              type="email" 
              required 
              placeholder="example@gmail.com"
              className="form-control"
              onChange={(e) => setData({...data, email: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>New Password</label>
            <div className='relative'>
              <input 
                type={showPassword1 ? "text" : "password"}
                required 
                placeholder="••••••••"
                className="form-control"
                onChange={(e) => setData({...data, newPassword: e.target.value})}
              />
              <button 
                type="button"
                onClick={() => setShowPassword1(!showPassword1)}
                className="absolute right-4 top-4 text-[var(--text-muted)]"
              >
                {showPassword1 ? <FiEyeOff /> : <FiEye />}
              </button> 
            </div>
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <div className='relative'>
               <input 
                type={showPassword2 ? "text" : "password"}
                required 
                placeholder="••••••••"
                className="form-control"
                onChange={(e) => setData({...data, confirmPassword: e.target.value})}
              />
              <button 
                type="button"
                onClick={() => setShowPassword2(!showPassword2)}
                className="absolute right-4 top-4 text-[var(--text-muted)]"
              >
                {showPassword2 ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="login-btn"
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>

        <button 
          onClick={() => navigate('/login')}
          className="w-full mt-6 text-sm text-white hover:underline transition-colors"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;