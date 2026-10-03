import React, { useState, useEffect } from 'react';
import {
  Coins,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  Lock,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { CashRegister as CashRegisterType } from '../../types/index.ts';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters.ts';
import { Modal } from '../../components/Modal.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const CashRegister: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [registers, setRegisters] = useState<CashRegisterType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Close cash modal
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedReg, setSelectedReg] = useState<CashRegisterType | null>(null);
  const [countedBalance, setCountedBalance] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const list = await api.getCashRegisters();
      setRegisters(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCloseCash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReg || !countedBalance) {
      error('Informe o valor físico apurado.');
      return;
    }

    try {
      await api.closeCashRegister(selectedReg.id, Number(countedBalance), notes);
      success('Fechamento de caixa concluído com sucesso!');
      setShowCloseModal(false);
      setSelectedReg(null);
      setCountedBalance('');
      setNotes('');
      loadData();
    } catch (err: any) {
      error(err.message || 'Erro ao fechar caixa.');
    }
  };

  const openRegister = registers.find((r) => r.status === 'aberto');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Coins className="w-6 h-6 text-sky-500" />
            <span>Controle de Caixa Físico Operacional</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Acompanhamento diário de numerário, saldo inicial, entradas, saídas e fechamento auditado
          </p>
        </div>

        {openRegister && (
          <button
            onClick={() => {
              setSelectedReg(openRegister);
              setShowCloseModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Realizar Fechamento de Caixa</span>
          </button>
        )}
      </div>

      {/* Active Cash Card */}
      {openRegister ? (
        <div className="bg-gradient-to-r from-slate-900 to-[#0B192C] text-white p-6 rounded-2xl border border-sky-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Caixa Aberto Hoje ({formatDate(openRegister.date)})
              </span>
            </div>
            <span className="text-xs text-slate-400">
              Operador: <strong className="text-white">{openRegister.responsible_name}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Saldo Inicial</span>
              <p className="text-lg font-black text-white tabular-nums">
                {formatCurrency(openRegister.initial_balance)}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Entradas</span>
              <p className="text-lg font-black text-emerald-400 tabular-nums">
                +{formatCurrency(openRegister.entries)}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Saídas</span>
              <p className="text-lg font-black text-rose-400 tabular-nums">
                -{formatCurrency(openRegister.exits)}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Saldo Atual em Espécie</span>
              <p className="text-lg font-black text-sky-400 tabular-nums">
                {formatCurrency(openRegister.initial_balance + openRegister.entries - openRegister.exits)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-xl text-center text-xs text-slate-500">
          Nenhum caixa em aberto no momento. Todos os caixas foram devidamente fechados.
        </div>
      )}

      {/* History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs text-slate-900 dark:text-white">
          Histórico de Fechamentos de Caixa
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3 text-right">Saldo Inicial</th>
                <th className="px-4 py-3 text-right">Entradas</th>
                <th className="px-4 py-3 text-right">Saídas</th>
                <th className="px-4 py-3 text-right">Saldo Final</th>
                <th className="px-4 py-3 text-right">Diferença (Quebra/Sobra)</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {registers.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                    {formatDate(r.date)}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {r.responsible_name}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-400">
                    {formatCurrency(r.initial_balance)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(r.entries)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-rose-600 dark:text-rose-400">
                    {formatCurrency(r.exits)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900 dark:text-white">
                    {formatCurrency(r.final_balance)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums font-bold ${
                      r.difference === 0
                        ? 'text-emerald-600'
                        : r.difference > 0
                        ? 'text-sky-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {r.status === 'fechado' ? formatCurrency(r.difference) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        r.status === 'fechado'
                          ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Fechamento de Caixa */}
      <Modal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Fechamento de Caixa Diário"
        subtitle={`Apuração física do numerário por ${user?.name}`}
      >
        <form onSubmit={handleCloseCash} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-1.5">
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Saldo Inicial do Dia:</span>
              <span className="font-bold tabular-nums">
                {formatCurrency(selectedReg?.initial_balance)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Entradas (+) / Saídas (-):</span>
              <span className="font-bold tabular-nums">
                +{formatCurrency(selectedReg?.entries)} / -{formatCurrency(selectedReg?.exits)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-slate-900 dark:text-white">
              <span>Saldo Calculado pelo Sistema:</span>
              <span className="tabular-nums">
                {formatCurrency(
                  (selectedReg?.initial_balance || 0) +
                    (selectedReg?.entries || 0) -
                    (selectedReg?.exits || 0)
                )}
              </span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Valor Físico Contado em Espécie (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              value={countedBalance}
              onChange={(e) => setCountedBalance(e.target.value)}
              placeholder="Digite o valor apurado no cofre/caixa..."
              required
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden font-black text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações / Justificativas
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações do fechamento de caixa..."
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCloseModal(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-600 dark:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold"
            >
              Confirmar Fechamento
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
