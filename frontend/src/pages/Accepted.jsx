import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import JathagamModal from '../components/JathagamModal';
import api from '../services/api.js';
import { toCardDisplay } from '../utils/profile.js';
import { presenceLabel, isOnline } from '../utils/presence.js';
import { isFavorite, toggleFavorite } from '../utils/favorites.js';
import './Accepted.css';

const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

const Accepted = () => {
  const navigate = useNavigate();
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'open' });
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, forceRender] = useState(0);

  useEffect(() => {
    api
      .get('/matches')
      .then(({ data }) => setProfiles(data.map((match) => toCardDisplay(match.member))))
      .catch((err) => console.error('Failed to load matches:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = (id) => {
    toggleFavorite(id);
    forceRender((n) => n + 1);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Accepted matches</h1>
        <p>Share horoscopes and connect with your matches</p>
      </div>

      {loading ? (
        <div className="profile-card-grid">
          {[1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 140 }} />)}
        </div>
      ) : profiles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>
          </div>
          <h3>No accepted matches yet</h3>
          <p>Matches you've both accepted will appear here.</p>
        </div>
      ) : (
        <div className="accepted-list">
          {profiles.map((profile) => (
            <div key={profile.id} className="card accepted-card animate-fade-in">
              <img className="accepted-card-img" src={profile.image} alt={profile.name} />
              <div className="accepted-card-body">
                <div className="profile-card-top">
                  <div>
                    <p className="profile-card-name">{profile.name}, {profile.age}</p>
                    <p className="profile-card-sub">{profile.location} · {profile.education} · {profile.religious}</p>
                    <p className={`profile-card-presence${isOnline(profile.lastActive) ? ' online' : ''}`}>{presenceLabel(profile.lastActive)}</p>
                  </div>
                  <button
                    className={`icon-btn${isFavorite(profile.id) ? ' active' : ''}`}
                    onClick={() => handleSave(profile.id)}
                    aria-label="Save"
                  >
                    <HeartIcon filled={isFavorite(profile.id)} />
                  </button>
                </div>

                <div className="accepted-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => setModalConfig({ isOpen: true, type: 'open' })}>
                    View Jathagam
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => setModalConfig({ isOpen: true, type: 'upload' })}>
                    Share Jathagam
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate(`/message?with=${profile.id}`)}>
                    Message
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <JathagamModal
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
      />
    </div>
  );
};

export default Accepted;
