import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FinancialTransaction, TransactionType, FinancialCategory } from '../../types';
import { 
    DollarSign, TrendingUp, TrendingDown, Plus, Filter, 
    Trash2, Edit, Calendar, List, PieChart, ArrowUp, ArrowDown, Tags, X
} from 'lucide-react';

const FinancialPage: React.FC = () => {
  const { 
      financialTransactions, financialCategories, 
      addFinancialTransaction, updateFinancialTransaction, deleteFinancialTransaction,
      addFinancialCategory, updateFinancialCategory, deleteFinancialCategory
  } = useApp();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'TRANSACTIONS' | 'REPORTS'>('TRANSACTIONS');
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  // Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [formData, setFormData] = useState<Partial<FinancialTransaction>>({
      type: 'INCOME',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      category: '',
      description: ''
  });

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState<Partial<FinancialCategory>>({ name: '', type: 'INCOME' });
  const [editingCategory, setEditingCategory] = useState<FinancialCategory | null>(null);

  // Delete Transaction State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transToDelete, setTransToDelete] = useState<FinancialTransaction | null>(null);

  // Delete Category State
  const [isDeleteCatModalOpen, setIsDeleteCatModalOpen] = useState(false);
  const [catToDelete, setCatToDelete] = useState<FinancialCategory | null>(null);

  // --- DERIVED DATA ---
  const incomeCategories = useMemo(() => financialCategories.filter(c => c.type === 'INCOME').sort((a,b) => a.name.localeCompare(b.name)), [financialCategories]);
  const expenseCategories = useMemo(() => financialCategories.filter(c => c.type === 'EXPENSE').sort((a,b) => a.name.localeCompare(b.name)), [financialCategories]);

  // Ensure 'Pendente' exists for UI if needed or handle logic
  const getCategoriesByType = (type: TransactionType) => type === 'INCOME' ? incomeCategories : expenseCategories;

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
      
      // Initialize with 'Pendente' to ensure it shows up if used
      breakdown['Pendente'] = { income: 0, expense: 0 };
      
      // Initialize existing categories
      financialCategories.forEach(cat => {
          breakdown[cat.name] = { income: 0, expense: 0 };
      });

      currentMonthTransactions.forEach(t => {
          const catName = t.category || 'Pendente';
          if (!breakdown[catName]) breakdown[catName] = { income: 0, expense: 0 };
          
          if (t.type === 'INCOME') breakdown[catName].income += t.amount;
          else breakdown[catName].expense += t.amount;
      });

      // Filter out empty categories
      return Object.entries(breakdown)
          .filter(([_, vals]) => vals.income > 0 || vals.expense > 0)
          .sort((a, b) => (b[1].income + b[1].expense) - (a[1].income + a[1].expense));
  }, [currentMonthTransactions, financialCategories]);

  // --- HANDLERS ---

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (dateStr: string) => {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
  };

  // Transaction Handlers
  const openModal = (trans?: FinancialTransaction) => {
      if (trans) {
          setEditingTransaction(trans);
          setFormData({ ...trans });
      } else {
          setEditingTransaction(null);
          // Set default category based on type
          const defaultCat = incomeCategories.length > 0 ? incomeCategories[0].name : '';
          setFormData({
            type: 'INCOME',
            date: new Date().toISOString().split('T')[0],
            amount: 0,
            category: defaultCat,
            description: ''
          });
      }
      setIsModalOpen(true);
  };

  const handleTransactionTypeChange = (type: TransactionType) => {
      const cats = type === 'INCOME' ? incomeCategories : expenseCategories;
      const defaultCat = cats.length > 0 ? cats[0].name : '';
      setFormData({ ...formData, type, category: defaultCat });
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.description || !formData.amount || !formData.date) return;
      
      // Fallback if no category selected/exists
      const finalCategory = formData.category || 'Pendente';

      if (editingTransaction) {
          updateFinancialTransaction({ ...editingTransaction, ...formData, category: finalCategory } as FinancialTransaction);
      } else {
          addFinancialTransaction({ ...formData, category: finalCategory } as Omit<FinancialTransaction, 'id' | 'createdAt'>);
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

  // Category Handlers
  const openCategoryModal = () => {
      setEditingCategory(null);
      setCategoryFormData({ name: '', type: 'INCOME' });
      setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!categoryFormData.name) return;

      if (editingCategory) {
          updateFinancialCategory({ ...editingCategory, name: categoryFormData.name, type: categoryFormData.type! }, editingCategory.name);
      } else {
          addFinancialCategory(categoryFormData as Omit<FinancialCategory, 'id'>);
      }
      // Reset form but keep modal open for list management, or close? 
      // Better UX to reset form state for 'add' but close if 'edit'.
      if(editingCategory) {
          setEditingCategory(null);
          setCategoryFormData({ name: '', type: 'INCOME' });
      } else {
          setCategoryFormData({ name: '', type: 'INCOME' });
      }
  };

  const handleEditCategoryClick = (cat: FinancialCategory) => {
      setEditingCategory(cat);
      setCategoryFormData({ name: cat.name, type: cat.type });
  };

  const handleDeleteCategoryClick = (cat: FinancialCategory) => {
      setCatToDelete(cat);
      setIsDeleteCatModalOpen(true);
  };

  const confirmDeleteCategory = () => {
      if (catToDelete) {
          deleteFinancialCategory(catToDelete.id, catToDelete.name);
          setIsDeleteCatModalOpen(false);
          setCatToDelete(null);
      }
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Gestão Financeira</h2>
                <p className="text-gray-500 text-sm">Controle de receitas, despesas e fluxo de caixa.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
                 <button 
                    onClick={openCategoryModal}
                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-50 transition"
                 >
                    <Tags size={18} /> <span className="hidden sm:inline">Categorias</span>
                 </button>
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
                        <Plus size={18} /> <span className="hidden sm:inline">Lançamento</span>
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

       {/* Summary Cards */}
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
                            onChange={() => handleTransactionTypeChange('INCOME')} 
                        />
                        <div className="flex items-center justify-center"><ArrowUp size={16} className="mr-2"/> Receita</div>
                    </label>
                    <label className={`flex-1 cursor-pointer border rounded-lg p-3 text-center transition ${formData.type === 'EXPENSE' ? 'bg-red-50 border-red-500 text-red-700 font-bold' : 'border-gray-200 text-gray-500'}`}>
                        <input 
                            type="radio" name="type" className="hidden" 
                            checked={formData.type === 'EXPENSE'} 
                            onChange={() => handleTransactionTypeChange('EXPENSE')} 
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
                        required
                    >
                        <option value="">Selecione...</option>
                        {getCategoriesByType(formData.type!).map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                    {getCategoriesByType(formData.type!).length === 0 && (
                        <p className="text-xs text-red-500 mt-1">Nenhuma categoria cadastrada. Adicione categorias primeiro.</p>
                    )}
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-2">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-secondary text-white rounded hover:bg-blue-600">Salvar</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Category Management */}
      {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-2xl h-[80vh] flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">Gerenciar Categorias</h3>
                      <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>

                  {/* Form to Add/Edit */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="text-sm font-bold text-gray-700 mb-2">{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</h4>
                      <form onSubmit={handleCategorySubmit} className="flex gap-2">
                          <select 
                            className="border rounded-md px-2 py-1.5 text-sm w-32"
                            value={categoryFormData.type}
                            onChange={e => setCategoryFormData({...categoryFormData, type: e.target.value as TransactionType})}
                          >
                              <option value="INCOME">Receita</option>
                              <option value="EXPENSE">Despesa</option>
                          </select>
                          <input 
                            type="text" 
                            placeholder="Nome da Categoria"
                            required
                            className="border rounded-md px-3 py-1.5 text-sm flex-1"
                            value={categoryFormData.name}
                            onChange={e => setCategoryFormData({...categoryFormData, name: e.target.value})}
                          />
                          <button type="submit" className="bg-secondary text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-600">
                              {editingCategory ? 'Salvar' : 'Adicionar'}
                          </button>
                          {editingCategory && (
                              <button 
                                type="button" 
                                onClick={() => { setEditingCategory(null); setCategoryFormData({ name: '', type: 'INCOME' }); }}
                                className="bg-gray-200 text-gray-600 px-3 py-1.5 rounded-md text-sm hover:bg-gray-300"
                              >
                                  Cancelar
                              </button>
                          )}
                      </form>
                  </div>

                  {/* List */}
                  <div className="flex-1 overflow-y-auto space-y-4">
                      <div>
                          <h5 className="text-xs font-bold text-gray-500 uppercase mb-2 border-b pb-1">Receitas</h5>
                          <div className="space-y-1">
                              {incomeCategories.map(cat => (
                                  <div key={cat.id} className="flex justify-between items-center bg-white border border-gray-100 p-2 rounded hover:bg-gray-50 group">
                                      <span className="text-sm text-gray-800">{cat.name}</span>
                                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => handleEditCategoryClick(cat)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Edit size={14}/></button>
                                          <button onClick={() => handleDeleteCategoryClick(cat)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                                      </div>
                                  </div>
                              ))}
                              {incomeCategories.length === 0 && <p className="text-xs text-gray-400 italic">Nenhuma categoria cadastrada.</p>}
                          </div>
                      </div>

                      <div>
                          <h5 className="text-xs font-bold text-gray-500 uppercase mb-2 border-b pb-1">Despesas</h5>
                          <div className="space-y-1">
                              {expenseCategories.map(cat => (
                                  <div key={cat.id} className="flex justify-between items-center bg-white border border-gray-100 p-2 rounded hover:bg-gray-50 group">
                                      <span className="text-sm text-gray-800">{cat.name}</span>
                                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => handleEditCategoryClick(cat)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Edit size={14}/></button>
                                          <button onClick={() => handleDeleteCategoryClick(cat)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                                      </div>
                                  </div>
                              ))}
                               {expenseCategories.length === 0 && <p className="text-xs text-gray-400 italic">Nenhuma categoria cadastrada.</p>}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Modal: Delete Transaction Confirmation */}
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

      {/* Modal: Delete Category Confirmation */}
      {isDeleteCatModalOpen && catToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-sm shadow-2xl border-t-4 border-red-500">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Categoria?</h3>
                <p className="text-sm text-gray-500 mb-4">
                    Tem certeza que deseja excluir a categoria <strong>{catToDelete.name}</strong>?
                </p>
                <div className="bg-yellow-50 text-yellow-800 p-3 rounded text-xs mb-4 flex items-start">
                    <span className="font-bold mr-1">Atenção:</span>
                    Todas as transações vinculadas a esta categoria ficarão marcadas como "Pendente".
                </div>
                <div className="flex justify-end space-x-3">
                    <button onClick={() => setIsDeleteCatModalOpen(false)} className="px-4 py-2 border rounded text-gray-600">Cancelar</button>
                    <button onClick={confirmDeleteCategory} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Confirmar</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default FinancialPage;