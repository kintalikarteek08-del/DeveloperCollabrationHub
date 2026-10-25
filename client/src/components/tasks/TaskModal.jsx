import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { Send, Clock, User, AlertCircle } from 'lucide-react';

const TaskModal = ({
  isOpen,
  onClose,
  onSave,
  task = null,
  initialStatus = 'TODO',
  projectMembers = [],
  onAddComment,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'Medium',
    status: initialStatus,
    deadline: '',
  });
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assignedTo: task.assignedTo?._id || task.assignedTo || '',
        priority: task.priority || 'Medium',
        status: task.status || initialStatus,
        deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'Medium',
        status: initialStatus,
        deadline: '',
      });
    }
    setError('');
  }, [task, initialStatus, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }
    onSave(formData);
  };

  const handleSendComment = (e) => {
    e.preventDefault();
    if (!commentText.trim() || !task?._id) return;
    onAddComment(task._id, commentText);
    setCommentText('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? 'Edit Task Details' : 'Create New Project Task'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-surface-200 mb-1">
            Task Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Design authentication modal and form validation"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-surface-200 mb-1">
            Description
          </label>
          <textarea
            rows="3"
            placeholder="Detailed instructions, requirements, and acceptance criteria..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-surface-200 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-200 text-xs focus:border-brand-500 focus:outline-hidden"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-surface-200 mb-1">
              Status Lane
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-200 text-xs focus:border-brand-500 focus:outline-hidden"
            >
              <option value="TODO">To Do</option>
              <option value="IN PROGRESS">In Progress</option>
              <option value="REVIEW">Review</option>
              <option value="DONE">Done</option>
            </select>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs font-semibold text-surface-200 mb-1">
              Target Deadline
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-200 text-xs focus:border-brand-500 focus:outline-hidden"
            >
            </input>
          </div>
        </div>

        {/* Assignee Selection */}
        <div>
          <label className="block text-xs font-semibold text-surface-200 mb-1">
            Assign To Team Member
          </label>
          <select
            value={formData.assignedTo}
            onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-200 text-xs focus:border-brand-500 focus:outline-hidden"
          >
            <option value="">Unassigned</option>
            {projectMembers.map((member) => {
              const u = member.user || member;
              return (
                <option key={u._id} value={u._id}>
                  {u.name} ({member.role || 'Member'})
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-surface-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/30 transition-all"
          >
            {task ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>

      {/* Task Comments Section (Only if editing existing task) */}
      {task && (
        <div className="mt-6 pt-5 border-t border-surface-800">
          <h4 className="text-xs font-semibold text-surface-200 mb-3 flex items-center gap-1.5">
            Activity & Discussion ({task.comments?.length || 0})
          </h4>

          <div className="space-y-2.5 max-h-48 overflow-y-auto mb-3 pr-1">
            {(!task.comments || task.comments.length === 0) && (
              <p className="text-xs text-surface-500 italic">No comments on this task yet.</p>
            )}
            {task.comments?.map((c, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-surface-800/50 border border-surface-700/50 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-surface-200">{c.user?.name || 'Teammate'}</span>
                  <span className="text-[10px] text-surface-500">
                    {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-surface-300 text-[11px] leading-relaxed">{c.text}</p>
              </div>
            ))}
          </div>

          {/* New Comment Input */}
          <form onSubmit={handleSendComment} className="flex gap-2">
            <input
              type="text"
              placeholder="Leave a comment or update on this task..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white transition-all shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </Modal>
  );
};

export default TaskModal;
