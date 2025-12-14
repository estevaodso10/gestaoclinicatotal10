import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Role, User } from '../../types';
import { Plus, Edit, Trash, XCircle, CheckCircle, Upload, User as UserIcon, Info, ExternalLink } from 'lucide-react';

const UsersPage: React.FC = () => {
  const { users, addUser, updateUser, toggleUserStatus } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<User>>({
    name: '', email: '', role: Role.PROFESSIONAL, isActive: true, specialty: '', photoUrl: ''
  });

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData(user);
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', role: Role.PROFESSIONAL, isActive: true, specialty: '', photoUrl: '' });
    }
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            alert('Apenas arquivos JPG ou PNG são permitidos.');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setFormData(prev => ({ ...prev, photoUrl: base64String }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
        updateUser({ ...editingUser, ...formData } as User);
    } else {
        addUser(formData as Omit<User, 'id'>);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Gestão de Usuários</h2>
            <p className="text-gray-500 text-sm">Gerencie acessos e perfis profissionais.</p>
        </div>
        <button onClick={() => openModal()} className="bg-secondary text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-600 transition">
          <Plus size={18} /> <span>Novo Usuário</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Perfil</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especialidade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                        {user.photoUrl ? (
                            <img className="h-10 w-10 rounded-full object-cover" src={user.photoUrl} alt="" />
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                <UserIcon size={20} />
                            </div>
                        )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === Role.ADMIN ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                    {user.role === Role.ADMIN ? 'Admin' : 'Profissional'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.specialty || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button 
                    onClick={() => toggleUserStatus(user.id)}
                    className={`flex items-center space-x-1 text-sm ${user.isActive ? 'text-green-600' : 'text-red-500'}`}
                    title={user.isActive ? "Clique para Desativar (Remove Reservas)" : "Clique para Ativar"}
                  >
                     {user.isActive ? <CheckCircle size={16}/> : <XCircle size={16}/>}
                     <span>{user.isActive ? 'Ativo' : 'Inativo'}</span>
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openModal(user)} className="text-indigo-600 hover:text-indigo-900 mr-4">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
            
            {!editingUser && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-start">
                    <Info className="shrink-0 mr-2 mt-0.5" size={16} />
                    <div>
                        <p className="font-semibold mb-1">Atenção ao Fluxo de Cadastro:</p>
                        <p className="leading-relaxed">
                            Este formulário cria apenas o <strong>Perfil do Usuário</strong> no sistema. 
                            Para que ele consiga fazer login, você deve criar manualmente o <strong>Login (E-mail/Senha)</strong> no painel Authentication do Supabase.
                        </p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Photo Upload Section */}
              <div className="flex items-center space-x-4 mb-4">
                  <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                      {formData.photoUrl ? (
                          <img src={formData.photoUrl} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                          <UserIcon className="text-gray-400" size={32} />
                      )}
                  </div>
                  <div>
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm bg-white border border-gray-300 py-1.5 px-3 rounded-md font-medium text-gray-700 hover:bg-gray-50 flex items-center"
                      >
                          <Upload size={14} className="mr-2"/> Carregar Foto
                      </button>
                      <p className="text-xs text-gray-500 mt-1">JPG ou PNG. Max 2MB.</p>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        hidden 
                        accept="image/png, image/jpeg" 
                        onChange={handleFileChange}
                      />
                  </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input required type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">E-mail</label>
                <input required type="email" className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                {!editingUser && <p className="text-xs text-gray-500 mt-1">Deve ser idêntico ao e-mail cadastrado no Supabase Auth.</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Perfil</label>
                    <select className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none" 
                      value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as Role})}>
                      <option value={Role.ADMIN}>Admin</option>
                      <option value={Role.PROFESSIONAL}>Profissional</option>
                    </select>
                 </div>
                 {formData.role === Role.PROFESSIONAL && (
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Especialidade</label>
                        <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-secondary focus:outline-none" 
                        value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} />
                    </div>
                 )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-secondary text-white rounded hover:bg-blue-600">Salvar Perfil</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;