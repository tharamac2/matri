import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext.jsx';
import CountUp from '../components/CountUp.jsx';
import './Login.css';

/* ---- Media (Pexels stock, verified) ---- */
/* "Bride and groom doing a fire ritual" — pexels.com/video/15157547 */
const HERO_VIDEO = 'https://videos.pexels.com/video-files/15157547/15157547-hd_1920_1080_25fps.mp4';
const HERO_POSTER = 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=1600';

const img = (id, w = 700) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

const MARQUEE_PHOTOS = [1444442, 3872626, 2916819, 6357184, 1128782, 8819344, 7686364, 2959192];
const ABOUT_IMAGE_MAIN = img(1024993, 900);
const ABOUT_IMAGE_SMALL = img(2060240, 600);
const STORY_PHOTOS = { Arjun: img(3014856, 700), Karthik: img(12194487, 700) };

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Stories', href: '#stories' },
  { label: 'Membership', href: '#membership' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Journal', href: '#journal' },
  { label: 'Contact', href: '#contact' },
];

const HERO_STATS = [
  { to: 50000, suffix: '+', label: 'Verified members' },
  { to: 15000, suffix: '+', label: 'Happy couples' },
  { to: 100000, suffix: '+', label: 'Matches made' },
];

const FEATURES = [
  { title: 'Manually verified profiles', text: 'Every single profile is reviewed by our team before it goes live.' },
  { title: 'Intelligent matchmaking', text: 'Horoscope, preference and lifestyle signals combined into one compatibility score.' },
  { title: 'Privacy you control', text: 'Decide exactly who sees your photos, horoscope and contact details.' },
  { title: 'Human support, always', text: 'Real people on call at every step of your search — not bots.' },
];

const STEPS = [
  { title: 'Tell us your story', text: 'Create a profile with your details, family background and what you seek in a partner.' },
  { title: 'Meet your matches', text: 'Receive handpicked, compatible profiles every day — verified and relevant.' },
  { title: 'Express interest', text: 'Like someone? Send an interest with a personal note and see who reciprocates.' },
  { title: 'Begin forever', text: 'Chat securely once accepted, involve your families and take the next step.' },
];

const TESTIMONIALS = [
  {
    names: 'Arjun & Meera',
    place: 'Chennai · married 2024',
    quote: 'We matched on compatibility score alone and everything else simply fell into place. Six months later our families met, and the rest is history.',
    seed: 'Arjun',
  },
  {
    names: 'Karthik & Divya',
    place: 'Coimbatore · married 2025',
    quote: 'The verification gave our parents the confidence to trust the platform. It felt safe, personal and surprisingly quick.',
    seed: 'Karthik',
  },
];

const PREMIUM_FEATURES = [
  'Unlimited profile views', 'Priority visibility in search', 'Secure private messaging',
  'View verified contact details', 'Advanced horoscope filters', 'Dedicated relationship manager',
];

const ANNUAL_DISCOUNT = 30; // percent off vs. paying monthly

const PLANS = [
  {
    name: 'Starter',
    tagline: 'Begin your search',
    monthly: 0,
    features: ['Create a verified profile', '5 interests per month', 'Daily match recommendations', 'Basic search filters'],
    cta: 'Start free',
  },
  {
    name: 'Gold',
    tagline: 'Our most loved plan',
    monthly: 1499,
    featured: true,
    features: ['Unlimited interests & views', 'Secure private messaging', 'View verified contact details', 'Horoscope compatibility reports', 'Priority visibility in search'],
    cta: 'Choose Gold',
  },
  {
    name: 'Diamond',
    tagline: 'A matchmaker by your side',
    monthly: 2999,
    features: ['Everything in Gold', 'Dedicated relationship manager', 'Profile highlighting everywhere', 'Family-assisted matchmaking calls'],
    cta: 'Choose Diamond',
  },
];

const planPrice = (plan, billing) =>
  billing === 'annual' ? Math.round(plan.monthly * (1 - ANNUAL_DISCOUNT / 100)) : plan.monthly;

const formatINR = (n) => '₹' + n.toLocaleString('en-IN');

const JOURNAL_POSTS = [
  { id: 3872626, title: '10 questions to ask before you say yes', tag: 'Relationships', excerpt: 'Conversation starters that go beyond the biodata.' },
  { id: 8819344, title: 'A family’s guide to the modern match', tag: 'Family', excerpt: 'Involving your parents while keeping the decision yours.' },
  { id: 2916819, title: 'Meeting safely, online and offline', tag: 'Safety', excerpt: 'Our verification team’s advice for a secure first meeting.' },
];

