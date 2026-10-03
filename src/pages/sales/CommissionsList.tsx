import React, { useState, useEffect } from 'react';
import { Percent, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { api } from '../../services/api.ts';
import { Commission } from '../../types/index.ts';
import { formatCurrency, formatDateTime } from '../../utils/formatters.ts';
import { useToast } from '../../context/ToastContext.tsx';

export const CommissionsList: React.FC = () => {
  const { success, error } = useToast();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCommissions = async () => {
    try {
      setIsLoading(true);
      const list = await api.getCommissions();
      setCommissions(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCommissions();
  }, []);

  const handlePay = async (id: string) => {
    try {
      await api.payCommission(id);
      success('Comissão liquidada com sucesso!');
      loadCommissions();
    } catch (err: any) {
      error(err.message || 'Erro ao pagar comissão.');
    }
  };

  const pendingTotal = commissions
    .filter((c) => c.status === 'pendente')
    .reduce((s, c) => s + c.commission_amount, 0);

  const paidTotal = commissions
    .filter((c) => c.status === 'pago')
    .reduce((s, c) => s + c.commission_amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Percent className="w-6 h-6 text-sky-500" />
          <span>Gestão de Comissões de Vendas</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Apuração de comissionamento individual dos sócios e colaboradores por venda realizada
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Comissões a Pagar</span>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums mt-1">
            {formatCurrency(pendingTotal)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Comissões Já Liquidadas</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
            {formatCurrency(paidTotal)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Venda de Origem</th>
                <th className="px-4 py-3">Vendedor / Sócio</th>
                <th className="px-4 py-3 text-center">Percentual (%)</th>
                <th className="px-4 py-3 text-right">Valor da Comissão</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Data Liquidação</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {commissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Nenhuma comissão apurada ainda.
                  </td>
                </tr>
              ) : (
                commissions.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-bold text-sky-600 dark:text-sky-400">
                      {c.sale_code}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {c.seller_name}
                    </td>
                    <td className="px-4 py-3 text-center font-bold tabular-nums text-slate-700 dark:text-slate-300">
                      {c.percentage}%
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(c.commission_amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          c.status === 'pago'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500 tabular-nums">
                      {c.payment_date ? formatDateTime(c.payment_date) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.status === 'pendente' && (
                        <button
                          onClick={() => handlePay(c.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Liquidar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
