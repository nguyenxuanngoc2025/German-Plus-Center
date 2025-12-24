
import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import Avatar from './Avatar';
import { InstallmentItem } from '../types';

interface Props {
  data: any; // Debt record with enriched info
  onClose: () => void;
  onUpdatePayment: () => void;
}

const DebtDetailModal: React.FC<Props> = ({ data, onClose, onUpdatePayment }) => {
  const { finance, settings, updateTuition } = useData();
  const [activeTab, setActiveTab] = useState<'history' | 'plan'>('history');

  // Plan State
  const [plans, setPlans] = useState<InstallmentItem[]>(() => {
      // Initialize with existing plans or default empty
      return data.installments && data.installments.length > 0 ? data.installments : [];
  });

  // Calculate totals for plan validation
  const totalPlanned = useMemo(() => plans.reduce((sum, item) => sum + (Number(item.amount) || 0), 0), [plans]);
  const diffAmount = data.remainingAmount - totalPlanned;

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Filter finance records for this specific invoice/student
  const history = useMemo(() => {
      return finance.filter(f => f.tuitionId === data.id || (f.studentId === data.studentId && f.category === 'Tuition')).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [finance, data]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // --- HANDLERS FOR PLAN ---

  const handleAddPlanRow = () => {
      const nextIndex = plans.length + 1;
      const today = new Date();
      // Suggest next month
      today.setMonth(today.getMonth() + 1);
      
      const newRow: InstallmentItem = {
          id: `INST-${Date.now()}`,
          name: `Đợt ${nextIndex}`,
          amount: diffAmount > 0 ? diffAmount : 0, // Suggest remaining amount
          date: today.toISOString().split('T')[0],
          note: ''
      };
      setPlans([...plans, newRow]);
  };

  const handleRemovePlanRow = (id: string) => {
      setPlans(plans.filter(p => p.id !== id));
  };

  const handlePlanChange = (id: string, field: keyof InstallmentItem, value: any) => {
      setPlans(plans.map(p => {
          if (p.id === id) {
              return { ...p, [field]: value };
          }
          return p;
      }));
  };

  const handleSavePlan = () => {
      updateTuition(data.id, { installments: plans });
      alert('Đã lưu kế hoạch thu phí thành công!');
  };

  const handleExportNotice = () => {
      alert(`Đã tạo phiếu báo nợ cho học viên ${data.studentName}!\nFile PDF đang được tải xuống...`);
  };

  const handleSendReminder = () => {
      const message = `Chào ${data.studentName}, trung tâm ${settings.systemName} xin thông báo bạn còn khoản học phí ${formatCurrency(data.remainingAmount)} cần thanh toán trước ngày ${new Date(data.dueDate).toLocaleDateString('vi-VN')}. Xin cảm ơn!`;
      navigator.clipboard.writeText(message);
      alert('Đã sao chép nội dung tin nhắn nhắc nợ vào bộ nhớ tạm!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-[4px] transition-opacity" 
        onClick={onClose}
      ></div>
      
      {/* Modal Container */}
      <div className="relative bg-white dark:bg-[#1a202c] w-[95%] sm:w-full max-w-[800px] max-h-[85vh] rounded-[12px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 shrink-0">
            <div className="flex gap-4">
                <Avatar src={data.studentAvatar} name={data.studentName} className="size-14 border-2 border-white dark:border-slate-600 shadow-md" />
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{data.studentName}</h3>
                    <p className="text-sm text-slate-500 font-medium">{data.studentCode} • {data.className}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${data.debtStatus === 'Overdue' ? 'bg-red-100 text-red-700' : data.debtStatus === 'Due Soon' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                            {data.debtStatus === 'Overdue' ? 'Quá hạn' : data.debtStatus === 'Due Soon' ? 'Đến hạn' : 'Trong hạn'}
                        </span>
                        <span className="text-xs text-slate-400">Hạn: {new Date(data.dueDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                </div>
            </div>
            <button 
                onClick={onClose} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Đóng (Esc)"
            >
                <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
            
            {/* Financial Overview Card */}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-center sm:text-left">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Tổng giá trị HĐ</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(data.totalAmount)}</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-800 text-center sm:text-left">
                    <p className="text-xs font-bold text-green-700 uppercase mb-1">Đã thu</p>
                    <p className="text-lg font-bold text-green-700 dark:text-green-400">{formatCurrency(data.paidAmount)}</p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-800 text-center sm:text-left">
                    <p className="text-xs font-bold text-red-700 uppercase mb-1">Còn nợ</p>
                    <p className="text-lg font-bold text-red-700 dark:text-red-400">{formatCurrency(data.remainingAmount)}</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-green-500 rounded-full transition-all duration-500" 
                    style={{width: `${(data.paidAmount / data.totalAmount) * 100}%`}}
                ></div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Lịch sử Thu phí
                </button>
                <button 
                    onClick={() => setActiveTab('plan')}
                    className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'plan' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Kế hoạch thu dự kiến
                </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[200px]">
                {activeTab === 'history' ? (
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase text-xs font-bold">
                                <tr>
                                    <th className="px-4 py-3">Ngày thu</th>
                                    <th className="px-4 py-3">Nội dung</th>
                                    <th className="px-4 py-3 text-right">Số tiền</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {history.length > 0 ? history.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors even:bg-slate-50/50 dark:even:bg-slate-800/30">
                                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{new Date(item.date).toLocaleDateString('vi-VN')}</td>
                                        <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{item.description}</td>
                                        <td className="px-4 py-3 text-right font-bold text-green-600">+{formatCurrency(item.amount)}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={3} className="text-center py-8 text-slate-500">Chưa có giao dịch nào.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
                            <span className="material-symbols-outlined text-[18px] mt-0.5">edit_calendar</span>
                            <div>
                                <p className="font-bold">Lập kế hoạch thu</p>
                                <p className="text-xs mt-1">Thêm các đợt thu dự kiến để hệ thống tự động nhắc nhở.</p>
                            </div>
                        </div>

                        {/* Plan Input Table */}
                        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                            <div className="grid grid-cols-12 gap-2 p-3 bg-slate-100 dark:bg-slate-800 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                                <div className="col-span-3">Tên đợt</div>
                                <div className="col-span-3">Ngày dự kiến</div>
                                <div className="col-span-3 text-right">Số tiền</div>
                                <div className="col-span-2">Ghi chú</div>
                                <div className="col-span-1 text-center">Xóa</div>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {plans.map((plan) => (
                                    <div key={plan.id} className="grid grid-cols-12 gap-2 p-2 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="col-span-3">
                                            <input 
                                                type="text" 
                                                value={plan.name}
                                                onChange={(e) => handlePlanChange(plan.id, 'name', e.target.value)}
                                                className="w-full text-sm border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:ring-1 focus:ring-primary dark:bg-slate-800 dark:text-white"
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <input 
                                                type="date" 
                                                value={plan.date}
                                                onChange={(e) => handlePlanChange(plan.id, 'date', e.target.value)}
                                                className="w-full text-sm border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:ring-1 focus:ring-primary dark:bg-slate-800 dark:text-white"
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <input 
                                                type="number" 
                                                value={plan.amount}
                                                onChange={(e) => handlePlanChange(plan.id, 'amount', parseInt(e.target.value))}
                                                className="w-full text-sm border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:ring-1 focus:ring-primary text-right font-bold dark:bg-slate-800 dark:text-white"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input 
                                                type="text" 
                                                value={plan.note || ''}
                                                onChange={(e) => handlePlanChange(plan.id, 'note', e.target.value)}
                                                placeholder="..."
                                                className="w-full text-sm border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:ring-1 focus:ring-primary dark:bg-slate-800 dark:text-white"
                                            />
                                        </div>
                                        <div className="col-span-1 text-center">
                                            <button 
                                                onClick={() => handleRemovePlanRow(plan.id)}
                                                className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {plans.length === 0 && (
                                    <div className="p-4 text-center text-sm text-slate-400 italic">Chưa có kế hoạch thu nào. Nhấn "Thêm đợt thu" để tạo.</div>
                                )}
                            </div>
                        </div>

                        {/* Summary & Actions */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <button 
                                onClick={handleAddPlanRow}
                                className="text-primary text-sm font-bold hover:underline flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                Thêm đợt thu
                            </button>
                            
                            <div className="flex items-center gap-4 text-sm bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div>
                                    <span className="text-slate-500">Tổng dự kiến: </span>
                                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(totalPlanned)}</span>
                                </div>
                                <div className={`px-2 py-0.5 rounded border ${diffAmount === 0 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                    <span className="text-xs font-bold">
                                        {diffAmount === 0 ? 'Đã khớp' : `Lệch: ${formatCurrency(diffAmount)}`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleSavePlan}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-900 dark:bg-primary dark:hover:bg-primary-dark text-white rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">save</span>
                            Lưu kế hoạch
                        </button>
                    </div>
                )}
            </div>

        </div>

        {/* Footer Actions (Fixed) */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
            <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={handleExportNotice} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-white text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">print</span>
                    In báo nợ
                </button>
                <button onClick={handleSendReminder} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-white text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    Gửi tin nhắn
                </button>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <button 
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-5 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white text-sm font-bold transition-colors"
                >
                    Đóng
                </button>
                {data.remainingAmount > 0 && (
                    <button 
                        onClick={onUpdatePayment}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold shadow-md transition-all transform active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[20px]">payments</span>
                        Cập nhật Thu phí
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default DebtDetailModal;
