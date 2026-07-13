import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ScrollVelocity from '../components/ScrollVelocity.jsx';
import BlurText from '../components/BlurText.jsx';
import CountUp from '../components/CountUp.jsx';
import ShinyText from '../components/ShinyText.jsx';
import GlareHover from '../components/GlareHover.jsx';
import StarBorder from '../components/StarBorder.jsx';
import SpotlightCard from '../components/SpotlightCard.jsx';
import TiltedCard from '../components/TiltedCard.jsx';
import './Login.css';

const HERO_IMAGE = 'https://images.pexels.com/photos/19733687/pexels-photo-19733687.jpeg?auto=compress&cs=tinysrgb&w=1200';
const RING_BOX_IMAGE = 'https://images.pexels.com/photos/19279699/pexels-photo-19279699.jpeg?auto=compress&cs=tinysrgb&w=800';

const AVATAR_SEEDS = ['Aarav', 'Diya', 'Rohan', 'Meera'];

const RoseIcon = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
    <path d="M32 44 L28 62 M32 44 L36 60" stroke="#8AA37E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M30 50 Q22 52 18 46" stroke="#8AA37E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <g transform="rotate(0 32 28)"><ellipse cx="32" cy="28" rx="13" ry="17" fill="#F3BFD3" /></g>
    <g transform="rotate(72 32 28)"><ellipse cx="32" cy="28" rx="13" ry="17" fill="#E894B2" opacity="0.9" /></g>
    <g transform="rotate(144 32 28)"><ellipse cx="32" cy="28" rx="13" ry="17" fill="#EDA9BF" opacity="0.9" /></g>
    <g transform="rotate(216 32 28)"><ellipse cx="32" cy="28" rx="13" ry="17" fill="#E894B2" opacity="0.9" /></g>
    <g transform="rotate(288 32 28)"><ellipse cx="32" cy="28" rx="13" ry="17" fill="#F3BFD3" opacity="0.9" /></g>
    <circle cx="32" cy="28" r="8" fill="#C2416C" />
    <circle cx="32" cy="28" r="4" fill="#A8365B" />
  </svg>
);

const SectionTitle = ({ children }) => (
  <h2 className="lp-section-title">
    <BlurText text={children} className="lp-title-blur" animateBy="words" direction="top" delay={70} />
    <span className="lp-title-flourish" aria-hidden="true"><span className="lp-title-line" /><span className="lp-title-dot" /><span className="lp-title-line" /></span>
  </h2>
);

/** Simple click/arrow/auto-cycling deck of cards (no scroll-jacking of its own —
 *  it lives inside a single full-screen stacked slide; the page-level scroll
 *  stack is what responds to scrolling). */
const FeatureStack = ({ items }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActiveIndex((i) => (i + 1) % items.length), 3500);
    return () => clearInterval(id);
  }, [items.length]);

  const order = items.map((_, i) => (activeIndex + i) % items.length);
  const goNext = () => setActiveIndex((i) => (i + 1) % items.length);
  const goPrev = () => setActiveIndex((i) => (i - 1 + items.length) % items.length);

  return (
    <div className="lp-feature-stack-wrap">
      <div className="lp-feature-stack">
        {order.map((itemIndex, pos) => {
          const item = items[itemIndex];
          return (
            <div
              key={item.title}
              className="lp-feature-stack-card"
              data-pos={pos}
              onClick={pos === 0 ? goNext : undefined}
              role={pos === 0 ? 'button' : undefined}
              tabIndex={pos === 0 ? 0 : undefined}
              onKeyDown={pos === 0 ? (e) => { if (e.key === 'Enter' || e.key === ' ') goNext(); } : undefined}
              style={{ zIndex: items.length - pos }}
            >
              <div className="lp-feature-icon">{item.icon}</div>
              <h3 dangerouslySetInnerHTML={{ __html: item.title }} />
              <p>{item.text}</p>
              {pos === 0 && <span className="lp-feature-stack-hint">Tap to explore →</span>}
            </div>
          );
        })}
      </div>

      <div className="lp-feature-stack-controls">
        <button type="button" onClick={goPrev} aria-label="Previous feature">‹</button>
        <div className="lp-feature-stack-dots">
          {items.map((item, i) => (
            <span key={item.title} className={`lp-feature-stack-dot${activeIndex === i ? ' active' : ''}`} />
          ))}
        </div>
        <button type="button" onClick={goNext} aria-label="Next feature">›</button>
      </div>
    </div>
  );
};

