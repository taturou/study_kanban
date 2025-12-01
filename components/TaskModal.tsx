import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskStatus, Subject, Priority, STATUS_LABELS } from '../types';
import { X } from 'lucide-react';

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

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
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

  if (!isOpen) return null;

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
              <button
                type="button"
                onClick={() => {
                  if (confirm('このタスクを削除しますか？')) {
                    if (initialTask.id) onDelete(initialTask.id);
                    onClose();
                  }
                }}
                className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                削除
              </button>
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