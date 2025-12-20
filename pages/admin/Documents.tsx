import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Document, Role } from '../../types';
import { FileText, Plus, Globe, Lock, ExternalLink, Edit, Trash2, AlertTriangle, Link as LinkIcon, Users, User } from 'lucide-react';

const DocumentsPage: React.FC = () => {
  const { documents, users, addDocument, updateDocument, deleteDocument } = useApp();
  
  // State for Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    linkUrl: string;
    targetUserId: string; // "" for Public, otherwise User ID
  }>({
    title: '',
    linkUrl: '',
    targetUserId: ''
  });

  // Filter State
  const [filterType, setFilterType] = useState<'ALL' | 'PUBLIC' | 'PRIVATE'>('ALL');

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);

  const professionals = users.filter(u => u.role === Role.PROFESSIONAL && u.isActive).sort((a,b) => a.name.localeCompare(b.name));

  // --- Handlers ---

  const openModal = (doc?: Document) => {
    if (doc) {
      setEditingDoc(doc);
      setFormData({
        title: doc.title,
        linkUrl: doc.linkUrl,
        targetUserId: doc.targetUserId || ''
      });
    } else {
      setEditingDoc(null);
      setFormData({ title: '', linkUrl: '', targetUserId: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
        title: formData.title,
        linkUrl: formData.linkUrl,
        targetUserId: formData.targetUserId === '' ? null : formData.targetUserId
    };

    if (editingDoc) {
        updateDocument({ ...editingDoc, ...payload });
    } else {
        addDocument(payload);
    }
    setIsModalOpen(false);
  };

  const handleDeleteClick = (doc: Document) => {
      setDocToDelete(doc);
      setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
      if(docToDelete) {
          deleteDocument(docToDelete.id);
          setIsDeleteModalOpen(false);
          setDocToDelete(null);
      }
  };

  const getTargetName = (userId: string | null) => {
      if (!userId) return 'Todos os Profissionais';
      const user = users.find(u => u.id === userId);
      return user ? user.name : 'Usuário Desconhecido';
  };

  const filteredDocuments = documents.filter(doc => {
      if (filterType === 'ALL') return true;
      if (filterType === 'PUBLIC') return doc.targetUserId === null;
      if (filterType === 'PRIVATE') return doc.targetUserId !== null;
      return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Documentos e Arquivos</h2>
          <p className="text-gray-500 text-sm">Gerencie documentos compartilhados com a equipe.</p>
        </div>
        <button onClick={() => openModal()} className="bg-secondary text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-600 transition">
          <Plus size={18} /> <span>Novo Documento</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 border-b border-gray-200 pb-1">
          <button 
            onClick={() => setFilterType('ALL')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${filterType === 'ALL' ? 'text-secondary border-b-2 border-secondary' : 'text-gray-500 hover:text-gray-700'}`}
          >
              Todos
          </button>
          <button 
            onClick={() => setFilterType('PUBLIC')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${filterType === 'PUBLIC' ? 'text-secondary border-b-2 border-secondary' : 'text-gray-500 hover:text-gray-700'}`}
          >
              Públicos
          </button>
          <button 
            onClick={() => setFilterType('PRIVATE')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${filterType === 'PRIVATE' ? 'text-secondary border-b-2 border-secondary' : 'text-gray-500 hover:text-gray-700'}`}
          >
              Privados
          </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-xl border border-dashed flex flex-col items-center">
                <FileText size={48} className="mb-2 text-gray-200" />
                Nenhum documento encontrado.
            </div>
        )}

        {filteredDocuments.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between hover:shadow-md transition group">
                <div>
                    <div className="flex justify-between items-start mb-3">
                        <div className={`p-2.5 rounded-lg ${doc.targetUserId ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                            {doc.targetUserId ? <Lock size={20} /> : <Globe size={20} />}
                        </div>
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => openModal(doc)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"><Edit size={16}/></button>
                             <button onClick={() => handleDeleteClick(doc)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                        </div>
                    </div>
                    
                    <h3 className="font-bold text-gray-800 text-lg mb-1 truncate" title={doc.title}>{doc.title}</h3>
                    
                    <a 
                        href={doc.linkUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-sm text-gray-500 hover:text-secondary flex items-center mb-4 truncate"
                    >
                        <LinkIcon size={14} className="mr-1 shrink-0"/> {doc.linkUrl}
                    </a>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                    <div className="flex items-center text-gray-500" title={doc.targetUserId ? "Visível apenas para este usuário" : "Visível para todos"}>
                        {doc.targetUserId ? <User size={14} className="mr-1.5"/> : <Users size={14} className="mr-1.5"/>}
                        <span className="font-medium truncate max-w-[150px]">{getTargetName(doc.targetUserId)}</span>
                    </div>
                    <a 
                        href={doc.linkUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center text-secondary hover:underline font-medium"
                    >
                        Abrir <ExternalLink size={12} className="ml-1"/>
                    </a>
                </div>
            </div>
        ))}
      </div>

      {/* Modal: Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">{editingDoc ? 'Editar Documento' : 'Novo Documento'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Título do Documento</label>
                <input 
                  required type="text" 
                  placeholder="Ex: Contrato de Prestação de Serviços"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none" 
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Link (Google Drive / URL)</label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400"><LinkIcon size={16}/></span>
                    <input 
                        required type="url" 
                        placeholder="https://docs.google.com/..."
                        className="mt-1 block w-full pl-9 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none" 
                        value={formData.linkUrl} onChange={e => setFormData({...formData, linkUrl: e.target.value})} 
                    />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Destinatário / Visibilidade</label>
                <select 
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none"
                    value={formData.targetUserId}
                    onChange={e => setFormData({...formData, targetUserId: e.target.value})}
                >
                    <option value="">Público (Todos os Profissionais)</option>
                    <optgroup label="Específico para um Profissional">
                        {professionals.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </optgroup>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                    {formData.targetUserId === '' 
                        ? 'Todos os profissionais ativos poderão ver este documento.' 
                        : 'Apenas o profissional selecionado e administradores verão este documento.'}
                </p>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-secondary text-white rounded hover:bg-blue-600">Salvar Documento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {isDeleteModalOpen && docToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-sm shadow-2xl border-t-4 border-red-500">
            <div className="flex items-start space-x-4">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Excluir Documento?</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Tem certeza que deseja remover <strong>{docToDelete.title}</strong>?
                </p>
                <p className="text-xs text-red-600 mt-2 font-medium">O link ficará inacessível no sistema.</p>
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

export default DocumentsPage;