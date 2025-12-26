
import { Lead, ClassItem, FinanceRecord, ChartData, Student, Staff, Tuition, Document, AttendanceRecord } from "./types";

// --- HELPERS FOR GENERATION ---
const FIRST_NAMES = ["An", "Bình", "Chi", "Dũng", "Giang", "Hương", "Khánh", "Lan", "Minh", "Nam", "Phong", "Quân", "Sơn", "Thảo", "Uyên", "Vinh", "Yến", "Tùng", "Hoa", "Linh"];
const LAST_NAMES = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"];

const generateRandomName = () => {
    return `${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]} ${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]}`;
};

// Helper to get a date relative to now (e.g., -5 days, -2 months)
const getRelativeDate = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
};

const generateMockAttendance = (): AttendanceRecord[] => {
    const history: AttendanceRecord[] = [];
    const statuses: ('present' | 'excused' | 'unexcused')[] = ['present', 'present', 'present', 'present', 'excused', 'unexcused'];
    // Generate last 5 sessions
    for (let i = 1; i <= 5; i++) {
        history.push({
            date: getRelativeDate(-i * 2),
            status: statuses[Math.floor(Math.random() * statuses.length)]
        });
    }
    return history;
};

// --- 1. SEED CLASSES (UPDATED NAMING CONVENTION) ---
// Formula: Name: K[Batch] [Mode] [Level] ([Schedule]) e.g., K24 Offline A1 (T246)
// Formula: Code: K[Batch].[Level][ON/OFF] e.g., K24.A1OFF
export const MOCK_CLASSES: ClassItem[] = [
  { id: "C001", name: "K24 Offline A1 (T246)", code: "K24.A1OFF", schedule: "T2 / T4 / T6 • 18:00", status: "active", mode: "offline", level: "A1", teacher: "Cô Muller", teacherAvatar: "", students: 0, maxStudents: 20, progress: 45, tuitionFee: 5000000, location: "P.301 - CS1", startDate: getRelativeDate(-45), endDate: getRelativeDate(45) },
  { id: "C002", name: "K25 Online A2 (T35CN)", code: "K25.A2ON", schedule: "T3 / T5 / CN • 19:30", status: "active", mode: "online", level: "A2", teacher: "Thầy Schmidt", teacherAvatar: "", students: 0, maxStudents: 20, progress: 30, tuitionFee: 6500000, link: "meet.google.com/abc", startDate: getRelativeDate(-30), endDate: getRelativeDate(60) },
  { id: "C003", name: "K26 Offline B1 (T246)", code: "K26.B1OFF", schedule: "T2 / T4 / T6 • 18:00", status: "active", mode: "offline", level: "B1", teacher: "Cô Weber", teacherAvatar: "", students: 0, maxStudents: 15, progress: 80, tuitionFee: 8000000, location: "P.302 - CS1", startDate: getRelativeDate(-80), endDate: getRelativeDate(10) },
  { id: "C004", name: "K27 Online B2 (T7CN)", code: "K27.B2ON", schedule: "T7 / CN • 09:00", status: "upcoming", mode: "online", level: "B2", teacher: "Thầy Klein", teacherAvatar: "", students: 0, maxStudents: 12, progress: 0, tuitionFee: 10000000, link: "meet.google.com/xyz", startDate: getRelativeDate(10), endDate: getRelativeDate(100) }
];

// --- 2. SEED STUDENTS & FINANCIALS (50 ENTRIES) ---
const generatedStudents: Student[] = [];
const generatedTuition: Tuition[] = [];
const generatedFinance: FinanceRecord[] = [];

// Distribution: Paid(20), Debt(15), Partial(10), Fail(5)
for (let i = 0; i < 50; i++) {
    const studentId = `HV${2023000 + i}`;
    const classIdx = i % 4; 
    const targetClass = MOCK_CLASSES[classIdx];
    
    let finProfile = 'paid';
    let status: Student['status'] = 'active';
    
    if (i >= 20 && i < 35) finProfile = 'debt';
    if (i >= 35 && i < 45) finProfile = 'partial';
    if (i >= 45) { finProfile = 'paid'; status = 'suspended'; }

    // Create Student
    const student: Student = {
        id: studentId,
        name: generateRandomName(),
        email: `student${i}@gmail.com`,
        phone: `09${Math.floor(Math.random()*100000000)}`,
        avatar: "", 
        status: status,
        code: `GP23-${i.toString().padStart(3, '0')}`,
        dob: getRelativeDate(-6000 - Math.random() * 2000), // Age 18-24
        location: i % 2 === 0 ? "Hà Nội" : "Online",
        classId: targetClass.id,
        enrollmentDate: getRelativeDate(-Math.floor(Math.random() * 90)), // Last 3 months
        currentClass: targetClass.name,
        attendanceHistory: generateMockAttendance(),
        averageScore: Math.floor(Math.random() * 40) + 60,
        scores: [{ name: 'Test 1', value: Math.floor(Math.random() * 40) + 60 }, { name: 'Test 2', value: Math.floor(Math.random() * 40) + 60 }]
    };
    generatedStudents.push(student);

    // Create Tuition
    const tuitionTotal = targetClass.tuitionFee;
    const invoiceId = `INV-${studentId}`;
    const paymentDate = getRelativeDate(-Math.floor(Math.random() * 30));

    if (finProfile === 'paid') {
        generatedTuition.push({
            id: invoiceId, studentId: studentId, totalAmount: tuitionTotal, paidAmount: tuitionTotal, remainingAmount: 0,
            dueDate: getRelativeDate(15), status: 'paid', description: `Học phí ${targetClass.name}`
        });
        generatedFinance.push({
            id: `FIN-${invoiceId}`, type: 'income', amount: tuitionTotal, category: 'Tuition', date: paymentDate,
            description: `Thu học phí - ${student.name}`, studentId: studentId, tuitionId: invoiceId
        });
        student.paid = tuitionTotal; student.balance = 0; student.cachedBalance = 0;
    } else if (finProfile === 'debt') {
        generatedTuition.push({
            id: invoiceId, studentId: studentId, totalAmount: tuitionTotal, paidAmount: 0, remainingAmount: tuitionTotal,
            dueDate: getRelativeDate(i % 2 === 0 ? -5 : 10), // Mix of overdue and upcoming
            status: i % 2 === 0 ? 'overdue' : 'unpaid', description: `Học phí ${targetClass.name}`
        });
        student.paid = 0; student.balance = tuitionTotal; student.cachedBalance = tuitionTotal;
    } else if (finProfile === 'partial') {
        const paid = 2000000;
        generatedTuition.push({
            id: invoiceId, studentId: studentId, totalAmount: tuitionTotal, paidAmount: paid, remainingAmount: tuitionTotal - paid,
            dueDate: getRelativeDate(20), status: 'partial', description: `Học phí ${targetClass.name}`
        });
        generatedFinance.push({
            id: `FIN-${invoiceId}`, type: 'income', amount: paid, category: 'Tuition', date: paymentDate,
            description: `Thu đặt cọc - ${student.name}`, studentId: studentId, tuitionId: invoiceId
        });
        student.paid = paid; student.balance = tuitionTotal - paid; student.cachedBalance = tuitionTotal - paid;
    }
}

