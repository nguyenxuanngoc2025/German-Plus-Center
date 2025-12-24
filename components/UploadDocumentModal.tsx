
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Document } from '../types';

interface Props {
  onClose: () => void;
}

const UploadDocumentModal: React.FC<Props> = ({ onClose }) => {
  const { addDocument, classes } = useData();
  const [formData, setFormData] = useState({
    name: '',
    type: 'pdf' as Document['type'],
    target: 'public', // 'public', 'teachers', or classId
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert("Vui lòng nhập tên tài liệu");
      return;
    }

    let targetName = 'Công khai';
    if (formData.target === 'teachers') targetName = 'Giáo viên';
    else if (formData.target !== 'public') {
      const cls = classes.find(c => c.id === formData.target);
      targetName = cls ? cls.name : 'Khác';
    }

    addDocument({
      name: formData.name,
      type: formData.type,
      target: formData.target,
      targetName: targetName
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111318]/60 p-4 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white dark:bg-[#1a202c] w-full max-w-[600px] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a202c]">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tải lên Tài liệu mới</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          
          {/* File Drop Area */}
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl text-primary">cloud_upload</span>
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Nhấn để tải lên hoặc kéo thả vào đây</p>
            <p className="text-xs text-slate-500 mt-1">PDF, DOCX, XLSX, MP3, MP4 (Max 50MB)</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Tên tài liệu <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary dark:text-white"
                placeholder="Nhập tên tài liệu..."
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Loại file</label>
                    <select 
                        className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary dark:text-white"
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value as Document['type']})}
                    >
                        <option value="pdf">PDF (Tài liệu)</option>
                        <option value="docx">DOCX (Word)</option>
                        <option value="xlsx">XLSX (Excel)</option>
                        <option value="audio">Audio (MP3)</option>
                        <option value="video">Video (MP4)</option>
                        <option value="other">Khác</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Phân quyền / Chia sẻ</label>
                    <select 
                        className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary dark:text-white"
                        value={formData.target}
                        onChange={(e) => setFormData({...formData, target: e.target.value})}
                    >
                        <option value="public">Công khai (Tất cả)</option>
                        <option value="teachers">Chỉ Giáo viên</option>
                        <optgroup label="Lớp học cụ thể">
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </optgroup>
                    </select>
                </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
            >
                Hủy bỏ
            </button>
            <button 
                type="submit"
                className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-medium shadow-sm transition-all"
            >
                Tải lên
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadDocumentModal;
