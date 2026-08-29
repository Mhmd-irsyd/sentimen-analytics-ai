import React from 'react';
import { SENTIMENT_CONFIG } from '../utils/constants';

export default function Badge({ sentiment, className = '' }) {
  const config = SENTIMENT_CONFIG[sentiment] || SENTIMENT_CONFIG.Netral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border tracking-wide transition-all shadow-sm ${config.badgeClass} ${className}`}
    >
      <span>{config.emoji}</span>
      <span>{sentiment}</span>
    </span>
  );
}
