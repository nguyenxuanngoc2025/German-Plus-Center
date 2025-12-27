
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Lead, Student, ClassItem, Tuition, FinanceRecord, Staff, Document, SystemSettings, TestResult, AttendanceStatus, PermissionKey, Notification, ClassSession } from '../types';
import { MOCK_LEADS, MOCK_STUDENTS, MOCK_CLASSES, MOCK_TUITION, MOCK_FINANCE, MOCK_STAFF, MOCK_DOCUMENTS } from '../constants';

export type { PermissionKey };
export type UserRole = 'admin' | 'manager' | 'sale' | 'teacher' | 'assistant' | 'student';

// --- CORE LOGIC ---
const CORE_CALCULATIONS = {
    calculateFinancials: (financeRecords: FinanceRecord[], tuitionRecords: Tuition[], startDate?: Date, endDate?: Date) => {
        let filteredFinance = financeRecords;
        if (startDate && endDate) {
            const start = new Date(startDate); start.setHours(0,0,0,0);
            const end = new Date(endDate); end.setHours(23,59,59,999);
            filteredFinance = financeRecords.filter(f => {
                const d = new Date(f.date);
                return d >= start && d <= end;
            });
        }
        const revenue = filteredFinance.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
        const expense = filteredFinance.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
        const debt = tuitionRecords.reduce((sum, t) => sum + t.remainingAmount, 0); 
        return { revenue, expense, debt, profit: revenue - expense };
    },

    recalculateSchedule: (startDateStr: string, totalSessions: number, daysStr: string, offDays: string[] = []): string => {
        if (!startDateStr || totalSessions <= 0) return '';
        const start = new Date(startDateStr);
        if (isNaN(start.getTime())) return '';
        if (!daysStr || typeof daysStr !== 'string' || daysStr.trim() === '') return startDateStr;
        
        try {
            const dayMap: Record<string, number> = { 'CN': 0, 'T2': 1, 'T3': 2, 'T4': 3, 'T5': 4, 'T6': 5, 'T7': 6 };
            const targetDays = daysStr.split('/')
                .map(d => d.trim())
                .map(d => dayMap.hasOwnProperty(d) ? dayMap[d] : -1)
                .filter(d => d !== -1);
            
            if (targetDays.length === 0) return startDateStr;

            let sessionsFound = 0;
            let iterator = new Date(start);
            let lastDate = new Date(start);
            let safetyCounter = 0;
            const MAX_LOOPS = 500;

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

interface UserInfo { name: string; phone: string; role: UserRole; avatar?: string; }
interface PaymentPlan { method: 'full' | 'installment'; deposit: number; installments: { date: string; amount: number }[]; }
interface Discrepancy { studentId: string; studentName: string; cached: number; calculated: number; }
interface DateFilterState { preset: string; startDate: string; endDate: string; }

// Context Interface
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
  calculateFinancials: (startDate?: Date, endDate?: Date) => any;
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

// Helper for local state
function usePersistentState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(state)); } catch (e) {}
  }, [key, state]);
  return [state, setState];
}

