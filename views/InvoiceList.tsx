
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import PaymentModal from '../components/PaymentModal';
import InvoiceDetailModal from '../components/InvoiceDetailModal';
import ColumnSelector, { ColumnOption } from '../components/ColumnSelector';
import Avatar from '../components/Avatar';

const InvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tuition, students, classes, recordPayment, deleteTuition } = useData();
  
  // --- UNIVERSAL FILTERS STATE ---
  const [dateFilter, setDateFilter] = useState('all'); // this_month, last_month, all
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all, paid, unpaid, overdue, partial, debt_all
  const [searchTerm, setSearchTerm] = useState('');

  // Handle incoming navigation state (e.g. click from Dashboard)
  useEffect(() => {
      if (location.state && (location.state as any).filter === 'debt') {
          setStatusFilter('debt_all'); // Special filter for all unpaid/partial/overdue
          // Clear state so it doesn't persist on refresh unintentionally
          window.history.replaceState({}, document.title);
      }
  }, [location]);

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

  // --- HELPER: DATE LOGIC ---
  const isInRange = (dateStr: string) => {
      if (dateFilter === 'all') return true;
      const date = new Date(dateStr);
      const now = new Date();
      if (dateFilter === 'this_month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      if (dateFilter === 'last_month') {
          const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return date.getMonth() === last.getMonth() && date.getFullYear() === last.getFullYear();
      }
      return true;
  };

  // --- DATA PROCESSING ---
  const invoiceList = useMemo(() => {
    return tuition.map(t => {
      const student = students.find(s => s.id === t.studentId);
      const cls = classes.find(c => c.id === student?.classId);
      // Determine Overdue: If unpaid/partial AND past due date
      const isOverdue = t.remainingAmount > 0 && new Date(t.dueDate) < new Date();
      
      return {
        id: t.id,
        studentId: t.studentId,
        studentName: student?.name || 'Unknown',
        studentCode: student?.code || 'N/A',
        studentAvatar: student?.avatar || '?',
        className: cls?.name || 'Chưa xếp lớp',
        classId: cls?.id || '',
        totalAmount: t.totalAmount,
        paidAmount: t.paidAmount,
        remainingAmount: t.remainingAmount,
        dueDate: t.dueDate,
        status: isOverdue ? 'overdue' : t.status, // Calculated status
        description: t.description || 'Học phí'
      };
    }).filter(i => {
        // Universal Filter Logic
        const matchDate = isInRange(i.dueDate);
        const matchClass = classFilter === 'all' || i.classId === classFilter;
        
        // Complex Status Logic
        let matchStatus = true;
        if (statusFilter === 'all') matchStatus = true;
        else if (statusFilter === 'debt_all') matchStatus = i.status === 'unpaid' || i.status === 'partial' || i.status === 'overdue';
        else matchStatus = i.status === statusFilter;

        const matchSearch = searchTerm === '' || i.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || i.id.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchDate && matchClass && matchStatus && matchSearch;
    });
  }, [tuition, students, classes, dateFilter, classFilter, statusFilter, searchTerm]);

  // --- MINI-DASHBOARD STATS ---
  const stats = useMemo(() => {
      return {
          totalDue: invoiceList.reduce((acc, i) => acc + i.totalAmount, 0),
          collected: invoiceList.reduce((acc, i) => acc + i.paidAmount, 0),
          remaining: invoiceList.reduce((acc, i) => acc + i.remainingAmount, 0),
          count: invoiceList.length
      };
  }, [invoiceList]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
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

  // Helper for Status Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-50 text-green-700 border border-green-200">Hoàn thành</span>;
      case 'partial': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">Một phần</span>;
      case 'unpaid': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-50 text-orange-700 border border-orange-200">Chưa thu</span>;
      case 'overdue': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-200 animate-pulse">Quá hạn</span>;
      default: return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-background-light dark:bg-background-dark font-display">
      <Header title="Danh sách Phiếu thu" />
      
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
          
          {/* HEADER & MINI DASHBOARD */}
          <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Quản lý Thu phí</h1>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/invoices/create')}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg shadow-md hover:bg-primary-dark transition-all"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Tạo Phiếu thu
                    </button>
                </div>
              </div>

              {/* MINI-DASHBOARD (Interactive) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div 
                    onClick={() => setStatusFilter('all')}
                    className={`p-4 bg-white dark:bg-[#1a202c] rounded-xl border shadow-sm cursor-pointer transition-all hover:shadow-md ${statusFilter === 'all' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700'}`}
                  >
                      <p className="text-slate-500 text-xs font-bold uppercase">Tổng cần thu</p>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(stats.totalDue)}</h3>
                      <p className="text-xs text-slate-400 mt-1">{stats.count} phiếu</p>
                  </div>
                  <div 
                    onClick={() => setStatusFilter('paid')}
                    className={`p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border cursor-pointer transition-all hover:shadow-md ${statusFilter === 'paid' ? 'border-green-600 ring-1 ring-green-600' : 'border-green-100 dark:border-green-800'}`}
                  >
                      <p className="text-green-700 dark:text-green-400 text-xs font-bold uppercase">Đã thu thực tế</p>
                      <h3 className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{formatCurrency(stats.collected)}</h3>
                      <div className="w-full bg-green-200 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div className="bg-green-600 h-full" style={{width: `${(stats.collected/stats.totalDue)*100}%`}}></div>
                      </div>
                  </div>
                  <div 
                    onClick={() => setStatusFilter('debt_all')} // Filter for ALL debt
                    className={`p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border cursor-pointer transition-all hover:shadow-md ${['unpaid', 'overdue', 'partial', 'debt_all'].includes(statusFilter) ? 'border-red-500 ring-1 ring-red-500' : 'border-red-100 dark:border-red-800'}`}
                  >
                      <p className="text-red-700 dark:text-red-400 text-xs font-bold uppercase">Còn nợ (Phải thu)</p>
                      <h3 className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">{formatCurrency(stats.remaining)}</h3>
                      <p className="text-xs text-red-500 font-medium mt-1">Cần xử lý ngay</p>
                  </div>
              </div>
          </div>

          {/* UNIVERSAL FILTER BAR */}
          <div className="bg-white dark:bg-[#1a202c] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center sticky top-0 z-20">
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input 
                        className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary dark:text-white"
                        placeholder="Tìm hóa đơn, học viên..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                {/* Date Filter */}
                <select 
                    className="h-10 pl-3 pr-8 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-white focus:ring-primary cursor-pointer"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                >
                    <option value="all">Tất cả thời gian</option>
                    <option value="this_month">Tháng này</option>
                    <option value="last_month">Tháng trước</option>
                </select>

                {/* Class Filter */}
                <select 
                    className="h-10 pl-3 pr-8 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-white focus:ring-primary cursor-pointer max-w-[200px]"
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                >
                    <option value="all">Tất cả lớp học</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                {/* Status Filter */}
                <select 
                    className="h-10 pl-3 pr-8 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-white focus:ring-primary cursor-pointer"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="debt_all">Chưa thu & Quá hạn</option>
                    <option value="paid">Hoàn thành</option>
                    <option value="partial">Một phần</option>
                    <option value="unpaid">Chưa thu</option>
                    <option value="overdue">Quá hạn</option>
                </select>
            </div>

            <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
                <ColumnSelector tableId="invoices_table" columns={columnOptions} onChange={setVisibleColumns} />
                <button className="h-10 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold transition-colors">
                    Xuất Excel
                </button>
            </div>
          </div>

          {/* DATA TABLE */}
          <div className="bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-10">
                      <input className="rounded border-slate-300 text-primary focus:ring-primary size-4" type="checkbox"/>
                    </th>
                    {visibleColumns.includes('id') && <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hóa đơn</th>}
                    {visibleColumns.includes('student') && <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Học viên</th>}
                    {visibleColumns.includes('description') && <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nội dung</th>}
                    {visibleColumns.includes('total') && <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Cần thu</th>}
                    {visibleColumns.includes('paid') && <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Đã thu</th>}
                    {visibleColumns.includes('dueDate') && <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Hạn nộp</th>}
                    {visibleColumns.includes('status') && <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Trạng thái</th>}
                    {visibleColumns.includes('actions') && <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Tác vụ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {invoiceList.map((item) => (
                    <tr 
                        key={item.id} 
                        onClick={() => setDetailInvoice(item)}
                        className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${item.status === 'overdue' ? 'bg-red-50/20 dark:bg-red-900/5' : ''}`}
                    >
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <input className="rounded border-slate-300 text-primary focus:ring-primary size-4" type="checkbox"/>
                      </td>
                      {visibleColumns.includes('id') && (
                          <td className="py-3 px-4">
                            <span className="text-sm font-mono font-medium text-primary dark:text-blue-400">#{item.id.split('-').pop()}</span>
                          </td>
                      )}
                      {visibleColumns.includes('student') && (
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                                <Avatar src={item.studentAvatar} name={item.studentName} className="size-8 text-xs" />
                                <div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{item.studentName}</div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">{item.className}</div>
                                </div>
                            </div>
                          </td>
                      )}
                      {visibleColumns.includes('description') && (
                          <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">{item.description}</td>
                      )}
                      {visibleColumns.includes('total') && (
                          <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(item.totalAmount)}</td>
                      )}
                      {visibleColumns.includes('paid') && (
                          <td className="py-3 px-4 text-right font-medium text-green-600">{formatCurrency(item.paidAmount)}</td>
                      )}
                      {visibleColumns.includes('dueDate') && (
                          <td className="py-3 px-4 text-right text-sm text-slate-600 dark:text-slate-400">
                              {new Date(item.dueDate).toLocaleDateString('vi-VN')}
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
                                    className="p-1.5 bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 rounded-md" 
                                    title="Thu tiền"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">payments</span>
                                  </button>
                              )}
                              <button onClick={handlePrint} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md" title="In">
                                <span className="material-symbols-outlined text-[18px]">print</span>
                              </button>
                              <button onClick={(e) => handleDelete(item.id, e)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md" title="Hủy">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </td>
                      )}
                    </tr>
                  ))}
                  {invoiceList.length === 0 && (
                      <tr><td colSpan={visibleColumns.length + 1} className="py-8 text-center text-slate-500">Không tìm thấy dữ liệu.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {quickPayInvoice && (
          <PaymentModal invoice={quickPayInvoice} onClose={() => setQuickPayInvoice(null)} onConfirm={handlePaymentConfirm} />
      )}
      {detailInvoice && (
          <InvoiceDetailModal invoice={detailInvoice} onClose={() => setDetailInvoice(null)} />
      )}
    </div>
  );
};

export default InvoiceList;
