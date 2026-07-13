import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { getReadNotificationIds } from '../utils/notifications.js';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/home', label: 'Home', icon: 'home' },
  { to: '/search', label: 'Search', icon: 'search' },
  { to: '/matches', label: 'Matches', icon: 'heart' },
  { to: '/interest', label: 'Interest', icon: 'star' },
  { to: '/message', label: 'Messages', icon: 'chat', badgeKey: 'messages' },
  { to: '/notification', label: 'Notifications', icon: 'bell', badgeKey: 'notifications' },
];

const ICONS = {
  home: (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  bookmark: (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  sparkle: (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 5.3L19 10l-5.1 1.7L12 17l-1.9-5.3L5 10l5.1-1.7z" />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [badges, setBadges] = useState({ messages: 0, notifications: 0 });
  const { member, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    api.get('/conversations')
      .then(({ data }) => setBadges((b) => ({ ...b, messages: data.reduce((sum, c) => sum + (c.unread_count || 0), 0) })))
      .catch(() => {});

    api.get('/notifications')
      .then(({ data }) => {
        const readIds = getReadNotificationIds();
        setBadges((b) => ({ ...b, notifications: data.filter((n) => !readIds.has(n.id)).length }));
      })
      .catch(() => {});
  }, [location.pathname]);

  const handleLogout = () => {
    setIsOpen(false);
    setProfileOpen(false);
    logout();
    navigate('/login');
  };

  const initials = member?.name
    ? member.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const content = (
    <div className="eb-sidebar-inner">
      <div className="eb-sidebar-logo">
        <h1>Tharamac Matrimony</h1>
        <p>Find your forever</p>
      </div>

      <nav className="eb-sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `eb-sidebar-link${isActive ? ' active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            <span className="eb-sidebar-icon">{ICONS[item.icon]}</span>
            {item.label}
            {item.badgeKey && badges[item.badgeKey] > 0 && (
              <span className="eb-sidebar-badge">{badges[item.badgeKey] > 9 ? '9+' : badges[item.badgeKey]}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="eb-sidebar-profile">
        <button type="button" className="eb-sidebar-profile-btn" onClick={() => setProfileOpen((v) => !v)}>
          <span className="avatar" style={{ width: 36, height: 36, fontSize: 13 }}>{initials}</span>
          <span className="eb-sidebar-profile-name">{member?.name || 'My Profile'}</span>
        </button>

        {profileOpen && (
          <div className="eb-sidebar-profile-menu">
            <NavLink to="/shortlisted" className="eb-sidebar-profile-item" onClick={() => { setProfileOpen(false); setIsOpen(false); }}>
              {ICONS.bookmark} Shortlisted
            </NavLink>
            <NavLink to="/profile-views" className="eb-sidebar-profile-item" onClick={() => { setProfileOpen(false); setIsOpen(false); }}>
              {ICONS.eye} Who Viewed Me
            </NavLink>
            <NavLink to="/accepted" className="eb-sidebar-profile-item" onClick={() => { setProfileOpen(false); setIsOpen(false); }}>
              {ICONS.heart} Accepted
            </NavLink>
            <NavLink to="/success-stories" className="eb-sidebar-profile-item" onClick={() => { setProfileOpen(false); setIsOpen(false); }}>
              {ICONS.sparkle} Success Stories
            </NavLink>
            <NavLink to="/settings" className="eb-sidebar-profile-item" onClick={() => { setProfileOpen(false); setIsOpen(false); }}>
              {ICONS.settings} Settings
            </NavLink>
            <button type="button" className="eb-sidebar-profile-item danger" onClick={handleLogout}>
              {ICONS.logout} Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button type="button" className="eb-sidebar-toggle" onClick={() => setIsOpen(true)} aria-label="Open navigation">
        {ICONS.menu}
      </button>

      <aside className="eb-sidebar eb-sidebar-desktop">{content}</aside>

      {isOpen && (
        <>
          <div className="eb-sidebar-backdrop" onClick={() => setIsOpen(false)} />
          <aside className="eb-sidebar eb-sidebar-mobile">
            <button type="button" className="eb-sidebar-close" onClick={() => setIsOpen(false)} aria-label="Close navigation">
              {ICONS.close}
            </button>
            {content}
          </aside>
        </>
      )}
    </>
  );
}
