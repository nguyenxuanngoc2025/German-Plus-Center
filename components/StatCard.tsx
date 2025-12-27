
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

type ColorTheme = 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'teal';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: ColorTheme;
  subtext?: string | React.ReactNode;
  tooltip?: string; // The smart explanation text
  onClick?: () => void;
  rightElement?: React.ReactNode; // For badges or extra icons
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  icon, 
  color, 
  subtext, 
  tooltip, 
  onClick, 
  rightElement,
  className = ''
}) => {
  
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        setCoords({
            top: rect.top, 
            left: rect.left + rect.width / 2 
        });
        setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
      setIsHovered(false);
  };

  // Theme Maps
  const bgStyles = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
    teal: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600',
  };

  const textStyles = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-emerald-600 dark:text-emerald-400',
    red: 'text-red-600 dark:text-red-400',
    orange: 'text-orange-600 dark:text-orange-400',
    purple: 'text-purple-600 dark:text-purple-400',
    teal: 'text-teal-600 dark:text-teal-400',
  };

  const hoverRingStyles = {
    blue: 'hover:ring-blue-100 dark:hover:ring-blue-900',
    green: 'hover:ring-emerald-100 dark:hover:ring-emerald-900',
    red: 'hover:ring-red-100 dark:hover:ring-red-900',
    orange: 'hover:ring-orange-100 dark:hover:ring-orange-900',
    purple: 'hover:ring-purple-100 dark:hover:ring-purple-900',
    teal: 'hover:ring-teal-100 dark:hover:ring-teal-900',
  };

  return (
    <>
    <div 
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`
        relative group rounded-2xl border border-slate-200 dark:border-slate-700 
        bg-white dark:bg-[#1a202c] p-5 shadow-sm transition-all duration-300 ease-in-out
        hover:-translate-y-1 hover:shadow-lg hover:ring-2 hover:ring-offset-0 hover:z-[50] ${hoverRingStyles[color]}
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        ${className}
      `}
    >
      {/* Decorative Blob */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${bgStyles[color]} blur-2xl pointer-events-none`}></div>

      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
            {label}
            {tooltip && <span className="material-symbols-outlined text-[14px] text-slate-300 group-hover:text-primary transition-colors">info</span>}
          </p>
          <h3 className={`text-2xl font-extrabold mt-1 ${textStyles[color]}`}>
            {value}
          </h3>
          {subtext && (
            <div className="mt-1 text-xs text-slate-400 font-medium">
              {subtext}
            </div>
          )}
        </div>
        
        <div className={`p-3 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${bgStyles[color]}`}>
          <span className="material-symbols-outlined text-[24px]">{icon}</span>
        </div>
      </div>

      {/* Optional Custom Right/Bottom Element */}
      {rightElement && (
        <div className="absolute bottom-4 right-4">
            {rightElement}
        </div>
      )}
    </div>

    {/* Portal Tooltip: Fixed Position, High Z-Index, Apple Style */}
    {isHovered && tooltip && createPortal(
        <div 
            className="fixed z-[9999] pointer-events-none transition-opacity duration-200 animate-in fade-in zoom-in-95"
            style={{ 
                top: coords.top - 12, // 12px gap
                left: coords.left,
                transform: 'translate(-50%, -100%)' 
            }}
        >
            <div className="bg-slate-900/90 dark:bg-white/90 backdrop-blur-md text-white dark:text-slate-900 text-[13px] font-medium leading-relaxed rounded-xl py-3 px-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-white/10 dark:border-slate-200 relative max-w-[250px] text-center">
                {tooltip}
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-900/90 dark:border-t-white/90"></div>
            </div>
        </div>,
        document.body
    )}
    </>
  );
};

export default StatCard;
