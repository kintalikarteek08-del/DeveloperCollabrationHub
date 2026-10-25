import React from 'react';
import { Clock, MessageSquare, AlertCircle, Trash2, Edit2 } from 'lucide-react';

const TaskCard = ({ task, onEdit, onDelete, onStatusChange, isMember }) => {
  const { _id, title, description, priority, status, deadline, assignedTo, comments = [] } = task;

  const priorityColors = {
    Low: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20',
    Medium: 'text-sky-400 bg-sky-950/40 border-sky-500/20',
    High: 'text-amber-400 bg-amber-950/40 border-amber-500/20',
    Critical: 'text-rose-400 bg-rose-950/40 border-rose-500/20 animate-pulse',
  };

  const isOverdue = deadline && new Date(deadline) < new Date() && status !== 'DONE';

  const handleDragStart = (e) => {
    e.dataTransfer.setData('taskId', _id);
  };

  return (
    <div
      draggable={isMember}
      onDragStart={handleDragStart}
      className="p-3.5 rounded-xl bg-surface-900/90 border border-surface-800 hover:border-surface-700 shadow-sm cursor-grab active:cursor-grabbing transition-all group"
    >
      {/* Header: Priority & Quick Actions */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
            priorityColors[priority] || priorityColors.Medium
          }`}
        >
          {priority}
        </span>

        {isMember && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(task)}
              className="p-1 rounded hover:bg-surface-800 text-surface-400 hover:text-surface-200"
              title="Edit Task"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDelete(_id)}
              className="p-1 rounded hover:bg-surface-800 text-rose-400"
              title="Delete Task"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Title */}
      <h4 className="text-xs font-semibold text-surface-100 line-clamp-2 leading-relaxed mb-1.5">
        {title}
      </h4>

      {/* Description */}
      {description && (
        <p className="text-[11px] text-surface-400 line-clamp-2 leading-normal mb-3">
          {description}
        </p>
      )}

      {/* Footer: Assignee & Meta */}
      <div className="flex items-center justify-between text-[11px] text-surface-400 pt-2 border-t border-surface-800/60">
        {/* Assignee */}
        <div className="flex items-center gap-1.5">
          {assignedTo ? (
            <>
              <img
                src={
                  assignedTo.profileImage ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(assignedTo.name)}`
                }
                alt={assignedTo.name}
                className="w-5 h-5 rounded-full object-cover border border-surface-700"
              />
              <span className="text-surface-300 truncate max-w-[80px]">{assignedTo.name}</span>
            </>
          ) : (
            <span className="text-surface-500 italic">Unassigned</span>
          )}
        </div>

        {/* Deadline and Comments */}
        <div className="flex items-center gap-2">
          {comments.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-surface-400">
              <MessageSquare className="w-3 h-3" />
              {comments.length}
            </span>
          )}
          {deadline && (
            <span
              className={`flex items-center gap-1 text-[10px] ${
                isOverdue ? 'text-rose-400 font-semibold' : 'text-surface-400'
              }`}
            >
              <Clock className="w-3 h-3" />
              {new Date(deadline).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
