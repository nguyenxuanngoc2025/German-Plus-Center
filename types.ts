
export interface Lead {
  id: string;
  name: string;
  source: string;
  status: 'new' | 'consulting' | 'trial' | 'ready' | 'closed' | 'fail'; // Added 'fail'
  failReason?: string; // New field for Marketing Analysis
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

// NEW: Formalized Session Structure
export interface ClassSession {
    id: string; // Unique ID (e.g., classId_date)
    classId: string;
    index: number; // Session Index (1, 2, 3...)
    date: string; // ISO Date YYYY-MM-DD
    dayOfWeek: string; // T2, T3...
    isLocked: boolean; // Cannot be moved (Past or Attended)
    isExtra: boolean; // Is this a makeup session?
    note?: string;
}

export interface ClassItem {
  id: string;
  name: string;
  code: string;
  schedule: string; // e.g. "Thứ 2-4-6"
  status: 'active' | 'upcoming' | 'full' | 'finished' | 'paused'; // Expanded statuses
  mode: 'online' | 'offline';
  level?: string; // New: Specific Level (A1, B1...)
  teacher: string;
  teacherAvatar: string;
  assistant?: string; // NEW: Assistant Teacher Name
  assistantAvatar?: string; // NEW: Assistant Teacher Avatar
  students: number; // Current Enrollment (Ideally redundant if calculated, but kept for list views)
  maxStudents: number; // Max Capacity
  progress: number;
  tuitionFee: number;
  location?: string; // Address for offline
  link?: string; // Meeting link for online
  startDate?: string; // ISO Date YYYY-MM-DD
  endDate?: string;   // ISO Date YYYY-MM-DD
  totalSessions?: number; // NEW: Total number of sessions for the course
  offDays?: string[]; // List of ISO dates where class is cancelled/shifted
  extraSessions?: { date: string; note?: string }[]; // List of rescheduled/extra sessions (ISO DateTime)
}

export type AttendanceStatus = 'present' | 'excused' | 'unexcused';

export interface AttendanceRecord {
    date: string;
    status: AttendanceStatus;
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
  balance?: number; // Calculated on the fly
  cachedBalance?: number; // Stored value (Subject to Reconciliation Check)
  paid?: number;
  currentClass?: string;
  // Progress Tracking
  attendanceHistory?: AttendanceRecord[];
  scores?: { name: string; value: number }[]; // Added: Test scores
  averageScore?: number;
  teacherNote?: string;
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
  role: 'admin' | 'manager' | 'teacher' | 'assistant'; // Added 'assistant'
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
  debugMode: boolean; // NEW: Debug Mode Flag
}

// NEW: Test Result Interface
export interface TestResult {
    id: string;
    module: string;
    name: string;
    status: 'pending' | 'running' | 'pass' | 'fail';
    message: string;
    timestamp: string;
}

// NEW: Notification Interface
export interface Notification {
    id: string;
    title: string; // e.g., "Nhắc nợ", "Thay đổi lịch"
    message: string;
    type: 'debt' | 'schedule' | 'success' | 'info';
    timestamp: string; // ISO string or relative time
    isRead: boolean;
    link?: string; // Optional deep link
    relatedId?: string; // NEW: ID of the related object (Invoice ID, Class ID, Lead ID) for smart navigation
}

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
    | 'export_data'
    | 'view_reports'; // ADDED
