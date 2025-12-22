import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle, Clock, DollarSign, AlertCircle } from 'lucide-react';

const ProfessionalPaymentsPage: React.FC = () => {
  const { currentUser, payments, markPaymentsAsRead } = useApp();

  // Mark payments as read when the page opens
  useEffect(() => {
    markPaymentsAsRead();
  }, []);

  if (!currentUser) return null;

  const myPayments = payments.filter(p => p.userId === currentUser.id);
  const pendingPayments = myPayments.filter(p => p.status === 'PENDING');
  const totalPending = pendingPayments.reduce((acc, curr) => acc + curr.amount, 0);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  
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
        <h2 className="text-2xl font-bold text-gray-800">Meus Pagamentos</h2>
        <p className="text-gray-500">Histórico financeiro e faturas pendentes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className={`p-3 rounded-full ${pendingPayments.length > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                <AlertCircle size={24} />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">Faturas Pendentes</p>
                <h3 className="text-2xl font-bold text-gray-800">{pendingPayments.length}</h3>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <DollarSign size={24} />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">Valor Total Pendente</p>
                <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(totalPending)}</h3>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-700">Histórico de Lançamentos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mês/Ano</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Pagamento</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {myPayments.sort((a,b) => b.dueDate.localeCompare(a.dueDate)).map(payment => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">{formatMonthYear(payment.dueDate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(payment.dueDate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatCurrency(payment.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                             {payment.status === 'PAID' 
                                ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={14} className="mr-1"/> Pago</span>
                                : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={14} className="mr-1"/> Pendente</span>
                            }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.paidDate ? formatDate(payment.paidDate) : '-'}</td>
                    </tr>
                ))}
                {myPayments.length === 0 && (
                    <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nenhum registro encontrado.</td>
                    </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalPaymentsPage;