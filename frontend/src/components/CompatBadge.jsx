import React from 'react';

export default function CompatBadge({ score }) {
  if (score == null) return null;
  const tier = score >= 70 ? 'high' : score >= 40 ? 'mid' : 'low';
  return (
    <span className={`compat-badge compat-${tier}`}>
      <span className="compat-ring">{score}</span>
      Match
    </span>
  );
}
