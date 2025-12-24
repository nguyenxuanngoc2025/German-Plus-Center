import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

// Mock Data matching the image
const MOCK_EXPENSES = [
  {
    id: 1,
    name: "Chi phí quảng cáo FB tháng 10",
    creator: "Nguyễn Văn A",
    amount: 5000000,
    date: "24/10/2023",
    category: "Marketing",
    note: "Chiến dịch tuyển sinh khóa K12",
    hasFile: true,
    fileIcon: "attachment"
  },
  {
    id: 2,
    name: "Thanh toán tiền điện T10",
    creator: "Trần Thị B",
    amount: 2350000,
    date: "22/10/2023",
    category: "Tiện ích",
    note: "Hóa đơn số HD123456",
    hasFile: true,
    fileIcon: "description"
  },
  {
    id: 3,
    name: "Lương Giảng viên - Đợt 1",
    creator: "Nguyễn Văn A",
    amount: 45000000,
    date: "15/10/2023",
    category: "Lương",
    note: "Chi trả cho 5 GV cơ hữu",
    hasFile: false,
    fileIcon: ""
  },
  {
    id: 4,
    name: "Sửa máy chiếu phòng 201",
    creator: "Trần Thị B",
    amount: 850000,
    date: "12/10/2023",
    category: "Sửa chữa",
    note: "Thay bóng đèn máy chiếu",
    hasFile: true,
    fileIcon: "receipt"
  },
  {
    id: 5,
    name: "Thuê văn phòng T10-T12",
    creator: "Nguyễn Văn A",
    amount: 30000000,
    date: "01/10/2023",
    category: "Thuê",
    note: "Thanh toán quý 4",
    hasFile: true,
    fileIcon: "picture_as_pdf"
  }
];

const ExpenseList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'Marketing':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
      case 'Tiện ích':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'Lương':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'Sửa chữa':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'Thuê':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
     switch (category) {
      case 'Marketing': return 'bg-orange-500';
      case 'Tiện ích': return 'bg-green-500';
      case 'Lương': return 'bg-blue-500';
      case 'Sửa chữa': return 'bg-red-500';
      case 'Thuê': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-background-light dark:bg-background-dark font-display">
      <Header title="Danh sách Chi phí" />
      
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          
          {/* PAGE HEADER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">Danh sách Chi phí</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Quản lý và theo dõi dòng tiền chi tiêu của trung tâm</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                <span className="material-symbols-outlined text-[20px]">download</span>
                <span>Xuất dữ liệu</span>
              </button>
              <button 
                onClick={() => navigate('/finance/expenses/create')}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg shadow-md hover:bg-primary-dark hover:shadow-lg transition-all transform active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                <span>Thêm Chi phí mới</span>
              </button>
            </div>
          </div>

          {/* FILTERS CARD */}
          <div className="bg-white dark:bg-[#1a202c] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[240px]">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Từ khóa</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
                </span>
                <input 
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder-slate-400" 
                  placeholder="Tìm tên khoản chi, ghi chú..." 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            {/* Date Filter */}
            <div className="w-full lg:w-48">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Thời gian</label>
              <div className="relative">
                <select className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer">
                  <option>Tháng này</option>
                  <option>Quý này</option>
                  <option>Năm nay</option>
                  <option>Tùy chọn...</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">calendar_month</span>
                </div>
              </div>
            </div>
            {/* Category Filter */}
            <div className="w-full lg:w-48">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Loại chi phí</label>
              <div className="relative">
                <select className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer">
                  <option value="">Tất cả</option>
                  <option value="Lương">Lương</option>
                  <option value="Thuê">Thuê mặt bằng</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Tiện ích">Tiện ích</option>
                  <option value="Sửa chữa">Sửa chữa</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">expand_more</span>
                </div>
              </div>
            </div>
            {/* Creator Filter */}
            <div className="w-full lg:w-48">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Người tạo</label>
              <div className="relative">
                <select className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer">
                  <option value="">Tất cả</option>
                  <option value="1">Nguyễn Văn A</option>
                  <option value="2">Trần Thị B</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">person</span>
                </div>
              </div>
            </div>
          </div>

          {/* DATA TABLE */}
          <div className="bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-10">
                      <input className="rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer size-4" type="checkbox"/>
                    </th>
                    <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tên khoản chi</th>
                    <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Số tiền</th>
                    <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ngày chi</th>
                    <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Loại chi phí</th>
                    <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-1/4">Ghi chú</th>
                    <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">File</th>
                    <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {MOCK_EXPENSES.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                    <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <input className="rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer size-4" type="checkbox"/>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{item.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5 font-medium">Tạo bởi: {item.creator}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {/* Synchronized font style here - removed font-mono, kept bold for emphasis */}
                        <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{formatCurrency(item.amount)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{item.date}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold border ${getCategoryStyle(item.category)}`}>
                          <span className={`size-1.5 rounded-full ${getCategoryColor(item.category)}`}></span>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[200px] font-medium">{item.note}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.hasFile ? (
                          <button className="text-slate-400 hover:text-primary transition-colors p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700" title="Xem file">
                            <span className="material-symbols-outlined text-[18px]">{item.fileIcon}</span>
                          </button>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 text-slate-500 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm hover:text-primary rounded-md transition-all" title="Chỉnh sửa">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button className="p-1.5 text-slate-500 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm hover:text-red-500 rounded-md transition-all" title="Xóa">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/20">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Hiển thị <span className="font-bold text-slate-900 dark:text-white">1-{MOCK_EXPENSES.length}</span> / <span className="font-bold text-slate-900 dark:text-white">48</span>
              </span>
              <div className="flex items-center gap-2">
                <button className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-primary hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  Trước
                </button>
                <div className="flex gap-1">
                    <button className="w-7 h-7 flex items-center justify-center text-xs font-bold text-white bg-primary rounded shadow-sm">1</button>
                    <button className="w-7 h-7 flex items-center justify-center text-xs font-medium text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 rounded transition-all">2</button>
                    <button className="w-7 h-7 flex items-center justify-center text-xs font-medium text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 rounded transition-all">3</button>
                </div>
                <button className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-primary hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 rounded transition-all">
                  Sau
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ExpenseList;