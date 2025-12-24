
import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import UploadDocumentModal from '../components/UploadDocumentModal';
import { useData } from '../context/DataContext';
import { Document } from '../types';

const Documents: React.FC = () => {
  const { documents, deleteDocument, hasPermission } = useData();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [targetFilter, setTargetFilter] = useState('all');

  // Stats
  const totalDocs = documents.length;
  const totalDownloads = documents.reduce((acc, doc) => acc + doc.downloads, 0);
  const sharedDocs = documents.filter(d => d.target !== 'public' && d.target !== 'teachers').length;
  const newDocs = documents.filter(d => {
      // Mock logic for "new" - uploaded this month
      const [day, month, year] = d.uploadDate.split('/');
      return parseInt(month) === new Date().getMonth() + 1 && parseInt(year) === new Date().getFullYear();
  }).length;

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === 'all' || doc.type === typeFilter;
      // Simplified target filter logic for demo
      const matchTarget = targetFilter === 'all' || 
                          (targetFilter === 'class' && doc.target !== 'public' && doc.target !== 'teachers') ||
                          (targetFilter === 'public' && doc.target === 'public');
      
      return matchSearch && matchType && matchTarget;
    });
  }, [documents, searchTerm, typeFilter, targetFilter]);

  const handleDelete = (id: string) => {
      if(window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) {
          deleteDocument(id);
      }
  };

  const getIcon = (type: string) => {
      switch(type) {
          case 'pdf': return { icon: 'picture_as_pdf', color: 'text-red-600', bg: 'bg-red-100 ring-red-200' };
          case 'docx': return { icon: 'description', color: 'text-blue-600', bg: 'bg-blue-100 ring-blue-200' };
          case 'xlsx': return { icon: 'table_view', color: 'text-green-600', bg: 'bg-green-100 ring-green-200' };
          case 'audio': return { icon: 'audio_file', color: 'text-purple-600', bg: 'bg-purple-100 ring-purple-200' };
          case 'video': return { icon: 'movie', color: 'text-rose-600', bg: 'bg-rose-100 ring-rose-200' };
          default: return { icon: 'folder', color: 'text-slate-600', bg: 'bg-slate-100 ring-slate-200' };
      }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-background-light dark:bg-background-dark font-display">
      <Header title="Quản lý Tài liệu" />
      
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Thư viện Tài liệu</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Quản lý tập trung tất cả tài liệu khóa học và biểu mẫu.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 shadow-sm transition-all">
                        <span className="material-symbols-outlined text-lg">download</span>
                        <span className="hidden sm:inline">Xuất báo cáo</span>
                    </button>
                    <button 
                        onClick={() => setIsUploadModalOpen(true)}
                        className="h-10 px-4 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-dark flex items-center gap-2 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
                    >
                        <span className="material-symbols-outlined text-lg">upload_file</span>
                        <span>Tải lên mới</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1a202c] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 hover:border-primary/30 transition-colors cursor-default group">
                    <div className="size-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">folder_copy</span>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalDocs}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Tổng tài liệu</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1a202c] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 hover:border-secondary/30 transition-colors cursor-default group">
                    <div className="size-12 rounded-full bg-orange-50 dark:bg-orange-900/20 text-secondary dark:text-orange-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">share</span>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{sharedDocs}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Đang chia sẻ</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1a202c] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 hover:border-purple-300 transition-colors cursor-default group">
                    <div className="size-12 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">cloud_download</span>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{(totalDownloads / 1000).toFixed(1)}k</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Lượt tải</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1a202c] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 hover:border-green-300 transition-colors cursor-default group">
                    <div className="size-12 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">new_releases</span>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{newDocs}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Mới tháng này</p>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-5">
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Từ khóa</label>
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                            <input 
                                className="w-full h-10 pl-10 pr-4 rounded-lg border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary shadow-sm" 
                                placeholder="Nhập tên tài liệu, mã số..." 
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Loại file</label>
                        <select 
                            className="w-full h-10 rounded-lg border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary shadow-sm cursor-pointer"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="all">Tất cả tài liệu</option>
                            <option value="pdf">PDF</option>
                            <option value="docx">Word (DOCX)</option>
                            <option value="xlsx">Excel (XLSX)</option>
                            <option value="audio">Audio</option>
                        </select>
                    </div>
                    <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Đối tượng</label>
                        <select 
                            className="w-full h-10 rounded-lg border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary shadow-sm cursor-pointer"
                            value={targetFilter}
                            onChange={(e) => setTargetFilter(e.target.value)}
                        >
                            <option value="all">Tất cả</option>
                            <option value="public">Công khai</option>
                            <option value="class">Lớp học</option>
                        </select>
                    </div>
                    <div className="md:col-span-1 flex items-end">
                        <button className="w-full h-10 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600 hover:border-primary/50 transition-colors shadow-sm" title="Bộ lọc nâng cao">
                            <span className="material-symbols-outlined">tune</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Document List Table */}
            <div className="bg-white dark:bg-[#1a202c] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <h2 className="font-semibold text-slate-900 dark:text-white">Danh sách tài liệu</h2>
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300">{filteredDocuments.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-2 mr-4">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Sắp xếp:</span>
                            <select className="text-xs border-none bg-transparent font-medium text-slate-900 dark:text-white p-0 pr-6 focus:ring-0 cursor-pointer">
                                <option>Mới nhất</option>
                                <option>Cũ nhất</option>
                                <option>Tên A-Z</option>
                            </select>
                        </div>
                        <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1 hidden sm:block"></div>
                        <button className="size-8 flex items-center justify-center rounded hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm text-primary transition-all bg-white dark:bg-slate-800 shadow-sm border border-slate-200/50 dark:border-slate-700">
                            <span className="material-symbols-outlined text-xl">view_list</span>
                        </button>
                        <button className="size-8 flex items-center justify-center rounded hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm text-slate-500 dark:text-slate-400 transition-all opacity-70">
                            <span className="material-symbols-outlined text-xl">grid_view</span>
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                            <tr>
                                <th className="px-5 py-3 w-[50px] text-center">
                                    <input className="rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary size-4 cursor-pointer" type="checkbox"/>
                                </th>
                                <th className="px-5 py-3 min-w-[300px]">Tên tài liệu</th>
                                <th className="px-5 py-3 min-w-[140px]">Loại</th>
                                <th className="px-5 py-3 min-w-[140px]">Đối tượng</th>
                                <th className="px-5 py-3 min-w-[160px]">Người tải lên</th>
                                <th className="px-5 py-3 text-right">Ngày đăng</th>
                                <th className="px-5 py-3 w-[100px] text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                            {filteredDocuments.map((doc) => {
                                const style = getIcon(doc.type);
                                return (
                                    <tr key={doc.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-5 py-4 text-center">
                                            <input className="rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary size-4 cursor-pointer" type="checkbox"/>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-start gap-3">
                                                <div className={`size-10 rounded-lg flex items-center justify-center flex-shrink-0 ring-1 ${style.bg} ${style.color}`}>
                                                    <span className="material-symbols-outlined">{style.icon}</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white group-hover:text-primary cursor-pointer transition-colors line-clamp-1">{doc.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">{doc.size} • {doc.type.toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-700 dark:text-slate-300 capitalize">{doc.type}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                <span className="material-symbols-outlined text-base">
                                                    {doc.target === 'public' ? 'public' : 'class'}
                                                </span>
                                                <span>{doc.targetName}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                    {doc.uploadedBy.charAt(0)}
                                                </div>
                                                <span className="text-slate-900 dark:text-white">{doc.uploadedBy}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right text-slate-500 dark:text-slate-400">{doc.uploadDate}</td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="size-8 rounded-full hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-primary transition-all" title="Xem trước">
                                                    <span className="material-symbols-outlined text-lg">visibility</span>
                                                </button>
                                                {hasPermission('delete_data') && (
                                                    <button 
                                                        onClick={() => handleDelete(doc.id)}
                                                        className="size-8 rounded-full hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-red-500 transition-all" 
                                                        title="Xóa"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {filteredDocuments.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 italic">
                                        Không tìm thấy tài liệu nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-[#1a202c]">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Hiển thị <span className="font-medium text-slate-900 dark:text-white">1-{filteredDocuments.length}</span> trên tổng số <span className="font-medium text-slate-900 dark:text-white">{totalDocs}</span> kết quả</p>
                    <div className="flex items-center gap-1">
                        <button className="size-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-lg disabled:opacity-50 transition-colors" disabled>
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                        </button>
                        <button className="size-8 flex items-center justify-center rounded bg-primary text-white text-sm font-medium shadow-sm">1</button>
                        <button className="size-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-sm font-medium transition-colors">2</button>
                        <button className="size-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-lg transition-colors">
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </main>

      {isUploadModalOpen && <UploadDocumentModal onClose={() => setIsUploadModalOpen(false)} />}
    </div>
  );
};

export default Documents;
