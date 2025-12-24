
import React, { useState, useMemo, useEffect } from 'react';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import ColumnSelector, { ColumnOption } from '../components/ColumnSelector';
import Avatar from '../components/Avatar';
import DebtDetailModal from '../components/DebtDetailModal';
import QuickPaymentModal from '../components/QuickPaymentModal';
import { useLocation } from 'react-router-dom';
import StatCard from '../components/StatCard';

const DebtManagement: React.FC = () => {
  const { tuition, students, classes, recordPayment } = useData();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, overdue, due_soon, in_term
  const [classFilter, setClassFilter] = useState('');

  // Selection States
  const [selectedDebt, setSelectedDebt] = useState<any | null>(null);
  const [paymentDebt, setPaymentDebt] = useState<any | null>(null);

  // Column Configuration
  const columnOptions: ColumnOption[] = [
      { key: 'student', label: 'Học viên', isMandatory: true },
      { key: 'description', label: 'Nội dung khoản thu' },
      { key: 'total', label: 'Tổng giá trị' },
      { key: 'paid', label: 'Đã thu' },
      { key: 'remaining', label: 'Công nợ còn lại', isMandatory: true },
      { key: 'status', label: 'Trạng thái nợ', isMandatory: true },
      { key: 'dueDate', label: 'Hạn chót' },
      { key: 'actions', label: 'Tác vụ', isMandatory: true },
  ];
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columnOptions.map(c => c.key));

  // --- DATA PROCESSING ---
  const debtList = useMemo(() => {
      const today = new Date();
      // Filter only unpaid or partial items
      let data = tuition
        .filter(t => t.remainingAmount > 0)
        .map(t => {
            const student = students.find(s => s.id === t.studentId);
            const cls = classes.find(c => c.id === student?.classId);
            
            // Calculate Status Logic
            const dueDate = new Date(t.dueDate);
            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let statusLabel = 'In Term';
            if (diffDays < 0) statusLabel = 'Overdue';
            else if (diffDays <= 3) statusLabel = 'Due Soon';

            return {
                ...t,
                studentName: student?.name || 'Unknown',
                studentCode: student?.code || 'N/A',
                studentAvatar: student?.avatar || '?',
                className: cls?.name || 'N/A',
                debtStatus: statusLabel,
                diffDays
            };
        });

      // Filters
      if (searchTerm) {
          const lower = searchTerm.toLowerCase();
          data = data.filter(i => i.studentName.toLowerCase().includes(lower) || i.studentCode.toLowerCase().includes(lower));
      }
      if (statusFilter !== 'all') {
          if (statusFilter === 'overdue') data = data.filter(i => i.debtStatus === 'Overdue');
          else if (statusFilter === 'due_soon') data = data.filter(i => i.debtStatus === 'Due Soon');
          else if (statusFilter === 'in_term') data = data.filter(i => i.debtStatus === 'In Term');
      }
      if (classFilter) {
          data = data.filter(i => i.className === classFilter);
      }

      // Sort: Overdue first, then Due Soon
      return data.sort((a, b) => {
          const score = (s: string) => s === 'Overdue' ? 3 : s === 'Due Soon' ? 2 : 1;
          return score(b.debtStatus) - score(a.debtStatus) || a.diffDays - b.diffDays;
      });
  }, [tuition, students, classes, searchTerm, statusFilter, classFilter]);

  // --- EFFECT: DEEP LINKING ---
  useEffect(() => {
      // 1. Open Specific Debt
      if (location.state && (location.state as any).openDebtId) {
          const targetId = (location.state as any).openDebtId;
          const target = tuition.find(t => t.id === targetId);
          if (target) {
              const student = students.find(s => s.id === target.studentId);
              const cls = classes.find(c => c.id === student?.classId);
              const today = new Date();
              const dueDate = new Date(target.dueDate);
              const diffTime = dueDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              let statusLabel = 'In Term';
              if (diffDays < 0) statusLabel = 'Overdue';
              else if (diffDays <= 3) statusLabel = 'Due Soon';

              const enriched = {
                  ...target,
                  studentName: student?.name || 'Unknown',
                  studentCode: student?.code || 'N/A',
                  studentAvatar: student?.avatar || '?',
                  className: cls?.name || 'N/A',
                  debtStatus: statusLabel,
                  diffDays
              };
              setSelectedDebt(enriched);
              window.history.replaceState({}, document.title);
          }
      }
  }, [location.state, tuition, students, classes]);

  const totalDebt = debtList.reduce((acc, item) => acc + item.remainingAmount, 0); // Note: Current filtered list sum
  
  // Calculate Global Stats (Independent of filters)
  const globalStats = useMemo(() => {
      const today = new Date();
      let allDebts = tuition
        .filter(t => t.remainingAmount > 0)
        .map(t => {
            const dueDate = new Date(t.dueDate);
            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            let statusLabel = 'In Term';
            if (diffDays < 0) statusLabel = 'Overdue';
            else if (diffDays <= 3) statusLabel = 'Due Soon';
            return { ...t, debtStatus: statusLabel };
        });
        
      return {
          total: allDebts.reduce((acc, i) => acc + i.remainingAmount, 0),
          overdue: allDebts.filter(i => i.debtStatus === 'Overdue').length,
          dueSoon: allDebts.filter(i => i.debtStatus === 'Due Soon').length
      };
  }, [tuition]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handlePaymentConfirm = (amount: number, method: string, note: string) => {
      if (paymentDebt) {
          const result = recordPayment(paymentDebt.id, amount, method);
          if (result.success) {
              alert(`Đã thu ${formatCurrency(amount)} thành công!`);
              setPaymentDebt(null);
              setSelectedDebt(null); // Close detail modal if open to refresh
          } else {
              alert(result.message);
          }
      }
  };

  // Helper for Status Badge
  const getStatusBadge = (status: string, diffDays: number) => {
      if (status === 'Overdue') {
          return (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 text-xs font-bold uppercase">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  Quá hạn {Math.abs(diffDays)} ngày
              </span>
          );
      }
      if (status === 'Due Soon') {
          return (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800 text-xs font-bold uppercase">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  Đến hạn (còn {diffDays} ngày)
              </span>
          );
      }
      return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 text-xs font-bold uppercase">
              Trong hạn
          </span>
      );
  };

  // Click Handlers for StatCards - Acts as Quick Filters
  const handleStatClick = (filterType: string) => {
      setStatusFilter(filterType);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-background-light dark:bg-background-dark font-display">
      <Header title="Quản lý Công nợ" />
      
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
            
            {/* Top Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard 
                    label="Tổng Công nợ phải thu"
                    value={formatCurrency(globalStats.total)}
                    icon="account_balance_wallet"
                    color="blue"
                    tooltip="Click để xem tất cả các khoản nợ."
                    onClick={() => handleStatClick('all')}
                    className={statusFilter === 'all' ? 'ring-2 ring-primary border-primary' : ''}
                />
                <StatCard 
                    label="Khoản nợ Quá hạn"
                    value={`${globalStats.overdue} hồ sơ`}
                    icon="warning"
                    color="red"
                    tooltip="Click để lọc danh sách nợ quá hạn."
                    onClick={() => handleStatClick('overdue')}
                    className={statusFilter === 'overdue' ? 'ring-2 ring-red-500 border-red-500' : ''}
                />
                <StatCard 
                    label="Sắp đến hạn (3 ngày)"
                    value={`${globalStats.dueSoon} hồ sơ`}
                    icon="upcoming"
                    color="orange"
                    tooltip="Click để xem các khoản cần thu gấp."
                    onClick={() => handleStatClick('due_soon')}
                    className={statusFilter === 'due_soon' ? 'ring-2 ring-orange-500 border-orange-500' : ''}
                />
            </div>

            {/* Filters Toolbar */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-white dark:bg-[#1a202c] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                    <div className="relative w-full sm:w-64">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input 
                            className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary dark:text-white"
                            placeholder="Tìm học viên, mã HV..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        className="h-10 pl-3 pr-8 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary dark:text-white cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="overdue">Quá hạn</option>
                        <option value="due_soon">Sắp đến hạn</option>
                        <option value="in_term">Trong hạn</option>
                    </select>
                    <select 
                        className="h-10 pl-3 pr-8 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary dark:text-white cursor-pointer"
                        value={classFilter}
                        onChange={(e) => setClassFilter(e.target.value)}
                    >
                        <option value="">Tất cả lớp học</option>
                        {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                
                <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
                    <ColumnSelector 
                        tableId="debt_table"
                        columns={columnOptions}
                        onChange={setVisibleColumns}
                    />
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Xuất Excel
                    </button>
                </div>
            </div>

            {/* Debt List Table */}
            <div className="bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {visibleColumns.includes('student') && <th className="px-6 py-4">Học viên</th>}
                                {visibleColumns.includes('description') && <th className="px-6 py-4">Nội dung</th>}
                                {visibleColumns.includes('total') && <th className="px-6 py-4 text-right">Tổng HĐ</th>}
                                {visibleColumns.includes('paid') && <th className="px-6 py-4 text-right">Đã thu</th>}
                                {visibleColumns.includes('remaining') && <th className="px-6 py-4 text-right">Còn lại</th>}
                                {visibleColumns.includes('status') && <th className="px-6 py-4 text-center">Trạng thái</th>}
                                {visibleColumns.includes('dueDate') && <th className="px-6 py-4 text-right">Hạn chót</th>}
                                {visibleColumns.includes('actions') && <th className="px-6 py-4 text-right">Tác vụ</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {debtList.map(item => (
                                <tr 
                                    key={item.id} 
                                    onClick={() => setSelectedDebt(item)}
                                    className="group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    {visibleColumns.includes('student') && (
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar src={item.studentAvatar} name={item.studentName} className="size-9 border border-slate-200 dark:border-slate-600 text-xs" />
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{item.studentName}</p>
                                                    <p className="text-xs text-slate-500">{item.studentCode}</p>
                                                </div>
                                            </div>
                                        </td>
                                    )}
                                    {visibleColumns.includes('description') && (
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            {item.description || 'Thu học phí'}
                                        </td>
                                    )}
                                    {visibleColumns.includes('total') && (
                                        <td className="px-6 py-4 text-right text-sm font-medium text-slate-500">
                                            {formatCurrency(item.totalAmount)}
                                        </td>
                                    )}
                                    {visibleColumns.includes('paid') && (
                                        <td className="px-6 py-4 text-right text-sm font-medium text-green-600">
                                            {formatCurrency(item.paidAmount)}
                                        </td>
                                    )}
                                    {visibleColumns.includes('remaining') && (
                                        <td className="px-6 py-4 text-right text-sm font-bold text-red-600">
                                            {formatCurrency(item.remainingAmount)}
                                        </td>
                                    )}
                                    {visibleColumns.includes('status') && (
                                        <td className="px-6 py-4 text-center">
                                            {getStatusBadge(item.debtStatus, item.diffDays)}
                                        </td>
                                    )}
                                    {visibleColumns.includes('dueDate') && (
                                        <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-300">
                                            {new Date(item.dueDate).toLocaleDateString('vi-VN')}
                                        </td>
                                    )}
                                    {visibleColumns.includes('actions') && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setPaymentDebt({ ...item, name: item.studentName, avatar: item.studentAvatar }); }}
                                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold shadow-sm transition-colors flex items-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">payments</span>
                                                    Thu
                                                </button>
                                                <button className="p-1.5 text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-700 rounded transition-colors" title="Chi tiết">
                                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {debtList.length === 0 && (
                                <tr>
                                    <td colSpan={visibleColumns.length} className="py-12 text-center text-slate-500 italic">
                                        Không tìm thấy khoản công nợ nào phù hợp.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination (Simplified) */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
                    <span className="text-xs text-slate-500">Hiển thị {debtList.length} kết quả</span>
                    <div className="flex gap-2">
                        <button className="px-2 py-1 border rounded text-xs hover:bg-white disabled:opacity-50" disabled>Trước</button>
                        <button className="px-2 py-1 border rounded text-xs hover:bg-white">Sau</button>
                    </div>
                </div>
            </div>

        </div>
      </main>

      {/* Detail Modal */}
      {selectedDebt && (
          <DebtDetailModal 
            data={selectedDebt}
            onClose={() => setSelectedDebt(null)}
            onUpdatePayment={() => {
                setPaymentDebt({ ...selectedDebt, name: selectedDebt.studentName, avatar: selectedDebt.studentAvatar });
                // We keep selectedDebt open, payment modal will show on top or replace interaction
            }}
          />
      )}

      {/* Quick Payment Modal */}
      {paymentDebt && (
          <QuickPaymentModal 
            student={{ name: paymentDebt.name, avatar: paymentDebt.avatar } as any}
            balance={paymentDebt.remainingAmount}
            onClose={() => setPaymentDebt(null)}
            onConfirm={handlePaymentConfirm}
          />
      )}
    </div>
  );
};

export default DebtManagement;
