
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar';

interface HeaderProps {
  title: string;
}

// Utility: Remove Vietnamese Accents for Search
const removeAccents = (str: string) => {
  return str.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .toLowerCase();
};

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { students, leads, classes, tuition } = useData();
  const navigate = useNavigate();
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard Shortcut '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setShowResults(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click Outside to Close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search Logic
  const results = useMemo(() => {
    if (searchTerm.length < 2) return { students: [], classes: [], debts: [] };

    const term = removeAccents(searchTerm);
    const match = (val: string | undefined) => val && removeAccents(val).includes(term);

    // 1. Search People (Students & Leads)
    const foundStudents = [
        ...students.map(s => ({ ...s, type: 'student' as const })),
        ...leads.map(l => ({ ...l, type: 'lead' as const, code: 'Lead' }))
    ].filter(p => match(p.name) || match(p.phone) || match(p.email) || match(p.code))
     .slice(0, 3);

    // 2. Search Classes
    const foundClasses = classes
        .filter(c => match(c.name) || match(c.code) || match(c.teacher))
        .slice(0, 2);

    // 3. Search Debts (Cross-module: by Student Name/Code or Invoice ID)
    // First identify relevant student IDs based on name match
    const matchingStudentIds = students
        .filter(s => match(s.name) || match(s.code))
        .map(s => s.id);

    const foundDebts = tuition
        .filter(t => {
            // Must have debt
            if (t.remainingAmount <= 0) return false;
            // Match Invoice ID matches
            if (match(t.id) || match(t.description)) return true;
            // Or linked student matches
            if (matchingStudentIds.includes(t.studentId)) return true;
            return false;
        })
        .map(t => {
            const s = students.find(std => std.id === t.studentId);
            return {
                ...t,
                studentName: s?.name || 'Unknown',
                studentCode: s?.code || 'N/A'
            };
        })
        .sort((a, b) => {
             // Prioritize Overdue
             const now = new Date().toISOString().split('T')[0];
             const aOver = a.dueDate < now;
             const bOver = b.dueDate < now;
             if (aOver && !bOver) return -1;
             if (!aOver && bOver) return 1;
             return 0;
        })
        .slice(0, 5);

    return { students: foundStudents, classes: foundClasses, debts: foundDebts };
  }, [searchTerm, students, leads, classes, tuition]);

  const hasResults = results.students.length > 0 || results.classes.length > 0 || results.debts.length > 0;

  // Navigation Handlers
  const handleNavigate = (path: string, state?: any) => {
      navigate(path, { state });
      setShowResults(false);
      setSearchTerm('');
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);

  return (
    <header className="h-16 bg-white dark:bg-[#1a2233] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-40 relative">
      <div className="flex items-center gap-3">
        <button className="md:hidden text-slate-500 hover:text-primary p-1.5">
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
      </div>
      
      <div className="flex items-center gap-4 md:gap-6">
        
        {/* GLOBAL SEARCH BAR */}
        <div className="hidden md:block relative w-96" ref={searchContainerRef}>
            <div className={`flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 w-full transition-all border ${showResults ? 'border-primary ring-2 ring-primary/20 bg-white dark:bg-slate-900' : 'border-transparent'}`}>
                <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
                <input 
                    ref={searchInputRef}
                    className="bg-transparent border-none outline-none text-sm ml-2 w-full text-primary dark:text-white placeholder:text-slate-400 focus:ring-0 p-0 font-medium" 
                    placeholder="Tìm học viên, lớp, công nợ... (/)" 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setShowResults(true); }}
                    onFocus={() => setShowResults(true)}
                />
                {!searchTerm && (
                    <div className="hidden lg:flex items-center justify-center size-5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700">
                        <span className="text-[10px] text-slate-500 dark:text-slate-300 font-bold">/</span>
                    </div>
                )}
                {searchTerm && (
                    <button onClick={() => { setSearchTerm(''); setShowResults(false); }} className="text-slate-400 hover:text-slate-600">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                )}
            </div>

            {/* DROPDOWN RESULTS */}
            {showResults && searchTerm.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {!hasResults ? (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">search_off</span>
                            <p className="text-sm">Không tìm thấy kết quả nào cho "{searchTerm}"</p>
                        </div>
                    ) : (
                        <div className="py-2">
                            {/* 1. Debt Group (Prioritized) */}
                            {results.debts.length > 0 && (
                                <div className="mb-2">
                                    <h4 className="px-4 py-2 text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-2 bg-red-50 dark:bg-red-900/10">
                                        <span className="material-symbols-outlined text-[14px]">warning</span> Công nợ & Thu phí
                                    </h4>
                                    {results.debts.map(debt => {
                                        const isOverdue = new Date(debt.dueDate) < new Date();
                                        return (
                                            <div 
                                                key={debt.id} 
                                                onClick={() => handleNavigate('/finance/debt', { openDebtId: debt.id })}
                                                className="px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer flex items-center gap-3 transition-colors border-l-4 border-transparent hover:border-red-500"
                                            >
                                                <div className="size-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between">
                                                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{debt.studentName}</p>
                                                        <span className="text-xs font-bold text-red-600">{formatCurrency(debt.remainingAmount)}</span>
                                                    </div>
                                                    <div className="flex justify-between mt-0.5">
                                                        <p className="text-xs text-slate-500 truncate">{debt.description || 'Học phí'}</p>
                                                        <span className={`text-[10px] px-1.5 rounded ${isOverdue ? 'bg-red-200 text-red-800' : 'bg-slate-200 text-slate-700'}`}>
                                                            {isOverdue ? 'Quá hạn' : 'Đến hạn'}: {new Date(debt.dueDate).toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit'})}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* 2. Students / Leads Group */}
                            {results.students.length > 0 && (
                                <div className="mb-2">
                                    <h4 className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50">
                                        <span className="material-symbols-outlined text-[14px]">person</span> Hồ sơ Học viên
                                    </h4>
                                    {results.students.map((item: any) => (
                                        <div 
                                            key={item.id} 
                                            onClick={() => handleNavigate(item.type === 'student' ? '/students' : '/leads', { openId: item.id })}
                                            className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer flex items-center gap-3 transition-colors border-l-4 border-transparent hover:border-primary"
                                        >
                                            <Avatar src={item.avatar} name={item.name} className="size-8 text-xs" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between">
                                                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{item.name}</p>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${item.type === 'student' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {item.type === 'student' ? 'Học viên' : 'Lead'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 truncate">{item.code || 'LEAD'} • {item.phone}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 3. Classes Group */}
                            {results.classes.length > 0 && (
                                <div>
                                    <h4 className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50">
                                        <span className="material-symbols-outlined text-[14px]">school</span> Lớp học
                                    </h4>
                                    {results.classes.map(cls => (
                                        <div 
                                            key={cls.id} 
                                            onClick={() => handleNavigate(`/classes/${cls.id}`)}
                                            className="px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer flex items-center gap-3 transition-colors border-l-4 border-transparent hover:border-purple-500"
                                        >
                                            <div className="size-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[18px]">class</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-white">{cls.name}</p>
                                                <p className="text-xs text-slate-500">{cls.teacher} • {cls.schedule}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {hasResults && (
                        <div className="bg-slate-50 dark:bg-slate-800 p-2 text-center border-t border-slate-100 dark:border-slate-700">
                            <span className="text-[10px] text-slate-400">Kết quả được cập nhật theo thời gian thực</span>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-2xl">notifications</span>
            <span className="absolute top-2 right-2 size-2 bg-secondary rounded-full border-2 border-white dark:border-[#1a2233]"></span>
          </button>
          <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-2xl">chat_bubble</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
