import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';

interface ServiceItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

const CreateInvoice: React.FC = () => {
  const navigate = useNavigate();
  const { addFinanceRecord } = useData();

  // Form State
  const [studentName, setStudentName] = useState('Nguyễn Thành Nam');
  const [courseName, setCourseName] = useState('A1 Intensiv - K24 (Đang học)');
  const [issueDate, setIssueDate] = useState('2023-10-25');
  const [dueDate, setDueDate] = useState('2023-10-28');
  
  // Items State
  const [items, setItems] = useState<ServiceItem[]>([
    { id: 1, name: 'Khóa học Tiếng Đức A1', quantity: 1, price: 5000000 },
    { id: 2, name: 'Giáo trình Studio 21 - A1', quantity: 1, price: 250000 }
  ]);

  // Discount State
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(10);

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      return (subtotal * discountValue) / 100;
    }
    return discountValue;
  }, [subtotal, discountType, discountValue]);

  const total = subtotal - discountAmount;

  // Handlers
  const handleAddItem = () => {
    const newItem: ServiceItem = {
      id: Date.now(),
      name: '',
      quantity: 1,
      price: 0
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: number, field: keyof ServiceItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSave = () => {
      // Create a unified description from items
      const description = items.map(i => `${i.name} (x${i.quantity})`).join(', ');

      addFinanceRecord({
          type: 'income',
          amount: total,
          category: 'Tuition',
          description: description + ` - ${studentName}`,
      });

      alert('Đã lưu và gửi hóa đơn thành công!');
      navigate('/finance/invoices');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-background-light dark:bg-background-dark">
      <Header title="Tạo Hóa đơn" />
      
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 scroll-smooth">
        <div className="max-w-[1600px] mx-auto h-full flex flex-col">
          {/* Page Title & Main Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Tạo Hóa đơn Mới</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Nhập thông tin chi tiết để tạo hóa đơn cho học viên.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/finance/invoices')} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">close</span>
                <span>Hủy</span>
              </button>
              <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">send</span>
                <span>Lưu & Gửi</span>
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
                  <span className="material-symbols-outlined text-primary text-[22px]">info</span>
                  Thông tin chung
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {/* Student Select */}
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Học viên <span className="text-red-500">*</span></span>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-slate-400 text-[20px]">person_search</span>
                      </div>
                      <input 
                        className="block w-full pl-10 pr-10 py-2.5 rounded-lg border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary focus:ring-primary sm:text-sm" 
                        placeholder="Tìm kiếm tên hoặc mã HV..." 
                        type="text" 
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
                        <span className="material-symbols-outlined text-slate-400 hover:text-slate-600 text-[20px]">expand_more</span>
                      </div>
                    </div>
                  </label>
                  {/* Class Select */}
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Lớp học</span>
                    <select 
                        className="block w-full py-2.5 rounded-lg border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary focus:ring-primary sm:text-sm cursor-pointer"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                    >
                      <option>A1 Intensiv - K24 (Đang học)</option>
                      <option>A2 Standard - K25</option>
                      <option>Luyện thi B1</option>
                    </select>
                  </label>
                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Ngày phát hành</span>
                      <input 
                        className="block w-full py-2.5 rounded-lg border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary focus:ring-primary sm:text-sm" 
                        type="date" 
                        value={issueDate}
                        onChange={(e) => setIssueDate(e.target.value)}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Ngày đáo hạn</span>
                      <input 
                        className="block w-full py-2.5 rounded-lg border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary focus:ring-primary sm:text-sm" 
                        type="date" 
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Services Card */}
              <div className="bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">shopping_cart</span>
                    Chi tiết dịch vụ
                  </h2>
                  <button onClick={handleAddItem} className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    Thêm mục
                  </button>
                </div>
                
                {/* List of Items Input */}
                <div className="flex flex-col gap-4">
                  {items.map((item, index) => (
                    <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50 group relative animate-in fade-in slide-in-from-top-2">
                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        className="absolute -top-2 -right-2 bg-white dark:bg-slate-700 text-red-500 hover:text-red-600 rounded-full shadow-sm border border-slate-200 dark:border-slate-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Xóa mục"
                      >
                        <span className="material-symbols-outlined text-[16px] block">close</span>
                      </button>
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-12 sm:col-span-6">
                          <label className="text-xs text-slate-500 mb-1 block">Tên dịch vụ</label>
                          <input 
                            className="w-full text-sm border-0 border-b border-slate-200 dark:border-slate-600 bg-transparent focus:ring-0 focus:border-primary px-0 py-1 font-medium text-slate-900 dark:text-white placeholder:text-slate-400" 
                            type="text" 
                            value={item.name}
                            onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                            placeholder="Nhập tên dịch vụ"
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-2">
                          <label className="text-xs text-slate-500 mb-1 block">SL</label>
                          <input 
                            className="w-full text-sm border-0 border-b border-slate-200 dark:border-slate-600 bg-transparent focus:ring-0 focus:border-primary px-0 py-1 text-right text-slate-900 dark:text-white" 
                            type="number" 
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="col-span-5 sm:col-span-4">
                          <label className="text-xs text-slate-500 mb-1 block">Đơn giá (VNĐ)</label>
                          <input 
                            className="w-full text-sm border-0 border-b border-slate-200 dark:border-slate-600 bg-transparent focus:ring-0 focus:border-primary px-0 py-1 text-right text-slate-900 dark:text-white" 
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
                    <span className="text-sm text-slate-600 dark:text-slate-400">Tạm tính</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Giảm giá</span>
                      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-md p-0.5">
                        <button 
                            onClick={() => setDiscountType('percent')}
                            className={`px-2 py-0.5 text-xs font-medium rounded shadow-sm transition-all ${discountType === 'percent' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            %
                        </button>
                        <button 
                            onClick={() => setDiscountType('amount')}
                            className={`px-2 py-0.5 text-xs font-medium rounded shadow-sm transition-all ${discountType === 'amount' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            VNĐ
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 max-w-[150px]">
                      <input 
                        className="w-full text-sm border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md text-right px-2 py-1 dark:text-white" 
                        type="text" 
                        value={discountValue}
                        onChange={(e) => setDiscountValue(parseInt(e.target.value.replace(/\D/g, '')) || 0)}
                      />
                      <span className="text-sm text-slate-500 w-8">{discountType === 'percent' ? '%' : 'đ'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-base font-bold text-slate-900 dark:text-white">Tổng cộng</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Real-time Preview */}
            <div className="xl:col-span-7 flex flex-col">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Xem trước hóa đơn</h3>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm rounded transition-all" title="Print">
                    <span className="material-symbols-outlined text-[20px]">print</span>
                  </button>
                  <button className="p-2 text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm rounded transition-all" title="Download PDF">
                    <span className="material-symbols-outlined text-[20px]">download</span>
                  </button>
                  <button className="p-2 text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm rounded transition-all" title="Full Screen">
                    <span className="material-symbols-outlined text-[20px]">fullscreen</span>
                  </button>
                </div>
              </div>

              {/* Paper */}
              <div className="flex-1 bg-slate-200/50 dark:bg-slate-900/50 rounded-xl overflow-y-auto p-4 md:p-8 flex justify-center items-start shadow-inner border border-slate-200 dark:border-slate-800">
                {/* Invoice A4 Container */}
                <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl p-8 md:p-12 relative flex flex-col transition-all duration-300">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-12">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 rounded-lg p-2">
                        {/* Logo Placeholder */}
                        <div className="bg-center bg-no-repeat bg-cover rounded size-10" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDhSd0qPTYnfe9JAtdgl2z9UVHerJd-mcD68e1QOblcnVTs6HBSQagj5X9xdUaHhMCSXEyekMITffuexKwApVMdBcsQu1jejc-_zilgCK8c_NlKBKZv8iy_zCI9_C_YrZ_lTy_KwhchQsGD9V5MMwyJAoDrcF9Vr2JtjBbyklMdRNKmAFwm0B_MSf-YlVCwhTJXDtolXzo8cP5dWeC_tiGv2ZPMINP9HnPp0NdyIM3DADGeOts8Li5J-N-CGgRb6P_-wemEVo7sMaC4")'}}></div>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-primary uppercase tracking-wide">German Plus</h2>
                        <p className="text-xs text-slate-500">Trung tâm Đào tạo Tiếng Đức</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <h1 className="text-3xl font-light text-slate-300 tracking-[0.2em] uppercase">Hóa đơn</h1>
                      <p className="text-sm font-medium text-slate-600 mt-1">#INV-DRAFT</p>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-12 mb-12">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Nhà cung cấp</h3>
                      <p className="font-bold text-slate-800">CÔNG TY TNHH GERMAN PLUS</p>
                      <div className="text-sm text-slate-500 mt-2 space-y-1">
                        <p>123 Đường Nguyễn Trãi, Thanh Xuân</p>
                        <p>Hà Nội, Việt Nam</p>
                        <p>contact@germanplus.vn</p>
                        <p>+84 987 654 321</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Khách hàng</h3>
                      <p className="font-bold text-slate-800 text-lg">{studentName || '...'}</p>
                      <div className="text-sm text-slate-500 mt-2 space-y-1">
                        <p>Lớp: <span className="text-slate-800 font-medium">{courseName}</span></p>
                        <p>Mã HV: <span className="text-slate-800 font-medium">HV2023055</span></p>
                        <p className="mt-2 text-secondary">Hạn thanh toán: {new Date(dueDate).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="mb-10 min-h-[200px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-100">
                          <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/2">Mô tả dịch vụ</th>
                          <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">SL</th>
                          <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Đơn giá</th>
                          <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm text-slate-600">
                        {items.map((item) => (
                            <tr key={item.id} className="border-b border-slate-50">
                                <td className="py-4 font-medium text-slate-800">{item.name || '...'}</td>
                                <td className="py-4 text-center">{item.quantity}</td>
                                <td className="py-4 text-right">{formatCurrency(item.price)}</td>
                                <td className="py-4 text-right font-medium text-slate-800">{formatCurrency(item.price * item.quantity)}</td>
                            </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end mb-16">
                    <div className="w-1/2 md:w-1/3">
                      <div className="flex justify-between py-2 text-sm text-slate-600">
                        <span>Tạm tính</span>
                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between py-2 text-sm text-green-600">
                        <span>Giảm giá {discountType === 'percent' ? `(${discountValue}%)` : ''}</span>
                        <span>- {formatCurrency(discountAmount)}</span>
                      </div>
                      <div className="border-t-2 border-slate-100 mt-2 pt-2 flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-800">Tổng cộng</span>
                        <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer / Payment */}
                  <div className="mt-auto bg-slate-50 rounded-lg p-6 flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-800 mb-2">Thông tin thanh toán</h4>
                      <p className="text-sm text-slate-500 mb-1">Ngân hàng: <span className="font-medium text-slate-700">Vietcombank</span></p>
                      <p className="text-sm text-slate-500 mb-1">Số tài khoản: <span className="font-medium text-slate-700">1234 5678 9999</span></p>
                      <p className="text-sm text-slate-500">Chủ tài khoản: <span className="font-medium text-slate-700">GERMAN PLUS LTD</span></p>
                      <p className="text-sm text-slate-500 mt-2 italic">Nội dung CK: [Mã HV] - [Tên HV]</p>
                    </div>
                    <div className="size-24 bg-white p-1 rounded border border-slate-200 flex-shrink-0" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCmoOsytBU46dVD0SEtUl_jfsOJUjEON625s52oMeVflOpu1GABUjcalk7HzDGo8DcNRMKvkFTyZxwwYttI-0MGwGdcRcM9h-oFHoBTiJnvW2MTqVpCUx_LW0Z8WMmwDTqUPVxZHitBIpJjefT6nrXEknQBo5cugygmoJUtQl2ijRI0hGiCH0xfMCsZ9o7CQBHJz2BWLHLGcBCibF3xtmTazljlaiFCIBKF0KqmeYehc_36PTmuYgLcX3fKHYYZfqIm9ywJvGYODP0q")'}}></div>
                  </div>
                  <div className="text-center mt-8 text-xs text-slate-400">
                    Cảm ơn bạn đã tin tưởng German Plus!
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