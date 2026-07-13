import React from 'react';

export default function GunaBadge({ guna }) {
  if (!guna) return null;
  const { score, maxScore, manglikMatch } = guna;
  const tier = score >= 24 ? 'high' : score >= 15 ? 'mid' : 'low';
  return (
    <span className={`compat-badge compat-${tier} guna-badge`} title="Simplified Guna Milan (Kundli) score">
      <span className="compat-ring">{score}</span>
      Guna {score}/{maxScore}
      {manglikMatch === 'caution' && <span className="guna-caution" title="Manglik status differs">⚠</span>}
    </span>
  );
}
