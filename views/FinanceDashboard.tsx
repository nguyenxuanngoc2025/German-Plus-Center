
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    Legend, Cell
} from 'recharts';
import FinanceDrillDownModal from '../components/FinanceDrillDownModal';

type DrillState = {
    type: 'debt' | 'projected' | 'month_detail' | 'audit' | 'revenue_source';
    dataContext?: any;
} | null;

const FinanceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { finance, tuition, students, classes, currentUser, discrepancies, reconcileData, calculateFinancials } = useData();
  
  // --- FILTER STATE ---
  const [dateFilter, setDateFilter] = useState('this_month'); // this_month, last_month, this_quarter, this_year, all
  const [classFilter, setClassFilter] = useState('all');
  const [drillDown, setDrillDown] = useState<DrillState>(null);
  
  // Integrity Sync State
  const [isSyncing, setIsSyncing] = useState(false);

  // --- HELPER: DATE LOGIC ---
  const dateRange = useMemo(() => {
      const now = new Date();
      let start: Date | undefined;
      let end: Date | undefined;

      switch (dateFilter) {
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
          default:
              start = undefined;
              end = undefined;
      }
      return { start, end };
  }, [dateFilter]);

  // --- USE CENTRALIZED CALCULATION ---
  // Note: calculateFinancials already handles null dates as "All Time"
  const stats = useMemo(() => {
      return calculateFinancials(dateRange.start, dateRange.end);
  }, [dateRange, calculateFinancials, finance, tuition]);

  // --- CHART DATA PREPARATION ---
  const chartData = useMemo(() => {
      const filteredFinance = finance.filter(f => {
          if (!dateRange.start || !dateRange.end) return true;
          const d = new Date(f.date);
          return d >= dateRange.start && d <= dateRange.end;
      });

      // Group by Label based on filter
      const dataMap: Record<string, { income: number, expense: number }> = {};
      
      const getLabel = (dateStr: string) => {
          const date = new Date(dateStr);
          if (dateFilter === 'this_year') return `T${date.getMonth() + 1}`;
          return `${date.getDate()}/${date.getMonth() + 1}`;
      };

      // Fill Income & Expense
      filteredFinance.forEach(f => {
          const label = getLabel(f.date);
          if (!dataMap[label]) dataMap[label] = { income: 0, expense: 0 };
          if (f.type === 'income') dataMap[label].income += f.amount;
          else dataMap[label].expense += f.amount;
      });

      // Sort and Format
      return Object.keys(dataMap).map(label => ({
          name: label,
          income: dataMap[label].income,
          expense: dataMap[label].expense,
          profit: dataMap[label].income - dataMap[label].expense
      })).sort((a,b) => {
          // Simple sort logic assumption
          return a.name.localeCompare(b.name, undefined, { numeric: true }); 
      });
  }, [finance, dateFilter, dateRange]);

  const formatCurrency = (val: number) => {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);
  };

  // --- HANDLERS ---
  const handleDebtClick = () => {
      // Deep Link to Invoice List with "Debt" filter
      navigate('/finance/invoices', { state: { filter: 'debt' } });
  };

  const handleSyncData = async () => {
      setIsSyncing(true);
      const result = await reconcileData();
      setIsSyncing(false);
      if(result.success) {
          alert(`Đã đồng bộ thành công ${result.count} hồ sơ học viên!`);
      }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-[#f8fafc] dark:bg-[#0f172a] font-display">
      <Header title="Trung tâm Tài chính" />
      
      <main className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
        <div className="max-w-[1600px] mx-auto flex flex-col gap-8">
            
            {/* ALERT WIDGET: DATA INTEGRITY CHECK */}
            {discrepancies.length > 0 && (
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg flex items-center justify-between shadow-sm animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-full text-orange-600">
                            <span className="material-symbols-outlined animate-pulse">cloud_off</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-orange-800 text-sm">Phát hiện sai lệch dữ liệu</h3>
                            <p className="text-xs text-orange-700 mt-0.5">
                                Có <strong className="font-bold">{discrepancies.length} học viên</strong> có số dư thực tế không khớp với hồ sơ lưu trữ.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col text-right mr-4">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Mẫu sai lệch</span>
                            <span className="text-xs font-mono text-slate-700">
                                {discrepancies[0].studentName}: {formatCurrency(discrepancies[0].cached)} (Lưu) ≠ {formatCurrency(discrepancies[0].calculated)} (Thực)
                            </span>
                        </div>
                        <button 
                            onClick={handleSyncData}
                            disabled={isSyncing}
                            className={`px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all ${isSyncing ? 'opacity-75 cursor-wait' : ''}`}
                        >
                            {isSyncing ? (
                                <>
                                    <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[16px]">sync_problem</span>
                                    Đồng bộ lại
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* 1. UNIVERSAL FILTER BAR */}
            <div className="bg-white dark:bg-[#1a202c] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-4 sticky top-0 z-10">
                <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="material-symbols-outlined text-slate-500 text-[20px]">calendar_month</span>
                        <select 
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="bg-transparent border-none text-sm font-bold text-slate-700 dark:text-white focus:ring-0 cursor-pointer min-w-[100px]"
                        >
                            <option value="this_month">Tháng này</option>
                            <option value="last_month">Tháng trước</option>
                            <option value="this_quarter">Quý này</option>
                            <option value="this_year">Năm nay</option>
                            <option value="all">Toàn thời gian</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="material-symbols-outlined text-slate-500 text-[20px]">school</span>
                        <select 
                            value={classFilter}
                            onChange={(e) => setClassFilter(e.target.value)}
                            className="bg-transparent border-none text-sm font-bold text-slate-700 dark:text-white focus:ring-0 cursor-pointer min-w-[150px]"
                        >
                            <option value="all">Tất cả Lớp/Cơ sở</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex gap-2 w-full xl:w-auto justify-end">
                    <button onClick={() => setDrillDown({ type: 'audit' })} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-sm">
                        <span className="material-symbols-outlined text-[18px]">fact_check</span>
                        Đối soát quỹ
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors shadow-md shadow-primary/20 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Báo cáo
                    </button>
                </div>
            </div>

            {/* 2. EXECUTIVE SCORECARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {/* Revenue Card */}
                <div className="bg-white dark:bg-[#1a202c] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-[-10px] top-[-10px] p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
                    <div className="relative z-10">
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Tổng Doanh thu</p>
                        <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.revenue)}</h3>
                        <p className="text-xs text-slate-400 mt-1">Đã thực thu trong kỳ</p>
                    </div>
                    <div className="absolute bottom-4 right-4 p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                        <span className="material-symbols-outlined text-[24px]">payments</span>
                    </div>
                </div>

                {/* Expenses Card */}
                <div className="bg-white dark:bg-[#1a202c] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-[-10px] top-[-10px] p-6 bg-red-50 dark:bg-red-900/10 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
                    <div className="relative z-10">
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Tổng Chi phí</p>
                        <h3 className="text-2xl font-extrabold text-red-600 dark:text-red-400">{formatCurrency(stats.expense)}</h3>
                        <p className="text-xs text-slate-400 mt-1">Đã thực chi trong kỳ</p>
                    </div>
                    <div className="absolute bottom-4 right-4 p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg">
                        <span className="material-symbols-outlined text-[24px]">trending_down</span>
                    </div>
                </div>

                {/* Debt Card - CLICK TO NAVIGATE */}
                <div 
                    onClick={handleDebtClick}
                    className="bg-white dark:bg-[#1a202c] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group cursor-pointer hover:border-orange-300 transition-all ring-0 hover:ring-2 hover:ring-orange-100"
                >
                    <div className="absolute right-[-10px] top-[-10px] p-6 bg-orange-50 dark:bg-orange-900/10 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
                    <div className="relative z-10">
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Phải thu (Công nợ)</p>
                        <h3 className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">{formatCurrency(stats.debt)}</h3>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            Tổng nợ hiện tại
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </p>
                    </div>
                    <div className="absolute bottom-4 right-4 p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg">
                        <span className="material-symbols-outlined text-[24px]">pending_actions</span>
                    </div>
                </div>

                {/* Profit Card */}
                <div className="bg-white dark:bg-[#1a202c] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-[-10px] top-[-10px] p-6 bg-blue-50 dark:bg-blue-900/10 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
                    <div className="relative z-10">
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Lợi nhuận dự kiến</p>
                        <h3 className={`text-2xl font-extrabold ${stats.profit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'}`}>
                            {formatCurrency(stats.profit + stats.debt)}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">(Thu + Nợ) - Chi</p>
                    </div>
                    <div className="absolute bottom-4 right-4 p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                        <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
                    </div>
                </div>
            </div>

            {/* 3. COMPARATIVE CHART */}
            <div className="bg-white dark:bg-[#1a202c] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-[400px]">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tương quan Doanh thu & Chi phí</h3>
                        <p className="text-sm text-slate-500">Phân tích theo thời gian thực</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Doanh thu</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Chi phí</div>
                    </div>
                </div>
                
                <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#64748b', fontSize: 12}} 
                                dy={10} 
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#64748b', fontSize: 12}} 
                                tickFormatter={(val) => `${val/1000000}tr`} 
                            />
                            <Tooltip 
                                cursor={{fill: 'rgba(0,0,0,0.05)'}}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                formatter={(value: number) => new Intl.NumberFormat('vi-VN').format(value)}
                            />
                            <Bar dataKey="income" name="Doanh thu" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                            <Bar dataKey="expense" name="Chi phí" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
      </main>

      {/* DRILL DOWN MODAL */}
      {drillDown && (
          <FinanceDrillDownModal 
            type={drillDown.type}
            dataContext={drillDown.dataContext}
            onClose={() => setDrillDown(null)}
          />
      )}
    </div>
  );
};

export default FinanceDashboard;
