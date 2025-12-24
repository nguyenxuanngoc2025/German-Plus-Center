
import React from 'react';
import { useData } from '../context/DataContext';

interface Props {
  invoice: any;
  onClose: () => void;
}

// Helper to read money (Vietnamese)
const readGroup = (group: string) => {
    const readDigit = [" không", " một", " hai", " ba", " bốn", " năm", " sáu", " bảy", " tám", " chín"];
    let temp = "";
    if (group === "000") return "";
    
    // Hundred
    temp += readDigit[parseInt(group[0])] + " trăm";
    
    // Ten
    if (group[1] === "0") {
        if (group[2] === "0") return temp;
        else temp += " linh" + readDigit[parseInt(group[2])];
    } else {
        if (group[1] === "1") temp += " mười";
        else temp += readDigit[parseInt(group[1])] + " mươi";
        
        // Unit
        if (group[2] === "5") temp += " lăm";
        else if (group[2] !== "0") temp += readDigit[parseInt(group[2])];
    }
    return temp;
};

export const readMoney = (num: number) => {
    if (num === 0) return "Không đồng";
    let str = num.toString();
    while (str.length % 3 !== 0) str = "0" + str;
    
    const groups = [];
    for (let i = 0; i < str.length; i += 3) groups.push(str.slice(i, i + 3));
    
    const suffixes = ["", " nghìn", " triệu", " tỷ", " nghìn tỷ", " triệu tỷ"];
    let result = "";
    
    for (let i = 0; i < groups.length; i++) {
        const groupValue = readGroup(groups[i]);
        const suffix = suffixes[groups.length - 1 - i];
        if (groupValue) result += groupValue + suffix;
    }
    
    // Formatting
    result = result.trim();
    result = result.charAt(0).toUpperCase() + result.slice(1);
    // Replace odd combos if necessary, basic cleanup
    result = result.replace(/mươi một/g, "mươi mốt");
    
    return result + " đồng";
};

