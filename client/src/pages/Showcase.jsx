import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, Globe, Users, Search, Sparkles } from 'lucide-react';
import { GithubIcon } from '../components/common/SocialIcons';
import api from '../services/api';
import SkillBadge from '../components/common/SkillBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const Showcase = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const CATEGORIES = [
    'All',
    'Web Development',
    'Mobile Development',
    'AI/ML',
    'Data Science',
    'Cybersecurity',
    'IoT',
    'Cloud',
  ];

  const fetchShowcase = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (selectedCategory !== 'All') params.append('category', selectedCategory);

      const res = await api.get(`/projects/showcase?${params.toString()}`);
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } catch (err) {
      console.error('[Showcase Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShowcase();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchShowcase();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
          <Award className="w-3.5 h-3.5" />
          <span>Verified Project Gallery</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Public Developer Showcase
        </h1>
        <p className="text-xs sm:text-sm text-surface-400 leading-relaxed">
          Explore production-grade software completed by collaborative developer teams on DevCollab Hub.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl glass-card border border-surface-800">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-surface-400 hover:text-white bg-surface-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search completed software..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden"
          />
        </form>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <LoadingSpinner text="Loading published projects..." size="lg" />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No completed projects found"
          description="Projects that complete all tasks and are published by their team will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const showcase = project.showcase || {};
            const screenshot =
              showcase.screenshots?.[0] ||
              'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80';

            return (
              <div
                key={project._id}
                className="rounded-2xl glass-card border border-surface-800 overflow-hidden hover:border-brand-500/40 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div>
                  {/* Screenshot Thumbnail */}
                  <div className="relative h-44 overflow-hidden bg-surface-900">
                    <img
                      src={screenshot}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-surface-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                        {project.category}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-2.5">
                    <Link to={`/projects/${project._id}`}>
                      <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                        {project.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-surface-300 line-clamp-2 leading-relaxed">
                      {showcase.summary || project.description}
                    </p>

                    {/* Technologies */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {project.technologies.slice(0, 4).map((t, idx) => (
                        <SkillBadge key={idx} skill={t} size="xs" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer with links & Team */}
                <div className="p-5 pt-0">
                  <div className="pt-3 border-t border-surface-800/80 flex items-center justify-between">
                    {/* Team Members */}
                    <div className="flex items-center -space-x-1.5 overflow-hidden">
                      {project.members?.slice(0, 4).map((m, idx) => {
                        const u = m.user || {};
                        return (
                          <img
                            key={idx}
                            src={
                              u.profileImage ||
                              `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.name || 'Dev')}`
                            }
                            alt={u.name}
                            title={u.name}
                            className="inline-block h-6 w-6 rounded-full ring-2 ring-surface-900 object-cover"
                          />
                        );
                      })}
                      {project.members?.length > 4 && (
                        <span className="text-[10px] text-surface-400 ml-2">
                          +{project.members.length - 4}
                        </span>
                      )}
                    </div>

                    {/* External links */}
                    <div className="flex items-center gap-2">
                      {showcase.demoUrl && (
                        <a
                          href={showcase.demoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-surface-800 hover:bg-emerald-600 text-surface-300 hover:text-white transition-colors"
                          title="Live Demo"
                        >
                          <Globe className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {showcase.githubUrl && (
                        <a
                          href={showcase.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-surface-800 hover:bg-brand-600 text-surface-300 hover:text-white transition-colors"
                          title="GitHub Source"
                        >
                          <GithubIcon className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <Link
                        to={`/projects/${project._id}`}
                        className="px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Showcase;
