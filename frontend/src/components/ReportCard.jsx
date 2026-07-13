import React, { useState } from 'react';
import api from '../services/api.js';
import './ReportCard.css';

const REASONS = ['Safety concerns', 'Technical issue', 'General support', 'Fake profile', 'Inappropriate content'];

const ReportCard = ({ onClose, reportedId }) => {
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reportedId) {
      setIsSubmitted(true);
      return;
    }
    try {
      await api.post('/reports', { reported_id: reportedId, reason, description: message });
      setIsSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not send your complaint. Please try again.');
    }
  };

  if (isSubmitted) {
    return (
      <div className="rc-backdrop" onClick={onClose}>
        <div className="card rc-card rc-success animate-fade-in" onClick={(e) => e.stopPropagation()}>
          <div className="empty-state-icon" style={{ margin: '0 auto 14px' }}>✓</div>
          <h2>Your report has been sent</h2>
          <p className="rc-subtitle">Our team will review it shortly.</p>
          <button className="btn btn-primary rc-cta" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rc-backdrop" onClick={onClose}>
      <div className="card rc-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <h2>Report this profile</h2>
        <p className="rc-subtitle">Help us keep the community safe</p>

        <label className="field-label">Type of complaint</label>
        <select className="select" value={reason} onChange={(e) => setReason(e.target.value)}>
          <option value="">Choose a reason</option>
          {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>

        {reason && (
          <>
            <label className="field-label" style={{ marginTop: 14 }}>Message</label>
            <textarea className="textarea" placeholder="Tell us more…" value={message} onChange={(e) => setMessage(e.target.value)} />
            {error && <p className="rc-error">{error}</p>}
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit}>Submit</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportCard;
