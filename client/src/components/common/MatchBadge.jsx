import React from 'react';
import { Sparkles } from 'lucide-react';

const MatchBadge = ({ percentage, explanation }) => {
  if (percentage === undefined || percentage === null) return null;

  let bgClass = 'bg-surface-800 text-surface-300 border-surface-700';
  let dotClass = 'bg-surface-400';

  if (percentage >= 80) {
    bgClass = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-emerald-950/30';
    dotClass = 'bg-emerald-400 animate-pulse';
  } else if (percentage >= 50) {
    bgClass = 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40 shadow-indigo-950/30';
    dotClass = 'bg-indigo-400';
  } else if (percentage > 0) {
    bgClass = 'bg-amber-950/60 text-amber-300 border-amber-500/40';
    dotClass = 'bg-amber-400';
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm ${bgClass}`}
      title={explanation || `${percentage}% Skill Match`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      <Sparkles className="w-3 h-3" />
      <span>{percentage}% Match</span>
    </div>
  );
};

export default MatchBadge;
