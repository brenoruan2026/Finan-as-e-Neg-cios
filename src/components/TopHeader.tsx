import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  UserCheck,
  Check,
  Package,
  Users,
  ShoppingCart,
  ClipboardList,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  User as UserIcon,
  Camera,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { NotificationItem, Customer, Product, Sale, Order, User } from '../types/index.ts';
import { formatCurrency, formatDateTime } from '../utils/formatters.ts';
import { ChangeAvatarModal } from './ChangeAvatarModal.tsx';

interface TopHeaderProps {
  onToggleSidebar: () => void;
  onNavigate: (path: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onToggleSidebar, onNavigate }) => {
  const { user, quickSwitch, logout, isDarkMode, toggleDarkMode } = useAuth();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    customers: Customer[];
    products: Product[];
    sales: Sale[];
    orders: Order[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notification state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Profile menu
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Avatar change modal
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [dbUsers, setDbUsers] = useState<User[]>([]);

  // Partner switch dropdown
  const [showSwitchDropdown, setShowSwitchDropdown] = useState(false);
  const switchRef = useRef<HTMLDivElement>(null);

  // Load latest users so partner avatars stay synced in real-time
  useEffect(() => {
    api.getUsers().then(setDbUsers).catch(() => {});
  }, [user?.avatar]);

  const partnerIds = ['usr_ruan', 'usr_gabriel', 'usr_cliver'];
  const partners = partnerIds.map((pid) => {
    const found = dbUsers.find((u) => u.id === pid);
    if (found) {
      return {
        id: found.id,
        name: found.name,
        role: found.position?.split('&')[0] || 'Sócio',
        avatar: found.id === user?.id && user?.avatar ? user.avatar : found.avatar,
      };
    }
    const defaults: Record<string, { name: string; role: string; avatar: string }> = {
      usr_ruan: { name: 'RUAN', role: 'CEO & Adm.', avatar: '/src/assets/images/avatar_ruan_1791062648918.jpg' },
      usr_gabriel: { name: 'GABRIEL', role: 'CTO & Oper.', avatar: '/src/assets/images/avatar_gabriel_1791062659434.jpg' },
      usr_cliver: { name: 'CLIVER', role: 'CFO & Com.', avatar: '/src/assets/images/avatar_cliver_1791062672397.jpg' },
    };
    const def = defaults[pid] || { name: 'SÓCIO', role: 'Sócio', avatar: '' };
    return {
      id: pid,
      name: def.name,
      role: def.role,
      avatar: pid === user?.id && user?.avatar ? user.avatar : def.avatar,
    };
  });

  // Load notifications
  const loadNotifications = async () => {
    try {
      const list = await api.getNotifications();
      setNotifications(list);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000); // Polling every 15s
    return () => clearInterval(interval);
  }, []);

  // Handle global search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await api.search(searchQuery);
        setSearchResults(res);
        setShowSearchDropdown(true);
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listeners
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (switchRef.current && !switchRef.current.contains(e.target as Node)) {
        setShowSwitchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-[#0B192C] border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 flex items-center justify-between gap-4 transition-colors">
      {/* Left: Mobile hamburger & search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input */}
        <div ref={searchRef} className="relative w-full">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim()) setShowSearchDropdown(true);
              }}
              placeholder="Pesquisar clientes, produtos, vendas, pedidos..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 border border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 rounded-lg outline-hidden transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults(null);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {showSearchDropdown && searchResults && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-96 overflow-y-auto z-50">
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Resultados da busca rápida
              </div>

              {/* Customers */}
              {searchResults.customers.length > 0 && (
                <div className="p-1">
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-sky-500" />
                    <span>Clientes</span>
                  </div>
                  {searchResults.customers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onNavigate('/clientes');
                        setShowSearchDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md text-xs flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200">{c.name}</span>
                      <span className="text-[10px] text-slate-400">{c.cpf_cnpj}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Products */}
              {searchResults.products.length > 0 && (
                <div className="p-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Produtos</span>
                  </div>
                  {searchResults.products.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onNavigate('/produtos');
                        setShowSearchDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{p.name}</span>
                        <span className="text-[10px] text-slate-400 ml-2">SKU: {p.sku}</span>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(p.sale_price)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Sales */}
              {searchResults.sales.length > 0 && (
                <div className="p-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Vendas</span>
                  </div>
                  {searchResults.sales.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        onNavigate('/vendas');
                        setShowSearchDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-sky-600 dark:text-sky-400">{s.code}</span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 ml-2">
                          {s.customer_name}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(s.total)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Orders */}
              {searchResults.orders.length > 0 && (
                <div className="p-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-amber-500" />
                    <span>Pedidos</span>
                  </div>
                  {searchResults.orders.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => {
                        onNavigate('/vendas/pedidos');
                        setShowSearchDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md text-xs flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{o.order_number}</span>
                      <span className="text-[11px] text-slate-500 capitalize">{o.status}</span>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.customers.length === 0 &&
                searchResults.products.length === 0 &&
                searchResults.sales.length === 0 &&
                searchResults.orders.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Nenhum registro encontrado para "{searchQuery}".
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Partner quick switch, Notifications, Dark mode, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Partner Quick-Switch Dropdown */}
        <div ref={switchRef} className="relative hidden sm:block">
          <button
            onClick={() => setShowSwitchDropdown((prev) => !prev)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
            title="Alternar entre sócios (Ruan, Gabriel, Cliver)"
          >
            <UserCheck className="w-3.5 h-3.5 text-sky-500" />
            <span className="font-semibold">{user?.name}</span>
            <span className="text-[10px] text-slate-400 hidden md:inline">({user?.position?.split('&')[0]})</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showSwitchDropdown && (
            <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-50">
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-400">
                Acesso dos Sócios (Simultâneo)
              </div>
              {partners.map((p) => {
                const isCurrent = user?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      quickSwitch(p.id);
                      setShowSwitchDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-xs transition-colors ${
                      isCurrent ? 'bg-sky-50/70 dark:bg-sky-950/30' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={p.avatar}
                        alt={p.name}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{p.name}</p>
                        <p className="text-[10px] text-slate-400">{p.role}</p>
                      </div>
                    </div>
                    {isCurrent && <Check className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={isDarkMode ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          aria-label="Alternar tema"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifDropdown((prev) => !prev)}
            className="p-2 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative transition-colors"
            title="Notificações do sistema"
            aria-label="Notificações"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-1.5 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1 z-50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Notificações</h4>
                  <p className="text-[10px] text-slate-400">
                    {unreadCount > 0 ? `${unreadCount} não lida(s)` : 'Tudo em dia'}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    Marcar todas lidas
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">Nenhuma notificação no momento.</div>
                ) : (
                  notifications.map((n) => {
                    let Icon = Info;
                    let iconColor = 'text-sky-500';
                    if (n.type === 'warning') {
                      Icon = AlertTriangle;
                      iconColor = 'text-amber-500';
                    } else if (n.type === 'alert') {
                      Icon = AlertTriangle;
                      iconColor = 'text-rose-500';
                    } else if (n.type === 'success') {
                      Icon = CheckCircle2;
                      iconColor = 'text-emerald-500';
                    }

                    return (
                      <div
                        key={n.id}
                        onClick={() => handleMarkAsRead(n.id)}
                        className={`p-3 text-xs flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors ${
                          !n.read ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h5
                              className={`text-xs font-semibold leading-tight ${
                                !n.read
                                  ? 'text-slate-900 dark:text-white font-bold'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {n.title}
                            </h5>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {formatDateTime(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className="flex items-center gap-2 p-1 pl-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hidden md:inline">
              {user?.name}
            </span>
            <img
              src={user?.avatar || '/src/assets/images/avatar_ruan_1791062648918.jpg'}
              alt={user?.name}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-sky-500/50"
              referrerPolicy="no-referrer"
            />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-white">{user?.name}</p>
                <p className="text-[10px] text-slate-400">{user?.email}</p>
                <p className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 mt-0.5">{user?.position}</p>
              </div>

              <button
                onClick={() => {
                  setShowAvatarModal(true);
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Trocar Minha Foto de Perfil</span>
              </button>

              <button
                onClick={() => {
                  onNavigate('/perfil');
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Meu Perfil & Senha</span>
              </button>

              <button
                onClick={() => {
                  onNavigate('/configuracoes');
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Configurações da Empresa</span>
              </button>

              <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                <button
                  onClick={() => {
                    logout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-medium"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Sair do Sistema</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Change Avatar Modal */}
      <ChangeAvatarModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
      />
    </header>
  );
};
