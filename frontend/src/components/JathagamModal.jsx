import React from 'react';
import './ReportCard.css';
import './JathagamModal.css';

const CONTENT = {
  open: {
    title: 'Jathagam',
    text: 'This member has not shared their jathagam yet.',
    buttonText: 'Ok',
  },
  upload: {
    title: 'Share your jathagam',
    text: 'Upload your jathagam so your matches can view it.',
    buttonText: 'Upload',
  },
};

const JathagamModal = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;
  const current = CONTENT[type] || CONTENT.open;

  return (
    <div className="jm-backdrop" onClick={onClose}>
      <div className="card jm-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="empty-state-icon" style={{ margin: '0 auto 14px' }}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
        </div>
        <h2>{current.title}</h2>
        <p className="rc-subtitle">{current.text}</p>
        <button className="btn btn-primary rc-cta" onClick={onClose}>{current.buttonText}</button>
      </div>
    </div>
  );
};

export default JathagamModal;
