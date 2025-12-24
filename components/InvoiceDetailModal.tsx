
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import Avatar from './Avatar';
import InvoicePrintModal from './InvoicePrintModal';

interface Props {
  invoice: {
    id: string;
    studentId: string;
    studentName: string;
    studentCode: string;
    studentAvatar: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    dueDate: string;
    status: string;
  };
  onClose: () => void;
}

const InvoiceDetailModal: React.FC<Props> = ({ invoice, onClose }) => {
  const { finance, tuition, updateTuition } = useData();
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  
  // LIVE DATA: Find the actual invoice record from context to ensure real-time updates
  const liveInvoice = useMemo(() => {
      return tuition.find(t => t.id === invoice.id) || {
          ...invoice,
          paidAmount: invoice.paidAmount,
          remainingAmount: invoice.remainingAmount,
          status: invoice.status
      };
  }, [tuition, invoice]);

  const [dueDate, setDueDate] = useState(liveInvoice.dueDate);
  const [note, setNote] = useState('Học phí khóa A1 - K24');

  // Filter payment history specifically for THIS invoice
  const paymentHistory = useMemo(() => {
      return finance.filter(f => f.tuitionId === invoice.id || (f.studentId === invoice.studentId && f.category === 'Tuition' && !f.tuitionId));
  }, [finance, invoice.id, invoice.studentId]);

  const handleUpdate = () => {
      updateTuition(invoice.id, { dueDate });
      alert('Đã cập nhật thông tin phiếu thu!');
      onClose();
  };

  const handleDownloadPDF = () => {
      alert("Đang tạo file PDF... (Tính năng mô phỏng)");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111318]/60 p-4 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white dark:bg-[#1a202c] w-full max-w-[800px] max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-700 relative">
        
        {/* Header - Fixed top */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-primary dark:text-blue-300 rounded-lg">
                <span className="material-symbols-outlined">receipt_long</span>
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Chi tiết Phiếu thu</h3>
                <p className="text-xs text-slate-500 font-mono">#{invoice.id}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsPrintOpen(true)}
                className="p-2 text-slate-500 hover:text-primary hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="In Phiếu thu"
              >
                <span className="material-symbols-outlined text-[20px]">print</span>
              </button>
              <button 
                onClick={handleDownloadPDF}
                className="p-2 text-slate-500 hover:text-primary hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Tải xuống PDF"
              >
                <span className="material-symbols-outlined text-[20px]">download</span>
              </button>
              <button 
                onClick={() => setIsPrintOpen(true)} // Reusing Print Modal as "Expand/View Full"
                className="p-2 text-slate-500 hover:text-primary hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Xem bản in đầy đủ"
              >
                <span className="material-symbols-outlined text-[20px]">open_in_full</span>
              </button>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-600 mx-2"></div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
            
            {/* Student Info & Status */}
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-700">
                    <Avatar src={invoice.studentAvatar} name={invoice.studentName} className="size-12 shrink-0 border border-slate-200 dark:border-slate-600" />
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase mb-1">Học viên</p>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">{invoice.studentName}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">{invoice.studentCode}</p>
                    </div>
                </div>
                <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col justify-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase mb-2">Trạng thái thanh toán</p>
                    <div className="flex items-center gap-3">
                        <div className={`h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden`}>
                            <div 
                                className={`h-full ${liveInvoice.remainingAmount <= 0 ? 'bg-green-500' : 'bg-orange-500'}`} 
                                style={{width: `${(liveInvoice.paidAmount / liveInvoice.totalAmount) * 100}%`}}
                            ></div>
                        </div>
                        <span className={`text-sm font-bold ${liveInvoice.remainingAmount <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                            {Math.round((liveInvoice.paidAmount / liveInvoice.totalAmount) * 100)}%
                        </span>
                    </div>
                    <div className="flex justify-between mt-2 text-xs">
                        <span className="text-slate-500">Đã thu: <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(liveInvoice.paidAmount)}</strong></span>
                        <span className="text-slate-500">Còn lại: <strong className="text-red-600 dark:text-red-400">{formatCurrency(liveInvoice.remainingAmount)}</strong></span>
                    </div>
                </div>
            </div>

            {/* Editable Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Ngày lập phiếu</label>
                    <input type="date" className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm py-2.5 px-3 focus:ring-primary focus:border-primary disabled:bg-slate-100 disabled:text-slate-500" value="2023-10-25" disabled />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Hạn thanh toán</label>
                    <input 
                        type="date" 
                        className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm py-2.5 px-3 focus:ring-primary focus:border-primary" 
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Ghi chú nội bộ</label>
                    <textarea 
                        className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm py-2.5 px-3 focus:ring-primary focus:border-primary min-h-[80px]"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    ></textarea>
                </div>
            </div>

            {/* History Table */}
            <div className="pb-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">history</span>
                    Lịch sử giao dịch
                </h4>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="py-2.5 px-4 font-medium text-slate-500 dark:text-slate-400">Ngày</th>
                                <th className="py-2.5 px-4 font-medium text-slate-500 dark:text-slate-400">Nội dung</th>
                                <th className="py-2.5 px-4 font-medium text-slate-500 dark:text-slate-400 text-right">Số tiền</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {paymentHistory.length > 0 ? paymentHistory.map(rec => (
                                <tr key={rec.id}>
                                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{rec.date}</td>
                                    <td className="py-3 px-4 text-slate-900 dark:text-white font-medium">{rec.description}</td>
                                    <td className="py-3 px-4 text-right text-green-600 font-bold">+{formatCurrency(rec.amount)}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} className="py-4 text-center text-slate-500 italic">Chưa có giao dịch nào</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                            <tr>
                                <td colSpan={2} className="py-3 px-4 text-right font-bold text-slate-700 dark:text-slate-300">Tổng đã thu:</td>
                                <td className="py-3 px-4 text-right font-bold text-primary">{formatCurrency(liveInvoice.paidAmount)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

        </div>

        {/* Footer - Fixed bottom */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center shrink-0">
            <button 
                onClick={() => setIsPrintOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-primary dark:text-blue-300 text-sm font-bold shadow-sm hover:bg-blue-50 dark:hover:bg-slate-600 transition-colors"
            >
                <span className="material-symbols-outlined text-[18px]">print</span>
                Xem phiếu thu (Bản in)
            </button>
            
            <div className="flex gap-3">
                <button 
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                    Đóng
                </button>
                <button 
                    onClick={handleUpdate}
                    className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-bold shadow-sm transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    Cập nhật
                </button>
            </div>
        </div>
      </div>
    </div>

    {/* Print Modal Overlay */}
    {isPrintOpen && (
        <InvoicePrintModal 
            invoice={{...liveInvoice, studentName: invoice.studentName, className: invoice.studentCode ? 'Lớp chưa xếp' : 'Lớp A1'}} 
            onClose={() => setIsPrintOpen(false)} 
        />
    )}
    </>
  );
};

export default InvoiceDetailModal;
