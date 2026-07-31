import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleAdminClick = async () => {
    if (name.trim() && password) {
      try {
        const res = await axios.post('http://localhost:8000/api/v1/auth/login', {
          email: name.trim(),
          password: password
        });
        localStorage.setItem('matrimony_admin_access_token', res.data.access_token);
        localStorage.setItem('matrimony_admin_refresh_token', res.data.refresh_token);
        navigate('/admin/');
        return;
      } catch (err) {
        console.error("Admin direct login error:", err);
      }
    }
    navigate('/admin/login');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (name.includes('@') || name.toLowerCase().includes('admin')) {
      try {
        const res = await axios.post('http://localhost:8000/api/v1/auth/login', {
          email: name.trim(),
          password: password
        });
        localStorage.setItem('matrimony_admin_access_token', res.data.access_token);
        localStorage.setItem('matrimony_admin_refresh_token', res.data.refresh_token);
        navigate('/admin/');
        return;
      } catch (err) {
        alert(err.response?.data?.detail || "Admin login failed. Please verify your email and password.");
        return;
      }
    }
    try {
      const res = await axios.post('http://localhost:8000/api/login', {
        phone_number: phone,
        password: password
      });
      localStorage.setItem('currentUser', JSON.stringify(res.data));
      navigate('/home');
    } catch (error) {
      console.error("Login error:", error);
      alert(error.response?.data?.detail || "Login failed. Please check your phone number and password.");
    }
  };

  return (
    <div className="login-page">
      <nav className="top-nav">
        <Link to="/register" className="register-link">Register</Link>
      </nav>
      
      <div className="login-main">
        
        {/* Top Banner Section */}
        <div className="login-banner-container">
          <div 
            style={{ 
              width: '100%', 
              height: '180px', 
              backgroundColor: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed #999',
              marginBottom: '10px'
            }}
            title="Upload your banner to frontend/public/banner.png"
          >
            <img src="/banner.png" alt="Matrimony Banner (Please add banner.png to public folder)" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
            <span style={{ position: 'absolute', color: '#666', fontSize: '18px', zIndex: -1 }}>[Banner Image Placeholder]</span>
          </div>
          <div className="login-banner-phone">
            +91 95977 50750/94433 09800
          </div>
        </div>

        <div className="login-content">
          <div className="login-left">
            <div 
              style={{
                width: '250px',
                height: '250px',
                backgroundColor: '#fff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed #999',
                marginBottom: '10px',
                position: 'relative'
              }}
              title="Upload your couple image to frontend/public/couple.png"
            >
              <img src="/couple.png" alt="Couple Graphic (Please add couple.png to public folder)" className="login-couple-img" style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
              <span style={{ color: '#666', fontSize: '14px', textAlign: 'center', padding: '10px' }}>[Couple Image Placeholder]</span>
            </div>
            <h1 className="brand-title">The most trusted<br/>Matrimony</h1>
          </div>
          
          <div className="login-right">
            <div className="login-card-exact">
              <div className="login-card-header">
                <h2>Login</h2>
              </div>
              <form className="login-card-body" onSubmit={handleLogin}>
                <input 
                  type="text" 
                  placeholder="Enter the name" 
                  className="exact-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                
                <div className="phone-input-group">
                  <input type="text" placeholder="+91" className="exact-input exact-country-code" defaultValue="+91" />
                  <input 
                    type="text" 
                    placeholder="Enter Number" 
                    className="exact-input exact-phone" 
                    maxLength="10"
                    pattern="\d{0,10}"
                    title="Please enter a valid 10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                
                <input 
                  type="password" 
                  placeholder="Enter password" 
                  className="exact-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                
                <div className="forgot-password-link">
                  <Link to="/forgot-password">Forgot password</Link>
                </div>
                
                <button type="submit" className="exact-login-btn">
                  Login
                </button>

                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <button 
                    type="button"
                    onClick={handleAdminClick}
                    style={{ 
                      display: 'inline-block',
                      width: '100%',
                      padding: '10px',
                      background: '#1e293b', 
                      color: '#ffffff', 
                      border: 'none',
                      borderRadius: '6px', 
                      cursor: 'pointer',
                      fontSize: '12px', 
                      fontWeight: '600' 
                    }}
                  >
                    🔒 Sign in as Administrator →
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
