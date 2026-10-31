import React from 'react';
import { PillarType } from '../types';

interface PillarBadgeProps {
  pillar: PillarType;
  size?: 'sm' | 'md';
}

export const PillarBadge: React.FC<PillarBadgeProps> = ({ pillar, size = 'sm' }) => {
  const styles: Record<PillarType, { label: string; bg: string; text: string; dot: string }> = {
    MOVE: {
      label: 'MOVE',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
    },
    DISCONNECT: {
      label: 'DISCONNECT',
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
      text: 'text-indigo-700',
      dot: 'bg-indigo-500',
    },
    RECONNECT: {
      label: 'RECONNECT',
      bg: 'bg-amber-50 text-amber-700 border-amber-200/60',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
    },
  };

  const current = styles[pillar];
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${current.bg} ${sizeClasses} tracking-wide`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  );
};
