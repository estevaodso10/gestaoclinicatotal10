import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
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
import ProfessionalEventsPage from './pages/professional/Events'; // New Import
import { Role } from './types';

// Placeholder components for sections not fully detailed but required for structure
const DashboardPlaceholder = ({ title }: { title: string }) => (
    <div className="p-10 text-center border-2 border-dashed border-gray-300 rounded-xl">
        <h2 className="text-2xl font-bold text-gray-400">{title}</h2>
        <p className="text-gray-400 mt-2">Funcionalidade implementada no Contexto (Mock).</p>
    </div>
);

const ProtectedRoute = ({ children, allowedRoles }: React.PropsWithChildren<{ allowedRoles: Role[] }>) => {
    const { currentUser } = useApp();
    if (!currentUser) return <Navigate to="/" />;
    if (!allowedRoles.includes(currentUser.role)) return <Navigate to="/" />;
    return <>{children}</>;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            
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