
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ClassItem } from '../types';
import { useData } from '../context/DataContext';

interface Props {
  classData: ClassItem;
  onAttendanceClick?: (date: string) => void;
}

// --- MOCK SYLLABUS DATABASE ---
const MOCK_SYLLABUS: Record<string, string[]> = {
    'A1': [
        "Begrüßung & Vorstellen (Chào hỏi & Giới thiệu)",
        "Zahlen & Buchstaben (Số đếm & Bảng chữ cái)",
        "Länder & Sprachen (Quốc gia & Ngôn ngữ)",
        "Menschen & Hobbys (Con người & Sở thích)",
        "Beruf & Arbeit (Nghề nghiệp & Công việc)",
        "Freizeit & Verabredung (Thời gian rảnh & Hẹn hò)",
        "In der Stadt (Trong thành phố)",
        "Essen & Trinken (Ăn & Uống)",
        "Tagesablauf (Lịch trình trong ngày)",
        "Feste & Feiern (Lễ hội & Ăn mừng)",
        "Wohnen & Möbel (Nhà cửa & Nội thất)",
        "Kleidung & Wetter (Quần áo & Thời tiết)",
        "Körper & Gesundheit (Cơ thể & Sức khỏe)",
        "Reisen & Urlaub (Du lịch & Kỳ nghỉ)",
        "Verkehrsmittel (Phương tiện giao thông)",
        "Im Hotel (Tại khách sạn)",
        "Im Restaurant (Tại nhà hàng)",
        "Einkaufen (Mua sắm)",
        "Dienstleistungen (Dịch vụ)",
        "Zukunftspläne (Kế hoạch tương lai)",
        "Wiederholung A1 (Ôn tập A1 - Phần 1)",
        "Wiederholung A1 (Ôn tập A1 - Phần 2)",
        "Abschlusstest A1 (Bài kiểm tra cuối khóa)",
        "Zertifikatvergabe (Trao chứng chỉ)"
    ],
    'A2': [
        "Kennenlernen & Wiederholung", "Aussehen & Charakter", "Schule & Ausbildung", "Unterhaltung & Fernsehen",
        "Sport & Fan", "Wohnungssuche", "Kultur & Musik", "Arbeitswelt & Bewerbung", "Gesundheit & Ernährung",
        "Reisen & Abenteuer", "Technik & Umwelt", "Politik & Gesellschaft", "Wiederholung A2", "Abschlusstest A2"
    ],
    // Fallback for other levels
    'default': [
        "Introduction to Course", "Chapter 1: Foundations", "Chapter 2: Grammar Deep Dive", "Vocabulary Builder I",
        "Listening Practice I", "Speaking Workshop I", "Mid-term Review", "Mid-term Exam",
        "Chapter 3: Advanced Topics", "Chapter 4: Culture & Society", "Writing Workshop", "Reading Comprehension",
        "Vocabulary Builder II", "Listening Practice II", "Speaking Workshop II", "Group Project Info",
        "Project Presentation", "Final Review I", "Final Review II", "Final Exam"
    ]
};

// --- SKELETON COMPONENT ---
const CalendarSkeleton = () => (
    <div className="bg-white dark:bg-[#1a202c] rounded-2xl p-6 h-full min-h-[500px] flex flex-col border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 animate-shimmer pointer-events-none"></div>
        <div className="flex justify-between items-center mb-8">
            <div className="h-8 w-40 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"></div>
            <div className="flex gap-3">
                <div className="size-8 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse"></div>
                <div className="size-8 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse"></div>
            </div>
        </div>
        <div className="flex items-center justify-center flex-1">
            <div className="flex flex-col items-center gap-3 text-slate-400">
                <span className="material-symbols-outlined text-4xl animate-bounce">calendar_month</span>
                <span className="text-sm font-medium">Đang tải lịch học...</span>
            </div>
        </div>
    </div>
);

