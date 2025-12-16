import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Verifica se o usuário chegou aqui autenticado (via link mágico de recuperação)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Se não houver sessão, o link pode ter expirado ou ser inválido
        setStatus({ type: 'error', text: 'O link de recuperação é inválido ou expirou. Por favor, solicite um novo.' });
      }
    };
    checkSession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setStatus({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }

    if (password.length < 6) {
      setStatus({ type: 'error', text: 'A senha deve ter no mínimo 6 caracteres.' });
      return;
    }

    setIsLoading(true);
    setStatus(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: password });

      if (error) throw error;

      setStatus({ type: 'success', text: 'Senha atualizada com sucesso! Redirecionando para o login...' });
      
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (error: any) {
      setStatus({ type: 'error', text: error.message || 'Erro ao atualizar a senha.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Redefinir Senha</h1>
            <p className="text-gray-500 text-sm">Crie uma nova senha segura para sua conta.</p>
        </div>

        {status && (
            <div className={`mb-4 border px-4 py-3 rounded-lg flex items-start text-sm ${
                status.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'
            }`}>
                {status.type === 'success' ? <CheckCircle size={18} className="mr-2 mt-0.5"/> : <AlertCircle size={18} className="mr-2 mt-0.5"/>}
                <span>{status.text}</span>
            </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
            <div className="relative">
                <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:outline-none transition"
                    placeholder="Mínimo 6 caracteres"
                />
                <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
            <div className="relative">
                <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:outline-none transition"
                    placeholder="Repita a senha"
                />
                <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-secondary hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Salvar Nova Senha'}
          </button>
        </form>

        <div className="mt-6 text-center">
            <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-secondary hover:underline">
                Voltar para o Login
            </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;