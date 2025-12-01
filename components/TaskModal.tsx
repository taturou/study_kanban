import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskStatus, Subject, Priority, WorkLog } from '../types';
import { X, AlertTriangle, Trash2, Flag, CalendarCheck, Plus, Clock } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => void;
  onDelete: (id: string) => void;
  initialTask?: Task | null;
  initialSubjectId?: string;
  initialStatus?: TaskStatus;
  subjects: Subject[];
  selectedWeekStart: number;
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialTask,
  initialSubjectId,
  initialStatus,
  subjects,
  selectedWeekStart,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [deadline, setDeadline] = useState<string>(''); // YYYY-MM-DD string for input
  
  // Work Logs State
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  
  // New Log Input State
  const [newLogDate, setNewLogDate] = useState('');
  const [newLogMinutes, setNewLogMinutes] = useState(30);
  
  // Hidden state to preserve data integrity
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TOMORROW_PLUS);
  const [subjectId, setSubjectId] = useState<string>('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [order, setOrder] = useState<number>(0);

  // State for Custom Delete Confirmation
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Derived state
  const totalActualMinutes = workLogs.reduce((sum, log) => sum + log.minutes, 0);

  // Week constraint calculation
  const effectiveWeekStart = initialTask?.startDate || selectedWeekStart;
  const weekStartData = new Date(effectiveWeekStart);
  const weekEndData = new Date(effectiveWeekStart + 6 * 24 * 60 * 60 * 1000); // Sunday

  // Format to YYYY-MM-DD manually to avoid timezone issues
  const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const minDate = formatDateString(weekStartData);
  const maxDate = formatDateString(weekEndData);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // If delete confirmation is shown, close it first
        if (isDeleteConfirmOpen) {
          setIsDeleteConfirmOpen(false);
          return;
        }
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleteConfirmOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      // Reset delete confirm state when modal opens
      setIsDeleteConfirmOpen(false);

      if (initialTask) {
        setTitle(initialTask.title);
        setDescription(initialTask.description || '');
        setEstimatedMinutes(initialTask.estimatedMinutes);
        setWorkLogs(initialTask.workLogs || []);
        setStatus(initialTask.status);
        setSubjectId(initialTask.subjectId);
        setPriority(initialTask.priority || 'Medium');
        setOrder(initialTask.order || 0);
        // Convert timestamp to YYYY-MM-DD
        if (initialTask.deadline) {
            const date = new Date(initialTask.deadline);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            setDeadline(`${year}-${month}-${day}`);
        } else {
            setDeadline('');
        }
      } else {
        // New Task
        setTitle('');
        setDescription('');
        setEstimatedMinutes(30);
        setWorkLogs([]);
        // Strict Rule: [*] --> TOMORROW_PLUS
        setStatus(TaskStatus.TOMORROW_PLUS);
        setSubjectId(initialSubjectId || (subjects.length > 0 ? subjects[0].id : ''));
        setPriority('Medium'); // Default
        setOrder(Date.now()); // Temporary large order to put at end
        setDeadline('');
      }
      
      // Determine default log date
      const today = new Date();
      const todayStr = formatDateString(today);
      const todayTs = new Date(todayStr).getTime();
      const minTs = new Date(minDate).getTime();
      const maxTs = new Date(maxDate).getTime();

      if (todayTs >= minTs && todayTs <= maxTs) {
        setNewLogDate(todayStr);
      } else {
        setNewLogDate(minDate);
      }
      
      setNewLogMinutes(30);

      // Auto focus on title input
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, initialTask, initialSubjectId, initialStatus, subjects, minDate, maxDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert date string back to timestamp
    let deadlineTimestamp: number | undefined = undefined;
    if (deadline) {
        deadlineTimestamp = new Date(deadline).getTime();
    }

    onSave({
      id: initialTask?.id,
      title,
      description,
      estimatedMinutes,
      actualMinutes: totalActualMinutes, // Calculated from logs
      status, // Preserved internal state
      subjectId, // Preserved internal state
      priority, // Preserved internal state
      deadline: deadlineTimestamp,
      order,
      workLogs,
      startDate: initialTask?.startDate || selectedWeekStart, 
    });
    onClose();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (initialTask?.id) {
        onDelete(initialTask.id);
        onClose();
    }
  };

  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
  };

  // --- Work Log Handlers ---
  const handleAddLog = () => {
    if (!newLogDate || newLogMinutes <= 0) return;
    const newLog: WorkLog = {
      date: newLogDate,
      minutes: newLogMinutes
    };
    // Sort logs by date (descending)
    const updatedLogs = [...workLogs, newLog].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setWorkLogs(updatedLogs);
    // Keep date but reset minutes? Or keep both for repeated entry?
    // Let's reset minutes to 30 for convenience
    setNewLogMinutes(30);
  };

  const handleDeleteLog = (index: number) => {
    const updatedLogs = [...workLogs];
    updatedLogs.splice(index, 1);
    setWorkLogs(updatedLogs);
  };

  if (!isOpen) return null;

  const canDelete = initialTask?.status === TaskStatus.TOMORROW_PLUS;

  // --- Render Delete Confirmation View ---
  if (isDeleteConfirmOpen) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">タスクを削除しますか？</h3>
                    <p className="text-sm text-slate-500">
                        この操作は取り消せません。<br/>
                        「{initialTask?.title}」を本当に削除してもよろしいですか？
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
                        削除する
                    </button>
                </div>
            </div>
        </div>
    );
  }

  // --- Render Main Form ---
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-lg text-slate-800">
            {initialTask ? 'タスクを編集' : '新しいタスク'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">タイトル</label>
            <input
              ref={titleInputRef}
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="何を勉強しますか？"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Flag size={14} className="text-slate-500" />
                    期限
                </label>
                <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                 <Clock size={14} className="text-slate-500" />
                 見積もり (分)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Study Log Manager */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
             <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                    <CalendarCheck size={16} className="text-blue-600" />
                    学習ログ <span className="text-[10px] font-normal text-slate-400 ml-1">({minDate.slice(5)} ~ {maxDate.slice(5)})</span>
                </label>
                <div className="text-sm font-medium text-slate-600">
                    合計: <span className="text-blue-700 font-bold">{totalActualMinutes}</span> 分
                </div>
             </div>

             {/* Add New Log */}
             <div className="flex gap-2 mb-3">
                 <input 
                    type="date" 
                    min={minDate}
                    max={maxDate}
                    value={newLogDate}
                    onChange={(e) => setNewLogDate(e.target.value)}
                    className="flex-1 p-1.5 text-xs border border-slate-300 rounded outline-none focus:border-blue-500"
                 />
                 <input 
                    type="number" 
                    min="5" 
                    step="5"
                    value={newLogMinutes}
                    onChange={(e) => setNewLogMinutes(parseInt(e.target.value) || 0)}
                    className="w-20 p-1.5 text-xs border border-slate-300 rounded outline-none focus:border-blue-500"
                    placeholder="分"
                 />
                 <button
                    type="button"
                    onClick={handleAddLog}
                    className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700"
                 >
                    <Plus size={16} />
                 </button>
             </div>

             {/* Log List */}
             <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
                 {workLogs.length === 0 && (
                     <p className="text-xs text-slate-400 text-center py-2">まだ記録がありません</p>
                 )}
                 {workLogs.map((log, index) => (
                     <div key={index} className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 text-xs">
                         <div className="flex gap-2">
                             <span className="text-slate-600 font-mono">{log.date}</span>
                             <span className="font-bold text-slate-800">{log.minutes}分</span>
                         </div>
                         <button
                            type="button"
                            onClick={() => handleDeleteLog(index)}
                            className="text-slate-300 hover:text-red-500"
                         >
                             <Trash2 size={14} />
                         </button>
                     </div>
                 ))}
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">メモ</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 resize-none"
              placeholder="タスクの詳細やメモ"
            ></textarea>
          </div>

          <div className="flex gap-3 pt-2 items-center">
            {initialTask && (
              canDelete ? (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  onMouseDown={(e) => e.stopPropagation()} 
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="タスクを削除"
                >
                  <Trash2 size={20} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="p-2 text-slate-200 bg-slate-50 rounded-lg cursor-not-allowed"
                  title="「明日以降」ステータスのタスクのみ削除できます"
                >
                  <Trash2 size={20} />
                </button>
              )
            )}
            <div className="flex-1"></div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow transition-colors font-medium"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;