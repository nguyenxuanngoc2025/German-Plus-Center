import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';

const DEFAULT_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuCkYGLiTHbhXntle05Va5L5Sz3raJFux7O5sf9UkJt9Zbb_y2OEdJnwR7BpwKSDge0E0cpVz-RPKeixhGplF2fzPr_j431kzx9o-imd0lUTpm6mzz97qoDykVn38_-sqsQRyZaaBU3fgOf9Fhj6bvlGbkwDJI-ROTNHlIA7WsRhYCtjDzCPJc96RJO3daTtw40GivkoLhAnmf7WtiQxGreJpJuCKrfpLBENq8tR9uRdVKmLRHexypzCtt04nMXsbOofKW8s4SLrcWqL";

const Profile: React.FC = () => {
  const [avatar, setAvatar] = useState<string>(DEFAULT_AVATAR);
  const [cover, setCover] = useState<string>(""); // Empty string defaults to gradient

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedAvatar = localStorage.getItem('user_avatar');
    const savedCover = localStorage.getItem('user_cover');
    if (savedAvatar) setAvatar(savedAvatar);
    if (savedCover) setCover(savedCover);
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (type === 'avatar') {
          setAvatar(result);
          localStorage.setItem('user_avatar', result);
          // Notify other components (like Sidebar) about the update
          window.dispatchEvent(new Event('user-profile-updated'));
        } else {
          setCover(result);
          localStorage.setItem('user_cover', result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerAvatarUpload = () => avatarInputRef.current?.click();
  const triggerCoverUpload = () => coverInputRef.current?.click();

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-background-light dark:bg-background-dark">
      <Header title="Hồ sơ cá nhân" />
      <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
        <div className="max-w-5xl mx-auto space-y-6">
            
            {/* Hidden File Inputs */}
            <input 
              type="file" 
              ref={avatarInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => handleImageUpload(e, 'avatar')} 
            />
            <input 
              type="file" 
              ref={coverInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => handleImageUpload(e, 'cover')} 
            />

            <div className="bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="relative h-32 w-full group">
                    <div 
                      className={`absolute inset-0 ${cover ? 'bg-cover bg-center' : 'bg-gradient-to-r from-primary to-[#4f86f7]'}`} 
                      style={cover ? {backgroundImage: `url('${cover}')`} : {}}
                    ></div>
                    <button 
                      onClick={triggerCoverUpload}
                      className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-xs font-medium border border-white/20"
                    >
                        <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                        Cập nhật ảnh bìa
                    </button>
                </div>
                <div className="px-6 pb-6 relative">
                    <div className="flex flex-col md:flex-row md:items-end -mt-12 gap-6">
                        <div className="relative group cursor-pointer" onClick={triggerAvatarUpload}>
                            <div 
                              className="size-32 rounded-full border-4 border-white dark:border-[#1a202c] bg-white shadow-md bg-cover bg-center relative z-10" 
                              style={{backgroundImage: `url('${avatar}')`}}
                            ></div>
                            <div className="absolute inset-0 rounded-full bg-black/40 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="material-symbols-outlined text-white text-3xl">upload</span>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-green-500 size-4 rounded-full border-2 border-white dark:border-[#1a202c] z-30"></div>
                        </div>
                        <div className="flex-1 pb-1">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Nguyễn Văn A</h3>
                                    <div className="flex flex-wrap items-center gap-3 mt-1 text-slate-500 dark:text-slate-400 text-sm">
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[18px]">badge</span>
                                            Quản lý tuyển sinh
                                        </span>
                                        <span className="hidden md:inline text-slate-300">•</span>
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[18px]">fingerprint</span>
                                            ID: GP-2023-001
                                        </span>
                                    </div>
                                </div>
                                <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-blue-500/30 transition-all">
                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                    Chỉnh sửa hồ sơ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">person_book</span>
                                Thông tin cá nhân
                            </h4>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Họ và tên</p>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Nguyễn Văn A</p>
                            </div>
                             <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Ngày sinh</p>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">15/05/1990</p>
                            </div>
                             <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Email làm việc</p>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">nguyenvana@germanplus.vn</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Số điện thoại</p>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">0909 123 456</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                 <div className="space-y-6">
                    <div className="bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">shield_lock</span>
                                Bảo mật
                            </h4>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            <div className="flex items-center justify-between py-2">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">Đổi mật khẩu</span>
                                    <span className="text-xs text-slate-500">Lần cuối: 3 tháng trước</span>
                                </div>
                                <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                            </div>
                            <hr className="border-slate-100 dark:border-slate-700" />
                            <div className="flex items-center justify-between py-2">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">Xác thực 2 lớp (2FA)</span>
                                    <span className="text-xs text-green-600 flex items-center gap-1">
                                         <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                        Đang bật
                                    </span>
                                </div>
                                <div className="w-11 h-6 bg-primary rounded-full relative">
                                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;