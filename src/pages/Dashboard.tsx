import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingCart,
  Package,
  AlertTriangle,
  Clock,
  PlusCircle,
  ArrowRight,
  ShieldAlert,
  BarChart2,
  PieChart as PieIcon,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { DashboardMetrics } from '../types/index.ts';
import { formatCurrency } from '../utils/formatters.ts';

interface DashboardProps {
  onNavigate: (path: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('este_mes');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [m, a, c] = await Promise.all([
        api.getMetrics(),
        api.getAlerts(),
        api.getCharts(selectedPeriod),
      ]);
      setMetrics(m);
      setAlerts(a);
      setChartData(c);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  if (isLoading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Olá, {user?.name || 'Sócio'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visão geral da NEXORA GROUP — Painel Executivo & Controladoria
          </p>
        </div>

        {/* Period Selector & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 text-xs shadow-2xs">
            {[
              { id: 'hoje', label: 'Hoje' },
              { id: '7d', label: '7 dias' },
              { id: '30d', label: '30 dias' },
              { id: 'este_mes', label: 'Este mês' },
              { id: 'este_ano', label: 'Este ano' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  selectedPeriod === p.id
                    ? 'bg-sky-500 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => onNavigate('/vendas/nova')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Nova Venda</span>
          </button>
        </div>
      </div>

      {/* Real-time Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Avisos Importantes do Sistema ({alerts.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/60 shadow-2xs flex items-start gap-2 text-xs"
              >
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {alert.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {alert.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8 Primary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Atual */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Saldo em Bancos</span>
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
              {formatCurrency(metrics?.currentBalance)}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{metrics?.comparisons?.balanceChangePercent}% vs. mês anterior</span>
            </div>
          </div>
        </div>

        {/* Card 2: Receitas do mês */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Receitas do Mês</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl lg:text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
              {formatCurrency(metrics?.monthRevenue)}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{metrics?.comparisons?.revenueChangePercent}% vs. mês anterior</span>
            </div>
          </div>
        </div>

        {/* Card 3: Despesas do mês */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Despesas do Mês</span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl lg:text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums tracking-tight">
              {formatCurrency(metrics?.monthExpenses)}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>{metrics?.comparisons?.expensesChangePercent}% controlado</span>
            </div>
          </div>
        </div>

        {/* Card 4: Lucro do mês */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Lucro Líquido Realizado</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span
              className={`text-xl lg:text-2xl font-black tabular-nums tracking-tight ${
                (metrics?.monthProfit || 0) >= 0
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-rose-600'
              }`}
            >
              {formatCurrency(metrics?.monthProfit)}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              <span>Margem operacional:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {metrics?.profitMarginPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 5: Contas a receber */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Contas a Receber</span>
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
              {formatCurrency(metrics?.pendingReceivable)}
            </span>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-slate-500">Atrasados:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {metrics?.overdueReceivableCount} título(s)
              </span>
            </div>
          </div>
        </div>

        {/* Card 6: Contas a pagar */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Contas a Pagar</span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
              {formatCurrency(metrics?.pendingPayable)}
            </span>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-slate-500">Vencidos:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {metrics?.overduePayableCount} conta(s)
              </span>
            </div>
          </div>
        </div>

        {/* Card 7: Vendas do mês */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Vendas Concluídas</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
              {formatCurrency(metrics?.monthSalesTotal)}
            </span>
            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
              <span>Volume faturado:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {metrics?.monthSalesCount} vendas
              </span>
            </div>
          </div>
        </div>

        {/* Card 8: Valor em estoque */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Patrimônio em Estoque</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
              {formatCurrency(metrics?.inventoryTotalValue)}
            </span>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-slate-500">Estoque baixo:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {metrics?.lowStockItemsCount} produto(s)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Receitas x Despesas mensal */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-sky-500" />
                <span>Fluxo Financeiro: Receitas x Despesas</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Evolução mensal consolidada das entradas e saídas
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-300">Receitas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-rose-500" />
                <span className="text-slate-600 dark:text-slate-300">Despesas</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Representation with SVG bars */}
          <div className="h-64 flex items-end justify-between gap-2 pt-4 px-2 border-b border-slate-100 dark:border-slate-800">
            {chartData?.monthlyBreakdown?.map((m: any, idx: number) => {
              const maxVal = Math.max(
                ...chartData.monthlyBreakdown.map((x: any) => Math.max(x.receita, x.despesa, 10000))
              );
              const recHeight = (m.receita / maxVal) * 100;
              const despHeight = (m.despesa / maxVal) * 100;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1 h-48 relative">
                    {/* Tooltip */}
                    <div className="absolute -top-12 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                      <p className="font-bold">{m.month}</p>
                      <p className="text-emerald-400">Rec: {formatCurrency(m.receita)}</p>
                      <p className="text-rose-400">Desp: {formatCurrency(m.despesa)}</p>
                    </div>

                    {/* Bar Receita */}
                    <div
                      style={{ height: `${Math.max(recHeight, 4)}%` }}
                      className="w-1/2 max-w-5 bg-emerald-500 hover:bg-emerald-400 rounded-t-xs transition-all"
                    />
                    {/* Bar Despesa */}
                    <div
                      style={{ height: `${Math.max(despHeight, 4)}%` }}
                      className="w-1/2 max-w-5 bg-rose-500 hover:bg-rose-400 rounded-t-xs transition-all"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Despesas por Categoria */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-sky-500" />
              <span>Despesas por Categoria</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Distribuição de custos operacionais
            </p>
          </div>

          <div className="flex-1 space-y-3">
            {chartData?.categoryBreakdown?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Nenhuma despesa registrada.
              </div>
            ) : (
              chartData?.categoryBreakdown?.map((cat: any, idx: number) => {
                const totalExpenses = chartData.categoryBreakdown.reduce(
                  (s: number, c: any) => s + c.value,
                  0
                );
                const percent = totalExpenses > 0 ? Math.round((cat.value / totalExpenses) * 100) : 0;

                const colors = ['bg-sky-500', 'bg-indigo-500', 'bg-rose-500', 'bg-amber-500', 'bg-purple-500'];
                const barColor = colors[idx % colors.length];

                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                        {cat.name}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(cat.value)} ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className={`h-full ${barColor} rounded-full transition-all`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Vendas por Sócio Breakdown */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-500" />
              <span>Desempenho Comercial por Sócio</span>
            </h4>
            <div className="space-y-2">
              {Object.entries(chartData?.salesByRep || {}).map(([rep, stat]: [string, any]) => (
                <div
                  key={rep}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{rep}</span>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(stat.total)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{stat.count} venda(s)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Corporate Actions */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-sky-400 uppercase">
              Ações Rápidas de Gestão
            </span>
            <h3 className="text-base font-bold text-white mt-1">
              Operações diárias da NEXORA GROUP
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Acesse rapidamente as principais rotinas financeiras e de suprimentos.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('/vendas/nova')}
              className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Registrar Venda</span>
            </button>
            <button
              onClick={() => onNavigate('/financeiro/pagar')}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 flex items-center gap-1.5"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
              <span>Lançar Despesa</span>
            </button>
            <button
              onClick={() => onNavigate('/financeiro/contas')}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 flex items-center gap-1.5"
            >
              <Wallet className="w-3.5 h-3.5 text-sky-400" />
              <span>Transferência Bancária</span>
            </button>
            <button
              onClick={() => onNavigate('/produtos/estoque')}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 flex items-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span>Ajustar Estoque</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
