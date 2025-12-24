
import React, { useState, useEffect, useRef } from 'react';

export interface ColumnOption {
  key: string;
  label: string;
  isMandatory?: boolean; // Columns that cannot be hidden (e.g. Name, Actions)
}

interface Props {
  tableId: string; // Unique ID for localStorage key
  columns: ColumnOption[];
  onChange: (visibleKeys: string[]) => void;
}

const ColumnSelector: React.FC<Props> = ({ tableId, columns, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Initialize state from localStorage or default to all columns
  const [visibleKeys, setVisibleKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem(`table_cols_${tableId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure mandatory columns are always present even if local storage is stale
        const mandatoryKeys = columns.filter(c => c.isMandatory).map(c => c.key);
        return Array.from(new Set([...parsed, ...mandatoryKeys]));
      } catch (e) { 
        console.error("Failed to parse column settings", e); 
      }
    }
    return columns.map(c => c.key);
  });
  
  const menuRef = useRef<HTMLDivElement>(null);

  // Notify parent component whenever visibleKeys changes
  useEffect(() => {
    onChange(visibleKeys);
  }, [visibleKeys, onChange]);

  // Handle clicking outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleColumn = (key: string) => {
    let newKeys;
    if (visibleKeys.includes(key)) {
      newKeys = visibleKeys.filter(k => k !== key);
    } else {
      newKeys = [...visibleKeys, key];
    }
    
    // Sort keys based on the original 'columns' prop order to keep table consistent
    const sortedKeys = columns
        .filter(c => newKeys.includes(c.key))
        .map(c => c.key);

    setVisibleKeys(sortedKeys);
    localStorage.setItem(`table_cols_${tableId}`, JSON.stringify(sortedKeys));
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`h-10 w-10 flex items-center justify-center rounded-lg border border-[#e5e7eb] dark:border-slate-700 bg-white dark:bg-[#1a202c] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm ${isOpen ? 'ring-2 ring-primary/20 border-primary' : ''}`}
        title="Tùy chỉnh cột hiển thị"
      >
        <span className="material-symbols-outlined text-[20px]">view_column</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-64 bg-white dark:bg-[#1a202c] rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-30 p-2 animate-in fade-in zoom-in-95 duration-200">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 mb-1 flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hiển thị cột</h4>
            <span className="text-[10px] text-slate-400">{visibleKeys.length}/{columns.length}</span>
          </div>
          <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
            {columns.map(col => (
              <label 
                key={col.key} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors select-none ${col.isMandatory ? 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <input 
                  type="checkbox" 
                  checked={visibleKeys.includes(col.key)}
                  onChange={() => !col.isMandatory && toggleColumn(col.key)}
                  disabled={col.isMandatory}
                  className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer disabled:cursor-not-allowed"
                />
                <span className={`text-sm font-medium ${visibleKeys.includes(col.key) ? 'text-slate-800 dark:text-white' : 'text-slate-500'}`}>{col.label}</span>
                {col.isMandatory && <span className="ml-auto material-symbols-outlined text-[14px] text-slate-400">lock</span>}
              </label>
            ))}
          </div>
          <div className="mt-1 pt-2 border-t border-slate-100 dark:border-slate-700 px-3 pb-1 text-center">
             <button 
                onClick={() => {
                    const allKeys = columns.map(c => c.key);
                    setVisibleKeys(allKeys);
                    localStorage.setItem(`table_cols_${tableId}`, JSON.stringify(allKeys));
                }}
                className="text-xs text-primary hover:underline font-medium"
             >
                Hiện tất cả
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnSelector;