const FEATURES = [
  {
    title: 'Verified Profiles',
    text: 'Every profile is manually verified for a safe and genuine experience.',
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l7 3v6c0 4.5-3 8.3-7 9-4-.7-7-4.5-7-9V6z" /><path d="M9.5 12l1.8 1.8L15 10" />
      </svg>
    ),
  },
  {
    title: 'Smart Matchmaking',
    text: 'Advanced matching system to help you find compatible matches.',
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="8" r="3" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
        <circle cx="17" cy="9" r="2.4" /><path d="M15.8 14.2c2.6.4 4.2 2.3 4.2 5" />
      </svg>
    ),
  },
  {
    title: 'Secure &amp; Private',
    text: 'We prioritize your privacy with advanced security and control.',
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
      </svg>
    ),
  },
  {
    title: 'Premium Support',
    text: 'Our support team is always here to assist you at every step.',
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 13a8 8 0 0 1 16 0" /><rect x="3" y="13" width="4.5" height="6" rx="1.4" /><rect x="16.5" y="13" width="4.5" height="6" rx="1.4" />
        <path d="M18.5 19v.5A2.5 2.5 0 0 1 16 22h-2.5" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    title: 'Create Your Profile',
    text: 'Sign up in minutes and add your personal, family, education and preference details.',
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M9 13l2 2 4-4.5" />
      </svg>
    ),
  },
  {
    title: 'Discover Matches',
    text: 'Browse verified profiles and get intelligent recommendations tailored to you.',
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8.5" cy="9" r="2.8" /><circle cx="15.5" cy="9" r="2.8" />
        <path d="M12 21c0-.6-3-1.7-3-4.5 0-1.9 1.5-3.5 3-3.5s3 1.6 3 3.5c0 2.8-3 3.9-3 4.5z" />
      </svg>
    ),
  },
  {
    title: 'Express Interest',
    text: 'Send interest to profiles you like and connect with members who share mutual interest.',
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    ),
  },
  {
    title: 'Begin Your Journey',
    text: 'Chat securely after acceptance and take the next step towards a beautiful relationship.',
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-4.5 7.5L3 21l1.9-5.7A8.38 8.38 0 1 1 21 11.5z" />
      </svg>
    ),
  },
];

const STATS = [
  { to: 50000, suffix: '+', label: 'Verified Members' },
  { to: 15000, suffix: '+', label: 'Happy Couples' },
  { to: 100000, suffix: '+', label: 'Successful Matches' },
  { value: '24/7', label: 'Customer Support' },
];

const PREMIUM_FEATURES = [
  'Unlimited profile views', 'Priority profile visibility', 'Secure messaging',
  'View contact details', 'Advanced search filters', 'Dedicated customer support',
];

const TESTIMONIALS = [
  {
    names: 'Arjun &amp; Meera',
    quote: "I found my perfect life partner through Tharamac Matrimony. The platform is genuine, secure and really easy to use. Highly recommended!",
    seed: 'Arjun',
  },
  {
    names: 'Karthik &amp; Divya',
    quote: 'The verification process and support team made our journey stress-free. We are forever grateful to Tharamac Matrimony.',
    seed: 'Karthik',
  },
];

const SEARCH_TAGS = ['Age 25–32', 'Chennai', 'Hindu', 'B.Tech', 'Never Married', 'IT Professional'];

