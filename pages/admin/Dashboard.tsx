import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Role } from '../../types';
import { Users, DollarSign, Calendar, Box, TrendingUp, Filter, CheckCircle, XCircle, Search, Eraser, Settings, Upload, Camera } from 'lucide-react';
import { DAYS_OF_WEEK, SHIFTS } from '../../constants';

const AdminDashboard: React.FC = () => {
  const { users, rooms, allocations, payments, inventory, loans, systemName, systemLogo, updateSystemSettings } = useApp();
  const [activeTab, setActiveTab] = useState<'OCCUPANCY' | 'FINANCIAL' | 'LOANS'>('OCCUPANCY');
  
  // Occupancy Filters
  const [occupancyStatusFilter, setOccupancyStatusFilter] = useState<'ALL' | 'OCCUPIED' | 'AVAILABLE'>('ALL');
  const [filterRoomId, setFilterRoomId] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [filterShift, setFilterShift] = useState('');

  // Settings Modal State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ name: systemName, logo: systemLogo });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- KPIS CALCULATION ---
  
  // Date Helpers for Current Month Logic
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed (0 = Jan)

  const isCurrentMonth = (dateStr?: string) => {
      if (!dateStr) return false;
      const [y, m] = dateStr.split('-').map(Number);
      // Compare Year and Month (subtract 1 from date string month as it is 1-12)
      return y === currentYear && (m - 1) === currentMonth;
  };

  // 1. Confirmed Revenue (Current Month) - Based on PAID DATE
  const currentMonthRevenue = payments
      .filter(p => p.status === 'PAID' && isCurrentMonth(p.paidDate))
      .reduce((acc, curr) => acc + curr.amount, 0);

  // 2. Pending Revenue (Current Month) - Based on DUE DATE
  const currentMonthPending = payments
      .filter(p => p.status === 'PENDING' && isCurrentMonth(p.dueDate))
      .reduce((acc, curr) => acc + curr.amount, 0);

  const activeLoansCount = loans.filter(l => l.status === 'ACTIVE').length;
  
  // KPI: Users Active Calculation (Excluding Admins)
  const nonAdminUsers = users.filter(u => u.role !== Role.ADMIN);
  const activeUsersCount = nonAdminUsers.filter(u => u.isActive).length;

  const totalSlots = rooms.length * DAYS_OF_WEEK.length * SHIFTS.length;
  const occupationRate = totalSlots > 0 ? Math.round((allocations.length / totalSlots) * 100) : 0;

  // --- HELPERS ---
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  
  const getProfessionalName = (id: string) => users.find(u => u.id === id)?.name || 'Desconhecido';
  
  // --- SETTINGS HANDLERS ---
  const handleOpenSettings = () => {
      setSettingsForm({ name: systemName, logo: systemLogo });
      setIsSettingsModalOpen(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (!['image/jpeg', 'image/png'].includes(file.type)) {
              alert('Apenas arquivos JPG ou PNG são permitidos.');
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
              setSettingsForm(prev => ({ ...prev, logo: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
      e.preventDefault();
      updateSystemSettings(settingsForm.name, settingsForm.logo);
      setIsSettingsModalOpen(false);
  };

  // --- OCCUPANCY MATRIX GENERATION ---
  const occupancyMatrix = useMemo(() => {
    const matrix: any[] = [];
    
    // Iterate to generate full schedule grid
    rooms.forEach(room => {
        // Filter by Room
        if (filterRoomId && room.id !== filterRoomId) return;

        DAYS_OF_WEEK.forEach(day => {
            // Filter by Day
            if (filterDay && day !== filterDay) return;

            SHIFTS.forEach(shift => {
                // Filter by Shift
                if (filterShift && shift !== filterShift) return;

                const allocation = allocations.find(a => 
                    a.roomId === room.id && 
                    a.day === day && 
                    a.shift === shift
                );

                const isOccupied = !!allocation;

                // Apply Status Filter
                if (occupancyStatusFilter === 'OCCUPIED' && !isOccupied) return;
                if (occupancyStatusFilter === 'AVAILABLE' && isOccupied) return;

                matrix.push({
                    key: `${room.id}-${day}-${shift}`,
                    roomName: room.name,
                    day,
                    shift,
                    isOccupied,
                    professionalName: allocation ? getProfessionalName(allocation.userId) : null
                });
            });
        });
    });

    return matrix;
  }, [rooms, allocations, occupancyStatusFilter, users, filterRoomId, filterDay, filterShift]);

  // --- FINANCIAL REPORT GENERATION ---
  const financialReport = useMemo(() => {
    // Structure: { "YYYY-MM": { expected: { total: 0, byUser: {} }, realized: { total: 0, byUser: {} } } }
    const report: Record<string, { 
        expected: { total: number, byUser: Record<string, number> }, 
        realized: { total: number, byUser: Record<string, number> } 
    }> = {};

    const addToReport = (dateStr: string, type: 'expected' | 'realized', amount: number, userId: string) => {
        const key = dateStr.substring(0, 7); // YYYY-MM
        if (!report[key]) {
            report[key] = { 
                expected: { total: 0, byUser: {} }, 
                realized: { total: 0, byUser: {} } 
            };
        }
        
        // Add to Total
        report[key][type].total += amount;

        // Add to User specific
        if (!report[key][type].byUser[userId]) {
            report[key][type].byUser[userId] = 0;
        }
        report[key][type].byUser[userId] += amount;
    };

    payments.forEach(p => {
        // 1. Expected Revenue (Based on Due Date) - Includes PENDING and PAID
        if (p.dueDate) {
            addToReport(p.dueDate, 'expected', p.amount, p.userId);
        }

        // 2. Realized Revenue (Based on Paid Date) - Only PAID
        if (p.status === 'PAID' && p.paidDate) {
            addToReport(p.paidDate, 'realized', p.amount, p.userId);
        }
    });

    // Sort months descending
    return Object.entries(report).sort((a, b) => b[0].localeCompare(a[0]));
  }, [payments]);

  const getMonthName = (yyyyMm: string) => {
      const [year, month] = yyyyMm.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const clearOccupancyFilters = () => {
    setFilterRoomId('');
    setFilterDay('');
    setFilterShift('');
    setOccupancyStatusFilter('ALL');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Dashboard Administrativo</h2>
            <p className="text-gray-500 text-sm">Visão geral e relatórios gerenciais da clínica.</p>
        </div>
        <button 
            onClick={handleOpenSettings}
            className="flex items-center space-x-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 shadow-sm transition"
        >
            <Settings size={18} />
            <span>Configurar Sistema</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-blue-50 text-secondary rounded-lg">
                    <Users size={20} />
                </div>
                <span className="text-xs font-semibold px-2 py-1 bg-green-50 text-green-700 rounded-full flex items-center">
                    <TrendingUp size={12} className="mr-1"/> Ativos
                </span>
            </div>
            <div>
                <p className="text-gray-500 text-xs font-medium uppercase">Usuários Ativos</p>
                <h3 className="text-2xl font-bold text-gray-800">{activeUsersCount}</h3>
                <p className="text-xs text-gray-400 mt-1">De {nonAdminUsers.length} profissionais</p>
            </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
             <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <DollarSign size={20} />
                </div>
            </div>
            <div>
                <p className="text-gray-500 text-xs font-medium uppercase">Receita (Mês Atual)</p>
                <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(currentMonthRevenue)}</h3>
                <p className="text-xs text-gray-400 mt-1">Pendente: {formatCurrency(currentMonthPending)}</p>
            </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <Calendar size={20} />
                </div>
            </div>
            <div>
                <p className="text-gray-500 text-xs font-medium uppercase">Taxa de Ocupação</p>
                <h3 className="text-2xl font-bold text-gray-800">{occupationRate}%</h3>
                <p className="text-xs text-gray-400 mt-1">{allocations.length} de {totalSlots} slots</p>
            </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                    <Box size={20} />
                </div>
            </div>
            <div>
                <p className="text-gray-500 text-xs font-medium uppercase">Empréstimos Ativos</p>
                <h3 className="text-2xl font-bold text-gray-800">{activeLoansCount}</h3>
                <p className="text-xs text-gray-400 mt-1">Itens em uso externo</p>
            </div>
        </div>
      </div>

      {/* Reports Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
        {/* Tabs */}
        <div className="border-b border-gray-200 px-6 pt-4 flex space-x-6">
            <button 
                onClick={() => setActiveTab('OCCUPANCY')}
                className={`pb-4 px-2 text-sm font-medium border-b-2 transition ${activeTab === 'OCCUPANCY' ? 'border-secondary text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                Relatório de Ocupação
            </button>
            <button 
                onClick={() => setActiveTab('FINANCIAL')}
                className={`pb-4 px-2 text-sm font-medium border-b-2 transition ${activeTab === 'FINANCIAL' ? 'border-secondary text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                Relatório Financeiro
            </button>
            <button 
                onClick={() => setActiveTab('LOANS')}
                className={`pb-4 px-2 text-sm font-medium border-b-2 transition ${activeTab === 'LOANS' ? 'border-secondary text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                Relatório de Empréstimos
            </button>
        </div>

        {/* Content */}
        <div className="p-6">
            {/* OCCUPANCY REPORT */}
            {activeTab === 'OCCUPANCY' && (
                <div>
                    <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                         <div>
                            <h3 className="font-bold text-gray-700">Mapa Geral de Salas e Horários</h3>
                            <p className="text-sm text-gray-500">Visualize horários livres e ocupados.</p>
                         </div>
                    </div>

                    {/* Filters Row */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                             <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                             <select 
                                value={occupancyStatusFilter} 
                                onChange={(e) => setOccupancyStatusFilter(e.target.value as any)}
                                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-secondary focus:outline-none"
                             >
                                <option value="ALL">Todos</option>
                                <option value="AVAILABLE">Apenas Livres</option>
                                <option value="OCCUPIED">Apenas Ocupados</option>
                             </select>
                        </div>
                        <div>
                             <label className="block text-xs font-medium text-gray-500 mb-1">Sala</label>
                             <select 
                                value={filterRoomId} 
                                onChange={(e) => setFilterRoomId(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-secondary focus:outline-none"
                             >
                                <option value="">Todas as Salas</option>
                                {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                             </select>
                        </div>
                        <div>
                             <label className="block text-xs font-medium text-gray-500 mb-1">Dia da Semana</label>
                             <select 
                                value={filterDay} 
                                onChange={(e) => setFilterDay(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-secondary focus:outline-none"
                             >
                                <option value="">Todos os Dias</option>
                                {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                             </select>
                        </div>
                        <div className="flex gap-2">
                             <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Turno</label>
                                <select 
                                    value={filterShift} 
                                    onChange={(e) => setFilterShift(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-secondary focus:outline-none"
                                >
                                    <option value="">Todos os Turnos</option>
                                    {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                             </div>
                             <button 
                                onClick={clearOccupancyFilters}
                                title="Limpar Filtros"
                                className="bg-gray-200 hover:bg-gray-300 text-gray-600 p-2 rounded-md h-[38px] w-[38px] flex items-center justify-center transition"
                             >
                                 <Eraser size={18} />
                             </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sala</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dia</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turno</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status / Profissional</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {occupancyMatrix.map((item) => (
                                    <tr key={item.key} className={`hover:bg-gray-50 ${!item.isOccupied ? 'bg-gray-50/30' : ''}`}>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.roomName}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{item.day}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{item.shift}</td>
                                        <td className="px-4 py-3 text-sm">
                                            {item.isOccupied ? (
                                                <div className="flex items-center text-secondary font-medium">
                                                    <XCircle size={16} className="text-red-500 mr-2" />
                                                    <span className="truncate">{item.professionalName}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center text-green-600">
                                                    <CheckCircle size={16} className="mr-2" />
                                                    <span className="font-medium">Disponível</span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {occupancyMatrix.length === 0 && (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-400">Nenhum registro encontrado para o filtro selecionado.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* FINANCIAL REPORT */}
            {activeTab === 'FINANCIAL' && (
                <div className="space-y-8">
                     <div className="flex justify-between items-center mb-2">
                         <div>
                            <h3 className="font-bold text-gray-700">Fluxo Financeiro Mensal</h3>
                            <p className="text-sm text-gray-500">Comparativo entre previsão de recebimento e caixa realizado.</p>
                         </div>
                    </div>
                    
                    {financialReport.length === 0 && (
                        <div className="p-8 text-center text-gray-400 border-2 border-dashed rounded-lg">
                            Nenhum registro financeiro encontrado.
                        </div>
                    )}

                    {financialReport.map(([monthKey, data]) => (
                        <div key={monthKey} className="border border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-gray-100 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                                <h4 className="font-bold text-gray-800 capitalize">{getMonthName(monthKey)}</h4>
                                <span className="text-xs text-gray-500 font-mono">{monthKey}</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                                {/* EXPECTED REVENUE COLUMN */}
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center text-gray-600 font-medium">
                                            <Calendar size={18} className="mr-2 text-blue-500" />
                                            Receita Esperada (Vencimentos)
                                        </div>
                                        <span className="text-lg font-bold text-blue-600">{formatCurrency(data.expected.total)}</span>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {Object.entries(data.expected.byUser).map(([userId, amount]) => (
                                            <div key={userId} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 rounded-lg">
                                                <div className="flex items-center">
                                                    <div className="w-2 h-2 rounded-full bg-blue-400 mr-2"></div>
                                                    <span className="text-gray-700">{getProfessionalName(userId)}</span>
                                                </div>
                                                <span className="font-medium text-gray-900">{formatCurrency(amount as number)}</span>
                                            </div>
                                        ))}
                                        {Object.keys(data.expected.byUser).length === 0 && (
                                            <p className="text-xs text-gray-400 italic">Nenhum vencimento previsto para este mês.</p>
                                        )}
                                    </div>
                                </div>

                                {/* REALIZED REVENUE COLUMN */}
                                <div className="p-6 bg-green-50/30">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center text-gray-600 font-medium">
                                            <CheckCircle size={18} className="mr-2 text-green-500" />
                                            Pagamentos Confirmados (Caixa)
                                        </div>
                                        <span className="text-lg font-bold text-green-600">{formatCurrency(data.realized.total)}</span>
                                    </div>

                                    <div className="space-y-2">
                                        {Object.entries(data.realized.byUser).map(([userId, amount]) => (
                                            <div key={userId} className="flex justify-between items-center text-sm p-2 hover:bg-green-50 rounded-lg transition">
                                                <div className="flex items-center">
                                                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                                    <span className="text-gray-700">{getProfessionalName(userId)}</span>
                                                </div>
                                                <span className="font-medium text-gray-900">{formatCurrency(amount as number)}</span>
                                            </div>
                                        ))}
                                         {Object.keys(data.realized.byUser).length === 0 && (
                                            <p className="text-xs text-gray-400 italic">Nenhum pagamento baixado neste mês.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* LOANS REPORT */}
            {activeTab === 'LOANS' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="font-bold text-gray-700">Inventário em Posse de Terceiros</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {loans.filter(l => l.status === 'ACTIVE').map(loan => (
                            <div key={loan.id} className="border rounded-lg p-4 bg-orange-50 border-orange-100">
                                <h4 className="font-bold text-gray-800">{loan.itemName}</h4>
                                <div className="mt-2 text-sm space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Responsável:</span>
                                        <span className="font-medium text-gray-900">{getProfessionalName(loan.userId)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Retirada:</span>
                                        <span className="font-medium text-gray-900">{new Date(loan.requestDate).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Quantidade:</span>
                                        <span className="font-medium text-gray-900">{loan.quantity} un</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                         {loans.filter(l => l.status === 'ACTIVE').length === 0 && (
                             <div className="col-span-3 text-center p-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                                 Nenhum item emprestado no momento.
                             </div>
                         )}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Modal: System Settings */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Configurações do Sistema</h3>
            <form onSubmit={handleSaveSettings} className="space-y-6">
                
                <div className="flex flex-col items-center">
                    <div className="mb-2 font-medium text-gray-700 text-sm">Logo do Sistema</div>
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                            {settingsForm.logo ? (
                                <img src={settingsForm.logo} alt="System Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                <Box size={32} className="text-gray-400" />
                            )}
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                <Camera size={24} className="text-white" />
                            </div>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            hidden 
                            accept="image/png, image/jpeg" 
                            onChange={handleLogoChange}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Sistema</label>
                    <input 
                        type="text" 
                        required
                        className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none"
                        value={settingsForm.name}
                        onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })}
                    />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                    <button 
                        type="button" 
                        onClick={() => setIsSettingsModalOpen(false)} 
                        className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        className="px-4 py-2 bg-secondary text-white rounded hover:bg-blue-600 shadow-sm"
                    >
                        Salvar Alterações
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;