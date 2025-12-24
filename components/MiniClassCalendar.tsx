
import React, { useState, useMemo } from 'react';
import { ClassItem } from '../types';

interface Props {
  classData: ClassItem;
  onAttendanceClick?: (date: string) => void;
}

const MiniClassCalendar: React.FC<Props> = ({ classData, onAttendanceClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // --- LOGIC: PARSE SCHEDULE & GENERATE EVENTS ---
  const events = useMemo(() => {
    const generatedEvents: any[] = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Parse Schedule String (e.g., "T2 / T4 / T6 • 18:30")
    const [daysPart, timePart] = classData.schedule.split('•').map(s => s.trim());
    const days = daysPart ? daysPart.split('/').map(d => d.trim()) : [];
    
    // Map Vietnamese Days to JS GetDay() (0-6)
    const dayMap: Record<string, number> = { 'CN': 0, 'T2': 1, 'T3': 2, 'T4': 3, 'T5': 4, 'T6': 5, 'T7': 6 };
    const targetDays = days.map(d => dayMap[d]).filter(d => d !== undefined);
    
    const today = new Date();
    today.setHours(0,0,0,0);

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        if (targetDays.includes(date.getDay())) {
            // Mock Logic: If date is in the past, randomly assign "Missing Attendance" status
            const isPast = date < today;
            const isMissingAttendance = isPast && (day % 3 === 0); // Mock condition

            generatedEvents.push({
                date: date,
                day: day,
                time: timePart || '18:30',
                title: `Bài ${Math.ceil(day / 2)}: Giáo trình A1`, // Mock lesson name
                teacher: classData.teacher,
                isMissingAttendance,
                isPast
            });
        }
    }
    return generatedEvents;
  }, [classData, currentDate]);

  // --- RENDER HELPERS ---
  const getDaysArray = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1).getDay(); // 0-6
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // Adjust firstDay (0 is Sunday, make Monday start for VN calendar standard)
      // JS: 0=Sun, 1=Mon ... 6=Sat
      // Visual: Mon=0, ... Sun=6
      const padding = firstDay === 0 ? 6 : firstDay - 1; 
      
      const res = [];
      for(let i=0; i<padding; i++) res.push(null);
      for(let i=1; i<=daysInMonth; i++) res.push(i);
      return res;
  };

  const handlePrev = () => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
      setSelectedDate(null);
  };

  const handleNext = () => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
      setSelectedDate(null);
  };

  const handleDayClick = (day: number) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const evt = events.find(e => e.day === day);
      if (evt) {
          setSelectedDate(date);
      }
  };

  const selectedEvent = selectedDate ? events.find(e => e.day === selectedDate.getDate()) : null;

  return (
    <div className="bg-white dark:bg-[#1a202c] rounded-xl shadow-subtle border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#EDF2F7] dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">calendar_month</span>
                Lịch lớp học
            </h3>
            <div className="flex items-center gap-1">
                <button onClick={handlePrev} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-16 text-center">
                    {currentDate.getMonth() + 1}/{currentDate.getFullYear()}
                </span>
                <button onClick={handleNext} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
            </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 mb-2 text-center">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => (
                    <div 
                        key={d} 
                        className={`text-[10px] font-semibold uppercase ${i === 6 ? 'text-[#E53E3E]' : 'text-[#4A5568] dark:text-slate-400'}`}
                    >
                        {d}
                    </div>
                ))}
            </div>
            
            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-1">
                {getDaysArray().map((day, idx) => {
                    const isSunday = (idx % 7) === 6;
                    
                    if (day === null) return <div key={`empty-${idx}`} className={isSunday ? 'bg-[#FFF5F5] dark:bg-red-900/10 rounded-md' : ''}></div>;
                    
                    const evt = events.find(e => e.day === day);
                    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                    const isSelected = selectedDate?.getDate() === day;

                    return (
                        <div 
                            key={day} 
                            onClick={() => handleDayClick(day)}
                            className={`
                                relative h-9 w-full flex flex-col items-center justify-center cursor-pointer transition-all rounded-md
                                ${isSunday ? 'bg-[#FFF5F5] dark:bg-red-900/10' : 'hover:bg-[#F7FAFC] dark:hover:bg-slate-800'}
                            `}
                        >
                            <span className={`
                                flex items-center justify-center w-7 h-7 text-xs font-medium rounded-full transition-all
                                ${isToday ? 'border border-primary text-primary font-bold' : isSunday ? 'text-[#E53E3E]' : 'text-slate-700 dark:text-slate-300'}
                                ${isSelected ? 'bg-primary text-white !border-primary' : ''}
                            `}>
                                {day}
                            </span>
                            
                            {/* Dot Indicator for Events - Updated to Orange (secondary) */}
                            {evt && (
                                <div className="mt-0.5 flex gap-0.5">
                                    <span className={`size-1 rounded-full ${evt.isMissingAttendance ? 'bg-red-500 animate-pulse' : 'bg-secondary'}`}></span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Selected Event Details (Panel) */}
        {selectedEvent ? (
            <div className="px-4 pb-4 animate-in slide-in-from-bottom-2 fade-in">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase">
                            {selectedEvent.date.toLocaleDateString('vi-VN', {weekday: 'long', day: 'numeric', month: 'numeric'})}
                        </span>
                        {selectedEvent.isMissingAttendance && (
                            <span className="text-[10px] font-bold text-red-600 bg-white px-1.5 py-0.5 rounded border border-red-200">Chưa điểm danh</span>
                        )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{selectedEvent.title}</h4>
                    <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        <p className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">schedule</span> {selectedEvent.time} - 20:00</p>
                        <p className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">person</span> {selectedEvent.teacher}</p>
                    </div>
                    <button 
                        onClick={() => onAttendanceClick && onAttendanceClick(selectedEvent.date.toISOString())}
                        className="mt-3 w-full py-1.5 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-xs font-bold rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                    >
                        {selectedEvent.isPast ? 'Bổ sung điểm danh' : 'Điểm danh ngay'}
                    </button>
                </div>
            </div>
        ) : (
            <div className="px-4 pb-4 text-center">
                <p className="text-xs text-slate-400 italic">Chọn một ngày có lịch học để xem chi tiết</p>
            </div>
        )}
    </div>
  );
};

export default MiniClassCalendar;
