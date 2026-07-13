import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { toCardDisplay } from '../utils/profile.js';
import { presenceLabel, isOnline } from '../utils/presence.js';
import './Compare.css';

const ROWS = [
  { label: 'Height', get: (p) => p.height },
  { label: 'Location', get: (p) => p.location },
  { label: 'Education', get: (p) => p.education },
  { label: 'Profession', get: (p) => p.profession },
  { label: 'Income', get: (p) => p.salary },
  { label: 'Religion', get: (p) => p.religious },
  { label: 'Caste', get: (p) => p.caste },
  { label: 'Marital status', get: (p) => p.maritalStatus },
  { label: 'Mother tongue', get: (p) => p.motherTongue },
  { label: "Father's occupation", get: (p) => p.familyDetails?.father_occupation || '-' },
  { label: 'Family type', get: (p) => p.familyDetails?.family_type || '-' },
  { label: 'Family values', get: (p) => p.familyDetails?.family_values || '-' },
  { label: 'Diet', get: (p) => p.lifestyle?.diet || '-' },
  { label: 'Smoking', get: (p) => p.lifestyle?.smoking || '-' },
  { label: 'Drinking', get: (p) => p.lifestyle?.drinking || '-' },
  { label: 'Body type', get: (p) => p.physicalAttributes?.body_type || '-' },
  { label: 'Complexion', get: (p) => p.physicalAttributes?.complexion || '-' },
  { label: 'Rashi', get: (p) => p.horoscope?.rashi || '-' },
  { label: 'Nakshatra', get: (p) => p.horoscope?.nakshatra || '-' },
  { label: 'Manglik', get: (p) => p.horoscope?.manglik || '-' },
];

const Compare = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = (searchParams.get('ids') || '').split(',').filter(Boolean);
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    Promise.all(ids.map((id) => api.get(`/profiles/${id}`).then((r) => r.data).catch(() => null)))
      .then((results) => setProfiles(results.filter(Boolean).map(toCardDisplay)))
      .finally(() => setLoading(false));
  }, [searchParams]);

  if (loading) {
    return (
      <div className="page-content">
        <div className="skeleton" style={{ height: 400, borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  if (profiles.length < 2) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <h3>Nothing to compare</h3>
          <p>Select at least 2 profiles from your shortlist to compare them.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/shortlisted')}>Back to shortlist</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Compare profiles</h1>
        <p>Side-by-side comparison of your shortlisted profiles</p>
      </div>

      <div className="compare-table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th></th>
              {profiles.map((p) => (
                <th key={p.id}>
                  <img src={p.image} alt={p.name} className="compare-photo" />
                  <div className="compare-name">{p.name}, {p.age}</div>
                  <div className={`profile-card-presence${isOnline(p.lastActive) ? ' online' : ''}`}>{presenceLabel(p.lastActive)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label}>
                <th>{row.label}</th>
                {profiles.map((p) => <td key={p.id}>{row.get(p) || '-'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Compare;
