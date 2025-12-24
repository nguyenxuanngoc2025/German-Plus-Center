
import { Lead, ClassItem, FinanceRecord, ChartData, Student, Staff, Tuition, Document } from "./types";

export const MOCK_LEADS: Lead[] = [
  {
    id: "1",
    name: "Linh Pham",
    source: "FB Messenger",
    status: "new",
    avatar: "LP",
    lastActivity: "2 giờ trước",
    tags: ["Cơ bản A1", "Cấp tốc"],
    targetLevel: 'A1',
    learningMode: 'online'
  },
  {
    id: "2",
    name: "Sarah Nguyen",
    source: "Vãng lai",
    status: "new",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-1GZ-a9I76-E382ryU56QJeYqILUl5wXT8vq7L4ojvzo_IVxE5fJruwdrfVDFMtmKs4EnF9Gm13HNOFLf1jodwKP8Q5kkgXTw212ZX9qomqg7Gazu6h_1rkBy1kCfKX8wHpsbxSl2LMbwuDyfis3tr98e5Tq9Jt6w2gW78113F987Bl_UW2M4B3tTr8KHgR_W6tSvwxfzgzFPiyILTdZvso_rSO9wwf-vuUXDPDfANWmn-rAPu22Gc5KpBztu102mCxLbtT1kql0I",
    lastActivity: "1 ngày trước",
    tags: ["Luyện thi B1"],
    targetLevel: 'B1',
    learningMode: 'offline'
  },
  {
    id: "3",
    name: "David Hoang",
    source: "Giới thiệu",
    status: "consulting",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBSg9Ib1jQiSuWr27X4eSbDpAi6jZNvp3Ydfki41dm1Od-SaF4ZXDwDUZvqszU4tZpNkL_g7LfRC4hefiRwlZ68YSea8AS_BIIxIG1oKzHuUwNRHeuwRCcIGiWdpZGP5RKy7hieMivOqyYc2eg_40ewOznmv-Uv-9emMuVD9dI2J_-jAmwCai73SyGhJHg-06fUluK3rQqibCjYsCvRXsPbZnBi-GnLexM5SMUCSCVK-DZB1sSMCuMcZV7PJV_sQSvlz0QWpsqs0C4n",
    lastActivity: "Phụ trách: Tôi",
    contactTime: "10h Sáng mai",
    tags: ["A2"],
    targetLevel: 'A2',
    learningMode: 'offline'
  },
  {
    id: "4",
    name: "Kevin Le",
    source: "Vãng lai",
    status: "trial",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDURDbQX45KuAv_pVrt8WygYZuOD2f0hppeFCTShZuoaMAsfi6SjikIfhpP2_mYtfH6_RZLE3lWl8ODZWBmx2TCVEhedm6Zt31und7WBu7yCufcdMlsdFlFh_zaUisk1EFUbgXCdYGGH8cnYsXOhTqOUtTbopKoURvh_gQ-iG5YFUSebW8Oc0e_zDwJmGh0NQUpu2LL-Re44jm5nY0vjwi9IVVVeAPobBfjG7mApQzunkZhiZ_ebsQNGxbhv2ZATjMvEfGQ2WUKTFsj",
    lastActivity: "Đã xác nhận",
    details: "T6, 24/10 • 14:00 - Lớp A1.1 (Phòng 302)",
    tags: [],
    targetLevel: 'A1',
    learningMode: 'offline'
  },
  {
    id: "5",
    name: "Peter Phan",
    source: "Vãng lai",
    status: "ready",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDJ5Vcny7i20aGke5Y8yQ9XiFrWXhcwN1wLcAHE_RZU2wMo7uvHHVYjkGdlwxZHSEo1MEzWivdD2EdM5fdBEKuzAT0CNY6QSUSgSSHxJqlrUs9o9EJedLnrk53IbcnwjApEdkiMpReQlS68m7KMhFKitXCfTi026vqpl4jio1EtmzQH7WGqbiRMbiGrHR-inmAGz-X4vuDC0jIafXr6KOzWv7WskWF8TNK3EtyO5jcTrT2CKqqr4q336dXEyKwGFakmPNyb7vsolE2f",
    lastActivity: "10 phút trước",
    note: "Đã đạt bài kiểm tra. Muốn tham gia lớp B2 Tiêu chuẩn khai giảng 01/11.",
    tags: [],
    targetLevel: 'B2',
    learningMode: 'online'
  }
];

