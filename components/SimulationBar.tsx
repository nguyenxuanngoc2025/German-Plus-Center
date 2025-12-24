
import React from 'react';
import { useData } from '../context/DataContext';

const SimulationBar: React.FC = () => {
  const { isSimulating, currentUser, stopSimulation } = useData();

  if (!isSimulating || !currentUser) return null;

  const getRoleLabel = (role: string) => {
      switch(role) {
          case 'admin': return 'Super Admin';
          case 'manager': return 'Quản lý (Giáo vụ)';
          case 'teacher': return 'Giáo viên';
          case 'sale': return 'Tư vấn viên';
          case 'student': return 'Học viên';
          default: return role;
      }
  };

  return (
    <div className="w-full bg-orange-600 text-white px-6 py-2 flex items-center justify-between shadow-md relative z-50 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-white/20 rounded-lg animate-pulse">
            <span className="material-symbols-outlined text-[20px]">visibility</span>
        </div>
        <div>
            <p className="text-xs font-medium uppercase tracking-wide opacity-90">Chế độ Mô phỏng</p>
            <p className="text-sm font-bold flex items-center gap-1">
                Đang xem với tư cách: 
                <span className="bg-white text-orange-700 px-2 rounded text-xs py-0.5 uppercase">{getRoleLabel(currentUser.role)}</span>
            </p>
        </div>
      </div>
      
      <button 
        onClick={stopSimulation}
        className="flex items-center gap-2 px-4 py-1.5 bg-white text-orange-700 rounded-lg text-sm font-bold shadow-sm hover:bg-orange-50 transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">logout</span>
        Thoát mô phỏng
      </button>
    </div>
  );
};

export default SimulationBar;
