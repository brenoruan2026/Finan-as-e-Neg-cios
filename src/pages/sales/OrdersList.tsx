import React, { useState, useEffect } from 'react';
import { ClipboardList, Search, Check, Clock, Truck, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../../services/api.ts';
import { Order, OrderStatus } from '../../types/index.ts';
import { formatCurrency, formatDateTime, getStatusBadgeClass } from '../../utils/formatters.ts';
import { useToast } from '../../context/ToastContext.tsx';

export const OrdersList: React.FC = () => {
  const { success, error } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const list = await api.getOrders();
      setOrders(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      success(`Status do pedido atualizado para "${newStatus}".`);
      loadOrders();
    } catch (err: any) {
      error(err.message || 'Erro ao alterar status.');
    }
  };

  const filtered = orders.filter((o) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(term) ||
      o.customer_name.toLowerCase().includes(term) ||
      o.responsible_name.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-sky-500" />
          <span>Gestão de Pedidos & Expedição</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Controle de status operacional: Preparação, envio, rastreio e entrega final
        </p>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por pedido, cliente ou responsável..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Nº Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Itens</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3 text-right">Valor Total</th>
                <th className="px-4 py-3 text-center">Status Operacional</th>
                <th className="px-4 py-3 text-right">Mudar Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Nenhum pedido cadastrado no momento.
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-bold text-sky-600 dark:text-sky-400">
                      {o.order_number}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {o.customer_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {o.items?.map((i) => `${i.quantity}x ${i.product_name}`).join(', ') || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 tabular-nums">
                      {formatDateTime(o.date || o.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {o.responsible_name}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(o.total)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getStatusBadgeClass(
                          o.status
                        )}`}
                      >
                        {o.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <select
                        value={o.status}
                        onChange={(e) => handleUpdateStatus(o.id, e.target.value as OrderStatus)}
                        className="p-1 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md outline-hidden text-slate-700 dark:text-slate-200"
                      >
                        <option value="rascunho">Rascunho</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="em_preparacao">Em preparação</option>
                        <option value="enviado">Enviado</option>
                        <option value="entregue">Entregue</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
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
