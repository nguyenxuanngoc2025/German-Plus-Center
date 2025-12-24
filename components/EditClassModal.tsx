
import React, { useState, useEffect } from 'react';
import { ClassItem } from '../types';
import { useData } from '../context/DataContext';

interface Props {
  classData: ClassItem;
  onClose: () => void;
}

const EditClassModal: React.FC<Props> = ({ classData, onClose }) => {
  const { updateClass } = useData();
  const [formData, setFormData] = useState({
    name: '',
    teacher: '',
    maxStudents: 0,
    location: '',
    startDate: '',
    endDate: '',
    schedule: '',
    tuitionFee: 0,
    status: 'active' as ClassItem['status']
  });

  useEffect(() => {
    // Populate form with existing data or defaults
    // Note: startDate/endDate might need to be added to ClassItem type in a real app, 
    // here we mock or try to extract if available, otherwise default
    setFormData({
      name: classData.name,
      teacher: classData.teacher,
      maxStudents: classData.maxStudents,
      location: classData.location || classData.link || '',
      schedule: classData.schedule,
      tuitionFee: classData.tuitionFee,
      status: classData.status,
      // Default dates if not present in object
      startDate: '2023-10-01', 
      endDate: '2023-12-15'
    });
  }, [classData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.teacher) {
        alert("Vui lòng điền các trường bắt buộc!");
        return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        alert("Ngày kết thúc phải lớn hơn ngày khai giảng!");
        return;
    }

    // Calculate Progress based on dates
    const totalDuration = new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime();
    const elapsed = Date.now() - new Date(formData.startDate).getTime();
    const newProgress = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

    // Update Global State
    updateClass(classData.id, {
        name: formData.name,
        teacher: formData.teacher,
        maxStudents: Number(formData.maxStudents),
        location: classData.mode === 'offline' ? formData.location : undefined,
        link: classData.mode === 'online' ? formData.location : undefined,
        schedule: formData.schedule,
        tuitionFee: Number(formData.tuitionFee),
        status: formData.status,
        progress: newProgress
    });

    alert("Cập nhật thông tin lớp học thành công!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111318]/60 p-4 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white dark:bg-[#1a202c] w-full max-w-[700px] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a202c]">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Chỉnh sửa Lớp học</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Tên lớp học <span className="text-red-500">*</span></label>
                <input 
                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm py-2 px-3 focus:ring-primary focus:border-primary dark:text-white"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Giáo viên phụ trách</label>
                <input 
                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm py-2 px-3 focus:ring-primary focus:border-primary dark:text-white"
                    value={formData.teacher}
                    onChange={(e) => setFormData({...formData, teacher: e.target.value})}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Sĩ số tối đa</label>
                <input 
                    type="number"
                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm py-2 px-3 focus:ring-primary focus:border-primary dark:text-white"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({...formData, maxStudents: Number(e.target.value)})}
                />
            </div>

            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">
                    {classData.mode === 'online' ? 'Link học (Online)' : 'Phòng học / Địa điểm'}
                </label>
                <input 
                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm py-2 px-3 focus:ring-primary focus:border-primary dark:text-white"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Ngày khai giảng</label>
                <input 
                    type="date"
                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm py-2 px-3 focus:ring-primary focus:border-primary dark:text-white"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Ngày kết thúc (Dự kiến)</label>
                <input 
                    type="date"
                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm py-2 px-3 focus:ring-primary focus:border-primary dark:text-white"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Lịch học</label>
                <input 
                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm py-2 px-3 focus:ring-primary focus:border-primary dark:text-white"
                    value={formData.schedule}
                    onChange={(e) => setFormData({...formData, schedule: e.target.value})}
                    placeholder="T2 / T4 / T6 • 18:00"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Trạng thái</label>
                <select 
                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm py-2 px-3 focus:ring-primary focus:border-primary dark:text-white"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                >
                    <option value="active">Đang hoạt động</option>
                    <option value="upcoming">Sắp khai giảng</option>
                    <option value="full">Đã đầy</option>
                </select>
            </div>

          </div>

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
            >
                Hủy bỏ
            </button>
            <button 
                type="submit"
                className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-bold shadow-sm transition-all"
            >
                Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClassModal;
