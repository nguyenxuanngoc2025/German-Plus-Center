import React, { useState, useMemo, useEffect } from 'react';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { 
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

const Reports: React.FC = () => {
  const { finance, leads, students, classes } = useData();
  const [reportType, setReportType] = useState<'revenue' | 'marketing' | 'operations'>('revenue');
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year' | 'all'>('month');
  const [filterClass, setFilterClass] = useState('');
  const [filterStaff, setFilterStaff] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock Loading
  useEffect(() => {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
  }, [reportType, timeRange, filterClass, filterStaff]);

  // --- DATA CALCULATIONS ---

  // 1. Revenue Data
  const revenueData = useMemo(() => {
      const groupedData: Record<string, { income: number, expense: number }> = {};
      const sortedFinance = [...finance].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      sortedFinance.forEach(record => {
          const d = new Date(record.date);
          let key = '';
          if (timeRange === 'year') key = `T${d.getMonth() + 1}/${d.getFullYear()}`;
          else if (timeRange === 'quarter') key = `Q${Math.floor(d.getMonth()/3) + 1}/${d.getFullYear()}`;
          else key = `${d.getDate()}/${d.getMonth() + 1}`; // Default daily for month view

          if (!groupedData[key]) groupedData[key] = { income: 0, expense: 0 };
          if (record.type === 'income') groupedData[key].income += record.amount;
          else groupedData[key].expense += record.amount;
      });

      return Object.keys(groupedData).map(key => ({
          name: key,
          income: groupedData[key].income,
          expense: groupedData[key].expense,
          profit: groupedData[key].income - groupedData[key].expense
      }));
  }, [finance, timeRange]);

  const totalRevenue = revenueData.reduce((acc, d) => acc + d.income, 0);
  const totalExpense = revenueData.reduce((acc, d) => acc + d.expense, 0);
  const netProfit = totalRevenue - totalExpense;

  // 2. Marketing Data
  const marketingStats = useMemo(() => {
      const totalLeads = leads.length;
      const convertedLeads = leads.filter(l => l.status === 'ready' || l.status === 'closed').length;
      const failedLeads = leads.filter(l => l.status === 'fail').length;
      
      const statusDistribution = [
          { name: 'Mới', value: leads.filter(l => l.status === 'new').length, color: '#60A5FA' },
          { name: 'Đang tư vấn', value: leads.filter(l => l.status === 'consulting' || l.status === 'trial').length, color: '#FBBF24' },
          { name: 'Chốt', value: convertedLeads, color: '#34D399' },
          { name: 'Fail', value: failedLeads, color: '#EF4444' }
      ].filter(d => d.value > 0);

      // Fail Reasons Mock Aggregation
      const failReasons: Record<string, number> = {};
      leads.filter(l => l.status === 'fail').forEach(l => {
          const r = l.failReason || 'Khác';
          failReasons[r] = (failReasons[r] || 0) + 1;
      });
      const failReasonData = Object.keys(failReasons).map(r => ({ name: r, value: failReasons[r] }));

      return {
          total: totalLeads,
          conversionRate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0,
          statusData: statusDistribution,
          failData: failReasonData
      };
  }, [leads]);

  // 3. Operations Data
  const operationsStats = useMemo(() => {
      const activeStudents = students.filter(s => s.status === 'active').length;
      // Mock calculation for attendance
      const totalSessions = students.reduce((acc, s) => acc + (s.attendanceHistory?.length || 0), 0);
      const presentSessions = students.reduce((acc, s) => acc + (s.attendanceHistory?.filter(a => a.status === 'present').length || 0), 0);
      const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

      return {
          activeStudents,
          attendanceRate,
          totalClasses: classes.length,
          activeClasses: classes.filter(c => c.status === 'active').length
      };
  }, [students, classes]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);

  const handleExport = (format: 'pdf' | 'excel') => {
      alert(`Đang xuất báo cáo ${reportType.toUpperCase()} dưới dạng ${format.toUpperCase()}...\n\nDữ liệu sẽ được tải xuống trong giây lát.`);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-background-light dark:bg-background-dark font-display">
      <Header title="Báo cáo & Thống kê" />
      
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
            
            {/* 1. Global Filter Bar */}
            <div className="bg-white dark:bg-[#1a202c] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                    {/* Report Type Switcher */}
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                        {[
                            { id: 'revenue', label: 'Doanh thu & Lợi nhuận', icon: 'payments' },
                            { id: 'marketing', label: 'Marketing & Sales', icon: 'campaign' },
                            { id: 'operations', label: 'Vận hành & Giáo vụ', icon: 'school' }
                        ].map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setReportType(type.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${
                                    reportType === type.id 
                                    ? 'bg-white dark:bg-slate-600 text-primary dark:text-white shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">{type.icon}</span>
                                <span className="hidden md:inline">{type.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="h-10 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

                    {/* Time Range */}
                    <select 
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as any)}
                        className="h-10 pl-3 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-primary cursor-pointer"
                    >
                        <option value="month">Tháng này</option>
                        <option value="quarter">Quý này</option>
                        <option value="year">Năm nay</option>
                        <option value="all">Toàn thời gian</option>
                    </select>

                    {/* Context Filters */}
                    <select 
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                        className="h-10 pl-3 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-primary cursor-pointer"
                    >
                        <option value="">Tất cả Lớp/Cơ sở</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div className="flex items-center gap-2 self-end xl:self-auto">
                    <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg text-sm font-bold transition-colors">
                        <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                        PDF
                    </button>
                    <button onClick={() => handleExport('excel')} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 rounded-lg text-sm font-bold transition-colors">
                        <span className="material-symbols-outlined text-[18px]">table_view</span>
                        Excel
                    </button>
                </div>
            </div>

            {/* 2. Report Content */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* REVENUE REPORT */}
                    {reportType === 'revenue' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white dark:bg-[#1a202c] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <p className="text-slate-500 text-xs font-bold uppercase">Tổng doanh thu</p>
                                    <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(totalRevenue)}</h3>
                                </div>
                                <div className="bg-white dark:bg-[#1a202c] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <p className="text-slate-500 text-xs font-bold uppercase">Tổng chi phí</p>
                                    <h3 className="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-1">{formatCurrency(totalExpense)}</h3>
                                </div>
                                <div className="bg-white dark:bg-[#1a202c] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <p className="text-slate-500 text-xs font-bold uppercase">Lợi nhuận ròng</p>
                                    <h3 className={`text-2xl font-extrabold mt-1 ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>{formatCurrency(netProfit)}</h3>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#1a202c] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-[400px]">
                                <h4 className="font-bold text-slate-800 dark:text-white mb-6">Biểu đồ Tăng trưởng Tài chính</h4>
                                <ResponsiveContainer width="100%" height="90%">
                                    <LineChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} tick={{fontSize: 12, fill: '#64748b'}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} tickFormatter={(val) => `${val/1000000}tr`} />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} 
                                            formatter={(val: number) => formatCurrency(val)}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="income" name="Doanh thu" stroke="#10b981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                                        <Line type="monotone" dataKey="expense" name="Chi phí" stroke="#ef4444" strokeWidth={3} dot={{r: 4}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}

                    {/* MARKETING REPORT */}
                    {reportType === 'marketing' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white dark:bg-[#1a202c] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <p className="text-slate-500 text-xs font-bold uppercase">Tổng Lead thu được</p>
                                    <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{marketingStats.total}</h3>
                                </div>
                                <div className="bg-white dark:bg-[#1a202c] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <p className="text-slate-500 text-xs font-bold uppercase">Tỷ lệ chuyển đổi</p>
                                    <h3 className="text-3xl font-extrabold text-green-600 dark:text-green-400 mt-1">{marketingStats.conversionRate}%</h3>
                                    <div className="w-full bg-green-100 h-1.5 rounded-full mt-2 overflow-hidden">
                                        <div className="bg-green-600 h-full" style={{width: `${marketingStats.conversionRate}%`}}></div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-[#1a202c] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <p className="text-slate-500 text-xs font-bold uppercase">Chi phí / Lead (Ước tính)</p>
                                    <h3 className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">45.000đ</h3>
                                    <p className="text-xs text-slate-400 mt-1">* Dựa trên ngân sách Marketing</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-[#1a202c] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-[350px]">
                                    <h4 className="font-bold text-slate-800 dark:text-white mb-4">Phân bổ Trạng thái Lead</h4>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={marketingStats.statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                {marketingStats.statusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="bg-white dark:bg-[#1a202c] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-[350px]">
                                    <h4 className="font-bold text-slate-800 dark:text-white mb-4">Lý do Thất bại (Fail Reasons)</h4>
                                    {marketingStats.failData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={marketingStats.failData} layout="vertical" margin={{left: 20}}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} />
                                                <Tooltip />
                                                <Bar dataKey="value" fill="#EF4444" radius={[0, 4, 4, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-slate-400 italic">Chưa có dữ liệu Fail.</div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* OPERATIONS REPORT */}
                    {reportType === 'operations' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-white dark:bg-[#1a202c] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <p className="text-slate-500 text-xs font-bold uppercase">Học viên Active</p>
                                    <h3 className="text-3xl font-extrabold text-blue-600 mt-1">{operationsStats.activeStudents}</h3>
                                </div>
                                <div className="bg-white dark:bg-[#1a202c] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <p className="text-slate-500 text-xs font-bold uppercase">Tỷ lệ Chuyên cần</p>
                                    <h3 className={`text-3xl font-extrabold mt-1 ${operationsStats.attendanceRate > 80 ? 'text-green-600' : 'text-orange-500'}`}>{operationsStats.attendanceRate}%</h3>
                                </div>
                                <div className="bg-white dark:bg-[#1a202c] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <p className="text-slate-500 text-xs font-bold uppercase">Số lớp đang chạy</p>
                                    <h3 className="text-3xl font-extrabold text-purple-600 mt-1">{operationsStats.activeClasses}</h3>
                                </div>
                                <div className="bg-white dark:bg-[#1a202c] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <p className="text-slate-500 text-xs font-bold uppercase">Giáo viên</p>
                                    <h3 className="text-3xl font-extrabold text-slate-700 dark:text-white mt-1">8</h3>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                                    <h4 className="font-bold text-slate-800 dark:text-white">Hiệu suất Lớp học</h4>
                                </div>
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-bold text-xs">
                                        <tr>
                                            <th className="px-6 py-3">Tên lớp</th>
                                            <th className="px-6 py-3">Giáo viên</th>
                                            <th className="px-6 py-3 text-center">Sĩ số</th>
                                            <th className="px-6 py-3 text-center">Tiến độ</th>
                                            <th className="px-6 py-3 text-center">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {classes.map(cls => (
                                            <tr key={cls.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">{cls.name}</td>
                                                <td className="px-6 py-3">{cls.teacher}</td>
                                                <td className="px-6 py-3 text-center">{cls.students}/{cls.maxStudents}</td>
                                                <td className="px-6 py-3">
                                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                                        <div className="bg-primary h-full" style={{width: `${cls.progress}%`}}></div>
                                                    </div>
                                                    <p className="text-[10px] text-center mt-1 text-slate-500">{cls.progress}%</p>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${cls.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                        {cls.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default Reports;