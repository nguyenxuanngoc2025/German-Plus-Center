
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { ClassItem } from '../types';
import Avatar from '../components/Avatar';

const ClassList: React.FC = () => {
  const navigate = useNavigate();
  const { classes, hasPermission } = useData(); // Use Global Data
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [modeFilter, setModeFilter] = useState(''); // New filter for Online/Offline
  const [sortConfig, setSortConfig] = useState<{ key: keyof ClassItem; direction: 'asc' | 'desc' } | null>(null);

  // Extract unique teachers for filter
  const teachers = Array.from(new Set(classes.map(c => c.teacher)));

  const filteredClasses = useMemo(() => {
    let data = classes.filter(cls => {
      const term = searchTerm.toLowerCase();
      const matchSearch = cls.name.toLowerCase().includes(term) || 
                          cls.code.toLowerCase().includes(term) ||
                          cls.teacher.toLowerCase().includes(term);
      const matchLevel = levelFilter ? cls.name.includes(levelFilter) : true;
      const matchStatus = statusFilter ? cls.status === statusFilter : true;
      const matchTeacher = teacherFilter ? cls.teacher === teacherFilter : true;
      const matchMode = modeFilter ? cls.mode === modeFilter : true; // Mode Filter Logic
      
      return matchSearch && matchLevel && matchStatus && matchTeacher && matchMode;
    });

    if (sortConfig !== null) {
      data.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
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
  }, [classes, searchTerm, levelFilter, statusFilter, teacherFilter, modeFilter, sortConfig]);

  const handleSort = (key: keyof ClassItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key: keyof ClassItem) => {
    if (sortConfig?.key !== key) {
        return <span className="material-symbols-outlined text-[16px] text-gray-300 opacity-0 group-hover:opacity-50">unfold_more</span>;
    }
    return <span className="material-symbols-outlined text-[16px] text-primary">{sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return (
          <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold uppercase text-green-700 border border-green-200">
            <span className="mr-1.5 size-1.5 rounded-full bg-green-600"></span>
            Đang hoạt động
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold uppercase text-orange-700 border border-orange-200">
            <span className="mr-1.5 size-1.5 rounded-full bg-orange-600"></span>
            Sắp khai giảng
          </span>
        );
      case 'full':
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold uppercase text-gray-700 border border-gray-200">
            <span className="mr-1.5 size-1.5 rounded-full bg-gray-500"></span>
            Đầy lớp
          </span>
        );
      default:
        return null;
    }
  };

  const getModeBadge = (cls: ClassItem) => {
    if (cls.mode === 'online') {
      return (
        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200" title={cls.link || 'Chưa có link'}>
           <span className="material-symbols-outlined text-[12px]">wifi</span> Online
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200" title={cls.location || 'Chưa có địa chỉ'}>
         <span className="material-symbols-outlined text-[12px]">apartment</span> Offline
      </span>
    );
  };

  const getLevelBadge = (name: string) => {
    const level = name.match(/[A-C][1-2]/)?.[0] || 'A1';
    return (
      <span className="text-xs font-medium text-[#616f89] dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-600">
        Cấp độ {level}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-background-light dark:bg-background-dark">
      <Header title="Trung tâm Lớp học" />
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-[1400px] flex flex-col gap-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col gap-1">
                    <h2 className="text-slate-800 dark:text-white text-3xl font-bold tracking-tight">Danh sách Lớp học</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Quản lý và theo dõi tiến độ của tất cả các lớp tiếng Đức hiện tại.</p>
                </div>
                <div className="flex items-center gap-3">
                    {hasPermission('export_data') && (
                        <button className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#dce0e5] dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-sm font-semibold text-[#111318] dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                             <span className="material-symbols-outlined text-lg">download</span>
                            Xuất dữ liệu
                        </button>
                    )}
                    {hasPermission('edit_classes') && (
                        <button 
                            onClick={() => navigate('/classes/create')}
                            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-secondary px-4 text-sm font-semibold text-white hover:bg-orange-600 shadow-md transition-all"
                        >
                             <span className="material-symbols-outlined text-lg">add</span>
                            Thêm Lớp học mới
                        </button>
                    )}
                </div>
            </div>

            {/* Filters Toolbar */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 rounded-xl bg-white dark:bg-[#1a202c] p-3 shadow-subtle border border-[#e5e7eb] dark:border-slate-700">
                <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 w-full lg:w-auto">
                    <div className="relative w-full sm:w-64">
                        <input 
                            className="w-full h-9 pl-9 pr-3 text-sm bg-[#f0f2f4] dark:bg-slate-800 border-none rounded-md focus:ring-1 focus:ring-primary placeholder:text-[#616f89] text-[#111318] dark:text-white" 
                            placeholder="Tên lớp, mã lớp..." 
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#616f89] text-[18px]">search</span>
                    </div>
                    
                    <div className="flex gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                         <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
                        <select 
                            className="h-9 rounded-md bg-[#f0f2f4] dark:bg-slate-800 pl-3 pr-8 text-sm font-medium text-[#111318] dark:text-white border-none focus:ring-1 focus:ring-primary hover:bg-[#e0e2e4] dark:hover:bg-slate-700 cursor-pointer min-w-[140px]"
                            value={modeFilter}
                            onChange={(e) => setModeFilter(e.target.value)}
                        >
                            <option value="">Tất cả hình thức</option>
                            <option value="online">Online</option>
                            <option value="offline">Offline</option>
                        </select>
                        <select 
                            className="h-9 rounded-md bg-[#f0f2f4] dark:bg-slate-800 pl-3 pr-8 text-sm font-medium text-[#111318] dark:text-white border-none focus:ring-1 focus:ring-primary hover:bg-[#e0e2e4] dark:hover:bg-slate-700 cursor-pointer min-w-[140px]"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">Trạng thái: Tất cả</option>
                            <option value="active">Đang học</option>
                            <option value="upcoming">Sắp khai giảng</option>
                            <option value="full">Đầy lớp</option>
                        </select>
                        <select 
                            className="h-9 rounded-md bg-[#f0f2f4] dark:bg-slate-800 pl-3 pr-8 text-sm font-medium text-[#111318] dark:text-white border-none focus:ring-1 focus:ring-primary hover:bg-[#e0e2e4] dark:hover:bg-slate-700 cursor-pointer min-w-[140px]"
                            value={teacherFilter}
                            onChange={(e) => setTeacherFilter(e.target.value)}
                        >
                            <option value="">Tất cả giáo viên</option>
                            {teachers.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-1 border-l border-gray-200 dark:border-slate-700 pl-4 ml-auto lg:ml-0">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-[#616f89]'}`}
                        title="Chế độ Lưới"
                    >
                        <span className="material-symbols-outlined text-xl">grid_view</span>
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-[#616f89]'}`}
                        title="Chế độ Bảng"
                    >
                        <span className="material-symbols-outlined text-xl">view_list</span>
                    </button>
                </div>
            </div>

            {viewMode === 'list' ? (
                /* List View (Table) */
                <div className="rounded-xl border border-[#e5e7eb] dark:border-slate-700 bg-white dark:bg-[#1a202c] shadow-card overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-[#111318] dark:text-white whitespace-nowrap">
                            <thead className="bg-[#F1F5F9] dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold border-b border-[#e5e7eb] dark:border-slate-700 uppercase tracking-wide text-xs">
                                <tr>
                                    <th onClick={() => handleSort('name')} className="px-6 py-4 w-64 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors group select-none">
                                        <div className="flex items-center gap-1">Tên lớp học {renderSortIcon('name')}</div>
                                    </th>
                                    <th onClick={() => handleSort('mode')} className="px-6 py-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors group select-none">
                                        <div className="flex items-center gap-1">Hình thức {renderSortIcon('mode')}</div>
                                    </th>
                                    <th onClick={() => handleSort('tuitionFee')} className="px-6 py-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors group select-none">
                                        <div className="flex items-center gap-1">Học phí {renderSortIcon('tuitionFee')}</div>
                                    </th>
                                    <th onClick={() => handleSort('teacher')} className="px-6 py-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors group select-none">
                                        <div className="flex items-center gap-1">Giáo viên {renderSortIcon('teacher')}</div>
                                    </th>
                                    <th onClick={() => handleSort('schedule')} className="px-6 py-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors group select-none">
                                        <div className="flex items-center gap-1">Lịch học {renderSortIcon('schedule')}</div>
                                    </th>
                                    <th onClick={() => handleSort('students')} className="px-6 py-4 w-48 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors group select-none">
                                        <div className="flex items-center gap-1">Sĩ số {renderSortIcon('students')}</div>
                                    </th>
                                    <th onClick={() => handleSort('status')} className="px-6 py-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors group select-none">
                                        <div className="flex items-center gap-1">Trạng thái {renderSortIcon('status')}</div>
                                    </th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e5e7eb] dark:divide-slate-700">
                                {filteredClasses.map((cls) => (
                                    <tr 
                                        key={cls.id} 
                                        onClick={() => navigate(`/classes/${cls.id}`)}
                                        className="hover:bg-blue-50/50 dark:hover:bg-slate-800 even:bg-[#F8FAFC] dark:even:bg-slate-800/50 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-800 dark:text-white text-base group-hover:text-primary transition-colors">{cls.name} - {cls.code}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {getLevelBadge(cls.name)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getModeBadge(cls)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-900 dark:text-white font-medium">{formatCurrency(cls.tuitionFee)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar src={cls.teacherAvatar} name={cls.teacher} className="size-9 border border-slate-200 dark:border-slate-600" />
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-[#111318] dark:text-white">{cls.teacher}</span>
                                                    <span className="text-xs text-[#616f89] dark:text-slate-400">Giáo viên chính</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[#616f89] dark:text-slate-400">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium text-[#111318] dark:text-white">{cls.schedule.split('•')[0]}</span>
                                                <div className="flex items-center gap-1 text-xs">
                                                    <span className="material-symbols-outlined text-sm">schedule</span>
                                                    {cls.schedule.split('•')[1] || '18:00 - 19:30'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5 w-full max-w-[120px]">
                                                <div className="flex justify-between text-xs font-medium">
                                                    <span className="text-[#111318] dark:text-white">{cls.students}<span className="text-[#616f89] dark:text-slate-400 font-normal">/{cls.maxStudents}</span></span>
                                                    <span className={cls.progress > 80 ? "text-primary" : "text-secondary"}>{cls.progress}%</span>
                                                </div>
                                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
                                                    <div className={`h-full rounded-full ${cls.progress > 80 ? 'bg-primary' : 'bg-secondary'}`} style={{width: `${cls.progress}%`}}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(cls.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {hasPermission('edit_classes') && (
                                                    <button className="flex items-center justify-center p-2 rounded-lg text-[#616f89] dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-primary dark:hover:text-primary hover:shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition-all" title="Sửa Lớp học">
                                                        <span className="material-symbols-outlined text-lg">edit_square</span>
                                                    </button>
                                                )}
                                                {hasPermission('delete_data') && (
                                                    <button className="flex items-center justify-center p-2 rounded-lg text-[#616f89] dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-red-600 dark:hover:text-red-400 hover:shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition-all" title="Xóa Lớp học">
                                                        <span className="material-symbols-outlined text-lg">delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Grid View (Existing Card Layout) */
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredClasses.map((cls) => (
                        <div 
                            key={cls.id} 
                            onClick={() => navigate(`/classes/${cls.id}`)}
                            className="group relative flex flex-col justify-between rounded-xl border border-[#e5e7eb] dark:border-slate-700 bg-white dark:bg-[#1a202c] p-5 shadow-subtle transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 cursor-pointer"
                        >
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <h3 className="font-bold text-[#111318] dark:text-white text-lg group-hover:text-primary transition-colors">{cls.name} - {cls.code}</h3>
                                    <div className="mt-2 flex items-center gap-2">
                                        {getModeBadge(cls)}
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-600">
                                            {formatCurrency(cls.tuitionFee)}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-1 text-xs text-[#616f89] dark:text-slate-400">
                                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                                        <span>{cls.schedule}</span>
                                    </div>
                                    {/* Location/Link Preview in Grid */}
                                    {cls.mode === 'online' ? (
                                        <div className="mt-1 flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 truncate">
                                            <span className="material-symbols-outlined text-sm">link</span>
                                            <span className="truncate max-w-[150px]">{cls.link || 'Chưa cập nhật link'}</span>
                                        </div>
                                    ) : (
                                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                                            <span className="material-symbols-outlined text-sm">location_on</span>
                                            <span className="truncate max-w-[150px]">{cls.location || '102 Ngô Quyền...'}</span>
                                        </div>
                                    )}
                                </div>
                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset ${
                                    cls.status === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400' : 
                                    cls.status === 'upcoming' ? 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-900/30 dark:text-orange-400' : 
                                    'bg-gray-100 text-gray-600 ring-gray-500/10 dark:bg-slate-700 dark:text-slate-300'
                                }`}>
                                    {cls.status === 'active' ? 'Đang học' : cls.status === 'upcoming' ? 'Sắp mở' : 'Đầy lớp'}
                                </span>
                            </div>
                            <div className="mb-5 flex items-center gap-3 border-t border-dashed border-gray-100 dark:border-slate-700 pt-4">
                                <Avatar src={cls.teacherAvatar} name={cls.teacher} className="size-8 border border-gray-100 dark:border-slate-700 text-xs" />
                                <div className="flex flex-col">
                                    <p className="text-sm font-medium text-[#111318] dark:text-white">{cls.teacher}</p>
                                    <p className="text-xs text-[#616f89] dark:text-slate-400">Giáo viên chính</p>
                                </div>
                            </div>
                            <div className="mt-auto">
                                <div className="mb-2 flex justify-between text-xs font-medium">
                                    <span className="text-[#616f89] dark:text-slate-400">Sĩ số</span>
                                    <span className="text-[#111318] dark:text-white"><span className="text-primary font-bold">{cls.students}</span>/{cls.maxStudents} học viên</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
                                    <div className={`h-full rounded-full ${cls.status === 'upcoming' ? 'bg-secondary' : 'bg-primary'}`} style={{width: `${cls.progress}%`}}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Pagination (Common) */}
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-slate-700 pt-6">
                <p className="text-sm text-[#616f89] dark:text-slate-400">Hiển thị <span className="font-medium text-[#111318] dark:text-white">1-{Math.min(filteredClasses.length, 6)}</span> trong số <span className="font-medium text-[#111318] dark:text-white">{classes.length}</span> lớp học</p>
                <div className="flex items-center gap-2">
                    <button className="flex size-9 items-center justify-center rounded-lg border border-[#e5e7eb] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#616f89] dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-primary disabled:opacity-50">
                        <span className="material-symbols-outlined text-xl">chevron_left</span>
                    </button>
                    <button className="flex size-9 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
                        1
                    </button>
                    <button className="flex size-9 items-center justify-center rounded-lg border border-[#e5e7eb] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#616f89] dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-primary">
                        2
                    </button>
                    <button className="flex size-9 items-center justify-center rounded-lg border border-[#e5e7eb] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#616f89] dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-primary">
                        3
                    </button>
                    <button className="flex size-9 items-center justify-center rounded-lg border border-[#e5e7eb] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#616f89] dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-primary">
                        <span className="material-symbols-outlined text-xl">chevron_right</span>
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default ClassList;
