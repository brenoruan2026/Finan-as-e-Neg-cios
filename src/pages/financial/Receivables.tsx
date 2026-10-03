import React, { useState, useEffect } from 'react';
import {
  ArrowDownLeft,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Trash2,
  Calendar,
  DollarSign,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { AccountReceivable, BankAccount, Customer, FinancialCategory, PaymentMethod } from '../../types/index.ts';
import { formatCurrency, formatDate, getStatusBadgeClass, getPaymentMethodLabel } from '../../utils/formatters.ts';
import { Modal } from '../../components/Modal.tsx';
import { useToast } from '../../context/ToastContext.tsx';

export const Receivables: React.FC = () => {
  const { success, error } = useToast();
  const [receivables, setReceivables] = useState<AccountReceivable[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<AccountReceivable | null>(null);

  // Form states
  const [newRec, setNewRec] = useState<{
    customer_name: string;
    customer_id: string;
    description: string;
    category_id: string;
    category_name: string;
    amount: string;
    issue_date: string;
    due_date: string;
    payment_method: PaymentMethod;
    notes: string;
  }>({
    customer_name: '',
    customer_id: '',
    description: '',
    category_id: '',
    category_name: '',
    amount: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_method: 'pix',
    notes: '',
  });

  const [receiveData, setReceiveData] = useState({
    destination_account_id: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [recs, accs, custs, cats] = await Promise.all([
        api.getReceivables({
          status: statusFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
        api.getBankAccounts(),
        api.getCustomers(),
        api.getCategories(),
      ]);
      setReceivables(recs);
      setBankAccounts(accs);
      setCustomers(custs);
      setCategories(cats.filter((c) => c.type === 'receita'));
      if (accs.length > 0 && !receiveData.destination_account_id) {
        setReceiveData((prev) => ({ ...prev, destination_account_id: accs[0].id }));
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
    if (!newRec.customer_name || !newRec.amount || !newRec.due_date) {
      error('Preencha os campos obrigatórios.');
      return;
    }

    try {
      await api.createReceivable({
        ...newRec,
        amount: Number(newRec.amount),
        status: 'pendente',
      });
      success('Conta a receber cadastrada com sucesso!');
      setShowCreateModal(false);
      setNewRec({
        customer_name: '',
        customer_id: '',
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
      error(err.message || 'Erro ao criar conta a receber.');
    }
  };

  const handleReceiveSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceivable || !receiveData.destination_account_id) {
      error('Selecione a conta bancária de destino.');
      return;
    }

    try {
      await api.receiveAccount(
        selectedReceivable.id,
        receiveData.destination_account_id,
        receiveData.notes
      );
      success(`Recebimento de ${formatCurrency(selectedReceivable.amount)} liquidado com sucesso!`);
      setShowReceiveModal(false);
      setSelectedReceivable(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Erro ao liquidar recebimento.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta conta a receber?')) return;
    try {
      await api.deleteReceivable(id);
      success('Conta a receber cancelada com sucesso.');
      loadData();
    } catch (err: any) {
      error(err.message || 'Erro ao cancelar conta.');
    }
  };

  const filteredReceivables = receivables.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.customer_name.toLowerCase().includes(term) ||
      r.code.toLowerCase().includes(term) ||
      r.description.toLowerCase().includes(term)
    );
  });

  const totalPending = receivables
    .filter((r) => r.status === 'pendente' || r.status === 'atrasado')
    .reduce((s, r) => s + r.amount, 0);

  const totalReceived = receivables
    .filter((r) => r.status === 'recebido')
    .reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ArrowDownLeft className="w-6 h-6 text-sky-500" />
            <span>Contas a Receber</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gestão de títulos, recebimentos de clientes e fluxo de faturamento
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Conta a Receber</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Pendente / Atrasado</span>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums mt-1">
            {formatCurrency(totalPending)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Já Recebido</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
            {formatCurrency(totalReceived)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Títulos Registrados</span>
          <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums mt-1">
            {receivables.length} contas
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente, código ou descrição..."
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
              <option value="recebido">Recebido</option>
              <option value="atrasado">Atrasado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Data Inicial"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 outline-hidden"
            />
          </div>

          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Data Final"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Receivables Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Descrição / Categoria</th>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3">Forma Pagto</th>
                <th className="px-4 py-3 text-right">Valor (R$)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredReceivables.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Nenhuma conta a receber encontrada.
                  </td>
                </tr>
              ) : (
                filteredReceivables.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-sky-600 dark:text-sky-400">
                      {r.code}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                      {r.customer_name}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700 dark:text-slate-300">{r.description}</p>
                      <span className="text-[10px] text-slate-400">{r.category_name}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 tabular-nums">
                      {formatDate(r.due_date)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {getPaymentMethodLabel(r.payment_method)}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(r.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getStatusBadgeClass(
                          r.status
                        )}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.status !== 'recebido' && (
                          <button
                            onClick={() => {
                              setSelectedReceivable(r);
                              setShowReceiveModal(true);
                            }}
                            className="p-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 transition-colors"
                            title="Confirmar Recebimento"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 rounded-md bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 dark:bg-slate-800 transition-colors"
                          title="Excluir/Cancelar"
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

      {/* Modal Nova Conta a Receber */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nova Conta a Receber"
        subtitle="Cadastre um novo título ou faturamento para controle"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cliente *
            </label>
            <input
              type="text"
              list="customer_list"
              value={newRec.customer_name}
              onChange={(e) => {
                const val = e.target.value;
                const matched = customers.find((c) => c.name === val);
                setNewRec({
                  ...newRec,
                  customer_name: val,
                  customer_id: matched ? matched.id : '',
                });
              }}
              placeholder="Digite o nome do cliente..."
              required
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
            />
            <datalist id="customer_list">
              {customers.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descrição do Recebimento *
            </label>
            <input
              type="text"
              value={newRec.description}
              onChange={(e) => setNewRec({ ...newRec, description: e.target.value })}
              placeholder="Ex: Faturamento Lote 02 ou Serviço X"
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
                value={newRec.amount}
                onChange={(e) => setNewRec({ ...newRec, amount: e.target.value })}
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
                value={newRec.due_date}
                onChange={(e) => setNewRec({ ...newRec, due_date: e.target.value })}
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
                value={newRec.payment_method}
                onChange={(e) => setNewRec({ ...newRec, payment_method: e.target.value as any })}
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
                value={newRec.category_id}
                onChange={(e) => {
                  const cat = categories.find((c) => c.id === e.target.value);
                  setNewRec({
                    ...newRec,
                    category_id: e.target.value,
                    category_name: cat ? cat.name : 'Receita',
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
              value={newRec.notes}
              onChange={(e) => setNewRec({ ...newRec, notes: e.target.value })}
              placeholder="Detalhes adicionais..."
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
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-bold"
            >
              Cadastrar Conta
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Liquidar Recebimento */}
      <Modal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        title="Confirmar Recebimento"
        subtitle={`Liquidando conta ${selectedReceivable?.code} de ${selectedReceivable?.customer_name}`}
      >
        <form onSubmit={handleReceiveSettlement} className="space-y-4 text-xs">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
              Valor a receber:{' '}
              <strong className="text-sm font-black tabular-nums text-emerald-900 dark:text-emerald-200">
                {formatCurrency(selectedReceivable?.amount)}
              </strong>
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Conta Bancária de Destino (Onde o valor entrou) *
            </label>
            <select
              value={receiveData.destination_account_id}
              onChange={(e) => setReceiveData({ ...receiveData, destination_account_id: e.target.value })}
              required
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden font-medium"
            >
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (Saldo atual: {formatCurrency(b.current_balance)})
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
              value={receiveData.notes}
              onChange={(e) => setReceiveData({ ...receiveData, notes: e.target.value })}
              placeholder="Ex: Pix chave CNPJ confirmado ou comprovante 9821"
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowReceiveModal(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-600 dark:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
            >
              Confirmar e Creditar Saldo
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
