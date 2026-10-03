import React, { useState } from 'react';
import { User, Lock, Shield, KeyRound, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { formatDateTime } from '../../utils/formatters.ts';

export const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      error('Preencha a senha atual e a nova senha.');
      return;
    }

    if (newPassword.length < 6) {
      error('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      error('A confirmação da nova senha não confere.');
      return;
    }

    try {
      setIsChanging(true);
      await api.changePassword(currentPassword, newPassword);
      success('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      error(err.message || 'Erro ao alterar senha.');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-sky-500" />
          <span>Meu Perfil de Sócio / Usuário</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Credenciais individuais de acesso seguro ao sistema da NEXORA GROUP
        </p>
      </div>

      {/* User Info Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-4">
        <img
          src={user?.avatar || '/src/assets/images/avatar_ruan_1791062648918.jpg'}
          alt={user?.name}
          className="w-16 h-16 rounded-full object-cover ring-2 ring-sky-500/40"
          referrerPolicy="no-referrer"
        />
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">{user?.name}</h2>
          <p className="text-xs font-semibold text-sky-600 dark:text-sky-400">{user?.position}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user?.email}</p>
          <p className="text-[10px] text-slate-400 mt-1">
            Último acesso ao sistema: {formatDateTime(user?.lastLoginAt)}
          </p>
        </div>
      </div>

      {/* Password Change Form */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
          <KeyRound className="w-4 h-4 text-sky-500" />
          <span>Alterar Senha de Acesso</span>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Senha Atual *
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nova Senha *
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirmar Nova Senha *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                required
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isChanging}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-bold shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isChanging ? 'Atualizando...' : 'Alterar Minha Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
