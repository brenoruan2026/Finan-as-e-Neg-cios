import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Plus,
  ArrowLeftRight,
  Wallet,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { BankAccount } from '../../types/index.ts';
import { formatCurrency } from '../../utils/formatters.ts';
import { Modal } from '../../components/Modal.tsx';
import { useToast } from '../../context/ToastContext.tsx';

export const BankAccounts: React.FC = () => {
  const { success, error } = useToast();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Create form
  const [newAcc, setNewAcc] = useState({
    name: '',
    bank: '',
    agency: '',
    account_number: '',
    type: 'conta_corrente' as any,
    initial_balance: '',
  });

  // Transfer form
  const [transferData, setTransferData] = useState({
    source_account_id: '',
    destination_account_id: '',
    amount: '',
    notes: '',
  });

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      const list = await api.getBankAccounts();
      setAccounts(list);
      if (list.length >= 2) {
        setTransferData((prev) => ({
          ...prev,
          source_account_id: prev.source_account_id || list[0].id,
          destination_account_id: prev.destination_account_id || list[1].id,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAcc.name || !newAcc.bank) {
      error('Preencha o nome da conta e o banco.');
      return;
    }

    try {
      await api.createBankAccount({
        ...newAcc,
        initial_balance: Number(newAcc.initial_balance) || 0,
      });
      success('Conta bancária cadastrada com sucesso!');
      setShowCreateModal(false);
      setNewAcc({
        name: '',
        bank: '',
        agency: '',
        account_number: '',
        type: 'conta_corrente',
        initial_balance: '',
      });
      loadAccounts();
    } catch (err: any) {
      error(err.message || 'Erro ao criar conta.');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferData.source_account_id || !transferData.destination_account_id || !transferData.amount) {
      error('Preencha todos os campos da transferência.');
      return;
    }
    if (transferData.source_account_id === transferData.destination_account_id) {
      error('A conta de origem não pode ser igual à conta de destino.');
      return;
    }

    try {
      await api.transferBetweenAccounts(
        transferData.source_account_id,
        transferData.destination_account_id,
        Number(transferData.amount),
        transferData.notes
      );
      success('Transferência executada com sucesso!');
      setShowTransferModal(false);
      setTransferData((prev) => ({ ...prev, amount: '', notes: '' }));
      loadAccounts();
    } catch (err: any) {
      error(err.message || 'Erro ao realizar transferência.');
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + (Number(a.current_balance) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Landmark className="w-6 h-6 text-sky-500" />
            <span>Contas Bancárias & Tesouraria</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gestão de contas correntes, contas digitais e transferências internas entre contas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400" />
            <span>Transferir Entre Contas</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Conta Bancária</span>
          </button>
        </div>
      </div>

      {/* Total Balance Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Patrimônio Financeiro Total Disponível
          </span>
          <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight mt-0.5">
            {formatCurrency(totalBalance)}
          </p>
        </div>
        <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl text-sky-600 dark:text-sky-400">
          <Wallet className="w-6 h-6" />
        </div>
      </div>

      {/* Grid of Bank Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-semibold uppercase text-[10px] text-sky-600 dark:text-sky-400">
                  {acc.type.replace('_', ' ')}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{acc.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{acc.bank}</p>
              <div className="mt-3 text-[11px] text-slate-400 space-y-0.5">
                <p>Agência: {acc.agency || '0001'}</p>
                <p>Conta: {acc.account_number || 'N/A'}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Saldo Atual</span>
              <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                {formatCurrency(acc.current_balance)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nova Conta */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nova Conta Bancária"
        subtitle="Cadastre uma instituição bancária para conciliação"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome de Identificação da Conta *
            </label>
            <input
              type="text"
              value={newAcc.name}
              onChange={(e) => setNewAcc({ ...newAcc, name: e.target.value })}
              placeholder="Ex: Itaú Empresas PJ ou Nubank Operacional"
              required
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome do Banco *
              </label>
              <input
                type="text"
                value={newAcc.bank}
                onChange={(e) => setNewAcc({ ...newAcc, bank: e.target.value })}
                placeholder="Ex: Banco Itaú S.A."
                required
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo da Conta
              </label>
              <select
                value={newAcc.type}
                onChange={(e) => setNewAcc({ ...newAcc, type: e.target.value as any })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              >
                <option value="conta_corrente">Conta Corrente</option>
                <option value="conta_digital">Conta Digital</option>
                <option value="conta_poupanca">Conta Poupança</option>
                <option value="carteira">Carteira Digital</option>
                <option value="caixa">Caixa Físico</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Agência
              </label>
              <input
                type="text"
                value={newAcc.agency}
                onChange={(e) => setNewAcc({ ...newAcc, agency: e.target.value })}
                placeholder="0001"
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Número da Conta
              </label>
              <input
                type="text"
                value={newAcc.account_number}
                onChange={(e) => setNewAcc({ ...newAcc, account_number: e.target.value })}
                placeholder="12345-6"
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Saldo Inicial (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={newAcc.initial_balance}
                onChange={(e) => setNewAcc({ ...newAcc, initial_balance: e.target.value })}
                placeholder="0,00"
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden font-bold"
              />
            </div>
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
              Criar Conta
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Transferência Entre Contas */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Transferência Entre Contas"
        subtitle="Movimentação interna com débito e crédito atômicos"
      >
        <form onSubmit={handleTransfer} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Conta de Origem (De onde sairá o valor) *
            </label>
            <select
              value={transferData.source_account_id}
              onChange={(e) => setTransferData({ ...transferData, source_account_id: e.target.value })}
              required
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden font-medium"
            >
              {accounts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (Saldo: {formatCurrency(b.current_balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Conta de Destino (Onde entrará o valor) *
            </label>
            <select
              value={transferData.destination_account_id}
              onChange={(e) => setTransferData({ ...transferData, destination_account_id: e.target.value })}
              required
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden font-medium"
            >
              {accounts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (Saldo: {formatCurrency(b.current_balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Valor da Transferência (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              value={transferData.amount}
              onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
              placeholder="0,00"
              required
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden font-black text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Motivo / Observações
            </label>
            <input
              type="text"
              value={transferData.notes}
              onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
              placeholder="Ex: Aporte para folha ou remanejamento de liquidez"
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowTransferModal(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-600 dark:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-bold"
            >
              Executar Transferência
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
