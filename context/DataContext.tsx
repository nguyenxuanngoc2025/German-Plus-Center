
import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import { Lead, Student, ClassItem, Tuition, FinanceRecord, Staff, Document, SystemSettings } from '../types';
import { MOCK_LEADS, MOCK_STUDENTS, MOCK_CLASSES, MOCK_TUITION, MOCK_FINANCE, MOCK_STAFF, MOCK_DOCUMENTS } from '../constants';

export type UserRole = 'admin' | 'manager' | 'sale' | 'teacher' | 'student';

// Define granular permission keys
export type PermissionKey = 
    | 'view_dashboard'
    | 'view_finance'
    | 'edit_settings'
    | 'delete_data'
    | 'view_leads'
    | 'edit_leads'
    | 'view_students'
    | 'edit_students'
    | 'view_classes'
    | 'edit_classes'
    | 'export_data';

// Role Definitions Configuration
const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
    admin: [
        'view_dashboard', 'view_finance', 'edit_settings', 'delete_data', 
        'view_leads', 'edit_leads', 'view_students', 'edit_students', 
        'view_classes', 'edit_classes', 'export_data'
    ],
    manager: [ // Giáo vụ
        'view_dashboard', 
        'view_leads', 'edit_leads', 
        'view_students', 'edit_students', 
        'view_classes', 'edit_classes' 
        // NO Finance, NO Settings, NO Delete, NO Export (strict)
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
  
  // Actions
  addLead: (lead: Omit<Lead, 'id' | 'status' | 'avatar' | 'lastActivity'>) => void;
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
  addStaff: (staffData: Omit<Staff, 'id' | 'status' | 'joinDate' | 'avatar'>) => void;
  addFinanceRecord: (record: Omit<FinanceRecord, 'id' | 'date'>) => void;
  saveAttendance: (classId: string, date: string, attendanceData: Record<string, boolean>) => { success: boolean; message: string };
  
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

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [classes, setClasses] = useState<ClassItem[]>(MOCK_CLASSES);
  const [tuition, setTuition] = useState<Tuition[]>(MOCK_TUITION);
  const [finance, setFinance] = useState<FinanceRecord[]>(MOCK_FINANCE);
  const [staff, setStaff] = useState<Staff[]>(MOCK_STAFF);
  const [documents, setDocuments] = useState<Document[]>(MOCK_DOCUMENTS);
  
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
          autoBackup: true
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
          setOriginalRole(null); // Reset simulation on login
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
      
      // Update Name for Clarity in Demo based on role
      if (newRole === 'admin') updatedUser.name = "Super Admin";
      else if (newRole === 'manager') updatedUser.name = "Trưởng phòng Giáo vụ";
      else if (newRole === 'teacher') updatedUser.name = "Giáo viên Đức Ngữ";
      else if (newRole === 'sale') updatedUser.name = "Chuyên viên Tư vấn";
      else if (newRole === 'student') updatedUser.name = "Nguyễn Văn Học Viên";
      
      setCurrentUser(updatedUser);
      // We don't save simulation state to localStorage to avoid stuck state on refresh
      if (!originalRole) {
          localStorage.setItem('german_plus_user', JSON.stringify(updatedUser));
      }
      
      // Auto redirect for UX based on role restrictions
      if (newRole === 'teacher' || newRole === 'student') {
          window.location.hash = '#/calendar'; 
      } else {
          window.location.hash = '#/';
      }
  }

  // Legacy handler (kept for compatibility, but redirects logic)
  const handleRoleChange = (newRole: UserRole) => {
      updateRoleAndRedirect(newRole);
  };

  // --- SIMULATION LOGIC ---
  const startSimulation = (role: UserRole) => {
      if (!currentUser) return;
      // Save original role if not already simulating
      if (!originalRole) {
          setOriginalRole(currentUser.role);
      }
      updateRoleAndRedirect(role);
  };

  const stopSimulation = () => {
      if (!currentUser || !originalRole) return;
      // Restore original
      const restoredUser = { ...currentUser, role: originalRole, name: 'Super Admin' }; // Reset name to Super Admin default
      setCurrentUser(restoredUser);
      setOriginalRole(null);
      window.location.hash = '#/settings'; // Go back to settings where we started
  };

  // --- CORE PERMISSION LOGIC ---
  const hasPermission = (permission: PermissionKey): boolean => {
      if (!currentUser) return false;
      const userPermissions = ROLE_PERMISSIONS[currentUser.role];
      return userPermissions?.includes(permission) || false;
  };

  const addLead = (newLeadData: Omit<Lead, 'id' | 'status' | 'avatar' | 'lastActivity'>) => {
    const newLead: Lead = {
      id: Date.now().toString(),
      ...newLeadData,
      status: 'new',
      avatar: newLeadData.name.charAt(0).toUpperCase() + (newLeadData.name.split(' ').pop()?.charAt(0).toUpperCase() || ''),
      lastActivity: 'Vừa xong',
    };
    setLeads(prev => [newLead, ...prev]);
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(lead => lead.id === id ? { ...lead, ...updates } : lead));
  };

  const convertLeadToStudent = (leadId: string, classId: string, tuitionFee: number, paymentPlan?: PaymentPlan) => {
    const leadToConvert = leads.find(l => l.id === leadId);
    if (!leadToConvert) return { success: false, message: "Lead not found" };

    const targetClass = classes.find(c => c.id === classId);
    if (targetClass && targetClass.students >= targetClass.maxStudents) {
      return { success: false, message: `Lớp ${targetClass.name} đã đầy!` };
    }

    // 1. Create Student
    const newStudentId = `HV${new Date().getFullYear()}${Math.floor(Math.random() * 10000)}`;
    const newStudent: Student = {
      id: newStudentId,
      leadId: leadId,
      name: leadToConvert.name,
      email: leadToConvert.email || 'update_email@germanplus.vn',
      phone: leadToConvert.phone || '090xxxxxxx',
      avatar: leadToConvert.avatar,
      status: 'active',
      code: `GP-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
      dob: '01/01/2000',
      location: 'Hà Nội',
      classId: classId,
      enrollmentDate: new Date().toISOString().split('T')[0]
    };

    // 2. Create Tuition Record(s) based on Plan
    const newTuitions: Tuition[] = [];
    const invoiceId = `TUI-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    if (!paymentPlan || paymentPlan.method === 'full') {
        // Standard full payment logic
        newTuitions.push({
            id: invoiceId,
            studentId: newStudentId,
            totalAmount: tuitionFee,
            paidAmount: paymentPlan ? paymentPlan.deposit : 0, 
            remainingAmount: paymentPlan ? tuitionFee - paymentPlan.deposit : tuitionFee,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +7 days default
            status: paymentPlan && paymentPlan.deposit >= tuitionFee ? 'paid' : 'unpaid',
            description: 'Học phí trọn gói'
        });
        
        // Record income if "Full Payment" was processed immediately in modal (Deposit = Full)
        if(paymentPlan && paymentPlan.deposit > 0) {
             const newFinance: FinanceRecord = {
                id: `FIN-${Date.now()}`,
                type: 'income',
                amount: paymentPlan.deposit,
                category: 'Tuition',
                date: new Date().toISOString().split('T')[0],
                description: `Thu học phí - ${newStudent.name} (Full)`,
                studentId: newStudentId,
                tuitionId: invoiceId
            };
            setFinance(prev => [newFinance, ...prev]);
        }

    } else {
        // Installment Logic
        // 2.1 Deposit Invoice (Paid)
        if (paymentPlan.deposit > 0) {
            const depositInvoiceId = `TUI-${Date.now()}-DEP`;
            newTuitions.push({
                id: depositInvoiceId,
                studentId: newStudentId,
                totalAmount: paymentPlan.deposit,
                paidAmount: paymentPlan.deposit,
                remainingAmount: 0,
                dueDate: new Date().toISOString().split('T')[0], // Today
                status: 'paid',
                description: 'Đặt cọc / Đợt 1'
            });
            // Record Income for Deposit
            const newFinance: FinanceRecord = {
                id: `FIN-${Date.now()}-DEP`,
                type: 'income',
                amount: paymentPlan.deposit,
                category: 'Tuition',
                date: new Date().toISOString().split('T')[0],
                description: `Thu đặt cọc - ${newStudent.name}`,
                studentId: newStudentId,
                tuitionId: depositInvoiceId
            };
            setFinance(prev => [newFinance, ...prev]);
        }

        // 2.2 Future Installments (Unpaid)
        paymentPlan.installments.forEach((inst, idx) => {
            newTuitions.push({
                id: `TUI-${Date.now()}-INST${idx + 1}`,
                studentId: newStudentId,
                totalAmount: inst.amount,
                paidAmount: 0,
                remainingAmount: inst.amount,
                dueDate: inst.date,
                status: 'unpaid',
                description: `Thanh toán Đợt ${idx + 2}` // Idx 0 is actually installment #2 (after deposit)
            });
        });
    }

    setStudents(prev => [newStudent, ...prev]);
    setTuition(prev => [...newTuitions, ...prev]);
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'closed' as 'closed' } : l)); 

    if (targetClass) {
        setClasses(prev => prev.map(c => c.id === classId ? { ...c, students: c.students + 1 } : c));
    }

    return { success: true, message: `Đã chuyển đổi ${newStudent.name} và tạo ${newTuitions.length} phiếu thu.`, studentId: newStudentId };
  };

  const enrollStudent = (studentId: string, classId: string) => {
    const student = students.find(s => s.id === studentId);
    const targetClass = classes.find(c => c.id === classId);
    if (!student) return { success: false, message: "Invalid Student" };
    if (targetClass && targetClass.students >= targetClass.maxStudents) return { success: false, message: "Lớp học đã đầy sĩ số!" };

    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, classId: classId } : s));
    setClasses(prev => prev.map(c => {
      if (c.id === classId) return { ...c, students: c.students + 1 };
      if (c.id === student?.classId) return { ...c, students: Math.max(0, c.students - 1) };
      return c;
    }));
    return { success: true, message: "Xếp lớp thành công" };
  };

  const removeStudentFromClass = (studentId: string, classId: string) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, classId: undefined } : s));
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, students: Math.max(0, c.students - 1) } : c));
  };

  const recordPayment = (tuitionId: string, amount: number, method: string) => {
    const tuitionRecord = tuition.find(t => t.id === tuitionId);
    if (!tuitionRecord) return { success: false, message: "Hồ sơ học phí không tồn tại" };

    const newPaid = tuitionRecord.paidAmount + amount;
    const newRemaining = tuitionRecord.totalAmount - newPaid;
    let newStatus: Tuition['status'] = 'partial';
    if (newRemaining <= 0) newStatus = 'paid';
    
    setTuition(prev => prev.map(t => t.id === tuitionId ? { ...t, paidAmount: newPaid, remainingAmount: newRemaining, status: newStatus } : t));

    const student = students.find(s => s.id === tuitionRecord.studentId);
    const newFinance: FinanceRecord = {
      id: `FIN-${Date.now()}`,
      type: 'income',
      amount: amount,
      category: 'Tuition',
      date: new Date().toISOString().split('T')[0],
      description: `Thu học phí (${tuitionRecord.description || 'Tiền học'}) - ${student?.name}`,
      studentId: student?.id,
      tuitionId: tuitionId
    };
    setFinance(prev => [newFinance, ...prev]);
    return { success: true, message: "Thanh toán đã được ghi nhận" };
  };

  const recordStudentPayment = (studentId: string, amount: number, method: string, note?: string) => {
      let remainingToAllocate = amount;
      
      const studentInvoices = tuition
          .filter(t => t.studentId === studentId && t.status !== 'paid')
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

      if (studentInvoices.length === 0) {
          return { success: false, message: "Học viên không có khoản nợ nào cần thanh toán." };
      }

      const updatedTuition = [...tuition];
      const newFinanceRecords: FinanceRecord[] = [];

      for (const invoice of studentInvoices) {
          if (remainingToAllocate <= 0) break;

          const owed = invoice.remainingAmount;
          const payAmount = Math.min(owed, remainingToAllocate);

          const invIndex = updatedTuition.findIndex(t => t.id === invoice.id);
          if (invIndex !== -1) {
              updatedTuition[invIndex] = {
                  ...updatedTuition[invIndex],
                  paidAmount: updatedTuition[invIndex].paidAmount + payAmount,
                  remainingAmount: updatedTuition[invIndex].remainingAmount - payAmount,
                  status: (updatedTuition[invIndex].remainingAmount - payAmount) <= 0 ? 'paid' : 'partial'
              };

              newFinanceRecords.push({
                  id: `FIN-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                  type: 'income',
                  amount: payAmount,
                  category: 'Tuition',
                  date: new Date().toISOString().split('T')[0],
                  description: `Thu tiền: ${invoice.description || 'Học phí'} - ${note || method}`,
                  studentId: studentId,
                  tuitionId: invoice.id 
              });

              remainingToAllocate -= payAmount;
          }
      }

      setTuition(updatedTuition);
      setFinance(prev => [...newFinanceRecords, ...prev]);

      return { 
          success: true, 
          message: `Đồng bộ dữ liệu thành công! Đã thu ${amount.toLocaleString()}đ và cập nhật trạng thái hóa đơn.` 
      };
  };

  const deleteTuition = (tuitionId: string) => {
      setTuition(prev => prev.filter(t => t.id !== tuitionId));
  };

  const updateTuition = (id: string, updates: Partial<Tuition>) => {
      setTuition(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addFinanceRecord = (record: Omit<FinanceRecord, 'id' | 'date'>) => {
      const newRecord: FinanceRecord = {
          id: `FIN-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          ...record
      };
      setFinance(prev => [newRecord, ...prev]);
  };

  const saveAttendance = (classId: string, date: string, attendanceData: Record<string, boolean>) => {
      console.log(`[ATTENDANCE SAVED] Class: ${classId}, Date: ${date}`, attendanceData);
      const presentCount = Object.values(attendanceData).filter(Boolean).length;
      return { success: true, message: `Đã lưu điểm danh ngày ${date}. Có mặt: ${presentCount} học viên.` };
  };

  const addClass = (classData: Omit<ClassItem, 'id' | 'students' | 'progress' | 'status'>, initialStudentIds: string[], initialLeadIds: string[]) => {
    const newClassId = `C${Date.now()}`;
    const convertedStudentIds: string[] = [];
    const newStudentsFromLeads: Student[] = [];
    const newTuitionsFromLeads: Tuition[] = [];
    
    initialLeadIds.forEach(leadId => {
        const lead = leads.find(l => l.id === leadId);
        if(lead) {
            const newId = `HV${Date.now()}-${Math.floor(Math.random()*1000)}`;
            convertedStudentIds.push(newId);
            newStudentsFromLeads.push({
                id: newId,
                leadId: leadId,
                name: lead.name,
                email: lead.email || 'pending@update.com',
                phone: lead.phone || '',
                avatar: lead.avatar,
                status: 'active',
                code: `GP-2023-${Math.floor(Math.random() * 10000)}`,
                dob: '01/01/2000',
                location: 'Hà Nội',
                classId: newClassId,
                enrollmentDate: new Date().toISOString().split('T')[0]
            });
            newTuitionsFromLeads.push({
                id: `TUI-${Date.now()}-${newId}`,
                studentId: newId,
                totalAmount: classData.tuitionFee,
                paidAmount: 0,
                remainingAmount: classData.tuitionFee,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'unpaid',
                description: 'Học phí trọn gói'
            });
        }
    });

    setStudents(prev => {
        const updatedExisting = prev.map(s => initialStudentIds.includes(s.id) ? { ...s, classId: newClassId } : s);
        return [...newStudentsFromLeads, ...updatedExisting];
    });
    setTuition(prev => [...newTuitionsFromLeads, ...prev]);
    setLeads(prev => prev.map(l => initialLeadIds.includes(l.id) ? { ...l, status: 'closed' as 'closed' } : l));

    const totalStudents = initialStudentIds.length + convertedStudentIds.length;
    const newClass: ClassItem = {
        id: newClassId,
        ...classData,
        students: totalStudents,
        progress: 0,
        status: 'upcoming'
    };
    setClasses(prev => [newClass, ...prev]);
  };

  const updateClass = (id: string, updates: Partial<ClassItem>) => {
      setClasses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const addStaff = (staffData: Omit<Staff, 'id' | 'status' | 'joinDate' | 'avatar'>) => {
      const newStaff: Staff = {
          id: `NV${Date.now().toString().slice(-4)}`,
          status: 'active',
          joinDate: new Date().toLocaleDateString('vi-VN'),
          avatar: staffData.name.charAt(0).toUpperCase() + (staffData.name.split(' ').pop()?.charAt(0).toUpperCase() || ''),
          ...staffData
      };
      setStaff(prev => [newStaff, ...prev]);
  }

  const addDocument = (doc: Omit<Document, 'id' | 'uploadDate' | 'downloads' | 'size' | 'uploadedBy'>) => {
    const newDoc: Document = {
      id: `DOC-${Date.now()}`,
      uploadDate: new Date().toLocaleDateString('vi-VN'),
      downloads: 0,
      size: `${Math.floor(Math.random() * 20) + 1} MB`,
      uploadedBy: currentUser?.name || 'Admin',
      ...doc
    };
    setDocuments(prev => [newDoc, ...prev]);
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  // --- SETTINGS UPDATE IMPLEMENTATION ---
  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
      return new Promise<{ success: boolean; message: string }>((resolve) => {
          // Simulate network delay
          setTimeout(() => {
              const updatedSettings = { ...settings, ...newSettings };
              setSettingsState(updatedSettings);
              localStorage.setItem('german_plus_settings', JSON.stringify(updatedSettings));
              resolve({ success: true, message: "Settings updated successfully" });
          }, 800); // 800ms delay
      });
  };

  const enrichedStudents = useMemo(() => {
    return students.map(student => {
      const studentTuition = tuition.filter(t => t.studentId === student.id);
      const totalRemaining = studentTuition.reduce((sum, t) => sum + t.remainingAmount, 0);
      const totalPaid = studentTuition.reduce((sum, t) => sum + t.paidAmount, 0);
      const studentClass = classes.find(c => c.id === student.classId);
      return {
        ...student,
        balance: totalRemaining,
        paid: totalPaid,
        currentClass: studentClass ? studentClass.name : ''
      };
    });
  }, [students, tuition, classes]);

  const getStudentBalance = (studentId: string) => {
    const studentTuition = tuition.filter(t => t.studentId === studentId);
    return studentTuition.reduce((sum, t) => sum + t.remainingAmount, 0);
  };

  const getClassCapacity = (classId: string) => {
    const c = classes.find(cls => cls.id === classId);
    if (!c) return { current: 0, max: 0, isFull: true };
    return { current: c.students, max: c.maxStudents, isFull: c.students >= c.maxStudents };
  };

  const value = {
    leads,
    students: enrichedStudents,
    classes,
    tuition,
    finance,
    staff,
    documents,
    settings, // Export Settings
    isAuthenticated,
    currentUser,
    login,
    logout,
    handleRoleChange,
    
    // Simulation
    isSimulating: !!originalRole,
    originalRole,
    startSimulation,
    stopSimulation,

    hasPermission,
    addLead,
    updateLead,
    convertLeadToStudent,
    enrollStudent,
    removeStudentFromClass,
    recordPayment,
    recordStudentPayment,
    deleteTuition,
    updateTuition,
    addClass,
    updateClass,
    addStaff,
    addFinanceRecord,
    saveAttendance,
    addDocument,
    deleteDocument,
    updateSettings, // Export Update Function
    getStudentBalance,
    getClassCapacity
  };

  return (
    <DataContext.Provider value={value}>
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
