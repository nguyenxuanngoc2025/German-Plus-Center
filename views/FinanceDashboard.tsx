
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    Line, ComposedChart, Legend 
} from 'recharts';
import FinanceDrillDownModal from '../components/FinanceDrillDownModal';

type DrillState = {
    type: 'debt' | 'projected' | 'month_detail' | 'audit' | 'revenue_source';
    dataContext?: any;
} | null;

const FinanceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { finance, tuition, students, classes } = useData();
  
  // --- STATE ---
  const [drillDown, setDrillDown] = useState<DrillState>(null);
  const [filterPeriod, setFilterPeriod] = useState<'month' | 'quarter' | 'year'>('year');
  const [filterClass, setFilterClass] = useState('all');
  
  // --- CALCULATIONS (Aggregated) ---
  
  // 1. Debt (Total & Count)
  const debtStats = useMemo(() => {
      const pending = tuition.filter(t => t.remainingAmount > 0 && (t.status === 'unpaid' || t.status === 'partial' || t.status === 'overdue'));
      const total = pending.reduce((acc, t) => acc + t.remainingAmount, 0);
      const overdueCount = pending.filter(t => t.status === 'overdue' || new Date(t.dueDate) < new Date()).length;
      return { total, count: pending.length, overdueCount };
  }, [tuition]);

  // 2. Revenue (Actual & Projected)
  const revenueStats = useMemo(() => {
      const actual = finance.filter(f => f.type === 'income').reduce((acc, f) => acc + f.amount, 0);
      
      const today = new Date();
      const next30Days = new Date();
      next30Days.setDate(today.getDate() + 30);
      
      const projected = tuition
        .filter(t => t.remainingAmount > 0 && new Date(t.dueDate) >= today && new Date(t.dueDate) <= next30Days)
        .reduce((acc, t) => acc + t.remainingAmount, 0);

      return { actual, projected };
  }, [finance, tuition]);

  // 3. Chart Data (Monthly Income vs Expense)
  const chartData = useMemo(() => {
      const months = Array.from({length: 12}, (_, i) => i + 1);
      return months.map(m => {
          const monthKey = `T${m}`;
          const monthlyIncome = finance
            .filter(f => f.type === 'income' && new Date(f.date).getMonth() + 1 === m)
            .reduce((acc, f) => acc + f.amount, 0);
          const monthlyExpense = finance
            .filter(f => f.type === 'expense' && new Date(f.date).getMonth() + 1 === m)
            .reduce((acc, f) => acc + f.amount, 0);
          
          return {
              name: monthKey,
              income: monthlyIncome,
              expense: monthlyExpense,
              profit: monthlyIncome - monthlyExpense
          };
      });
  }, [finance]);

  // 4. Action Center Items
  const actionItems = useMemo(() => {
      const items = [];
      const today = new Date();

      // Overdue > 7 Days
      const overdue = tuition.filter(t => {
          if (t.remainingAmount <= 0) return false;
          const diffTime = Math.abs(today.getTime() - new Date(t.dueDate).getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          return new Date(t.dueDate) < today && diffDays > 7;
      });
      if (overdue.length > 0) {
          items.push({
              id: 'overdue',
              type: 'urgent',
              title: `${overdue.length} khoản thu quá hạn > 7 ngày`,
              subtitle: `Tổng giá trị: ${overdue.reduce((a,b)=>a+b.remainingAmount,0).toLocaleString()}đ`,
              actionLabel: 'Xử lý ngay',
              route: '/finance/invoices'
          });
      }

      // Partial Payments (Deposited but not full)
      const partials = tuition.filter(t => t.status === 'partial');
      if (partials.length > 0) {
          items.push({
              id: 'partial',
              type: 'warning',
              title: `${partials.length} học viên chưa hoàn tất học phí`,
              subtitle: 'Đã đặt cọc, cần thu nốt phần còn lại.',
              actionLabel: 'Xem danh sách',
              route: '/students' // Or filtered invoice list
          });
      }

      // Mock Refund Request
      items.push({
          id: 'refund',
          type: 'info',
          title: '1 Yêu cầu hoàn phí đang chờ duyệt',
          subtitle: 'HV: Nguyễn Văn C - Lý do: Đi du học sớm',
          actionLabel: 'Phê duyệt',
          route: '#'
      });

      return items;
  }, [tuition]);

  const formatCurrency = (val: number) => {
      if (val >= 1000000000) return (val / 1000000000).toFixed(1) + ' tỷ';
      if (val >= 1000000) return (val / 1000000).toFixed(1) + ' tr';
      return val.toLocaleString();
  };

  const handleChartClick = (data: any) => {
      if (data && data.activeLabel) {
          setDrillDown({ type: 'month_detail', dataContext: { month: data.activeLabel } });
      }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-[#f8fafc] dark:bg-[#0f172a] font-display">
      <Header title="Trung tâm Tài chính" />
      
      <main className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
        <div className="max-w-[1600px] mx-auto flex flex-col gap-8">
            
            {/* 1. CONTROL BAR & FILTERS */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dòng tiền & Hiệu quả kinh doanh</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Báo cáo thời gian thực • Cập nhật lúc {new Date().toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Period Filter */}
                    <div className="bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 flex shadow-sm">
                        <button onClick={() => setFilterPeriod('month')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filterPeriod === 'month' ? 'bg-primary text-white shadow' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Tháng</button>
                        <button onClick={() => setFilterPeriod('quarter')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filterPeriod === 'quarter' ? 'bg-primary text-white shadow' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Quý</button>
                        <button onClick={() => setFilterPeriod('year')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filterPeriod === 'year' ? 'bg-primary text-white shadow' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Năm</button>
                    </div>
                    {/* Class Filter */}
                    <select 
                        className="h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-primary cursor-pointer shadow-sm"
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                    >
                        <option value="all">Toàn hệ thống</option>
                        <option value="offline">Cơ sở 1 (Offline)</option>
                        <option value="online">Hệ thống Online</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {/* Audit Button */}
                    <button 
                        onClick={() => setDrillDown({ type: 'audit' })}
                        className="h-10 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-700 dark:text-slate-200 text-sm font-bold rounded-lg shadow-sm flex items-center gap-2 hover:text-primary transition-all"
                    >
                        <span className="material-symbols-outlined text-[18px]">account_balance</span>
                        Đối soát quỹ
                    </button>
                </div>
            </div>

            {/* 2. INTERACTIVE SCORECARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Debt Card */}
                <div 
                    onClick={() => setDrillDown({ type: 'debt' })}
                    className="bg-white dark:bg-[#1a202c] rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-red-300 transition-all cursor-pointer group relative overflow-hidden"
                >
                    <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-8xl text-red-500">warning</span>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg">
                                <span className="material-symbols-outlined text-[24px]">pending_actions</span>
                            </div>
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Tổng Công Nợ</span>
                        </div>
                        <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1 group-hover:text-red-600 transition-colors">
                            {debtStats.total.toLocaleString()} <span className="text-lg text-slate-400 font-medium">vnđ</span>
                        </h3>
                        <p className="text-sm text-slate-500">
                            Cần thu từ <span className="font-bold text-slate-800 dark:text-slate-200">{debtStats.count}</span> học viên
                            {debtStats.overdueCount > 0 && <span className="text-red-500 font-bold ml-1">({debtStats.overdueCount} quá hạn)</span>}
                        </p>
                    </div>
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs font-bold text-red-500">
                        Chi tiết <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </div>
                </div>

                {/* Projected Revenue Card */}
                <div 
                    onClick={() => setDrillDown({ type: 'projected' })}
                    className="bg-white dark:bg-[#1a202c] rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group relative overflow-hidden"
                >
                    <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-8xl text-blue-500">calendar_month</span>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                                <span className="material-symbols-outlined text-[24px]">event_upcoming</span>
                            </div>
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Dự kiến thu (30 ngày)</span>
                        </div>
                        <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
                            {revenueStats.projected.toLocaleString()} <span className="text-lg text-slate-400 font-medium">vnđ</span>
                        </h3>
                        <p className="text-sm text-slate-500">
                            Dòng tiền dự kiến về từ các khoản đến hạn
                        </p>
                    </div>
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs font-bold text-blue-500">
                        Lịch thu <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </div>
                </div>

                {/* Actual Revenue Card */}
                <div 
                    onClick={() => setDrillDown({ type: 'revenue_source' })}
                    className="bg-white dark:bg-[#1a202c] rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer group relative overflow-hidden"
                >
                    <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-8xl text-emerald-500">payments</span>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg">
                                <span className="material-symbols-outlined text-[24px]">attach_money</span>
                            </div>
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Doanh thu Thực tế</span>
                        </div>
                        <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1 group-hover:text-emerald-600 transition-colors">
                            {revenueStats.actual.toLocaleString()} <span className="text-lg text-slate-400 font-medium">vnđ</span>
                        </h3>
                        <p className="text-sm text-slate-500">
                            Tổng thu nhập đã ghi nhận trong năm nay
                        </p>
                    </div>
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs font-bold text-emerald-500">
                        Phân bổ <span className="material-symbols-outlined text-[14px]">pie_chart</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* 3. CASH FLOW CHART (Interactive) */}
                <div className="xl:col-span-2 bg-white dark:bg-[#1a202c] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Biểu đồ Dòng tiền (Thu/Chi)</h3>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#3b82f6]"></span> Thu</span>
                            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#f43f5e]"></span> Chi</span>
                            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-500"></span> Lợi nhuận</span>
                        </div>
                    </div>
                    <div className="flex-1 min-h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} onClick={handleChartClick} style={{cursor: 'pointer'}}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `${val/1000000}tr`} />
                                <Tooltip 
                                    cursor={{fill: 'rgba(0,0,0,0.05)'}}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(value: number) => new Intl.NumberFormat('vi-VN').format(value) + ' đ'}
                                />
                                <Bar dataKey="income" name="Doanh thu" barSize={20} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expense" name="Chi phí" barSize={20} fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="profit" name="Lợi nhuận ròng" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-4 italic">
                        * Click vào cột tháng bất kỳ để xem chi tiết giao dịch
                    </p>
                </div>

                {/* 4. ACTION CENTER (Vấn đề cần giải quyết) */}
                <div className="bg-white dark:bg-[#1a202c] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-red-50/50 dark:bg-red-900/10 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                            <span className="material-symbols-outlined">notification_important</span>
                            <h3 className="font-bold text-sm uppercase tracking-wide">Vấn đề cần xử lý</h3>
                        </div>
                        <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{actionItems.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                        {actionItems.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                                <span className="material-symbols-outlined text-4xl mb-2 text-green-500">task_alt</span>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Tuyệt vời! Không có vấn đề tồn đọng.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {actionItems.map((item, idx) => (
                                    <div key={idx} className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex gap-2">
                                                {item.type === 'urgent' && <span className="size-2 mt-1.5 rounded-full bg-red-500 shrink-0"></span>}
                                                {item.type === 'warning' && <span className="size-2 mt-1.5 rounded-full bg-orange-500 shrink-0"></span>}
                                                {item.type === 'info' && <span className="size-2 mt-1.5 rounded-full bg-blue-500 shrink-0"></span>}
                                                <h4 className="font-bold text-sm text-slate-800 dark:text-white leading-tight">{item.title}</h4>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 pl-4 mb-3">{item.subtitle}</p>
                                        <div className="pl-4">
                                            <button 
                                                onClick={() => navigate(item.route)}
                                                className="text-xs font-bold text-white bg-slate-900 dark:bg-primary px-3 py-1.5 rounded-lg shadow-sm hover:shadow hover:-translate-y-0.5 transition-all flex items-center gap-1 w-fit"
                                            >
                                                {item.actionLabel}
                                                <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
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
