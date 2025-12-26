
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { ClassItem } from '../types';

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
  status: 'active' | 'upcoming' | 'full' | 'finished' | 'paused' | 'incomplete' | 'missed';
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
    positionClass?: string; // To handle transform origin if needed
}

const Calendar: React.FC = () => {
  const { classes, generateClassSessions, updateScheduleChain, cancelClassSession, currentUser } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();
  
  // Filters
  const [teacherFilter, setTeacherFilter] = useState('Tất cả');
  const [classTypeFilter, setClassTypeFilter] = useState('Tất cả');

  // Smart Popup State
  const [popup, setPopup] = useState<PopupState>({ 
      visible: false, x: 0, y: 0, event: null
  });
  const popupRef = useRef<HTMLDivElement>(null);

  const isAssistant = currentUser?.role === 'assistant';

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is on the calendar event itself to prevent immediate close/re-open flicker if needed
      // But mostly we just check if it's outside the popup
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setPopup(prev => ({ ...prev, visible: false }));
      }
    };
    const handleScroll = () => setPopup(prev => ({ ...prev, visible: false }));
    const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setPopup(prev => ({ ...prev, visible: false }));
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    window.addEventListener('scroll', handleScroll, true); 
    
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('keydown', handleEsc);
        window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  // --- DATA ENGINE ---
  const events = useMemo(() => {
    let generatedEvents: CalendarEvent[] = [];
    const rangeStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); 
    const rangeEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); 
    
    rangeStart.setDate(rangeStart.getDate() - 7);
    rangeEnd.setDate(rangeEnd.getDate() + 7);

    classes.forEach(cls => {
        if (teacherFilter !== 'Tất cả' && cls.teacher !== teacherFilter) return;
        if (classTypeFilter !== 'Tất cả') {
            if (classTypeFilter === 'Online' && cls.mode !== 'online') return;
            if (classTypeFilter === 'Offline' && cls.mode !== 'offline') return;
        }

        const [_, timePart] = cls.schedule.split('•').map(s => s.trim());
        const sessions = generateClassSessions(cls);

        sessions.forEach(session => {
            const sessionStart = new Date(`${session.date}T${timePart || '18:00'}`);
            if (sessionStart < rangeStart || sessionStart > rangeEnd) return;

            const sessionEnd = new Date(sessionStart);
            sessionEnd.setMinutes(sessionStart.getMinutes() + 90); 

            generatedEvents.push({
                id: session.id,
                classId: cls.id,
                title: cls.name, // Keep Full Name for Popover
                code: cls.code,  // Keep Code for Bar Display
                start: sessionStart,
                end: sessionEnd,
                teacher: cls.teacher,
                teacherAvatar: cls.teacherAvatar,
                room: cls.mode === 'online' ? (cls.link || 'Online') : (cls.location?.split(',')[0] || 'Tại trung tâm'),
                status: (session as any).status || cls.status, 
                color: session.isExtra ? 'purple' : 'blue',
                index: session.index,
                isLocked: session.isLocked,
                mode: cls.mode,
                link: cls.link,
                location: cls.location,
                isExtra: session.isExtra
            });
        });
    });
    return generatedEvents;
  }, [classes, currentDate, teacherFilter, classTypeFilter, generateClassSessions]);

  // --- SMART POSITIONING ALGORITHM (Global Rule #2) ---
  const handleEventClick = (e: React.MouseEvent, evt: CalendarEvent, colIndex: number) => {
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      
      // Constants
      const POPUP_WIDTH = 340; 
      const POPUP_HEIGHT_EST = 380; // Estimated max height
      const GAP = 12;
      const VIEWPORT_W = window.innerWidth;
      const VIEWPORT_H = window.innerHeight;

      let x = 0;
      let y = 0;

      // 1. Horizontal Placement (Prefer Right, Flip Left if no space)
      // Check space on right
      if (rect.right + GAP + POPUP_WIDTH > VIEWPORT_W) {
          // Overflow right -> Place Left
          x = rect.left - POPUP_WIDTH - GAP;
      } else {
          // Place Right
          x = rect.right + GAP;
      }

      // Mobile Fallback: If screen is too small (e.g. mobile), center it or ensure valid X
      if (VIEWPORT_W < 768) {
          x = (VIEWPORT_W - POPUP_WIDTH) / 2; // Center
          if (x < 10) x = 10;
      } else {
          // Desktop Boundary Safety
          if (x < 10) x = 10; // Don't go off left edge
      }

      // 2. Vertical Placement (Containment - Global Rule #2)
      // Align top with element initially
      y = rect.top;

      // Check Bottom Overflow
      if (y + POPUP_HEIGHT_EST > VIEWPORT_H) {
          // Shift Up
          y = VIEWPORT_H - POPUP_HEIGHT_EST - GAP;
      }
      
      // Check Top Overflow (e.g. if shifted up too much)
      if (y < GAP) y = GAP;

      setPopup({ visible: true, x, y, event: evt });
  };

  // --- ACTIONS ---
  const handleShiftSchedule = (event: CalendarEvent) => {
      if (isAssistant) {
          alert('Bạn không có quyền thực hiện thao tác này (Chỉ Admin/Manager/Giáo viên chính).');
          return;
      }
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
      if (isAssistant) {
          alert('Bạn không có quyền thực hiện thao tác này (Chỉ Admin/Manager/Giáo viên chính).');
          return;
      }
      if (confirm(`Xác nhận HỦY buổi học ${event.title} ngày ${event.start.toLocaleDateString('vi-VN')}?\n\nLịch sẽ tự động được tịnh tiến.`)) {
          const dateStr = event.start.toISOString().split('T')[0];
          const result = cancelClassSession(event.classId, dateStr);
          if (result?.success) {
              alert(result.message);
              setPopup(prev => ({...prev, visible: false}));
          }
      }
  };

  const handleAttendanceRedirect = (event: CalendarEvent) => {
      navigate(`/classes/${event.classId}`);
      setPopup(prev => ({...prev, visible: false}));
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

  const teachers = Array.from(new Set(classes.map(c => c.teacher)));
  const calendarDays = useMemo(() => getDaysArray(), [currentDate]);

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-[#f8fafc] dark:bg-[#101622] font-display relative">
      <Header title="Lịch học & Đào tạo" />
      
      <main className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
        
        <div className="flex flex-col bg-white dark:bg-[#1a202c] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden min-h-full">
            
            {/* Calendar Control Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0 z-20">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    
                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <button 
                                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                                className="px-3 py-1.5 hover:bg-white dark:hover:bg-slate-700 border-r border-slate-200 dark:border-slate-700 transition-colors text-slate-600 dark:text-slate-300"
                            >
                                <span className="material-symbols-outlined text-lg">chevron_left</span>
                            </button>
                            <button 
                                onClick={() => setCurrentDate(new Date())}
                                className="px-4 py-1.5 hover:bg-white dark:hover:bg-slate-700 text-sm font-bold text-slate-800 dark:text-white transition-colors uppercase"
                            >
                                Hôm nay
                            </button>
                            <button 
                                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                                className="px-3 py-1.5 hover:bg-white dark:hover:bg-slate-700 border-l border-slate-200 dark:border-slate-700 transition-colors text-slate-600 dark:text-slate-300"
                            >
                                <span className="material-symbols-outlined text-lg">chevron_right</span>
                            </button>
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white capitalize tracking-tight hidden sm:block">
                            Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
                        </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                        <select 
                            value={teacherFilter}
                            onChange={(e) => setTeacherFilter(e.target.value)}
                            className="h-9 pl-3 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-primary cursor-pointer shadow-sm hover:border-slate-300"
                        >
                            <option value="Tất cả">GV: Tất cả</option>
                            {teachers.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>

                        <select 
                            value={classTypeFilter}
                            onChange={(e) => setClassTypeFilter(e.target.value)}
                            className="h-9 pl-3 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-primary cursor-pointer shadow-sm hover:border-slate-300"
                        >
                            <option value="Tất cả">Lớp: Tất cả</option>
                            <option value="Online">Online</option>
                            <option value="Offline">Offline</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 flex flex-col">
                <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
                    {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'].map((d, i) => (
                        <div key={d} className={`py-3 text-center text-xs font-bold uppercase tracking-widest ${i === 6 ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                            {d}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1a202c]">
                    {calendarDays.map((day, idx) => {
                        const isCurrentMonth = day.type === 'current';
                        const isToday = new Date().toDateString() === day.date.toDateString();
                        const dayEvents = isCurrentMonth ? getEventsForDay(day.date) : [];
                        const colIndex = idx % 7;

                        const cellClass = `
                            min-h-[150px] p-2 transition-all relative flex flex-col gap-2 border-b border-slate-100 dark:border-slate-800
                            ${isCurrentMonth ? 'bg-white dark:bg-[#1a202c] hover:bg-slate-50/30 dark:hover:bg-slate-800/30' : 'bg-slate-50/50 dark:bg-slate-900/50 opacity-40'}
                        `;

                        return (
                            <div key={idx} className={cellClass}>
                                <div className="flex justify-between items-start">
                                    <span className={`text-[13px] font-bold w-7 h-7 flex items-center justify-center rounded-full transition-shadow ${isToday ? 'bg-red-600 text-white shadow-md' : isCurrentMonth ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                                        {day.date.getDate()}
                                    </span>
                                    {dayEvents.length > 0 && <span className="text-[10px] font-bold text-slate-400">{dayEvents.length} lớp</span>}
                                </div>

                                <div className="flex flex-col gap-1.5 flex-1 w-full">
                                    <div className="hidden lg:flex flex-col gap-1.5 w-full">
                                        {dayEvents.map(evt => {
                                            const isOnline = evt.mode === 'online';
                                            const isIncomplete = evt.status === 'incomplete';
                                            const isFinished = evt.status === 'finished';
                                            
                                            // Dynamic Styling for Incomplete
                                            let cardBg, textColor;
                                            if (isIncomplete) {
                                                // Gray striped for incomplete
                                                cardBg = 'bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-600 bg-[linear-gradient(45deg,rgba(0,0,0,0.03)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.03)_50%,rgba(0,0,0,0.03)_75%,transparent_75%,transparent)] bg-[length:10px_10px]';
                                                textColor = 'text-slate-600 dark:text-slate-400';
                                            } else {
                                                cardBg = isOnline 
                                                    ? 'bg-orange-50 hover:bg-orange-100 border-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:border-orange-800' 
                                                    : 'bg-blue-50 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-800';
                                                textColor = isOnline ? 'text-orange-800 dark:text-orange-200' : 'text-blue-800 dark:text-blue-200';
                                            }

                                            return (
                                                <button 
                                                    key={evt.id}
                                                    onClick={(e) => {
                                                        handleEventClick(e, evt, colIndex);
                                                    }}
                                                    className={`w-full text-left border ${cardBg} rounded px-2 py-1.5 transition-all shadow-sm hover:shadow group/card relative z-10 ${isFinished ? 'opacity-70 grayscale-[0.3]' : ''}`}
                                                >
                                                    <div className={`text-[11px] font-bold ${textColor} leading-tight whitespace-normal break-words flex items-center justify-between`}>
                                                        <span>{evt.start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} {evt.code}</span>
                                                        {isFinished && <span className="material-symbols-outlined text-[14px] text-green-600 font-bold">check_circle</span>}
                                                        {isIncomplete && <span className="material-symbols-outlined text-[14px] text-orange-500 font-bold" title="Chưa điểm danh đủ">warning</span>}
                                                    </div>
                                                    {evt.isExtra && (
                                                        <span className="absolute top-1 right-1 size-1.5 bg-purple-500 rounded-full ring-1 ring-white"></span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="lg:hidden flex flex-wrap content-start gap-1.5">
                                        {dayEvents.map(evt => {
                                            const isOnline = evt.mode === 'online';
                                            const dotColor = evt.status === 'incomplete' ? 'bg-slate-400' : isOnline ? 'bg-orange-500' : 'bg-blue-600';
                                            return (
                                                <button
                                                    key={evt.id}
                                                    onClick={(e) => {
                                                        handleEventClick(e, evt, colIndex);
                                                    }}
                                                    className={`w-3.5 h-3.5 rounded-full ${dotColor} shrink-0 hover:scale-125 transition-transform shadow-sm ring-1 ring-white dark:ring-slate-800`}
                                                    title={`${evt.title} (${evt.start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})})`}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      </main>

      {/* SMART POPOVER (PORTAL) */}
      {popup.visible && popup.event && createPortal(
          <div 
            ref={popupRef}
            className="fixed z-[9999] w-[340px] bg-white dark:bg-[#1e293b] rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden max-h-[80vh]"
            style={{
                left: popup.x,
                top: popup.y,
            }}
          >
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start bg-slate-50 dark:bg-slate-800/50 shrink-0">
                  <div>
                      <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${popup.event.mode === 'online' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                              {popup.event.mode}
                          </span>
                          {popup.event.index && <span className="text-xs font-bold text-slate-400">Buổi {popup.event.index}</span>}
                          {popup.event.status === 'finished' && <span className="text-xs font-bold text-green-600 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">check_circle</span> Đã học</span>}
                          {popup.event.status === 'incomplete' && <span className="text-xs font-bold text-orange-600 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">warning</span> Chưa đủ</span>}
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base leading-tight pr-6">{popup.event.title}</h4>
                  </div>
                  <button 
                      onClick={() => setPopup(prev => ({...prev, visible: false}))}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                      <span className="material-symbols-outlined text-xl">close</span>
                  </button>
              </div>

              {/* Scrollable Body for Overflow Protection */}
              <div className="p-5 flex flex-col gap-4 text-sm overflow-y-auto flex-1 custom-scrollbar">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                      <span className="material-symbols-outlined text-slate-400 text-[20px]">schedule</span>
                      <span className="font-medium">
                          {popup.event.start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {popup.event.end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                      </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                      <span className="material-symbols-outlined text-slate-400 text-[20px]">person</span>
                      <span className="font-medium">{popup.event.teacher}</span>
                  </div>

                  <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                      <span className="material-symbols-outlined text-slate-400 mt-0.5 text-[20px]">
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
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 shrink-0">
                  <div className="grid grid-cols-2 gap-3">
                      <button 
                          onClick={() => handleAttendanceRedirect(popup.event!)}
                          className={`col-span-2 flex items-center justify-center gap-2 py-3 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-[0.98] ${popup.event.status === 'incomplete' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20' : 'bg-primary hover:bg-primary-dark shadow-blue-500/20'}`}
                      >
                          <span className="material-symbols-outlined text-[20px]">fact_check</span>
                          {popup.event.status === 'finished' ? 'Xem điểm danh' : 'Điểm danh ngay'}
                      </button>
                      <button 
                          onClick={() => handleShiftSchedule(popup.event!)}
                          className={`flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold transition-colors ${isAssistant ? 'opacity-50 cursor-not-allowed text-slate-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
                      >
                          <span className="material-symbols-outlined text-[18px]">edit_calendar</span>
                          Lùi lịch
                      </button>
                      <button 
                          onClick={() => handleCancelSession(popup.event!)}
                          className={`flex items-center justify-center gap-2 py-3 rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 text-xs font-bold transition-colors ${isAssistant ? 'opacity-50 cursor-not-allowed text-red-300' : 'hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400'}`}
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

export default Calendar;
