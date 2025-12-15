import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Allocation, DayOfWeek, Role, Shift } from '../../types';
import { DAYS_OF_WEEK, SHIFTS } from '../../constants';
import { Trash2, Plus, AlertTriangle, Filter, X } from 'lucide-react';

const AllocationsPage: React.FC = () => {
  const { allocations, rooms, users, addAllocation, deleteAllocation } = useApp();
  
  // State for New Allocation Form
  const [newAlloc, setNewAlloc] = useState<Partial<Allocation>>({
    roomId: '',
    userId: '',
    day: DayOfWeek.MONDAY,
    shift: Shift.MORNING
  });
  const [errorMsg, setErrorMsg] = useState('');

  // State for Filters
  const [filterRoom, setFilterRoom] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [filterProfessional, setFilterProfessional] = useState('');

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [allocToDelete, setAllocToDelete] = useState<Allocation | null>(null);

  // --- Sorting Lists for Dropdowns ---
  const sortedRooms = [...rooms].sort((a, b) => a.name.localeCompare(b.name));
  
  const sortedProfessionals = users
    .filter(u => u.role === Role.PROFESSIONAL && u.isActive)
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newAlloc.roomId || !newAlloc.userId) {
        setErrorMsg('Por favor selecione a sala e o profissional.');
        return;
    }
    
    // CORREÇÃO: Adicionado await para esperar a resposta do Supabase
    const result = await addAllocation(newAlloc as Omit<Allocation, 'id'>);
    
    if (!result.success) {
      setErrorMsg(result.message);
    } else {
      setErrorMsg('');
      // Opcional: Limpar formulário ou manter para cadastros sequenciais
    }
  };

  const getProfessionalName = (id: string) => users.find(u => u.id === id)?.name || 'Desconhecido';
  const getRoomName = (id: string) => rooms.find(r => r.id === id)?.name || 'Desconhecido';

  // --- Filter Logic ---
  const filteredAllocations = allocations.filter(alloc => {
    const matchesRoom = filterRoom ? alloc.roomId === filterRoom : true;
    const matchesDay = filterDay ? alloc.day === filterDay : true;
    const matchesProf = filterProfessional ? alloc.userId === filterProfessional : true;
    return matchesRoom && matchesDay && matchesProf;
  });

  const clearFilters = () => {
    setFilterRoom('');
    setFilterDay('');
    setFilterProfessional('');
  };

  const hasActiveFilters = filterRoom || filterDay || filterProfessional;

  // --- Delete Handlers ---
  const handleDeleteClick = (alloc: Allocation) => {
    setAllocToDelete(alloc);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (allocToDelete) {
      deleteAllocation(allocToDelete.id);
      setIsDeleteModalOpen(false);
      setAllocToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Alocação de Salas</h2>
        <p className="text-gray-500">Gerencie a agenda das salas da clínica.</p>
      </div>

      {/* Allocation Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 flex items-center"><Plus size={18} className="mr-2"/> Nova Alocação</h3>
        {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm border border-red-100">{errorMsg}</div>}
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
           <div>
             <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Sala</label>
             <select className="w-full border rounded-md p-2 text-sm" 
               value={newAlloc.roomId} onChange={e => setNewAlloc({...newAlloc, roomId: e.target.value})}>
               <option value="">Selecione a Sala</option>
               {sortedRooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
             </select>
           </div>
           <div>
             <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Dia</label>
             <select className="w-full border rounded-md p-2 text-sm" 
               value={newAlloc.day} onChange={e => setNewAlloc({...newAlloc, day: e.target.value as DayOfWeek})}>
               {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
             </select>
           </div>
           <div>
             <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Turno</label>
             <select className="w-full border rounded-md p-2 text-sm" 
               value={newAlloc.shift} onChange={e => setNewAlloc({...newAlloc, shift: e.target.value as Shift})}>
               {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
           </div>
           <div>
             <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Profissional</label>
             <select className="w-full border rounded-md p-2 text-sm" 
               value={newAlloc.userId} onChange={e => setNewAlloc({...newAlloc, userId: e.target.value})}>
               <option value="">Selecione o Profissional</option>
               {sortedProfessionals.map(u => (
                 <option key={u.id} value={u.id}>{u.name} ({u.specialty})</option>
               ))}
             </select>
           </div>
           <button type="submit" className="w-full bg-primary hover:bg-slate-700 text-white p-2 rounded-md font-medium text-sm transition h-[38px]">
             Alocar Sala
           </button>
        </form>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
        <div className="flex items-center gap-2 text-gray-600 font-medium mb-2 lg:mb-0">
            <Filter size={20} />
            <span>Filtros:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:flex gap-3 w-full lg:w-auto lg:flex-1 justify-end">
            <select 
                className="border rounded-md p-2 text-sm focus:ring-2 focus:ring-secondary focus:outline-none w-full lg:w-auto"
                value={filterRoom}
                onChange={(e) => setFilterRoom(e.target.value)}
            >
                <option value="">Todas as Salas</option>
                {sortedRooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>

            <select 
                className="border rounded-md p-2 text-sm focus:ring-2 focus:ring-secondary focus:outline-none w-full lg:w-auto"
                value={filterDay}
                onChange={(e) => setFilterDay(e.target.value)}
            >
                <option value="">Todos os Dias</option>
                {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <select 
                className="border rounded-md p-2 text-sm focus:ring-2 focus:ring-secondary focus:outline-none w-full lg:w-auto"
                value={filterProfessional}
                onChange={(e) => setFilterProfessional(e.target.value)}
            >
                <option value="">Todos os Profissionais</option>
                {sortedProfessionals.map(u => (
                 <option key={u.id} value={u.id}>{u.name}</option>
               ))}
            </select>

            {hasActiveFilters && (
                <button 
                    onClick={clearFilters}
                    className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 text-sm transition w-full lg:w-auto"
                >
                    <X size={16} />
                    <span>Limpar</span>
                </button>
            )}
        </div>
      </div>

      {/* Allocation Matrix (Filtered List View) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
           <h3 className="font-semibold text-gray-700">Agenda Atual</h3>
           <span className="text-xs text-gray-500 bg-white border px-2 py-1 rounded-full">
               {filteredAllocations.length} registro(s) encontrado(s)
           </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Dia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Turno</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Sala</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Profissional</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAllocations.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        {allocations.length === 0 
                            ? "Nenhuma alocação cadastrada no sistema." 
                            : "Nenhuma alocação encontrada para os filtros selecionados."}
                    </td>
                </tr>
              )}
              {filteredAllocations.sort((a,b) => a.day.localeCompare(b.day)).map(alloc => (
                <tr key={alloc.id} className="hover:bg-gray-50">
                   <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{alloc.day}</td>
                   <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{alloc.shift}</td>
                   <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{getRoomName(alloc.roomId)}</td>
                   <td className="px-6 py-4 text-sm text-secondary font-medium whitespace-nowrap">{getProfessionalName(alloc.userId)}</td>
                   <td className="px-6 py-4 text-right whitespace-nowrap">
                     <button onClick={() => handleDeleteClick(alloc)} className="text-red-500 hover:text-red-700">
                       <Trash2 size={16} />
                     </button>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Delete Confirmation */}
      {isDeleteModalOpen && allocToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-2xl border-t-4 border-red-500">
            <div className="flex items-start space-x-4">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Remover Alocação?</h3>
                <div className="text-sm text-gray-500 mt-2 space-y-1">
                  <p>Você está removendo a reserva de:</p>
                  <p className="font-medium text-gray-800">• {getProfessionalName(allocToDelete.userId)}</p>
                  <p>Na sala:</p>
                  <p className="font-medium text-gray-800">• {getRoomName(allocToDelete.roomId)} ({allocToDelete.day} - {allocToDelete.shift})</p>
                </div>
                <p className="text-sm text-red-600 font-medium mt-3">
                  Atenção: Se houver pacientes vinculados a este horário, o agendamento deles será desvinculado.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete} 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm font-medium text-sm flex items-center"
              >
                <Trash2 size={16} className="mr-2"/> Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllocationsPage;