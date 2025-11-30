import React, { useRef } from 'react';
import { Task, TaskStatus } from '../types';
import { Clock, CheckCircle2, PlayCircle, AlertCircle, Calendar } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  index: number;
  isDragging: boolean;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, task: Task, index: number) => void;
  onDragEnter: (subjectId: string, status: TaskStatus, index: number) => void;
  onDragEnd: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  index, 
  isDragging, 
  onClick, 
  onDragStart, 
  onDragEnter,
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

  return (
    <div
      ref={ref}
      draggable
      onDragStart={(e) => {
        onDragStart(e, task, index);
      }}
      onDragEnd={onDragEnd}
      onDragEnter={(e) => {
        if (!isDragging) {
           onDragEnter(task.subjectId, task.status, index);
        }
      }}
      onDragOver={(e) => e.preventDefault()} 
      onClick={(e) => {
          e.stopPropagation();
          onClick();
      }}
      className={`
        bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative
        ${isDragging ? 'opacity-0 pointer-events-none' : 'opacity-100'} 
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