export const MOCK_CLASSES: ClassItem[] = [
  {
    id: "C001",
    name: "Tiếng Đức A1",
    code: "K24",
    schedule: "T2 / T4 / T6 • 18:00",
    status: "active",
    mode: "offline",
    teacher: "Cô Muller",
    teacherAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD3HDBVzlVNdovtMhAxnajnOIgLF4qiLQAR4DFCnwisHnSf1sHaiAm8RfQY5ZybRmaw8Ku3lU9oBYAZl3hH3lkX2XlEz82UqqpjnJLk2XHZOznYE66omM3NZ6DKqVgIScQXV98pQbv5wHgtyiy-YtpzrKY3d5docbByjLa2og4oPlG1Foyor-hSKatBU9EC_xwITmLRm-icO1DxtHTDGzw3aJrqx984RyIuGkighSJ8yEb1eimTDFJEKSm3ypxDjlHjM_ZqVsL8dZzw",
    students: 12,
    maxStudents: 15,
    progress: 80,
    tuitionFee: 5000000,
    location: "102 Ngô Quyền, Hà Đông, Hà Nội"
  },
  {
    id: "C002",
    name: "Tiếng Đức A2",
    code: "K25",
    schedule: "T3 / T5 • 19:30",
    status: "upcoming",
    mode: "online",
    teacher: "Thầy Schmidt",
    teacherAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCRrvP6zLviuDePpSE95VMNkUzU7F77fYpPEuQDowFGK-e2cC8mdvsvkiJBP_GW34qEfv8YB80G6pf5swHJTDUd2Hc5ejYr8WGxhkjS8JhZd36OZpwNLmNdTONRqCMmZYju0ejEK2DPRaXm59OAqRtUPeET3NFZ2pAytCiiSimS8YWs5V24qqDT3DtkTWVwfOpt3a0xrkIGp0EiDOe5FD6Yt6T0oLDrr5ZN461x7zbCfBhAa1SBchmYCwlTPMYRkr8A8Kez1fHD7Pqp",
    students: 5,
    maxStudents: 15,
    progress: 33,
    tuitionFee: 6500000,
    link: "https://meet.google.com/abc-xyz-123"
  },
  {
    id: "C003",
    name: "Tiếng Đức B1",
    code: "K26",
    schedule: "T2 / T4 / T6 • 18:00",
    status: "full",
    mode: "offline",
    teacher: "Cô Weber",
    teacherAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAVKLT1XiVp7a-AH0a8dSLwLdxkste8v1GfbB7ZDr07Xi7HzdHCoqGMWy9PDH3KdLx0RW_rOi0MmjM0zstWo7tnJ8TsvRAeZqKBCs0BgT7o_qyPViWq76OtK8WRG1mx5e28d1qZHMVGADkLRmE5znvovCI7aZUW1eucKKg-kGGSM8IXib1gCB7U7e65WJEwsPqpDfFbMdw2grKOYNWeYCtZNID4zaS334lhHjv4NUuTdbEBeTE6i8hoI3juktItRE1HA5u9vkqhuZi-",
    students: 15,
    maxStudents: 15,
    progress: 100,
    tuitionFee: 8000000,
    location: "102 Ngô Quyền, Hà Đông, Hà Nội"
  },
  {
    id: "C004",
    name: "Tiếng Đức C1",
    code: "K29",
    schedule: "T2 / T4 / T6 • 18:00",
    status: "active",
    mode: "online",
    teacher: "Thầy Klein",
    teacherAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgBxYCLB4KATVZ5ozjahmfET_eBjwGtfS7_K8WBBIvrGjk7pdJ2IdgdUDJBPIpOQHI9kvy55llr0f1sAXX_NLU4NoCRC61-WaTU8N1eqoRT2MmdZjjcsSZO7smUyNIGGUYwY4_2HrRBnIUaKWwObzJ_gQDNJn-vffG269ytmLnKj4c5-_FO1LwbZ26JQT8hW89jSWItyZXYSc8R4uTlwHZM1lqBOPPd0CkU8BogDrfqaLWMNFpw3lnjIDDiXZz56XbPFZtnwm08Z4Y",
    students: 11,
    maxStudents: 12,
    progress: 91,
    tuitionFee: 10000000,
    link: "https://meet.google.com/def-uvw-456"
  }
];

export const MOCK_STUDENTS: Student[] = [
  {
    id: "HV001",
    name: "Tran Van A",
    email: "vana.tran@gmail.com",
    phone: "0901234567",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAE3NnALxmCdoRyathI9ievKRp9snRXywORak8hsD6xgdJ82Gd02v0RfN_70ckaUOaqUltIgMkexMnXjqVqQUN7mNq3px2yJ2Fz2XymmV7gXqTN48yj9dF1dZg2lkV6JWVHKbUdatVUjQh5v6GCcliq8En7xrmDTspoeyMGDqZq0m6KOysow4qX-JU7JvTbjdn3pb-ns7FCI1xqbW0dMIDRl8YlGm8DzlyxZKAqxEG5kJs281A2u1ipcsQc73aAJQxejIxBIGxuf-Z5",
    status: "active",
    code: "23A1001",
    dob: "15/05/2000",
    location: "Hà Nội",
    classId: "C001",
    enrollmentDate: "2023-01-10"
  },
  {
    id: "HV002",
    name: "Le Thi B",
    email: "b.lethi@outlook.com",
    phone: "0912345678",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDErJZkfDVziMLvkOX0HgUSe3Hrubw172VM1WQvuW99TK68EZaPJViHmfYXxUG5_4b1nsjsd3SCq9bBCl5bRnJmf_UlmAp4Pd5wSiu4VmPE3ao4aF3zC4AONaukK8mQ91eDVDjA_BX-A6nykezCkGyHJ1oy8Axbg4Clu_ILT9jg9-2J5T5WkkoIdNczkCZHBD1sFEyQ4Ikzr0M-Mj0VHrPYSDonECMIH1l68AsHc45LghnmrQAhB2lpO4boRMDRc9S2avTtSvVO-OBu",
    status: "active",
    code: "23B1002",
    dob: "22/11/1999",
    location: "Đà Nẵng",
    classId: "C003",
    enrollmentDate: "2023-02-15"
  }
];

