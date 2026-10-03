import {
  User,
  DashboardMetrics,
  AccountReceivable,
  AccountPayable,
  FinancialTransaction,
  BankAccount,
  FinancialCategory,
  CashRegister,
  Sale,
  Order,
  Commission,
  Customer,
  Supplier,
  Product,
  InventoryMovement,
  AuditLog,
  NotificationItem,
  CompanySettings,
} from '../types/index.ts';

const TOKEN_KEY = 'nexora_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      removeStoredToken();
      // Optional callback or event
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `Erro ${res.status}: falha na requisição.`);
    }

    return data as T;
  } catch (err: any) {
    if (!navigator.onLine) {
      throw new Error('Sem conexão com a internet. Verifique sua conexão para continuar.');
    }
    throw err;
  }
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  quickSwitch: (userId: string) =>
    request<{ token: string; user: User }>('/api/auth/quick-switch', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  getMe: () => request<{ user: User }>('/api/auth/me'),

  updateProfile: (data: { name?: string; position?: string; avatar?: string }) =>
    request<{ user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  logout: () =>
    request<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    }),

  // Dashboard
  getMetrics: () => request<DashboardMetrics>('/api/dashboard/metrics'),
  getCharts: (period: string = '30d') =>
    request<{
      period: string;
      monthlyBreakdown: Array<{ month: string; receita: number; despesa: number; lucro: number }>;
      categoryBreakdown: Array<{ name: string; value: number }>;
      salesByRep: Record<string, { count: number; total: number }>;
    }>(`/api/dashboard/charts?period=${period}`),
  getAlerts: () =>
    request<Array<{ id: string; type: string; title: string; message: string; severity: 'high' | 'medium' | 'low' }>>(
      '/api/dashboard/alerts'
    ),

  // Receivables
  getReceivables: (params?: { status?: string; customer_id?: string; startDate?: string; endDate?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<AccountReceivable[]>(`/api/financial/receivables${qs ? '?' + qs : ''}`);
  },
  createReceivable: (data: Partial<AccountReceivable>) =>
    request<AccountReceivable>('/api/financial/receivables', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  receiveAccount: (id: string, destination_account_id: string, notes?: string) =>
    request<AccountReceivable>(`/api/financial/receivables/${id}/receive`, {
      method: 'POST',
      body: JSON.stringify({ destination_account_id, notes }),
    }),
  deleteReceivable: (id: string) =>
    request<{ success: boolean }>(`/api/financial/receivables/${id}`, {
      method: 'DELETE',
    }),

  // Payables
  getPayables: (params?: { status?: string; supplier_id?: string; startDate?: string; endDate?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<AccountPayable[]>(`/api/financial/payables${qs ? '?' + qs : ''}`);
  },
  createPayable: (data: Partial<AccountPayable>) =>
    request<AccountPayable>('/api/financial/payables', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  payAccount: (id: string, source_account_id: string, notes?: string) =>
    request<AccountPayable>(`/api/financial/payables/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ source_account_id, notes }),
    }),
  deletePayable: (id: string) =>
    request<{ success: boolean }>(`/api/financial/payables/${id}`, {
      method: 'DELETE',
    }),

  // Transactions
  getTransactions: (params?: { type?: string; account_id?: string; startDate?: string; endDate?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<FinancialTransaction[]>(`/api/financial/transactions${qs ? '?' + qs : ''}`);
  },
  createTransaction: (data: Partial<FinancialTransaction>) =>
    request<FinancialTransaction>('/api/financial/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Bank Accounts
  getBankAccounts: () => request<BankAccount[]>('/api/financial/accounts'),
  createBankAccount: (data: Partial<BankAccount>) =>
    request<BankAccount>('/api/financial/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  transferBetweenAccounts: (source_account_id: string, destination_account_id: string, amount: number, notes?: string) =>
    request<{ success: boolean; message: string }>('/api/financial/transfer', {
      method: 'POST',
      body: JSON.stringify({ source_account_id, destination_account_id, amount, notes }),
    }),

  // Cash Register
  getCashRegisters: () => request<CashRegister[]>('/api/financial/cash'),
  closeCashRegister: (register_id: string, final_counted_balance: number, notes?: string) =>
    request<CashRegister>('/api/financial/cash/close', {
      method: 'POST',
      body: JSON.stringify({ register_id, final_counted_balance, notes }),
    }),

  // Categories
  getCategories: () => request<FinancialCategory[]>('/api/financial/categories'),
  createCategory: (name: string, type: 'receita' | 'despesa', color?: string) =>
    request<FinancialCategory>('/api/financial/categories', {
      method: 'POST',
      body: JSON.stringify({ name, type, color }),
    }),

  // Sales
  getSales: (params?: { customer_id?: string; seller_id?: string; startDate?: string; endDate?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<Sale[]>(`/api/sales${qs ? '?' + qs : ''}`);
  },
  createSale: (data: Partial<Sale>) =>
    request<Sale>('/api/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Orders
  getOrders: () => request<Order[]>('/api/orders'),
  updateOrderStatus: (id: string, status: string) =>
    request<Order>(`/api/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // Commissions
  getCommissions: () => request<Commission[]>('/api/commissions'),
  payCommission: (id: string) =>
    request<Commission>(`/api/commissions/${id}/pay`, {
      method: 'POST',
    }),

  // Customers
  getCustomers: () => request<Customer[]>('/api/customers'),
  createCustomer: (data: Partial<Customer>) =>
    request<Customer>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCustomer: (id: string, data: Partial<Customer>) =>
    request<Customer>(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Suppliers
  getSuppliers: () => request<Supplier[]>('/api/suppliers'),
  createSupplier: (data: Partial<Supplier>) =>
    request<Supplier>('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSupplier: (id: string, data: Partial<Supplier>) =>
    request<Supplier>(`/api/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Products
  getProducts: () => request<Product[]>('/api/products'),
  createProduct: (data: Partial<Product>) =>
    request<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProduct: (id: string, data: Partial<Product>) =>
    request<Product>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Inventory movements
  getInventoryMovements: () => request<InventoryMovement[]>('/api/inventory/movements'),
  createInventoryMovement: (data: {
    product_id: string;
    quantity: number;
    type: 'entrada' | 'saida' | 'ajuste' | 'devolucao';
    reason: string;
    notes?: string;
  }) =>
    request<InventoryMovement>('/api/inventory/movements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Reports
  getFinancialReport: (startDate?: string, endDate?: string) => {
    const qs = new URLSearchParams({ ...(startDate ? { startDate } : {}), ...(endDate ? { endDate } : {}) }).toString();
    return request<{
      totalEntradas: number;
      totalSaidas: number;
      lucroLiquido: number;
      margemOperacional: number;
      transactions: FinancialTransaction[];
    }>(`/api/reports/financial${qs ? '?' + qs : ''}`);
  },

  getSalesReport: (startDate?: string, endDate?: string) => {
    const qs = new URLSearchParams({ ...(startDate ? { startDate } : {}), ...(endDate ? { endDate } : {}) }).toString();
    return request<{
      totalVendas: number;
      totalPedidos: number;
      ticketMedio: number;
      topProducts: Array<{ name: string; quantity: number; total: number }>;
      sales: Sale[];
    }>(`/api/reports/sales${qs ? '?' + qs : ''}`);
  },

  getInventoryReport: () =>
    request<{
      totalValue: number;
      totalItems: number;
      lowStock: Product[];
      allProducts: Product[];
    }>('/api/reports/inventory'),

  // Users
  getUsers: () => request<User[]>('/api/users'),
  createUser: (data: any) =>
    request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUser: (id: string, data: any) =>
    request<User>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Audit
  getAuditLogs: (params?: { module?: string; user_id?: string; limit?: number }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<AuditLog[]>(`/api/audit-logs${qs ? '?' + qs : ''}`);
  },

  // Notifications
  getNotifications: () => request<NotificationItem[]>('/api/notifications'),
  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/api/notifications/read-all', { method: 'POST' }),

  // Settings
  getSettings: () => request<CompanySettings>('/api/settings'),
  updateSettings: (data: Partial<CompanySettings>) =>
    request<CompanySettings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Global search
  search: (query: string) =>
    request<{
      customers: Customer[];
      products: Product[];
      sales: Sale[];
      orders: Order[];
    }>(`/api/search?q=${encodeURIComponent(query)}`),
};
