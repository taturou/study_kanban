import React, { useRef } from 'react';
import { Task, TaskStatus } from '../types';
import { Clock, CheckCircle2, PlayCircle, AlertCircle, Calendar } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  index: number;
  isDragging: boolean;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, task: Task, index: number) => void;
  onDragEnd: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  index, 
  isDragging, 
  onClick, 
  onDragStart, 
  onDragEnd
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.DONE: return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case TaskStatus.STUDYING: return <PlayCircle className="w-4 h-4 text-purple-500" />;
      case TaskStatus.WONT_DO: return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-3 h-3 text-slate-400" />;
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    // Check if overdue
    const isOverdue = timestamp < new Date().setHours(0,0,0,0);
    
    return (
      <span className={`flex items-center gap-0.5 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
        <Calendar size={10} />
        {isToday ? '今日' : `${date.getMonth() + 1}/${date.getDate()}`}
      </span>
    );
  };

  const isCompact = task.status === TaskStatus.DONE || task.status === TaskStatus.WONT_DO;

  // Compact View for DONE and WONT_DO
  if (isCompact) {
    return (
      <div
        ref={ref}
        draggable
        data-task-id={task.id}
        onDragStart={(e) => onDragStart(e, task, index)}
        onDragEnd={onDragEnd}
        onClick={(e) => {
            e.stopPropagation();
            onClick();
        }}
        className={`
          bg-white/80 p-2 rounded border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-2 group relative
          ${isDragging ? 'hidden' : 'opacity-100'} 
          active:cursor-grabbing
        `}
      >
        <div className="flex-shrink-0 opacity-70">
          {getStatusIcon(task.status)}
        </div>
        <span className={`text-xs text-slate-600 truncate flex-1 font-medium ${task.status === TaskStatus.DONE ? 'line-through text-slate-400' : ''}`}>
          {task.title}
        </span>
        {task.actualMinutes > 0 && (
           <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap bg-slate-50 px-1 rounded">
             {task.actualMinutes}m
           </span>
        )}
      </div>
    );
  }

  // Standard View
  return (
    <div
      ref={ref}
      draggable
      data-task-id={task.id}
      onDragStart={(e) => {
        onDragStart(e, task, index);
      }}
      onDragEnd={onDragEnd}
      onClick={(e) => {
          e.stopPropagation();
          onClick();
      }}
      className={`
        bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative
        ${isDragging ? 'hidden' : 'opacity-100'} 
        active:cursor-grabbing
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-medium text-slate-800 leading-tight line-clamp-2 pr-4">
          {task.title}
        </h4>
        <div className="mt-0.5 ml-2 flex-shrink-0">
          {getStatusIcon(task.status)}
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-2">
        {/* Deadline */}
        {task.deadline && (
            <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
               {formatDate(task.deadline)}
            </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-50">
        <div className="flex items-center gap-1">
          <span>予: {task.estimatedMinutes}分</span>
        </div>
        {task.actualMinutes > 0 && (
          <div className="flex items-center gap-1 text-green-600 font-medium">
            <span>実: {task.actualMinutes}分</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;