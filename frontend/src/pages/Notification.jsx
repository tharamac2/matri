import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { getReadNotificationIds, markNotificationRead } from '../utils/notifications.js';
import './Notification.css';

const TYPE_ICON = {
  interest_received: '⭐',
  match_accepted: '💗',
  message: '💬',
};

const Notification = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, forceRender] = useState(0);

  useEffect(() => {
    api
      .get('/notifications')
      .then(({ data }) => setNotifications(data))
      .catch((err) => console.error('Failed to load notifications:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleDismiss = (id) => setNotifications((prev) => prev.filter((n) => n.id !== id));

  const handleOpen = (id) => {
    markNotificationRead(id);
    forceRender((n) => n + 1);
  };

  const readIds = getReadNotificationIds();
  const visible = notifications.filter((n) => {
    if (activeTab === 'Read') return readIds.has(n.id);
    if (activeTab === 'Unread') return !readIds.has(n.id);
    return true;
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Notifications</h1>
        <p>Stay on top of your matches and messages</p>
      </div>

      <div className="notif-tabs">
        {['All', 'Unread', 'Read'].map((tab) => (
          <button
            key={tab}
            className={`notif-tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="notif-list">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 72 }} />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
          </div>
          <h3>Nothing here</h3>
          <p>You're all caught up.</p>
        </div>
      ) : (
        <div className="notif-list">
          {visible.map((notif) => (
            <div
              key={notif.id}
              className={`card notif-card${readIds.has(notif.id) ? ' read' : ''}`}
              onClick={() => handleOpen(notif.id)}
            >
              <span className="notif-icon">{TYPE_ICON[notif.type] || '🔔'}</span>
              <div className="notif-content">
                <p className="notif-title">{notif.title}</p>
                <p className="notif-body">{notif.body}</p>
              </div>
              {!readIds.has(notif.id) && <span className="msg-unread-dot" />}
              <button
                className="notif-dismiss"
                onClick={(e) => { e.stopPropagation(); handleDismiss(notif.id); }}
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notification;
