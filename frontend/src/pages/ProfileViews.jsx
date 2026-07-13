import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { toCardDisplay } from '../utils/profile.js';

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const ProfileViews = () => {
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/profile-views')
      .then(({ data }) => setViews(data.map((v) => ({ ...toCardDisplay(v.member), viewedAt: v.viewed_at, viewId: v.id }))))
      .catch((err) => console.error('Failed to load profile views:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Who viewed you</h1>
        <p>People who've recently checked out your profile</p>
      </div>

      {loading ? (
        <div className="profile-card-grid">
          {[1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 110 }} />)}
        </div>
      ) : views.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
          </div>
          <h3>No profile views yet</h3>
          <p>When someone views your profile, they'll show up here.</p>
        </div>
      ) : (
        <div className="profile-card-grid">
          {views.map((v) => (
            <div key={v.viewId} className="card profile-card animate-fade-in">
              <img className="profile-card-img" src={v.image} alt={v.name} />
              <div className="profile-card-body">
                <div>
                  <p className="profile-card-name">{v.name}, {v.age}</p>
                  <p className="profile-card-sub">{v.location} · {timeAgo(v.viewedAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileViews;
