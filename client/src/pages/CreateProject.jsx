import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Sparkles, FolderGit2, ArrowRight } from 'lucide-react';
import api from '../services/api';

const CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'AI/ML',
  'Data Science',
  'Cybersecurity',
  'IoT',
  'Cloud',
  'Blockchain',
  'UI/UX',
  'Other',
];

const CreateProject = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Web Development',
    difficulty: 'Intermediate',
    teamSize: 4,
    deadline: '',
    technologiesInput: '',
    rolesRequiredInput: 'Frontend Developer, Backend Developer',
    requiredSkills: [
      { skill: 'React', weight: 40 },
      { skill: 'Node.js', weight: 35 },
      { skill: 'MongoDB', weight: 25 },
    ],
  });

  const handleAddSkill = () => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: [...prev.requiredSkills, { skill: '', weight: 20 }],
    }));
  };

  const handleRemoveSkill = (index) => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((_, i) => i !== index),
    }));
  };

  const handleSkillChange = (index, field, value) => {
    const updated = [...formData.requiredSkills];
    updated[index][field] = field === 'weight' ? Number(value) : value;
    setFormData((prev) => ({ ...prev, requiredSkills: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Please provide project title and description');
      return;
    }

    const cleanedSkills = formData.requiredSkills
      .filter((s) => s.skill.trim())
      .map((s) => ({ skill: s.skill.trim(), weight: s.weight || 20 }));

    if (cleanedSkills.length === 0) {
      setError('Please specify at least one required skill');
      return;
    }

    const cleanedTechs = formData.technologiesInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const cleanedRoles = formData.rolesRequiredInput
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      const res = await api.post('/projects', {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        difficulty: formData.difficulty,
        teamSize: Number(formData.teamSize),
        deadline: formData.deadline || null,
        technologies: cleanedTechs,
        rolesRequired: cleanedRoles,
        requiredSkills: cleanedSkills,
      });

      if (res.data.success) {
        navigate(`/projects/${res.data.data._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <FolderGit2 className="w-6 h-6 text-brand-400" />
          Create Software Project Idea
        </h1>
        <p className="text-xs text-surface-400 mt-1">
          Define your project scope, specify required tech competencies with weights, and recruit contributors.
        </p>
      </div>

      <div className="rounded-2xl glass border border-surface-800 p-6 sm:p-8 shadow-xl">
        {error && (
          <div className="p-3 mb-6 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-surface-200 mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AI-Powered Healthcare Diagnostics Platform"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-surface-200 mb-1">
              Detailed Description *
            </label>
            <textarea
              rows="4"
              required
              placeholder="Explain the problem you are solving, system architecture, planned milestones, and what collaborators will learn..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden resize-none leading-relaxed"
            />
          </div>

          {/* Category, Difficulty, Team Size */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-surface-200 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-200 text-xs focus:border-brand-500 focus:outline-hidden"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-200 mb-1">
                Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-200 text-xs focus:border-brand-500 focus:outline-hidden"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-200 mb-1">
                Team Size Capacity
              </label>
              <input
                type="number"
                min="2"
                max="20"
                required
                value={formData.teamSize}
                onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Technologies comma list */}
          <div>
            <label className="block text-xs font-semibold text-surface-200 mb-1">
              Technology Stack (Comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. React, Node.js, Express, MongoDB, TailwindCSS, Docker"
              value={formData.technologiesInput}
              onChange={(e) => setFormData({ ...formData, technologiesInput: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden"
            />
          </div>

          {/* Roles Required for the project */}
          <div>
            <label className="block text-xs font-semibold text-surface-200 mb-1">
              Roles Required for the Project (Comma separated) *
            </label>
            <input
              type="text"
              placeholder="e.g. Frontend Developer, Backend Developer, ML Engineer, UI/UX Designer"
              value={formData.rolesRequiredInput}
              onChange={(e) => setFormData({ ...formData, rolesRequiredInput: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden"
            />
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-surface-500">Quick add:</span>
              {[
                'Frontend Developer',
                'Backend Developer',
                'Full Stack Developer',
                'ML Engineer',
                'UI/UX Designer',
                'DevOps',
                'Tester',
              ].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    const current = formData.rolesRequiredInput
                      .split(',')
                      .map((r) => r.trim())
                      .filter(Boolean);
                    if (!current.includes(role)) {
                      setFormData({
                        ...formData,
                        rolesRequiredInput: current.concat(role).join(', '),
                      });
                    }
                  }}
                  className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-white border border-surface-700 transition-colors"
                >
                  + {role}
                </button>
              ))}
            </div>
          </div>

          {/* Required Skills & Weights Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-surface-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                Required Skills & Match Weights (%)
              </label>
              <button
                type="button"
                onClick={handleAddSkill}
                className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Skill
              </button>
            </div>

            <div className="space-y-2">
              {formData.requiredSkills.map((req, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Skill name (e.g. React)"
                    value={req.skill}
                    onChange={(e) => handleSkillChange(idx, 'skill', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden"
                  />
                  <div className="w-28 flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={req.weight}
                      onChange={(e) => handleSkillChange(idx, 'weight', e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden text-center"
                    />
                    <span className="text-xs text-surface-400">%</span>
                  </div>
                  {formData.requiredSkills.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(idx)}
                      className="p-2 rounded-lg text-surface-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs font-semibold text-surface-200 mb-1">
              Target Deadline (Optional)
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full sm:w-64 px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-200 text-xs focus:border-brand-500 focus:outline-hidden"
            />
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-surface-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md shadow-brand-600/30 flex items-center gap-2"
            >
              {loading ? 'Creating...' : 'Create & Launch Project'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;
