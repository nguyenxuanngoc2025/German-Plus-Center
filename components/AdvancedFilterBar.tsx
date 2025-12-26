
import React, { useState, useEffect, useMemo, ReactNode } from 'react';
import { useData } from '../context/DataContext';

export interface FilterState {
  startDate: string;
  endDate: string;
  compareDateStart: string;
  compareDateEnd: string;
  isCompare: boolean;
  source: string;
  classType: string;
  classId: string;
  status: string;
}

interface Props {
  onFilterChange: (state: FilterState) => void;
  // Feature Flags
  showDate?: boolean;
  showCompare?: boolean;
  showSource?: boolean;
  showClassType?: boolean;
  showClass?: boolean;
  showStatus?: boolean;
  // Configuration
  statusOptions?: { label: string; value: string }[];
  className?: string;
  // Unified Header Props
  title?: string;
  subtitle?: string;
  children?: ReactNode; // Middle Content (Tabs or Search)
  actions?: ReactNode;  // Right Actions (Buttons)
}

const AdvancedFilterBar: React.FC<Props> = ({
  onFilterChange,
  showDate = true,
  showCompare = false,
  showSource = false,
  showClassType = false,
  showClass = false,
  showStatus = false,
  statusOptions = [],
  className = '',
  title,
  subtitle,
  children,
  actions
}) => {
  const { classes, globalDateFilter, setGlobalDateFilter } = useData();
  
  // -- Global Date State --
  const [timePreset, setTimePreset] = useState(globalDateFilter.preset);
  const [startDate, setStartDate] = useState(globalDateFilter.startDate);
  const [endDate, setEndDate] = useState(globalDateFilter.endDate);

  // -- Local Filter State --
  const [isCompare, setIsCompare] = useState(false);
  const [source, setSource] = useState('all');
  const [classType, setClassType] = useState('all');
  const [classId, setClassId] = useState('all');
  const [status, setStatus] = useState('all');

  // -- Sync with Global Context changes --
  useEffect(() => {
      if (globalDateFilter.preset !== timePreset) {
          setTimePreset(globalDateFilter.preset);
          setStartDate(globalDateFilter.startDate);
          setEndDate(globalDateFilter.endDate);
      }
  }, [globalDateFilter]);

  const applyPreset = (preset: string) => {
    setTimePreset(preset);
    const now = new Date();
    let start = new Date();
    let end = new Date();

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'all') {
        start = new Date(2020, 0, 1);
        end = new Date(2030, 11, 31);
    } else {
        switch(preset) {
            case 'today':
                start = new Date();
                end = new Date();
                break;
            case 'yesterday':
                start.setDate(now.getDate() - 1);
                end.setDate(now.getDate() - 1);
                break;
            case 'last_7_days':
                start.setDate(now.getDate() - 7);
                break;
            case 'last_30_days':
                start.setDate(now.getDate() - 30);
                break;
            case 'this_month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'last_month':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'this_quarter':
                const q = Math.floor(now.getMonth() / 3);
                start = new Date(now.getFullYear(), q * 3, 1);
                end = new Date(now.getFullYear(), q * 3 + 3, 0);
                break;
            case 'this_year':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31);
                break;
        }
    }
    
    const s = formatDate(start);
    const e = formatDate(end);
    
    setStartDate(s);
    setEndDate(e);
    
    setGlobalDateFilter({ preset, startDate: s, endDate: e });
  };

  const handleCustomDateChange = (type: 'start' | 'end', val: string) => {
      const newPreset = 'custom';
      setTimePreset(newPreset);
      if (type === 'start') setStartDate(val);
      else setEndDate(val);
      
      setGlobalDateFilter({ 
          preset: newPreset, 
          startDate: type === 'start' ? val : startDate, 
          endDate: type === 'end' ? val : endDate 
      });
  };

  const comparePeriod = useMemo(() => {
      if (!startDate || !endDate) return { start: '', end: '' };
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const duration = end.getTime() - start.getTime();
      
      const prevEnd = new Date(start.getTime() - 86400000); 
      const prevStart = new Date(prevEnd.getTime() - duration);
      
      return {
          start: prevStart.toISOString().split('T')[0],
          end: prevEnd.toISOString().split('T')[0]
      };
  }, [startDate, endDate]);

  useEffect(() => {
      onFilterChange({
          startDate,
          endDate,
          compareDateStart: comparePeriod.start,
          compareDateEnd: comparePeriod.end,
          isCompare,
          source,
          classType,
          classId,
          status
      });
  }, [startDate, endDate, isCompare, source, classType, classId, status]);

  const handleClear = () => {
      applyPreset('this_year'); 
      setIsCompare(false);
      setSource('all');
      setClassType('all');
      setClassId('all');
      setStatus('all');
  };

  return (
    <div className={`sticky top-0 z-20 bg-white dark:bg-[#1a202c] border-b border-slate-200 dark:border-slate-800 shadow-sm px-6 py-4 flex flex-col gap-3 ${className}`}>
        
        {/* ROW 1: Title Only */}
        {title && (
            <div className="flex items-center">
                <h1 className="text-[22px] font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                    {title}
                </h1>
            </div>
        )}

        {/* ROW 2: Subtitle/Tabs (Left) & Tools (Right) */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            
            {/* LEFT: Subtitle + Middle Content (Tabs/Search) */}
            <div className="flex flex-wrap items-center gap-4 flex-1 min-w-0">
                {subtitle && (
                    <p className="text-[13px] text-[#86868B] dark:text-slate-400 font-medium whitespace-nowrap">
                        {subtitle}
                    </p>
                )}
                
                {/* Vertical Divider if both Subtitle and Children exist */}
                {subtitle && children && (
                    <div className="hidden sm:block h-4 w-px bg-slate-300 dark:bg-slate-700"></div>
                )}

                {/* Tabs or Search Input */}
                <div className="flex-1 sm:flex-none">
                    {children}
                </div>
            </div>

            {/* RIGHT: Filters & Actions */}
            <div className="flex flex-wrap items-center gap-3 justify-end shrink-0">
                
                {/* Standard Filters */}
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar max-w-full">
                    {showDate && (
                        <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                            <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-primary dark:text-blue-400">
                                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                                </span>
                                <select 
                                    value={timePreset}
                                    onChange={(e) => applyPreset(e.target.value)}
                                    className="bg-transparent border-none text-xs font-bold text-primary dark:text-blue-300 focus:ring-0 cursor-pointer py-2 pl-8 pr-8 appearance-none w-[130px] sm:w-auto"
                                >
                                    <option value="today">Hôm nay</option>
                                    <option value="yesterday">Hôm qua</option>
                                    <option value="last_7_days">7 ngày qua</option>
                                    <option value="last_30_days">30 ngày qua</option>
                                    <option value="this_month">Tháng này</option>
                                    <option value="last_month">Tháng trước</option>
                                    <option value="this_quarter">Quý này</option>
                                    <option value="this_year">Năm nay</option>
                                    <option value="all">Toàn bộ</option>
                                    <option value="custom">Tùy chỉnh</option>
                                </select>
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-primary dark:text-blue-400 pointer-events-none">
                                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                                </span>
                            </div>
                            
                            <div className="h-5 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
                            
                            <div className="flex items-center gap-1 px-1">
                                <input 
                                    type="date" 
                                    value={startDate}
                                    onChange={(e) => handleCustomDateChange('start', e.target.value)}
                                    className="bg-transparent border-none p-0 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-0 w-[85px] cursor-pointer"
                                />
                                <span className="text-slate-400 font-bold">-</span>
                                <input 
                                    type="date" 
                                    value={endDate}
                                    onChange={(e) => handleCustomDateChange('end', e.target.value)}
                                    className="bg-transparent border-none p-0 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-0 w-[85px] cursor-pointer"
                                />
                            </div>
                        </div>
                    )}

                    {showDate && showCompare && (
                        <label className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors shrink-0 ${isCompare ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300' : 'border-dashed border-slate-300 hover:border-slate-400 text-slate-500'}`}>
                            <input 
                                type="checkbox" 
                                checked={isCompare}
                                onChange={(e) => setIsCompare(e.target.checked)}
                                className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 size-3.5"
                            />
                            <span className="text-xs font-bold whitespace-nowrap">So sánh</span>
                        </label>
                    )}

                    {(showSource || showClassType || showClass || showStatus) && (
                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden xl:block shrink-0"></div>
                    )}

                    {showSource && (
                        <select 
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                            className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-white focus:ring-primary focus:border-primary pl-2 pr-7 cursor-pointer shadow-sm hover:border-primary/50 shrink-0"
                        >
                            <option value="all">Nguồn: Tất cả</option>
                            <option value="Facebook">Facebook</option>
                            <option value="Website">Website</option>
                            <option value="Tiktok">TikTok</option>
                            <option value="Giới thiệu">Giới thiệu</option>
                            <option value="Vãng lai">Vãng lai</option>
                        </select>
                    )}

                    {showClassType && (
                        <select 
                            value={classType}
                            onChange={(e) => setClassType(e.target.value)}
                            className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-white focus:ring-primary focus:border-primary pl-2 pr-7 cursor-pointer shadow-sm hover:border-primary/50 shrink-0"
                        >
                            <option value="all">Loại hình: Tất cả</option>
                            <option value="online">Online</option>
                            <option value="offline">Offline</option>
                        </select>
                    )}

                    {showClass && (
                        <select 
                            value={classId}
                            onChange={(e) => setClassId(e.target.value)}
                            className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-white focus:ring-primary focus:border-primary pl-2 pr-7 cursor-pointer shadow-sm max-w-[150px] hover:border-primary/50 shrink-0"
                        >
                            <option value="all">Lớp học: Tất cả</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    )}

                    {showStatus && statusOptions.length > 0 && (
                        <select 
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-white focus:ring-primary focus:border-primary pl-2 pr-7 cursor-pointer shadow-sm hover:border-primary/50 shrink-0"
                        >
                            <option value="all">Trạng thái: Tất cả</option>
                            {statusOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    )}

                    {/* Clear Filter Button */}
                    {(isCompare || source !== 'all' || classType !== 'all' || classId !== 'all' || status !== 'all' || timePreset === 'custom') && (
                        <button 
                            onClick={handleClear}
                            className="size-9 flex items-center justify-center rounded-lg border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                            title="Xóa bộ lọc"
                        >
                            <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
                        </button>
                    )}
                </div>

                {/* Actions Seperator */}
                {actions && <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden xl:block shrink-0 mx-1"></div>}

                {/* Right-most Actions (Export, Add, etc) */}
                {actions && (
                    <div className="flex items-center gap-3 shrink-0">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default AdvancedFilterBar;
