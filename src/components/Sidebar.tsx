import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Landmark,
  Coins,
  Tags,
  ShoppingCart,
  PlusCircle,
  ClipboardList,
  Users2,
  Percent,
  Package,
  Boxes,
  Truck,
  BarChart3,
  ShieldCheck,
  History,
  Settings,
  LogOut,
  X,
  User,
  Camera,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { AppModule } from '../types/index.ts';
import { NexoraLogo } from './NexoraLogo.tsx';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  module: AppModule;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, isOpen, onClose }) => {
  const { user, logout, hasPermission } = useAuth();

  const sections: NavSection[] = [
    {
      title: 'INÍCIO',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, module: 'dashboard' },
      ],
    },
    {
      title: 'FINANCEIRO',
      items: [
        { name: 'Visão financeira', path: '/financeiro', icon: Wallet, module: 'financeiro' },
        { name: 'Contas a receber', path: '/financeiro/receber', icon: ArrowDownLeft, module: 'financeiro' },
        { name: 'Contas a pagar', path: '/financeiro/pagar', icon: ArrowUpRight, module: 'financeiro' },
        { name: 'Movimentações', path: '/financeiro/movimentacoes', icon: RefreshCw, module: 'financeiro' },
        { name: 'Caixa operacional', path: '/financeiro/caixa', icon: Coins, module: 'financeiro' },
        { name: 'Contas bancárias', path: '/financeiro/contas', icon: Landmark, module: 'financeiro' },
        { name: 'Categorias', path: '/financeiro/categorias', icon: Tags, module: 'financeiro' },
      ],
    },
    {
      title: 'COMERCIAL',
      items: [
        { name: 'Vendas', path: '/vendas', icon: ShoppingCart, module: 'vendas' },
        { name: 'Nova venda', path: '/vendas/nova', icon: PlusCircle, module: 'vendas', badge: 'Novo' },
        { name: 'Pedidos', path: '/vendas/pedidos', icon: ClipboardList, module: 'pedidos' },
        { name: 'Clientes', path: '/clientes', icon: Users2, module: 'clientes' },
        { name: 'Comissões', path: '/vendas/comissoes', icon: Percent, module: 'vendas' },
      ],
    },
    {
      title: 'PRODUTOS & ESTOQUE',
      items: [
        { name: 'Produtos', path: '/produtos', icon: Package, module: 'produtos' },
        { name: 'Controle de estoque', path: '/produtos/estoque', icon: Boxes, module: 'estoque' },
        { name: 'Fornecedores', path: '/fornecedores', icon: Truck, module: 'fornecedores' },
      ],
    },
    {
      title: 'RELATÓRIOS',
      items: [
        { name: 'Central de relatórios', path: '/relatorios', icon: BarChart3, module: 'relatorios' },
      ],
    },
    {
      title: 'ADMINISTRAÇÃO',
      items: [
        { name: 'Meu Perfil & Foto', path: '/perfil', icon: User, module: 'dashboard' },
        { name: 'Usuários & Sócios', path: '/usuarios', icon: ShieldCheck, module: 'usuarios' },
        { name: 'Auditoria & Atividades', path: '/atividades', icon: History, module: 'atividades' },
        { name: 'Configurações', path: '/configuracoes', icon: Settings, module: 'configuracoes' },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-68 bg-[#0B192C] text-slate-200 border-r border-[#1E3E62]/40 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-4 border-b border-[#1E3E62]/40 flex items-center justify-between shrink-0 bg-[#071322]">
          <NexoraLogo
            size="sm"
            variant="full"
            className="cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => onNavigate('/dashboard')}
          />
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card Mini with quick profile and photo change */}
        <div
          onClick={() => onNavigate('/perfil')}
          className="px-4 py-3 bg-[#0c1e36]/70 border-b border-[#1E3E62]/30 flex items-center gap-3 cursor-pointer group hover:bg-[#0c1e36] transition-colors"
          title="Clique para gerenciar seu perfil e trocar foto"
        >
          <div className="relative shrink-0">
            <img
              src={user?.avatar || '/src/assets/images/avatar_ruan_1791062648918.jpg'}
              alt={user?.name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-sky-500/40 group-hover:ring-sky-400 shrink-0 transition-all"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-4 h-4 text-white drop-shadow-sm" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-white group-hover:text-sky-300 truncate transition-colors">
                {user?.name}
              </p>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Online" />
            </div>
            <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
              <span>{user?.position}</span>
            </p>
          </div>
        </div>

        {/* Navigation scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
          {sections.map((sec) => {
            const accessibleItems = sec.items.filter((item) => hasPermission(item.module));
            if (accessibleItems.length === 0) return null;

            return (
              <div key={sec.title} className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/80">
                  {sec.title}
                </p>
                {accessibleItems.map((item) => {
                  const isActive = currentPath === item.path;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        onNavigate(item.path);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-sky-500 text-white font-semibold shadow-xs'
                          : 'text-slate-300 hover:bg-[#152e4d] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-300'
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-400/20 text-sky-300 border border-sky-400/30">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer logout */}
        <div className="p-3 border-t border-[#1E3E62]/40 bg-[#071322] shrink-0">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-rose-300 hover:bg-rose-500/10 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-400" />
            <span>Sair do sistema</span>
          </button>
        </div>
      </aside>
    </>
  );
};
