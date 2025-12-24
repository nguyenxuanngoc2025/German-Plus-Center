
import React, { useState, useMemo } from 'react';
import { Student, Lead } from '../types';
import { useData } from '../context/DataContext';
import Avatar from './Avatar';

interface Props {
  onClose: () => void;
  onConfirm: (selectedStudents: Student[], selectedLeads: Lead[]) => void;
  title?: string;
  excludeClassId?: string; // To exclude students already in this class
}

const StudentSelectorModal: React.FC<Props> = ({ onClose, onConfirm, title = "Chọn Học viên vào lớp", excludeClassId }) => {
  const { students, leads } = useData();
  const [activeTab, setActiveTab] = useState<'students' | 'leads'>('leads'); // Default to Leads for quick enrollment from Kanban
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Filter Students: Active students, not suspended, and (optionally) not already in the current class
  const availableStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.phone.includes(searchTerm);
      const notInClass = excludeClassId ? s.classId !== excludeClassId : true;
      return s.status === 'active' && matchSearch && notInClass;
    });
  }, [students, searchTerm, excludeClassId]);

  // Filter Leads: Prioritize Ready status
  const availableLeads = useMemo(() => {
    let data = leads.filter(l => {
        const matchSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            l.phone?.includes(searchTerm);
        // Only show leads that are not 'closed' (already converted)
        return l.status !== 'closed' && matchSearch;
    });
    // Sort: Ready first
    data.sort((a, b) => {
        if (a.status === 'ready' && b.status !== 'ready') return -1;
        if (a.status !== 'ready' && b.status === 'ready') return 1;
        return 0;
    });
    return data;
  }, [leads, searchTerm]);

  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleLead = (id: string) => {
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    const sResults = students.filter(s => selectedStudentIds.includes(s.id));
    const lResults = leads.filter(l => selectedLeadIds.includes(l.id));
    onConfirm(sResults, lResults);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111318]/60 p-4 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white dark:bg-[#1a202c] w-full max-w-[800px] max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <span className="material-symbols-outlined">close</span>
            </button>
        </div>

        {/* Tabs & Search */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex flex-col gap-4">
            <div className="flex p-1 bg-slate-200 dark:bg-slate-700 rounded-lg self-start">
                <button 
                    onClick={() => setActiveTab('leads')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'leads' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                >
                    Leads tiềm năng ({availableLeads.length})
                </button>
                <button 
                    onClick={() => setActiveTab('students')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'students' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                >
                    Học viên hiện tại ({availableStudents.length})
                </button>
            </div>
            <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input 
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary dark:text-white"
                    placeholder={activeTab === 'students' ? "Tìm theo tên, mã học viên..." : "Tìm theo tên, số điện thoại..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
            {activeTab === 'students' ? (
                <div className="flex flex-col gap-1">
                    {availableStudents.map(student => (
                        <label key={student.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border border-transparent ${selectedStudentIds.includes(student.id) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                            <input 
                                type="checkbox" 
                                className="rounded border-slate-300 text-primary focus:ring-primary size-5"
                                checked={selectedStudentIds.includes(student.id)}
                                onChange={() => toggleStudent(student.id)}
                            />
                            <Avatar src={student.avatar} name={student.name} className="size-10 border border-slate-200 dark:border-slate-600 text-xs" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{student.name}</p>
                                <p className="text-xs text-slate-500">{student.code} • {student.currentClass || 'Chưa xếp lớp'}</p>
                            </div>
                            {selectedStudentIds.includes(student.id) && <span className="material-symbols-outlined text-primary">check_circle</span>}
                        </label>
                    ))}
                    {availableStudents.length === 0 && <p className="text-center text-sm text-slate-500 py-8">Không tìm thấy học viên nào.</p>}
                </div>
            ) : (
                <div className="flex flex-col gap-1">
                    {availableLeads.map(lead => (
                        <label key={lead.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border border-transparent ${selectedLeadIds.includes(lead.id) ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                            <input 
                                type="checkbox" 
                                className="rounded border-slate-300 text-secondary focus:ring-secondary size-5"
                                checked={selectedLeadIds.includes(lead.id)}
                                onChange={() => toggleLead(lead.id)}
                            />
                            <Avatar src={lead.avatar} name={lead.name} className="size-10 border border-slate-200 dark:border-slate-600 text-xs" />
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{lead.name}</p>
                                    {lead.status === 'ready' && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded font-bold border border-green-200">Sẵn sàng</span>}
                                </div>
                                <p className="text-xs text-slate-500">{lead.source} • {lead.targetLevel || 'Chưa xác định'}</p>
                            </div>
                            <div className="px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-[10px] font-bold uppercase">
                                Sẽ tạo HV mới
                            </div>
                        </label>
                    ))}
                    {availableLeads.length === 0 && <p className="text-center text-sm text-slate-500 py-8">Không tìm thấy Lead phù hợp.</p>}
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <span className="text-sm text-slate-600 dark:text-slate-400">
                Đã chọn: <span className="font-bold text-slate-900 dark:text-white">{selectedStudentIds.length + selectedLeadIds.length}</span> người
            </span>
            <div className="flex gap-3">
                <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700">
                    Hủy
                </button>
                <button onClick={handleConfirm} className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-medium shadow-sm transition-all">
                    Xác nhận thêm
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSelectorModal;
