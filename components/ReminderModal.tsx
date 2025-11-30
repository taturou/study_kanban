import React, { useState, useEffect } from 'react';
import { Reminder } from '../types';
import { X, Bell, Plus, Trash2, Clock } from 'lucide-react';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, reminders, setReminders }) => {
  const [time, setTime] = useState('09:00');
  const [message, setMessage] = useState('勉強の時間です！');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default
  const [permission, setPermission] = useState<NotificationPermission>(Notification.permission);

  useEffect(() => {
    if (isOpen) {
        // Refresh permission status when opening
        setPermission(Notification.permission);
    }
  }, [isOpen]);

  const requestPermission = async () => {
    const perm = await Notification.requestPermission();
    setPermission(perm);
  };

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex) 
        : [...prev, dayIndex].sort()
    );
  };

  const handleAdd = () => {
    if (selectedDays.length === 0) {
        alert("曜日を選択してください");
        return;
    }
    const newReminder: Reminder = {
      id: crypto.randomUUID(),
      time,
      days: selectedDays,
      message: message || "時間です！",
      enabled: true,
    };
    setReminders([...reminders, newReminder]);
    setMessage('勉強の時間です！'); // reset to default
  };

  const handleDelete = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const toggleEnabled = (id: string) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <Bell className="text-orange-500" />
            <h3 className="font-semibold text-lg text-slate-800">リマインダー設定</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {permission !== 'granted' && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between">
              <span className="text-sm text-orange-800">通知許可が必要です</span>
              <button 
                onClick={requestPermission}
                className="text-xs bg-orange-600 text-white px-3 py-1.5 rounded-md hover:bg-orange-700"
              >
                許可する
              </button>
            </div>
          )}

          {/* New Reminder Form */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Plus size={16} /> 新しいリマインダー
            </h4>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">時間</label>
                    <input 
                        type="time" 
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded bg-white focus:border-blue-500 outline-none"
                    />
                </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">メッセージ</label>
                    <input 
                        type="text" 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="勉強の時間です！"
                        className="w-full p-2 border border-slate-300 rounded bg-white focus:border-blue-500 outline-none"
                    />
                </div>
            </div>

            <div className="mb-4">
                 <label className="block text-xs font-medium text-slate-500 mb-2">繰り返し (曜日)</label>
                 <div className="flex justify-between gap-1">
                    {WEEKDAYS.map((day, index) => (
                        <button
                            key={index}
                            onClick={() => toggleDay(index)}
                            className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                                selectedDays.includes(index) 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                        >
                            {day}
                        </button>
                    ))}
                 </div>
            </div>

            <button 
                onClick={handleAdd}
                className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
            >
                追加する
            </button>
          </div>

          {/* List */}
          <div className="space-y-3">
             <h4 className="text-sm font-bold text-slate-700">登録済み</h4>
             {reminders.length === 0 && <p className="text-sm text-slate-400">リマインダーはありません</p>}
             
             {reminders.map(reminder => (
                 <div key={reminder.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                        <input 
                            type="checkbox" 
                            checked={reminder.enabled} 
                            onChange={() => toggleEnabled(reminder.id)}
                            className="w-4 h-4 text-blue-600"
                        />
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 text-lg">{reminder.time}</span>
                                <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {reminder.days.length === 7 ? '毎日' : reminder.days.map(d => WEEKDAYS[d]).join('・')}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">{reminder.message}</p>
                        </div>
                    </div>
                    <button onClick={() => handleDelete(reminder.id)} className="text-slate-400 hover:text-red-500 p-2">
                        <Trash2 size={16} />
                    </button>
                 </div>
             ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ReminderModal;