const InvoicePrintModal: React.FC<Props> = ({ invoice, onClose }) => {
  const { settings } = useData();

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
      // Simulation
      alert("Đang tạo file PDF chất lượng cao... (Tính năng mô phỏng)");
      setTimeout(() => alert("Đã tải xuống: Phieu_thu_" + invoice.id + ".pdf"), 1000);
  };

  const handleShare = () => {
      // Simulation
      const message = `Phiếu thu ${invoice.id} - ${new Intl.NumberFormat('vi-VN').format(invoice.paidAmount)}đ đã được gửi tới Zalo của học viên.`;
      alert(message);
  };

  const today = new Date();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-sm print:p-0 print:bg-white print:static print:block print:inset-0 print:z-[9999] print:h-auto print:w-auto">
        <style>
            {`
                @media print {
                    @page {
                        size: A5 landscape;
                        margin: 0;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #printable-invoice, #printable-invoice * {
                        visibility: visible;
                    }
                    #printable-invoice {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        margin: 0;
                        padding: 20px;
                        box-shadow: none;
                        background: white;
                    }
                    /* Hide scrollbars */
                    ::-webkit-scrollbar {
                        display: none;
                    }
                }
            `}
        </style>
        
        {/* Actions Bar - Hidden on Print */}
        <div className="absolute top-6 right-6 flex gap-3 print:hidden z-50 animate-in fade-in slide-in-from-top-4">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-800 rounded-lg shadow-lg font-bold hover:bg-slate-100 transition-colors border border-slate-200">
                <span className="material-symbols-outlined">print</span> In phiếu
            </button>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-800 rounded-lg shadow-lg font-bold hover:bg-slate-100 transition-colors border border-slate-200">
                <span className="material-symbols-outlined">download</span> PDF
            </button>
            <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-600 rounded-lg shadow-lg font-bold hover:bg-slate-100 transition-colors border border-slate-200">
                <span className="material-symbols-outlined">share</span>
            </button>
            <div className="w-px h-10 bg-white/20 mx-2"></div>
            <button onClick={onClose} className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-lg shadow-lg font-bold hover:bg-slate-700 transition-colors border border-slate-700">
                <span className="material-symbols-outlined">close</span>
            </button>
        </div>

        {/* Invoice Paper A5 Size approx 148mm x 210mm (Landscape A5 or Half A4 logic) */}
        <div id="printable-invoice" className="bg-white w-full max-w-[210mm] min-h-[148mm] shadow-2xl p-8 md:p-12 relative text-slate-900 font-serif overflow-hidden mx-auto print:max-w-none print:shadow-none">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b-2 border-slate-900 pb-6 print:pb-4 print:mb-4">
                <div className="flex gap-5 items-center">
                    {/* Logo Placeholder if no logo */}
                    <div className="size-16 flex items-center justify-center print:size-14">
                        {settings.logo && settings.logo.startsWith('http') ? (
                            <img src={settings.logo} className="w-full h-full object-contain grayscale brightness-50 contrast-125" alt="Logo" />
                        ) : (
                            <span className="material-symbols-outlined text-4xl text-slate-800">school</span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900 print:text-lg">{settings.systemName}</h1>
                        <p className="text-sm italic text-slate-600 print:text-xs">{settings.footerInfo.split('|')[0] || '102 Ngô Quyền, Hà Đông, Hà Nội'}</p>
                        <p className="text-sm font-bold text-slate-800 print:text-xs">Hotline: {settings.footerInfo.split('Hotline: ')[1] || '1900 1234'}</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-extrabold uppercase tracking-[0.1em] text-slate-900 mb-1 print:text-2xl">Phiếu Thu</h2>
                    <div className="flex flex-col items-end text-sm text-slate-600 print:text-xs">
                        <p>Mẫu số: 01-TT</p>
                        <p>Ký hiệu: GP/24</p>
                        <p>Số phiếu: <span className="font-mono font-bold text-slate-900 text-lg print:text-base">{invoice.id.split('-').pop()}</span></p>
                    </div>
                </div>
            </div>

            {/* Body Info */}
            <div className="mb-8 space-y-4 text-base leading-relaxed print:text-sm print:space-y-2 print:mb-4">
                <div className="flex items-baseline">
                    <span className="w-48 font-bold shrink-0 print:w-32">Họ và tên người nộp:</span>
                    <span className="flex-1 border-b border-slate-400 border-dashed px-2 font-medium">{invoice.studentName}</span>
                </div>
                <div className="flex items-baseline">
                    <span className="w-48 font-bold shrink-0 print:w-32">Địa chỉ / Lớp học:</span>
                    <span className="flex-1 border-b border-slate-400 border-dashed px-2">{invoice.className || 'Chưa xếp lớp'}</span>
                </div>
                <div className="flex items-baseline">
                    <span className="w-48 font-bold shrink-0 print:w-32">Lý do nộp:</span>
                    <span className="flex-1 border-b border-slate-400 border-dashed px-2">{invoice.description}</span>
                </div>
                <div className="flex items-baseline">
                    <span className="w-48 font-bold shrink-0 print:w-32">Số tiền:</span>
                    <span className="flex-1 font-bold text-xl px-2 print:text-lg">{new Intl.NumberFormat('vi-VN').format(invoice.paidAmount)} VND</span>
                </div>
                <div className="flex items-baseline">
                    <span className="w-48 font-bold shrink-0 print:w-32">Viết bằng chữ:</span>
                    <span className="flex-1 italic border-b border-slate-400 border-dashed px-2">{readMoney(invoice.paidAmount)}</span>
                </div>
                {invoice.remainingAmount > 0 && (
                    <div className="flex items-baseline mt-2 pt-2">
                        <span className="w-48 font-bold shrink-0 text-slate-500 italic print:w-32">Còn nợ lại:</span>
                        <span className="flex-1 font-bold text-slate-800 border-b border-transparent px-2">{new Intl.NumberFormat('vi-VN').format(invoice.remainingAmount)} VND</span>
                    </div>
                )}
            </div>

            {/* Footer Date & Signatures */}
            <div className="flex justify-end mb-10 print:mb-6">
                <p className="italic text-slate-600 print:text-xs">Hà Nội, ngày {today.getDate()} tháng {today.getMonth() + 1} năm {today.getFullYear()}</p>
            </div>

            <div className="grid grid-cols-2 gap-16 text-center">
                <div>
                    <p className="font-bold uppercase text-sm print:text-xs">Người nộp tiền</p>
                    <p className="text-xs italic text-slate-500">(Ký, họ tên)</p>
                    <div className="h-24 print:h-16"></div>
                    <p className="font-bold text-slate-800">{invoice.studentName}</p>
                </div>
                <div>
                    <p className="font-bold uppercase text-sm print:text-xs">Người thu tiền</p>
                    <p className="text-xs italic text-slate-500">(Ký, họ tên)</p>
                    <div className="h-24 flex items-center justify-center print:h-16">
                        {/* Stamp Placeholder */}
                        <div className="size-20 border-4 border-red-500/30 rounded-full flex items-center justify-center -rotate-12 print:size-16 print:border-2">
                            <span className="text-red-500/30 font-bold uppercase text-xs text-center leading-tight">Đã thu<br/>tiền</span>
                        </div>
                    </div>
                    <p className="font-bold text-slate-800">Phòng Kế toán</p>
                </div>
            </div>

            <div className="text-center text-[10px] italic text-slate-400 mt-12 border-t border-slate-100 pt-4 print:mt-6 print:pt-2">
                (Cần kiểm tra, đối chiếu khi lập, giao, nhận phiếu. Chứng từ này có giá trị lưu hành nội bộ)
            </div>
        </div>
    </div>
  );
};

export default InvoicePrintModal;
