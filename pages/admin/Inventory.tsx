import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { InventoryItem, Role } from '../../types';
import { Box, Plus, Edit, Trash2, CheckCircle, RotateCcw, AlertTriangle, History, Search, X, Calendar } from 'lucide-react';

const InventoryPage: React.FC = () => {
  const { inventory, loans, users, addInventoryItem, updateInventoryItem, deleteInventoryItem, returnLoan } = useApp();

  // --- STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({ name: '', totalQuantity: 1 });
  const [activeTab, setActiveTab] = useState<'STOCK' | 'LOANS' | 'HISTORY'>('STOCK');

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  // History Filters State
  const [historyFilters, setHistoryFilters] = useState({
    startDate: '',
    endDate: '',
    professionalId: '',
    itemName: ''
  });

  // --- SORTING ---
  // Ordenar inventário alfabeticamente
  const sortedInventory = [...inventory].sort((a, b) => a.name.localeCompare(b.name));

  // --- CRUD HANDLERS ---
  const openModal = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({ name: '', totalQuantity: 1 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem && formData.name && (formData.totalQuantity !== undefined && formData.totalQuantity > 0)) {
       updateInventoryItem(editingItem.id, formData.name, formData.totalQuantity);
    } else if (formData.name && (formData.totalQuantity !== undefined && formData.totalQuantity > 0)) {
       addInventoryItem({ 
           name: formData.name, 
           totalQuantity: formData.totalQuantity 
        });
    }
    setIsModalOpen(false);
  };

  const handleDeleteClick = (item: InventoryItem) => {
      setItemToDelete(item);
      setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
      if(itemToDelete) {
          deleteInventoryItem(itemToDelete.id);
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
      }
  };

  const clearHistoryFilters = () => {
      setHistoryFilters({ startDate: '', endDate: '', professionalId: '', itemName: '' });
  };

  // --- HELPERS ---
  const getUserName = (userId: string) => {
      const user = users.find(u => u.id === userId);
      return user ? user.name : 'Usuário Desconhecido';
  };
  
  const formatDate = (dateStr: string) => {
      try {
        return new Date(dateStr).toLocaleString('pt-BR');
      } catch (e) {
        return '-';
      }
  };

  // Ensure loans is defined before filtering
  const activeLoans = (loans || []).filter(l => l.status === 'ACTIVE');

  // Filtered History Logic
  const filteredHistory = useMemo(() => {
    return loans.filter(loan => {
        // Filter by Professional
        if (historyFilters.professionalId && loan.userId !== historyFilters.professionalId) return false;
        
        // Filter by Item Name (Case insensitive)
        if (historyFilters.itemName && !loan.itemName.toLowerCase().includes(historyFilters.itemName.toLowerCase())) return false;

        // Filter by Date Range (using requestDate)
        if (historyFilters.startDate) {
            if (new Date(loan.requestDate) < new Date(historyFilters.startDate)) return false;
        }
        if (historyFilters.endDate) {
            // End of the selected day
            const end = new Date(historyFilters.endDate);
            end.setHours(23, 59, 59, 999);
            if (new Date(loan.requestDate) > end) return false;
        }

        return true;
    }).sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()); // Sort desc
  }, [loans, historyFilters]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inventário e Empréstimos</h2>
          <p className="text-gray-500 text-sm">Gerencie o estoque de equipamentos e acompanhe devoluções.</p>
        </div>
        
        {activeTab === 'STOCK' && (
            <button onClick={() => openModal()} className="bg-secondary text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-600 transition w-full md:w-auto justify-center">
                <Plus size={18} /> <span>Novo Item</span>
            </button>
        )}
      </div>

      {/* Tabs - Scrollable on mobile */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-8 min-w-max">
          <button
            onClick={() => setActiveTab('STOCK')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'STOCK'
                ? 'border-secondary text-secondary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Controle de Estoque
          </button>
          <button
            onClick={() => setActiveTab('LOANS')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'LOANS'
                ? 'border-secondary text-secondary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Empréstimos Ativos
            {activeLoans.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                    {activeLoans.length}
                </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'HISTORY'
                ? 'border-secondary text-secondary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Histórico Completo
          </button>
        </nav>
      </div>

      {/* STOCK TAB */}
      {activeTab === 'STOCK' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedInventory.map(item => (
                <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-blue-50 text-secondary rounded-lg">
                                <Box size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">{item.name}</h3>
                                <p className="text-sm text-gray-500">Total: {item.totalQuantity}</p>
                            </div>
                        </div>
                        <div className="flex space-x-1">
                             <button onClick={() => openModal(item)} className="p-1 text-gray-400 hover:text-indigo-600"><Edit size={18}/></button>
                             <button onClick={() => handleDeleteClick(item)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={18}/></button>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Disponível:</span>
                            <span className={`font-bold px-2 py-1 rounded ${
                                item.availableQuantity > 0 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                                {item.availableQuantity} un
                            </span>
                        </div>
                    </div>
                </div>
            ))}
            {inventory.length === 0 && (
                <div className="col-span-3 text-center py-12 text-gray-400 border-2 border-dashed rounded-xl">
                    Nenhum item cadastrado no estoque.
                </div>
            )}
          </div>
      )}

      {/* LOANS TAB */}
      {activeTab === 'LOANS' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                      <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Item</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Profissional</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Retirada</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Ação</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                      {activeLoans.map(loan => (
                          <tr key={loan.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{loan.itemName}</td>
                              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                                        {getUserName(loan.userId).charAt(0)}
                                      </div>
                                      <span>{getUserName(loan.userId)}</span>
                                  </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(loan.requestDate)}</td>
                              <td className="px-6 py-4 text-right whitespace-nowrap">
                                  <div className="flex justify-end w-full">
                                    <button 
                                        onClick={() => returnLoan(loan.id)}
                                        className="text-secondary hover:text-blue-800 text-sm font-medium flex items-center"
                                    >
                                        <RotateCcw size={16} className="mr-1"/> Receber
                                    </button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                      {activeLoans.length === 0 && (
                          <tr>
                              <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                  <div className="flex flex-col items-center justify-center">
                                      <CheckCircle size={32} className="text-green-500 mb-2"/>
                                      <span>Nenhum empréstimo ativo no momento.</span>
                                  </div>
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
             </div>
          </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'HISTORY' && (
          <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-700">
                      <Search size={16} /> Filtros de Pesquisa
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                      <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Data Início</label>
                          <input 
                              type="date" 
                              className="w-full border rounded-md p-2 text-sm"
                              value={historyFilters.startDate}
                              onChange={e => setHistoryFilters({...historyFilters, startDate: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Data Fim</label>
                          <input 
                              type="date" 
                              className="w-full border rounded-md p-2 text-sm"
                              value={historyFilters.endDate}
                              onChange={e => setHistoryFilters({...historyFilters, endDate: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Item</label>
                          <input 
                              type="text" 
                              placeholder="Nome do item..."
                              className="w-full border rounded-md p-2 text-sm"
                              value={historyFilters.itemName}
                              onChange={e => setHistoryFilters({...historyFilters, itemName: e.target.value})}
                          />
                      </div>
                      <div className="flex gap-2">
                           <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Profissional</label>
                                <select 
                                    className="w-full border rounded-md p-2 text-sm"
                                    value={historyFilters.professionalId}
                                    onChange={e => setHistoryFilters({...historyFilters, professionalId: e.target.value})}
                                >
                                    <option value="">Todos</option>
                                    {users.filter(u => u.role === Role.PROFESSIONAL).map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                           </div>
                           <button 
                                onClick={clearHistoryFilters}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-md h-[38px] w-[38px] flex items-center justify-center transition"
                                title="Limpar Filtros"
                           >
                               <X size={16} />
                           </button>
                      </div>
                  </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                          <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Data Retirada</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Item</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Profissional</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Data Devolução</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                          {filteredHistory.map(loan => (
                              <tr key={loan.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(loan.requestDate)}</td>
                                  <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{loan.itemName}</td>
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{getUserName(loan.userId)}</td>
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                      {loan.returnDate ? formatDate(loan.returnDate) : '-'}
                                  </td>
                                  <td className="px-6 py-4 text-right whitespace-nowrap">
                                      {loan.status === 'ACTIVE' 
                                        ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Ativo</span>
                                        : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Devolvido</span>
                                      }
                                  </td>
                              </tr>
                          ))}
                          {filteredHistory.length === 0 && (
                              <tr>
                                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                      <div className="flex flex-col items-center justify-center">
                                          <History size={32} className="text-gray-300 mb-2"/>
                                          <span>Nenhum registro encontrado para os filtros selecionados.</span>
                                      </div>
                                  </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
                </div>
              </div>
          </div>
      )}

      {/* Modal: Create/Edit Item */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold mb-4">{editingItem ? 'Editar Item' : 'Novo Item'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome do Item</label>
                <input 
                  required type="text" 
                  className="mt-1 block w-full border rounded-md p-2" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantidade Total</label>
                <input 
                  required type="number" min="1"
                  className="mt-1 block w-full border rounded-md p-2" 
                  value={formData.totalQuantity || ''} 
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    setFormData({...formData, totalQuantity: isNaN(val) ? 0 : val});
                  }} 
                />
                {editingItem && <p className="text-xs text-yellow-600 mt-1">Alterar o total ajustará a quantidade disponível automaticamente.</p>}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-gray-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-secondary text-white rounded hover:bg-blue-600">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-2xl border-t-4 border-red-500">
            <div className="flex items-start space-x-4">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Excluir Item?</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Você tem certeza que deseja excluir o item <strong>{itemToDelete.name}</strong> do inventário?
                </p>
                <p className="text-sm text-red-600 mt-1">
                  Atenção: Esta ação não pode ser desfeita.
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

export default InventoryPage;