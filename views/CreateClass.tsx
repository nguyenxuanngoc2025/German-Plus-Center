
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import StudentSelectorModal from '../components/StudentSelectorModal';
import { Student, Lead, Staff } from '../types';
import { useData } from '../context/DataContext';
import Avatar from '../components/Avatar';
import { useFormPersistence } from '../hooks/useFormPersistence';

const CreateClass: React.FC = () => {
  const navigate = useNavigate();
  const { addClass, recalculateSchedule, staff } = useData();

  // --- PERSISTENT FORM STATE ---
  const [formData, setFormData, clearDraft] = useFormPersistence('draft_cc_form', {
      batch: '61',
      className: '',
      classCode: '',
      level: 'A1',
      maxCapacity: '15',
      totalSessions: '24',
      startDate: '',
      classType: 'offline',
      location: '102 Ngô Quyền, Hà Đông, Hà Nội',
      meetingLink: '',
      selectedDays: ['T2', 'T4', 'T6'],
      tuitionFee: '5.000.000',
      selectedTeacherId: '',
      selectedAssistantId: ''
  });

  const [calculatedEndDate, setCalculatedEndDate] = useState(''); // Read-only

  // --- SELECTION STATES ---
  // We re-hydrate selection objects based on IDs from formData or manual selection
  const [selectedTeacher, setSelectedTeacher] = useState<Staff | null>(null);
  const [selectedAssistant, setSelectedAssistant] = useState<Staff | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);

  // Hydrate Staff from IDs on mount/update if they exist in persisted data
  useEffect(() => {
      if (formData.selectedTeacherId && !selectedTeacher) {
          const t = staff.find(s => s.id === formData.selectedTeacherId);
          if (t) setSelectedTeacher(t);
      }
      if (formData.selectedAssistantId && !selectedAssistant) {
          const a = staff.find(s => s.id === formData.selectedAssistantId);
          if (a) setSelectedAssistant(a);
      }
  }, [formData.selectedTeacherId, formData.selectedAssistantId, staff]);

  // Dropdown States
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const teacherDropdownRef = useRef<HTMLDivElement>(null);

  const [isAssistantDropdownOpen, setIsAssistantDropdownOpen] = useState(false);
  const [assistantSearchTerm, setAssistantSearchTerm] = useState('');
  const assistantDropdownRef = useRef<HTMLDivElement>(null);
  
  const [showStudentSelector, setShowStudentSelector] = useState(false);

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

  // --- AUTO-GENERATE NAME & CODE ---
  useEffect(() => {
      // Safety check for selectedDays to prevent crashes if it gets corrupted
      const currentDays = Array.isArray(formData.selectedDays) ? formData.selectedDays : [];
      
      const dayOrder = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      const sortedDays = [...currentDays].sort((a: string, b: string) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
      
      let scheduleDigits = '';
      let hasCN = false;
      sortedDays.forEach((d: string) => {
          if (d === 'CN') hasCN = true;
          else scheduleDigits += d.replace('T', '');
      });
      let scheduleShort = 'T' + scheduleDigits;
      if (hasCN) scheduleShort += 'CN';
      if (sortedDays.length === 0) scheduleShort = 'TBD';

      const modeStr = formData.classType === 'online' ? 'Online' : 'Offline';
      const modeCode = formData.classType === 'online' ? 'ON' : 'OFF';
      
      const genName = `K${formData.batch} ${modeStr} ${formData.level} (${scheduleShort})`;
      const genCode = `K${formData.batch}.${formData.level}${modeCode}`;

      // Only update if changed to avoid unnecessary renders
      if (genName !== formData.className || genCode !== formData.classCode) {
          setFormData({ ...formData, className: genName, classCode: genCode });
      }

  }, [formData.batch, formData.classType, formData.level, formData.selectedDays]);


  // Auto-calculate End Date
  useEffect(() => {
      const currentDays = Array.isArray(formData.selectedDays) ? formData.selectedDays : [];
      
      if (formData.startDate && formData.totalSessions && currentDays.length > 0) {
          const dayOrder = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
          const sortedDays = [...currentDays].sort((a: string, b: string) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
          const daysStr = sortedDays.join(' / ');
          const sessions = parseInt(formData.totalSessions) || 0;
          
          const end = recalculateSchedule(formData.startDate, sessions, daysStr);
          setCalculatedEndDate(end);
      } else {
          setCalculatedEndDate('');
      }
  }, [formData.startDate, formData.totalSessions, formData.selectedDays, recalculateSchedule]);

  const toggleDay = (day: string) => {
    let newDays;
    const currentDays = Array.isArray(formData.selectedDays) ? formData.selectedDays : [];
    
    if (currentDays.includes(day)) {
        newDays = currentDays.filter((d: string) => d !== day);
    } else {
        newDays = [...currentDays, day];
    }
    setFormData({ ...formData, selectedDays: newDays });
  };

  const updateField = (field: string, value: any) => {
      setFormData({ ...formData, [field]: value });
  };

  const handleSave = () => {
    if (!formData.className || !formData.level) {
        alert("Vui lòng nhập tên lớp và trình độ!");
        return;
    }

    if (!selectedTeacher) {
        alert("Vui lòng chọn giáo viên phụ trách!");
        return;
    }

    const sessions = parseInt(formData.totalSessions) || 24;
    const dayOrder = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const currentDays = Array.isArray(formData.selectedDays) ? formData.selectedDays : [];
    const sortedDays = [...currentDays].sort((a: string, b: string) => dayOrder.indexOf(a) - dayOrder.indexOf(b));

    addClass({
        name: formData.className,
        code: formData.classCode,
        level: formData.level,
        schedule: sortedDays.join(' / ') + " • 18:30",
        mode: formData.classType as 'online' | 'offline',
        teacher: selectedTeacher.name,
        teacherAvatar: selectedTeacher.avatar,
        assistant: selectedAssistant?.name,
        assistantAvatar: selectedAssistant?.avatar,
        maxStudents: parseInt(formData.maxCapacity),
        tuitionFee: parseInt(formData.tuitionFee.replace(/\D/g, '')),
        link: formData.classType === 'online' ? formData.meetingLink : undefined,
        location: formData.classType === 'offline' ? formData.location : undefined,
        startDate: formData.startDate,
        endDate: calculatedEndDate,
        totalSessions: sessions
    }, selectedStudents.map(s => s.id), selectedLeads.map(l => l.id));

    alert("Đã tạo lớp học thành công và thêm học viên!");
    clearDraft(); // Clear local storage draft
    navigate('/classes');
  };

  const handleRemoveSelection = (id: string, type: 'student' | 'lead') => {
      if(type === 'student') {
          setSelectedStudents(prev => prev.filter(s => s.id !== id));
      } else {
          setSelectedLeads(prev => prev.filter(l => l.id !== id));
      }
  };

  const handleSelectTeacher = (teacher: Staff) => {
      setSelectedTeacher(teacher);
      updateField('selectedTeacherId', teacher.id);
      setIsTeacherDropdownOpen(false);
      setTeacherSearchTerm('');
  };

  const handleSelectAssistant = (assistant: Staff) => {
      setSelectedAssistant(assistant);
      updateField('selectedAssistantId', assistant.id);
      setIsAssistantDropdownOpen(false);
      setAssistantSearchTerm('');
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden">
      <Header title="Thêm Lớp học" />
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
        <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-20">
            
            {/* Page Title & Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-apple-gray mb-1">
                        <span onClick={() => navigate('/classes')} className="cursor-pointer hover:text-primary">Lớp học</span>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-apple-black dark:text-white font-medium">Thêm mới</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-title text-apple-black dark:text-white tracking-tight">Thêm Lớp học mới</h2>
                        <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded border border-orange-200 cursor-help font-bold" title="Dữ liệu đang được lưu nháp tự động">
                            Auto-Draft
                        </span>
                    </div>
                    <p className="text-apple-gray dark:text-slate-400 text-sm mt-1">Thiết lập thông tin khóa học, học phí và thêm học viên.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT COLUMN */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    
                    {/* 1. General Info */}
                    <div className="bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-bold text-apple-black dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">info</span>
                            Thông tin chung
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            
                            {/* Auto-Gen Inputs */}
                            <div>
                                <label className="block text-sm font-semibold text-apple-black dark:text-slate-200 mb-1.5">Khóa số (Batch) <span className="text-red-500">*</span></label>
                                <input 
                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-apple-black dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 text-sm" 
                                    type="text"
                                    value={formData.batch}
                                    onChange={(e) => updateField('batch', e.target.value)}
                                    placeholder="61"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-apple-black dark:text-slate-200 mb-1.5">Trình độ <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select 
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-apple-black dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 text-sm appearance-none cursor-pointer"
                                        value={formData.level}
                                        onChange={(e) => updateField('level', e.target.value)}
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
                                <label className="block text-sm font-semibold text-apple-black dark:text-slate-200 mb-1.5">
                                    Tên lớp học (Tự động)
                                    <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 font-bold">Auto</span>
                                </label>
                                <input 
                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:ring-0 px-3 py-2.5 text-sm font-bold" 
                                    type="text"
                                    value={formData.className}
                                    readOnly
                                />
                                <p className="text-xs text-slate-500 mt-1">Mã lớp: <span className="font-mono font-bold">{formData.classCode}</span></p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-apple-black dark:text-slate-200 mb-1.5">Sức chứa tối đa</label>
                                <div className="relative">
                                    <input 
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-apple-black dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 pl-10 text-sm" 
                                        type="number" 
                                        value={formData.maxCapacity}
                                        onChange={(e) => updateField('maxCapacity', e.target.value)}
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-slate-500">
                                        <span className="material-symbols-outlined text-[20px]">group</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                                <div>
                                    <label className="block text-sm font-semibold text-apple-black dark:text-slate-200 mb-1.5">Tổng số buổi <span className="text-red-500">*</span></label>
                                    <input 
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-apple-black dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 text-sm" 
                                        placeholder="40" 
                                        type="number" 
                                        value={formData.totalSessions}
                                        onChange={(e) => updateField('totalSessions', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-apple-black dark:text-slate-200 mb-1.5">Ngày bắt đầu</label>
                                    <input 
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-apple-black dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 text-sm" 
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => updateField('startDate', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-apple-black dark:text-slate-200 mb-1.5">
                                        Ngày kết thúc
                                        <span className="ml-1 text-[10px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-full border border-secondary/20 font-bold">Auto Calc</span>
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
                            <h3 className="text-lg font-bold text-apple-black dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">groups</span>
                                Học viên trong lớp
                            </h3>
                            <button 
                                onClick={() => setShowStudentSelector(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors border border-primary/10 whitespace-nowrap"
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
                                                <div key={s.id} className="flex items-center gap-2 pl-1 pr-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full border border-blue-100 dark:border-blue-800 text-[13px] font-medium">
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
                                            Leads <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 rounded font-bold">Sẽ chuyển đổi</span> ({selectedLeads.length})
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedLeads.map(l => (
                                                <div key={l.id} className="flex items-center gap-2 pl-1 pr-2 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-full border border-orange-100 dark:border-orange-800 text-[13px] font-medium">
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
                            <span className={`font-bold ${selectedStudents.length + selectedLeads.length > parseInt(formData.maxCapacity) ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                                {selectedStudents.length + selectedLeads.length} / {formData.maxCapacity}
                            </span>
                        </div>
                    </div>

                    {/* 3. Tuition & Fees */}
                    <div className="bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-apple-black dark:text-white flex items-center gap-2">
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
                                <label className="block text-sm font-semibold text-apple-black dark:text-slate-200 mb-1.5">Học phí trọn gói <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input 
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-apple-black dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 pl-3 pr-12 text-sm font-semibold text-right" 
                                        type="text" 
                                        value={formData.tuitionFee}
                                        onChange={(e) => updateField('tuitionFee', e.target.value)}
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 bg-slate-50 dark:bg-slate-700 rounded-r-lg border-l border-slate-200 dark:border-slate-600">
                                        <span className="text-xs font-bold">VNĐ</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="md:col-span-1">
                                <label className="block text-sm font-semibold text-apple-black dark:text-slate-200 mb-1.5">Đặt cọc tối thiểu</label>
                                <div className="relative">
                                    <input 
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-apple-black dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 pl-3 pr-12 text-sm text-right" 
                                        type="text" 
                                        defaultValue="1.000.000"
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 bg-slate-50 dark:bg-slate-700 rounded-r-lg border-l border-slate-200 dark:border-slate-600">
                                        <span className="text-xs font-bold">VNĐ</span>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-1">
                                <label className="block text-sm font-semibold text-apple-black dark:text-slate-200 mb-1.5">Giảm giá (Early Bird)</label>
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
                    {/* 4. Teacher */}
                    <div className="bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 overflow-visible">
                        <h3 className="text-lg font-bold text-apple-black dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">person_search</span>
                            Giáo viên & Trợ giảng
                        </h3>
                        <div className="flex flex-col gap-4">
                            {/* Main Teacher */}
                            <div className="relative" ref={teacherDropdownRef}>
                                <label className="block text-sm font-semibold text-apple-black dark:text-slate-200 mb-1.5">Giáo viên phụ trách <span className="text-red-500">*</span></label>
                                
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
                                                <span className="text-sm font-bold text-apple-black dark:text-white">{selectedTeacher.name}</span>
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
                                                    onClick={() => handleSelectTeacher(teacher)}
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

                            {/* Assistant Teacher */}
                            <div className="relative" ref={assistantDropdownRef}>
                                <label className="block text-sm font-semibold text-apple-black dark:text-slate-200 mb-1.5">Trợ giảng (Nếu có)</label>
                                
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
                                                <span className="text-sm font-bold text-apple-black dark:text-white">{selectedAssistant.name}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{selectedAssistant.email}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-500">Chưa có dữ liệu trợ giảng...</span>
                                        )}
                                    </div>
                                    {selectedAssistant ? (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setSelectedAssistant(null); updateField('selectedAssistantId', ''); }}
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
                                                    onClick={() => handleSelectAssistant(staff)}
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
                        <h3 className="text-lg font-bold text-apple-black dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">calendar_month</span>
                            Lịch học & Địa điểm
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-apple-black dark:text-slate-200 mb-3">Loại lớp học</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className={`cursor-pointer relative rounded-xl border-2 p-3 transition-all flex flex-col items-center gap-2 ${formData.classType === 'offline' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                        <input type="radio" name="classType" className="sr-only" checked={formData.classType === 'offline'} onChange={() => updateField('classType', 'offline')} />
                                        <span className="material-symbols-outlined text-2xl text-slate-600 dark:text-slate-300">apartment</span>
                                        <span className="text-xs font-bold text-apple-black dark:text-white">Offline</span>
                                    </label>
                                    <label className={`cursor-pointer relative rounded-xl border-2 p-3 transition-all flex flex-col items-center gap-2 ${formData.classType === 'online' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                        <input type="radio" name="classType" className="sr-only" checked={formData.classType === 'online'} onChange={() => updateField('classType', 'online')} />
                                        <span className="material-symbols-outlined text-2xl text-slate-600 dark:text-slate-300">video_camera_front</span>
                                        <span className="text-xs font-bold text-apple-black dark:text-white">Online</span>
                                    </label>
                                </div>
                            </div>

                            {formData.classType === 'online' ? (
                                <div>
                                    <label className="block text-sm font-semibold text-apple-black dark:text-slate-200 mb-1.5">Link học Online</label>
                                    <input 
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-apple-black dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 text-sm" 
                                        placeholder="https://meet.google.com/..." 
                                        type="text"
                                        value={formData.meetingLink}
                                        onChange={(e) => updateField('meetingLink', e.target.value)}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-semibold text-apple-black dark:text-slate-200 mb-1.5">Địa chỉ phòng học</label>
                                    <input 
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-apple-black dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 text-sm" 
                                        placeholder="Nhập địa chỉ..." 
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => updateField('location', e.target.value)}
                                    />
                                </div>
                            )}
                            
                            <div>
                                <label className="block text-sm font-semibold text-apple-black dark:text-slate-200 mb-2">Ngày học trong tuần</label>
                                <div className="flex flex-wrap gap-2">
                                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                                        <label key={day} className="cursor-pointer select-none">
                                            <input type="checkbox" className="sr-only" checked={(Array.isArray(formData.selectedDays) ? formData.selectedDays : []).includes(day)} onChange={() => toggleDay(day)} />
                                            <div className={`size-9 rounded-lg border flex items-center justify-center text-xs font-bold transition-all ${(Array.isArray(formData.selectedDays) ? formData.selectedDays : []).includes(day) ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}>
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

      {/* Sticky Footer - Positioned relative to flex container, outside scroll area */}
      <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a202c] p-4 md:px-8 flex justify-end gap-3 shrink-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button onClick={() => { clearDraft(); navigate('/classes'); }} className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[13px] font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap">
              Hủy bỏ
          </button>
          <button onClick={handleSave} className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-[13px] font-bold shadow-lg shadow-primary/30 transition-all flex items-center gap-2 whitespace-nowrap">
              <span className="material-symbols-outlined text-[18px]">save</span>
              Lưu Lớp học
          </button>
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
