import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface LoginProps {
  onLoginSuccess?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { login, quickSwitch, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Por favor, informe seu e-mail e sua senha.');
      return;
    }

    const success = await login(email, password);
    if (success && onLoginSuccess) {
      onLoginSuccess();
    }
  };

  const handlePartnerDirectLogin = async (userId: string) => {
    const success = await quickSwitch(userId);
    if (success && onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-[#071322] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-sky-500/10 via-[#0B192C]/40 to-transparent pointer-events-none blur-3xl" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-2 bg-[#0B192C] border border-[#1E3E62]/60 rounded-2xl shadow-xl mb-4">
            <img
              src="/src/assets/images/logo_nexora_emblem_1791062638084.jpg"
              alt="NEXORA GROUP"
              className="w-14 h-14 rounded-xl object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            NEXORA GROUP
          </h1>
          <p className="mt-1 text-xs text-sky-400 font-semibold tracking-wide uppercase">
            Gestão inteligente. Controle completo.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0B192C]/90 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-[#1E3E62]/50 text-slate-100">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                E-mail corporativo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@nexoragroup.com.br"
                  required
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-[#071322] border border-[#1E3E62] focus:border-sky-500 rounded-lg text-white placeholder-slate-500 outline-hidden transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">Senha de acesso</label>
                <button
                  type="button"
                  onClick={() => alert('Para recuperação de senha contate o sócio administrador ou utilize os botões de acesso direto abaixo.')}
                  className="text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-[#071322] border border-[#1E3E62] focus:border-sky-500 rounded-lg text-white placeholder-slate-500 outline-hidden transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <span>Entrar na plataforma</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Partner Access Section */}
          <div className="mt-8 pt-6 border-t border-[#1E3E62]/40">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 mb-3 uppercase tracking-wider">
              <UserCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Acesso Rápido dos Sócios</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePartnerDirectLogin('usr_ruan')}
                className="p-2.5 rounded-xl bg-[#071322] hover:bg-[#152e4d] border border-[#1E3E62] hover:border-sky-500/60 transition-all flex flex-col items-center text-center group cursor-pointer"
              >
                <img
                  src="/src/assets/images/avatar_ruan_1791062648918.jpg"
                  alt="Ruan"
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-sky-500/30 group-hover:ring-sky-400 mb-1.5"
                  referrerPolicy="no-referrer"
                />
                <span className="text-xs font-bold text-white group-hover:text-sky-300">RUAN</span>
                <span className="text-[9px] text-slate-400">CEO & Adm.</span>
              </button>

              <button
                type="button"
                onClick={() => handlePartnerDirectLogin('usr_gabriel')}
                className="p-2.5 rounded-xl bg-[#071322] hover:bg-[#152e4d] border border-[#1E3E62] hover:border-sky-500/60 transition-all flex flex-col items-center text-center group cursor-pointer"
              >
                <img
                  src="/src/assets/images/avatar_gabriel_1791062659434.jpg"
                  alt="Gabriel"
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-sky-500/30 group-hover:ring-sky-400 mb-1.5"
                  referrerPolicy="no-referrer"
                />
                <span className="text-xs font-bold text-white group-hover:text-sky-300">GABRIEL</span>
                <span className="text-[9px] text-slate-400">CTO & Oper.</span>
              </button>

              <button
                type="button"
                onClick={() => handlePartnerDirectLogin('usr_cliver')}
                className="p-2.5 rounded-xl bg-[#071322] hover:bg-[#152e4d] border border-[#1E3E62] hover:border-sky-500/60 transition-all flex flex-col items-center text-center group cursor-pointer"
              >
                <img
                  src="/src/assets/images/avatar_cliver_1791062672397.jpg"
                  alt="Cliver"
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-sky-500/30 group-hover:ring-sky-400 mb-1.5"
                  referrerPolicy="no-referrer"
                />
                <span className="text-xs font-bold text-white group-hover:text-sky-300">CLIVER</span>
                <span className="text-[9px] text-slate-400">CFO & Com.</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security watermark footer */}
        <div className="mt-8 text-center text-slate-500 text-[11px] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Ambiente corporativo seguro com criptografia & auditoria ativa</span>
        </div>
      </div>
    </div>
  );
};
