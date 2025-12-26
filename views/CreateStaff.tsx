
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { Staff } from '../types';
import { useFormPersistence } from '../hooks/useFormPersistence';

interface PermissionRow {
  id: string;
  module: string;
  description: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  other: boolean;
  otherLabel?: string;
  hasAdd?: boolean;
  hasEdit?: boolean;
  hasDelete?: boolean;
  hasOther?: boolean;
}

const CreateStaff: React.FC = () => {
  const navigate = useNavigate();
  const { addStaff } = useData();
  
  // Form State with Persistence
  const [formData, setFormData, clearDraft] = useFormPersistence('draft_staff_form', {
      name: '',
      email: '',
      phone: '',
      role: 'teacher' as Staff['role'],
      address: '',
      dob: ''
  });

  const [permissions, setPermissions] = useState<PermissionRow[]>([
    { 
      id: 'dashboard', module: 'Dashboard', description: 'Tổng quan hệ thống', icon: 'dashboard', iconColor: 'text-primary', iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      view: true, add: false, edit: false, delete: false, other: false, otherLabel: 'Xuất báo cáo',
      hasAdd: false, hasEdit: false, hasDelete: false, hasOther: true 
    },
    { 
      id: 'crm', module: 'CRM (Khách hàng)', description: 'Quản lý Leads & CSKH', icon: 'groups', iconColor: 'text-secondary', iconBg: 'bg-orange-50 dark:bg-orange-900/20',
      view: true, add: true, edit: true, delete: false, other: false, otherLabel: 'Import',
      hasAdd: true, hasEdit: true, hasDelete: true, hasOther: true 
    },
    { 
      id: 'students', module: 'Học viên', description: 'Danh sách & Hồ sơ', icon: 'school', iconColor: 'text-green-600', iconBg: 'bg-green-50 dark:bg-green-900/20',
      view: true, add: false, edit: false, delete: false, other: false,
      hasAdd: true, hasEdit: true, hasDelete: true, hasOther: false 
    },
    { 
      id: 'finance', module: 'Tài chính', description: 'Thu chi & Công nợ', icon: 'payments', iconColor: 'text-purple-600', iconBg: 'bg-purple-50 dark:bg-purple-900/20',
      view: false, add: false, edit: false, delete: false, other: false, otherLabel: 'Duyệt chi',
      hasAdd: true, hasEdit: true, hasDelete: true, hasOther: true 
    },
    { 
      id: 'settings', module: 'Cài đặt hệ thống', description: 'Cấu hình chung', icon: 'settings', iconColor: 'text-slate-600 dark:text-slate-300', iconBg: 'bg-gray-100 dark:bg-gray-700',
      view: false, add: false, edit: false, delete: false, other: false,
      hasAdd: true, hasEdit: false, hasDelete: false, hasOther: false 
    },
  ]);

  const handlePermissionChange = (id: string, field: keyof PermissionRow, value: boolean) => {
    setPermissions(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSave = () => {
      if(!formData.name || !formData.email || !formData.role) {
          alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
          return;
      }

      addStaff({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role
      });

      alert("Đã thêm nhân viên thành công!");
      clearDraft();
      navigate('/staff');
  };

  const applyQuickSettings = (type: 'read_only' | 'staff' | 'full') => {
    let newPermissions = [...permissions];
    switch (type) {
      case 'read_only':
        newPermissions = newPermissions.map(p => ({
          ...p,
          view: true, add: false, edit: false, delete: false, other: false
        }));
        break;
      case 'staff':
        newPermissions = newPermissions.map(p => {
          if (p.id === 'settings') return { ...p, view: false, add: false, edit: false, delete: false, other: false };
          if (p.id === 'finance') return { ...p, view: true, add: true, edit: false, delete: false, other: false };
          return { ...p, view: true, add: true, edit: true, delete: false, other: false };
        });
        break;
      case 'full':
        newPermissions = newPermissions.map(p => ({
          ...p,
          view: true, 
          add: p.hasAdd ? true : false, 
          edit: p.hasEdit ? true : false, 
          delete: p.hasDelete ? true : false, 
          other: p.hasOther ? true : false
        }));
        break;
    }
    setPermissions(newPermissions);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-background-light dark:bg-background-dark">
      <Header title="Thêm Nhân viên" />
      
      <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Thêm Nhân viên mới</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Nhập thông tin cá nhân và thiết lập quyền truy cập hệ thống.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => { clearDraft(); navigate('/staff'); }}
                        className="px-4 py-2 bg-white dark:bg-[#1a202c] border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Hủy
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">save</span>
                        Lưu & Phân quyền
                    </button>
                </div>
            </div>

            {/* Section 1: Basic Info */}
            <div className="bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Thông tin cơ bản</h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Avatar Upload Placeholder */}
                        <div className="md:col-span-2 flex items-center gap-6 mb-2">
                            <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:border-primary hover:text-primary transition-colors cursor-pointer group">
                                <span className="material-symbols-outlined text-[32px] group-hover:scale-110 transition-transform">add_a_photo</span>
                            </div>
                            <div>
                                <button className="text-sm font-medium text-primary hover:underline">Tải ảnh lên</button>
                                <p className="text-xs text-slate-500 mt-1">JPG, PNG hoặc GIF. Tối đa 2MB.</p>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Họ và tên <span className="text-red-500">*</span></label>
                            <input 
                                className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary py-2.5 px-3" 
                                placeholder="Nhập tên nhân viên" 
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email (Tên đăng nhập) <span className="text-red-500">*</span></label>
                            <input 
                                className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary py-2.5 px-3" 
                                placeholder="example@germanplus.com" 
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Số điện thoại</label>
                            <input 
                                className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary py-2.5 px-3" 
                                placeholder="0912 xxx xxx" 
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ngày sinh</label>
                            <input 
                                className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary py-2.5 px-3" 
                                type="date"
                                value={formData.dob}
                                onChange={(e) => setFormData({...formData, dob: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Vai trò <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select 
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary py-2.5 px-3 appearance-none cursor-pointer"
                                    value={formData.role}
                                    onChange={(e) => setFormData({...formData, role: e.target.value as Staff['role']})}
                                >
                                    <option value="teacher">Giáo viên</option>
                                    <option value="manager">Quản lý (Manager)</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                    <span className="material-symbols-outlined">expand_more</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Địa chỉ</label>
                            <input 
                                className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary py-2.5 px-3" 
                                placeholder="Địa chỉ liên hệ" 
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Password Notice */}
                    <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded-lg p-4 flex gap-3">
                        <span className="material-symbols-outlined text-primary text-[24px]">info</span>
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                            <p className="font-semibold mb-1">Thiết lập mật khẩu</p>
                            <p>Mật khẩu mặc định sẽ là <span className="font-mono bg-blue-100 dark:bg-blue-800 px-1.5 py-0.5 rounded text-blue-900 dark:text-white font-bold">123456</span>. Hệ thống sẽ yêu cầu nhân viên đổi mật khẩu ngay trong lần đăng nhập đầu tiên để đảm bảo bảo mật.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 2: Permissions */}
            <div className="bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[20px]">lock_person</span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Phân quyền chi tiết</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 uppercase font-semibold">Cài đặt nhanh:</span>
                        <button onClick={() => applyQuickSettings('read_only')} className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 rounded transition-colors" type="button">Chỉ xem</button>
                        <button onClick={() => applyQuickSettings('staff')} className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 rounded transition-colors" type="button">Nhân viên</button>
                        <button onClick={() => applyQuickSettings('full')} className="text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-primary dark:text-blue-300 font-medium px-2.5 py-1.5 rounded transition-colors" type="button">Toàn quyền</button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">
                                <th className="px-6 py-3 w-1/3 min-w-[220px]">Module</th>
                                <th className="px-4 py-3 text-center w-24">Xem</th>
                                <th className="px-4 py-3 text-center w-24">Thêm</th>
                                <th className="px-4 py-3 text-center w-24">Sửa</th>
                                <th className="px-4 py-3 text-center w-24">Xóa</th>
                                <th className="px-4 py-3 text-center w-32">Chức năng khác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {permissions.map((perm) => (
                                <tr key={perm.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${perm.iconBg} ${perm.iconColor}`}>
                                                <span className="material-symbols-outlined text-lg">{perm.icon}</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-slate-900 dark:text-white">{perm.module}</p>
                                                <p className="text-xs text-slate-500">{perm.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={perm.view} 
                                            onChange={(e) => handlePermissionChange(perm.id, 'view', e.target.checked)}
                                            className="rounded border-slate-300 text-primary focus:ring-primary h-5 w-5 cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        {perm.hasAdd ? (
                                            <input 
                                                type="checkbox" 
                                                checked={perm.add} 
                                                onChange={(e) => handlePermissionChange(perm.id, 'add', e.target.checked)}
                                                className="rounded border-slate-300 text-primary focus:ring-primary h-5 w-5 cursor-pointer"
                                            />
                                        ) : <span className="text-slate-300 dark:text-slate-600">-</span>}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        {perm.hasEdit ? (
                                            <input 
                                                type="checkbox" 
                                                checked={perm.edit} 
                                                onChange={(e) => handlePermissionChange(perm.id, 'edit', e.target.checked)}
                                                className="rounded border-slate-300 text-primary focus:ring-primary h-5 w-5 cursor-pointer"
                                            />
                                        ) : <span className="text-slate-300 dark:text-slate-600">-</span>}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        {perm.hasDelete ? (
                                            <input 
                                                type="checkbox" 
                                                checked={perm.delete} 
                                                onChange={(e) => handlePermissionChange(perm.id, 'delete', e.target.checked)}
                                                className="rounded border-slate-300 text-red-500 focus:ring-red-500 h-5 w-5 cursor-pointer"
                                            />
                                        ) : <span className="text-slate-300 dark:text-slate-600">-</span>}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        {perm.hasOther && perm.otherLabel ? (
                                            <label className="inline-flex items-center gap-2 cursor-pointer group justify-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={perm.other} 
                                                    onChange={(e) => handlePermissionChange(perm.id, 'other', e.target.checked)}
                                                    className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                                                />
                                                <span className="text-xs text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300">{perm.otherLabel}</span>
                                            </label>
                                        ) : <span className="text-slate-300 dark:text-slate-600">-</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 md:hidden">
                <button 
                    onClick={() => { clearDraft(); navigate('/staff'); }}
                    className="w-full px-4 py-3 bg-white dark:bg-[#1a202c] border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                    Hủy
                </button>
                <button onClick={handleSave} className="w-full px-4 py-3 bg-primary text-white rounded-lg text-sm font-bold shadow-md">
                    Lưu Nhân viên
                </button>
            </div>

        </div>
      </main>
    </div>
  );
};

export default CreateStaff;
