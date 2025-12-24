
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import AddLeadModal from '../components/AddLeadModal';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend, BarChart, Bar 
} from 'recharts';

type TimeFilter = 'today' | 'this_week' | 'this_month' | 'this_quarter' | 'this_year';
type DashboardTab = 'finance' | 'marketing' | 'academic';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { students, leads, finance, classes, tuition, currentUser, calculateFinancials } = useData();
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- STATE ---
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('this_month');
  const [activeTab, setActiveTab] = useState<DashboardTab>('finance');

  // Trigger loading effect when filter or tab changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, [timeFilter, activeTab]);

  // --- 1. GLOBAL TIME FILTER LOGIC ---
  const { start: currentStart, end: currentEnd } = useMemo(() => {
      const now = new Date();
      let start = new Date();
      let end = new Date();

      switch(timeFilter) {
          case 'today':
              start = new Date(now.setHours(0,0,0,0));
              end = new Date(now.setHours(23,59,59,999));
              break;
          case 'this_week':
              const day = now.getDay() || 7; 
              if(day !== 1) start.setHours(-24 * (day - 1)); 
              start.setHours(0,0,0,0);
              end = now;
              break;
          case 'this_month':
              start = new Date(now.getFullYear(), now.getMonth(), 1);
              end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
              break;
          case 'this_quarter':
              const currQuarter = Math.floor(now.getMonth() / 3);
              start = new Date(now.getFullYear(), currQuarter * 3, 1);
              end = new Date(now.getFullYear(), currQuarter * 3 + 3, 0);
              break;
          case 'this_year':
              start = new Date(now.getFullYear(), 0, 1);
              end = new Date(now.getFullYear(), 11, 31);
              break;
      }
      return { start, end };
  }, [timeFilter]);

  // --- 2. AGGREGATED DATA CALCULATIONS ---

  // Helper: Filter data by date range
  const filterByDate = (data: any[], dateField: string) => {
      return data.filter(item => {
          const d = new Date(item[dateField]);
          return d >= currentStart && d <= currentEnd;
      });
  };

  // FINANCE DATA
  const finStats = useMemo(() => calculateFinancials(currentStart, currentEnd), [currentStart, currentEnd, calculateFinancials]);
  
  // Trend Chart Data (Finance)
  const financeTrendData = useMemo(() => {
      const data: any[] = [];
      const labels = timeFilter === 'this_year' 
          ? ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']
          : ['W1', 'W2', 'W3', 'W4']; // Simplified for month
      
      labels.forEach((lbl, idx) => {
          // Mock distribution for visual effect based on filter
          data.push({
              name: lbl,
              revenue: Math.floor(finStats.revenue / labels.length * (0.8 + Math.random() * 0.4)),
              expense: Math.floor(finStats.expense / labels.length * (0.8 + Math.random() * 0.4))
          });
      });
      return data;
  }, [finStats, timeFilter]);

  // MARKETING DATA
  const filteredLeads = useMemo(() => filterByDate(leads, 'lastActivity'), [leads, currentStart, currentEnd]); // Using lastActivity as proxy date
  const marketingStats = useMemo(() => {
      const total = filteredLeads.length;
      const converted = filteredLeads.filter(l => l.status === 'ready' || l.status === 'closed').length;
      const fail = filteredLeads.filter(l => l.status === 'fail').length;
      const rate = total > 0 ? Math.round((converted / total) * 100) : 0;
      
      const sources: Record<string, number> = {};
      filteredLeads.forEach(l => sources[l.source] = (sources[l.source] || 0) + 1);
      const sourceData = Object.keys(sources).map((k, i) => ({ 
          name: k, value: sources[k], color: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][i % 4] 
      }));

      const failReasons: Record<string, number> = {};
      filteredLeads.filter(l => l.status === 'fail').forEach(l => {
          const r = l.failReason || 'Khác';
          failReasons[r] = (failReasons[r] || 0) + 1;
      });
      const failData = Object.keys(failReasons).map(r => ({ name: r, value: failReasons[r] }));

      return { total, converted, fail, rate, sourceData, failData };
  }, [filteredLeads]);

  // ACADEMIC DATA
  const academicStats = useMemo(() => {
      const activeStudents = students.filter(s => s.status === 'active');
      const totalCapacity = classes.reduce((acc, c) => acc + c.maxStudents, 0);
      const currentEnrollment = classes.reduce((acc, c) => acc + c.students, 0);
      const occupancyRate = totalCapacity > 0 ? Math.round((currentEnrollment / totalCapacity) * 100) : 0;
      
      // Attendance Mock
      const attendanceRate = 85; // Hardcoded mock for demo visuals

      return { activeStudents: activeStudents.length, totalCapacity, currentEnrollment, occupancyRate, attendanceRate };
  }, [students, classes]);


  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);

  const handleExport = (section: string) => {
      alert(`Đang xuất dữ liệu báo cáo chi tiết: ${section.toUpperCase()} (${timeFilter})...`);
  };

  // Student & Teacher Dashboards omitted for brevity
  if (currentUser?.role === 'student' || currentUser?.role === 'teacher') return null;

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-[#f8fafc] dark:bg-background-dark relative font-display">
      
      {/* 1. MASTER HEADER & FILTERS */}
      <header className="bg-white dark:bg-[#1a202c] border-b border-slate-200 dark:border-slate-700 px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
            <div className="p-1.5 bg-primary/10 rounded-lg">
                <span className="material-symbols-outlined text-primary text-2xl">space_dashboard</span>
            </div>
            <div>
                <h1 className="text-lg font-extrabold text-slate-800 dark:text-white tracking-tight uppercase">Quản trị Điều hành</h1>
                <p className="text-xs text-slate-500 font-medium">Trung tâm Dữ liệu tập trung</p>
            </div>
        </div>

        {/* Master Time Filter */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {[
                { id: 'today', label: 'Hôm nay' },
                { id: 'this_week', label: 'Tuần này' },
                { id: 'this_month', label: 'Tháng này' },
                { id: 'this_quarter', label: 'Quý này' },
                { id: 'this_year', label: 'Năm nay' }
            ].map((f) => (
                <button
                    key={f.id}
                    onClick={() => setTimeFilter(f.id as TimeFilter)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        timeFilter === f.id 
                        ? 'bg-white dark:bg-slate-600 text-primary dark:text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                >
                    {f.label}
                </button>
            ))}
        </div>
      </header>

      {/* 2. TAB NAVIGATION */}
      <div className="px-6 pt-4 pb-2">
          <div className="flex border-b border-slate-200 dark:border-slate-700 gap-6">
              {[
                  { id: 'finance', label: 'Tài chính & Doanh thu', icon: 'payments' },
                  { id: 'marketing', label: 'Marketing & Sales', icon: 'campaign' },
                  { id: 'academic', label: 'Giáo vụ & Đào tạo', icon: 'school' }
              ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as DashboardTab)}
                    className={`flex items-center gap-2 pb-2 text-sm font-bold border-b-2 transition-all ${
                        activeTab === tab.id 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                      <span className="material-symbols-outlined text-xl">{tab.icon}</span>
                      {tab.label}
                  </button>
              ))}
          </div>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        {isLoading ? (
             <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
             </div>
        ) : (
        <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* --- FINANCE TAB --- */}
            {activeTab === 'finance' && (
                <div className="flex flex-col gap-5">
                    {/* Header Action */}
                    <div className="flex justify-end">
                        <button onClick={() => handleExport('finance')} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-sm">
                            <span className="material-symbols-outlined text-base">download</span> Xuất Báo cáo Tài chính
                        </button>
                    </div>

                    {/* 4 Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                            <div className="absolute right-[-10px] top-[-10px] p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-full group-hover:scale-125 transition-transform"></div>
                            <p className="text-slate-500 text-xs font-bold uppercase mb-1">Tổng Doanh thu</p>
                            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(finStats.revenue)}</h3>
                            <div className="absolute bottom-4 right-4 p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                                <span className="material-symbols-outlined">payments</span>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                            <div className="absolute right-[-10px] top-[-10px] p-6 bg-red-50 dark:bg-red-900/10 rounded-full group-hover:scale-125 transition-transform"></div>
                            <p className="text-slate-500 text-xs font-bold uppercase mb-1">Tổng Chi phí</p>
                            <h3 className="text-2xl font-extrabold text-red-600 dark:text-red-400">{formatCurrency(finStats.expense)}</h3>
                            <div className="absolute bottom-4 right-4 p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg">
                                <span className="material-symbols-outlined">trending_down</span>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                            <div className="absolute right-[-10px] top-[-10px] p-6 bg-orange-50 dark:bg-orange-900/10 rounded-full group-hover:scale-125 transition-transform"></div>
                            <p className="text-slate-500 text-xs font-bold uppercase mb-1">Công nợ Phải thu</p>
                            <h3 className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">{formatCurrency(finStats.debt)}</h3>
                            <div className="absolute bottom-4 right-4 p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg">
                                <span className="material-symbols-outlined">pending_actions</span>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                            <div className="absolute right-[-10px] top-[-10px] p-6 bg-blue-50 dark:bg-blue-900/10 rounded-full group-hover:scale-125 transition-transform"></div>
                            <p className="text-slate-500 text-xs font-bold uppercase mb-1">Lợi nhuận Thuần</p>
                            <h3 className={`text-2xl font-extrabold ${finStats.profit >= 0 ? 'text-blue-600' : 'text-red-500'}`}>{formatCurrency(finStats.profit)}</h3>
                            <div className="absolute bottom-4 right-4 p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                                <span className="material-symbols-outlined">account_balance_wallet</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-[380px]">
                        <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Biểu đồ Tăng trưởng Tài chính</h4>
                        <ResponsiveContainer width="100%" height="90%">
                            <AreaChart data={financeTrendData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} tick={{fontSize: 11, fill: '#64748b'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} tickFormatter={(val) => `${val/1000000}tr`} />
                                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} formatter={(val: number) => formatCurrency(val)} />
                                <Legend />
                                <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#10b981" strokeWidth={3} fill="url(#colorRev)" />
                                <Area type="monotone" dataKey="expense" name="Chi phí" stroke="#ef4444" strokeWidth={3} fill="url(#colorExp)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* --- MARKETING TAB --- */}
            {activeTab === 'marketing' && (
                <div className="flex flex-col gap-5">
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsAddLeadOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-sm transition-colors">
                            <span className="material-symbols-outlined text-base">add</span> Thêm Lead Mới
                        </button>
                        <button onClick={() => handleExport('marketing')} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-sm">
                            <span className="material-symbols-outlined text-base">download</span> Xuất Báo cáo Marketing
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <p className="text-slate-500 text-xs font-bold uppercase">Tổng Lead thu được</p>
                            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{marketingStats.total}</h3>
                        </div>
                        <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <p className="text-slate-500 text-xs font-bold uppercase">Tỷ lệ chuyển đổi</p>
                            <h3 className="text-3xl font-extrabold text-green-600 mt-1">{marketingStats.rate}%</h3>
                            <div className="w-full bg-green-100 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div className="bg-green-600 h-full" style={{width: `${marketingStats.rate}%`}}></div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <p className="text-slate-500 text-xs font-bold uppercase">Số Lead thất bại</p>
                            <h3 className="text-3xl font-extrabold text-red-600 mt-1">{marketingStats.fail}</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-[380px]">
                            <h4 className="font-bold text-slate-800 dark:text-white mb-4">Phân bổ Nguồn Lead</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={marketingStats.sourceData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                                        {marketingStats.sourceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-[380px]">
                            <h4 className="font-bold text-slate-800 dark:text-white mb-4">Top Lý do Fail</h4>
                            {marketingStats.failData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={marketingStats.failData} layout="vertical" margin={{left: 20}}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 11}} />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#EF4444" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400 italic">Chưa có dữ liệu Fail.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- ACADEMIC TAB --- */}
            {activeTab === 'academic' && (
                <div className="flex flex-col gap-5">
                    <div className="flex justify-end">
                        <button onClick={() => handleExport('academic')} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-sm">
                            <span className="material-symbols-outlined text-base">download</span> Xuất Báo cáo Giáo vụ
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <p className="text-slate-500 text-xs font-bold uppercase">Tổng Học viên Active</p>
                            <h3 className="text-3xl font-extrabold text-blue-600 mt-1">{academicStats.activeStudents}</h3>
                        </div>
                        <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <p className="text-slate-500 text-xs font-bold uppercase">Tỷ lệ Lấp đầy Lớp</p>
                            <h3 className="text-3xl font-extrabold text-purple-600 mt-1">{academicStats.occupancyRate}%</h3>
                            <p className="text-xs text-slate-400 mt-1">{academicStats.currentEnrollment} / {academicStats.totalCapacity} chỗ</p>
                        </div>
                        <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <p className="text-slate-500 text-xs font-bold uppercase">Tỷ lệ Chuyên cần TB</p>
                            <h3 className="text-3xl font-extrabold text-emerald-600 mt-1">{academicStats.attendanceRate}%</h3>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700">
                            <h4 className="font-bold text-slate-800 dark:text-white">Hiệu suất Lớp học</h4>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-bold text-xs">
                                <tr>
                                    <th className="px-5 py-3">Tên lớp</th>
                                    <th className="px-5 py-3">Giáo viên</th>
                                    <th className="px-5 py-3 text-center">Sĩ số</th>
                                    <th className="px-5 py-3 text-center">Tiến độ</th>
                                    <th className="px-5 py-3 text-center">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {classes.map(cls => (
                                    <tr key={cls.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{cls.name}</td>
                                        <td className="px-5 py-3">{cls.teacher}</td>
                                        <td className="px-5 py-3 text-center">{cls.students}/{cls.maxStudents}</td>
                                        <td className="px-5 py-3">
                                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-primary h-full" style={{width: `${cls.progress}%`}}></div>
                                            </div>
                                            <p className="text-[10px] text-center mt-1 text-slate-500">{cls.progress}%</p>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${cls.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {cls.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
        )}
      </div>
      
      {isAddLeadOpen && <AddLeadModal onClose={() => setIsAddLeadOpen(false)} />}
    </div>
  );
};

export default Dashboard;
