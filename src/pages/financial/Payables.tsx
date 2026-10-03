import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  Plus,
  Search,
  CheckCircle,
  Trash2,
  DollarSign,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { AccountPayable, BankAccount, Supplier, FinancialCategory, PaymentMethod } from '../../types/index.ts';
import { formatCurrency, formatDate, getStatusBadgeClass, getPaymentMethodLabel } from '../../utils/formatters.ts';
import { Modal } from '../../components/Modal.tsx';
import { useToast } from '../../context/ToastContext.tsx';

export const Payables: React.FC = () => {
  const { success, error } = useToast();
  const [payables, setPayables] = useState<AccountPayable[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<AccountPayable | null>(null);

  // Form states
  const [newPay, setNewPay] = useState<{
    supplier_name: string;
    supplier_id: string;
    description: string;
    category_id: string;
    category_name: string;
    amount: string;
    issue_date: string;
    due_date: string;
    payment_method: PaymentMethod;
    notes: string;
  }>({
    supplier_name: '',
    supplier_id: '',
    description: '',
    category_id: '',
    category_name: '',
    amount: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_method: 'pix',
    notes: '',
  });

  const [payData, setPayData] = useState({
    source_account_id: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [pays, accs, sups, cats] = await Promise.all([
        api.getPayables({
          status: statusFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
        api.getBankAccounts(),
        api.getSuppliers(),
        api.getCategories(),
      ]);
      setPayables(pays);
      setBankAccounts(accs);
      setSuppliers(sups);
      setCategories(cats.filter((c) => c.type === 'despesa'));
      if (accs.length > 0 && !payData.source_account_id) {
        setPayData((prev) => ({ ...prev, source_account_id: accs[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, startDate, endDate]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPay.supplier_name || !newPay.amount || !newPay.due_date) {
      error('Preencha fornecedor, valor e vencimento.');
      return;
    }

    try {
      await api.createPayable({
        ...newPay,
        amount: Number(newPay.amount),
        status: 'pendente',
      });
      success('Conta a pagar cadastrada com sucesso!');
      setShowCreateModal(false);
      setNewPay({
        supplier_name: '',
        supplier_id: '',
        description: '',
        category_id: '',
        category_name: '',
        amount: '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: '',
        payment_method: 'pix',
        notes: '',
      });
      loadData();
    } catch (err: any) {
      error(err.message || 'Erro ao cadastrar conta a pagar.');
    }
  };

  const handlePaySettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayable || !payData.source_account_id) {
      error('Selecione a conta bancária de origem para pagamento.');
      return;
    }

    try {
      await api.payAccount(
        selectedPayable.id,
        payData.source_account_id,
        payData.notes
      );
      success(`Pagamento de ${formatCurrency(selectedPayable.amount)} liquidado com sucesso!`);
      setShowPayModal(false);
      setSelectedPayable(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Erro ao liquidar pagamento.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta conta a pagar?')) return;
    try {
      await api.deletePayable(id);
      success('Conta a pagar excluída.');
      loadData();
    } catch (err: any) {
      error(err.message || 'Erro ao excluir conta.');
    }
  };

  const filteredPayables = payables.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.supplier_name.toLowerCase().includes(term) ||
      p.code.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term)
    );
  });

  const totalPending = payables
    .filter((p) => p.status === 'pendente' || p.status === 'atrasado')
    .reduce((s, p) => s + p.amount, 0);

  const totalPaid = payables
    .filter((p) => p.status === 'pago')
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ArrowUpRight className="w-6 h-6 text-rose-500" />
            <span>Contas a Pagar</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gestão de fornecedores, despesas operacionais, tributos e obrigações da empresa
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Conta a Pagar</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Obrigações Pendentes</span>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400 tabular-nums mt-1">
            {formatCurrency(totalPending)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Pago no Período</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
            {formatCurrency(totalPaid)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total de Registros</span>
          <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums mt-1">
            {payables.length} títulos
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar fornecedor, código ou descrição..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 outline-hidden"
            >
              <option value="">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="atrasado">Atrasado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 outline-hidden"
            />
          </div>

          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Payables Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Fornecedor</th>
                <th className="px-4 py-3">Descrição / Categoria</th>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3">Forma Pagto</th>
                <th className="px-4 py-3 text-right">Valor (R$)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayables.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Nenhuma conta a pagar encontrada.
                  </td>
                </tr>
              ) : (
                filteredPayables.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-rose-600 dark:text-rose-400">
                      {p.code}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                      {p.supplier_name}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700 dark:text-slate-300">{p.description}</p>
                      <span className="text-[10px] text-slate-400">{p.category_name}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 tabular-nums">
                      {formatDate(p.due_date)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {getPaymentMethodLabel(p.payment_method)}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-rose-600 dark:text-rose-400 tabular-nums">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getStatusBadgeClass(
                          p.status
                        )}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.status !== 'pago' && (
                          <button
                            onClick={() => {
                              setSelectedPayable(p);
                              setShowPayModal(true);
                            }}
                            className="p-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 transition-colors"
                            title="Quitar / Pagar Conta"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded-md bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 dark:bg-slate-800 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Conta a Pagar */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nova Conta a Pagar"
        subtitle="Cadastre uma obrigação financeira da empresa"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Fornecedor / Beneficiário *
            </label>
            <input
              type="text"
              list="supplier_list"
              value={newPay.supplier_name}
              onChange={(e) => {
                const val = e.target.value;
                const matched = suppliers.find((s) => s.name === val);
                setNewPay({
                  ...newPay,
                  supplier_name: val,
                  supplier_id: matched ? matched.id : '',
                });
              }}
              placeholder="Digite o fornecedor..."
              required
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
            />
            <datalist id="supplier_list">
              {suppliers.map((s) => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descrição da Despesa *
            </label>
            <input
              type="text"
              value={newPay.description}
              onChange={(e) => setNewPay({ ...newPay, description: e.target.value })}
              placeholder="Ex: Compra de mercadorias, Aluguel ou Google Ads"
              required
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                value={newPay.amount}
                onChange={(e) => setNewPay({ ...newPay, amount: e.target.value })}
                placeholder="0,00"
                required
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data de Vencimento *
              </label>
              <input
                type="date"
                value={newPay.due_date}
                onChange={(e) => setNewPay({ ...newPay, due_date: e.target.value })}
                required
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={newPay.payment_method}
                onChange={(e) => setNewPay({ ...newPay, payment_method: e.target.value as any })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              >
                <option value="pix">Pix</option>
                <option value="boleto">Boleto</option>
                <option value="transferencia">Transferência</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="dinheiro">Dinheiro</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoria
              </label>
              <select
                value={newPay.category_id}
                onChange={(e) => {
                  const cat = categories.find((c) => c.id === e.target.value);
                  setNewPay({
                    ...newPay,
                    category_id: e.target.value,
                    category_name: cat ? cat.name : 'Despesa',
                  });
                }}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              >
                <option value="">Selecione categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações
            </label>
            <textarea
              rows={2}
              value={newPay.notes}
              onChange={(e) => setNewPay({ ...newPay, notes: e.target.value })}
              placeholder="Detalhes ou condições de pagamento..."
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-600 dark:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold"
            >
              Cadastrar Conta
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Liquidar Pagamento */}
      <Modal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        title="Confirmar Pagamento de Conta"
        subtitle={`Liquidando conta ${selectedPayable?.code} de ${selectedPayable?.supplier_name}`}
      >
        <form onSubmit={handlePaySettlement} className="space-y-4 text-xs">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800/40">
            <p className="text-[11px] text-rose-800 dark:text-rose-300">
              Valor a debitar:{' '}
              <strong className="text-sm font-black tabular-nums text-rose-900 dark:text-rose-200">
                {formatCurrency(selectedPayable?.amount)}
              </strong>
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Conta Bancária de Origem (De onde sairá o saldo) *
            </label>
            <select
              value={payData.source_account_id}
              onChange={(e) => setPayData({ ...payData, source_account_id: e.target.value })}
              required
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden font-medium"
            >
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (Saldo disponível: {formatCurrency(b.current_balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observação / Comprovante
            </label>
            <input
              type="text"
              value={payData.notes}
              onChange={(e) => setPayData({ ...payData, notes: e.target.value })}
              placeholder="Ex: Pago via Pix Itaú ou autenticação bancária"
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowPayModal(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-600 dark:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold"
            >
              Confirmar e Debitar Saldo
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
