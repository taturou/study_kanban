import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskStatus, Subject, Priority, STATUS_LABELS } from '../types';
import { X, AlertTriangle } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => void;
  onDelete: (id: string) => void;
  initialTask?: Task | null;
  initialSubjectId?: string;
  initialStatus?: TaskStatus;
  subjects: Subject[];
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
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [actualMinutes, setActualMinutes] = useState(0);
  const [deadline, setDeadline] = useState<string>(''); // YYYY-MM-DD string for input
  
  // Hidden state to preserve data integrity
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TOMORROW_PLUS);
  const [subjectId, setSubjectId] = useState<string>('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [order, setOrder] = useState<number>(0);

  // State for Custom Delete Confirmation
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

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
        setActualMinutes(initialTask.actualMinutes);
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
        setActualMinutes(0);
        // Strict Rule: [*] --> TOMORROW_PLUS
        setStatus(TaskStatus.TOMORROW_PLUS);
        setSubjectId(initialSubjectId || (subjects.length > 0 ? subjects[0].id : ''));
        setPriority('Medium'); // Default
        setOrder(Date.now()); // Temporary large order to put at end
        setDeadline('');
      }

      // Auto focus on title input
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, initialTask, initialSubjectId, initialStatus, subjects]);

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
      actualMinutes,
      status, // Preserved internal state
      subjectId, // Preserved internal state
      priority, // Preserved internal state
      deadline: deadlineTimestamp,
      order,
    });
    onClose();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Open the custom confirmation view
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

          <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">期限</label>
              <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">見積もり時間 (分)</label>
              <input
                type="number"
                min="0"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">実績時間 (分)</label>
              <input
                type="number"
                min="0"
                step="5"
                value={actualMinutes}
                onChange={(e) => setActualMinutes(parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">メモ</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 resize-none"
              placeholder="タスクの詳細やメモ"
            ></textarea>
          </div>

          <div className="flex gap-3 pt-2">
            {initialTask && (
              canDelete ? (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  onMouseDown={(e) => e.stopPropagation()} 
                  className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                >
                  削除
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="px-4 py-2 text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed"
                  title="「明日以降」ステータスのタスクのみ削除できます"
                >
                  削除不可
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