import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db, verifyPassword, hashPassword } from './server/db.ts';
import { User, AppModule, Sale } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple token authentication in-memory session store
interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: AppModule[];
}

const activeSessions = new Map<string, SessionUser>();

// Helper to authenticate request
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sessão não autenticada. Efetue login para continuar.' });
  }

  const token = authHeader.substring(7);
  const sessionUser = activeSessions.get(token);
  if (!sessionUser) {
    // If not found in memory (e.g. after server restart), check if token matches user ID for convenience
    const dbUser = db.getData().users.find((u) => u.id === token || 'token_' + u.id === token);
    if (dbUser && dbUser.status === 'ativo') {
      const restoredUser: SessionUser = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        permissions: dbUser.permissions,
      };
      activeSessions.set(token, restoredUser);
      (req as any).user = restoredUser;
      return next();
    }
    return res.status(401).json({ error: 'Sessão expirada ou inválida.' });
  }

  (req as any).user = sessionUser;
  next();
}

// Permission check middleware
function requirePermission(moduleKey: AppModule) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as SessionUser;
    if (!user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }
    if (user.role === 'admin' || (user.permissions && user.permissions.includes(moduleKey))) {
      return next();
    }
    return res.status(403).json({ error: `Acesso negado ao módulo: ${moduleKey}. Permissão insuficiente.` });
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // Request logger & safety headers
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  // --- AUTHENTICATION ROUTES ---

  // Login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = db.getData().users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas. Usuário não encontrado.' });
    }

    if (user.status !== 'ativo') {
      return res.status(403).json({ error: 'Usuário desativado. Contate o administrador.' });
    }

    if (!verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Senha incorreta.' });
    }

    user.lastLoginAt = new Date().toISOString();
    db.persist();

    const token = 'token_' + user.id + '_' + Date.now();
    const sessionUser: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    };
    activeSessions.set(token, sessionUser);

    db.addAuditLog(
      { id: user.id, name: user.name },
      'AUTH_LOGIN',
      'usuarios',
      `${user.name} realizou login no sistema.`
    );

    const { password_hash, ...safeUser } = user;
    return res.json({ token, user: safeUser });
  });

  // Quick switch (for seamless testing between RUAN, GABRIEL, CLIVER)
  app.post('/api/auth/quick-switch', (req: Request, res: Response) => {
    const { userId } = req.body;
    const user = db.getData().users.find((u) => u.id === userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    user.lastLoginAt = new Date().toISOString();
    db.persist();

    const token = 'token_' + user.id + '_' + Date.now();
    const sessionUser: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    };
    activeSessions.set(token, sessionUser);

    db.addAuditLog(
      { id: user.id, name: user.name },
      'AUTH_SWITCH',
      'usuarios',
      `Sessão alternada para ${user.name} (${user.position}).`
    );

    const { password_hash, ...safeUser } = user;
    return res.json({ token, user: safeUser });
  });

  // Get current user
  app.get('/api/auth/me', authMiddleware, (req: Request, res: Response) => {
    const sessionUser = (req as any).user as SessionUser;
    const user = db.getData().users.find((u) => u.id === sessionUser.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    const { password_hash, ...safeUser } = user;
    return res.json({ user: safeUser });
  });

  // Change password
  app.post('/api/auth/change-password', authMiddleware, (req: Request, res: Response) => {
    const sessionUser = (req as any).user as SessionUser;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
    }

    const user = db.getData().users.find((u) => u.id === sessionUser.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    if (!verifyPassword(currentPassword, user.password_hash)) {
      return res.status(400).json({ error: 'Senha atual incorreta.' });
    }

    user.password_hash = hashPassword(newPassword);
    db.persist();

    db.addAuditLog(
      { id: user.id, name: user.name },
      'SENHA_ALTERADA',
      'usuarios',
      `${user.name} alterou sua senha com sucesso.`
    );

    return res.json({ success: true, message: 'Senha alterada com sucesso.' });
  });

  // Logout
  app.post('/api/auth/logout', authMiddleware, (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.substring(7);
      const user = activeSessions.get(token);
      if (user) {
        db.addAuditLog(user, 'AUTH_LOGOUT', 'usuarios', `${user.name} encerrou a sessão.`);
      }
      activeSessions.delete(token);
    }
    return res.json({ success: true });
  });

  // --- DASHBOARD ROUTES ---
  app.get('/api/dashboard/metrics', authMiddleware, requirePermission('dashboard'), (_req, res) => {
    const metrics = db.getDashboardMetrics();
    return res.json(metrics);
  });

  app.get('/api/dashboard/charts', authMiddleware, requirePermission('dashboard'), (req, res) => {
    const period = (req.query.period as string) || '30d';
    const data = db.getData();

    // Chart: Evolution of revenues vs expenses
    // Group monthly or daily based on period
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentYear = new Date().getFullYear();

    const monthlyBreakdown = months.map((m, idx) => {
      const monthStr = `${currentYear}-${String(idx + 1).padStart(2, '0')}`;
      let receita = 0;
      let despesa = 0;

      data.financial_transactions.forEach((tx) => {
        if (tx.date && tx.date.startsWith(monthStr)) {
          if (tx.type === 'entrada') receita += tx.amount;
          if (tx.type === 'saida') despesa += tx.amount;
        }
      });

      return {
        month: m,
        receita,
        despesa,
        lucro: receita - despesa,
      };
    });

    // Expenses by category
    const expenseCategories: Record<string, number> = {};
    data.financial_transactions
      .filter((t) => t.type === 'saida')
      .forEach((tx) => {
        const catName = tx.category_name || 'Diversos';
        expenseCategories[catName] = (expenseCategories[catName] || 0) + tx.amount;
      });

    const categoryBreakdown = Object.entries(expenseCategories).map(([name, value]) => ({
      name,
      value,
    }));

    // Sales by sales representative
    const salesByRep: Record<string, { count: number; total: number }> = {};
    data.sales.forEach((s) => {
      if (s.status === 'concluida') {
        const rep = s.seller_name || 'Outro';
        if (!salesByRep[rep]) salesByRep[rep] = { count: 0, total: 0 };
        salesByRep[rep].count += 1;
        salesByRep[rep].total += s.total;
      }
    });

    return res.json({
      period,
      monthlyBreakdown,
      categoryBreakdown,
      salesByRep,
    });
  });

  app.get('/api/dashboard/alerts', authMiddleware, requirePermission('dashboard'), (_req, res) => {
    const data = db.getData();
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];

    const alerts: Array<{ id: string; type: string; title: string; message: string; severity: 'high' | 'medium' | 'low' }> = [];

    // Overdue accounts payable
    data.accounts_payable.forEach((p) => {
      if (p.status === 'atrasado' || (p.status === 'pendente' && p.due_date < today)) {
        alerts.push({
          id: 'alert_pag_' + p.id,
          type: 'conta_atrasada',
          title: 'Conta a pagar em atraso',
          message: `${p.supplier_name}: R$ ${p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Venceu em ${p.due_date})`,
          severity: 'high',
        });
      } else if (p.status === 'pendente' && p.due_date === today) {
        alerts.push({
          id: 'alert_pag_today_' + p.id,
          type: 'conta_hoje',
          title: 'Conta a pagar vence HOJE',
          message: `${p.supplier_name}: R$ ${p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          severity: 'high',
        });
      } else if (p.status === 'pendente' && p.due_date > today && p.due_date <= sevenDaysFromNow) {
        alerts.push({
          id: 'alert_pag_7d_' + p.id,
          type: 'conta_7d',
          title: 'Conta a pagar vence em 7 dias',
          message: `${p.supplier_name}: R$ ${p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Vence em ${p.due_date})`,
          severity: 'medium',
        });
      }
    });

    // Overdue accounts receivable
    data.accounts_receivable.forEach((r) => {
      if (r.status === 'atrasado' || (r.status === 'pendente' && r.due_date < today)) {
        alerts.push({
          id: 'alert_rec_' + r.id,
          type: 'receber_atrasado',
          title: 'Recebimento em atraso',
          message: `${r.customer_name}: R$ ${r.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Vencido)`,
          severity: 'medium',
        });
      }
    });

    // Low stock
    data.products.forEach((prod) => {
      if (prod.status === 'ativo' && prod.current_stock <= prod.min_stock) {
        alerts.push({
          id: 'alert_stock_' + prod.id,
          type: 'estoque_baixo',
          title: 'Estoque Mínimo Atingido',
          message: `${prod.name}: ${prod.current_stock} un. restantes (Mínimo recomendado: ${prod.min_stock})`,
          severity: prod.current_stock === 0 ? 'high' : 'medium',
        });
      }
    });

    return res.json(alerts);
  });

  // --- FINANCIAL: CONTAS A RECEBER ---
  app.get('/api/financial/receivables', authMiddleware, requirePermission('financeiro'), (req, res) => {
    let items = [...db.getData().accounts_receivable];
    const { status, customer_id, startDate, endDate } = req.query;

    if (status) items = items.filter((i) => i.status === status);
    if (customer_id) items = items.filter((i) => i.customer_id === customer_id);
    if (startDate) items = items.filter((i) => i.due_date >= (startDate as string));
    if (endDate) items = items.filter((i) => i.due_date <= (endDate as string));

    return res.json(items);
  });

  app.post('/api/financial/receivables', authMiddleware, requirePermission('financeiro'), (req, res) => {
    const user = (req as any).user as SessionUser;
    const body = req.body;

    if (!body.customer_name || !body.amount || !body.due_date) {
      return res.status(400).json({ error: 'Nome do cliente, valor e data de vencimento são obrigatórios.' });
    }

    const newRec = {
      id: 'rec_' + Date.now(),
      code: `REC-${new Date().getFullYear()}-${db.getData().accounts_receivable.length + 1}`,
      customer_id: body.customer_id || '',
      customer_name: body.customer_name,
      description: body.description || 'Título a receber',
      sale_id: body.sale_id,
      category_id: body.category_id || 'cat_rec_vendas',
      category_name: body.category_name || 'Receitas',
      amount: Number(body.amount),
      issue_date: body.issue_date || new Date().toISOString().split('T')[0],
      due_date: body.due_date,
      payment_method: body.payment_method || 'pix',
      destination_account_id: body.destination_account_id,
      destination_account_name: body.destination_account_name,
      status: body.status || 'pendente',
      notes: body.notes,
      responsible_user: user.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.getData().accounts_receivable.unshift(newRec as any);
    db.addAuditLog(
      user,
      'RECEBER_CRIADO',
      'financeiro',
      `${user.name} cadastrou conta a receber ${newRec.code} para ${newRec.customer_name} no valor de R$ ${newRec.amount}.`,
      newRec.code,
      undefined,
      `R$ ${newRec.amount}`
    );
    db.persist();

    return res.status(201).json(newRec);
  });

  // Atomic receive settlement
  app.post('/api/financial/receivables/:id/receive', authMiddleware, requirePermission('financeiro'), (req, res) => {
    const user = (req as any).user as SessionUser;
    const { destination_account_id, notes } = req.body;

    if (!destination_account_id) {
      return res.status(400).json({ error: 'Conta bancária de destino é obrigatória para liquidação.' });
    }

    const result = db.receiveAccountReceivable(req.params.id, destination_account_id, user, notes);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.json(result.receivable);
  });

  app.delete('/api/financial/receivables/:id', authMiddleware, requirePermission('financeiro'), (req, res) => {
    const user = (req as any).user as SessionUser;
    const recIndex = db.getData().accounts_receivable.findIndex((r) => r.id === req.params.id);
    if (recIndex === -1) return res.status(404).json({ error: 'Conta a receber não encontrada.' });

    const rec = db.getData().accounts_receivable[recIndex];
    db.getData().accounts_receivable.splice(recIndex, 1);
    db.addAuditLog(
      user,
      'RECEBER_EXCLUIDO',
      'financeiro',
      `${user.name} cancelou/excluiu conta a receber ${rec.code}.`,
      rec.code,
      `R$ ${rec.amount}`,
      'Excluído'
    );
    db.persist();
    return res.json({ success: true });
  });

  // --- FINANCIAL: CONTAS A PAGAR ---
  app.get('/api/financial/payables', authMiddleware, requirePermission('financeiro'), (req, res) => {
    let items = [...db.getData().accounts_payable];
    const { status, supplier_id, startDate, endDate } = req.query;

    if (status) items = items.filter((i) => i.status === status);
    if (supplier_id) items = items.filter((i) => i.supplier_id === supplier_id);
    if (startDate) items = items.filter((i) => i.due_date >= (startDate as string));
    if (endDate) items = items.filter((i) => i.due_date <= (endDate as string));

    return res.json(items);
  });

  app.post('/api/financial/payables', authMiddleware, requirePermission('financeiro'), (req, res) => {
    const user = (req as any).user as SessionUser;
    const body = req.body;

    if (!body.supplier_name || !body.amount || !body.due_date) {
      return res.status(400).json({ error: 'Fornecedor, valor e data de vencimento são obrigatórios.' });
    }

    const newPay = {
      id: 'pag_' + Date.now(),
      code: `PAG-${new Date().getFullYear()}-${db.getData().accounts_payable.length + 1}`,
      supplier_id: body.supplier_id || '',
      supplier_name: body.supplier_name,
      description: body.description || 'Título a pagar',
      category_id: body.category_id || 'cat_desp_fornecedores',
      category_name: body.category_name || 'Despesas',
      amount: Number(body.amount),
      issue_date: body.issue_date || new Date().toISOString().split('T')[0],
      due_date: body.due_date,
      payment_method: body.payment_method || 'pix',
      source_account_id: body.source_account_id,
      source_account_name: body.source_account_name,
      status: body.status || 'pendente',
      notes: body.notes,
      responsible_user: user.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.getData().accounts_payable.unshift(newPay as any);
    db.addAuditLog(
      user,
      'PAGAR_CRIADO',
      'financeiro',
      `${user.name} cadastrou conta a pagar ${newPay.code} para ${newPay.supplier_name} no valor de R$ ${newPay.amount}.`,
      newPay.code,
      undefined,
      `R$ ${newPay.amount}`
    );
    db.persist();

    return res.status(201).json(newPay);
  });

  // Atomic pay settlement
  app.post('/api/financial/payables/:id/pay', authMiddleware, requirePermission('financeiro'), (req, res) => {
    const user = (req as any).user as SessionUser;
    const { source_account_id, notes } = req.body;

    if (!source_account_id) {
      return res.status(400).json({ error: 'Conta bancária de origem é obrigatória para pagamento.' });
    }

    const result = db.payAccountPayable(req.params.id, source_account_id, user, notes);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.json(result.payable);
  });

  app.delete('/api/financial/payables/:id', authMiddleware, requirePermission('financeiro'), (req, res) => {
    const user = (req as any).user as SessionUser;
    const payIndex = db.getData().accounts_payable.findIndex((p) => p.id === req.params.id);
    if (payIndex === -1) return res.status(404).json({ error: 'Conta a pagar não encontrada.' });

    const pay = db.getData().accounts_payable[payIndex];
    db.getData().accounts_payable.splice(payIndex, 1);
    db.addAuditLog(
      user,
      'PAGAR_EXCLUIDO',
      'financeiro',
      `${user.name} cancelou/excluiu conta a pagar ${pay.code}.`,
      pay.code,
      `R$ ${pay.amount}`,
      'Excluído'
    );
    db.persist();
    return res.json({ success: true });
  });

  // --- FINANCIAL: MOVIMENTAÇÕES & TRANSACTIONS ---
  app.get('/api/financial/transactions', authMiddleware, requirePermission('financeiro'), (req, res) => {
    let items = [...db.getData().financial_transactions];
    const { type, account_id, startDate, endDate } = req.query;

    if (type) items = items.filter((i) => i.type === type);
    if (account_id) items = items.filter((i) => i.account_id === account_id || i.destination_account_id === account_id);
    if (startDate) items = items.filter((i) => i.date >= (startDate as string));
    if (endDate) items = items.filter((i) => i.date <= (endDate as string));

    return res.json(items);
  });

  app.post('/api/financial/transactions', authMiddleware, requirePermission('financeiro'), (req, res) => {
    const user = (req as any).user as SessionUser;
    const { type, description, amount, category_id, category_name, account_id, date, notes } = req.body;

    if (!type || !description || !amount || !account_id) {
      return res.status(400).json({ error: 'Tipo, descrição, valor e conta são obrigatórios.' });
    }

    const bankAccount = db.getData().bank_accounts.find((b) => b.id === account_id);
    if (!bankAccount) return res.status(400).json({ error: 'Conta bancária inválida.' });

    const numAmount = Number(amount);
    if (type === 'entrada') {
      bankAccount.current_balance = Number(bankAccount.current_balance) + numAmount;
    } else if (type === 'saida') {
      if (bankAccount.current_balance < numAmount) {
        return res.status(400).json({ error: 'Saldo insuficiente na conta bancária selecionada.' });
      }
      bankAccount.current_balance = Number(bankAccount.current_balance) - numAmount;
    }

    const newTx = {
      id: 'tx_' + Date.now(),
      type,
      description,
      amount: numAmount,
      category_id,
      category_name,
      account_id: bankAccount.id,
      account_name: bankAccount.name,
      date: date || new Date().toISOString(),
      user_id: user.id,
      user_name: user.name,
      reference_type: 'manual',
      notes,
      createdAt: new Date().toISOString(),
    };

    db.getData().financial_transactions.unshift(newTx as any);
    db.addAuditLog(
      user,
      'MOVIMENTACAO_REGISTRADA',
      'financeiro',
      `${user.name} registrou movimentação manual de ${type.toUpperCase()}: ${description} (R$ ${numAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`
    );
    db.persist();

    return res.status(201).json(newTx);
  });

  // --- FINANCIAL: CONTAS BANCÁRIAS & TRANSFERÊNCIAS ---
  app.get('/api/financial/accounts', authMiddleware, requirePermission('financeiro'), (_req, res) => {
    return res.json(db.getData().bank_accounts);
  });

  app.post('/api/financial/accounts', authMiddleware, requirePermission('financeiro'), (req, res) => {
    const user = (req as any).user as SessionUser;
    const body = req.body;

    if (!body.name || !body.bank) {
      return res.status(400).json({ error: 'Nome da conta e banco são obrigatórios.' });
    }

    const newAcc = {
      id: 'bank_' + Date.now(),
      name: body.name,
      bank: body.bank,
      agency: body.agency || '',
      account_number: body.account_number || '',
      type: body.type || 'conta_corrente',
      initial_balance: Number(body.initial_balance) || 0,
      current_balance: Number(body.initial_balance) || 0,
      status: body.status || 'ativa',
      createdAt: new Date().toISOString(),
    };

    db.getData().bank_accounts.push(newAcc as any);
    db.addAuditLog(
      user,
      'CONTA_BANCARIA_CRIADA',
      'financeiro',
      `${user.name} cadastrou a conta bancária ${newAcc.name}.`
    );
    db.persist();

    return res.status(201).json(newAcc);
  });

  app.post('/api/financial/transfer', authMiddleware, requirePermission('financeiro'), (req, res) => {
    const user = (req as any).user as SessionUser;
    const { source_account_id, destination_account_id, amount, notes } = req.body;

    const result = db.transferBetweenAccounts(
      source_account_id,
      destination_account_id,
      Number(amount),
      user,
      notes
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.json({ success: true, message: 'Transferência executada com sucesso.' });
  });

  // --- FINANCIAL: CAIXA ---
  app.get('/api/financial/cash', authMiddleware, requirePermission('financeiro'), (_req, res) => {
    return res.json(db.getData().cash_registers);
  });

  app.post('/api/financial/cash/close', authMiddleware, requirePermission('financeiro'), (req, res) => {
    const user = (req as any).user as SessionUser;
    const { register_id, final_counted_balance, notes } = req.body;

    const result = db.closeCashRegister(register_id, Number(final_counted_balance), user, notes);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.json(result.register);
  });

  // --- FINANCIAL: CATEGORIAS ---
  app.get('/api/financial/categories', authMiddleware, requirePermission('financeiro'), (_req, res) => {
    return res.json(db.getData().categories);
  });

  app.post('/api/financial/categories', authMiddleware, requirePermission('financeiro'), (req, res) => {
    const user = (req as any).user as SessionUser;
    const { name, type, color } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Nome e tipo são obrigatórios.' });

    const newCat = {
      id: 'cat_' + Date.now(),
      name,
      type,
      color: color || '#3b82f6',
      createdAt: new Date().toISOString(),
    };

    db.getData().categories.push(newCat as any);
    db.addAuditLog(user, 'CATEGORIA_CRIADA', 'financeiro', `${user.name} criou a categoria ${name} (${type}).`);
    db.persist();
    return res.status(201).json(newCat);
  });

  // --- VENDAS & PEDIDOS ---
  app.get('/api/sales', authMiddleware, requirePermission('vendas'), (req, res) => {
    let items = [...db.getData().sales];
    const { customer_id, seller_id, startDate, endDate } = req.query;

    if (customer_id) items = items.filter((s) => s.customer_id === customer_id);
    if (seller_id) items = items.filter((s) => s.seller_id === seller_id);
    if (startDate) items = items.filter((s) => s.date >= (startDate as string));
    if (endDate) items = items.filter((s) => s.date <= (endDate as string));

    return res.json(items);
  });

  app.post('/api/sales', authMiddleware, requirePermission('vendas'), (req, res) => {
    const user = (req as any).user as SessionUser;
    const result = db.createSale(req.body, user);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(201).json(result.sale);
  });

  app.get('/api/orders', authMiddleware, requirePermission('pedidos'), (_req, res) => {
    return res.json(db.getData().orders);
  });

  app.put('/api/orders/:id/status', authMiddleware, requirePermission('pedidos'), (req, res) => {
    const user = (req as any).user as SessionUser;
    const { status } = req.body;
    const order = db.getData().orders.find((o) => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });

    const prevStatus = order.status;
    order.status = status;
    order.updatedAt = new Date().toISOString();

    db.addAuditLog(
      user,
      'PEDIDO_STATUS_ALTERADO',
      'pedidos',
      `${user.name} alterou status do pedido ${order.order_number} de "${prevStatus}" para "${status}".`,
      order.order_number,
      prevStatus,
      status
    );
    db.persist();

    return res.json(order);
  });

  app.get('/api/commissions', authMiddleware, requirePermission('vendas'), (_req, res) => {
    return res.json(db.getData().commissions);
  });

  app.post('/api/commissions/:id/pay', authMiddleware, requirePermission('vendas'), (req, res) => {
    const user = (req as any).user as SessionUser;
    const com = db.getData().commissions.find((c) => c.id === req.params.id);
    if (!com) return res.status(404).json({ error: 'Comissão não encontrada.' });

    com.status = 'pago';
    com.payment_date = new Date().toISOString();
    db.addAuditLog(
      user,
      'COMISSAO_PAGA',
      'vendas',
      `${user.name} liquidou comissão de ${com.seller_name} no valor de R$ ${com.commission_amount}.`
    );
    db.persist();

    return res.json(com);
  });

  // --- CLIENTES & FORNECEDORES ---
  app.get('/api/customers', authMiddleware, requirePermission('clientes'), (_req, res) => {
    return res.json(db.getData().customers);
  });

  app.post('/api/customers', authMiddleware, requirePermission('clientes'), (req, res) => {
    const user = (req as any).user as SessionUser;
    const body = req.body;

    if (!body.name || !body.cpf_cnpj) {
      return res.status(400).json({ error: 'Nome e CPF/CNPJ são obrigatórios.' });
    }

    const newCust = {
      id: 'cli_' + Date.now(),
      name: body.name,
      cpf_cnpj: body.cpf_cnpj,
      phone: body.phone || '',
      whatsapp: body.whatsapp || '',
      email: body.email || '',
      address: body.address || '',
      city: body.city || '',
      state: body.state || '',
      cep: body.cep || '',
      notes: body.notes || '',
      status: body.status || 'ativo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.getData().customers.push(newCust as any);
    db.addAuditLog(user, 'CLIENTE_CRIADO', 'clientes', `${user.name} cadastrou cliente ${newCust.name}.`);
    db.persist();
    return res.status(201).json(newCust);
  });

  app.put('/api/customers/:id', authMiddleware, requirePermission('clientes'), (req, res) => {
    const user = (req as any).user as SessionUser;
    const cust = db.getData().customers.find((c) => c.id === req.params.id);
    if (!cust) return res.status(404).json({ error: 'Cliente não encontrado.' });

    Object.assign(cust, req.body, { updatedAt: new Date().toISOString() });
    db.addAuditLog(user, 'CLIENTE_EDITADO', 'clientes', `${user.name} atualizou dados do cliente ${cust.name}.`);
    db.persist();
    return res.json(cust);
  });

  app.get('/api/suppliers', authMiddleware, requirePermission('fornecedores'), (_req, res) => {
    return res.json(db.getData().suppliers);
  });

  app.post('/api/suppliers', authMiddleware, requirePermission('fornecedores'), (req, res) => {
    const user = (req as any).user as SessionUser;
    const body = req.body;

    if (!body.name || !body.cpf_cnpj) {
      return res.status(400).json({ error: 'Razão social e CNPJ são obrigatórios.' });
    }

    const newSup = {
      id: 'sup_' + Date.now(),
      name: body.name,
      cpf_cnpj: body.cpf_cnpj,
      phone: body.phone || '',
      whatsapp: body.whatsapp || '',
      email: body.email || '',
      address: body.address || '',
      city: body.city || '',
      state: body.state || '',
      cep: body.cep || '',
      notes: body.notes || '',
      status: body.status || 'ativo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.getData().suppliers.push(newSup as any);
    db.addAuditLog(user, 'FORNECEDOR_CRIADO', 'fornecedores', `${user.name} cadastrou fornecedor ${newSup.name}.`);
    db.persist();
    return res.status(201).json(newSup);
  });

  app.put('/api/suppliers/:id', authMiddleware, requirePermission('fornecedores'), (req, res) => {
    const user = (req as any).user as SessionUser;
    const sup = db.getData().suppliers.find((s) => s.id === req.params.id);
    if (!sup) return res.status(404).json({ error: 'Fornecedor não encontrado.' });

    Object.assign(sup, req.body, { updatedAt: new Date().toISOString() });
    db.addAuditLog(user, 'FORNECEDOR_EDITADO', 'fornecedores', `${user.name} atualizou dados de ${sup.name}.`);
    db.persist();
    return res.json(sup);
  });

  // --- PRODUTOS & ESTOQUE ---
  app.get('/api/products', authMiddleware, requirePermission('produtos'), (_req, res) => {
    return res.json(db.getData().products);
  });

  app.post('/api/products', authMiddleware, requirePermission('produtos'), (req, res) => {
    const user = (req as any).user as SessionUser;
    const body = req.body;

    if (!body.name || !body.sale_price) {
      return res.status(400).json({ error: 'Nome do produto e preço de venda são obrigatórios.' });
    }

    const cost = Number(body.cost) || 0;
    const sale_price = Number(body.sale_price);
    const margin = sale_price - cost;
    const margin_percentage = sale_price > 0 ? Math.round(((margin / sale_price) * 100) * 10) / 10 : 0;

    const newProd = {
      id: 'prod_' + Date.now(),
      name: body.name,
      sku: body.sku || `NX-${Date.now().toString().slice(-4)}`,
      category: body.category || 'Geral',
      description: body.description || '',
      photo: body.photo,
      supplier_id: body.supplier_id,
      supplier_name: body.supplier_name,
      cost,
      sale_price,
      margin,
      margin_percentage,
      current_stock: Number(body.current_stock) || 0,
      min_stock: Number(body.min_stock) || 5,
      status: body.status || 'ativo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.getData().products.push(newProd as any);
    db.addAuditLog(
      user,
      'PRODUTO_CRIADO',
      'produtos',
      `${user.name} cadastrou produto ${newProd.name} (SKU: ${newProd.sku}).`
    );
    db.persist();

    return res.status(201).json(newProd);
  });

  app.put('/api/products/:id', authMiddleware, requirePermission('produtos'), (req, res) => {
    const user = (req as any).user as SessionUser;
    const prod = db.getData().products.find((p) => p.id === req.params.id);
    if (!prod) return res.status(404).json({ error: 'Produto não encontrado.' });

    const prevPrice = prod.sale_price;
    Object.assign(prod, req.body, { updatedAt: new Date().toISOString() });

    // Recalculate margins
    prod.margin = prod.sale_price - prod.cost;
    prod.margin_percentage = prod.sale_price > 0 ? Math.round(((prod.margin / prod.sale_price) * 100) * 10) / 10 : 0;

    db.addAuditLog(
      user,
      'PRODUTO_EDITADO',
      'produtos',
      `${user.name} atualizou o produto ${prod.name}.`,
      prod.name,
      `R$ ${prevPrice}`,
      `R$ ${prod.sale_price}`
    );
    db.persist();
    return res.json(prod);
  });

  app.get('/api/inventory/movements', authMiddleware, requirePermission('estoque'), (_req, res) => {
    return res.json(db.getData().inventory_movements);
  });

  app.post('/api/inventory/movements', authMiddleware, requirePermission('estoque'), (req, res) => {
    const user = (req as any).user as SessionUser;
    const result = db.recordStockMovement(req.body, user);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(201).json(result.movement);
  });

  // --- RELATÓRIOS ---
  app.get('/api/reports/financial', authMiddleware, requirePermission('relatorios'), (req, res) => {
    const data = db.getData();
    const { startDate, endDate } = req.query;

    let txs = [...data.financial_transactions];
    if (startDate) txs = txs.filter((t) => t.date >= (startDate as string));
    if (endDate) txs = txs.filter((t) => t.date <= (endDate as string));

    let totalEntradas = 0;
    let totalSaidas = 0;

    txs.forEach((t) => {
      if (t.type === 'entrada') totalEntradas += t.amount;
      if (t.type === 'saida') totalSaidas += t.amount;
    });

    const lucroLiquido = totalEntradas - totalSaidas;
    const margemOperacional = totalEntradas > 0 ? (lucroLiquido / totalEntradas) * 100 : 0;

    return res.json({
      totalEntradas,
      totalSaidas,
      lucroLiquido,
      margemOperacional: Math.round(margemOperacional * 10) / 10,
      transactions: txs,
    });
  });

  app.get('/api/reports/sales', authMiddleware, requirePermission('relatorios'), (req, res) => {
    const data = db.getData();
    const { startDate, endDate } = req.query;

    let sales = [...data.sales];
    if (startDate) sales = sales.filter((s) => s.date >= (startDate as string));
    if (endDate) sales = sales.filter((s) => s.date <= (endDate as string));

    const totalVendas = sales.reduce((sum, s) => sum + s.total, 0);
    const totalPedidos = sales.length;
    const ticketMedio = totalPedidos > 0 ? totalVendas / totalPedidos : 0;

    // Top selling products
    const productSalesMap: Record<string, { name: string; quantity: number; total: number }> = {};
    sales.forEach((s) => {
      s.items.forEach((item) => {
        if (!productSalesMap[item.product_id]) {
          productSalesMap[item.product_id] = { name: item.product_name, quantity: 0, total: 0 };
        }
        productSalesMap[item.product_id].quantity += item.quantity;
        productSalesMap[item.product_id].total += item.total;
      });
    });

    const topProducts = Object.values(productSalesMap).sort((a, b) => b.total - a.total);

    return res.json({
      totalVendas,
      totalPedidos,
      ticketMedio: Math.round(ticketMedio * 100) / 100,
      topProducts,
      sales,
    });
  });

  app.get('/api/reports/inventory', authMiddleware, requirePermission('relatorios'), (_req, res) => {
    const data = db.getData();
    let totalValue = 0;
    let totalItems = 0;
    const lowStock: any[] = [];

    data.products.forEach((p) => {
      if (p.status === 'ativo') {
        totalValue += p.current_stock * p.sale_price;
        totalItems += p.current_stock;
        if (p.current_stock <= p.min_stock) {
          lowStock.push(p);
        }
      }
    });

    return res.json({
      totalValue,
      totalItems,
      lowStock,
      allProducts: data.products,
    });
  });

  // --- USUÁRIOS & PERMISSÕES ---
  app.get('/api/users', authMiddleware, requirePermission('usuarios'), (_req, res) => {
    const users = db.getData().users.map(({ password_hash, ...u }) => u);
    return res.json(users);
  });

  app.post('/api/users', authMiddleware, requirePermission('usuarios'), (req, res) => {
    const currentUser = (req as any).user as SessionUser;
    const { name, email, password, role, position, permissions } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }

    const existing = db.getData().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Já existe um usuário com este e-mail.' });
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      name,
      email,
      password_hash: hashPassword(password),
      role: role || 'colaborador',
      position: position || 'Membro da Equipe',
      status: 'ativo' as const,
      permissions: permissions || ['dashboard'],
      createdAt: new Date().toISOString(),
    };

    db.getData().users.push(newUser);
    db.addAuditLog(
      currentUser,
      'USUARIO_CRIADO',
      'usuarios',
      `${currentUser.name} cadastrou o usuário ${name} (${email}).`
    );
    db.persist();

    const { password_hash, ...safeUser } = newUser;
    return res.status(201).json(safeUser);
  });

  app.put('/api/users/:id', authMiddleware, requirePermission('usuarios'), (req, res) => {
    const currentUser = (req as any).user as SessionUser;
    const target = db.getData().users.find((u) => u.id === req.params.id);
    if (!target) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const { name, role, position, status, permissions, password } = req.body;
    if (name) target.name = name;
    if (role) target.role = role;
    if (position) target.position = position;
    if (status) target.status = status;
    if (permissions) target.permissions = permissions;
    if (password && password.length >= 6) {
      target.password_hash = hashPassword(password);
    }

    db.addAuditLog(
      currentUser,
      'USUARIO_ATUALIZADO',
      'usuarios',
      `${currentUser.name} alterou permissões ou cadastro de ${target.name}.`
    );
    db.persist();

    const { password_hash, ...safeUser } = target;
    return res.json(safeUser);
  });

  // --- AUDITORIA & ATIVIDADES ---
  app.get('/api/audit-logs', authMiddleware, requirePermission('atividades'), (req, res) => {
    let items = [...db.getData().audit_logs];
    const { module, user_id, limit } = req.query;

    if (module) items = items.filter((l) => l.module === module);
    if (user_id) items = items.filter((l) => l.user_id === user_id);

    const max = limit ? parseInt(limit as string, 10) : 100;
    return res.json(items.slice(0, max));
  });

  // --- NOTIFICAÇÕES ---
  app.get('/api/notifications', authMiddleware, (_req, res) => {
    return res.json(db.getData().notifications);
  });

  app.post('/api/notifications/:id/read', authMiddleware, (req, res) => {
    db.markNotificationAsRead(req.params.id);
    return res.json({ success: true });
  });

  app.post('/api/notifications/read-all', authMiddleware, (_req, res) => {
    db.markAllNotificationsAsRead();
    return res.json({ success: true });
  });

  // --- CONFIGURAÇÕES DA EMPRESA ---
  app.get('/api/settings', authMiddleware, requirePermission('configuracoes'), (_req, res) => {
    return res.json(db.getData().company_settings);
  });

  app.put('/api/settings', authMiddleware, requirePermission('configuracoes'), (req, res) => {
    const user = (req as any).user as SessionUser;
    Object.assign(db.getData().company_settings, req.body, { updatedAt: new Date().toISOString() });

    db.addAuditLog(
      user,
      'CONFIGURACOES_ATUALIZADAS',
      'configuracoes',
      `${user.name} atualizou as configurações empresariais da NEXORA GROUP.`
    );
    db.persist();

    return res.json(db.getData().company_settings);
  });

  // --- BACKUP & RESTORE ---
  app.get('/api/backup/export', authMiddleware, requirePermission('configuracoes'), (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=nexora_backup_${Date.now()}.json`);
    return res.send(JSON.stringify(db.getData(), null, 2));
  });

  app.post('/api/backup/restore', authMiddleware, requirePermission('configuracoes'), (req, res) => {
    const user = (req as any).user as SessionUser;
    const ok = db.restoreBackup(req.body, user);
    if (!ok) return res.status(400).json({ error: 'Arquivo de backup inválido ou corrompido.' });
    return res.json({ success: true, message: 'Banco de dados restaurado com sucesso.' });
  });

  // --- PESQUISA GLOBAL ---
  app.get('/api/search', authMiddleware, (req, res) => {
    const query = String(req.query.q || '').toLowerCase().trim();
    if (!query) return res.json({ customers: [], products: [], sales: [], orders: [] });

    const data = db.getData();
    const customers = data.customers.filter(
      (c) => c.name.toLowerCase().includes(query) || c.cpf_cnpj.includes(query) || (c.email && c.email.toLowerCase().includes(query))
    ).slice(0, 5);

    const products = data.products.filter(
      (p) => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query)
    ).slice(0, 5);

    const sales = data.sales.filter(
      (s) => s.code.toLowerCase().includes(query) || s.customer_name.toLowerCase().includes(query)
    ).slice(0, 5);

    const orders = data.orders.filter(
      (o) => o.order_number.toLowerCase().includes(query) || o.customer_name.toLowerCase().includes(query)
    ).slice(0, 5);

    return res.json({ customers, products, sales, orders });
  });

  // --- FRONTEND INTEGRATION (DEV VITE MIDDLEWARES / PROD STATIC) ---
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nexora Group Enterprise Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
