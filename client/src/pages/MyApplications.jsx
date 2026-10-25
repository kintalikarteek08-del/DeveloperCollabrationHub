import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, Clock, CheckCircle2, XCircle, ArrowRight, Kanban } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      const res = await api.get('/applications/my-applications');
      if (res.data.success) {
        setApplications(res.data.data);
      }
    } catch (err) {
      console.error('[MyApplications Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleWithdraw = async (appId) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;
    try {
      const res = await api.put(`/applications/${appId}/withdraw`);
      if (res.data.success) {
        setApplications((prev) =>
          prev.map((a) => (a._id === appId ? { ...a, status: 'Withdrawn' } : a))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to withdraw application');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your project applications..." size="lg" />;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Send className="w-6 h-6 text-brand-400" />
            My Project Applications
          </h1>
          <p className="text-xs text-surface-400 mt-1">
            Track status updates on teams you have applied to join.
          </p>
        </div>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No applications sent yet"
          description="Browse open projects and apply to join teams looking for your skills."
          actionText="Discover Open Projects"
          actionLink="/discover"
        />
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const project = app.project || {};
            const statusStyles = {
              Pending: 'bg-amber-950/40 text-amber-300 border-amber-500/30',
              Accepted: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30',
              Rejected: 'bg-rose-950/40 text-rose-300 border-rose-500/30',
              Withdrawn: 'bg-surface-800 text-surface-400 border-surface-700',
            };

            return (
              <div
                key={app._id}
                className="p-5 rounded-2xl glass-card border border-surface-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        statusStyles[app.status] || statusStyles.Pending
                      }`}
                    >
                      {app.status}
                    </span>
                    <span className="text-xs text-surface-500">
                      Applied on{' '}
                      {new Date(app.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <Link
                    to={`/projects/${project._id}`}
                    className="text-base font-bold text-white hover:text-brand-300 transition-colors block"
                  >
                    {project.title || 'Project'}
                  </Link>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-surface-400">Requested Role:</span>
                    <span className="font-semibold text-brand-300 bg-brand-950/40 border border-brand-500/20 px-2 py-0.5 rounded-md">
                      {app.requestedRole || 'Full Stack Developer'}
                    </span>
                  </div>

                  <p className="text-xs text-surface-300 bg-surface-950/60 p-3 rounded-xl border border-surface-800/80 italic">
                    "{app.message}"
                  </p>

                  {app.relevantSkills && app.relevantSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {app.relevantSkills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-surface-900 border border-surface-700 text-surface-300"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  {app.status === 'Accepted' && (
                    <Link
                      to={`/projects/${project._id}/workspace`}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
                    >
                      <Kanban className="w-3.5 h-3.5" />
                      Open Workspace
                    </Link>
                  )}

                  {app.status === 'Pending' && (
                    <button
                      onClick={() => handleWithdraw(app._id)}
                      className="px-3.5 py-2 rounded-xl bg-surface-800 hover:bg-rose-950/40 hover:text-rose-300 text-surface-400 text-xs font-semibold transition-colors"
                    >
                      Withdraw
                    </button>
                  )}

                  <Link
                    to={`/projects/${project._id}`}
                    className="p-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-white transition-colors"
                    title="View Project"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyApplications;
