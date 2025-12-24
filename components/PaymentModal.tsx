
import React, { useState, useEffect } from 'react';

interface Props {
  invoice: {
    id: string;
    studentName: string;
    remainingAmount: number;
    totalAmount: number;
  };
  onClose: () => void;
  onConfirm: (amount: number, method: string) => void;
}

const PaymentModal: React.FC<Props> = ({ invoice, onClose, onConfirm }) => {
  const [amount, setAmount] = useState(invoice.remainingAmount.toString());
  const [method, setMethod] = useState('transfer');

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(amount.replace(/\D/g, ''));
    if (!numAmount || numAmount <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    if (numAmount > invoice.remainingAmount) {
        alert("Số tiền thu không được vượt quá số tiền còn lại!");
        return;
    }
    onConfirm(numAmount, method);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setAmount(raw ? parseInt(raw).toLocaleString('vi-VN') : '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111318]/60 p-4 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white dark:bg-[#1a202c] w-full max-w-[500px] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a202c]">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Xác nhận thu tiền</h3>
            <p className="text-xs text-slate-500">Hóa đơn: <span className="font-mono text-primary">{invoice.id}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          
          {/* Info Card */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 flex flex-col gap-1">
            <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Học viên:</span>
                <span className="font-bold text-slate-900 dark:text-white">{invoice.studentName}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Còn phải thu:</span>
                <span className="font-bold text-orange-600 dark:text-orange-400">{formatCurrency(invoice.remainingAmount)} VND</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Số tiền thực nhận (VND) <span className="text-red-500">*</span></label>
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full h-12 pl-4 pr-12 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-lg font-bold text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                  value={amount}
                  onChange={handleAmountChange}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">đ</span>
              </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Hình thức thanh toán</label>
                <div className="grid grid-cols-2 gap-3">
                    <label className={`cursor-pointer border rounded-lg p-3 flex items-center gap-2 transition-all ${method === 'transfer' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                        <input type="radio" name="method" className="sr-only" checked={method === 'transfer'} onChange={() => setMethod('transfer')} />
                        <span className="material-symbols-outlined">account_balance</span>
                        <span className="text-sm font-medium">Chuyển khoản</span>
                    </label>
                    <label className={`cursor-pointer border rounded-lg p-3 flex items-center gap-2 transition-all ${method === 'cash' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                        <input type="radio" name="method" className="sr-only" checked={method === 'cash'} onChange={() => setMethod('cash')} />
                        <span className="material-symbols-outlined">payments</span>
                        <span className="text-sm font-medium">Tiền mặt</span>
                    </label>
                </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
            >
                Hủy bỏ
            </button>
            <button 
                type="submit"
                className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold shadow-sm transition-all flex items-center gap-2"
            >
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                Hoàn tất giao dịch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
