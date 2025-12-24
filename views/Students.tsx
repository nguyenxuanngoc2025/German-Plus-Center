
import React, { useState, useMemo, useEffect } from 'react';
import Header from '../components/Header';
import { Student } from '../types';
import StudentDetailsModal from '../components/StudentDetailsModal';
import QuickPaymentModal from '../components/QuickPaymentModal';
import ColumnSelector, { ColumnOption } from '../components/ColumnSelector';
import AdvancedFilterBar, { FilterState } from '../components/AdvancedFilterBar';
import Avatar from '../components/Avatar';
import { useData } from '../context/DataContext';
import { useLocation } from 'react-router-dom';
import StatCard from '../components/StatCard';

const Students: React.FC = () => {
  const { students, recordStudentPayment, hasPermission, currentUser } = useData();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- FILTER STATE ---
  const [filters, setFilters] = useState<FilterState>({
      startDate: '', endDate: '', compareDateStart: '', compareDateEnd: '', isCompare: false,
      source: 'all', classType: 'all', classId: 'all', status: 'all'
  });

  const [sortConfig, setSortConfig] = useState<{ key: keyof Student; direction: 'asc' | 'desc' } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [paymentStudent, setPaymentStudent] = useState<Student | null>(null);

  // --- DEEP LINKING LOGIC ---
  useEffect(() => {
      if (location.state && (location.state as any).openId) {
          const targetId = (location.state as any).openId;
          const target = students.find(s => s.id === targetId);
          if (target) {
              setSelectedStudent(target);
              // Clear state to prevent reopening on refresh (optional but good UX)
              window.history.replaceState({}, document.title);
          }
      }
  }, [location.state, students]);

  // Column Configuration - RESTRICT FINANCIAL INFO FOR TEACHERS
  const columnOptions: ColumnOption[] = useMemo(() => {
      const baseColumns: ColumnOption[] = [
          { key: 'name', label: 'Học viên', isMandatory: true },
          { key: 'class', label: 'Lớp học hiện tại' },
          { key: 'status', label: 'Trạng thái' },
          { key: 'actions', label: 'Thao tác', isMandatory: true }
      ];

      // Only show balance if NOT a teacher
      if (currentUser?.role !== 'teacher') {
          baseColumns.splice(3, 0, { key: 'balance', label: 'Học phí còn thiếu' });
      }
      return baseColumns;
  }, [currentUser]);

  const [visibleColumns, setVisibleColumns] = useState<string[]>(columnOptions.map(c => c.key));

  const filteredStudents = useMemo(() => {
      let data = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              student.code.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = filters.status === 'all' || student.status === filters.status;
        const matchesClass = filters.classId === 'all' || student.classId === filters.classId;

        // Note: Students might not have `learningMode` directly, but it's on their class.
        // For simplicity, we filter by what we have.
        
        return matchesSearch && matchesStatus && matchesClass;
      });

      if (sortConfig !== null) {
        data.sort((a, b) => {
            const aValue = a[sortConfig.key] ?? '';
            const bValue = b[sortConfig.key] ?? '';

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
      }
      return data;
  }, [students, searchTerm, filters, sortConfig]);

  const handleSort = (key: keyof Student) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key: keyof Student) => {
    if (sortConfig?.key !== key) {
        return <span className="material-symbols-outlined text-[16px] text-gray-300 opacity-0 group-hover:opacity-50">unfold_more</span>;
    }
    return <span className="material-symbols-outlined text-[16px] text-primary">{sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleQuickPayment = (student: Student) => {
      if ((student.balance || 0) > 0) {
          setPaymentStudent(student);
      } else {
          alert("Học viên này đã hoàn thành học phí!");
      }
  };

  const confirmPayment = (amount: number, method: string, note: string) => {
      if (paymentStudent) {
          const result = recordStudentPayment(paymentStudent.id, amount, method, note);
          if (result.success) {
              alert(result.message);
              setPaymentStudent(null);
          } else {
              alert(result.message);
          }
      }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-background-light dark:bg-background-dark text-base">
      <Header title="Quản lý Học viên" />
      
      <AdvancedFilterBar 
        onFilterChange={setFilters}
        showClass={true}
        showStatus={true}
        showDate={false} // Students list usually doesn't filter by date unless enrollment date, which is niche.
        statusOptions={[
            { label: 'Đang học', value: 'active' },
            { label: 'Bảo lưu', value: 'suspended' },
            { label: 'Đã nghỉ', value: 'inactive' }
        ]}
      />

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-[1600px] mx-auto flex flex-col gap-8">
            
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    label="Tổng học viên"
                    value={students.length}
                    icon="groups"
                    color="blue"
                    tooltip="Tổng số hồ sơ học viên đang được lưu trữ trên hệ thống (bao gồm cả đã nghỉ)."
                />
                <StatCard 
                    label="Đang theo học"
                    value={students.filter(s => s.status === 'active').length}
                    icon="school"
                    color="green"
                    tooltip="Số lượng học viên có trạng thái 'Active' và đang tham gia lớp học."
                />
                <StatCard 
                    label="Nợ học phí"
                    value={students.filter(s => (s.balance || 0) > 0).length}
                    icon="warning"
                    color="red"
                    tooltip="Số lượng học viên còn dư nợ học phí chưa thanh toán hết."
                />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-[#1a202c] p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                 <div className="flex items-center gap-4 w-full md:w-auto flex-1">
                    <div className="relative w-full md:w-80">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[22px]">search</span>
                        <input 
                            type="text" 
                            placeholder="Tìm tên, mã học viên..." 
                            className="w-full h-11 pl-11 pr-4 rounded-lg border border-[#e5e7eb] dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 text-[#111318] dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                 </div>

                 <div className="flex gap-3 w-full md:w-auto">
                    <ColumnSelector 
                        tableId="students_table"
                        columns={columnOptions}
                        onChange={setVisibleColumns}
                    />
                    {hasPermission('export_data') && (
                        <button className="flex items-center justify-center gap-2 px-5 h-11 rounded-lg border border-[#e5e7eb] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111318] dark:text-white text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <span className="material-symbols-outlined text-[20px]">download</span>
                            Xuất Excel
                        </button>
                    )}
                    {hasPermission('edit_students') && (
                        <button className="flex items-center justify-center gap-2 px-5 h-11 rounded-lg bg-secondary hover:bg-orange-600 text-white text-sm font-bold shadow-sm transition-colors">
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            Thêm mới
                        </button>
                    )}
                 </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1a202c] border border-[#e5e7eb] dark:border-slate-700 rounded-xl shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#F1F5F9] dark:bg-slate-900 border-b border-[#e5e7eb] dark:border-slate-700 text-sm uppercase text-[#616f89] dark:text-slate-400 font-bold tracking-wider">
                                {visibleColumns.includes('name') && (
                                    <th onClick={() => handleSort('name')} className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group select-none">
                                        <div className="flex items-center gap-1">Học viên {renderSortIcon('name')}</div>
                                    </th>
                                )}
                                {visibleColumns.includes('class') && (
                                    <th onClick={() => handleSort('currentClass')} className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group select-none">
                                        <div className="flex items-center gap-1">Lớp học hiện tại {renderSortIcon('currentClass')}</div>
                                    </th>
                                )}
                                {visibleColumns.includes('status') && (
                                    <th onClick={() => handleSort('status')} className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group select-none">
                                        <div className="flex items-center gap-1">Trạng thái {renderSortIcon('status')}</div>
                                    </th>
                                )}
                                {visibleColumns.includes('balance') && (
                                    <th onClick={() => handleSort('balance')} className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group select-none">
                                        <div className="flex items-center gap-1">Học phí còn thiếu {renderSortIcon('balance')}</div>
                                    </th>
                                )}
                                {visibleColumns.includes('actions') && (
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb] dark:divide-slate-700 text-base">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} onClick={() => setSelectedStudent(student)} className="group even:bg-[#F8FAFC] dark:even:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                                    {visibleColumns.includes('name') && (
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <Avatar 
                                                    src={student.avatar} 
                                                    name={student.name} 
                                                    className="size-12 border border-slate-200 dark:border-slate-700 shadow-sm text-sm"
                                                    detail={student} // Pass full student object for Mini Profile
                                                />
                                                <div>
                                                    <p className="text-base font-bold text-[#111318] dark:text-white">{student.name}</p>
                                                    <p className="text-sm text-[#616f89] dark:text-slate-400 mt-0.5">{student.code} • {student.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                    )}
                                    {visibleColumns.includes('class') && (
                                        <td className="px-6 py-4">
                                            <span className="text-base text-[#111318] dark:text-slate-200 font-medium">{student.currentClass}</span>
                                        </td>
                                    )}
                                    {visibleColumns.includes('status') && (
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase tracking-wide border ${
                                                student.status === 'active' 
                                                ? 'bg-green-50 text-green-700 border-green-200' 
                                                : student.status === 'suspended'
                                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                                : 'bg-gray-100 text-gray-600 border-gray-200'
                                            }`}>
                                                {student.status === 'active' ? 'Đang học' : student.status === 'suspended' ? 'Bảo lưu' : 'Đã nghỉ'}
                                            </span>
                                        </td>
                                    )}
                                    {visibleColumns.includes('balance') && (
                                        <td className="px-6 py-4" onClick={(e) => { e.stopPropagation(); if(hasPermission('view_finance')) handleQuickPayment(student); }}>
                                            {(student.balance || 0) > 0 ? (
                                                <div 
                                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 ${hasPermission('view_finance') ? 'hover:bg-red-100 dark:hover:bg-red-900/30 cursor-pointer group/balance' : ''}`}
                                                    title={hasPermission('view_finance') ? "Click để đóng phí" : "Nợ học phí"}
                                                >
                                                    <span className="text-base font-bold">{formatCurrency(student.balance || 0)}</span>
                                                    {hasPermission('view_finance') && <span className="material-symbols-outlined text-[18px] opacity-0 group-hover/balance:opacity-100 transition-opacity">payments</span>}
                                                </div>
                                            ) : (
                                                <span className="text-base font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                                    Hoàn thành
                                                </span>
                                            )}
                                        </td>
                                    )}
                                    {visibleColumns.includes('actions') && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setSelectedStudent(student); }}
                                                    className="p-2 text-[#616f89] hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Chi tiết"
                                                >
                                                    <span className="material-symbols-outlined text-[24px]">visibility</span>
                                                </button>
                                                
                                                {hasPermission('edit_students') && (
                                                    <button className="p-2 text-[#616f89] hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Chỉnh sửa">
                                                        <span className="material-symbols-outlined text-[24px]">edit</span>
                                                    </button>
                                                )}
                                                
                                                <a 
                                                    href={`tel:${student.phone.replace(/\D/g, '')}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-2 text-[#616f89] hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors flex items-center justify-center" 
                                                    title={`Gọi cho ${student.name}`}
                                                >
                                                    <span className="material-symbols-outlined text-[24px]">call</span>
                                                </a>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                <div className="px-6 py-4 border-t border-[#e5e7eb] dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
                    <p className="text-sm text-[#616f89] dark:text-slate-400">
                        Hiển thị <span className="font-medium text-[#111318] dark:text-white">1</span> đến <span className="font-medium text-[#111318] dark:text-white">{filteredStudents.length}</span> trong tổng số <span className="font-medium text-[#111318] dark:text-white">{students.length}</span> kết quả
                    </p>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 rounded-lg border border-[#e5e7eb] dark:border-slate-700 text-sm font-medium text-[#616f89] disabled:opacity-50 hover:bg-slate-50" disabled>Trước</button>
                        <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold">1</button>
                        <button className="px-4 py-2 rounded-lg border border-[#e5e7eb] dark:border-slate-700 text-sm font-medium text-[#616f89] hover:bg-slate-50 dark:hover:bg-slate-800">2</button>
                        <button className="px-4 py-2 rounded-lg border border-[#e5e7eb] dark:border-slate-700 text-sm font-medium text-[#616f89] hover:bg-slate-50 dark:hover:bg-slate-800">3</button>
                        <button className="px-4 py-2 rounded-lg border border-[#e5e7eb] dark:border-slate-700 text-sm font-medium text-[#616f89] hover:bg-slate-50 dark:hover:bg-slate-800">Tiếp</button>
                    </div>
                </div>
            </div>
        </div>
      </div>
      
      {/* Detail Modal */}
      {selectedStudent && (
        <StudentDetailsModal 
            data={selectedStudent} 
            onClose={() => setSelectedStudent(null)} 
            onSave={() => { alert('Đã lưu thay đổi!'); setSelectedStudent(null); }}
            onDelete={hasPermission('delete_data') ? () => { alert('Đã xóa học viên!'); setSelectedStudent(null); } : undefined}
        />
      )}

      {/* Quick Payment Modal */}
      {paymentStudent && hasPermission('view_finance') && (
          <QuickPaymentModal 
            student={paymentStudent}
            balance={paymentStudent.balance || 0}
            onClose={() => setPaymentStudent(null)}
            onConfirm={confirmPayment}
          />
      )}
    </div>
  );
};

export default Students;
