
import React, { useState, useEffect, useMemo } from 'react';
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
  index?: number; // Added Index
  mode: 'online' | 'offline'; // Added Mode
  link?: string; // Added Link
  location?: string; // Added Full Location
}

interface Props {
  event: CalendarEvent;
  onClose: () => void;
  onUpdate: (newDate: Date) => void;
  onAddStudent?: () => void;
}

const ClassEventModal: React.FC<Props> = ({ event, onClose, onUpdate, onAddStudent }) => {
  const { students, classes, currentUser, cancelClassSession } = useData();
  const [activeTab, setActiveTab] = useState<'info' | 'attendance'>('info');
  const [editMode, setEditMode] = useState(false);
  
  // Schedule State
  const [newDate, setNewDate] = useState(event.start.toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState(event.start.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'}));
  
  // Conflict & Logic State
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [forceOverride, setForceOverride] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock Attendance State
  const classStudents = students.filter(s => s.classId === event.classId);
  const [attendance, setAttendance] = useState<Record<string, boolean>>(
      classStudents.reduce((acc, s) => ({...acc, [s.id]: true}), {})
  );

  const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // --- CONFLICT DETECTION LOGIC ---
  useEffect(() => {
      if (!editMode) {
          setConflictWarning(null);
          return;
      }
      checkScheduleConflict(newDate, newTime);
  }, [newDate, newTime, editMode]);

  const checkScheduleConflict = (dateStr: string, timeStr: string) => {
      if (!dateStr || !timeStr) return;

      const targetStart = new Date(`${dateStr}T${timeStr}`);
      const durationMinutes = 90; // Default class duration
      const targetEnd = new Date(targetStart.getTime() + durationMinutes * 60000);
      const dayOfWeek = targetStart.getDay(); // 0-6

      let foundConflict: string | null = null;

      // Iterate all classes to find overlap with Teacher OR Room
      for (const cls of classes) {
          if (cls.id === event.classId) continue; // Skip self

          // Only check if Teacher OR Room matches
          // Note: event.room might be 'P.101', cls.location might be 'P.101 - CS1'. Simple includes check.
          const isSameTeacher = cls.teacher === event.teacher;
          const isSameRoom = event.room !== 'Online' && cls.location?.includes(event.room);

          if (!isSameTeacher && !isSameRoom) continue;

          // Check if 'cls' has a session at this time
          // 1. Parse Schedule Days
          const [daysPart, timePart] = cls.schedule.split('•').map(s => s.trim());
          const clsTimeStr = timePart || '18:00';
          const dayMap: Record<string, number> = { 'CN': 0, 'T2': 1, 'T3': 2, 'T4': 3, 'T5': 4, 'T6': 5, 'T7': 6 };
          const targetDays = daysPart ? daysPart.split('/').map(d => dayMap[d.trim()]).filter(d => d !== undefined) : [];

          // 2. Check Date Range
          const clsStart = cls.startDate ? new Date(cls.startDate) : new Date('2023-01-01');
          const clsEnd = cls.endDate ? new Date(cls.endDate) : new Date('2030-12-31');
          
          if (targetStart < clsStart || targetStart > clsEnd) continue;

          // 3. Check Day Match
          if (!targetDays.includes(dayOfWeek)) continue;

          // 4. Check Time Overlap
          const clsSessionStart = new Date(`${dateStr}T${clsTimeStr}`);
          const clsSessionEnd = new Date(clsSessionStart.getTime() + durationMinutes * 60000);

          if (targetStart < clsSessionEnd && targetEnd > clsSessionStart) {
              // Conflict Found!
              if (isSameTeacher) foundConflict = `Giáo viên ${cls.teacher} đang dạy lớp ${cls.name} lúc ${clsTimeStr}.`;
              else foundConflict = `Phòng ${event.room} đang được sử dụng bởi lớp ${cls.name} lúc ${clsTimeStr}.`;
              break;
          }
      }

      setConflictWarning(foundConflict);
      if (foundConflict) {
          generateSuggestions(dateStr, timeStr);
      } else {
          setSuggestions([]);
      }
  };

  const generateSuggestions = (dateStr: string, busyTimeStr: string) => {
      // Simple suggestion logic: try +90m, +180m, -90m on the same day
      const busyHour = parseInt(busyTimeStr.split(':')[0]);
      const alts = [];
      
      if (busyHour - 2 >= 7) alts.push(`${(busyHour - 2).toString().padStart(2,'0')}:00`);
      if (busyHour + 2 <= 21) alts.push(`${(busyHour + 2).toString().padStart(2,'0')}:00`);

      setSuggestions(alts);
  };

  const toggleAttendance = (id: string) => {
      setAttendance(prev => ({...prev, [id]: !prev[id]}));
  };

  const handleSave = async () => {
      // 1. Validation
      if (!newDate || !newTime) {
          alert("Vui lòng chọn đầy đủ Ngày và Giờ mới!");
          return;
      }

      if (conflictWarning && !forceOverride) {
          alert("Vui lòng xử lý xung đột lịch hoặc chọn 'Vẫn tiếp tục' để ghi đè (Chỉ Admin).");
          return;
      }

      // 2. Set Loading
      setIsLoading(true);

      // Simulate API delay for UX
      await new Promise(resolve => setTimeout(resolve, 800));

      const updated = new Date(`${newDate}T${newTime}`);
      
      // 3. Confirm and Execute
      if (confirm(`Xác nhận dời lịch sang ${updated.toLocaleString('vi-VN')}? \n\nLƯU Ý: Hành động này sẽ tự động lùi toàn bộ lịch học phía sau!`)) {
          onUpdate(updated); // This triggers updateScheduleChain in parent
      }
      
      setIsLoading(false);
  };

  const handleApplySuggestion = (time: string) => {
      setNewTime(time);
  };

  const handleCancelSession = async () => {
      if (!confirm(`Xác nhận BÁO NGHỈ buổi học này (${event.start.toLocaleDateString('vi-VN')})?\n\nHệ thống sẽ:\n1. Hủy buổi học này\n2. Tự động lùi toàn bộ lịch học phía sau 1 buổi\n3. Cập nhật ngày kết thúc khóa học`)) {
          return;
      }

      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));

      const result = cancelClassSession(event.classId, event.start.toISOString().split('T')[0]);
      
      setIsLoading(false);
      
      if (result) {
          alert(result.message);
          onClose();
      }
  };

  const handleSaveContent = () => {
      setIsLoading(true);
      setTimeout(() => {
          setIsLoading(false);
          alert("Đã lưu nội dung bài giảng và điểm danh!");
          onClose();
      }, 600);
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
            
            <div className="relative z-10 text-white w-full pr-8">
                <div className="flex items-center justify-between mb-1 opacity-90 text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">
                            {event.mode === 'online' ? 'language' : 'apartment'}
                        </span>
                        <span>{event.level}</span>
                        <span className="opacity-50">|</span>
                        {/* CONDITIONAL DISPLAY: Link vs Room */}
                        {event.mode === 'online' ? (
                            <a href={event.link || '#'} target="_blank" className="hover:underline hover:text-blue-100 flex items-center gap-1" title={event.link || 'Chưa có link'}>
                                {event.link ? 'Link học Online' : 'Chưa có Link'}
                                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                            </a>
                        ) : (
                            <span>{event.room}</span>
                        )}
                        {event.index && <span className="bg-white/20 px-1.5 rounded ml-1">Buổi {event.index}</span>}
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
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors z-20"
                title="Đóng (Esc)"
            >
                <span className="material-symbols-outlined text-[24px]">close</span>
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
                            <button 
                                onClick={handleSaveContent} 
                                disabled={isLoading}
                                className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded shadow-sm hover:bg-primary-dark disabled:opacity-50 transition-all"
                            >
                                {isLoading ? 'Đang lưu...' : 'Lưu nội dung'}
                            </button>
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
                                <button 
                                    onClick={handleCancelSession}
                                    disabled={isLoading}
                                    className="col-span-2 w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 font-bold py-3 rounded-lg border border-red-200 dark:border-red-800 transition-colors mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                                    ) : (
                                        <span className="material-symbols-outlined">block</span>
                                    )}
                                    {isLoading ? 'Đang xử lý...' : 'Báo nghỉ buổi này (Tự động lùi lịch)'}
                                </button>
                                
                                <div className="col-span-2 text-center text-xs text-slate-400 font-medium my-1">- HOẶC DỜI THỦ CÔNG -</div>

                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block font-semibold">Ngày mới</label>
                                    <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full text-sm border-slate-300 dark:border-slate-600 rounded-md focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-800" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block font-semibold">Giờ mới</label>
                                    <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="w-full text-sm border-slate-300 dark:border-slate-600 rounded-md focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-800" />
                                </div>

                                {/* CONFLICT WARNING AREA */}
                                {conflictWarning && (
                                    <div className="col-span-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 animate-in slide-in-from-top-2">
                                        <div className="flex items-start gap-2 text-red-700 dark:text-red-300 mb-2">
                                            <span className="material-symbols-outlined text-[20px]">warning</span>
                                            <p className="text-xs font-bold mt-0.5">{conflictWarning}</p>
                                        </div>
                                        
                                        {suggestions.length > 0 && (
                                            <div className="mb-2">
                                                <p className="text-[10px] text-red-600 dark:text-red-400 mb-1 font-medium">Gợi ý lịch trống:</p>
                                                <div className="flex gap-2">
                                                    {suggestions.map(time => (
                                                        <button 
                                                            key={time}
                                                            onClick={() => handleApplySuggestion(time)}
                                                            className="px-2 py-1 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 rounded text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                                                        >
                                                            {time}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {isAdminOrManager && (
                                            <label className="flex items-center gap-2 cursor-pointer mt-1">
                                                <input 
                                                    type="checkbox" 
                                                    checked={forceOverride} 
                                                    onChange={(e) => setForceOverride(e.target.checked)}
                                                    className="rounded border-red-300 text-red-600 focus:ring-red-500 size-4"
                                                />
                                                <span className="text-xs text-red-700 dark:text-red-300 font-bold">Vẫn tiếp tục (Ghi đè)</span>
                                            </label>
                                        )}
                                    </div>
                                )}
                                
                                <button 
                                    onClick={handleSave} 
                                    disabled={isLoading || (!!conflictWarning && !forceOverride)}
                                    className="col-span-2 mt-1 w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-sm font-bold py-2.5 rounded-lg transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading && <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>}
                                    {isLoading ? 'Đang cập nhật hệ thống...' : 'Xác nhận Dời lịch (Lũy kế)'}
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
                    
                    <button 
                        onClick={handleSaveContent} 
                        disabled={isLoading}
                        className="mt-4 w-full bg-primary hover:bg-primary-dark text-white text-sm font-bold py-3 rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-2"
                    >
                        {isLoading && <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>}
                        {isLoading ? 'Đang lưu...' : 'Lưu bảng điểm danh'}
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ClassEventModal;
