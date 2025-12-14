import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Patient } from '../../types';
import { Calendar, Plus, User, Phone, Edit, Trash2, AlertTriangle } from 'lucide-react';

const PatientsPage: React.FC = () => {
  const { currentUser, patients, allocations, rooms, addPatient, updatePatient, deletePatient } = useApp();
  
  const myPatients = patients.filter(p => p.professionalId === currentUser?.id);
  const mySlots = allocations.filter(a => a.userId === currentUser?.id);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  
  // Delete Confirmation States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  const [formData, setFormData] = useState<Partial<Patient>>({
    name: '', email: '', phone: '', parentName: '', parentContact: '', allocationId: ''
  });

  // --- HANDLERS ---

  const openModal = (patient?: Patient) => {
    if (patient) {
        setEditingPatientId(patient.id);
        setFormData({ ...patient });
    } else {
        setEditingPatientId(null);
        setFormData({ name: '', email: '', phone: '', parentName: '', parentContact: '', allocationId: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
      setIsModalOpen(false);
      setEditingPatientId(null);
      setFormData({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
        if (editingPatientId) {
            // Update
            updatePatient({ 
                ...formData, 
                id: editingPatientId, 
                professionalId: currentUser.id 
            } as Patient);
        } else {
            // Create
            addPatient({ 
                ...formData, 
                professionalId: currentUser.id 
            } as Omit<Patient, 'id'>);
        }
        closeModal();
    }
  };

  const handleDeleteClick = (patient: Patient) => {
      setPatientToDelete(patient);
      setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
      if (patientToDelete) {
          deletePatient(patientToDelete.id);
          setIsDeleteModalOpen(false);
          setPatientToDelete(null);
      }
  };

  const getSlotDetails = (allocId?: string) => {
    const alloc = allocations.find(a => a.id === allocId);
    if (!alloc) return 'Não Agendado';
    const room = rooms.find(r => r.id === alloc.roomId);
    return `${alloc.day}, ${alloc.shift} - ${room?.name}`;
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Meus Pacientes</h2>
            <p className="text-gray-500 text-sm">Gerencie prontuários e agendamentos.</p>
        </div>
        <button onClick={() => openModal()} className="bg-secondary text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-600 transition">
          <Plus size={18} /> <span>Novo Paciente</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {myPatients.length === 0 && <p className="text-gray-500 col-span-3 text-center py-10 border-2 border-dashed rounded-xl">Nenhum paciente cadastrado.</p>}
         {myPatients.map(patient => (
            <div key={patient.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition relative group">
               
               <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                     <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                        <User size={20} />
                     </div>
                     <div className="overflow-hidden">
                        <h3 className="font-bold text-gray-800 truncate pr-2">{patient.name}</h3>
                        <p className="text-xs text-gray-500 truncate">{patient.email}</p>
                     </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-1">
                      <button 
                        onClick={() => openModal(patient)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                        title="Editar"
                      >
                          <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(patient)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                        title="Excluir"
                      >
                          <Trash2 size={16} />
                      </button>
                  </div>
               </div>
               
               <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-2"><Phone size={14}/> <span>{patient.phone}</span></div>
                  {patient.parentName && (
                      <div className="flex flex-col text-xs bg-orange-50 text-orange-800 p-2 rounded border border-orange-100 mt-2">
                        <span className="font-semibold">Responsável: {patient.parentName}</span>
                        {patient.parentContact && (
                            <span className="flex items-center mt-1 text-orange-700">
                                <Phone size={10} className="mr-1"/> {patient.parentContact}
                            </span>
                        )}
                      </div>
                  )}
               </div>

               <div className="pt-4 border-t border-gray-100">
                  <div className={`flex items-center space-x-2 text-sm font-medium ${patient.allocationId ? 'text-secondary' : 'text-gray-400'}`}>
                     <Calendar size={16} />
                     <span>{getSlotDetails(patient.allocationId)}</span>
                  </div>
               </div>
            </div>
         ))}
      </div>

       {/* Modal: Create / Edit */}
       {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-xl">
            <h3 className="text-xl font-bold mb-4">{editingPatientId ? 'Editar Paciente' : 'Cadastrar Paciente'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                <input required type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none" 
                  value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Telefone</label>
                    <input required type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none" 
                    value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">E-mail</label>
                    <input type="email" className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none" 
                    value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              
              <div>
                 <label className="block text-sm font-medium text-gray-700">Agendar Horário (Sessão Fixa)</label>
                 <select className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none"
                   value={formData.allocationId || ''} onChange={e => setFormData({...formData, allocationId: e.target.value})}
                 >
                    <option value="">-- Sem Agendamento Fixo --</option>
                    {mySlots.map(slot => (
                        <option key={slot.id} value={slot.id}>
                            {slot.day} - {slot.shift} ({rooms.find(r => r.id === slot.roomId)?.name})
                        </option>
                    ))}
                 </select>
                 <p className="text-xs text-gray-500 mt-1">Lista apenas as salas alocadas para você pela administração.</p>
              </div>

              <div className="pt-2 border-t mt-4 bg-gray-50 p-3 rounded-md">
                  <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Dados do Responsável (Opcional)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome do Pai/Mãe</label>
                        <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none" 
                        value={formData.parentName || ''} onChange={e => setFormData({...formData, parentName: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Contato (Tel/Cel)</label>
                        <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none" 
                        value={formData.parentContact || ''} onChange={e => setFormData({...formData, parentContact: e.target.value})} />
                    </div>
                  </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-blue-600 shadow-sm font-medium">
                    {editingPatientId ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {isDeleteModalOpen && patientToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-sm shadow-2xl border-t-4 border-red-500">
            <div className="flex items-start space-x-4">
              <div className="bg-red-100 p-2 rounded-full flex-shrink-0">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Excluir Paciente?</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Tem certeza que deseja remover o paciente <strong>{patientToDelete.name}</strong>?
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
                <Trash2 size={16} className="mr-2"/> Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsPage;