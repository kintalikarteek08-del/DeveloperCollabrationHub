import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  FolderGit2,
  Send,
  Kanban,
  CheckCircle2,
  ArrowRight,
  Plus,
  Compass,
  AlertCircle,
  ExternalLink,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ProjectCard from '../components/projects/ProjectCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [recommendedProjects, setRecommendedProjects] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [recRes, projRes, appRes] = await Promise.all([
          api.get('/projects/recommendations'),
          api.get('/projects/my-projects'),
          api.get('/applications/my-applications'),
        ]);

        if (recRes.data.success) setRecommendedProjects(recRes.data.data);
        if (projRes.data.success) setMyProjects(projRes.data.data);
        if (appRes.data.success) setMyApplications(appRes.data.data);
      } catch (err) {
        console.error('[Dashboard Error]', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading your developer dashboard..." size="lg" />;
  }

  const pendingApps = myApplications.filter((a) => a.status === 'Pending');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl glass border border-surface-800 p-6 sm:p-8 overflow-hidden bg-gradient-to-r from-surface-900/90 via-surface-900/70 to-brand-950/40">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Developer Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-surface-300 mt-2 leading-relaxed">
            {recommendedProjects.length > 0
              ? `We discovered ${recommendedProjects.length} open projects tailored to your ${user?.skills?.length || 0} registered skills.`
              : 'Add your technical skills to your profile to receive tailored project recommendations!'}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <Link
              to="/projects/new"
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-md shadow-brand-600/30 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Project Idea
            </Link>
            <Link
              to="/discover"
              className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-200 text-xs font-medium border border-surface-700 transition-all flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5" />
              Browse Projects
            </Link>
            <Link
              to="/profile/edit"
              className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-200 text-xs font-medium border border-surface-700 transition-all"
            >
              Update Skills
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-card border border-surface-800/80">
          <div className="flex items-center justify-between text-surface-400 mb-2">
            <span className="text-xs font-medium">My Projects</span>
            <FolderGit2 className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl font-bold text-white">{myProjects.length}</p>
          <p className="text-[11px] text-surface-500 mt-1">Created or joined</p>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-surface-800/80">
          <div className="flex items-center justify-between text-surface-400 mb-2">
            <span className="text-xs font-medium">Pending Applications</span>
            <Send className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">{pendingApps.length}</p>
          <p className="text-[11px] text-surface-500 mt-1">Awaiting owner review</p>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-surface-800/80">
          <div className="flex items-center justify-between text-surface-400 mb-2">
            <span className="text-xs font-medium">Registered Skills</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white">{user?.skills?.length || 0}</p>
          <p className="text-[11px] text-surface-500 mt-1">Used for compatibility</p>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-surface-800/80">
          <div className="flex items-center justify-between text-surface-400 mb-2">
            <span className="text-xs font-medium">Peer Rating</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">{user?.ratingAverage || '5.0'} / 5</p>
          <p className="text-[11px] text-surface-500 mt-1">
            {user?.ratingCount || 0} reviews earned
          </p>
        </div>
      </div>

      {/* Recommended Projects Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              Recommended for You
            </h2>
            <p className="text-xs text-surface-400 mt-0.5">
              Matched against your profile skills using transparent weighted compatibility
            </p>
          </div>
          <Link
            to="/discover"
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            Explore all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recommendedProjects.length === 0 ? (
          <div className="p-8 rounded-2xl glass-card border border-surface-800 text-center">
            <p className="text-xs text-surface-400">
              No new recommendations right now. Try updating your skills or browse the full directory!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recommendedProjects.slice(0, 3).map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </section>

      {/* My Projects & Workspaces */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Kanban className="w-4 h-4 text-indigo-400" />
              My Project Workspaces
            </h2>
            <p className="text-xs text-surface-400 mt-0.5">
              Projects you are leading or contributing to as an active team member
            </p>
          </div>
        </div>

        {myProjects.length === 0 ? (
          <div className="p-8 rounded-2xl glass-card border border-surface-800 text-center space-y-3">
            <p className="text-xs text-surface-400">You haven't joined or created any projects yet.</p>
            <Link
              to="/discover"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs"
            >
              Browse Open Projects
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myProjects.map((p) => {
              const isOwner = p.owner?._id === user?._id || p.owner === user?._id;
              return (
                <div
                  key={p._id}
                  className="p-5 rounded-2xl glass-card border border-surface-800 hover:border-brand-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-800 text-surface-300">
                        {p.category}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-950/60 text-brand-300 border border-brand-500/30">
                        {isOwner ? 'Project Owner' : 'Team Member'}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-white line-clamp-1 mb-1.5">
                      {p.title}
                    </h3>
                    <p className="text-xs text-surface-400 line-clamp-2 leading-relaxed mb-4">
                      {p.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-surface-800/80 flex items-center justify-between gap-2">
                    <span className="text-xs text-surface-400">
                      Team: {p.members?.length || 1} / {p.teamSize}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isOwner && (
                        <Link
                          to={`/projects/${p._id}/workspace?tab=applications`}
                          className="px-2.5 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-200 text-xs font-semibold transition-all border border-surface-700 flex items-center gap-1"
                          title="Manage Applications"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-brand-400" />
                          <span className="hidden sm:inline">Applications</span>
                        </Link>
                      )}
                      <Link
                        to={`/projects/${p._id}/workspace`}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <Kanban className="w-3.5 h-3.5" />
                        Workspace
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