const generateMockNotifications = (): Notification[] => {
    return [
        { id: 'n1', title: 'Hệ thống', message: 'Chào mừng bạn đến với German Plus CRM.', type: 'info', timestamp: new Date().toISOString(), isRead: false }
    ];
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
  const [settings, setSettingsState] = useState<SystemSettings>({
      systemName: 'German Plus', slogan: 'CRM System', footerInfo: 'Hotline: 1900 1234',
      logo: '', timezone: 'GMT+7', dateFormat: 'DD/MM/YYYY', notifications: true, theme: 'light',
      exportFormat: 'excel', autoBackup: true, debugMode: false
  });
  const [globalDateFilter, setGlobalDateFilter] = useState<DateFilterState>({ 
      preset: 'this_year', startDate: new Date().toISOString(), endDate: new Date().toISOString() 
  });
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [originalRole, setOriginalRole] = useState<UserRole | null>(null);

  // --- HYBRID DATA LOADER ---
  useEffect(() => {
      const fetchData = async () => {
          try {
              const response = await fetch('/api/init');
              if (response.ok) {
                  const data = await response.json();
                  if (data.leads) setLeads(data.leads);
                  if (data.students) setStudents(data.students);
                  if (data.classes) setClasses(data.classes);
                  if (data.finance) setFinance(data.finance);
                  if (data.staff) setStaff(data.staff);
              }
          } catch (error) {
              console.warn("Using LocalStorage/Mock data.");
          }
      };
      fetchData();
  }, []);

  const calculateFinancials = (startDate?: Date, endDate?: Date) => CORE_CALCULATIONS.calculateFinancials(finance, tuition, startDate, endDate);
  const recalculateSchedule = CORE_CALCULATIONS.recalculateSchedule;
  const generateClassSessions = (cls: ClassItem) => {
      if (!cls.startDate) return [];
      const [daysPart] = cls.schedule.split('•');
      const dayMap: Record<string, number> = { 'CN': 0, 'T2': 1, 'T3': 2, 'T4': 3, 'T5': 4, 'T6': 5, 'T7': 6 };
      const targetDays = daysPart ? daysPart.split('/').map(d => dayMap[d.trim()]).filter(d => d !== undefined) : [];
      const offDays = cls.offDays || [];
      const extraSessions = cls.extraSessions || [];
      const maxSessions = cls.totalSessions || 24;
      
      let candidates: { date: string; isExtra: boolean; note?: string }[] = [];
      extraSessions.forEach(e => candidates.push({ date: e.date.split('T')[0], isExtra: true, note: e.note }));

      const iterator = new Date(cls.startDate);
      let safety = 0;
      while (candidates.length < maxSessions && safety < 500) {
          const dateStr = iterator.toISOString().split('T')[0];
          if (targetDays.includes(iterator.getDay()) && !offDays.includes(dateStr)) {
              if (!candidates.some(c => c.date === dateStr)) candidates.push({ date: dateStr, isExtra: false });
          }
          iterator.setDate(iterator.getDate() + 1);
          safety++;
      }
      return candidates.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((c, idx) => ({
          id: `${cls.id}-${c.date}-${idx}`, classId: cls.id, index: idx + 1, date: c.date, 
          dayOfWeek: '', isLocked: false, isExtra: c.isExtra, note: c.note, status: 'upcoming'
      } as ClassSession));
  };

  const addLead = (l: any) => { 
      const id = Date.now().toString(); 
      setLeads(p => [{...l, id, status: 'new', avatar: '?', lastActivity: 'Now'}, ...p]); 
      return id; 
  };
  const updateLead = (id: string, u: any) => setLeads(p => p.map(l => l.id === id ? {...l, ...u} : l));
  const login = (p: string, pw: string) => { if (p && pw) { setIsAuthenticated(true); setCurrentUser({name: 'Admin', phone: p, role: 'admin'}); return true; } return false; };
  const logout = () => { setIsAuthenticated(false); };
  
  const handleRoleChange = () => {};
  const startSimulation = () => {};
  const stopSimulation = () => {};
  const hasPermission = () => true;
  const convertLeadToStudent = () => ({ success: true, message: "OK" });
  const enrollStudent = () => ({ success: true, message: "OK" });
  const removeStudentFromClass = () => {};
  const recordPayment = () => ({ success: true, message: "OK" });
  const recordStudentPayment = () => ({ success: true, message: "OK" });
  const deleteTuition = () => {};
  const updateTuition = () => {};
  const addClass = (data: any) => setClasses(p => [{...data, id: Date.now().toString()}, ...p]);
  const updateClass = (id: string, u: any) => setClasses(p => p.map(c => c.id === id ? {...c, ...u} : c));
  const markAsRead = () => {};
  const markAllAsRead = () => {};
  const cancelClassSession = () => ({ success: true, message: "OK" });
  const moveClassSession = () => ({ success: true, message: "OK" });
  const updateScheduleChain = () => ({ success: true, message: "OK", affectedCount: 0 });
  const addStaff = () => {};
  const addFinanceRecord = () => {};
  const saveAttendance = () => ({ success: true, message: "OK" });
  const updateStudentNote = () => {};
  const addDocument = () => {};
  const deleteDocument = () => {};
  const updateSettings = async (s: any) => { setSettingsState({...settings, ...s}); return { success: true, message: "OK" }; };
  const resetSystemData = () => {};
  const getStudentBalance = () => 0;
  const getClassCapacity = () => ({ current: 0, max: 0, isFull: false });
  const reconcileData = async () => ({ success: true, count: 0 });
  const runSystemDiagnostics = async () => {};

  const addNotification = (title: string, message: string, type: 'debt' | 'schedule' | 'success' | 'info', relatedId?: string) => {
      setNotifications(prev => [{
          id: Date.now().toString(),
          title,
          message,
          type,
          timestamp: new Date().toISOString(),
          isRead: false,
          relatedId
      }, ...prev]);
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
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};
