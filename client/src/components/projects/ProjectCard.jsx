import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import SkillBadge from '../common/SkillBadge';
import MatchBadge from '../common/MatchBadge';

const ProjectCard = ({ project }) => {
  const {
    _id,
    title,
    description,
    category,
    technologies = [],
    requiredSkills = [],
    teamSize = 4,
    currentTeamSize = 1,
    difficulty = 'Intermediate',
    status = 'Open',
    owner,
    deadline,
    skillMatch,
  } = project;

  const difficultyColors = {
    Beginner: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
    Intermediate: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/30',
    Advanced: 'text-rose-400 bg-rose-950/40 border-rose-500/30',
  };

  const statusColors = {
    Open: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
    'In Progress': 'text-amber-400 bg-amber-950/40 border-amber-500/30',
    Completed: 'text-sky-400 bg-sky-950/40 border-sky-500/30',
    Archived: 'text-surface-400 bg-surface-900 border-surface-700',
  };

  const isFull = currentTeamSize >= teamSize;

  return (
    <div className="flex flex-col justify-between rounded-2xl glass-card border border-surface-800 p-5 hover:border-brand-500/40 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-200 group">
      <div>
        {/* Header badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-950/50 text-brand-300 border border-brand-500/20">
            {category}
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                difficultyColors[difficulty] || difficultyColors.Intermediate
              }`}
            >
              {difficulty}
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                statusColors[status] || statusColors.Open
              }`}
            >
              {status}
            </span>
          </div>
        </div>

        {/* Title */}
        <Link to={`/projects/${_id}`}>
          <h3 className="text-base font-semibold text-surface-100 group-hover:text-brand-300 transition-colors line-clamp-1 mb-2">
            {title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-xs text-surface-400 line-clamp-2 leading-relaxed mb-4">
          {description}
        </p>

        {/* Skill Match Badge (if calculated) */}
        {skillMatch && (
          <div className="mb-3">
            <MatchBadge
              percentage={skillMatch.matchPercentage}
              explanation={skillMatch.explanation}
            />
          </div>
        )}

        {/* Technologies & Required Skills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {requiredSkills.slice(0, 4).map((req, idx) => {
            const skillName = typeof req === 'string' ? req : req.skill;
            return (
              <SkillBadge
                key={idx}
                skill={skillName}
                matched={skillMatch?.matchedSkills?.includes(skillName)}
              />
            );
          })}
          {requiredSkills.length > 4 && (
            <span className="px-2 py-0.5 text-xs text-surface-400 font-mono">
              +{requiredSkills.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-surface-800/80">
        <div className="flex items-center justify-between mb-3 text-xs text-surface-400">
          {/* Owner info */}
          <div className="flex items-center gap-2">
            <img
              src={
                owner?.profileImage ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(owner?.name || 'Dev')}`
              }
              alt={owner?.name}
              className="w-5 h-5 rounded-full object-cover border border-surface-700"
            />
            <span className="text-surface-300 truncate max-w-[100px]">{owner?.name || 'Owner'}</span>
          </div>

          {/* Team Capacity */}
          <div className="flex items-center gap-1.5 font-medium">
            <Users className="w-3.5 h-3.5 text-surface-400" />
            <span className={isFull ? 'text-rose-400' : 'text-surface-300'}>
              {currentTeamSize} / {teamSize}
            </span>
          </div>
        </div>

        {/* Action Link */}
        <Link
          to={`/projects/${_id}`}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-surface-800/80 hover:bg-brand-600 text-surface-200 hover:text-white text-xs font-semibold transition-all duration-150 shadow-xs"
        >
          View Project Details
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default ProjectCard;