const QUOTES = [
  '"A great marriage is not when the perfect couple comes together — it is when an imperfect couple learns to enjoy their differences." — Dave Meurer',
  '"The best thing to hold onto in life is each other." — Audrey Hepburn',
];

const BLOG_POSTS = [
  { title: '10 Questions to Ask Before You Say Yes', tag: 'Relationships', excerpt: 'Practical conversation starters for getting to know a prospective match beyond the profile.' },
  { title: 'A Family’s Guide to the Modern Match', tag: 'Family', excerpt: 'How to involve your family in your search while keeping the final decision yours.' },
  { title: 'Staying Safe While Meeting Online', tag: 'Safety', excerpt: 'Our verification team’s tips for a secure first meeting, online and offline.' },
];

const CONTACT_INFO = [
  {
    label: 'Email us', value: 'support@tharamacmatrimony.com',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
      </svg>
    ),
  },
  {
    label: 'Call us', value: '+91 98765 43210',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.4 2.1L8 9.9a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.8 2.2z" />
      </svg>
    ),
  },
  {
    label: 'Visit us', value: 'Chennai, Tamil Nadu, India',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
];

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'About Us', href: '#about' },
  { label: 'Search', href: '#search' },
  { label: 'Success Stories', href: '#success-stories' },
  { label: 'Membership', href: '#membership' },
  { label: 'Blog', href: '#blog' },
  { label: 'Contact', href: '#contact' },
];

