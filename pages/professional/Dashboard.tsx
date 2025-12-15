import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Role } from '../../types';
import { UserCircle, Mail, Phone, MapPin, Save, Briefcase, Lock, Camera, Loader2 } from 'lucide-react';

const ProfessionalDashboard: React.FC = () => {
  const { currentUser, updateUser } = useApp();
  const [formData, setFormData] = useState<Partial<User>>({});
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      setFormData({ ...currentUser });
    }
  }, [currentUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        // Basic validation
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            setMessage({ type: 'error', text: 'Apenas arquivos JPG ou PNG são permitidos.' });
            return;
        }
        
        // Convert to Base64
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setFormData(prev => ({ ...prev, photoUrl: base64String }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsLoading(true);
    setMessage(null);

    try {
        // Create updated user object
        const updatedUser = { 
            ...currentUser, 
            ...formData,
            // Ensure Role cannot be changed by the user interface hack
            role: currentUser.role 
        } as User;

        await updateUser(updatedUser);
        setMessage({ type: 'success', text: 'Dados atualizados com sucesso!' });
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
        console.error(error);
        setMessage({ type: 'error', text: `Erro ao atualizar dados: ${error.message || 'Tente novamente.'}` });
    } finally {
        setIsLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
       <div>
        <h2 className="text-2xl font-bold text-gray-800">Meu Perfil</h2>
        <p className="text-gray-500 text-sm">Gerencie suas informações pessoais e de contato.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Banner Header with Profile Info Inside */}
        <div className="bg-gradient-to-r from-secondary to-blue-500 px-8 py-10 flex items-center gap-6">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="bg-white/20 p-1.5 rounded-full backdrop-blur-sm border border-white/30 shadow-inner">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-secondary shadow-sm overflow-hidden relative">
                         {formData.photoUrl ? (
                             <img src={formData.photoUrl} alt="Perfil" className="w-full h-full object-cover" />
                         ) : (
                             <UserCircle size={56} />
                         )}
                         
                         {/* Hover Overlay */}
                         <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <Camera size={24} className="text-white" />
                         </div>
                    </div>
                </div>
                {/* Hidden File Input */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    hidden 
                    accept="image/png, image/jpeg" 
                    onChange={handleFileChange}
                />
            </div>
            
            <div className="text-white">
                <h3 className="text-3xl font-bold tracking-tight">{currentUser.name}</h3>
                <p className="text-blue-100 font-medium flex items-center mt-1 text-lg">
                    <Briefcase size={18} className="mr-2 opacity-80"/> 
                    {currentUser.specialty || 'Profissional de Saúde'}
                </p>
            </div>
        </div>
        
        <div className="p-8">
            {message && (
                <div className={`mb-6 p-4 rounded-lg text-sm flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center">
                            <UserCircle size={16} className="mr-2 text-gray-400"/> Nome Completo
                        </label>
                        <input 
                            required type="text" 
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-secondary focus:outline-none"
                            value={formData.name || ''}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center">
                            <Mail size={16} className="mr-2 text-gray-400"/> E-mail
                        </label>
                        <div className="relative">
                            <input 
                                disabled type="email" 
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-500 cursor-not-allowed"
                                value={formData.email || ''}
                            />
                            <Lock size={14} className="absolute right-3 top-3 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-400">O e-mail é utilizado para login e não pode ser alterado.</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center">
                            <Phone size={16} className="mr-2 text-gray-400"/> Telefone
                        </label>
                        <input 
                            type="text" 
                            placeholder="(00) 00000-0000"
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-secondary focus:outline-none"
                            value={formData.phone || ''}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center">
                            <MapPin size={16} className="mr-2 text-gray-400"/> Endereço
                        </label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-secondary focus:outline-none"
                            value={formData.address || ''}
                            onChange={e => setFormData({...formData, address: e.target.value})}
                        />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center">
                            <Briefcase size={16} className="mr-2 text-gray-400"/> Especialidade / Formação
                        </label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-secondary focus:outline-none"
                            value={formData.specialty || ''}
                            onChange={e => setFormData({...formData, specialty: e.target.value})}
                        />
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end">
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="bg-secondary hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg shadow-sm transition flex items-center font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
                        {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDashboard;