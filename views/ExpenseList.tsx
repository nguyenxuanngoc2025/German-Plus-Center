
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useData } from '../context/DataContext';

const ExpenseList: React.FC = () => {
  const navigate = useNavigate();
  const { finance } = useData(); // Use live finance data
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('this_month');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // --- HELPER: DATE LOGIC ---
  const isInRange = (dateStr: string) => {
      const date = new Date(dateStr);
      const now = new Date();
      if (dateFilter === 'this_month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      if (dateFilter === 'last_month') {
          const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return date.getMonth() === last.getMonth() && date.getFullYear() === last.getFullYear();
      }
      if (dateFilter === 'this_year') return date.getFullYear() === now.getFullYear();
      return true;
  };

  // --- FILTER DATA ---
  const expenseList = useMemo(() => {
      // Filter only expenses from global finance records
      return finance.filter(f => f.type === 'expense').filter(f => {
          const matchDate = isInRange(f.date);
          const matchCategory = categoryFilter === 'all' || f.category === categoryFilter;
          const matchSearch = searchTerm === '' || f.description.toLowerCase().includes(searchTerm.toLowerCase());
          return matchDate && matchCategory && matchSearch;
      }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [finance, dateFilter, categoryFilter, searchTerm]);

  // --- STATS ---
  const stats = useMemo(() => {
      return {
          total: expenseList.reduce((acc, e) => acc + e.amount, 0),
          count: expenseList.length,
          // Mocking "Pending" status as it's not in the base model yet, assuming all recorded expenses are paid/committed
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
      <Header title="Danh sách Chi phí" />
      
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
          
          {/* HEADER & MINI DASHBOARD */}
          <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Quản lý Chi phí</h1>
                <button 
                    onClick={() => navigate('/finance/expenses/create')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg shadow-md hover:bg-primary-dark transition-all"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Thêm Chi phí
                </button>
              </div>

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
          </div>

          {/* FILTER BAR */}
          <div className="bg-white dark:bg-[#1a202c] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center sticky top-0 z-20">
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input 
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary dark:text-white" 
                  placeholder="Tìm nội dung chi..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                  className="h-10 pl-3 pr-8 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-white focus:ring-primary cursor-pointer"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
              >
                  <option value="this_month">Tháng này</option>
                  <option value="last_month">Tháng trước</option>
                  <option value="this_year">Năm nay</option>
                  <option value="all">Toàn thời gian</option>
              </select>
              <select 
                  className="h-10 pl-3 pr-8 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-white focus:ring-primary cursor-pointer"
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
            <button className="h-10 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 font-bold text-sm">
                Xuất Excel
            </button>
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
                      <tr><td colSpan={6} className="py-8 text-center text-slate-500">Không tìm thấy khoản chi nào.</td></tr>
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
