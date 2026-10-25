import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  Sparkles,
  Kanban,
  CheckCircle2,
  ExternalLink,
  Globe,
  Share2,
  Send,
  ShieldCheck,
  AlertCircle,
  Flag,
  Clock,
  XCircle,
  UserCheck,
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../components/common/SocialIcons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SkillBadge from '../components/common/SkillBadge';
import MatchBadge from '../components/common/MatchBadge';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProjectDetails = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [requestedRole, setRequestedRole] = useState('Full Stack Developer');
  const [relevantSkillsInput, setRelevantSkillsInput] = useState('');
  const [experienceText, setExperienceText] = useState('');
  const [applyMessage, setApplyMessage] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);

  const fetchApplications = async () => {
    if (!id) return;
    setLoadingApps(true);
    try {
      const res = await api.get(`/applications/project/${id}`);
      if (res.data.success) {
        setApplications(res.data.data);
      }
    } catch (err) {
      console.error('[ProjectDetails Applications Error]', err);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleAcceptApplication = async (appId, role) => {
    setActionError('');
    try {
      const res = await api.put(`/applications/${appId}`, {
        status: 'Accepted',
        role: role || 'Full Stack Developer',
      });
      if (res.data.success) {
        setActionSuccess('Join request accepted! Member added to your team.');
        const projRes = await api.get(`/projects/${id}`);
        if (projRes.data.success) {
          setProject(projRes.data.data);
        }
        setApplications((prev) =>
          prev.map((a) => (a._id === appId ? { ...a, status: 'Accepted' } : a))
        );
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to accept application.');
    }
  };

  const handleRejectApplication = async (appId) => {
    setActionError('');
    try {
      const res = await api.put(`/applications/${appId}`, {
        status: 'Rejected',
      });
      if (res.data.success) {
        setActionSuccess('Join request rejected.');
        setApplications((prev) =>
          prev.map((a) => (a._id === appId ? { ...a, status: 'Rejected' } : a))
        );
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to reject application.');
    }
  };

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const res = await api.get(`/projects/${id}`);
        if (res.data.success) {
          setProject(res.data.data);
          if (res.data.data.rolesRequired?.length > 0) {
            setRequestedRole(res.data.data.rolesRequired[0]);
          }
          if (res.data.data.isOwner) {
            fetchApplications();
          }
        }
      } catch (err) {
        console.error('[ProjectDetails Error]', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [id]);

  useEffect(() => {
    if (user?.skills?.length) {
      setRelevantSkillsInput(user.skills.join(', '));
    }
    if (user?.experienceLevel) {
      setExperienceText(user.experienceLevel);
    }
  }, [user]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!applyMessage.trim()) return;

    setSubmitting(true);
    setActionError('');
    try {
      const skillsArr = relevantSkillsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const finalMessage = experienceText.trim()
        ? `${applyMessage.trim()}\n\nExperience: ${experienceText.trim()}`
        : applyMessage.trim();

      const res = await api.post('/applications', {
        projectId: id,
        requestedRole: requestedRole.trim() || 'Full Stack Developer',
        message: finalMessage,
        relevantSkills: skillsArr.length > 0 ? skillsArr : user?.skills || [],
      });
      if (res.data.success) {
        setActionSuccess('Join request submitted successfully! The project owner has been notified.');
        setApplyModalOpen(false);
        setApplyMessage('');
        setProject((prev) => ({
          ...prev,
          userApplication: res.data.data,
        }));
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;

    setSubmitting(true);
    try {
      await api.post('/admin/reports', {
        targetType: 'project',
        targetId: project._id,
        targetName: project.title,
        reason: reportReason,
        description: 'User-flagged project content.',
      });
      setActionSuccess('Report submitted to platform moderators.');
      setReportModalOpen(false);
      setReportReason('');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to report project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setActionSuccess('Project link copied to clipboard!');
    setTimeout(() => setActionSuccess(''), 3000);
  };

  if (loading) {
    return <LoadingSpinner text="Loading project details..." size="lg" />;
  }

  if (!project) {
    return (
      <div className="max-w-md mx-auto py-16 text-center text-surface-400">
        <h2 className="text-lg font-bold text-white mb-2">Project not found</h2>
        <p className="text-xs mb-4">This project may have been removed or archived.</p>
        <Link to="/discover" className="text-xs text-brand-400 hover:underline">
          Return to Discover
        </Link>
      </div>
    );
  }

  const isOwner = project.isOwner;
  const isMember = project.isMember;
  const isFull = project.currentTeamSize >= project.teamSize;
  const isOpen = project.status === 'Open';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Alert Banner */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess('')} className="font-bold ml-2">
            ✕
          </button>
        </div>
      )}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="rounded-3xl glass border border-surface-800 p-6 sm:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-950/60 text-brand-300 border border-brand-500/30">
              {project.category}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-surface-900 border border-surface-700 text-surface-300">
              Difficulty: {project.difficulty}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                project.status === 'Open'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300'
              }`}
            >
              Status: {project.status}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-brand-950/40 border border-brand-500/30 text-brand-300">
              {project.teamSize - project.currentTeamSize > 0
                ? `${project.teamSize - project.currentTeamSize} available positions`
                : 'Team Full'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {project.title}
          </h1>

          <p className="text-xs sm:text-sm text-surface-300 leading-relaxed whitespace-pre-line">
            {project.description}
          </p>

          {/* Transparent Skill Match Badge */}
          {project.userSkillMatch && (
            <div className="pt-2">
              <MatchBadge
                percentage={project.userSkillMatch.matchPercentage}
                explanation={project.userSkillMatch.explanation}
              />
              <p className="text-[11px] text-surface-400 mt-1">
                {project.userSkillMatch.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Action Callouts */}
        <div className="flex flex-col gap-3 min-w-[200px]">
          {isMember || isOwner ? (
            <Link
              to={`/projects/${project._id}/workspace`}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <Kanban className="w-4 h-4" />
              Enter Team Workspace
            </Link>
          ) : project.userApplication?.status === 'Pending' ? (
            <div className="w-full py-2.5 px-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 shadow-xs">
              <Clock className="w-4 h-4 text-amber-400" />
              Request Pending
            </div>
          ) : project.userApplication?.status === 'Accepted' ? (
            <Link
              to={`/projects/${project._id}/workspace`}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <Kanban className="w-4 h-4" />
              Open Team Workspace
            </Link>
          ) : project.userApplication?.status === 'Rejected' ? (
            <div className="space-y-1.5">
              <div className="w-full py-2.5 px-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 font-semibold text-xs flex items-center justify-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400" />
                Application Rejected
              </div>
              <Link
                to="/my-applications"
                className="block text-center text-[11px] text-surface-400 hover:text-white"
              >
                View in My Applications →
              </Link>
            </div>
          ) : isAuthenticated && isOpen && !isFull ? (
            <button
              onClick={() => setApplyModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-md shadow-brand-600/30 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Request to Join
            </button>
          ) : !isAuthenticated ? (
            <Link
              to="/login"
              className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs text-center shadow-md shadow-brand-600/30"
            >
              Sign In to Apply
            </Link>
          ) : (
            <div className="py-2.5 px-4 rounded-xl bg-surface-900 border border-surface-800 text-surface-400 text-xs text-center font-medium">
              {isFull ? 'Team at Full Capacity' : `Project ${project.status}`}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 py-2 px-3 rounded-xl bg-surface-900 border border-surface-800 hover:bg-surface-800 text-surface-300 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
            <button
              onClick={() => setReportModalOpen(true)}
              className="p-2 rounded-xl bg-surface-900 border border-surface-800 hover:bg-surface-800 text-surface-400 hover:text-rose-400 transition-colors"
              title="Report Project"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Required Skills & Team Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Requirements & Tech Stack */}
        <div className="lg:col-span-2 space-y-6">
          {/* Owner Project Join Requests Management Section */}
          {isOwner && (
            <div className="rounded-2xl glass-card border border-brand-500/30 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-surface-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-brand-400" />
                    Incoming Join Requests ({applications.filter((a) => a.status === 'Pending').length} Pending)
                  </h3>
                  <p className="text-xs text-surface-400 mt-0.5">
                    Review and accept join requests from developers seeking to collaborate on this project.
                  </p>
                </div>
                <Link
                  to={`/projects/${project._id}/workspace?tab=applications`}
                  className="text-xs text-brand-400 hover:text-brand-300 font-semibold transition-colors"
                >
                  Manage in Workspace →
                </Link>
              </div>

              {loadingApps ? (
                <p className="text-xs text-surface-400 py-3 italic">Loading join requests...</p>
              ) : applications.length === 0 ? (
                <p className="text-xs text-surface-500 italic py-3 text-center">
                  No join requests received yet.
                </p>
              ) : (
                <div className="space-y-3 pt-1">
                  {applications.map((app) => (
                    <div
                      key={app._id}
                      className="p-4 rounded-xl bg-surface-900/90 border border-surface-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 max-w-xl">
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
                              className="text-xs font-bold text-white hover:text-brand-300 transition-colors"
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

                        {app.message && (
                          <p className="text-xs text-surface-300 leading-relaxed italic bg-surface-950/60 p-2.5 rounded-lg border border-surface-800">
                            "{app.message}"
                          </p>
                        )}

                        {app.relevantSkills?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {app.relevantSkills.map((s, i) => (
                              <SkillBadge key={i} skill={s} size="xs" />
                            ))}
                          </div>
                        )}
                      </div>

                      {app.status === 'Pending' ? (
                        <div className="flex items-center gap-2 shrink-0">
                          {project.currentTeamSize >= project.teamSize ? (
                            <span className="text-[11px] text-amber-400 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-xl font-medium">
                              Team Full
                            </span>
                          ) : (
                            <button
                              onClick={() =>
                                handleAcceptApplication(
                                  app._id,
                                  app.requestedRole || 'Full Stack Developer'
                                )
                              }
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Accept Request
                            </button>
                          )}
                          <button
                            onClick={() => handleRejectApplication(app._id)}
                            className="px-3 py-1.5 rounded-xl bg-surface-800 hover:bg-rose-950/40 hover:text-rose-300 text-surface-400 text-xs font-medium border border-surface-700 transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-surface-400 shrink-0 italic">
                          Decision recorded
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Required Skills with Weights */}
          <div className="rounded-2xl glass-card border border-surface-800 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              Required Skills & Compatibility Weighting
            </h3>
            <p className="text-xs text-surface-400">
              The project owner defined these competencies for team assembly.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {project.requiredSkills.map((req, idx) => {
                const isMatched = project.userSkillMatch?.matchedSkills?.includes(req.skill);
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      isMatched
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                        : 'bg-surface-900/60 border-surface-800 text-surface-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      <span className="font-semibold">{req.skill}</span>
                    </div>
                    <span className="text-[11px] font-mono text-surface-400">
                      {req.weight}% weight
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Technologies Stack */}
          <div className="rounded-2xl glass-card border border-surface-800 p-6 space-y-3">
            <h3 className="text-sm font-bold text-white">Full Technology Stack</h3>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((t, idx) => (
                <SkillBadge key={idx} skill={t} size="md" />
              ))}
            </div>
          </div>

          {/* Roles Required for the Project */}
          {project.rolesRequired && project.rolesRequired.length > 0 && (
            <div className="rounded-2xl glass-card border border-surface-800 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-400" />
                  Roles Required for Project
                </h3>
                <span className="text-xs font-semibold text-brand-400">
                  {project.rolesRequired.length} Open Profiles
                </span>
              </div>
              <p className="text-xs text-surface-400">
                The project owner is actively searching for contributors to fill these positions:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {project.rolesRequired.map((role, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-950/60 border border-brand-500/30 text-brand-300 shadow-xs"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Completed Project Showcase Details (if published) */}
          {project.showcase?.isPublished && (
            <div className="rounded-2xl glass-card border border-emerald-500/30 bg-emerald-950/10 p-6 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Published Public Showcase
              </div>
              <p className="text-xs text-surface-300 leading-relaxed">
                {project.showcase.summary}
              </p>
              <div className="flex items-center gap-3 pt-2">
                {project.showcase.demoUrl && (
                  <a
                    href={project.showcase.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Live Demo
                  </a>
                )}
                {project.showcase.githubUrl && (
                  <a
                    href={project.showcase.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-200 text-xs font-semibold border border-surface-700"
                  >
                    <GithubIcon className="w-3.5 h-3.5" />
                    GitHub Source
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Team Roster & Owner Card */}
        <div className="space-y-6">
          {/* Owner Profile Card */}
          <div className="rounded-2xl glass-card border border-surface-800 p-6 space-y-4">
            <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider">
              Project Creator
            </h3>

            <div className="flex items-center gap-3">
              <img
                src={
                  project.owner?.profileImage ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(project.owner?.name || 'Dev')}`
                }
                alt={project.owner?.name}
                className="w-12 h-12 rounded-xl object-cover border border-surface-700"
              />
              <div>
                <Link
                  to={`/profile/${project.owner?._id}`}
                  className="text-sm font-bold text-white hover:text-brand-300 transition-colors"
                >
                  {project.owner?.name}
                </Link>
                <p className="text-xs text-surface-400">{project.owner?.title || 'Engineer'}</p>
                <p className="text-[11px] text-amber-400 mt-0.5">
                  ★ {project.owner?.ratingAverage || '5.0'} ({project.owner?.ratingCount || 0} reviews)
                </p>
              </div>
            </div>
          </div>

          {/* Team Members List */}
          <div className="rounded-2xl glass-card border border-surface-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider">
                Team Roster
              </h3>
              <div className="text-right">
                <span className="text-xs font-semibold text-brand-300 block">
                  {project.currentTeamSize} / {project.teamSize} Members
                </span>
                <span className="text-[10px] text-surface-400">
                  {Math.max(0, project.teamSize - project.currentTeamSize)} spots open
                </span>
              </div>
            </div>

            <div className="space-y-3 divide-y divide-surface-800/60">
              {project.members.map((member, idx) => (
                <div key={idx} className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={
                        member.user?.profileImage ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(member.user?.name || 'Dev')}`
                      }
                      alt={member.user?.name}
                      className="w-8 h-8 rounded-lg object-cover border border-surface-700"
                    />
                    <div>
                      <Link
                        to={`/profile/${member.user?._id}`}
                        className="text-xs font-semibold text-surface-200 hover:text-white"
                      >
                        {member.user?.name}
                      </Link>
                      <p className="text-[10px] text-brand-400">{member.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Apply to Join Modal */}
      <Modal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title={`Request to Join: ${project.title}`}
      >
        <form onSubmit={handleApply} className="space-y-4">
          <p className="text-xs text-surface-300 leading-relaxed">
            Submit your application to the project owner explaining how you can contribute to the team.
          </p>

          {/* Requested Role */}
          <div>
            <label className="block text-xs font-semibold text-surface-200 mb-1">
              Role You Want to Contribute To *
            </label>
            {project.rolesRequired && project.rolesRequired.length > 0 ? (
              <select
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden"
              >
                {project.rolesRequired.map((role, idx) => (
                  <option key={idx} value={role}>
                    {role} (Project Needed)
                  </option>
                ))}
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="ML Engineer">ML Engineer</option>
                <option value="UI/UX Designer">UI/UX Designer</option>
                <option value="DevOps">DevOps</option>
                <option value="Tester">Tester</option>
              </select>
            ) : (
              <input
                type="text"
                required
                placeholder="e.g. Frontend Developer, ML Engineer, UI/UX Designer"
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden"
              />
            )}
          </div>

          {/* Relevant Skills */}
          <div>
            <label className="block text-xs font-semibold text-surface-200 mb-1">
              Relevant Skills (Comma separated) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. React, Node.js, Python, PyTorch, Tailwind CSS"
              value={relevantSkillsInput}
              onChange={(e) => setRelevantSkillsInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden"
            />
          </div>

          {/* Relevant Experience */}
          <div>
            <label className="block text-xs font-semibold text-surface-200 mb-1">
              Relevant Experience / Level
            </label>
            <input
              type="text"
              placeholder="e.g. 2 years building full-stack applications, Intermediate, etc."
              value={experienceText}
              onChange={(e) => setExperienceText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden"
            />
          </div>

          {/* Application Message */}
          <div>
            <label className="block text-xs font-semibold text-surface-200 mb-1">
              Application Message (How you can help) *
            </label>
            <textarea
              rows="4"
              required
              placeholder="Explain how you can help this project succeed, your availability, and why you are excited to collaborate..."
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden resize-none leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-800">
            <button
              type="button"
              onClick={() => setApplyModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !applyMessage.trim()}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-brand-600/30 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Submitting...' : 'Submit Join Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Report Modal */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Report Project Content"
      >
        <form onSubmit={handleReport} className="space-y-4">
          <p className="text-xs text-surface-400">
            Platform administrators will inspect this project for guidelines and safety compliance.
          </p>
          <div>
            <label className="block text-xs font-semibold text-surface-200 mb-1">
              Reason for Report *
            </label>
            <textarea
              rows="3"
              required
              placeholder="Describe the issue or policy concern..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReportModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !reportReason.trim()}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
            >
              Submit Report
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectDetails;
