import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Register.css';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP, 3: New Password
  const [otpMessage, setOtpMessage] = useState('');
  const navigate = useNavigate();

  const renderStep = () => {
    if (step === 1) {
      return (
        <div className="fp-step animate-fade-in">
          <h2>Reset your password</h2>
          <p className="reg-subtitle">Enter the mobile number linked to your account</p>
          <label className="field-label">Mobile number</label>
          <input type="text" className="input" placeholder="10-digit mobile number" maxLength="10" />
          <button className="btn btn-primary reg-cta" onClick={() => setStep(2)}>Send OTP</button>
        </div>
      );
    } else if (step === 2) {
      return (
        <div className="fp-step animate-fade-in">
          <h2>Verify OTP</h2>
          <p className="reg-subtitle">Enter the code we sent to your number</p>
          <div className="reg-otp-inputs">
            {[0, 1, 2, 3].map((i) => (
              <input key={i} type="text" maxLength="1" className="reg-otp-box" />
            ))}
          </div>
          <button className="btn btn-primary reg-cta" onClick={() => setStep(3)}>Verify</button>
          <p className="reg-footer-text">
            Didn't get a code?{' '}
            <button type="button" className="reg-link-btn" onClick={() => setOtpMessage('A new OTP has been sent.')}>
              Resend OTP
            </button>
          </p>
          {otpMessage && <p className="reg-subtitle">{otpMessage}</p>}
        </div>
      );
    }
    return (
      <div className="fp-step animate-fade-in">
        <h2>Set a new password</h2>
        <p className="reg-subtitle">Choose a strong password for your account</p>
        <label className="field-label">New password</label>
        <input type="password" placeholder="At least 6 characters" className="input" />
        <button className="btn btn-primary reg-cta" onClick={() => navigate('/login')}>Save &amp; log in</button>
      </div>
    );
  };

  return (
    <div className="fp-page">
      <div className="fp-card">
        {renderStep()}
        <p className="reg-footer-text"><Link to="/login">Back to login</Link></p>
      </div>
    </div>
  );
};

export default ForgotPassword;
