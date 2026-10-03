import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  Package,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { Product, InventoryMovement } from '../../types/index.ts';
import { formatCurrency, formatDateTime } from '../../utils/formatters.ts';
import { Modal } from '../../components/Modal.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const StockManagement: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Movement Modal
  const [showModal, setShowModal] = useState(false);
  const [movementForm, setMovementForm] = useState({
    product_id: '',
    quantity: 1,
    type: 'entrada' as 'entrada' | 'saida' | 'ajuste' | 'devolucao',
    reason: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [prods, movs] = await Promise.all([
        api.getProducts(),
        api.getInventoryMovements(),
      ]);
      setProducts(prods);
      setMovements(movs);
      if (prods.length > 0 && !movementForm.product_id) {
        setMovementForm((prev) => ({ ...prev, product_id: prods[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementForm.product_id || !movementForm.quantity || !movementForm.reason) {
      error('Preencha produto, quantidade e o motivo da movimentação.');
      return;
    }

    try {
      await api.createInventoryMovement({
        product_id: movementForm.product_id,
        quantity: Number(movementForm.quantity),
        type: movementForm.type,
        reason: movementForm.reason,
        notes: movementForm.notes,
      });
      success('Movimentação de estoque registrada com sucesso!');
      setShowModal(false);
      setMovementForm({
        product_id: products[0]?.id || '',
        quantity: 1,
        type: 'entrada',
        reason: '',
        notes: '',
      });
      loadData();
    } catch (err: any) {
      error(err.message || 'Erro ao registrar movimentação.');
    }
  };

  const lowStockProducts = products.filter((p) => p.status === 'ativo' && p.current_stock <= p.min_stock);
  const totalStockValue = products.reduce((s, p) => s + p.current_stock * p.sale_price, 0);
  const totalPhysicalUnits = products.reduce((s, p) => s + p.current_stock, 0);

  const filteredMovements = movements.filter((m) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      m.product_name.toLowerCase().includes(term) ||
      m.reason.toLowerCase().includes(term) ||
      m.user_name.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-sky-500" />
            <span>Controle Físico de Estoque & Auditoria</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Rastreabilidade completa de todas as entradas, saídas, vendas e ajustes com motivo obrigatório
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Movimentação</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Patrimônio Físico Total</span>
          <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums mt-1">
            {formatCurrency(totalStockValue)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Unidades em Almoxarifado</span>
          <p className="text-xl font-black text-sky-600 dark:text-sky-400 tabular-nums mt-1">
            {totalPhysicalUnits} itens
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Itens em Alerta Mínimo</span>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums mt-1">
            {lowStockProducts.length} produtos
          </p>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Alerta de Reposição Imediata: Estoque Mínimo Atingido</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900 flex items-center justify-between"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-400">SKU: {p.sku}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-black text-amber-600 dark:text-amber-400 tabular-nums">
                    {p.current_stock} un.
                  </span>
                  <span className="text-[10px] text-slate-400 block">(Mín: {p.min_stock})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Movements Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-xs text-slate-900 dark:text-white">
            Histórico de Movimentações de Estoque
          </h3>
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar histórico..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3 text-center">Quantidade</th>
                <th className="px-4 py-3">Motivo / Justificativa</th>
                <th className="px-4 py-3">Data e Hora</th>
                <th className="px-4 py-3">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Nenhuma movimentação registrada no histórico.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  let isPositive = m.type === 'entrada' || m.type === 'devolucao';

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            m.type === 'entrada'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : m.type === 'venda' || m.type === 'saida'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                              : 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400'
                          }`}
                        >
                          {m.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {m.product_name}
                      </td>
                      <td className="px-4 py-3 text-center font-black tabular-nums">
                        <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                          {isPositive ? '+' : '-'}
                          {m.quantity} un.
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        <p className="font-medium">{m.reason}</p>
                        {m.notes && <span className="text-[10px] text-slate-400">{m.notes}</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 tabular-nums">
                        {formatDateTime(m.date || m.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {m.user_name}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Movimentação */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Registrar Movimentação de Estoque"
        subtitle="Entrada de mercadorias, baixa ou ajuste com auditoria"
      >
        <form onSubmit={handleRecordMovement} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Produto *
            </label>
            <select
              value={movementForm.product_id}
              onChange={(e) => setMovementForm({ ...movementForm, product_id: e.target.value })}
              required
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden font-medium"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Saldo atual: {p.current_stock} un.)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo da Movimentação *
              </label>
              <select
                value={movementForm.type}
                onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value as any })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              >
                <option value="entrada">Entrada (Compra / Recebimento)</option>
                <option value="saida">Saída (Consumo / Perda)</option>
                <option value="ajuste">Ajuste de Balanço (Contagem Fís.)</option>
                <option value="devolucao">Devolução de Cliente</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quantidade *
              </label>
              <input
                type="number"
                min="1"
                value={movementForm.quantity}
                onChange={(e) => setMovementForm({ ...movementForm, quantity: parseInt(e.target.value, 10) || 1 })}
                required
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Motivo / Justificativa *
            </label>
            <input
              type="text"
              value={movementForm.reason}
              onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
              placeholder="Ex: Recebimento de importação lote 492 ou Inventário físico"
              required
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações Adicionais
            </label>
            <textarea
              rows={2}
              value={movementForm.notes}
              onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
              placeholder="Detalhes complementares..."
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
              Confirmar Movimentação
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
