import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Web Development',
  'Mobile Development',
  'AI/ML',
  'Data Science',
  'Cybersecurity',
  'IoT',
  'Cloud',
  'Blockchain',
  'UI/UX',
  'Other',
];

const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const STATUSES = ['All', 'Open', 'In Progress', 'Completed'];

const ProjectFilter = ({ filters, onFilterChange, onReset }) => {
  return (
    <div className="rounded-2xl glass-card border border-surface-800 p-4 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects by title, stack, or keywords..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-900 border border-surface-700/80 text-surface-100 placeholder-surface-500 text-xs focus:outline-hidden focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Category */}
        <div>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700/80 text-surface-200 text-xs focus:outline-hidden focus:border-brand-500 transition-colors"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty */}
        <div>
          <select
            value={filters.difficulty}
            onChange={(e) => onFilterChange('difficulty', e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700/80 text-surface-200 text-xs focus:outline-hidden focus:border-brand-500 transition-colors"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                Difficulty: {d}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700/80 text-surface-200 text-xs focus:outline-hidden focus:border-brand-500 transition-colors"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                Status: {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sub-bar for sorting and reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-surface-800/60 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-surface-400 font-medium">Sort by:</span>
          <button
            onClick={() => onFilterChange('sort', 'newest')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              filters.sort === 'newest'
                ? 'bg-brand-600 text-white font-medium'
                : 'text-surface-400 hover:text-surface-200 bg-surface-900'
            }`}
          >
            Newest
          </button>
          <button
            onClick={() => onFilterChange('sort', 'popular')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              filters.sort === 'popular'
                ? 'bg-brand-600 text-white font-medium'
                : 'text-surface-400 hover:text-surface-200 bg-surface-900'
            }`}
          >
            Most Popular
          </button>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-surface-400 hover:text-surface-200 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset filters
        </button>
      </div>
    </div>
  );
};

export default ProjectFilter;
