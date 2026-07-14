import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import api from '../services/api.js';
import { toCardDisplay } from '../utils/profile.js';
import { computeCompatibility } from '../utils/compatibility.js';
import { computeGunaScore } from '../utils/gunaScore.js';
import { presenceLabel, isOnline } from '../utils/presence.js';
import { isFavorite, toggleFavorite } from '../utils/favorites.js';
import CompatBadge from '../components/CompatBadge.jsx';
import GunaBadge from '../components/GunaBadge.jsx';
import BlurText from '../components/BlurText.jsx';
import CountUp from '../components/CountUp.jsx';
import './Home.css';

const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M12 2l2.1 6.4L20.5 10l-6.4 2.1L12 18.5 9.9 12.1 3.5 10l6.4-1.6L12 2z" />
  </svg>
);

const spotlightVariants = {
  enter: { opacity: 0, x: 60, scale: 0.97 },
  center: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

const infoContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } },
};

const infoItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

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
  const [heartBurst, setHeartBurst] = useState(false);
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

  const onlineCount = profiles.filter((p) => isOnline(p.lastActive)).length;

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
    if (isFavorite(currentProfile.id)) {
      setHeartBurst(true);
      setTimeout(() => setHeartBurst(false), 600);
    }
    forceRender((n) => n + 1);
  };

  const infoRows = currentProfile
    ? [
        ['Height', currentProfile.height],
        ['Lives in', currentProfile.location],
        ['Education', currentProfile.education],
        ['Profession', currentProfile.profession],
        ['Religion', currentProfile.religious],
        ['Caste', currentProfile.caste],
        ['Marital status', currentProfile.maritalStatus],
        ['Mother tongue', currentProfile.motherTongue],
      ]
    : [];

  return (
    <div className="page-content home-page">
      {/* ---- Hero header ---- */}
      <motion.div
        className="home-hero"
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="home-hero-glow home-hero-glow-1" />
        <div className="home-hero-glow home-hero-glow-2" />
        <div className="home-hero-inner">
          <span className="home-hero-eyebrow">
            <SparkleIcon /> {greeting()}
          </span>
          <BlurText
            text="Today's recommendations"
            delay={60}
            animateBy="words"
            direction="top"
            className="home-hero-title"
          />
          <motion.p
            className="home-hero-sub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Handpicked profiles based on your preferences
          </motion.p>

          {!loading && profiles.length > 0 && (
            <motion.div
              className="home-hero-stats"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <div className="hero-stat">
                <strong><CountUp to={profiles.length} duration={1.2} /></strong>
                <span>Matches today</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <strong><CountUp to={onlineCount} duration={1.4} /></strong>
                <span>Online now</span>
              </div>
              {!isEndOfDay && (
                <>
                  <div className="hero-stat-divider" />
                  <div className="hero-stat">
                    <strong>{currentIndex + 1}<em>/{profiles.length}</em></strong>
                    <span>Viewing</span>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div className="home-skeleton">
          <div className="skeleton" style={{ height: 320, borderRadius: 'var(--radius-lg)' }} />
        </div>
      ) : isEndOfDay ? (
        <motion.div
          className="card eod-card"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="empty-state-icon eod-icon"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
          </motion.div>
          <h2>You're all caught up!</h2>
          <p className="reg-subtitle">Your next set of matches unlocks in</p>
          <div className="eod-timer">{formatTime(timeLeft)}</div>
          <div className="eod-actions">
            <button className="btn btn-outline" onClick={() => setCurrentIndex(0)}>Browse again</button>
          </div>
        </motion.div>
      ) : (
        <>
          {/* ---- Story-style thumbnail rail ---- */}
          <motion.div
            className="thumb-row"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
          >
            {profiles.map((prof, idx) => (
              <motion.button
                key={prof.id}
                className={`thumb${idx === currentIndex ? ' active' : ''}${idx < currentIndex ? ' seen' : ''}`}
                onClick={() => setCurrentIndex(idx)}
                variants={{ hidden: { opacity: 0, scale: 0.6 }, show: { opacity: 1, scale: 1 } }}
                whileHover={{ scale: 1.1, y: -3 }}
                whileTap={{ scale: 0.92 }}
              >
                <span className="thumb-ring" />
                <img src={prof.image} alt={prof.name} />
                {isOnline(prof.lastActive) && <span className="thumb-online" />}
              </motion.button>
            ))}
          </motion.div>

          {/* ---- Spotlight card, re-mounts with a slide-in on every profile change ---- */}
            <motion.div
              key={currentProfile.id}
              className="profile-spotlight card"
              variants={spotlightVariants}
              initial="enter"
              animate="center"
            >
              <div className="spotlight-image">
                <motion.img
                  src={currentProfile.image}
                  alt={currentProfile.name}
                  initial={{ scale: 1.12 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 6, ease: 'easeOut' }}
                />
                <div className="spotlight-image-overlay" />
                <div className="spotlight-image-caption">
                  <h2>{currentProfile.name}, {currentProfile.age}</h2>
                  <span className={isOnline(currentProfile.lastActive) ? 'online-text' : ''}>
                    {presenceLabel(currentProfile.lastActive)}
                  </span>
                </div>
                <motion.button
                  className={`spotlight-save${isFavorite(currentProfile.id) ? ' active' : ''}`}
                  onClick={handleSave}
                  aria-label="Save profile"
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.85 }}
                >
                  <HeartIcon filled={isFavorite(currentProfile.id)} />
                  {heartBurst && (
                    <motion.span
                      className="heart-burst"
                      initial={{ scale: 0.4, opacity: 0.9 }}
                      animate={{ scale: 2.4, opacity: 0 }}
                      transition={{ duration: 0.55, ease: 'easeOut' }}
                    />
                  )}
                </motion.button>
              </div>

              <div className="spotlight-body">
                <motion.div
                  className="spotlight-tags"
                  initial="hidden"
                  animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } } }}
                >
                  {[
                    currentScore != null && <CompatBadge key="compat" score={currentScore} />,
                    currentGuna && <GunaBadge key="guna" guna={currentGuna} />,
                    currentProfile.education !== '-' && <span key="edu" className="badge badge-muted">{currentProfile.education}</span>,
                    currentProfile.location !== '-' && <span key="loc" className="badge badge-muted">{currentProfile.location}</span>,
                    currentProfile.religious !== '-' && <span key="rel" className="badge badge-muted">{currentProfile.religious}</span>,
                  ]
                    .filter(Boolean)
                    .map((node, i) => (
                      <motion.span
                        key={i}
                        variants={{ hidden: { opacity: 0, y: 10, scale: 0.85 }, show: { opacity: 1, y: 0, scale: 1 } }}
                        style={{ display: 'inline-flex' }}
                      >
                        {node}
                      </motion.span>
                    ))}
                </motion.div>

                {currentProfile.bio !== '-' && (
                  <motion.p
                    className="spotlight-bio"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.5 }}
                  >
                    "{currentProfile.bio}"
                  </motion.p>
                )}

                {showComposer ? (
                    <motion.div
                      key="composer"
                      className="interest-composer"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      <textarea
                        className="textarea"
                        placeholder="Add a short personal message (optional)…"
                        value={interestMessage}
                        onChange={(e) => setInterestMessage(e.target.value)}
                        autoFocus
                      />
                      <div className="spotlight-actions">
                        <button className="btn btn-outline" onClick={() => setShowComposer(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSendInterest}>Send</button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="actions"
                      className="spotlight-actions"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25, duration: 0.35 }}
                    >
                      <motion.button className="btn btn-ghost" onClick={handleNotInterested} whileTap={{ scale: 0.95 }}>Pass</motion.button>
                      <motion.button className="btn btn-outline" onClick={handleNextProfile} whileTap={{ scale: 0.95 }}>Skip</motion.button>
                      <motion.button
                        className="btn btn-primary btn-shine"
                        onClick={() => setShowComposer(true)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <HeartIcon filled /> Send Interest
                      </motion.button>
                    </motion.div>
                  )}
              </div>
            </motion.div>

          {/* ---- Personal information ---- */}
            <motion.div
              key={`info-${currentProfile.id}`}
              className="card info-card"
              variants={infoContainer}
              initial="hidden"
              animate="show"
            >
              <h3 className="info-card-title">Personal information</h3>
              <div className="info-grid">
                {infoRows.map(([label, value]) => (
                  <motion.div key={label} variants={infoItem}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </motion.div>
                ))}
              </div>
            </motion.div>
        </>
      )}

      {toastMessage && <div className="toast">{toastMessage}</div>}
    </div>
  );
};

export default Home;
