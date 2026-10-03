import React, { useState, useRef } from 'react';
import {
  User,
  Camera,
  Upload,
  KeyRound,
  CheckCircle,
  Save,
  RotateCcw,
  Sparkles,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { formatDateTime } from '../../utils/formatters.ts';
import { ChangeAvatarModal } from '../../components/ChangeAvatarModal.tsx';

export const UserProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile data states
  const [name, setName] = useState(user?.name || '');
  const [position, setPosition] = useState(user?.position || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Pre-configured executive avatars for quick select
  const presetAvatars = [
    {
      name: 'Ruan (Original)',
      url: '/src/assets/images/avatar_ruan_1791062648918.jpg',
    },
    {
      name: 'Gabriel (Original)',
      url: '/src/assets/images/avatar_gabriel_1791062659434.jpg',
    },
    {
      name: 'Cliver (Original)',
      url: '/src/assets/images/avatar_cliver_1791062672397.jpg',
    },
  ];

  // Handle file upload and optimize with client-side canvas
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error('Por favor, selecione um arquivo de imagem válido (JPG, PNG ou WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to max 400x400 to keep it crisp and lightweight
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          setAvatarPreview(dataUrl);
          success('Foto carregada! Clique em "Salvar Alterações do Perfil" para confirmar.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('O nome não pode ficar em branco.');
      return;
    }

    try {
      setIsSavingProfile(true);
      const ok = await updateProfile({
        name,
        position,
        avatar: avatarPreview,
      });
      if (ok) {
        success('Foto de perfil e dados atualizados com sucesso!');
      }
    } catch (err: any) {
      error(err.message || 'Erro ao atualizar dados do perfil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

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
      setIsChangingPassword(true);
      await api.changePassword(currentPassword, newPassword);
      success('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      error(err.message || 'Erro ao alterar senha.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-sky-500" />
          <span>Meu Perfil de Sócio / Usuário</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Gerencie sua foto de perfil oficial, dados de exibição e credenciais da NEXORA GROUP
        </p>
      </div>

      {/* Main Profile & Avatar Management */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6"
      >
        <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
          <Camera className="w-4 h-4 text-sky-500" />
          <span>Foto de Perfil & Identificação do Sócio</span>
        </div>

        {/* Avatar change zone */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar preview with upload overlay */}
          <div className="relative group shrink-0">
            <img
              src={avatarPreview || user?.avatar || '/src/assets/images/avatar_ruan_1791062648918.jpg'}
              alt={user?.name}
              className="w-28 h-28 rounded-full object-cover ring-4 ring-sky-500/30 shadow-md transition-all group-hover:brightness-90"
              referrerPolicy="no-referrer"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-white cursor-pointer"
              title="Trocar Foto"
            >
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold">Alterar</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Action buttons & presets */}
          <div className="flex-1 space-y-3 text-xs w-full text-center sm:text-left">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{user?.name}</h3>
              <p className="text-xs font-semibold text-sky-600 dark:text-sky-400">{user?.position}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-bold shadow-xs cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Escolher Foto do Computador / Celular</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold shadow-xs cursor-pointer transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-sky-400" />
                <span>Câmera & Opções Avançadas</span>
              </button>
              {avatarPreview !== user?.avatar && (
                <button
                  type="button"
                  onClick={() => setAvatarPreview(user?.avatar || '')}
                  className="flex items-center gap-1 px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Desfazer</span>
                </button>
              )}
            </div>

            {/* Quick avatar selection */}
            <div className="pt-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                Ou selecione uma foto padrão:
              </span>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                {presetAvatars.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setAvatarPreview(preset.url);
                      success(`Foto selecionada: ${preset.name}`);
                    }}
                    className={`p-1 rounded-full border-2 transition-all ${
                      avatarPreview === preset.url
                        ? 'border-sky-500 scale-105'
                        : 'border-transparent hover:border-slate-300'
                    }`}
                    title={preset.name}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-8 h-8 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Editable Name and Position */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome de Exibição *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden text-xs"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cargo / Função
            </label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSavingProfile}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-bold shadow-xs cursor-pointer text-xs disabled:opacity-50 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSavingProfile ? 'Salvando...' : 'Salvar Alterações do Perfil'}</span>
          </button>
        </div>
      </form>

      {/* Password Change Form */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
          <KeyRound className="w-4 h-4 text-sky-500" />
          <span>Segurança & Alteração de Senha</span>
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
              disabled={isChangingPassword}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isChangingPassword ? 'Atualizando...' : 'Atualizar Minha Senha'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Avatar Modal */}
      <ChangeAvatarModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onAvatarUpdated={(newAv) => {
          setAvatarPreview(newAv);
        }}
      />
    </div>
  );
};
