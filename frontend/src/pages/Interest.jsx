import React, { useState, useEffect } from 'react';
import ProfileDetailModal from '../components/ProfileDetailModal.jsx';
import { presenceLabel, isOnline } from '../utils/presence.js';
import api from '../services/api.js';
import { toCardDisplay } from '../utils/profile.js';
import './Interest.css';

const Interest = () => {
  const [tab, setTab] = useState('received');
  const [toastMessage, setToastMessage] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  function loadAll() {
    setLoading(true);
    Promise.all([api.get('/interests/received'), api.get('/interests/sent')])
      .then(([receivedRes, sentRes]) => {
        setReceived(receivedRes.data.map((match) => ({ matchId: match.id, message: match.message, status: match.status, ...toCardDisplay(match.member) })));
        setSent(sentRes.data.map((match) => ({ matchId: match.id, message: match.message, status: match.status, ...toCardDisplay(match.member) })));
      })
      .catch((err) => console.error('Failed to load interests:', err))
      .finally(() => setLoading(false));
  }

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 1800);
  };

  const handleDecline = async (matchId) => {
    try {
      await api.put(`/interests/${matchId}`, { action: 'reject' });
      showToast('Interest declined.');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not decline interest.');
    }
    setReceived((prev) => prev.filter((p) => p.matchId !== matchId));
    setSelectedProfile(null);
  };

  const handleAccept = async (matchId) => {
    try {
      await api.put(`/interests/${matchId}`, { action: 'accept' });
      showToast('You are now a match!');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not accept interest.');
    }
    setReceived((prev) => prev.filter((p) => p.matchId !== matchId));
    setSelectedProfile(null);
  };

  const handleWithdraw = async (matchId) => {
    try {
      await api.put(`/interests/${matchId}`, { action: 'withdraw' });
      showToast('Interest withdrawn.');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not withdraw interest.');
    }
    setSent((prev) => prev.filter((p) => p.matchId !== matchId));
    setSelectedProfile(null);
  };

  const list = tab === 'received' ? received : sent;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Interests</h1>
        <p>Track who's interested in you and who you've reached out to</p>
      </div>

      <div className="interest-tabs">
        <button className={`interest-tab${tab === 'received' ? ' active' : ''}`} onClick={() => setTab('received')}>
          Received {received.length > 0 && <span className="interest-tab-count">{received.length}</span>}
        </button>
        <button className={`interest-tab${tab === 'sent' ? ' active' : ''}`} onClick={() => setTab('sent')}>
          Sent {sent.length > 0 && <span className="interest-tab-count">{sent.length}</span>}
        </button>
      </div>

      {loading ? (
        <div className="profile-card-grid">
          {[1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 110 }} />)}
        </div>
      ) : list.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          </div>
          <h3>{tab === 'received' ? 'No interests yet' : 'You haven\'t sent any interests'}</h3>
          <p>
            {tab === 'received'
              ? 'When someone sends you an interest, it\'ll show up here for you to accept or decline.'
              : 'Interests you send from Search or Home will show up here.'}
          </p>
        </div>
      ) : (
        <div className="profile-card-grid">
          {list.map((profile) => (
            <div
              key={profile.matchId}
              className="card card-hover profile-card animate-fade-in"
              onClick={() => { setSelectedProfile(profile); api.get(`/profiles/${profile.id}`).catch(() => {}); }}
              style={{ cursor: 'pointer' }}
            >
              <img className="profile-card-img" src={profile.image} alt={profile.name} />
              <div className="profile-card-body">
                <div>
                  <p className="profile-card-name">{profile.name}, {profile.age}</p>
                  <p className="profile-card-sub">{profile.location} · {profile.education}</p>
                  <p className={`profile-card-presence${isOnline(profile.lastActive) ? ' online' : ''}`}>{presenceLabel(profile.lastActive)}</p>
                  {profile.message && <p className="interest-message-preview">"{profile.message}"</p>}
                  {tab === 'sent' && <p className="interest-status-tag">{profile.status}</p>}
                </div>
                <div className="profile-card-actions">
                  {tab === 'received' ? (
                    <>
                      <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); handleDecline(profile.matchId); }}>Decline</button>
                      <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); handleAccept(profile.matchId); }}>Accept</button>
                    </>
                  ) : (
                    profile.status === 'pending' && (
                      <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); handleWithdraw(profile.matchId); }}>Withdraw</button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProfileDetailModal
        profile={selectedProfile}
        interestMessage={selectedProfile?.message}
        onClose={() => setSelectedProfile(null)}
        actions={selectedProfile ? (
          tab === 'received'
            ? [
                { label: 'Decline', variant: 'btn-outline', onClick: () => handleDecline(selectedProfile.matchId) },
                { label: 'Accept', variant: 'btn-primary', onClick: () => handleAccept(selectedProfile.matchId) },
              ]
            : selectedProfile.status === 'pending'
              ? [{ label: 'Withdraw', variant: 'btn-outline', onClick: () => handleWithdraw(selectedProfile.matchId) }]
              : []
        ) : []}
      />

      {toastMessage && <div className="toast">{toastMessage}</div>}
    </div>
  );
};

export default Interest;
