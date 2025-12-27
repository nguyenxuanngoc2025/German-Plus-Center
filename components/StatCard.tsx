
import React from 'react';

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
    <div 
      onClick={onClick}
      className={`
        relative group rounded-2xl border border-slate-200 dark:border-slate-700 
        bg-white dark:bg-[#1a202c] p-5 shadow-sm transition-all duration-300 ease-in-out
        hover:-translate-y-1 hover:shadow-lg hover:ring-2 hover:ring-offset-0 hover:z-[999] ${hoverRingStyles[color]}
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        ${className}
      `}
    >
      {/* Smart Tooltip - Extremely High Z-Index & Neutral Theme */}
      {tooltip && (
        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 z-[9999] pointer-events-none">
            <div className="bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-[13px] font-medium leading-relaxed rounded-xl py-3 px-4 shadow-xl relative">
                {tooltip}
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-800 dark:border-t-white"></div>
            </div>
        </div>
      )}

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
  );
};

export default StatCard;
