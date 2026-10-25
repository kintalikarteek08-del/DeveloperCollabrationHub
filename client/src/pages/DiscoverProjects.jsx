import React, { useState, useEffect, useCallback } from 'react';
import { Compass, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectFilter from '../components/projects/ProjectFilter';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const DiscoverProjects = () => {
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: '',
    category: 'All',
    difficulty: 'All',
    status: 'All',
    sort: 'newest',
  });

  const fetchProjects = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: pageToLoad,
          limit: 9,
          sort: filters.sort,
        });

        if (filters.search.trim()) params.append('search', filters.search.trim());
        if (filters.category !== 'All') params.append('category', filters.category);
        if (filters.difficulty !== 'All') params.append('difficulty', filters.difficulty);
        if (filters.status !== 'All') params.append('status', filters.status);

        const res = await api.get(`/projects?${params.toString()}`);
        if (res.data.success) {
          setProjects(res.data.data);
          setPagination(res.data.pagination);
        }
      } catch (err) {
        console.error('[DiscoverProjects Error]', err);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchProjects(1);
  }, [fetchProjects]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      category: 'All',
      difficulty: 'All',
      status: 'All',
      sort: 'newest',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-brand-400" />
            Discover Software Projects
          </h1>
          <p className="text-xs text-surface-400 mt-1">
            Search, filter by tech stack or category, and join high-impact developer initiatives.
          </p>
        </div>
        <div className="text-xs text-surface-400">
          Showing <span className="text-white font-semibold">{projects.length}</span> of{' '}
          <span className="text-white font-semibold">{pagination.total}</span> projects
        </div>
      </div>

      {/* Filter Bar */}
      <ProjectFilter
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Grid or Empty/Loading State */}
      {loading ? (
        <LoadingSpinner text="Searching and scoring project compatibility..." size="lg" />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects match your search criteria"
          description="Try broadening your search query or resetting filters to explore all active projects."
          actionText="Reset All Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => fetchProjects(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="p-2 rounded-xl bg-surface-900 border border-surface-800 disabled:opacity-40 text-surface-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-4 py-2 rounded-xl bg-surface-900 border border-surface-800 text-xs font-semibold text-surface-200">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => fetchProjects(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            className="p-2 rounded-xl bg-surface-900 border border-surface-800 disabled:opacity-40 text-surface-300 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DiscoverProjects;
