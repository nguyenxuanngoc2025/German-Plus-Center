
import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { UserRole } from '../context/DataContext';

const Settings: React.FC = () => {
  const { currentUser, startSimulation, settings, updateSettings } = useData();

  // --- Branding State ---
  const [systemName, setSystemName] = useState(settings.systemName);
  const [slogan, setSlogan] = useState(settings.slogan);
  const [footerInfo, setFooterInfo] = useState(settings.footerInfo);
  const [logo, setLogo] = useState(settings.logo);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // --- System Params State ---
  const [timezone, setTimezone] = useState(settings.timezone);
  const [dateFormat, setDateFormat] = useState(settings.dateFormat);
  const [notifications, setNotifications] = useState(settings.notifications);

  // --- Theme State ---
  const [theme, setTheme] = useState<'light' | 'dark'>(settings.theme);

  // --- Export State ---
  const [exportFormat, setExportFormat] = useState(settings.exportFormat);
  const [autoBackup, setAutoBackup] = useState(settings.autoBackup);

  // --- Simulation State ---
  const [simRole, setSimRole] = useState<UserRole>('student');

  // --- Loading State ---
  const [isSaving, setIsSaving] = useState(false);

  // --- Effects ---
  useEffect(() => {
    setSystemName(settings.systemName);
    setSlogan(settings.slogan);
    setFooterInfo(settings.footerInfo);
    setLogo(settings.logo);
    setTimezone(settings.timezone);
    setDateFormat(settings.dateFormat);
    setNotifications(settings.notifications);
    setTheme(settings.theme);
    setExportFormat(settings.exportFormat);
    setAutoBackup(settings.autoBackup);
    
    document.documentElement.className = settings.theme;
  }, [settings]);

  // --- Handlers ---
  
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    document.documentElement.className = newTheme;
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
          alert("File quá lớn! Vui lòng chọn ảnh dưới 2MB.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText('sk_live_********************8f9a');
    alert('Đã sao chép API Key vào bộ nhớ tạm!');
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
        const result = await updateSettings({
            systemName, 
            slogan, 
            footerInfo, 
            logo, 
            timezone, 
            dateFormat, 
            notifications, 
            theme, 
            exportFormat, 
            autoBackup
        });

        if (result.success) {
            alert('Toàn bộ cấu hình đã được cập nhật! 🚀');
        } else {
            alert('Có lỗi xảy ra khi lưu cấu hình.');
        }
    } catch (error) {
        console.error("Save error:", error);
        alert('Lỗi hệ thống. Vui lòng thử lại.');
    } finally {
        setIsSaving(false);
    }
  };

  const handleActivateSimulation = () => {
      if (window.confirm(`Xác nhận chuyển sang chế độ mô phỏng quyền: ${simRole.toUpperCase()}?\n\nHệ thống sẽ chuyển hướng và ẩn các chức năng không thuộc quyền hạn này.`)) {
          startSimulation(simRole);
      }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display">
      <Header title="Cài đặt" />
      
      <div className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth">
        <div className="max-w-[1000px] mx-auto flex flex-col gap-8 pb-10">
            
            {/* Breadcrumbs & Actions */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span className="hover:text-primary transition-colors cursor-pointer">Trang chủ</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-slate-900 dark:text-white font-medium">Cài đặt</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Cài đặt Hệ thống</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Quản lý cấu hình toàn bộ hệ thống {systemName}</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                            Hủy bỏ
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors shadow-md shadow-primary/20 flex items-center gap-2 ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {isSaving ? (
                                <>
                                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">save</span>
                                    Lưu thay đổi
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* LIVE ROLE SIMULATION MODE */}
            <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined">theater_comedy</span>
                                Chế độ Xem mô phỏng
                            </h2>
                            <p className="text-orange-100 text-sm mt-1 max-w-2xl">
                                Kiểm tra giao diện và quyền hạn thực tế của các vai trò khác nhau mà không cần đăng xuất. 
                                Hệ thống sẽ hiển thị chính xác những gì người dùng đó nhìn thấy.
                            </p>
                        </div>
                    </div>
                    
                    <div className="bg-white/10 p-4 rounded-lg border border-white/20 flex flex-col md:flex-row items-center gap-4">
                        <div className="flex-1 w-full">
                            <label className="text-xs font-bold uppercase text-orange-200 mb-1.5 block">Chọn vai trò mô phỏng</label>
                            <select 
                                value={simRole}
                                onChange={(e) => setSimRole(e.target.value as UserRole)}
                                className="w-full h-10 pl-3 pr-8 rounded-lg bg-white text-slate-800 text-sm font-bold focus:ring-2 focus:ring-orange-300 border-none cursor-pointer"
                            >
                                <option value="admin">Super Admin (Mặc định)</option>
                                <option value="manager">Manager (Quản lý giáo vụ)</option>
                                <option value="teacher">Giáo viên</option>
                                <option value="sale">Nhân viên Tư vấn</option>
                                <option value="student">Học viên</option>
                            </select>
                        </div>
                        <button 
                            onClick={handleActivateSimulation}
                            className="w-full md:w-auto px-6 h-10 bg-slate-900 hover:bg-black text-white rounded-lg text-sm font-bold shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 whitespace-nowrap mt-5 md:mt-0"
                        >
                            <span className="material-symbols-outlined text-[18px]">play_circle</span>
                            Kích hoạt mô phỏng
                        </button>
                    </div>
                </div>
                {/* Background Decor */}
                <div className="absolute -right-10 -bottom-20 h-64 w-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Left Column (General Settings) */}
                <div className="xl:col-span-2 flex flex-col gap-6">
                    
                    {/* 1. Branding */}
                    <section className="bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">verified</span>
                                Nhận diện Thương hiệu
                            </h2>
                        </div>
                        <div className="p-6 flex flex-col gap-6">
                            <div className="flex flex-col sm:flex-row gap-6 items-start">
                                <div className="shrink-0 group relative">
                                    <input 
                                        type="file" 
                                        ref={logoInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleLogoUpload} 
                                    />
                                    <div 
                                        onClick={() => logoInputRef.current?.click()}
                                        className="h-24 w-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all overflow-hidden relative"
                                    >
                                        <div className="flex flex-col items-center gap-1 text-slate-400 group-hover:text-primary z-10">
                                            <span className="material-symbols-outlined">cloud_upload</span>
                                            <span className="text-[10px] font-medium uppercase">Upload Logo</span>
                                        </div>
                                        {logo && <img src={logo} alt="Logo" className="absolute inset-0 w-full h-full object-cover opacity-100 group-hover:opacity-30 transition-opacity bg-white" />}
                                    </div>
                                </div>
                                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tên hệ thống</label>
                                        <input 
                                            type="text" 
                                            value={systemName}
                                            onChange={(e) => setSystemName(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-primary focus:border-primary transition-shadow h-10 px-3" 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Slogan</label>
                                        <input 
                                            type="text" 
                                            value={slogan}
                                            onChange={(e) => setSlogan(e.target.value)}
                                            placeholder="Nhập slogan của trung tâm"
                                            className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-primary focus:border-primary transition-shadow h-10 px-3" 
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Thông tin liên hệ (Footer)</label>
                                        <input 
                                            type="text" 
                                            value={footerInfo}
                                            onChange={(e) => setFooterInfo(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-primary focus:border-primary transition-shadow h-10 px-3" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 2. System Parameters */}
                    <section className="bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">tune</span>
                                Thông số hệ thống
                            </h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Múi giờ mặc định</label>
                                <div className="relative">
                                    <select 
                                        value={timezone}
                                        onChange={(e) => setTimezone(e.target.value)}
                                        className="w-full h-10 pl-3 pr-8 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                                    >
                                        <option value="GMT+7">(GMT+07:00) Bangkok, Hanoi, Jakarta</option>
                                        <option value="GMT+8">(GMT+08:00) Singapore</option>
                                        <option value="GMT+9">(GMT+09:00) Tokyo</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-lg">expand_more</span>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Định dạng ngày/giờ</label>
                                <div className="relative">
                                    <select 
                                        value={dateFormat}
                                        onChange={(e) => setDateFormat(e.target.value)}
                                        className="w-full h-10 pl-3 pr-8 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                                    >
                                        <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2023)</option>
                                        <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2023)</option>
                                        <option value="YYYY-MM-DD">YYYY-MM-DD (2023-12-31)</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-lg">expand_more</span>
                                </div>
                            </div>
                            <div className="md:col-span-2 pt-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={notifications}
                                        onChange={(e) => setNotifications(e.target.checked)}
                                        className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary transition-colors cursor-pointer" 
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-slate-900 dark:text-white">Bật thông báo hệ thống</span>
                                        <span className="text-xs text-slate-500 group-hover:text-primary transition-colors">Gửi email thông báo khi có học viên mới hoặc thanh toán thành công.</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column (Specific Configs) */}
                <div className="flex flex-col gap-6">
                    
                    {/* 4. UI Customization */}
                    <section className="bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">palette</span>
                                Giao diện
                            </h2>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-500 mb-4">Chọn chế độ hiển thị cho toàn bộ ứng dụng.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <label className="cursor-pointer group">
                                    <input 
                                        type="radio" 
                                        name="theme" 
                                        value="light" 
                                        className="peer sr-only"
                                        checked={theme === 'light'}
                                        onChange={() => handleThemeChange('light')}
                                    />
                                    <div className="aspect-video rounded-lg bg-slate-100 border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/5 p-2 flex flex-col gap-2 relative transition-all">
                                        <div className="w-full h-full bg-white shadow-sm rounded flex flex-col p-1 overflow-hidden">
                                            <div className="w-1/3 h-1 bg-slate-200 rounded-full mb-1"></div>
                                            <div className="w-full h-full bg-slate-50 rounded"></div>
                                        </div>
                                        <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-0.5 opacity-0 peer-checked:opacity-100 shadow-sm transition-opacity">
                                            <span className="material-symbols-outlined text-sm">check</span>
                                        </div>
                                    </div>
                                    <span className="block text-center text-sm font-medium mt-2 text-slate-900 dark:text-slate-300 group-hover:text-primary">Light Mode</span>
                                </label>
                                <label className="cursor-pointer group">
                                    <input 
                                        type="radio" 
                                        name="theme" 
                                        value="dark" 
                                        className="peer sr-only"
                                        checked={theme === 'dark'}
                                        onChange={() => handleThemeChange('dark')}
                                    />
                                    <div className="aspect-video rounded-lg bg-slate-800 border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/5 p-2 flex flex-col gap-2 relative transition-all">
                                        <div className="w-full h-full bg-slate-900 shadow-sm rounded flex flex-col p-1 overflow-hidden">
                                            <div className="w-1/3 h-1 bg-slate-700 rounded-full mb-1"></div>
                                            <div className="w-full h-full bg-slate-800 rounded"></div>
                                        </div>
                                        <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-0.5 opacity-0 peer-checked:opacity-100 shadow-sm transition-opacity">
                                            <span className="material-symbols-outlined text-sm">check</span>
                                        </div>
                                    </div>
                                    <span className="block text-center text-sm font-medium mt-2 text-slate-900 dark:text-slate-300 group-hover:text-primary">Dark Mode</span>
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* 5. Data Export Settings */}
                    <section className="bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">ios_share</span>
                                Xuất dữ liệu
                            </h2>
                        </div>
                        <div className="p-6 flex flex-col gap-5 flex-1">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-900 dark:text-slate-300">Định dạng file mặc định</label>
                                <div className="flex items-center gap-2 mt-1">
                                    {['excel', 'pdf', 'csv'].map((fmt) => (
                                        <label key={fmt} className="cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="file_format" 
                                                value={fmt}
                                                checked={exportFormat === fmt}
                                                onChange={() => setExportFormat(fmt)}
                                                className="peer sr-only" 
                                            />
                                            <span className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-500 peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary transition-all hover:bg-slate-50 dark:hover:bg-slate-800 uppercase">{fmt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="h-px bg-slate-100 dark:bg-slate-800 w-full"></div>
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-slate-900 dark:text-white">Sao lưu tự động</span>
                                    <span className="text-xs text-slate-500">Backup dữ liệu cuối ngày</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={autoBackup}
                                        onChange={(e) => setAutoBackup(e.target.checked)}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
