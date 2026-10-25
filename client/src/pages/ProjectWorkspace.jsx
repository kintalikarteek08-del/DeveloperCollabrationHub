import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Kanban,
  Users,
  MessageSquare,
  Sparkles,
  Award,
  Settings,
  Plus,
  ArrowLeft,
  UserCheck,
  UserX,
  Star,
  CheckCircle2,
  Globe,
  AlertCircle,
} from 'lucide-react';
import { GithubIcon } from '../components/common/SocialIcons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import KanbanBoard from '../components/tasks/KanbanBoard';
import TaskModal from '../components/tasks/TaskModal';
import ProjectChat from '../components/chat/ProjectChat';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SkillBadge from '../components/common/SkillBadge';
import MatchBadge from '../components/common/MatchBadge';

const ROLES = [
  'Owner',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'ML Engineer',
  'UI/UX Designer',
  'DevOps',
  'Tester',
  'Other',
];

const ProjectWorkspace = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [applications, setApplications] = useState([]);
  const [teammateRecommendations, setTeammateRecommendations] = useState([]);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'kanban');
  const [loading, setLoading] = useState(true);

  // Task modal state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTaskStatus, setNewTaskStatus] = useState('TODO');

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReviewee, setSelectedReviewee] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewCategories, setReviewCategories] = useState({
    communication: 5,
    technical: 5,
    reliability: 5,
    teamwork: 5,
  });
  const [reviewComment, setReviewComment] = useState('');

  // Showcase publish state
  const [showcaseSummary, setShowcaseSummary] = useState('');
  const [showcaseDemoUrl, setShowcaseDemoUrl] = useState('');
  const [showcaseGithubUrl, setShowcaseGithubUrl] = useState('');
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  const fetchWorkspaceData = async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`),
      ]);

      if (projRes.data.success) {
        setProject(projRes.data.data);
        setShowcaseSummary(projRes.data.data.showcase?.summary || projRes.data.data.description);
        setShowcaseDemoUrl(projRes.data.data.showcase?.demoUrl || '');
        setShowcaseGithubUrl(projRes.data.data.showcase?.githubUrl || '');
      }
      if (tasksRes.data.success) {
        setTasks(tasksRes.data.data);
      }

      // If owner, fetch applications and recommendations
      if (
        projRes.data.data.isOwner ||
        projRes.data.data.owner?._id === user?._id ||
        projRes.data.data.owner === user?._id
      ) {
        const [appRes, recRes] = await Promise.all([
          api.get(`/applications/project/${id}`),
          api.get(`/users/recommendations/teammates/${id}`),
        ]);
        if (appRes.data.success) setApplications(appRes.data.data);
        if (recRes.data.success) setTeammateRecommendations(recRes.data.data);
      }
    } catch (err) {
      console.error('[Workspace Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [id]);

  // Tasks actions
  const handleCreateTask = () => {
    setEditingTask(null);
    setNewTaskStatus('TODO');
    setTaskModalOpen(true);
  };

  const handleAddTaskToColumn = (status) => {
    setEditingTask(null);
    setNewTaskStatus(status);
    setTaskModalOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleSaveTask = async (taskFormData) => {
    try {
      if (editingTask) {
        const res = await api.put(`/tasks/${editingTask._id}`, taskFormData);
        if (res.data.success) {
          setTasks((prev) => prev.map((t) => (t._id === editingTask._id ? res.data.data : t)));
        }
      } else {
        const res = await api.post('/tasks', { ...taskFormData, project: id });
        if (res.data.success) {
          setTasks((prev) => [...prev, res.data.data]);
        }
      }
      setTaskModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving task');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
    } catch (err) {
      fetchWorkspaceData();
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      alert('Failed to delete task');
    }
  };

  const handleAddComment = async (taskId, text) => {
    try {
      const res = await api.post(`/tasks/${taskId}/comments`, { text });
      if (res.data.success) {
        setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data.data : t)));
      }
    } catch (err) {
      alert('Failed to post comment');
    }
  };

  // Role Management
  const handleUpdateRole = async (userId, newRole) => {
    try {
      const res = await api.put(`/projects/${id}/members/${userId}/role`, { role: newRole });
      if (res.data.success) {
        setProject((prev) => ({ ...prev, members: res.data.data }));
        setAlertMsg({ type: 'success', text: 'Team member role updated successfully!' });
      }
    } catch (err) {
      setAlertMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update role' });
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the project team?')) return;
    try {
      const res = await api.delete(`/projects/${id}/members/${userId}`);
      if (res.data.success) {
        setProject((prev) => ({ ...prev, members: res.data.data }));
        setAlertMsg({ type: 'success', text: 'Member removed from team.' });
      }
    } catch (err) {
      setAlertMsg({ type: 'error', text: err.response?.data?.message || 'Failed to remove member' });
    }
  };

  // Application Decisions
  const handleApplicationDecision = async (appId, status, role) => {
    try {
      const res = await api.put(`/applications/${appId}/status`, { status, role });
      if (res.data.success) {
        setApplications((prev) =>
          prev.map((a) => (a._id === appId ? { ...a, status } : a))
        );
        fetchWorkspaceData();
        setAlertMsg({
          type: 'success',
          text: `Application has been marked as ${status}.`,
        });
      }
    } catch (err) {
      setAlertMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update application',
      });
    }
  };

  // Showcase Publish
  const handlePublishShowcase = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/projects/${id}/showcase`, {
        summary: showcaseSummary,
        demoUrl: showcaseDemoUrl,
        githubUrl: showcaseGithubUrl,
      });
      if (res.data.success) {
        setProject(res.data.data);
        setAlertMsg({
          type: 'success',
          text: '🎉 Project successfully published to the public showcase! Teammates can now rate and review each other.',
        });
      }
    } catch (err) {
      setAlertMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to publish project',
      });
    }
  };

  // Submit Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedReviewee) return;

    try {
      const res = await api.post('/reviews', {
        projectId: id,
        revieweeId: selectedReviewee._id,
        rating: reviewRating,
        categories: reviewCategories,
        comment: reviewComment,
      });
      if (res.data.success) {
        setAlertMsg({
          type: 'success',
          text: `Review submitted for ${selectedReviewee.name}!`,
        });
        setReviewModalOpen(false);
        setReviewComment('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Connecting to project workspace..." size="lg" />;
  }

  if (!project) {
    return (
      <div className="max-w-md mx-auto py-16 text-center text-surface-400">
        <h2 className="text-lg font-bold text-white mb-2">Project Workspace Unavailable</h2>
        <Link to="/dashboard" className="text-xs text-brand-400 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isOwner =
    project.isOwner ||
    project.owner?._id === user?._id ||
    project.owner === user?._id ||
    user?.role === 'admin';

  const isMember =
    project.isMember ||
    project.members?.some(
      (m) => (m.user?._id || m.user).toString() === user?._id?.toString()
    ) ||
    isOwner;

  if (!isMember) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/40">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Private Team Workspace</h2>
        <p className="text-xs text-surface-400 leading-relaxed">
          This collaboration workspace is restricted to accepted team members and the project owner. Submit a join request from the project details page to participate.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            to={`/projects/${project._id}`}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/30"
          >
            View Project Details
          </Link>
          <Link
            to="/discover"
            className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 text-xs font-medium"
          >
            Explore Other Projects
          </Link>
        </div>
      </div>
    );
  }

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setSearchParams({ tab: tabName });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-800">
        <div className="space-y-1">
          <Link
            to={`/projects/${project._id}`}
            className="text-xs text-surface-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Project Details
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {project.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-950/60 text-brand-300 border border-brand-500/20">
              Workspace
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {activeTab === 'kanban' && (
            <button
              onClick={handleCreateTask}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-md shadow-brand-600/30 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          )}
        </div>
      </div>

      {/* Alert banner */}
      {alertMsg.text && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            alertMsg.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg({ type: '', text: '' })} className="font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Workspace Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-surface-800 pb-2">
        <button
          onClick={() => handleTabChange('kanban')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'kanban'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
              : 'text-surface-400 hover:text-white hover:bg-surface-800'
          }`}
        >
          <Kanban className="w-4 h-4" />
          Kanban Board ({tasks.length})
        </button>

        <button
          onClick={() => handleTabChange('chat')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'chat'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
              : 'text-surface-400 hover:text-white hover:bg-surface-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Team Chat & Discussions
        </button>

        <button
          onClick={() => handleTabChange('team')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'team'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
              : 'text-surface-400 hover:text-white hover:bg-surface-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Team Members ({project.members?.length || 1}/{project.teamSize})
        </button>

        {isOwner && (
          <button
            onClick={() => handleTabChange('applications')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'applications'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                : 'text-surface-400 hover:text-white hover:bg-surface-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Project Applications ({applications.filter((a) => a.status === 'Pending').length} Pending)
          </button>
        )}

        <button
          onClick={() => handleTabChange('showcase')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'showcase'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
              : 'text-surface-400 hover:text-white hover:bg-surface-800'
          }`}
        >
          <Award className="w-4 h-4" />
          Showcase & Reviews
        </button>
      </div>

      {/* TAB 1: KANBAN BOARD */}
      {activeTab === 'kanban' && (
        <KanbanBoard
          tasks={tasks}
          onStatusChange={handleStatusChange}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          onAddTask={handleAddTaskToColumn}
          isMember={true}
        />
      )}

      {/* TAB 2: LIVE CHAT */}
      {activeTab === 'chat' && (
        <ProjectChat projectId={project._id} projectName={project.title} />
      )}

      {/* TAB 3: TEAM & ROLES */}
      {activeTab === 'team' && (
        <div className="space-y-8">
          {/* Current Members Section */}
          <div className="rounded-2xl glass-card border border-surface-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-400" />
                  Active Team Members ({project.members?.length || 1} / {project.teamSize})
                </h3>
                <p className="text-xs text-surface-400 mt-0.5">
                  Manage member roles, assign technical leads, or coordinate responsibilities.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {project.members?.map((member, idx) => {
                const u = member.user || {};
                const isProjectOwnerUser = project.owner?._id === u._id || project.owner === u._id;

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-surface-900/80 border border-surface-800 flex items-start justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={
                          u.profileImage ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.name || 'Dev')}`
                        }
                        alt={u.name}
                        className="w-10 h-10 rounded-xl object-cover border border-surface-700 mt-0.5"
                      />
                      <div>
                        <Link
                          to={`/profile/${u._id}`}
                          className="text-xs font-bold text-white hover:text-brand-300"
                        >
                          {u.name}
                        </Link>
                        <p className="text-[11px] text-surface-400">{u.title || 'Engineer'}</p>

                        <div className="mt-2 flex flex-wrap gap-1">
                          {u.skills?.slice(0, 3).map((s, i) => (
                            <SkillBadge key={i} skill={s} size="xs" />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {isOwner && !isProjectOwnerUser ? (
                        <>
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                            className="px-2 py-1 rounded-lg bg-surface-950 border border-surface-700 text-brand-300 text-[11px] font-semibold focus:outline-hidden"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleRemoveMember(u._id)}
                            className="text-[11px] text-rose-400 hover:text-rose-300"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <span className="px-2 py-1 rounded-lg bg-brand-950/60 border border-brand-500/30 text-brand-300 text-[11px] font-semibold">
                          {member.role}
                        </span>
                      )}

                      {/* Peer review button if completed */}
                      {project.status === 'Completed' && u._id !== user._id && (
                        <button
                          onClick={() => {
                            setSelectedReviewee(u);
                            setReviewModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 mt-1"
                        >
                          <Star className="w-3 h-3" /> Rate Teammate
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Teammate Recommendations for Project Owner */}
          {isOwner && (
            <div className="rounded-2xl glass-card border border-surface-800 p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-400" />
                  Recommended Developers for This Project
                </h3>
                <p className="text-xs text-surface-400 mt-0.5">
                  Platform developers matching required skills who are currently available for collaboration.
                </p>
              </div>

              {teammateRecommendations.length === 0 ? (
                <p className="text-xs text-surface-500 italic">No developer recommendations found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {teammateRecommendations.slice(0, 6).map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-surface-900/80 border border-surface-800 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <MatchBadge
                            percentage={rec.matchPercentage}
                            explanation={rec.explanation}
                          />
                          <span className="text-[10px] text-surface-400 font-medium">
                            {rec.user?.availability}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 mb-2">
                          <img
                            src={
                              rec.user?.profileImage ||
                              `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(rec.user?.name || 'Dev')}`
                            }
                            alt={rec.user?.name}
                            className="w-8 h-8 rounded-lg object-cover border border-surface-700"
                          />
                          <div>
                            <Link
                              to={`/profile/${rec.user?._id}`}
                              className="text-xs font-bold text-white hover:text-brand-300"
                            >
                              {rec.user?.name}
                            </Link>
                            <p className="text-[10px] text-surface-400">{rec.user?.title}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {rec.matchedSkills?.map((s, i) => (
                            <SkillBadge key={i} skill={s} matched={true} size="xs" />
                          ))}
                        </div>
                      </div>

                      <Link
                        to={`/profile/${rec.user?._id}`}
                        className="w-full py-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-200 text-[11px] font-semibold text-center transition-colors"
                      >
                        View Developer Profile
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: APPLICATIONS MANAGEMENT (Owner Only) */}
      {activeTab === 'applications' && isOwner && (
        <div className="rounded-2xl glass-card border border-surface-800 p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand-400" />
              Applicant Review Queue
            </h3>
            <p className="text-xs text-surface-400 mt-0.5">
              Review messages and skills of applicants seeking to join your project.
            </p>
          </div>

          {applications.length === 0 ? (
            <p className="text-xs text-surface-500 italic py-6 text-center">
              No applications received for this project yet.
            </p>
          ) : (
            <div className="space-y-3 pt-2">
              {applications.map((app) => (
                <div
                  key={app._id}
                  className="p-4 rounded-xl bg-surface-900/90 border border-surface-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          app.applicant?.profileImage ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(app.applicant?.name || 'Dev')}`
                        }
                        alt={app.applicant?.name}
                        className="w-8 h-8 rounded-lg object-cover border border-surface-700"
                      />
                      <div>
                        <Link
                          to={`/profile/${app.applicant?._id}`}
                          className="text-xs font-bold text-white hover:text-brand-300"
                        >
                          {app.applicant?.name}
                        </Link>
                        <span className="text-[10px] text-surface-400 ml-2">
                          {app.applicant?.experienceLevel} • ★ {app.applicant?.ratingAverage || '5.0'}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          app.status === 'Accepted'
                            ? 'bg-emerald-950/60 text-emerald-300'
                            : app.status === 'Rejected'
                            ? 'bg-rose-950/60 text-rose-300'
                            : 'bg-amber-950/60 text-amber-300'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-surface-400">Target Role:</span>
                      <span className="font-semibold text-brand-300 bg-brand-950/40 border border-brand-500/20 px-2 py-0.5 rounded-md">
                        {app.requestedRole || 'Full Stack Developer'}
                      </span>
                    </div>

                    <p className="text-xs text-surface-300 leading-relaxed italic bg-surface-950/60 p-2.5 rounded-lg border border-surface-800">
                      "{app.message}"
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {app.relevantSkills?.map((s, i) => (
                        <SkillBadge key={i} skill={s} size="xs" />
                      ))}
                    </div>
                  </div>

                  {app.status === 'Pending' && (
                    <div className="flex items-center gap-2">
                      {project.currentTeamSize >= project.teamSize ? (
                        <span className="text-[11px] text-amber-400 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-xl">
                          Team Full
                        </span>
                      ) : (
                        <button
                          onClick={() =>
                            handleApplicationDecision(
                              app._id,
                              'Accepted',
                              app.requestedRole || 'Full Stack Developer'
                            )
                          }
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Accept Request
                        </button>
                      )}
                      <button
                        onClick={() => handleApplicationDecision(app._id, 'Rejected')}
                        className="px-3.5 py-1.5 rounded-xl bg-surface-800 hover:bg-rose-950/50 hover:text-rose-300 text-surface-300 text-xs font-semibold"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SHOWCASE & REVIEWS */}
      {activeTab === 'showcase' && (
        <div className="space-y-6">
          <div className="rounded-2xl glass-card border border-surface-800 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Project Completion & Public Showcase
            </h3>
            <p className="text-xs text-surface-400">
              When all tasks are complete, the project owner can publish this project into the
              public developer showcase.
            </p>

            {isOwner ? (
              <form onSubmit={handlePublishShowcase} className="space-y-4 max-w-xl pt-2">
                <div>
                  <label className="block text-xs font-semibold text-surface-200 mb-1">
                    Showcase Summary & Highlights
                  </label>
                  <textarea
                    rows="3"
                    value={showcaseSummary}
                    onChange={(e) => setShowcaseSummary(e.target.value)}
                    placeholder="Describe what was built, key milestones achieved, and technologies leveraged..."
                    className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-surface-200 mb-1">
                      Live Demo URL
                    </label>
                    <input
                      type="url"
                      value={showcaseDemoUrl}
                      onChange={(e) => setShowcaseDemoUrl(e.target.value)}
                      placeholder="https://myproject.app"
                      className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-200 mb-1">
                      GitHub Source URL
                    </label>
                    <input
                      type="url"
                      value={showcaseGithubUrl}
                      onChange={(e) => setShowcaseGithubUrl(e.target.value)}
                      placeholder="https://github.com/org/repo"
                      className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/30 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {project.status === 'Completed' ? 'Update Showcase' : 'Mark Completed & Publish to Showcase'}
                </button>
              </form>
            ) : (
              <div className="p-4 rounded-xl bg-surface-900/60 border border-surface-800 text-xs text-surface-400">
                {project.status === 'Completed'
                  ? 'This project is completed and published in the showcase!'
                  : 'Only the project owner can mark the project as completed and publish to the showcase.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task Create / Edit Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        initialStatus={newTaskStatus}
        projectMembers={project.members || []}
        onAddComment={handleAddComment}
      />

      {/* Peer Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={`Review Collaborator: ${selectedReviewee?.name}`}
      >
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <p className="text-xs text-surface-400 leading-relaxed">
            Rate your teammate across key collaboration factors to build their verified developer reputation.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-surface-300 mb-1">
                Communication (1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={reviewCategories.communication}
                onChange={(e) =>
                  setReviewCategories({ ...reviewCategories, communication: Number(e.target.value) })
                }
                className="w-full px-3 py-1.5 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-surface-300 mb-1">
                Technical Contribution (1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={reviewCategories.technical}
                onChange={(e) =>
                  setReviewCategories({ ...reviewCategories, technical: Number(e.target.value) })
                }
                className="w-full px-3 py-1.5 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-surface-300 mb-1">
                Reliability (1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={reviewCategories.reliability}
                onChange={(e) =>
                  setReviewCategories({ ...reviewCategories, reliability: Number(e.target.value) })
                }
                className="w-full px-3 py-1.5 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-surface-300 mb-1">
                Teamwork (1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={reviewCategories.teamwork}
                onChange={(e) =>
                  setReviewCategories({ ...reviewCategories, teamwork: Number(e.target.value) })
                }
                className="w-full px-3 py-1.5 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-200 mb-1">
              Overall Star Rating (1–5)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className={`p-2 rounded-lg text-lg ${
                    star <= reviewRating ? 'text-amber-400' : 'text-surface-600'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-200 mb-1">
              Feedback & Comments
            </label>
            <textarea
              rows="3"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Highlight their strengths, problem-solving ability, and teamwork..."
              className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setReviewModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-surface-800 text-surface-300 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md shadow-brand-600/30"
            >
              Submit Review
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectWorkspace;
