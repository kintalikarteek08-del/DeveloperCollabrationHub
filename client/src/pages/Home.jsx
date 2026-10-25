import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Code2,
  Users,
  Kanban,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Star,
  Layers,
  Compass,
} from 'lucide-react';
import api from '../services/api';
import ProjectCard from '../components/projects/ProjectCard';

const Home = () => {
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [stats, setStats] = useState({
    projects: 12,
    developers: 85,
    completed: 6,
    matchRate: 94,
  });

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const res = await api.get('/projects?limit=3&sort=popular');
        if (res.data.success) {
          setFeaturedProjects(res.data.data);
        }
      } catch (err) {
        console.error('[Home] Failed to load featured projects', err);
      }
    };
    loadHomeData();
  }, []);

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 text-center max-w-4xl mx-auto px-4">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-950/60 border border-brand-500/30 text-brand-300 text-xs font-semibold mb-6 shadow-xs animate-in fade-in zoom-in-95 duration-500">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Gen Full-Stack Collaboration Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
          Find your dream team. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            Build software that matters.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-surface-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Match transparently by skill compatibility, coordinate tasks on collaborative
          Kanban boards, communicate in real time, and build a verified developer portfolio.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/discover"
            className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-all shadow-lg shadow-brand-600/30 flex items-center gap-2"
          >
            <Compass className="w-4 h-4" />
            Discover Open Projects
          </Link>
          <Link
            to="/register"
            className="px-6 py-3 rounded-xl bg-surface-800/80 hover:bg-surface-700 text-surface-200 hover:text-white font-semibold text-sm border border-surface-700 transition-all flex items-center gap-2"
          >
            Create Developer Profile
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Live metric counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-8 border-t border-surface-800/60 max-w-3xl mx-auto">
          <div className="p-4 rounded-xl glass-card">
            <p className="text-2xl font-bold text-white">100%</p>
            <p className="text-xs text-surface-400">Transparent Match</p>
          </div>
          <div className="p-4 rounded-xl glass-card">
            <p className="text-2xl font-bold text-brand-400">Real-Time</p>
            <p className="text-xs text-surface-400">Socket.IO Chat</p>
          </div>
          <div className="p-4 rounded-xl glass-card">
            <p className="text-2xl font-bold text-indigo-400">Kanban</p>
            <p className="text-xs text-surface-400">Sprint Tracking</p>
          </div>
          <div className="p-4 rounded-xl glass-card">
            <p className="text-2xl font-bold text-emerald-400">Showcase</p>
            <p className="text-xs text-surface-400">Verified Portfolios</p>
          </div>
        </div>
      </section>

      {/* Core Workflow Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
            Engineered for High-Velocity Teams
          </h2>
          <p className="text-sm text-surface-400 leading-relaxed">
            Everything students and developers need to transition from an idea to a published product.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl glass-card border border-surface-800 hover:border-brand-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-brand-600/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Transparent Skill Matching</h3>
            <p className="text-xs text-surface-400 leading-relaxed">
              No black-box algorithms. See normalized skill weights and exact percentages showing
              why you match a project and what complementary skills are needed.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-surface-800 hover:border-brand-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <Kanban className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Kanban Task Workspace</h3>
            <p className="text-xs text-surface-400 leading-relaxed">
              Organize sprints across To-Do, In-Progress, Review, and Done. Assign teammates, attach
              deadlines, and leave threaded comments directly on task cards.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-surface-800 hover:border-brand-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <Star className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Verified Peer Reviews</h3>
            <p className="text-xs text-surface-400 leading-relaxed">
              Upon project completion, team members rate collaboration, technical prowess, and
              reliability, automatically building a credible proof-of-work profile.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Projects Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Featured Active Projects
            </h2>
            <p className="text-xs text-surface-400 mt-1">
              Top collaborative projects currently seeking contributors
            </p>
          </div>
          <Link
            to="/discover"
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            View all projects <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredProjects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
