import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Landmark,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { BankAccount, AccountReceivable, AccountPayable } from '../../types/index.ts';
import { formatCurrency, formatDate } from '../../utils/formatters.ts';

interface FinancialOverviewProps {
  onNavigate: (path: string) => void;
}

export const FinancialOverview: React.FC<FinancialOverviewProps> = ({ onNavigate }) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [receivables, setReceivables] = useState<AccountReceivable[]>([]);
  const [payables, setPayables] = useState<AccountPayable[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [accs, recs, pays] = await Promise.all([
        api.getBankAccounts(),
        api.getReceivables(),
        api.getPayables(),
      ]);
      setBankAccounts(accs);
      setReceivables(recs);
      setPayables(pays);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalBalance = bankAccounts
    .filter((a) => a.status === 'ativa')
    .reduce((sum, a) => sum + (Number(a.current_balance) || 0), 0);

  const now = new Date();
  const next7Days = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
  const next30Days = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
  const next90Days = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split('T')[0];

  // Forecast 7 days
  const rec7d = receivables
    .filter((r) => r.status === 'pendente' && r.due_date <= next7Days)
    .reduce((sum, r) => sum + r.amount, 0);
  const pay7d = payables
    .filter((p) => p.status === 'pendente' && p.due_date <= next7Days)
    .reduce((sum, p) => sum + p.amount, 0);
  const projected7d = totalBalance + rec7d - pay7d;

  // Forecast 30 days
  const rec30d = receivables
    .filter((r) => r.status === 'pendente' && r.due_date <= next30Days)
    .reduce((sum, r) => sum + r.amount, 0);
  const pay30d = payables
    .filter((p) => p.status === 'pendente' && p.due_date <= next30Days)
    .reduce((sum, p) => sum + p.amount, 0);
  const projected30d = totalBalance + rec30d - pay30d;

  // Forecast 90 days
  const rec90d = receivables
    .filter((r) => r.status === 'pendente' && r.due_date <= next90Days)
    .reduce((sum, r) => sum + r.amount, 0);
  const pay90d = payables
    .filter((p) => p.status === 'pendente' && p.due_date <= next90Days)
    .reduce((sum, p) => sum + p.amount, 0);
  const projected90d = totalBalance + rec90d - pay90d;

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center text-xs text-slate-400">Carregando controladoria financeira...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Saúde Financeira & Controladoria
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Posição de liquidez consolidada e previsão de fluxo de caixa futuro da NEXORA GROUP
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/financeiro/receber')}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Contas a Receber
          </button>
          <button
            onClick={() => onNavigate('/financeiro/pagar')}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Contas a Pagar
          </button>
        </div>
      </div>

      {/* Primary Liquidity Card */}
      <div className="bg-gradient-to-br from-[#0B192C] to-[#1E3E62] text-white p-6 rounded-2xl shadow-xl border border-sky-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">
              Disponibilidade Imediata em Caixa & Bancos
            </span>
            <h2 className="text-3xl lg:text-4xl font-black text-white mt-1 tabular-nums tracking-tight">
              {formatCurrency(totalBalance)}
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Saldo consolidado em {bankAccounts.length} contas operacionais ativas.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                A Receber (Total)
              </span>
              <span className="text-lg font-bold text-emerald-400 tabular-nums">
                {formatCurrency(receivables.filter((r) => r.status === 'pendente').reduce((s, r) => s + r.amount, 0))}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                A Pagar (Total)
              </span>
              <span className="text-lg font-bold text-rose-400 tabular-nums">
                {formatCurrency(payables.filter((p) => p.status === 'pendente').reduce((s, p) => s + p.amount, 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PREVISÃO FINANCEIRA (7d, 30d, 90d) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-500" />
            <span>Previsão Financeira & Projeção de Saldo</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Valores futuros projetados com base em títulos a receber e obrigações a pagar registradas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 7 Dias */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white mb-3">
              <span>Próximos 7 Dias</span>
              <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 text-[10px]">
                Curto Prazo
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Recebimentos:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  +{formatCurrency(rec7d)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Pagamentos:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                  -{formatCurrency(pay7d)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-800 dark:text-slate-200">Saldo Projetado:</span>
                <span className="text-base font-black text-slate-900 dark:text-white tabular-nums">
                  {formatCurrency(projected7d)}
                </span>
              </div>
            </div>
          </div>

          {/* 30 Dias */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white mb-3">
              <span>Próximos 30 Dias</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 text-[10px]">
                Médio Prazo
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Recebimentos:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  +{formatCurrency(rec30d)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Pagamentos:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                  -{formatCurrency(pay30d)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-800 dark:text-slate-200">Saldo Projetado:</span>
                <span className="text-base font-black text-slate-900 dark:text-white tabular-nums">
                  {formatCurrency(projected30d)}
                </span>
              </div>
            </div>
          </div>

          {/* 90 Dias */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white mb-3">
              <span>Próximos 90 Dias</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 text-[10px]">
                Trimestre
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Recebimentos:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  +{formatCurrency(rec90d)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Pagamentos:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                  -{formatCurrency(pay90d)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-800 dark:text-slate-200">Saldo Projetado:</span>
                <span className="text-base font-black text-slate-900 dark:text-white tabular-nums">
                  {formatCurrency(projected90d)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Accounts Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Landmark className="w-4 h-4 text-sky-500" />
              <span>Contas Bancárias & Custódia</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Posição líquida em cada instituição financeira
            </p>
          </div>
          <button
            onClick={() => onNavigate('/financeiro/contas')}
            className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            <span>Gerenciar contas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {bankAccounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-sky-500/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                  {acc.bank}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{acc.name}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Ag: {acc.agency || '0001'} | Cc: {acc.account_number || 'N/A'}
              </p>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Saldo Atual</span>
                <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {formatCurrency(acc.current_balance)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
