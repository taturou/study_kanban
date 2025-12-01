import React, { useState, useEffect, useRef } from 'react';
import { Task, Subject, TaskStatus, STATUS_LABELS, STATUS_COLORS, Reminder, canMoveTask, WorkLog } from './types';
import TaskCard from './components/TaskCard';
import TaskModal from './components/TaskModal';
import SubjectManager from './components/SubjectManager';
import AnalyticsModal from './components/AnalyticsModal';
import ReminderModal from './components/ReminderModal';
import CalendarView from './components/CalendarView';
import { Plus, Settings, BookOpen, PieChart, Bell } from 'lucide-react';

// Logic types for Drag & Drop
interface DragState {
  taskId: string;
  sourceSubjectId: string;
  sourceStatus: TaskStatus;
  isSourceTop: boolean; // Was this task at the top of its list when drag started?
}

interface DropTarget {
  subjectId: string;
  status: TaskStatus;
  index: number;
}

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

  // Calendar State: Default to current week's Monday
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const m = new Date(date.setDate(diff));
    m.setHours(0,0,0,0);
    return m.getTime();
  };
  
  const [selectedWeekStart, setSelectedWeekStart] = useState<number>(getMonday(new Date()));

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [targetSubjectId, setTargetSubjectId] = useState<string | undefined>(undefined);
  const [isSubjectManagerOpen, setIsSubjectManagerOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  // Drag State
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  // Panning State
  // We now pan the main content container, not just the kanban area
  const mainScrollContainerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const scrollStart = useRef({ left: 0, top: 0 });

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
                        icon: '/favicon.ico'
                    });
                }
            }
        });
    };

    const intervalId = setInterval(checkReminders, 5000);
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
    setTasks(prev => {
      let updatedTasks = [...prev];
      
      // Enforce Single Studying Task Rule:
      if (taskData.status === TaskStatus.STUDYING) {
        updatedTasks = updatedTasks.map(t => {
          if (t.status === TaskStatus.STUDYING && t.id !== taskData.id) {
            return { ...t, status: TaskStatus.HOLD };
          }
          return t;
        });
      }

      const todayStr = new Date().toISOString().split('T')[0];

      if (taskData.id) {
        // Edit existing
        const existingTask = updatedTasks.find(t => t.id === taskData.id);
        const oldActual = existingTask ? existingTask.actualMinutes : 0;
        const newActual = taskData.actualMinutes;
        const delta = newActual - oldActual;

        // Update WorkLogs if actual time increased
        let newWorkLogs = existingTask?.workLogs ? [...existingTask.workLogs] : [];
        if (delta > 0) {
            const todayLogIdx = newWorkLogs.findIndex(l => l.date === todayStr);
            if (todayLogIdx >= 0) {
                newWorkLogs[todayLogIdx] = { ...newWorkLogs[todayLogIdx], minutes: newWorkLogs[todayLogIdx].minutes + delta };
            } else {
                newWorkLogs.push({ date: todayStr, minutes: delta });
            }
        } else if (delta < 0) {
             const todayLogIdx = newWorkLogs.findIndex(l => l.date === todayStr);
             if (todayLogIdx >= 0) {
                 newWorkLogs[todayLogIdx] = { ...newWorkLogs[todayLogIdx], minutes: Math.max(0, newWorkLogs[todayLogIdx].minutes + delta) };
             }
        }

        return updatedTasks.map(t => t.id === taskData.id ? { 
            ...t, 
            ...taskData, 
            workLogs: newWorkLogs,
            startDate: t.startDate || selectedWeekStart 
        } : t);

      } else {
        // New Task
        const maxOrder = updatedTasks
          .filter(t => t.subjectId === taskData.subjectId && t.status === taskData.status)
          .reduce((max, t) => Math.max(max, t.order || 0), -1);

        const newTask: Task = {
          ...taskData,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          priority: taskData.priority || 'Medium',
          order: maxOrder + 1,
          workLogs: [],
          startDate: selectedWeekStart, 
        } as Task;
        return [...updatedTasks, newTask];
      }
    });
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // --- Drag and Drop Logic ---

  const handleDragStart = (e: React.DragEvent, task: Task, index: number) => {
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";

    const isSourceTop = index === 0;

    setTimeout(() => {
        setDragState({
            taskId: task.id,
            sourceSubjectId: task.subjectId,
            sourceStatus: task.status,
            isSourceTop
        });
        
        setDropTarget({
            subjectId: task.subjectId,
            status: task.status,
            index: index
        });
    }, 0);
  };

  const handleCellDragOver = (e: React.DragEvent, subjectId: string, status: TaskStatus) => {
    e.preventDefault();
    if (!dragState) return;

    const isSameCell = subjectId === dragState.sourceSubjectId && status === dragState.sourceStatus;
    if (!isSameCell) {
        if (!dragState.isSourceTop) return;
        const mockTask = { status: dragState.sourceStatus, subjectId: dragState.sourceSubjectId } as Task;
        if (!canMoveTask(mockTask, subjectId, status)) return;
    }

    const container = e.currentTarget as HTMLElement;
    const children = Array.from(container.children).filter(
        (el) => (el as HTMLElement).hasAttribute('data-task-id') && !(el as HTMLElement).classList.contains('hidden')
    ) as HTMLElement[];

    let newIndex = children.length;

    for (let i = 0; i < children.length; i++) {
        const rect = children[i].getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        
        if (e.clientY < midpoint) {
            newIndex = i;
            break;
        }
    }

    if (dropTarget?.subjectId === subjectId && 
        dropTarget?.status === status && 
        dropTarget?.index === newIndex) {
        return;
    }
    
    setDropTarget({ subjectId, status, index: newIndex });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (dragState && dropTarget) {
        const { taskId } = dragState;
        const { subjectId, status, index } = dropTarget;

        setTasks(prevTasks => {
            let processedTasks = [...prevTasks];

            if (status === TaskStatus.STUDYING) {
                processedTasks = processedTasks.map(t => {
                    if (t.status === TaskStatus.STUDYING && t.id !== taskId) {
                        return { ...t, status: TaskStatus.HOLD };
                    }
                    return t;
                });
            }

            const taskToMove = processedTasks.find(t => t.id === taskId);
            if (!taskToMove) return prevTasks;

            const remaining = processedTasks.filter(t => t.id !== taskId);

            const targetList = remaining
                .filter(t => t.subjectId === subjectId && t.status === status)
                .filter(t => {
                    const tStart = t.startDate || selectedWeekStart;
                    return tStart >= selectedWeekStart && tStart < selectedWeekStart + 7 * 86400000; 
                })
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            const newItem = { ...taskToMove, subjectId, status };
            targetList.splice(index, 0, newItem);

            const updatedTargetList = targetList.map((t, i) => ({ ...t, order: i }));

            const updates = new Map(updatedTargetList.map(t => [t.id, t]));
            
            return remaining.map(t => updates.has(t.id) ? updates.get(t.id)! : t).concat(
                updatedTargetList.find(t => t.id === taskId)!
            );
        });
    }

    setDragState(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDragState(null);
    setDropTarget(null);
  };

  // --- Panning Logic ---
  const handlePanMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-task-id], button, input, textarea, a')) {
        return;
    }

    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY };
    if (mainScrollContainerRef.current) {
        scrollStart.current = { 
            left: mainScrollContainerRef.current.scrollLeft, 
            top: mainScrollContainerRef.current.scrollTop 
        };
        mainScrollContainerRef.current.style.cursor = 'grabbing';
    }
  };

  const handlePanMouseMove = (e: React.MouseEvent) => {
    if (!isPanning.current || !mainScrollContainerRef.current) return;
    
    e.preventDefault();
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    
    mainScrollContainerRef.current.scrollLeft = scrollStart.current.left - dx;
    mainScrollContainerRef.current.scrollTop = scrollStart.current.top - dy;
  };

  const handlePanMouseUp = () => {
    isPanning.current = false;
    if (mainScrollContainerRef.current) {
        mainScrollContainerRef.current.style.cursor = '';
    }
  };


  const statuses = Object.values(TaskStatus);
  const gridTemplateColumns = `200px repeat(${statuses.length}, minmax(220px, 1fr))`;

  const visibleTasks = tasks.filter(t => {
      if (!t.startDate) return true;
      return t.startDate >= selectedWeekStart && t.startDate < selectedWeekStart + (7 * 24 * 60 * 60 * 1000);
  });

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* Header - Fixed */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-50 relative shadow-sm">
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
            >
                <PieChart size={18} />
                <span className="hidden sm:inline">分析</span>
            </button>
            <button
                onClick={() => setIsReminderOpen(true)}
                className="flex items-center gap-2 text-sm text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
            >
                <Bell size={18} />
                <span className="hidden sm:inline">通知</span>
            </button>
            <button
            onClick={() => setIsSubjectManagerOpen(true)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
            >
            <Settings size={18} />
            <span className="hidden sm:inline">設定</span>
            </button>
        </div>
      </header>

      {/* Main Content Area - Scrollable & Pannable */}
      <main 
        ref={mainScrollContainerRef}
        className="flex-1 overflow-auto cursor-grab relative kanban-scroll"
        onMouseDown={handlePanMouseDown}
        onMouseMove={handlePanMouseMove}
        onMouseUp={handlePanMouseUp}
        onMouseLeave={handlePanMouseUp}
      >
          {/* Top Area: Calendar and Space */}
          <div className="px-4 pt-4 pb-0 flex gap-4 items-start min-w-max">
              <CalendarView 
                tasks={tasks} 
                selectedWeekStart={selectedWeekStart} 
                onSelectWeek={setSelectedWeekStart} 
              />
              <div className="flex-1 min-w-[300px] min-h-[100px] border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-300">
                <span>Empty Space</span>
              </div>
          </div>

          {/* Kanban Matrix Area */}
          <div className="p-4 md:p-6 pt-2 inline-block min-w-full">
                
                {/* 1. Header Row (Statuses) - STICKY TOP */}
                <div 
                  className="grid sticky top-0 z-40 mb-2" 
                  style={{ gridTemplateColumns }}
                >
                    {/* The Corner (Top-Left) - STICKY LEFT & TOP */}
                     <div className="sticky left-0 z-50 bg-slate-100 border-b border-slate-200"></div>
                     
                     {statuses.map(status => (
                        <div 
                            key={status} 
                            className="bg-slate-100/95 backdrop-blur border-b border-slate-200 px-2 py-3 font-semibold text-slate-600 text-center flex items-center justify-center gap-2 mx-1 rounded-t-lg shadow-sm"
                        >
                            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status].split(' ')[0].replace('bg-', 'bg-')}`}></span>
                            {STATUS_LABELS[status]}
                        </div>
                    ))}
                </div>

                {/* 2. Subject Rows (Independent Grids) */}
                <div className="flex flex-col gap-4 pb-10">
                    {subjects.map(subject => (
                        <div 
                            key={subject.id} 
                            className="grid bg-white rounded-xl shadow-sm border border-slate-200"
                            style={{ gridTemplateColumns }}
                        >
                            {/* Subject Header - STICKY LEFT */}
                            <div className="sticky left-0 z-30 bg-white border-r border-l border-slate-200 rounded-l-xl p-4 flex flex-col justify-between group shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{subject.name}</h3>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {visibleTasks.filter(t => t.subjectId === subject.id && t.status !== TaskStatus.DONE).length} tasks
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleAddTask(subject.id)}
                                    className="mt-4 flex items-center justify-center w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-colors text-sm font-medium gap-1"
                                >
                                    <Plus size={16} /> タスク追加
                                </button>
                            </div>

                            {/* Status Cells */}
                            {statuses.map((status, colIndex) => {
                                const cellTasks = visibleTasks
                                    .filter(t => t.subjectId === subject.id && t.status === status)
                                    .sort((a, b) => (a.order || 0) - (b.order || 0));
                                
                                let isDroppable = true;
                                if (dragState) {
                                    const isSameCell = dragState.sourceSubjectId === subject.id && dragState.sourceStatus === status;
                                    if (!isSameCell) {
                                        if (!dragState.isSourceTop) {
                                            isDroppable = false;
                                        } else {
                                            const mockTask = { status: dragState.sourceStatus, subjectId: dragState.sourceSubjectId } as Task;
                                            if (!canMoveTask(mockTask, subject.id, status)) {
                                                isDroppable = false;
                                            }
                                        }
                                    }
                                }

                                const isTargetCell = dropTarget?.subjectId === subject.id && dropTarget?.status === status;
                                const borderClass = colIndex < statuses.length - 1 ? 'border-r border-slate-100' : '';

                                return (
                                    <div
                                        key={`${subject.id}-${status}`}
                                        onDragOver={(e) => {
                                            if (isDroppable) handleCellDragOver(e, subject.id, status);
                                        }}
                                        onDrop={handleDrop}
                                        className={`
                                            p-3 transition-all duration-200 relative min-h-[160px] flex flex-col gap-3 ${borderClass}
                                            ${dragState && !isDroppable ? 'bg-slate-50 opacity-40 grayscale pointer-events-none' : 'hover:bg-slate-50/50'}
                                        `}
                                    >
                                        {cellTasks.map((task, index) => {
                                            const isDraggingSelf = dragState?.taskId === task.id;
                                            const showPlaceholderHere = isTargetCell && dropTarget.index === index;

                                            return (
                                                <React.Fragment key={task.id}>
                                                    {showPlaceholderHere && (
                                                        <div className="h-20 w-full rounded-lg border-2 border-dashed border-indigo-400 bg-indigo-50/50 transition-all animate-pulse pointer-events-none" />
                                                    )}
                                                    <TaskCard
                                                        task={task}
                                                        index={index}
                                                        isDragging={isDraggingSelf}
                                                        onClick={() => handleEditTask(task)}
                                                        onDragStart={handleDragStart}
                                                        onDragEnd={handleDragEnd}
                                                    />
                                                </React.Fragment>
                                            );
                                        })}
                                        {isTargetCell && dropTarget.index === cellTasks.length && (
                                            <div className="h-20 w-full rounded-lg border-2 border-dashed border-indigo-400 bg-indigo-50/50 transition-all animate-pulse pointer-events-none" />
                                        )}
                                        {!dragState && status === TaskStatus.TOMORROW_PLUS && (
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
                        </div>
                    ))}
                </div>
          </div>
      </main>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
            setIsTaskModalOpen(false);
            setDragState(null);
            setDropTarget(null);
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
        tasks={tasks}
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
    </div>
  );
};

export default App;