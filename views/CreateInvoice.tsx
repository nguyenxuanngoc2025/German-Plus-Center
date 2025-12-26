
import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { readMoney } from '../components/InvoicePrintModal'; 
import { useFormPersistence } from '../hooks/useFormPersistence';

interface ServiceItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

const CreateInvoice: React.FC = () => {
  const navigate = useNavigate();
  const { addFinanceRecord, settings, currentUser } = useData();

  // Persistent Form State
  const [formData, setFormData, clearDraft] = useFormPersistence('draft_invoice_form', {
      studentName: 'Nguyễn Thành Nam',
      courseName: 'A1 Intensiv - K24 (Đang học)',
      issueDate: new Date().toISOString().split('T')[0],
      items: [
        { id: 1, name: 'Học phí khóa A1 Intensiv', quantity: 1, price: 5000000 },
        { id: 2, name: 'Giáo trình Studio 21 - A1', quantity: 1, price: 250000 }
      ] as ServiceItem[],
      discountType: 'percent' as 'percent' | 'amount',
      discountValue: 0
  });

  // Calculations
  const subtotal = useMemo(() => {
    return formData.items.reduce((acc: number, item: ServiceItem) => acc + (item.quantity * item.price), 0);
  }, [formData.items]);

  const discountAmount = useMemo(() => {
    if (formData.discountType === 'percent') {
      return (subtotal * formData.discountValue) / 100;
    }
    return formData.discountValue;
  }, [subtotal, formData.discountType, formData.discountValue]);

  const total = subtotal - discountAmount;

  // Handlers
  const handleAddItem = () => {
    const newItem: ServiceItem = {
      id: Date.now(),
      name: '',
      quantity: 1,
      price: 0
    };
    setFormData({ ...formData, items: [...formData.items, newItem] });
  };

  const handleRemoveItem = (id: number) => {
    setFormData({ ...formData, items: formData.items.filter((item: ServiceItem) => item.id !== id) });
  };

  const handleItemChange = (id: number, field: keyof ServiceItem, value: string | number) => {
    setFormData({
        ...formData,
        items: formData.items.map((item: ServiceItem) => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        })
    });
  };

  const handleSave = () => {
      const description = formData.items.map((i: ServiceItem) => `${i.name}`).join(', ');

      addFinanceRecord({
          type: 'income',
          amount: total,
          category: 'Tuition',
          description: description + ` - ${formData.studentName}`,
          date: formData.issueDate
      });

      alert('Đã lưu và xuất phiếu thu thành công!');
      clearDraft();
      navigate('/finance/invoices');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-background-light dark:bg-background-dark font-display">
      <Header title="Tạo Phiếu thu" />
      
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 scroll-smooth">
        <div className="max-w-[1600px] mx-auto h-full flex flex-col">
          {/* Page Title & Main Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Tạo Phiếu thu Mới</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Lập phiếu thu học phí và các khoản dịch vụ khác.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => { clearDraft(); navigate('/finance/invoices'); }} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">close</span>
                <span>Hủy</span>
              </button>
              <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">print</span>
                <span>Lưu & Xuất phiếu</span>
              </button>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full pb-10">
            
            {/* LEFT COLUMN: Form Input */}
            <div className="xl:col-span-5 flex flex-col gap-6">
              
              {/* General Info Card */}
              <div className="bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">person</span>
                  Thông tin người nộp
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {/* Student Select */}
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Học viên / Người nộp <span className="text-red-500">*</span></span>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-slate-400 text-[20px]">person_search</span>
                      </div>
                      <input 
                        className="block w-full pl-10 pr-10 py-2.5 rounded-lg border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary focus:ring-primary sm:text-sm" 
                        placeholder="Tìm kiếm tên hoặc mã HV..." 
                        type="text" 
                        value={formData.studentName}
                        onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      />
                    </div>
                  </label>
                  {/* Class Select */}
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Lớp / Nội dung</span>
                    <input 
                        className="block w-full py-2.5 px-3 rounded-lg border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary focus:ring-primary sm:text-sm"
                        value={formData.courseName}
                        onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                        placeholder="Nhập địa chỉ hoặc lớp..."
                    />
                  </label>
                  {/* Date */}
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Ngày lập phiếu</span>
                    <input 
                      className="block w-full py-2.5 rounded-lg border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary focus:ring-primary sm:text-sm" 
                      type="date" 
                      value={formData.issueDate}
                      onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    />
                  </label>
                </div>
              </div>

              {/* Services Card */}
              <div className="bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">payments</span>
                    Khoản thu chi tiết
                  </h2>
                  <button onClick={handleAddItem} className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    Thêm mục
                  </button>
                </div>
                
                {/* List of Items Input */}
                <div className="flex flex-col gap-4">
                  {formData.items.map((item: ServiceItem) => (
                    <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50 group relative animate-in fade-in slide-in-from-top-2">
                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        className="absolute -top-2 -right-2 bg-white dark:bg-slate-700 text-red-500 hover:text-red-600 rounded-full shadow-sm border border-slate-200 dark:border-slate-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Xóa mục"
                      >
                        <span className="material-symbols-outlined text-[16px] block">close</span>
                      </button>
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-12 sm:col-span-7">
                          <label className="text-xs text-slate-500 mb-1 block">Lý do thu</label>
                          <input 
                            className="w-full text-sm border-0 border-b border-slate-200 dark:border-slate-600 bg-transparent focus:ring-0 focus:border-primary px-0 py-1 font-medium text-slate-900 dark:text-white placeholder:text-slate-400" 
                            type="text" 
                            value={item.name}
                            onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                            placeholder="Nhập nội dung thu"
                          />
                        </div>
                        <div className="col-span-12 sm:col-span-5">
                          <label className="text-xs text-slate-500 mb-1 block text-right">Thành tiền (VNĐ)</label>
                          <input 
                            className="w-full text-sm border-0 border-b border-slate-200 dark:border-slate-600 bg-transparent focus:ring-0 focus:border-primary px-0 py-1 text-right text-slate-900 dark:text-white font-bold" 
                            type="text" 
                            value={item.price}
                            onChange={(e) => handleItemChange(item.id, 'price', parseInt(e.target.value.replace(/\D/g, '')) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary Inputs */}
                <div className="mt-6 border-t border-slate-100 dark:border-slate-700 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Tổng giá trị</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Giảm giá / Học bổng</span>
                      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-md p-0.5">
                        <button 
                            onClick={() => setFormData({...formData, discountType: 'percent'})}
                            className={`px-2 py-0.5 text-xs font-medium rounded shadow-sm transition-all ${formData.discountType === 'percent' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            %
                        </button>
                        <button 
                            onClick={() => setFormData({...formData, discountType: 'amount'})}
                            className={`px-2 py-0.5 text-xs font-medium rounded shadow-sm transition-all ${formData.discountType === 'amount' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            VNĐ
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 max-w-[150px]">
                      <input 
                        className="w-full text-sm border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md text-right px-2 py-1 dark:text-white" 
                        type="text" 
                        value={formData.discountValue}
                        onChange={(e) => setFormData({...formData, discountValue: parseInt(e.target.value.replace(/\D/g, '')) || 0})}
                      />
                      <span className="text-sm text-slate-500 w-8">{formData.discountType === 'percent' ? '%' : 'đ'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-base font-bold text-slate-900 dark:text-white">Thực thu</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Real-time Preview (Standard Receipt Template) */}
            <div className="xl:col-span-7 flex flex-col">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Xem trước Phiếu thu</h3>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-slate-400 italic mr-2">Khổ giấy A5 (Ngang)</div>
                </div>
              </div>

              {/* Paper Preview - Mimicking InvoicePrintModal */}
              <div className="flex-1 bg-slate-200/50 dark:bg-slate-900/50 rounded-xl overflow-y-auto p-4 md:p-8 flex justify-center items-start shadow-inner border border-slate-200 dark:border-slate-800">
                
                {/* Standard Receipt Template Container */}
                <div className="w-full max-w-[210mm] bg-white text-slate-900 shadow-2xl p-8 md:p-10 relative flex flex-col transition-all duration-300 font-serif">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6 border-b-2 border-slate-900 pb-4">
                        <div className="flex gap-4 items-center">
                            <div className="size-12 flex items-center justify-center">
                                {settings.logo && settings.logo.startsWith('http') ? (
                                    <img src={settings.logo} className="w-full h-full object-contain grayscale brightness-50 contrast-125" alt="Logo" />
                                ) : (
                                    <span className="material-symbols-outlined text-3xl text-slate-800">school</span>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-lg font-bold uppercase tracking-wider text-slate-900">{settings.systemName}</h1>
                                <p className="text-xs italic text-slate-600">{settings.footerInfo.split('|')[0] || '102 Ngô Quyền, Hà Đông, Hà Nội'}</p>
                                <p className="text-xs font-bold text-slate-800">Hotline: {settings.footerInfo.split('Hotline: ')[1] || '1900 1234'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-extrabold uppercase tracking-[0.1em] text-slate-900 mb-1">Phiếu Thu</h2>
                            <div className="flex flex-col items-end text-xs text-slate-600">
                                <p>Mẫu số: 01-TT</p>
                                <p>Ký hiệu: GP/24</p>
                                <p>Số: <span className="font-mono font-bold text-slate-900 text-sm">AUTO-GEN</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Body Info */}
                    <div className="mb-6 space-y-3 text-sm leading-relaxed">
                        <div className="flex items-baseline">
                            <span className="w-40 font-bold shrink-0">Họ và tên người nộp:</span>
                            <span className="flex-1 border-b border-slate-400 border-dashed px-2 font-medium">{formData.studentName}</span>
                        </div>
                        <div className="flex items-baseline">
                            <span className="w-40 font-bold shrink-0">Địa chỉ / Lớp học:</span>
                            <span className="flex-1 border-b border-slate-400 border-dashed px-2">{formData.courseName}</span>
                        </div>
                        <div className="flex items-baseline">
                            <span className="w-40 font-bold shrink-0">Lý do nộp:</span>
                            <span className="flex-1 border-b border-slate-400 border-dashed px-2">
                                {formData.items.map((i: ServiceItem) => i.name).join(', ')}
                            </span>
                        </div>
                        <div className="flex items-baseline">
                            <span className="w-40 font-bold shrink-0">Số tiền:</span>
                            <span className="flex-1 font-bold text-lg px-2">{formatCurrency(total)} VND</span>
                        </div>
                        <div className="flex items-baseline">
                            <span className="w-40 font-bold shrink-0">Viết bằng chữ:</span>
                            <span className="flex-1 italic border-b border-slate-400 border-dashed px-2">{readMoney(total)}</span>
                        </div>
                    </div>

                    {/* Footer Date & Signatures */}
                    <div className="flex justify-end mb-8">
                        <p className="italic text-slate-600 text-sm">Hà Nội, ngày {new Date(formData.issueDate).getDate()} tháng {new Date(formData.issueDate).getMonth() + 1} năm {new Date(formData.issueDate).getFullYear()}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-10 text-center">
                        <div>
                            <p className="font-bold uppercase text-xs">Người nộp tiền</p>
                            <p className="text-[10px] italic text-slate-500">(Ký, họ tên)</p>
                            <div className="h-16"></div>
                            <p className="font-bold text-slate-800 text-sm">{formData.studentName}</p>
                        </div>
                        <div>
                            <p className="font-bold uppercase text-xs">Người thu tiền</p>
                            <p className="text-[10px] italic text-slate-500">(Ký, họ tên)</p>
                            <div className="h-16 flex items-center justify-center">
                                {/* Stamp Placeholder */}
                                <div className="size-16 border-2 border-red-500/30 rounded-full flex items-center justify-center -rotate-12">
                                    <span className="text-red-500/30 font-bold uppercase text-[10px] text-center leading-tight">Đã thu<br/>tiền</span>
                                </div>
                            </div>
                            <p className="font-bold text-slate-800 text-sm">{currentUser?.name || 'Admin'}</p>
                        </div>
                    </div>

                    <div className="text-center text-[9px] italic text-slate-400 mt-8 border-t border-slate-100 pt-2">
                        (Cần kiểm tra, đối chiếu khi lập, giao, nhận phiếu. Chứng từ này có giá trị lưu hành nội bộ)
                    </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateInvoice;
