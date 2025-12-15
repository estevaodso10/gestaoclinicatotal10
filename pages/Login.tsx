import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Role } from '../types';
import { supabase } from '../supabaseClient';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === Role.ADMIN) navigate('/admin/dashboard');
      else navigate('/pro/dashboard');
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        
        if (signInError) {
            if (signInError.message === 'Invalid login credentials') {
                throw new Error('E-mail ou senha incorretos.');
            }
            throw signInError;
        }
        
        // SUCESSO: Não chamamos setIsLoading(false) aqui.
        // Mantemos o loading ativo enquanto o AppContext atualiza o currentUser
        // e o useEffect acima dispara a navegação.
        
    } catch (err: any) {
        // ERRO: Paramos o loading para o usuário tentar novamente
        setError(err.message || 'Erro na autenticação');
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ClinicFlow</h1>
            <p className="text-gray-500">Sistema de Gestão de Salas</p>
        </div>

        {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center text-sm">
                <AlertCircle size={16} className="mr-2"/> {error}
            </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <div className="relative">
                <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:outline-none transition"
                    placeholder="seu@email.com"
                />
                <Mail size={18} className="absolute left-3 top-3.5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <div className="relative">
                <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:outline-none transition"
                    placeholder="••••••••"
                />
                <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-secondary hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Entrar'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
                Não possui acesso? Entre em contato com a administração.
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;