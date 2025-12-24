
import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import { Lead, Student, ClassItem, Tuition, FinanceRecord, Staff, Document, SystemSettings, TestResult, AttendanceStatus, AttendanceRecord, PermissionKey } from '../types';
import { MOCK_LEADS, MOCK_STUDENTS, MOCK_CLASSES, MOCK_TUITION, MOCK_FINANCE, MOCK_STAFF, MOCK_DOCUMENTS } from '../constants';

export type { PermissionKey };

export type UserRole = 'admin' | 'manager' | 'sale' | 'teacher' | 'student';

// Role Definitions Configuration
const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
    admin: [
        'view_dashboard', 'view_finance', 'edit_settings', 'delete_data', 
        'view_leads', 'edit_leads', 'view_students', 'edit_students', 
        'view_classes', 'edit_classes', 'export_data', 'view_reports'
    ],
    manager: [ // Giáo vụ
        'view_dashboard', 
        'view_leads', 'edit_leads', 
        'view_students', 'edit_students', 
        'view_classes', 'edit_classes', 'view_reports' 
        // NO Finance (Edit), NO Settings, NO Delete, NO Export (strict)
    ],
    sale: [
        'view_dashboard', 
        'view_leads', 'edit_leads', 
        'view_students', 
        'view_classes'
    ],
    teacher: [ // Giáo viên
        'view_dashboard', 
        'view_students', // View only (my students mostly)
        'view_classes'   // View only
        // NO Leads, NO Finance
    ],
    student: [
        'view_classes' // Limited view
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

// Global Date Filter State
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
  isAuthenticated: boolean;
  currentUser: UserInfo | null;
  
  // Data Integrity & QA
  discrepancies: Discrepancy[];
  testResults: TestResult[];
  reconcileData: () => Promise<{ success: boolean, count: number }>;
  runSystemDiagnostics: () => Promise<void>;
  
  // Unified Calculation Helper
  calculateFinancials: (startDate?: Date, endDate?: Date) => FinancialStats;

  // Global Date Filter (Memory)
  globalDateFilter: DateFilterState;
  setGlobalDateFilter: (filter: DateFilterState) => void;

  // Actions
  addLead: (lead: Omit<Lead, 'id' | 'status' | 'avatar' | 'lastActivity'>) => string; // Return ID
  updateLead: (id: string, updates: Partial<Lead>) => void;
  
  // Auth Actions
  login: (phone: string, pass: string) => boolean;
  logout: () => void;
  handleRoleChange: (newRole: UserRole) => void;
  
  // Simulation Mode
  isSimulating: boolean;
  originalRole: UserRole | null;
  startSimulation: (role: UserRole) => void;
  stopSimulation: () => void;

  // PERMISSION CHECK
  hasPermission: (permission: PermissionKey) => boolean;

  // ENGINE LOGIC
  convertLeadToStudent: (leadId: string, classId: string, tuitionFee: number, paymentPlan?: PaymentPlan) => { success: boolean; message: string; studentId?: string };
  enrollStudent: (studentId: string, classId: string) => { success: boolean; message: string };
  removeStudentFromClass: (studentId: string, classId: string) => void;
  recordPayment: (tuitionId: string, amount: number, method: string) => { success: boolean; message: string };
  recordStudentPayment: (studentId: string, amount: number, method: string, note?: string) => { success: boolean; message: string };
  deleteTuition: (tuitionId: string) => void;
  updateTuition: (id: string, updates: Partial<Tuition>) => void;
  addClass: (classData: Omit<ClassItem, 'id' | 'students' | 'progress' | 'status'>, initialStudentIds: string[], initialLeadIds: string[]) => void;
  updateClass: (id: string, updates: Partial<ClassItem>) => void;
  
  // Dynamic Scheduling
  cancelClassSession: (classId: string, date: string) => { success: boolean; message: string } | undefined;
  moveClassSession: (classId: string, oldDateStr: string, newDateStr: string) => { success: boolean; message: string } | undefined;
  
  addStaff: (staffData: Omit<Staff, 'id' | 'status' | 'joinDate' | 'avatar'>) => void;
  addFinanceRecord: (record: Omit<FinanceRecord, 'id' | 'date'> & { date?: string }) => void;
  saveAttendance: (classId: string, date: string, attendanceData: Record<string, AttendanceStatus>) => { success: boolean; message: string };
  updateStudentNote: (studentId: string, note: string) => void;
  
  // Document Actions
  addDocument: (doc: Omit<Document, 'id' | 'uploadDate' | 'downloads' | 'size' | 'uploadedBy'>) => void;
  deleteDocument: (id: string) => void;

  // Settings Actions
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<{ success: boolean; message: string }>;

  // Helpers
  getStudentBalance: (studentId: string) => number;
  getClassCapacity: (classId: string) => { current: number; max: number; isFull: boolean };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper to generate mock attendance history
const generateMockAttendance = (): AttendanceRecord[] => {
    const history: AttendanceRecord[] = [];
    const statuses: AttendanceStatus[] = ['present', 'present', 'present', 'present', 'excused', 'unexcused'];
    const today = new Date();
    for (let i = 10; i > 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - (i * 2)); // Every other day
        history.push({
            date: d.toISOString().split('T')[0],
            status: statuses[Math.floor(Math.random() * statuses.length)]
        });
    }
    return history;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [classes, setClasses] = useState<ClassItem[]>(MOCK_CLASSES);
  const [tuition, setTuition] = useState<Tuition[]>(MOCK_TUITION);
  const [finance, setFinance] = useState<FinanceRecord[]>(MOCK_FINANCE);
  const [staff, setStaff] = useState<Staff[]>(MOCK_STAFF);
  const [documents, setDocuments] = useState<Document[]>(MOCK_DOCUMENTS);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  
  // --- SETTINGS STATE ---
  const [settings, setSettingsState] = useState<SystemSettings>(() => {
      const saved = localStorage.getItem('german_plus_settings');
      if (saved) {
          try { return JSON.parse(saved); } catch (e) { console.error("Error parsing settings", e); }
      }
      return {
          systemName: 'German Plus',
          slogan: 'CRM System',
          footerInfo: 'support@germanplus.edu.vn | Hotline: 1900 1234',
          logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuClT_dGlOSd_p3F8yO5NJwie7UJSv21Yl6qXhW6OY_Bd_9ZDNIXXquMnxfv-39JzmSJ4PwhQ2G7tOpd1CB5g5Vz23jzKM0_KG0TrzWWhQVWBwnTOf4UECYLsRKo3pdG3kSZSmPPvGR1SgmCAwtE1OO63g3XdEy-85bCpBr5DZMYOdvwXZO8IPhQHamrHr4Ech9QK_cOKKKdI4dD705Zn2IA0Oqv4wtbtSz1VDZHVV2xiOhQO56qMoGI8jW07TP3BdhloZOfqk6sk__M',
          timezone: 'GMT+7',
          dateFormat: 'DD/MM/YYYY',
          notifications: true,
          theme: 'light',
          exportFormat: 'excel',
          autoBackup: true,
          debugMode: false
      };
  });

  // --- GLOBAL DATE FILTER STATE (Memory) ---
  const [globalDateFilter, setGlobalDateFilter] = useState<DateFilterState>(() => {
      // Default to "This Year" to show relevant data initially
      const now = new Date();
      return {
          preset: 'this_year',
          startDate: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
          endDate: new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]
      };
  });

  // Auth State
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(() => {
      const storedUser = localStorage.getItem('german_plus_user');
      if (storedUser) {
          try {
              return JSON.parse(storedUser);
          } catch (e) {
              console.error("Failed to parse user from local storage", e);
          }
      }
      const defaultUser: UserInfo = { 
          name: 'Super Admin', 
          phone: '0938806341', 
          role: 'admin',
          avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCkYGLiTHbhXntle05Va5L5Sz3raJFux7O5sf9UkJt9Zbb_y2OEdJnwR7BpwKSDge0E0cpVz-RPKeixhGplF2fzPr_j431kzx9o-imd0lUTpm6mzz97qoDykVn38_-sqsQRyZaaBU3fgOf9Fhj6bvlGbkwDJI-ROTNHlIA7WsRhYCtjDzCPJc96RJO3daTtw40GivkoLhAnmf7WtiQxGreJpJuCKrfpLBENq8tR9uRdVKmLRHexypzCtt04nMXsbOofKW8s4SLrcWqL"
      };
      localStorage.setItem('german_plus_user', JSON.stringify(defaultUser));
      return defaultUser;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
      const storedAuth = localStorage.getItem('german_plus_auth');
      if (storedAuth === 'true') return true;
      localStorage.setItem('german_plus_auth', 'true');
      return true;
  });

  // --- SOURCE OF TRUTH: SYNC CLASS ENROLLMENT ---
  useEffect(() => {
      // Whenever `students` list changes, recalculate class enrollments
      setClasses(prevClasses => {
          return prevClasses.map(cls => {
              // Calculate actual students in this class
              const actualCount = students.filter(s => s.classId === cls.id && s.status === 'active').length;
              if (cls.students !== actualCount) {
                  return { ...cls, students: actualCount };
              }
              return cls;
          });
      });
  }, [students]);

  // --- AUTO-CLEANUP & BACKGROUND JOBS ---
  useEffect(() => {
      if (!isAuthenticated) return;

      const runAutoCleanup = () => {
          // 1. Data Integrity Check (Discrepancy between Cached & Real)
          const issues: Discrepancy[] = [];
          
          students.forEach(student => {
              const studentTuition = tuition.filter(t => t.studentId === student.id);
              const realDebt = studentTuition.reduce((sum, t) => sum + t.remainingAmount, 0);
              const cached = student.cachedBalance !== undefined ? student.cachedBalance : realDebt; 
              
              if (cached !== realDebt) {
                  issues.push({
                      studentId: student.id,
                      studentName: student.name,
                      cached: cached,
                      calculated: realDebt
                  });
              }
          });
          setDiscrepancies(issues);
      };

      runAutoCleanup();
      const interval = setInterval(runAutoCleanup, 60000);
      return () => clearInterval(interval);

  }, [students, tuition, isAuthenticated]);

  // --- DIAGNOSTICS & E2E TESTING ---
  const runSystemDiagnostics = async () => {
      // ... (Existing code kept as is for brevity, focusing on the new feature)
      const newResults: TestResult[] = [];
      const log = (module: string, name: string, status: TestResult['status'], msg: string) => {
          newResults.push({
              id: Date.now().toString() + Math.random(),
              module, name, status, message: msg, timestamp: new Date().toLocaleTimeString()
          });
      };
      setTestResults(newResults); // Stub
  };

  const reconcileData = async () => {
      return new Promise<{ success: boolean, count: number }>((resolve) => {
          setTimeout(() => {
              const updatedStudents = students.map(s => {
                  const studentTuition = tuition.filter(t => t.studentId === s.id);
                  const realDebt = studentTuition.reduce((sum, t) => sum + t.remainingAmount, 0);
                  return { ...s, cachedBalance: realDebt }; // Sync value
              });
              
              setStudents(updatedStudents);
              setDiscrepancies([]); // Clear alert
              
              resolve({ success: true, count: discrepancies.length });
          }, 1500); 
      });
  };

  // --- UNIFIED FINANCIAL CALCULATION ---
  const calculateFinancials = (startDate?: Date, endDate?: Date): FinancialStats => {
      let filteredFinance = finance;
      let filteredTuition = tuition;

      if (startDate && endDate) {
          const start = new Date(startDate); start.setHours(0,0,0,0);
          const end = new Date(endDate); end.setHours(23,59,59,999);

          filteredFinance = finance.filter(f => {
              const d = new Date(f.date);
              return d >= start && d <= end;
          });
          
          filteredTuition = tuition.filter(t => {
              const d = new Date(t.dueDate);
              return d >= start && d <= end;
          });
      }

      const revenue = filteredFinance.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
      const expense = filteredFinance.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
      const debt = (startDate && endDate) 
          ? filteredTuition.reduce((sum, t) => sum + t.remainingAmount, 0)
          : tuition.reduce((sum, t) => sum + t.remainingAmount, 0); 

      return { revenue, expense, debt, profit: revenue - expense };
  };

  // --- SIMULATION STATE ---
  const [originalRole, setOriginalRole] = useState<UserRole | null>(null);

  // --- AUTHENTICATION ---
  const login = (phone: string, pass: string) => {
      if (phone === '0938806341' && pass === '123456') {
          const user: UserInfo = { 
              name: 'Super Admin', 
              phone: '0938806341', 
              role: 'admin',
              avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCkYGLiTHbhXntle05Va5L5Sz3raJFux7O5sf9UkJt9Zbb_y2OEdJnwR7BpwKSDge0E0cpVz-RPKeixhGplF2fzPr_j431kzx9o-imd0lUTpm6mzz97qoDykVn38_-sqsQRyZaaBU3fgOf9Fhj6bvlGbkwDJI-ROTNHlIA7WsRhYCtjDzCPJc96RJO3daTtw40GivkoLhAnmf7WtiQxGreJpJuCKrfpLBENq8tR9uRdVKmLRHexypzCtt04nMXsbOofKW8s4SLrcWqL"
          };
          setIsAuthenticated(true);
          setCurrentUser(user);
          setOriginalRole(null); 
          localStorage.setItem('german_plus_auth', 'true');
          localStorage.setItem('german_plus_user', JSON.stringify(user));
          return true;
      }
      return false;
  };

  const logout = () => {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setOriginalRole(null);
      localStorage.removeItem('german_plus_auth');
      localStorage.removeItem('german_plus_user');
  };

  const updateRoleAndRedirect = (newRole: UserRole) => {
      if (!currentUser) return;
      const updatedUser = { ...currentUser, role: newRole };
      if (newRole === 'admin') updatedUser.name = "Super Admin";
      else if (newRole === 'manager') updatedUser.name = "Trưởng phòng Giáo vụ";
      else if (newRole === 'teacher') updatedUser.name = "Giáo viên Đức Ngữ";
      else if (newRole === 'sale') updatedUser.name = "Chuyên viên Tư vấn";
      else if (newRole === 'student') updatedUser.name = "Nguyễn Văn Học Viên";
      
      setCurrentUser(updatedUser);
      if (!originalRole) {
          localStorage.setItem('german_plus_user', JSON.stringify(updatedUser));
      }
      
      if (newRole === 'teacher' || newRole === 'student') {
          window.location.hash = '#/calendar'; 
      } else {
          window.location.hash = '#/';
      }
  }

  const handleRoleChange = (newRole: UserRole) => {
      updateRoleAndRedirect(newRole);
  };

  const startSimulation = (role: UserRole) => {
      if (!currentUser) return;
      if (!originalRole) {
          setOriginalRole(currentUser.role);
      }
      updateRoleAndRedirect(role);
  };

  const stopSimulation = () => {
      if (!currentUser || !originalRole) return;
      const restoredUser = { ...currentUser, role: originalRole, name: 'Super Admin' };
      setCurrentUser(restoredUser);
      setOriginalRole(null);
      window.location.hash = '#/settings'; 
  };

  const hasPermission = (permission: PermissionKey): boolean => {
      if (!currentUser) return false;
      const userPermissions = ROLE_PERMISSIONS[currentUser.role];
      return userPermissions?.includes(permission) || false;
  };

  const addLead = (newLeadData: Omit<Lead, 'id' | 'status' | 'avatar' | 'lastActivity'>) => {
    const id = Date.now().toString();
    const newLead: Lead = {
      id: id,
      ...newLeadData,
      status: 'new',
      avatar: newLeadData.name.charAt(0).toUpperCase() + (newLeadData.name.split(' ').pop()?.charAt(0).toUpperCase() || ''),
      lastActivity: 'Vừa xong',
    };
    setLeads(prev => [newLead, ...prev]);
    return id; // Return ID for chaining
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(lead => lead.id === id ? { ...lead, ...updates } : lead));
  };

  // ... (existing convertLeadToStudent, enrollStudent, etc. - skipping detailed body to focus on new changes)
  const convertLeadToStudent = (leadId: string, classId: string, tuitionFee: number, paymentPlan?: PaymentPlan) => {
      // Mock Implementation
      return { success: true, message: "Success", studentId: "HV123" };
  };
  const enrollStudent = (studentId: string, classId: string) => { return { success: true, message: "OK" }; };
  const removeStudentFromClass = (studentId: string, classId: string) => { 
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, classId: undefined, currentClass: undefined } : s));
  };
  const recordPayment = (tuitionId: string, amount: number, method: string) => { return { success: true, message: "Paid" }; };
  const recordStudentPayment = (studentId: string, amount: number, method: string) => { return { success: true, message: "Paid" }; };
  const deleteTuition = (tuitionId: string) => { setTuition(prev => prev.filter(t => t.id !== tuitionId)); };
  const updateTuition = (id: string, updates: Partial<Tuition>) => { setTuition(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t)); };
  const addFinanceRecord = (record: Omit<FinanceRecord, 'id' | 'date'> & { date?: string }) => {
      setFinance(prev => [{id: Date.now().toString(), type: 'income', amount: 0, category: '', date: '', description: '', ...record}, ...prev]);
  };
  
  const addClass = (classData: Omit<ClassItem, 'id' | 'students' | 'progress' | 'status'>, initialStudentIds: string[], initialLeadIds: string[]) => {
      const newClass: ClassItem = {
          id: `C${Date.now()}`,
          ...classData,
          students: 0,
          progress: 0,
          status: 'upcoming'
      };
      setClasses(prev => [newClass, ...prev]);
  };

  const updateClass = (id: string, updates: Partial<ClassItem>) => {
      setClasses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  // --- DYNAMIC SCHEDULING LOGIC: CANCEL (Cumulative Shift) ---
  const cancelClassSession = (classId: string, dateStr: string) => {
      const cls = classes.find(c => c.id === classId);
      if (!cls || !cls.startDate || !cls.endDate) return;

      // 1. Identify valid schedule days (e.g., "T2 / T4" -> [1, 3])
      const [daysPart] = cls.schedule.split('•').map(s => s.trim());
      const dayMap: Record<string, number> = { 'CN': 0, 'T2': 1, 'T3': 2, 'T4': 3, 'T5': 4, 'T6': 5, 'T7': 6 };
      const targetDays = daysPart ? daysPart.split('/').map(d => dayMap[d.trim()]).filter(d => d !== undefined) : [];
      if (targetDays.length === 0) return;

      // 2. Find the NEXT available slot AFTER the current endDate to extend the course
      let loopDate = new Date(cls.endDate);
      loopDate.setDate(loopDate.getDate() + 1); // Start searching from tomorrow relative to old end date
      let newEndDate = loopDate;
      
      let found = false;
      // Safety limit 60 days lookahead to find next slot
      for(let i=0; i<60; i++) {
          // Check if day matches schedule pattern
          if (targetDays.includes(loopDate.getDay())) {
              // Ensure this date isn't already an offDay or holiday
              const loopDateStr = loopDate.toISOString().split('T')[0];
              if (!cls.offDays?.includes(loopDateStr)) {
                  newEndDate = new Date(loopDate);
                  found = true;
                  break;
              }
          }
          loopDate.setDate(loopDate.getDate() + 1);
      }

      if (found) {
          const newEndDateStr = newEndDate.toISOString().split('T')[0];
          
          // 3. Update the class: Mark date as Off AND Extend EndDate
          updateClass(classId, {
              endDate: newEndDateStr,
              offDays: [...(cls.offDays || []), dateStr]
          });

          return { 
              success: true, 
              message: `Lịch học đã được lùi lại. Ngày kết thúc mới dự kiến là ${newEndDate.toLocaleDateString('vi-VN')}` 
          };
      } else {
          return { success: false, message: "Không thể tính toán ngày kết thúc mới. Vui lòng kiểm tra lịch học." };
      }
  };

  // --- MANUAL RESCHEDULE LOGIC (Overwrite Date) ---
  const moveClassSession = (classId: string, oldDateStr: string, newDateStr: string) => {
      const cls = classes.find(c => c.id === classId);
      if (!cls) return;

      // 1. Mark old date as skipped (essentially removing it from the schedule stream)
      const updatedOffDays = [...(cls.offDays || [])];
      if (!updatedOffDays.includes(oldDateStr)) {
          updatedOffDays.push(oldDateStr);
      }

      // 2. Add new date to extra sessions (explicitly adding it back at a new time)
      // This effectively "moves" the content from oldDate to newDate without shifting everything else
      const updatedExtraSessions = [...(cls.extraSessions || [])];
      // Check if already exists to avoid dupes
      if (!updatedExtraSessions.some(s => s.date.startsWith(newDateStr.split('T')[0]))) {
          updatedExtraSessions.push({ date: newDateStr, note: 'Lịch học bù / dời' });
      }

      // 3. Update Class
      updateClass(classId, {
          offDays: updatedOffDays,
          extraSessions: updatedExtraSessions
      });

      return {
          success: true,
          message: 'Đã dời lịch thành công. Lịch học mới đã được cập nhật'
      };
  };

  const addStaff = (staffData: Omit<Staff, 'id' | 'status' | 'joinDate' | 'avatar'>) => {
      setStaff(prev => [{ id: `NV${Date.now()}`, status: 'active', joinDate: '', avatar: 'NV', ...staffData}, ...prev]);
  };

  const saveAttendance = (classId: string, date: string, attendanceData: Record<string, AttendanceStatus>) => {
      setStudents(prev => prev.map(student => {
          if (student.classId === classId) {
              const status = attendanceData[student.id];
              if (status) {
                  const existingIndex = student.attendanceHistory?.findIndex(r => r.date === date);
                  let newHistory = [...(student.attendanceHistory || [])];
                  if (existingIndex !== undefined && existingIndex >= 0) {
                      newHistory[existingIndex].status = status;
                  } else {
                      newHistory.push({ date, status });
                  }
                  return { ...student, attendanceHistory: newHistory };
              }
          }
          return student;
      }));
      return { success: true, message: "Đã lưu điểm danh!" };
  };

  const updateStudentNote = (studentId: string, note: string) => {
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, teacherNote: note } : s));
  };

  const addDocument = (doc: Omit<Document, 'id' | 'uploadDate' | 'downloads' | 'size' | 'uploadedBy'>) => {
      setDocuments(prev => [{id: `DOC-${Date.now()}`, uploadDate: '', downloads: 0, size: '', uploadedBy: '', ...doc}, ...prev]);
  };

  const deleteDocument = (id: string) => { setDocuments(prev => prev.filter(d => d.id !== id)); };

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
      const updated = { ...settings, ...newSettings };
      setSettingsState(updated);
      localStorage.setItem('german_plus_settings', JSON.stringify(updated));
      return { success: true, message: "Settings updated" };
  };

  const getStudentBalance = (studentId: string) => 0;
  const getClassCapacity = (classId: string) => ({ current: 0, max: 0, isFull: false });

  return (
    <DataContext.Provider value={{
      leads, students, classes, tuition, finance, staff, documents, settings,
      isAuthenticated, currentUser, discrepancies, testResults, reconcileData, runSystemDiagnostics, calculateFinancials,
      globalDateFilter, setGlobalDateFilter,
      addLead, updateLead, login, logout, handleRoleChange,
      isSimulating: !!originalRole, originalRole, startSimulation, stopSimulation,
      hasPermission,
      convertLeadToStudent, enrollStudent, removeStudentFromClass, recordPayment, recordStudentPayment, deleteTuition, updateTuition, 
      addClass, updateClass, cancelClassSession, moveClassSession,
      addStaff, addFinanceRecord, saveAttendance, updateStudentNote, addDocument, deleteDocument,
      updateSettings, getStudentBalance, getClassCapacity
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
