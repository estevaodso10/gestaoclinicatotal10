import React from 'react';
import { useApp } from '../../context/AppContext';
import { Shift } from '../../types';
import { DAYS_OF_WEEK, SHIFTS } from '../../constants';
import { Calendar, Clock, MapPin, Info, ArrowRight, LayoutGrid } from 'lucide-react';

const ProfessionalReservations: React.FC = () => {
  const { currentUser, allocations, rooms } = useApp();

  if (!currentUser) return null;

  // 1. Filtrar alocações do usuário atual
  const myAllocations = allocations.filter(a => a.userId === currentUser.id);

  // 2. Ordenar por Dia da Semana e depois por Turno
  const sortedAllocations = [...myAllocations].sort((a, b) => {
    const dayDiff = DAYS_OF_WEEK.indexOf(a.day) - DAYS_OF_WEEK.indexOf(b.day);
    if (dayDiff !== 0) return dayDiff;
    return SHIFTS.indexOf(a.shift) - SHIFTS.indexOf(b.shift);
  });

  const getRoom = (roomId: string) => rooms.find(r => r.id === roomId);

  const getShiftColor = (shift: Shift) => {
      switch(shift) {
          case Shift.MORNING: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
          case Shift.AFTERNOON: return 'bg-orange-100 text-orange-800 border-orange-200';
          case Shift.EVENING: return 'bg-indigo-100 text-indigo-800 border-indigo-200';
          default: return 'bg-gray-100 text-gray-800';
      }
  };

  const getShiftIcon = (shift: Shift) => {
    if (shift === Shift.EVENING) return <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></div>;
    return <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Minhas Reservas</h2>
            <p className="text-gray-500 text-sm">Visualize as salas e horários alocados para seus atendimentos.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 shadow-sm flex items-center">
             <LayoutGrid size={18} className="mr-2 text-secondary" />
             Total de Horários: {myAllocations.length}
        </div>
      </div>

      {sortedAllocations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Calendar size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Nenhuma reserva encontrada</h3>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">
                Você ainda não possui salas alocadas. Entre em contato com a administração para solicitar um horário.
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedAllocations.map(alloc => {
                const room = getRoom(alloc.roomId);
                if (!room) return null;

                return (
                    <div key={alloc.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-0 overflow-hidden hover:shadow-md transition group">
                        {/* Header Stripe */}
                        <div className={`h-2 w-full ${alloc.shift === Shift.MORNING ? 'bg-yellow-400' : alloc.shift === Shift.AFTERNOON ? 'bg-orange-400' : 'bg-indigo-500'}`}></div>
                        
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getShiftColor(alloc.shift)}`}>
                                    {getShiftIcon(alloc.shift)}
                                    {alloc.shift}
                                </div>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center mb-1">
                                    <MapPin size={18} className="mr-2 text-gray-400" />
                                    {room.name}
                                </h3>
                                <p className="text-sm text-gray-500 pl-6 line-clamp-2" title={room.description}>
                                    {room.description}
                                </p>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex items-center text-gray-700 font-medium">
                                    <Calendar size={18} className="mr-2 text-secondary" />
                                    {alloc.day}
                                </div>
                                <div className="text-gray-300 group-hover:text-secondary transition-colors">
                                    <ArrowRight size={20} />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      )}

      {/* Info Warning */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start space-x-3">
         <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
         <div className="text-sm text-blue-800">
             <p className="font-semibold mb-1">Informação sobre agendamentos</p>
             <p>A alocação de salas é gerenciada exclusivamente pela administração. Caso precise alterar um horário ou trocar de sala, por favor, contate o administrador do sistema.</p>
         </div>
      </div>
    </div>
  );
};

export default ProfessionalReservations;