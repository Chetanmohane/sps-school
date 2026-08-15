import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { FiEyeOff, FiEye, FiArrowLeft, FiHome } from 'react-icons/fi';

const Login = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.id]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await API.post("/api/auth/login", credentials);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role);
      localStorage.setItem("userName", response.data.name);
      localStorage.setItem("userEmail", response.data.email);

      const userRole = (response.data.role || "").toLowerCase();
      const userEmail = (response.data.email || "").toLowerCase();
      const userName = (response.data.name || "").toLowerCase();

      // Explicit Class Teacher Redirection
      if (
        userRole === "class-teacher" ||
        userRole === "class_teacher" ||
        userEmail.includes("classteacher") ||
        userEmail.includes("chetanmohane5") ||
        userName.includes("class teacher")
      ) {
        localStorage.setItem("role", "class-teacher");
        navigate("/class-teacher");
        return;
      }

      // Explicit Subject Teacher Redirection
      if (
        userRole === "teacher" ||
        userRole === "subject-teacher" ||
        userRole === "subject_teacher" ||
        userEmail.includes("subjectteacher") ||
        userEmail.includes("chetanmohane2729")
      ) {
        localStorage.setItem("role", "teacher");
        navigate("/teacher");
        return;
      }

      const rolePaths: Record<string, string> = {
        admin: "/admin",
        teacher: "/teacher",
        "class-teacher": "/class-teacher",
        student: "/student",
        "finance-admin": "/finance-admin",
        "super-admin": "/super-admin",
        "manager-admin": "/super-admin",
        "academic-admin": "/academic-admin",
        "operations-admin": "/operations-admin",
      };

      navigate(rolePaths[userRole] || "/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid Email or Password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Return to Website Button */}
        <div style={{ textAlign: "left", marginBottom: "16px" }}>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#f8fafc",
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
              e.currentTarget.style.transform = "translateX(-2px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
              e.currentTarget.style.transform = "translateX(0px)";
            }}
          >
            <FiArrowLeft size={14} /> ← Back to Website / मुख्य वेबसाइट
          </button>
        </div>

        <div className="login-logo">Vasant Valley School ERP</div>
        <div style={{ textAlign: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.18em', color: 'var(--primary)', textTransform: 'uppercase' }}>
            LEARN • GROW • LEAD • SERVE
          </span>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>
            सीखें • बढ़ें • नेतृत्व करें • सेवा करें
          </div>
        </div>
        <p>Sign in to your account</p>

        {error && (
          <div
            style={{
              color: "#ef4444",
              backgroundColor: "#fee2e2",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "15px",
              fontSize: "13px",
              textAlign: "center",
              fontWeight: "600"
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="admin@vasantvalley.edu"
              value={credentials.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className='relative'>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="••••••••"
                value={credentials.password}
                onChange={handleChange}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-[var(--text-muted)]"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Verifying..." : "Secure Login"}
          </button>
        </form>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#38bdf8'}
            onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            <FiHome size={14} /> Return to Home Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
