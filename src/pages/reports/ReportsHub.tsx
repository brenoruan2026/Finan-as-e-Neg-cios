import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  DollarSign,
  ShoppingCart,
  Boxes,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';

export const ReportsHub: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState<'financial' | 'sales' | 'inventory'>('financial');

  // Filters
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Data states
  const [financialData, setFinancialData] = useState<any>(null);
  const [salesData, setSalesData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadReport = async () => {
    try {
      setIsLoading(true);
      if (activeTab === 'financial') {
        const data = await api.getFinancialReport(startDate, endDate);
        setFinancialData(data);
      } else if (activeTab === 'sales') {
        const data = await api.getSalesReport(startDate, endDate);
        setSalesData(data);
      } else if (activeTab === 'inventory') {
        const data = await api.getInventoryReport();
        setInventoryData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeTab, startDate, endDate]);

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeTab === 'financial' && financialData) {
      csvContent += 'NEXORA GROUP - RELATORIO FINANCEIRO\r\n';
      csvContent += `Periodo: ${formatDate(startDate)} ate ${formatDate(endDate)}\r\n`;
      csvContent += `Gerado por: ${user?.name} em ${formatDateTime(new Date().toISOString())}\r\n\r\n`;
      csvContent += 'Data;Tipo;Descricao;Categoria;Conta;Valor (R$)\r\n';
      financialData.transactions?.forEach((t: any) => {
        csvContent += `${formatDate(t.date)};${t.type};"${t.description}";"${t.category_name || ''}";"${t.account_name}";${t.amount}\r\n`;
      });
    } else if (activeTab === 'sales' && salesData) {
      csvContent += 'NEXORA GROUP - RELATORIO DE VENDAS\r\n';
      csvContent += `Periodo: ${formatDate(startDate)} ate ${formatDate(endDate)}\r\n`;
      csvContent += `Gerado por: ${user?.name} em ${formatDateTime(new Date().toISOString())}\r\n\r\n`;
      csvContent += 'Codigo;Data;Cliente;Vendedor;Forma Pagamento;Total (R$)\r\n';
      salesData.sales?.forEach((s: any) => {
        csvContent += `${s.code};${formatDate(s.date)};"${s.customer_name}";"${s.seller_name}";${s.payment_method};${s.total}\r\n`;
      });
    } else if (activeTab === 'inventory' && inventoryData) {
      csvContent += 'NEXORA GROUP - RELATORIO DE ESTOQUE\r\n';
      csvContent += `Gerado por: ${user?.name} em ${formatDateTime(new Date().toISOString())}\r\n\r\n`;
      csvContent += 'Produto;SKU;Categoria;Custo (R$);Venda (R$);Estoque Atual;Estoque Minimo;Valor Total Estoque (R$)\r\n';
      inventoryData.allProducts?.forEach((p: any) => {
        csvContent += `"${p.name}";${p.sku};"${p.category}";${p.cost};${p.sale_price};${p.current_stock};${p.min_stock};${p.current_stock * p.sale_price}\r\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexora_relatorio_${activeTab}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Relatório exportado em CSV com sucesso!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-sky-500" />
            <span>Central de Relatórios & Controladoria</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Demonstrativos gerenciais, relatórios comerciais e auditoria de estoque da NEXORA GROUP
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar CSV / Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-sky-500" />
            <span>Imprimir / Gerar PDF</span>
          </button>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('financial')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'financial'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Relatório Financeiro & DRE
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'sales'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Vendas & Desempenho
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'inventory'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Posição de Estoque
            </button>
          </div>

          {/* Date range picker */}
          {activeTab !== 'inventory' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Período:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 outline-hidden"
              />
              <span className="text-slate-400">até</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 outline-hidden"
              />
            </div>
          )}
        </div>
      </div>

      {/* Formal Printable Document Header */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
        {/* Company Header for Print / Display */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/src/assets/images/logo_nexora_emblem_1791062638084.jpg"
              alt="Nexora Group"
              className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-200"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">NEXORA GROUP</h2>
              <p className="text-[11px] text-slate-500">
                CNPJ: 58.912.340/0001-44 | São Paulo - SP
              </p>
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
            <p>
              Emissão:{' '}
              <strong className="text-slate-900 dark:text-white">{formatDateTime(new Date().toISOString())}</strong>
            </p>
            <p>
              Responsável Gerador:{' '}
              <strong className="text-slate-900 dark:text-white">{user?.name}</strong> ({user?.position})
            </p>
            {activeTab !== 'inventory' && (
              <p>
                Período Selecionado: {formatDate(startDate)} a {formatDate(endDate)}
              </p>
            )}
          </div>
        </div>

        {/* Tab 1: Financial Report */}
        {activeTab === 'financial' && financialData && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase">
                  Receita Bruta
                </span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                  {formatCurrency(financialData.totalEntradas)}
                </p>
              </div>
              <div className="p-4 bg-rose-50/60 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/40">
                <span className="text-[10px] font-bold text-rose-800 dark:text-rose-400 uppercase">
                  Despesas Operacionais
                </span>
                <p className="text-xl font-black text-rose-600 dark:text-rose-400 tabular-nums mt-1">
                  {formatCurrency(financialData.totalSaidas)}
                </p>
              </div>
              <div className="p-4 bg-sky-50/60 dark:bg-sky-950/20 rounded-xl border border-sky-100 dark:border-sky-900/40">
                <span className="text-[10px] font-bold text-sky-800 dark:text-sky-400 uppercase">
                  Lucro Líquido
                </span>
                <p className="text-xl font-black text-sky-600 dark:text-sky-400 tabular-nums mt-1">
                  {formatCurrency(financialData.lucroLiquido)}
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Margem Líquida
                </span>
                <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums mt-1">
                  {financialData.margemOperacional}%
                </p>
              </div>
            </div>

            {/* Transactions detail */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Detalhamento dos Lançamentos no Período
              </h4>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-3 py-2">Data</th>
                      <th className="px-3 py-2">Tipo</th>
                      <th className="px-3 py-2">Descrição</th>
                      <th className="px-3 py-2">Categoria</th>
                      <th className="px-3 py-2">Conta</th>
                      <th className="px-3 py-2 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {financialData.transactions?.map((t: any) => (
                      <tr key={t.id}>
                        <td className="px-3 py-2 text-slate-500 tabular-nums">{formatDate(t.date)}</td>
                        <td className="px-3 py-2 font-semibold capitalize">
                          <span
                            className={
                              t.type === 'entrada'
                                ? 'text-emerald-600'
                                : t.type === 'saida'
                                ? 'text-rose-600'
                                : 'text-sky-600'
                            }
                          >
                            {t.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">
                          {t.description}
                        </td>
                        <td className="px-3 py-2 text-slate-500">{t.category_name || '-'}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{t.account_name}</td>
                        <td className="px-3 py-2 text-right font-black tabular-nums">
                          {formatCurrency(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Sales Report */}
        {activeTab === 'sales' && salesData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase">
                  Volume Faturado
                </span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                  {formatCurrency(salesData.totalVendas)}
                </p>
              </div>
              <div className="p-4 bg-sky-50 dark:bg-sky-950/20 rounded-xl border border-sky-100 dark:border-sky-900/40">
                <span className="text-[10px] font-bold text-sky-800 dark:text-sky-400 uppercase">
                  Total de Pedidos
                </span>
                <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums mt-1">
                  {salesData.totalPedidos} vendas
                </p>
              </div>
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-400 uppercase">
                  Ticket Médio
                </span>
                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums mt-1">
                  {formatCurrency(salesData.ticketMedio)}
                </p>
              </div>
            </div>

            {/* Top Products */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Produtos Mais Vendidos no Período
              </h4>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-3 py-2">Produto</th>
                      <th className="px-3 py-2 text-center">Unidades Faturadas</th>
                      <th className="px-3 py-2 text-right">Volume Total (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {salesData.topProducts?.map((tp: any, i: number) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200">
                          {tp.name}
                        </td>
                        <td className="px-3 py-2 text-center font-bold tabular-nums">
                          {tp.quantity} un.
                        </td>
                        <td className="px-3 py-2 text-right font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(tp.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Inventory Position */}
        {activeTab === 'inventory' && inventoryData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-sky-50 dark:bg-sky-950/20 rounded-xl border border-sky-100 dark:border-sky-900/40">
                <span className="text-[10px] font-bold text-sky-800 dark:text-sky-400 uppercase">
                  Valor Total do Estoque
                </span>
                <p className="text-xl font-black text-sky-600 dark:text-sky-400 tabular-nums mt-1">
                  {formatCurrency(inventoryData.totalValue)}
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Unidades Totais em Estoque
                </span>
                <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums mt-1">
                  {inventoryData.totalItems} unidades
                </p>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/40">
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase">
                  Itens com Estoque Baixo
                </span>
                <p className="text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums mt-1">
                  {inventoryData.lowStock?.length || 0} produtos
                </p>
              </div>
            </div>

            {/* Catalog inventory table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Posição Consolidada por SKU
              </h4>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-3 py-2">Produto</th>
                      <th className="px-3 py-2">SKU</th>
                      <th className="px-3 py-2 text-center">Saldo Físico</th>
                      <th className="px-3 py-2 text-center">Mínimo</th>
                      <th className="px-3 py-2 text-right">Preço Venda</th>
                      <th className="px-3 py-2 text-right">Valor Total em Estoque</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {inventoryData.allProducts?.map((p: any) => (
                      <tr key={p.id}>
                        <td className="px-3 py-2 font-bold text-slate-900 dark:text-white">{p.name}</td>
                        <td className="px-3 py-2 font-mono text-slate-400">{p.sku}</td>
                        <td className="px-3 py-2 text-center font-bold tabular-nums">
                          <span
                            className={
                              p.current_stock <= p.min_stock
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-800 dark:text-slate-200'
                            }
                          >
                            {p.current_stock} un.
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center text-slate-400 tabular-nums">
                          {p.min_stock} un.
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(p.sale_price)}</td>
                        <td className="px-3 py-2 text-right font-black tabular-nums text-slate-900 dark:text-white">
                          {formatCurrency(p.current_stock * p.sale_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
