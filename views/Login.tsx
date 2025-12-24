
import React, { useState } from 'react';
import { useData } from '../context/DataContext';

const Login: React.FC = () => {
  const { login, settings } = useData(); // Use Settings
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous error
    if (!account || !password) {
        setError('Vui lòng nhập đầy đủ thông tin');
        return;
    }
    
    const success = login(account, password);
    if (!success) {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác');
    }
  };

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark text-[#111318] dark:text-white font-display">
      {/* Left Side: Visual/Branding */}
      <div className="hidden lg:flex relative w-1/2 flex-col justify-between bg-primary overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 w-full h-full">
          <div 
            className="w-full h-full bg-center bg-cover bg-no-repeat opacity-90 mix-blend-multiply" 
            style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCe81RRT0Ai3rdTfN-GqcYTmlko4vCMFhHjoQpjhfrLUMN584LtEkdeKpvoZB5KQDBGHlS4G4RuRuvjKTbFstcPUL5MFmH4GAVXEqbeAtJnTMqyMTcQDXywTZyVim7Rg7ljizqNladgod-vY2NmBnfBN9vOkk5eAwtf1occTt8QzIWpSz4EmfiwcEfgu1LdwqFaA78FVWSMK5UiCfmIAAxImDvHfraHuHfYHmFuZZUh0xtLHp7lFndDr4tN4DRdxWpVG-wxy6AbALt0")'}}
          >
          </div>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent"></div>
        </div>
        
        {/* Branding Content */}
        <div className="relative z-10 p-12 flex flex-col h-full justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm text-white overflow-hidden">
              {settings.logo && settings.logo.startsWith('http') ? (
                  <img src={settings.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                  <span className="material-symbols-outlined">language</span>
              )}
            </div>
            <span className="text-white text-xl font-bold tracking-tight">{settings.systemName}</span>
          </div>
          <div className="max-w-lg">
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">Quản lý trung tâm đào tạo toàn diện</h2>
            <p className="text-blue-100 text-lg">{settings.slogan}</p>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative bg-white dark:bg-background-dark">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <div className="text-primary size-10 rounded overflow-hidden">
             {settings.logo && settings.logo.startsWith('http') ? (
                  <img src={settings.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                  <span className="material-symbols-outlined text-3xl">language</span>
              )}
          </div>
          <span className="text-primary text-xl font-bold">{settings.systemName}</span>
        </div>

        <div className="w-full max-w-[420px] flex flex-col gap-8">
          {/* Header Text */}
          <div className="flex flex-col gap-2">
            <h1 className="text-[#111318] dark:text-white tracking-tight text-[32px] font-bold leading-tight">Chào mừng trở lại</h1>
            <p className="text-[#616f89] dark:text-gray-400 text-base font-normal leading-normal">
                Nhập thông tin đăng nhập của bạn để truy cập hệ thống quản lý {settings.systemName}.
            </p>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            
            {/* Account Field */}
            <label className="flex flex-col gap-2">
              <span className="text-[#111318] dark:text-gray-200 text-sm font-medium leading-normal">Email hoặc Tên người dùng</span>
              <div className="relative flex items-center">
                <input 
                    className="flex w-full rounded-xl border border-[#dbdfe6] dark:border-gray-700 bg-white dark:bg-[#1a2230] text-[#111318] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary h-12 pl-11 pr-4 text-base placeholder:text-[#616f89] transition-all" 
                    placeholder="nguoidung@example.com" 
                    type="text"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                />
                <div className="absolute left-3.5 text-[#616f89] dark:text-gray-500 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
              </div>
            </label>

            {/* Password Field */}
            <label className="flex flex-col gap-2">
              <span className="text-[#111318] dark:text-gray-200 text-sm font-medium leading-normal">Mật khẩu</span>
              <div className="relative flex items-center">
                <input 
                    className="flex w-full rounded-xl border border-[#dbdfe6] dark:border-gray-700 bg-white dark:bg-[#1a2230] text-[#111318] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary h-12 pl-11 pr-11 text-base placeholder:text-[#616f89] transition-all" 
                    placeholder="••••••••" 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <div className="absolute left-3.5 text-[#616f89] dark:text-gray-500 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-[#616f89] hover:text-[#111318] dark:text-gray-500 dark:hover:text-white flex items-center cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </label>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-1">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            {/* Remember & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input className="form-checkbox rounded border-[#dbdfe6] text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer transition-all" type="checkbox"/>
                <span className="text-sm text-[#616f89] dark:text-gray-400 group-hover:text-[#111318] dark:group-hover:text-white transition-colors">Ghi nhớ đăng nhập</span>
              </label>
              <a className="text-sm font-medium text-secondary hover:text-orange-700 transition-colors cursor-pointer">Quên mật khẩu?</a>
            </div>

            {/* Submit Button */}
            <button type="submit" className="flex w-full items-center justify-center rounded-xl bg-primary hover:bg-primary-dark active:bg-primary-active active:shadow-inner text-white text-base font-bold h-12 mt-2 transition-all shadow-sm hover:shadow-md active:scale-[0.98]">
                Đăng nhập
            </button>
          </form>

          {/* Footer/Sign up hint */}
          <div className="text-center pt-2">
            <p className="text-sm text-[#616f89] dark:text-gray-400">
                Chưa có tài khoản? 
                <a className="font-medium text-primary hover:text-blue-700 ml-1 transition-colors cursor-pointer">Liên hệ quản trị viên</a>
            </p>
          </div>
        </div>

        {/* Footer Copy */}
        <div className="absolute bottom-6 w-full text-center">
          <p className="text-xs text-[#9ca3af] dark:text-gray-600">© 2024 {settings.systemName}. {settings.footerInfo}</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
