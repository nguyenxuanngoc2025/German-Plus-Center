
export interface Lead {
  id: string;
  name: string;
  source: string;
  status: 'new' | 'consulting' | 'trial' | 'ready' | 'closed'; // Added 'closed'
  avatar: string;
  lastActivity: string;
  tags?: string[];
  note?: string;
  details?: string;
  contactTime?: string;
  email?: string;
  phone?: string;
  targetLevel?: 'A1' | 'A2' | 'B1' | 'B2';
  learningMode?: 'online' | 'offline'; // New field: Learning Mode Preference
}

export interface ClassItem {
  id: string;
  name: string;
  code: string;
  schedule: string; // e.g. "Thứ 2-4-6"
  status: 'active' | 'upcoming' | 'full';
  mode: 'online' | 'offline';
  teacher: string;
  teacherAvatar: string;
  students: number; // Current Enrollment
  maxStudents: number; // Max Capacity
  progress: number;
  tuitionFee: number;
  location?: string; // Address for offline
  link?: string; // Meeting link for online
}

export interface Student {
  id: string; // GP-YYYY-XXXX
  leadId?: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  status: 'active' | 'inactive' | 'suspended';
  code: string; // Student Code
  dob: string;
  location: string;
  classId?: string; // Linked Class
  enrollmentDate?: string;
  // Enriched fields
  balance?: number;
  paid?: number;
  currentClass?: string;
}

export interface InstallmentItem {
  id: string;
  name: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Tuition {
  id: string;
  studentId: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: 'paid' | 'partial' | 'unpaid' | 'overdue';
  description?: string; // Added: e.g., "Đặt cọc", "Đợt 1", "Thanh toán full"
  installments?: InstallmentItem[]; // Planned installments
}

export interface FinanceRecord {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string; // Tuitions, Salary, Marketing, Operation
  date: string;
  description: string;
  studentId?: string; // Optional link to student if income
  tuitionId?: string; // Link to specific invoice
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'teacher';
  status: 'active' | 'locked';
  avatar: string;
  joinDate: string;
}

export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'xlsx' | 'audio' | 'video' | 'other';
  size: string;
  uploadDate: string;
  uploadedBy: string;
  target: string; // 'public' | 'teachers' | ClassID
  targetName: string; // Display name for target
  downloads: number;
}

export interface Transaction {
    // Legacy type for view compatibility, mapped from FinanceRecord
    id: string;
    studentName: string;
    avatar: string;
    avatarColor: string;
    course: string;
    date: string;
    amount: string;
    status: 'paid' | 'pending' | 'overdue';
}

export interface ChartData {
  name: string;
  revenue: number;
  profit: number;
}

export interface SystemSettings {
  systemName: string;
  slogan: string;
  footerInfo: string;
  logo: string;
  timezone: string;
  dateFormat: string;
  notifications: boolean;
  theme: 'light' | 'dark';
  exportFormat: string;
  autoBackup: boolean;
}
