import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FinancialTransaction, TransactionType, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../../types';
import { 
    DollarSign, TrendingUp, TrendingDown, Plus, Filter, 
    Trash2, Edit, Calendar, List, PieChart, ArrowUp, ArrowDown
} from 'lucide-react';

const FinancialPage: React.FC = () => {
  const { financialTransactions, addFinancialTransaction, updateFinancialTransaction, deleteFinancialTransaction } = useApp();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'TRANSACTIONS' | 'REPORTS'>('TRANSACTIONS');
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [formData, setFormData] = useState<Partial<FinancialTransaction>>({
      type: 'INCOME',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      category: INCOME_CATEGORIES[0],
      description: ''
  });

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transToDelete, setTransToDelete] = useState<FinancialTransaction | null>(null);

  // --- FILTERED DATA ---
  const currentMonthTransactions = useMemo(() => {
      return financialTransactions.filter(t => t.date.startsWith(filterMonth));
  }, [financialTransactions, filterMonth]);

  const totals = useMemo(() => {
      const income = currentMonthTransactions.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
      const expense = currentMonthTransactions.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);
      return { income, expense, balance: income - expense };
  }, [currentMonthTransactions]);

  const categoryBreakdown = useMemo(() => {
      const breakdown: Record<string, { income: number, expense: number }> = {};
      
      // Initialize categories
      [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].forEach(cat => {
          breakdown[cat] = { income: 0, expense: 0 };
      });

      currentMonthTransactions.forEach(t => {
          if (!breakdown[t.category]) breakdown[t.category] = { income: 0, expense: 0 };
          
          if (t.type === 'INCOME') breakdown[t.category].income += t.amount;
          else breakdown[t.category].expense += t.amount;
      });

      // Filter out empty categories
      return Object.entries(breakdown)
          .filter(([_, vals]) => vals.income > 0 || vals.expense > 0)
          .sort((a, b) => (b[1].income + b[1].expense) - (a[1].income + a[1].expense));
  }, [currentMonthTransactions]);

  // --- HANDLERS ---

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (dateStr: string) => {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
  };

  const openModal = (trans?: FinancialTransaction) => {
      if (trans) {
          setEditingTransaction(trans);
          setFormData({ ...trans });
      } else {
          setEditingTransaction(null);
          setFormData({
            type: 'INCOME',
            date: new Date().toISOString().split('T')[0],
            amount: 0,
            category: INCOME_CATEGORIES[0],
            description: ''
          });
      }
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.description || !formData.amount || !formData.date || !formData.category) return;

      if (editingTransaction) {
          updateFinancialTransaction({ ...editingTransaction, ...formData } as FinancialTransaction);
      } else {
          addFinancialTransaction(formData as Omit<FinancialTransaction, 'id' | 'createdAt'>);
      }
      setIsModalOpen(false);
  };

  const handleDelete = (trans: FinancialTransaction) => {
      setTransToDelete(trans);
      setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
      if (transToDelete) {
          deleteFinancialTransaction(transToDelete.id);
          setIsDeleteModalOpen(false);
          setTransToDelete(null);
      }
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Gestão Financeira</h2>
                <p className="text-gray-500 text-sm">Controle de receitas, despesas e fluxo de caixa.</p>
            </div>
            
            <div className="flex items-center space-x-3">
                 <div className="relative">
                    <input 
                        type="month" 
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-secondary focus:outline-none"
                    />
                 </div>
                 {activeTab === 'TRANSACTIONS' && (
                    <button onClick={() => openModal()} className="bg-secondary text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-600 transition">
                        <Plus size={18} /> <span className="hidden sm:inline">Novo Lançamento</span>
                    </button>
                 )}
            </div>
       </div>

       {/* Tabs */}
       <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
                <button
                    onClick={() => setActiveTab('TRANSACTIONS')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === 'TRANSACTIONS'
                        ? 'border-secondary text-secondary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    <List size={18} className="mr-2"/>
                    Lançamentos
                </button>
                <button
                    onClick={() => setActiveTab('REPORTS')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === 'REPORTS'
                        ? 'border-secondary text-secondary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    <PieChart size={18} className="mr-2"/>
                    Relatórios e Dashboards
                </button>
            </nav>
       </div>

       {/* Summary Cards (Always Visible or Top of Tabs) */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                        <TrendingUp size={24} />
                    </div>
                    <span className="text-sm font-medium text-gray-500">Receitas</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(totals.income)}</h3>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                        <TrendingDown size={24} />
                    </div>
                    <span className="text-sm font-medium text-gray-500">Despesas</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(totals.expense)}</h3>
            </div>
            <div className={`p-6 rounded-xl shadow-sm border flex flex-col justify-between ${totals.balance >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>
                <div className="flex items-center space-x-3 mb-2">
                    <div className={`p-2 rounded-lg ${totals.balance >= 0 ? 'bg-blue-200 text-blue-700' : 'bg-red-200 text-red-700'}`}>
                        <DollarSign size={24} />
                    </div>
                    <span className={`text-sm font-medium ${totals.balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>Saldo Final</span>
                </div>
                <h3 className={`text-2xl font-bold ${totals.balance >= 0 ? 'text-blue-900' : 'text-red-900'}`}>{formatCurrency(totals.balance)}</h3>
            </div>
       </div>

       {/* TAB CONTENT: TRANSACTIONS */}
       {activeTab === 'TRANSACTIONS' && (
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {currentMonthTransactions
                                .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map(t => (
                                <tr key={t.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(t.date)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${t.type === 'INCOME' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {t.category}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                        {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => openModal(t)} className="text-indigo-600 hover:text-indigo-900 mr-3"><Edit size={16} /></button>
                                        <button onClick={() => handleDelete(t)} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {currentMonthTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nenhum lançamento neste mês.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
           </div>
       )}

       {/* TAB CONTENT: REPORTS */}
       {activeTab === 'REPORTS' && (
           <div className="space-y-6">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                   <h3 className="text-lg font-bold text-gray-800 mb-6">Detalhamento por Categoria</h3>
                   
                   <div className="space-y-4">
                       {categoryBreakdown.map(([cat, vals]) => {
                           const totalVolume = totals.income + totals.expense; // Just for visual proportion relative to flow
                           const catTotal = vals.income + vals.expense;
                           const percentage = totalVolume > 0 ? (catTotal / totalVolume) * 100 : 0;
                           
                           return (
                               <div key={cat} className="space-y-1">
                                   <div className="flex justify-between items-center text-sm">
                                       <span className="font-medium text-gray-700">{cat}</span>
                                       <div className="flex space-x-4">
                                            {vals.income > 0 && <span className="text-green-600 font-medium">Rec: {formatCurrency(vals.income)}</span>}
                                            {vals.expense > 0 && <span className="text-red-600 font-medium">Desp: {formatCurrency(vals.expense)}</span>}
                                       </div>
                                   </div>
                                   <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden flex">
                                       {vals.income > 0 && (
                                           <div className="bg-green-500 h-2.5" style={{ width: `${(vals.income / (totals.income + totals.expense)) * 100}%` }}></div>
                                       )}
                                       {vals.expense > 0 && (
                                           <div className="bg-red-500 h-2.5" style={{ width: `${(vals.expense / (totals.income + totals.expense)) * 100}%` }}></div>
                                       )}
                                   </div>
                               </div>
                           );
                       })}
                       {categoryBreakdown.length === 0 && (
                           <p className="text-center text-gray-400">Sem dados para exibir.</p>
                       )}
                   </div>
               </div>

               <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                   <h4 className="font-bold text-blue-800 mb-2">Resumo do Mês</h4>
                   <p className="text-sm text-blue-700">
                       Neste mês de <strong>{filterMonth}</strong>, o saldo operacional é de <strong>{formatCurrency(totals.balance)}</strong>.
                       {totals.income > 0 && totals.expense > 0 && (
                           <span> As despesas representam <strong>{((totals.expense / totals.income) * 100).toFixed(1)}%</strong> da receita total.</span>
                       )}
                   </p>
               </div>
           </div>
       )}

       {/* Modal: Transaction Form */}
       {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">{editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="flex space-x-4 mb-2">
                    <label className={`flex-1 cursor-pointer border rounded-lg p-3 text-center transition ${formData.type === 'INCOME' ? 'bg-green-50 border-green-500 text-green-700 font-bold' : 'border-gray-200 text-gray-500'}`}>
                        <input 
                            type="radio" name="type" className="hidden" 
                            checked={formData.type === 'INCOME'} 
                            onChange={() => setFormData({...formData, type: 'INCOME', category: INCOME_CATEGORIES[0]})} 
                        />
                        <div className="flex items-center justify-center"><ArrowUp size={16} className="mr-2"/> Receita</div>
                    </label>
                    <label className={`flex-1 cursor-pointer border rounded-lg p-3 text-center transition ${formData.type === 'EXPENSE' ? 'bg-red-50 border-red-500 text-red-700 font-bold' : 'border-gray-200 text-gray-500'}`}>
                        <input 
                            type="radio" name="type" className="hidden" 
                            checked={formData.type === 'EXPENSE'} 
                            onChange={() => setFormData({...formData, type: 'EXPENSE', category: EXPENSE_CATEGORIES[0]})} 
                        />
                         <div className="flex items-center justify-center"><ArrowDown size={16} className="mr-2"/> Despesa</div>
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Descrição</label>
                    <input 
                        required type="text" placeholder="Ex: Pagamento Fornecedor X"
                        className="mt-1 block w-full border rounded-md p-2"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Valor</label>
                        <input 
                            required type="number" step="0.01" min="0"
                            className="mt-1 block w-full border rounded-md p-2"
                            value={formData.amount}
                            onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Data</label>
                        <input 
                            required type="date"
                            className="mt-1 block w-full border rounded-md p-2"
                            value={formData.date}
                            onChange={e => setFormData({...formData, date: e.target.value})}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Categoria</label>
                    <select 
                        className="mt-1 block w-full border rounded-md p-2 bg-white"
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                        {(formData.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-2">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-secondary text-white rounded hover:bg-blue-600">Salvar</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {isDeleteModalOpen && transToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-sm shadow-2xl border-t-4 border-red-500">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Lançamento?</h3>
                <p className="text-sm text-gray-500 mb-4">
                    Tem certeza que deseja excluir: <br/> <strong>{transToDelete.description}</strong> ({formatCurrency(transToDelete.amount)})?
                </p>
                <div className="flex justify-end space-x-3">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 border rounded text-gray-600">Cancelar</button>
                    <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Excluir</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default FinancialPage;