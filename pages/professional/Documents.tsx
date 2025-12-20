import React from 'react';
import { useApp } from '../../context/AppContext';
import { FileText, ExternalLink, Globe, Lock, AlertCircle, Clock } from 'lucide-react';

const ProfessionalDocumentsPage: React.FC = () => {
  const { documents, currentUser } = useApp();

  if (!currentUser) return null;

  // Filter: Public Documents OR Private Documents targeted at me
  const myDocuments = documents.filter(doc => 
    doc.targetUserId === null || doc.targetUserId === currentUser.id
  );

  // Sort: Most recent first (assuming creation date is handled, otherwise basic sort)
  // Since we are mocking, we just sort by title for consistency or leave as is.
  // Let's sort public first, then private
  myDocuments.sort((a, b) => {
      if (a.targetUserId === b.targetUserId) return a.title.localeCompare(b.title);
      return (a.targetUserId ? -1 : 1); // Private first
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Documentos Compartilhados</h2>
        <p className="text-gray-500 text-sm">Acesse contratos, manuais e arquivos disponibilizados pela administração.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myDocuments.length === 0 && (
             <div className="col-span-full py-16 text-center text-gray-400 bg-white rounded-xl border border-dashed flex flex-col items-center">
                <div className="bg-gray-50 p-4 rounded-full mb-3">
                    <FileText size={32} className="text-gray-300" />
                </div>
                <h3 className="text-gray-600 font-medium">Nenhum documento disponível</h3>
                <p className="text-sm mt-1 max-w-xs mx-auto">
                    Você não possui documentos compartilhados no momento.
                </p>
            </div>
        )}

        {myDocuments.map(doc => {
            const isPrivate = doc.targetUserId === currentUser.id;
            
            return (
                <div key={doc.id} className={`bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition flex flex-col justify-between ${isPrivate ? 'border-amber-100' : 'border-gray-100'}`}>
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-lg ${isPrivate ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                {isPrivate ? <Lock size={24} /> : <Globe size={24} />}
                            </div>
                            {isPrivate && (
                                <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide border border-amber-100">
                                    Exclusivo
                                </span>
                            )}
                        </div>
                        
                        <h3 className="font-bold text-gray-800 text-lg mb-2 leading-tight">{doc.title}</h3>
                        
                        {doc.createdAt && (
                            <div className="flex items-center text-xs text-gray-400 mb-6">
                                <Clock size={12} className="mr-1.5" />
                                <span>{formatDate(doc.createdAt)}</span>
                            </div>
                        )}
                        {!doc.createdAt && <div className="mb-6"></div>}
                    </div>

                    <a 
                        href={doc.linkUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className={`w-full py-2.5 rounded-lg flex items-center justify-center font-medium transition text-sm ${
                            isPrivate 
                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' 
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        <span>Acessar Documento</span>
                        <ExternalLink size={16} className="ml-2" />
                    </a>
                </div>
            );
        })}
      </div>

      {myDocuments.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start space-x-3 mt-8">
             <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
             <div className="text-sm text-blue-800">
                 <p>Os documentos são hospedados externamente (Google Drive, Dropbox, etc). Certifique-se de estar logado na conta correta para acessá-los caso haja restrição de permissão no arquivo original.</p>
             </div>
          </div>
      )}
    </div>
  );
};

export default ProfessionalDocumentsPage;