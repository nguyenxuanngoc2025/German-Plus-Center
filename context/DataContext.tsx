
import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import { Lead, Student, ClassItem, Tuition, FinanceRecord, Staff, Document, SystemSettings, TestResult, AttendanceStatus, AttendanceRecord, PermissionKey, Notification, ClassSession } from '../types';
import { MOCK_LEADS, MOCK_STUDENTS, MOCK_CLASSES, MOCK_TUITION, MOCK_FINANCE, MOCK_STAFF, MOCK_DOCUMENTS } from '../constants';

export type { PermissionKey };

export type UserRole = 'admin' | 'manager' | 'sale' | 'teacher' | 'assistant' | 'student';

// --- PURE CALCULATION LOGIC (SYSTEM ARCHITECTURE: INDEPENDENT FORMULAS) ---
// These functions are decoupled from React State/Context to ensure stability and reusability.

const CORE_CALCULATIONS = {
    /**
     * Calculates financial summary from raw records.
     * Independent of UI state.
     */
    calculateFinancials: (financeRecords: FinanceRecord[], tuitionRecords: Tuition[], startDate?: Date, endDate?: Date) => {
        let filteredFinance = financeRecords;
        let filteredTuition = tuitionRecords;

        if (startDate && endDate) {
            const start = new Date(startDate); start.setHours(0,0,0,0);
            const end = new Date(endDate); end.setHours(23,59,59,999);
            
            filteredFinance = financeRecords.filter(f => {
                const d = new Date(f.date);
                return d >= start && d <= end;
            });
            // Tuition debt snapshot is usually point-in-time, but for reports we might filter by due date
            filteredTuition = tuitionRecords.filter(t => {
                const d = new Date(t.dueDate);
                return d >= start && d <= end;
            });
        }

        const revenue = filteredFinance.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
        const expense = filteredFinance.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
        const debt = tuitionRecords.reduce((sum, t) => sum + t.remainingAmount, 0); // Total outstanding debt is always global

        return { revenue, expense, debt, profit: revenue - expense };
    },

    /**
     * Recalculates end date based on sessions and holidays.
     * Prevents infinite loops by using a max safety counter.
     */
    recalculateSchedule: (startDateStr: string, totalSessions: number, daysStr: string, offDays: string[] = []): string => {
        if (!startDateStr || totalSessions <= 0) return '';
        const start = new Date(startDateStr);
        if (isNaN(start.getTime())) return '';
        if (!daysStr || typeof daysStr !== 'string' || daysStr.trim() === '') return startDateStr;
        
        try {
            const dayMap: Record<string, number> = { 'CN': 0, 'T2': 1, 'T3': 2, 'T4': 3, 'T5': 4, 'T6': 5, 'T7': 6 };
            const targetDays = daysStr.split('/').map(d => {
                 const key = d.trim();
                 return dayMap.hasOwnProperty(key) ? dayMap[key] : -1;
            }).filter(d => d !== -1);
            
            if (targetDays.length === 0) return startDateStr;

            let sessionsFound = 0;
            let iterator = new Date(start);
            let lastDate = new Date(start);
            let safetyCounter = 0;
            const MAX_LOOPS = 2000;

            while (sessionsFound < totalSessions && safetyCounter < MAX_LOOPS) {
                const currentDay = iterator.getDay();
                const dateString = iterator.toISOString().split('T')[0];
                
                if (targetDays.includes(currentDay)) {
                    if (!offDays.includes(dateString)) {
                        sessionsFound++;
                        lastDate = new Date(iterator);
                    }
                }
                
                if (sessionsFound < totalSessions) {
                    iterator.setDate(iterator.getDate() + 1);
                }
                safetyCounter++;
            }
            
            return lastDate.toISOString().split('T')[0];
        } catch (error) {
            console.error("Error recalculating schedule:", error);
            return startDateStr;
        }
    }
};

// Role Definitions Configuration
const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
    admin: [
        'view_dashboard', 'view_finance', 'edit_settings', 'delete_data', 
        'view_leads', 'edit_leads', 'view_students', 'edit_students', 
        'view_classes', 'edit_classes', 'export_data', 'view_reports'
    ],
    manager: [
        'view_dashboard', 
        'view_leads', 'edit_leads', 
        'view_students', 'edit_students', 
        'view_classes', 'edit_classes', 'view_reports' 
    ],
    sale: [
        'view_dashboard', 
        'view_leads', 'edit_leads', 
        'view_students', 
        'view_classes'
    ],
    teacher: [
        'view_dashboard', 
        'view_students', 
        'view_classes'   
    ],
    assistant: [
        'view_dashboard',
        'view_students',
        'view_classes'
    ],
    student: [
        'view_classes'
    ]
};

interface UserInfo {
  name: string;
  phone: string;
  role: UserRole;
  avatar?: string;
}

interface PaymentPlan {
    method: 'full' | 'installment';
    deposit: number;
    installments: { date: string; amount: number }[];
}

interface Discrepancy {
    studentId: string;
    studentName: string;
    cached: number;
    calculated: number;
}

interface FinancialStats {
    revenue: number;
    expense: number;
    debt: number;
    profit: number;
}

interface DateFilterState {
    preset: string;
    startDate: string;
    endDate: string;
}

interface DataContextType {
  leads: Lead[];
  students: Student[];
  classes: ClassItem[];
  tuition: Tuition[];
  finance: FinanceRecord[];
  staff: Staff[];
  documents: Document[];
  settings: SystemSettings;
  notifications: Notification[]; 
  isAuthenticated: boolean;
  currentUser: UserInfo | null;
  
  discrepancies: Discrepancy[];
  testResults: TestResult[];
  reconcileData: () => Promise<{ success: boolean, count: number }>;
  runSystemDiagnostics: () => Promise<void>;
  
  calculateFinancials: (startDate?: Date, endDate?: Date) => FinancialStats;
  recalculateSchedule: (startDateStr: string, totalSessions: number, daysStr: string, offDays?: string[]) => string;
  generateClassSessions: (cls: ClassItem) => ClassSession[]; 
  
  updateScheduleChain: (classId: string, fromSessionIndex: number, newDateStr: string) => { success: boolean; message: string; affectedCount: number };

  globalDateFilter: DateFilterState;
  setGlobalDateFilter: (filter: DateFilterState) => void;

  addLead: (lead: Omit<Lead, 'id' | 'status' | 'avatar' | 'lastActivity'>) => string; 
  updateLead: (id: string, updates: Partial<Lead>) => void;
  
  login: (phone: string, pass: string) => boolean;
  logout: () => void;
  handleRoleChange: (newRole: UserRole) => void;
  
  isSimulating: boolean;
  originalRole: UserRole | null;
  startSimulation: (role: UserRole) => void;
  stopSimulation: () => void;

  hasPermission: (permission: PermissionKey) => boolean;

  convertLeadToStudent: (leadId: string, classId: string, tuitionFee: number, paymentPlan?: PaymentPlan) => { success: boolean; message: string; studentId?: string };
  enrollStudent: (studentId: string, classId: string) => { success: boolean; message: string };
  removeStudentFromClass: (studentId: string, classId: string) => void;
  recordPayment: (tuitionId: string, amount: number, method: string) => { success: boolean; message: string };
  recordStudentPayment: (studentId: string, amount: number, method: string, note?: string) => { success: boolean; message: string };
  deleteTuition: (tuitionId: string) => void;
  updateTuition: (id: string, updates: Partial<Tuition>) => void;
  addClass: (classData: Omit<ClassItem, 'id' | 'students' | 'progress' | 'status'>, initialStudentIds: string[], initialLeadIds: string[]) => void;
  updateClass: (id: string, updates: Partial<ClassItem>) => void;
  
