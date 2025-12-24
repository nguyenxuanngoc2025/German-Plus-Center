
import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import StudentSelectorModal from '../components/StudentSelectorModal';
import EditClassModal from '../components/EditClassModal';
import { useData } from '../context/DataContext';
import Avatar from '../components/Avatar';

const ClassDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { classes, students, leads, enrollStudent, convertLeadToStudent, removeStudentFromClass, saveAttendance } = useData();
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Find class based on ID
  const classData = useMemo(() => {
    return classes.find(c => c.id === id) || classes[0];
  }, [id, classes]);

  // Filter students belonging to this class
  const classStudents = useMemo(() => {
    return students.filter(s => s.classId === classData.id);
  }, [students, classData.id]);

  // Mock State for Attendance
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

  const toggleAttendance = (studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const handleSaveAttendance = () => {
      const today = new Date().toLocaleDateString('vi-VN');
      const result = saveAttendance(classData.id, today, attendance);
      alert(result.message);
  };

  const handleAddStudents = (selectedStudents: any[], selectedLeads: any[]) => {
      // 1. Enroll existing students
      selectedStudents.forEach(s => {
          enrollStudent(s.id, classData.id);
      });

      // 2. Convert and enroll leads
      selectedLeads.forEach(l => {
          convertLeadToStudent(l.id, classData.id, classData.tuitionFee);
      });

      setShowAddStudent(false);
  };

  const handleRemoveStudent = (studentId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa học viên này khỏi lớp? Học viên sẽ được đưa về danh sách chờ xếp lớp.")) {
        removeStudentFromClass(studentId, classData.id);
    }
  };

  // Helper to get Lead Source for a student
  const getStudentSource = (leadId?: string) => {
      if (!leadId) return 'Vãng lai';
      const lead = leads.find(l => l.id === leadId);
      return lead ? lead.source : 'Không rõ';
  };

  // Helper to get Tuition Status
  const getTuitionStatus = (student: any) => {
      const balance = student.balance || 0;
      if (balance <= 0) return { label: 'Đã đóng', color: 'text-emerald-600 bg-emerald-50', icon: 'check' };
      if (balance < classData.tuitionFee) return { label: `Thiếu ${new Intl.NumberFormat('vi-VN').format(balance)}đ`, color: 'text-secondary bg-orange-50', icon: 'pending' };
      return { label: 'Chưa đóng', color: 'text-rose-600 bg-rose-50', icon: 'warning' };
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-background-light dark:bg-background-dark font-display">
      <Header title="Chi tiết Lớp học" />
      
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 scroll-smooth">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
            
            {/* Breadcrumbs */}
            <nav className="flex text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                <span onClick={() => navigate('/')} className="hover:text-primary transition-colors cursor-pointer">Trang chủ</span>
                <span className="mx-2 text-slate-300 dark:text-slate-600">/</span>
                <span onClick={() => navigate('/classes')} className="hover:text-primary transition-colors cursor-pointer">Danh sách lớp</span>
                <span className="mx-2 text-slate-300 dark:text-slate-600">/</span>
                <span className="text-slate-900 dark:text-white">{classData.name} - {classData.code}</span>
            </nav>

            {/* Title & Actions */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{classData.name} - {classData.code}</h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            classData.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                            classData.status === 'upcoming' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                        }`}>
                            {classData.status === 'active' ? 'Đang hoạt động' : classData.status === 'upcoming' ? 'Sắp khai giảng' : 'Đầy lớp'}
                        </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                        Khai giảng: 01/10/2023 • Kết thúc dự kiến: 15/12/2023
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-[#1a202c] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all">
                        <span className="material-symbols-outlined text-[20px]">file_download</span>
                        Xuất dữ liệu
                    </button>
                    <button 
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-[#1a202c] border border-primary text-primary rounded-lg text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/10 shadow-sm transition-all"
                    >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                        Chỉnh sửa thông tin
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-primary">groups</span>
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Sĩ số lớp</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{classData.students}<span className="text-slate-400 text-xl font-normal">/{classData.maxStudents}</span></p>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{width: `${(classData.students / classData.maxStudents) * 100}%`}}></div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-emerald-600">check_circle</span>
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Tiến độ khóa học</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{classData.progress}%</p>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-emerald-600 h-full rounded-full" style={{width: `${classData.progress}%`}}></div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-secondary">assignment</span>
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Bài kiểm tra tới</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white truncate">Kiểm tra giữa kỳ (A1)</p>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-secondary text-sm font-medium">
                        <span className="material-symbols-outlined text-[18px]">schedule</span>
                        15/11/2023 (Còn 3 ngày)
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* Student List */}
                    <div className="bg-white dark:bg-[#1a202c] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700">
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Danh sách Học viên</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500 dark:text-slate-400">Tổng số: <strong className="text-slate-900 dark:text-white">{classData.students}</strong></span>
                                    <button className="p-1.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-700" title="Bộ lọc">
                                        <span className="material-symbols-outlined text-[20px]">filter_list</span>
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative group bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all flex-1">
                                    <div className="flex items-center gap-3 px-2">
                                        <span className="material-symbols-outlined text-primary">person_add</span>
                                        <input 
                                            className="w-full bg-transparent border-none text-sm focus:ring-0 text-slate-900 dark:text-white placeholder-slate-500 py-1.5" 
                                            placeholder="Thêm học viên trực tiếp..." 
                                            type="text"
                                            readOnly
                                            onClick={() => setShowAddStudent(true)}
                                        />
                                        <button 
                                            onClick={() => setShowAddStudent(true)}
                                            className="text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded shadow-sm hover:bg-blue-700 transition-colors"
                                        >
                                            Thêm
                                        </button>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSaveAttendance}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 rounded-lg text-sm font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-[18px]">save_as</span>
                                    Lưu điểm danh
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
                                        <th className="px-6 py-4">Học viên</th>
                                        <th className="px-6 py-4">Nguồn Lead</th>
                                        <th className="px-6 py-4">Học phí</th>
                                        <th className="px-6 py-4 text-center w-32">Điểm danh<br/><span className="text-[10px] normal-case opacity-70">Hôm nay</span></th>
                                        <th className="px-6 py-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                                    {classStudents.map(student => {
                                        const tStatus = getTuitionStatus(student);
                                        const source = getStudentSource(student.leadId);
                                        return (
                                            <tr key={student.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar src={student.avatar} name={student.name} className="size-9 border border-slate-200 dark:border-slate-600" />
                                                        <div>
                                                            <p className="font-medium text-slate-900 dark:text-white group-hover:text-primary transition-colors">{student.name}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">{student.phone}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-100 dark:border-blue-900/30">
                                                        <span className="material-symbols-outlined text-[14px]">social_leaderboard</span>
                                                        {source}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded border border-transparent ${tStatus.color}`}>
                                                        <span className="material-symbols-outlined text-[14px]">{tStatus.icon}</span>
                                                        {tStatus.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <label className="inline-flex items-center cursor-pointer">
                                                        <input 
                                                            checked={!!attendance[student.id]} 
                                                            onChange={() => toggleAttendance(student.id)}
                                                            className="form-checkbox size-5 text-primary rounded border-slate-300 focus:ring-primary/50" type="checkbox"
                                                        />
                                                    </label>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleRemoveStudent(student.id); }}
                                                        className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        title="Xóa khỏi lớp"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {classStudents.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 italic">
                                                Chưa có học viên nào trong lớp này.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-center">
                            <button className="text-sm text-primary font-medium hover:text-blue-700 dark:hover:text-blue-400 transition-colors">Xem tất cả {classStudents.length} học viên</button>
                        </div>
                    </div>

                    {/* Curriculum Section (Existing) */}
                    <div className="bg-white dark:bg-[#1a202c] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Lộ trình học tập & Điểm danh</h3>
                            <button className="text-sm text-primary font-medium hover:underline">Mở rộng toàn bộ</button>
                        </div>
                        {/* Mock Curriculum Items */}
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-16 text-center">
                                        <span className="block text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Buổi</span>
                                        <span className="block text-xl font-bold text-primary">01</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-bold text-slate-900 dark:text-white">Giới thiệu & Bảng chữ cái</h4>
                                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30">Đã hoàn thành</span>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px]">calendar_month</span> 01/10/2023 
                                            <span className="text-slate-300 dark:text-slate-600">|</span>
                                            <span className="material-symbols-outlined text-[16px]">schedule</span> 18:00 - 19:30
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* General Info */}
                    <div className="bg-white dark:bg-[#1a202c] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[20px]">info</span>
                            Thông tin chung
                        </h3>
                        <ul className="space-y-4 text-sm">
                            <li className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Cấp độ</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{classData.name.includes('A1') ? 'A1 (Cơ bản)' : classData.name.includes('A2') ? 'A2 (Sơ cấp)' : 'Trung cấp'}</span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Hình thức</span>
                                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">{classData.mode === 'online' ? 'wifi' : 'apartment'}</span> 
                                    {classData.mode === 'online' ? 'Online' : 'Offline'}
                                </span>
                            </li>
                            {classData.mode === 'online' ? (
                                <li className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-400">Link học</span>
                                    <a href={classData.link} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline truncate max-w-[150px] flex items-center gap-1">
                                        Vào lớp
                                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                    </a>
                                </li>
                            ) : (
                                <li className="flex flex-col gap-1">
                                    <span className="text-slate-500 dark:text-slate-400">Địa điểm</span>
                                    <span className="font-medium text-slate-900 dark:text-white flex items-start gap-1">
                                        <span className="material-symbols-outlined text-[16px] mt-0.5 text-slate-400">location_on</span>
                                        {classData.location}
                                    </span>
                                </li>
                            )}
                            <li className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Lịch học</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{classData.schedule}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Teacher Info */}
                    <div className="bg-white dark:bg-[#1a202c] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Giảng viên phụ trách</h3>
                            <button className="text-slate-400 hover:text-primary">
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                            <Avatar src={classData.teacherAvatar} name={classData.teacher} className="size-14 border-2 border-white dark:border-slate-600 shadow-md text-xl" />
                            <div>
                                <p className="text-base font-bold text-slate-900 dark:text-white">{classData.teacher}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Giáo viên chính</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                <span className="material-symbols-outlined text-[18px]">mail</span>
                                Email
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                <span className="material-symbols-outlined text-[18px]">call</span>
                                Gọi
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </main>

      {showAddStudent && (
          <StudentSelectorModal 
            onClose={() => setShowAddStudent(false)}
            onConfirm={handleAddStudents}
            excludeClassId={classData.id}
            title={`Thêm học viên vào lớp ${classData.code}`}
          />
      )}

      {/* Edit Class Modal */}
      {isEditModalOpen && (
          <EditClassModal 
            classData={classData}
            onClose={() => setIsEditModalOpen(false)}
          />
      )}
    </div>
  );
};

export default ClassDetails;
