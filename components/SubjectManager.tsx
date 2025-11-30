import React, { useState } from 'react';
import { Subject } from '../types';
import { Plus, Trash2, X } from 'lucide-react';

interface SubjectManagerProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  isOpen: boolean;
  onClose: () => void;
}

const SubjectManager: React.FC<SubjectManagerProps> = ({ subjects, setSubjects, isOpen, onClose }) => {
  const [newSubjectName, setNewSubjectName] = useState('');

  const handleAdd = () => {
    if (!newSubjectName.trim()) return;
    const newSubject: Subject = {
      id: crypto.randomUUID(),
      name: newSubjectName,
      color: 'bg-slate-100', // Default color, can be enhanced later
    };
    setSubjects([...subjects, newSubject]);
    setNewSubjectName('');
  };

  const handleDelete = (id: string) => {
    if (confirm('この教科を削除しますか？ 含まれるタスクも削除される可能性があります（実装依存）。')) {
      setSubjects(subjects.filter(s => s.id !== id));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-800">教科の管理</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              placeholder="新しい教科名 (例: 日本史)"
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

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {subjects.map(subject => (
              <div key={subject.id} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
                <span className="font-medium text-slate-700">{subject.name}</span>
                <button
                  onClick={() => handleDelete(subject.id)}
                  className="text-red-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {subjects.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-4">教科がありません</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectManager;