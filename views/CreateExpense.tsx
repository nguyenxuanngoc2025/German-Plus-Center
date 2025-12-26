
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { useFormPersistence } from '../hooks/useFormPersistence';

const CreateExpense: React.FC = () => {
  const navigate = useNavigate();
  const { addFinanceRecord } = useData();

  // Form State with Persistence
  const [formData, setFormData, clearDraft] = useFormPersistence('draft_expense_form', {
    name: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    note: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount || !formData.date || !formData.category) {
        alert("Vui lòng điền đầy đủ các trường bắt buộc!");
        return;
    }

    // Add to Global State
    addFinanceRecord({
        type: 'expense',
        amount: parseInt(formData.amount.replace(/\D/g, '')),
        category: formData.category,
        description: `${formData.name} - ${formData.note}`,
        date: formData.date
    });

    alert("Đã lưu khoản chi thành công!");
    clearDraft();
    navigate('/finance/expenses');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/\D/g, '');
      setFormData({ ...formData, amount: value ? new Intl.NumberFormat('vi-VN').format(parseInt(value)) : '' });
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-background-light dark:bg-background-dark font-display">
      <Header title="Nhập liệu Chi phí" />
      
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="mx-auto max-w-5xl">
            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="flex mb-6">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                    <li className="inline-flex items-center">
                        <span onClick={() => navigate('/finance')} className="inline-flex items-center text-sm font-medium text-[#616f89] hover:text-primary dark:text-gray-400 cursor-pointer">
                            <span className="material-symbols-outlined text-[18px] mr-2">home</span>
                            Tài chính
                        </span>
                    </li>
                    <li className="inline-flex items-center">
                        <span className="material-symbols-outlined text-[#cbd5e1] text-[18px]">chevron_right</span>
                        <span onClick={() => navigate('/finance/expenses')} className="ml-1 text-sm font-medium text-[#616f89] hover:text-primary md:ml-2 dark:text-gray-400 cursor-pointer">Danh sách Chi phí</span>
                    </li>
                    <li>
                        <div className="flex items-center">
                            <span className="material-symbols-outlined text-[#cbd5e1] text-[18px]">chevron_right</span>
                            <span className="ml-1 text-sm font-medium text-[#111318] md:ml-2 dark:text-white">Nhập liệu Chi phí</span>
                        </div>
                    </li>
                </ol>
            </nav>

            {/* Page Heading */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#111318] dark:text-white mb-2">Thêm Khoản Chi Mới</h1>
                    <p className="text-[#616f89] dark:text-gray-400">Điền thông tin chi tiết về khoản chi phí phát sinh trong tháng.</p>
                </div>
            </div>

            {/* Form Container */}
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-8 shadow-sm dark:bg-[#1a202c] dark:border-[#2d3748]">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tên khoản chi */}
                    <div className="col-span-1 md:col-span-1">
                        <label className="block text-sm font-medium text-[#111318] mb-2 dark:text-white" htmlFor="expense_name">
                            Tên khoản chi <span className="text-red-500">*</span>
                        </label>
                        <input 
                            className="block w-full rounded-lg border-[#dbdfe6] bg-white p-3 text-sm text-[#111318] placeholder-[#9ca3af] focus:border-primary focus:ring-primary dark:bg-[#2d3748] dark:border-[#4a5568] dark:text-white dark:placeholder-gray-500" 
                            id="expense_name" 
                            placeholder="VD: Lương giáo viên tháng 10" 
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>

                    {/* Số tiền */}
                    <div className="col-span-1 md:col-span-1">
                        <label className="block text-sm font-medium text-[#111318] mb-2 dark:text-white" htmlFor="amount">
                            Số tiền (VND) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative rounded-lg">
                            <input 
                                className="block w-full rounded-lg border-[#dbdfe6] bg-white p-3 pr-12 text-sm text-[#111318] placeholder-[#9ca3af] focus:border-primary focus:ring-primary dark:bg-[#2d3748] dark:border-[#4a5568] dark:text-white dark:placeholder-gray-500 text-right font-medium" 
                                id="amount" 
                                placeholder="0" 
                                type="text"
                                value={formData.amount}
                                onChange={handleAmountChange}
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                <span className="text-[#616f89] text-sm font-medium dark:text-gray-400">đ</span>
                            </div>
                        </div>
                    </div>

                    {/* Ngày chi */}
                    <div className="col-span-1 md:col-span-1">
                        <label className="block text-sm font-medium text-[#111318] mb-2 dark:text-white" htmlFor="date">
                            Ngày chi <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="material-symbols-outlined text-[#616f89] text-[20px]">calendar_today</span>
                            </div>
                            <input 
                                className="block w-full rounded-lg border-[#dbdfe6] bg-white p-3 pl-10 text-sm text-[#111318] placeholder-[#9ca3af] focus:border-primary focus:ring-primary dark:bg-[#2d3748] dark:border-[#4a5568] dark:text-white dark:placeholder-gray-500 dark:[color-scheme:dark]" 
                                id="date" 
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Loại chi phí */}
                    <div className="col-span-1 md:col-span-1">
                        <label className="block text-sm font-medium text-[#111318] mb-2 dark:text-white" htmlFor="type">
                            Loại chi phí <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select 
                                className="block w-full appearance-none rounded-lg border-[#dbdfe6] bg-white p-3 text-sm text-[#111318] focus:border-primary focus:ring-primary dark:bg-[#2d3748] dark:border-[#4a5568] dark:text-white cursor-pointer" 
                                id="type"
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                            >
                                <option disabled value="">Chọn danh mục</option>
                                <option value="Salary">Lương & Thưởng</option>
                                <option value="Rent">Thuê mặt bằng</option>
                                <option value="Marketing">Marketing & Quảng cáo</option>
                                <option value="Utilities">Điện, Nước, Internet</option>
                                <option value="Repair">Sửa chữa & Bảo trì</option>
                                <option value="Other">Khác</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#616f89]">
                                <span className="material-symbols-outlined text-[20px]">expand_more</span>
                            </div>
                        </div>
                    </div>

                    {/* Ghi chú */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-[#111318] mb-2 dark:text-white" htmlFor="notes">
                            Ghi chú
                        </label>
                        <textarea 
                            className="block w-full rounded-lg border-[#dbdfe6] bg-white p-3 text-sm text-[#111318] placeholder-[#9ca3af] focus:border-primary focus:ring-primary dark:bg-[#2d3748] dark:border-[#4a5568] dark:text-white dark:placeholder-gray-500 resize-none" 
                            id="notes" 
                            placeholder="Mô tả chi tiết nội dung khoản chi..." 
                            rows={3}
                            value={formData.note}
                            onChange={(e) => setFormData({...formData, note: e.target.value})}
                        ></textarea>
                    </div>

                    {/* File đính kèm */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-[#111318] mb-2 dark:text-white">
                            File đính kèm (Hóa đơn, Biên lai)
                        </label>
                        <div className="mt-1 flex justify-center rounded-lg border-2 border-dashed border-[#dbdfe6] px-6 py-10 hover:bg-[#f9fafb] hover:border-primary/50 transition-colors cursor-pointer dark:border-[#4a5568] dark:hover:bg-[#2d3748]">
                            <div className="text-center">
                                <span className="material-symbols-outlined mx-auto h-12 w-12 text-[#9ca3af] text-[48px] dark:text-gray-500">cloud_upload</span>
                                <div className="mt-4 flex text-sm text-[#616f89] justify-center dark:text-gray-400">
                                    <label className="relative cursor-pointer rounded-md bg-white font-medium text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-blue-700 dark:bg-transparent dark:text-blue-400">
                                        <span>Tải lên file</span>
                                        <input className="sr-only" type="file"/>
                                    </label>
                                    <p className="pl-1">hoặc kéo thả vào đây</p>
                                </div>
                                <p className="text-xs text-[#9ca3af] mt-1 dark:text-gray-500">PNG, JPG, PDF tối đa 10MB</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-4 mt-4 pt-4 border-t border-[#f0f2f4] dark:border-[#2d3748]">
                        <button 
                            type="button"
                            onClick={() => { clearDraft(); navigate('/finance/expenses'); }}
                            className="rounded-lg border border-[#dbdfe6] bg-white px-5 py-2.5 text-sm font-semibold text-[#111318] shadow-sm hover:bg-[#f9fafb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dbdfe6] dark:bg-[#2d3748] dark:border-[#4a5568] dark:text-white dark:hover:bg-[#4a5568] transition-all"
                        >
                            Hủy
                        </button>
                        <button 
                            type="submit"
                            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark active:bg-primary-active active:shadow-inner focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all"
                        >
                            <span className="material-symbols-outlined text-[18px]">save</span>
                            Lưu Chi phí
                        </button>
                    </div>
                </form>
            </div>
        </div>
      </main>
    </div>
  );
};

export default CreateExpense;
