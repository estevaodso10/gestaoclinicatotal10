import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Role } from '../types';
import { supabase } from '../supabaseClient';
import { Lock, Mail, AlertCircle, Loader2, CheckCircle, X } from 'lucide-react';

const Login: React.FC = () => {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset Password State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
        
    } catch (err: any) {
        setError(err.message || 'Erro na autenticação');
        setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsResetLoading(true);
      setResetStatus(null);

      try {
          // Redireciona para a raiz. O AuthHandler no App.tsx detectará o evento PASSWORD_RECOVERY
          // e redirecionará para /reset-password corretamente.
          const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
              redirectTo: window.location.origin,
          });

          if (error) throw error;

          setResetStatus({
              type: 'success',
              text: 'E-mail enviado! Verifique sua caixa de entrada para redefinir a senha.'
          });
          setResetEmail('');

      } catch (err: any) {
          setResetStatus({
              type: 'error',
              text: err.message || 'Erro ao enviar e-mail de recuperação.'
          });
      } finally {
          setIsResetLoading(false);
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-300 relative">
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
            <div className="flex justify-end mt-1">
                <button 
                    type="button" 
                    onClick={() => {
                        setIsResetModalOpen(true);
                        setResetStatus(null);
                        setResetEmail('');
                    }}
                    className="text-xs text-secondary hover:text-blue-700 hover:underline font-medium"
                >
                    Esqueceu a senha?
                </button>
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

      {/* Forgot Password Modal */}
      {isResetModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-6 rounded-lg w-full max-w-sm shadow-2xl relative animate-in zoom-in duration-200">
                  <button 
                    onClick={() => setIsResetModalOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                  >
                      <X size={20} />
                  </button>

                  <h3 className="text-lg font-bold text-gray-900 mb-2">Recuperar Senha</h3>
                  <p className="text-sm text-gray-500 mb-4">
                      Digite seu e-mail abaixo para receber um link de redefinição de senha.
                  </p>

                  {resetStatus && (
                      <div className={`mb-4 p-3 rounded-lg text-sm flex items-start ${resetStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {resetStatus.type === 'success' ? <CheckCircle size={16} className="mr-2 mt-0.5 shrink-0"/> : <AlertCircle size={16} className="mr-2 mt-0.5 shrink-0"/>}
                          <span>{resetStatus.text}</span>
                      </div>
                  )}

                  <form onSubmit={handleResetPassword} className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">E-mail Cadastrado</label>
                        <input
                            required
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-secondary focus:outline-none"
                            placeholder="seu@email.com"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isResetLoading}
                        className="w-full bg-secondary hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition flex items-center justify-center"
                      >
                        {isResetLoading ? <Loader2 className="animate-spin" size={18}/> : 'Enviar Link'}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Login;