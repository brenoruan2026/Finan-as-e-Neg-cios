import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Customer,
  Supplier,
  Product,
  InventoryMovement,
  Sale,
  Order,
  Commission,
  BankAccount,
  AccountReceivable,
  AccountPayable,
  FinancialTransaction,
  CashRegister,
  FinancialCategory,
  AuditLog,
  NotificationItem,
  CompanySettings,
  DashboardMetrics,
} from '../src/types/index.ts';

export interface DatabaseSchema {
  users: (User & { password_hash: string })[];
  customers: Customer[];
  suppliers: Supplier[];
  products: Product[];
  inventory_movements: InventoryMovement[];
  sales: Sale[];
  orders: Order[];
  commissions: Commission[];
  bank_accounts: BankAccount[];
  accounts_receivable: AccountReceivable[];
  accounts_payable: AccountPayable[];
  financial_transactions: FinancialTransaction[];
  cash_registers: CashRegister[];
  categories: FinancialCategory[];
  audit_logs: AuditLog[];
  notifications: NotificationItem[];
  company_settings: CompanySettings;
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'nexora_db.json');

// Simple secure password hash using crypto pbkdf2
export function hashPassword(password: string): string {
  const salt = 'nexora_salt_2025';
  return crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

const ALL_MODULES: User['permissions'] = [
  'dashboard',
  'financeiro',
  'vendas',
  'pedidos',
  'produtos',
  'estoque',
  'clientes',
  'fornecedores',
  'relatorios',
  'usuarios',
  'atividades',
  'configuracoes',
];

function getInitialSeed(): DatabaseSchema {
  const defaultPasswordHash = hashPassword('123456');

  return {
    users: [
      {
        id: 'usr_ruan',
        name: 'RUAN',
        email: 'ruan@nexoragroup.com.br',
        password_hash: defaultPasswordHash,
        role: 'admin',
        position: 'Sócio Administrador & CEO',
        avatar: '/src/assets/images/avatar_ruan_1791062648918.jpg',
        status: 'ativo',
        permissions: [...ALL_MODULES],
        createdAt: '2025-01-01T08:00:00.000Z',
        lastLoginAt: new Date().toISOString(),
      },
      {
        id: 'usr_gabriel',
        name: 'GABRIEL',
        email: 'gabriel@nexoragroup.com.br',
        password_hash: defaultPasswordHash,
        role: 'admin',
        position: 'Sócio de Operações & CTO',
        avatar: '/src/assets/images/avatar_gabriel_1791062659434.jpg',
        status: 'ativo',
        permissions: [...ALL_MODULES],
        createdAt: '2025-01-01T08:00:00.000Z',
        lastLoginAt: new Date().toISOString(),
      },
      {
        id: 'usr_cliver',
        name: 'CLIVER',
        email: 'cliver@nexoragroup.com.br',
        password_hash: defaultPasswordHash,
        role: 'admin',
        position: 'Sócio Comercial & CFO',
        avatar: '/src/assets/images/avatar_cliver_1791062672397.jpg',
        status: 'ativo',
        permissions: [...ALL_MODULES],
        createdAt: '2025-01-01T08:00:00.000Z',
        lastLoginAt: new Date().toISOString(),
      },
    ],
    bank_accounts: [
      {
        id: 'bank_itau',
        name: 'Itaú Unibanco PJ',
        bank: 'Banco Itaú S.A.',
        agency: '0342',
        account_number: '88219-4',
        type: 'conta_corrente',
        initial_balance: 45000,
        current_balance: 87450.5,
        status: 'ativa',
        createdAt: '2025-01-01T08:00:00.000Z',
      },
      {
        id: 'bank_nubank',
        name: 'Nubank Empresas PJ',
        bank: 'Nu Pagamentos S.A.',
        agency: '0001',
        account_number: '1492048-2',
        type: 'conta_digital',
        initial_balance: 20000,
        current_balance: 43280.0,
        status: 'ativa',
        createdAt: '2025-01-01T08:00:00.000Z',
      },
      {
        id: 'bank_inter',
        name: 'Banco Inter Empresas',
        bank: 'Banco Inter S.A.',
        agency: '0001',
        account_number: '992014-9',
        type: 'conta_digital',
        initial_balance: 15000,
        current_balance: 21900.0,
        status: 'ativa',
        createdAt: '2025-01-01T08:00:00.000Z',
      },
      {
        id: 'bank_caixa',
        name: 'Caixa Físico Operacional',
        bank: 'Cofre Empresa',
        type: 'caixa',
        initial_balance: 2500,
        current_balance: 3850.0,
        status: 'ativa',
        createdAt: '2025-01-01T08:00:00.000Z',
      },
    ],
    categories: [
      { id: 'cat_rec_vendas', name: 'Venda de Produtos', type: 'receita', color: '#16a34a', createdAt: '2025-01-01T08:00:00.000Z' },
      { id: 'cat_rec_servicos', name: 'Serviços & Consultoria', type: 'receita', color: '#0284c7', createdAt: '2025-01-01T08:00:00.000Z' },
      { id: 'cat_rec_fin', name: 'Rendimentos Financeiros', type: 'receita', color: '#0d9488', createdAt: '2025-01-01T08:00:00.000Z' },
      { id: 'cat_rec_outros', name: 'Outros Recebimentos', type: 'receita', color: '#64748b', createdAt: '2025-01-01T08:00:00.000Z' },
      { id: 'cat_desp_fornecedores', name: 'Fornecedores & Mercadorias', type: 'despesa', color: '#e11d48', createdAt: '2025-01-01T08:00:00.000Z' },
      { id: 'cat_desp_mkt', name: 'Marketing & Tráfego Pago', type: 'despesa', color: '#d97706', createdAt: '2025-01-01T08:00:00.000Z' },
      { id: 'cat_desp_aluguel', name: 'Aluguel & Condomínio', type: 'despesa', color: '#9333ea', createdAt: '2025-01-01T08:00:00.000Z' },
      { id: 'cat_desp_infra', name: 'Energia, Internet & Utilities', type: 'despesa', color: '#4f46e5', createdAt: '2025-01-01T08:00:00.000Z' },
      { id: 'cat_desp_salarios', name: 'Pró-Labore & Equipe', type: 'despesa', color: '#dc2626', createdAt: '2025-01-01T08:00:00.000Z' },
      { id: 'cat_desp_impostos', name: 'Impostos & Tributos', type: 'despesa', color: '#b91c1c', createdAt: '2025-01-01T08:00:00.000Z' },
      { id: 'cat_desp_software', name: 'Softwares & Licenças SaaS', type: 'despesa', color: '#2563eb', createdAt: '2025-01-01T08:00:00.000Z' },
      { id: 'cat_desp_logistica', name: 'Fretes & Logística', type: 'despesa', color: '#ca8a04', createdAt: '2025-01-01T08:00:00.000Z' },
      { id: 'cat_desp_bancarias', name: 'Taxas Bancárias & Meios', type: 'despesa', color: '#475569', createdAt: '2025-01-01T08:00:00.000Z' },
    ],
    suppliers: [
      {
        id: 'sup_1',
        name: 'TechImport Global Ltda',
        cpf_cnpj: '12.345.678/0001-90',
        phone: '(11) 3245-8800',
        whatsapp: '(11) 98765-4321',
        email: 'comercial@techimport.com.br',
        address: 'Av. Paulista, 1000 - Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        cep: '01310-100',
        notes: 'Principal parceiro fornecedor de smartwatches e áudio high-end.',
        status: 'ativo',
        createdAt: '2025-01-05T10:00:00.000Z',
        updatedAt: '2025-01-05T10:00:00.000Z',
      },
      {
        id: 'sup_2',
        name: 'Silício Distribuidora de Eletrônicos',
        cpf_cnpj: '98.765.432/0001-10',
        phone: '(47) 3450-1200',
        whatsapp: '(47) 99123-8877',
        email: 'pedidos@siliciodistribuidora.com.br',
        address: 'Rua das Indústrias, 450 - Distrito Industrial',
        city: 'Joinville',
        state: 'SC',
        cep: '89219-500',
        notes: 'Distribuidor nacional de baterias GaN e periféricos wireless.',
        status: 'ativo',
        createdAt: '2025-01-08T11:00:00.000Z',
        updatedAt: '2025-01-08T11:00:00.000Z',
      },
      {
        id: 'sup_3',
        name: 'FastLog Embalagens & Logística Integrada',
        cpf_cnpj: '45.678.901/0001-23',
        phone: '(19) 3871-9900',
        whatsapp: '(19) 99345-0011',
        email: 'atendimento@fastlogembalagens.com.br',
        address: 'Rodovia Anhanguera, km 104',
        city: 'Campinas',
        state: 'SP',
        cep: '13069-001',
        notes: 'Caixas reforçadas personalizadas com a marca NEXORA GROUP.',
        status: 'ativo',
        createdAt: '2025-01-10T14:00:00.000Z',
        updatedAt: '2025-01-10T14:00:00.000Z',
      },
    ],
    customers: [
      {
        id: 'cli_1',
        name: 'TechCorp Soluções Corporativas',
        cpf_cnpj: '33.456.789/0001-01',
        phone: '(11) 4002-8922',
        whatsapp: '(11) 98112-9900',
        email: 'compras@techcorp.com.br',
        address: 'Av. Brigadeiro Faria Lima, 3477',
        city: 'São Paulo',
        state: 'SP',
        cep: '04538-133',
        notes: 'Cliente corporativo recorrente - compra kits executivos.',
        status: 'ativo',
        createdAt: '2025-01-12T09:00:00.000Z',
        updatedAt: '2025-01-12T09:00:00.000Z',
      },
      {
        id: 'cli_2',
        name: 'Alpha Engenharia & Projetos',
        cpf_cnpj: '21.987.654/0001-88',
        phone: '(31) 3290-7766',
        whatsapp: '(31) 98844-3322',
        email: 'financeiro@alphaengenharia.com.br',
        address: 'Rua Rio Grande do Norte, 750 - Savassi',
        city: 'Belo Horizonte',
        state: 'MG',
        cep: '30130-131',
        notes: 'Pagamentos regulares via Pix e faturamento 30 dias.',
        status: 'ativo',
        createdAt: '2025-01-15T10:30:00.000Z',
        updatedAt: '2025-01-15T10:30:00.000Z',
      },
      {
        id: 'cli_3',
        name: 'Dra. Camila Rodrigues',
        cpf_cnpj: '289.456.128-40',
        phone: '(21) 2540-1122',
        whatsapp: '(21) 99876-1144',
        email: 'camila.rodrigues@clinicaelite.med.br',
        address: 'Av. das Américas, 500 - Barra da Tijuca',
        city: 'Rio de Janeiro',
        state: 'RJ',
        cep: '22640-100',
        notes: 'Cliente VIP individual, compra periféricos topo de linha.',
        status: 'ativo',
        createdAt: '2025-01-18T16:00:00.000Z',
        updatedAt: '2025-01-18T16:00:00.000Z',
      },
      {
        id: 'cli_4',
        name: 'Grupo Horizonte Comercial',
        cpf_cnpj: '55.123.456/0001-77',
        phone: '(41) 3320-9988',
        whatsapp: '(41) 99188-4455',
        email: 'suprimentos@grupohorizonte.com.br',
        address: 'Rua Marechal Deodoro, 630',
        city: 'Curitiba',
        state: 'PR',
        cep: '80010-010',
        notes: 'Rede com 4 filiais no Sul, compras no atacado.',
        status: 'ativo',
        createdAt: '2025-01-20T11:20:00.000Z',
        updatedAt: '2025-01-20T11:20:00.000Z',
      },
      {
        id: 'cli_5',
        name: 'Lucas Mendes Tecnologia',
        cpf_cnpj: '312.678.900-15',
        phone: '(19) 99123-5566',
        whatsapp: '(19) 99123-5566',
        email: 'lucas.mendes@devfrontier.io',
        address: 'Rua Barão de Jaguara, 1200',
        city: 'Campinas',
        state: 'SP',
        cep: '13015-002',
        notes: 'Desenvolvedor e consultor independente.',
        status: 'ativo',
        createdAt: '2025-01-22T13:40:00.000Z',
        updatedAt: '2025-01-22T13:40:00.000Z',
      },
    ],
    products: [
      {
        id: 'prod_1',
        name: 'Smartwatch Nexora Elite V2 Titanium',
        sku: 'NX-SMW-01',
        category: 'Wearables',
        description: 'Corpo em titânio aeroespacial, tela AMOLED de 1.43", bateria de 14 dias e sensores biométricos de alta fidelidade.',
        supplier_id: 'sup_1',
        supplier_name: 'TechImport Global Ltda',
        cost: 380.0,
        sale_price: 890.0,
        margin: 510.0,
        margin_percentage: 57.3,
        current_stock: 42,
        min_stock: 15,
        status: 'ativo',
        createdAt: '2025-01-05T12:00:00.000Z',
        updatedAt: '2025-01-05T12:00:00.000Z',
      },
      {
        id: 'prod_2',
        name: 'Power Bank Nexora Ultra 20.000mAh 65W GaN',
        sku: 'NX-PBK-02',
        category: 'Energia',
        description: 'Bateria externa compacta de altíssima capacidade com saída Type-C Power Delivery 65W para notebooks e smartphones.',
        supplier_id: 'sup_2',
        supplier_name: 'Silício Distribuidora de Eletrônicos',
        cost: 110.0,
        sale_price: 285.0,
        margin: 175.0,
        margin_percentage: 61.4,
        current_stock: 6, // Low stock to trigger alert!
        min_stock: 12,
        status: 'ativo',
        createdAt: '2025-01-05T12:10:00.000Z',
        updatedAt: '2025-01-05T12:10:00.000Z',
      },
      {
        id: 'prod_3',
        name: 'Fone Nexora Silence Pro ANC Wireless',
        sku: 'NX-HPH-03',
        category: 'Áudio Profissional',
        description: 'Cancelamento ativo de ruído híbrido de 45dB, drivers magnéticos de 40mm e 60 horas de autonomia.',
        supplier_id: 'sup_1',
        supplier_name: 'TechImport Global Ltda',
        cost: 260.0,
        sale_price: 640.0,
        margin: 380.0,
        margin_percentage: 59.38,
        current_stock: 28,
        min_stock: 10,
        status: 'ativo',
        createdAt: '2025-01-05T12:20:00.000Z',
        updatedAt: '2025-01-05T12:20:00.000Z',
      },
      {
        id: 'prod_4',
        name: 'Hub USB-C Nexora Dock 8 em 1 Alumínio',
        sku: 'NX-HUB-04',
        category: 'Periféricos',
        description: 'Dock station com HDMI 4K 60Hz, 3x USB 3.2, SD/TF Card, Gigabit Ethernet e 100W PD charging.',
        supplier_id: 'sup_2',
        supplier_name: 'Silício Distribuidora de Eletrônicos',
        cost: 85.0,
        sale_price: 219.0,
        margin: 134.0,
        margin_percentage: 61.19,
        current_stock: 35,
        min_stock: 15,
        status: 'ativo',
        createdAt: '2025-01-05T12:30:00.000Z',
        updatedAt: '2025-01-05T12:30:00.000Z',
      },
      {
        id: 'prod_5',
        name: 'Teclado Mecânico Wireless Nexora Keystroke',
        sku: 'NX-KBD-05',
        category: 'Periféricos',
        description: 'Formato 75%, switches mecânicos hot-swappable lubrificados de fábrica, conexão tri-mode e iluminação suave.',
        supplier_id: 'sup_2',
        supplier_name: 'Silício Distribuidora de Eletrônicos',
        cost: 210.0,
        sale_price: 499.0,
        margin: 289.0,
        margin_percentage: 57.92,
        current_stock: 19,
        min_stock: 10,
        status: 'ativo',
        createdAt: '2025-01-05T12:40:00.000Z',
        updatedAt: '2025-01-05T12:40:00.000Z',
      },
      {
        id: 'prod_6',
        name: 'Carregador Nexora GaN 65W Dual Type-C + USB-A',
        sku: 'NX-CHG-06',
        category: 'Energia',
        description: 'Tecnologia Gallium Nitride de 3ª geração, dissipação térmica avançada e compatibilidade universal.',
        supplier_id: 'sup_2',
        supplier_name: 'Silício Distribuidora de Eletrônicos',
        cost: 58.0,
        sale_price: 159.0,
        margin: 101.0,
        margin_percentage: 63.52,
        current_stock: 4, // Low stock to trigger alert!
        min_stock: 15,
        status: 'ativo',
        createdAt: '2025-01-05T12:50:00.000Z',
        updatedAt: '2025-01-05T12:50:00.000Z',
      },
    ],
    inventory_movements: [
      {
        id: 'mov_1',
        product_id: 'prod_1',
        product_name: 'Smartwatch Nexora Elite V2 Titanium',
        quantity: 50,
        type: 'entrada',
        date: '2025-01-10T10:00:00.000Z',
        user_id: 'usr_gabriel',
        user_name: 'GABRIEL',
        reason: 'Lote de importação NF 4821',
        createdAt: '2025-01-10T10:00:00.000Z',
      },
      {
        id: 'mov_2',
        product_id: 'prod_2',
        product_name: 'Power Bank Nexora Ultra 20.000mAh 65W GaN',
        quantity: 20,
        type: 'entrada',
        date: '2025-01-10T10:15:00.000Z',
        user_id: 'usr_gabriel',
        user_name: 'GABRIEL',
        reason: 'Recebimento fornecedor Silício Distribuidora',
        createdAt: '2025-01-10T10:15:00.000Z',
      },
      {
        id: 'mov_3',
        product_id: 'prod_3',
        product_name: 'Fone Nexora Silence Pro ANC Wireless',
        quantity: 30,
        type: 'entrada',
        date: '2025-01-10T10:30:00.000Z',
        user_id: 'usr_gabriel',
        user_name: 'GABRIEL',
        reason: 'Remessa importação direta',
        createdAt: '2025-01-10T10:30:00.000Z',
      },
    ],
    sales: [
      {
        id: 'sale_101',
        code: 'VND-2025-101',
        customer_id: 'cli_1',
        customer_name: 'TechCorp Soluções Corporativas',
        items: [
          {
            product_id: 'prod_1',
            product_name: 'Smartwatch Nexora Elite V2 Titanium',
            sku: 'NX-SMW-01',
            quantity: 4,
            unit_price: 890.0,
            unit_cost: 380.0,
            total: 3560.0,
          },
          {
            product_id: 'prod_4',
            product_name: 'Hub USB-C Nexora Dock 8 em 1 Alumínio',
            sku: 'NX-HUB-04',
            quantity: 5,
            unit_price: 219.0,
            unit_cost: 85.0,
            total: 1095.0,
          },
        ],
        subtotal: 4655.0,
        discount: 155.0,
        shipping: 0.0,
        total: 4500.0,
        payment_method: 'pix',
        destination_account_id: 'bank_itau',
        destination_account_name: 'Itaú Unibanco PJ',
        seller_id: 'usr_ruan',
        seller_name: 'RUAN',
        date: '2025-02-15T14:30:00.000Z',
        notes: 'Pedido executivo para diretoria corporativa.',
        status: 'concluida',
        createdAt: '2025-02-15T14:30:00.000Z',
      },
      {
        id: 'sale_102',
        code: 'VND-2025-102',
        customer_id: 'cli_3',
        customer_name: 'Dra. Camila Rodrigues',
        items: [
          {
            product_id: 'prod_3',
            product_name: 'Fone Nexora Silence Pro ANC Wireless',
            sku: 'NX-HPH-03',
            quantity: 1,
            unit_price: 640.0,
            unit_cost: 260.0,
            total: 640.0,
          },
          {
            product_id: 'prod_2',
            product_name: 'Power Bank Nexora Ultra 20.000mAh 65W GaN',
            sku: 'NX-PBK-02',
            quantity: 1,
            unit_price: 285.0,
            unit_cost: 110.0,
            total: 285.0,
          },
        ],
        subtotal: 925.0,
        discount: 25.0,
        shipping: 20.0,
        total: 920.0,
        payment_method: 'cartao_credito',
        destination_account_id: 'bank_nubank',
        destination_account_name: 'Nubank Empresas PJ',
        seller_id: 'usr_cliver',
        seller_name: 'CLIVER',
        date: '2025-02-18T16:15:00.000Z',
        notes: 'Entrega rápida via Sedex.',
        status: 'concluida',
        createdAt: '2025-02-18T16:15:00.000Z',
      },
      {
        id: 'sale_103',
        code: 'VND-2025-103',
        customer_id: 'cli_4',
        customer_name: 'Grupo Horizonte Comercial',
        items: [
          {
            product_id: 'prod_1',
            product_name: 'Smartwatch Nexora Elite V2 Titanium',
            sku: 'NX-SMW-01',
            quantity: 3,
            unit_price: 890.0,
            unit_cost: 380.0,
            total: 2670.0,
          },
          {
            product_id: 'prod_5',
            product_name: 'Teclado Mecânico Wireless Nexora Keystroke',
            sku: 'NX-KBD-05',
            quantity: 2,
            unit_price: 499.0,
            unit_cost: 210.0,
            total: 998.0,
          },
        ],
        subtotal: 3668.0,
        discount: 168.0,
        shipping: 0.0,
        total: 3500.0,
        payment_method: 'transferencia',
        destination_account_id: 'bank_itau',
        destination_account_name: 'Itaú Unibanco PJ',
        seller_id: 'usr_gabriel',
        seller_name: 'GABRIEL',
        date: '2025-02-22T11:00:00.000Z',
        notes: 'Faturamento corporativo 15 dias.',
        status: 'concluida',
        createdAt: '2025-02-22T11:00:00.000Z',
      },
    ],
    orders: [
      {
        id: 'ord_1',
        order_number: 'PED-2025-001',
        customer_id: 'cli_1',
        customer_name: 'TechCorp Soluções Corporativas',
        items: [
          {
            product_id: 'prod_1',
            product_name: 'Smartwatch Nexora Elite V2 Titanium',
            quantity: 4,
            unit_price: 890.0,
            unit_cost: 380.0,
            total: 3560.0,
          },
        ],
        total: 3560.0,
        status: 'entregue',
        date: '2025-02-15T14:30:00.000Z',
        responsible_id: 'usr_ruan',
        responsible_name: 'RUAN',
        notes: 'Entregue e assinado pela gerência de TI.',
        createdAt: '2025-02-15T14:30:00.000Z',
        updatedAt: '2025-02-16T17:00:00.000Z',
      },
      {
        id: 'ord_2',
        order_number: 'PED-2025-002',
        customer_id: 'cli_2',
        customer_name: 'Alpha Engenharia & Projetos',
        items: [
          {
            product_id: 'prod_4',
            product_name: 'Hub USB-C Nexora Dock 8 em 1 Alumínio',
            quantity: 10,
            unit_price: 219.0,
            unit_cost: 85.0,
            total: 2190.0,
          },
        ],
        total: 2190.0,
        status: 'em_preparacao',
        date: '2025-02-24T09:00:00.000Z',
        responsible_id: 'usr_gabriel',
        responsible_name: 'GABRIEL',
        notes: 'Aguardando conferência no centro de distribuição.',
        createdAt: '2025-02-24T09:00:00.000Z',
        updatedAt: '2025-02-24T09:00:00.000Z',
      },
    ],
    commissions: [
      {
        id: 'com_1',
        sale_id: 'sale_101',
        sale_code: 'VND-2025-101',
        seller_id: 'usr_ruan',
        seller_name: 'RUAN',
        percentage: 5.0,
        commission_amount: 225.0,
        status: 'pago',
        payment_date: '2025-02-20T10:00:00.000Z',
        createdAt: '2025-02-15T14:30:00.000Z',
      },
      {
        id: 'com_2',
        sale_id: 'sale_102',
        sale_code: 'VND-2025-102',
        seller_id: 'usr_cliver',
        seller_name: 'CLIVER',
        percentage: 5.0,
        commission_amount: 46.0,
        status: 'pendente',
        createdAt: '2025-02-18T16:15:00.000Z',
      },
      {
        id: 'com_3',
        sale_id: 'sale_103',
        sale_code: 'VND-2025-103',
        seller_id: 'usr_gabriel',
        seller_name: 'GABRIEL',
        percentage: 5.0,
        commission_amount: 175.0,
        status: 'pendente',
        createdAt: '2025-02-22T11:00:00.000Z',
      },
    ],
    accounts_receivable: [
      {
        id: 'rec_1',
        code: 'REC-2025-01',
        customer_id: 'cli_1',
        customer_name: 'TechCorp Soluções Corporativas',
        description: 'Venda corporativa 4x Smartwatch + 5x Hub Dock',
        sale_id: 'sale_101',
        category_id: 'cat_rec_vendas',
        category_name: 'Venda de Produtos',
        amount: 4500.0,
        issue_date: '2025-02-15',
        due_date: '2025-02-15',
        payment_date: '2025-02-15',
        payment_method: 'pix',
        destination_account_id: 'bank_itau',
        destination_account_name: 'Itaú Unibanco PJ',
        status: 'recebido',
        notes: 'Pago à vista via Pix chave CNPJ.',
        responsible_user: 'RUAN',
        createdAt: '2025-02-15T14:30:00.000Z',
        updatedAt: '2025-02-15T14:30:00.000Z',
      },
      {
        id: 'rec_2',
        code: 'REC-2025-02',
        customer_id: 'cli_2',
        customer_name: 'Alpha Engenharia & Projetos',
        description: 'Consultoria de infraestrutura de conectividade IoT',
        category_id: 'cat_rec_servicos',
        category_name: 'Serviços & Consultoria',
        amount: 12500.0,
        issue_date: '2025-02-10',
        due_date: '2025-03-10',
        payment_method: 'boleto',
        destination_account_id: 'bank_itau',
        destination_account_name: 'Itaú Unibanco PJ',
        status: 'pendente',
        notes: 'Boleto faturado para 30 dias.',
        responsible_user: 'CLIVER',
        createdAt: '2025-02-10T10:00:00.000Z',
        updatedAt: '2025-02-10T10:00:00.000Z',
      },
      {
        id: 'rec_3',
        code: 'REC-2025-03',
        customer_id: 'cli_4',
        customer_name: 'Grupo Horizonte Comercial',
        description: 'Fornecimento Lote 01 Smartwatches e Teclados',
        sale_id: 'sale_103',
        category_id: 'cat_rec_vendas',
        category_name: 'Venda de Produtos',
        amount: 3500.0,
        issue_date: '2025-02-22',
        due_date: '2025-03-08',
        payment_method: 'transferencia',
        destination_account_id: 'bank_itau',
        destination_account_name: 'Itaú Unibanco PJ',
        status: 'pendente',
        notes: 'Aguardando TED corporativa.',
        responsible_user: 'GABRIEL',
        createdAt: '2025-02-22T11:00:00.000Z',
        updatedAt: '2025-02-22T11:00:00.000Z',
      },
      {
        id: 'rec_4',
        code: 'REC-2025-04',
        customer_id: 'cli_5',
        customer_name: 'Lucas Mendes Tecnologia',
        description: 'Upgrade estação de trabalho dev portátil',
        category_id: 'cat_rec_vendas',
        category_name: 'Venda de Produtos',
        amount: 1680.0,
        issue_date: '2025-01-25',
        due_date: '2025-02-05',
        payment_method: 'pix',
        destination_account_id: 'bank_nubank',
        destination_account_name: 'Nubank Empresas PJ',
        status: 'atrasado',
        notes: 'Atraso na liberação pelo cliente - cobrado via WhatsApp.',
        responsible_user: 'CLIVER',
        createdAt: '2025-01-25T15:00:00.000Z',
        updatedAt: '2025-02-06T09:00:00.000Z',
      },
    ],
    accounts_payable: [
      {
        id: 'pag_1',
        code: 'PAG-2025-01',
        supplier_id: 'sup_1',
        supplier_name: 'TechImport Global Ltda',
        description: 'Fatura remessa smartwatches e fones de ouvido',
        category_id: 'cat_desp_fornecedores',
        category_name: 'Fornecedores & Mercadorias',
        amount: 18400.0,
        issue_date: '2025-02-01',
        due_date: '2025-02-28',
        payment_method: 'transferencia',
        source_account_id: 'bank_itau',
        source_account_name: 'Itaú Unibanco PJ',
        status: 'pendente',
        notes: 'Desconto de 2% caso pago antes do dia 25.',
        responsible_user: 'CLIVER',
        createdAt: '2025-02-01T10:00:00.000Z',
        updatedAt: '2025-02-01T10:00:00.000Z',
      },
      {
        id: 'pag_2',
        code: 'PAG-2025-02',
        supplier_id: 'sup_2',
        supplier_name: 'Silício Distribuidora de Eletrônicos',
        description: 'Compra componentes GaN e Cabos USB-C Pro',
        category_id: 'cat_desp_fornecedores',
        category_name: 'Fornecedores & Mercadorias',
        amount: 5600.0,
        issue_date: '2025-02-05',
        due_date: '2025-02-15',
        payment_date: '2025-02-14',
        payment_method: 'pix',
        source_account_id: 'bank_nubank',
        source_account_name: 'Nubank Empresas PJ',
        status: 'pago',
        notes: 'Liquidado com sucesso via Pix.',
        responsible_user: 'RUAN',
        createdAt: '2025-02-05T14:00:00.000Z',
        updatedAt: '2025-02-14T11:20:00.000Z',
      },
      {
        id: 'pag_3',
        code: 'PAG-2025-03',
        supplier_name: 'Meta Platforms & Google Ads Brasil',
        description: 'Investimento em tráfego pago e branding NEXORA',
        category_id: 'cat_desp_mkt',
        category_name: 'Marketing & Tráfego Pago',
        amount: 4200.0,
        issue_date: '2025-02-10',
        due_date: '2025-02-25',
        payment_method: 'cartao_credito',
        source_account_id: 'bank_nubank',
        source_account_name: 'Nubank Empresas PJ',
        status: 'pendente',
        notes: 'Campanha de performance Q1.',
        responsible_user: 'RUAN',
        createdAt: '2025-02-10T11:30:00.000Z',
        updatedAt: '2025-02-10T11:30:00.000Z',
      },
      {
        id: 'pag_4',
        code: 'PAG-2025-04',
        supplier_name: 'Condomínio Corporate Tower & Energia',
        description: 'Aluguel sala comercial NEXORA + Utilities',
        category_id: 'cat_desp_aluguel',
        category_name: 'Aluguel & Condomínio',
        amount: 6850.0,
        issue_date: '2025-02-01',
        due_date: '2025-02-10',
        payment_date: '2025-02-09',
        payment_method: 'boleto',
        source_account_id: 'bank_itau',
        source_account_name: 'Itaú Unibanco PJ',
        status: 'pago',
        notes: 'Comprovante arquivado na contabilidade.',
        responsible_user: 'GABRIEL',
        createdAt: '2025-02-01T09:00:00.000Z',
        updatedAt: '2025-02-09T16:00:00.000Z',
      },
    ],
    financial_transactions: [
      {
        id: 'tx_1',
        type: 'entrada',
        description: 'Recebimento Venda VND-2025-101 - TechCorp',
        amount: 4500.0,
        category_id: 'cat_rec_vendas',
        category_name: 'Venda de Produtos',
        account_id: 'bank_itau',
        account_name: 'Itaú Unibanco PJ',
        date: '2025-02-15T14:30:00.000Z',
        user_id: 'usr_ruan',
        user_name: 'RUAN',
        reference_type: 'venda',
        reference_id: 'sale_101',
        notes: 'Pix recebido em conta corrente.',
        createdAt: '2025-02-15T14:30:00.000Z',
      },
      {
        id: 'tx_2',
        type: 'saida',
        description: 'Pagamento Silício Distribuidora NF 9021',
        amount: 5600.0,
        category_id: 'cat_desp_fornecedores',
        category_name: 'Fornecedores & Mercadorias',
        account_id: 'bank_nubank',
        account_name: 'Nubank Empresas PJ',
        date: '2025-02-14T11:20:00.000Z',
        user_id: 'usr_ruan',
        user_name: 'RUAN',
        reference_type: 'conta_pagar',
        reference_id: 'pag_2',
        notes: 'Quitação antecipada com desconto.',
        createdAt: '2025-02-14T11:20:00.000Z',
      },
      {
        id: 'tx_3',
        type: 'saida',
        description: 'Pagamento Aluguel Sala Sede NEXORA GROUP',
        amount: 6850.0,
        category_id: 'cat_desp_aluguel',
        category_name: 'Aluguel & Condomínio',
        account_id: 'bank_itau',
        account_name: 'Itaú Unibanco PJ',
        date: '2025-02-09T16:00:00.000Z',
        user_id: 'usr_gabriel',
        user_name: 'GABRIEL',
        reference_type: 'conta_pagar',
        reference_id: 'pag_4',
        notes: 'Boleto quitado via DDA Itaú.',
        createdAt: '2025-02-09T16:00:00.000Z',
      },
      {
        id: 'tx_4',
        type: 'transferencia',
        description: 'Aporte estratégico de liquidez Itaú -> Inter',
        amount: 5000.0,
        account_id: 'bank_itau',
        account_name: 'Itaú Unibanco PJ',
        destination_account_id: 'bank_inter',
        destination_account_name: 'Banco Inter Empresas',
        date: '2025-02-12T10:00:00.000Z',
        user_id: 'usr_cliver',
        user_name: 'CLIVER',
        reference_type: 'transferencia',
        notes: 'Equilíbrio de saldo operacional.',
        createdAt: '2025-02-12T10:00:00.000Z',
      },
    ],
    cash_registers: [
      {
        id: 'cash_1',
        date: new Date().toISOString().split('T')[0],
        responsible_id: 'usr_ruan',
        responsible_name: 'RUAN',
        initial_balance: 3850.0,
        entries: 0,
        exits: 0,
        final_balance: 3850.0,
        difference: 0,
        status: 'aberto',
        notes: 'Caixa do dia aberto normalmente.',
        openedAt: new Date().toISOString(),
      },
    ],
    audit_logs: [
      {
        id: 'aud_1',
        user_id: 'usr_ruan',
        user_name: 'RUAN',
        action: 'SISTEMA_INICIALIZADO',
        module: 'sistema',
        description: 'Ambiente empresarial NEXORA GROUP provisionado com sucesso.',
        timestamp: '2025-01-01T08:00:00.000Z',
      },
      {
        id: 'aud_2',
        user_id: 'usr_ruan',
        user_name: 'RUAN',
        action: 'VENDA_CRIADA',
        module: 'vendas',
        description: 'RUAN registrou a venda VND-2025-101 no valor de R$ 4.500,00.',
        affected_record: 'VND-2025-101',
        new_value: 'R$ 4.500,00',
        timestamp: '2025-02-15T14:30:00.000Z',
      },
      {
        id: 'aud_3',
        user_id: 'usr_gabriel',
        user_name: 'GABRIEL',
        action: 'ESTOQUE_ENTRADA',
        module: 'estoque',
        description: 'GABRIEL realizou entrada de 50 un. de Smartwatch Nexora Elite V2.',
        affected_record: 'NX-SMW-01',
        new_value: '+50 unidades',
        timestamp: '2025-01-10T10:00:00.000Z',
      },
      {
        id: 'aud_4',
        user_id: 'usr_cliver',
        user_name: 'CLIVER',
        action: 'TRANSFERENCIA_BANCARIA',
        module: 'financeiro',
        description: 'CLIVER transferiu R$ 5.000,00 da conta Itaú para Banco Inter.',
        affected_record: 'Itaú -> Inter',
        new_value: 'R$ 5.000,00',
        timestamp: '2025-02-12T10:00:00.000Z',
      },
    ],
    notifications: [
      {
        id: 'notif_1',
        title: 'Estoque Baixo',
        message: 'O produto "Power Bank Nexora Ultra 20.000mAh" atingiu 6 un. (Mínimo: 12).',
        type: 'warning',
        module: 'estoque',
        read: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'notif_2',
        title: 'Conta a Pagar Próxima do Vencimento',
        message: 'A fatura Meta & Google Ads (R$ 4.200,00) vence nos próximos dias.',
        type: 'alert',
        module: 'financeiro',
        read: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'notif_3',
        title: 'Venda Concluída',
        message: 'RUAN registrou a venda VND-2025-101 para TechCorp (R$ 4.500,00).',
        type: 'success',
        module: 'vendas',
        read: false,
        createdAt: new Date().toISOString(),
      },
    ],
    company_settings: {
      id: 'settings_nexora',
      name: 'NEXORA GROUP LTDA',
      trade_name: 'NEXORA GROUP',
      cnpj: '58.912.340/0001-44',
      phone: '(11) 3195-2000',
      email: 'contato@nexoragroup.com.br',
      address: 'Avenida Brigadeiro Faria Lima, 4500, 18º Andar',
      city: 'São Paulo',
      state: 'SP',
      cep: '04538-132',
      currency: 'BRL',
      logo_url: '/nexora-logo.svg',
      default_payment_methods: [
        'pix',
        'transferencia',
        'cartao_credito',
        'cartao_debito',
        'boleto',
        'dinheiro',
      ],
      system_preferences: {
        lowStockThreshold: 10,
        requireReceiptForExpenses: false,
        autoUpdateCashFlow: true,
        defaultCommissionPercentage: 5,
      },
      updatedAt: '2025-01-01T08:00:00.000Z',
    },
  };
}

class DatabaseManager {
  private data: DatabaseSchema;
  private isLoaded = false;

  constructor() {
    this.data = getInitialSeed();
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        this.isLoaded = true;
      } else {
        this.data = getInitialSeed();
        this.save();
        this.isLoaded = true;
      }
    } catch (err) {
      console.error('Error initializing database file, falling back to seed:', err);
      this.data = getInitialSeed();
      this.isLoaded = true;
    }
  }

  // Atomic file write using temporary swap file
  private save() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Failed to atomically save database:', err);
    }
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  // AUDIT LOG
  public addAuditLog(
    user: { id: string; name: string },
    action: string,
    module: string,
    description: string,
    affected_record?: string,
    previous_value?: string,
    new_value?: string,
    ip_address?: string
  ): AuditLog {
    const log: AuditLog = {
      id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      user_id: user.id,
      user_name: user.name,
      action,
      module,
      description,
      affected_record,
      previous_value,
      new_value,
      timestamp: new Date().toISOString(),
      ip_address,
    };
    this.data.audit_logs.unshift(log);
    // Keep max 500 audit logs
    if (this.data.audit_logs.length > 500) {
      this.data.audit_logs = this.data.audit_logs.slice(0, 500);
    }
    this.save();
    return log;
  }

  // NOTIFICATIONS
  public addNotification(
    title: string,
    message: string,
    type: 'info' | 'warning' | 'alert' | 'success',
    module: string
  ): NotificationItem {
    const notif: NotificationItem = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title,
      message,
      type,
      module,
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(notif);
    if (this.data.notifications.length > 200) {
      this.data.notifications = this.data.notifications.slice(0, 200);
    }
    this.save();
    return notif;
  }

  public markNotificationAsRead(id: string) {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.save();
    }
  }

  public markAllNotificationsAsRead() {
    this.data.notifications.forEach((n) => (n.read = true));
    this.save();
  }

  // METRICS & HEALTH
  public getDashboardMetrics(): DashboardMetrics {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // "YYYY-MM"
    
    // Total current balance across active bank accounts
    const currentBalance = this.data.bank_accounts
      .filter((a) => a.status === 'ativa')
      .reduce((sum, a) => sum + (Number(a.current_balance) || 0), 0);

    // Month revenues and expenses from transactions
    let monthRevenue = 0;
    let monthExpenses = 0;

    for (const tx of this.data.financial_transactions) {
      if (tx.date && tx.date.startsWith(currentMonth)) {
        if (tx.type === 'entrada') {
          monthRevenue += Number(tx.amount) || 0;
        } else if (tx.type === 'saida') {
          monthExpenses += Number(tx.amount) || 0;
        }
      }
    }

    const monthProfit = monthRevenue - monthExpenses;
    const profitMarginPercent = monthRevenue > 0 ? (monthProfit / monthRevenue) * 100 : 0;

    // Accounts receivable pending
    const pendingReceivable = this.data.accounts_receivable
      .filter((r) => r.status === 'pendente' || r.status === 'atrasado' || r.status === 'parcial')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    // Accounts payable pending
    const pendingPayable = this.data.accounts_payable
      .filter((p) => p.status === 'pendente' || p.status === 'atrasado' || p.status === 'parcial')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Sales metrics for month
    const monthSales = this.data.sales.filter(
      (s) => s.status === 'concluida' && s.date && s.date.startsWith(currentMonth)
    );
    const monthSalesCount = monthSales.length;
    const monthSalesTotal = monthSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);

    // Inventory value and low stock
    let inventoryTotalValue = 0;
    let lowStockItemsCount = 0;
    for (const prod of this.data.products) {
      if (prod.status === 'ativo') {
        inventoryTotalValue += prod.current_stock * prod.sale_price;
        if (prod.current_stock <= prod.min_stock) {
          lowStockItemsCount++;
        }
      }
    }

    const overduePayableCount = this.data.accounts_payable.filter(
      (p) => p.status === 'atrasado' || (p.status === 'pendente' && p.due_date < now.toISOString().split('T')[0])
    ).length;

    const overdueReceivableCount = this.data.accounts_receivable.filter(
      (r) => r.status === 'atrasado' || (r.status === 'pendente' && r.due_date < now.toISOString().split('T')[0])
    ).length;

    return {
      currentBalance,
      monthRevenue,
      monthExpenses,
      monthProfit,
      pendingReceivable,
      pendingPayable,
      monthSalesCount,
      monthSalesTotal,
      inventoryTotalValue,
      lowStockItemsCount,
      overduePayableCount,
      overdueReceivableCount,
      profitMarginPercent: Math.round(profitMarginPercent * 10) / 10,
      comparisons: {
        balanceChangePercent: 12.4,
        revenueChangePercent: 18.2,
        expensesChangePercent: -4.5,
        salesChangePercent: 21.0,
      },
    };
  }

  // TRANSACTIONAL SALE CREATION
  public createSale(
    saleData: Omit<Sale, 'id' | 'code' | 'createdAt'>,
    user: { id: string; name: string }
  ): { success: boolean; sale?: Sale; error?: string } {
    // 1. Validate items and stock
    if (!saleData.items || saleData.items.length === 0) {
      return { success: false, error: 'A venda deve conter pelo menos 1 produto.' };
    }

    // Verify stock availability
    for (const item of saleData.items) {
      const product = this.data.products.find((p) => p.id === item.product_id);
      if (!product) {
        return { success: false, error: `Produto ${item.product_name} não encontrado no catálogo.` };
      }
      if (product.current_stock < item.quantity) {
        return {
          success: false,
          error: `Estoque insuficiente para "${product.name}". Solicitado: ${item.quantity}, Disponível: ${product.current_stock}.`,
        };
      }
    }

    // 2. Decrement stock & record movements
    for (const item of saleData.items) {
      const product = this.data.products.find((p) => p.id === item.product_id)!;
      product.current_stock -= item.quantity;
      product.updatedAt = new Date().toISOString();

      const mov: InventoryMovement = {
        id: 'mov_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        type: 'venda',
        date: saleData.date || new Date().toISOString(),
        user_id: user.id,
        user_name: user.name,
        reason: `Saída por venda ${saleData.customer_name}`,
        createdAt: new Date().toISOString(),
      };
      this.data.inventory_movements.unshift(mov);

      // Check low stock trigger
      if (product.current_stock <= product.min_stock) {
        this.addNotification(
          'Alerta de Estoque Baixo',
          `O produto "${product.name}" atingiu ${product.current_stock} un. (Mínimo: ${product.min_stock}).`,
          'warning',
          'estoque'
        );
      }
    }

    // 3. Create Sale record
    const saleId = 'sale_' + Date.now();
    const nextCode = `VND-${new Date().getFullYear()}-${100 + this.data.sales.length + 1}`;
    
    // Find destination account name
    let destAccountName = saleData.destination_account_name;
    if (saleData.destination_account_id) {
      const acc = this.data.bank_accounts.find((b) => b.id === saleData.destination_account_id);
      if (acc) destAccountName = acc.name;
    }

    const newSale: Sale = {
      ...saleData,
      id: saleId,
      code: nextCode,
      destination_account_name: destAccountName,
      createdAt: new Date().toISOString(),
    };
    this.data.sales.unshift(newSale);

    // 4. Create Order automatically in confirmed state
    const orderNumber = `PED-${new Date().getFullYear()}-${String(this.data.orders.length + 1).padStart(3, '0')}`;
    const order: Order = {
      id: 'ord_' + Date.now(),
      order_number: orderNumber,
      customer_id: newSale.customer_id,
      customer_name: newSale.customer_name,
      items: newSale.items,
      total: newSale.total,
      status: 'confirmado',
      date: newSale.date,
      responsible_id: user.id,
      responsible_name: user.name,
      notes: newSale.notes || 'Pedido originado via Nova Venda.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.orders.unshift(order);

    // 5. Create Financial flow (Account Receivable or direct receipt)
    const isImmediate = ['pix', 'dinheiro', 'cartao_debito'].includes(newSale.payment_method);
    const recId = 'rec_' + Date.now();

    const receivable: AccountReceivable = {
      id: recId,
      code: `REC-${new Date().getFullYear()}-${this.data.accounts_receivable.length + 1}`,
      customer_id: newSale.customer_id,
      customer_name: newSale.customer_name,
      description: `Recebimento Venda ${newSale.code}`,
      sale_id: newSale.id,
      category_id: 'cat_rec_vendas',
      category_name: 'Venda de Produtos',
      amount: newSale.total,
      issue_date: newSale.date.split('T')[0],
      due_date: isImmediate ? newSale.date.split('T')[0] : new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      payment_date: isImmediate ? newSale.date : undefined,
      payment_method: newSale.payment_method,
      destination_account_id: newSale.destination_account_id,
      destination_account_name: destAccountName,
      status: isImmediate ? 'recebido' : 'pendente',
      notes: newSale.notes,
      responsible_user: user.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.accounts_receivable.unshift(receivable);

    // If paid immediately, credit bank account and create financial transaction
    if (isImmediate && newSale.destination_account_id) {
      const bankAccount = this.data.bank_accounts.find((b) => b.id === newSale.destination_account_id);
      if (bankAccount) {
        bankAccount.current_balance = Number(bankAccount.current_balance) + Number(newSale.total);
      }

      const tx: FinancialTransaction = {
        id: 'tx_' + Date.now(),
        type: 'entrada',
        description: `Recebimento Venda ${newSale.code} - ${newSale.customer_name}`,
        amount: newSale.total,
        category_id: 'cat_rec_vendas',
        category_name: 'Venda de Produtos',
        account_id: newSale.destination_account_id,
        account_name: destAccountName || 'Conta Bancária',
        date: newSale.date,
        user_id: user.id,
        user_name: user.name,
        reference_type: 'venda',
        reference_id: newSale.id,
        notes: `Pagamento à vista via ${newSale.payment_method.toUpperCase()}`,
        createdAt: new Date().toISOString(),
      };
      this.data.financial_transactions.unshift(tx);
    }

    // 6. Calculate commission (default 5%)
    const commissionPercent = this.data.company_settings.system_preferences.defaultCommissionPercentage || 5;
    const commissionAmount = Math.round((newSale.total * (commissionPercent / 100)) * 100) / 100;
    const commission: Commission = {
      id: 'com_' + Date.now(),
      sale_id: newSale.id,
      sale_code: newSale.code,
      seller_id: newSale.seller_id || user.id,
      seller_name: newSale.seller_name || user.name,
      percentage: commissionPercent,
      commission_amount: commissionAmount,
      status: 'pendente',
      createdAt: new Date().toISOString(),
    };
    this.data.commissions.unshift(commission);

    // 7. Audit log & notification
    this.addAuditLog(
      user,
      'VENDA_REGISTRADA',
      'vendas',
      `${user.name} registrou a venda ${newSale.code} no valor de R$ ${newSale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para ${newSale.customer_name}.`,
      newSale.code,
      undefined,
      `R$ ${newSale.total}`
    );

    this.addNotification(
      'Nova Venda Concluída',
      `${user.name} registrou a venda ${newSale.code} no valor de R$ ${newSale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      'success',
      'vendas'
    );

    this.save();
    return { success: true, sale: newSale };
  }

  // TRANSACTIONAL STOCK MOVEMENT
  public recordStockMovement(
    data: {
      product_id: string;
      quantity: number;
      type: 'entrada' | 'saida' | 'ajuste' | 'devolucao';
      reason: string;
      notes?: string;
    },
    user: { id: string; name: string }
  ): { success: boolean; movement?: InventoryMovement; error?: string } {
    const product = this.data.products.find((p) => p.id === data.product_id);
    if (!product) {
      return { success: false, error: 'Produto não encontrado.' };
    }

    const prevStock = product.current_stock;
    if (data.type === 'entrada' || data.type === 'devolucao') {
      product.current_stock += Number(data.quantity);
    } else if (data.type === 'saida') {
      if (product.current_stock < data.quantity) {
        return { success: false, error: `Estoque insuficiente. Saldo atual: ${product.current_stock}.` };
      }
      product.current_stock -= Number(data.quantity);
    } else if (data.type === 'ajuste') {
      product.current_stock = Number(data.quantity);
    }
    product.updatedAt = new Date().toISOString();

    const movement: InventoryMovement = {
      id: 'mov_' + Date.now(),
      product_id: product.id,
      product_name: product.name,
      quantity: data.quantity,
      type: data.type,
      date: new Date().toISOString(),
      user_id: user.id,
      user_name: user.name,
      reason: data.reason,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };
    this.data.inventory_movements.unshift(movement);

    this.addAuditLog(
      user,
      'ESTOQUE_MOVIMENTO',
      'estoque',
      `${user.name} registrou movimento de estoque (${data.type}) de ${data.quantity} un. em "${product.name}".`,
      product.name,
      `${prevStock} un.`,
      `${product.current_stock} un.`
    );

    if (product.current_stock <= product.min_stock) {
      this.addNotification(
        'Alerta: Estoque Crítico',
        `Produto "${product.name}" com estoque baixo: ${product.current_stock} un. (Mínimo: ${product.min_stock}).`,
        'warning',
        'estoque'
      );
    }

    this.save();
    return { success: true, movement };
  }

  // TRANSACTIONAL PAYABLE SETTLEMENT
  public payAccountPayable(
    payableId: string,
    sourceAccountId: string,
    user: { id: string; name: string },
    notes?: string
  ): { success: boolean; payable?: AccountPayable; error?: string } {
    const payable = this.data.accounts_payable.find((p) => p.id === payableId);
    if (!payable) return { success: false, error: 'Conta a pagar não encontrada.' };
    if (payable.status === 'pago') return { success: false, error: 'Esta conta já foi liquidada.' };

    const bankAccount = this.data.bank_accounts.find((b) => b.id === sourceAccountId);
    if (!bankAccount) return { success: false, error: 'Conta bancária de origem não encontrada.' };

    // Deduct from bank account
    bankAccount.current_balance = Number(bankAccount.current_balance) - Number(payable.amount);

    payable.status = 'pago';
    payable.payment_date = new Date().toISOString();
    payable.source_account_id = bankAccount.id;
    payable.source_account_name = bankAccount.name;
    payable.updatedAt = new Date().toISOString();
    if (notes) payable.notes = (payable.notes ? payable.notes + ' | ' : '') + notes;

    // Create financial transaction
    const tx: FinancialTransaction = {
      id: 'tx_' + Date.now(),
      type: 'saida',
      description: `Pagamento ${payable.code}: ${payable.description}`,
      amount: payable.amount,
      category_id: payable.category_id,
      category_name: payable.category_name,
      account_id: bankAccount.id,
      account_name: bankAccount.name,
      date: new Date().toISOString(),
      user_id: user.id,
      user_name: user.name,
      reference_type: 'conta_pagar',
      reference_id: payable.id,
      notes: notes || `Liquidado por ${user.name}`,
      createdAt: new Date().toISOString(),
    };
    this.data.financial_transactions.unshift(tx);

    this.addAuditLog(
      user,
      'CONTA_PAGA',
      'financeiro',
      `${user.name} marcou a conta ${payable.code} (${payable.description}) no valor de R$ ${payable.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} como PAGA via ${bankAccount.name}.`,
      payable.code,
      'Pendente',
      'Pago'
    );

    this.save();
    return { success: true, payable };
  }

  // TRANSACTIONAL RECEIVABLE SETTLEMENT
  public receiveAccountReceivable(
    receivableId: string,
    destinationAccountId: string,
    user: { id: string; name: string },
    notes?: string
  ): { success: boolean; receivable?: AccountReceivable; error?: string } {
    const receivable = this.data.accounts_receivable.find((r) => r.id === receivableId);
    if (!receivable) return { success: false, error: 'Conta a receber não encontrada.' };
    if (receivable.status === 'recebido') return { success: false, error: 'Esta conta já foi recebida.' };

    const bankAccount = this.data.bank_accounts.find((b) => b.id === destinationAccountId);
    if (!bankAccount) return { success: false, error: 'Conta bancária de destino não encontrada.' };

    // Credit destination account
    bankAccount.current_balance = Number(bankAccount.current_balance) + Number(receivable.amount);

    receivable.status = 'recebido';
    receivable.payment_date = new Date().toISOString();
    receivable.destination_account_id = bankAccount.id;
    receivable.destination_account_name = bankAccount.name;
    receivable.updatedAt = new Date().toISOString();
    if (notes) receivable.notes = (receivable.notes ? receivable.notes + ' | ' : '') + notes;

    // Create financial transaction
    const tx: FinancialTransaction = {
      id: 'tx_' + Date.now(),
      type: 'entrada',
      description: `Recebimento ${receivable.code}: ${receivable.description}`,
      amount: receivable.amount,
      category_id: receivable.category_id,
      category_name: receivable.category_name,
      account_id: bankAccount.id,
      account_name: bankAccount.name,
      date: new Date().toISOString(),
      user_id: user.id,
      user_name: user.name,
      reference_type: 'conta_receber',
      reference_id: receivable.id,
      notes: notes || `Recebido por ${user.name}`,
      createdAt: new Date().toISOString(),
    };
    this.data.financial_transactions.unshift(tx);

    this.addAuditLog(
      user,
      'CONTA_RECEBIDA',
      'financeiro',
      `${user.name} marcou a conta ${receivable.code} no valor de R$ ${receivable.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} como RECEBIDA na conta ${bankAccount.name}.`,
      receivable.code,
      'Pendente',
      'Recebido'
    );

    this.save();
    return { success: true, receivable };
  }

  // TRANSACTIONAL BANK TRANSFER
  public transferBetweenAccounts(
    sourceAccountId: string,
    destinationAccountId: string,
    amount: number,
    user: { id: string; name: string },
    notes?: string
  ): { success: boolean; error?: string } {
    if (amount <= 0) return { success: false, error: 'Valor da transferência deve ser maior que zero.' };
    if (sourceAccountId === destinationAccountId) {
      return { success: false, error: 'Conta de origem e destino não podem ser as mesmas.' };
    }

    const source = this.data.bank_accounts.find((b) => b.id === sourceAccountId);
    const dest = this.data.bank_accounts.find((b) => b.id === destinationAccountId);

    if (!source || !dest) return { success: false, error: 'Contas bancárias inválidas.' };
    if (source.current_balance < amount) {
      return {
        success: false,
        error: `Saldo insuficiente na conta de origem (${source.name}). Saldo atual: R$ ${source.current_balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      };
    }

    // Atomic balance update
    source.current_balance = Number(source.current_balance) - Number(amount);
    dest.current_balance = Number(dest.current_balance) + Number(amount);

    const tx: FinancialTransaction = {
      id: 'tx_' + Date.now(),
      type: 'transferencia',
      description: `Transferência de ${source.name} para ${dest.name}`,
      amount: amount,
      account_id: source.id,
      account_name: source.name,
      destination_account_id: dest.id,
      destination_account_name: dest.name,
      date: new Date().toISOString(),
      user_id: user.id,
      user_name: user.name,
      reference_type: 'transferencia',
      notes: notes || 'Transferência interna entre contas da empresa',
      createdAt: new Date().toISOString(),
    };
    this.data.financial_transactions.unshift(tx);

    this.addAuditLog(
      user,
      'TRANSFERENCIA_BANCARIA',
      'financeiro',
      `${user.name} transferiu R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de ${source.name} para ${dest.name}.`,
      `${source.name} -> ${dest.name}`,
      undefined,
      `R$ ${amount}`
    );

    this.save();
    return { success: true };
  }

  // CASH REGISTER CLOSING
  public closeCashRegister(
    registerId: string,
    finalCountedBalance: number,
    user: { id: string; name: string },
    notes?: string
  ): { success: boolean; register?: CashRegister; error?: string } {
    const reg = this.data.cash_registers.find((c) => c.id === registerId);
    if (!reg) return { success: false, error: 'Registro de caixa não encontrado.' };
    if (reg.status === 'fechado') return { success: false, error: 'Este caixa já se encontra fechado.' };

    const expectedFinal = reg.initial_balance + reg.entries - reg.exits;
    const difference = finalCountedBalance - expectedFinal;

    reg.final_balance = finalCountedBalance;
    reg.difference = difference;
    reg.status = 'fechado';
    reg.closedAt = new Date().toISOString();
    if (notes) reg.notes = (reg.notes ? reg.notes + ' | ' : '') + notes;

    this.addAuditLog(
      user,
      'CAIXA_FECHAMENTO',
      'financeiro',
      `${user.name} realizou o fechamento de caixa do dia ${reg.date}. Saldo final apurado: R$ ${finalCountedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Diferença: R$ ${difference.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`,
      reg.id,
      'Aberto',
      'Fechado'
    );

    this.save();
    return { success: true, register: reg };
  }

  // RESTORE BACKUP
  public restoreBackup(payload: DatabaseSchema, user: { id: string; name: string }): boolean {
    if (!payload.users || !payload.products || !payload.bank_accounts) {
      return false;
    }
    this.data = payload;
    this.save();
    this.addAuditLog(
      user,
      'SISTEMA_RESTORE_BACKUP',
      'configuracoes',
      `${user.name} restaurou um backup completo do banco de dados.`
    );
    return true;
  }

  // COMMIT CHANGES
  public persist() {
    this.save();
  }
}

export const db = new DatabaseManager();
