import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Edit,
  UserCheck,
  Lock,
  Mail,
  CheckCircle,
  Camera,
  Upload,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { User, AppModule, UserRole } from '../../types/index.ts';
import { formatDateTime } from '../../utils/formatters.ts';
import { Modal } from '../../components/Modal.tsx';
import { ChangeAvatarModal } from '../../components/ChangeAvatarModal.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

const ALL_MODULES: { id: AppModule; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard Executivo' },
  { id: 'financeiro', label: 'Módulo Financeiro & Contas' },
  { id: 'vendas', label: 'Vendas & Frente de Caixa' },
  { id: 'pedidos', label: 'Expedição & Pedidos' },
  { id: 'produtos', label: 'Catálogo de Produtos' },
  { id: 'estoque', label: 'Controle de Estoque' },
  { id: 'clientes', label: 'CRM de Clientes' },
  { id: 'fornecedores', label: 'Cadastro de Fornecedores' },
  { id: 'relatorios', label: 'Central de Relatórios' },
  { id: 'usuarios', label: 'Gestão de Usuários & Permissões' },
  { id: 'atividades', label: 'Auditoria & Logs de Atividades' },
  { id: 'configuracoes', label: 'Configurações da Empresa' },
];

export const UsersList: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { success, error } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Avatar Modal
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarTargetUser, setAvatarTargetUser] = useState<User | null>(null);

  const handleOpenAvatarModal = (target: User) => {
    setAvatarTargetUser(target);
    setAvatarModalOpen(true);
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'colaborador' as UserRole,
    position: '',
    avatar: '',
    permissions: ['dashboard'] as AppModule[],
  });

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const list = await api.getUsers();
      setUsers(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'colaborador',
      position: 'Colaborador',
      avatar: '',
      permissions: ['dashboard', 'vendas', 'produtos'],
    });
    setShowModal(true);
  };

  const handleOpenEdit = (target: User) => {
    setEditingUser(target);
    setFormData({
      name: target.name,
      email: target.email,
      password: '',
      role: target.role,
      position: target.position,
      avatar: target.avatar || '',
      permissions: target.permissions || [],
    });
    setShowModal(true);
  };

  const togglePermission = (mod: AppModule) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(mod);
      if (exists) {
        return { ...prev, permissions: prev.permissions.filter((p) => p !== mod) };
      } else {
        return { ...prev, permissions: [...prev.permissions, mod] };
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      error('Nome e e-mail são obrigatórios.');
      return;
    }

    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, formData);
        success('Usuário atualizado com sucesso!');
      } else {
        if (!formData.password) {
          error('Senha é obrigatória para novo usuário.');
          return;
        }
        await api.createUser(formData);
        success('Usuário cadastrado com sucesso!');
      }
      setShowModal(false);
      loadUsers();
    } catch (err: any) {
      error(err.message || 'Erro ao salvar usuário.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-sky-500" />
            <span>Sócios, Usuários & Controle de Permissões</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gestão de acessos simultâneos dos sócios (RUAN, GABRIEL, CLIVER) e controle de RBAC por módulo
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Partners Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {users
          .filter((u) => ['usr_ruan', 'usr_gabriel', 'usr_cliver'].includes(u.id))
          .map((partner) => (
            <div
              key={partner.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className="relative group cursor-pointer shrink-0"
                  onClick={() => handleOpenAvatarModal(partner)}
                  title="Clique para trocar a foto de perfil deste sócio"
                >
                  <img
                    src={partner.avatar || '/src/assets/images/avatar_ruan_1791062648918.jpg'}
                    alt={partner.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-sky-500/40 group-hover:brightness-90 transition-all"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">
                      {partner.name}
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Ativo" />
                  </div>
                  <p className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold">
                    {partner.position}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Último acesso: {formatDateTime(partner.lastLoginAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenAvatarModal(partner)}
                  className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 transition-colors"
                  title="Trocar Foto de Perfil"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(partner)}
                  className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300 transition-colors"
                  title="Editar Permissões"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* All Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs text-slate-900 dark:text-white">
          Todos os Usuários Cadastrados
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Nome / Usuário</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Cargo / Função</th>
                <th className="px-4 py-3">Perfil de Acesso</th>
                <th className="px-4 py-3 text-center">Permissões</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="relative group cursor-pointer shrink-0"
                        onClick={() => handleOpenAvatarModal(u)}
                        title="Clique para trocar foto de perfil"
                      >
                        <img
                          src={u.avatar || '/src/assets/images/avatar_ruan_1791062648918.jpg'}
                          alt={u.name}
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-300 group-hover:brightness-75 transition-all"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{u.email}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                    {u.position}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 uppercase text-[10px]">
                    {u.role}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
                      {u.role === 'admin' ? 'Acesso Total (12)' : `${u.permissions?.length || 0} módulos`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenAvatarModal(u)}
                        className="p-1.5 rounded-md bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-600 dark:bg-slate-800 dark:text-slate-300 transition-colors"
                        title="Trocar Foto"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 rounded-md bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-600 dark:bg-slate-800 dark:text-slate-300 transition-colors"
                        title="Editar Permissões"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar/Editar Usuário */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? `Editar Usuário: ${editingUser.name}` : 'Cadastrar Novo Usuário'}
        subtitle="Controle de credenciais e permissões granulares por módulo"
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Avatar Photo Field in Modal */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={formData.avatar || editingUser?.avatar || '/src/assets/images/avatar_ruan_1791062648918.jpg'}
                alt={formData.name || 'Usuário'}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-sky-500/40"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Foto de Perfil</p>
                <p className="text-[11px] text-slate-400">
                  {formData.avatar ? 'Foto personalizada carregada' : 'Foto atual do usuário'}
                </p>
              </div>
            </div>

            {editingUser && (
              <button
                type="button"
                onClick={() => handleOpenAvatarModal(editingUser)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Trocar Foto</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                E-mail Corporativo *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cargo / Posição
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Ex: Gestor Financeiro"
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nível de Perfil
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              >
                <option value="admin">Administrador (Total)</option>
                <option value="financeiro">Financeiro</option>
                <option value="vendas">Vendas</option>
                <option value="estoque">Estoque</option>
                <option value="colaborador">Colaborador</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {editingUser ? 'Nova Senha (opcional)' : 'Senha de Acesso *'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required={!editingUser}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              />
            </div>
          </div>

          {/* Granular Permissions Checklist */}
          {formData.role !== 'admin' && (
            <div className="pt-2">
              <label className="block font-bold text-slate-900 dark:text-white mb-2">
                Permissões de Acesso por Módulo
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                {ALL_MODULES.map((m) => {
                  const isChecked = formData.permissions.includes(m.id);
                  return (
                    <label
                      key={m.id}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermission(m.id)}
                        className="rounded text-sky-500"
                      />
                      <span className="text-slate-700 dark:text-slate-200 font-medium">{m.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-600 dark:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-bold"
            >
              Salvar Usuário
            </button>
          </div>
        </form>
      </Modal>

      {/* Change Avatar Modal for Partners & Users */}
      <ChangeAvatarModal
        isOpen={avatarModalOpen}
        targetUser={avatarTargetUser || undefined}
        onClose={() => setAvatarModalOpen(false)}
        onAvatarUpdated={(newAvatar) => {
          if (editingUser && avatarTargetUser?.id === editingUser.id) {
            setFormData((prev) => ({ ...prev, avatar: newAvatar }));
          }
          loadUsers();
        }}
      />
    </div>
  );
};
