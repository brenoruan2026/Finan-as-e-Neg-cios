import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Plus,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Filter,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { FinancialTransaction, BankAccount, FinancialCategory } from '../../types/index.ts';
import { formatCurrency, formatDateTime } from '../../utils/formatters.ts';
import { Modal } from '../../components/Modal.tsx';
import { useToast } from '../../context/ToastContext.tsx';

export const Transactions: React.FC = () => {
  const { success, error } = useToast();
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [newTx, setNewTx] = useState({
    type: 'entrada' as 'entrada' | 'saida',
    description: '',
    amount: '',
    account_id: '',
    category_id: '',
    category_name: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [txs, accs, cats] = await Promise.all([
        api.getTransactions({
          type: typeFilter || undefined,
          account_id: accountFilter || undefined,
        }),
        api.getBankAccounts(),
        api.getCategories(),
      ]);
      setTransactions(txs);
      setBankAccounts(accs);
      setCategories(cats);
      if (accs.length > 0 && !newTx.account_id) {
        setNewTx((prev) => ({ ...prev, account_id: accs[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter, accountFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.description || !newTx.amount || !newTx.account_id) {
      error('Preencha descrição, valor e conta.');
      return;
    }

    try {
      await api.createTransaction({
        ...newTx,
        amount: Number(newTx.amount),
      });
      success('Movimentação financeira registrada!');
      setShowModal(false);
      setNewTx({
        type: 'entrada',
        description: '',
        amount: '',
        account_id: bankAccounts[0]?.id || '',
        category_id: '',
        category_name: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      loadData();
    } catch (err: any) {
      error(err.message || 'Erro ao criar movimentação.');
    }
  };

  const filtered = transactions.filter((t) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.description.toLowerCase().includes(term) ||
      (t.user_name && t.user_name.toLowerCase().includes(term)) ||
      (t.category_name && t.category_name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-sky-500" />
            <span>Movimentações & Extrato Geral</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registro unificado de todas as entradas, saídas e transferências entre contas
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Lançar Movimentação Manual</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por descrição, responsável ou categoria..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 outline-hidden"
            >
              <option value="">Todos os tipos (Entradas, Saídas, Transferências)</option>
              <option value="entrada">Entradas</option>
              <option value="saida">Saídas</option>
              <option value="transferencia">Transferências</option>
            </select>
          </div>

          <div>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 outline-hidden"
            >
              <option value="">Todas as contas bancárias</option>
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Data e Hora</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Conta Bancária</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3 text-right">Valor (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Nenhuma movimentação financeira encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  let isEntry = t.type === 'entrada';
                  let isExit = t.type === 'saida';
                  let isTransfer = t.type === 'transferencia';

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-semibold text-[11px] capitalize">
                          {isEntry && (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                              <span>Entrada</span>
                            </span>
                          )}
                          {isExit && (
                            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>Saída</span>
                            </span>
                          )}
                          {isTransfer && (
                            <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                              <span>Transf.</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 tabular-nums">
                        {formatDateTime(t.date || t.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {t.description}
                        </p>
                        {t.notes && <span className="text-[10px] text-slate-400">{t.notes}</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {t.category_name || '-'}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                        {t.account_name}
                        {t.destination_account_name && ` → ${t.destination_account_name}`}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                        {t.user_name}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-black tabular-nums text-sm ${
                          isEntry
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isExit
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-sky-600 dark:text-sky-400'
                        }`}
                      >
                        {isEntry ? '+' : isExit ? '-' : ''}
                        {formatCurrency(t.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lançar Movimentação Manual */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Lançar Movimentação Manual"
        subtitle="Registre uma entrada ou saída direta com impacto imediato no saldo bancário"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tipo de Movimentação *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewTx({ ...newTx, type: 'entrada' })}
                className={`py-2 px-3 rounded-lg font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                  newTx.type === 'entrada'
                    ? 'bg-emerald-500 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Entrada (Crédito)</span>
              </button>
              <button
                type="button"
                onClick={() => setNewTx({ ...newTx, type: 'saida' })}
                className={`py-2 px-3 rounded-lg font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                  newTx.type === 'saida'
                    ? 'bg-rose-500 text-white border-rose-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Saída (Débito)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descrição *
            </label>
            <input
              type="text"
              value={newTx.description}
              onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
              placeholder="Ex: Rendimento de aplicação, Tarifa de manutenção, etc."
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
                value={newTx.amount}
                onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                placeholder="0,00"
                required
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data *
              </label>
              <input
                type="date"
                value={newTx.date}
                onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                required
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Conta Bancária Afetada *
              </label>
              <select
                value={newTx.account_id}
                onChange={(e) => setNewTx({ ...newTx, account_id: e.target.value })}
                required
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              >
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({formatCurrency(b.current_balance)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoria
              </label>
              <select
                value={newTx.category_id}
                onChange={(e) => {
                  const cat = categories.find((c) => c.id === e.target.value);
                  setNewTx({
                    ...newTx,
                    category_id: e.target.value,
                    category_name: cat ? cat.name : 'Diversos',
                  });
                }}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              >
                <option value="">Selecione categoria</option>
                {categories
                  .filter((c) => (newTx.type === 'entrada' ? c.type === 'receita' : c.type === 'despesa'))
                  .map((c) => (
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
            <input
              type="text"
              value={newTx.notes}
              onChange={(e) => setNewTx({ ...newTx, notes: e.target.value })}
              placeholder="Observações adicionais..."
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
            />
          </div>

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
              Registrar Movimentação
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