const FOOTER_COLUMNS = [
  { title: 'Company', links: [['About Us', '#about'], ['Membership', '#membership'], ['Success Stories', '#success-stories'], ['Careers', '#contact'], ['Contact Us', '#contact']] },
  { title: 'Help &amp; Support', links: [['How It Works', '#how-it-works'], ['FAQs', '#contact'], ['Privacy Policy', '#contact'], ['Terms &amp; Conditions', '#contact'], ['Plan &amp; Pricing', '#membership']] },
  { title: 'Useful Links', links: [['Search', '#search'], ['Blog', '#blog'], ['Testimonials', '#success-stories'], ['Sitemap', '#contact']] },
];

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const autoplayRef = useRef(null);

  useEffect(() => {
    autoplayRef.current = setInterval(() => {
      setTestimonialIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(autoplayRef.current);
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

  const showTestimonial = (delta) => {
    setTestimonialIndex((i) => (i + delta + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterMessage("Thanks! We'll keep you posted.");
    setNewsletterEmail('');
    setTimeout(() => setNewsletterMessage(''), 3000);
  };

  const visibleTestimonials = [TESTIMONIALS[testimonialIndex], TESTIMONIALS[(testimonialIndex + 1) % TESTIMONIALS.length]];

  return (
    <div className="lp-page">
      {/* ---------- Header ---------- */}
      <header className="lp-header">
        <div className="lp-header-inner">
          <div className="lp-logo">
            <span className="lp-logo-mark">TM</span>
            <span className="lp-logo-text">
              Tharamac<span>Matrimony</span>
            </span>
          </div>
          <nav className="lp-nav">
            {NAV_LINKS.map((item) => (
              <a key={item.label} href={item.href}>{item.label}</a>
            ))}
          </nav>
          <div className="lp-header-actions">
            <a href="#home" className="btn btn-outline btn-sm">Login</a>
            <Link to="/register" className="btn btn-primary btn-sm">Register Free</Link>
          </div>
        </div>
      </header>

      {/* ============ Full-screen stacked sections (Home / About Us / Search / Success Stories / Membership / Blog / Contact) ============ */}
      <div className="lp-stack">

        {/* ---------- 1. Home ---------- */}
        <section className="lp-stack-section" id="home" style={{ zIndex: 1, background: 'var(--cream-100)' }}>
          <div className="lp-hero-bg" aria-hidden="true" />
          <div className="lp-hero-inner">
            <div className="lp-hero-copy animate-fade-in">
              <p className="lp-eyebrow">Begin your journey together <span aria-hidden="true">♥</span></p>
              <h1>Find Your Perfect <em>Life Partner</em> with Confidence</h1>
              <p className="lp-hero-sub">
                A trusted matrimonial platform where meaningful relationships begin and happy families are built.
              </p>
              <div className="lp-hero-ctas">
                <Link to="/register" className="btn btn-gold">Create Free Profile</Link>
                <a href="#search" className="btn btn-outline">Browse Matches</a>
              </div>
              <div className="lp-hero-trust">
                <div className="lp-hero-avatars">
                  {AVATAR_SEEDS.map((seed) => (
                    <img key={seed} src={`https://api.dicebear.com/7.x/initials/svg?seed=${seed}`} alt="" />
                  ))}
                </div>
                <p>
                  <strong><CountUp to={50000} separator="," duration={1.8} />+ Verified Members</strong>
                  <br />and growing every day
                </p>
              </div>
            </div>

            <div className="lp-hero-visual animate-fade-in">
              <span className="lp-hero-ring" aria-hidden="true" />
              <RoseIcon className="lp-hero-rose lp-hero-rose-1" />
              <RoseIcon className="lp-hero-rose lp-hero-rose-2" />
              <RoseIcon className="lp-hero-rose lp-hero-rose-3" />
              <div className="lp-hero-image-frame">
                <GlareHover
                  width="100%" height="100%" background="transparent" borderColor="transparent" borderRadius="0"
                  glareColor="#ffffff" glareOpacity={0.35} glareAngle={-30} glareSize={200} transitionDuration={800}
                >
                  <img src={HERO_IMAGE} alt="Happy couple" />
                </GlareHover>
              </div>

              <div className="lp-login-card card">
                <p className="lp-login-title"><span aria-hidden="true">♥</span> Find Your Match</p>
                <form onSubmit={handleLogin}>
                  <label className="field-label">Mobile number</label>
                  <div className="auth-phone-group">
                    <span className="auth-country-code">+91</span>
                    <input
                      type="text" className="input" placeholder="10-digit mobile number"
                      maxLength="10" pattern="\d{0,10}"
                      value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>

                  <label className="field-label" style={{ marginTop: 12 }}>Password</label>
                  <input
                    type="password" className="input" placeholder="Enter your password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                  />

                  <div className="auth-forgot">
                    <Link to="/forgot-password">Forgot password?</Link>
                  </div>

                  {error && <p className="reg-error">{error}</p>}

                  <button type="submit" className="btn btn-primary lp-login-submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Logging in…' : 'Log In'}
                  </button>
                </form>
                <p className="auth-switch">
                  New to Tharamac Matrimony? <Link to="/register">Create an account</Link>
                </p>
                <button type="button" className="auth-admin-link" onClick={() => navigate('/admin/login')}>
                  Sign in as Administrator →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- 2. About Us (Why choose us) ---------- */}
        <section className="lp-stack-section" id="about" style={{ zIndex: 2, background: 'var(--cream-100)' }}>
          <SectionTitle>Why Choose Tharamac Matrimony?</SectionTitle>
          <FeatureStack items={FEATURES} />
        </section>

        {/* ---------- 3. Search ---------- */}
        <section className="lp-stack-section" id="search" style={{ zIndex: 3, background: 'var(--cream-200)' }}>
          <SectionTitle>Search Thousands of Verified Profiles</SectionTitle>
          <p className="lp-search-sub">Filter by age, city, religion, education and more to find profiles that truly match what you're looking for.</p>
          <div className="lp-search-tags">
            {SEARCH_TAGS.map((tag) => (
              <span key={tag} className="lp-search-tag">{tag}</span>
            ))}
          </div>
          <Link to="/register" className="btn btn-gold lp-search-cta">Start Searching</Link>
        </section>

        {/* ---------- 4. Success stories ---------- */}
        <section className="lp-stack-section" id="success-stories" style={{ zIndex: 4, background: 'var(--cream-100)' }}>
          <SectionTitle>Success Stories</SectionTitle>
          <div className="lp-testimonial-row">
            <button type="button" className="lp-carousel-arrow" onClick={() => showTestimonial(-1)} aria-label="Previous">‹</button>
            <div className="lp-testimonial-grid">
              {visibleTestimonials.map((t) => (
                <SpotlightCard key={t.seed} className="lp-testimonial-card" spotlightColor="rgba(194, 65, 108, 0.18)">
                  <span className="lp-quote-mark" aria-hidden="true">&ldquo;</span>
                  <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${t.seed}`} alt="" className="lp-testimonial-avatar" />
                  <div>
                    <p className="lp-testimonial-quote">{t.quote}</p>
                    <p className="lp-testimonial-name" dangerouslySetInnerHTML={{ __html: `— ${t.names}` }} />
                    <p className="lp-testimonial-stars">★★★★★</p>
                  </div>
                </SpotlightCard>
              ))}
            </div>
            <button type="button" className="lp-carousel-arrow" onClick={() => showTestimonial(1)} aria-label="Next">›</button>
          </div>
        </section>

        {/* ---------- 5. Membership ---------- */}
        <section className="lp-stack-section" id="membership" style={{ zIndex: 5, background: 'var(--cream-200)' }}>
          <div className="lp-premium-card">
            <div className="lp-premium-copy">
              <p className="lp-eyebrow lp-eyebrow-gold"><span aria-hidden="true">👑</span> Premium Membership</p>
              <h2>Unlock Exclusive Features</h2>
              <div className="lp-premium-list">
                {PREMIUM_FEATURES.map((f) => (
                  <p key={f}><span aria-hidden="true">✓</span> {f}</p>
                ))}
              </div>
              <Link to="/register" className="btn btn-gold">
                <span aria-hidden="true">👑</span>&nbsp; Upgrade to Premium
              </Link>
            </div>
            <div className="lp-premium-visual">
              <RoseIcon className="lp-premium-rose lp-premium-rose-1" />
              <RoseIcon className="lp-premium-rose lp-premium-rose-2" />
              <div className="lp-premium-mock-card">
                <GlareHover
                  width="100%" height="100%" background="transparent" borderColor="transparent" borderRadius="18px"
                  glareColor="#ffffff" glareOpacity={0.4} glareAngle={-45} glareSize={200} transitionDuration={700}
                >
                  <span className="lp-premium-mock-crown" aria-hidden="true">👑</span>
                  <ShinyText text="PREMIUM" color="rgba(255,255,255,0.75)" shineColor="#ffffff" speed={2.5} />
                  <ShinyText text="MEMBER" color="rgba(255,255,255,0.75)" shineColor="#ffffff" speed={2.5} delay={0.3} />
                </GlareHover>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- 6. Blog ---------- */}
        <section className="lp-stack-section" id="blog" style={{ zIndex: 6, background: 'var(--cream-100)' }}>
          <SectionTitle>From Our Blog</SectionTitle>
          <div className="lp-blog-grid">
            {BLOG_POSTS.map((post) => (
              <SpotlightCard key={post.title} className="lp-blog-card" spotlightColor="rgba(194, 65, 108, 0.15)">
                <span className="lp-blog-tag">{post.tag}</span>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <a href="#blog" className="lp-blog-link">Read more →</a>
              </SpotlightCard>
            ))}
          </div>
        </section>

        {/* ---------- 7. Contact ---------- */}
        <section className="lp-stack-section" id="contact" style={{ zIndex: 7, background: 'var(--cream-200)' }}>
          <SectionTitle>Get in Touch</SectionTitle>
          <p className="lp-search-sub">Have a question about your account or membership? Our support team is happy to help.</p>
          <div className="lp-contact-grid">
            {CONTACT_INFO.map((c) => (
              <div key={c.label} className="lp-contact-card">
                <div className="lp-feature-icon">{c.icon}</div>
                <p className="lp-contact-label">{c.label}</p>
                <p className="lp-contact-value">{c.value}</p>
              </div>
            ))}
          </div>
          <a href="mailto:support@tharamacmatrimony.com" className="btn btn-gold lp-search-cta">Send us a message</a>
        </section>

      </div>
      {/* ============ end stacked sections ============ */}

      {/* ---------- Quote marquee ---------- */}
      <section className="lp-quote-band">
        <ScrollVelocity
          texts={QUOTES}
          velocity={35}
          numCopies={4}
          className="lp-quote-scroll-text"
        />
      </section>

      {/* ---------- How it works ---------- */}
      <section className="lp-section lp-section-alt" id="how-it-works">
        <SectionTitle>How It Works</SectionTitle>
        <div className="lp-steps-row">
          <div className="lp-steps-grid">
            {STEPS.map((s, i) => (
              <div key={s.title} className="lp-step-card">
                <span className="lp-step-number">{String(i + 1).padStart(2, '0')}</span>
                <div className="lp-step-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
          <div className="lp-steps-image">
            <TiltedCard
              imageSrc={RING_BOX_IMAGE}
              altText="Wedding rings"
              captionText="Your forever begins here"
              containerHeight="100%"
              containerWidth="100%"
              imageHeight="100%"
              imageWidth="100%"
              rotateAmplitude={10}
              scaleOnHover={1.05}
              showMobileWarning={false}
            />
          </div>
        </div>

        <div className="lp-stats-bar">
          {STATS.map((s) => (
            <div key={s.label} className="lp-stat">
              <p className="lp-stat-value">
                {s.to != null
                  ? <>
                      <CountUp to={s.to} separator="," duration={2} />
                      {s.suffix}
                    </>
                  : s.value}
              </p>
              <p className="lp-stat-label">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Bottom CTA ---------- */}
      <section className="lp-cta-banner">
        <div>
          <h2>Your Perfect Match is Waiting</h2>
          <p>Join thousands of happy families who found love through our trusted platform.</p>
        </div>
        <StarBorder as={Link} to="/register" className="lp-cta-star" color="#FFD98A" speed="4s">
          Register Now <span aria-hidden="true">→</span>
        </StarBorder>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="lp-footer" id="footer">
        <div className="lp-footer-grid">
          <div className="lp-footer-brand">
            <div className="lp-logo">
              <span className="lp-logo-mark">TM</span>
              <span className="lp-logo-text">
                Tharamac<span>Matrimony</span>
              </span>
            </div>
            <p>A trusted matrimonial platform dedicated to helping you find a life partner and build a happy future.</p>
            <div className="lp-footer-social">
              <a href="#footer" aria-label="Facebook">f</a>
              <a href="#footer" aria-label="Instagram">◎</a>
              <a href="#footer" aria-label="Twitter">𝕏</a>
              <a href="#footer" aria-label="YouTube">▶</a>
            </div>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="lp-footer-col">
              <h4 dangerouslySetInnerHTML={{ __html: col.title }} />
              <ul>
                {col.links.map(([label, href]) => (
                  <li key={label}><a href={href} dangerouslySetInnerHTML={{ __html: label }} /></li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lp-footer-col">
            <h4>Newsletter</h4>
            <p>Subscribe to get updates on new members and success stories.</p>
            <form className="lp-newsletter-form" onSubmit={handleNewsletterSubmit}>
              <input
                type="email" placeholder="Enter your email" value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
              />
              <button type="submit" aria-label="Subscribe">→</button>
            </form>
            {newsletterMessage && <p className="lp-newsletter-message">{newsletterMessage}</p>}
          </div>
        </div>
        <div className="lp-footer-bottom">
          <p>© {new Date().getFullYear()} Tharamac Matrimony. All Rights Reserved.</p>
          <p>Made with ♥ for meaningful relationships.</p>
        </div>
      </footer>
    </div>
  );
};

export default Login;
