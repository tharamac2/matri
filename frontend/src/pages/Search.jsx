import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { toCardDisplay } from '../utils/profile.js';
import { computeCompatibility } from '../utils/compatibility.js';
import { computeGunaScore } from '../utils/gunaScore.js';
import { presenceLabel, isOnline } from '../utils/presence.js';
import { isFavorite, toggleFavorite } from '../utils/favorites.js';
import CompatBadge from '../components/CompatBadge.jsx';
import GunaBadge from '../components/GunaBadge.jsx';
import ProfileDetailModal from '../components/ProfileDetailModal.jsx';
import './Search.css';

const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

const EMPTY_FILTERS = {
  ageMin: '', ageMax: '', heightMin: '', heightMax: '', religion: '',
  maritalStatus: '', motherTongue: '', profession: '', incomeMin: '', incomeMax: '', memberId: '',
};

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [rawProfiles, setRawProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hiddenIds, setHiddenIds] = useState(new Set());
  const [sentIds, setSentIds] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [partnerPrefs, setPartnerPrefs] = useState(null);
  const [myHoroscope, setMyHoroscope] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    api.get('/me').then(({ data }) => { setPartnerPrefs(data.partner_prefs); setMyHoroscope(data.horoscope); }).catch(() => {});
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [filters]);

  function loadProfiles() {
    setLoading(true);
    const params = {};
    if (filters.ageMin) params.age_min = filters.ageMin;
    if (filters.ageMax) params.age_max = filters.ageMax;
    if (filters.heightMin) params.height_min = filters.heightMin;
    if (filters.heightMax) params.height_max = filters.heightMax;
    if (filters.religion) params.religion = filters.religion;
    if (filters.maritalStatus) params.marital_status = filters.maritalStatus;
    if (filters.motherTongue) params.mother_tongue = filters.motherTongue;
    if (filters.profession) params.profession = filters.profession;
    if (filters.incomeMin) params.income_min = filters.incomeMin;
    if (filters.incomeMax) params.income_max = filters.incomeMax;
    if (filters.memberId) params.member_id = filters.memberId;

    api
      .get('/profiles', { params })
      .then(({ data }) => setRawProfiles(data))
      .catch((err) => console.error('Failed to load profiles:', err))
      .finally(() => setLoading(false));
  }

  const filteredProfiles = rawProfiles.filter((profile) => {
    if (hiddenIds.has(profile.id)) return false;
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      profile.name.toLowerCase().includes(q) ||
      (profile.city || '').toLowerCase().includes(q) ||
      (profile.education || '').toLowerCase().includes(q)
    );
  });

  const handleHide = (id) => setHiddenIds((prev) => new Set(prev).add(id));

  const handleSendInterest = async (id) => {
    const message = window.prompt('Add a short personal message (optional):', '');
    if (message === null) return;
    try {
      await api.post('/interests', { receiver_id: id, message: message.trim() || undefined });
      setSentIds((prev) => new Set(prev).add(id));
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not send interest.');
    }
  };

  const handleSave = (id) => {
    toggleFavorite(id);
    forceRender((n) => n + 1);
  };

  const openDetail = (profile) => {
    setSelectedProfile(profile);
    // Fetching the single-profile endpoint also records a "profile view" server-side.
    api.get(`/profiles/${profile.id}`).catch(() => {});
  };

  const applyFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters(EMPTY_FILTERS);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Search</h1>
        <p>Find someone by name, city, or education</p>
      </div>

      <div className="search-bar-row">
        <input
          type="text"
          className="input search-input"
          placeholder="Search by name, city, or education…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="btn btn-outline" onClick={() => setShowFilters((v) => !v)}>
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>
      </div>

      {showFilters && (
        <div className="card search-filters animate-fade-in">
          <div>
            <label className="field-label">Age range</label>
            <div className="search-filter-range">
              <input type="number" className="input" placeholder="Min" min="18" value={filters.ageMin} onChange={(e) => applyFilter('ageMin', e.target.value)} />
              <input type="number" className="input" placeholder="Max" min="18" value={filters.ageMax} onChange={(e) => applyFilter('ageMax', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="field-label">Height range (cm)</label>
            <div className="search-filter-range">
              <input type="number" className="input" placeholder="Min" min="120" value={filters.heightMin} onChange={(e) => applyFilter('heightMin', e.target.value)} />
              <input type="number" className="input" placeholder="Max" min="120" value={filters.heightMax} onChange={(e) => applyFilter('heightMax', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="field-label">Religion</label>
            <select className="select" value={filters.religion} onChange={(e) => applyFilter('religion', e.target.value)}>
              <option value="">Any</option>
              {['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Other'].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Marital status</label>
            <select className="select" value={filters.maritalStatus} onChange={(e) => applyFilter('maritalStatus', e.target.value)}>
              <option value="">Any</option>
              {['never_married', 'divorced', 'widowed', 'awaiting_divorce'].map((v) => (
                <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Mother tongue</label>
            <input type="text" className="input" placeholder="e.g. Tamil" value={filters.motherTongue} onChange={(e) => applyFilter('motherTongue', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Profession</label>
            <input type="text" className="input" placeholder="e.g. Engineer" value={filters.profession} onChange={(e) => applyFilter('profession', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Income range (LPA)</label>
            <div className="search-filter-range">
              <input type="number" className="input" placeholder="Min" min="0" value={filters.incomeMin} onChange={(e) => applyFilter('incomeMin', e.target.value)} />
              <input type="number" className="input" placeholder="Max" min="0" value={filters.incomeMax} onChange={(e) => applyFilter('incomeMax', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="field-label">Search by member ID</label>
            <input type="number" className="input" placeholder="e.g. 12" value={filters.memberId} onChange={(e) => applyFilter('memberId', e.target.value)} />
          </div>
          <button className="btn btn-ghost btn-sm search-filter-clear" onClick={clearFilters}>Clear filters</button>
        </div>
      )}

      {loading ? (
        <div className="profile-card-grid" style={{ marginTop: 20 }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 110 }} />)}
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          </div>
          <h3>No profiles found</h3>
          <p>Try a different name, city, education keyword, or loosen your filters.</p>
        </div>
      ) : (
        <div className="profile-card-grid" style={{ marginTop: 20 }}>
          {filteredProfiles.map((raw) => {
            const profile = toCardDisplay(raw);
            const score = computeCompatibility(raw, partnerPrefs);
            const guna = computeGunaScore(myHoroscope, profile.horoscope);
            return (
              <div key={profile.id} className="card card-hover profile-card animate-fade-in" onClick={() => openDetail(profile)} style={{ cursor: 'pointer' }}>
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
                      onClick={(e) => { e.stopPropagation(); handleSave(profile.id); }}
                      aria-label="Save"
                    >
                      <HeartIcon filled={isFavorite(profile.id)} />
                    </button>
                  </div>

                  {score != null && <CompatBadge score={score} />}
                  {guna && <GunaBadge guna={guna} />}

                  <div className="profile-card-actions">
                    <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); handleHide(profile.id); }}>Hide</button>
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={sentIds.has(profile.id)}
                      onClick={(e) => { e.stopPropagation(); handleSendInterest(profile.id); }}
                    >
                      {sentIds.has(profile.id) ? 'Interest Sent' : 'Send Interest'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProfileDetailModal
        profile={selectedProfile}
        onClose={() => setSelectedProfile(null)}
        actions={selectedProfile ? [
          { label: isFavorite(selectedProfile.id) ? 'Saved' : 'Save', variant: 'btn-outline', onClick: () => handleSave(selectedProfile.id) },
          {
            label: sentIds.has(selectedProfile.id) ? 'Interest Sent' : 'Send Interest',
            variant: 'btn-primary',
            onClick: () => handleSendInterest(selectedProfile.id),
          },
        ] : []}
      />
    </div>
  );
};

export default Search;
