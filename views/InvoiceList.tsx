
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import PaymentModal from '../components/PaymentModal';
import InvoiceDetailModal from '../components/InvoiceDetailModal';
import ColumnSelector, { ColumnOption } from '../components/ColumnSelector';
import Avatar from '../components/Avatar';

const InvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const { tuition, students, classes, recordPayment, deleteTuition } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  
  // State for Modals
  const [quickPayInvoice, setQuickPayInvoice] = useState<{id: string, studentName: string, remainingAmount: number, totalAmount: number} | null>(null);
  const [detailInvoice, setDetailInvoice] = useState<any | null>(null);

  // Column Configuration
  const columnOptions: ColumnOption[] = [
      { key: 'id', label: 'Mã Hóa đơn', isMandatory: true },
      { key: 'student', label: 'Học viên', isMandatory: true },
      { key: 'description', label: 'Nội dung' },
      { key: 'total', label: 'Cần thu' },
      { key: 'paid', label: 'Đã thu' },
      { key: 'dueDate', label: 'Hạn nộp' },
      { key: 'status', label: 'Trạng thái' },
      { key: 'actions', label: 'Tác vụ', isMandatory: true },
  ];
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columnOptions.map(c => c.key));

  // Helper to check overdue
  const isOverdue = (dueDate: string, status: string) => {
      if (status === 'paid') return false;
      return new Date(dueDate) < new Date();
  };

  // Combine Data for Table
  const invoiceList = useMemo(() => {
    let data = tuition.map(t => {
      const student = students.find(s => s.id === t.studentId);
      const cls = classes.find(c => c.id === student?.classId);
      const overdue = isOverdue(t.dueDate, t.status);
      
      return {
        id: t.id,
        studentId: t.studentId,
        studentName: student?.name || 'Unknown',
        studentCode: student?.code || 'N/A',
        studentAvatar: student?.avatar || '?',
        className: cls?.name || 'Chưa xếp lớp',
        totalAmount: t.totalAmount,
        paidAmount: t.paidAmount,
        remainingAmount: t.remainingAmount,
        dueDate: t.dueDate,
        status: overdue ? 'overdue' : t.status, // Override status if overdue logic matches
        issueDate: '25/10/2023', // Mock issue date
        description: t.description || 'Học phí' // New field
      };
    });

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(i => 
        i.studentName.toLowerCase().includes(lower) || 
        i.studentCode.toLowerCase().includes(lower) ||
        i.id.toLowerCase().includes(lower)
      );
    }
    if (statusFilter) {
      data = data.filter(i => i.status === statusFilter);
    }
    if (classFilter) {
        data = data.filter(i => i.className.includes(classFilter));
    }

    return data;
  }, [tuition, students, classes, searchTerm, statusFilter, classFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handlePaymentConfirm = (amount: number, method: string) => {
      if (quickPayInvoice) {
          const result = recordPayment(quickPayInvoice.id, amount, method);
          if (result.success) {
              alert(`Đã thu ${formatCurrency(amount)} thành công!`);
              setQuickPayInvoice(null);
          } else {
              alert(result.message);
          }
      }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(window.confirm('Bạn có chắc chắn muốn hủy phiếu thu này? Dữ liệu không thể phục hồi.')) {
          deleteTuition(id);
      }
  };

  const handlePrint = (e: React.MouseEvent) => {
      e.stopPropagation();
      alert("Đang tạo file PDF để in...");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
            Hoàn thành
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Một phần
          </span>
        );
      case 'unpaid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
            Chưa thu
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
            Quá hạn
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-background-light dark:bg-background-dark font-display">
      <Header title="Danh sách Phiếu thu" />
      
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
          
          {/* PAGE HEADER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">Quản lý Thu phí</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Theo dõi công nợ, đặt cọc và lịch trả góp của học viên</p>
            </div>
            <div className="flex items-center gap-3">
              <ColumnSelector 
                  tableId="invoices_table"
                  columns={columnOptions}
                  onChange={setVisibleColumns}
              />
              <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                <span className="material-symbols-outlined text-[20px]">download</span>
                <span>Xuất Excel</span>
              </button>
              <button 
                onClick={() => navigate('/invoices/create')}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg shadow-md hover:bg-primary-dark hover:shadow-lg transition-all transform active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                <span>Tạo Phiếu thu</span>
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
                  placeholder="Tìm mã HĐ, tên học viên..." 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            {/* Class Filter */}
            <div className="w-full lg:w-56">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Lớp học</label>
              <div className="relative">
                <select 
                    className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer"
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                >
                  <option value="">Tất cả lớp</option>
                  {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">school</span>
                </div>
              </div>
            </div>
            {/* Status Filter */}
            <div className="w-full lg:w-48">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Trạng thái</label>
              <div className="relative">
                <select 
                    className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="paid">Hoàn thành</option>
                  <option value="partial">Một phần</option>
                  <option value="unpaid">Chưa thu</option>
                  <option value="overdue">Quá hạn</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">filter_list</span>
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
                    {visibleColumns.includes('id') && (
                        <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hóa đơn</th>
                    )}
                    {visibleColumns.includes('student') && (
                        <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Học viên</th>
                    )}
                    {visibleColumns.includes('description') && (
                        <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nội dung</th>
                    )}
                    {visibleColumns.includes('total') && (
                        <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Cần thu</th>
                    )}
                    {visibleColumns.includes('paid') && (
                        <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Đã thu</th>
                    )}
                    {visibleColumns.includes('dueDate') && (
                        <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Hạn nộp</th>
                    )}
                    {visibleColumns.includes('status') && (
                        <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Trạng thái</th>
                    )}
                    {visibleColumns.includes('actions') && (
                        <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Tác vụ</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {invoiceList.map((item) => (
                    <tr 
                        key={item.id} 
                        onClick={() => setDetailInvoice(item)}
                        className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${item.status === 'overdue' ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}
                    >
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <input className="rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer size-4" type="checkbox"/>
                      </td>
                      {visibleColumns.includes('id') && (
                          <td className="py-3 px-4">
                            <span className="text-sm font-semibold text-primary dark:text-blue-400 hover:underline">#{item.id.split('-').pop()}</span>
                          </td>
                      )}
                      {visibleColumns.includes('student') && (
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                                <Avatar src={item.studentAvatar} name={item.studentName} className="size-8 border border-slate-200 dark:border-slate-600 text-xs" />
                                <div>
                                    <div className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{item.studentName}</div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5 font-medium">{item.className}</div>
                                </div>
                            </div>
                          </td>
                      )}
                      {visibleColumns.includes('description') && (
                          <td className="py-3 px-4">
                            <span className="text-sm text-slate-700 dark:text-slate-300">{item.description}</span>
                          </td>
                      )}
                      {visibleColumns.includes('total') && (
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{formatCurrency(item.totalAmount)}</span>
                          </td>
                      )}
                      {visibleColumns.includes('paid') && (
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm font-medium text-green-600 dark:text-green-400 tracking-tight">{formatCurrency(item.paidAmount)}</span>
                          </td>
                      )}
                      {visibleColumns.includes('dueDate') && (
                          <td className="py-3 px-4 text-right">
                            <span className={`text-sm font-medium ${item.status === 'overdue' ? 'text-red-600 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                                {new Date(item.dueDate).toLocaleDateString('vi-VN')}
                            </span>
                          </td>
                      )}
                      {visibleColumns.includes('status') && (
                          <td className="py-3 px-4 text-center">
                            {getStatusBadge(item.status)}
                          </td>
                      )}
                      {visibleColumns.includes('actions') && (
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {item.status !== 'paid' && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setQuickPayInvoice(item); }}
                                    className="p-1.5 bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 hover:text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/40 rounded-md transition-all shadow-sm" 
                                    title="Thu tiền nhanh"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                                  </button>
                              )}
                              <button 
                                onClick={handlePrint}
                                className="p-1.5 text-slate-500 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm hover:text-primary rounded-md transition-all" 
                                title="In phiếu"
                              >
                                <span className="material-symbols-outlined text-[18px]">print</span>
                              </button>
                              <button 
                                onClick={(e) => handleDelete(item.id, e)}
                                className="p-1.5 text-slate-500 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm hover:text-red-500 rounded-md transition-all" 
                                title="Hủy phiếu"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </td>
                      )}
                    </tr>
                  ))}
                  {invoiceList.length === 0 && (
                      <tr>
                          <td colSpan={visibleColumns.length + 1} className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                              Không tìm thấy phiếu thu nào phù hợp.
                          </td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/20">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Hiển thị <span className="font-bold text-slate-900 dark:text-white">1-{invoiceList.length}</span> / <span className="font-bold text-slate-900 dark:text-white">{tuition.length}</span>
              </span>
              <div className="flex items-center gap-2">
                <button className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-primary hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  Trước
                </button>
                <div className="flex gap-1">
                    <button className="w-7 h-7 flex items-center justify-center text-xs font-bold text-white bg-primary rounded shadow-sm">1</button>
                    <button className="w-7 h-7 flex items-center justify-center text-xs font-medium text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 rounded transition-all">2</button>
                </div>
                <button className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-primary hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 rounded transition-all">
                  Sau
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Quick Pay Modal */}
      {quickPayInvoice && (
          <PaymentModal 
            invoice={quickPayInvoice}
            onClose={() => setQuickPayInvoice(null)}
            onConfirm={handlePaymentConfirm}
          />
      )}

      {/* Detailed Invoice Modal */}
      {detailInvoice && (
          <InvoiceDetailModal 
            invoice={detailInvoice}
            onClose={() => setDetailInvoice(null)}
          />
      )}
    </div>
  );
};

export default InvoiceList;
