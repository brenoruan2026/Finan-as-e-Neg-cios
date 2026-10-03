export type UserRole = 'admin' | 'financeiro' | 'vendas' | 'estoque' | 'colaborador';

export type AppModule =
  | 'dashboard'
  | 'financeiro'
  | 'vendas'
  | 'pedidos'
  | 'produtos'
  | 'estoque'
  | 'clientes'
  | 'fornecedores'
  | 'relatorios'
  | 'usuarios'
  | 'atividades'
  | 'configuracoes';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  position: string;
  avatar?: string;
  status: 'ativo' | 'inativo';
  permissions: AppModule[];
  createdAt: string;
  lastLoginAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  cpf_cnpj: string;
  phone: string;
  whatsapp?: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  cep?: string;
  notes?: string;
  status: 'ativo' | 'inativo';
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  cpf_cnpj: string;
  phone: string;
  whatsapp?: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  cep?: string;
  notes?: string;
  status: 'ativo' | 'inativo';
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description?: string;
  photo?: string;
  supplier_id?: string;
  supplier_name?: string;
  cost: number; // In BRL Reais (stored as accurate decimal number)
  sale_price: number;
  margin: number;
  margin_percentage: number;
  current_stock: number;
  min_stock: number;
  status: 'ativo' | 'inativo';
  createdAt: string;
  updatedAt: string;
}

export type InventoryMovementType = 'entrada' | 'saida' | 'ajuste' | 'venda' | 'devolucao';

export interface InventoryMovement {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  type: InventoryMovementType;
  date: string;
  user_id: string;
  user_name: string;
  reason: string;
  notes?: string;
  reference_id?: string;
  createdAt: string;
}

export interface SaleItem {
  product_id: string;
  product_name: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  total: number;
}

export type PaymentMethod =
  | 'pix'
  | 'dinheiro'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'transferencia'
  | 'boleto';

export interface Sale {
  id: string;
  code: string;
  customer_id: string;
  customer_name: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payment_method: PaymentMethod;
  destination_account_id?: string;
  destination_account_name?: string;
  seller_id: string;
  seller_name: string;
  date: string;
  notes?: string;
  status: 'concluida' | 'cancelada';
  createdAt: string;
}

export type OrderStatus =
  | 'rascunho'
  | 'confirmado'
  | 'em_preparacao'
  | 'enviado'
  | 'entregue'
  | 'cancelado';

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  items: SaleItem[];
  total: number;
  status: OrderStatus;
  date: string;
  responsible_id: string;
  responsible_name: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Commission {
  id: string;
  sale_id: string;
  sale_code: string;
  seller_id: string;
  seller_name: string;
  percentage: number;
  commission_amount: number;
  status: 'pendente' | 'pago';
  payment_date?: string;
  createdAt: string;
}

export type BankAccountType =
  | 'conta_corrente'
  | 'conta_poupanca'
  | 'carteira'
  | 'caixa'
  | 'conta_digital';

export interface BankAccount {
  id: string;
  name: string;
  bank: string;
  agency?: string;
  account_number?: string;
  type: BankAccountType;
  initial_balance: number;
  current_balance: number;
  status: 'ativa' | 'inativa';
  createdAt: string;
}

export type ReceivableStatus = 'pendente' | 'recebido' | 'parcial' | 'atrasado' | 'cancelado';

export interface AccountReceivable {
  id: string;
  code: string;
  customer_id?: string;
  customer_name: string;
  description: string;
  sale_id?: string;
  category_id: string;
  category_name: string;
  amount: number;
  issue_date: string;
  due_date: string;
  payment_date?: string;
  payment_method: PaymentMethod;
  destination_account_id?: string;
  destination_account_name?: string;
  status: ReceivableStatus;
  notes?: string;
  receipt_url?: string;
  responsible_user: string;
  createdAt: string;
  updatedAt: string;
}

export type PayableStatus = 'pendente' | 'pago' | 'parcial' | 'atrasado' | 'cancelado';

export interface AccountPayable {
  id: string;
  code: string;
  supplier_id?: string;
  supplier_name: string;
  description: string;
  category_id: string;
  category_name: string;
  amount: number;
  issue_date: string;
  due_date: string;
  payment_date?: string;
  payment_method: PaymentMethod;
  source_account_id?: string;
  source_account_name?: string;
  status: PayableStatus;
  notes?: string;
  receipt_url?: string;
  responsible_user: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'entrada' | 'saida' | 'transferencia';

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  category_id?: string;
  category_name?: string;
  account_id: string;
  account_name: string;
  destination_account_id?: string;
  destination_account_name?: string;
  date: string;
  user_id: string;
  user_name: string;
  reference_type?: 'venda' | 'conta_receber' | 'conta_pagar' | 'ajuste' | 'transferencia' | 'manual';
  reference_id?: string;
  notes?: string;
  createdAt: string;
}

export interface CashRegister {
  id: string;
  date: string;
  responsible_id: string;
  responsible_name: string;
  initial_balance: number;
  entries: number;
  exits: number;
  final_balance: number;
  difference: number;
  status: 'aberto' | 'fechado';
  notes?: string;
  openedAt: string;
  closedAt?: string;
}

export interface FinancialCategory {
  id: string;
  name: string;
  type: 'receita' | 'despesa';
  color: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  module: string;
  description: string;
  affected_record?: string;
  previous_value?: string;
  new_value?: string;
  timestamp: string;
  ip_address?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  module: string;
  read: boolean;
  createdAt: string;
}

export interface CompanySettings {
  id: string;
  name: string;
  trade_name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  cep: string;
  currency: string;
  logo_url?: string;
  default_payment_methods: PaymentMethod[];
  system_preferences: {
    lowStockThreshold: number;
    requireReceiptForExpenses: boolean;
    autoUpdateCashFlow: boolean;
    defaultCommissionPercentage: number;
  };
  updatedAt: string;
}

export interface DashboardMetrics {
  currentBalance: number;
  monthRevenue: number;
  monthExpenses: number;
  monthProfit: number;
  pendingReceivable: number;
  pendingPayable: number;
  monthSalesCount: number;
  monthSalesTotal: number;
  inventoryTotalValue: number;
  lowStockItemsCount: number;
  overduePayableCount: number;
  overdueReceivableCount: number;
  profitMarginPercent: number;
  comparisons: {
    balanceChangePercent: number;
    revenueChangePercent: number;
    expensesChangePercent: number;
    salesChangePercent: number;
  };
}
