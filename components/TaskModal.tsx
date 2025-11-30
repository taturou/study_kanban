import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, Subject, STATUS_LABELS, Priority, PRIORITY_LABELS } from '../types';
import { X, Sparkles, Loader2, Calendar } from 'lucide-react';
import { generateStudyPlan } from '../services/geminiService';

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
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODAY);
  const [subjectId, setSubjectId] = useState<string>('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [deadline, setDeadline] = useState<string>(''); // YYYY-MM-DD string for input
  
  // AI Generation State
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiGoal, setAiGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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
        setIsAiMode(false);
      } else {
        setTitle('');
        setDescription('');
        setEstimatedMinutes(30);
        setActualMinutes(0);
        setStatus(initialStatus || TaskStatus.TODAY);
        setSubjectId(initialSubjectId || (subjects.length > 0 ? subjects[0].id : ''));
        setPriority('Medium');
        setDeadline('');
        setIsAiMode(false);
      }
      setAiGoal('');
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
      status,
      subjectId,
      priority,
      deadline: deadlineTimestamp,
    });
    onClose();
  };

  const handleAiGenerate = async () => {
    if (!aiGoal || !subjectId) return;
    setIsGenerating(true);
    const selectedSubject = subjects.find(s => s.id === subjectId);
    try {
      const generatedTasks = await generateStudyPlan(aiGoal, selectedSubject?.name || '学習');
      if (generatedTasks.length > 0) {
        const first = generatedTasks[0];
        setTitle(first.title);
        setDescription(first.description);
        setEstimatedMinutes(first.estimatedMinutes);
        setIsAiMode(false);
      }
    } catch (e) {
      console.error(e);
      alert("AI生成に失敗しました。");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-lg text-slate-800">
            {initialTask ? 'タスクを編集' : (isAiMode ? 'AIで計画を立てる' : '新しいタスク')}
          </h3>
          <div className="flex gap-2">
             {!initialTask && !isAiMode && (
                <button
                  onClick={() => setIsAiMode(true)}
                  className="text-xs flex items-center gap-1 text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-full transition-colors font-medium"
                >
                  <Sparkles size={14} /> AI生成
                </button>
             )}
             {isAiMode && (
                <button
                  onClick={() => setIsAiMode(false)}
                  className="text-xs text-slate-500 hover:bg-slate-200 px-2 py-1 rounded-full transition-colors"
                >
                  手動入力に戻る
                </button>
             )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {isAiMode ? (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">教科</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">達成したい目標</label>
              <textarea
                value={aiGoal}
                onChange={(e) => setAiGoal(e.target.value)}
                placeholder="例: 二次関数の基本問題を解けるようになりたい"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none min-h-[100px]"
              />
            </div>
            <button
              onClick={handleAiGenerate}
              disabled={isGenerating || !aiGoal}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
              タスクを生成する
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">タイトル</label>
              <input
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
                <label className="block text-sm font-medium text-slate-700 mb-1">教科</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ステータス</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">重要度</label>
                    <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as Priority)}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
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
                rows={3}
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
        )}
      </div>
    </div>
  );
};

export default TaskModal;