import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ClinicEvent, EventModality, EventRegistration } from '../../types';
import { 
    Calendar, MapPin, Clock, Video, Plus, Edit, Trash2, 
    User, FileText, AlertTriangle, Link as LinkIcon, Users,
    ClipboardCheck, Unlock, Printer, Eye, XCircle, CheckCircle,
    Filter, Eraser, Search, History, PlayCircle, CheckSquare, Square
} from 'lucide-react';

const EventsPage: React.FC = () => {
  const { events, registrations, addEvent, updateEvent, deleteEvent, updateRegistration, systemName } = useApp();

  // --- Filter States ---
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [filterModality, setFilterModality] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>(''); // YYYY-MM
  const [filterSpeaker, setFilterSpeaker] = useState<string>('');
  const [filterRegistration, setFilterRegistration] = useState<string>(''); // 'true' | 'false' | ''

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ClinicEvent | null>(null);
  
  // Registrations Modal State
  const [isRegistrationsModalOpen, setIsRegistrationsModalOpen] = useState(false);
  const [selectedEventForRegistrations, setSelectedEventForRegistrations] = useState<ClinicEvent | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ClinicEvent>>({
    name: '',
    date: '',
    time: '',
    modality: EventModality.PRESENTIAL,
    location: '',
    link: '',
    speaker: '',
    speakerBio: '',
    summary: '',
    spots: undefined,
    requiresRegistration: false,
    registrationDeadlineDate: '',
    registrationDeadlineTime: ''
  });

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<ClinicEvent | null>(null);

  // --- Helpers & Logic ---

  // Extract Unique Speakers for Filter Dropdown
  const uniqueSpeakers = useMemo(() => {
      return Array.from(new Set(events.map(e => e.speaker))).sort();
  }, [events]);

  // Apply Filters and Split by Time
  const { displayedEvents, activeCount, historyCount } = useMemo(() => {
      const now = new Date();

      // 1. First, apply user selected filters (Modality, Month, etc)
      const filteredCandidates = events.filter(event => {
          if (filterModality && event.modality !== filterModality) return false;
          if (filterMonth && !event.date.startsWith(filterMonth)) return false;
          if (filterSpeaker && event.speaker !== filterSpeaker) return false;
          if (filterRegistration === 'true' && !event.requiresRegistration) return false;
          if (filterRegistration === 'false' && event.requiresRegistration) return false;
          return true;
      });

      // 2. Split into Active and Past based on Date + Time
      const activeList: ClinicEvent[] = [];
      const historyList: ClinicEvent[] = [];

      filteredCandidates.forEach(event => {
          const eventDateTime = new Date(`${event.date}T${event.time}`);
          if (eventDateTime < now) {
              historyList.push(event);
          } else {
              activeList.push(event);
          }
      });

      // 3. Sort lists
      // Active: Ascending (Sooner first)
      activeList.sort((a,b) => {
          const dateA = new Date(`${a.date}T${a.time}`).getTime();
          const dateB = new Date(`${b.date}T${b.time}`).getTime();
          return dateA - dateB;
      });

      // History: Descending (Most recent first)
      historyList.sort((a,b) => {
          const dateA = new Date(`${a.date}T${a.time}`).getTime();
          const dateB = new Date(`${b.date}T${b.time}`).getTime();
          return dateB - dateA;
      });

      return {
          displayedEvents: activeTab === 'ACTIVE' ? activeList : historyList,
          activeCount: activeList.length,
          historyCount: historyList.length
      };

  }, [events, filterModality, filterMonth, filterSpeaker, filterRegistration, activeTab]);

  const clearFilters = () => {
      setFilterModality('');
      setFilterMonth('');
      setFilterSpeaker('');
      setFilterRegistration('');
  };

  const hasActiveFilters = filterModality || filterMonth || filterSpeaker || filterRegistration;

  // --- Handlers ---

  const openModal = (event?: ClinicEvent) => {
    if (event) {
        setEditingEvent(event);
        setFormData({ ...event });
    } else {
        setEditingEvent(null);
        setFormData({
            name: '',
            date: '',
            time: '',
            modality: EventModality.PRESENTIAL,
            location: '',
            link: '',
            speaker: '',
            speakerBio: '',
            summary: '',
            spots: undefined,
            requiresRegistration: false,
            registrationDeadlineDate: '',
            registrationDeadlineTime: ''
        });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
        updateEvent({ ...editingEvent, ...formData } as ClinicEvent);
    } else {
        addEvent(formData as Omit<ClinicEvent, 'id'>);
    }
    setIsModalOpen(false);
  };

  const handleDeleteClick = (event: ClinicEvent) => {
      setEventToDelete(event);
      setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
      if (eventToDelete) {
          deleteEvent(eventToDelete.id);
          setIsDeleteModalOpen(false);
          setEventToDelete(null);
      }
  };

  const formatDate = (dateStr?: string) => {
    if(!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  // --- Registration Logic ---

  const openRegistrationsModal = (event: ClinicEvent) => {
      setSelectedEventForRegistrations(event);
      setIsRegistrationsModalOpen(true);
  };

  const getEventRegistrations = (eventId: string) => {
      return registrations
        .filter(r => r.eventId === eventId)
        .sort((a, b) => a.participantName.localeCompare(b.participantName));
  };

  const handleToggleRegistrationStatus = (reg: EventRegistration) => {
      updateRegistration({
          ...reg,
          status: reg.status === 'REJECTED' ? 'CONFIRMED' : 'REJECTED'
      });
  };

  const handleToggleAttendance = (reg: EventRegistration) => {
    if (reg.status === 'REJECTED') return;
    updateRegistration({
        ...reg,
        attended: !reg.attended
    });
  };

  const handlePrintRegistrations = () => {
      if (!selectedEventForRegistrations) return;

      // Filter only confirmed registrations for the PDF
      const eventRegs = getEventRegistrations(selectedEventForRegistrations.id)
          .filter(r => r.status === 'CONFIRMED');
      
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
          printWindow.document.write('<html><head><title>Lista de Inscritos</title>');
          printWindow.document.write(`
            <style>
                body { font-family: 'Arial', sans-serif; padding: 20px; }
                h1 { font-size: 18px; margin-bottom: 5px; color: #333; }
                h2 { font-size: 14px; margin-bottom: 20px; color: #666; font-weight: normal; }
                .header { border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { bg-color: #f3f4f6; font-weight: bold; background-color: #f9fafb; }
                tr:nth-child(even) { background-color: #f9fafb; }
                .footer { margin-top: 30px; font-size: 10px; text-align: right; color: #999; }
            </style>
          `);
          printWindow.document.write('</head><body>');
          
          // Header
          printWindow.document.write(`
            <div class="header">
                <h1>${systemName} - Lista de Presença</h1>
                <h2>
                    <strong>Evento:</strong> ${selectedEventForRegistrations.name}<br/>
                    <strong>Data:</strong> ${formatDate(selectedEventForRegistrations.date)} às ${selectedEventForRegistrations.time}<br/>
                    <strong>Local:</strong> ${selectedEventForRegistrations.modality === 'ONLINE' ? 'Online' : selectedEventForRegistrations.location}
                </h2>
            </div>
          `);

          // Table
          printWindow.document.write(`
            <table>
                <thead>
                    <tr>
                        <th width="5%">#</th>
                        <th width="40%">Nome do Participante</th>
                        <th width="35%">E-mail</th>
                        <th width="20%">Data Inscrição</th>
                    </tr>
                </thead>
                <tbody>
          `);

          if (eventRegs.length === 0) {
              printWindow.document.write('<tr><td colspan="4" style="text-align:center; padding: 20px;">Nenhum inscrito confirmado.</td></tr>');
          } else {
              eventRegs.forEach((reg, index) => {
                  // Robust Date Formatting for ISO Strings
                  const dateObj = new Date(reg.registrationDate);
                  const formattedDate = isNaN(dateObj.getTime()) 
                    ? reg.registrationDate // Fallback to raw string if invalid
                    : dateObj.toLocaleString('pt-BR');

                  printWindow.document.write(`
                    <tr>
                        <td>${index + 1}</td>
                        <td>${reg.participantName}</td>
                        <td>${reg.participantEmail}</td>
                        <td>${formattedDate}</td>
                    </tr>
                  `);
              });
          }

          printWindow.document.write(`
                </tbody>
            </table>
            <div class="footer">
                Documento gerado em ${new Date().toLocaleString('pt-BR')}
            </div>
          `);
          
          printWindow.document.write('</body></html>');
          printWindow.document.close();
          printWindow.print();
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
            <div>
            <h2 className="text-2xl font-bold text-gray-800">Gestão de Eventos</h2>
            <p className="text-gray-500 text-sm">Organize workshops, palestras e cursos.</p>
            </div>
            <button 
                onClick={() => openModal()} 
                className="bg-secondary text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-600 transition"
            >
            <Plus size={18} /> <span>Novo Evento</span>
            </button>
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
                Eventos Ativos
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
                Eventos Realizados
                {historyCount > 0 && <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{historyCount}</span>}
            </button>
            </nav>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-700">
             <Search size={16} /> Filtros
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
             {/* Modality Filter */}
             <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Modalidade</label>
                <select 
                    className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-secondary focus:outline-none"
                    value={filterModality}
                    onChange={(e) => setFilterModality(e.target.value)}
                >
                    <option value="">Todas</option>
                    <option value={EventModality.PRESENTIAL}>Presencial</option>
                    <option value={EventModality.ONLINE}>Online</option>
                </select>
             </div>

             {/* Month Filter */}
             <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Mês/Ano</label>
                <input 
                    type="month"
                    className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-secondary focus:outline-none"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                />
             </div>

             {/* Speaker Filter */}
             <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Palestrante</label>
                <select 
                    className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-secondary focus:outline-none"
                    value={filterSpeaker}
                    onChange={(e) => setFilterSpeaker(e.target.value)}
                >
                    <option value="">Todos</option>
                    {uniqueSpeakers.map(speaker => (
                        <option key={speaker} value={speaker}>{speaker}</option>
                    ))}
                </select>
             </div>

             {/* Registration Filter */}
             <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Inscrição</label>
                <select 
                    className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-secondary focus:outline-none"
                    value={filterRegistration}
                    onChange={(e) => setFilterRegistration(e.target.value)}
                >
                    <option value="">Todos</option>
                    <option value="true">Exige Inscrição</option>
                    <option value="false">Não Exige</option>
                </select>
             </div>

             {/* Clear Button */}
             <div>
                {hasActiveFilters && (
                    <button 
                        onClick={clearFilters}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-md flex items-center justify-center transition text-sm"
                    >
                        <Eraser size={16} className="mr-2" /> Limpar
                    </button>
                )}
             </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayedEvents.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed flex flex-col items-center">
                  <Filter size={32} className="mb-2 text-gray-300"/>
                  {events.length === 0 
                    ? "Nenhum evento agendado." 
                    : activeTab === 'ACTIVE' 
                        ? "Nenhum evento ativo encontrado para os filtros selecionados." 
                        : "Nenhum evento realizado encontrado para os filtros selecionados."}
              </div>
          )}
          
          {displayedEvents.map(event => (
              <div key={event.id} className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition ${activeTab === 'HISTORY' ? 'opacity-80' : ''}`}>
                  {/* Card Header with Date Ribbon */}
                  <div className={`relative h-auto min-h-[6rem] p-5 flex flex-col justify-between ${activeTab === 'HISTORY' ? 'bg-gradient-to-r from-gray-700 to-gray-800' : 'bg-gradient-to-r from-slate-800 to-slate-900'}`}>
                      <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 mb-3">{event.name}</h3>
                      
                      <div className="flex items-center justify-between">
                          <div className={`flex items-center text-sm ${activeTab === 'HISTORY' ? 'text-gray-300' : 'text-blue-200'}`}>
                              <Calendar size={14} className="mr-1.5"/>
                              <span>{formatDate(event.date)} às {event.time}</span>
                          </div>
                          
                          <div className="bg-white/10 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/20 uppercase tracking-wide">
                              {event.modality === EventModality.ONLINE ? 'ONLINE' : 'PRESENCIAL'}
                          </div>
                      </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col space-y-4">
                      {/* Location / Link / Spots / Registration Status */}
                      <div className="space-y-2">
                          <div className="flex items-start text-sm text-gray-600">
                              {event.modality === EventModality.ONLINE ? (
                                <Video size={16} className="mr-2 text-secondary shrink-0 mt-0.5" />
                              ) : (
                                <MapPin size={16} className="mr-2 text-red-500 shrink-0 mt-0.5" />
                              )}
                              <span className="font-medium">
                                  {event.modality === EventModality.ONLINE 
                                    ? (event.link ? <a href={event.link} target="_blank" rel="noreferrer" className="text-secondary hover:underline truncate block">{event.link}</a> : 'Link não informado')
                                    : (event.location || 'Local não informado')
                                  }
                              </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                              {/* Spots Display */}
                              <div className="flex items-center text-sm text-gray-600">
                                   <Users size={16} className="mr-2 text-gray-400 shrink-0" />
                                   <span className="font-medium">
                                       {event.spots ? `${event.spots} vagas` : 'Vagas ilimitadas'}
                                   </span>
                              </div>
                              
                              {/* Registration Badge */}
                              <div className={`text-xs px-2 py-1 rounded-full flex items-center border ${
                                  event.requiresRegistration 
                                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                  : 'bg-green-50 text-green-700 border-green-200'
                              }`}>
                                  {event.requiresRegistration ? (
                                      <>
                                        <ClipboardCheck size={12} className="mr-1"/> 
                                        Inscrição {event.registrationDeadlineDate ? `até ${formatDate(event.registrationDeadlineDate)}` : 'Obrigatória'}
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
                               <FileText size={12} className="mr-1"/> Resumo
                           </div>
                           <p className="text-sm text-gray-600 line-clamp-3">{event.summary}</p>
                      </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                      <button 
                        onClick={() => openRegistrationsModal(event)}
                        className="text-xs flex items-center text-gray-600 hover:text-secondary font-medium transition"
                      >
                         <Users size={14} className="mr-1"/> Lista de Inscritos
                      </button>

                      <div className="flex space-x-2">
                        <button 
                            onClick={() => openModal(event)}
                            className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-md transition"
                            title="Editar"
                        >
                            <Edit size={16} />
                        </button>
                        <button 
                            onClick={() => handleDeleteClick(event)}
                            className="p-2 text-red-500 hover:bg-red-100 rounded-md transition"
                            title="Excluir"
                        >
                            <Trash2 size={16} />
                        </button>
                      </div>
                  </div>
              </div>
          ))}
      </div>

      {/* Modal: Registrations List */}
      {isRegistrationsModalOpen && selectedEventForRegistrations && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Lista de Inscritos</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Evento: <span className="font-semibold">{selectedEventForRegistrations.name}</span>
                        </p>
                    </div>
                    <button 
                        onClick={handlePrintRegistrations}
                        className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg flex items-center hover:bg-gray-200 transition text-sm font-medium"
                    >
                        <Printer size={16} className="mr-2"/> Imprimir / PDF
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                     <table className="min-w-full divide-y divide-gray-200">
                         <thead className="bg-gray-50">
                             <tr>
                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Inscrição</th>
                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                 <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                                 <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase border-l border-gray-200">Presença</th>
                             </tr>
                         </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                             {getEventRegistrations(selectedEventForRegistrations.id).map(reg => (
                                 <tr key={reg.id} className={reg.status === 'REJECTED' ? 'bg-red-50' : ''}>
                                     <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${reg.status === 'REJECTED' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{reg.participantName}</td>
                                     <td className={`px-6 py-4 whitespace-nowrap text-sm ${reg.status === 'REJECTED' ? 'text-gray-400' : 'text-gray-500'}`}>{reg.participantEmail}</td>
                                     <td className={`px-6 py-4 whitespace-nowrap text-sm ${reg.status === 'REJECTED' ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(reg.registrationDate)}</td>
                                     <td className="px-6 py-4 whitespace-nowrap">
                                        {reg.status === 'CONFIRMED' ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Confirmado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                Rejeitado
                                            </span>
                                        )}
                                     </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <button 
                                            onClick={() => handleToggleRegistrationStatus(reg)}
                                            className={`${reg.status === 'CONFIRMED' ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'} transition p-1`}
                                            title={reg.status === 'CONFIRMED' ? 'Rejeitar Inscrição' : 'Reativar Inscrição'}
                                        >
                                            {reg.status === 'CONFIRMED' ? <XCircle size={18} /> : <CheckCircle size={18} />}
                                        </button>
                                     </td>
                                     {/* Attendance Column */}
                                     <td className="px-6 py-4 whitespace-nowrap text-center border-l border-gray-200">
                                         <button
                                            onClick={() => handleToggleAttendance(reg)}
                                            disabled={reg.status === 'REJECTED'}
                                            className={`transition flex items-center justify-center w-full ${
                                                reg.status === 'REJECTED' 
                                                ? 'text-gray-300 cursor-not-allowed' 
                                                : reg.attended 
                                                    ? 'text-green-600 hover:text-green-700' 
                                                    : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                            title={reg.status === 'REJECTED' ? 'Inscrição rejeitada' : (reg.attended ? 'Marcar como ausente' : 'Marcar como presente')}
                                         >
                                             {reg.attended 
                                                ? <div className="flex items-center space-x-1"><CheckSquare size={20} /><span className="text-xs font-bold">Presente</span></div>
                                                : <div className="flex items-center space-x-1"><Square size={20} /><span className="text-xs">Ausente</span></div>
                                             }
                                         </button>
                                     </td>
                                 </tr>
                             ))}
                             {getEventRegistrations(selectedEventForRegistrations.id).length === 0 && (
                                 <tr>
                                     <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                         Nenhum inscrito registrado para este evento.
                                     </td>
                                 </tr>
                             )}
                         </tbody>
                     </table>
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end">
                    <button 
                        onClick={() => setIsRegistrationsModalOpen(false)}
                        className="px-4 py-2 border border-gray-300 bg-white rounded-lg text-gray-700 hover:bg-gray-100"
                    >
                        Fechar
                    </button>
                </div>
            </div>
         </div>
      )}

      {/* Modal: Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editingEvent ? 'Editar Evento' : 'Novo Evento'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Nome do Evento</label>
                    <input 
                      required type="text" 
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none" 
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data do Evento</label>
                    <input 
                      required type="date" 
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none" 
                      value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Horário</label>
                    <input 
                      required type="time" 
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none" 
                      value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} 
                    />
                  </div>

                  {/* Registration Logic Section */}
                  <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center mb-3">
                          <input 
                            id="reqRegistration"
                            type="checkbox"
                            className="w-4 h-4 text-secondary border-gray-300 rounded focus:ring-secondary"
                            checked={formData.requiresRegistration}
                            onChange={e => setFormData({...formData, requiresRegistration: e.target.checked})}
                          />
                          <label htmlFor="reqRegistration" className="ml-2 block text-sm font-bold text-gray-800">
                             Exige Inscrição Prévia?
                          </label>
                      </div>

                      {formData.requiresRegistration && (
                          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">Data Limite</label>
                                <input 
                                  required={formData.requiresRegistration}
                                  type="date" 
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-secondary focus:outline-none" 
                                  value={formData.registrationDeadlineDate || ''} 
                                  onChange={e => setFormData({...formData, registrationDeadlineDate: e.target.value})} 
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">Horário Limite</label>
                                <input 
                                  required={formData.requiresRegistration}
                                  type="time" 
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-secondary focus:outline-none" 
                                  value={formData.registrationDeadlineTime || ''} 
                                  onChange={e => setFormData({...formData, registrationDeadlineTime: e.target.value})} 
                                />
                              </div>
                          </div>
                      )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Modalidade</label>
                    <select 
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none"
                        value={formData.modality}
                        onChange={e => setFormData({...formData, modality: e.target.value as EventModality})}
                    >
                        <option value={EventModality.PRESENTIAL}>Presencial</option>
                        <option value={EventModality.ONLINE}>Online</option>
                    </select>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-gray-700">Quantidade de Vagas</label>
                     <input 
                        type="number" min="1"
                        placeholder="Em branco para ilimitado"
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none placeholder:text-gray-400" 
                        value={formData.spots || ''} 
                        onChange={e => setFormData({...formData, spots: e.target.value ? parseInt(e.target.value) : undefined})} 
                     />
                  </div>

                  <div className="md:col-span-2">
                      {formData.modality === EventModality.PRESENTIAL ? (
                          <>
                            <label className="block text-sm font-medium text-gray-700">Local do Evento</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-gray-400"><MapPin size={16}/></span>
                                <input 
                                    required type="text" 
                                    placeholder="Ex: Auditório B"
                                    className="mt-1 block w-full pl-9 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none" 
                                    value={formData.location || ''} 
                                    onChange={e => setFormData({...formData, location: e.target.value, link: ''})} 
                                />
                            </div>
                          </>
                      ) : (
                          <>
                            <label className="block text-sm font-medium text-gray-700">Link de Acesso</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-gray-400"><LinkIcon size={16}/></span>
                                <input 
                                    required type="url" 
                                    placeholder="https://..."
                                    className="mt-1 block w-full pl-9 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none" 
                                    value={formData.link || ''} 
                                    onChange={e => setFormData({...formData, link: e.target.value, location: ''})} 
                                />
                            </div>
                          </>
                      )}
                  </div>

                  <div className="md:col-span-2 border-t pt-4 mt-2">
                     <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Informações do Palestrante</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Nome do Palestrante</label>
                    <input 
                      required type="text" 
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none" 
                      value={formData.speaker} onChange={e => setFormData({...formData, speaker: e.target.value})} 
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Resumo sobre o Palestrante</label>
                    <textarea 
                      required rows={2}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none" 
                      value={formData.speakerBio} onChange={e => setFormData({...formData, speakerBio: e.target.value})} 
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Resumo sobre o Evento</label>
                    <textarea 
                      required rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none" 
                      value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} 
                    />
                  </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-secondary text-white rounded hover:bg-blue-600">Salvar Evento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {isDeleteModalOpen && eventToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-2xl border-t-4 border-red-500">
            <div className="flex items-start space-x-4">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Excluir Evento?</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Você tem certeza que deseja excluir o evento <strong>{eventToDelete.name}</strong>?
                </p>
                <p className="text-xs text-red-600 mt-2 font-medium">Esta ação não pode ser desfeita.</p>
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

export default EventsPage;