
import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';

const SystemDiagnostics: React.FC = () => {
  const { runSystemDiagnostics, testResults, settings, updateSettings } = useData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'logs' | 'audit'>('logs');
  const [isRunning, setIsRunning] = useState(false);

  const handleRunTest = async () => {
      if (isRunning) return;
      setIsRunning(true);
      await runSystemDiagnostics();
      setIsRunning(false);
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'pass': return 'text-green-600 bg-green-50 border-green-200';
          case 'fail': return 'text-red-600 bg-red-50 border-red-200';
          case 'running': return 'text-blue-600 bg-blue-50 border-blue-200';
          default: return 'text-slate-600 bg-slate-50 border-slate-200';
      }
  };

  const getStatusIcon = (status: string) => {
      switch(status) {
          case 'pass': return 'check_circle';
          case 'fail': return 'error';
          case 'running': return 'sync';
          default: return 'pending';
      }
  };

  // Mock UI Component Audit Data
  const uiComponents = [
      { name: 'Modals', status: 'OK', details: 'Centered, responsive width' },
      { name: 'Tables', status: 'OK', details: 'Horizontal scroll on mobile' },
      { name: 'Forms', status: 'OK', details: 'Input validation active' },
      { name: 'Navigation', status: 'OK', details: 'Sidebar collapses correctly' },
      { name: 'Notifications', status: 'WARN', details: 'Toast duration inconsistent' }
  ];

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-background-light dark:bg-background-dark font-display">
      <Header title="System Diagnostics" />
      
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-[1200px] mx-auto space-y-6">
            
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#1a202c] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-600">health_and_safety</span>
                        Kiểm tra Sức khỏe Hệ thống
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Chạy các bài kiểm thử tự động (E2E) và rà soát lỗi giao diện.</p>
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                        <input 
                            type="checkbox" 
                            checked={settings.debugMode} 
                            onChange={(e) => updateSettings({ debugMode: e.target.checked })}
                            className="rounded border-slate-300 text-red-500 focus:ring-red-500"
                        />
                        Chế độ Debug
                    </label>
                    <button 
                        onClick={handleRunTest}
                        disabled={isRunning}
                        className={`px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold shadow-md shadow-primary/20 flex items-center gap-2 transition-all ${isRunning ? 'opacity-75 cursor-wait' : ''}`}
                    >
                        <span className={`material-symbols-outlined ${isRunning ? 'animate-spin' : ''}`}>
                            {isRunning ? 'sync' : 'play_arrow'}
                        </span>
                        {isRunning ? 'Đang chạy test...' : 'Chạy kiểm thử'}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Test Logs */}
                <div className="lg:col-span-2 bg-white dark:bg-[#1a202c] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-[600px]">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="font-bold text-slate-900 dark:text-white">Nhật ký Kiểm thử (Test Log)</h3>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            <button 
                                onClick={() => setActiveTab('logs')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'logs' ? 'bg-white dark:bg-slate-600 shadow-sm text-primary dark:text-white' : 'text-slate-500'}`}
                            >
                                Live Log
                            </button>
                            <button 
                                onClick={() => setActiveTab('audit')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'audit' ? 'bg-white dark:bg-slate-600 shadow-sm text-primary dark:text-white' : 'text-slate-500'}`}
                            >
                                UI Audit
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-[#151b28] font-mono text-sm">
                        {activeTab === 'logs' ? (
                            <div className="flex flex-col gap-2">
                                {testResults.length === 0 && (
                                    <div className="text-center text-slate-400 py-10">Chưa có kết quả. Nhấn "Chạy kiểm thử" để bắt đầu.</div>
                                )}
                                {testResults.map((result) => (
                                    <div key={result.id} className={`flex items-start gap-3 p-3 rounded-lg border ${getStatusColor(result.status)} bg-opacity-10`}>
                                        <span className={`material-symbols-outlined text-[18px] mt-0.5 ${result.status === 'running' ? 'animate-spin' : ''}`}>
                                            {getStatusIcon(result.status)}
                                        </span>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold uppercase text-xs tracking-wider opacity-80">[{result.module}] {result.name}</span>
                                                <span className="text-[10px] opacity-60">{result.timestamp}</span>
                                            </div>
                                            <p className="mt-1 leading-relaxed">{result.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                <p className="text-xs text-slate-500 mb-2 uppercase font-bold">Rà soát thành phần giao diện</p>
                                {uiComponents.map((ui, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-sm text-slate-500">widgets</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">{ui.name}</p>
                                                <p className="text-xs text-slate-500">{ui.details}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${ui.status === 'OK' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {ui.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Status Summary */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white dark:bg-[#1a202c] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4">Trạng thái Module</h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Quản lý Lead', status: 'Hoạt động', color: 'text-green-600' },
                                { label: 'Chốt Học viên (E2E)', status: testResults.find(r => r.module === 'E2E' && r.status === 'fail') ? 'Lỗi Logic' : 'Sẵn sàng', color: testResults.find(r => r.module === 'E2E' && r.status === 'fail') ? 'text-red-600' : 'text-blue-600' },
                                { label: 'Tài chính & Hóa đơn', status: 'Hoạt động', color: 'text-green-600' },
                                { label: 'Phân quyền (RBAC)', status: 'Hoạt động', color: 'text-green-600' },
                                { label: 'Chế độ Mô phỏng', status: 'Beta', color: 'text-orange-500' },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                                    <span className={`text-xs font-bold uppercase ${item.color}`}>{item.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 p-6">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-blue-600 text-[24px]">developer_mode</span>
                            <div>
                                <h4 className="font-bold text-blue-900 dark:text-blue-100">Debug Console</h4>
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
                                    Khi bật chế độ Debug, các lỗi API (mocked) và warning của React sẽ hiển thị trực tiếp trên giao diện để tiện theo dõi.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </main>
    </div>
  );
};

export default SystemDiagnostics;