const CONTACT_INFO = [
  { label: 'Email', value: 'support@tharamacmatrimony.com' },
  { label: 'Phone', value: '+91 98765 43210' },
  { label: 'Office', value: 'Chennai, Tamil Nadu, India' },
];

const FOOTER_COLUMNS = [
  { title: 'Company', links: [['About', '#about'], ['Membership', '#membership'], ['Stories', '#stories'], ['Contact', '#contact']] },
  { title: 'Support', links: [['How it works', '#how-it-works'], ['FAQs', '#contact'], ['Privacy policy', '#contact'], ['Terms', '#contact']] },
  { title: 'Explore', links: [['Journal', '#journal'], ['Testimonials', '#stories'], ['Pricing', '#pricing']] },
];

/* Entrance-only scroll reveal */
const Reveal = ({ children, className, delay = 0, y = 36, ...rest }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    {...rest}
  >
    {children}
  </motion.div>
);

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const rise = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const SectionHead = ({ kicker, title, light }) => (
  <Reveal className={`lx-section-head${light ? ' light' : ''}`} y={26}>
    <span className="lx-kicker">{kicker}</span>
    <h2 className="lx-section-title">{title}</h2>
  </Reveal>
);

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);
  const [billing, setBilling] = useState('annual');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const autoplayRef = useRef(null);

  useEffect(() => {
    autoplayRef.current = setInterval(() => {
      setStoryIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 7000);
    return () => clearInterval(autoplayRef.current);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(phone, password);
      navigate('/home');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'Login failed. Please check your phone number and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterMessage("Thanks! We'll keep you posted.");
    setNewsletterEmail('');
    setTimeout(() => setNewsletterMessage(''), 3000);
  };

  const story = TESTIMONIALS[storyIndex];

  return (
    <div className="lx-page">
      {/* ================= Header ================= */}
      <motion.header
        className={`lx-header${scrolled ? ' scrolled' : ''}`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="lx-header-inner">
          <a href="#home" className="lx-brand">
            <span className="lx-brand-mark">T</span>
            <span className="lx-brand-name">Tharamac<em>Matrimony</em></span>
          </a>
          <nav className="lx-nav">
            {NAV_LINKS.map((item) => (
              <a key={item.label} href={item.href}>{item.label}</a>
            ))}
          </nav>
          <div className="lx-header-actions">
            <Link to="/register" className="lx-btn lx-btn-gold lx-btn-sm">Register Free</Link>
          </div>
        </div>
      </motion.header>

      {/* ================= Hero — video background ================= */}
      <section className="lx-hero" id="home">
        <div className="lx-hero-media" aria-hidden="true">
          <video autoPlay muted loop playsInline poster={HERO_POSTER}>
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
          <span className="lx-hero-overlay" />
          <span className="lx-hero-vignette" />
        </div>

        <div className="lx-hero-inner">
          <motion.div className="lx-hero-copy" variants={stagger} initial="hidden" animate="show">
            <motion.span className="lx-kicker light" variants={rise}>
              ❖ &nbsp;India's trusted matchmaking house
            </motion.span>
            <motion.h1 variants={rise}>
              Where hearts
              <em> find home.</em>
            </motion.h1>
            <motion.p className="lx-hero-sub" variants={rise}>
              Thoughtful, verified matchmaking for meaningful marriages —
              guided by tradition, powered by compatibility.
            </motion.p>
            <motion.div className="lx-hero-ctas" variants={rise}>
              <Link to="/register" className="lx-btn lx-btn-gold">Begin your story</Link>
              <a href="#how-it-works" className="lx-btn lx-btn-ghost">How it works</a>
            </motion.div>

            <motion.div className="lx-hero-stats" variants={rise}>
              {HERO_STATS.map((s) => (
                <div key={s.label} className="lx-hero-stat">
                  <strong><CountUp to={s.to} separator="," duration={2} />{s.suffix}</strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Glass login card */}
          <motion.div
            className="lx-login-card"
            initial={{ opacity: 0, y: 46 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="lx-login-halo" aria-hidden="true" />
            <p className="lx-login-kicker">Welcome back</p>
            <h3 className="lx-login-title">Sign in to your search</h3>
            <form onSubmit={handleLogin}>
              <label className="lx-label">Mobile number</label>
              <div className="lx-phone-group">
                <span className="lx-country">+91</span>
                <input
                  type="text" className="lx-input" placeholder="10-digit mobile number"
                  maxLength="10" pattern="\d{0,10}"
                  value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <label className="lx-label">Password</label>
              <input
                type="password" className="lx-input" placeholder="Your password"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />

              <div className="lx-forgot">
                <Link to="/forgot-password">Forgot password?</Link>
              </div>

              {error && (
                <motion.p className="lx-error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                  {error}
                </motion.p>
              )}

              <motion.button
                type="submit"
                className="lx-btn lx-btn-gold lx-login-submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {isSubmitting ? 'Signing in…' : 'Sign In'}
              </motion.button>
            </form>
            <p className="lx-login-switch">
              New here? <Link to="/register">Create a free profile</Link>
            </p>
            <button type="button" className="lx-admin-link" onClick={() => navigate('/admin/login')}>
              Administrator sign in →
            </button>
          </motion.div>
        </div>

        <a href="#gallery" className="lx-scroll-cue" aria-label="Scroll down">
          <span />
        </a>
      </section>

      {/* ================= Photo marquee ================= */}
      <section className="lx-gallery" id="gallery">
        <div className="lx-marquee">
          <div className="lx-marquee-track">
            {[...MARQUEE_PHOTOS, ...MARQUEE_PHOTOS].map((id, i) => (
              <div key={`${id}-${i}`} className="lx-marquee-item">
                <img src={img(id, 500)} alt="" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= About ================= */}
      <section className="lx-section lx-ivory" id="about">
        <div className="lx-about">
          <Reveal className="lx-about-visual" y={44}>
            <div className="lx-about-img-main">
              <img src={ABOUT_IMAGE_MAIN} alt="Bride in traditional attire" loading="lazy" />
            </div>
            <div className="lx-about-img-small">
              <img src={ABOUT_IMAGE_SMALL} alt="Wedding rings" loading="lazy" />
            </div>
            <span className="lx-about-frame" aria-hidden="true" />
            <div className="lx-about-badge">
              <strong>12+</strong>
              <span>years of<br />matchmaking</span>
            </div>
          </Reveal>

          <div className="lx-about-copy">
            <SectionHead kicker="Why Tharamac" title="Matchmaking with a human touch" />
            <Reveal delay={0.1}>
              <p className="lx-lead">
                We blend the care of a traditional matchmaker with the reach of modern
                technology — so every introduction is genuine, compatible and family-approved.
              </p>
            </Reveal>
            <motion.ul
              className="lx-feature-list"
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
            >
              {FEATURES.map((f, i) => (
                <motion.li key={f.title} variants={rise}>
                  <span className="lx-feature-index">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{f.title}</h3>
                    <p>{f.text}</p>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </div>
      </section>

      {/* ================= How it works ================= */}
      <section className="lx-section lx-dark" id="how-it-works">
        <SectionHead light kicker="The journey" title="Four steps to forever" />
        <motion.div
          className="lx-steps"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {STEPS.map((s, i) => (
            <motion.div key={s.title} className="lx-step" variants={rise}>
              <span className="lx-step-num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              {i < STEPS.length - 1 && <span className="lx-step-arrow" aria-hidden="true">→</span>}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ================= Features — bento grid ================= */}
      <section className="lx-section lx-ivory" id="features">
        <SectionHead kicker="What you get" title="Everything a serious search needs" />
        <motion.div
          className="lx-bento"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
        >
          {/* 1 — hero tile: compatibility */}
          <motion.div className="lx-tile lx-tile-dark lx-tile-2x2" variants={rise}>
            <span className="lx-tile-kicker">Compatibility intelligence</span>
            <p className="lx-tile-stat">94<em>%</em></p>
            <h3>Matches scored on what actually matters</h3>
            <p className="lx-tile-text">
              Horoscope, values, lifestyle and family expectations — distilled into one
              honest compatibility score for every profile we show you.
            </p>
            <div className="lx-tile-chips">
              <span>Guna milan</span><span>Lifestyle</span><span>Values</span><span>Family</span>
            </div>
          </motion.div>

          {/* 2 — verified */}
          <motion.div className="lx-tile lx-tile-paper" variants={rise}>
            <span className="lx-tile-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l7 3v6c0 4.5-3 8.3-7 9-4-.7-7-4.5-7-9V6z" /><path d="M9.5 12l1.8 1.8L15 10" />
              </svg>
            </span>
            <h3>100% verified profiles</h3>
            <p className="lx-tile-text">Every profile is reviewed by a human before it goes live.</p>
          </motion.div>

          {/* 3 — privacy */}
          <motion.div className="lx-tile lx-tile-paper" variants={rise}>
            <span className="lx-tile-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
              </svg>
            </span>
            <h3>Privacy you control</h3>
            <p className="lx-tile-text">Photos, horoscope and contact details visible only to who you choose.</p>
          </motion.div>

          {/* 4 — photo tile */}
          <motion.div className="lx-tile lx-tile-photo lx-tile-2x1" variants={rise}>
            <img src={img(7686364, 900)} alt="Traditional wedding celebration" loading="lazy" />
            <div className="lx-tile-photo-veil" />
            <div className="lx-tile-photo-caption">
              <span className="lx-tile-kicker">Family first</span>
              <h3>Built for families searching together</h3>
            </div>
          </motion.div>

          {/* 5 — gold tile: support */}
          <motion.div className="lx-tile lx-tile-gold" variants={rise}>
            <p className="lx-tile-stat">24/7</p>
            <h3>Human support</h3>
            <p className="lx-tile-text">Real matchmakers on call — never a bot.</p>
          </motion.div>

          {/* 6 — horoscope wide tile */}
          <motion.div className="lx-tile lx-tile-paper lx-tile-2x1" variants={rise}>
            <span className="lx-tile-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18" />
              </svg>
            </span>
            <h3>Jathagam &amp; horoscope matching</h3>
            <p className="lx-tile-text">
              Share your jathagam securely and see Guna scores on every match —
              tradition, handled with modern care.
            </p>
          </motion.div>

          {/* 7 — messaging */}
          <motion.div className="lx-tile lx-tile-dark" variants={rise}>
            <span className="lx-tile-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-4.5 7.5L3 21l1.9-5.7A8.38 8.38 0 1 1 21 11.5z" />
              </svg>
            </span>
            <h3>Secure messaging</h3>
            <p className="lx-tile-text">Chat opens only after mutual interest — no unsolicited messages, ever.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* ================= Success stories ================= */}
      <section className="lx-section lx-ivory" id="stories">
        <SectionHead kicker="Real couples" title="Written in the stars, sealed here" />
        <Reveal className="lx-story" y={40}>
          <div className="lx-story-photo" key={`photo-${story.seed}`}>
            <img src={STORY_PHOTOS[story.seed]} alt={story.names} loading="lazy" />
          </div>
          <motion.div
            className="lx-story-body"
            key={story.seed}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <span className="lx-story-quotemark" aria-hidden="true">“</span>
            <p className="lx-story-quote">{story.quote}</p>
            <p className="lx-story-names">{story.names}</p>
            <p className="lx-story-place">{story.place}</p>
            <div className="lx-story-nav">
              {TESTIMONIALS.map((t, i) => (
                <button
                  key={t.seed}
                  type="button"
                  className={`lx-story-dot${i === storyIndex ? ' active' : ''}`}
                  onClick={() => setStoryIndex(i)}
                  aria-label={`Story ${i + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </Reveal>
      </section>

      {/* ================= Membership ================= */}
      <section className="lx-section lx-dark lx-membership" id="membership">
        <div className="lx-premium">
          <div className="lx-premium-copy">
            <SectionHead light kicker="Membership" title="Go further with Premium" />
            <motion.ul
              className="lx-premium-list"
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
            >
              {PREMIUM_FEATURES.map((f) => (
                <motion.li key={f} variants={rise}><span aria-hidden="true">✦</span>{f}</motion.li>
              ))}
            </motion.ul>
            <Reveal delay={0.15}>
              <Link to="/register" className="lx-btn lx-btn-gold">Explore Premium</Link>
            </Reveal>
          </div>
          <Reveal className="lx-premium-card-wrap" delay={0.2} y={50}>
            <div className="lx-member-card">
              <span className="lx-member-card-shine" aria-hidden="true" />
              <p className="lx-member-card-brand">THARAMAC</p>
              <p className="lx-member-card-tier">PREMIUM MEMBER</p>
              <p className="lx-member-card-holder">Your name here</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= Pricing ================= */}
      <section className="lx-section lx-ivory" id="pricing">
        <div className="lx-pricing-head">
          <SectionHead kicker="Plans & pricing" title="An investment in forever" />
          <Reveal className="lx-billing-toggle-wrap" delay={0.1} y={20}>
            <div className="lx-billing-toggle" role="tablist" aria-label="Billing period">
              <span className={`lx-billing-thumb${billing === 'annual' ? ' right' : ''}`} aria-hidden="true" />
              <button
                type="button"
                role="tab"
                aria-selected={billing === 'monthly'}
                className={billing === 'monthly' ? 'active' : ''}
                onClick={() => setBilling('monthly')}
              >
                Monthly
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={billing === 'annual'}
                className={billing === 'annual' ? 'active' : ''}
                onClick={() => setBilling('annual')}
              >
                Annual
                <span className="lx-save-badge">Save {ANNUAL_DISCOUNT}%</span>
              </button>
            </div>
          </Reveal>
        </div>

        <motion.div
          className="lx-plans"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          {PLANS.map((plan) => {
            const price = planPrice(plan, billing);
            return (
              <motion.div
                key={plan.name}
                className={`lx-plan${plan.featured ? ' featured' : ''}`}
                variants={rise}
              >
                {plan.featured && <span className="lx-plan-flag">Most popular</span>}
                <h3 className="lx-plan-name">{plan.name}</h3>
                <p className="lx-plan-tagline">{plan.tagline}</p>

                <div className="lx-plan-price">
                  <motion.span
                    key={billing}
                    className="lx-plan-amount"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {formatINR(price)}
                  </motion.span>
                  <span className="lx-plan-period">/ month</span>
                </div>
                <p className="lx-plan-note">
                  {plan.monthly === 0
                    ? 'Free forever'
                    : billing === 'annual'
                      ? `${formatINR(price * 12)} billed yearly`
                      : 'Billed monthly · cancel anytime'}
                </p>

                <ul className="lx-plan-features">
                  {plan.features.map((f) => (
                    <li key={f}><span aria-hidden="true">✦</span>{f}</li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`lx-btn ${plan.featured ? 'lx-btn-gold' : 'lx-btn-line'} lx-plan-cta`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ================= Journal ================= */}
      <section className="lx-section lx-ivory" id="journal">
        <SectionHead kicker="The journal" title="Advice for the search" />
        <motion.div
          className="lx-journal-grid"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          {JOURNAL_POSTS.map((post) => (
            <motion.article key={post.title} className="lx-journal-card" variants={rise}>
              <div className="lx-journal-img">
                <img src={img(post.id, 600)} alt="" loading="lazy" />
                <span className="lx-journal-tag">{post.tag}</span>
              </div>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <a href="#journal" className="lx-journal-link">Read the story →</a>
            </motion.article>
          ))}
        </motion.div>
      </section>

      {/* ================= Contact ================= */}
      <section className="lx-section lx-ivory lx-contact" id="contact">
        <div className="lx-contact-panel">
          <div>
            <SectionHead kicker="Contact" title="Talk to a matchmaker" />
            <Reveal delay={0.1}>
              <p className="lx-lead">Questions about membership, verification or your search? We answer within a day.</p>
            </Reveal>
          </div>
          <motion.div
            className="lx-contact-list"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
          >
            {CONTACT_INFO.map((c) => (
              <motion.div key={c.label} className="lx-contact-item" variants={rise}>
                <span>{c.label}</span>
                <strong>{c.value}</strong>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================= Final CTA ================= */}
      <section className="lx-cta">
        <div className="lx-cta-media" aria-hidden="true">
          <img src={HERO_POSTER} alt="" loading="lazy" />
          <span />
        </div>
        <Reveal className="lx-cta-inner" y={30}>
          <h2>Your person is out there.<br /><em>Let's find them together.</em></h2>
          <Link to="/register" className="lx-btn lx-btn-gold lx-btn-lg">Create your free profile</Link>
        </Reveal>
      </section>

      {/* ================= Footer ================= */}
      <footer className="lx-footer">
        <div className="lx-footer-grid">
          <div className="lx-footer-brand">
            <a href="#home" className="lx-brand">
              <span className="lx-brand-mark">T</span>
              <span className="lx-brand-name">Tharamac<em>Matrimony</em></span>
            </a>
            <p>A trusted matchmaking house helping families find meaningful, lasting marriages since 2013.</p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="lx-footer-col">
              <h4>{col.title}</h4>
              <ul>
                {col.links.map(([label, href]) => (
                  <li key={label}><a href={href}>{label}</a></li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lx-footer-col lx-footer-news">
            <h4>Newsletter</h4>
            <p>Success stories and search advice, monthly.</p>
            <form className="lx-newsletter" onSubmit={handleNewsletterSubmit}>
              <input
                type="email" placeholder="Your email" value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
              />
              <button type="submit" aria-label="Subscribe">→</button>
            </form>
            {newsletterMessage && <p className="lx-newsletter-msg">{newsletterMessage}</p>}
          </div>
        </div>
        <div className="lx-footer-bottom">
          <p>© {new Date().getFullYear()} Tharamac Matrimony. All rights reserved.</p>
          <p>Crafted with ❤ for meaningful unions.</p>
        </div>
      </footer>
    </div>
  );
};

export default Login;
