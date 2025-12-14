import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Box, ArrowDownCircle, ArrowUpCircle, Clock, History, LayoutList, CheckCircle } from 'lucide-react';

const ProfessionalInventoryPage: React.FC = () => {
  const { inventory, loans, currentUser, requestLoan, returnLoan } = useApp();
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');

  if (!currentUser) return null;

  const myLoans = loans.filter(l => l.userId === currentUser.id && l.status === 'ACTIVE');
  
  // Histórico completo (Ativos e Devolvidos), ordenados por data mais recente
  const myHistory = loans
    .filter(l => l.userId === currentUser.id)
    .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  
  const handleRequest = (itemId: string) => {
      const success = requestLoan(currentUser.id, itemId);
      if(success) {
          // Could add toast here
      } else {
          alert('Não foi possível realizar o empréstimo.');
      }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Inventário</h2>
        <p className="text-gray-500 text-sm">Gerencie seus empréstimos de equipamentos e materiais.</p>
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
            <LayoutList size={18} className="mr-2"/>
            Solicitar e Ativos
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
            Histórico Completo
          </button>
        </nav>
      </div>

      {activeTab === 'ACTIVE' && (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Section 1: My Active Loans */}
            <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <ArrowUpCircle className="text-orange-500 mr-2" size={20}/> Meus Empréstimos Ativos
                </h2>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {myLoans.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retirada em</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {myLoans.map(loan => (
                                    <tr key={loan.id}>
                                        <td className="px-6 py-4 font-medium text-gray-900">{loan.itemName}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 flex items-center">
                                            <Clock size={14} className="mr-1"/> {formatDate(loan.requestDate)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => returnLoan(loan.id)}
                                                className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200 hover:bg-green-100 transition"
                                            >
                                                Devolver Item
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            Você não possui itens emprestados no momento.
                        </div>
                    )}
                </div>
            </div>

            <hr className="border-gray-200" />

            {/* Section 2: Available Inventory */}
            <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <ArrowDownCircle className="text-secondary mr-2" size={20}/> Solicitar Equipamento
                </h2>
                <p className="text-sm text-gray-500 mb-6">Selecione um item abaixo para registrar a retirada.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {inventory.map(item => {
                        const isAvailable = item.availableQuantity > 0;
                        return (
                            <div key={item.id} className={`bg-white p-5 rounded-xl shadow-sm border ${isAvailable ? 'border-gray-100' : 'border-gray-200 bg-gray-50'} transition`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-lg ${isAvailable ? 'bg-blue-50 text-secondary' : 'bg-gray-200 text-gray-400'}`}>
                                        <Box size={24} />
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {item.availableQuantity} Disp.
                                    </span>
                                </div>
                                <h3 className={`font-bold text-lg mb-1 ${!isAvailable && 'text-gray-500'}`}>{item.name}</h3>
                                <p className="text-xs text-gray-500 mb-4">Total no acervo: {item.totalQuantity}</p>
                                
                                <button 
                                    onClick={() => handleRequest(item.id)}
                                    disabled={!isAvailable}
                                    className={`w-full py-2 rounded-lg font-medium text-sm transition ${
                                        isAvailable 
                                        ? 'bg-secondary text-white hover:bg-blue-600 shadow-sm' 
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    {isAvailable ? 'Solicitar Empréstimo' : 'Indisponível'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="space-y-6 animate-in fade-in duration-300">
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-semibold text-gray-700">Histórico de Movimentações</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Retirada</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Devolução</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {myHistory.map(loan => (
                            <tr key={loan.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{loan.itemName}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(loan.requestDate)}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {loan.status === 'RETURNED' ? formatDate(loan.returnDate) : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {loan.status === 'ACTIVE' 
                                        ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Em Aberto</span>
                                        : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><CheckCircle size={12} className="mr-1"/> Devolvido</span>
                                    }
                                </td>
                            </tr>
                        ))}
                        {myHistory.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    Nenhum histórico de empréstimo encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}

    </div>
  );
};

export default ProfessionalInventoryPage;