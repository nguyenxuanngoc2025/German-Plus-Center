
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import AdvancedFilterBar, { FilterState } from '../components/AdvancedFilterBar';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    Legend, Cell
} from 'recharts';
import FinanceDrillDownModal from '../components/FinanceDrillDownModal';
import StatCard from '../components/StatCard';

type DrillState = {
    type: 'debt' | 'projected' | 'month_detail' | 'audit' | 'revenue_source';
    dataContext?: any;
} | null;

const FinanceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { finance, tuition, students, classes, currentUser, discrepancies, reconcileData, calculateFinancials } = useData();
  
  // --- FILTER STATE ---
  const [filters, setFilters] = useState<FilterState>({
      startDate: '', endDate: '', compareDateStart: '', compareDateEnd: '', isCompare: false,
      source: 'all', classType: 'all', classId: 'all', status: 'all'
  });

  const [drillDown, setDrillDown] = useState<DrillState>(null);
  
  // Integrity Sync State
  const [isSyncing, setIsSyncing] = useState(false);

  // --- HELPER: DATE LOGIC ---
  const dateRange = useMemo(() => {
      // If start/end dates are provided by FilterBar, use them. Otherwise use full range.
      return { 
          start: filters.startDate ? new Date(filters.startDate) : undefined, 
          end: filters.endDate ? new Date(filters.endDate) : undefined 
      };
  }, [filters.startDate, filters.endDate]);

  // --- USE CENTRALIZED CALCULATION ---
  const stats = useMemo(() => {
      return calculateFinancials(dateRange.start, dateRange.end);
  }, [dateRange, calculateFinancials, finance, tuition]);

  // --- CHART DATA PREPARATION ---
  const chartData = useMemo(() => {
      const filteredFinance = finance.filter(f => {
          if (!dateRange.start || !dateRange.end) return true;
          const d = new Date(f.date);
          const end = new Date(dateRange.end);
          end.setHours(23, 59, 59);
          return d >= dateRange.start && d <= end;
      });

      const dataMap: Record<string, { income: number, expense: number }> = {};
      
      const getLabel = (dateStr: string) => {
          const date = new Date(dateStr);
          const rangeDays = dateRange.start && dateRange.end 
            ? (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 3600 * 24) 
            : 365;

          if (rangeDays > 32) return `T${date.getMonth() + 1}`;
          return `${date.getDate()}/${date.getMonth() + 1}`;
      };

      filteredFinance.forEach(f => {
          const label = getLabel(f.date);
          if (!dataMap[label]) dataMap[label] = { income: 0, expense: 0 };
          if (f.type === 'income') dataMap[label].income += f.amount;
          else dataMap[label].expense += f.amount;
      });

      return Object.keys(dataMap).map(label => ({
          name: label,
          income: dataMap[label].income,
          expense: dataMap[label].expense,
          profit: dataMap[label].income - dataMap[label].expense
      })).sort((a,b) => {
          const extractNum = (s: string) => parseInt(s.replace(/\D/g, ''));
          if (a.name.includes('/') && b.name.includes('/')) {
              const [d1, m1] = a.name.split('/').map(Number);
              const [d2, m2] = b.name.split('/').map(Number);
              return m1 - m2 || d1 - d2;
          }
          return extractNum(a.name) - extractNum(b.name); 
      });
  }, [finance, dateRange]);

  const formatCurrency = (val: number) => {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);
  };

  // --- HANDLERS ---
  const handleDebtClick = () => {
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
      <div className="md:hidden">
          <Header title="Trung tâm Tài chính" />
      </div>
      
      <AdvancedFilterBar 
        title="Dashboard Tài chính"
        subtitle="Tổng hợp dòng tiền & Công nợ"
        onFilterChange={setFilters}
        showClass={true}
        showCompare={true}
        className="border-b border-slate-200 dark:border-slate-700"
        actions={
            <div className="flex justify-end gap-2">
                <button onClick={() => setDrillDown({ type: 'audit' })} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-sm h-9 whitespace-nowrap">
                    <span className="material-symbols-outlined text-[18px]">fact_check</span>
                    Đối soát
                </button>
                <button className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-dark transition-colors shadow-md shadow-primary/20 flex items-center gap-2 h-9 whitespace-nowrap">
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Báo cáo
                </button>
            </div>
        }
      />

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

            {/* 2. EXECUTIVE SCORECARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard 
                    label="Tổng Doanh thu"
                    value={formatCurrency(stats.revenue)}
                    icon="payments"
                    color="green"
                    tooltip="Doanh thu thực tế (Cash-in) trong kỳ báo cáo."
                    subtext="Đã thực thu trong kỳ"
                />
                <StatCard 
                    label="Tổng Chi phí"
                    value={formatCurrency(stats.expense)}
                    icon="trending_down"
                    color="red"
                    tooltip="Tổng chi phí hoạt động (lương, điện nước, MKT...) trong kỳ."
                    subtext="Đã thực chi trong kỳ"
                />
                <StatCard 
                    label="Phải thu (Công nợ)"
                    value={formatCurrency(stats.debt)}
                    icon="pending_actions"
                    color="orange"
                    tooltip="Tổng số tiền học phí học viên còn nợ tính đến hiện tại."
                    subtext="Tổng nợ hiện tại (Click để xem)"
                    onClick={handleDebtClick}
                />
                <StatCard 
                    label="Lợi nhuận dự kiến"
                    value={formatCurrency(stats.profit + stats.debt)}
                    icon="account_balance_wallet"
                    color="blue"
                    tooltip="Lợi nhuận ước tính = (Thực thu + Công nợ) - Thực chi."
                    subtext="(Thu + Nợ) - Chi"
                />
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
