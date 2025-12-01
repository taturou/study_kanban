import React, { useState, useEffect, useRef } from 'react';
import { Task, Subject, TaskStatus, STATUS_LABELS, STATUS_COLORS, Reminder, canMoveTask } from './types';
import TaskCard from './components/TaskCard';
import TaskModal from './components/TaskModal';
import SubjectManager from './components/SubjectManager';
import AnalyticsModal from './components/AnalyticsModal';
import ReminderModal from './components/ReminderModal';
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
      // If the new/updated task is set to STUDYING, move any existing STUDYING task to HOLD.
      if (taskData.status === TaskStatus.STUDYING) {
        updatedTasks = updatedTasks.map(t => {
          if (t.status === TaskStatus.STUDYING && t.id !== taskData.id) {
            return { ...t, status: TaskStatus.HOLD };
          }
          return t;
        });
      }

      if (taskData.id) {
        return updatedTasks.map(t => t.id === taskData.id ? { ...t, ...taskData } : t);
      } else {
        const maxOrder = updatedTasks
          .filter(t => t.subjectId === taskData.subjectId && t.status === taskData.status)
          .reduce((max, t) => Math.max(max, t.order || 0), -1);

        const newTask: Task = {
          ...taskData,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          priority: taskData.priority || 'Medium',
          order: maxOrder + 1,
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
    // Required for some browsers (Firefox) to start drag
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";

    // Check if this task is at the top (index 0) of its current list
    const isSourceTop = index === 0;

    // IMPORTANT: Defer state update to allow browser to generate the drag ghost image
    // from the visible element before we hide it (display: none via class)
    setTimeout(() => {
        setDragState({
            taskId: task.id,
            sourceSubjectId: task.subjectId,
            sourceStatus: task.status,
            isSourceTop
        });
        
        // Set initial drop target to current location
        setDropTarget({
            subjectId: task.subjectId,
            status: task.status,
            index: index
        });
    }, 0);
  };

  // Called when hovering over the CELL (Container)
  // This calculates the insertion index based on mouse Y position relative to children
  const handleCellDragOver = (e: React.DragEvent, subjectId: string, status: TaskStatus) => {
    e.preventDefault();
    if (!dragState) return;

    // Validate Validity
    const isSameCell = subjectId === dragState.sourceSubjectId && status === dragState.sourceStatus;
    if (!isSameCell) {
        if (!dragState.isSourceTop) return;
        const mockTask = { status: dragState.sourceStatus, subjectId: dragState.sourceSubjectId } as Task;
        if (!canMoveTask(mockTask, subjectId, status)) return;
    }

    // Calculate Insertion Index Geometry
    const container = e.currentTarget as HTMLElement;
    const children = Array.from(container.children).filter(
        (el) => (el as HTMLElement).hasAttribute('data-task-id') && !(el as HTMLElement).classList.contains('hidden')
    ) as HTMLElement[];

    let newIndex = children.length; // Default to append

    for (let i = 0; i < children.length; i++) {
        const rect = children[i].getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        
        if (e.clientY < midpoint) {
            newIndex = i;
            break;
        }
    }

    // Optimization: only update if changed
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

        // Perform the move
        setTasks(prevTasks => {
            let processedTasks = [...prevTasks];

            // Enforce Single Studying Task Rule:
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

            // Remove from old list
            const remaining = processedTasks.filter(t => t.id !== taskId);

            // Get target list from remaining tasks
            const targetList = remaining
                .filter(t => t.subjectId === subjectId && t.status === status)
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            // Insert
            const newItem = { ...taskToMove, subjectId, status };
            targetList.splice(index, 0, newItem);

            // Re-index target list
            const updatedTargetList = targetList.map((t, i) => ({ ...t, order: i }));

            // Merge back
            const others = remaining.filter(t => !(t.subjectId === subjectId && t.status === status));
            return [...others, ...updatedTargetList];
        });
    }

    // Reset state
    setDragState(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDragState(null);
    setDropTarget(null);
  };

  const statuses = Object.values(TaskStatus);

  // Common grid columns definition
  const gridTemplateColumns = `200px repeat(${statuses.length}, minmax(220px, 1fr))`;

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-40 relative">
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

      {/* Kanban Matrix Area */}
      <div className="flex-1 overflow-auto kanban-scroll p-4 md:p-6">
        <div className="inline-block min-w-full">
            
            {/* 1. Header Row (Statuses) */}
            <div 
              className="grid sticky top-0 z-30 mb-2" 
              style={{ gridTemplateColumns }}
            >
                 {/* Top-Left Corner Spacer (Sticky) */}
                 <div className="sticky left-0 z-40 bg-slate-100 border-b border-slate-200"></div>

                 {/* Status Headers */}
                 {statuses.map(status => (
                    <div 
                        key={status} 
                        className="bg-slate-100/95 backdrop-blur border-b border-slate-200 px-2 py-3 font-semibold text-slate-600 text-center flex items-center justify-center gap-2 mx-1 rounded-t-lg"
                    >
                        <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status].split(' ')[0].replace('bg-', 'bg-')}`}></span>
                        {STATUS_LABELS[status]}
                    </div>
                ))}
            </div>

            {/* 2. Subject Rows (Independent Grids) */}
            <div className="flex flex-col gap-4">
                {subjects.map(subject => (
                    <div 
                        key={subject.id} 
                        className="grid bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                        style={{ gridTemplateColumns }}
                    >
                        {/* Subject Header (Left Column) */}
                        <div className="sticky left-0 z-20 bg-white border-r border-slate-100 p-4 flex flex-col justify-between group shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
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

                        {/* Status Cells */}
                        {statuses.map((status, colIndex) => {
                            // Get tasks for this cell
                            const cellTasks = tasks
                                .filter(t => t.subjectId === subject.id && t.status === status)
                                .sort((a, b) => (a.order || 0) - (b.order || 0));
                            
                            // Determine Validity for Dragging
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
                            
                            // Last column doesn't need right border, but middle ones might
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
                                    {/* Render Tasks with Placeholder Injection */}
                                    {cellTasks.map((task, index) => {
                                        const isDraggingSelf = dragState?.taskId === task.id;
                                        
                                        // Show placeholder before the item if index matches
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

                                    {/* Placeholder at the very end */}
                                    {isTargetCell && dropTarget.index === cellTasks.length && (
                                        <div className="h-20 w-full rounded-lg border-2 border-dashed border-indigo-400 bg-indigo-50/50 transition-all animate-pulse pointer-events-none" />
                                    )}

                                    {/* Add Button Shortcut */}
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
      </div>

      {/* Modals */}
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