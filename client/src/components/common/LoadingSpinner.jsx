import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ text = 'Loading data...', size = 'md' }) => {
  const iconSize = size === 'lg' ? 'w-10 h-10' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 gap-3 text-surface-400">
      <Loader2 className={`${iconSize} animate-spin text-brand-500`} />
      {text && <p className="text-sm font-medium animate-pulse">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
