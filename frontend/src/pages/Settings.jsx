import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import './Register.css';
import './Search.css';
import './Settings.css';

const NOTIF_TOGGLES = [
  { key: 'notify_new_interest', label: 'New interest received' },
  { key: 'notify_match_accepted', label: 'Someone accepts your interest' },
  { key: 'notify_new_message', label: 'New messages' },
];

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photos, setPhotos] = useState([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [planExpiry, setPlanExpiry] = useState('21 Jun 2026');

  const [topEditMode, setTopEditMode] = useState(false);
  const [topData, setTopData] = useState({ name: '', qualification: '', location: '' });

  const [bottomEditMode, setBottomEditMode] = useState(false);
  const [bottomData, setBottomData] = useState({ dob: '', height: '', mailId: '', hobbies: '' });

  const [prefsEditMode, setPrefsEditMode] = useState(false);
  const [partnerPrefs, setPartnerPrefs] = useState({ age_min: '', age_max: '', height_min: '', height_max: '', religion: '', city: '' });

  const [notifSettings, setNotifSettings] = useState({});

  const [pwForm, setPwForm] = useState({ current: '', next: '' });
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  const [familyEditMode, setFamilyEditMode] = useState(false);
  const [familyData, setFamilyData] = useState({
    father_occupation: '', mother_occupation: '', family_type: '', family_values: '', family_status: '',
    diet: '', smoking: '', drinking: '', body_type: '', complexion: '', blood_group: '',
  });

  const [horoscopeEditMode, setHoroscopeEditMode] = useState(false);
  const [horoscopeData, setHoroscopeData] = useState({
    rashi: '', nakshatra: '', gothra: '', manglik: '', birth_time: '', birth_place: '',
  });

  const [idDocUrl, setIdDocUrl] = useState('');
  const [idVerificationStatus, setIdVerificationStatus] = useState('');
  const [idDocMessage, setIdDocMessage] = useState('');

  useEffect(() => {
    api
      .get('/me')
      .then(({ data }) => {
        setTopData({
          name: data.name || '',
          qualification: data.education || '',
          location: data.city || '',
        });
        setBottomData({
          dob: data.dob || '',
          height: data.height_cm || '',
          mailId: data.email || '',
          hobbies: data.bio || '',
        });
        setPhotoUrl(data.photo_url || '');
        setPhotos(data.photos || []);
        setPartnerPrefs({
          age_min: data.partner_prefs?.age_min ?? '',
          age_max: data.partner_prefs?.age_max ?? '',
          height_min: data.partner_prefs?.height_min ?? '',
          height_max: data.partner_prefs?.height_max ?? '',
          religion: data.partner_prefs?.religion ?? '',
          city: data.partner_prefs?.city ?? '',
        });
        setNotifSettings(data.settings || {});
        setFamilyData({
          father_occupation: data.family_details?.father_occupation ?? '',
          mother_occupation: data.family_details?.mother_occupation ?? '',
          family_type: data.family_details?.family_type ?? '',
          family_values: data.family_details?.family_values ?? '',
          family_status: data.family_details?.family_status ?? '',
          diet: data.lifestyle?.diet ?? '',
          smoking: data.lifestyle?.smoking ?? '',
          drinking: data.lifestyle?.drinking ?? '',
          body_type: data.physical_attributes?.body_type ?? '',
          complexion: data.physical_attributes?.complexion ?? '',
          blood_group: data.physical_attributes?.blood_group ?? '',
        });
        setHoroscopeData({
          rashi: data.horoscope?.rashi ?? '',
          nakshatra: data.horoscope?.nakshatra ?? '',
          gothra: data.horoscope?.gothra ?? '',
          manglik: data.horoscope?.manglik ?? '',
          birth_time: data.horoscope?.birth_time ?? '',
          birth_place: data.horoscope?.birth_place ?? '',
        });
        setIdDocUrl(data.id_document_url || '');
        setIdVerificationStatus(data.id_verification_status || '');
      })
      .catch((err) => console.error('Failed to load profile:', err))
      .finally(() => setLoading(false));
  }, []);

  const completionPercentage = [topData.name, topData.qualification, topData.location, bottomData.dob, bottomData.height, bottomData.hobbies, photoUrl]
    .filter(Boolean).length * 100 / 7 | 0;

  const handleTopChange = (e) => setTopData({ ...topData, [e.target.name]: e.target.value });
  const handleBottomChange = (e) => setBottomData({ ...bottomData, [e.target.name]: e.target.value });
  const handlePrefsChange = (e) => setPartnerPrefs({ ...partnerPrefs, [e.target.name]: e.target.value });

  const handleTopEditToggle = async () => {
    if (topEditMode) {
      try {
        await api.put('/me', { name: topData.name, education: topData.qualification, city: topData.location });
      } catch (err) {
        console.error('Failed to save profile:', err);
      }
    }
    setTopEditMode(!topEditMode);
  };

  const handleBottomEditToggle = async () => {
    if (bottomEditMode) {
      try {
        await api.put('/me', {
          dob: bottomData.dob || null,
          height_cm: bottomData.height ? Number(bottomData.height) : undefined,
          bio: bottomData.hobbies,
        });
      } catch (err) {
        console.error('Failed to save profile:', err);
      }
    }
    setBottomEditMode(!bottomEditMode);
  };

  const handlePrefsEditToggle = async () => {
    if (prefsEditMode) {
      try {
        const clean = {};
        Object.entries(partnerPrefs).forEach(([k, v]) => {
          if (v === '' || v == null) return;
          clean[k] = ['age_min', 'age_max', 'height_min', 'height_max'].includes(k) ? Number(v) : v;
        });
        await api.put('/me', { partner_prefs: clean });
      } catch (err) {
        console.error('Failed to save partner preferences:', err);
      }
    }
    setPrefsEditMode(!prefsEditMode);
  };

  const handleFamilyChange = (e) => setFamilyData({ ...familyData, [e.target.name]: e.target.value });
  const handleHoroscopeChange = (e) => setHoroscopeData({ ...horoscopeData, [e.target.name]: e.target.value });

  const handleFamilyEditToggle = async () => {
    if (familyEditMode) {
      try {
        await api.put('/me', {
          family_details: {
            father_occupation: familyData.father_occupation || undefined,
            mother_occupation: familyData.mother_occupation || undefined,
            family_type: familyData.family_type || undefined,
            family_values: familyData.family_values || undefined,
            family_status: familyData.family_status || undefined,
          },
          lifestyle: {
            diet: familyData.diet || undefined,
            smoking: familyData.smoking || undefined,
            drinking: familyData.drinking || undefined,
          },
          physical_attributes: {
            body_type: familyData.body_type || undefined,
            complexion: familyData.complexion || undefined,
            blood_group: familyData.blood_group || undefined,
          },
        });
      } catch (err) {
        console.error('Failed to save family & lifestyle details:', err);
      }
    }
    setFamilyEditMode(!familyEditMode);
  };

  const handleHoroscopeEditToggle = async () => {
    if (horoscopeEditMode) {
      try {
        await api.put('/me', {
          horoscope: {
            rashi: horoscopeData.rashi || undefined,
            nakshatra: horoscopeData.nakshatra || undefined,
            gothra: horoscopeData.gothra || undefined,
            manglik: horoscopeData.manglik || undefined,
            birth_time: horoscopeData.birth_time || undefined,
            birth_place: horoscopeData.birth_place || undefined,
          },
        });
      } catch (err) {
        console.error('Failed to save horoscope details:', err);
      }
    }
    setHoroscopeEditMode(!horoscopeEditMode);
  };

  const handleSubmitIdDocument = async (e) => {
    e.preventDefault();
    setIdDocMessage('');
    try {
      const { data } = await api.put('/me', { id_document_url: idDocUrl });
      setIdVerificationStatus(data.id_verification_status || 'pending');
      setIdDocMessage('Document submitted for verification.');
    } catch (err) {
      setIdDocMessage(err.response?.data?.detail || 'Could not submit document.');
    }
  };

  const handleChangeImage = async () => {
    const url = window.prompt('Paste a photo URL for your profile:', photoUrl);
    if (url === null) return;
    try {
      await api.put('/me', { photo_url: url });
      setPhotoUrl(url);
    } catch (err) {
      console.error('Failed to update photo:', err);
    }
  };

  const handleAddPhoto = async () => {
    if (!newPhotoUrl.trim()) return;
    const updated = [...photos, newPhotoUrl.trim()];
    try {
      await api.put('/me', { photos: updated });
      setPhotos(updated);
      setNewPhotoUrl('');
    } catch (err) {
      console.error('Failed to add photo:', err);
    }
  };

  const handleRemovePhoto = async (url) => {
    const updated = photos.filter((p) => p !== url);
    try {
      await api.put('/me', { photos: updated });
      setPhotos(updated);
    } catch (err) {
      console.error('Failed to remove photo:', err);
    }
  };

  const handleToggleNotif = async (key) => {
    const updated = { ...notifSettings, [key]: !notifSettings[key] };
    setNotifSettings(updated);
    try {
      await api.put('/me', { settings: updated });
    } catch (err) {
      console.error('Failed to save notification preference:', err);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMessage('');
    setPwError('');
    try {
      await api.post('/auth/change-password', { current_password: pwForm.current, new_password: pwForm.next });
      setPwMessage('Password updated successfully.');
      setPwForm({ current: '', next: '' });
    } catch (err) {
      setPwError(err.response?.data?.detail || 'Could not change password.');
    }
  };

  const handleRenew = async () => {
    try {
      const { data } = await api.post('/subscribe', { plan_id: 2 });
      const label = new Date(data.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      setPlanExpiry(label);
      alert(`Plan renewed! New expiry: ${label}`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not renew plan.');
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="skeleton" style={{ height: 400, borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your profile and membership</p>
      </div>

      <div className="settings-layout">
        {/* Left column */}
        <div className="settings-left">
          <div className="card settings-profile-card">
            <img className="settings-avatar" src={photoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300'} alt="Profile" />
            <button className="btn btn-outline btn-sm" onClick={handleChangeImage}>Change photo</button>

            <div className="settings-completion">
              <div className="settings-completion-row">
                <span>Profile completeness</span>
                <strong>{completionPercentage}%</strong>
              </div>
              <div className="reg-progress-bar"><div style={{ width: `${completionPercentage}%` }} /></div>
            </div>
          </div>

          <div className="card settings-section">
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Photo gallery</h3>
            {photos.length > 0 && (
              <div className="settings-gallery">
                {photos.map((url) => (
                  <div key={url} className="settings-gallery-item">
                    <img src={url} alt="Gallery" />
                    <button onClick={() => handleRemovePhoto(url)} aria-label="Remove photo">✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className="settings-gallery-add">
              <input className="input" placeholder="Paste a photo URL" value={newPhotoUrl} onChange={(e) => setNewPhotoUrl(e.target.value)} />
              <button className="btn btn-outline btn-sm" onClick={handleAddPhoto}>Add</button>
            </div>
          </div>

          <div className="card settings-plan-card">
            <div className="settings-plan-top">
              <span className="badge badge-gold">Current plan</span>
            </div>
            <p className="settings-plan-expiry">Renews / expires<br /><strong>{planExpiry}</strong></p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleRenew}>Renew plan</button>
          </div>
        </div>

        {/* Right column */}
        <div className="settings-right">
          <div className="card settings-section">
            <div className="settings-section-header">
              <h3>Basic information</h3>
              <button className="btn btn-outline btn-sm" onClick={handleTopEditToggle}>{topEditMode ? 'Save' : 'Edit'}</button>
            </div>
            <div className="settings-grid">
              <div>
                <label className="field-label">Name</label>
                {topEditMode ? <input className="input" name="name" value={topData.name} onChange={handleTopChange} /> : <p>{topData.name || '—'}</p>}
              </div>
              <div>
                <label className="field-label">Education</label>
                {topEditMode ? <input className="input" name="qualification" value={topData.qualification} onChange={handleTopChange} /> : <p>{topData.qualification || '—'}</p>}
              </div>
              <div>
                <label className="field-label">City</label>
                {topEditMode ? <input className="input" name="location" value={topData.location} onChange={handleTopChange} /> : <p>{topData.location || '—'}</p>}
              </div>
            </div>
          </div>

          <div className="card settings-section">
            <div className="settings-section-header">
              <h3>About &amp; details</h3>
              <button className="btn btn-outline btn-sm" onClick={handleBottomEditToggle}>{bottomEditMode ? 'Save' : 'Edit'}</button>
            </div>
            <div className="settings-grid">
              <div>
                <label className="field-label">Date of birth</label>
                {bottomEditMode ? <input type="date" className="input" name="dob" value={bottomData.dob} onChange={handleBottomChange} /> : <p>{bottomData.dob || '—'}</p>}
              </div>
              <div>
                <label className="field-label">Height (cm)</label>
                {bottomEditMode ? <input type="number" className="input" name="height" value={bottomData.height} onChange={handleBottomChange} /> : <p>{bottomData.height ? `${bottomData.height} cm` : '—'}</p>}
              </div>
              <div>
                <label className="field-label">Email</label>
                <p>{bottomData.mailId || '—'}</p>
              </div>
            </div>
            <label className="field-label" style={{ marginTop: 16 }}>About you</label>
            {bottomEditMode ? (
              <textarea className="textarea" name="hobbies" value={bottomData.hobbies} onChange={handleBottomChange} />
            ) : (
              <p>{bottomData.hobbies || '—'}</p>
            )}
          </div>

          <div className="card settings-section">
            <div className="settings-section-header">
              <h3>Partner preferences</h3>
              <button className="btn btn-outline btn-sm" onClick={handlePrefsEditToggle}>{prefsEditMode ? 'Save' : 'Edit'}</button>
            </div>
            <p className="reg-subtitle" style={{ textAlign: 'left', marginBottom: 14 }}>Used to compute your compatibility score with each profile.</p>
            <div className="settings-grid">
              <div>
                <label className="field-label">Age range</label>
                {prefsEditMode ? (
                  <div className="search-filter-range">
                    <input type="number" className="input" name="age_min" placeholder="Min" value={partnerPrefs.age_min} onChange={handlePrefsChange} />
                    <input type="number" className="input" name="age_max" placeholder="Max" value={partnerPrefs.age_max} onChange={handlePrefsChange} />
                  </div>
                ) : (
                  <p>{partnerPrefs.age_min || partnerPrefs.age_max ? `${partnerPrefs.age_min || '—'} to ${partnerPrefs.age_max || '—'}` : '—'}</p>
                )}
              </div>
              <div>
                <label className="field-label">Height range (cm)</label>
                {prefsEditMode ? (
                  <div className="search-filter-range">
                    <input type="number" className="input" name="height_min" placeholder="Min" value={partnerPrefs.height_min} onChange={handlePrefsChange} />
                    <input type="number" className="input" name="height_max" placeholder="Max" value={partnerPrefs.height_max} onChange={handlePrefsChange} />
                  </div>
                ) : (
                  <p>{partnerPrefs.height_min || partnerPrefs.height_max ? `${partnerPrefs.height_min || '—'} to ${partnerPrefs.height_max || '—'}` : '—'}</p>
                )}
              </div>
              <div>
                <label className="field-label">Religion</label>
                {prefsEditMode ? (
                  <select className="select" name="religion" value={partnerPrefs.religion} onChange={handlePrefsChange}>
                    <option value="">Any</option>
                    {['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Other'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                ) : (
                  <p>{partnerPrefs.religion || '—'}</p>
                )}
              </div>
              <div>
                <label className="field-label">City</label>
                {prefsEditMode ? <input className="input" name="city" value={partnerPrefs.city} onChange={handlePrefsChange} /> : <p>{partnerPrefs.city || '—'}</p>}
              </div>
            </div>
          </div>

          <div className="card settings-section">
            <div className="settings-section-header">
              <h3>Family &amp; lifestyle</h3>
              <button className="btn btn-outline btn-sm" onClick={handleFamilyEditToggle}>{familyEditMode ? 'Save' : 'Edit'}</button>
            </div>
            <div className="settings-grid">
              <div>
                <label className="field-label">Father's occupation</label>
                {familyEditMode ? <input className="input" name="father_occupation" value={familyData.father_occupation} onChange={handleFamilyChange} /> : <p>{familyData.father_occupation || '—'}</p>}
              </div>
              <div>
                <label className="field-label">Mother's occupation</label>
                {familyEditMode ? <input className="input" name="mother_occupation" value={familyData.mother_occupation} onChange={handleFamilyChange} /> : <p>{familyData.mother_occupation || '—'}</p>}
              </div>
              <div>
                <label className="field-label">Family type</label>
                {familyEditMode ? (
                  <select className="select" name="family_type" value={familyData.family_type} onChange={handleFamilyChange}>
                    <option value="">Select</option>
                    {['Nuclear', 'Joint'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                ) : <p>{familyData.family_type || '—'}</p>}
              </div>
              <div>
                <label className="field-label">Family values</label>
                {familyEditMode ? (
                  <select className="select" name="family_values" value={familyData.family_values} onChange={handleFamilyChange}>
                    <option value="">Select</option>
                    {['Traditional', 'Moderate', 'Liberal'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                ) : <p>{familyData.family_values || '—'}</p>}
              </div>
              <div>
                <label className="field-label">Family status</label>
                {familyEditMode ? (
                  <select className="select" name="family_status" value={familyData.family_status} onChange={handleFamilyChange}>
                    <option value="">Select</option>
                    {['Middle Class', 'Upper Middle Class', 'Affluent'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                ) : <p>{familyData.family_status || '—'}</p>}
              </div>
              <div>
                <label className="field-label">Diet</label>
                {familyEditMode ? (
                  <select className="select" name="diet" value={familyData.diet} onChange={handleFamilyChange}>
                    <option value="">Select</option>
                    {['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                ) : <p>{familyData.diet || '—'}</p>}
              </div>
              <div>
                <label className="field-label">Smoking</label>
                {familyEditMode ? (
                  <select className="select" name="smoking" value={familyData.smoking} onChange={handleFamilyChange}>
                    <option value="">Select</option>
                    {['No', 'Occasionally', 'Yes'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                ) : <p>{familyData.smoking || '—'}</p>}
              </div>
              <div>
                <label className="field-label">Drinking</label>
                {familyEditMode ? (
                  <select className="select" name="drinking" value={familyData.drinking} onChange={handleFamilyChange}>
                    <option value="">Select</option>
                    {['No', 'Occasionally', 'Yes'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                ) : <p>{familyData.drinking || '—'}</p>}
              </div>
              <div>
                <label className="field-label">Body type</label>
                {familyEditMode ? (
                  <select className="select" name="body_type" value={familyData.body_type} onChange={handleFamilyChange}>
                    <option value="">Select</option>
                    {['Slim', 'Average', 'Athletic', 'Heavy'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                ) : <p>{familyData.body_type || '—'}</p>}
              </div>
              <div>
                <label className="field-label">Complexion</label>
                {familyEditMode ? (
                  <select className="select" name="complexion" value={familyData.complexion} onChange={handleFamilyChange}>
                    <option value="">Select</option>
                    {['Fair', 'Wheatish', 'Dark'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                ) : <p>{familyData.complexion || '—'}</p>}
              </div>
              <div>
                <label className="field-label">Blood group</label>
                {familyEditMode ? (
                  <select className="select" name="blood_group" value={familyData.blood_group} onChange={handleFamilyChange}>
                    <option value="">Select</option>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                ) : <p>{familyData.blood_group || '—'}</p>}
              </div>
            </div>
          </div>

          <div className="card settings-section">
            <div className="settings-section-header">
              <h3>Horoscope</h3>
              <button className="btn btn-outline btn-sm" onClick={handleHoroscopeEditToggle}>{horoscopeEditMode ? 'Save' : 'Edit'}</button>
            </div>
            <p className="reg-subtitle" style={{ textAlign: 'left', marginBottom: 14 }}>Used for the simplified Guna Milan compatibility indicator.</p>
            <div className="settings-grid">
              <div>
                <label className="field-label">Rashi (moon sign)</label>
                {horoscopeEditMode ? (
                  <select className="select" name="rashi" value={horoscopeData.rashi} onChange={handleHoroscopeChange}>
                    <option value="">Select rashi</option>
                    {['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                ) : <p>{horoscopeData.rashi || '—'}</p>}
              </div>
              <div>
                <label className="field-label">Nakshatra</label>
                {horoscopeEditMode ? (
                  <select className="select" name="nakshatra" value={horoscopeData.nakshatra} onChange={handleHoroscopeChange}>
                    <option value="">Select nakshatra</option>
                    {[
                      'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
                      'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
                      'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
                      'Uttara Bhadrapada', 'Revati',
                    ].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                ) : <p>{horoscopeData.nakshatra || '—'}</p>}
              </div>
              <div>
                <label className="field-label">Gothra</label>
                {horoscopeEditMode ? <input className="input" name="gothra" value={horoscopeData.gothra} onChange={handleHoroscopeChange} /> : <p>{horoscopeData.gothra || '—'}</p>}
              </div>
              <div>
                <label className="field-label">Manglik</label>
                {horoscopeEditMode ? (
                  <select className="select" name="manglik" value={horoscopeData.manglik} onChange={handleHoroscopeChange}>
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Not sure">Not sure</option>
                  </select>
                ) : <p>{horoscopeData.manglik || '—'}</p>}
              </div>
              <div>
                <label className="field-label">Birth time</label>
                {horoscopeEditMode ? <input type="time" className="input" name="birth_time" value={horoscopeData.birth_time} onChange={handleHoroscopeChange} /> : <p>{horoscopeData.birth_time || '—'}</p>}
              </div>
              <div>
                <label className="field-label">Birth place</label>
                {horoscopeEditMode ? <input className="input" name="birth_place" value={horoscopeData.birth_place} onChange={handleHoroscopeChange} /> : <p>{horoscopeData.birth_place || '—'}</p>}
              </div>
            </div>
          </div>

          <div className="card settings-section">
            <div className="settings-section-header">
              <h3>ID verification</h3>
              {idVerificationStatus && (
                <span className={`badge ${idVerificationStatus === 'approved' ? 'badge-gold' : ''}`}>
                  {idVerificationStatus === 'approved' ? 'Verified' : idVerificationStatus === 'rejected' ? 'Rejected' : 'Pending review'}
                </span>
              )}
            </div>
            <p className="reg-subtitle" style={{ textAlign: 'left', marginBottom: 14 }}>Submit a government ID document to earn a verified badge on your profile.</p>
            <form onSubmit={handleSubmitIdDocument}>
              <label className="field-label">Document URL</label>
              <input className="input" placeholder="Paste a document URL" value={idDocUrl} onChange={(e) => setIdDocUrl(e.target.value)} />
              {idDocMessage && <p className="settings-pw-success">{idDocMessage}</p>}
              <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: 14 }}>Submit for verification</button>
            </form>
          </div>

          <div className="card settings-section">
            <h3 style={{ fontSize: 15, marginBottom: 14 }}>Notification preferences</h3>
            {NOTIF_TOGGLES.map((t) => (
              <div key={t.key} className="settings-toggle-row">
                <span>{t.label}</span>
                <button
                  type="button"
                  className={`settings-toggle${notifSettings[t.key] ? ' on' : ''}`}
                  onClick={() => handleToggleNotif(t.key)}
                  aria-pressed={!!notifSettings[t.key]}
                >
                  <span className="settings-toggle-dot" />
                </button>
              </div>
            ))}
          </div>

          <div className="card settings-section">
            <h3 style={{ fontSize: 15, marginBottom: 14 }}>Change password</h3>
            <form onSubmit={handleChangePassword}>
              <div className="settings-grid">
                <div>
                  <label className="field-label">Current password</label>
                  <input type="password" className="input" value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} required />
                </div>
                <div>
                  <label className="field-label">New password</label>
                  <input type="password" className="input" minLength="6" value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} required />
                </div>
              </div>
              {pwError && <p className="reg-error">{pwError}</p>}
              {pwMessage && <p className="settings-pw-success">{pwMessage}</p>}
              <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: 14 }}>Update password</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
