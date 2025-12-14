import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ClinicEvent, EventModality, EventRegistration } from '../../types';
import { 
    Calendar, MapPin, Video, User, FileText, 
    PlayCircle, History, Filter, ClipboardCheck, 
    Unlock, Users, CheckCircle, Clock, XCircle 
} from 'lucide-react';

const ProfessionalEventsPage: React.FC = () => {
  const { events, registrations, addRegistration, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');

  if (!currentUser) return null;

  // --- Logic for Sorting and Filtering ---
  const { displayedEvents, activeCount, historyCount } = useMemo(() => {
      const now = new Date();
      const activeList: ClinicEvent[] = [];
      const historyList: ClinicEvent[] = [];

      events.forEach(event => {
          const eventDateTime = new Date(`${event.date}T${event.time}`);
          if (eventDateTime < now) {
              historyList.push(event);
          } else {
              activeList.push(event);
          }
      });

      // Sort Active: Ascending (Sooner first)
      activeList.sort((a,b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

      // Sort History: Descending (Most recent first)
      historyList.sort((a,b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());

      return {
          displayedEvents: activeTab === 'ACTIVE' ? activeList : historyList,
          activeCount: activeList.length,
          historyCount: historyList.length
      };
  }, [events, activeTab]);

  // --- Helper to check registration ---
  const getRegistrationStatus = (eventId: string) => {
      const reg = registrations.find(r => r.eventId === eventId && r.participantEmail === currentUser.email);
      return reg;
  };

  // --- Handlers ---
  const handleRegister = (event: ClinicEvent) => {
      const existingReg = getRegistrationStatus(event.id);
      
      if (existingReg) {
          alert('Você já está inscrito.');
          return;
      }

      // Check deadline if exists
      if (event.registrationDeadlineDate) {
          const deadline = new Date(`${event.registrationDeadlineDate}T${event.registrationDeadlineTime || '23:59'}`);
          if (new Date() > deadline) {
              alert('O prazo de inscrição para este evento já encerrou.');
              return;
          }
      }

      // Check spots
      if (event.spots) {
          const currentRegistrations = registrations.filter(r => r.eventId === event.id && r.status === 'CONFIRMED').length;
          if (currentRegistrations >= event.spots) {
              alert('As vagas para este evento estão esgotadas.');
              return;
          }
      }

      // Proceed directly without window.confirm to avoid blocking/UX issues
      addRegistration({
          eventId: event.id,
          participantName: currentUser.name,
          participantEmail: currentUser.email,
          registrationDate: new Date().toISOString(),
          status: 'CONFIRMED'
      });
      
      alert(`Inscrição confirmada com sucesso em "${event.name}"!`);
  };

  const formatDate = (dateStr?: string) => {
    if(!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Eventos e Workshops</h2>
            <p className="text-gray-500 text-sm">Participe de atividades de atualização e networking da clínica.</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
            <button
                onClick={() => setActiveTab('ACTIVE')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'ACTIVE'
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
                <PlayCircle size={18} className="mr-2"/>
                Próximos Eventos
                {activeCount > 0 && <span className="ml-2 bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full text-xs">{activeCount}</span>}
            </button>
            <button
                onClick={() => setActiveTab('HISTORY')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'HISTORY'
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
                <History size={18} className="mr-2"/>
                Histórico
                {historyCount > 0 && <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{historyCount}</span>}
            </button>
            </nav>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedEvents.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed flex flex-col items-center">
                  <Filter size={32} className="mb-2 text-gray-300"/>
                  {events.length === 0 
                    ? "Nenhum evento disponível no momento." 
                    : activeTab === 'ACTIVE' 
                        ? "Nenhum evento futuro agendado." 
                        : "Nenhum evento realizado no histórico."}
              </div>
          )}
          
          {displayedEvents.map(event => {
              const myReg = getRegistrationStatus(event.id);
              const isRegistered = !!myReg;
              const isRejected = myReg?.status === 'REJECTED';
              
              return (
                <div key={event.id} className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition ${activeTab === 'HISTORY' ? 'opacity-75' : ''}`}>
                    {/* Card Header */}
                    <div className={`relative h-auto min-h-[6rem] p-5 flex flex-col justify-between ${activeTab === 'HISTORY' ? 'bg-gradient-to-r from-gray-600 to-gray-700' : 'bg-gradient-to-r from-blue-600 to-indigo-700'}`}>
                        <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 mb-3">{event.name}</h3>
                        
                        <div className="flex items-center justify-between">
                            <div className="flex items-center text-white/90 text-sm">
                                <Calendar size={14} className="mr-1.5"/>
                                <span>{formatDate(event.date)} às {event.time}</span>
                            </div>
                            
                            <div className="bg-white/10 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/20 uppercase tracking-wide">
                                {event.modality === EventModality.ONLINE ? 'ONLINE' : 'PRESENCIAL'}
                            </div>
                        </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col space-y-4">
                        {/* Status Banner for Registered User */}
                        {isRegistered && (
                            <div className={`text-sm px-3 py-2 rounded-lg flex items-center ${isRejected ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                {isRejected ? <XCircle size={16} className="mr-2"/> : <CheckCircle size={16} className="mr-2"/>}
                                <span className="font-medium">{isRejected ? 'Inscrição Rejeitada' : 'Você está inscrito!'}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex items-start text-sm text-gray-600">
                                {event.modality === EventModality.ONLINE ? (
                                    <Video size={16} className="mr-2 text-secondary shrink-0 mt-0.5" />
                                ) : (
                                    <MapPin size={16} className="mr-2 text-red-500 shrink-0 mt-0.5" />
                                )}
                                <span className="font-medium">
                                    {event.modality === EventModality.ONLINE 
                                        ? (isRegistered && !isRejected ? <a href={event.link} target="_blank" rel="noreferrer" className="text-secondary hover:underline truncate block">{event.link}</a> : (activeTab === 'ACTIVE' ? 'Link disponível após inscrição' : 'Evento Online'))
                                        : (event.location || 'Local não informado')
                                    }
                                </span>
                            </div>

                            {/* Registration Info Badge */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center text-sm text-gray-600">
                                   <Users size={16} className="mr-2 text-gray-400 shrink-0" />
                                   <span className="font-medium">
                                       {event.spots ? `${event.spots} vagas` : 'Vagas ilimitadas'}
                                   </span>
                                </div>
                                <div className={`text-xs px-2 py-1 rounded-full flex items-center border ${
                                  event.requiresRegistration 
                                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                  : 'bg-green-50 text-green-700 border-green-200'
                                }`}>
                                    {event.requiresRegistration ? (
                                        <>
                                            <ClipboardCheck size={12} className="mr-1"/> 
                                            {event.registrationDeadlineDate ? `Inscrição até ${formatDate(event.registrationDeadlineDate)}` : 'Requer Inscrição'}
                                        </>
                                    ) : (
                                        <>
                                            <Unlock size={12} className="mr-1"/> Aberto
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Speaker */}
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <div className="flex items-center mb-1">
                                <User size={14} className="mr-2 text-gray-500"/>
                                <span className="text-sm font-bold text-gray-800">{event.speaker}</span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2">{event.speakerBio}</p>
                        </div>

                        {/* Summary */}
                        <div className="flex-1">
                             <div className="flex items-center text-xs text-gray-400 mb-1 uppercase tracking-wide font-bold">
                                 <FileText size={12} className="mr-1"/> Sobre o evento
                             </div>
                             <p className="text-sm text-gray-600 line-clamp-3">{event.summary}</p>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
                        {activeTab === 'ACTIVE' ? (
                            <button 
                                type="button"
                                onClick={() => handleRegister(event)}
                                className={`w-full py-2 rounded-lg font-medium text-sm transition flex items-center justify-center cursor-pointer ${
                                    isRegistered
                                    ? 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                                    : 'bg-secondary text-white hover:bg-blue-600 shadow-sm'
                                }`}
                            >
                                {isRegistered 
                                    ? (isRejected ? 'Inscrição não aceita' : 'Já Inscrito') 
                                    : (event.requiresRegistration ? 'Realizar Inscrição' : 'Confirmar Presença')
                                }
                            </button>
                        ) : (
                            <div className="w-full text-center text-sm text-gray-500 font-medium py-2">
                                Evento Realizado
                            </div>
                        )}
                    </div>
                </div>
              );
          })}
      </div>
    </div>
  );
};

export default ProfessionalEventsPage;