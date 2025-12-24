
import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { FilterState } from './AdvancedFilterBar';
import Avatar from './Avatar';
import { useNavigate } from 'react-router-dom';

type DrillType = 'revenue' | 'expense' | 'debt' | 'profit' | 'leads_total' | 'leads_converted' | 'students_active' | 'students_new';

interface Props {
  type: DrillType;
  filters: FilterState; // To respect the selected date range
  onClose: () => void;
}

const DrillDownModal: React.FC<Props> = ({ type, filters, onClose }) => {
  const { finance, tuition, students, leads, classes } = useData();
  const navigate = useNavigate();

  // --- HELPER: DATE FILTERING ---
  const dateRange = useMemo(() => {
      const start = filters.startDate ? new Date(filters.startDate) : new Date(new Date().getFullYear(), 0, 1);
      const end = filters.endDate ? new Date(filters.endDate) : new Date();
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      return { start, end };
  }, [filters]);

  const isInRange = (dateStr: string) => {
      const d = new Date(dateStr);
      return d >= dateRange.start && d <= dateRange.end;
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  // --- NAVIGATION HELPERS ---
  const handleStudentClick = (studentId: string, isLead = false) => {
      onClose(); // Close modal first
      if (isLead) {
          navigate('/leads', { state: { openId: studentId } });
      } else {
          navigate('/students', { state: { openId: studentId } });
      }
  };

  const handleClassClick = (classId?: string) => {
      if (!classId) return;
      onClose();
      navigate(`/classes/${classId}`);
  };

  const linkStyle = "text-primary font-bold cursor-pointer hover:underline decoration-primary/50";

  // --- DATA LOGIC SWITCHER ---
  const { title, columns, data } = useMemo(() => {
      let resultData: any[] = [];
      let modalTitle = '';
      let tableCols: { header: string, accessor: (item: any) => React.ReactNode, align?: 'left'|'right'|'center' }[] = [];

      switch (type) {
          case 'revenue':
              modalTitle = 'Chi tiết Doanh thu (Thực thu)';
              resultData = finance
                  .filter(f => f.type === 'income' && isInRange(f.date))
                  .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              tableCols = [
                  { header: 'Ngày', accessor: (i) => new Date(i.date).toLocaleDateString('vi-VN') },
                  { header: 'Nội dung', accessor: (i) => <span className="font-medium text-slate-800 dark:text-slate-200">{i.description}</span> },
                  { header: 'Danh mục', accessor: (i) => <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">{i.category}</span> },
                  { header: 'Số tiền', accessor: (i) => <span className="font-bold text-green-600">+{formatCurrency(i.amount)}</span>, align: 'right' }
              ];
              break;

          case 'expense':
              modalTitle = 'Chi tiết Chi phí vận hành';
              resultData = finance
                  .filter(f => f.type === 'expense' && isInRange(f.date))
                  .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              tableCols = [
                  { header: 'Ngày', accessor: (i) => new Date(i.date).toLocaleDateString('vi-VN') },
                  { header: 'Nội dung', accessor: (i) => <span className="font-medium text-slate-800 dark:text-slate-200">{i.description}</span> },
                  { header: 'Loại chi', accessor: (i) => <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">{i.category}</span> },
                  { header: 'Số tiền', accessor: (i) => <span className="font-bold text-red-600">-{formatCurrency(i.amount)}</span>, align: 'right' }
              ];
              break;

          case 'debt':
              modalTitle = 'Danh sách Công nợ Phải thu';
              resultData = tuition
                  .filter(t => t.remainingAmount > 0)
                  .map(t => ({ ...t, student: students.find(s => s.id === t.studentId) }))
                  .sort((a,b) => b.remainingAmount - a.remainingAmount);
              tableCols = [
                  { header: 'Học viên', accessor: (i) => (
                      <div className="flex items-center gap-3 group">
                          <Avatar src={i.student?.avatar} name={i.student?.name} className="size-9 text-xs" />
                          <div className="flex flex-col">
                              <span 
                                onClick={() => i.student && handleStudentClick(i.student.id)}
                                className={linkStyle}
                                title="Xem chi tiết học viên"
                              >
                                {i.student?.name}
                              </span>
                              <span className="text-xs text-slate-500">{i.student?.code}</span>
                          </div>
                      </div>
                  )},
                  { header: 'Khoản thu', accessor: (i) => i.description || 'Học phí' },
                  { header: 'Hạn nộp', accessor: (i) => {
                      const overdue = new Date(i.dueDate) < new Date();
                      return <span className={`text-xs font-medium px-2 py-0.5 rounded ${overdue ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{new Date(i.dueDate).toLocaleDateString('vi-VN')}</span>
                  }},
                  { header: 'Còn nợ', accessor: (i) => <span className="font-bold text-orange-600">{formatCurrency(i.remainingAmount)}</span>, align: 'right' }
              ];
              break;

          case 'leads_total':
              modalTitle = 'Danh sách Lead mới thu được';
              resultData = leads
                  .filter(l => isInRange(l.lastActivity))
                  .sort((a,b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
              tableCols = [
                  { header: 'Họ tên', accessor: (i) => (
                      <div className="flex items-center gap-3">
                          <Avatar src={i.avatar} name={i.name} className="size-9 text-xs" />
                          <span 
                            onClick={() => handleStudentClick(i.id, true)}
                            className={linkStyle}
                            title="Xem chi tiết Lead"
                          >
                            {i.name}
                          </span>
                      </div>
                  )},
                  { header: 'Nguồn', accessor: (i) => i.source },
                  { header: 'Trạng thái', accessor: (i) => (
                      <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${i.status === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                          {i.status}
                      </span>
                  )},
                  { header: 'Liên hệ', accessor: (i) => i.phone || i.email }
              ];
              break;
            
          case 'students_active':
              modalTitle = 'Danh sách Học viên Đang học (Active)';
              resultData = students.filter(s => s.status === 'active');
              tableCols = [
                  { header: 'Học viên', accessor: (i) => (
                      <div className="flex items-center gap-3">
                          <Avatar src={i.avatar} name={i.name} className="size-9 text-xs" />
                          <div className="flex flex-col">
                              <span 
                                onClick={() => handleStudentClick(i.id)}
                                className={linkStyle}
                              >
                                {i.name}
                              </span>
                              <span className="text-xs text-slate-500">{i.code}</span>
                          </div>
                      </div>
                  )},
                  { header: 'Lớp hiện tại', accessor: (i) => (
                      i.currentClass && i.classId ? (
                          <span 
                            onClick={() => handleClassClick(i.classId)}
                            className={`${linkStyle} text-sm`}
                            title="Xem chi tiết lớp"
                          >
                            {i.currentClass}
                          </span>
                      ) : <span className="text-slate-400 italic">Chưa xếp lớp</span>
                  )},
                  { header: 'Ngày nhập học', accessor: (i) => i.enrollmentDate ? new Date(i.enrollmentDate).toLocaleDateString('vi-VN') : '-' },
                  { header: 'Trạng thái', accessor: (i) => <span className="text-green-600 font-bold flex items-center gap-1 text-xs"><span className="material-symbols-outlined text-[14px]">check_circle</span> Active</span> }
              ];
              break;

          default:
              modalTitle = 'Chi tiết dữ liệu';
              resultData = [];
      }

      return { title: modalTitle, columns: tableCols, data: resultData };
  }, [type, finance, tuition, students, leads, filters, navigate]); 

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#111318]/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a202c] w-full max-w-4xl rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh] border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">table_chart</span>
                    {title}
                </h3>
                {type !== 'debt' && type !== 'students_active' && (
                    <p className="text-xs text-slate-500 mt-1">
                        Giai đoạn: {dateRange.start.toLocaleDateString('vi-VN')} - {dateRange.end.toLocaleDateString('vi-VN')}
                    </p>
                )}
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined">close</span>
            </button>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-0">
            <table className="w-full text-left border-collapse">
                <thead className="bg-white dark:bg-[#1a202c] sticky top-0 z-10 shadow-sm text-xs uppercase text-slate-500 font-bold">
                    <tr>
                        <th className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 w-12 text-center">#</th>
                        {columns.map((col, idx) => (
                            <th key={idx} className={`px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm text-slate-700 dark:text-slate-300">
                    {data.length > 0 ? data.map((item, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                            <td className="px-6 py-3 text-slate-400 font-mono text-xs text-center">{idx + 1}</td>
                            {columns.map((col, cIdx) => (
                                <td key={cIdx} className={`px-6 py-3 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
                                    {col.accessor(item)}
                                </td>
                            ))}
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-slate-400 italic">
                                Không có dữ liệu nào trong giai đoạn này.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* Footer Summary */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center text-sm">
            <span className="text-slate-500">Tổng số dòng: <strong>{data.length}</strong></span>
            <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-bold hover:bg-slate-50 transition-colors">
                    Xuất Excel
                </button>
                <button onClick={onClose} className="px-3 py-1.5 bg-primary text-white rounded text-xs font-bold hover:bg-primary-dark transition-colors">
                    Đóng
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default DrillDownModal;
