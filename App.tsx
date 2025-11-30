import React, { useState, useEffect, useRef } from 'react';
import { Task, Subject, TaskStatus, STATUS_LABELS, STATUS_COLORS, Reminder, canMoveTask } from './types';
import TaskCard from './components/TaskCard';
import TaskModal from './components/TaskModal';
import SubjectManager from './components/SubjectManager';
import AnalyticsModal from './components/AnalyticsModal';
import ReminderModal from './components/ReminderModal';
import { Plus, Settings, BookOpen, PieChart, Bell } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('study_subjects');
    return saved ? JSON.parse(saved) : [
      { id: 'sub-1', name: '英語', color: 'bg-blue-50' },
      { id: 'sub-2', name: '数学', color: 'bg-green-50' },
    ];
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('study_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
      const saved = localStorage.getItem('study_reminders');
      return saved ? JSON.parse(saved) : [];
  });

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [targetSubjectId, setTargetSubjectId] = useState<string | undefined>(undefined);
  const [isSubjectManagerOpen, setIsSubjectManagerOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  // Drag State
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('study_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('study_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('study_reminders', JSON.stringify(reminders));
  }, [reminders]);

  // --- Reminder Logic ---
  const lastCheckedMinute = useRef<string>("");

  useEffect(() => {
    const checkReminders = () => {
        const now = new Date();
        const currentMinute = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
        const currentDay = now.getDay();

        // Only check once per minute
        if (lastCheckedMinute.current === currentMinute) return;
        lastCheckedMinute.current = currentMinute;

        reminders.forEach(reminder => {
            if (
                reminder.enabled &&
                reminder.time === currentMinute &&
                reminder.days.includes(currentDay)
            ) {
                if (Notification.permission === 'granted') {
                    new Notification('学習リマインダー', {
                        body: reminder.message,
                        icon: '/favicon.ico' // Assuming standard icon or none
                    });
                }
            }
        });
    };

    const intervalId = setInterval(checkReminders, 5000); // Check every 5 seconds
    return () => clearInterval(intervalId);
  }, [reminders]);


  // --- Handlers ---
  const handleAddTask = (subjectId: string) => {
    setEditingTask(null);
    setTargetSubjectId(subjectId);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTargetSubjectId(task.subjectId);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => {
    if (taskData.id) {
      // Update
      setTasks(prev => prev.map(t => t.id === taskData.id ? { ...t, ...taskData } : t));
    } else {
      // Create
      const newTask: Task = {
        ...taskData,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        priority: taskData.priority || 'Medium',
      } as Task;
      setTasks(prev => [...prev, newTask]);
    }
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // --- Drag and Drop Logic ---
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggingTaskId(taskId);
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, subjectId: string, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (!canMoveTask(task, subjectId, status)) {
        alert("この移動は許可されていません。\n\n・同一教科内: ルールに従った遷移のみ可能\n・異なる教科間: 「明日以降」「今日やる」同士のみ移動可能");
        return;
    }

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, subjectId, status };
      }
      return t;
    }));
    
    setDraggingTaskId(null);
  };

  const statuses = Object.values(TaskStatus);

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <BookOpen className="text-white w-5 h-5" />
          </div>
          <h1 className="font-bold text-lg text-slate-800">StudyMatrix</h1>
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={() => setIsAnalyticsOpen(true)}
                className="flex items-center gap-2 text-sm text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                title="学習データ"
            >
                <PieChart size={18} />
                <span className="hidden sm:inline">分析</span>
            </button>
            <button
                onClick={() => setIsReminderOpen(true)}
                className="flex items-center gap-2 text-sm text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                title="リマインダー"
            >
                <Bell size={18} />
                <span className="hidden sm:inline">通知</span>
            </button>
            <button
            onClick={() => setIsSubjectManagerOpen(true)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
            title="教科設定"
            >
            <Settings size={18} />
            <span className="hidden sm:inline">設定</span>
            </button>
        </div>
      </header>

      {/* Kanban Matrix */}
      <div className="flex-1 overflow-auto kanban-scroll p-4 md:p-6">
        <div className="inline-grid min-w-full" style={{
          gridTemplateColumns: `200px repeat(${statuses.length}, minmax(220px, 1fr))`,
          gridTemplateRows: `50px repeat(${subjects.length}, minmax(180px, 1fr))`
        }}>
          
          {/* Header Row: Statuses */}
          <div className="sticky top-0 left-0 z-30 bg-slate-100/90 backdrop-blur border-b border-slate-200"></div> {/* Corner spacer */}
          {statuses.map(status => (
            <div key={status} className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur border-b border-slate-200 px-2 py-3 font-semibold text-slate-600 text-center flex items-center justify-center gap-2">
               <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status].split(' ')[0].replace('bg-', 'bg-')}`}></span>
               {STATUS_LABELS[status]}
            </div>
          ))}

          {/* Subject Rows */}
          {subjects.map(subject => (
            <React.Fragment key={subject.id}>
              {/* Subject Header (Sticky Left) */}
              <div className="sticky left-0 z-10 bg-white border-r border-b border-slate-200 p-4 flex flex-col justify-between group shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)]">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{subject.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {tasks.filter(t => t.subjectId === subject.id && t.status !== TaskStatus.DONE).length} tasks left
                  </p>
                </div>
                <button
                  onClick={() => handleAddTask(subject.id)}
                  className="mt-4 flex items-center justify-center w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-colors text-sm font-medium gap-1"
                >
                  <Plus size={16} /> タスク追加
                </button>
              </div>

              {/* Grid Cells */}
              {statuses.map(status => {
                const cellTasks = tasks.filter(t => t.subjectId === subject.id && t.status === status);
                
                // --- Visual Feedback Logic ---
                const isDragging = draggingTaskId !== null;
                const activeTask = draggingTaskId ? tasks.find(t => t.id === draggingTaskId) : null;
                const droppable = activeTask ? canMoveTask(activeTask, subject.id, status) : false;

                let cellClasses = `p-3 transition-all duration-200 relative min-h-[120px] flex flex-col gap-3 `;

                if (isDragging) {
                    if (droppable) {
                        // Modern Valid Drop Zone: Dashed border, subtle indigo tint, rounded
                        cellClasses += `bg-indigo-50/60 border-2 border-dashed border-indigo-400/50 rounded-xl m-1 `;
                    } else {
                        // Invalid Drop Zone: Faded, grayscale
                        cellClasses += `bg-slate-100/50 opacity-30 border-b border-r border-slate-200 grayscale `;
                    }
                } else {
                    // Normal State
                    cellClasses += `border-b border-r border-slate-200 bg-slate-50/30 hover:bg-slate-100/50 `;
                }

                return (
                  <div
                    key={`${subject.id}-${status}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, subject.id, status)}
                    className={cellClasses}
                  >
                    {cellTasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onClick={() => handleEditTask(task)}
                          onDragStart={handleDragStart}
                        />
                      ))}
                      
                      {/* Add Button (only show if not dragging and is TOMORROW_PLUS) */}
                      {!isDragging && status === TaskStatus.TOMORROW_PLUS && (
                          <div className="flex-1 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity min-h-[20px]">
                            <button 
                                onClick={() => {
                                    setTargetSubjectId(subject.id);
                                    handleAddTask(subject.id);
                                }}
                                className="p-2 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-all"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                      )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
          
           {subjects.length === 0 && (
             <div className="col-span-full py-20 text-center text-slate-500">
                <p className="mb-4">教科がまだ登録されていません。</p>
                <button 
                  onClick={() => setIsSubjectManagerOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  教科を追加する
                </button>
             </div>
           )}

        </div>
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
            setIsTaskModalOpen(false);
            setDraggingTaskId(null); // Safety reset
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        initialTask={editingTask}
        initialSubjectId={targetSubjectId}
        subjects={subjects}
      />

      <SubjectManager
        isOpen={isSubjectManagerOpen}
        onClose={() => setIsSubjectManagerOpen(false)}
        subjects={subjects}
        setSubjects={setSubjects}
      />

      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        tasks={tasks}
        subjects={subjects}
      />

      <ReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        reminders={reminders}
        setReminders={setReminders}
      />
      
      {/* Global Drag Overlay (Invisible but helps catch end events if needed) */}
      {draggingTaskId && (
         <div 
            className="fixed inset-0 z-0 pointer-events-none" 
            onDragEnd={handleDragEnd} 
         />
      )}
    </div>
  );
};

export default App;