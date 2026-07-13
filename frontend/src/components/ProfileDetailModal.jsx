import React from 'react';
import { presenceLabel, isOnline } from '../utils/presence.js';
import GunaBadge from './GunaBadge.jsx';
import './ProfileDetailModal.css';

export default function ProfileDetailModal({ profile, actions, onClose, guna, interestMessage }) {
  if (!profile) return null;

  return (
    <div className="pdm-backdrop" onClick={onClose}>
      <div className="pdm-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <button className="pdm-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="pdm-image">
          <img src={profile.image} alt={profile.name} />
        </div>

        {profile.photos?.length > 0 && (
          <div className="pdm-gallery">
            {profile.photos.map((url) => (
              <img key={url} src={url} alt={profile.name} />
            ))}
          </div>
        )}

        <div className="pdm-body">
          <h2>{profile.name}, {profile.age}</h2>
          <p className={`pdm-presence${isOnline(profile.lastActive) ? ' online' : ''}`}>
            {presenceLabel(profile.lastActive)}
          </p>
          {guna && <GunaBadge guna={guna} />}
          <div className="info-grid" style={{ marginTop: 16 }}>
            <div><span>Height</span><strong>{profile.height}</strong></div>
            <div><span>Lives in</span><strong>{profile.location}</strong></div>
            <div><span>Education</span><strong>{profile.education}</strong></div>
            <div><span>Profession</span><strong>{profile.profession}</strong></div>
            <div><span>Religion</span><strong>{profile.religious}</strong></div>
            <div><span>Caste</span><strong>{profile.caste}</strong></div>
            <div><span>Marital status</span><strong>{profile.maritalStatus}</strong></div>
            <div><span>Mother tongue</span><strong>{profile.motherTongue}</strong></div>
          </div>
          {profile.bio !== '-' && <p className="info-bio">"{profile.bio}"</p>}
          {interestMessage && <p className="pdm-interest-message">"{interestMessage}"</p>}

          {actions?.length > 0 && (
            <div className="pdm-actions">
              {actions.map((a) => (
                <button key={a.label} className={`btn ${a.variant || 'btn-outline'}`} onClick={a.onClick}>
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
