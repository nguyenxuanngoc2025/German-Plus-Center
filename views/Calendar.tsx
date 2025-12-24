
import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { ClassItem } from '../types';
import ClassEventModal from '../components/ClassEventModal';
import StudentSelectorModal from '../components/StudentSelectorModal';

interface CalendarEvent {
  id: string; // combination of classId + date
  classId: string;
  title: string;
  code: string; // Added code for short display
  start: Date;
  end: Date;
  teacher: string;
  room: string;
  level: string; // A1, A2...
  status: 'active' | 'upcoming' | 'full'; // Added status for coloring
  hasConflict?: boolean; // New collision flag
  color: string; // Added required color prop
}

const Calendar: React.FC = () => {
  const { classes, currentUser, enrollStudent, convertLeadToStudent, students, moveClassSession } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  
  // Advanced Filters
  const [teacherFilter, setTeacherFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [roomFilter, setRoomFilter] = useState(''); // New Room Filter
  const [isMySchedule, setIsMySchedule] = useState(false); // "My Schedule" Toggle

  // Modals
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [targetClassId, setTargetClassId] = useState<string | null>(null);

  // --- LOGIC: GENERATE EVENTS & DETECT COLLISIONS ---
  const events = useMemo(() => {
    let generatedEvents: CalendarEvent[] = [];
    const today = new Date();
    const rangeStart = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    const rangeEnd = new Date(today.getFullYear(), today.getMonth() + 3, 0);

    // Identify current user context
    const isStudent = currentUser?.role === 'student';
    const isTeacher = currentUser?.role === 'teacher';
    
    // For Simulation/Demo: If student, pick the first student in DB as "Me" to find class
    // In real app, currentUser.id would map to student.id
    const myClassId = isStudent ? students[0]?.classId : null;

    classes.forEach(cls => {
        // --- ROLE BASED FILTERING ---
        if (isStudent && cls.id !== myClassId) return; // Student only sees their class
        if (isTeacher && cls.teacher !== currentUser?.name) return; // Teacher only sees their classes (Auto "My Schedule")

        // --- UI FILTERING ---
        if (!isStudent && !isTeacher) {
             if (isMySchedule && currentUser && cls.teacher !== currentUser.name) return;
             if (!isMySchedule && teacherFilter && cls.teacher !== teacherFilter) return;
        }
        
        if (levelFilter && !cls.name.includes(levelFilter)) return;
        if (roomFilter && (cls.mode === 'online' ? 'Online' : 'Offline').indexOf(roomFilter) === -1 && !cls.location?.includes(roomFilter)) return;

        // Parse Schedule
        const [daysPart, timePart] = cls.schedule.split('•').map(s => s.trim());
        const days = daysPart.split('/').map(d => d.trim());
        const dayMap: Record<string, number> = { 'CN': 0, 'T2': 1, 'T3': 2, 'T4': 3, 'T5': 4, 'T6': 5, 'T7': 6 };
        const targetDays = days.map(d => dayMap[d]).filter(d => d !== undefined);
        const [startHour, startMinute] = timePart ? timePart.split(':').map(Number) : [18, 0];
        const durationMinutes = 90;

        // Determine Room Display
        let roomDisplay = 'TBD';
        if (cls.mode === 'online') roomDisplay = 'Online';
        else if (cls.location) {
            // Extract simplistic room name if possible, else generic
            if (cls.location.includes('Phòng')) roomDisplay = 'P.' + cls.location.split('Phòng')[1].trim().split(' ')[0];
            else roomDisplay = 'P.101'; // Mock default room for demo collision
        }

        // Determine Color
        let color = 'blue';
        if (cls.status === 'upcoming') color = 'emerald';
        else if (cls.status === 'full') color = 'orange';

        // 1. Generate Regular Recurring Sessions
        const classStartDate = cls.startDate ? new Date(cls.startDate) : rangeStart;
        const classEndDate = cls.endDate ? new Date(cls.endDate) : rangeEnd;
        // Adjust loop bounds to respect class duration
        const loopStart = new Date(Math.max(rangeStart.getTime(), classStartDate.getTime()));
        const loopEnd = new Date(Math.min(rangeEnd.getTime(), classEndDate.getTime()));

        let loopDate = new Date(loopStart);
        loopDate.setHours(0,0,0,0); 

        while (loopDate <= loopEnd) {
            const dateStr = loopDate.toISOString().split('T')[0];
            
            // Check if day matches schedule AND is not an off day
            if (targetDays.includes(loopDate.getDay()) && (!cls.offDays || !cls.offDays.includes(dateStr))) {
                const start = new Date(loopDate);
                start.setHours(startHour, startMinute, 0);
                const end = new Date(start);
                end.setMinutes(start.getMinutes() + durationMinutes);

                generatedEvents.push({
                    id: `${cls.id}-${dateStr}`,
                    classId: cls.id,
                    title: `${cls.name}`,
                    code: cls.code,
                    start: start,
                    end: end,
                    teacher: cls.teacher,
                    room: roomDisplay,
                    level: cls.name.split(' ')[2] || 'A1',
                    status: cls.status,
                    color: color,
                });
            }
            loopDate.setDate(loopDate.getDate() + 1);
        }

        // 2. Generate Extra/Rescheduled Sessions
        if (cls.extraSessions) {
            cls.extraSessions.forEach((session, idx) => {
                const sessionStart = new Date(session.date);
                if (sessionStart >= rangeStart && sessionStart <= rangeEnd) {
                    const sessionEnd = new Date(sessionStart);
                    sessionEnd.setMinutes(sessionStart.getMinutes() + durationMinutes);

                    generatedEvents.push({
                        id: `${cls.id}-extra-${idx}`,
                        classId: cls.id,
                        title: `${cls.name} (Bù)`,
                        code: cls.code,
                        start: sessionStart,
                        end: sessionEnd,
                        teacher: cls.teacher,
                        room: roomDisplay,
                        level: cls.name.split(' ')[2] || 'A1',
                        status: cls.status,
                        color: 'purple', // Distinct color for rescheduled/extra
                    });
                }
            });
        }
    });

    // 2. Detect Collisions (O(N^2) for simplicity in demo, optimize for prod)
    // A conflict occurs if two events overlap in time AND share a Room or Teacher
    for (let i = 0; i < generatedEvents.length; i++) {
        for (let j = i + 1; j < generatedEvents.length; j++) {
            const e1 = generatedEvents[i];
            const e2 = generatedEvents[j];

            // Check Time Overlap
            if (e1.start < e2.end && e1.end > e2.start) {
                // Check Resource Overlap (Teacher OR Room)
                // Ignore 'Online' room conflicts usually, but check Teacher
                const isRoomConflict = e1.room !== 'Online' && e1.room === e2.room;
                const isTeacherConflict = e1.teacher === e2.teacher;

                if (isRoomConflict || isTeacherConflict) {
                    generatedEvents[i].hasConflict = true;
                    generatedEvents[j].hasConflict = true;
                }
            }
        }
    }

    return generatedEvents;
  }, [classes, teacherFilter, levelFilter, roomFilter, isMySchedule, currentUser, students]);

  // --- NAVIGATION HANDLERS ---
  const handlePrev = () => {
      const newDate = new Date(currentDate);
      if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
      else newDate.setDate(newDate.getDate() - 1);
      setCurrentDate(newDate);
  };

  const handleNext = () => {
      const newDate = new Date(currentDate);
      if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
      else newDate.setDate(newDate.getDate() + 1);
      setCurrentDate(newDate);
  };

  const handleToday = () => setCurrentDate(new Date());

  const handleAddEvent = (date: Date) => {
      alert(`Mở form xếp lịch/thêm buổi học cho ngày: ${date.toLocaleDateString('vi-VN')}`);
  };

  const handleAddStudentToClass = (classId: string) => {
      setTargetClassId(classId);
      setShowStudentSelector(true);
  };

  const handleConfirmAddStudents = (selectedStudents: any[], selectedLeads: any[]) => {
      if (!targetClassId) return;
      const targetClass = classes.find(c => c.id === targetClassId);
      
      selectedStudents.forEach(s => enrollStudent(s.id, targetClassId));
      selectedLeads.forEach(l => convertLeadToStudent(l.id, targetClassId, targetClass ? targetClass.tuitionFee : 0));
      
      alert(`Đã thêm ${selectedStudents.length + selectedLeads.length} học viên vào lớp!`);
      setShowStudentSelector(false);
      setTargetClassId(null);
      // Close detail modal as well to refresh if needed, or keep open
      setSelectedEvent(null); 
  };

  const getEventsForDay = (date: Date) => {
      return events.filter(e => 
          e.start.getDate() === date.getDate() &&
          e.start.getMonth() === date.getMonth() &&
          e.start.getFullYear() === date.getFullYear()
      ).sort((a, b) => {
          // Sort Logic: Conflict first -> Active Status -> Time
          if (a.hasConflict && !b.hasConflict) return -1;
          if (!a.hasConflict && b.hasConflict) return 1;
          if (a.status === 'active' && b.status !== 'active') return -1;
          if (a.status !== 'active' && b.status === 'active') return 1;
          return a.start.getTime() - b.start.getTime();
      });
  };

  // Helper to format HH:MM
  const formatTime = (date: Date) => date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  // --- UI: MONTH VIEW (EVENT BLOCKS) ---
  const renderMonthView = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      let startDayOfWeek = firstDay.getDay() || 7; 
      const paddingDays = startDayOfWeek - 1;

      const days = [];
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = paddingDays; i > 0; i--) {
          days.push({ day: prevMonthLastDay - i + 1, type: 'prev', date: new Date(year, month - 1, prevMonthLastDay - i + 1) });
      }
      for (let i = 1; i <= lastDay.getDate(); i++) {
          days.push({ day: i, type: 'current', date: new Date(year, month, i) });
      }
      const totalCells = 42; 
      const remainingCells = totalCells - days.length;
      for (let i = 1; i <= remainingCells; i++) {
          days.push({ day: i, type: 'next', date: new Date(year, month + 1, i) });
      }

      return (
          <div className="flex-1 flex flex-col bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
              {/* Calendar Header with standardized style */}
              <div className="grid grid-cols-7 border-b border-[#EDF2F7] dark:border-slate-700">
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => (
                      <div key={d} className={`py-3 text-center text-xs font-semibold uppercase ${i === 6 ? 'text-[#E53E3E]' : 'text-[#4A5568]'} dark:text-slate-400 bg-white dark:bg-[#1a202c]`}>
                          {d}
                      </div>
                  ))}
              </div>
              <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                  {days.map((d, idx) => {
                      const dayEvents = getEventsForDay(d.date);
                      const isToday = new Date().toDateString() === d.date.toDateString();
                      const isSunday = d.date.getDay() === 0;
                      
                      // Limit display to 3 events per day
                      const displayEvents = dayEvents.slice(0, 3);
                      const remainingCount = dayEvents.length - 3;

                      return (
                          <div 
                            key={idx} 
                            onClick={() => { setCurrentDate(d.date); setViewMode('day'); }}
                            className={`
                                min-h-[140px] border-b border-r border-[#EDF2F7] dark:border-slate-700/50 p-2 transition-all cursor-pointer relative group 
                                ${d.type !== 'current' ? 'text-slate-300 dark:text-slate-600' : ''}
                                ${isSunday ? 'bg-[#FFF5F5] dark:bg-red-900/5' : 'hover:bg-[#F7FAFC] dark:hover:bg-slate-800'}
                            `}
                          >
                              <div className="flex justify-between items-start mb-2">
                                <span className={`
                                    text-xs flex items-center justify-center size-7 rounded-full transition-colors font-medium
                                    ${isToday ? 'border border-[#1e3a8a] text-[#1e3a8a] font-bold' : isSunday && d.type === 'current' ? 'text-[#E53E3E]' : ''}
                                `}>
                                    {d.day}
                                </span>
                                <div className="flex items-center gap-1">
                                    {/* Add Event Button (Visible on Hover) - Hide for Student */}
                                    {currentUser?.role !== 'student' && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleAddEvent(d.date); }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-400 hover:text-primary"
                                        title="Thêm lịch"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                    </button>
                                    )}
                                </div>
                              </div>
                              
                              {/* Event Blocks */}
                              <div className="flex flex-col gap-1.5">
                                  {displayEvents.map(evt => {
                                      // Updated Pastel Color Logic
                                      let bgClass = 'bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'; // Default Active (Pastel Blue)
                                      
                                      if (evt.hasConflict) {
                                          // Conflict: White background with Red Border
                                          bgClass = 'bg-white text-slate-700 border border-red-400 border-l-4 border-l-red-500 hover:bg-red-50 dark:bg-slate-800 dark:text-slate-200 dark:border-red-500'; 
                                      } else if (evt.color === 'purple') {
                                          bgClass = 'bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'; 
                                      } else if (evt.status === 'upcoming') {
                                          // Upcoming: Pastel Green
                                          bgClass = 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'; 
                                      }
                                      
                                      return (
                                          <div 
                                            key={evt.id} 
                                            onClick={(e) => { e.stopPropagation(); setSelectedEvent(evt); }}
                                            className={`px-2 py-1.5 rounded-md text-[10px] shadow-sm transition-all cursor-pointer flex flex-col gap-0.5 ${bgClass}`}
                                            title={`${evt.title}\nGiáo viên: ${evt.teacher}\nPhòng: ${evt.room}`}
                                          >
                                              <div className="flex items-center justify-between w-full">
                                                  <span className="font-semibold opacity-80 flex items-center gap-1">
                                                    {formatTime(evt.start)} - {formatTime(evt.end)}
                                                  </span>
                                                  {evt.hasConflict && <span className="material-symbols-outlined text-[14px] text-red-500">warning</span>}
                                              </div>
                                              <div className="font-bold truncate text-xs">
                                                  {evt.code}
                                              </div>
                                          </div>
                                      );
                                  })}
                                  
                                  {remainingCount > 0 && (
                                      <div className="px-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 pl-2">
                                          + {remainingCount} lớp khác
                                      </div>
                                  )}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      );
  };

  // --- UI: TIMELINE / DAY RESOURCE VIEW ---
  const renderTimelineView = () => {
      const dayEvents = getEventsForDay(currentDate);
      const hours = Array.from({length: 14}, (_, i) => i + 8); // 8:00 to 21:00

      return (
          <div className="flex-1 flex flex-col bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm h-full">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <div className="flex items-center gap-4">
                      <button onClick={handlePrev} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded"><span className="material-symbols-outlined">chevron_left</span></button>
                      <div className="text-center">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                              {currentDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </h3>
                          <p className="text-xs text-slate-500">{dayEvents.length} Ca học</p>
                      </div>
                      <button onClick={handleNext} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded"><span className="material-symbols-outlined">chevron_right</span></button>
                  </div>
                  <div className="flex items-center gap-2">
                      {currentUser?.role !== 'student' && (
                      <button onClick={() => handleAddEvent(currentDate)} className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary-dark transition-colors flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          Xếp lịch
                      </button>
                      )}
                      <button onClick={() => setViewMode('month')} className="text-sm font-medium text-primary hover:underline">Quay lại tháng</button>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                  {/* Time Grid */}
                  <div className="relative min-h-[800px]">
                      {hours.map(h => (
                          <div key={h} className="flex border-b border-slate-100 dark:border-slate-700/50 h-[60px]">
                              <div className="w-16 shrink-0 border-r border-slate-100 dark:border-slate-700/50 flex justify-center pt-2">
                                  <span className="text-xs font-bold text-slate-400">{h}:00</span>
                              </div>
                              <div className="flex-1 relative">
                                  {/* Grid lines */}
                                  <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-slate-50 dark:border-slate-800"></div>
                              </div>
                          </div>
                      ))}

                      {/* Events Overlay */}
                      {dayEvents.map(evt => {
                          const startHour = evt.start.getHours();
                          const startMin = evt.start.getMinutes();
                          const duration = (evt.end.getTime() - evt.start.getTime()) / (1000 * 60); // minutes
                          
                          // Calculate position
                          const top = (startHour - 8) * 60 + 10; // 60px per hour, offset header
                          const offsetTop = top + (startMin / 60) * 60;
                          const height = (duration / 60) * 60;

                          // Updated Timeline Colors (Pastel)
                          let containerClass = 'bg-blue-50 border-l-4 border-blue-500 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
                          
                          if (evt.hasConflict) {
                              containerClass = 'bg-white border-2 border-red-400 text-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:border-red-500';
                          } else if (evt.color === 'purple') {
                              containerClass = 'bg-purple-50 border-l-4 border-purple-500 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200';
                          } else if (evt.status === 'upcoming') {
                              containerClass = 'bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200';
                          }

                          return (
                              <div 
                                key={evt.id}
                                onClick={() => setSelectedEvent(evt)}
                                className={`absolute left-20 right-4 rounded-lg px-4 py-2 shadow-sm cursor-pointer hover:brightness-95 transition-all flex justify-between items-center ${containerClass} ${evt.hasConflict ? 'z-20' : 'z-10'}`}
                                style={{ top: `${offsetTop}px`, height: `${height}px` }}
                              >
                                  <div className="flex flex-col justify-center overflow-hidden">
                                      <div className="flex items-center gap-2">
                                          <span className="font-bold text-sm truncate">{evt.title}</span>
                                          {evt.hasConflict && <span className="material-symbols-outlined text-base text-red-500 animate-pulse">warning</span>}
                                      </div>
                                      <div className="text-xs opacity-80 flex items-center gap-2 truncate font-medium">
                                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">person</span> {evt.teacher}</span>
                                          <span>•</span>
                                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">meeting_room</span> {evt.room}</span>
                                      </div>
                                  </div>
                                  <div className="text-right text-xs font-bold opacity-90 shrink-0">
                                      {formatTime(evt.start)} - {formatTime(evt.end)}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      );
  };

  const uniqueRooms = Array.from(new Set(classes.map(c => c.location ? (c.location.includes('Phòng') ? 'P.' + c.location.split('Phòng')[1].trim().split(' ')[0] : 'Offline') : 'Online')));
  const teachers = Array.from(new Set(classes.map(c => c.teacher)));

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-background-light dark:bg-background-dark font-display">
      <Header title="Lịch học & Đào tạo" />
      
      <main className="flex-1 overflow-hidden p-4 md:p-6 flex flex-col gap-4">
        
        {/* Controls Toolbar */}
        <div className="bg-white dark:bg-[#1a202c] p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0">
            
            {/* View Switcher & Date Nav */}
            <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button onClick={() => setViewMode('month')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'month' ? 'bg-white dark:bg-slate-600 shadow-sm text-primary dark:text-white' : 'text-slate-500'}`}>Tháng</button>
                    <button onClick={() => setViewMode('day')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'day' ? 'bg-white dark:bg-slate-600 shadow-sm text-primary dark:text-white' : 'text-slate-500'}`}>Timeline</button>
                </div>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white capitalize min-w-[150px]">
                    Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
                </h2>
                <div className="flex gap-1">
                    <button onClick={handlePrev} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500"><span className="material-symbols-outlined text-lg">chevron_left</span></button>
                    <button onClick={handleToday} className="px-2 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300">Hôm nay</button>
                    <button onClick={handleNext} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500"><span className="material-symbols-outlined text-lg">chevron_right</span></button>
                </div>
            </div>

            {/* Smart Filters - Hidden for Student */}
            {currentUser?.role !== 'student' && (
            <div className="flex flex-wrap items-center gap-3">
                {/* My Schedule Toggle */}
                <button 
                    onClick={() => setIsMySchedule(!isMySchedule)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${isMySchedule ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
                >
                    <span className="material-symbols-outlined text-[16px]">{isMySchedule ? 'check_box' : 'check_box_outline_blank'}</span>
                    Lịch của tôi
                </button>

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                <select 
                    value={roomFilter}
                    onChange={(e) => setRoomFilter(e.target.value)}
                    className="h-8 pl-2 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-primary focus:border-primary cursor-pointer"
                >
                    <option value="">Tất cả phòng</option>
                    {uniqueRooms.map((r, i) => <option key={i} value={r}>{r}</option>)}
                </select>

                <select 
                    value={teacherFilter}
                    onChange={(e) => setTeacherFilter(e.target.value)}
                    className="h-8 pl-2 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-primary focus:border-primary cursor-pointer"
                    disabled={isMySchedule}
                >
                    <option value="">Tất cả giáo viên</option>
                    {teachers.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                
                {/* Updated Legend */}
                <div className="hidden xl:flex items-center gap-3 ml-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                        <span className="size-2.5 rounded-full bg-blue-100 border border-blue-300"></span>
                        Đang học
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                        <span className="size-2.5 rounded-full bg-emerald-100 border border-emerald-300"></span>
                        Sắp/Mới
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                        <span className="size-2.5 rounded-full bg-white border border-red-500"></span>
                        Xung đột
                    </div>
                </div>
            </div>
            )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
            {viewMode === 'month' ? renderMonthView() : renderTimelineView()}
        </div>
      </main>

      {/* Event Details Popup */}
      {selectedEvent && (
          <ClassEventModal 
            event={selectedEvent} 
            onClose={() => setSelectedEvent(null)}
            onUpdate={(updatedDate) => {
                const result = moveClassSession(selectedEvent.classId, selectedEvent.start.toISOString().split('T')[0], updatedDate.toISOString());
                if(result?.success) {
                    alert(result.message);
                    setSelectedEvent(null);
                }
            }}
            onAddStudent={() => handleAddStudentToClass(selectedEvent.classId)}
          />
      )}

      {/* Student Selector Modal for Quick Add */}
      {showStudentSelector && targetClassId && (
          <StudentSelectorModal 
            onClose={() => { setShowStudentSelector(false); setTargetClassId(null); }}
            onConfirm={handleConfirmAddStudents}
            excludeClassId={targetClassId}
            title="Thêm học viên vào buổi học"
          />
      )}
    </div>
  );
};

export default Calendar;
