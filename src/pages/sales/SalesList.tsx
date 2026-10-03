import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Eye,
  FileText,
  User,
  Calendar,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { Sale } from '../../types/index.ts';
import { formatCurrency, formatDateTime, getPaymentMethodLabel, getStatusBadgeClass } from '../../utils/formatters.ts';
import { Modal } from '../../components/Modal.tsx';

interface SalesListProps {
  onNavigate: (path: string) => void;
}

export const SalesList: React.FC<SalesListProps> = ({ onNavigate }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const loadSales = async () => {
    try {
      setIsLoading(true);
      const list = await api.getSales();
      setSales(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const filteredSales = sales.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.code.toLowerCase().includes(term) ||
      s.customer_name.toLowerCase().includes(term) ||
      s.seller_name.toLowerCase().includes(term)
    );
  });

  const totalVolume = sales.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-sky-500" />
            <span>Histórico de Vendas Faturadas</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registro comercial de faturamento, pedidos e transações concluídas
          </p>
        </div>

        <button
          onClick={() => onNavigate('/vendas/nova')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Venda</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Faturamento Total</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
            {formatCurrency(totalVolume)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Vendas Registradas</span>
          <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums mt-1">
            {sales.length} transações
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Ticket Médio</span>
          <p className="text-xl font-black text-sky-600 dark:text-sky-400 tabular-nums mt-1">
            {sales.length > 0 ? formatCurrency(totalVolume / sales.length) : 'R$ 0,00'}
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código, cliente ou vendedor..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Vendedor</th>
                <th className="px-4 py-3">Forma Pagto</th>
                <th className="px-4 py-3 text-center">Qtd Itens</th>
                <th className="px-4 py-3 text-right">Total (R$)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Nenhuma venda registrada até o momento.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-sky-600 dark:text-sky-400">
                      {s.code}
                    </td>
                    <td className="px-4 py-3 text-slate-500 tabular-nums">
                      {formatDateTime(s.date || s.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {s.customer_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {s.seller_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {getPaymentMethodLabel(s.payment_method)}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-slate-600 dark:text-slate-400">
                      {s.items?.length || 0} produto(s)
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(s.total)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40">
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedSale(s)}
                        className="p-1.5 rounded-md bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-600 dark:bg-slate-800 dark:text-slate-300 transition-colors"
                        title="Ver Detalhes do Pedido"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalhes da Venda */}
      <Modal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        title={`Detalhes da Venda ${selectedSale?.code}`}
        subtitle={`Cliente: ${selectedSale?.customer_name} | Vendedor: ${selectedSale?.seller_name}`}
        maxWidth="2xl"
      >
        {selectedSale && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Data da Venda</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                  {formatDateTime(selectedSale.date || selectedSale.createdAt)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Forma de Pagto</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {getPaymentMethodLabel(selectedSale.payment_method)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Conta Destino</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedSale.destination_account_name || 'Conta Bancária'}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Status</span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  {selectedSale.status}
                </p>
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Produtos Faturados</h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">SKU</th>
                      <th className="px-3 py-2 text-center">Qtd</th>
                      <th className="px-3 py-2 text-right">Unitário</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedSale.items?.map((item, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">
                          {item.product_name}
                        </td>
                        <td className="px-3 py-2 text-slate-400">{item.sku || '-'}</td>
                        <td className="px-3 py-2 text-center tabular-nums">{item.quantity}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(item.unit_price)}</td>
                        <td className="px-3 py-2 text-right font-bold tabular-nums">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial summary */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl space-y-1 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold tabular-nums">{formatCurrency(selectedSale.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Desconto:</span>
                <span className="font-semibold text-rose-500 tabular-nums">
                  -{formatCurrency(selectedSale.discount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Frete:</span>
                <span className="font-semibold tabular-nums">+{formatCurrency(selectedSale.shipping)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-sm text-slate-900 dark:text-white">
                <span>Total Faturado:</span>
                <span className="text-sky-600 dark:text-sky-400 tabular-nums">
                  {formatCurrency(selectedSale.total)}
                </span>
              </div>
            </div>

            {selectedSale.notes && (
              <p className="text-slate-500 text-[11px]">
                <strong>Observações:</strong> {selectedSale.notes}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
