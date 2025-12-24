
import React, { useState } from 'react';
import { useData } from '../context/DataContext';

interface CalendarEvent {
  id: string;
  classId: string;
  title: string;
  start: Date;
  end: Date;
  teacher: string;
  room: string;
  level: string;
  color: string;
  hasConflict?: boolean;
}

interface Props {
  event: CalendarEvent;
  onClose: () => void;
  onUpdate: (newDate: Date) => void;
  onAddStudent?: () => void; // New prop
}

const ClassEventModal: React.FC<Props> = ({ event, onClose, onUpdate, onAddStudent }) => {
  const { students } = useData();
  const [activeTab, setActiveTab] = useState<'info' | 'attendance'>('info');
  const [editMode, setEditMode] = useState(false);
  const [newDate, setNewDate] = useState(event.start.toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState(event.start.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'}));
  
  // Mock Attendance State
  const classStudents = students.filter(s => s.classId === event.classId);
  const [attendance, setAttendance] = useState<Record<string, boolean>>(
      classStudents.reduce((acc, s) => ({...acc, [s.id]: true}), {})
  );

  const toggleAttendance = (id: string) => {
      setAttendance(prev => ({...prev, [id]: !prev[id]}));
  };

  const handleSave = () => {
      const updated = new Date(`${newDate}T${newTime}`);
      if (confirm(`Xác nhận dời lịch sang ${updated.toLocaleString('vi-VN')}? \n\nHệ thống sẽ tự động đẩy lùi ngày kết thúc khóa học tương ứng.`)) {
          onUpdate(updated);
      }
  };

  const handleSaveContent = () => {
      alert("Đã lưu nội dung bài giảng và điểm danh!");
      onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111318]/60 p-4 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white dark:bg-[#1a202c] w-full max-w-[550px] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh]">
        
        {/* Header */}
        <div className={`px-6 py-5 flex justify-between items-start shrink-0 relative overflow-hidden
            ${event.hasConflict ? 'bg-red-600' : 
              event.color === 'blue' ? 'bg-blue-600' :
              event.color === 'orange' ? 'bg-orange-500' :
              event.color === 'emerald' ? 'bg-emerald-600' :
              event.color === 'indigo' ? 'bg-indigo-600' : 'bg-slate-600'
            }
        `}>
            {/* Texture */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-10 -mt-10 pointer-events-none mix-blend-overlay"></div>
            
            <div className="relative z-10 text-white w-full">
                <div className="flex items-center justify-between mb-1 opacity-90 text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">school</span>
                        <span>{event.level} • {event.room}</span>
                    </div>
                    {event.hasConflict && (
                        <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded text-white">
                            <span className="material-symbols-outlined text-[16px]">warning</span>
                            XUNG ĐỘT LỊCH
                        </div>
                    )}
                </div>
                <h3 className="text-2xl font-bold leading-tight mb-2">{event.title}</h3>
                <div className="flex items-center gap-4 text-sm font-medium opacity-95">
                    <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">schedule</span>
                        {event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {event.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">person</span>
                        {event.teacher}
                    </span>
                </div>
            </div>
            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors">
                <span className="material-symbols-outlined">close</span>
            </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a202c]">
            <button 
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            >
                Nội dung & Dời lịch
            </button>
            <button 
                onClick={() => setActiveTab('attendance')}
                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'attendance' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            >
                Điểm danh ({Object.values(attendance).filter(Boolean).length}/{classStudents.length})
            </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-900/50">
            {activeTab === 'info' ? (
                <div className="flex flex-col gap-6">
                    {/* Lesson Notes */}
                    <div className="bg-white dark:bg-[#1a202c] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[20px]">edit_note</span>
                            Nội dung bài giảng
                        </h4>
                        <textarea 
                            className="w-full h-24 p-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg resize-none focus:ring-1 focus:ring-primary focus:border-primary" 
                            placeholder="Nhập nội dung đã dạy, bài tập về nhà hoặc lưu ý cho giáo viên sau..."
                        ></textarea>
                        <div className="flex justify-end mt-2">
                            <button onClick={handleSaveContent} className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded shadow-sm hover:bg-primary-dark">Lưu nội dung</button>
                        </div>
                    </div>

                    {/* Reschedule */}
                    <div className="bg-white dark:bg-[#1a202c] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-orange-500 text-[20px]">event_repeat</span>
                                Báo nghỉ / Dời lịch
                            </h4>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={editMode} onChange={() => setEditMode(!editMode)} className="sr-only peer" />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                            </label>
                        </div>
                        
                        {editMode ? (
                            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block font-semibold">Ngày mới</label>
                                    <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full text-sm border-slate-300 dark:border-slate-600 rounded-md focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-800" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block font-semibold">Giờ mới</label>
                                    <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="w-full text-sm border-slate-300 dark:border-slate-600 rounded-md focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-800" />
                                </div>
                                <div className="col-span-2 text-xs text-slate-500 italic bg-orange-50 dark:bg-orange-900/20 p-2 rounded text-center">
                                    * Lưu ý: Buổi học cuối cùng của khóa sẽ tự động lùi lại.
                                </div>
                                <button onClick={handleSave} className="col-span-2 mt-1 w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-2 rounded-lg transition-colors shadow-sm">
                                    Xác nhận Dời lịch
                                </button>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500 italic">Kích hoạt để thay đổi thời gian hoặc báo nghỉ cho buổi học này.</p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center mb-2 px-1">
                        <span className="text-xs font-bold text-slate-500 uppercase">Danh sách lớp ({classStudents.length})</span>
                        <div className="flex items-center gap-2">
                            <button onClick={onAddStudent} className="text-xs flex items-center gap-1 text-primary font-bold hover:bg-blue-50 px-2 py-1 rounded transition-colors">
                                <span className="material-symbols-outlined text-[16px]">person_add</span>
                                Thêm học viên
                            </button>
                        </div>
                    </div>
                    {classStudents.map(student => (
                        <div key={student.id} onClick={() => toggleAttendance(student.id)} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${attendance[student.id] ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 opacity-60'}`}>
                            <div className="flex items-center gap-3">
                                <div className="size-9 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-600" style={student.avatar.startsWith('http') ? {backgroundImage: `url('${student.avatar}')`} : {backgroundColor: '#cbd5e1'}}></div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{student.name}</p>
                                    <p className="text-xs text-slate-500">{student.code}</p>
                                </div>
                            </div>
                            <div className={`size-6 rounded-full flex items-center justify-center border ${attendance[student.id] ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-300 text-transparent'}`}>
                                <span className="material-symbols-outlined text-[16px]">check</span>
                            </div>
                        </div>
                    ))}
                    {classStudents.length === 0 && <p className="text-center text-slate-500 text-sm py-4">Chưa có học viên trong lớp này.</p>}
                    
                    <button onClick={handleSaveContent} className="mt-4 w-full bg-primary hover:bg-primary-dark text-white text-sm font-bold py-3 rounded-xl shadow-lg shadow-primary/20 transition-all">
                        Lưu bảng điểm danh
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ClassEventModal;
