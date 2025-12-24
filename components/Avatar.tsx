
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

interface AvatarProps {
  src?: string;
  name: string;
  className?: string; // Supports Tailwind classes like 'w-10 h-10'
  onClick?: (e: React.MouseEvent) => void;
  detail?: any; // Student | Lead | Staff | UserInfo
}

const Avatar: React.FC<AvatarProps> = ({ src, name, className = 'w-10 h-10', onClick, detail }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, position: 'bottom' });
  const avatarRef = useRef<HTMLDivElement>(null);

  // 1. Initials Extraction Logic
  const initials = useMemo(() => {
    const cleanName = name ? name.trim() : '?';
    const parts = cleanName.split(' ');
    
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    
    // First letter of first word + First letter of last word
    const firstInitial = parts[0].charAt(0);
    const lastInitial = parts[parts.length - 1].charAt(0);
    return (firstInitial + lastInitial).toUpperCase();
  }, [name]);

  // 2. Deterministic Color Logic (Pastel-ish but contrast safe for white text)
  const bgColor = useMemo(() => {
    const colors = [
      'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-600', 
      'bg-lime-600', 'bg-green-600', 'bg-emerald-600', 'bg-teal-600', 
      'bg-cyan-600', 'bg-sky-600', 'bg-blue-600', 'bg-indigo-600', 
      'bg-violet-600', 'bg-purple-600', 'bg-fuchsia-600', 'bg-pink-600', 'bg-rose-600'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }, [name]);

  // Check if src is a valid URL (simple check)
  const hasValidImage = src && (src.startsWith('http') || src.startsWith('data:image'));

  // --- POPOVER LOGIC ---
  const handleAvatarClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onClick) onClick(e);
      
      if (detail && avatarRef.current) {
          const rect = avatarRef.current.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const spaceBelow = windowHeight - rect.bottom;
          const cardHeight = 250; // Approx height

          // Determine flip logic
          const position = spaceBelow < cardHeight ? 'top' : 'bottom';
          
          setCoords({
              top: position === 'bottom' ? rect.bottom + 10 : rect.top - 10,
              left: rect.left,
              position
          });
          setIsOpen(!isOpen);
      }
  };

  useEffect(() => {
      const handleOutsideClick = (event: MouseEvent) => {
          if (isOpen && avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
              // Also check if clicking inside the portal (handled by propagation usually, but portal is outside root)
              const portal = document.getElementById('avatar-popover-portal');
              if (portal && !portal.contains(event.target as Node)) {
                  setIsOpen(false);
              }
          }
      };
      // Handle scroll to close
      const handleScroll = () => {
          if (isOpen) setIsOpen(false);
      }

      if (isOpen) {
          document.addEventListener('mousedown', handleOutsideClick);
          window.addEventListener('scroll', handleScroll, true);
      }
      return () => {
          document.removeEventListener('mousedown', handleOutsideClick);
          window.removeEventListener('scroll', handleScroll, true);
      };
  }, [isOpen]);

  // Helper for status badge in card
  const getStatusBadge = (status: string) => {
      if (!status) return null;
      const map: Record<string, string> = {
          'active': 'bg-green-100 text-green-700',
          'new': 'bg-blue-100 text-blue-700',
          'trial': 'bg-purple-100 text-purple-700',
          'consulting': 'bg-orange-100 text-orange-700',
          'ready': 'bg-emerald-100 text-emerald-700',
          'inactive': 'bg-gray-100 text-gray-700',
          'paid': 'bg-green-100 text-green-700',
          'overdue': 'bg-red-100 text-red-700'
      };
      const colorClass = map[status] || 'bg-gray-100 text-gray-700';
      const label = status === 'active' ? 'Đang học' : 
                    status === 'new' ? 'Lead Mới' :
                    status === 'trial' ? 'Học thử' :
                    status.charAt(0).toUpperCase() + status.slice(1);
      
      return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${colorClass}`}>{label}</span>;
  };

  const cleanPhone = detail?.phone?.replace(/\D/g, '') || '';

  return (
    <>
        <div 
            ref={avatarRef}
            // Added @container to enable container queries
            className={`@container rounded-full shrink-0 flex items-center justify-center font-bold text-white select-none bg-cover bg-center cursor-pointer transition-transform hover:scale-105 active:scale-95 ${!hasValidImage ? bgColor : ''} ${className}`}
            style={hasValidImage ? { backgroundImage: `url('${src}')` } : {}}
            onClick={handleAvatarClick}
        >
            {!hasValidImage && (
                // Changed fontSize to use container query width (cqw) for perfect scaling
                <span className="leading-none opacity-95 font-semibold text-[45cqw]">
                    {initials}
                </span>
            )}
        </div>

        {isOpen && detail && createPortal(
            <div 
                id="avatar-popover-portal"
                className="fixed z-[9999] w-[280px] bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden"
                style={{
                    top: coords.position === 'bottom' ? coords.top : 'auto',
                    bottom: coords.position === 'top' ? window.innerHeight - coords.top : 'auto',
                    left: coords.left
                }}
            >
                {/* Header / Cover */}
                <div className={`h-16 ${bgColor} relative`}>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="absolute top-2 right-2 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
                
                {/* Body */}
                <div className="px-5 pb-5 -mt-8 flex flex-col items-center text-center relative">
                    {/* Big Avatar in Card */}
                    <div 
                        className={`@container size-16 rounded-full border-4 border-white dark:border-[#1e293b] shadow-md flex items-center justify-center text-white bg-cover bg-center ${!hasValidImage ? bgColor : ''}`}
                        style={hasValidImage ? { backgroundImage: `url('${src}')` } : {}}
                    >
                        {!hasValidImage && (
                            <span className="leading-none opacity-95 font-bold text-[40cqw]">
                                {initials}
                            </span>
                        )}
                    </div>

                    <h4 className="mt-2 text-lg font-bold text-slate-900 dark:text-white leading-tight">{name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">{detail.code || detail.role || 'Học viên'}</p>
                    
                    {getStatusBadge(detail.status)}

                    <div className="w-full mt-4 flex flex-col gap-2">
                        {detail.phone && (
                            <a 
                                href={`tel:${cleanPhone}`} 
                                title={`Gọi cho ${name}`}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group"
                            >
                                <div className="size-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-[16px]">call</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Số điện thoại</p>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{detail.phone}</p>
                                </div>
                            </a>
                        )}
                        {detail.email && (
                            <a 
                                href={`mailto:${detail.email}`} 
                                title={`Gửi mail cho ${name}`}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group"
                            >
                                <div className="size-8 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-[16px]">mail</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{detail.email}</p>
                                </div>
                            </a>
                        )}
                    </div>

                    <div className="w-full grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <a 
                            href={`https://zalo.me/${cleanPhone}`}
                            target="_blank"
                            rel="noreferrer"
                            title={`Chat Zalo với ${name}`}
                            className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                        >
                            Chat Zalo
                        </a>
                        <button 
                            className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-colors shadow-sm shadow-primary/20"
                            onClick={() => { setIsOpen(false); navigate(detail.code ? '/students' : '/leads'); }} 
                        >
                            Hồ sơ
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        )}
    </>
  );
};

export default Avatar;
