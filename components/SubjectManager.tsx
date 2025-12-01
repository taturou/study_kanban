import React, { useState, useRef } from 'react';
import { Subject } from '../types';
import { Plus, Trash2, X, GripVertical } from 'lucide-react';

interface SubjectManagerProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  isOpen: boolean;
  onClose: () => void;
}

const SubjectManager: React.FC<SubjectManagerProps> = ({ subjects, setSubjects, isOpen, onClose }) => {
  const [newSubjectName, setNewSubjectName] = useState('');
  
  // Refs for drag and drop sorting
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

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

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = "move";
    // Required for Firefox to initiate drag
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    dragOverItem.current = index;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
        const _subjects = [...subjects];
        const draggedItemContent = _subjects[dragItem.current];
        _subjects.splice(dragItem.current, 1);
        _subjects.splice(dragOverItem.current, 0, draggedItemContent);
        setSubjects(_subjects);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]">
        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-800">教科の管理</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex gap-2 mb-4 shrink-0">
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

          <div className="space-y-2 overflow-y-auto pr-1">
            {subjects.map((subject, index) => (
              <div 
                key={subject.id} 
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100 group hover:border-blue-200 transition-colors cursor-move active:cursor-grabbing"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                    <GripVertical size={16} className="text-slate-300 group-hover:text-slate-500" />
                    <span className="font-medium text-slate-700 truncate">{subject.name}</span>
                </div>
                <button
                  onClick={() => handleDelete(subject.id)}
                  className="text-slate-300 hover:text-red-500 p-1 transition-colors"
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