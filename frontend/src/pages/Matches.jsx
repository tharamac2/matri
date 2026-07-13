import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileDetailModal from '../components/ProfileDetailModal.jsx';
import api from '../services/api.js';
import { toCardDisplay } from '../utils/profile.js';
import { presenceLabel, isOnline } from '../utils/presence.js';
import { isFavorite, toggleFavorite } from '../utils/favorites.js';
import './Matches.css';

const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

const Matches = () => {
  const navigate = useNavigate();
  const [profilesList, setProfilesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    api
      .get('/matches')
      .then(({ data }) => setProfilesList(data.map((match) => toCardDisplay(match.member))))
      .catch((err) => console.error('Failed to load matches:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = (e, id) => {
    if (e) e.stopPropagation();
    toggleFavorite(id);
    forceRender((n) => n + 1);
  };

  const handleMessage = (id) => navigate(`/message?with=${id}`);

  const handleBlock = async (profile) => {
    if (!window.confirm(`Block ${profile.name}? They won't be able to message or match with you.`)) return;
    try {
      await api.post('/blocks', { blocked_id: profile.id });
      setProfilesList((prev) => prev.filter((p) => p.id !== profile.id));
      setSelectedProfile(null);
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not block this member.');
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Matches</h1>
        <p>People you've both said yes to</p>
      </div>

      {loading ? (
        <div className="profile-card-grid">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 110 }} />)}
        </div>
      ) : profilesList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>
          </div>
          <h3>No matches yet</h3>
          <p>When someone you're interested in accepts, they'll show up here.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/search')}>Browse profiles</button>
        </div>
      ) : (
        <div className="profile-card-grid">
          {profilesList.map((profile) => (
            <div key={profile.id} className="card card-hover profile-card animate-fade-in" onClick={() => { setSelectedProfile(profile); api.get(`/profiles/${profile.id}`).catch(() => {}); }} style={{ cursor: 'pointer' }}>
              <img className="profile-card-img" src={profile.image} alt={profile.name} />
              <div className="profile-card-body">
                <div className="profile-card-top">
                  <div>
                    <p className="profile-card-name">{profile.name}, {profile.age}</p>
                    <p className="profile-card-sub">{profile.location} · {profile.education}</p>
                    <p className={`profile-card-presence${isOnline(profile.lastActive) ? ' online' : ''}`}>{presenceLabel(profile.lastActive)}</p>
                  </div>
                  <button
                    className={`icon-btn${isFavorite(profile.id) ? ' active' : ''}`}
                    onClick={(e) => handleSave(e, profile.id)}
                    aria-label="Save"
                  >
                    <HeartIcon filled={isFavorite(profile.id)} />
                  </button>
                </div>
                <div className="profile-card-actions">
                  <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); handleMessage(profile.id); }}>Message</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProfileDetailModal
        profile={selectedProfile}
        onClose={() => setSelectedProfile(null)}
        actions={selectedProfile ? [
          { label: isFavorite(selectedProfile.id) ? 'Saved' : 'Save', variant: 'btn-outline', onClick: () => handleSave(null, selectedProfile.id) },
          { label: 'Block', variant: 'btn-ghost', onClick: () => handleBlock(selectedProfile) },
          { label: 'Message', variant: 'btn-primary', onClick: () => handleMessage(selectedProfile.id) },
        ] : []}
      />
    </div>
  );
};

export default Matches;
