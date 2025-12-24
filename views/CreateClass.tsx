
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import StudentSelectorModal from '../components/StudentSelectorModal';
import { Student, Lead } from '../types';
import { useData } from '../context/DataContext';

const CreateClass: React.FC = () => {
  const navigate = useNavigate();
  const { addClass, calculateEndDate } = useData();

  // Form States
  const [className, setClassName] = useState('');
  const [level, setLevel] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('15');
  const [totalSessions, setTotalSessions] = useState('24');
  const [startDate, setStartDate] = useState('');
  const [calculatedEndDate, setCalculatedEndDate] = useState(''); // Read-only
  const [teacher, setTeacher] = useState('');
  
  const [classType, setClassType] = useState<'offline' | 'online'>('offline');
  const [location, setLocation] = useState('102 Ngô Quyền, Hà Đông, Hà Nội');
  const [meetingLink, setMeetingLink] = useState('');

  const [selectedDays, setSelectedDays] = useState<string[]>(['T2', 'T4', 'T6']);
  const [tuitionFee, setTuitionFee] = useState<string>('5.000.000');
  
  // Selection States
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);

  // Auto-calculate End Date
  useEffect(() => {
      if (startDate && totalSessions && selectedDays.length > 0) {
          const dayOrder = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
          const sortedDays = [...selectedDays].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
          const daysStr = sortedDays.join(' / ');
          const sessions = parseInt(totalSessions) || 0;
          
          setCalculatedEndDate(calculateEndDate(startDate, sessions, daysStr));
      } else {
          setCalculatedEndDate('');
      }
  }, [startDate, totalSessions, selectedDays, calculateEndDate]);

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

    const sessions = parseInt(totalSessions) || 24;
    const dayOrder = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const sortedDays = [...selectedDays].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));

    addClass({
        name: className,
        code: `K${Math.floor(Math.random() * 100)}`, // Auto gen code
        schedule: sortedDays.join(' / ') + " • 18:30",
        mode: classType,
        teacher: teacher || "Chưa phân công",
        teacherAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCkYGLiTHbhXntle05Va5L5Sz3raJFux7O5sf9UkJt9Zbb_y2OEdJnwR7BpwKSDge0E0cpVz-RPKeixhGplF2fzPr_j431kzx9o-imd0lUTpm6mzz97qoDykVn38_-sqsQRyZaaBU3fgOf9Fhj6bvlGbkwDJI-ROTNHlIA7WsRhYCtjDzCPJc96RJO3daTtw40GivkoLhAnmf7WtiQxGreJpJuCKrfpLBENq8tR9uRdVKmLRHexypzCtt04nMXsbOofKW8s4SLrcWqL", 
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
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5">Tên lớp học <span className="text-red-500">*</span></label>
                                <input 
                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 text-sm" 
                                    placeholder="Ví dụ: Tiếng Đức A1 - K24" 
                                    type="text"
                                    value={className}
                                    onChange={(e) => setClassName(e.target.value)}
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
                                        <option disabled selected value="">Chọn cấp độ</option>
                                        <option value="A1">A1 - Cơ bản</option>
                                        <option value="A2">A2 - Sơ cấp</option>
                                        <option value="B1">B1 - Trung cấp 1</option>
                                        <option value="B2">B2 - Trung cấp 2</option>
                                        <option value="C1">C1 - Cao cấp 1</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                        <span className="material-symbols-outlined text-[20px]">arrow_drop_down</span>
                                    </div>
                                </div>
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
                    {/* 4. Teacher */}
                    <div className="bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">person_search</span>
                            Giáo viên phụ trách
                        </h3>
                        <div className="relative">
                            <label className="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5">Tìm kiếm giáo viên</label>
                            <div className="relative">
                                <input 
                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 pl-10 text-sm" 
                                    placeholder="Nhập tên giáo viên..." 
                                    type="text"
                                    value={teacher}
                                    onChange={(e) => setTeacher(e.target.value)}
                                />
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-slate-500">
                                    <span className="material-symbols-outlined text-[20px]">search</span>
                                </div>
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
