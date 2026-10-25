import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Sparkles, Globe, ArrowRight } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../components/common/SocialIcons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProfileImageUploader from '../components/common/ProfileImageUploader';

const EditProfile = () => {
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    title: user?.title || '',
    bio: user?.bio || '',
    location: user?.location || '',
    profileImage: user?.profileImage || '',
    skillsInput: (user?.skills || []).join(', '),
    interestsInput: (user?.interests || []).join(', '),
    experienceLevel: user?.experienceLevel || 'Intermediate',
    availability: user?.availability || 'Part-time',
    github: user?.github || '',
    linkedin: user?.linkedin || '',
    portfolio: user?.portfolio || '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const formattedSkills = formData.skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const formattedInterests = formData.interestsInput
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    try {
      const res = await api.put('/users/profile', {
        name: formData.name.trim(),
        title: formData.title.trim(),
        bio: formData.bio.trim(),
        location: formData.location.trim(),
        profileImage: formData.profileImage.trim(),
        skills: formattedSkills,
        interests: formattedInterests,
        experienceLevel: formData.experienceLevel,
        availability: formData.availability,
        github: formData.github.trim(),
        linkedin: formData.linkedin.trim(),
        portfolio: formData.portfolio.trim(),
      });

      if (res.data.success) {
        updateUserProfile(res.data.data);
        setSuccess('Profile updated successfully!');
        setTimeout(() => navigate(`/profile/${user._id}`), 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Code2 className="w-6 h-6 text-brand-400" />
          Edit Developer Profile & Skills
        </h1>
        <p className="text-xs text-surface-400 mt-1">
          Keep your skills and availability updated to receive accurate project recommendations.
        </p>
      </div>

      <div className="rounded-2xl glass border border-surface-800 p-6 sm:p-8 shadow-xl">
        {success && (
          <div className="p-3 mb-6 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
            {success}
          </div>
        )}
        {error && (
          <div className="p-3 mb-6 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Section */}
          <div className="pb-6 border-b border-surface-800">
            <ProfileImageUploader
              currentImage={formData.profileImage}
              userName={formData.name || user?.name}
              onChange={(newImage) => setFormData({ ...formData, profileImage: newImage })}
            />
          </div>

          {/* Name & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-200 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-200 mb-1">
                Professional Title
              </label>
              <input
                type="text"
                placeholder="e.g. Full Stack Engineer | React & Node.js"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-surface-200 mb-1">
              About / Bio
            </label>
            <textarea
              rows="3"
              placeholder="Tell other developers about your engineering journey, favorite stacks, and what kind of projects you want to build..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden resize-none leading-relaxed"
            />
          </div>

          {/* Skills (Comma-separated) */}
          <div>
            <label className="block text-xs font-semibold text-surface-200 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              Technical Skills (Comma separated) *
            </label>
            <input
              type="text"
              placeholder="e.g. React, Node.js, TypeScript, MongoDB, Python, Docker"
              value={formData.skillsInput}
              onChange={(e) => setFormData({ ...formData, skillsInput: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden"
            />
            <p className="text-[11px] text-surface-500 mt-1">
              Used by our transparent compatibility algorithm to calculate match scores on projects.
            </p>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-xs font-semibold text-surface-200 mb-1">
              Focus Areas & Interests (Comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. AI/ML, Web3, Distributed Systems, Cloud Architecture"
              value={formData.interestsInput}
              onChange={(e) => setFormData({ ...formData, interestsInput: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden"
            />
          </div>

          {/* Experience Level & Availability */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-surface-200 mb-1">
                Experience Level
              </label>
              <select
                value={formData.experienceLevel}
                onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-200 text-xs focus:border-brand-500 focus:outline-hidden"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-200 mb-1">
                Availability
              </label>
              <select
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-200 text-xs focus:border-brand-500 focus:outline-hidden"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Weekends">Weekends Only</option>
                <option value="Not Available">Not Available</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-200 mb-1">
                Location
              </label>
              <input
                type="text"
                placeholder="e.g. San Francisco, CA"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Social Profiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-surface-200 mb-1 flex items-center gap-1">
                <GithubIcon className="w-3.5 h-3.5" /> GitHub URL
              </label>
              <input
                type="url"
                placeholder="https://github.com/..."
                value={formData.github}
                onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-200 mb-1 flex items-center gap-1">
                <LinkedinIcon className="w-3.5 h-3.5" /> LinkedIn URL
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/..."
                value={formData.linkedin}
                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-200 mb-1 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Portfolio URL
              </label>
              <input
                type="url"
                placeholder="https://myportfolio.dev"
                value={formData.portfolio}
                onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-surface-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md shadow-brand-600/30 flex items-center gap-2"
            >
              {loading ? 'Saving...' : 'Save Profile Changes'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
