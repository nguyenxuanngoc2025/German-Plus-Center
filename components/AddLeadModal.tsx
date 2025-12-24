
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Lead } from '../types';

interface AddLeadModalProps {
  onClose: () => void;
}

const AddLeadModal: React.FC<AddLeadModalProps> = ({ onClose }) => {
  const { addLead } = useData();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: '',
    note: '',
    learningMode: 'offline' as Lead['learningMode']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.source) {
      alert("Vui lòng điền các trường bắt buộc!");
      return;
    }

    addLead({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      source: formData.source,
      note: formData.note,
      tags: ['Mới'],
      learningMode: formData.learningMode
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111318]/60 p-4 backdrop-blur-sm transition-opacity duration-300">
      <div className="relative w-full max-w-[800px] flex flex-col bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-auto animate-in fade-in zoom-in duration-200 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-[#1e293b] shrink-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">Thêm Lead Mới</h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-300 text-xs font-medium">German Plus</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal pt-1">Nhập thông tin khách hàng tiềm năng vào hệ thống.</p>
          </div>
          <button onClick={onClose} className="group p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 group-hover:text-red-500 dark:group-hover:text-red-400">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-5">
              <h4 className="text-slate-900 dark:text-white text-base font-semibold border-l-4 border-secondary pl-3">Thông tin cá nhân</h4>
              <div className="w-full">
                <label className="flex flex-col w-full">
                  <span className="text-slate-900 dark:text-slate-200 text-sm font-medium leading-normal pb-2">Họ và tên <span className="text-red-500">*</span></span>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">person</span>
                    <input 
                        className="flex w-full min-w-0 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-primary dark:focus:border-primary h-12 placeholder:text-slate-400 pl-11 pr-4 text-sm font-normal leading-normal transition-all" 
                        placeholder="Nhập họ tên đầy đủ" 
                        required 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </label>
              </div>
              <div className="flex flex-col md:flex-row gap-5">
                <label className="flex flex-col flex-1">
                  <span className="text-slate-900 dark:text-slate-200 text-sm font-medium leading-normal pb-2">Email</span>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">mail</span>
                    <input 
                        className="flex w-full min-w-0 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-primary dark:focus:border-primary h-12 placeholder:text-slate-400 pl-11 pr-4 text-sm font-normal leading-normal transition-all" 
                        placeholder="vidu@email.com" 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </label>
                <label className="flex flex-col flex-1">
                  <span className="text-slate-900 dark:text-slate-200 text-sm font-medium leading-normal pb-2">Số điện thoại <span className="text-red-500">*</span></span>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">phone</span>
                    <input 
                        className="flex w-full min-w-0 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-primary dark:focus:border-primary h-12 placeholder:text-slate-400 pl-11 pr-4 text-sm font-normal leading-normal transition-all" 
                        placeholder="0912345678" 
                        required 
                        type="tel" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </label>
              </div>
            </div>
            
            <div className="w-full h-px bg-slate-100 dark:bg-slate-700 my-2"></div>
            
            <div className="flex flex-col gap-5">
              <h4 className="text-slate-900 dark:text-white text-base font-semibold border-l-4 border-secondary pl-3">Thông tin Lead</h4>
              
              {/* Learning Mode Selection */}
              <div className="w-full">
                  <label className="text-slate-900 dark:text-slate-200 text-sm font-medium leading-normal pb-2 block">Hình thức học <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-4">
                      <label className={`cursor-pointer rounded-lg border-2 p-3 flex items-center gap-3 transition-all ${formData.learningMode === 'offline' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'}`}>
                          <input 
                              type="radio" 
                              name="learningMode" 
                              value="offline"
                              className="sr-only"
                              checked={formData.learningMode === 'offline'}
                              onChange={() => setFormData({...formData, learningMode: 'offline'})}
                          />
                          <div className={`size-5 rounded-full border-2 flex items-center justify-center ${formData.learningMode === 'offline' ? 'border-primary' : 'border-slate-400'}`}>
                              {formData.learningMode === 'offline' && <div className="size-2.5 rounded-full bg-primary"></div>}
                          </div>
                          <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">Offline - Tại trung tâm</span>
                              <span className="text-xs text-slate-500">Học trực tiếp tại cơ sở</span>
                          </div>
                          <span className="material-symbols-outlined text-slate-400 ml-auto">apartment</span>
                      </label>

                      <label className={`cursor-pointer rounded-lg border-2 p-3 flex items-center gap-3 transition-all ${formData.learningMode === 'online' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'}`}>
                          <input 
                              type="radio" 
                              name="learningMode" 
                              value="online"
                              className="sr-only"
                              checked={formData.learningMode === 'online'}
                              onChange={() => setFormData({...formData, learningMode: 'online'})}
                          />
                          <div className={`size-5 rounded-full border-2 flex items-center justify-center ${formData.learningMode === 'online' ? 'border-primary' : 'border-slate-400'}`}>
                              {formData.learningMode === 'online' && <div className="size-2.5 rounded-full bg-primary"></div>}
                          </div>
                          <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">Online - Trực tuyến</span>
                              <span className="text-xs text-slate-500">Học qua Zoom/Meet</span>
                          </div>
                          <span className="material-symbols-outlined text-slate-400 ml-auto">language</span>
                      </label>
                  </div>
              </div>

              <div className="flex flex-col md:flex-row gap-5 w-full">
                <label className="flex flex-col flex-1">
                  <span className="text-slate-900 dark:text-slate-200 text-sm font-medium leading-normal pb-2">Nguồn Lead <span className="text-red-500">*</span></span>
                  <div className="relative">
                    <select 
                        className="flex w-full min-w-0 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-primary dark:focus:border-primary h-12 placeholder:text-slate-400 pl-4 pr-10 text-sm font-normal leading-normal transition-all appearance-none cursor-pointer"
                        value={formData.source}
                        onChange={(e) => setFormData({...formData, source: e.target.value})}
                    >
                      <option disabled selected value="">Chọn nguồn tiếp cận</option>
                      <option value="Facebook Ads">Facebook Ads</option>
                      <option value="Website">Website German Plus</option>
                      <option value="Giới thiệu">Giới thiệu (Referral)</option>
                      <option value="Sự kiện">Sự kiện Offline</option>
                      <option value="Khác">Khác</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none text-[20px]">expand_more</span>
                  </div>
                </label>
                <label className="flex flex-col flex-1">
                  <span className="text-slate-900 dark:text-slate-200 text-sm font-medium leading-normal pb-2">Người phụ trách</span>
                  <div className="relative">
                    <select className="flex w-full min-w-0 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-primary dark:focus:border-primary h-12 placeholder:text-slate-400 pl-4 pr-10 text-sm font-normal leading-normal transition-all appearance-none cursor-pointer">
                      <option disabled selected value="">Chọn nhân viên</option>
                      <option value="nv001">Nguyễn Thu Hà - Senior Sales</option>
                      <option value="nv002">Trần Văn Nam - Tư vấn viên</option>
                      <option value="nv003">Lê Thị Minh - CSKH</option>
                      <option value="admin">Quản trị viên (Admin)</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none text-[20px]">expand_more</span>
                  </div>
                </label>
              </div>
              <div className="w-full">
                <label className="flex flex-col w-full">
                  <span className="text-slate-900 dark:text-slate-200 text-sm font-medium leading-normal pb-2">Ghi chú ban đầu</span>
                  <textarea 
                    className="flex w-full min-w-0 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-primary dark:focus:border-primary h-32 placeholder:text-slate-400 p-4 text-sm font-normal leading-normal transition-all" 
                    placeholder="Ghi chú về nhu cầu học, trình độ hiện tại, thời gian rảnh..."
                    value={formData.note}
                    onChange={(e) => setFormData({...formData, note: e.target.value})}
                  ></textarea>
                </label>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700 mt-auto">
                <button type="button" onClick={onClose} className="flex items-center justify-center px-5 h-10 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-2 focus:ring-slate-200 transition-all">
                    Hủy bỏ
                </button>
                <button type="submit" className="flex items-center justify-center gap-2 px-5 h-10 rounded-lg bg-primary hover:bg-primary-dark active:bg-primary-active active:shadow-inner text-white text-sm font-medium shadow-sm hover:shadow-md focus:ring-2 focus:ring-primary/40 focus:ring-offset-1 transition-all">
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    Lưu thông tin
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddLeadModal;
