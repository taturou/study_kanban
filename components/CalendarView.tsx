import React, { useState } from 'react';
import { Task } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  selectedWeekStart: number;
  onSelectWeek: (weekStart: number) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, selectedWeekStart, onSelectWeek }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Helper to get Monday of a date
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(date.setDate(diff));
  };

  // Generate calendar grid dates
  const generateDates = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const dates: Date[] = [];
    
    // Pad start (Monday start)
    const startPadding = (firstDay.getDay() + 6) % 7;
    for (let i = startPadding; i > 0; i--) {
        dates.push(new Date(year, month, 1 - i));
    }

    // Days of month
    for (let i = 1; i <= lastDay.getDate(); i++) {
        dates.push(new Date(year, month, i));
    }

    // Fill remaining to keep grid consistent
    const remaining = 7 - (dates.length % 7);
    if (remaining < 7) {
        for (let i = 1; i <= remaining; i++) {
            dates.push(new Date(year, month + 1, i));
        }
    }

    return dates;
  };

  const dates = generateDates();

  // Calculate heatmap data (Navy Blue style colors)
  const getHeatmapColor = (date: Date) => {
    // FIX: Use local time formatting instead of toISOString() to avoid timezone offsets
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    let totalMinutes = 0;
    
    tasks.forEach(task => {
        if (task.workLogs) {
            const log = task.workLogs.find(l => l.date === dateStr);
            if (log) totalMinutes += log.minutes;
        }
    });

    if (totalMinutes === 0) return '';
    
    // Navy Blue Colors
    if (totalMinutes < 30) return 'bg-[#dbeafe] text-slate-800'; // Lightest
    if (totalMinutes < 60) return 'bg-[#60a5fa] text-white';     // Medium
    if (totalMinutes < 120) return 'bg-[#1e40af] text-white';    // Dark
    return 'bg-[#172554] text-white';                            // Deepest Navy
  };

  const isSelectedWeek = (date: Date) => {
    const weekStart = new Date(selectedWeekStart);
    weekStart.setHours(0,0,0,0);
    const d = new Date(date);
    d.setHours(0,0,0,0);
    
    const diffTime = d.getTime() - weekStart.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays >= 0 && diffDays < 7;
  };

  const handleDateClick = (date: Date) => {
    const monday = getMonday(date);
    monday.setHours(0,0,0,0);
    onSelectWeek(monday.getTime());
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 w-[320px]">
        <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="font-bold text-slate-700 text-sm">
                {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
            </h2>
            <div className="flex gap-1">
                <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                    <ChevronLeft size={18}/>
                </button>
                <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                    <ChevronRight size={18}/>
                </button>
            </div>
        </div>

        <div className="grid grid-cols-7 gap-y-2 gap-x-1">
            {WEEKDAYS.map(day => (
                <div key={day} className="text-center text-[10px] text-slate-400 font-medium">
                    {day}
                </div>
            ))}
            {dates.map((date, i) => {
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                const isSelected = isSelectedWeek(date);
                const heatmapClass = getHeatmapColor(date);
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                    <div 
                        key={i}
                        onClick={() => handleDateClick(date)}
                        className="flex flex-col items-center cursor-pointer group"
                    >
                        <div className={`
                            w-7 h-7 flex items-center justify-center rounded-full text-xs transition-all relative
                            ${!isCurrentMonth ? 'text-slate-300' : 'text-slate-700'}
                            ${heatmapClass ? heatmapClass : 'group-hover:bg-slate-50'}
                            ${isToday ? 'ring-2 ring-orange-400 ring-offset-1 z-10' : ''}
                        `}>
                            {date.getDate()}
                        </div>
                        {/* Selected Indicator */}
                        <div className={`
                            w-4 h-1 rounded-full mt-1 transition-colors
                            ${isSelected ? 'bg-slate-400' : 'bg-transparent'}
                        `}></div>
                    </div>
                );
            })}
        </div>
        <div className="text-center text-[10px] text-slate-400 mt-2 border-t border-slate-50 pt-2">
            週を選択してタスクを表示
        </div>
    </div>
  );
};

export default CalendarView;