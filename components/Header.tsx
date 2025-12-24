import React from 'react';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="h-16 bg-white dark:bg-[#1a2233] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-20">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-slate-500 hover:text-primary">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
      </div>
      <div className="flex items-center gap-4 md:gap-6">
        <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 w-64 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
          <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
          <input 
            className="bg-transparent border-none outline-none text-sm ml-2 w-full text-slate-700 dark:text-white placeholder:text-slate-400 focus:ring-0 p-0" 
            placeholder="Tìm kiếm nhanh..." 
            type="text"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 size-2 bg-secondary rounded-full border-2 border-white dark:border-[#1a2233]"></span>
          </button>
          <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <span className="material-symbols-outlined">chat_bubble</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
