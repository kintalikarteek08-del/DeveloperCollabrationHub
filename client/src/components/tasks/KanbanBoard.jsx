import React, { useState } from 'react';
import { Plus, CheckCircle, Clock, PlayCircle, Eye } from 'lucide-react';
import TaskCard from './TaskCard';

const COLUMNS = [
  { id: 'TODO', title: 'To Do', icon: Clock, color: 'text-sky-400', border: 'border-sky-500/20' },
  { id: 'IN PROGRESS', title: 'In Progress', icon: PlayCircle, color: 'text-amber-400', border: 'border-amber-500/20' },
  { id: 'REVIEW', title: 'Review', icon: Eye, color: 'text-indigo-400', border: 'border-indigo-500/20' },
  { id: 'DONE', title: 'Completed', icon: CheckCircle, color: 'text-emerald-400', border: 'border-emerald-500/20' },
];

const KanbanBoard = ({ tasks = [], onStatusChange, onEditTask, onDeleteTask, onAddTask, isMember }) => {
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onStatusChange(taskId, targetStatus);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const Icon = col.icon;
        const columnTasks = tasks.filter((t) => t.status === col.id);
        const isDraggingOver = dragOverColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col rounded-2xl glass border p-3 min-h-[480px] transition-all ${
              col.border
            } ${isDraggingOver ? 'bg-surface-800/60 ring-2 ring-brand-500/50 scale-[1.01]' : 'bg-surface-950/40'}`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-800">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${col.color}`} />
                <h3 className="text-xs font-bold text-surface-200 uppercase tracking-wider">
                  {col.title}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-800 text-surface-400">
                  {columnTasks.length}
                </span>
              </div>

              {isMember && (
                <button
                  onClick={() => onAddTask(col.id)}
                  className="p-1 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
                  title={`Add Task to ${col.title}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Task list container */}
            <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-[620px] pr-0.5">
              {columnTasks.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-6 border-2 border-dashed border-surface-800/60 rounded-xl text-center">
                  <p className="text-[11px] text-surface-500">
                    {isDraggingOver ? 'Drop task here' : 'No tasks in this lane'}
                  </p>
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onStatusChange={onStatusChange}
                    isMember={isMember}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
