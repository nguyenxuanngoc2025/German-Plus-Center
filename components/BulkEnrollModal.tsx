
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Lead } from '../types';

interface Props {
  leads: Lead[];
  onClose: () => void;
  onConfirm: () => void;
}

const BulkEnrollModal: React.FC<Props> = ({ leads, onClose, onConfirm }) => {
  const { classes, convertLeadToStudent } = useData();
  const [selectedClassId, setSelectedClassId] = useState('');
  
  // Filter active classes
  const activeClasses = classes.filter(c => c.status !== 'full');
  const selectedClass = classes.find(c => c.id === selectedClassId);

  const handleEnroll = () => {
    if (!selectedClassId) {
        alert("Vui lòng chọn lớp học!");
        return;
    }

    if (!window.confirm(`Xác nhận xếp ${leads.length} học viên vào lớp ${selectedClass?.name}? \n\nPhiếu thu sẽ được tạo tự động với mức học phí: ${selectedClass?.tuitionFee.toLocaleString()}đ`)) {
        return;
    }

    // Process each lead
    leads.forEach(lead => {
        convertLeadToStudent(lead.id, selectedClassId, selectedClass ? selectedClass.tuitionFee : 0, {
            method: 'full', // Default to full payment for bulk actions or modify to support deposit
            deposit: selectedClass ? selectedClass.tuitionFee : 0,
            installments: []
        });
    });

    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111318]/60 p-4 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white dark:bg-[#1a202c] w-full max-w-[600px] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">school</span>
                Xếp lớp hàng loạt
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <span className="material-symbols-outlined">close</span>
            </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Danh sách Lead được chọn ({leads.length})</label>
                <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 custom-scrollbar">
                    {leads.map(lead => (
                        <span key={lead.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm">
                            <span className="material-symbols-outlined text-[14px] text-primary">person</span>
                            {lead.name}
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Chọn Lớp học mục tiêu</label>
                <div className="relative">
                    <select 
                        className="w-full h-12 pl-4 pr-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                    >
                        <option value="">-- Chọn lớp học --</option>
                        {activeClasses.map(cls => (
                            <option key={cls.id} value={cls.id}>
                                {cls.name} ({cls.schedule}) - Còn {cls.maxStudents - cls.students} chỗ
                            </option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
                {selectedClass && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg flex justify-between items-center">
                        <span className="text-sm text-blue-800 dark:text-blue-300">Học phí:</span>
                        <span className="text-base font-bold text-blue-700 dark:text-blue-200">{selectedClass.tuitionFee.toLocaleString('vi-VN')} đ</span>
                    </div>
                )}
            </div>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-white dark:hover:bg-slate-700 transition-colors">
                Hủy bỏ
            </button>
            <button onClick={handleEnroll} className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-md shadow-primary/20 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">check</span>
                Xác nhận Xếp lớp
            </button>
        </div>
      </div>
    </div>
  );
};

export default BulkEnrollModal;
