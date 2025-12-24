
import React, { useState } from 'react';
import { Student } from '../types';
import Avatar from './Avatar';

interface Props {
  student: Student;
  balance: number;
  onClose: () => void;
  onConfirm: (amount: number, method: string, note: string) => void;
}

const QuickPaymentModal: React.FC<Props> = ({ student, balance, onClose, onConfirm }) => {
  const [amount, setAmount] = useState<string>(balance.toString());
  const [method, setMethod] = useState<string>('transfer');
  const [note, setNote] = useState<string>('');

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setAmount(raw ? parseInt(raw).toString() : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(amount || '0');
    
    if (numAmount <= 0) {
        alert("Vui lòng nhập số tiền hợp lệ!");
        return;
    }
    if (numAmount > balance) {
        if (!confirm("Số tiền nhập lớn hơn tổng nợ. Bạn có chắc chắn muốn ghi nhận khoản thu này?")) return;
    }

    onConfirm(numAmount, method, note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111318]/60 p-4 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white dark:bg-[#1a202c] w-full max-w-[500px] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-green-600">payments</span>
                Cập nhật đóng phí
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <span className="material-symbols-outlined">close</span>
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
            
            {/* Student Info */}
            <div className="flex items-center gap-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <Avatar src={student.avatar} name={student.name} className="size-10 border border-blue-200 dark:border-blue-700" />
                <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{student.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Tổng nợ: <span className="text-red-600 font-bold">{formatCurrency(balance)} đ</span></p>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Số tiền thực đóng <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <input 
                            type="text" 
                            className="w-full h-12 pl-4 pr-12 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-lg font-bold text-slate-900 dark:text-white focus:ring-primary focus:border-primary text-right"
                            value={amount ? parseInt(amount).toLocaleString('vi-VN') : ''}
                            onChange={handleAmountChange}
                            placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">đ</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                        <button type="button" onClick={() => setAmount(balance.toString())} className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-2 py-1 rounded transition-colors">Tất cả</button>
                        <button type="button" onClick={() => setAmount((balance/2).toString())} className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-2 py-1 rounded transition-colors">50%</button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Hình thức thanh toán</label>
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

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Ghi chú (Tùy chọn)</label>
                    <input 
                        type="text" 
                        className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary dark:text-white"
                        placeholder="Ví dụ: Đóng tiền đợt 2, người nhà đóng hộ..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <button 
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                    Hủy bỏ
                </button>
                <button 
                    type="submit"
                    className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold shadow-sm transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    Xác nhận thu tiền
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default QuickPaymentModal;
