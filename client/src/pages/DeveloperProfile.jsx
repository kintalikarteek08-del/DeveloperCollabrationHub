import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Globe,
  Star,
  FolderGit2,
  Clock,
  Edit2,
  Camera,
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../components/common/SocialIcons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SkillBadge from '../components/common/SkillBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import ProfileImageUploader from '../components/common/ProfileImageUploader';

const DeveloperProfile = () => {
  const { id } = useParams();
  const { user: currentUser, updateUserProfile } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState('');
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState('');
  const [avatarError, setAvatarError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/${id}`);
        if (res.data.success) {
          setProfileData(res.data.data);
        }
      } catch (err) {
        console.error('[Profile Error]', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return <LoadingSpinner text="Loading developer profile..." size="lg" />;
  }

  if (!profileData) {
    return (
      <div className="max-w-md mx-auto py-16 text-center text-surface-400">
        <h2 className="text-lg font-bold text-white mb-2">Developer not found</h2>
        <Link to="/discover" className="text-xs text-brand-400 hover:underline">
          Return to directory
        </Link>
      </div>
    );
  }

  const { user, projects = [], completedProjectsCount, reviews = [] } = profileData;
  const isSelf = currentUser?._id === user._id;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Header Card */}
      <div className="rounded-3xl glass border border-surface-800 p-6 sm:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative group">
            <img
              src={
                user.profileImage ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`
              }
              alt={user.name}
              className="w-24 h-24 rounded-2xl object-cover border-2 border-surface-700 shadow-xl"
            />
            {isSelf && (
              <button
                type="button"
                onClick={() => {
                  setAvatarDraft(user.profileImage || '');
                  setAvatarError('');
                  setAvatarSuccess('');
                  setIsAvatarModalOpen(true);
                }}
                className="absolute inset-0 rounded-2xl bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer backdrop-blur-[2px]"
                title="Change Profile Picture"
              >
                <Camera className="w-5 h-5 mb-0.5 text-brand-300" />
                <span className="text-[10px] font-semibold">Change</span>
              </button>
            )}
            {isSelf && (
              <button
                type="button"
                onClick={() => {
                  setAvatarDraft(user.profileImage || '');
                  setAvatarError('');
                  setAvatarSuccess('');
                  setIsAvatarModalOpen(true);
                }}
                className="sm:hidden absolute -bottom-1 -right-1 p-1.5 rounded-full bg-brand-600 text-white shadow-md border border-surface-900"
                title="Change Profile Picture"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-1.5 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">{user.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-brand-950/60 border border-brand-500/30 text-brand-300">
                {user.role}
              </span>
            </div>

            <p className="text-sm font-medium text-brand-400">{user.title || 'Software Developer'}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-surface-400 pt-1">
              {user.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {user.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-brand-400" />
                Availability: {user.availability || 'Part-time'}
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {user.ratingAverage || '5.0'} ({reviews.length} reviews)
              </span>
            </div>
          </div>
        </div>

        {/* Social Links & Edit Button */}
        <div className="flex flex-col items-center sm:items-end gap-3">
          {isSelf && (
            <Link
              to="/profile/edit"
              className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-200 text-xs font-semibold border border-surface-700 flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Profile
            </Link>
          )}

          <div className="flex items-center gap-2">
            {user.github && (
              <a
                href={user.github}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-surface-900 border border-surface-800 hover:bg-surface-800 text-surface-300 hover:text-white transition-colors"
                title="GitHub"
              >
                <GithubIcon className="w-4 h-4" />
              </a>
            )}
            {user.linkedin && (
              <a
                href={user.linkedin}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-surface-900 border border-surface-800 hover:bg-surface-800 text-surface-300 hover:text-white transition-colors"
                title="LinkedIn"
              >
                <LinkedinIcon className="w-4 h-4" />
              </a>
            )}
            {user.portfolio && (
              <a
                href={user.portfolio}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-surface-900 border border-surface-800 hover:bg-surface-800 text-surface-300 hover:text-white transition-colors"
                title="Portfolio"
              >
                <Globe className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Bio & Skills | Projects & Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: About, Skills, Interests */}
        <div className="space-y-6">
          {/* Bio */}
          <div className="rounded-2xl glass-card border border-surface-800 p-6 space-y-3">
            <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider">About</h3>
            <p className="text-xs text-surface-300 leading-relaxed whitespace-pre-line">
              {user.bio || 'No developer bio provided yet.'}
            </p>
          </div>

          {/* Technical Skills */}
          <div className="rounded-2xl glass-card border border-surface-800 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider">
                Technical Skills ({user.skills?.length || 0})
              </h3>
              <span className="text-[11px] font-semibold text-brand-400">
                {user.experienceLevel || 'Intermediate'}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {user.skills?.map((skill, idx) => (
                <SkillBadge key={idx} skill={skill} size="sm" />
              ))}
            </div>
          </div>

          {/* Interests */}
          {user.interests && user.interests.length > 0 && (
            <div className="rounded-2xl glass-card border border-surface-800 p-6 space-y-3">
              <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider">
                Focus Areas & Interests
              </h3>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {user.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-surface-900 border border-surface-800 text-surface-300"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 2 Cols: Completed Showcase Projects & Peer Reviews */}
        <div className="lg:col-span-2 space-y-6">
          {/* Completed Projects Portfolio */}
          <div className="rounded-2xl glass-card border border-surface-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-brand-400" />
                Completed Projects Portfolio ({completedProjectsCount})
              </h3>
            </div>

            {projects.filter((p) => p.status === 'Completed').length === 0 ? (
              <p className="text-xs text-surface-500 italic py-4">
                No completed showcase projects yet.
              </p>
            ) : (
              <div className="space-y-3 pt-1">
                {projects
                  .filter((p) => p.status === 'Completed')
                  .map((p) => (
                    <div
                      key={p._id}
                      className="p-4 rounded-xl bg-surface-900/90 border border-surface-800 flex items-center justify-between gap-3"
                    >
                      <div>
                        <span className="text-[10px] font-semibold text-brand-300 uppercase tracking-wider">
                          {p.category}
                        </span>
                        <Link
                          to={`/projects/${p._id}`}
                          className="text-xs font-bold text-white hover:text-brand-300 transition-colors block"
                        >
                          {p.title}
                        </Link>
                      </div>
                      <Link
                        to={`/projects/${p._id}`}
                        className="px-3 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-200 text-xs font-semibold transition-colors"
                      >
                        View Project
                      </Link>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Collaborator Reviews & Ratings */}
          <div className="rounded-2xl glass-card border border-surface-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                Collaborator Peer Reviews ({reviews.length})
              </h3>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-surface-500 italic py-4">
                No peer evaluations recorded yet. Reviews are submitted upon project completion.
              </p>
            ) : (
              <div className="space-y-4 pt-1">
                {reviews.map((r) => (
                  <div
                    key={r._id}
                    className="p-4 rounded-xl bg-surface-900/80 border border-surface-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            r.reviewer?.profileImage ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(r.reviewer?.name || 'Dev')}`
                          }
                          alt={r.reviewer?.name}
                          className="w-7 h-7 rounded-lg object-cover border border-surface-700"
                        />
                        <div>
                          <p className="text-xs font-semibold text-white">{r.reviewer?.name}</p>
                          <p className="text-[10px] text-surface-500">
                            Project: {r.project?.title}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                        ★ {r.rating} / 5
                      </div>
                    </div>

                    {r.comment && (
                      <p className="text-xs text-surface-300 leading-relaxed italic bg-surface-950/60 p-2.5 rounded-lg border border-surface-800/80">
                        "{r.comment}"
                      </p>
                    )}

                    <div className="grid grid-cols-4 gap-2 text-[10px] text-surface-400 pt-1">
                      <div>Comm: {r.categories?.communication || 5}/5</div>
                      <div>Tech: {r.categories?.technical || 5}/5</div>
                      <div>Reliability: {r.categories?.reliability || 5}/5</div>
                      <div>Teamwork: {r.categories?.teamwork || 5}/5</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for quick profile picture update */}
      {isSelf && (
        <Modal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          title="Update Profile Picture"
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            {avatarSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
                {avatarSuccess}
              </div>
            )}
            {avatarError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {avatarError}
              </div>
            )}

            <ProfileImageUploader
              currentImage={avatarDraft}
              userName={user.name}
              onChange={(newUrl) => setAvatarDraft(newUrl)}
            />

            <div className="pt-4 border-t border-surface-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingAvatar}
                onClick={async () => {
                  try {
                    setIsSavingAvatar(true);
                    setAvatarError('');
                    const res = await api.put('/users/profile', {
                      profileImage: avatarDraft.trim(),
                    });
                    if (res.data.success) {
                      updateUserProfile(res.data.data);
                      setProfileData((prev) => ({
                        ...prev,
                        user: { ...prev.user, profileImage: res.data.data.profileImage },
                      }));
                      setAvatarSuccess('Profile picture updated successfully!');
                      setTimeout(() => {
                        setIsAvatarModalOpen(false);
                        setAvatarSuccess('');
                      }, 700);
                    }
                  } catch (err) {
                    setAvatarError(
                      err.response?.data?.message || 'Failed to update profile picture'
                    );
                  } finally {
                    setIsSavingAvatar(false);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-brand-600/30 transition-all flex items-center gap-1.5"
              >
                {isSavingAvatar ? 'Saving...' : 'Save & Apply'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DeveloperProfile;
