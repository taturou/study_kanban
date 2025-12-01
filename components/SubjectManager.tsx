import React, { useState, useRef } from 'react';
import { Subject, Task } from '../types';
import { Plus, Trash2, X, GripVertical, AlertTriangle, CalendarDays, History } from 'lucide-react';

interface SubjectManagerProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  tasks: Task[]; // Need tasks to check constraint
  isOpen: boolean;
  onClose: () => void;
  selectedWeekStart: number;
}

const SubjectManager: React.FC<SubjectManagerProps> = ({ subjects, setSubjects, tasks, isOpen, onClose, selectedWeekStart }) => {
  const [newSubjectName, setNewSubjectName] = useState('');
  
  // Custom Confirmation State
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  // Refs for drag and drop sorting (only for active subjects)
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Filter subjects based on the selected week
  const activeSubjects = subjects.filter(s => !s.weekStartDates || s.weekStartDates.includes(selectedWeekStart));
  const availableSubjects = subjects.filter(s => s.weekStartDates && !s.weekStartDates.includes(selectedWeekStart));

  const handleAdd = () => {
    if (!newSubjectName.trim()) return;
    
    // Check if subject with this name already exists
    const existingSubject = subjects.find(s => s.name === newSubjectName);

    if (existingSubject) {
        // If it exists, add current week to its list
        const updatedSubjects = subjects.map(s => {
            if (s.id === existingSubject.id) {
                const currentWeeks = s.weekStartDates || [];
                // If it was global (undefined), it's already everywhere, but if we are here it implies we are converting to weekly?
                // Actually, if it's undefined, it's active. If we want to add, it must be hidden.
                // Let's assume if weekStartDates is undefined, it's active everywhere.
                if (!currentWeeks.includes(selectedWeekStart)) {
                    return { ...s, weekStartDates: [...currentWeeks, selectedWeekStart] };
                }
            }
            return s;
        });
        setSubjects(updatedSubjects);
    } else {
        // Create new subject specific to this week
        const newSubject: Subject = {
            id: crypto.randomUUID(),
            name: newSubjectName,
            color: 'bg-slate-100',
            weekStartDates: [selectedWeekStart],
        };
        setSubjects([...subjects, newSubject]);
    }
    setNewSubjectName('');
  };

  const handleAddExisting = (subject: Subject) => {
      // Add selectedWeekStart to this subject
      const updatedSubjects = subjects.map(s => {
          if (s.id === subject.id) {
              const currentWeeks = s.weekStartDates || [];
              return { ...s, weekStartDates: [...currentWeeks, selectedWeekStart] };
          }
          return s;
      });
      setSubjects(updatedSubjects);
  };

  const handleDeleteClick = (subject: Subject) => {
    // Constraint Check: Cannot remove if tasks exist IN THIS WEEK (or strictly speaking, any task for now?)
    // Let's be strict: if ANY task exists for this subject, warn the user.
    // Ideally, we check tasks for this subject AND this week.
    
    // Find tasks for this subject in the current week
    const hasTasksThisWeek = tasks.some(t => 
        t.subjectId === subject.id && 
        (!t.startDate || t.startDate === selectedWeekStart) // Handle legacy tasks without startDate as well? Assume they match current view logic
    );

    if (hasTasksThisWeek) return; 

    setSubjectToDelete(subject);
  };

  const confirmDelete = () => {
    if (subjectToDelete) {
        // Remove current week from weekStartDates
        // If weekStartDates becomes empty, maybe keep it in history (don't delete fully)
        
        const updatedSubjects = subjects.map(s => {
            if (s.id === subjectToDelete.id) {
                if (!s.weekStartDates) return s; // Global subject, don't touch for now or convert to all-except-this? Simple logic: only touch if array exists
                
                return {
                    ...s,
                    weekStartDates: s.weekStartDates.filter(d => d !== selectedWeekStart)
                };
            }
            return s;
        });
        
        setSubjects(updatedSubjects);
        setSubjectToDelete(null);
    }
  };

  const cancelDelete = () => {
    setSubjectToDelete(null);
  };

  // --- Drag and Drop Handlers (Only for ordering active subjects?) ---
  // Reordering affects the main array order.
  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItem.current = index; // This index is within activeSubjects? 
    // Mapping back to main array is complex if we only show partial list.
    // For simplicity, let's disable reordering when filtered, OR apply reorder to the main list if visual order matches.
    // Let's Skip D&D reordering in this version to ensure data integrity with weekly filtering.
    // e.dataTransfer.setData("text/plain", String(index));
  };
  
  // Simplified: Disable D&D for weekly mode for now to focus on add/remove logic stability
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      
      {/* --- Confirmation Overlay --- */}
      {subjectToDelete && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/20 p-4">
               <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">教科を非表示にしますか？</h3>
                    <p className="text-sm text-slate-500">
                        「{subjectToDelete.name}」を今週の表示から外します。<br/>
                        （履歴には残ります）
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={cancelDelete}
                        className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
                    >
                        キャンセル
                    </button>
                    <button
                        type="button"
                        onClick={confirmDelete}
                        className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium shadow-sm"
                    >
                        非表示にする
                    </button>
                </div>
            </div>
          </div>
      )}

      {/* --- Main Modal --- */}
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh] relative z-50">
        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-blue-600"/>
            <h3 className="font-semibold text-slate-800">今週の教科管理</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-hidden flex flex-col gap-6">
          
          {/* Section 1: Add New */}
          <div>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="新しい教科を追加..."
                  className="flex-1 p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <button
                  onClick={handleAdd}
                  disabled={!newSubjectName.trim()}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Plus size={20} />
                </button>
              </div>
          </div>

          {/* Section 2: Active Subjects */}
          <div className="flex-1 overflow-y-auto min-h-[100px]">
            <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">表示中の教科</h4>
            <div className="space-y-2">
                {activeSubjects.map((subject) => {
                    const hasTasks = tasks.some(t => 
                        t.subjectId === subject.id && 
                        (!t.startDate || t.startDate === selectedWeekStart)
                    );
                    return (
                        <div 
                            key={subject.id} 
                            className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100"
                        >
                            <span className="font-medium text-slate-700 truncate">{subject.name}</span>
                            {hasTasks ? (
                                <button
                                    type="button"
                                    disabled
                                    className="text-slate-200 p-1 cursor-not-allowed"
                                    title="今週のタスクが存在するため外せません"
                                >
                                    <Trash2 size={16} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleDeleteClick(subject)}
                                    className="text-slate-300 hover:text-red-500 p-1 transition-colors"
                                    title="今週から外す"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    );
                })}
                {activeSubjects.length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-2">教科がありません</p>
                )}
            </div>
          </div>

          {/* Section 3: Available Subjects (History) */}
          {availableSubjects.length > 0 && (
              <div className="border-t border-slate-100 pt-4 max-h-[150px] overflow-y-auto">
                <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                    <History size={12}/> 過去の教科から追加
                </h4>
                <div className="flex flex-wrap gap-2">
                    {availableSubjects.map(subject => (
                        <button
                            key={subject.id}
                            onClick={() => handleAddExisting(subject)}
                            className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        >
                            + {subject.name}
                        </button>
                    ))}
                </div>
              </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SubjectManager;
