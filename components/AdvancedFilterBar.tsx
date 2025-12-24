
import React, { useState, useEffect, useMemo } from 'react';
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
  className = ''
}) => {
  const { classes, globalDateFilter, setGlobalDateFilter } = useData();
  
  // -- Global Date State --
  // We initialize local state from global context
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
    
    // Update Global Context
    setGlobalDateFilter({ preset, startDate: s, endDate: e });
  };

  const handleCustomDateChange = (type: 'start' | 'end', val: string) => {
      const newPreset = 'custom';
      setTimePreset(newPreset);
      if (type === 'start') setStartDate(val);
      else setEndDate(val);
      
      // Update Global Context
      setGlobalDateFilter({ 
          preset: newPreset, 
          startDate: type === 'start' ? val : startDate, 
          endDate: type === 'end' ? val : endDate 
      });
  };

  // -- Compare Logic --
  const comparePeriod = useMemo(() => {
      if (!startDate || !endDate) return { start: '', end: '' };
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const duration = end.getTime() - start.getTime();
      
      const prevEnd = new Date(start.getTime() - 86400000); // 1 day before start
      const prevStart = new Date(prevEnd.getTime() - duration);
      
      return {
          start: prevStart.toISOString().split('T')[0],
          end: prevEnd.toISOString().split('T')[0]
      };
  }, [startDate, endDate]);

  // -- Emit Changes --
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
      applyPreset('this_year'); // Reset to default global state logic
      setIsCompare(false);
      setSource('all');
      setClassType('all');
      setClassId('all');
      setStatus('all');
  };

  return (
    <div className={`sticky top-0 z-20 bg-white dark:bg-[#1a202c] border-b border-slate-200 dark:border-slate-800 shadow-sm px-4 py-3 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between ${className}`}>
        
        {/* Left: Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            
            {showDate && (
                <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-primary dark:text-blue-400">
                            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                        </span>
                        <select 
                            value={timePreset}
                            onChange={(e) => applyPreset(e.target.value)}
                            className="bg-transparent border-none text-xs font-bold text-primary dark:text-blue-300 focus:ring-0 cursor-pointer py-2 pl-8 pr-8 appearance-none"
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
                <label className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${isCompare ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300' : 'border-dashed border-slate-300 hover:border-slate-400 text-slate-500'}`}>
                    <input 
                        type="checkbox" 
                        checked={isCompare}
                        onChange={(e) => setIsCompare(e.target.checked)}
                        className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 size-3.5"
                    />
                    <span className="text-xs font-bold whitespace-nowrap">So sánh</span>
                </label>
            )}

            {/* Separator if filters exist */}
            {(showSource || showClassType || showClass || showStatus) && (
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden xl:block"></div>
            )}

            {showSource && (
                <select 
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-white focus:ring-primary focus:border-primary pl-2 pr-7 cursor-pointer shadow-sm hover:border-primary/50"
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
                    className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-white focus:ring-primary focus:border-primary pl-2 pr-7 cursor-pointer shadow-sm hover:border-primary/50"
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
                    className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-white focus:ring-primary focus:border-primary pl-2 pr-7 cursor-pointer shadow-sm max-w-[150px] hover:border-primary/50"
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
                    className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-white focus:ring-primary focus:border-primary pl-2 pr-7 cursor-pointer shadow-sm hover:border-primary/50"
                >
                    <option value="all">Trạng thái: Tất cả</option>
                    {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            )}

            <button 
                onClick={handleClear}
                className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 rounded transition-colors whitespace-nowrap flex items-center gap-1"
                title="Đặt lại bộ lọc"
            >
                <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                Xóa lọc
            </button>
        </div>
    </div>
  );
};

export default AdvancedFilterBar;
