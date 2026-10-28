import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  LogIn, 
  X, 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

const SAVED_CREDS_KEY = 'jlvp_saved_login_credentials';

export const LoginModal: React.FC = () => {
  const { 
    isLoginModalOpen, 
    setIsLoginModalOpen, 
    login, 
    currentUser, 
    agencyConfig 
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Load saved credentials on mount ONLY if the user explicitly chose to save them
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_CREDS_KEY);
      if (saved) {
        const { savedEmail, savedPassword } = JSON.parse(saved);
        if (savedEmail) setEmail(savedEmail);
        if (savedPassword) setPassword(savedPassword);
        setRememberMe(true);
      } else {
        // Space is completely blank on first opening
        setEmail('');
        setPassword('');
        setRememberMe(false);
      }
    } catch {
      setEmail('');
      setPassword('');
      setRememberMe(false);
    }
  }, [isLoginModalOpen]);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Por favor, informe seu e-mail cadastrado.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      setLoading(false);

      if (!result.success) {
        setErrorMsg(result.message || 'Falha ao realizar login. Verifique seus dados.');
      } else {
        // Handle Remember Me / Save Password in browser
        try {
          if (rememberMe) {
            localStorage.setItem(SAVED_CREDS_KEY, JSON.stringify({
              savedEmail: email.trim(),
              savedPassword: password
            }));
          } else {
            localStorage.removeItem(SAVED_CREDS_KEY);
          }
        } catch (err) {
          console.warn('Não foi possível salvar credenciais:', err);
        }
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('Ocorreu um erro ao processar seu login. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div 
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* LEFT SIDE: Information in Solid Pure Black (NO degradê) */}
        <div className="md:w-5/12 bg-black text-white p-7 sm:p-9 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800 relative">
          <div>
            {/* Logo & Agency Header */}
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white overflow-hidden shadow-lg border border-white/20 shrink-0"
                style={{ backgroundColor: agencyConfig.primaryColor }}
              >
                {agencyConfig.agencyLogo ? (
                  <img src={agencyConfig.agencyLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <ShieldCheck className="w-6 h-6 text-white" />
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                  Sistema de Gestão
                </span>
                <h1 className="text-lg font-extrabold text-white tracking-tight leading-tight">
                  {agencyConfig.agencyName}
                </h1>
              </div>
            </div>

            {/* Title & Tagline */}
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
              Aprovação de Conteúdos & Social Media
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Plataforma para agências gerenciarem aprovações, revisões, calendário de posts e comunicação com clientes.
            </p>

            {/* Feature Bullets */}
            <div className="mt-8 space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Fluxo Transparente</h4>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    Posts pendentes, em alteração e aprovados organizados em Kanban e calendário.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Acessos com Permissões</h4>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    Dona da agência, gerentes de contas, criadores e revisores.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Notificações em Tempo Real</h4>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    Alertas push e links diretos para aprovação via WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Left Footer Note */}
          <div className="mt-8 pt-5 border-t border-zinc-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>JLVP Marketing © 2026</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Nuvem Conectada
            </span>
          </div>
        </div>

        {/* RIGHT SIDE: Login Form on PC */}
        <div className="md:w-7/12 p-7 sm:p-10 flex flex-col justify-center bg-white relative">
          {currentUser && (
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Fechar tela de login"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="max-w-md w-full mx-auto">
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 mb-2">
                <LogIn className="w-3 h-3 text-brand" />
                Acesso ao Painel
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Entrar na Conta
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Insira seu e-mail e senha cadastrados para acessar o sistema.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label 
                  htmlFor="login-email"
                  className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider"
                >
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu.email@agencia.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand font-medium text-slate-900 transition-all"
                  />
                </div>
              </div>

              <div>
                <label 
                  htmlFor="login-password"
                  className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider"
                >
                  Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Sua senha de acesso"
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand font-mono text-slate-900 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Salvar Senha / Lembrar Acesso no Navegador */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Salvar senha no navegador para entrar com facilidade
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] mt-2"
                style={{ backgroundColor: agencyConfig.primaryColor }}
              >
                {loading ? (
                  <span>Autenticando...</span>
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400">
                Acesso exclusivo para membros da equipe da agência.
                <br />
                Para novos acessos, solicite à Dona da agência.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