// --- 3. SEED LEADS (50 ENTRIES) ---
const generatedLeads: Lead[] = [];
const sources = ["Facebook", "Website", "Giới thiệu", "Vãng lai", "Tiktok"];
const leadStatuses: Lead['status'][] = ["new", "consulting", "trial", "ready", "closed", "fail"];

for (let i = 0; i < 50; i++) {
    // Weighted Status Distribution
    let status: Lead['status'] = 'new';
    const rand = Math.random();
    if (rand < 0.2) status = 'new';
    else if (rand < 0.4) status = 'consulting';
    else if (rand < 0.5) status = 'trial';
    else if (rand < 0.7) status = 'ready'; // Hot leads
    else if (rand < 0.85) status = 'closed'; // Converted
    else status = 'fail';

    generatedLeads.push({
        id: `L${i + 100}`,
        name: generateRandomName(),
        source: sources[Math.floor(Math.random() * sources.length)],
        status: status,
        avatar: "",
        lastActivity: getRelativeDate(-Math.floor(Math.random() * 30)), // Last 30 days
        targetLevel: (['A1', 'A2', 'B1'] as const)[Math.floor(Math.random() * 3)],
        learningMode: i % 2 === 0 ? 'online' : 'offline',
        phone: `09${Math.floor(Math.random() * 100000000)}`,
        email: `lead${i}@gmail.com`,
        failReason: status === 'fail' ? "Giá cao / Không đủ tài chính" : undefined
    });
}

// --- 4. SEED EXPENSES (20 ENTRIES) ---
const EXPENSE_CATEGORIES = ['Salary', 'Rent', 'Marketing', 'Utilities', 'Repair'];
for (let i = 0; i < 20; i++) {
    const type = EXPENSE_CATEGORIES[Math.floor(Math.random() * EXPENSE_CATEGORIES.length)];
    let amount = 0;
    let desc = '';

    switch(type) {
        case 'Salary': amount = 15000000; desc = 'Lương GV tháng ' + (10 - (i%3)); break;
        case 'Rent': amount = 20000000; desc = 'Thuê văn phòng'; break;
        case 'Marketing': amount = 5000000; desc = 'Facebook Ads Campaign'; break;
        case 'Utilities': amount = 2000000; desc = 'Tiền điện/nước'; break;
        case 'Repair': amount = 1500000; desc = 'Sửa thiết bị'; break;
    }

    generatedFinance.push({
        id: `EXP-${i}`,
        type: 'expense',
        amount: amount,
        category: type,
        date: getRelativeDate(-Math.floor(Math.random() * 60)),
        description: desc
    });
}

// --- EXPORT ---
export const MOCK_STUDENTS = generatedStudents;
export const MOCK_TUITION = generatedTuition;
export const MOCK_FINANCE = generatedFinance;
export const MOCK_LEADS = generatedLeads;

export const MOCK_STAFF: Staff[] = [
  { id: "NV001", name: "Nguyễn Văn An", email: "an.nguyen@germanplus.vn", phone: "0901 234 567", role: "manager", status: "active", avatar: "NV", joinDate: "12/05/2023" },
  { id: "NV002", name: "Trần Thị Bình", email: "binh.tran@germanplus.vn", phone: "0912 345 678", role: "teacher", status: "active", avatar: "TB", joinDate: "20/06/2023" }
];

export const MOCK_DOCUMENTS: Document[] = [
  { id: "DOC-001", name: "Giáo trình Netzwerk A1", type: "pdf", size: "15 MB", uploadDate: "20/10/2023", uploadedBy: "Admin", target: "public", targetName: "Công khai", downloads: 150 }
];

export const CHART_DATA: ChartData[] = [];
