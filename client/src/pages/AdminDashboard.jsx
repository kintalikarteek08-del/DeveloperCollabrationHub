import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  FolderGit2,
  AlertTriangle,
  CheckCircle2,
  Ban,
  Trash2,
  Search,
  Activity,
} from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'users' | 'projects' | 'reports'
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');

  const fetchAdminData = async () => {
    try {
      const [analyticsRes, usersRes, projectsRes, reportsRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/users'),
        api.get('/admin/projects'),
        api.get('/admin/reports'),
      ]);

      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.data);
      if (usersRes.data.success) setUsersList(usersRes.data.data);
      if (projectsRes.data.success) setProjectsList(projectsRes.data.data);
      if (reportsRes.data.success) setReportsList(reportsRes.data.data);
    } catch (err) {
      console.error('[AdminDashboard Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await api.put(`/admin/users/${userId}/status`, { status: newStatus });
      if (res.data.success) {
        setUsersList((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, status: newStatus } : u))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating user status');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to permanently delete this project?')) return;
    try {
      const res = await api.delete(`/admin/projects/${projectId}`);
      if (res.data.success) {
        setProjectsList((prev) => prev.filter((p) => p._id !== projectId));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting project');
    }
  };

  const handleResolveReport = async (reportId, status) => {
    try {
      const res = await api.put(`/admin/reports/${reportId}`, {
        status,
        resolutionNotes: `Marked as ${status} by admin`,
      });
      if (res.data.success) {
        setReportsList((prev) =>
          prev.map((r) => (r._id === reportId ? { ...r, status } : r))
        );
      }
    } catch (err) {
      alert('Error updating report status');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading admin analytics & moderation center..." size="lg" />;
  }

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredProjects = projectsList.filter((p) =>
    p.title.toLowerCase().includes(projectSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
            Platform Moderation & Administration
          </h1>
          <p className="text-xs text-surface-400 mt-1">
            Global monitoring, community safety oversight, user suspension, and analytics.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-surface-800 pb-2">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'analytics'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
              : 'text-surface-400 hover:text-white hover:bg-surface-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          System Analytics
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'users'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
              : 'text-surface-400 hover:text-white hover:bg-surface-800'
          }`}
        >
          <Users className="w-4 h-4" />
          User Management ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'projects'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
              : 'text-surface-400 hover:text-white hover:bg-surface-800'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          Project Moderation ({projectsList.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'reports'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
              : 'text-surface-400 hover:text-white hover:bg-surface-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Flagged Reports ({reportsList.filter((r) => r.status === 'Pending').length})
        </button>
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-2xl glass-card border border-surface-800">
              <p className="text-xs text-surface-400">Total Users</p>
              <p className="text-2xl font-bold text-white mt-1">{analytics.totalUsers}</p>
            </div>
            <div className="p-4 rounded-2xl glass-card border border-surface-800">
              <p className="text-xs text-surface-400">Active Users</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{analytics.activeUsers}</p>
            </div>
            <div className="p-4 rounded-2xl glass-card border border-surface-800">
              <p className="text-xs text-surface-400">Total Projects</p>
              <p className="text-2xl font-bold text-white mt-1">{analytics.totalProjects}</p>
            </div>
            <div className="p-4 rounded-2xl glass-card border border-surface-800">
              <p className="text-xs text-surface-400">Active Teams</p>
              <p className="text-2xl font-bold text-brand-400 mt-1">{analytics.activeTeams}</p>
            </div>
            <div className="p-4 rounded-2xl glass-card border border-surface-800">
              <p className="text-xs text-surface-400">Completed Projects</p>
              <p className="text-2xl font-bold text-indigo-400 mt-1">
                {analytics.completedProjects}
              </p>
            </div>
            <div className="p-4 rounded-2xl glass-card border border-surface-800">
              <p className="text-xs text-surface-400">Pending Reports</p>
              <p className="text-2xl font-bold text-rose-400 mt-1">{analytics.pendingReports}</p>
            </div>
          </div>

          {/* Category distribution */}
          <div className="rounded-2xl glass-card border border-surface-800 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Project Category Distribution</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {analytics.categoryDistribution?.map((cat) => (
                <div
                  key={cat._id}
                  className="p-3 rounded-xl bg-surface-900 border border-surface-800 flex items-center justify-between"
                >
                  <span className="text-xs text-surface-300 font-medium">{cat._id}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-950/60 text-brand-300">
                    {cat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS LIST */}
      {activeTab === 'users' && (
        <div className="rounded-2xl glass-card border border-surface-800 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-white">Registered Platform Accounts</h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user by name/email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:outline-hidden"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-surface-300">
              <thead className="bg-surface-900 text-surface-400 font-semibold border-b border-surface-800">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Experience</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/60">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-surface-800/30">
                    <td className="p-3 flex items-center gap-2.5">
                      <img
                        src={
                          u.profileImage ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.name)}`
                        }
                        alt={u.name}
                        className="w-7 h-7 rounded-lg object-cover border border-surface-700"
                      />
                      <div>
                        <p className="font-semibold text-white">{u.name}</p>
                        <p className="text-[10px] text-surface-500">{u.email}</p>
                      </div>
                    </td>
                    <td className="p-3 uppercase font-mono text-[10px]">{u.role}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          u.status === 'active'
                            ? 'bg-emerald-950/60 text-emerald-300'
                            : 'bg-rose-950/60 text-rose-300'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3">{u.experienceLevel || 'Intermediate'}</td>
                    <td className="p-3 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUserStatus(u._id, u.status)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                            u.status === 'active'
                              ? 'bg-rose-950/60 text-rose-300 hover:bg-rose-900/60'
                              : 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PROJECTS MODERATION */}
      {activeTab === 'projects' && (
        <div className="rounded-2xl glass-card border border-surface-800 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-white">All Platform Projects</h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search project title..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:outline-hidden"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-surface-300">
              <thead className="bg-surface-900 text-surface-400 font-semibold border-b border-surface-800">
                <tr>
                  <th className="p-3">Project</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Owner</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/60">
                {filteredProjects.map((p) => (
                  <tr key={p._id} className="hover:bg-surface-800/30">
                    <td className="p-3 font-semibold text-white max-w-xs truncate">{p.title}</td>
                    <td className="p-3">{p.category}</td>
                    <td className="p-3">{p.owner?.name || 'Owner'}</td>
                    <td className="p-3">{p.status}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteProject(p._id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40"
                        title="Delete Inappropriate Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: REPORTS QUEUE */}
      {activeTab === 'reports' && (
        <div className="rounded-2xl glass-card border border-surface-800 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Community Moderation Reports</h3>

          {reportsList.length === 0 ? (
            <p className="text-xs text-surface-500 italic py-4">No reports recorded.</p>
          ) : (
            <div className="space-y-3">
              {reportsList.map((r) => (
                <div
                  key={r._id}
                  className="p-4 rounded-xl bg-surface-900 border border-surface-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">
                        Target: {r.targetName || r.targetType}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          r.status === 'Resolved'
                            ? 'bg-emerald-950/60 text-emerald-300'
                            : 'bg-amber-950/60 text-amber-300'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <p className="text-surface-300 font-medium">Reason: {r.reason}</p>
                    <p className="text-surface-400 text-[11px]">Reporter: {r.reporter?.name}</p>
                  </div>

                  {r.status === 'Pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResolveReport(r._id, 'Resolved')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => handleResolveReport(r._id, 'Rejected')}
                        className="px-3 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 text-xs"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
