import React from 'react';

const SkillBadge = ({ skill, matched = null, size = 'sm' }) => {
  let colorClasses = 'bg-surface-800 text-surface-200 border-surface-700/60';

  if (matched === true) {
    colorClasses = 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30';
  } else if (matched === false) {
    colorClasses = 'bg-surface-900/60 text-surface-400 border-surface-800 line-through decoration-surface-600';
  }

  const sizeClasses =
    size === 'xs'
      ? 'px-2 py-0.5 text-xs font-mono'
      : size === 'md'
      ? 'px-3 py-1 text-sm font-medium'
      : 'px-2.5 py-0.5 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-md border shadow-xs transition-all duration-150 ${colorClasses} ${sizeClasses}`}
    >
      {skill}
    </span>
  );
};

export default SkillBadge;
