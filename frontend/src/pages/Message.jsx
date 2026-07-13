import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReportCard from '../components/ReportCard';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { toCardDisplay } from '../utils/profile.js';
import { presenceLabel, isOnline } from '../utils/presence.js';
import './Message.css';

const Message = () => {
  const { member } = useAuth();
  const [searchParams] = useSearchParams();
  const withId = searchParams.get('with');

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [blockMessage, setBlockMessage] = useState('');

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (withId) {
      api
        .get(`/profiles/${withId}`)
        .then(({ data }) => openChat(toCardDisplay(data)))
        .catch((err) => console.error('Failed to load profile:', err));
    }
  }, [withId]);

  const loadConversations = () => {
    api
      .get('/conversations')
      .then(({ data }) => setConversations(data.map((c) => ({ ...toCardDisplay(c.member), lastMessage: c.last_message, unread: c.unread_count }))))
      .catch((err) => console.error('Failed to load conversations:', err))
      .finally(() => setLoading(false));
  };

  const loadThread = (otherId) => {
    api
      .get(`/messages/${otherId}`)
      .then(({ data }) =>
        setChatMessages(data.map((m) => ({ id: m.id, text: m.body, sender: m.sender_id === member?.id ? 'me' : 'them', readAt: m.read_at })))
      )
      .catch((err) => console.error('Failed to load thread:', err));
  };

  const openChat = (profile) => {
    setSelectedProfile(profile);
    loadThread(profile.id);
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !selectedProfile) return;
    const body = newMessage;
    setNewMessage('');
    try {
      await api.post('/messages', { receiver_id: selectedProfile.id, body });
      loadThread(selectedProfile.id);
      loadConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleBlock = async () => {
    if (!selectedProfile) return;
    if (!window.confirm(`Block ${selectedProfile.name}? They won't be able to message or match with you.`)) return;
    try {
      await api.post('/blocks', { blocked_id: selectedProfile.id });
      setConversations((prev) => prev.filter((c) => c.id !== selectedProfile.id));
      setBlockMessage(`${selectedProfile.name} has been blocked.`);
      setSelectedProfile(null);
      setTimeout(() => setBlockMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not block this member.');
    }
  };

  const lastMineMessage = [...chatMessages].reverse().find((m) => m.sender === 'me');

  return (
    <div className="msg-page">
      <div className="msg-list-pane">
        <div className="msg-list-header">
          <h1>Messages</h1>
        </div>
        <div className="msg-list-scroll">
          {loading ? (
            <div style={{ padding: 16 }}>
              {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 64, marginBottom: 10 }} />)}
            </div>
          ) : conversations.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-4.5 7.5L3 21l1.9-5.7A8.38 8.38 0 1 1 21 11.5z" /></svg>
              </div>
              <h3>No conversations yet</h3>
              <p>Message one of your matches to start chatting.</p>
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                className={`msg-list-item${selectedProfile?.id === c.id ? ' active' : ''}`}
                onClick={() => openChat(c)}
              >
                <img src={c.image} alt={c.name} />
                <div className="msg-list-item-body">
                  <p className="msg-list-item-name">{c.name}</p>
                  <p className="msg-list-item-preview">{c.lastMessage || 'Say hello 👋'}</p>
                </div>
                {c.unread > 0 && <span className="msg-unread-dot" />}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="msg-thread-pane">
        {!selectedProfile ? (
          <div className="msg-thread-empty">
            <div className="empty-state-icon" style={{ width: 64, height: 64 }}>
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-4.5 7.5L3 21l1.9-5.7A8.38 8.38 0 1 1 21 11.5z" /></svg>
            </div>
            <h3>Select a conversation</h3>
            <p>Pick someone from the list to start chatting.</p>
          </div>
        ) : showReport ? (
          <div className="msg-report-wrap">
            <ReportCard reportedId={selectedProfile.id} onClose={() => setShowReport(false)} />
          </div>
        ) : (
          <>
            <div className="msg-thread-header">
              <img src={selectedProfile.image} alt={selectedProfile.name} />
              <div>
                <p className="msg-list-item-name">{selectedProfile.name}, {selectedProfile.age}</p>
                <p className={`profile-card-presence${isOnline(selectedProfile.lastActive) ? ' online' : ''}`}>{presenceLabel(selectedProfile.lastActive)}</p>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowReport(true)}>Report</button>
                <button className="btn btn-ghost btn-sm" onClick={handleBlock}>Block</button>
              </div>
            </div>

            <div className="msg-thread-messages">
              {chatMessages.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--ink-400)', marginTop: 40 }}>Say hello 👋</p>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className={`msg-bubble ${msg.sender === 'me' ? 'mine' : 'theirs'}`}>
                    {msg.text}
                  </div>
                ))
              )}
              {lastMineMessage && (
                <p className="msg-seen">{lastMineMessage.readAt ? 'Seen' : 'Delivered'}</p>
              )}
            </div>

            <div className="msg-input-row">
              <input
                type="text" className="input" placeholder="Type a message…"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button className="btn btn-primary" onClick={handleSendMessage} aria-label="Send">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#fff" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
              </button>
            </div>
          </>
        )}
      </div>

      {blockMessage && <div className="toast">{blockMessage}</div>}
    </div>
  );
};

export default Message;
