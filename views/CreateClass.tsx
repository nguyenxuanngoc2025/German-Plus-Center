
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import StudentSelectorModal from '../components/StudentSelectorModal';
import { Student, Lead, Staff } from '../types';
import { useData } from '../context/DataContext';
import Avatar from '../components/Avatar';

const CreateClass: React.FC = () => {
  const navigate = useNavigate();
  const { addClass, recalculateSchedule, staff } = useData();

  // Form States
  const [batch, setBatch] = useState('61'); // New: Batch Number
  const [className, setClassName] = useState('');
  const [classCode, setClassCode] = useState(''); // New: Class Code
  const [level, setLevel] = useState('A1');
  const [maxCapacity, setMaxCapacity] = useState('15');
  const [totalSessions, setTotalSessions] = useState('24');
  const [startDate, setStartDate] = useState('');
  const [calculatedEndDate, setCalculatedEndDate] = useState(''); // Read-only
  
  // Teacher Selection State
  const [selectedTeacher, setSelectedTeacher] = useState<Staff | null>(null);
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const teacherDropdownRef = useRef<HTMLDivElement>(null);

  // Assistant Selection State
  const [selectedAssistant, setSelectedAssistant] = useState<Staff | null>(null);
  const [isAssistantDropdownOpen, setIsAssistantDropdownOpen] = useState(false);
  const [assistantSearchTerm, setAssistantSearchTerm] = useState('');
  const assistantDropdownRef = useRef<HTMLDivElement>(null);
  
  const [classType, setClassType] = useState<'offline' | 'online'>('offline');
  const [location, setLocation] = useState('102 Ngô Quyền, Hà Đông, Hà Nội');
  const [meetingLink, setMeetingLink] = useState('');

  const [selectedDays, setSelectedDays] = useState<string[]>(['T2', 'T4', 'T6']);
  const [tuitionFee, setTuitionFee] = useState<string>('5.000.000');
  
  // Selection States
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);

  // Filter Teachers from Staff
  const availableTeachers = useMemo(() => {
      return staff.filter(s => s.role === 'teacher' || s.role === 'manager').filter(s => 
          s.name.toLowerCase().includes(teacherSearchTerm.toLowerCase()) || 
          s.email.toLowerCase().includes(teacherSearchTerm.toLowerCase())
      );
  }, [staff, teacherSearchTerm]);

  // Filter Assistants from Staff
  const availableAssistants = useMemo(() => {
      return staff.filter(s => s.role === 'assistant' || s.role === 'teacher').filter(s => 
          s.name.toLowerCase().includes(assistantSearchTerm.toLowerCase()) || 
          s.email.toLowerCase().includes(assistantSearchTerm.toLowerCase())
      );
  }, [staff, assistantSearchTerm]);

  // Click Outside to Close Dropdown
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (teacherDropdownRef.current && !teacherDropdownRef.current.contains(event.target as Node)) {
              setIsTeacherDropdownOpen(false);
          }
          if (assistantDropdownRef.current && !assistantDropdownRef.current.contains(event.target as Node)) {
              setIsAssistantDropdownOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- AUTO-GENERATE NAME & CODE (MINIMALIST) ---
  useEffect(() => {
      // Logic: 
      // Name: K[Batch] [Online/Offline] [Level] ([ScheduleShort])
      // Code: K[Batch].[Level][ON/OFF]
      
      const dayOrder = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      const sortedDays = [...selectedDays].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
      
      // Generate Short Schedule: T2,T4,T6 -> T246. T3,T5,CN -> T35CN
      let scheduleDigits = '';
      let hasCN = false;
      sortedDays.forEach(d => {
          if (d === 'CN') hasCN = true;
          else scheduleDigits += d.replace('T', '');
      });
      let scheduleShort = 'T' + scheduleDigits;
      if (hasCN) scheduleShort += 'CN';
      if (sortedDays.length === 0) scheduleShort = 'TBD';

      const modeStr = classType === 'online' ? 'Online' : 'Offline';
      const modeCode = classType === 'online' ? 'ON' : 'OFF';
      
      const genName = `K${batch} ${modeStr} ${level} (${scheduleShort})`;
      const genCode = `K${batch}.${level}${modeCode}`;

      setClassName(genName);
      setClassCode(genCode);

  }, [batch, classType, level, selectedDays]);


  // Auto-calculate End Date
  useEffect(() => {
      if (startDate && totalSessions && selectedDays.length > 0) {
          const dayOrder = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
          const sortedDays = [...selectedDays].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
          const daysStr = sortedDays.join(' / ');
          const sessions = parseInt(totalSessions) || 0;
          
          setCalculatedEndDate(recalculateSchedule(startDate, sessions, daysStr));
      } else {
          setCalculatedEndDate('');
      }
  }, [startDate, totalSessions, selectedDays, recalculateSchedule]);

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSave = () => {
    if (!className || !level) {
        alert("Vui lòng nhập tên lớp và trình độ!");
        return;
    }

    if (!selectedTeacher) {
        alert("Vui lòng chọn giáo viên phụ trách!");
        return;
    }

    const sessions = parseInt(totalSessions) || 24;
    const dayOrder = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const sortedDays = [...selectedDays].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));

    addClass({
        name: className,
        code: classCode, // Use generated code
        level: level,
        schedule: sortedDays.join(' / ') + " • 18:30",
        mode: classType,
        teacher: selectedTeacher.name,
        teacherAvatar: selectedTeacher.avatar,
        assistant: selectedAssistant?.name,
        assistantAvatar: selectedAssistant?.avatar,
        maxStudents: parseInt(maxCapacity),
        tuitionFee: parseInt(tuitionFee.replace(/\D/g, '')),
        link: classType === 'online' ? meetingLink : undefined,
        location: classType === 'offline' ? location : undefined,
        startDate: startDate,
        endDate: calculatedEndDate,
        totalSessions: sessions
    }, selectedStudents.map(s => s.id), selectedLeads.map(l => l.id));

    alert("Đã tạo lớp học thành công và thêm học viên!");
    navigate('/classes');
  };

  const handleRemoveSelection = (id: string, type: 'student' | 'lead') => {
      if(type === 'student') {
          setSelectedStudents(prev => prev.filter(s => s.id !== id));
      } else {
          setSelectedLeads(prev => prev.filter(l => l.id !== id));
      }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-background-light dark:bg-background-dark">
      <Header title="Thêm Lớp học" />
      
      <div className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth">
        <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-10">
            
            {/* Page Title & Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                        <span onClick={() => navigate('/classes')} className="cursor-pointer hover:text-primary">Lớp học</span>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-slate-900 dark:text-white font-medium">Thêm mới</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Thêm Lớp học mới</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Thiết lập thông tin khóa học, học phí và thêm học viên.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => navigate('/classes')} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                        Hủy bỏ
                    </button>
                    <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-bold shadow-lg shadow-primary/30 transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">save</span>
                        Lưu Lớp học
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT COLUMN */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    
                    {/* 1. General Info */}
                    <div className="bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">info</span>
                            Thông tin chung
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            
                            {/* Auto-Gen Inputs */}
                            <div>
                                <label className="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5">Khóa số (Batch) <span className="text-red-500">*</span></label>
                                <input 
                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 text-sm" 
                                    type="text"
                                    value={batch}
                                    onChange={(e) => setBatch(e.target.value)}
                                    placeholder="61"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5">Trình độ <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select 
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 text-sm appearance-none cursor-pointer"
                                        value={level}
                                        onChange={(e) => setLevel(e.target.value)}
                                    >
                                        <option value="A1">A1</option>
                                        <option value="A2">A2</option>
                                        <option value="B1">B1</option>
                                        <option value="B2">B2</option>
                                        <option value="C1">C1</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                        <span className="material-symbols-outlined text-[20px]">arrow_drop_down</span>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5">
                                    Tên lớp học (Tự động)
                                    <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">Auto</span>
                                </label>
                                <input 
                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:ring-0 px-3 py-2.5 text-sm font-bold" 
                                    type="text"
                                    value={className}
                                    readOnly
                                />
                                <p className="text-xs text-slate-500 mt-1">Mã lớp: <span className="font-mono font-bold">{classCode}</span></p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5">Sức chứa tối đa</label>
                                <div className="relative">
                                    <input 
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 pl-10 text-sm" 
                                        type="number" 
                                        value={maxCapacity}
                                        onChange={(e) => setMaxCapacity(e.target.value)}
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-slate-500">
                                        <span className="material-symbols-outlined text-[20px]">group</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5">Tổng số buổi <span className="text-red-500">*</span></label>
                                    <input 
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 text-sm" 
                                        placeholder="40" 
                                        type="number" 
                                        value={totalSessions}
                                        onChange={(e) => setTotalSessions(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5">Ngày bắt đầu</label>
                                    <input 
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 text-sm" 
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5">
                                        Ngày kết thúc
                                        <span className="ml-1 text-[10px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-full border border-secondary/20">Auto Calc</span>
                                    </label>
                                    <div className="relative">
                                        <input 
                                            className="w-full rounded-lg border-slate-200 bg-slate-100 dark:bg-slate-900/50 dark:border-slate-700 text-slate-500 dark:text-slate-500 cursor-not-allowed focus:ring-0 px-3 py-2.5 text-sm font-medium" 
                                            readOnly 
                                            type="date"
                                            value={calculatedEndDate}
                                        />
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                            <span className="material-symbols-outlined text-[20px] text-secondary">auto_awesome</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Students & Leads Selection (New Section) */}
                    <div className="bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">groups</span>
                                Học viên trong lớp
                            </h3>
                            <button 
                                onClick={() => setShowStudentSelector(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors border border-primary/10"
                            >
                                <span className="material-symbols-outlined text-[16px]">person_add</span>
                                Thêm học viên
                            </button>
                        </div>

                        {selectedStudents.length === 0 && selectedLeads.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">school</span>
                                <p className="text-sm">Chưa có học viên nào được chọn.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {selectedStudents.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Học viên có sẵn ({selectedStudents.length})</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedStudents.map(s => (
                                                <div key={s.id} className="flex items-center gap-2 pl-1 pr-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full border border-blue-100 dark:border-blue-800 text-xs">
                                                    <div className="size-5 rounded-full bg-cover bg-center" style={s.avatar.startsWith('http') ? {backgroundImage: `url('${s.avatar}')`} : {backgroundColor: '#ccc'}}></div>
                                                    <span>{s.name}</span>
                                                    <button onClick={() => handleRemoveSelection(s.id, 'student')} className="hover:text-red-500"><span className="material-symbols-outlined text-[14px]">close</span></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {selectedLeads.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 mb-2 uppercase flex items-center gap-1">
                                            Leads <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 rounded">Sẽ chuyển đổi</span> ({selectedLeads.length})
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedLeads.map(l => (
                                                <div key={l.id} className="flex items-center gap-2 pl-1 pr-2 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-full border border-orange-100 dark:border-orange-800 text-xs">
                                                    <div className="size-5 rounded-full bg-cover bg-center" style={l.avatar.startsWith('http') ? {backgroundImage: `url('${l.avatar}')`} : {backgroundColor: '#ccc'}}></div>
                                                    <span>{l.name}</span>
                                                    <button onClick={() => handleRemoveSelection(l.id, 'lead')} className="hover:text-red-500"><span className="material-symbols-outlined text-[14px]">close</span></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between text-sm">
                            <span className="text-slate-500">Tổng sĩ số dự kiến:</span>
                            <span className={`font-bold ${selectedStudents.length + selectedLeads.length > parseInt(maxCapacity) ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                                {selectedStudents.length + selectedLeads.length} / {maxCapacity}
                            </span>
                        </div>
                    </div>

                    {/* 3. Tuition & Fees */}
                    <div className="bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">payments</span>
                                Thiết lập Học phí
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span className="material-symbols-outlined text-[18px]">currency_exchange</span>
                                <span>Đơn vị: VNĐ</span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5">Học phí trọn gói <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input 
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 pl-3 pr-12 text-sm font-semibold text-right" 
                                        type="text" 
                                        value={tuitionFee}
                                        onChange={(e) => setTuitionFee(e.target.value)}
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 bg-slate-50 dark:bg-slate-700 rounded-r-lg border-l border-slate-200 dark:border-slate-600">
                                        <span className="text-xs font-bold">VNĐ</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5">Đặt cọc tối thiểu</label>
                                <div className="relative">
                                    <input 
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 pl-3 pr-12 text-sm text-right" 
                                        type="text" 
                                        defaultValue="1.000.000"
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 bg-slate-50 dark:bg-slate-700 rounded-r-lg border-l border-slate-200 dark:border-slate-600">
                                        <span className="text-xs font-bold">VNĐ</span>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5">Giảm giá (Early Bird)</label>
                                <div className="relative">
                                    <input 
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-green-600 font-medium focus:ring-primary focus:border-primary px-3 py-2.5 pl-3 pr-10 text-sm text-right" 
                                        type="number" 
                                        defaultValue="5"
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                        <span className="text-xs font-bold">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="flex flex-col gap-6">
                    {/* 4. Teacher (Updated) */}
                    <div className="bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 overflow-visible">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">person_search</span>
                            Giáo viên & Trợ giảng
                        </h3>
                        <div className="flex flex-col gap-4">
                            {/* Main Teacher */}
                            <div className="relative" ref={teacherDropdownRef}>
                                <label className="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5">Giáo viên phụ trách <span className="text-red-500">*</span></label>
                                
                                {/* Selector Trigger */}
                                <div 
                                    onClick={() => setIsTeacherDropdownOpen(!isTeacherDropdownOpen)}
                                    className={`w-full rounded-lg border bg-white dark:bg-slate-800 flex items-center justify-between px-3 py-2.5 cursor-pointer hover:border-primary transition-colors ${
                                        isTeacherDropdownOpen 
                                        ? 'border-primary ring-1 ring-primary/20' 
                                        : 'border-slate-200 dark:border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`size-8 rounded-full flex items-center justify-center ${selectedTeacher ? 'bg-transparent' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                            {selectedTeacher ? (
                                                <Avatar src={selectedTeacher.avatar} name={selectedTeacher.name} className="size-8 text-xs border border-slate-200" />
                                            ) : (
                                                <span className="material-symbols-outlined text-[18px]">person_search</span>
                                            )}
                                        </div>
                                        {selectedTeacher ? (
                                            <div className="flex flex-col leading-none">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedTeacher.name}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{selectedTeacher.email}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-500">Chọn giáo viên chính...</span>
                                        )}
                                    </div>
                                    <span className="material-symbols-outlined text-slate-400">expand_more</span>
                                </div>

                                {/* Dropdown Menu */}
                                {isTeacherDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                        {/* Search Input Sticky Top */}
                                        <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                                                <input 
                                                    autoFocus
                                                    type="text" 
                                                    className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-primary focus:border-primary placeholder:text-slate-400"
                                                    placeholder="Tìm kiếm giáo viên..."
                                                    value={teacherSearchTerm}
                                                    onChange={(e) => setTeacherSearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        
                                        {/* List */}
                                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                                            {availableTeachers.map(teacher => (
                                                <div 
                                                    key={teacher.id}
                                                    onClick={() => {
                                                        setSelectedTeacher(teacher);
                                                        setIsTeacherDropdownOpen(false);
                                                        setTeacherSearchTerm('');
                                                    }}
                                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedTeacher?.id === teacher.id ? 'bg-primary/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                >
                                                    <Avatar src={teacher.avatar} name={teacher.name} className="size-9 text-xs border border-slate-200 dark:border-slate-600" />
                                                    <div className="flex flex-col">
                                                        <span className={`text-sm font-medium ${selectedTeacher?.id === teacher.id ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                                                            {teacher.name}
                                                        </span>
                                                        <span className="text-xs text-slate-500">{teacher.email}</span>
                                                    </div>
                                                    {selectedTeacher?.id === teacher.id && (
                                                        <span className="material-symbols-outlined text-primary ml-auto text-[18px]">check</span>
                                                    )}
                                                </div>
                                            ))}
                                            {availableTeachers.length === 0 && (
                                                <div className="text-center py-6 text-slate-500 text-sm">
                                                    Không tìm thấy giáo viên.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Assistant Teacher (New) */}
                            <div className="relative" ref={assistantDropdownRef}>
                                <label className="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5">Trợ giảng (Nếu có)</label>
                                
                                {/* Selector Trigger */}
                                <div 
                                    onClick={() => setIsAssistantDropdownOpen(!isAssistantDropdownOpen)}
                                    className={`w-full rounded-lg border bg-white dark:bg-slate-800 flex items-center justify-between px-3 py-2.5 cursor-pointer hover:border-primary transition-colors ${
                                        isAssistantDropdownOpen 
                                        ? 'border-primary ring-1 ring-primary/20' 
                                        : 'border-slate-200 dark:border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`size-8 rounded-full flex items-center justify-center ${selectedAssistant ? 'bg-transparent' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                            {selectedAssistant ? (
                                                <Avatar src={selectedAssistant.avatar} name={selectedAssistant.name} className="size-8 text-xs border border-slate-200" />
                                            ) : (
                                                <span className="material-symbols-outlined text-[18px]">group_add</span>
                                            )}
                                        </div>
                                        {selectedAssistant ? (
                                            <div className="flex flex-col leading-none">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedAssistant.name}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{selectedAssistant.email}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-500">Chưa có dữ liệu trợ giảng...</span>
                                        )}
                                    </div>
                                    {selectedAssistant ? (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setSelectedAssistant(null); }}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <span className="material-symbols-outlined">close</span>
                                        </button>
                                    ) : (
                                        <span className="material-symbols-outlined text-slate-400">expand_more</span>
                                    )}
                                </div>

                                {/* Dropdown Menu */}
                                {isAssistantDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                        {/* Search Input Sticky Top */}
                                        <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                                                <input 
                                                    autoFocus
                                                    type="text" 
                                                    className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-primary focus:border-primary placeholder:text-slate-400"
                                                    placeholder="Tìm kiếm trợ giảng..."
                                                    value={assistantSearchTerm}
                                                    onChange={(e) => setAssistantSearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        
                                        {/* List */}
                                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                                            {availableAssistants.map(staff => (
                                                <div 
                                                    key={staff.id}
                                                    onClick={() => {
                                                        setSelectedAssistant(staff);
                                                        setIsAssistantDropdownOpen(false);
                                                        setAssistantSearchTerm('');
                                                    }}
                                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedAssistant?.id === staff.id ? 'bg-primary/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                >
                                                    <Avatar src={staff.avatar} name={staff.name} className="size-9 text-xs border border-slate-200 dark:border-slate-600" />
                                                    <div className="flex flex-col">
                                                        <span className={`text-sm font-medium ${selectedAssistant?.id === staff.id ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                                                            {staff.name}
                                                        </span>
                                                        <span className="text-xs text-slate-500">{staff.email}</span>
                                                    </div>
                                                    {selectedAssistant?.id === staff.id && (
                                                        <span className="material-symbols-outlined text-primary ml-auto text-[18px]">check</span>
                                                    )}
                                                </div>
                                            ))}
                                            {availableAssistants.length === 0 && (
                                                <div className="text-center py-6 text-slate-500 text-sm">
                                                    Không tìm thấy nhân sự phù hợp.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 5. Schedule & Format */}
                    <div className="bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">calendar_month</span>
                            Lịch học & Địa điểm
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-3">Loại lớp học</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className={`cursor-pointer relative rounded-xl border-2 p-3 transition-all flex flex-col items-center gap-2 ${classType === 'offline' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                        <input type="radio" name="classType" className="sr-only" checked={classType === 'offline'} onChange={() => setClassType('offline')} />
                                        <span className="material-symbols-outlined text-2xl text-slate-600 dark:text-slate-300">apartment</span>
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">Offline</span>
                                    </label>
                                    <label className={`cursor-pointer relative rounded-xl border-2 p-3 transition-all flex flex-col items-center gap-2 ${classType === 'online' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                        <input type="radio" name="classType" className="sr-only" checked={classType === 'online'} onChange={() => setClassType('online')} />
                                        <span className="material-symbols-outlined text-2xl text-slate-600 dark:text-slate-300">video_camera_front</span>
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">Online</span>
                                    </label>
                                </div>
                            </div>

                            {classType === 'online' ? (
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5">Link học (Google Meet/Zoom)</label>
                                    <input 
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 text-sm" 
                                        placeholder="https://meet.google.com/..." 
                                        type="text"
                                        value={meetingLink}
                                        onChange={(e) => setMeetingLink(e.target.value)}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5">Địa chỉ học</label>
                                    <input 
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 text-sm" 
                                        placeholder="Nhập địa chỉ..." 
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                    />
                                </div>
                            )}
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-2">Ngày học trong tuần</label>
                                <div className="flex flex-wrap gap-2">
                                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                                        <label key={day} className="cursor-pointer">
                                            <input type="checkbox" className="sr-only" checked={selectedDays.includes(day)} onChange={() => toggleDay(day)} />
                                            <div className={`size-9 rounded-lg border flex items-center justify-center text-xs font-bold transition-all ${selectedDays.includes(day) ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}>
                                                {day}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {showStudentSelector && (
          <StudentSelectorModal 
            onClose={() => setShowStudentSelector(false)}
            onConfirm={(students, leads) => {
                setSelectedStudents([...selectedStudents, ...students.filter(s => !selectedStudents.some(ex => ex.id === s.id))]);
                setSelectedLeads([...selectedLeads, ...leads.filter(l => !selectedLeads.some(ex => ex.id === l.id))]);
                setShowStudentSelector(false);
            }}
          />
      )}
    </div>
  );
};

export default CreateClass;
