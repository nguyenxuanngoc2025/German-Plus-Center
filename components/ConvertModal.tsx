
import React, { useState, useEffect, useMemo } from 'react';
import { Lead } from '../types';
import { useData } from '../context/DataContext';

interface Props {
  lead: Lead;
  onClose: () => void;
}

interface Installment {
    date: string;
    amount: number;
}

const ConvertModal: React.FC<Props> = ({ lead, onClose }) => {
  const { convertLeadToStudent, classes } = useData();
  
  // Get active classes and sort/filter based on lead preference
  const suggestedClasses = useMemo(() => {
      let active = classes.filter(c => c.status !== 'full');
      
      // Sort priority: Matching Mode > Others
      if (lead.learningMode) {
          active.sort((a, b) => {
              if (a.mode === lead.learningMode && b.mode !== lead.learningMode) return -1;
              if (a.mode !== lead.learningMode && b.mode === lead.learningMode) return 1;
              return 0;
          });
      }
      return active;
  }, [classes, lead.learningMode]);
  
  const [selectedClassId, setSelectedClassId] = useState(suggestedClasses[0]?.id || "");
  const [tuition, setTuition] = useState<number>(5000000);
  
  // Payment States
  const [paymentMethod, setPaymentMethod] = useState<'full' | 'installment'>('full');
  const [deposit, setDeposit] = useState<string>('2000000');
  const [installmentCount, setInstallmentCount] = useState<number>(2);
  const [installments, setInstallments] = useState<Installment[]>([]);

  // Update tuition when class changes
  useEffect(() => {
      const cls = classes.find(c => c.id === selectedClassId);
      if(cls) setTuition(cls.tuitionFee);
  }, [selectedClassId, classes]);

  // Recalculate installments when dependent values change
  useEffect(() => {
      if (paymentMethod === 'installment') {
          const depositAmount = parseInt(deposit.replace(/\D/g, '')) || 0;
          const remaining = Math.max(0, tuition - depositAmount);
          const perInstallment = remaining > 0 ? Math.floor(remaining / installmentCount) : 0;
          
          const newInstallments: Installment[] = [];
          for (let i = 0; i < installmentCount; i++) {
              const date = new Date();
              date.setMonth(date.getMonth() + i + 1); // Next months
              newInstallments.push({
                  date: date.toISOString().split('T')[0],
                  amount: perInstallment + (i === installmentCount - 1 ? (remaining - perInstallment * installmentCount) : 0) // Adjust last installment for rounding
              });
          }
          setInstallments(newInstallments);
      }
  }, [paymentMethod, deposit, installmentCount, tuition]);

  const handleInstallmentChange = (index: number, field: 'date' | 'amount', value: string) => {
      const newInst = [...installments];
      if (field === 'date') newInst[index].date = value;
      if (field === 'amount') newInst[index].amount = parseInt(value.replace(/\D/g, '')) || 0;
      setInstallments(newInst);
  };

  const handleConvert = () => {
    if (!selectedClassId) {
        alert("Vui lòng chọn lớp học!");
        return;
    }

    const depositAmount = parseInt(deposit.replace(/\D/g, '')) || 0;
    
    // Prepare payment plan data
    const plan = {
        method: paymentMethod,
        deposit: paymentMethod === 'full' ? tuition : depositAmount,
        installments: paymentMethod === 'full' ? [] : installments
    };

    const result = convertLeadToStudent(lead.id, selectedClassId, tuition, plan);
    
    if (result.success) {
        alert(result.message);
        onClose();
    } else {
        alert("Lỗi: " + result.message);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val);

  // Find selected class info for display
  const selectedClassInfo = classes.find(c => c.id === selectedClassId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111318]/60 p-4 sm:p-6 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white dark:bg-[#1a202c] w-full max-w-[1000px] max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#dbdfe6] dark:border-gray-700 bg-white dark:bg-[#1a202c] shrink-0">
          <div className="flex flex-col gap-1">
            <h2 className="text-[#111318] dark:text-white text-xl font-bold leading-tight">Chốt Sales & Nhập học</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Thiết lập lộ trình đóng phí và xếp lớp</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 modal-scroll bg-slate-50/50 dark:bg-[#1a202c]">
          {/* Lead Summary */}
          <div className="flex items-center justify-between p-4 mb-6 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-primary dark:text-blue-200 font-bold text-lg overflow-hidden">
                 {lead.avatar.startsWith('http') ? (
                    <img src={lead.avatar} alt="Avatar" className="w-full h-full object-cover" />
                 ) : lead.avatar}
              </div>
              <div>
                <p className="text-[#111318] dark:text-white text-base font-bold">{lead.name}</p>
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">mail</span> {lead.email || 'Chưa có email'}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">call</span> {lead.phone || 'Chưa có SĐT'}</span>
                </div>
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-1">
              <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 text-xs font-semibold uppercase tracking-wider">Lead #{lead.id}</span>
              {lead.learningMode && (
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${lead.learningMode === 'online' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
                      Muốn học: {lead.learningMode}
                  </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT COLUMN: CLASS SELECTION */}
            <div className="flex flex-col gap-6">
              <h3 className="flex items-center gap-2 text-[#111318] dark:text-white text-base font-bold uppercase tracking-wider text-xs text-slate-500 mb-1">
                <span className="material-symbols-outlined text-primary text-lg">school</span>
                Thông tin lớp học
              </h3>
              
              <div className="flex flex-col gap-2">
                <label className="text-[#111318] dark:text-slate-200 text-sm font-medium">Chọn lớp học <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select 
                    className="w-full h-12 pl-4 pr-10 rounded-lg border border-[#dbdfe6] dark:border-slate-600 bg-white dark:bg-slate-800 text-[#111318] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none text-base cursor-pointer"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                  >
                    <option value="" disabled>-- Chọn lớp học --</option>
                    {suggestedClasses.map(cls => (
                        <option key={cls.id} value={cls.id}>
                            {cls.mode === lead.learningMode ? '★ ' : ''} {cls.name} ({cls.mode === 'online' ? 'Online' : 'Offline'}) - {cls.schedule}
                        </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
                <p className="text-xs text-slate-500">
                    {lead.learningMode ? `Đang ưu tiên hiển thị các lớp ${lead.learningMode} theo nguyện vọng.` : 'Chỉ hiển thị các lớp còn chỗ trống.'}
                </p>
              </div>
              
              {selectedClassInfo && (
              <div className="bg-[#f0f2f4] dark:bg-slate-800 rounded-xl p-5 border border-transparent dark:border-slate-700 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-primary shadow-sm">
                    <span className="material-symbols-outlined">calendar_month</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Lịch học dự kiến</p>
                    <p className="text-[#111318] dark:text-white font-bold text-lg leading-tight">{selectedClassInfo.schedule}</p>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">
                            {selectedClassInfo.mode === 'online' ? 'language' : 'apartment'}
                        </span>
                        {selectedClassInfo.mode === 'online' ? 'Học Online' : 'Học tại trung tâm'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 overflow-hidden shadow-sm">
                    <img src={selectedClassInfo.teacherAvatar} className="w-full h-full object-cover" alt="Teacher" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Giáo viên phụ trách</p>
                    <p className="text-[#111318] dark:text-white font-medium text-sm">{selectedClassInfo.teacher}</p>
                  </div>
                </div>
              </div>
              )}
            </div>

            {/* RIGHT COLUMN: PAYMENT PLAN */}
            <div className="flex flex-col gap-6 relative">
               <div className="hidden lg:block absolute left-[-16px] top-0 bottom-0 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
                <h3 className="flex items-center gap-2 text-[#111318] dark:text-white text-base font-bold uppercase tracking-wider text-xs text-slate-500 mb-1">
                <span className="material-symbols-outlined text-primary text-lg">payments</span>
                Phương thức đóng phí
              </h3>

               {/* Toggle Method */}
               <div className="flex p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                   <button 
                        onClick={() => setPaymentMethod('full')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${paymentMethod === 'full' ? 'bg-white dark:bg-slate-600 text-primary dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'}`}
                   >
                       Thanh toán 1 lần (Full)
                   </button>
                   <button 
                        onClick={() => setPaymentMethod('installment')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${paymentMethod === 'installment' ? 'bg-white dark:bg-slate-600 text-primary dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'}`}
                   >
                       Đặt cọc / Trả góp
                   </button>
               </div>

               <div className="space-y-4">
                <div className="flex flex-col gap-2">
                    <label className="text-[#111318] dark:text-slate-200 text-sm font-medium">Tổng học phí</label>
                    <div className="relative group">
                        <input 
                            type="text" 
                            value={formatCurrency(tuition)} 
                            readOnly 
                            className="w-full h-12 pl-4 pr-12 rounded-lg border border-[#dbdfe6] dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold text-lg focus:outline-none text-right" 
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">VND</span>
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">lock</span>
                    </div>
                </div>

                {paymentMethod === 'installment' && (
                    <div className="animate-in fade-in slide-in-from-top-2 space-y-4 border-t border-dashed border-slate-200 dark:border-slate-700 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-slate-900 dark:text-white text-xs font-bold uppercase mb-1 block">Số tiền Cọc/Đóng trước</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={deposit}
                                        onChange={(e) => setDeposit(e.target.value)}
                                        className="w-full p-2.5 rounded-lg border border-primary dark:border-primary/50 text-right font-bold text-primary focus:ring-1 focus:ring-primary"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50 text-xs">VND</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1 block">Số đợt còn lại</label>
                                <select 
                                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                    value={installmentCount}
                                    onChange={(e) => setInstallmentCount(parseInt(e.target.value))}
                                >
                                    <option value="1">1 đợt nữa</option>
                                    <option value="2">2 đợt nữa</option>
                                    <option value="3">3 đợt nữa</option>
                                </select>
                            </div>
                        </div>

                        {/* Installment Schedule */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 space-y-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Lịch đóng phí dự kiến (Tự động chia)</p>
                            {installments.map((inst, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-400 w-12">Đợt {idx + 2}</span>
                                    <input 
                                        type="date" 
                                        value={inst.date}
                                        onChange={(e) => handleInstallmentChange(idx, 'date', e.target.value)}
                                        className="flex-1 p-1.5 text-xs border rounded bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                                    />
                                    <input 
                                        type="text"
                                        value={formatCurrency(inst.amount)}
                                        readOnly
                                        className="w-24 p-1.5 text-xs border rounded bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-600 text-right font-medium"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-900/30 mt-2">
                    <span className="text-emerald-800 dark:text-emerald-200 text-sm font-semibold">
                        {paymentMethod === 'full' ? 'Thu ngay (Toàn bộ)' : 'Thu ngay (Đặt cọc)'}
                    </span>
                    <span className="text-emerald-700 dark:text-white text-2xl font-bold tracking-tight">
                        {formatCurrency(paymentMethod === 'full' ? tuition : parseInt(deposit.replace(/\D/g, '') || '0'))} 
                        <span className="text-sm font-medium text-emerald-600/70 ml-1">VND</span>
                    </span>
                </div>
               </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-[#dbdfe6] dark:border-gray-700 bg-white dark:bg-[#1a202c] shrink-0 flex items-center justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-[#dbdfe6] dark:border-gray-600 text-slate-600 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Hủy bỏ
            </button>
            <button 
                onClick={handleConvert}
                className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
            >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Xác nhận
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConvertModal;
