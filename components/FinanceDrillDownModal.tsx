
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import Avatar from './Avatar';
import { useNavigate } from 'react-router-dom';

type DrillType = 'debt' | 'projected' | 'month_detail' | 'audit' | 'revenue_source';

interface Props {
  type: DrillType;
  dataContext?: any;
  onClose: () => void;
}

const FinanceDrillDownModal: React.FC<Props> = ({ type, dataContext, onClose }) => {
  const navigate = useNavigate();
  const { tuition, students, finance, classes, settings, currentUser, recordPayment } = useData();
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('income');
  
  // State for Reconcile Mode (Payment Processing)
  const [reconcileItem, setReconcileItem] = useState<{id: string, amount: number, name: string} | null>(null);
  const [reconcileAmount, setReconcileAmount] = useState<string>('');
  const [reconcileMethod, setReconcileMethod] = useState('transfer');

  const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // --- LOGIC: DEBTORS (Công nợ) ---
  const debtors = useMemo(() => {
    if (type !== 'debt') return [];
    return tuition
      .filter(t => t.remainingAmount > 0 && (t.status === 'partial' || t.status === 'unpaid' || t.status === 'overdue'))
      .map(t => {
        const student = students.find(s => s.id === t.studentId);
        const daysOverdue = Math.floor((new Date().getTime() - new Date(t.dueDate).getTime()) / (1000 * 3600 * 24));
        return { ...t, student, daysOverdue };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue); // Most overdue first
  }, [tuition, students, type]);

  // --- LOGIC: PROJECTED (Dự kiến thu) ---
  const upcomingInvoices = useMemo(() => {
    if (type !== 'projected') return [];
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);
    
    return tuition
      .filter(t => t.remainingAmount > 0 && new Date(t.dueDate) >= today && new Date(t.dueDate) <= next30Days)
      .map(t => {
        const student = students.find(s => s.id === t.studentId);
        return { ...t, student };
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [tuition, students, type]);

  // --- LOGIC: MONTHLY DETAIL (Chi tiết tháng) ---
  const monthlyTransactions = useMemo(() => {
      if (type !== 'month_detail' || !dataContext?.month) return [];
      const monthIndex = parseInt(dataContext.month.replace('T', '')) - 1;
      const currentYear = new Date().getFullYear();
      
      return finance.filter(f => {
          const d = new Date(f.date);
          return d.getMonth() === monthIndex && d.getFullYear() === currentYear && f.type === activeTab;
      }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [finance, type, dataContext, activeTab]);

  // --- LOGIC: AUDIT (Đối soát) ---
  const [actualBalance, setActualBalance] = useState<string>('');
  const systemBalance = useMemo(() => {
      const income = finance.filter(f => f.type === 'income').reduce((acc, c) => acc + c.amount, 0);
      const expense = finance.filter(f => f.type === 'expense').reduce((acc, c) => acc + c.amount, 0);
      return income - expense;
  }, [finance]);
  const auditDiff = actualBalance ? parseInt(actualBalance.replace(/\D/g, '')) - systemBalance : 0;

  // --- HANDLERS ---

  const handleRemind = (channel: 'zalo' | 'sms', student: any, amount: number) => {
      const phone = student?.phone?.replace(/\D/g, '') || '';
      if (!phone) {
          alert("Học viên chưa cập nhật số điện thoại!");
          return;
      }

      const message = `Chào ${student.name}, Trung tâm ${settings.systemName} xin thông báo bạn còn khoản học phí cần thanh toán là ${amount.toLocaleString()}đ. Vui lòng thanh toán sớm để đảm bảo quyền lợi học tập. Xin cảm ơn!`;
      
      if (channel === 'zalo') {
          // Open Zalo chat
          window.open(`https://zalo.me/${phone}`, '_blank');
          // Copy template to clipboard
          navigator.clipboard.writeText(message);
          alert("Đã mở Zalo & Sao chép nội dung tin nhắn mẫu vào bộ nhớ tạm.");
      } else {
          // Open SMS app
          window.open(`sms:${phone}?body=${encodeURIComponent(message)}`, '_blank');
      }
  };

  const initReconcile = (item: any) => {
      setReconcileItem({
          id: item.id,
          amount: item.remainingAmount,
          name: item.student?.name || 'Học viên'
      });
      setReconcileAmount(item.remainingAmount.toString());
  };

  const confirmReconcile = () => {
      if (!reconcileItem) return;
      const amount = parseInt(reconcileAmount.replace(/\D/g, ''));
      
      if (!amount || amount <= 0) {
          alert("Số tiền không hợp lệ.");
          return;
      }

      const result = recordPayment(reconcileItem.id, amount, reconcileMethod);
      if (result.success) {
          alert("Đã cập nhật trạng thái thanh toán thành công!");
          setReconcileItem(null); // Close sub-modal
          // The list will auto-refresh due to context update
      } else {
          alert(result.message);
      }
  };

  const viewStudentDetail = (studentId?: string) => {
      if(studentId) {
          navigate('/students'); // Ideally navigate to specific student detail, simplified here
          onClose();
      }
  };

  // --- RENDERERS ---

  const renderDebtList = () => (
    <div className="flex flex-col gap-3 h-full">
        <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30 shrink-0">
            <div className="flex gap-2 items-center text-red-700 dark:text-red-400">
                <span className="material-symbols-outlined">warning</span>
                <span className="font-bold text-sm">Tổng nợ quá hạn: {debtors.length} hồ sơ</span>
            </div>
            {isAdminOrManager && (
                <button className="text-xs bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-600 px-3 py-1.5 rounded hover:bg-red-50 transition-colors font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">send</span>
                    Gửi nhắc nợ hàng loạt
                </button>
            )}
        </div>
        <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
            {debtors.map(item => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-lg group gap-4">
                    <div className="flex items-center gap-3">
                        <Avatar src={item.student?.avatar} name={item.student?.name || 'Unknown'} className="size-10 text-xs" />
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{item.student?.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                {item.daysOverdue > 7 ? (
                                    <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                                        Quá {item.daysOverdue} ngày
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-medium text-slate-500">
                                        Đến hạn: {new Date(item.dueDate).toLocaleDateString('vi-VN')}
                                    </span>
                                )}
                                <span className="text-[10px] text-slate-400">• {item.student?.code}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{item.remainingAmount.toLocaleString()}đ</p>
                            <p className="text-[10px] text-slate-500">Còn lại</p>
                        </div>

                        {isAdminOrManager && (
                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <div className="relative group/btn">
                                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Nhắc nợ">
                                        <span className="material-symbols-outlined text-[20px]">notifications_active</span>
                                    </button>
                                    {/* Dropdown for Remind */}
                                    <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 hidden group-hover/btn:block z-10 p-1">
                                        <button onClick={() => handleRemind('zalo', item.student, item.remainingAmount)} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 rounded text-left">
                                            <span className="text-blue-600 font-bold">Zalo</span>
                                        </button>
                                        <button onClick={() => handleRemind('sms', item.student, item.remainingAmount)} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 rounded text-left">
                                            <span className="text-green-600 font-bold">SMS</span>
                                        </button>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => initReconcile(item)}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" 
                                    title="Đã thu / Cập nhật"
                                >
                                    <span className="material-symbols-outlined text-[20px]">price_check</span>
                                </button>
                                
                                <button 
                                    onClick={() => viewStudentDetail(item.studentId)}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" 
                                    title="Xem hồ sơ"
                                >
                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderReconcileForm = () => (
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-full text-green-600 shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">payments</span>
              </div>
              <div>
                  <h4 className="text-sm font-bold text-green-800 dark:text-green-300">Xác nhận thu tiền</h4>
                  <p className="text-xs text-green-700 dark:text-green-400">Học viên: {reconcileItem?.name}</p>
              </div>
          </div>

          <div className="flex-1 space-y-5">
              <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Số tiền thực tế đã thu</label>
                  <div className="relative">
                      <input 
                          type="text" 
                          className="w-full text-2xl font-bold text-slate-900 dark:text-white border-b-2 border-slate-200 dark:border-slate-700 bg-transparent py-2 pl-1 focus:ring-0 focus:border-primary transition-colors"
                          value={reconcileAmount ? parseInt(reconcileAmount.replace(/\D/g, '')).toLocaleString('vi-VN') : ''}
                          onChange={(e) => setReconcileAmount(e.target.value)}
                          autoFocus
                      />
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 font-medium">VND</span>
                  </div>
              </div>

              <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hình thức thanh toán</label>
                  <div className="grid grid-cols-2 gap-3">
                      <label className={`border rounded-lg p-3 flex items-center gap-2 cursor-pointer transition-all ${reconcileMethod === 'transfer' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 hover:bg-slate-50'}`}>
                          <input type="radio" name="method" className="sr-only" checked={reconcileMethod === 'transfer'} onChange={() => setReconcileMethod('transfer')} />
                          <span className="material-symbols-outlined text-blue-600">account_balance</span>
                          <span className="text-sm font-medium">Chuyển khoản</span>
                      </label>
                      <label className={`border rounded-lg p-3 flex items-center gap-2 cursor-pointer transition-all ${reconcileMethod === 'cash' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 hover:bg-slate-50'}`}>
                          <input type="radio" name="method" className="sr-only" checked={reconcileMethod === 'cash'} onChange={() => setReconcileMethod('cash')} />
                          <span className="material-symbols-outlined text-green-600">payments</span>
                          <span className="text-sm font-medium">Tiền mặt</span>
                      </label>
                  </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  Hệ thống sẽ tự động cập nhật số dư nợ và tạo phiếu thu.
              </div>
          </div>

          <div className="flex gap-3 mt-6">
              <button 
                  onClick={() => setReconcileItem(null)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                  Quay lại
              </button>
              <button 
                  onClick={confirmReconcile}
                  className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all"
              >
                  Xác nhận Thu
              </button>
          </div>
      </div>
  );

  const renderProjectedList = () => (
      <div className="flex flex-col gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">calendar_month</span>
              Dự kiến thu trong 30 ngày tới: <strong>{upcomingInvoices.reduce((a,b) => a + b.remainingAmount, 0).toLocaleString()}đ</strong>
          </div>
          <div className="overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {upcomingInvoices.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-lg">
                      <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-xs flex-col">
                              <span>T{new Date(item.dueDate).getMonth() + 1}</span>
                              <span className="text-lg leading-none">{new Date(item.dueDate).getDate()}</span>
                          </div>
                          <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{item.student?.name}</p>
                              <p className="text-xs text-slate-500">{item.description || 'Thu học phí'}</p>
                          </div>
                      </div>
                      <div className="text-right">
                          <p className="text-sm font-bold text-green-600 dark:text-green-400">+{item.remainingAmount.toLocaleString()}đ</p>
                          <span className="text-[10px] px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">Sắp đến hạn</span>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderMonthDetail = () => (
      <div className="flex flex-col h-full">
          <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
              <button 
                onClick={() => setActiveTab('income')}
                className={`flex-1 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'income' ? 'border-green-500 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  Doanh thu
              </button>
              <button 
                onClick={() => setActiveTab('expense')}
                className={`flex-1 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'expense' ? 'border-red-500 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  Chi phí
              </button>
          </div>
          <div className="overflow-y-auto max-h-[400px] pr-2 custom-scrollbar flex-1">
              {monthlyTransactions.length === 0 ? (
                  <p className="text-center text-slate-500 py-10">Không có giao dịch nào.</p>
              ) : (
                  monthlyTransactions.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-900 dark:text-white">{item.description}</span>
                              <span className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString('vi-VN')} • {item.category}</span>
                          </div>
                          <span className={`text-sm font-bold ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {item.type === 'income' ? '+' : '-'}{item.amount.toLocaleString()}đ
                          </span>
                      </div>
                  ))
              )}
          </div>
          <div className="pt-3 mt-auto border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <span className="text-sm font-medium text-slate-500">Tổng {activeTab === 'income' ? 'thu' : 'chi'}:</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {monthlyTransactions.reduce((a,b) => a + b.amount, 0).toLocaleString()}đ
              </span>
          </div>
      </div>
  );

  const renderAudit = () => (
      <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Số dư hệ thống</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{systemBalance.toLocaleString()} <span className="text-sm font-normal text-slate-400">VND</span></p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border-2 border-primary/20 focus-within:border-primary transition-colors">
                  <label className="text-xs text-primary uppercase font-bold mb-1 block">Nhập số dư thực tế (Két/Bank)</label>
                  <input 
                    type="text" 
                    className="w-full text-2xl font-bold text-slate-900 dark:text-white bg-transparent border-none p-0 focus:ring-0 placeholder-slate-300"
                    placeholder="0"
                    value={actualBalance ? parseInt(actualBalance.replace(/\D/g, '')).toLocaleString('vi-VN') : ''}
                    onChange={(e) => setActualBalance(e.target.value)}
                    autoFocus
                  />
              </div>
          </div>

          <div className={`p-5 rounded-xl border flex items-center gap-4 ${
              !actualBalance ? 'bg-slate-50 border-slate-200 text-slate-500' :
              auditDiff === 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
              <div className={`p-3 rounded-full ${
                  !actualBalance ? 'bg-slate-200' :
                  auditDiff === 0 ? 'bg-green-200' : 'bg-red-200'
              }`}>
                  <span className="material-symbols-outlined text-2xl">
                      {!actualBalance ? 'calculate' : auditDiff === 0 ? 'check_circle' : 'warning'}
                  </span>
              </div>
              <div>
                  <p className="text-sm font-bold uppercase opacity-80">Trạng thái đối soát</p>
                  <p className="text-xl font-bold">
                      {!actualBalance ? 'Vui lòng nhập số dư thực tế' : 
                       auditDiff === 0 ? 'Khớp số liệu chính xác' : 
                       `Lệch: ${auditDiff > 0 ? '+' : ''}${auditDiff.toLocaleString()} VND`}
                  </p>
              </div>
          </div>

          <div className="text-xs text-slate-500 italic text-center">
              * Hệ thống tự động lưu lịch sử đối soát này vào nhật ký hoạt động.
          </div>
          
          <button 
            disabled={!actualBalance}
            className="w-full py-3 bg-primary disabled:bg-slate-300 text-white rounded-xl font-bold shadow-md hover:bg-primary-dark transition-all"
            onClick={() => { alert("Đã lưu kết quả đối soát!"); onClose(); }}
          >
              Xác nhận & Lưu biên bản
          </button>
      </div>
  );

  const renderRevenueSource = () => {
      // Mock source data aggregation
      const sources = [
          { name: 'Tiếng Đức A1', value: 45000000 },
          { name: 'Tiếng Đức B1', value: 32000000 },
          { name: 'Luyện thi', value: 15000000 },
          { name: 'Khác', value: 5000000 }
      ];
      const total = sources.reduce((a,b) => a + b.value, 0);

      return (
          <div className="flex flex-col gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  {sources.map(s => (
                      <div key={s.name} className="mb-3 last:mb-0">
                          <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-slate-700 dark:text-slate-300">{s.name}</span>
                              <span className="font-bold text-slate-900 dark:text-white">{Math.round((s.value/total)*100)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                              <div className="bg-primary h-full rounded-full" style={{width: `${(s.value/total)*100}%`}}></div>
                          </div>
                          <div className="text-right text-xs text-slate-500 mt-0.5">{s.value.toLocaleString()}đ</div>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  const getTitle = () => {
      switch(type) {
          case 'debt': return 'Quản lý Công nợ Quá hạn';
          case 'projected': return 'Dòng tiền dự kiến (30 ngày)';
          case 'month_detail': return `Chi tiết thu chi tháng ${dataContext?.month || ''}`;
          case 'audit': return 'Đối soát ngân quỹ nhanh';
          case 'revenue_source': return 'Phân bổ nguồn thu';
          default: return 'Chi tiết';
      }
  };

  // If Reconcile Mode is active, show only that form inside the modal body
  const isReconciling = !!reconcileItem;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111318]/60 p-4 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white dark:bg-[#1a202c] w-full max-w-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-[#1a202c]">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isReconciling ? 'Xử lý gạch nợ' : getTitle()}
            </h3>
            <button onClick={() => isReconciling ? setReconcileItem(null) : onClose()} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                <span className="material-symbols-outlined">close</span>
            </button>
        </div>
        <div className="p-6 overflow-hidden flex-1 flex flex-col">
            {isReconciling 
                ? renderReconcileForm() 
                : (
                    <>
                        {type === 'debt' && renderDebtList()}
                        {type === 'projected' && renderProjectedList()}
                        {type === 'month_detail' && renderMonthDetail()}
                        {type === 'audit' && renderAudit()}
                        {type === 'revenue_source' && renderRevenueSource()}
                    </>
                )
            }
        </div>
      </div>
    </div>
  );
};

export default FinanceDrillDownModal;