  addNotification: (title: string, message: string, type: 'debt' | 'schedule' | 'success' | 'info', relatedId?: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;

  cancelClassSession: (classId: string, date: string) => { success: boolean; message: string };
  moveClassSession: (classId: string, oldDateStr: string, newDateStr: string) => { success: boolean; message: string } | undefined;
  
  addStaff: (staffData: Omit<Staff, 'id' | 'status' | 'joinDate' | 'avatar'>) => void;
  addFinanceRecord: (record: Omit<FinanceRecord, 'id' | 'date'> & { date?: string }) => void;
  saveAttendance: (classId: string, date: string, attendanceData: Record<string, AttendanceStatus>) => { success: boolean; message: string };
  updateStudentNote: (studentId: string, note: string) => void;
  
  addDocument: (doc: Omit<Document, 'id' | 'uploadDate' | 'downloads' | 'size' | 'uploadedBy'>) => void;
  deleteDocument: (id: string) => void;

  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<{ success: boolean; message: string }>;
  
  resetSystemData: () => void;

  getStudentBalance: (studentId: string) => number;
  getClassCapacity: (classId: string) => { current: number; max: number; isFull: boolean };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// --- HELPER: PERSISTENT STATE HOOK ---
// This hook prioritizes localStorage (Database simulation) over initial mock data.
// It ensures "Cấu hình an toàn" by never overwriting persisted data on reload.
function usePersistentState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      // Prioritize Database (LocalStorage in this case)
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
}

const generateMockNotifications = (): Notification[] => {
    const now = new Date();
    return [
        {
            id: 'n1',
            title: 'Nhắc nợ',
            message: 'Học viên Đỗ Chi quá hạn đóng tiền 5 ngày.',
            type: 'debt',
            timestamp: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
            isRead: false,
            relatedId: 'INV-HV2023023'
        },
        {
            id: 'n2',
            title: 'Lịch học thay đổi',
            message: 'Lớp Tiếng Đức A1 - K24 đã dời lịch buổi 20/10.',
            type: 'schedule',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
            isRead: false,
            relatedId: 'C001'
        }
    ];
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use persistent state to simulate Database connection. 
  // In a real Hostinger setup, initialValue would be empty arrays [], and a useEffect would fetch from MySQL API.
  const [leads, setLeads] = usePersistentState<Lead[]>('gp_leads', MOCK_LEADS);
  const [students, setStudents] = usePersistentState<Student[]>('gp_students', MOCK_STUDENTS);
  const [classes, setClasses] = usePersistentState<ClassItem[]>('gp_classes', MOCK_CLASSES);
  const [tuition, setTuition] = usePersistentState<Tuition[]>('gp_tuition', MOCK_TUITION);
  const [finance, setFinance] = usePersistentState<FinanceRecord[]>('gp_finance', MOCK_FINANCE);
  
  const [staff, setStaff] = usePersistentState<Staff[]>('gp_staff', MOCK_STAFF);
  const [documents, setDocuments] = usePersistentState<Document[]>('gp_documents', MOCK_DOCUMENTS);
  
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(generateMockNotifications()); 
  
  const [settings, setSettingsState] = useState<SystemSettings>(() => {
      const saved = localStorage.getItem('german_plus_settings');
      if (saved) { try { return JSON.parse(saved); } catch(e){} }
      return {
          systemName: 'German Plus', slogan: 'CRM System', footerInfo: 'Hotline: 1900 1234',
          logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuClT_dGlOSd_p3F8yO5NJwie7UJSv21Yl6qXhW6OY_Bd_9ZDNIXXquMnxfv-39JzmSJ4PwhQ2G7tOpd1CB5g5Vz23jzKM0_KG0TrzWWhQVWBwnTOf4UECYLsRKo3pdG3kSZSmPPvGR1SgmCAwtE1OO63g3XdEy-85bCpBr5DZMYOdvwXZO8IPhQHamrHr4Ech9QK_cOKKKdI4dD705Zn2IA0Oqv4wtbtSz1VDZHVV2xiOhQO56qMoGI8jW07TP3BdhloZOfqk6sk__M',
          timezone: 'GMT+7', dateFormat: 'DD/MM/YYYY', notifications: true, theme: 'light',
          exportFormat: 'excel', autoBackup: true, debugMode: false
      };
  });

  const [globalDateFilter, setGlobalDateFilter] = useState<DateFilterState>(() => {
      const now = new Date();
      return { preset: 'this_year', startDate: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0], endDate: new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0] };
  });

  const [currentUser, setCurrentUser] = useState<UserInfo | null>(() => {
      const storedUser = localStorage.getItem('german_plus_user');
      try {
        return storedUser ? JSON.parse(storedUser) : null;
      } catch (e) { return null; }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => localStorage.getItem('german_plus_auth') === 'true');
  const [originalRole, setOriginalRole] = useState<UserRole | null>(() => {
      const stored = localStorage.getItem('gp_original_role');
      return stored ? (stored as UserRole) : null;
  });

  // Sync Auth State to LocalStorage (Simulating Session Persistence)
  useEffect(() => {
      if (isAuthenticated) localStorage.setItem('german_plus_auth', 'true');
      else localStorage.removeItem('german_plus_auth');
  }, [isAuthenticated]);

  useEffect(() => {
      if (currentUser) localStorage.setItem('german_plus_user', JSON.stringify(currentUser));
      else localStorage.removeItem('german_plus_user');
  }, [currentUser]);

  useEffect(() => {
      if (originalRole) localStorage.setItem('gp_original_role', originalRole);
      else localStorage.removeItem('gp_original_role');
  }, [originalRole]);

  // --- ACTIONS ---

  const calculateFinancials = (startDate?: Date, endDate?: Date) => {
      // Delegate to pure function for stability
      return CORE_CALCULATIONS.calculateFinancials(finance, tuition, startDate, endDate);
  };

  const recalculateSchedule = (startDateStr: string, totalSessions: number, daysStr: string, offDays?: string[]) => {
      // Delegate to pure function
      return CORE_CALCULATIONS.recalculateSchedule(startDateStr, totalSessions, daysStr, offDays);
  };

  const addNotification = (title: string, message: string, type: 'debt' | 'schedule' | 'success' | 'info', relatedId?: string) => {
      const newNotif: Notification = {
          id: `notif-${Date.now()}`,
          title,
          message,
          type,
          timestamp: new Date().toISOString(),
          isRead: false,
          relatedId
      };
      setNotifications(prev => [newNotif, ...prev]);
  };

  const updateClass = (id: string, updates: Partial<ClassItem>) => { setClasses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c)); };
  
  const addFinanceRecord = (record: Omit<FinanceRecord, 'id' | 'date'> & { date?: string }) => { setFinance(prev => [{id: Date.now().toString(), type: 'income', amount: 0, category: '', date: '', description: '', ...record}, ...prev]); };

  const enrollStudent = (studentId: string, classId: string) => {
      const cls = classes.find(c => c.id === classId);
      setStudents(prev => prev.map(s => {
          if (s.id === studentId) {
              return { 
                  ...s, 
                  classId: classId, 
                  currentClass: cls?.name, 
                  status: 'active',
                  scores: [], 
                  attendanceHistory: [], 
                  averageScore: undefined
              };
          }
          return s;
      }));
      setClasses(prev => prev.map(c => c.id === classId ? { ...c, students: c.students + 1 } : c));
      return { success: true, message: `Đã thêm học viên vào lớp ${cls?.name}` };
  };

  const convertLeadToStudent = (leadId: string, classId: string, tuitionFee: number, paymentPlan?: PaymentPlan) => {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return { success: false, message: "Lead not found" };

      const newStudentId = `HV${new Date().getFullYear()}${Math.floor(Math.random()*10000)}`;
      const cls = classes.find(c => c.id === classId);
      
      const newStudent: Student = {
          id: newStudentId,
          leadId: lead.id,
          name: lead.name,
          email: lead.email || '',
          phone: lead.phone || '',
          avatar: lead.avatar,
          status: 'active',
          code: newStudentId,
          dob: '01/01/2000',
          location: 'Hà Nội',
          classId: classId,
          currentClass: cls?.name,
          enrollmentDate: new Date().toISOString().split('T')[0],
          paid: paymentPlan?.deposit || 0,
          balance: tuitionFee - (paymentPlan?.deposit || 0),
          cachedBalance: tuitionFee - (paymentPlan?.deposit || 0),
          attendanceHistory: [], 
          scores: [],
          averageScore: 0
      };

      setStudents(prev => [...prev, newStudent]);
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'closed' } : l));

      const invoiceId = `INV-${newStudentId}-${Date.now()}`;
      const newTuition: Tuition = {
          id: invoiceId,
          studentId: newStudentId,
          totalAmount: tuitionFee,
          paidAmount: paymentPlan?.deposit || 0,
          remainingAmount: tuitionFee - (paymentPlan?.deposit || 0),
          dueDate: paymentPlan?.installments?.[0]?.date || new Date().toISOString().split('T')[0],
          status: (paymentPlan?.deposit || 0) >= tuitionFee ? 'paid' : (paymentPlan?.deposit || 0) > 0 ? 'partial' : 'unpaid',
          description: `Học phí ${cls?.name}`,
          installments: paymentPlan?.installments?.map((inst, idx) => ({
              id: `INST-${idx}`,
              name: `Đợt ${idx+1}`,
              amount: inst.amount,
              date: inst.date
          }))
      };
      setTuition(prev => [...prev, newTuition]);

      if (paymentPlan && paymentPlan.deposit > 0) {
          addFinanceRecord({
              type: 'income',
              amount: paymentPlan.deposit,
              category: 'Tuition',
              description: `Thu tiền cọc/đóng trước - ${newStudent.name}`,
              studentId: newStudentId,
              tuitionId: invoiceId
          });
      }

      setClasses(prev => prev.map(c => c.id === classId ? { ...c, students: c.students + 1 } : c));

      return { success: true, message: "Chuyển đổi thành công!", studentId: newStudentId };
  };

  const addClass = (classData: Omit<ClassItem, 'id' | 'students' | 'progress' | 'status'>, initialStudentIds: string[], initialLeadIds: string[]) => {
      const newId = `C${Date.now()}`;
      const newClass: ClassItem = {
          id: newId,
          ...classData,
          students: 0, 
          progress: 0,
          status: 'upcoming'
      };
      
      setClasses(prev => [newClass, ...prev]);

      initialStudentIds.forEach(sid => enrollStudent(sid, newId));
      initialLeadIds.forEach(lid => convertLeadToStudent(lid, newId, classData.tuitionFee));
  };

  const saveAttendance = (classId: string, date: string, attendanceData: Record<string, AttendanceStatus>) => {
      setStudents(prev => prev.map(student => {
          if (student.classId === classId) {
              const status = attendanceData[student.id];
              if (status) {
                  const existingHistory = student.attendanceHistory || [];
                  const existingIndex = existingHistory.findIndex(r => r.date === date);
                  
                  let newHistory;
                  if (existingIndex >= 0) {
                      newHistory = [...existingHistory];
                      newHistory[existingIndex] = { date, status };
                  } else {
                      newHistory = [...existingHistory, { date, status }];
                  }
                  return { ...student, attendanceHistory: newHistory };
              }
          }
          return student;
      }));
      return { success: true, message: "Đã lưu dữ liệu điểm danh thành công!" };
  };

  const generateClassSessions = (cls: ClassItem): ClassSession[] => {
      if (!cls.startDate) return [];
      const sessions: ClassSession[] = [];
      const [daysPart] = cls.schedule.split('•');
      const revDayMap = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const dayMap: Record<string, number> = { 'CN': 0, 'T2': 1, 'T3': 2, 'T4': 3, 'T5': 4, 'T6': 5, 'T7': 6 };
      const targetDays = daysPart 
        ? daysPart.split('/').map(d => dayMap[d.trim()]).filter(d => d !== undefined) 
        : [];
        
      const offDays = cls.offDays || [];
      const extraSessions = cls.extraSessions || [];
      const today = new Date();
      today.setHours(0,0,0,0);
      const maxSessions = cls.totalSessions || 50; 
      
      let candidates: { date: string; isExtra: boolean; note?: string }[] = [];
      extraSessions.forEach(e => candidates.push({ date: e.date.split('T')[0], isExtra: true, note: e.note }));

      const iterator = new Date(cls.startDate);
      if (isNaN(iterator.getTime())) return [];

      let safetyCounter = 0;
      while (candidates.length < maxSessions && safetyCounter < 1000) {
          const dateStr = iterator.toISOString().split('T')[0];
          const currentDay = iterator.getDay();
          
          if (targetDays.includes(currentDay) && !offDays.includes(dateStr)) {
              if (!candidates.some(c => c.date === dateStr)) {
                  candidates.push({ date: dateStr, isExtra: false });
              }
          }
          iterator.setDate(iterator.getDate() + 1);
          safetyCounter++;
      }
      
      candidates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const finalCandidates = candidates.slice(0, maxSessions);

      const classStudents = students.filter(s => s.classId === cls.id);
      const activeStudentCount = classStudents.length;

      return finalCandidates.map((c, idx) => {
          const d = new Date(c.date);
          const isLocked = d < today; 
          
          const attendeesCount = classStudents.filter(s => 
              s.attendanceHistory?.some(r => r.date === c.date)
          ).length;

          const isFullyFinished = activeStudentCount > 0 && attendeesCount === activeStudentCount;
          const isPartiallyFinished = attendeesCount > 0 && attendeesCount < activeStudentCount;

          let status = 'upcoming';
          if (isFullyFinished) status = 'finished';
          else if (isLocked && isPartiallyFinished) status = 'incomplete'; 
          else if (isLocked && attendeesCount === 0) status = 'missed';    
          
          return {
              id: `${cls.id}-${c.date}-${idx}`,
              classId: cls.id,
              index: idx + 1,
              date: c.date, 
              dayOfWeek: revDayMap[d.getDay()],
              isLocked: isLocked || isFullyFinished, 
              isExtra: c.isExtra,
              note: c.note,
              status: status
          } as any; 
      });
  };

  const updateScheduleChain = (classId: string, fromSessionIndex: number, newDateStr: string) => {
      const cls = classes.find(c => c.id === classId);
      if (!cls || !cls.startDate) return { success: false, message: 'Không tìm thấy lớp học', affectedCount: 0 };
      const [daysPart] = cls.schedule.split('•');
      const dayMap: Record<string, number> = { 'CN': 0, 'T2': 1, 'T3': 2, 'T4': 3, 'T5': 4, 'T6': 5, 'T7': 6 };
      const targetDays = daysPart.split('/').map(d => dayMap[d.trim()]).filter(d => d !== undefined);
      if(targetDays.length === 0) return { success: false, message: 'Lỗi: Không tìm thấy lịch cố định', affectedCount: 0 };
      const currentSessions = generateClassSessions(cls);
      const affectedSession = currentSessions.find(s => s.index === fromSessionIndex);
      if (!affectedSession) return { success: false, message: 'Lỗi: Không tìm thấy buổi học', affectedCount: 0 };
      const newOffDays = [...(cls.offDays || [])];
      const newExtraSessions = [...(cls.extraSessions || [])];
      if (!newOffDays.includes(affectedSession.date)) { newOffDays.push(affectedSession.date); }
      newExtraSessions.push({ date: newDateStr, note: `Dời lịch (Buổi ${affectedSession.index})` });
      
      const estimatedNewEnd = CORE_CALCULATIONS.recalculateSchedule(cls.startDate, cls.totalSessions || 50, daysPart, newOffDays);
      
      updateClass(classId, { offDays: newOffDays, extraSessions: newExtraSessions, endDate: estimatedNewEnd });
      addNotification('Thay đổi lịch học', `Đã dời lịch lớp ${cls.name} buổi ${fromSessionIndex} sang ngày ${new Date(newDateStr).toLocaleDateString('vi-VN')}.`, 'schedule', classId);
      return { success: true, message: `Đã dời lịch thành công. Hệ thống tự động cập nhật lộ trình.`, affectedCount: 1 };
  };

  const cancelClassSession = (classId: string, dateStr: string) => {
      const cls = classes.find(c => c.id === classId);
      if (!cls || !cls.startDate) return { success: false, message: 'Không tìm thấy lớp học' };
      const updatedOffDays = [...(cls.offDays || [])];
      if(!updatedOffDays.includes(dateStr)) { updatedOffDays.push(dateStr); }
      const [daysPart] = cls.schedule.split('•');
      
      const newEndDateStr = CORE_CALCULATIONS.recalculateSchedule(cls.startDate, cls.totalSessions || 50, daysPart, updatedOffDays);
      
      updateClass(classId, { endDate: newEndDateStr, offDays: updatedOffDays });
      addNotification('Lịch học thay đổi', `Lớp ${cls.name} đã BÁO NGHỈ buổi học ngày ${new Date(dateStr).toLocaleDateString('vi-VN')}.`, 'schedule', classId);
      return { success: true, message: `Đã báo nghỉ thành công. Hệ thống tự động tịnh tiến lịch học.` };
  };

  const moveClassSession = (classId: string, oldDateStr: string, newDateStr: string) => {
      const cls = classes.find(c => c.id === classId);
      if (!cls) return { success: false, message: 'Class not found' };
      
      const newOffDays = [...(cls.offDays || [])];
      if (!newOffDays.includes(oldDateStr)) newOffDays.push(oldDateStr);
      
      const newExtraSessions = [...(cls.extraSessions || [])];
      newExtraSessions.push({ date: newDateStr, note: 'Buổi bù / Dời lịch' });
      
      updateClass(classId, { offDays: newOffDays, extraSessions: newExtraSessions });
      addNotification('Lịch học thay đổi', `Lớp ${cls.name} dời buổi ${oldDateStr} sang ${newDateStr}`, 'schedule', classId);
      
      return { success: true, message: 'Đã dời buổi học thành công.' };
  };

  const addLead = (newLeadData: Omit<Lead, 'id' | 'status' | 'avatar' | 'lastActivity'>) => {
    const id = Date.now().toString();
    const newLead: Lead = { id, ...newLeadData, status: 'new', avatar: '?', lastActivity: 'Vừa xong' };
    setLeads(prev => [newLead, ...prev]);
    addNotification('Lead mới', `Khách hàng ${newLead.name} vừa được thêm.`, 'info', id);
    return id;
  };

  const updateLead = (id: string, updates: Partial<Lead>) => { setLeads(prev => prev.map(lead => lead.id === id ? { ...lead, ...updates } : lead)); };
  const removeStudentFromClass = (studentId: string, classId: string) => { setStudents(prev => prev.map(s => s.id === studentId ? { ...s, classId: undefined, currentClass: undefined } : s)); setClasses(prev => prev.map(c => c.id === classId ? { ...c, students: Math.max(0, c.students - 1) } : c)); };
  const recordPayment = (tuitionId: string, amount: number, method: string) => { 
      const t = tuition.find(x => x.id === tuitionId);
      if (!t) return { success: false, message: "Invoice not found" };
      const newPaid = t.paidAmount + amount;
      const newRemaining = Math.max(0, t.totalAmount - newPaid);
      const newStatus = newRemaining === 0 ? 'paid' : 'partial';
      setTuition(prev => prev.map(x => x.id === tuitionId ? { ...x, paidAmount: newPaid, remainingAmount: newRemaining, status: newStatus } : x));
      addFinanceRecord({ type: 'income', amount, category: 'Tuition', description: `Thu phí ${t.description} - ${t.id}`, date: new Date().toISOString().split('T')[0] });
      return { success: true, message: "Paid" }; 
  };
  const recordStudentPayment = (studentId: string, amount: number, method: string, note?: string) => { return { success: true, message: "Paid" }; }; 
  const deleteTuition = (tuitionId: string) => { setTuition(prev => prev.filter(t => t.id !== tuitionId)); };
  const updateTuition = (id: string, updates: Partial<Tuition>) => { setTuition(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t)); };
  
  const addStaff = (staffData: Omit<Staff, 'id' | 'status' | 'joinDate' | 'avatar'>) => { setStaff(prev => [{ id: `NV${Date.now()}`, status: 'active', joinDate: '', avatar: 'NV', ...staffData}, ...prev]); };
  const updateStudentNote = (studentId: string, note: string) => { setStudents(prev => prev.map(s => s.id === studentId ? { ...s, teacherNote: note } : s)); };
  const addDocument = (doc: Omit<Document, 'id' | 'uploadDate' | 'downloads' | 'size' | 'uploadedBy'>) => { setDocuments(prev => [{id: `DOC-${Date.now()}`, uploadDate: '', downloads: 0, size: '', uploadedBy: '', ...doc}, ...prev]); };
  const deleteDocument = (id: string) => { setDocuments(prev => prev.filter(d => d.id !== id)); };
  const updateSettings = async (newSettings: Partial<SystemSettings>) => { const updated = { ...settings, ...newSettings }; setSettingsState(updated); localStorage.setItem('german_plus_settings', JSON.stringify(updated)); return { success: true, message: "Settings updated" }; };
  const markAsRead = (id: string) => { setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n)); };
  const markAllAsRead = () => { setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))); };
  const getStudentBalance = (studentId: string) => 0;
  const getClassCapacity = (classId: string) => ({ current: 0, max: 0, isFull: false });
  
  const login = (phone: string, pass: string) => { 
      if (phone === '0938806341' && pass === '123456') {
          const user: UserInfo = { name: 'Super Admin', phone, role: 'admin', avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCkYGLiTHbhXntle05Va5L5Sz3raJFux7O5sf9UkJt9Zbb_y2OEdJnwR7BpwKSDge0E0cpVz-RPKeixhGplF2fzPr_j431kzx9o-imd0lUTpm6mzz97qoDykVn38_-sqsQRyZaaBU3fgOf9Fhj6bvlGbkwDJI-ROTNHlIA7WsRhYCtjDzCPJc96RJO3daTtw40GivkoLhAnmf7WtiQxGreJpJuCKrfpLBENq8tR9uRdVKmLRHexypzCtt04nMXsbOofKW8s4SLrcWqL" };
          setIsAuthenticated(true); 
          setCurrentUser(user); 
          return true;
      }
      return false;
  };

  const logout = () => { 
      setIsAuthenticated(false); 
      setCurrentUser(null); 
      setOriginalRole(null);
  };

  const handleRoleChange = (newRole: UserRole) => { 
      if (currentUser) { 
          setCurrentUser({ ...currentUser, role: newRole }); 
      } 
  };

  const startSimulation = (role: UserRole) => { 
      if (currentUser) { 
          if (!originalRole) setOriginalRole(currentUser.role); 
          setCurrentUser({ ...currentUser, role }); 
      } 
  };

  const stopSimulation = () => { 
      if (currentUser && originalRole) { 
          setCurrentUser({ ...currentUser, role: originalRole }); 
          setOriginalRole(null); 
      } 
  };

  const hasPermission = (permission: PermissionKey): boolean => { 
      if (!currentUser) return false; 
      const perms = ROLE_PERMISSIONS[currentUser.role]; 
      return perms?.includes(permission) || false; 
  };

  const runSystemDiagnostics = async () => { setTestResults([]); };
  const reconcileData = async () => { return { success: true, count: 0 }; };

  const resetSystemData = () => {
      if (confirm('CẢNH BÁO: Hành động này sẽ xóa toàn bộ dữ liệu bạn đã nhập và đưa hệ thống về trạng thái ban đầu (Mock Data). Bạn có chắc chắn không?')) {
          localStorage.removeItem('gp_leads');
          localStorage.removeItem('gp_students');
          localStorage.removeItem('gp_classes');
          localStorage.removeItem('gp_tuition');
          localStorage.removeItem('gp_finance');
          localStorage.removeItem('gp_staff');
          localStorage.removeItem('gp_documents');
          localStorage.removeItem('draft_cc_form');
          window.location.reload();
      }
  };

  return (
    <DataContext.Provider value={{
      leads, students, classes, tuition, finance, staff, documents, settings, notifications,
      isAuthenticated, currentUser, discrepancies, testResults, reconcileData, runSystemDiagnostics, 
      calculateFinancials, recalculateSchedule, generateClassSessions, updateScheduleChain,
      globalDateFilter, setGlobalDateFilter,
      addLead, updateLead, login, logout, handleRoleChange, isSimulating: !!originalRole, originalRole, startSimulation, stopSimulation, hasPermission,
      convertLeadToStudent, enrollStudent, removeStudentFromClass, recordPayment, recordStudentPayment, deleteTuition, updateTuition, 
      addClass, updateClass, cancelClassSession, moveClassSession, addStaff, addFinanceRecord, saveAttendance, updateStudentNote, addDocument, deleteDocument,
      addNotification, markAsRead, markAllAsRead, updateSettings, getStudentBalance, getClassCapacity, resetSystemData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
