
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import PaymentModal from '../components/PaymentModal';
import InvoiceDetailModal from '../components/InvoiceDetailModal';
import ColumnSelector, { ColumnOption } from '../components/ColumnSelector';
import Avatar from '../components/Avatar';
import AdvancedFilterBar, { FilterState } from '../components/AdvancedFilterBar';

const InvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tuition, students, classes, recordPayment, deleteTuition } = useData();
  
  // --- UNIFIED FILTER STATE ---
  const [filters, setFilters] = useState<FilterState>({
      startDate: '', endDate: '', compareDateStart: '', compareDateEnd: '', isCompare: false,
      source: 'all', classType: 'all', classId: 'all', status: 'all'
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Handle incoming navigation state (Deep Linking)
  useEffect(() => {
      // 1. Filter Check (Debt Status)
      if (location.state && (location.state as any).filter === 'debt') {
          // This is a local filter override, handled via AdvancedFilterBar ideally, 
          // or we can sync it. But AdvancedFilterBar controls status. 
          // For now, we will respect the manual status override logic below if needed, 
          // but AdvancedFilterBar is the source of truth for status.
          // To implement this perfectly, we would need to pass initial props to AdvancedFilterBar.
      }
      // 2. Open Specific Invoice Check
      if (location.state && (location.state as any).openId) {
          const targetId = (location.state as any).openId;
          const target = tuition.find(t => t.id === targetId);
          if (target) {
              const student = students.find(s => s.id === target.studentId);
              const cls = classes.find(c => c.id === student?.classId);
              const isOverdue = target.remainingAmount > 0 && new Date(target.dueDate) < new Date();
              
              setDetailInvoice({
                  id: target.id,
                  studentId: target.studentId,
                  studentName: student?.name || 'Unknown',
                  studentCode: student?.code || 'N/A',
                  studentAvatar: student?.avatar || '?',
                  className: cls?.name || 'Chưa xếp lớp',
                  classId: cls?.id || '',
                  totalAmount: target.totalAmount,
                  paidAmount: target.paidAmount,
                  remainingAmount: target.remainingAmount,
                  dueDate: target.dueDate,
                  status: isOverdue ? 'overdue' : target.status,
                  description: target.description || 'Học phí'
              });
              window.history.replaceState({}, document.title);
          }
      }
  }, [location, tuition, students, classes]);

  // State for Modals
  const [quickPayInvoice, setQuickPayInvoice] = useState<{id: string, studentName: string, remainingAmount: number, totalAmount: number} | null>(null);
  const [detailInvoice, setDetailInvoice] = useState<any | null>(null);

  // Column Configuration
  const columnOptions: ColumnOption[] = [
      { key: 'id', label: 'Mã Phiếu', isMandatory: true },
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
      if (!filters.startDate || !filters.endDate) return true;
      const date = new Date(dateStr);
      const start = new Date(filters.startDate); start.setHours(0,0,0,0);
      const end = new Date(filters.endDate); end.setHours(23,59,59,999);
      return date >= start && date <= end;
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
        const matchClass = filters.classId === 'all' || i.classId === filters.classId;
        
        // Status Logic
        let matchStatus = true;
        if (filters.status === 'all') matchStatus = true;
        else if (filters.status === 'debt_all') matchStatus = i.status === 'unpaid' || i.status === 'partial' || i.status === 'overdue';
        else matchStatus = i.status === filters.status;

        const matchSearch = searchTerm === '' || i.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || i.id.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchDate && matchClass && matchStatus && matchSearch;
    });
  }, [tuition, students, classes, filters, searchTerm]);

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
      <div className="md:hidden">
          <Header title="Danh sách Phiếu thu" />
      </div>
      
      {/* UNIFIED FILTER BAR */}
      <AdvancedFilterBar 
        title="Quản lý Thu phí"
        subtitle="Theo dõi hóa đơn & thanh toán"
        onFilterChange={setFilters}
        showDate={true}
        showClass={true}
        showStatus={true}
        statusOptions={[
            { label: 'Còn nợ (Phải thu)', value: 'debt_all' },
            { label: 'Hoàn thành', value: 'paid' },
            { label: 'Một phần', value: 'partial' },
            { label: 'Quá hạn', value: 'overdue' },
            { label: 'Chưa thu', value: 'unpaid' }
        ]}
        className="border-b border-slate-200 dark:border-slate-700"
        children={
            <div className="relative w-full max-w-[200px] lg:max-w-[300px]">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                <input 
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary dark:text-white" 
                  placeholder="Tìm phiếu, học viên..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        }
        actions={
            <>
                <ColumnSelector 
                    tableId="invoice_table"
                    columns={columnOptions}
                    onChange={setVisibleColumns}
                />
                <button className="h-9 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 font-bold text-xs whitespace-nowrap">
                    Xuất Excel
                </button>
                <button 
                    onClick={() => navigate('/invoices/create')}
                    className="flex items-center justify-center gap-2 px-3 h-9 bg-primary text-white text-xs font-bold rounded-lg shadow-md hover:bg-primary-dark transition-all whitespace-nowrap"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Tạo Phiếu thu
                </button>
            </>
        }
      />

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
          
          {/* MINI-DASHBOARD (Interactive) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white dark:bg-[#1a202c] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <p className="text-slate-500 text-xs font-bold uppercase">Cần thu (Dự kiến)</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(stats.totalDue)}</h3>
                  <p className="text-xs text-slate-400 mt-1">{stats.count} phiếu thu</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-800">
                  <p className="text-green-700 dark:text-green-300 text-xs font-bold uppercase">Đã thực thu</p>
                  <h3 className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{formatCurrency(stats.collected)}</h3>
                  <p className="text-xs text-green-600 mt-1">Đạt {Math.round((stats.collected/stats.totalDue)*100) || 0}%</p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-800">
                  <p className="text-orange-700 dark:text-orange-300 text-xs font-bold uppercase">Còn lại (Công nợ)</p>
                  <h3 className="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1">{formatCurrency(stats.remaining)}</h3>
                  <p className="text-xs text-orange-600 mt-1">Cần đốc thúc</p>
              </div>
          </div>

          {/* DATA TABLE */}
          <div className="bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    {visibleColumns.includes('id') && <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mã Phiếu</th>}
                    {visibleColumns.includes('student') && <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Học viên</th>}
                    {visibleColumns.includes('description') && <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nội dung</th>}
                    {visibleColumns.includes('total') && <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Cần thu</th>}
                    {visibleColumns.includes('paid') && <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Đã thu</th>}
                    {visibleColumns.includes('dueDate') && <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Hạn nộp</th>}
                    {visibleColumns.includes('status') && <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Trạng thái</th>}
                    {visibleColumns.includes('actions') && <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Hành động</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {invoiceList.map((item) => (
                    <tr 
                        key={item.id} 
                        onClick={() => setDetailInvoice(item)}
                        className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      {visibleColumns.includes('id') && (
                          <td className="py-3 px-4 font-mono text-xs text-slate-500">{item.id}</td>
                      )}
                      {visibleColumns.includes('student') && (
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                                <Avatar src={item.studentAvatar} name={item.studentName} className="size-8 text-xs border border-slate-100" />
                                <div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{item.studentName}</div>
                                    <div className="text-[10px] text-slate-500">{item.studentCode}</div>
                                </div>
                            </div>
                          </td>
                      )}
                      {visibleColumns.includes('description') && (
                          <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300 max-w-[200px] truncate">{item.description}</td>
                      )}
                      {visibleColumns.includes('total') && (
                          <td className="py-3 px-4 text-right text-sm font-medium text-slate-500">
                            {formatCurrency(item.totalAmount)}
                          </td>
                      )}
                      {visibleColumns.includes('paid') && (
                          <td className="py-3 px-4 text-right text-sm font-bold text-green-600">
                            {formatCurrency(item.paidAmount)}
                          </td>
                      )}
                      {visibleColumns.includes('dueDate') && (
                          <td className="py-3 px-4 text-right">
                            <span className={`text-xs ${new Date(item.dueDate) < new Date() && item.remainingAmount > 0 ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
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
                                {item.remainingAmount > 0 && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setQuickPayInvoice(item); }}
                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" 
                                        title="Thu tiền nhanh"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">payments</span>
                                    </button>
                                )}
                                <button 
                                    onClick={(e) => handleDelete(item.id, e)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            </div>
                          </td>
                      )}
                    </tr>
                  ))}
                  {invoiceList.length === 0 && (
                      <tr><td colSpan={visibleColumns.length} className="py-12 text-center text-slate-500 italic">Không tìm thấy phiếu thu nào phù hợp.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* MODALS */}
      {quickPayInvoice && (
          <PaymentModal 
            invoice={quickPayInvoice}
            onClose={() => setQuickPayInvoice(null)}
            onConfirm={handlePaymentConfirm}
          />
      )}

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
