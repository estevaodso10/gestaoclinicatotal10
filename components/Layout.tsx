import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { 
  Users, Home, Calendar, CreditCard, Box, PieChart, UserCircle, 
  LogOut, Menu, BriefcaseMedical, CalendarDays, X, FileText
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout, systemName, systemLogo } = useApp();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!currentUser) {
    return <>{children}</>;
  }

  const isActive = (path: string) => location.pathname === path;

  const LinkItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <Link 
      to={to} 
      onClick={() => setIsMobileMenuOpen(false)}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        isActive(to) 
          ? 'bg-secondary text-white shadow-md' 
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      <Icon size={20} className="shrink-0" />
      <span className="font-medium">{label}</span>
    </Link>
  );

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-primary text-white flex items-center justify-between px-4 z-30 shadow-md">
         <div className="flex items-center space-x-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-1">
                <Menu size={24} />
            </button>
            <h1 className="font-bold text-lg truncate">{systemName}</h1>
         </div>
         <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold overflow-hidden text-sm">
              {currentUser.photoUrl ? (
                  <img src={currentUser.photoUrl} alt="User" className="w-full h-full object-cover" />
              ) : (
                  <span>{currentUser.name.charAt(0)}</span>
              )}
         </div>
      </div>

      {/* Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50 w-64 bg-primary text-white flex flex-col shadow-xl transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            {systemLogo ? (
                <img src={systemLogo} alt="Logo" className="w-8 h-8 object-contain shrink-0" />
            ) : (
                <div className="bg-secondary p-2 rounded-lg shrink-0">
                  <Box size={20} className="text-white" />
                </div>
            )}
            <h1 className="text-xl font-bold tracking-tight truncate" title={systemName}>{systemName}</h1>
          </div>
          {/* Close Button Mobile Only */}
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400 hover:text-white">
             <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
          
          {currentUser.role === Role.ADMIN && (
            <>
              <div className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-2">Admin</div>
              <LinkItem to="/admin/dashboard" icon={PieChart} label="Dashboard" />
              <LinkItem to="/admin/users" icon={Users} label="Usuários" />
              <LinkItem to="/admin/rooms" icon={Home} label="Salas" />
              <LinkItem to="/admin/allocations" icon={Calendar} label="Alocações" />
              <LinkItem to="/admin/events" icon={CalendarDays} label="Eventos" />
              <LinkItem to="/admin/documents" icon={FileText} label="Documentos" />
              <LinkItem to="/admin/payments" icon={CreditCard} label="Pagamentos" />
              <LinkItem to="/admin/inventory" icon={Box} label="Inventário" />
            </>
          )}

          {currentUser.role === Role.PROFESSIONAL && (
            <>
              <div className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-2">Profissional</div>
              <LinkItem to="/pro/dashboard" icon={UserCircle} label="Meu Perfil" />
              <LinkItem to="/pro/reservations" icon={Calendar} label="Minhas Reservas" />
              <LinkItem to="/pro/events" icon={CalendarDays} label="Eventos" />
              <LinkItem to="/pro/documents" icon={FileText} label="Documentos" />
              <LinkItem to="/pro/inventory" icon={Box} label="Inventário" />
              <LinkItem to="/pro/payments" icon={CreditCard} label="Meus Pagamentos" />
              <LinkItem to="/pro/patients" icon={BriefcaseMedical} label="Pacientes" />
            </>
          )}

        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold overflow-hidden shrink-0">
              {currentUser.photoUrl ? (
                  <img src={currentUser.photoUrl} alt="User" className="w-full h-full object-cover" />
              ) : (
                  <span>{currentUser.name.charAt(0)}</span>
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-400 truncate">{currentUser.role === Role.ADMIN ? 'Administrador' : 'Profissional'}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-red-600 text-gray-300 hover:text-white py-2 rounded-lg transition-colors text-sm"
          >
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 pt-16 md:pt-0">
        <div className="p-4 md:p-8 max-w-6xl mx-auto pb-20">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;