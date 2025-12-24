
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useData, UserRole } from '../context/DataContext';
import Avatar from './Avatar';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, currentUser, settings } = useData(); 
  
  // State for Accordion
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  
  // State for Sidebar Collapse
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Define the Menu Structure (Strict Role-Based)
  const menuStructure = [
      {
          id: 'dashboard',
          title: 'QUẢN TRỊ', 
          icon: 'space_dashboard', 
          path: '/',
          roles: ['admin', 'manager', 'sale', 'teacher', 'student']
      },
      {
          id: 'crm',
          title: 'KHÁCH HÀNG', 
          icon: 'groups',
          roles: ['admin', 'manager', 'sale'], 
          children: [
              { id: 'leads', title: 'Leads', path: '/leads', icon: 'campaign', roles: ['admin', 'manager', 'sale'] },
              { id: 'students', title: 'Học viên', path: '/students', icon: 'school', roles: ['admin', 'manager', 'sale'] }
          ]
      },
      {
          id: 'training',
          title: 'ĐÀO TẠO',
          icon: 'school',
          roles: ['admin', 'manager', 'sale', 'teacher', 'student'],
          children: [
              { 
                  id: 'calendar', 
                  title: 'Lịch học & Đào tạo', 
                  path: '/calendar', 
                  icon: 'calendar_month', 
                  roles: ['admin', 'manager', 'teacher', 'student'] 
              },
              { 
                  id: 'classes', 
                  title: 'Danh sách Lớp học', 
                  path: '/classes', 
                  icon: 'class', 
                  roles: ['admin', 'manager', 'sale', 'teacher', 'student'] 
              },
              { 
                  id: 'staff', 
                  title: 'Quản lý Giáo viên', 
                  path: '/staff', 
                  icon: 'supervisor_account', 
                  roles: ['admin', 'manager'] 
              },
              { 
                  id: 'materials', 
                  title: 'Kho Tài liệu', 
                  path: '/documents', 
                  icon: 'folder_open', 
                  roles: ['admin', 'manager', 'teacher', 'student'] 
              },
              { 
                  id: 'profile', 
                  title: 'Hồ sơ cá nhân', 
                  path: '/profile', 
                  icon: 'person', 
                  roles: ['student'] 
              }
          ]
      },
      {
          id: 'finance',
          title: 'TÀI CHÍNH',
          icon: 'account_balance_wallet',
          roles: ['admin'], 
          children: [
              { id: 'overview', title: 'Tổng quan', path: '/finance', icon: 'analytics' },
              { id: 'debt', title: 'Quản lý Công nợ', path: '/finance/debt', icon: 'pending_actions' },
              { id: 'invoices', title: 'Phiếu thu', path: '/finance/invoices', icon: 'receipt_long' },
              { id: 'expenses', title: 'Chi phí', path: '/finance/expenses', icon: 'account_balance' }
          ]
      },
      {
          id: 'settings',
          title: 'HỆ THỐNG',
          icon: 'settings',
          roles: ['admin'], 
          children: [
              { id: 'system', title: 'Cài đặt', path: '/settings', icon: 'tune', roles: ['admin'] }
          ]
      }
  ];

  // Helper to check permissions
  const hasAccess = (itemRoles?: string[]) => {
      if (!itemRoles || itemRoles.length === 0) return true;
      return itemRoles.includes(currentUser?.role || '');
  };

  // Auto-expand menu based on current path
  useEffect(() => {
      menuStructure.forEach(group => {
          if (group.children) {
              const activeChild = group.children.find(child => 
                  child.path && (location.pathname === child.path || (child.path !== '/' && location.pathname.startsWith(child.path)))
              );
              if (activeChild) {
                  setExpandedGroup(group.id);
              }
          } else if (group.path === location.pathname) {
              setExpandedGroup(group.id);
          }
      });
  }, [location.pathname]);

  const handleGroupClick = (group: any) => {
      if (isCollapsed) {
          setIsCollapsed(false); 
          setExpandedGroup(group.id);
          return;
      }

      if (group.children) {
          setExpandedGroup(expandedGroup === group.id ? null : group.id);
      } else if (group.path) {
          setExpandedGroup(group.id);
          navigate(group.path);
      }
  };

  return (
    <aside 
        className={`${isCollapsed ? 'w-20' : 'w-72'} bg-surface text-slate-700 flex flex-col shrink-0 transition-all duration-300 ease-in-out border-r border-slate-200 relative z-20 hidden md:flex dark:bg-[#0f172a] dark:text-white dark:border-slate-800 shadow-subtle`}
    >
      
      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 z-50 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-secondary dark:hover:text-white shadow-sm transition-colors"
      >
        <span className="material-symbols-outlined text-base">{isCollapsed ? 'chevron_right' : 'chevron_left'}</span>
      </button>

      {/* Brand */}
      <div className={`h-18 flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-5 gap-3'} border-b border-slate-100 dark:border-white/10 shrink-0 transition-all duration-300 overflow-hidden`}>
        {settings.logo && settings.logo.startsWith('http') ? (
             <div className="size-10 rounded-lg overflow-hidden shrink-0 shadow-lg shadow-orange-500/10">
                 <img src={settings.logo} alt="Logo" className="w-full h-full object-cover" />
             </div>
        ) : (
            <div className="bg-secondary rounded-lg size-10 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20 text-lg shrink-0">
                {settings.systemName.charAt(0)}
            </div>
        )}
        <div className={`flex flex-col transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
            <h1 className="text-lg font-extrabold leading-none tracking-tight text-primary dark:text-white whitespace-nowrap">{settings.systemName}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium tracking-wide uppercase whitespace-nowrap">{settings.slogan}</p>
        </div>
      </div>
      
      {/* Scrollable Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1.5 custom-scrollbar px-3">
        {menuStructure.map(group => {
            if (!hasAccess(group.roles)) return null;

            const isExpanded = expandedGroup === group.id;
            const isActiveSingle = !group.children && group.path === location.pathname;

            return (
                <div key={group.id} className="flex flex-col">
                    {/* Main Group Item */}
                    <button
                        onClick={() => handleGroupClick(group)}
                        className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} w-full py-2.5 rounded-lg transition-all duration-200 group/item select-none relative ${
                            isActiveSingle
                            ? 'bg-orange-50 text-secondary border-r-4 border-secondary' 
                            : isExpanded 
                                ? 'bg-slate-50 text-slate-900 dark:bg-white/10 dark:text-white'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
                        }`}
                        title={isCollapsed ? group.title : ''}
                    >
                        <div className={`flex items-center ${isCollapsed ? 'gap-0 justify-center' : 'gap-3'}`}>
                            <div className={`p-0.5 rounded-md transition-colors ${
                                isActiveSingle ? 'bg-transparent' : 
                                isExpanded && !isCollapsed ? 'bg-slate-200/50 dark:bg-white/10' : 'bg-transparent'
                            }`}>
                                <span className={`material-symbols-outlined text-2xl block ${
                                    isActiveSingle ? 'text-secondary font-bold' : 
                                    isExpanded ? 'text-slate-800 dark:text-white' : 'text-slate-400 group-hover/item:text-slate-600 dark:text-slate-500 dark:group-hover/item:text-slate-300'
                                }`}>
                                    {group.icon}
                                </span>
                            </div>
                            <span className={`text-sm font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${isActiveSingle ? 'text-secondary' : ''} ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                                {group.title}
                            </span>
                        </div>
                        
                        {group.children && !isCollapsed && (
                            <span className={`material-symbols-outlined text-lg transition-transform duration-300 ${isExpanded ? 'rotate-180 text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                                expand_more
                            </span>
                        )}
                    </button>

                    {/* Sub-menu Items (Accordion) - Hide completely if collapsed */}
                    {!isCollapsed && (
                        <div className={`grid transition-all duration-300 ease-in-out ${isExpanded && group.children ? 'grid-rows-[1fr] opacity-100 mt-1 mb-1' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden flex flex-col gap-1 pl-4 relative">
                                {/* Vertical Line */}
                                {isExpanded && <div className="absolute left-[23px] top-0 bottom-2 w-px bg-slate-200 dark:bg-slate-700"></div>}
                                
                                {group.children?.map((child: any) => {
                                    if (!hasAccess(child.roles)) return null;
                                    
                                    const isChildActive = child.path && (location.pathname === child.path || (child.path !== '/' && location.pathname.startsWith(child.path)));
                                    
                                    return (
                                        <NavLink 
                                            key={child.id} 
                                            to={child.path || '#'}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all relative z-10 ml-3 ${
                                                isChildActive 
                                                ? 'text-secondary bg-orange-50 dark:bg-orange-900/20 dark:text-orange-300 font-bold' 
                                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5'
                                            }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${isChildActive ? 'bg-secondary' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
                                            {child.title}
                                        </NavLink>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            );
        })}
      </nav>
      
      {/* Footer / Profile */}
      <div className={`p-4 border-t border-slate-100 bg-slate-50/50 dark:bg-[#0f172a] dark:border-white/10 shrink-0 flex flex-col gap-2 overflow-hidden ${isCollapsed ? 'items-center' : ''}`}>
        {/* User Profile */}
        <div className={`flex items-center gap-3 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-white/5 shadow-sm transition-all ${isCollapsed ? 'justify-center border-0 bg-transparent shadow-none p-0' : ''}`}>
          <div className="shrink-0 cursor-pointer" title={currentUser?.name}>
             <Avatar 
                src={currentUser?.avatar} 
                name={currentUser?.name || "Admin"} 
                className="size-9 border border-slate-100 dark:border-slate-600 shadow-sm"
                detail={{...currentUser, status: 'active', code: currentUser?.role}} 
             />
          </div>
          
          <div className={`flex flex-col overflow-hidden min-w-0 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{currentUser?.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate uppercase mt-0.5">{currentUser?.role}</p>
          </div>
        </div>

        {/* Logout Button */}
        <button 
            onClick={logout}
            className={`flex items-center justify-center gap-2 p-2 rounded-lg text-slate-500 hover:text-white hover:bg-red-600 dark:text-slate-400 dark:hover:bg-red-600 dark:hover:text-white transition-all font-bold text-xs uppercase border border-transparent hover:shadow-sm ${isCollapsed ? 'w-full' : 'w-full'}`}
            title="Đăng xuất"
        >
            <span className="material-symbols-outlined text-lg">logout</span>
            <span className={`${isCollapsed ? 'hidden' : 'block'}`}>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
