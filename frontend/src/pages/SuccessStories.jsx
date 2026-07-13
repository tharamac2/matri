import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import './SuccessStories.css';

const SuccessStories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/success-stories')
      .then(({ data }) => setStories(data))
      .catch((err) => console.error('Failed to load success stories:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Success stories</h1>
        <p>Real couples who found each other on Tharamac Matrimony</p>
      </div>

      {loading ? (
        <div className="profile-card-grid">
          {[1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 200 }} />)}
        </div>
      ) : stories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l1.9 5.3L19 10l-5.1 1.7L12 17l-1.9-5.3L5 10l5.1-1.7z" /></svg>
          </div>
          <h3>No stories published yet</h3>
          <p>Check back soon for real couples who found each other here.</p>
        </div>
      ) : (
        <div className="success-story-grid">
          {stories.map((story) => (
            <div key={story.id} className="card success-story-card animate-fade-in">
              {story.photo_url && <img className="success-story-img" src={story.photo_url} alt={story.title} />}
              <div className="success-story-body">
                <h3>{story.title}</h3>
                {(story.member_a_name || story.member_b_name) && (
                  <p className="success-story-couple">{[story.member_a_name, story.member_b_name].filter(Boolean).join(' & ')}</p>
                )}
                <p className="success-story-text">{story.story}</p>
                {story.wedding_date && (
                  <p className="success-story-date">
                    Wedding: {new Date(story.wedding_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SuccessStories;
