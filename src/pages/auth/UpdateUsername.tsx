import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';

const UpdateUsername = () => {
  const [data, setData] = useState({ email: '', newName: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/api/auth/update-username', data);
      alert("Username updated!");
      navigate('/super-admin'); 
    } catch (err) {
      alert(err.response?.data?.message || "Error updating username");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h3 className="login-logo">Update Username</h3>
        
        <form onSubmit={handleUpdate} className="space-y-5">
          <div className="form-group">
            <label className='mt-8'>Registered Email</label>
            <input 
              type="email" 
              required 
              placeholder="example@gmail.com"
              className="form-control"
              onChange={(e) => setData({...data, email: e.target.value})}
            />
          </div>

          <div className="form-group">
             <label> New Username</label>
             <input 
              type="text" 
              placeholder="John Doe" 
              required
              className="form-control"
              onChange={(e) => setData({...data, newName: e.target.value})}
          />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="login-btn"
          >
            {loading ? 'Updating Name...' : 'Update Name'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateUsername;