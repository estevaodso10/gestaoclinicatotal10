import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Room } from '../../types';
import { Plus, Edit, Trash, Home, AlertTriangle } from 'lucide-react';

const RoomsPage: React.FC = () => {
  const { rooms, addRoom, updateRoom, deleteRoom } = useApp();
  
  // States for Edit/Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<Partial<Room>>({
    name: '', description: ''
  });

  // States for Delete Confirmation Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  // Ordenar as salas alfabeticamente pelo nome antes de exibir
  const sortedRooms = [...rooms].sort((a, b) => a.name.localeCompare(b.name));

  // --- Handlers for Create/Edit ---
  const openModal = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setFormData(room);
    } else {
      setEditingRoom(null);
      setFormData({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoom) {
      updateRoom({ ...editingRoom, ...formData } as Room);
    } else {
      addRoom(formData as Omit<Room, 'id'>);
    }
    setIsModalOpen(false);
  };

  // --- Handlers for Delete ---
  const handleDeleteClick = (room: Room) => {
    setRoomToDelete(room);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (roomToDelete) {
      deleteRoom(roomToDelete.id);
      setIsDeleteModalOpen(false);
      setRoomToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestão de Salas</h2>
          <p className="text-gray-500 text-sm">Cadastre e gerencie as salas disponíveis para atendimento.</p>
        </div>
        <button onClick={() => openModal()} className="bg-secondary text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-600 transition">
          <Plus size={18} /> <span>Nova Sala</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedRooms.map((room) => (
          <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <div className="bg-blue-100 p-2 rounded-lg text-secondary">
                  <Home size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">{room.name}</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {room.description}
              </p>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
              <button 
                onClick={() => openModal(room)} 
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                title="Editar"
              >
                <Edit size={18} />
              </button>
              <button 
                onClick={() => handleDeleteClick(room)} 
                className="p-2 text-red-500 hover:bg-red-50 rounded-md transition"
                title="Excluir"
              >
                <Trash size={18} />
              </button>
            </div>
          </div>
        ))}
        {rooms.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed">
            Nenhuma sala cadastrada.
          </div>
        )}
      </div>

      {/* Modal: Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold mb-4">{editingRoom ? 'Editar Sala' : 'Nova Sala'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome da Sala</label>
                <input 
                  required 
                  type="text" 
                  placeholder="Ex: Sala 01 (Térreo)"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição / Recursos</label>
                <textarea 
                  required 
                  rows={4}
                  placeholder="Descreva os itens disponíveis (ex: Maca, Ar condicionado, Mesa...)"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-secondary text-white rounded hover:bg-blue-600 shadow-sm">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {isDeleteModalOpen && roomToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-2xl border-t-4 border-red-500">
            <div className="flex items-start space-x-4">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Excluir Sala?</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Você está prestes a excluir a sala <strong>{roomToDelete.name}</strong>.
                </p>
                <p className="text-sm text-red-600 font-medium mt-2">
                  Atenção: Esta ação removerá permanentemente todas as alocações e agendamentos vinculados a esta sala.
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
                <Trash size={16} className="mr-2"/> Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsPage;