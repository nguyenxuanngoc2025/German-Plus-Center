
import React, { useState, useMemo, useEffect } from 'react';
import Header from '../components/Header';
import ConvertModal from '../components/ConvertModal';
import AddLeadModal from '../components/AddLeadModal';
import StudentDetailsModal from '../components/StudentDetailsModal';
import BulkEnrollModal from '../components/BulkEnrollModal';
import ColumnSelector, { ColumnOption } from '../components/ColumnSelector';
import Avatar from '../components/Avatar';
import { Lead } from '../types';
import { useData } from '../context/DataContext';

const LeadsKanban: React.FC = () => {
  const { leads, updateLead, hasPermission } = useData();
  
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isBulkEnrollOpen, setIsBulkEnrollOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadForDetail, setLeadForDetail] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'grid'>('kanban');
  
  // Selection for Bulk Actions
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  
  // Live Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all'); // New filter
  const [isLoading, setIsLoading] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Sorting
  const [sortConfig, setSortConfig] = useState<{ key: keyof Lead; direction: 'asc' | 'desc' } | null>(null);

  // Column Config for List View
  const columnOptions: ColumnOption[] = [
      { key: 'name', label: 'Tên Lead', isMandatory: true },
      { key: 'source', label: 'Nguồn' },
      { key: 'mode', label: 'Hình thức' }, // New Column
      { key: 'status', label: 'Trạng thái', isMandatory: true },
      { key: 'level', label: 'Trình độ mong muốn' },
      { key: 'contact', label: 'Liên hệ (SĐT/Email)' },
      { key: 'actions', label: 'Thao tác', isMandatory: true },
  ];
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columnOptions.map(c => c.key));

  // Trigger loading on filter change
  useEffect(() => {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
  }, [statusFilter, sourceFilter, modeFilter]);

  // Auto-hide toast
  useEffect(() => {
      if (toast) {
          const timer = setTimeout(() => setToast(null), 3000);
          return () => clearTimeout(timer);
      }
  }, [toast]);

  const filteredLeads = useMemo(() => {
      return leads.filter(lead => {
          // Filter out closed leads from Kanban/List active views usually
          if (lead.status === 'closed') return false;

          const matchStatus = statusFilter === 'all' || lead.status === statusFilter;
          const matchSource = sourceFilter === 'all' || lead.source === sourceFilter;
          const matchMode = modeFilter === 'all' || lead.learningMode === modeFilter; // Mode filter
          return matchStatus && matchSource && matchMode;
      });
  }, [leads, statusFilter, sourceFilter, modeFilter]);

  const sortedLeads = useMemo(() => {
    let sortableItems = [...filteredLeads];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredLeads, sortConfig]);

  const handleConvert = (lead: Lead) => {
    setSelectedLead(lead);
    setIsConvertModalOpen(true);
  };

  const handleViewDetail = (lead: Lead) => {
    setLeadForDetail(lead);
  };

  // Quick Status Update Logic
  const handleQuickStatusUpdate = (lead: Lead, newStatus: Lead['status']) => {
      // 1. Update Data immediately
      updateLead(lead.id, { status: newStatus });

      // 2. Feedback Toast
      setToast({ 
          message: `Đã cập nhật trạng thái của ${lead.name} thành ${getColumnTitle(newStatus)}`, 
          type: 'success' 
      });

      // 3. Smart Trigger for Ready/Enrollment
      if (newStatus === 'ready') {
          // Small delay to allow UI update before showing modal
          setTimeout(() => {
              setSelectedLead({ ...lead, status: newStatus });
              setIsConvertModalOpen(true);
          }, 300);
      }
  };

  // Bulk Selection Logic
  const toggleSelectLead = (id: string) => {
      setSelectedLeadIds(prev => prev.includes(id) ? prev.filter(lid => lid !== id) : [...prev, id]);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          setSelectedLeadIds(sortedLeads.map(l => l.id));
      } else {
          setSelectedLeadIds([]);
      }
  };

  const handleBulkEnroll = () => {
      if (selectedLeadIds.length === 0) return;
      setIsBulkEnrollOpen(true);
  };

  const handleSort = (key: keyof Lead) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key: keyof Lead) => {
    if (sortConfig?.key !== key) {
        return <span className="material-symbols-outlined text-[16px] text-gray-300 opacity-0 group-hover:opacity-50">unfold_more</span>;
    }
    return <span className="material-symbols-outlined text-[16px] text-primary">{sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>;
  };

  // Drag & Drop
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: Lead['status']) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    if (leadId) {
        if (newStatus === 'ready') {
            // Special case: Dropping to 'Ready' triggers the Convert/Enrollment flow
            const lead = leads.find(l => l.id === leadId);
            if (lead) {
                // Update status first then open modal
                updateLead(leadId, { status: newStatus });
                setSelectedLead({ ...lead, status: newStatus });
                setIsConvertModalOpen(true);
            }
        } else {
            // Normal transition
            updateLead(leadId, { status: newStatus });
        }
    }
  };

  const getColumnColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-400';
      case 'consulting': return 'bg-indigo-400';
      case 'trial': return 'bg-accent';
      case 'ready': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  const getColumnTitle = (status: string) => {
     switch (status) {
      case 'new': return 'Lead Mới';
      case 'consulting': return 'Đang chăm sóc';
      case 'trial': return 'Học thử';
      case 'ready': return 'Sẵn sàng nhập học';
      default: return 'Khác';
    }
  };

  // Status Select Styles Helper - Rebuilt for SVG Background & Exact Palette
  const getSelectStyle = (status: string) => {
      const base = "appearance-none cursor-pointer rounded-lg text-xs font-bold py-2 pl-3 pr-8 border shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary/20 bg-no-repeat bg-[center_right_10px] h-9 inline-block leading-tight select-arrow-custom";
      
      switch (status) {
          case 'new': 
              return `${base} bg-[#E1F7E5] text-[#10B981] border-[#10B981]/20 hover:border-[#10B981]/50`;
          case 'consulting': 
              return `${base} bg-[#FEF3C7] text-[#D97706] border-[#D97706]/20 hover:border-[#D97706]/50`;
          case 'trial': 
              return `${base} bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-300`;
          case 'ready': 
              return `${base} bg-[#E0E7FF] text-[#4338CA] border-[#4338CA]/20 hover:border-[#4338CA]/50`;
          default: 
              return `${base} bg-[#FEE2E2] text-[#EF4444] border-[#EF4444]/20 hover:border-[#EF4444]/50`;
      }
  };

  // Helper for Learning Mode Badge
  const getModeBadge = (mode?: string) => {
      if (mode === 'online') {
          return (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
                  <span className="material-symbols-outlined text-[12px]">language</span>
                  Online
              </span>
          );
      }
      return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#1e3a8a] text-white border border-[#1e3a8a] dark:bg-slate-700 dark:border-slate-600">
              <span className="material-symbols-outlined text-[12px]">apartment</span>
              Offline
          </span>
      );
  };

  // Inject Custom SVG Chevron Style
  const customStyles = `
    .select-arrow-custom {
      -webkit-appearance: none !important;
      -moz-appearance: none !important;
      appearance: none !important;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='2' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E");
      background-size: 14px;
    }
  `;

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-background-light dark:bg-background-dark relative">
      <style>{customStyles}</style>
      <Header title="CRM Leads" />
      
      {/* Toast Notification */}
      {toast && (
          <div className="absolute bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
              <div className="flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg shadow-slate-900/20">
                  <span className="material-symbols-outlined text-green-400">check_circle</span>
                  <p className="text-sm font-medium">{toast.message}</p>
              </div>
          </div>
      )}
      
      {/* Page Header & Actions */}
      <div className="flex flex-col border-b border-[#e5e7eb] dark:border-gray-800 bg-white dark:bg-[#1a202c] px-6 py-4 shrink-0 z-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
                <h2 className="text-2xl font-bold text-[#111318] dark:text-white tracking-tight">Quản lý Lead</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Theo dõi, chăm sóc và chuyển đổi khách hàng tiềm năng.</p>
            </div>
            <div className="flex items-center gap-3">
                {selectedLeadIds.length > 0 && (
                    <button 
                        onClick={handleBulkEnroll}
                        className="flex items-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 py-2 font-bold transition-colors shadow-md animate-in fade-in zoom-in duration-200"
                    >
                        <span className="material-symbols-outlined text-[20px]">school</span>
                        <span>Xếp lớp ({selectedLeadIds.length})</span>
                    </button>
                )}
                <button 
                  onClick={() => setIsAddLeadModalOpen(true)}
                  className="flex items-center gap-2 rounded-lg bg-primary hover:bg-primary-dark text-white px-4 py-2 font-medium transition-colors shadow-md shadow-primary/20 text-sm"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span>Thêm Lead</span>
                </button>
                <div className="w-[1px] h-8 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                {/* Column Selector for List Mode */}
                {viewMode === 'list' && (
                    <ColumnSelector 
                        tableId="leads_list_table"
                        columns={columnOptions}
                        onChange={setVisibleColumns}
                    />
                )}
                <div className="flex bg-[#f0f2f4] dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700/50">
                    <button onClick={() => setViewMode('kanban')} className={`p-1.5 px-3 rounded-md flex items-center justify-center transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary dark:text-white' : 'text-gray-500'}`} title="Xem Kanban">
                        <span className="material-symbols-outlined text-[20px]">view_kanban</span>
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-1.5 px-3 rounded-md flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary dark:text-white' : 'text-gray-500'}`} title="Xem Bảng">
                        <span className="material-symbols-outlined text-[20px]">table_rows</span>
                    </button>
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 px-3 rounded-md flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary dark:text-white' : 'text-gray-500'}`} title="Xem Lưới">
                        <span className="material-symbols-outlined text-[20px]">grid_view</span>
                    </button>
                </div>
            </div>
        </div>
        
        {/* Live Filters */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            <div className="relative group">
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-primary focus:border-primary focus:ring-0 cursor-pointer transition-colors"
                >
                    <option value="all">Trạng thái: Tất cả</option>
                    <option value="new">Lead Mới</option>
                    <option value="consulting">Đang chăm sóc</option>
                    <option value="trial">Học thử</option>
                    <option value="ready">Sẵn sàng</option>
                </select>
                <span className="material-symbols-outlined text-[16px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">expand_more</span>
            </div>
            
            {/* New Learning Mode Filter */}
            <div className="relative group">
                <select 
                    value={modeFilter}
                    onChange={(e) => setModeFilter(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-primary focus:border-primary focus:ring-0 cursor-pointer transition-colors"
                >
                    <option value="all">Hình thức học: Tất cả</option>
                    <option value="offline">Offline (Tại trung tâm)</option>
                    <option value="online">Online (Trực tuyến)</option>
                </select>
                <span className="material-symbols-outlined text-[16px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">expand_more</span>
            </div>

            <div className="relative group">
                <select 
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-primary focus:border-primary focus:ring-0 cursor-pointer transition-colors"
                >
                    <option value="all">Nguồn: Tất cả</option>
                    <option value="Facebook Ads">Facebook Ads</option>
                    <option value="Website">Website</option>
                    <option value="Giới thiệu">Giới thiệu</option>
                    <option value="Vãng lai">Vãng lai</option>
                </select>
                <span className="material-symbols-outlined text-[16px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">expand_more</span>
            </div>
            { (statusFilter !== 'all' || sourceFilter !== 'all' || modeFilter !== 'all') && (
                <button 
                    onClick={() => { setStatusFilter('all'); setSourceFilter('all'); setModeFilter('all'); }}
                    className="text-sm font-medium text-red-500 hover:text-red-700 underline decoration-dashed underline-offset-4 transition-colors whitespace-nowrap ml-2"
                >
                    Xóa bộ lọc
                </button>
            )}
        </div>
      </div>

      <div className={`flex-1 p-6 relative ${viewMode === 'kanban' ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto'}`}>
        {isLoading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-black/20 z-20 flex items-center justify-center backdrop-blur-[1px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )}

        {sortedLeads.length === 0 && !isLoading ? (
             <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <span className="material-symbols-outlined text-5xl mb-2">filter_list_off</span>
                <p>Không tìm thấy Lead nào phù hợp.</p>
             </div>
        ) : (
            <>
                {/* VIEW MODE: KANBAN */}
                {viewMode === 'kanban' && (
                    <div className="flex h-full gap-6 min-w-[1200px]">
                    {(['new', 'consulting', 'trial', 'ready'] as const).map((status) => {
                        const colLeads = sortedLeads.filter(l => l.status === status);
                        // In Kanban mode, if status filter is active, only show relevant column or highlight it
                        if (statusFilter !== 'all' && status !== statusFilter) return null;

                        return (
                        <div 
                            key={status} 
                            className="flex flex-col w-80 shrink-0 h-full rounded-xl transition-colors"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, status)}
                        >
                            <div className="flex items-center justify-between mb-4 px-1">
                            <div className="flex items-center gap-2">
                                <span className={`flex h-2.5 w-2.5 rounded-full ${getColumnColor(status)}`}></span>
                                <h3 className="font-bold text-[#111318] dark:text-white">{getColumnTitle(status)}</h3>
                                <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full font-medium">
                                    {colLeads.length}
                                </span>
                            </div>
                            </div>
                            <div className="flex flex-col gap-3 h-full overflow-y-auto pr-2 pb-4 custom-scrollbar">
                            {colLeads.map(lead => (
                                <div 
                                    key={lead.id} 
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, lead.id)}
                                    onClick={() => handleViewDetail(lead)}
                                    className={`group relative flex flex-col gap-3 rounded-xl bg-white dark:bg-[#1a202c] p-4 shadow-sm border border-transparent hover:border-primary/50 hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${status === 'ready' ? 'border-l-4 border-l-green-500' : ''}`}
                                >
                                    <div className="flex justify-between items-start pointer-events-none">
                                        <div className="flex items-center gap-3">
                                            <Avatar 
                                                src={lead.avatar} 
                                                name={lead.name} 
                                                className="size-10 shadow-sm text-sm" 
                                                detail={lead} // Pass lead object
                                            />
                                            <div>
                                                <h4 className="font-semibold text-[#111318] dark:text-white text-sm leading-tight">{lead.name}</h4>
                                                <p className="text-xs text-gray-500 mt-0.5">{lead.source}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {/* Target Level Tag - Always visible if exists */}
                                        {lead.targetLevel && (
                                            <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">
                                                {lead.targetLevel}
                                            </span>
                                        )}
                                        {/* Learning Mode Tag */}
                                        {getModeBadge(lead.learningMode)}
                                        
                                        {lead.tags?.map(tag => (
                                            <span key={tag} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between mt-1 pt-3 border-t border-gray-100 dark:border-gray-700 pointer-events-none">
                                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                                            {lead.lastActivity}
                                        </span>
                                    </div>
                                    
                                    {/* PROMINENT ACTION BUTTON - NAVY BLUE */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleConvert(lead); }}
                                        className="w-full mt-1 py-2 px-3 bg-[#1e3a8a] hover:bg-[#172554] text-white rounded-md text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-colors active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">school</span>
                                        Chốt & Xếp lớp
                                    </button>
                                </div>
                            ))}
                            </div>
                        </div>
                    )})}
                    </div>
                )}

                {/* VIEW MODE: LIST */}
                {viewMode === 'list' && (
                    <div className="bg-white dark:bg-[#1a202c] border border-[#e5e7eb] dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#f8fafc] dark:bg-slate-900 border-b border-[#e5e7eb] dark:border-slate-700 text-xs uppercase text-[#616f89] dark:text-slate-400 font-semibold tracking-wider">
                                        <th className="px-6 py-4 w-10 text-center">
                                            <input 
                                                type="checkbox" 
                                                onChange={handleSelectAll}
                                                checked={sortedLeads.length > 0 && selectedLeadIds.length === sortedLeads.length}
                                                className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" 
                                            />
                                        </th>
                                        {visibleColumns.includes('name') && (
                                            <th onClick={() => handleSort('name')} className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group select-none">
                                                <div className="flex items-center gap-1">Tên Lead {renderSortIcon('name')}</div>
                                            </th>
                                        )}
                                        {visibleColumns.includes('source') && (
                                            <th onClick={() => handleSort('source')} className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group select-none">
                                                <div className="flex items-center gap-1">Nguồn {renderSortIcon('source')}</div>
                                            </th>
                                        )}
                                        {visibleColumns.includes('mode') && (
                                            <th onClick={() => handleSort('learningMode')} className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group select-none">
                                                <div className="flex items-center gap-1">Hình thức {renderSortIcon('learningMode')}</div>
                                            </th>
                                        )}
                                        {visibleColumns.includes('status') && (
                                            <th onClick={() => handleSort('status')} className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group select-none">
                                                <div className="flex items-center gap-1">Trạng thái {renderSortIcon('status')}</div>
                                            </th>
                                        )}
                                        {visibleColumns.includes('level') && (
                                            <th onClick={() => handleSort('targetLevel')} className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group select-none">
                                                <div className="flex items-center gap-1">Trình độ {renderSortIcon('targetLevel')}</div>
                                            </th>
                                        )}
                                        {visibleColumns.includes('contact') && (
                                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group select-none">
                                                Liên hệ
                                            </th>
                                        )}
                                        {visibleColumns.includes('actions') && (
                                            <th className="px-6 py-4 text-right">Thao tác</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e5e7eb] dark:divide-slate-700">
                                    {sortedLeads.map((lead) => (
                                        <tr key={lead.id} onClick={() => handleViewDetail(lead)} className="group hover:bg-[#f8fafc] dark:hover:bg-slate-800 transition-colors cursor-pointer">
                                            <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedLeadIds.includes(lead.id)}
                                                    onChange={() => toggleSelectLead(lead.id)}
                                                    className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" 
                                                />
                                            </td>
                                            {visibleColumns.includes('name') && (
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar src={lead.avatar} name={lead.name} className="size-8 text-xs" detail={lead} />
                                                        <div>
                                                            <p className="text-sm font-semibold text-[#111318] dark:text-white">{lead.name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.includes('source') && (
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{lead.source}</td>
                                            )}
                                            {visibleColumns.includes('mode') && (
                                                <td className="px-6 py-4">
                                                    {getModeBadge(lead.learningMode)}
                                                </td>
                                            )}
                                            {visibleColumns.includes('status') && (
                                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                    {/* Quick Status Dropdown - REFINED WITH SVG & IMPORTANT */}
                                                    <select 
                                                        value={lead.status}
                                                        onChange={(e) => handleQuickStatusUpdate(lead, e.target.value as Lead['status'])}
                                                        className={getSelectStyle(lead.status)}
                                                    >
                                                        <option value="new">Lead Mới</option>
                                                        <option value="consulting">Đang tư vấn</option>
                                                        <option value="trial">Học thử</option>
                                                        <option value="ready">Sẵn sàng</option>
                                                    </select>
                                                </td>
                                            )}
                                            {visibleColumns.includes('level') && (
                                                <td className="px-6 py-4">
                                                    {lead.targetLevel ? <span className="text-[10px] text-primary bg-primary/10 px-1.5 rounded border border-primary/20">{lead.targetLevel}</span> : '-'}
                                                </td>
                                            )}
                                            {visibleColumns.includes('contact') && (
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <div className="flex flex-col gap-0.5">
                                                        {lead.phone && (
                                                            <a 
                                                                href={`tel:${lead.phone.replace(/\D/g, '')}`} 
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="flex items-center gap-1 hover:text-primary transition-colors"
                                                                title={`Gọi cho ${lead.name}`}
                                                            >
                                                                <span className="material-symbols-outlined text-[14px]">call</span> {lead.phone}
                                                            </a>
                                                        )}
                                                        {lead.email && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">mail</span> {lead.email}</span>}
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.includes('actions') && (
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* PROMINENT ACTION BUTTON - NAVY BLUE */}
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleConvert(lead); }} 
                                                            className="px-3 py-1.5 bg-[#1e3a8a] hover:bg-[#172554] text-white rounded-md text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors whitespace-nowrap"
                                                            title="Chốt & Xếp lớp"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">school</span>
                                                            Chốt & Xếp lớp
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleViewDetail(lead); }} className="text-gray-400 hover:text-primary p-1.5 rounded hover:bg-gray-100 transition-colors">
                                                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* VIEW MODE: GRID */}
                {viewMode === 'grid' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-10">
                        {sortedLeads.map((lead) => (
                            <div 
                                key={lead.id}
                                onClick={() => handleViewDetail(lead)}
                                className={`group relative bg-white dark:bg-[#1a202c] rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer flex flex-col gap-4 ${selectedLeadIds.includes(lead.id) ? 'ring-2 ring-primary bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                            >
                                {/* Selection Checkbox */}
                                <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
                                     <input 
                                        type="checkbox" 
                                        checked={selectedLeadIds.includes(lead.id)}
                                        onChange={() => toggleSelectLead(lead.id)}
                                        className="rounded-full size-5 border-slate-300 text-primary focus:ring-primary cursor-pointer" 
                                    />
                                </div>

                                <div className="flex items-start gap-4">
                                    <Avatar src={lead.avatar} name={lead.name} className="size-12 shadow-sm text-lg" detail={lead} />
                                    <div className="flex-1 min-w-0 pt-1">
                                        <h3 className="font-bold text-slate-900 dark:text-white truncate pr-6">{lead.name}</h3>
                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                            <span className="material-symbols-outlined text-[14px]">public</span>
                                            {lead.source}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                        lead.status === 'new' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                        lead.status === 'ready' ? 'bg-green-50 text-green-600 border-green-100' :
                                        'bg-gray-50 text-gray-600 border-gray-100'
                                    }`}>
                                        {getColumnTitle(lead.status)}
                                    </span>
                                    {lead.targetLevel && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-purple-50 text-purple-600 border-purple-100">
                                            {lead.targetLevel}
                                        </span>
                                    )}
                                    {getModeBadge(lead.learningMode)}
                                </div>

                                <div className="space-y-2 py-3 border-t border-b border-slate-50 dark:border-slate-800">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                        <span className="material-symbols-outlined text-[16px] text-slate-400">call</span>
                                        {lead.phone ? (
                                            <a 
                                                href={`tel:${lead.phone.replace(/\D/g, '')}`} 
                                                onClick={(e) => e.stopPropagation()} 
                                                className="hover:text-primary transition-colors"
                                            >
                                                {lead.phone}
                                            </a>
                                        ) : 'Chưa cập nhật'}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                        <span className="material-symbols-outlined text-[16px] text-slate-400">mail</span>
                                        <span className="truncate">{lead.email || 'Chưa cập nhật'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-auto">
                                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                                        {lead.lastActivity}
                                    </span>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleConvert(lead); }}
                                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 hover:text-green-700 transition-colors"
                                            title="Xếp lớp"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">school</span>
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleViewDetail(lead); }}
                                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-primary transition-colors"
                                            title="Chi tiết"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </>
        )}
      </div>

      {isConvertModalOpen && selectedLead && (
        <ConvertModal lead={selectedLead} onClose={() => setIsConvertModalOpen(false)} />
      )}
      {isAddLeadModalOpen && (
        <AddLeadModal onClose={() => setIsAddLeadModalOpen(false)} />
      )}
      {isBulkEnrollOpen && (
        <BulkEnrollModal 
            leads={sortedLeads.filter(l => selectedLeadIds.includes(l.id))}
            onClose={() => setIsBulkEnrollOpen(false)}
            onConfirm={() => {
                alert('Đã xếp lớp thành công!');
                setIsBulkEnrollOpen(false);
                setSelectedLeadIds([]);
            }}
        />
      )}
      {leadForDetail && (
        <StudentDetailsModal 
            data={leadForDetail} 
            onClose={() => setLeadForDetail(null)}
            onSave={() => { alert('Đã cập nhật thông tin Lead!'); setLeadForDetail(null); }}
            onDelete={() => { 
                if (hasPermission('delete_data')) {
                    alert('Đã xóa Lead!'); 
                    setLeadForDetail(null); 
                } else {
                    alert('Bạn không có quyền xóa dữ liệu này.');
                }
            }}
        />
      )}
    </div>
  );
};

export default LeadsKanban;
