
import React, { useState, useEffect, useMemo } from 'react';
import { ClassItem } from '../types';
import { useData } from '../context/DataContext';

interface Props {
  classData: ClassItem;
  onClose: () => void;
}

const EditClassModal: React.FC<Props> = ({ classData, onClose }) => {
  const { updateClass, recalculateSchedule } = useData();
  
  // Local state for Schedule Builder
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [classTime, setClassTime] = useState('18:00');

  // Local state for Off Days (Holidays)
  const [offDaysList, setOffDaysList] = useState<string[]>([]);
  const [tempOffDay, setTempOffDay] = useState('');
  const [isScheduleShifted, setIsScheduleShifted] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    teacher: '',
    maxStudents: 0,
    location: '',
    startDate: '',
    endDate: '',
    totalSessions: 24, // Default
    schedule: '',
    tuitionFee: 0,
    status: 'active' as ClassItem['status'],
    mode: 'offline' as 'online' | 'offline',
    level: 'A1',
    link: ''
  });

  // Init Data
  useEffect(() => {
    setFormData({
      name: classData.name,
      teacher: classData.teacher,
      maxStudents: classData.maxStudents,
      location: classData.location || '',
      link: classData.link || '',
      schedule: classData.schedule,
      tuitionFee: classData.tuitionFee,
      status: classData.status,
      mode: classData.mode,
      level: classData.level || classData.name.split(' ')[2] || 'A1',
      startDate: classData.startDate || '',
      endDate: classData.endDate || '',
      totalSessions: classData.totalSessions || 24, // Fallback
    });

    // Init Off Days
    if (classData.offDays && Array.isArray(classData.offDays)) {
        setOffDaysList(classData.offDays);
    }

    // Parse existing schedule string: "T2 / T4 • 18:00"
    if (classData.schedule) {
        const parts = classData.schedule.split('•');
        const daysPart = parts[0]?.trim();
        const timePart = parts[1]?.trim();

        if (daysPart) {
            // Split by '/' and trim to get days array
            const days = daysPart.split('/').map(d => d.trim()).filter(d => d);
            setSelectedDays(days);
        }
        if (timePart) {
            setClassTime(timePart);
        }
    }
  }, [classData]);

  // Auto-calculate Schedule String & End Date
  useEffect(() => {
      const dayOrder = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      
      // 1. Sort days
      const sortedDays = [...selectedDays].sort((a, b) => {
          return dayOrder.indexOf(a) - dayOrder.indexOf(b);
      });

      // 2. Update Schedule String
      const daysString = sortedDays.join(' / ');
      const finalSchedule = `${daysString} • ${classTime}`;
      
      // 3. Auto Calculate End Date using RECALCULATE ENGINE
      let newEndDate = formData.endDate;
      let calculated = false;

      if (formData.startDate && formData.totalSessions > 0 && daysString) {
          // Pass offDaysList to calculation engine
          newEndDate = recalculateSchedule(formData.startDate, formData.totalSessions, daysString, offDaysList);
          calculated = true;
      }

      // Check if schedule shifted logic needs display
      // We compare calculated date vs stored date. 
      // If user adds an off day, calculated date will shift forward.
      if (calculated && newEndDate !== formData.endDate) {
          setIsScheduleShifted(true);
          // Auto hide notification after 3s
          const timer = setTimeout(() => setIsScheduleShifted(false), 3000);
          return () => clearTimeout(timer);
      }

      setFormData(prev => ({ 
          ...prev, 
          schedule: finalSchedule,
          endDate: newEndDate // Always update to the calculated one in edit mode
      }));
  }, [selectedDays, classTime, formData.startDate, formData.totalSessions, offDaysList]);

  const toggleDay = (day: string) => {
      setSelectedDays(prev => 
          prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
      );
  };

  const handleAddOffDay = () => {
      if (!tempOffDay) return;
      if (offDaysList.includes(tempOffDay)) {
          alert("Ngày này đã có trong danh sách nghỉ!");
          return;
      }
      // Add and Sort chronological
      const newList = [...offDaysList, tempOffDay].sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
      setOffDaysList(newList);
      setTempOffDay('');
  };

  const handleRemoveOffDay = (dateStr: string) => {
      setOffDaysList(prev => prev.filter(d => d !== dateStr));
  };

  const handleSave = () => {
      updateClass(classData.id, {
          ...formData,
          offDays: offDaysList // Persist the off days list
      });
      alert('Cập nhật lớp học thành công!');
      onClose();
  };

  // Helper to format date for display
  const formatDateDisplay = (isoStr: string) => {
      const d = new Date(isoStr);
      return `${d.getDate()}/${d.getMonth()+1}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111318]/60 p-4 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white dark:bg-[#1a202c] w-full max-w-[800px] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a202c]">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_square</span>
                Cài đặt Lớp học
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <span className="material-symbols-outlined">close</span>
            </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* General Info */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tên lớp học</label>
                    <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary px-3 py-2 text-sm"
                    />
                </div>

                {/* SCHEDULE BUILDER UI */}
                <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">calendar_month</span>
                        Lịch học cố định
                    </label>
                    
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Day Selector */}
                        <div className="flex-1">
                            <span className="text-xs font-semibold text-slate-500 mb-2 block uppercase">Chọn thứ trong tuần</span>
                            <div className="flex flex-wrap gap-2">
                                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                                    <button
                                        key={day}
                                        onClick={() => toggleDay(day)}
                                        className={`size-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all border ${
                                            selectedDays.includes(day)
                                            ? 'bg-primary text-white border-primary shadow-md transform scale-105'
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-primary/50'
                                        }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Time Picker */}
                        <div>
                            <span className="text-xs font-semibold text-slate-500 mb-2 block uppercase">Giờ bắt đầu</span>
                            <div className="relative">
                                <input 
                                    type="time" 
                                    value={classTime}
                                    onChange={(e) => setClassTime(e.target.value)}
                                    className="h-10 pl-3 pr-2 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary text-sm font-bold w-32 cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Preview */}
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
                        <span className="text-xs text-slate-500">Xem trước:</span>
                        <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                            {formData.schedule || 'Chưa thiết lập'}
                        </span>
                    </div>
                </div>

                {/* HOLIDAY MANAGER UI (NEW) */}
                <div className="md:col-span-2 bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-800/30">
                    <label className="block text-sm font-bold text-orange-800 dark:text-orange-300 mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined">event_busy</span>
                        Danh sách ngày nghỉ của lớp
                    </label>
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                        <div className="flex gap-2">
                            <input 
                                type="date" 
                                value={tempOffDay}
                                onChange={(e) => setTempOffDay(e.target.value)}
                                className="h-9 px-2 rounded-lg border-orange-200 dark:border-orange-800 bg-white dark:bg-slate-800 text-sm focus:ring-orange-500 focus:border-orange-500"
                            />
                            <button 
                                onClick={handleAddOffDay}
                                className="h-9 w-9 flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-sm transition-colors"
                                title="Thêm ngày nghỉ"
                            >
                                <span className="material-symbols-outlined text-[20px]">add</span>
                            </button>
                        </div>
                        
                        {/* Tags Container */}
                        <div className="flex-1 flex flex-wrap gap-2 items-center bg-white dark:bg-slate-800/50 p-2 rounded-lg border border-orange-100 dark:border-orange-800/30 min-h-[38px]">
                            {offDaysList.length === 0 && <span className="text-xs text-slate-400 italic px-2">Chưa có ngày nghỉ nào.</span>}
                            {offDaysList.map(dateStr => (
                                <div key={dateStr} className="flex items-center gap-1 pl-2 pr-1 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 rounded text-xs font-bold border border-orange-200 dark:border-orange-800">
                                    <span>{formatDateDisplay(dateStr)}</span>
                                    <button onClick={() => handleRemoveOffDay(dateStr)} className="hover:text-red-500 flex items-center">
                                        <span className="material-symbols-outlined text-[14px]">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="text-[10px] text-orange-600/70 dark:text-orange-400/70 mt-2 italic">
                        * Hệ thống sẽ tự động tịnh tiến lịch học và cập nhật ngày kết thúc nếu ngày nghỉ trùng với lịch học.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Ngày bắt đầu</label>
                    <input 
                        type="date" 
                        value={formData.startDate}
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                        className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary px-3 py-2 text-sm"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tổng số buổi</label>
                    <input 
                        type="number" 
                        value={formData.totalSessions}
                        onChange={(e) => setFormData({...formData, totalSessions: parseInt(e.target.value) || 0})}
                        className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary px-3 py-2 text-sm font-bold"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between">
                        <span>Ngày kết thúc dự kiến <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-bold">Auto Calc</span></span>
                        
                        {isScheduleShifted && (
                            <span className="text-xs text-orange-600 font-bold animate-pulse flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">update</span>
                                Đã cập nhật lịch học do có ngày nghỉ!
                            </span>
                        )}
                    </label>
                    <div className="relative">
                        <input 
                            type="date" 
                            value={formData.endDate}
                            readOnly
                            className={`w-full rounded-lg border transition-all duration-300 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 focus:ring-0 px-3 py-2 text-sm cursor-not-allowed font-medium ${isScheduleShifted ? 'border-orange-400 ring-2 ring-orange-100' : 'border-slate-200 dark:border-slate-700'}`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[18px]">lock</span>
                    </div>
                </div>

                {formData.mode === 'online' ? (
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Link học Online</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">link</span>
                            <input 
                                type="text" 
                                value={formData.link}
                                onChange={(e) => setFormData({...formData, link: e.target.value})}
                                placeholder="https://meet.google.com/..."
                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary pl-10 pr-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Địa chỉ phòng học</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">location_on</span>
                            <input 
                                type="text" 
                                value={formData.location}
                                onChange={(e) => setFormData({...formData, location: e.target.value})}
                                placeholder="P.301, Tầng 3, Tòa nhà..."
                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary pl-10 pr-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
                Hủy bỏ
            </button>
            <button 
                onClick={handleSave}
                className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-bold shadow-sm transition-all flex items-center gap-2"
            >
                <span className="material-symbols-outlined text-[18px]">save</span>
                Lưu thay đổi
            </button>
        </div>
      </div>
    </div>
  );
};

export default EditClassModal;