const MiniClassCalendar: React.FC<Props> = ({ classData, onAttendanceClick }) => {
  const { updateScheduleChain } = useData();
  
  // Initialize with a valid date. Priority: Today (if within range) > Start Date > Today
  const [currentDate, setCurrentDate] = useState<Date>(() => {
      if (!classData?.startDate) return new Date();
      const start = new Date(classData.startDate);
      const end = classData.endDate ? new Date(classData.endDate) : new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000);
      const now = new Date();
      
      // If today is within range, show today. Else show start.
      if (now >= start && now <= end) return now;
      return start;
  });
  
  // Popover State
  const [popoverInfo, setPopoverInfo] = useState<{
      visible: boolean;
      x: number;
      y: number;
      date: Date;
      sessionIndex: number; // The X in X/Y
      title: string;
      hasLink: boolean;
  } | null>(null);

  const [draggedDate, setDraggedDate] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- FORCE SYNC DATE ON DATA CHANGE ---
  useEffect(() => {
      if (classData && classData.startDate) {
          const start = new Date(classData.startDate);
          const end = classData.endDate ? new Date(classData.endDate) : new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000);
          const now = new Date();
          
          if (now >= start && now <= end) {
              setCurrentDate(now);
          } else {
              setCurrentDate(start);
          }
      }
  }, [classData?.id, classData?.startDate]); 

  // --- ALGORITHM: SMART CHRONOLOGICAL SESSION MAP ---
  const sessionMap = useMemo(() => {
      const map: Record<string, number> = {};
      if (!classData?.startDate) return map;

      // 1. Gather all potential dates
      const validDates: string[] = [];
      
      const start = new Date(classData.startDate);
      // Parse Schedule: "T2 / T4 • 18:00"
      const [daysPart] = (classData.schedule || "").split('•');
      const dayMap: Record<string, number> = { 'CN': 0, 'T2': 1, 'T3': 2, 'T4': 3, 'T5': 4, 'T6': 5, 'T7': 6 };
      
      const targetDays = daysPart 
          ? daysPart.split('/').map(d => dayMap[d.trim()]).filter(d => d !== undefined) 
          : [];
          
      const offDaysSet = new Set(classData.offDays || []);
      
      // Safety: If no schedule text, can't generate map
      if (targetDays.length === 0) return map;

      // Generate standard dates
      // CRITICAL FIX: Use endDate if available, or fallback to totalSessions, or default to 50 sessions
      const maxSessions = classData.totalSessions || 50; 
      const hardEndDate = classData.endDate ? new Date(classData.endDate) : null;
      if (hardEndDate) hardEndDate.setHours(23, 59, 59, 999);

      let iterator = new Date(start);
      let loopCount = 0; 
      let foundSessions = 0;
      
      // Safety limit: 1 year max loop
      while (loopCount < 365) {
          // Stop conditions
          if (hardEndDate && iterator > hardEndDate) break;
          if (!hardEndDate && foundSessions >= maxSessions + 5) break; 

          const dayOfWeek = iterator.getDay();
          const dateStr = iterator.toISOString().split('T')[0];

          if (targetDays.includes(dayOfWeek)) {
              if (!offDaysSet.has(dateStr)) {
                  validDates.push(dateStr);
                  foundSessions++; 
              }
          }
          iterator.setDate(iterator.getDate() + 1);
          loopCount++;
      }

      // 2. Add Extra Sessions (Makeup classes)
      if (classData.extraSessions) {
          classData.extraSessions.forEach(extra => {
              const dStr = extra.date.split('T')[0];
              if (!validDates.includes(dStr)) {
                  validDates.push(dStr);
              }
          });
      }

      // 3. Sort Chronologically
      validDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

      // 4. Assign Indices (The "X" in X/Y)
      validDates.forEach((dateStr, index) => {
          map[dateStr] = index + 1;
      });

      return map;
  }, [classData]);

  // --- DATA EXTRACTION: LESSON TITLE ---
  const getLessonInfo = (index: number) => {
      let key = 'default';
      const levelMatch = classData.name.match(/[A-C][1-2]/); 
      if (levelMatch) key = levelMatch[0];
      else if (classData.level) key = classData.level;
      
      const syllabus = MOCK_SYLLABUS[key] || MOCK_SYLLABUS['default'];
      const title = syllabus[index - 1]; 
      
      return {
          title: title || null,
          hasLink: !!title 
      };
  };

  // --- CALENDAR LOGIC ---
  const getDaysArray = () => {
      if (!currentDate) return [];
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // Grid starts Mon (1) -> Sun (0). Adjust index: 0->6, 1->0, 2->1 ...
      const getGridIndex = (day: number) => (day === 0 ? 6 : day - 1);
      
      const padding = getGridIndex(firstDay); 
      
      const res = [];
      for(let i=0; i<padding; i++) res.push(null);
      for(let i=1; i<=daysInMonth; i++) res.push(new Date(year, month, i));
      
      const remaining = 42 - res.length;
      for(let i=1; i<=remaining; i++) res.push(null); 
      
      return res;
  };

  const handleDragStart = (e: React.DragEvent, date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      if (!sessionMap[dateStr]) { e.preventDefault(); return; }
      
      setDraggedDate(date);
      setPopoverInfo(null);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', date.toISOString());
      
      const ghost = document.createElement('div');
      ghost.textContent = `Buổi ${sessionMap[dateStr]}`;
      ghost.className = "bg-blue-600 text-white px-2 py-1 rounded font-bold text-xs fixed top-[-100px]";
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 0, 0);
      setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
      e.preventDefault();
      if (!draggedDate) return;
      if (draggedDate.toDateString() === targetDate.toDateString()) { setDraggedDate(null); return; }

      if (window.confirm(`Bạn muốn dời buổi học ngày ${draggedDate.getDate()} sang ngày ${targetDate.getDate()}?`)) {
          const draggedStr = draggedDate.toISOString().split('T')[0];
          const sessionIndex = sessionMap[draggedStr] || 0; 
          const timePart = classData.schedule.split('•')[1]?.trim() || '18:00';
          const targetISO = targetDate.toISOString().split('T')[0] + 'T' + timePart;
          
          updateScheduleChain(classData.id, sessionIndex, targetISO);
      }
      setDraggedDate(null);
  };

  const handleDateClick = (e: React.MouseEvent, date: Date, isSession: boolean, dateStr: string) => {
      e.stopPropagation();
      if (popoverInfo?.visible && popoverInfo.date.toDateString() === date.toDateString()) {
          setPopoverInfo(null);
          return;
      }

      if (isSession) {
          const sessionIndex = sessionMap[dateStr];
          const { title, hasLink } = getLessonInfo(sessionIndex);
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const containerRect = containerRef.current?.getBoundingClientRect() || { top: 0, left: 0 };
          
          const popoverWidth = 260;
          const popoverHeight = 140; 
          
          let left = rect.left - containerRect.left + (rect.width / 2) - (popoverWidth / 2);
          let top = rect.top - containerRect.top - popoverHeight - 10; 

          const containerWidth = containerRef.current?.offsetWidth || 500;
          if (left < 10) left = 10;
          if (left + popoverWidth > containerWidth) left = containerWidth - popoverWidth - 10;
          if (top < 0) top = rect.bottom - containerRect.top + 10; 

          setPopoverInfo({
              visible: true,
              x: left,
              y: top,
              date: date,
              sessionIndex: sessionIndex,
              title: title || 'Chưa cập nhật tiêu đề',
              hasLink: hasLink
          });
      } else {
          setPopoverInfo(null);
      }
  };

  // Close popover when clicking outside
  useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
          if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
              setPopoverInfo(null);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- RENDER SKELETON IF NOT READY ---
  if (!classData || !classData.id) {
      return <CalendarSkeleton />;
  }

  return (
    <div ref={containerRef} className="bg-white dark:bg-[#1a202c] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-visible flex flex-col h-full min-h-[500px] select-none font-display relative">
        
        {/* 1. iPadOS Header */}
        <div className="px-6 py-5 flex items-center justify-between bg-white dark:bg-[#1a202c] z-10 rounded-t-2xl border-b border-slate-100 dark:border-slate-800">
            <button onClick={() => setCurrentDate(new Date())} className="text-xs font-bold text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                Hôm nay
            </button>
            <div className="flex items-center gap-6">
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="size-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                    <span className="material-symbols-outlined text-[22px]">chevron_left</span>
                </button>
                <span className="text-lg font-extrabold text-slate-900 dark:text-white capitalize tracking-tight min-w-[140px] text-center">
                    Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
                </span>
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="size-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                    <span className="material-symbols-outlined text-[22px]">chevron_right</span>
                </button>
            </div>
            <div className="w-20"></div> 
        </div>

        {/* 2. Calendar Grid */}
        <div className="px-6 pb-6 flex-1 flex flex-col pt-4">
            <div className="grid grid-cols-7 mb-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => (
                    <div key={d} className={`text-[11px] font-bold text-center uppercase tracking-wider ${i === 6 ? 'text-red-500' : 'text-slate-400'}`}>{d}</div>
                ))}
            </div>
            
            <div className="grid grid-cols-7 flex-1 auto-rows-fr relative border-l border-t border-slate-100 dark:border-slate-800">
                {getDaysArray().map((dateObj, idx) => {
                    if (!dateObj) return <div key={`empty-${idx}`} className="border-r border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30"></div>;
                    
                    const dateStr = dateObj.toISOString().split('T')[0];
                    const sessionIndex = sessionMap[dateStr];
                    const isExtra = classData.extraSessions?.some(s => s.date.startsWith(dateStr));
                    const isCancelled = classData.offDays?.includes(dateStr);
                    
                    const isSession = (!!sessionIndex || isExtra) && !isCancelled;
                    const isToday = new Date().toDateString() === dateObj.toDateString();
                    const isSelected = popoverInfo?.date.toDateString() === dateObj.toDateString();

                    let numColor = dateObj.getDay() === 0 ? 'text-slate-400' : 'text-slate-700 dark:text-slate-300';
                    let cellBg = 'hover:bg-slate-50 dark:hover:bg-slate-800/50';
                    
                    if (isToday) {
                        numColor = 'text-white bg-primary font-bold shadow-md shadow-blue-500/30 rounded-full size-7 flex items-center justify-center';
                    } else if (isCancelled) {
                        numColor = 'text-red-400 opacity-50 decoration-line-through';
                        cellBg = 'bg-red-50/10';
                    }

                    return (
                        <div 
                            key={idx}
                            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                            onDrop={(e) => handleDrop(e, dateObj)}
                            onClick={(e) => handleDateClick(e, dateObj, isSession, dateStr)}
                            className={`
                                relative flex flex-col items-center justify-start pt-2 min-h-[80px] cursor-pointer transition-all 
                                border-r border-b border-slate-100 dark:border-slate-800 
                                ${cellBg}
                                ${draggedDate?.getDate() === dateObj.getDate() ? 'opacity-30 scale-95' : ''}
                                ${isSelected ? 'bg-slate-50 dark:bg-slate-800' : ''}
                            `}
                        >
                            <span 
                                draggable={isSession}
                                onDragStart={(e) => handleDragStart(e, dateObj)}
                                className={`text-sm z-10 ${numColor} ${isSession ? 'cursor-grab active:cursor-grabbing hover:scale-110 transition-transform' : ''}`}
                            >
                                {isToday ? dateObj.getDate() : dateObj.getDate()}
                            </span>

                            {isSession && (
                                <div className="mt-2 flex flex-col items-center gap-1 animate-in fade-in zoom-in duration-300">
                                    <div className={`size-2 rounded-full ${isExtra ? 'bg-purple-500 shadow-purple-500/50' : 'bg-blue-500 shadow-blue-500/50'} shadow-sm`}></div>
                                    <span className="text-[9px] font-bold text-slate-400">B.{sessionIndex}</span>
                                </div>
                            )}
                            {isCancelled && <span className="text-[9px] font-bold text-red-400 mt-1 uppercase tracking-wide bg-red-50 dark:bg-red-900/20 px-1 rounded">Hủy</span>}
                        </div>
                    );
                })}

                {/* Popover */}
                {popoverInfo && popoverInfo.visible && (
                    <div 
                        className="absolute z-50 w-[260px] bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 p-4 animate-in fade-in zoom-in-95 duration-200 origin-bottom ring-1 ring-black/5"
                        style={{ top: popoverInfo.y, left: popoverInfo.x }}
                    >
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rotate-45 border-b border-r border-white/20 dark:border-white/10 rounded-sm"></div>
                        <div className="relative z-10 flex flex-col gap-3">
                            <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-slate-700/50 pb-2">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        {popoverInfo.date.toLocaleDateString('vi-VN', {weekday: 'long', day: 'numeric', month: 'numeric'})}
                                    </span>
                                    {popoverInfo.sessionIndex && (
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                                            Buổi học số {popoverInfo.sessionIndex} <span className="text-slate-400 font-normal">/ {classData.totalSessions || 50}</span>
                                        </span>
                                    )}
                                </div>
                                <div className={`size-8 rounded-full flex items-center justify-center text-white ${popoverInfo.sessionIndex ? 'bg-blue-500' : 'bg-purple-500'}`}>
                                    <span className="material-symbols-outlined text-lg">school</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Nội dung bài học:</p>
                                {popoverInfo.hasLink ? (
                                    <a href="#" onClick={(e) => { e.preventDefault(); alert(`Mở nội dung bài học: ${popoverInfo.title}`); }} className="text-sm font-bold text-primary hover:text-blue-700 dark:hover:text-blue-300 transition-colors line-clamp-2 leading-snug flex items-start gap-1">
                                        {popoverInfo.title}
                                        <span className="material-symbols-outlined text-[14px] mt-0.5">open_in_new</span>
                                    </a>
                                ) : (
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 italic">{popoverInfo.title}</p>
                                )}
                            </div>
                            <div className="pt-1 flex gap-2">
                                <button onClick={() => { onAttendanceClick && onAttendanceClick(popoverInfo.date.toISOString()); setPopoverInfo(null); }} className="flex-1 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-md shadow-blue-500/20 hover:bg-primary-dark transition-all active:scale-95">
                                    Điểm danh
                                </button>
                                <button className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors active:scale-95" title="Chỉnh sửa buổi học">
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-700 p-3 bg-slate-50/50 dark:bg-slate-800/30 min-h-[50px] flex items-center justify-center text-xs text-slate-400 italic rounded-b-2xl">
            {!popoverInfo && (
                <span className="flex items-center gap-1.5 opacity-70">
                    <span className="material-symbols-outlined text-[16px]">touch_app</span>
                    Chọn ngày để xem chi tiết hoặc Kéo thả để dời lịch
                </span>
            )}
        </div>
    </div>
  );
};

export default MiniClassCalendar;
