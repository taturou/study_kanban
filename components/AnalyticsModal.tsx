import React from 'react';
import { Task, Subject, TaskStatus } from '../types';
import { X, PieChart, BarChart } from 'lucide-react';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  subjects: Subject[];
}

const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose, tasks, subjects }) => {
  if (!isOpen) return null;

  // --- Calculations ---
  
  // 1. Stats per Subject
  const subjectStats = subjects.map(subject => {
    const subjectTasks = tasks.filter(t => t.subjectId === subject.id);
    const completedTasks = subjectTasks.filter(t => t.status === TaskStatus.DONE);
    const totalActualTime = subjectTasks.reduce((sum, t) => sum + t.actualMinutes, 0);
    const totalEstimatedTime = subjectTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
    const taskCount = subjectTasks.length;
    
    return {
      name: subject.name,
      color: subject.color,
      completed: completedTasks.length,
      total: taskCount,
      totalActualTime,
      totalEstimatedTime,
      avgTime: completedTasks.length > 0 ? Math.round(totalActualTime / completedTasks.length) : 0
    };
  });

  // 2. Global Stats
  const totalStudyTime = tasks.reduce((sum, t) => sum + t.actualMinutes, 0);
  const totalCompleted = tasks.filter(t => t.status === TaskStatus.DONE).length;

  // Max value for bar chart scaling
  const maxTime = Math.max(...subjectStats.map(s => s.totalActualTime), 1);
  const maxTasks = Math.max(...subjectStats.map(s => s.total), 1);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <PieChart className="text-blue-600" />
            <h3 className="font-semibold text-lg text-slate-800">学習データの可視化</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-blue-600 text-sm font-medium">総学習時間</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{(totalStudyTime / 60).toFixed(1)} <span className="text-sm font-normal text-blue-700">時間</span></p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
              <p className="text-green-600 text-sm font-medium">完了タスク数</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{totalCompleted} <span className="text-sm font-normal text-green-700">個</span></p>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
              <p className="text-purple-600 text-sm font-medium">平均タスク時間</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {totalCompleted > 0 ? Math.round(totalStudyTime / totalCompleted) : 0} <span className="text-sm font-normal text-purple-700">分</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Subject Study Time Bar Chart */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BarChart size={18} className="text-slate-500" />
                <h4 className="font-semibold text-slate-700">教科別学習時間 (分)</h4>
              </div>
              <div className="space-y-3">
                {subjectStats.map(stat => (
                  <div key={stat.name} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>{stat.name}</span>
                      <span className="font-medium">{stat.totalActualTime}分</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${(stat.totalActualTime / maxTime) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                {subjectStats.length === 0 && <p className="text-sm text-slate-400">データがありません</p>}
              </div>
            </div>

            {/* Task Completion Progress */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <PieChart size={18} className="text-slate-500" />
                <h4 className="font-semibold text-slate-700">タスク完了状況</h4>
              </div>
              <div className="space-y-4">
                 {subjectStats.map(stat => (
                   <div key={stat.name} className="flex items-center gap-3">
                      <div className="w-24 text-sm text-slate-600 truncate" title={stat.name}>{stat.name}</div>
                      <div className="flex-1">
                         <div className="w-full bg-slate-100 rounded-full h-4 relative overflow-hidden">
                           <div 
                             className="absolute left-0 top-0 h-full bg-green-500 rounded-full"
                             style={{ width: stat.total > 0 ? `${(stat.completed / stat.total) * 100}%` : '0%' }}
                           ></div>
                           <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-slate-600">
                             {stat.completed} / {stat.total}
                           </div>
                         </div>
                      </div>
                      <div className="text-xs text-slate-400 w-8 text-right">
                        {stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0}%
                      </div>
                   </div>
                 ))}
                 {subjectStats.length === 0 && <p className="text-sm text-slate-400">データがありません</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsModal;