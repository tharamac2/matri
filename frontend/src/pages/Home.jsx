import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { toCardDisplay } from '../utils/profile.js';
import { computeCompatibility } from '../utils/compatibility.js';
import { computeGunaScore } from '../utils/gunaScore.js';
import { presenceLabel, isOnline } from '../utils/presence.js';
import { isFavorite, toggleFavorite } from '../utils/favorites.js';
import CompatBadge from '../components/CompatBadge.jsx';
import GunaBadge from '../components/GunaBadge.jsx';
import './Home.css';

const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

const Home = () => {
  const [rawProfiles, setRawProfiles] = useState([]);
  const [partnerPrefs, setPartnerPrefs] = useState(null);
  const [myHoroscope, setMyHoroscope] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(10 * 3600 + 22 * 60 + 21);
  const [showComposer, setShowComposer] = useState(false);
  const [interestMessage, setInterestMessage] = useState('');
  const [, forceRender] = useState(0);

  useEffect(() => {
    api
      .get('/profiles')
      .then(({ data }) => setRawProfiles(data))
      .catch((err) => console.error('Failed to load profiles:', err))
      .finally(() => setLoading(false));
    api.get('/me').then(({ data }) => { setPartnerPrefs(data.partner_prefs); setMyHoroscope(data.horoscope); }).catch(() => {});
  }, []);

  const profiles = rawProfiles.map(toCardDisplay);
  const isEndOfDay = !loading && currentIndex >= profiles.length;
  const currentProfile = isEndOfDay ? null : profiles[currentIndex];
  const currentScore = loading || isEndOfDay ? null : computeCompatibility(rawProfiles[currentIndex], partnerPrefs);
  const currentGuna = loading || isEndOfDay ? null : computeGunaScore(myHoroscope, currentProfile?.horoscope);

  useEffect(() => {
    if (isEndOfDay) {
      const timer = setInterval(() => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
      return () => clearInterval(timer);
    }
  }, [isEndOfDay]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleNextProfile = () => {
    setCurrentIndex((prev) => prev + 1);
    setShowComposer(false);
    setInterestMessage('');
  };

  const handleSendInterest = async () => {
    if (!currentProfile) return;
    try {
      await api.post('/interests', { receiver_id: currentProfile.id, message: interestMessage.trim() || undefined });
      setToastMessage('Your interest has been sent.');
      setTimeout(() => { setToastMessage(''); handleNextProfile(); }, 1800);
    } catch (err) {
      setToastMessage(err.response?.data?.detail || 'Could not send interest.');
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const handleNotInterested = () => {
    setToastMessage('Profile skipped.');
    setTimeout(() => { setToastMessage(''); handleNextProfile(); }, 1200);
  };

  const handleSave = () => {
    if (!currentProfile) return;
    toggleFavorite(currentProfile.id);
    forceRender((n) => n + 1);
  };

  return (
    <div className="page-content home-page">
      <div className="page-header">
        <h1>Today's recommendations</h1>
        <p>Handpicked profiles based on your preferences</p>
      </div>

      {loading ? (
        <div className="home-skeleton">
          <div className="skeleton" style={{ height: 320, borderRadius: 'var(--radius-lg)' }} />
        </div>
      ) : isEndOfDay ? (
        <div className="card eod-card animate-fade-in">
          <div className="empty-state-icon" style={{ width: 64, height: 64, margin: '0 auto 18px' }}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
          </div>
          <h2>You're all caught up!</h2>
          <p className="reg-subtitle">Your next set of matches unlocks in</p>
          <div className="eod-timer">{formatTime(timeLeft)}</div>
          <div className="eod-actions">
            <button className="btn btn-outline" onClick={() => setCurrentIndex(0)}>Browse again</button>
          </div>
        </div>
      ) : (
        <>
          <div className="thumb-row animate-fade-in">
            {profiles.map((prof, idx) => (
              <button
                key={prof.id}
                className={`thumb${idx === currentIndex ? ' active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
              >
                <img src={prof.image} alt={prof.name} />
              </button>
            ))}
          </div>

          <div className="profile-spotlight card animate-fade-in">
            <div className="spotlight-image">
              <img src={currentProfile.image} alt={currentProfile.name} />
              <button
                className={`spotlight-save${isFavorite(currentProfile.id) ? ' active' : ''}`}
                onClick={handleSave}
                aria-label="Save profile"
              >
                <HeartIcon filled={isFavorite(currentProfile.id)} />
              </button>
            </div>

            <div className="spotlight-body">
              <div className="spotlight-heading">
                <h2>{currentProfile.name}, {currentProfile.age}</h2>
                <span className={`reg-subtitle${isOnline(currentProfile.lastActive) ? ' online-text' : ''}`} style={{ margin: 0, textAlign: 'left' }}>
                  {presenceLabel(currentProfile.lastActive)}
                </span>
              </div>

              <div className="spotlight-tags">
                {currentScore != null && <CompatBadge score={currentScore} />}
                {currentGuna && <GunaBadge guna={currentGuna} />}
                {currentProfile.education !== '-' && <span className="badge badge-muted">{currentProfile.education}</span>}
                {currentProfile.location !== '-' && <span className="badge badge-muted">{currentProfile.location}</span>}
                {currentProfile.religious !== '-' && <span className="badge badge-muted">{currentProfile.religious}</span>}
              </div>

              {showComposer ? (
                <div className="interest-composer">
                  <textarea
                    className="textarea"
                    placeholder="Add a short personal message (optional)…"
                    value={interestMessage}
                    onChange={(e) => setInterestMessage(e.target.value)}
                  />
                  <div className="spotlight-actions">
                    <button className="btn btn-outline" onClick={() => setShowComposer(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSendInterest}>Send</button>
                  </div>
                </div>
              ) : (
                <div className="spotlight-actions">
                  <button className="btn btn-ghost" onClick={handleNotInterested}>Pass</button>
                  <button className="btn btn-outline" onClick={handleNextProfile}>Skip</button>
                  <button className="btn btn-primary" onClick={() => setShowComposer(true)}>Send Interest</button>
                </div>
              )}
            </div>
          </div>

          <div className="card info-card animate-fade-in">
            <h3 className="info-card-title">Personal information</h3>
            <div className="info-grid">
              <div><span>Height</span><strong>{currentProfile.height}</strong></div>
              <div><span>Lives in</span><strong>{currentProfile.location}</strong></div>
              <div><span>Education</span><strong>{currentProfile.education}</strong></div>
              <div><span>Profession</span><strong>{currentProfile.profession}</strong></div>
              <div><span>Religion</span><strong>{currentProfile.religious}</strong></div>
              <div><span>Caste</span><strong>{currentProfile.caste}</strong></div>
              <div><span>Marital status</span><strong>{currentProfile.maritalStatus}</strong></div>
              <div><span>Mother tongue</span><strong>{currentProfile.motherTongue}</strong></div>
            </div>
            {currentProfile.bio !== '-' && <p className="info-bio">"{currentProfile.bio}"</p>}
          </div>
        </>
      )}

      {toastMessage && <div className="toast">{toastMessage}</div>}
    </div>
  );
};

export default Home;
