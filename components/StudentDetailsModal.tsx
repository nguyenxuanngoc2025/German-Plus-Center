
import React, { useState, useEffect } from 'react';
import { Student, Lead } from '../types';
import Avatar from './Avatar';

interface Props {
  data: Student | Lead;
  onClose: () => void;
  onSave?: (data: any) => void;
  onDelete?: () => void;
}

const StudentDetailsModal: React.FC<Props> = ({ data, onClose, onSave, onDelete }) => {
  // Determine if it's a full student or a lead based on a specific field (e.g., 'code')
  const isStudent = (item: any): item is Student => {
    return 'code' in item;
  };

  const [formData, setFormData] = useState({
    name: data.name,
    email: data.email || '',
    phone: data.phone || '',
    zalo: data.phone || '', // Defaulting Zalo to phone for demo
    address: 'Số 18, Ngõ 12, Phố Duy Tân, Cầu Giấy, Hà Nội', // Mock default
    dob: '12/05/2000', // Mock default
    location: 'Hà Nội',
    status: data.status,
    class: isStudent(data) ? (data.currentClass || '') : '',
    level: 'A1 (Sơ cấp)',
    goal: 'B1 (Trung cấp)',
    consultant: 'Trần Thị B',
    note: isStudent(data) ? '' : (data as Lead).note || ''
  });

  // Portal Account State
  const [showPassword, setShowPassword] = useState(false);
  const [portalPassword, setPortalPassword] = useState('123456'); // Default password

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const cleanPhone = formData.phone.replace(/\D/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Modal Content - Adaptive: Fullscreen on mobile, Rounded Card on Desktop */}
      <div className="relative bg-white dark:bg-[#1a2230] w-full sm:max-w-6xl h-full sm:h-auto sm:max-h-[92vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden transform transition-all animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 fade-in duration-300 border-t sm:border border-gray-100/20">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2230] shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-none">
                {isStudent(data) ? 'Chi tiết Học viên' : 'Chi tiết Lead (Tiềm năng)'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                    {isStudent(data) ? data.code : `LEAD-${data.id}`}
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                    data.status === 'active' || data.status === 'ready' ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:border-green-800' : 
                    data.status === 'new' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800' :
                    'bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                }`}>
                  {data.status === 'active' ? 'Đang học' : 
                   data.status === 'new' ? 'Mới' : 
                   data.status === 'consulting' ? 'Đang tư vấn' : 
                   data.status === 'ready' ? 'Sẵn sàng' : data.status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isStudent(data) && (
                <a className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors border border-primary/20" href="#">
                <span className="material-symbols-outlined text-[16px]">captive_portal</span>
                    Portal Học viên
                </a>
            )}
            <button 
                onClick={onClose} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-[#101622] p-4 sm:p-6 md:p-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Profile Header Card */}
              <div className="bg-white dark:bg-[#1a2230] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 dark:bg-primary/10 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="relative group shrink-0 mx-auto sm:mx-0">
                    <Avatar src={data.avatar} name={data.name} className="size-24 border-4 border-white dark:border-gray-700 shadow-md text-3xl" />
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-primary shadow-sm transition-colors">
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{formData.name}</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center sm:justify-start gap-2">
                      <span className="material-symbols-outlined text-[18px]">cake</span> {formData.dob}
                      <span className="text-gray-300 dark:text-gray-600">|</span>
                      <span className="material-symbols-outlined text-[18px]">location_on</span> {formData.location}
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-3">
                      <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-dark active:bg-primary-active active:shadow-inner shadow-sm shadow-primary/30 transition-all">
                        <span className="material-symbols-outlined text-[20px]">edit_square</span>
                        Chỉnh sửa hồ sơ
                      </button>
                      <a 
                        href={`tel:${cleanPhone}`}
                        title={`Gọi cho ${formData.name}`}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">call</span>
                        Gọi điện
                      </a>
                      {/* Zalo Button */}
                      <a 
                        href={`https://zalo.me/${cleanPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        title={`Chat Zalo với ${formData.name}`}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                      >
                        <span className="font-bold text-[14px]">Zalo</span>
                        Chat Zalo
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <div className="bg-white dark:bg-[#1a2230] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="material-symbols-outlined text-primary">badge</span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Thông tin cá nhân</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Họ và tên</label>
                    <input className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white text-sm focus:border-primary focus:ring-primary shadow-sm h-10 px-3" type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Email</label>
                    <input className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white text-sm focus:border-primary focus:ring-primary shadow-sm h-10 px-3" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Số điện thoại</label>
                    <input className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white text-sm focus:border-primary focus:ring-primary shadow-sm h-10 px-3" type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Zalo</label>
                    <input className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white text-sm focus:border-primary focus:ring-primary shadow-sm h-10 px-3" type="tel" value={formData.zalo} onChange={(e) => setFormData({...formData, zalo: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Địa chỉ</label>
                    <input className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white text-sm focus:border-primary focus:ring-primary shadow-sm h-10 px-3" type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Portal Account (New Section for Admin) */}
              {isStudent(data) && (
              <div className="bg-white dark:bg-[#1a2230] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-600">lock_person</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Tài khoản Portal</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400 text-xs font-medium">Quyền Admin</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Tên đăng nhập</label>
                    <div className="relative">
                        <input 
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-slate-50 dark:bg-gray-900/50 text-slate-500 dark:text-slate-400 text-sm focus:ring-0 cursor-not-allowed h-10 px-3" 
                            type="text" 
                            value={formData.phone} // Username defaults to Phone Number
                            readOnly
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 text-xs font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            Active
                        </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Mật khẩu</label>
                    <div className="relative">
                        <input 
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white text-sm focus:border-primary focus:ring-primary shadow-sm pr-10 h-10 px-3" 
                            type={showPassword ? "text" : "password"} 
                            value={portalPassword}
                            onChange={(e) => setPortalPassword(e.target.value)}
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {showPassword ? 'visibility_off' : 'visibility'}
                            </span>
                        </button>
                    </div>
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                     <button 
                        onClick={() => alert(`Đã cập nhật mật khẩu cho ${data.code}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-sm font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                     >
                        <span className="material-symbols-outlined text-[18px]">key</span>
                        Cập nhật mật khẩu
                     </button>
                  </div>
                </div>
              </div>
              )}

              {/* Study Info */}
              <div className="bg-white dark:bg-[#1a2230] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="material-symbols-outlined text-primary">school</span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Thông tin học tập</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Lớp đang học</label>
                    <div className="relative">
                      <select className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white text-sm focus:border-primary focus:ring-primary shadow-sm appearance-none pr-8 h-10 px-3" value={formData.class} onChange={(e) => setFormData({...formData, class: e.target.value})}>
                        <option value="">Chưa xếp lớp</option>
                        <option value="A1.1 Cấp tốc - Online">A1.1 Cấp tốc - Online</option>
                        <option value="A1.1 - Cấp tốc K42">A1.1 - Cấp tốc K42</option>
                        <option value="A1.2 - Cấp tốc K43">A1.2 - Cấp tốc K43</option>
                        <option value="B1 Ôn thi - Offline">B1 Ôn thi - Offline</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">expand_more</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Trình độ hiện tại</label>
                    <select className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white text-sm focus:border-primary focus:ring-primary shadow-sm h-10 px-3" value={formData.level} onChange={(e) => setFormData({...formData, level: e.target.value})}>
                      <option>A0 (Chưa biết gì)</option>
                      <option>A1 (Sơ cấp)</option>
                      <option>A2 (Sơ cấp nâng cao)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Mục tiêu đầu ra</label>
                    <select className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white text-sm focus:border-primary focus:ring-primary shadow-sm h-10 px-3" value={formData.goal} onChange={(e) => setFormData({...formData, goal: e.target.value})}>
                      <option>B1 (Trung cấp)</option>
                      <option>B2 (Trung cấp nâng cao)</option>
                      <option>C1 (Cao cấp)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Người tư vấn</label>
                    <div className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 h-10">
                      <div className="w-6 h-6 rounded-full bg-gray-300 bg-cover" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDnP8L8dhkjlaUCYv5kzPRDfFbnnQyyttN_dDhqd9XQJBZCyCc6RBeB21DMp94z2sjWVeE9WMJA4IkaRMv7dhMh8YawBXWXh7IztF6DBPNnoAgsgepcGfz8lZfPInf-Ht2YyyvEMSDPrP0V6nbRz1j7u6iqlJaBvVNy_3fDKbMs1H3B95eofwZ0BZOcv-NjWvwWDvQZYMxD3jkswZ5xMwaUgyu2N3PLGpvI03ltj-ekYokn6nWchBQmz0-4Lb6bBJWOFMHxt8OTQNFi')"}}></div>
                      <span className="text-sm text-slate-900 dark:text-white font-medium">{formData.consultant}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Schedule (Only for Students or if class assigned) */}
              {(isStudent(data) || formData.class) && (
              <div className="bg-white dark:bg-[#1a2230] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center justify-between">
                    Lịch học tuần này
                    <span className="text-xs font-normal text-primary cursor-pointer hover:underline">Chi tiết</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-3 items-start">
                    <div className="flex flex-col items-center w-10 shrink-0">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Thứ 2</span>
                      <span className="text-lg font-bold text-slate-900 dark:text-white">13</span>
                    </div>
                    <div className="flex-1 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 p-2 rounded-lg">
                      <div className="text-xs font-bold text-green-800 dark:text-green-300">{formData.class || 'Lớp chưa xếp'}</div>
                      <div className="text-[10px] text-green-600 dark:text-green-400 mt-0.5">18:30 - 20:30 • Phòng 201</div>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="flex flex-col items-center w-10 shrink-0">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Thứ 4</span>
                      <span className="text-lg font-bold text-slate-900 dark:text-white">15</span>
                    </div>
                    <div className="flex-1 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 p-2 rounded-lg">
                      <div className="text-xs font-bold text-blue-800 dark:text-blue-300">{formData.class || 'Lớp chưa xếp'}</div>
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">18:30 - 20:30 • Phòng 201</div>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* Tuition (Only for Students) */}
              {isStudent(data) && (
              <div className="bg-white dark:bg-[#1a2230] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-500">payments</span>
                  Trạng thái học phí
                </h3>
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-500 dark:text-slate-400">Đã đóng</span>
                      <span className="font-bold text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.paid || 0)}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${((data.paid || 0) / ((data.paid || 0) + (data.balance || 0))) * 100}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs mt-1.5">
                      <span className="text-slate-500 dark:text-slate-400">Tổng: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((data.paid || 0) + (data.balance || 0))}</span>
                      <span className="text-orange-600 dark:text-orange-400 font-medium">Còn lại: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.balance || 0)}</span>
                    </div>
                  </div>
                  {(data.balance || 0) > 0 && (
                  <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg p-3 border border-orange-100 dark:border-orange-800 flex items-start gap-3">
                    <span className="material-symbols-outlined text-orange-500 text-[20px] shrink-0">calendar_clock</span>
                    <div>
                      <p className="text-xs font-bold text-orange-900 dark:text-orange-200">Lịch thu tiếp theo</p>
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-0.5">Ngày 20/05/2024</p>
                      <p className="text-xs text-orange-700 dark:text-orange-300 font-medium">Số tiền: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.min((data.balance || 0), 2500000))}</p>
                    </div>
                  </div>
                  )}
                </div>
              </div>
              )}

              {/* Notes & History */}
              <div className="bg-white dark:bg-[#1a2230] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 flex-1 flex flex-col">
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide flex justify-between items-center">
                    Ghi chú nội bộ
                    <span className="text-[10px] font-normal text-primary cursor-pointer hover:underline">Xem lịch sử</span>
                  </label>
                  <textarea 
                    className="w-full text-sm border-gray-200 dark:border-gray-600 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary p-3 min-h-[100px] resize-none bg-gray-50 dark:bg-gray-800 text-slate-900 dark:text-white" 
                    placeholder="Nhập ghi chú mới về học viên..."
                    value={formData.note}
                    onChange={(e) => setFormData({...formData, note: e.target.value})}
                  ></textarea>
                  <div className="flex justify-end mt-2">
                    <button className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-slate-900 dark:text-white text-xs font-bold rounded-md transition-colors">
                      Lưu ghi chú
                    </button>
                  </div>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-auto">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase">Lịch sử gần đây</h4>
                  <div className="space-y-4 pl-2 border-l border-gray-200 dark:border-gray-700 ml-1">
                    <div className="relative pl-4">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-500 border border-white dark:border-[#1a2230]"></div>
                      <p className="text-xs text-slate-900 dark:text-white font-medium">Gọi điện tư vấn</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Hôm nay, 09:30 • Bởi Trần Thị B</p>
                    </div>
                    <div className="relative pl-4">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-green-500 border border-white dark:border-[#1a2230]"></div>
                      <p className="text-xs text-slate-900 dark:text-white font-medium">Đóng học phí (Đợt 1)</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">10/05/2024 • Kế toán</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2230] flex justify-between items-center shrink-0 safe-area-pb">
          <button 
            onClick={onDelete}
            className="text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            <span className="hidden sm:inline">Xóa {isStudent(data) ? 'học viên' : 'lead'}</span>
          </button>
          <div className="flex gap-3">
            <button 
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 font-medium text-sm transition-all"
            >
              Hủy
            </button>
            <button 
                onClick={() => onSave && onSave(formData)}
                className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-dark active:bg-primary-active active:shadow-inner text-white font-bold text-sm shadow-sm shadow-primary/30 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsModal;
