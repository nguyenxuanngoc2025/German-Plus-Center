
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import StudentSelectorModal from '../components/StudentSelectorModal';
import EditClassModal from '../components/EditClassModal';
import MiniClassCalendar from '../components/MiniClassCalendar';
import { useData } from '../context/DataContext';
import Avatar from '../components/Avatar';
import { AttendanceStatus } from '../types';

const ClassDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { classes, students, enrollStudent, convertLeadToStudent, removeStudentFromClass, saveAttendance, updateStudentNote, hasPermission, generateClassSessions } = useData();
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

  // Generate sessions to calculate total past sessions correctly
  const classSessions = useMemo(() => {
      return generateClassSessions(classData);
  }, [classData, generateClassSessions]);

  // Logic: Total Past Sessions (Sessions that have happened or marked as finished)
  const totalPastSessions = useMemo(() => {
      const today = new Date();
      today.setHours(0,0,0,0);
      // Count sessions where date < today OR session is marked completed in any way
      return classSessions.filter(s => {
          const sDate = new Date(s.date);
          return sDate <= today || (s as any).status === 'finished';
      }).length;
  }, [classSessions]);

  // Attendance State for "Today" (or selected date)
  const [todayAttendance, setTodayAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [historyModalStudent, setHistoryModalStudent] = useState<string | null>(null);

  // Initialize Today's Attendance if needed
  useEffect(() => {
      const today = new Date().toISOString().split('T')[0];
      const initialStatus: Record<string, AttendanceStatus> = {};
      classStudents.forEach(s => {
          // Check if already has record for today
          const record = s.attendanceHistory?.find(r => r.date === today);
          if (record) {
              initialStatus[s.id] = record.status;
          }
      });
      if (Object.keys(initialStatus).length > 0) {
          setTodayAttendance(prev => ({ ...prev, ...initialStatus }));
      }
  }, [classStudents]);

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setTodayAttendance(prev => {
        return { ...prev, [studentId]: status };
    });
  };

  const handleSaveAttendance = () => {
      const today = new Date().toISOString().split('T')[0];
      
      const markedCount = Object.keys(todayAttendance).length;
      const totalStudents = classStudents.length;

      // VALIDATION: Check if any student is left "Pending"
      if (markedCount < totalStudents) {
          const missingCount = totalStudents - markedCount;
          const confirmMsg = `Bạn đang để trống điểm danh cho ${missingCount} học viên.\nDữ liệu chuyên cần sẽ không được cập nhật cho các bạn này.\n\nBạn có chắc chắn muốn lưu?`;
          if (!window.confirm(confirmMsg)) {
              return; 
          }
      }

      const result = saveAttendance(classData.id, today, todayAttendance);
      if (result.success) {
          alert(result.message);
      }
  };

  const handleOverrideAttendance = (studentId: string, date: string, newStatus: AttendanceStatus) => {
      const updatePayload: Record<string, AttendanceStatus> = { [studentId]: newStatus };
      saveAttendance(classData.id, date, updatePayload);
      alert(`Đã cập nhật điểm danh ngày ${new Date(date).toLocaleDateString()}!`);
  };

  const handleNoteBlur = (studentId: string, e: React.FocusEvent<HTMLInputElement>) => {
      if (e.target.value !== e.target.defaultValue) {
          updateStudentNote(studentId, e.target.value);
      }
  };

  const handleAddStudents = (selectedStudents: any[], selectedLeads: any[]) => {
      selectedStudents.forEach(s => enrollStudent(s.id, classData.id));
      selectedLeads.forEach(l => convertLeadToStudent(l.id, classData.id, classData.tuitionFee));
      setShowAddStudent(false);
  };

  const handleRemoveStudent = (studentId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa học viên này khỏi lớp?")) {
        removeStudentFromClass(studentId, classData.id);
    }
  };

  // Helper: Calculate Dynamic Class Progress
  const calculateClassProgress = () => {
      if (!classData.startDate || !classData.endDate) return classData.progress; 
      const total = classData.totalSessions || 24;
      return Math.min(100, Math.round((totalPastSessions / total) * 100));
  };

  const dynamicProgress = useMemo(() => calculateClassProgress(), [classData, totalPastSessions]);
  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  // Helper to get formatted Level
  const classLevel = classData.level || classData.name.split(' ')[2] || 'A1';

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-background-light dark:bg-background-dark font-display text-base">
      <Header title="Chi tiết Lớp học" />
      
      <main className="flex-1 overflow-y-auto scroll-smooth">
        <div className="flex flex-col gap-0">
            
            {/* 1. NEW: CLASS INFORMATION HEADER */}
            <div className="bg-white dark:bg-[#1a202c] border-b border-slate-200 dark:border-slate-700 shadow-sm relative z-10">
                <div className="px-6 lg:px-10 py-5">
                    {/* Top Row: Name & Actions */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide border whitespace-nowrap flex-shrink-0 ${
                                    classData.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 
                                    classData.status === 'upcoming' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                    classData.status === 'paused' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                    {classData.status === 'active' ? 'Đang học' : 
                                     classData.status === 'upcoming' ? 'Đang tuyển sinh' : 
                                     classData.status === 'paused' ? 'Tạm dừng' : 'Đã kết thúc'}
                                </span>
                                <span className="text-slate-400 text-xs font-mono whitespace-nowrap flex-shrink-0">{classData.code}</span>
                            </div>
                            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight truncate" title={classData.name}>
                                {classData.name}
                            </h1>
                        </div>
                        
                        <div className="flex gap-3 flex-shrink-0 flex-wrap">
                            {hasPermission('edit_students') && (
                                <button 
                                    onClick={() => setShowAddStudent(true)}
                                    className="h-10 px-4 bg-primary/10 hover:bg-primary/20 text-primary dark:text-blue-300 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap"
                                >
                                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                                    Thêm HV
                                </button>
                            )}
                            {hasPermission('edit_classes') && (
                                <button 
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="h-10 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap"
                                >
                                    <span className="material-symbols-outlined text-[20px]">settings</span>
                                    Cài đặt
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Bottom Row: Information Strip */}
                    <div className="flex flex-wrap items-center gap-y-3 gap-x-6 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
                        {/* Mode */}
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            <div className={`p-1.5 rounded-md ${classData.mode === 'online' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                <span className="material-symbols-outlined text-[18px] block">
                                    {classData.mode === 'online' ? 'language' : 'apartment'}
                                </span>
                            </div>
                            <span className="font-semibold">{classData.mode === 'online' ? 'Online Class' : 'Offline Class'}</span>
                        </div>

                        {/* Level */}
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-700">
                                <span className="material-symbols-outlined text-[18px] block">signal_cellular_alt</span>
                            </div>
                            <span className="font-semibold">Trình độ: {classLevel}</span>
                        </div>

                        {/* Schedule */}
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            <div className="p-1.5 rounded-md bg-orange-100 text-orange-700">
                                <span className="material-symbols-outlined text-[18px] block">calendar_month</span>
                            </div>
                            <span className="font-semibold">{classData.schedule}</span>
                        </div>

                        {/* Tuition */}
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            <div className="p-1.5 rounded-md bg-rose-100 text-rose-700">
                                <span className="material-symbols-outlined text-[18px] block">payments</span>
                            </div>
                            <span className="font-semibold">{formatCurrency(classData.tuitionFee)}</span>
                        </div>

                        {/* Dates */}
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 ml-auto border-l border-slate-200 dark:border-slate-700 pl-4 whitespace-nowrap hidden lg:flex">
                            <span className="material-symbols-outlined text-[18px]">date_range</span>
                            <span>
                                {classData.startDate ? new Date(classData.startDate).toLocaleDateString('vi-VN') : '--'} 
                                <span className="mx-1">→</span> 
                                {classData.endDate ? new Date(classData.endDate).toLocaleDateString('vi-VN') : '--'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 lg:p-10 max-w-[2000px] mx-auto w-full flex flex-col gap-8">
                {/* 2. Scorecards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Enrollment Card */}
                    <div className="bg-white dark:bg-[#1a202c] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-subtle flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Sĩ số hiện tại</p>
                            <div className="flex items-baseline gap-1 mt-2">
                                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{classStudents.length}</span>
                                <span className="text-lg text-slate-400 font-medium">/ {classData.maxStudents}</span>
                            </div>
                        </div>
                        <div className="size-14 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                            <span className="material-symbols-outlined text-[32px]">groups</span>
                        </div>
                    </div>

                    {/* Progress Card */}
                    <div className="bg-white dark:bg-[#1a202c] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-subtle flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Tiến độ lớp</p>
                            <div className="flex items-baseline gap-1 mt-2">
                                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{totalPastSessions}</span>
                                <span className="text-lg text-slate-400 font-medium">buổi đã qua</span>
                            </div>
                        </div>
                        <div className="relative size-14 flex items-center justify-center">
                            <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                <path className="text-gray-100 dark:text-gray-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                <path className="text-green-500" strokeDasharray={`${dynamicProgress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                            </svg>
                            <span className="absolute text-xs font-bold text-green-600">{dynamicProgress}%</span>
                        </div>
                    </div>

                    {/* Teacher Card */}
                    <div className="bg-white dark:bg-[#1a202c] p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-subtle flex items-center gap-4 col-span-1 md:col-span-2">
                        <Avatar src={classData.teacherAvatar} name={classData.teacher} className="size-16 border-2 border-white shadow-sm" />
                        <div className="flex-1">
                            <p className="text-xs text-slate-500 font-bold uppercase">Giáo viên chủ nhiệm</p>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{classData.teacher}</h3>
                            <div className="flex gap-2 mt-2">
                                <button className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">Gửi Email</button>
                                <button className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">Chat</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Main Body: Advanced Tracking Table */}
                <div className="bg-white dark:bg-[#1a202c] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-card overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-[28px]">school</span>
                            Bảng Tình hình Học tập
                        </h3>
                        <button 
                            onClick={handleSaveAttendance}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-secondary hover:bg-orange-600 text-white rounded-xl shadow-sm transition-colors whitespace-nowrap"
                        >
                            <span className="material-symbols-outlined text-[22px]">save</span>
                            Lưu Cập nhật
                        </button>
                    </div>
                    
                    <div className="overflow-x-auto max-h-[700px] relative">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#F1F5F9] dark:bg-slate-900 text-sm uppercase text-slate-600 dark:text-slate-400 font-bold tracking-wide sticky top-0 z-20 shadow-sm">
                                <tr>
                                    <th className="px-5 py-4 text-center w-16 border-r border-slate-200 dark:border-slate-700">STT</th>
                                    <th className="px-5 py-4 w-32">Mã HV</th>
                                    <th className="px-5 py-4 min-w-[240px]">Họ và tên</th>
                                    <th className="px-5 py-4 w-40">Số ĐT</th>
                                    <th className="px-5 py-4 text-center w-40">Chuyên cần</th>
                                    <th className="px-5 py-4 w-[240px] text-center">Điểm danh hôm nay</th>
                                    <th className="px-5 py-4 text-center w-28">Test 1</th>
                                    <th className="px-5 py-4 text-center w-28">Test 2</th>
                                    <th className="px-5 py-4 text-center w-28 font-extrabold text-slate-800 dark:text-white">ĐTB</th>
                                    <th className="px-5 py-4 min-w-[240px]">Ghi chú</th>
                                    <th className="px-5 py-4 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-base">
                                {classStudents.map((student, idx) => {
                                    // Calculate Attendance:
                                    // Only count sessions where a record exists. Pending days are not counted.
                                    const presentCount = student.attendanceHistory?.filter(h => h.status === 'present').length || 0;
                                    const recordedSessionsCount = student.attendanceHistory?.length || 0;
                                    
                                    // Zero Data Logic: Show "0/0" if no history
                                    const attendanceDisplay = `${presentCount} / ${recordedSessionsCount}`;
                                    const attendanceRate = recordedSessionsCount > 0 ? Math.round((presentCount / recordedSessionsCount) * 100) : 0;
                                    
                                    const isWarning = attendanceRate < 80 && recordedSessionsCount > 2; 
                                    const score1 = student.scores?.[0]?.value ?? '-';
                                    const score2 = student.scores?.[1]?.value ?? '-';
                                    const avgScoreDisplay = student.averageScore ? student.averageScore : '-';

                                    return (
                                        <tr 
                                            key={student.id} 
                                            className={`group even:bg-[#F8FAFC] dark:even:bg-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-colors ${isWarning ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}
                                        >
                                            <td className="px-5 py-4 text-center font-medium text-slate-500 border-r border-slate-100 dark:border-slate-800">{idx + 1}</td>
                                            <td className="px-5 py-4 font-mono text-sm text-slate-500 font-medium">{student.code}</td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-4">
                                                    <Avatar src={student.avatar} name={student.name} className="size-10 text-sm border border-slate-200" />
                                                    <span className="font-bold text-slate-800 dark:text-white text-base">{student.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-slate-600 dark:text-slate-400 text-sm">{student.phone}</td>
                                            
                                            {/* Attendance Stats Cell */}
                                            <td className="px-5 py-4 text-center">
                                                <div 
                                                    onClick={() => setHistoryModalStudent(student.id)}
                                                    className={`inline-flex flex-col items-center cursor-pointer hover:scale-105 transition-transform px-3 py-1.5 rounded-lg border ${isWarning ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-700'}`}
                                                    title="Click xem chi tiết"
                                                >
                                                    {/* Show Present / Recorded */}
                                                    <span className="text-sm font-extrabold">{attendanceDisplay}</span>
                                                    <div className="w-20 h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                                                        <div 
                                                            className={`h-full ${isWarning ? 'bg-red-500' : 'bg-green-500'}`} 
                                                            style={{width: `${attendanceRate}%`}}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Quick Attendance */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    {['present', 'excused', 'unexcused'].map((status) => (
                                                        <button 
                                                            key={status}
                                                            onClick={() => handleAttendanceChange(student.id, status as AttendanceStatus)}
                                                            className={`size-9 rounded-lg flex items-center justify-center font-bold text-sm transition-all shadow-sm border ${
                                                                todayAttendance[student.id] === status
                                                                ? (status === 'present' 
                                                                    ? 'bg-green-600 border-green-600 text-white shadow-green-200 dark:shadow-none scale-105' 
                                                                    : status === 'excused' 
                                                                        ? 'bg-orange-500 border-orange-500 text-white shadow-orange-200 dark:shadow-none scale-105' 
                                                                        : 'bg-red-600 border-red-600 text-white shadow-red-200 dark:shadow-none scale-105')
                                                                : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                            } active:scale-95`}
                                                            title={status === 'present' ? 'Có mặt' : status === 'excused' ? 'Có phép' : 'Vắng'}
                                                        >
                                                            {status === 'present' ? 'P' : status === 'excused' ? 'CP' : 'KP'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>

                                            {/* Scores */}
                                            <td className="px-5 py-4 text-center text-slate-700 dark:text-slate-300 font-mono font-medium">{score1}</td>
                                            <td className="px-5 py-4 text-center text-slate-700 dark:text-slate-300 font-mono font-medium">{score2}</td>
                                            <td className="px-5 py-4 text-center font-bold text-primary text-lg">{avgScoreDisplay}</td>

                                            {/* Notes */}
                                            <td className="px-5 py-4">
                                                <input 
                                                    type="text" 
                                                    defaultValue={student.teacherNote}
                                                    onBlur={(e) => handleNoteBlur(student.id, e)}
                                                    className="w-full bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 text-sm py-1.5 focus:border-primary focus:ring-0 placeholder-slate-400"
                                                    placeholder="..."
                                                />
                                            </td>

                                            <td className="px-5 py-4 text-right">
                                                <button 
                                                    onClick={() => handleRemoveStudent(student.id)}
                                                    className="text-slate-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {classStudents.length === 0 && (
                                    <tr><td colSpan={11} className="py-12 text-center text-slate-500 italic text-lg">Chưa có học viên nào.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 4. Bottom Section: Calendar */}
                <div className="w-full bg-white dark:bg-[#1a202c] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <MiniClassCalendar 
                        classData={classData} 
                        onAttendanceClick={(date) => alert(`Chức năng điểm danh nhanh cho ngày ${new Date(date).toLocaleDateString()} đang được cập nhật.`)}
                    />
                </div>
            </div>
        </div>
      </main>

      {/* Modals */}
      {showAddStudent && (
          <StudentSelectorModal 
            onClose={() => setShowAddStudent(false)}
            onConfirm={handleAddStudents}
            excludeClassId={classData.id}
            title={`Thêm học viên vào lớp ${classData.code}`}
          />
      )}

      {isEditModalOpen && (
          <EditClassModal 
            classData={classData}
            onClose={() => setIsEditModalOpen(false)}
          />
      )}

      {/* History/Override Modal */}
      {historyModalStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
              <div className="bg-white dark:bg-[#1a202c] w-full max-w-xl rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-8">
                      <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Lịch sử điểm danh</h3>
                          <p className="text-sm text-slate-500 mt-1">Học viên: <span className="font-bold text-primary text-base">{students.find(s => s.id === historyModalStudent)?.name}</span></p>
                      </div>
                      <button onClick={() => setHistoryModalStudent(null)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100"><span className="material-symbols-outlined text-2xl">close</span></button>
                  </div>
                  
                  <div className="max-h-[500px] overflow-y-auto custom-scrollbar flex flex-col gap-3">
                      {students.find(s => s.id === historyModalStudent)?.attendanceHistory?.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((record, idx) => (
                          <div key={idx} className="flex justify-between items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary/30 transition-colors">
                              <span className="text-base font-bold text-slate-700 dark:text-slate-300 flex items-center gap-3">
                                  <span className="material-symbols-outlined text-[20px] text-slate-400">calendar_today</span>
                                  {new Date(record.date).toLocaleDateString('vi-VN')}
                              </span>
                              
                              <div className="flex gap-1.5">
                                  {['present', 'excused', 'unexcused'].map((status) => (
                                      <button 
                                          key={status}
                                          onClick={() => handleOverrideAttendance(historyModalStudent, record.date, status as AttendanceStatus)}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all border ${
                                              record.status === status 
                                              ? (status === 'present' ? 'bg-green-600 border-green-600 text-white' : status === 'excused' ? 'bg-orange-500 border-orange-500 text-white' : 'bg-red-600 border-red-600 text-white')
                                              : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                                          }`}
                                      >
                                          {status === 'present' ? 'Có mặt' : status === 'excused' ? 'Có phép' : 'Vắng'}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      ))}
                      {(!students.find(s => s.id === historyModalStudent)?.attendanceHistory?.length) && (
                          <p className="text-center text-slate-400 italic py-6">Chưa có dữ liệu điểm danh.</p>
                      )}
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 text-right">
                      <button onClick={() => setHistoryModalStudent(null)} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors">Đóng</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ClassDetails;
