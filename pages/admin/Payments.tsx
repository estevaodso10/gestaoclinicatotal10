import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Role, Payment } from '../../types';
import { DAYS_OF_WEEK, SHIFTS } from '../../constants';
import { 
    Search, UserCircle, Calendar, CreditCard, 
    CheckCircle, Clock, DollarSign, ChevronRight, X, 
    Edit, Trash2, AlertTriangle, Save, Filter
} from 'lucide-react';

const PaymentsPage: React.FC = () => {
  const { users, payments, allocations, rooms, addPayment, updatePayment, deletePayment, confirmPayment } = useApp();
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'OK'>('ALL');
  
  // State for new payment form
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentDueDate, setNewPaymentDueDate] = useState('');

  // State for confirming payment
  const [confirmingPaymentId, setConfirmingPaymentId] = useState<string | null>(null);
  const [paymentDateInput, setPaymentDateInput] = useState(new Date().toISOString().split('T')[0]);

  // State for Editing
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  // State for Deleting
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  // Helper to calculate stats (Moved up to be used in filtering)
  const getPaymentStats = (userId: string) => {
    const userPayments = payments.filter(p => p.userId === userId);
    const pending = userPayments.filter(p => p.status === 'PENDING').length;
    return { count: userPayments.length, pending };
  };

  // Filter professionals based on Search and Payment Status
  const professionals = users.filter(u => {
    // 1. Must be a professional
    if (u.role !== Role.PROFESSIONAL) return false;
    
    // 2. Search Term check
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // 3. Status Filter check
    if (filterStatus === 'ALL') return true;
    
    const stats = getPaymentStats(u.id);
    if (filterStatus === 'PENDING') return stats.pending > 0;
    if (filterStatus === 'OK') return stats.pending === 0;
    
    return true;
  });

  const handleCreateCharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPaymentAmount || !newPaymentDueDate) return;

    addPayment({
        userId: selectedUser.id,
        amount: parseFloat(newPaymentAmount),
        dueDate: newPaymentDueDate
    });

    setNewPaymentAmount('');
    setNewPaymentDueDate('');
  };

  const handleConfirmPayment = () => {
    if (confirmingPaymentId && paymentDateInput) {
        confirmPayment(confirmingPaymentId, paymentDateInput);
        setConfirmingPaymentId(null);
    }
  };

  // --- Handlers for Edit/Delete ---

  const handleEditClick = (payment: Payment) => {
    setEditingPayment(payment);
    setIsEditModalOpen(true);
  };

  const handleUpdatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPayment) {
        // If status changed to PENDING, remove paidDate
        const payload = { ...editingPayment };
        if (payload.status === 'PENDING') {
            payload.paidDate = undefined;
        }
        updatePayment(payload);
        setIsEditModalOpen(false);
        setEditingPayment(null);
    }
  };

  const handleDeleteClick = (payment: Payment) => {
    setPaymentToDelete(payment);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (paymentToDelete) {
        deletePayment(paymentToDelete.id);
        setIsDeleteModalOpen(false);
        setPaymentToDelete(null);
    }
  };


  const formatCurrency = (val: number) => {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr?: string) => {
      if(!dateStr) return '-';
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
  };

  const formatMonthYear = (dateStr?: string) => {
      if(!dateStr) return '-';
      const [y, m] = dateStr.split('-');
      return `${m}/${y}`;
  };

  return (
    <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Controle de Pagamentos</h2>
            <p className="text-gray-500 text-sm">Gerencie cobranças e recebimentos dos profissionais.</p>
        </div>

        {/* Filters Container */}
        <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                </div>
                <input 
                    type="text"
                    placeholder="Buscar profissional..."
                    className="pl-10 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-secondary focus:outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Status Filter */}
            <div className="relative w-full sm:w-48">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter size={18} className="text-gray-400" />
                </div>
                <select
                    className="pl-10 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-secondary focus:outline-none appearance-none bg-white"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                >
                    <option value="ALL">Todos os Status</option>
                    <option value="PENDING">Com Pendências</option>
                    <option value="OK">Em Dia</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronRight className="rotate-90 text-gray-400" size={16}/>
                </div>
            </div>
        </div>

        {/* List of Professionals */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {professionals.length === 0 && (
                <div className="col-span-3 text-center py-10 bg-white rounded-xl border border-dashed text-gray-400">
                    Nenhum profissional encontrado com os filtros atuais.
                </div>
            )}
            {professionals.map(prof => {
                const stats = getPaymentStats(prof.id);
                return (
                    <div key={prof.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition flex flex-col justify-between">
                        <div>
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-12 h-12 bg-blue-50 text-secondary rounded-full flex items-center justify-center">
                                    <UserCircle size={28} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{prof.name}</h3>
                                    <p className="text-xs text-gray-500">{prof.specialty}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg text-sm mb-4">
                                <span className="text-gray-600">Pendências:</span>
                                <span className={`font-bold ${stats.pending > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                    {stats.pending > 0 ? `${stats.pending} fatura(s)` : 'Em dia'}
                                </span>
                            </div>
                        </div>

                        <button 
                            onClick={() => setSelectedUser(prof)}
                            className="w-full mt-2 bg-white border border-secondary text-secondary hover:bg-secondary hover:text-white py-2 rounded-lg transition text-sm font-medium flex items-center justify-center"
                        >
                            <span>Gerenciar Financeiro</span>
                            <ChevronRight size={16} className="ml-1" />
                        </button>
                    </div>
                );
            })}
        </div>

        {/* Modal: Financial Details */}
        {selectedUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <div className="flex items-center space-x-3">
                             <div className="w-10 h-10 bg-secondary text-white rounded-full flex items-center justify-center font-bold">
                                {selectedUser.name.charAt(0)}
                             </div>
                             <div>
                                 <h3 className="text-xl font-bold text-gray-800">{selectedUser.name}</h3>
                                 <p className="text-sm text-gray-500">{selectedUser.email} • {selectedUser.specialty}</p>
                             </div>
                        </div>
                        <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* Section 1: Allocations (Context for Charging) */}
                        <section>
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                                <Calendar size={16} className="mr-2"/> Salas e Horários Alocados
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {allocations
                                    .filter(a => a.userId === selectedUser.id)
                                    .sort((a, b) => {
                                        // Sort by Day Index first
                                        const dayDiff = DAYS_OF_WEEK.indexOf(a.day) - DAYS_OF_WEEK.indexOf(b.day);
                                        if (dayDiff !== 0) return dayDiff;
                                        // Then by Shift Index
                                        return SHIFTS.indexOf(a.shift) - SHIFTS.indexOf(b.shift);
                                    })
                                    .map(alloc => (
                                    <div key={alloc.id} className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-sm">
                                        <p className="font-semibold text-blue-900">{alloc.day}</p>
                                        <p className="text-blue-700">{alloc.shift}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {rooms.find(r => r.id === alloc.roomId)?.name}
                                        </p>
                                    </div>
                                ))}
                                {allocations.filter(a => a.userId === selectedUser.id).length === 0 && (
                                    <p className="text-sm text-gray-400 italic">Nenhuma sala alocada para este profissional.</p>
                                )}
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        {/* Section 2: Create Charge */}
                        <section>
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                                <CreditCard size={16} className="mr-2"/> Nova Cobrança
                            </h4>
                            <form onSubmit={handleCreateCharge} className="flex flex-col sm:flex-row gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="w-full sm:w-1/3">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Valor (R$)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-500">R$</span>
                                        <input 
                                            type="number" step="0.01" required
                                            className="w-full pl-8 border border-gray-300 rounded-md p-2 text-sm"
                                            value={newPaymentAmount}
                                            onChange={e => setNewPaymentAmount(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="w-full sm:w-1/3">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Data de Vencimento</label>
                                    <input 
                                        type="date" required
                                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                        value={newPaymentDueDate}
                                        onChange={e => setNewPaymentDueDate(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition">
                                    Gerar Cobrança
                                </button>
                            </form>
                        </section>

                        {/* Section 3: History */}
                        <section>
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                                <DollarSign size={16} className="mr-2"/> Histórico Financeiro
                            </h4>
                            <div className="overflow-hidden border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mês/Ano</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagamento Realizado</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {payments.filter(p => p.userId === selectedUser.id).map(payment => (
                                            <tr key={payment.id}>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-700">{formatMonthYear(payment.dueDate)}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">{formatDate(payment.dueDate)}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    {payment.status === 'PAID' 
                                                        ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1"/> Pago</span>
                                                        : <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={12} className="mr-1"/> Pendente</span>
                                                    }
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500">{payment.paidDate ? formatDate(payment.paidDate) : '-'}</td>
                                                <td className="px-4 py-3 text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        {payment.status === 'PENDING' && (
                                                            confirmingPaymentId === payment.id ? (
                                                                <>
                                                                    <input 
                                                                        type="date" 
                                                                        className="border rounded px-1 py-1 text-xs w-28"
                                                                        value={paymentDateInput}
                                                                        onChange={e => setPaymentDateInput(e.target.value)}
                                                                    />
                                                                    <button onClick={handleConfirmPayment} className="text-green-600 hover:text-green-900 text-xs font-bold">OK</button>
                                                                    <button onClick={() => setConfirmingPaymentId(null)} className="text-gray-400 hover:text-gray-600">
                                                                        <X size={14}/>
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button 
                                                                    onClick={() => {
                                                                        setConfirmingPaymentId(payment.id);
                                                                        setPaymentDateInput(new Date().toISOString().split('T')[0]);
                                                                    }}
                                                                    className="text-secondary hover:text-blue-700 underline text-xs mr-2"
                                                                >
                                                                    Confirmar Pagto
                                                                </button>
                                                            )
                                                        )}
                                                        
                                                        {/* Edit / Delete Buttons */}
                                                        <button 
                                                            onClick={() => handleEditClick(payment)} 
                                                            className="text-gray-400 hover:text-indigo-600 p-1" 
                                                            title="Editar"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteClick(payment)} 
                                                            className="text-gray-400 hover:text-red-600 p-1" 
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {payments.filter(p => p.userId === selectedUser.id).length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">
                                                    Nenhum registro financeiro encontrado.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>

                    <div className="p-4 border-t bg-gray-50 flex justify-end">
                        <button 
                            onClick={() => setSelectedUser(null)}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 text-sm font-medium hover:bg-gray-100"
                        >
                            Fechar
                        </button>
                    </div>

                    {/* Nested Modal: Edit Payment */}
                    {isEditModalOpen && editingPayment && (
                        <div className="absolute inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-2xl">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold">Editar Cobrança</h3>
                                    <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={handleUpdatePayment} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Valor</label>
                                        <input 
                                            type="number" step="0.01" 
                                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                            value={editingPayment.amount}
                                            onChange={e => setEditingPayment({...editingPayment, amount: parseFloat(e.target.value)})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Vencimento</label>
                                        <input 
                                            type="date"
                                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                            value={editingPayment.dueDate}
                                            onChange={e => setEditingPayment({...editingPayment, dueDate: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Status</label>
                                        <select 
                                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                            value={editingPayment.status}
                                            onChange={e => setEditingPayment({...editingPayment, status: e.target.value as 'PENDING' | 'PAID'})}
                                        >
                                            <option value="PENDING">Pendente</option>
                                            <option value="PAID">Pago</option>
                                        </select>
                                    </div>
                                    {editingPayment.status === 'PAID' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Data do Pagamento</label>
                                            <input 
                                                type="date"
                                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                                value={editingPayment.paidDate || ''}
                                                onChange={e => setEditingPayment({...editingPayment, paidDate: e.target.value})}
                                            />
                                        </div>
                                    )}
                                    <div className="flex justify-end space-x-2 pt-4">
                                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Cancelar</button>
                                        <button type="submit" className="px-4 py-2 bg-secondary text-white rounded hover:bg-blue-600 flex items-center">
                                            <Save size={16} className="mr-2"/> Salvar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Nested Modal: Delete Confirmation */}
                    {isDeleteModalOpen && paymentToDelete && (
                        <div className="absolute inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                            <div className="bg-white p-6 rounded-lg w-full max-w-sm shadow-2xl border-t-4 border-red-500">
                                <div className="flex items-start space-x-3">
                                    <div className="bg-red-100 p-2 rounded-full flex-shrink-0">
                                        <AlertTriangle className="text-red-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Excluir Cobrança?</h3>
                                        <p className="text-sm text-gray-500 mt-2">
                                            Tem certeza que deseja excluir a cobrança no valor de <strong>{formatCurrency(paymentToDelete.amount)}</strong>?
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-2 mt-6">
                                    <button onClick={() => setIsDeleteModalOpen(false)} className="px-3 py-2 border rounded text-gray-600 hover:bg-gray-50 text-sm">Cancelar</button>
                                    <button onClick={handleConfirmDelete} className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm flex items-center">
                                        <Trash2 size={16} className="mr-1"/> Confirmar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        )}
    </div>
  );
};

export default PaymentsPage;