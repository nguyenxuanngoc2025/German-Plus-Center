
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import AddLeadModal from '../components/AddLeadModal';
import AdvancedFilterBar, { FilterState } from '../components/AdvancedFilterBar';
import StatCard from '../components/StatCard';
import DrillDownModal from '../components/DrillDownModal'; // Import new modal
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend, BarChart, Bar 
} from 'recharts';

type DashboardTab = 'finance' | 'marketing' | 'academic';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { students, leads, finance, classes, currentUser, calculateFinancials } = useData();
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- FILTER STATE (From AdvancedFilterBar) ---
  const [filters, setFilters] = useState<FilterState>({
      startDate: '', endDate: '', compareDateStart: '', compareDateEnd: '',
      isCompare: false, source: 'all', classType: 'all', classId: 'all', status: 'all'
  });
  
  const [activeTab, setActiveTab] = useState<DashboardTab>('finance');
  
  // --- DRILL DOWN STATE ---
  const [drillType, setDrillType] = useState<string | null>(null);

  // Trigger loading effect when critical filters change
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, [filters.startDate, filters.endDate, filters.isCompare, activeTab, filters.source, filters.classType]);

  // --- 1. PERIOD CALCULATION ---
  const periods = useMemo(() => {
      const currentStart = filters.startDate ? new Date(filters.startDate) : new Date();
      const currentEnd = filters.endDate ? new Date(filters.endDate) : new Date();
      currentEnd.setHours(23, 59, 59, 999);

      const prevStart = filters.compareDateStart ? new Date(filters.compareDateStart) : new Date();
      const prevEnd = filters.compareDateEnd ? new Date(filters.compareDateEnd) : new Date();
      prevEnd.setHours(23, 59, 59, 999);

      return {
          current: { start: currentStart, end: currentEnd },
          previous: { start: prevStart, end: prevEnd }
      };
  }, [filters]);

  // --- 2. AGGREGATED DATA CALCULATIONS ---

  // Helper: Calculate Growth Percentage
  const getGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
  };

  // Helper: Filter generic data by date field
  const filterByRange = (data: any[], dateField: string, range: { start: Date, end: Date }) => {
      return data.filter(item => {
          const d = new Date(item[dateField]);
          return d >= range.start && d <= range.end;
      });
  };

  // --- A. FINANCE ANALYTICS ---
  const financeStats = useMemo(() => {
      const curr = calculateFinancials(periods.current.start, periods.current.end);
      const prev = calculateFinancials(periods.previous.start, periods.previous.end);

      return {
          current: curr,
          previous: prev,
          growth: {
              revenue: getGrowth(curr.revenue, prev.revenue),
              expense: getGrowth(curr.expense, prev.expense),
              debt: getGrowth(curr.debt, prev.debt),
              profit: getGrowth(curr.profit, prev.profit)
          }
      };
  }, [periods, calculateFinancials]);

  // Dual-Line Chart Data Construction
  const financeChartData = useMemo(() => {
      const durationDays = (periods.current.end.getTime() - periods.current.start.getTime()) / (1000 * 3600 * 24);
      const isDaily = durationDays <= 32;
      
      const points = isDaily ? Math.min(Math.ceil(durationDays), 15) : 12; 
      const data = [];
      
      for (let i = 0; i < points; i++) {
          let valCurrent = (financeStats.current.revenue / points) * (0.8 + Math.random() * 0.4);
          let valPrev = (financeStats.previous.revenue / points) * (0.8 + Math.random() * 0.4);
          
          if (!filters.isCompare) valPrev = 0;

          const dateLabel = isDaily 
              ? new Date(periods.current.start.getTime() + i * (1000*3600*24)).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'})
              : `T${new Date(periods.current.start.getTime() + i * (1000*3600*24*30)).getMonth() + 1}`;

          data.push({
              name: dateLabel,
              current: Math.round(valCurrent),
              previous: filters.isCompare ? Math.round(valPrev) : null 
          });
      }
      return data;
  }, [financeStats, filters.isCompare, periods]);


  // --- B. MARKETING ANALYTICS ---
  const marketingStats = useMemo(() => {
      const getStats = (range: { start: Date, end: Date }) => {
          let rangeLeads = filterByRange(leads, 'lastActivity', range);
          
          // Apply extra filters
          if (filters.source !== 'all') rangeLeads = rangeLeads.filter(l => l.source.includes(filters.source));
          if (filters.classType !== 'all') rangeLeads = rangeLeads.filter(l => l.learningMode === filters.classType);

          const total = rangeLeads.length;
          const converted = rangeLeads.filter(l => l.status === 'closed').length;
          const fail = rangeLeads.filter(l => l.status === 'fail').length;
          const ready = rangeLeads.filter(l => l.status === 'ready').length;
          return { total, converted, fail, ready, rate: total > 0 ? (converted/total)*100 : 0 };
      };

      const curr = getStats(periods.current);
      const prev = getStats(periods.previous);

      // Pie Data (Current Period)
      let currentLeads = filterByRange(leads, 'lastActivity', periods.current);
      if (filters.source !== 'all') currentLeads = currentLeads.filter(l => l.source.includes(filters.source)); // Filter source if selected
      if (filters.classType !== 'all') currentLeads = currentLeads.filter(l => l.learningMode === filters.classType);

      const sources: Record<string, number> = {};
      currentLeads.forEach(l => sources[l.source] = (sources[l.source] || 0) + 1);
      const sourceData = Object.keys(sources).map((k, i) => ({ 
          name: k, value: sources[k], color: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'][i % 5] 
      }));

      // Fail Reasons
      const failReasons: Record<string, number> = {};
      currentLeads.filter(l => l.status === 'fail').forEach(l => {
          const r = l.failReason || 'Khác';
          failReasons[r] = (failReasons[r] || 0) + 1;
      });
      const failData = Object.keys(failReasons).map(r => ({ name: r, value: failReasons[r] }));

      return {
          current: curr,
          previous: prev,
          growth: {
              total: getGrowth(curr.total, prev.total),
              rate: Math.round(curr.rate - prev.rate)
          },
          sourceData,
          failData
      };
  }, [leads, periods, filters.source, filters.classType]);

  // --- C. ACADEMIC ANALYTICS ---
  const academicStats = useMemo(() => {
      const getEnrollment = (range: { start: Date, end: Date }) => {
          return students.filter(s => {
              if (!s.enrollmentDate) return false;
              const d = new Date(s.enrollmentDate);
              const dateMatch = d >= range.start && d <= range.end;
              return dateMatch;
          }).length;
      };

      const currEnroll = getEnrollment(periods.current);
      const prevEnroll = getEnrollment(periods.previous);

      // Snapshot stats (Current Only - Filtered by Class Type)
      let filteredClasses = classes;
      if (filters.classType !== 'all') {
          filteredClasses = classes.filter(c => c.mode === filters.classType);
      }

      // Filter students who belong to these filtered classes
      const filteredClassIds = filteredClasses.map(c => c.id);
      const activeStudents = students.filter(s => s.status === 'active' && s.classId && filteredClassIds.includes(s.classId)).length;
      
      const totalCapacity = filteredClasses.reduce((acc, c) => acc + c.maxStudents, 0);
      const currentEnrollment = filteredClasses.reduce((acc, c) => acc + c.students, 0);
      const occupancyRate = totalCapacity > 0 ? Math.round((currentEnrollment / totalCapacity) * 100) : 0;

      return {
          activeStudents,
          occupancyRate,
          filteredClasses,
          enrollment: {
              current: currEnroll,
              previous: prevEnroll,
              growth: getGrowth(currEnroll, prevEnroll)
          }
      };
  }, [students, classes, periods, filters.classType]);


  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);

  // --- COMPONENT: GROWTH BADGE ---
  const GrowthBadge = ({ value, isCurrency = false, isInverse = false }: { value: number, isCurrency?: boolean, isInverse?: boolean }) => {
      if (!filters.isCompare) return null;
      
      const isPositive = value > 0;
      const isNeutral = value === 0;
      
      let colorClass = isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50';
      if (isInverse) {
          colorClass = isPositive ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50';
      }
      if (isNeutral) colorClass = 'text-slate-500 bg-slate-100';

      return (
          <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${colorClass} w-fit`}>
              <span className="material-symbols-outlined text-[12px]">
                  {isNeutral ? 'remove' : isPositive ? 'trending_up' : 'trending_down'}
              </span>
              <span>{Math.abs(value)}{isCurrency ? '' : '%'}</span>
              <span className="opacity-70 font-normal ml-0.5">vs kỳ trước</span>
          </div>
      );
  };

  const handleExport = (section: string) => {
      alert(`Đang xuất dữ liệu báo cáo chi tiết: ${section.toUpperCase()} (${filters.startDate} - ${filters.endDate})...`);
  };

  if (currentUser?.role === 'student' || currentUser?.role === 'teacher') return null;

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-[#f8fafc] dark:bg-background-dark relative font-display">
      
      {/* 1. ADVANCED FILTER BAR */}
      <AdvancedFilterBar 
        onFilterChange={setFilters}
        showCompare={true}
        showSource={activeTab === 'marketing'}
        showClassType={activeTab === 'academic' || activeTab === 'marketing'}
        className="border-b border-slate-200 dark:border-slate-700"
      />

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
             <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                <p className="text-sm text-slate-500 animate-pulse">Đang tổng hợp dữ liệu...</p>
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

                    {/* 4 Cards (Using StatCard) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <StatCard 
                            label="Tổng Doanh thu"
                            value={formatCurrency(financeStats.current.revenue)}
                            icon="payments"
                            color="green"
                            tooltip="Tổng số tiền thực tế đã thu vào (Cash-in) trong khoảng thời gian đã chọn."
                            subtext={<GrowthBadge value={financeStats.growth.revenue} />}
                            onClick={() => setDrillType('revenue')}
                        />
                        <StatCard 
                            label="Tổng Chi phí"
                            value={formatCurrency(financeStats.current.expense)}
                            icon="trending_down"
                            color="red"
                            tooltip="Tổng số tiền thực tế đã chi ra (lương, mặt bằng, marketing...) trong kỳ."
                            subtext={<GrowthBadge value={financeStats.growth.expense} isInverse={true} />}
                            onClick={() => setDrillType('expense')}
                        />
                        <StatCard 
                            label="Công nợ Phải thu"
                            value={formatCurrency(financeStats.current.debt)}
                            icon="pending_actions"
                            color="orange"
                            tooltip="Tổng số học phí còn thiếu của tất cả học viên tính đến thời điểm hiện tại."
                            subtext={<GrowthBadge value={financeStats.growth.debt} isInverse={true} />}
                            onClick={() => setDrillType('debt')}
                        />
                        <StatCard 
                            label="Lợi nhuận Thuần"
                            value={formatCurrency(financeStats.current.profit)}
                            icon="account_balance_wallet"
                            color="blue"
                            tooltip="Doanh thu thực tế trừ đi Chi phí thực tế. Chưa bao gồm công nợ."
                            subtext={<GrowthBadge value={financeStats.growth.profit} />}
                        />
                    </div>

                    {/* Chart */}
                    <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-[380px]">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-bold text-slate-800 dark:text-white">Biểu đồ Doanh thu (So sánh)</h4>
                            {filters.isCompare && (
                                <div className="flex items-center gap-4 text-xs font-bold">
                                    <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Kỳ này</div>
                                    <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-300"></span> Kỳ trước</div>
                                </div>
                            )}
                        </div>
                        <ResponsiveContainer width="100%" height="90%">
                            <AreaChart data={financeChartData}>
                                <defs>
                                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} tick={{fontSize: 11, fill: '#64748b'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} tickFormatter={(val) => `${val/1000000}tr`} />
                                <Tooltip 
                                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} 
                                    formatter={(val: number) => formatCurrency(val)} 
                                />
                                {filters.isCompare && (
                                    <Area type="monotone" dataKey="previous" name="Kỳ trước" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                                )}
                                <Area type="monotone" dataKey="current" name="Kỳ này" stroke="#10b981" strokeWidth={3} fill="url(#colorCurrent)" />
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
                            <span className="material-symbols-outlined text-base">download</span> Xuất Báo cáo
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard 
                            label="Tổng Lead thu được"
                            value={marketingStats.current.total}
                            icon="campaign"
                            color="blue"
                            tooltip="Tổng số khách hàng tiềm năng (Leads) mới được tạo trong kỳ."
                            subtext={<GrowthBadge value={marketingStats.growth.total} />}
                            onClick={() => setDrillType('leads_total')}
                        />
                        <StatCard 
                            label="Tỷ lệ chuyển đổi"
                            value={`${marketingStats.current.rate.toFixed(1)}%`}
                            icon="sync_alt"
                            color="green"
                            tooltip="Tỷ lệ Leads chuyển thành Học viên chính thức (Closed / Total)."
                            subtext={<GrowthBadge value={marketingStats.growth.rate} isCurrency={true} />}
                        />
                        <StatCard 
                            label="Sẵn sàng (Ready)"
                            value={marketingStats.current.ready}
                            icon="verified"
                            color="teal"
                            tooltip="Số lượng Leads có khả năng chốt cao (trạng thái 'Sẵn sàng')."
                            subtext="Tiềm năng chốt cao"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-[380px]">
                            <h4 className="font-bold text-slate-800 dark:text-white mb-4">Phân bổ Nguồn Lead (Kỳ này)</h4>
                            {marketingStats.current.total > 0 ? (
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
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400 italic">Chưa có dữ liệu nguồn.</div>
                            )}
                        </div>
                        <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-[380px]">
                            <h4 className="font-bold text-slate-800 dark:text-white mb-4">Lý do Fail (Kỳ này)</h4>
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
                        <StatCard 
                            label="Tổng Học viên Active"
                            value={academicStats.activeStudents}
                            icon="groups"
                            color="blue"
                            tooltip="Số lượng học viên đang có trạng thái 'Đang học' tại trung tâm."
                            subtext="Học viên đang theo học"
                            onClick={() => setDrillType('students_active')}
                        />
                        <StatCard 
                            label="Tuyển sinh mới"
                            value={academicStats.enrollment.current}
                            icon="person_add"
                            color="purple"
                            tooltip="Số lượng học viên mới nhập học trong kỳ này."
                            subtext={<GrowthBadge value={academicStats.enrollment.growth} />}
                        />
                        <StatCard 
                            label="Tỷ lệ Lấp đầy"
                            value={`${academicStats.occupancyRate}%`}
                            icon="chair"
                            color="green"
                            tooltip="Tỷ lệ chỗ ngồi thực tế / Tổng sức chứa của các lớp đang hoạt động."
                            subtext={
                                <div className="w-full bg-emerald-100 h-1.5 rounded-full mt-2 overflow-hidden max-w-[100px]">
                                    <div className="bg-emerald-500 h-full" style={{width: `${academicStats.occupancyRate}%`}}></div>
                                </div>
                            }
                        />
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
                                {academicStats.filteredClasses.map(cls => (
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
      
      {drillType && (
          <DrillDownModal 
            type={drillType as any}
            filters={filters}
            onClose={() => setDrillType(null)}
          />
      )}
    </div>
  );
};

export default Dashboard;
