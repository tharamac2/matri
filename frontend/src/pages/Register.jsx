import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import './Register.css';

const PLAN_IDS = { Gold: 2, Platinum: 3 };
const GENDER_IMPLIED = { Son: 'Male', Brother: 'Male', Daughter: 'Female', Sister: 'Female' };
const TOTAL_STEPS = 9;
const RASHIS = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'];
const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
  'Uttara Bhadrapada', 'Revati',
];

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    profileFor: '', gender: '',
    name: '', phone: '', password: '',
    height: '', city: '', education: '', religion: '', caste: '',
    bio: '', dob: '',
    maritalStatus: '', motherTongue: '',
    rashi: '', nakshatra: '', gothra: '', manglik: '', birthTime: '', birthPlace: '',
    fatherOccupation: '', motherOccupation: '', familyType: '', familyValues: '', familyStatus: '',
    diet: '', smoking: '', drinking: '', bodyType: '', complexion: '', bloodGroup: '',
  });
  const [otp, setOtp] = useState(['', '', '', '']);
  const [otpMessage, setOtpMessage] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState('');
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const fileInputRef = useRef(null);

  const set = (patch) => setFormData((prev) => ({ ...prev, ...patch }));

  // ---- Step 1: profile for + gender ----
  const selectProfileFor = (type) => {
    const impliedGender = GENDER_IMPLIED[type];
    set({ profileFor: type, gender: impliedGender || '' });
  };

  const selectGender = (gender) => set({ gender });

  const canAdvanceStep1 = formData.profileFor && formData.gender;

  // ---- Step 2: basic account ----
  const handleAccountSubmit = (e) => {
    e.preventDefault();
    setStep(3);
  };

  // ---- Step 3: OTP ----
  const handleOtpChange = (index, e) => {
    const value = e.target.value.replace(/\D/g, '');
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 3) otpRefs[index + 1].current.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs[index - 1].current.focus();
  };

  const handleOTPVerify = async () => {
    if (otp.join('').length !== 4) {
      setError('Please enter the complete 4-digit OTP.');
      return;
    }
    setError('');
    try {
      await register({
        name: formData.name,
        phone_number: formData.phone,
        password: formData.password,
        profile_for: formData.profileFor,
        gender: formData.gender.toLowerCase(),
      });
      setOtpVerified(true);
      setTimeout(() => setStep(4), 900);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    }
  };

  // ---- Step 4: core details ----
  const handleCoreDetailsSave = async () => {
    if (!formData.dob) {
      setError('Please enter your date of birth.');
      return;
    }
    const age = Math.floor((Date.now() - new Date(formData.dob).getTime()) / 3.15576e10);
    if (age < 18) {
      setError('You must be at least 18 years old to register.');
      return;
    }
    setError('');
    try {
      await api.put('/me', {
        dob: formData.dob,
        height_cm: formData.height ? Number(formData.height) : undefined,
        city: formData.city || undefined,
        education: formData.education || undefined,
        religion: formData.religion || undefined,
        caste: formData.caste || undefined,
      });
    } catch (err) {
      console.error('Failed to save profile details:', err);
    }
    setStep(5);
  };

  // ---- Step 5: community & horoscope (skippable) ----
  const handleCommunitySave = async () => {
    try {
      await api.put('/me', {
        marital_status: formData.maritalStatus || undefined,
        mother_tongue: formData.motherTongue || undefined,
        horoscope: (formData.rashi || formData.nakshatra || formData.gothra || formData.manglik || formData.birthTime || formData.birthPlace)
          ? {
              rashi: formData.rashi || undefined,
              nakshatra: formData.nakshatra || undefined,
              gothra: formData.gothra || undefined,
              manglik: formData.manglik || undefined,
              birth_time: formData.birthTime || undefined,
              birth_place: formData.birthPlace || undefined,
            }
          : undefined,
      });
    } catch (err) {
      console.error('Failed to save community/horoscope details:', err);
    }
    setStep(6);
  };

  // ---- Step 6: family & lifestyle (skippable) ----
  const handleFamilyLifestyleSave = async () => {
    try {
      await api.put('/me', {
        family_details: (formData.fatherOccupation || formData.motherOccupation || formData.familyType || formData.familyValues || formData.familyStatus)
          ? {
              father_occupation: formData.fatherOccupation || undefined,
              mother_occupation: formData.motherOccupation || undefined,
              family_type: formData.familyType || undefined,
              family_values: formData.familyValues || undefined,
              family_status: formData.familyStatus || undefined,
            }
          : undefined,
        lifestyle: (formData.diet || formData.smoking || formData.drinking)
          ? { diet: formData.diet || undefined, smoking: formData.smoking || undefined, drinking: formData.drinking || undefined }
          : undefined,
        physical_attributes: (formData.bodyType || formData.complexion || formData.bloodGroup)
          ? { body_type: formData.bodyType || undefined, complexion: formData.complexion || undefined, blood_group: formData.bloodGroup || undefined }
          : undefined,
      });
    } catch (err) {
      console.error('Failed to save family/lifestyle details:', err);
    }
    setStep(7);
  };

  // ---- Step 7: photo + bio ----
  const handlePhotoBioSave = async () => {
    try {
      await api.put('/me', { bio: formData.bio || undefined });
    } catch (err) {
      console.error('Failed to save bio:', err);
    }
    setStep(8);
  };

  // ---- Step 8: plan ----
  const handlePayment = (planLabel) => {
    const planId = PLAN_IDS[planLabel];
    if (planId) {
      api.post('/subscribe', { plan_id: planId }).catch((err) => console.error('Subscribe failed:', err));
    }
    setStep(9);
  };

  const handleFinish = () => navigate('/home');

  const progressPct = Math.min(100, Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100));

  return (
    <div className="reg-page">
      <div className="reg-card animate-fade-in">
        <div className="reg-header">
          <h1>Tharamac Matrimony</h1>
          {step < TOTAL_STEPS && (
            <div className="reg-progress">
              <div className="reg-progress-bar"><div style={{ width: `${progressPct}%` }} /></div>
              <span>Step {step} of {TOTAL_STEPS - 1}</span>
            </div>
          )}
        </div>

        {error && <p className="reg-error">{error}</p>}

        {step === 1 && (
          <div className="reg-step animate-fade-in">
            <h2>Who's this profile for?</h2>
            <div className="reg-options-grid">
              {['My-self', 'Son', 'Daughter', 'Brother', 'Sister', 'Friend', 'Relative'].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`reg-option${formData.profileFor === type ? ' selected' : ''}`}
                  onClick={() => selectProfileFor(type)}
                >
                  {type}
                </button>
              ))}
            </div>

            {formData.profileFor && !GENDER_IMPLIED[formData.profileFor] && (
              <>
                <p className="reg-subtitle" style={{ marginTop: 22 }}>Gender</p>
                <div className="reg-options-grid reg-options-grid-2">
                  {['Male', 'Female'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`reg-option${formData.gender === g ? ' selected' : ''}`}
                      onClick={() => selectGender(g)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </>
            )}

            <button className="btn btn-primary reg-cta" disabled={!canAdvanceStep1} onClick={() => setStep(2)}>
              Continue
            </button>

            <p className="reg-footer-text">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>
        )}

        {step === 2 && (
          <form className="reg-step animate-fade-in" onSubmit={handleAccountSubmit}>
            <h2>Create your account</h2>
            <label className="field-label">Full name</label>
            <input
              type="text" className="input" placeholder="Enter your name" required
              pattern="^[A-Za-z\s]{3,}$" title="At least 3 letters"
              value={formData.name} onChange={(e) => set({ name: e.target.value })}
            />
            <label className="field-label" style={{ marginTop: 14 }}>Mobile number</label>
            <input
              type="text" className="input" placeholder="10-digit mobile number" required
              maxLength="10" pattern="\d{10}"
              value={formData.phone} onChange={(e) => set({ phone: e.target.value.replace(/\D/g, '') })}
            />
            <label className="field-label" style={{ marginTop: 14 }}>Password</label>
            <input
              type="password" className="input" placeholder="At least 6 characters" required minLength="6"
              value={formData.password} onChange={(e) => set({ password: e.target.value })}
            />
            <button type="submit" className="btn btn-primary reg-cta">Continue</button>
            <button type="button" className="reg-back" onClick={() => setStep(1)}>Back</button>
          </form>
        )}

        {step === 3 && (
          <div className="reg-step animate-fade-in">
            {otpVerified ? (
              <div className="reg-otp-success">
                <div className="reg-otp-check">✓</div>
                <h2>Number verified</h2>
                <p className="reg-subtitle">Setting up your profile…</p>
              </div>
            ) : (
              <>
                <h2>Verify your number</h2>
                <p className="reg-subtitle">Enter the OTP sent to your mobile</p>
                <div className="reg-otp-inputs">
                  {otp.map((digit, index) => (
                    <input
                      key={index} ref={otpRefs[index]} type="text" maxLength="1"
                      className="reg-otp-box" value={digit}
                      onChange={(e) => handleOtpChange(index, e)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    />
                  ))}
                </div>
                <button className="btn btn-primary reg-cta" onClick={handleOTPVerify}>Verify</button>
                <p className="reg-footer-text">
                  Didn't get a code?{' '}
                  <button type="button" className="reg-link-btn" onClick={() => setOtpMessage('A new OTP has been sent.')}>
                    Resend OTP
                  </button>
                </p>
                {otpMessage && <p className="reg-subtitle">{otpMessage}</p>}
                <button type="button" className="reg-back" onClick={() => setStep(2)}>Back</button>
              </>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="reg-step animate-fade-in">
            <h2>Tell us about you</h2>
            <p className="reg-subtitle">This helps us find better matches</p>
            <div className="reg-grid-2">
              <div>
                <label className="field-label">Date of birth</label>
                <input
                  type="date" className="input"
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  value={formData.dob} onChange={(e) => set({ dob: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Height (cm)</label>
                <input type="number" className="input" placeholder="e.g. 170" min="120" max="220" value={formData.height} onChange={(e) => set({ height: e.target.value })} />
              </div>
              <div>
                <label className="field-label">City</label>
                <input type="text" className="input" placeholder="e.g. Chennai" value={formData.city} onChange={(e) => set({ city: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Education</label>
                <input type="text" className="input" placeholder="e.g. B.Tech" value={formData.education} onChange={(e) => set({ education: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Religion</label>
                <select className="select" value={formData.religion} onChange={(e) => set({ religion: e.target.value })}>
                  <option value="">Select religion</option>
                  {['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Other'].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Caste</label>
                <input type="text" className="input" placeholder="e.g. Iyer" value={formData.caste} onChange={(e) => set({ caste: e.target.value })} />
              </div>
            </div>
            <button className="btn btn-primary reg-cta" onClick={handleCoreDetailsSave}>Continue</button>
          </div>
        )}

        {step === 5 && (
          <div className="reg-step animate-fade-in">
            <div className="reg-plans-header">
              <h2>Community &amp; horoscope</h2>
              <button type="button" className="reg-link-btn" onClick={() => setStep(6)}>Skip for now</button>
            </div>
            <p className="reg-subtitle">Optional — helps with community and Kundli matching</p>
            <div className="reg-grid-2">
              <div>
                <label className="field-label">Marital status</label>
                <select className="select" value={formData.maritalStatus} onChange={(e) => set({ maritalStatus: e.target.value })}>
                  <option value="">Select</option>
                  {['never_married', 'divorced', 'widowed', 'awaiting_divorce'].map((v) => (
                    <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Mother tongue</label>
                <input type="text" className="input" placeholder="e.g. Tamil" value={formData.motherTongue} onChange={(e) => set({ motherTongue: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Rashi (moon sign)</label>
                <select className="select" value={formData.rashi} onChange={(e) => set({ rashi: e.target.value })}>
                  <option value="">Select rashi</option>
                  {RASHIS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Nakshatra</label>
                <select className="select" value={formData.nakshatra} onChange={(e) => set({ nakshatra: e.target.value })}>
                  <option value="">Select nakshatra</option>
                  {NAKSHATRAS.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Gothra</label>
                <input type="text" className="input" placeholder="e.g. Bharadwaj" value={formData.gothra} onChange={(e) => set({ gothra: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Manglik</label>
                <select className="select" value={formData.manglik} onChange={(e) => set({ manglik: e.target.value })}>
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Not sure">Not sure</option>
                </select>
              </div>
              <div>
                <label className="field-label">Birth time</label>
                <input type="time" className="input" value={formData.birthTime} onChange={(e) => set({ birthTime: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Birth place</label>
                <input type="text" className="input" placeholder="e.g. Chennai" value={formData.birthPlace} onChange={(e) => set({ birthPlace: e.target.value })} />
              </div>
            </div>
            <button className="btn btn-primary reg-cta" onClick={handleCommunitySave}>Continue</button>
          </div>
        )}

        {step === 6 && (
          <div className="reg-step animate-fade-in">
            <div className="reg-plans-header">
              <h2>Family &amp; lifestyle</h2>
              <button type="button" className="reg-link-btn" onClick={() => setStep(7)}>Skip for now</button>
            </div>
            <p className="reg-subtitle">Optional — gives prospects a fuller picture of your background</p>
            <div className="reg-grid-2">
              <div>
                <label className="field-label">Father's occupation</label>
                <input type="text" className="input" value={formData.fatherOccupation} onChange={(e) => set({ fatherOccupation: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Mother's occupation</label>
                <input type="text" className="input" value={formData.motherOccupation} onChange={(e) => set({ motherOccupation: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Family type</label>
                <select className="select" value={formData.familyType} onChange={(e) => set({ familyType: e.target.value })}>
                  <option value="">Select</option>
                  {['Nuclear', 'Joint'].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Family values</label>
                <select className="select" value={formData.familyValues} onChange={(e) => set({ familyValues: e.target.value })}>
                  <option value="">Select</option>
                  {['Traditional', 'Moderate', 'Liberal'].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Family status</label>
                <select className="select" value={formData.familyStatus} onChange={(e) => set({ familyStatus: e.target.value })}>
                  <option value="">Select</option>
                  {['Middle Class', 'Upper Middle Class', 'Affluent'].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Diet</label>
                <select className="select" value={formData.diet} onChange={(e) => set({ diet: e.target.value })}>
                  <option value="">Select</option>
                  {['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan'].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Smoking</label>
                <select className="select" value={formData.smoking} onChange={(e) => set({ smoking: e.target.value })}>
                  <option value="">Select</option>
                  {['No', 'Occasionally', 'Yes'].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Drinking</label>
                <select className="select" value={formData.drinking} onChange={(e) => set({ drinking: e.target.value })}>
                  <option value="">Select</option>
                  {['No', 'Occasionally', 'Yes'].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Body type</label>
                <select className="select" value={formData.bodyType} onChange={(e) => set({ bodyType: e.target.value })}>
                  <option value="">Select</option>
                  {['Slim', 'Average', 'Athletic', 'Heavy'].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Complexion</label>
                <select className="select" value={formData.complexion} onChange={(e) => set({ complexion: e.target.value })}>
                  <option value="">Select</option>
                  {['Fair', 'Wheatish', 'Dark'].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Blood group</label>
                <select className="select" value={formData.bloodGroup} onChange={(e) => set({ bloodGroup: e.target.value })}>
                  <option value="">Select</option>
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-primary reg-cta" onClick={handleFamilyLifestyleSave}>Continue</button>
          </div>
        )}

        {step === 7 && (
          <div className="reg-step animate-fade-in">
            <h2>Add a photo &amp; bio</h2>
            <p className="reg-subtitle">Profiles with photos get 10x more responses</p>
            <div className="reg-photo-row">
              <div className="reg-photo-preview">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" />
                ) : (
                  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
                  </svg>
                )}
              </div>
              <div>
                <input
                  type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }}
                  onChange={(e) => { if (e.target.files?.[0]) setPhotoPreview(URL.createObjectURL(e.target.files[0])); }}
                />
                <button type="button" className="btn btn-outline btn-sm" onClick={() => fileInputRef.current.click()}>
                  Upload photo
                </button>
              </div>
            </div>
            <label className="field-label" style={{ marginTop: 18 }}>About you</label>
            <textarea
              className="textarea" placeholder="A short line about yourself…"
              value={formData.bio} onChange={(e) => set({ bio: e.target.value })}
            />
            <button className="btn btn-primary reg-cta" onClick={handlePhotoBioSave}>Continue</button>
          </div>
        )}

        {step === 8 && (
          <div className="reg-step animate-fade-in">
            <div className="reg-plans-header">
              <h2>Choose your plan</h2>
              <button type="button" className="reg-link-btn" onClick={() => setStep(9)}>Skip for now</button>
            </div>
            <div className="reg-plans">
              <div className="reg-plan-card">
                <p className="reg-plan-name">Gold</p>
                <p className="reg-plan-price">₹999<span>/3 months</span></p>
                <ul>
                  <li>View 40 phone numbers</li>
                  <li>Unlimited messages</li>
                  <li>Unlimited horoscope views</li>
                </ul>
                <button className="btn btn-outline reg-cta" onClick={() => handlePayment('Gold')}>Choose Gold</button>
              </div>
              <div className="reg-plan-card featured">
                <span className="badge badge-gold" style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>Most popular</span>
                <p className="reg-plan-name">Platinum</p>
                <p className="reg-plan-price">₹2,499<span>/6 months</span></p>
                <ul>
                  <li>Unlimited phone numbers</li>
                  <li>Unlimited messages</li>
                  <li>Verified profiles with photo</li>
                </ul>
                <button className="btn btn-primary reg-cta" onClick={() => handlePayment('Platinum')}>Choose Platinum</button>
              </div>
            </div>
          </div>
        )}

        {step === 9 && (
          <div className="reg-step reg-success animate-fade-in">
            <div className="reg-success-icon">🎉</div>
            <h2>Welcome to Tharamac Matrimony!</h2>
            <p className="reg-subtitle">Your profile is ready. Start exploring matches picked just for you.</p>
            <button className="btn btn-primary reg-cta" onClick={handleFinish}>Go to my dashboard</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
