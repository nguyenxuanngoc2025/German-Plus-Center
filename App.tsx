
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import SimulationBar from './components/SimulationBar';
import LeadsKanban from './views/LeadsKanban';
import FinanceDashboard from './views/FinanceDashboard';
import ExpenseList from './views/ExpenseList';
import InvoiceList from './views/InvoiceList';
import CreateExpense from './views/CreateExpense';
import ClassList from './views/ClassList';
import ClassDetails from './views/ClassDetails';
import CreateClass from './views/CreateClass';
import Profile from './views/Profile';
import Dashboard from './views/Dashboard';
import Students from './views/Students';
import StaffList from './views/StaffList';
import CreateStaff from './views/CreateStaff';
import Settings from './views/Settings';
import CreateInvoice from './views/CreateInvoice';
import Login from './views/Login';
import Documents from './views/Documents';
import Calendar from './views/Calendar';
import DebtManagement from './views/DebtManagement'; 
import SystemDiagnostics from './views/SystemDiagnostics';
import { DataProvider, useData, PermissionKey } from './context/DataContext';

const RoleRoute: React.FC<{ permission: PermissionKey }> = ({ permission }) => {
    const { hasPermission } = useData();
    
    if (!hasPermission(permission)) {
        return <Navigate to="/" replace />;
    }
    return <Outlet />;
};

const MainLayout: React.FC = () => {
  const { settings } = useData();
  const location = useLocation();
  const navigate = useNavigate();

  // --- ROUTE PERSISTENCE LOGIC ---
  
  // 1. Save Current Path
  useEffect(() => {
      if (location.pathname !== '/login') {
          localStorage.setItem('gp_last_path', location.pathname + location.search);
      }
  }, [location]);

  // 2. Restore Path on Load (if currently at root)
  useEffect(() => {
      const lastPath = localStorage.getItem('gp_last_path');
      // If we are at root ('/') and there is a saved path that isn't root, redirect.
      // This handles the "F5 on Dashboard redirects to last page" requirement if desired,
      // or simply ensures deep links work if HashRouter reset them (though HashRouter usually handles this itself).
      // The main benefit here is redirecting to the last worked-on page if the user just opens the base URL.
      if (location.pathname === '/' && lastPath && lastPath !== '/') {
          navigate(lastPath, { replace: true });
      }
  }, []); // Run once on mount

  useEffect(() => {
      document.title = settings.systemName;
  }, [settings.systemName]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display flex-col">
      {/* Simulation Bar sits on top of everything */}
      <SimulationBar />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <Routes>
            <Route path="/" element={<Dashboard />} />
            
            {/* Protected Routes */}
            <Route element={<RoleRoute permission="view_leads" />}>
                <Route path="/leads" element={<LeadsKanban />} />
            </Route>

            <Route element={<RoleRoute permission="view_students" />}>
                <Route path="/students" element={<Students />} />
            </Route>

            <Route element={<RoleRoute permission="view_classes" />}>
                <Route path="/classes" element={<ClassList />} />
                <Route path="/classes/:id" element={<ClassDetails />} />
            </Route>

            <Route element={<RoleRoute permission="edit_classes" />}>
                <Route path="/classes/create" element={<CreateClass />} />
            </Route>

            <Route element={<RoleRoute permission="view_finance" />}>
                <Route path="/finance" element={<FinanceDashboard />} />
                <Route path="/finance/debt" element={<DebtManagement />} />
                <Route path="/finance/invoices" element={<InvoiceList />} />
                <Route path="/finance/expenses" element={<ExpenseList />} />
                <Route path="/finance/expenses/create" element={<CreateExpense />} />
                <Route path="/invoices/create" element={<CreateInvoice />} />
            </Route>

            <Route element={<RoleRoute permission="edit_settings" />}>
                <Route path="/settings" element={<Settings />} />
                <Route path="/diagnostics" element={<SystemDiagnostics />} />
                <Route path="/staff" element={<StaffList />} />
                <Route path="/staff/create" element={<CreateStaff />} />
            </Route>

            {/* Common Routes */}
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/profile" element={<Profile />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

const ProtectedRoutes: React.FC = () => {
    const { isAuthenticated } = useData();
    
    if (!isAuthenticated) {
        return <Login />;
    }

    return <MainLayout />;
}

const App: React.FC = () => {
  return (
    <DataProvider>
      <Router>
        <ProtectedRoutes />
      </Router>
    </DataProvider>
  );
};

export default App;
