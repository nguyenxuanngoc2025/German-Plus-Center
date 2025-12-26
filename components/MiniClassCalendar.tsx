
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useData } from '../context/DataContext';
import { ClassItem } from '../types';

interface Props {
  classData: ClassItem;
  onAttendanceClick?: (date: string) => void;
}

interface CalendarEvent {
  id: string; 
  classId: string;
  title: string;
  code: string;
  start: Date;
  end: Date;
  teacher: string;
  teacherAvatar?: string;
  room: string;
  status: 'active' | 'upcoming' | 'full' | 'finished' | 'paused';
  color: string;
  index?: number;
  isLocked?: boolean;
  mode: 'online' | 'offline';
  link?: string;
  location?: string;
  isExtra?: boolean;
}

// Popup Position Interface
interface PopupState {
    visible: boolean;
    x: number;
    y: number;
    event: CalendarEvent | null;
}

const MiniClassCalendar: React.FC<Props> = ({ classData, onAttendanceClick }) => {
  const { generateClassSessions, updateScheduleChain, cancelClassSession } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync date with class start date on mount
  useEffect(() => {
      if (classData?.startDate) {
          const start = new Date(classData.startDate);
          const end = classData.endDate ? new Date(classData.endDate) : new Date();
          const now = new Date();
          // If today is within range, show today. Else show start date.
          if (now >= start && now <= end) {
              setCurrentDate(now);
          } else {
              setCurrentDate(start);
          }
      }
  }, [classData?.id, classData?.startDate, classData?.endDate]);

  // Smart Popup State
  const [popup, setPopup] = useState<PopupState>({ 
      visible: false, x: 0, y: 0, event: null
  });
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setPopup(prev => ({ ...prev, visible: false }));
      }
    };
    const handleScroll = () => setPopup(prev => ({ ...prev, visible: false }));

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true); 
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  // --- DATA ENGINE (Single Class Version) ---
  const events = useMemo(() => {
    let generatedEvents: CalendarEvent[] = [];
    // Fetch broadly to cover edge cases
    const rangeStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); 
    const rangeEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); 
    
    // Padding dates
    rangeStart.setDate(rangeStart.getDate() - 7);
    rangeEnd.setDate(rangeEnd.getDate() + 7);

    // Only process the single class passed via props
    if (classData) {
        const [_, timePart] = classData.schedule.split('•').map(s => s.trim());
        const sessions = generateClassSessions(classData);

        sessions.forEach(session => {
            const sessionStart = new Date(`${session.date}T${timePart || '18:00'}`);
            if (sessionStart < rangeStart || sessionStart > rangeEnd) return;

            const sessionEnd = new Date(sessionStart);
            sessionEnd.setMinutes(sessionStart.getMinutes() + 90); 

            generatedEvents.push({
                id: session.id,
                classId: classData.id,
                title: classData.name, // Keep Full Name for Popup
                code: classData.code,  // Keep Code for Bar
                start: sessionStart,
                end: sessionEnd,
                teacher: classData.teacher,
                teacherAvatar: classData.teacherAvatar,
                room: classData.mode === 'online' ? (classData.link || 'Online') : (classData.location?.split(',')[0] || 'Tại trung tâm'),
                status: classData.status,
                color: session.isExtra ? 'purple' : 'blue',
                index: session.index,
                isLocked: session.isLocked,
                mode: classData.mode,
                link: classData.link,
                location: classData.location,
                isExtra: session.isExtra
            });
        });
    }
    return generatedEvents;
  }, [classData, currentDate, generateClassSessions]);

  // --- SMART POSITIONING LOGIC ---
  const handleEventClick = (e: React.MouseEvent, evt: CalendarEvent, colIndex: number) => {
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      
      const popoverW = 320; 
      const popoverH = 340;
      const gap = 8;
      
      let x = 0;
      let y = 0;

      // 1. HORIZONTAL
      let placeRight = true;
      if (colIndex >= 5) { // Sat, Sun force left
          placeRight = false;
      } else if (colIndex <= 1) { // Mon, Tue force right
          placeRight = true;
      } else {
          // Check right space
          if (rect.right + gap + popoverW > viewportW) placeRight = false;
      }

      if (placeRight) {
          x = rect.right + gap;
      } else {
          x = rect.left - popoverW - gap;
      }

      // 2. VERTICAL
      y = rect.top; // Default: Top Align

      // Check Bottom Overflow
      if (y + popoverH > viewportH) {
          y = rect.bottom - popoverH;
      }

      // Check Top Overflow (Header approx 80px)
      if (y < 80) {
          y = 80 + 10;
      }

      // Boundary Safety
      if (x < 10) x = 10;
      if (x + popoverW > viewportW) x = viewportW - popoverW - 10;

      setPopup({ visible: true, x, y, event: evt });
  };

  // --- ACTIONS ---
  const handleShiftSchedule = (event: CalendarEvent) => {
      const days = parseInt(prompt("Nhập số ngày muốn lùi (ví dụ: 7):", "7") || "0");
      if (days > 0) {
          const newDate = new Date(event.start);
          newDate.setDate(newDate.getDate() + days);
          const isoString = newDate.toISOString().split('T')[0] + 'T' + event.start.toTimeString().slice(0,5);
          
          const result = updateScheduleChain(event.classId, event.index || 0, isoString);
          if (result?.success) {
              alert(result.message);
              setPopup(prev => ({...prev, visible: false}));
          }
      }
  };

  const handleCancelSession = (event: CalendarEvent) => {
      if (confirm(`Xác nhận HỦY buổi học ${event.title} ngày ${event.start.toLocaleDateString('vi-VN')}?\n\nLịch sẽ tự động được tịnh tiến.`)) {
          const dateStr = event.start.toISOString().split('T')[0];
          const result = cancelClassSession(event.classId, dateStr);
          if (result?.success) {
              alert(result.message);
              setPopup(prev => ({...prev, visible: false}));
          }
      }
  };

  // --- RENDER HELPERS ---
  const getDaysArray = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const startDayOfWeek = (firstDay.getDay() + 6) % 7; 

      const days = [];
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      
      for (let i = startDayOfWeek; i > 0; i--) {
          days.push({ date: new Date(year, month - 1, prevMonthLastDay - i + 1), type: 'prev' });
      }
      
      for (let i = 1; i <= lastDay.getDate(); i++) {
          days.push({ date: new Date(year, month, i), type: 'current' });
      }
      
      const totalSoFar = days.length;
      const remainingCells = (7 - (totalSoFar % 7)) % 7;
      
      for (let i = 1; i <= remainingCells; i++) {
          days.push({ date: new Date(year, month + 1, i), type: 'next' });
      }
      return days;
  };

  const getEventsForDay = (date: Date) => {
      return events.filter(e => e.start.toDateString() === date.toDateString())
                   .sort((a,b) => a.start.getTime() - b.start.getTime());
  };

  const calendarDays = useMemo(() => getDaysArray(), [currentDate]);

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-white dark:bg-[#1a202c] font-display">
      
      {/* 1. TOP CONTROLS */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#1a202c] border-b border-slate-50 dark:border-slate-800 shrink-0 z-10">
          <div className="flex items-center gap-4">
                <div className="flex bg-slate-50/50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 overflow-hidden p-0.5">
                    <button 
                        onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                        className="px-2 py-1 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors text-slate-400 dark:text-slate-300 hover:text-slate-700 hover:shadow-sm"
                    >
                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                    </button>
                    <button 
                        onClick={() => setCurrentDate(new Date())}
                        className="px-3 py-1 hover:bg-white dark:hover:bg-slate-700 rounded-md text-xs font-bold text-slate-600 dark:text-white transition-all uppercase hover:shadow-sm"
                    >
                        Hôm nay
                    </button>
                    <button 
                        onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                        className="px-2 py-1 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors text-slate-400 dark:text-slate-300 hover:text-slate-700 hover:shadow-sm"
                    >
                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </button>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white capitalize tracking-tight pl-2">
                    Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
                </h3>
          </div>
          <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700">
                  <span className="material-symbols-outlined text-[16px]">event</span>
                  <span>{events.length} buổi</span>
              </div>
          </div>
      </div>

      {/* 2. CALENDAR GRID WRAPPER (No Scale, Auto Height) */}
      <div className="flex-1 flex flex-col relative">
        <div className="w-full bg-white dark:bg-[#1a202c] flex flex-col">
            
            {/* Header Days */}
            <div className="grid grid-cols-7 border-b border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10">
                {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'].map((d, i) => (
                    <div key={d} className={`py-3 text-center text-xs font-bold uppercase tracking-widest ${i === 6 ? 'text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        {d}
                    </div>
                ))}
            </div>

            {/* Grid Cells (Flow) */}
            <div className="grid grid-cols-7 divide-x divide-[#f1f5f9] dark:divide-slate-800 divide-y border-b border-slate-100 dark:border-slate-800">
                {calendarDays.map((day, idx) => {
                    const isCurrentMonth = day.type === 'current';
                    const isToday = new Date().toDateString() === day.date.toDateString();
                    const dayEvents = isCurrentMonth ? getEventsForDay(day.date) : [];
                    
                    const colIndex = idx % 7;

                    return (
                        <div 
                            key={idx} 
                            className={`min-h-[120px] p-2 group transition-all relative flex flex-col gap-1.5
                                ${isCurrentMonth ? 'bg-white dark:bg-[#1a202c] hover:bg-slate-50/50 dark:hover:bg-slate-800' : 'bg-slate-50/30 dark:bg-slate-900/30 opacity-40 grayscale pointer-events-none'}
                            `}
                        >
                            <span className={`text-[12px] font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 shrink-0 transition-shadow ${isToday ? 'bg-red-500 text-white shadow-md shadow-red-200 dark:shadow-none' : isCurrentMonth ? 'text-slate-600 dark:text-slate-300' : 'text-slate-300'}`}>
                                {day.date.getDate()}
                            </span>

                            <div className="flex flex-1 flex-col gap-1.5 min-h-0">
                                {dayEvents.map(evt => {
                                    const isOnline = evt.mode === 'online';
                                    
                                    // Refined Soft Colors
                                    const cardBg = isOnline ? 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30' : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30';
                                    const borderColor = isOnline ? 'border-orange-300' : 'border-blue-300';
                                    const textColor = isOnline ? 'text-orange-700 dark:text-orange-200' : 'text-blue-700 dark:text-blue-200';
                                    const dotColor = isOnline ? 'bg-orange-400' : 'bg-blue-500';

                                    return (
                                        <React.Fragment key={evt.id}>
                                            {/* 1. Mobile/Small: Large Indicator Dot */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEventClick(e, evt, colIndex);
                                                }}
                                                className={`w-3 h-3 rounded-full ${dotColor} shrink-0 block lg:hidden hover:scale-125 transition-transform shadow-sm ring-1 ring-white dark:ring-slate-800 mb-1`}
                                                title={`${evt.title} (${evt.start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})})`}
                                            />

                                            {/* 2. Desktop/Large: Full Card - Minimalist (Time + Code) */}
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEventClick(e, evt, colIndex);
                                                }}
                                                className={`hidden lg:block w-full text-left border-l-[3px] ${borderColor} ${cardBg} rounded-r-md px-2 py-1.5 transition-all shadow-sm hover:shadow group/card relative z-10 shrink-0 pointer-events-auto`}
                                            >
                                                <div className={`text-[11px] font-bold ${textColor} leading-tight whitespace-normal break-words`}>
                                                    {evt.start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} {evt.code}
                                                </div>
                                                {evt.isExtra && (
                                                    <span className="absolute top-0 right-0 size-1.5 bg-purple-400 rounded-full -mt-0.5 -mr-0.5 ring-1 ring-white"></span>
                                                )}
                                            </button>
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>

      {/* SMART POPUP (PORTAL) */}
      {popup.visible && popup.event && createPortal(
          <div 
            ref={popupRef}
            className="fixed z-[9999] w-[320px] bg-white dark:bg-[#1e293b] rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden"
            style={{
                left: popup.x,
                top: popup.y,
            }}
          >
              {/* Header */}
              <div className="p-4 border-b border-slate-50 dark:border-slate-700 flex justify-between items-start bg-slate-50/50 dark:bg-slate-800/50">
                  <div>
                      <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${popup.event.mode === 'online' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                              {popup.event.mode}
                          </span>
                          {popup.event.index && <span className="text-xs font-bold text-slate-400">Buổi {popup.event.index}</span>}
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base leading-tight">{popup.event.title}</h4>
                  </div>
                  <button 
                      onClick={() => setPopup(prev => ({...prev, visible: false}))}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                      <span className="material-symbols-outlined text-lg">close</span>
                  </button>
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col gap-3 text-sm">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                      <span className="material-symbols-outlined text-slate-400">schedule</span>
                      <span className="font-medium">
                          {popup.event.start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {popup.event.end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                      </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                      <span className="material-symbols-outlined text-slate-400">person</span>
                      <span className="font-medium">{popup.event.teacher}</span>
                  </div>

                  <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                      <span className="material-symbols-outlined text-slate-400 mt-0.5">
                          {popup.event.mode === 'online' ? 'link' : 'location_on'}
                      </span>
                      <div className="flex-1">
                          {popup.event.mode === 'online' ? (
                              <a href={popup.event.link || '#'} target="_blank" className="text-blue-600 hover:underline break-all font-medium flex items-center gap-1">
                                  Mở Zoom/Meet <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                              </a>
                          ) : (
                              <span className="font-medium">{popup.event.room}</span>
                          )}
                      </div>
                  </div>

                  <hr className="border-slate-50 dark:border-slate-700 my-1"/>
                  
                  {/* Actions (New Grid Design) */}
                  <div className="grid grid-cols-2 gap-2 mt-1">
                      {onAttendanceClick && (
                          <button 
                              onClick={() => { onAttendanceClick(popup.event!.start.toISOString()); setPopup(prev => ({...prev, visible: false})); }}
                              className="col-span-2 flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 hover:bg-primary-dark transition-all active:scale-[0.98]"
                          >
                              <span className="material-symbols-outlined text-[18px]">fact_check</span>
                              Điểm danh
                          </button>
                      )}
                      <button 
                          onClick={() => handleShiftSchedule(popup.event!)}
                          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
                      >
                          <span className="material-symbols-outlined text-[18px]">edit_calendar</span>
                          Lùi lịch
                      </button>
                      <button 
                          onClick={() => handleCancelSession(popup.event!)}
                          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold transition-colors"
                      >
                          <span className="material-symbols-outlined text-[18px]">event_busy</span>
                          Hủy lịch
                      </button>
                  </div>
              </div>
          </div>,
          document.body
      )}
    </div>
  );
};

export default MiniClassCalendar;
