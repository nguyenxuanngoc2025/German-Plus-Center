
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import AdvancedFilterBar, { FilterState } from '../components/AdvancedFilterBar';

const ExpenseList: React.FC = () => {
  const navigate = useNavigate();
  const { finance } = useData(); 
  
  // --- UNIFIED FILTER STATE ---
  const [filters, setFilters] = useState<FilterState>({
      startDate: '', endDate: '', compareDateStart: '', compareDateEnd: '', isCompare: false,
      source: 'all', classType: 'all', classId: 'all', status: 'all'
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  // We can use a local category filter or integrate it if needed. 
  // For now, keep local category filter simple as AdvancedFilterBar focuses on major entities.
  const [categoryFilter, setCategoryFilter] = useState('all');

  // --- HELPER: DATE LOGIC ---
  const isInRange = (dateStr: string) => {
      if (!filters.startDate || !filters.endDate) return true;
      const date = new Date(dateStr);
      const start = new Date(filters.startDate); start.setHours(0,0,0,0);
      const end = new Date(filters.endDate); end.setHours(23,59,59,999);
      return date >= start && date <= end;
  };

  // --- FILTER DATA ---
  const expenseList = useMemo(() => {
      return finance.filter(f => f.type === 'expense').filter(f => {
          const matchDate = isInRange(f.date);
          const matchCategory = categoryFilter === 'all' || f.category === categoryFilter;
          const matchSearch = searchTerm === '' || f.description.toLowerCase().includes(searchTerm.toLowerCase());
          return matchDate && matchCategory && matchSearch;
      }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [finance, filters.startDate, filters.endDate, categoryFilter, searchTerm]);

  // --- STATS ---
  const stats = useMemo(() => {
      return {
          total: expenseList.reduce((acc, e) => acc + e.amount, 0),
          count: expenseList.length,
          pending: 0 
      };
  }, [expenseList]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
  };

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'Marketing': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Tiện ích': return 'bg-green-50 text-green-700 border-green-200';
      case 'Lương': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Sửa chữa': return 'bg-red-50 text-red-700 border-red-200';
      case 'Thuê': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-background-light dark:bg-background-dark font-display">
      <div className="md:hidden">
          <Header title="Danh sách Chi phí" />
      </div>
      
      {/* UNIFIED FILTER BAR */}
      <AdvancedFilterBar 
        title="Quản lý Chi phí"
        subtitle="Kiểm soát chi tiêu vận hành"
        onFilterChange={setFilters}
        showDate={true}
        showCompare={false}
        className="border-b border-slate-200 dark:border-slate-700"
        children={
            <div className="flex gap-3 items-center">
                <div className="relative w-full max-w-[200px]">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input 
                      className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary dark:text-white" 
                      placeholder="Tìm nội dung chi..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select 
                    className="h-9 pl-3 pr-8 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-white focus:ring-primary cursor-pointer"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                    <option value="all">Tất cả danh mục</option>
                    <option value="Lương">Lương</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Thuê">Thuê mặt bằng</option>
                    <option value="Tiện ích">Tiện ích</option>
                    <option value="Sửa chữa">Sửa chữa</option>
                </select>
            </div>
        }
        actions={
            <>
                <button className="h-9 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 font-bold text-xs">
                    Xuất Excel
                </button>
                <button 
                    onClick={() => navigate('/finance/expenses/create')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-md hover:bg-primary-dark transition-all h-9 whitespace-nowrap"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Thêm Chi phí
                </button>
            </>
        }
      />
      
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
          
          {/* MINI-DASHBOARD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white dark:bg-[#1a202c] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <p className="text-slate-500 text-xs font-bold uppercase">Tổng chi thực tế</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(stats.total)}</h3>
                  <p className="text-xs text-slate-400 mt-1">{stats.count} khoản chi</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800">
                  <p className="text-blue-700 dark:text-blue-300 text-xs font-bold uppercase">Đã thanh toán</p>
                  <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{formatCurrency(stats.total)}</h3>
                  <p className="text-xs text-blue-500 mt-1">100% hoàn tất</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-800">
                  <p className="text-red-700 dark:text-red-300 text-xs font-bold uppercase">Nợ nhà cung cấp</p>
                  <h3 className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">{formatCurrency(0)}</h3>
                  <p className="text-xs text-red-500 mt-1">Không có nợ tồn đọng</p>
              </div>
          </div>

          {/* DATA TABLE */}
          <div className="bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nội dung chi</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Số tiền</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ngày chi</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Danh mục</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Chứng từ</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {expenseList.map((item) => (
                    <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{item.description}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">ID: {item.id}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(item.amount)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-600 dark:text-slate-300">{new Date(item.date).toLocaleDateString('vi-VN')}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getCategoryStyle(item.category)}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-slate-300">-</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {expenseList.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-slate-500">Không tìm thấy khoản chi nào trong giai đoạn này.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ExpenseList;
