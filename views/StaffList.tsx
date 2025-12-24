
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { Staff } from '../types';
import Avatar from '../components/Avatar';

const StaffList: React.FC = () => {
  const navigate = useNavigate();
  const { staff } = useData(); // Use Global Data
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Staff; direction: 'asc' | 'desc' } | null>(null);

  const filteredStaff = useMemo(() => {
    let data = staff.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.phone.includes(searchTerm);
      const matchesRole = roleFilter ? s.role === roleFilter : true;
      const matchesStatus = statusFilter ? s.status === statusFilter : true;
      return matchesSearch && matchesRole && matchesStatus;
    });

    if (sortConfig !== null) {
      data.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Custom sort for JoinDate which is DD/MM/YYYY
        if (sortConfig.key === 'joinDate') {
             const [dayA, monthA, yearA] = (aValue as string).split('/');
             const [dayB, monthB, yearB] = (bValue as string).split('/');
             aValue = new Date(`${yearA}-${monthA}-${dayA}`).getTime().toString();
             bValue = new Date(`${yearB}-${monthB}-${dayB}`).getTime().toString();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return data;
  }, [staff, searchTerm, roleFilter, statusFilter, sortConfig]);

  const handleSort = (key: keyof Staff) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key: keyof Staff) => {
    if (sortConfig?.key !== key) {
        return <span className="material-symbols-outlined text-[16px] text-gray-300 opacity-0 group-hover:opacity-50">unfold_more</span>;
    }
    return <span className="material-symbols-outlined text-[16px] text-primary">{sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>;
  };

  const getRoleBadge = (role: Staff['role']) => {
    switch (role) {
      case 'admin':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">Admin</span>;
      case 'manager':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">Quản lý</span>;
      case 'teacher':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Giáo viên</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: Staff['status']) => {
    return (
      <div className="flex items-center gap-2">
        <span className={`size-2 rounded-full ${status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
        <span className="text-sm text-slate-700 dark:text-slate-300">{status === 'active' ? 'Hoạt động' : 'Đã khóa'}</span>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-background-light dark:bg-background-dark">
      <Header title="Quản trị Nhân viên" />
      
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-[1200px] flex flex-col gap-6">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Danh sách nhân viên</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm md:text-base">Quản lý thông tin, phân quyền và trạng thái hoạt động của nhân sự.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                        <span className="material-symbols-outlined text-[20px]">download</span>
                        <span className="hidden sm:inline">Xuất dữ liệu</span>
                    </button>
                    <button 
                        onClick={() => navigate('/staff/create')}
                        className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors shadow-sm shadow-primary/30"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        <span>Thêm nhân viên</span>
                    </button>
                </div>
            </div>

            {/* Filters & Search Section */}
            <div className="bg-white dark:bg-[#1a202c] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input 
                            className="w-full h-10 pl-10 pr-4 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:border-primary focus:ring-primary text-slate-900 dark:text-white placeholder:text-slate-400" 
                            placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..." 
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-1 md:pb-0">
                        <select 
                            className="h-10 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a202c] text-slate-700 dark:text-slate-200 text-sm focus:border-primary focus:ring-primary cursor-pointer min-w-[140px]"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="">Tất cả vai trò</option>
                            <option value="teacher">Giáo viên</option>
                            <option value="manager">Quản lý</option>
                            <option value="admin">Admin</option>
                        </select>
                        <select 
                            className="h-10 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a202c] text-slate-700 dark:text-slate-200 text-sm focus:border-primary focus:ring-primary cursor-pointer min-w-[140px]"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="active">Đang hoạt động</option>
                            <option value="locked">Đã khóa</option>
                        </select>
                        <button className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a202c] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400" title="Bộ lọc nâng cao">
                            <span className="material-symbols-outlined text-[20px]">tune</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-[#1a202c] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <th onClick={() => handleSort('name')} className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group select-none">
                                    <div className="flex items-center gap-1">Nhân viên {renderSortIcon('name')}</div>
                                </th>
                                <th onClick={() => handleSort('role')} className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group select-none">
                                    <div className="flex items-center gap-1">Vai trò {renderSortIcon('role')}</div>
                                </th>
                                <th onClick={() => handleSort('phone')} className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group select-none">
                                    <div className="flex items-center gap-1">Số điện thoại {renderSortIcon('phone')}</div>
                                </th>
                                <th onClick={() => handleSort('status')} className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group select-none">
                                    <div className="flex items-center gap-1">Trạng thái {renderSortIcon('status')}</div>
                                </th>
                                <th onClick={() => handleSort('joinDate')} className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group select-none">
                                    <div className="flex items-center gap-1">Ngày tham gia {renderSortIcon('joinDate')}</div>
                                </th>
                                <th className="px-6 py-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredStaff.map((staff) => (
                                <tr key={staff.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group cursor-pointer">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar 
                                                src={staff.avatar} 
                                                name={staff.name} 
                                                className="size-10 shadow-sm border border-slate-200 dark:border-slate-700" 
                                                detail={staff}
                                            />
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{staff.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{staff.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getRoleBadge(staff.role)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{staff.phone}</td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(staff.status)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{staff.joinDate}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors" title="Thêm hành động">
                                            <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        Hiển thị <span className="font-medium text-slate-900 dark:text-white">1-{Math.min(filteredStaff.length, 5)}</span> trong số <span className="font-medium text-slate-900 dark:text-white">{staff.length}</span> nhân viên
                    </div>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-sm font-medium transition-colors" disabled>
                            Trước
                        </button>
                        <button className="px-3 py-1 rounded bg-primary text-white text-sm font-medium shadow-sm hover:bg-primary-dark transition-colors">
                            1
                        </button>
                        <button className="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors">
                            2
                        </button>
                        <button className="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors">
                            3
                        </button>
                        <span className="px-2 py-1 text-slate-400">...</span>
                        <button className="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors">
                            Tiếp
                        </button>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default StaffList;