export const MOCK_TUITION: Tuition[] = [
  {
    id: "TUI-001",
    studentId: "HV001",
    totalAmount: 5000000,
    paidAmount: 5000000,
    remainingAmount: 0,
    dueDate: "2023-01-20",
    status: "paid"
  },
  {
    id: "TUI-002",
    studentId: "HV002",
    totalAmount: 8000000,
    paidAmount: 4000000,
    remainingAmount: 4000000,
    dueDate: "2023-02-25",
    status: "partial"
  }
];

export const MOCK_FINANCE: FinanceRecord[] = [
  {
    id: "FIN-001",
    type: "income",
    amount: 5000000,
    category: "Tuition",
    date: "2023-01-15",
    description: "Học phí A1 - Tran Van A",
    studentId: "HV001"
  },
  {
    id: "FIN-002",
    type: "income",
    amount: 4000000,
    category: "Tuition",
    date: "2023-02-15",
    description: "Học phí B1 (Đợt 1) - Le Thi B",
    studentId: "HV002"
  },
  {
    id: "FIN-003",
    type: "expense",
    amount: 2000000,
    category: "Marketing",
    date: "2023-03-01",
    description: "Facebook Ads Tháng 3",
  }
];

export const MOCK_STAFF: Staff[] = [
  {
    id: "NV001",
    name: "Nguyễn Văn An",
    email: "an.nguyen@germanplus.vn",
    phone: "0901 234 567",
    role: "manager",
    status: "active",
    avatar: "NV",
    joinDate: "12/05/2023"
  },
  {
    id: "NV002",
    name: "Trần Thị Bình",
    email: "binh.tran@germanplus.vn",
    phone: "0912 345 678",
    role: "teacher",
    status: "active",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAh-TV9c7B-DGtvr76Ot_muufUJyHeNrMvapmaIDT0OVZ1rxEL7U5J8CVaRhwtUSiLOgURgJaMrWwwgk2xx02pjJCWgREruzW2TtgMUep-16VsT6wLf7GSd_JrUO5r3HThtVs4tNM0EIN8vDfgI7beUDziOE7R9SG2dM1zZiVF7CEIMqYuZbnGGjiWgMRWDLjdMf2ijqdjvQRqTc-6oQ-Qbzls9taV7lshgvweuqEDwymU6xYUyXvUGCh4JwhobhKquH3dypKkT0Kmr",
    joinDate: "20/06/2023"
  }
];

export const MOCK_DOCUMENTS: Document[] = [
  {
    id: "DOC-001",
    name: "Giáo trình Netzwerk Neu A1.1",
    type: "pdf",
    size: "15.4 MB",
    uploadDate: "20/10/2023",
    uploadedBy: "Nguyễn Văn A",
    target: "C001",
    targetName: "Lớp A1-05",
    downloads: 120
  },
  {
    id: "DOC-002",
    name: "Đề kiểm tra giữa khóa B1 (Mã 02)",
    type: "docx",
    size: "2.1 MB",
    uploadDate: "18/10/2023",
    uploadedBy: "Hoàng Thu H.",
    target: "teachers",
    targetName: "Giáo viên",
    downloads: 15
  },
  {
    id: "DOC-003",
    name: "File nghe bài 5 - Du lịch",
    type: "audio",
    size: "45.2 MB",
    uploadDate: "15/10/2023",
    uploadedBy: "Admin",
    target: "public",
    targetName: "Công khai",
    downloads: 3200
  },
  {
    id: "DOC-004",
    name: "Danh sách điểm danh Tháng 10",
    type: "xlsx",
    size: "24 KB",
    uploadDate: "12/10/2023",
    uploadedBy: "Lê Văn C.",
    target: "C003",
    targetName: "Lớp B2-01",
    downloads: 5
  }
];

export const CHART_DATA: ChartData[] = [
  { name: 'T1', revenue: 40, profit: 24 },
  { name: 'T2', revenue: 30, profit: 13 },
  { name: 'T3', revenue: 20, profit: 58 },
  { name: 'T4', revenue: 27, profit: 39 },
  { name: 'T5', revenue: 18, profit: 48 },
  { name: 'T6', revenue: 23, profit: 38 },
];
