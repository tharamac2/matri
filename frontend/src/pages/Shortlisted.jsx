import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { toCardDisplay } from '../utils/profile.js';
import { presenceLabel, isOnline } from '../utils/presence.js';
import { getFavorites, toggleFavorite } from '../utils/favorites.js';

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" stroke="currentColor" strokeWidth="2">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

const MAX_COMPARE = 3;

const Shortlisted = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [, forceRender] = useState(0);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    const ids = [...getFavorites()];
    if (ids.length === 0) {
      setProfiles([]);
      setLoading(false);
      return;
    }
    Promise.all(ids.map((id) => api.get(`/profiles/${id}`).then((r) => r.data).catch(() => null)))
      .then((results) => setProfiles(results.filter(Boolean).map(toCardDisplay)))
      .finally(() => setLoading(false));
  }

  const handleRemove = (id) => {
    toggleFavorite(id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    forceRender((n) => n + 1);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_COMPARE) {
        next.add(id);
      }
      return next;
    });
  };

  const handleCompare = () => {
    navigate(`/compare?ids=${[...selectedIds].join(',')}`);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Shortlisted profiles</h1>
        <p>Profiles you've saved to review later</p>
      </div>

      {loading ? (
        <div className="profile-card-grid">
          {[1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 110 }} />)}
        </div>
      ) : profiles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <HeartIcon />
          </div>
          <h3>No shortlisted profiles yet</h3>
          <p>Tap the heart icon on any profile to save it here.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/search')}>Browse profiles</button>
        </div>
      ) : (
        <>
          <p className="reg-subtitle" style={{ textAlign: 'left', marginBottom: 14 }}>
            Select 2-3 profiles to compare side by side.
          </p>
          <div className="profile-card-grid">
            {profiles.map((profile) => (
              <div key={profile.id} className={`card card-hover profile-card animate-fade-in${selectedIds.has(profile.id) ? ' compare-selected' : ''}`}>
                <label className="compare-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(profile.id)}
                    onChange={() => toggleSelect(profile.id)}
                    disabled={!selectedIds.has(profile.id) && selectedIds.size >= MAX_COMPARE}
                  />
                  Compare
                </label>
                <img className="profile-card-img" src={profile.image} alt={profile.name} />
                <div className="profile-card-body">
                  <div className="profile-card-top">
                    <div>
                      <p className="profile-card-name">{profile.name}, {profile.age}</p>
                      <p className="profile-card-sub">{profile.location} · {profile.education}</p>
                      <p className={`profile-card-presence${isOnline(profile.lastActive) ? ' online' : ''}`}>{presenceLabel(profile.lastActive)}</p>
                    </div>
                    <button className="icon-btn active" onClick={() => handleRemove(profile.id)} aria-label="Remove from shortlist">
                      <HeartIcon />
                    </button>
                  </div>
                  <div className="profile-card-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => navigate(`/message?with=${profile.id}`)}>Message</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedIds.size >= 2 && (
            <div className="compare-cta-bar">
              <span>{selectedIds.size} selected</span>
              <button className="btn btn-primary" onClick={handleCompare}>Compare profiles</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Shortlisted;
