import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { supabase } from './supabaseClient';
import Layout from './components/Layout';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword'; 
import UsersPage from './pages/admin/Users';
import RoomsPage from './pages/admin/Rooms';
import AllocationsPage from './pages/admin/Allocations';
import AdminPaymentsPage from './pages/admin/Payments';
import AdminInventoryPage from './pages/admin/Inventory';
import AdminDashboard from './pages/admin/Dashboard'; 
import EventsPage from './pages/admin/Events'; 
import ProfessionalDashboard from './pages/professional/Dashboard'; 
import ProfessionalInventoryPage from './pages/professional/Inventory';
import PatientsPage from './pages/professional/Patients';
import ProfessionalPaymentsPage from './pages/professional/Payments';
import ProfessionalReservations from './pages/professional/Reservations';
import ProfessionalEventsPage from './pages/professional/Events'; 
import { Role } from './types';
import { Loader2 } from 'lucide-react';

// Componente para escutar eventos de autenticação (como recuperação de senha)
// e realizar o redirecionamento correto dentro do HashRouter
const AuthHandler = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return null;
};

const ProtectedRoute = ({ children, allowedRoles }: React.PropsWithChildren<{ allowedRoles: Role[] }>) => {
    const { currentUser, isLoading } = useApp();

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-gray-500 text-sm">Carregando sistema...</p>
                </div>
            </div>
        );
    }

    if (!currentUser) return <Navigate to="/" />;
    if (!allowedRoles.includes(currentUser.role)) return <Navigate to="/" />;
    return <>{children}</>;
};

const AppRoutes = () => {
    return (
        <>
            <AuthHandler />
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><Layout><UsersPage /></Layout></ProtectedRoute>} />
                <Route path="/admin/rooms" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><Layout><RoomsPage /></Layout></ProtectedRoute>} />
                <Route path="/admin/allocations" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><Layout><AllocationsPage /></Layout></ProtectedRoute>} />
                <Route path="/admin/events" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><Layout><EventsPage /></Layout></ProtectedRoute>} />
                <Route path="/admin/payments" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><Layout><AdminPaymentsPage /></Layout></ProtectedRoute>} />
                <Route path="/admin/inventory" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><Layout><AdminInventoryPage /></Layout></ProtectedRoute>} />

                {/* Professional Routes */}
                <Route path="/pro/dashboard" element={<ProtectedRoute allowedRoles={[Role.PROFESSIONAL]}><Layout><ProfessionalDashboard /></Layout></ProtectedRoute>} />
                <Route path="/pro/reservations" element={<ProtectedRoute allowedRoles={[Role.PROFESSIONAL]}><Layout><ProfessionalReservations /></Layout></ProtectedRoute>} />
                <Route path="/pro/inventory" element={<ProtectedRoute allowedRoles={[Role.PROFESSIONAL]}><Layout><ProfessionalInventoryPage /></Layout></ProtectedRoute>} />
                <Route path="/pro/payments" element={<ProtectedRoute allowedRoles={[Role.PROFESSIONAL]}><Layout><ProfessionalPaymentsPage /></Layout></ProtectedRoute>} />
                <Route path="/pro/patients" element={<ProtectedRoute allowedRoles={[Role.PROFESSIONAL]}><Layout><PatientsPage /></Layout></ProtectedRoute>} />
                <Route path="/pro/events" element={<ProtectedRoute allowedRoles={[Role.PROFESSIONAL]}><Layout><ProfessionalEventsPage /></Layout></ProtectedRoute>} />
            </Routes>
        </>
    );
}

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
         <AppRoutes />
      </HashRouter>
    </AppProvider>
  );
};

export default App;